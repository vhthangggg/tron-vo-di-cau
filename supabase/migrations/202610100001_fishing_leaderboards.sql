begin;

create table if not exists public.online_fishing_days (
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null,
 catches bigint not null default 0 check(catches>=0),
 released bigint not null default 0 check(released>=0),
 best_grams integer not null default 0 check(best_grams between 0 and 50000),
 best_fish_id text,
 updated_at timestamptz not null default now(),
 primary key(user_id,day)
);
create index if not exists online_fishing_days_period on public.online_fishing_days(day,user_id);
alter table public.online_fishing_days enable row level security;
revoke all on public.online_fishing_days from public,anon,authenticated;
grant all on public.online_fishing_days to service_role;

-- Called only after an accepted cloud save, in the same transaction as its receipt.
-- Repeating a save or syncing unchanged daily counters never adds the score twice.
create or replace function public.online_sync_fishing_days() returns trigger
language plpgsql set search_path=public,pg_temp as $$
declare r jsonb; d date; n bigint; released_count bigint; grams integer; fish text;
begin
 perform online_profile(new.user_id);
 if jsonb_typeof(new.save#>'{systems,fishingStats}')<>'array' then return new; end if;
 for r in select * from jsonb_array_elements(new.save#>'{systems,fishingStats}') loop
   d:=(r->>'day')::date;n:=(r->>'catches')::bigint;released_count:=(r->>'released')::bigint;
   grams:=coalesce((r#>>'{best,weightGrams}')::integer,0);fish:=r#>>'{best,fishId}';
   if d>(now() at time zone 'Asia/Ho_Chi_Minh')::date or d<'2020-01-01' or n<0 or released_count<0 or n>coalesce((new.save->>'catches')::bigint,0) or released_count>coalesce((new.save->>'released')::bigint,0) or grams<0 or grams>50000 then raise exception 'INVALID_FISHING_STATS'; end if;
   insert into online_fishing_days(user_id,day,catches,released,best_grams,best_fish_id)
   values(new.user_id,d,n,released_count,grams,fish)
   on conflict(user_id,day) do update set
     catches=greatest(online_fishing_days.catches,excluded.catches),
     released=greatest(online_fishing_days.released,excluded.released),
     best_fish_id=case when excluded.best_grams>online_fishing_days.best_grams then excluded.best_fish_id else online_fishing_days.best_fish_id end,
     best_grams=greatest(online_fishing_days.best_grams,excluded.best_grams),updated_at=now();
 end loop;
 return new;
end; $$;
drop trigger if exists online_save_fishing_days on public.online_saves;
create trigger online_save_fishing_days after insert or update on public.online_saves
for each row execute function public.online_sync_fishing_days();

create or replace function public.online_fishing_leaderboard(p_period text,p_day date,p_user uuid default null) returns jsonb
language plpgsql stable set search_path=public,pg_temp as $$
declare starts date; ends date; boards jsonb;
begin
 if p_period not in ('day','week','all') or p_day is null then raise exception 'INVALID_BOARD'; end if;
 if p_period='day' then starts:=p_day;ends:=p_day+1;
 elsif p_period='week' then starts:=p_day-(extract(isodow from p_day)::integer-1);ends:=starts+7; end if;
 with days as (
   select * from online_fishing_days where (starts is null or day>=starts) and (ends is null or day<ends)
 ), totals as (
   select user_id,sum(catches)::bigint catches,sum(released)::bigint released from days group by user_id
 ), biggest as (
   select distinct on(user_id) user_id,best_grams,best_fish_id from days where best_grams>0 order by user_id,best_grams desc,day,best_fish_id
 ), metrics as (
   select user_id,'catches' kind,catches score,null::text fish_id from totals where catches>0
   union all select user_id,'released',released,null::text from totals where released>0
   union all select user_id,'biggest',best_grams::bigint,best_fish_id from biggest
 ), ranked as (
   select m.*,p.display_name as name,row_number() over(partition by kind order by score desc,m.user_id) as rank
   from metrics m join online_profiles p using(user_id)
 ), kinds as (select unnest(array['catches','released','biggest']) kind), entries as (
   select k.kind,jsonb_build_object(
     'rows',coalesce((select jsonb_agg(jsonb_build_object('rank',r.rank,'name',r.name,'score',r.score,'fishId',r.fish_id,'self',coalesce(r.user_id=p_user,false)) order by r.rank) from ranked r where r.kind=k.kind and r.rank<=case when k.kind='biggest' then 3 else 10 end),'[]'::jsonb),
     'total',(select count(*) from ranked r where r.kind=k.kind),
     'me',(select jsonb_build_object('rank',r.rank,'score',r.score,'fishId',r.fish_id) from ranked r where r.kind=k.kind and r.user_id=p_user)
   ) value from kinds k
 ) select jsonb_object_agg(kind,value) into boards from entries;
 return jsonb_build_object('period',p_period,'from',starts,'until',ends,'timeZone','Asia/Ho_Chi_Minh','boards',boards);
end; $$;

revoke all on function public.online_sync_fishing_days(),public.online_fishing_leaderboard(text,date,uuid) from public,anon,authenticated;
grant execute on function public.online_sync_fishing_days(),public.online_fishing_leaderboard(text,date,uuid) to service_role;

commit;
