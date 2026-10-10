begin;

create table if not exists public.online_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 2 and 24),
 created_at timestamptz not null default now()
);
create table if not exists public.online_saves (
 user_id uuid primary key references auth.users(id) on delete cascade,
 save jsonb not null check (jsonb_typeof(save)='object' and octet_length(save::text)<=1048576),
 revision integer not null check (revision>0),
 request_id uuid not null,
 updated_at timestamptz not null default now()
);
create table if not exists public.online_sessions (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 season date not null,
 seed integer not null check(seed>=0),
 rules text not null,
 duration integer not null check(duration=180),
 status text not null default 'active' check(status in ('active','verified')),
 started_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '30 minutes'),
 finished_at timestamptz,
 score_grams integer not null default 0 check(score_grams>=0),
 result jsonb
);
create table if not exists public.online_catches (
 session_id uuid not null references public.online_sessions(id) on delete cascade,
 ordinal integer not null check(ordinal>0),
 user_id uuid not null references auth.users(id) on delete cascade,
 season date not null,
 fish_id text not null,
 weight_grams integer not null check(weight_grams>0 and weight_grams<=1000000),
 map_id text not null,
 caught_tick integer not null check(caught_tick between 0 and 3599),
 primary key(session_id,ordinal)
);
create index if not exists online_sessions_owner_time on public.online_sessions(user_id,started_at desc);
create index if not exists online_sessions_board on public.online_sessions(season,score_grams desc) where status='verified';
create index if not exists online_catches_species on public.online_catches(fish_id,weight_grams desc);
create index if not exists online_catches_collection on public.online_catches(season,user_id,fish_id);

alter table public.online_profiles enable row level security;
alter table public.online_saves enable row level security;
alter table public.online_sessions enable row level security;
alter table public.online_catches enable row level security;
-- These tables are API-server-only. Authenticated players cannot submit scores
-- or arbitrary snapshots through the public Supabase Data API.
revoke all on public.online_profiles,public.online_saves,public.online_sessions,public.online_catches from public,anon,authenticated;
grant all on public.online_profiles,public.online_saves,public.online_sessions,public.online_catches to service_role;

create or replace function public.online_health() returns jsonb
language sql stable set search_path=public,pg_temp as $$ select jsonb_build_object('version',1); $$;

create or replace function public.online_profile(p_user uuid,p_name text default null) returns jsonb
language plpgsql set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if p_name is not null and (char_length(btrim(p_name)) not between 2 and 24 or p_name ~ '[<>[:cntrl:]]') then raise exception 'INVALID_NAME'; end if;
 insert into online_profiles(user_id,display_name) values(p_user,coalesce(btrim(p_name),'Cần thủ '||left(p_user::text,6))) on conflict(user_id) do nothing;
 if p_name is not null then update online_profiles set display_name=btrim(p_name) where user_id=p_user; end if;
 select jsonb_build_object('name',display_name) into result from online_profiles where user_id=p_user;
 return result;
end; $$;

create or replace function public.online_get_save(p_user uuid) returns jsonb
language sql stable set search_path=public,pg_temp as $$
 select coalesce((select jsonb_build_object('save',save,'revision',revision,'updatedAt',updated_at,'requestId',request_id) from online_saves where user_id=p_user),jsonb_build_object('save',null,'revision',0));
$$;

create or replace function public.online_put_save(p_user uuid,p_save jsonb,p_expected integer,p_request uuid) returns jsonb
language plpgsql set search_path=public,pg_temp as $$
declare existing online_saves; current_revision integer;
begin
 -- Serialize creation as well as updates for this player, even before a row exists.
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,731));
 select * into existing from online_saves where user_id=p_user for update;
 current_revision:=coalesce(existing.revision,0);
 if existing.request_id=p_request then return jsonb_build_object('revision',existing.revision,'updatedAt',existing.updated_at); end if;
 if p_expected<>current_revision then raise exception 'SAVE_CONFLICT' using errcode='40001'; end if;
 if p_save->>'version'<>'1' or jsonb_typeof(p_save)<>'object' then raise exception 'INVALID_SAVE'; end if;
 insert into online_saves(user_id,save,revision,request_id) values(p_user,p_save,1,p_request)
 on conflict(user_id) do update set save=excluded.save,revision=online_saves.revision+1,request_id=excluded.request_id,updated_at=now();
 return (select jsonb_build_object('revision',revision,'updatedAt',updated_at) from online_saves where user_id=p_user);
end; $$;

create or replace function public.online_start_session(p_user uuid,p_id uuid,p_season date,p_seed integer,p_rules text,p_duration integer) returns jsonb
language plpgsql set search_path=public,pg_temp as $$
declare s online_sessions;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,732));
 perform online_profile(p_user);
 select * into s from online_sessions where user_id=p_user and status='active' and expires_at>now() order by started_at desc limit 1;
 if found then
   if s.rules=p_rules and s.season=p_season then return to_jsonb(s); end if;
   update online_sessions set expires_at=now() where id=s.id;
 end if;
 if (select count(*) from online_sessions where user_id=p_user and started_at>now()-interval '1 hour')>=20 then raise exception 'RATE_LIMIT'; end if;
 insert into online_sessions(id,user_id,season,seed,rules,duration) values(p_id,p_user,p_season,p_seed,p_rules,p_duration) returning * into s;
 return to_jsonb(s);
end; $$;

create or replace function public.online_get_session(p_user uuid,p_id uuid) returns jsonb
language sql stable set search_path=public,pg_temp as $$ select to_jsonb(s) from online_sessions s where id=p_id and user_id=p_user; $$;

create or replace function public.online_finish_session(p_user uuid,p_id uuid,p_result jsonb) returns jsonb
language plpgsql set search_path=public,pg_temp as $$
declare s online_sessions; c jsonb; total integer;
begin
 select * into s from online_sessions where id=p_id and user_id=p_user for update;
 if not found then raise exception 'SESSION_NOT_FOUND'; end if;
 if s.status='verified' then return s.result; end if;
 if s.expires_at<now() then raise exception 'SESSION_EXPIRED'; end if;
 if now()<s.started_at+interval '178 seconds' or p_result->>'rules'<>s.rules or (p_result->>'ticks')::integer<>3600 then raise exception 'INVALID_RESULT'; end if;
 if jsonb_typeof(p_result->'catches')<>'array' or jsonb_array_length(p_result->'catches')>100 then raise exception 'INVALID_RESULT'; end if;
 select coalesce(sum((v->>'weightGrams')::integer),0) into total from jsonb_array_elements(p_result->'catches') v;
 if total<>(p_result->>'scoreGrams')::integer then raise exception 'INVALID_RESULT'; end if;
 for c in select * from jsonb_array_elements(p_result->'catches') loop
   insert into online_catches(session_id,ordinal,user_id,season,fish_id,weight_grams,map_id,caught_tick)
   values(s.id,(c->>'ordinal')::integer,p_user,s.season,c->>'fishId',(c->>'weightGrams')::integer,c->>'mapId',(c->>'tick')::integer);
 end loop;
 update online_sessions set status='verified',score_grams=total,result=p_result,finished_at=now() where id=p_id;
 return p_result;
end; $$;

create or replace function public.online_leaderboard(p_board text,p_season date,p_species text default null,p_offset integer default 0,p_user uuid default null) returns jsonb
language plpgsql stable set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if p_board not in ('weekly','species','collection') or p_offset<0 or p_offset>500 then raise exception 'INVALID_BOARD'; end if;
 with metrics as (
   select user_id,max(score_grams)::bigint as score from online_sessions where p_board='weekly' and status='verified' and season=p_season and score_grams>0 group by user_id
   union all
   select user_id,max(weight_grams)::bigint from online_catches where p_board='species' and fish_id=p_species group by user_id
   union all
   select user_id,count(distinct fish_id)::bigint from online_catches where p_board='collection' and season=p_season group by user_id
 ), ranked as (
   select m.user_id,p.display_name as name,m.score,dense_rank() over(order by m.score desc) as rank from metrics m join online_profiles p using(user_id)
 ), page as (
   select name,score,rank,user_id=p_user as self from ranked order by score desc,user_id limit 25 offset p_offset
 )
 select jsonb_build_object('season',p_season,'board',p_board,'rows',coalesce((select jsonb_agg(to_jsonb(page)) from page),'[]'::jsonb),'total',(select count(*) from ranked),'me',(select jsonb_build_object('name',name,'score',score,'rank',rank) from ranked where user_id=p_user)) into result;
 return result;
end; $$;

revoke all on function public.online_health(),public.online_profile(uuid,text),public.online_get_save(uuid),public.online_put_save(uuid,jsonb,integer,uuid),public.online_start_session(uuid,uuid,date,integer,text,integer),public.online_get_session(uuid,uuid),public.online_finish_session(uuid,uuid,jsonb),public.online_leaderboard(text,date,text,integer,uuid) from public,anon,authenticated;
grant execute on function public.online_health(),public.online_profile(uuid,text),public.online_get_save(uuid),public.online_put_save(uuid,jsonb,integer,uuid),public.online_start_session(uuid,uuid,date,integer,text,integer),public.online_get_session(uuid,uuid),public.online_finish_session(uuid,uuid,jsonb),public.online_leaderboard(text,date,text,integer,uuid) to service_role;

commit;
