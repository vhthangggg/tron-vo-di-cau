import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {newPlayer,validateSave} from '../src/save.js';
import {FishingGame} from '../src/engine.js';
import {fishingDay,fishingPeriod,normalizeFishingStats} from '../src/fishing-stats.js';
import {createOnlineService} from '../server/online-service.js';

test('daily rankings use Vietnam midnight and Monday, independently of the device timezone',()=>{
 assert.equal(fishingDay(Date.parse('2026-10-11T16:59:59Z')),'2026-10-11');
 assert.equal(fishingDay(Date.parse('2026-10-11T17:00:00Z')),'2026-10-12');
 assert.deepEqual(fishingPeriod('week',Date.parse('2026-10-11T17:00:00Z')),{day:'2026-10-12',from:'2026-10-12',until:'2026-10-19'});
 assert.deepEqual(fishingPeriod('week',Date.parse('2026-10-11T16:59:59Z')),{day:'2026-10-11',from:'2026-10-05',until:'2026-10-12'});
 assert.equal(fishingPeriod('all').from,null);
});

test('landing and releasing record the action day, survive reload, and cannot replay the release',()=>{
 let now=Date.parse('2026-10-10T16:59:00Z');const p=newPlayer({now}),g=new FishingGame(p,{wallClock:()=>now});
 g.hooked={fishId:'fish_01',weight:.5};g.land();
 assert.equal(p.systems.fishingStats[0].day,'2026-10-10');assert.equal(p.systems.fishingStats[0].catches,1);
 assert.deepEqual(p.systems.fishingStats[0].best,{fishId:'fish_01',weightGrams:500});
 const id=p.pending.id;now=Date.parse('2026-10-10T17:01:00Z');
 assert(g.resolveCatch(id,'release'));assert.equal(g.resolveCatch(id,'release'),false);
 assert.equal(p.systems.fishingStats[1].day,'2026-10-11');assert.equal(p.systems.fishingStats[1].released,1);
 const q=validateSave(JSON.parse(JSON.stringify(p)),{now});assert.deepEqual(q.systems.fishingStats,p.systems.fishingStats);
 g.hooked={fishId:'fish_01',weight:.3};g.land();assert(g.resolveCatch(p.pending.id,'keep'));
 assert(g.resolveKeptCatch(p.homeFish[0].id,'release'));
 assert.equal(g.resolveKeptCatch(id,'release'),false);assert.equal(p.systems.fishingStats[1].released,2);
});

test('daily statistics discard invalid dates, future days, invented fish and inflated counters',()=>{
 const options={now:Date.parse('2026-10-10T06:00:00Z'),catches:2,released:1,collection:{fish_01:{best:1}}};
 const good={day:'2026-10-10',catches:1,released:1,best:{fishId:'fish_01',weightGrams:1000}};
 assert.deepEqual(normalizeFishingStats([good,good],options),[good]);
 assert.deepEqual(normalizeFishingStats([{...good,day:'2026-02-30'},{...good,day:'2026-10-11'},{...good,catches:3}],options),[]);
 assert.equal(normalizeFishingStats([{...good,best:{fishId:'invented',weightGrams:1}}],options)[0].best,null);
 assert.deepEqual(normalizeFishingStats([good,{...good,day:'2026-10-09'}],options),[]);
});

test('public fishing API accepts only the requested periods and uses the server Vietnam day',async()=>{
 const calls=[],service=createOnlineService({rpc:async(name,args)=>{calls.push({name,args});return {boards:{}};}},{now:()=>Date.parse('2026-10-11T17:00:00Z')});
 await service('leaderboard',{query:{board:'fishing',period:'week',day:'2000-01-01',user:'forged'}});
 assert.deepEqual(calls[0],{name:'online_fishing_leaderboard',args:{p_period:'week',p_day:'2026-10-12',p_user:null}});
 await assert.rejects(service('leaderboard',{query:{board:'fishing',period:'year'}}),e=>e.status===400);
});

test('Postgres provides top 10/10/3 distinct players, period filters, private IDs and replay-safe daily merges',async()=>{
 const pg=new PGlite();
 await pg.exec('create schema auth;create table auth.users(id uuid primary key);create role anon;create role authenticated;create role service_role bypassrls;grant usage on schema public to anon,authenticated,service_role;');
 for(const name of ['202610090001_online_players.sql','202610100001_fishing_leaderboards.sql'])await pg.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
 const rpc=async(name,args)=>(await pg.query(`select public.${name}(${Object.keys(args).map((k,i)=>k+'=>$'+(i+1)).join(',')}) result`,Object.values(args))).rows[0].result;
 const today=fishingDay(),lastWeek=new Date(Date.parse(fishingPeriod('week').from+'T00:00:00Z')-86400000).toISOString().slice(0,10);
 const ids=Array.from({length:12},(_,i)=>'00000000-0000-4000-8000-'+String(i+1).padStart(12,'0'));
 try{
  for(const [i,user] of ids.entries()){
   await pg.query('insert into auth.users values($1)',[user]);const p=newPlayer();p.catches=3*(i+1);p.released=2*(i+1);
   p.systems.fishingStats=[{day:today,catches:i+1,released:i+1,best:{fishId:'fish_01',weightGrams:(i+1)*1000}},{day:lastWeek,catches:2*(i+1),released:i+1,best:{fishId:'fish_02',weightGrams:i===0?50000:1000}}];
   await rpc('online_put_save',{p_user:user,p_save:p,p_expected:0,p_request:user});await rpc('online_profile',{p_user:user,p_name:'Cần thủ '+(i+1)});
   await rpc('online_put_save',{p_user:user,p_save:p,p_expected:0,p_request:user});
  }
  const day=await rpc('online_fishing_leaderboard',{p_period:'day',p_day:today,p_user:ids[11]});
  assert.equal(day.boards.catches.rows.length,10);assert.equal(day.boards.released.rows.length,10);assert.equal(day.boards.biggest.rows.length,3);
  assert.equal(day.boards.catches.rows[0].score,12);assert.equal(day.boards.catches.rows[0].self,true);assert.equal(day.boards.biggest.rows[0].score,12000);
  assert.equal(day.boards.biggest.rows[0].fishId,'fish_01');assert.equal(new Set(day.boards.biggest.rows.map(r=>r.name)).size,3);
  assert.equal(day.boards.catches.total,12);assert.equal(day.boards.catches.me.rank,1);assert(!JSON.stringify(day).includes(ids[11]));
  const week=await rpc('online_fishing_leaderboard',{p_period:'week',p_day:today});assert.equal(week.boards.catches.rows[0].score,12);
  const all=await rpc('online_fishing_leaderboard',{p_period:'all',p_day:today});assert.equal(all.boards.catches.rows[0].score,36);assert.equal(all.boards.biggest.rows[0].name,'Cần thủ 1');assert.equal(all.boards.biggest.rows[0].score,50000);
  const smaller=newPlayer();smaller.catches=36;smaller.released=24;smaller.systems.fishingStats=[{day:today,catches:1,released:1,best:null}];
  await rpc('online_put_save',{p_user:ids[11],p_save:smaller,p_expected:1,p_request:'ffffffff-ffff-4fff-8fff-ffffffffffff'});
  const again=await rpc('online_fishing_leaderboard',{p_period:'day',p_day:today});assert.equal(again.boards.catches.rows[0].score,12);assert.equal(again.boards.biggest.rows[0].score,12000);
  await assert.rejects(rpc('online_put_save',{p_user:ids[11],p_save:smaller,p_expected:1,p_request:ids[0]}),/SAVE_CONFLICT/);
  for(const role of ['anon','authenticated']){await pg.exec('set role '+role);await assert.rejects(pg.query('select * from online_fishing_days'),/permission denied/);await assert.rejects(rpc('online_fishing_leaderboard',{p_period:'day',p_day:today}),/permission denied/);await pg.exec('reset role');}
 }finally{await pg.close();}
});
