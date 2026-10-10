import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {createOnlineService} from '../server/online-service.js';
import {OnlineClient,scopedStorage} from '../src/online-client.js';
import {newPlayer,SAVE_KEY} from '../src/save.js';
import {RankedChallenge,replayRanked,validateTrace,RANKED_RULES,seasonKey,seasonSeed} from '../src/ranked-challenge.js';
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};};
function play(seed){const run=new RankedChallenge(seed);while(!run.finished){const g=run.game;if(['idle','failed'].includes(g.phase))run.command('cast');if(g.phase==='bite')run.command('holdRod',.45);if(['fight','snag'].includes(g.phase)){run.command('setTracking',true,g.fishPosition.x,g.fishPosition.y);run.command('setForce',g.phase==='snag'?.25:g.surge?.2:.45,true);}run.step();}return run;}
test('Ranked server replay derives identical catches from controls, rejecting arbitrary state edits',()=>{
 const run=play(123456),result=replayRanked(123456,run.events);assert(run.catches.length>0);assert.deepEqual(result.catches,run.catches);assert.equal(result.scoreGrams,run.scoreGrams);
 assert.equal(replayRanked(123456,[]).scoreGrams,0);
 for(const trace of [[[1,'buy','rod','spinheavy']],[[0,'setForce',Infinity,true]],[[2,'cast'],[1,'cast']],[[3600,'cast']],[[0,'land']],Array.from({length:65},()=>[0,'cast'])])assert.throws(()=>validateTrace(trace));
 assert.equal(seasonKey(Date.parse('2026-10-11T16:59:00Z')),'2026-10-05');assert.equal(seasonKey(Date.parse('2026-10-11T17:00:00Z')),'2026-10-12');
});
test('Ranked controls clamp keyboard movement at pad edges and coalesce high-frequency pointer events',()=>{
 const run=new RankedChallenge(123);run.command('cast');
 while(run.game.phase!=='waiting')run.step();
 const before=run.events.length;
 for(let i=0;i<1000;i++)run.command('setTracking',true,i/100,1-i/100);
 assert.equal(run.events.length,before+1);assert.deepEqual(run.game.aim,{x:1,y:0});validateTrace(run.events);
 while(!run.finished)run.step();assert.deepEqual(replayRanked(123,run.events).catches,run.catches);
});
test('PostgreSQL migration enforces ownership, CAS, idempotence, ranked receipts and privilege boundaries',async()=>{
 const pg=new PGlite();await pg.exec(`create schema auth; create table auth.users(id uuid primary key);create role anon;create role authenticated;create role service_role bypassrls;grant usage on schema public to anon,authenticated,service_role;insert into auth.users values('${A}'),('${B}');`);
 await pg.exec(await readFile(new URL('../supabase/migrations/202610090001_online_players.sql',import.meta.url),'utf8'));
 const rpc=async(name,args)=>{const values=Object.values(args),keys=Object.keys(args);return (await pg.query(`select public.${name}(${keys.map((k,i)=>k+'=> $'+(i+1)).join(',')}) as result`,values)).rows[0].result;};
 try{
   await rpc('online_profile',{p_user:A,p_name:'Cần thủ A'});await rpc('online_profile',{p_user:B,p_name:'Cần thủ B'});
   const player=newPlayer();const req='11111111-1111-4111-8111-111111111111';
   let saved=await rpc('online_put_save',{p_user:A,p_save:player,p_expected:0,p_request:req});assert.equal(saved.revision,1);
   saved=await rpc('online_put_save',{p_user:A,p_save:{...player,coins:999},p_expected:0,p_request:req});assert.equal(saved.revision,1);
   assert.equal((await rpc('online_get_save',{p_user:A})).save.coins,12000);assert.equal((await rpc('online_get_save',{p_user:B})).save,null);
   assert.equal((await rpc('online_get_save',{p_user:A})).requestId,req);
   await assert.rejects(rpc('online_put_save',{p_user:A,p_save:player,p_expected:0,p_request:'22222222-2222-4222-8222-222222222222'}),/SAVE_CONFLICT/);
   const sessionId='33333333-3333-4333-8333-333333333333',season=seasonKey(),seed=seasonSeed(season);
   const session=await rpc('online_start_session',{p_user:A,p_id:sessionId,p_season:season,p_seed:seed,p_rules:RANKED_RULES,p_duration:180});assert.equal(session.id,sessionId);
   assert.equal((await rpc('online_start_session',{p_user:A,p_id:'44444444-4444-4444-8444-444444444444',p_season:season,p_seed:seed,p_rules:RANKED_RULES,p_duration:180})).id,sessionId);
   assert.equal(await rpc('online_get_session',{p_user:B,p_id:sessionId}),null);
   const run=play(seed),result=replayRanked(seed,run.events);
   await assert.rejects(rpc('online_finish_session',{p_user:A,p_id:sessionId,p_result:result}),/INVALID_RESULT/);
   await pg.query("update online_sessions set started_at=now()-interval '181 seconds' where id=$1",[sessionId]);
   const first=await rpc('online_finish_session',{p_user:A,p_id:sessionId,p_result:result});assert.equal(first.scoreGrams,result.scoreGrams);
   const second=await rpc('online_finish_session',{p_user:A,p_id:sessionId,p_result:{...result,scoreGrams:999999}});assert.equal(second.scoreGrams,result.scoreGrams);
   assert.equal(Number((await pg.query('select count(*) as n from online_catches')).rows[0].n),run.catches.length);
   const board=await rpc('online_leaderboard',{p_board:'weekly',p_season:season,p_species:null,p_offset:0,p_user:A});assert.equal(board.rows.length,1);assert.equal(board.rows[0].name,'Cần thủ A');assert.equal(board.rows[0].self,true);assert.equal(board.me.rank,1);assert.equal(board.rows[0].user_id,undefined);
   for(const role of ['anon','authenticated']){
     await pg.exec('set role '+role);
     await assert.rejects(pg.query('select * from online_saves'),/permission denied/);
     await assert.rejects(rpc('online_put_save',{p_user:A,p_save:player,p_expected:1,p_request:req}),/permission denied/);
     await assert.rejects(rpc('online_finish_session',{p_user:A,p_id:sessionId,p_result:result}),/permission denied/);
     await pg.exec('reset role');
   }
 }finally{await pg.close();}
});
test('API ignores forged score, checks session owner, timing, rule version and trace',async()=>{
 const calls=[],now=Date.now(),session={seed:123,started_at:new Date(now-181000).toISOString(),expires_at:new Date(now+100000).toISOString(),rules:RANKED_RULES,status:'active'};
 const service=createOnlineService({async rpc(name,args){calls.push({name,args});return name==='online_get_session'?session:args.p_result;}},{now:()=>now});
 const result=await service('ranked-submit',{method:'POST',user:{id:A},body:{sessionId:A,events:[],score:99999,seed:999}});assert.equal(result.scoreGrams,0);assert.equal(calls[0].args.p_user,A);
 session.started_at=new Date(now).toISOString();await assert.rejects(service('ranked-submit',{method:'POST',user:{id:A},body:{sessionId:A,events:[]}}),e=>e.status===400);
 session.started_at=new Date(now-181000).toISOString();session.rules='old';await assert.rejects(service('ranked-submit',{method:'POST',user:{id:A},body:{sessionId:A,events:[]}}),e=>e.status===409);
 await assert.rejects(service('save',{method:'POST',body:{}}),e=>e.status===401);
 await assert.rejects(service('profile',{method:'POST',user:{id:A},body:{name:'<script>'}}),e=>e.status===400);
});
test('Guest and separate account saves cannot overwrite each other',()=>{
 const s=memory();s.setItem(SAVE_KEY,'guest');scopedStorage(s,A).setItem(SAVE_KEY,'a');scopedStorage(s,B).setItem(SAVE_KEY,'b');
 assert.equal(s.getItem(SAVE_KEY),'guest');assert.equal(scopedStorage(s,A).getItem(SAVE_KEY),'a');assert.equal(scopedStorage(s,B).getItem(SAVE_KEY),'b');
 scopedStorage(s,A).setItem(SAVE_KEY+'.backup','backup-a');assert.equal(scopedStorage(s,B).getItem(SAVE_KEY+'.backup'),null);
});
test('Cloud retries lost responses with the same receipt and keeps edits made in flight',async()=>{
 const s=memory(),client=new OnlineClient({storage:s});client.setIdentity({id:A});client.user={id:A};client.state='dirty';let player=newPlayer();client.getPlayer=()=>player;client.meta.dirty=true;client.meta.sequence=1;
 let fail=true,requests=[];client.request=async(action,{body})=>{requests.push(body);if(fail){fail=false;throw Error('offline');}client.meta.sequence++;return {revision:1};};
 await client.flush();assert.equal(client.state,'offline');assert(client.meta.pending);
 await client.flush();assert.equal(requests[0].requestId,requests[1].requestId);assert.equal(client.meta.revision,1);assert.equal(client.meta.dirty,true);clearTimeout(client.timer);
});
test('Remote conflict never silently replaces dirty local progress',async()=>{
 const s=memory(),client=new OnlineClient({storage:s});client.setIdentity({id:A});client.user={id:A};client.hadLocal=true;client.meta={revision:1,dirty:true,sequence:2};
 const local=newPlayer();local.coins=777;client.getPlayer=()=>local;client.canReplace=()=>true;client.applyPlayer=()=>assert.fail('must require a choice');
 client.request=async action=>action==='save'?{save:newPlayer(),revision:2}:{name:'A'};
 await client.checkRemote();assert.equal(client.state,'conflict');assert.equal(local.coins,777);clearTimeout(client.timer);
});
test('Reload reconciles an acknowledged pending receipt without losing newer local changes',async()=>{
 const s=memory(),client=new OnlineClient({storage:s});client.setIdentity({id:A});client.user={id:A};client.hadLocal=true;client.meta={revision:1,dirty:true,sequence:4,pending:{id:A,sequence:3}};
 client.getPlayer=()=>newPlayer();client.canReplace=()=>true;client.applyPlayer=()=>assert.fail('newer local changes must survive');
 client.request=async action=>action==='save'?{save:newPlayer(),revision:2,requestId:A}:{name:'A'};
 await client.checkRemote();assert.equal(client.meta.revision,2);assert.equal(client.meta.dirty,true);assert.equal(client.meta.pending,undefined);clearTimeout(client.timer);
});
