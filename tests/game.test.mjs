import {guideFish,freeSnag} from './control-player.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {FishingGame,floatMarks} from '../src/engine.js';
import {newPlayer,validateSave,savePlayer,loadPlayer,SAVE_KEY} from '../src/save.js';

function advanceUntil(g,predicate,max=50){for(let i=0;i<max*10;i++){freeSnag(g);g.step(.1);if(predicate())return;}assert.fail(`Timed out: ${g.phase} — ${g.message}`);}
function land(g){assert.ok(g.cast());advanceUntil(g,()=>g.phase==='bite');assert.ok(g.holdRod());advanceUntil(g,()=>{guideFish(g);return g.phase==='landed';},60);}

test('Fish exist before casting; the bite and catch retain the same instance',()=>{const p=newPlayer(),g=new FishingGame(p,{seed:22});const before=new Set(g.fish.map(f=>f.id));land(g);assert.ok(before.has(g.hooked.id));assert.ok(g.hooked.caught);assert.equal(p.catches,1);assert.equal(p.collection[p.pending.fishId].count,1);});
test('A catch can credit the wallet once, including after save/reload',()=>{const p=newPlayer(),g=new FishingGame(p,{seed:4});land(g);const saved=validateSave(JSON.parse(JSON.stringify(p))),restored=new FishingGame(saved);const {id,value}=saved.pending,start=saved.coins;assert.equal(restored.resolveCatch(id,'sell'),false);assert.ok(restored.resolveCatch(id,'keep'));assert.ok(restored.returnHome());assert.ok(restored.resolveKeptCatch(id,'sell'));assert.equal(saved.coins,start+value);assert.equal(restored.resolveKeptCatch(id,'sell'),false);assert.equal(saved.coins,start+value);assert.equal(saved.sold,1);});
test('Release preserves the journal and never credits sale value',()=>{const p=newPlayer(),g=new FishingGame(p,{seed:19}),start=p.coins;land(g);const id=p.pending.id;assert.ok(g.resolveCatch(id,'release'));assert.equal(p.coins,start);assert.equal(p.released,1);assert.equal(Object.keys(p.collection).length,1);assert.equal(g.resolveCatch(id,'release'),false);});
test('An early strike fails and consumes exactly one portion of bait',()=>{const p=newPlayer(),g=new FishingGame(p,{seed:5}),start=p.baits.worm;g.cast();advanceUntil(g,()=>g.phase==='waiting');assert.equal(g.holdRod(),false);assert.equal(g.phase,'failed');assert.equal(p.baits.worm,start-1);assert.equal(p.catches,0);});
test('No compatible bait/depth keeps waiting and never spends mounted bait',()=>{const p=newPlayer(),g=new FishingGame(p,{seed:1});assert.ok(g.equip('bait','corn'));g.setRig('depth',.4);g.fish=[];const stock=p.baits.corn;assert.ok(g.cast());for(let i=0;i<500;i++)g.step(.1);assert.equal(g.phase,'waiting');assert.equal(p.catches,0);assert.equal(g.hooked,null);assert.equal(p.baits.corn,stock);assert.match(g.message,/Cá chưa cắn/);g.retrieve();assert.equal(p.baits.corn,stock);});
test('An unbalanced rig can cast with lower sensitivity and no upfront bait charge',()=>{const p=newPlayer(),g=new FishingGame(p);p.rig.lead=1.5;const before=p.baits.worm;assert.equal(floatMarks(p),0);assert.equal(g.cast(),true);assert.equal(p.baits.worm,before);assert(g.float.sensitivity<.55);});
test('Pulling continuously on a large fish can break the line',()=>{const p=newPlayer(),g=new FishingGame(p,{seed:1});g.cast();advanceUntil(g,()=>g.phase==='bite');g.holdRod();g.hooked.weight=2.4;g.setPulling(true);advanceUntil(g,()=>g.phase==='failed',20);assert.match(g.message,/Đứt dây/);assert.equal(p.pending,null);});
test('Paused simulation preserves the strike window and deadline',()=>{const p=newPlayer();p.settings.deadline=180;const g=new FishingGame(p,{seed:6});g.cast();advanceUntil(g,()=>g.phase==='bite');const elapsed=g.elapsed;g.paused=true;for(let i=0;i<400;i++)g.step(.1);assert.equal(g.phase,'bite');assert.equal(g.elapsed,elapsed);g.paused=false;g.holdRod();assert.equal(g.phase,'fight');});
test('Empty wallet and bait cannot claim instant free bait',()=>{const p=newPlayer();p.coins=0;p.baits.worm=0;const g=new FishingGame(p,{seed:3});assert.equal(g.cast(),false);assert.equal(g.digWorms(),false);assert.equal(g.gather('home'),false);assert.equal(p.baits.worm,0);});
test('Shop purchases and lesson rewards are atomic and idempotent',()=>{const p=newPlayer(),g=new FishingGame(p);p.coins=50000;assert.ok(g.buy('rod','rod_01'));assert.equal(p.coins,22000);assert.equal(g.buy('rod','rod_01'),false);assert.ok(g.answerLesson('signal',0));assert.equal(p.coins,24500);assert.ok(g.answerLesson('signal',0));assert.equal(p.coins,24500);assert.equal(g.answerLesson('depth',0),false);});
test('Lure needs retrieve input before fish approach and does not consume bait',()=>{const p=newPlayer();p.rods.push('rod_02');p.rod='rod_02';p.bait='lure';p.baits.lure=1;p.systems.inventory=null;const g=new FishingGame(p,{seed:12});g.cast();for(let i=0;i<100;i++)g.step(.1);assert.equal(g.target,null);g.toggleRetrieve();advanceUntil(g,()=>g.phase==='bite');assert.equal(g.target.fishId,'fish_04');assert.equal(p.baits.worm,18);});
test('Deadline stops active fishing and a new session resumes',()=>{const p=newPlayer();p.settings.deadline=180;const g=new FishingGame(p);g.elapsed=179.95;g.cast();g.step(.1);assert.ok(g.deadlineReached);assert.equal(g.cast(),false);assert.ok(g.newSession());assert.equal(g.deadlineReached,false);assert.equal(g.elapsed,0);});
test('Broken saves and blocked storage safely report a new session',()=>{const storage={getItem:()=>'{broken',setItem:()=>{throw Error('blocked');}};const result=loadPlayer(storage);assert.equal(result.player.coins,12000);assert.ok(result.warning);assert.equal(savePlayer(storage,result.player),false);assert.throws(()=>validateSave({...newPlayer(),coins:-10}));});
test('Save roundtrip preserves owned gear, bait, progress and settings',()=>{let raw;const storage={getItem:()=>raw,setItem:(k,v)=>{assert.equal(k,SAVE_KEY);raw=v;}};const p=newPlayer();p.rods.push('rod_01');p.map='AO';p.lessons.push('signal');p.settings.deadline=300;assert.ok(savePlayer(storage,p));assert.deepEqual(loadPlayer(storage).player,p);});

test('Right hold hooks the same fish, both hands lead it, release relaxes without another toggle',()=>{
 const p=newPlayer(),g=new FishingGame(p,{seed:22});assert.ok(g.cast());advanceUntil(g,()=>g.phase==='bite');
 const fish=g.target,bait=p.baits.worm-1;assert.ok(g.holdRod());assert.equal(p.baits.worm,bait,'Real fish eating consumes the mounted portion');assert.equal(g.hooked,fish);assert.equal(g.pulling,true);
 for(let i=0;i<6;i++)g.step(.1);assert.equal(g.energy,100,'Right hand alone cannot land a fish');for(let i=0;i<6;i++){guideFish(g);g.step(.1);}assert(g.energy<100,'Both hands make progress');
 const energy=g.energy,tension=g.tension;assert.ok(g.holdRod());assert.equal(g.energy,energy,'Repeated hold must not reset the fight');assert.equal(p.baits.worm,bait);
 g.setPulling(false);assert.equal(g.pulling,false);for(let i=0;i<5;i++)g.step(.1);assert(g.tension<tension,'Releasing must relax line tension');
 assert.equal(p.catches,0);assert.equal(p.pending,null);
});

test('Hold cannot start while paused, after landing or outside a cast; release always clears held force',()=>{
 const g=new FishingGame(newPlayer(),{seed:6});assert.equal(g.holdRod(),false);assert.ok(g.cast());advanceUntil(g,()=>g.phase==='bite');
 g.paused=true;assert.equal(g.holdRod(),false);assert.equal(g.phase,'bite');g.paused=false;assert.ok(g.holdRod());
 const energy=g.energy;g.paused=true;g.setPulling(false);for(let i=0;i<20;i++)g.step(.1);assert.equal(g.pulling,false);assert.equal(g.energy,energy);
 assert.equal(g.holdRod(),false);g.paused=false;assert.ok(g.holdRod());g.fail('Đã thu cần.');assert.equal(g.pulling,false);assert.equal(g.holdRod(),false);
});

test('Starter rod can land natural fish with two hands and 200 ms tracking reactions across 50 seeds',()=>{
 for(let seed=1;seed<=50;seed++){
  const p=newPlayer(),g=new FishingGame(p,{seed}),bait=p.baits.worm;
  assert.ok(g.cast());advanceUntil(g,()=>g.phase==='bite');const target=g.target;assert.ok(g.holdRod());
  for(let i=0;i<300&&g.phase==='fight';i++){
   guideFish(g);g.step(.1);g.step(.1);
  }
  assert.equal(g.phase,'landed','Starter catch failed on seed '+seed+' / '+g.message);
  assert.equal(g.hooked,target);assert.equal(p.catches,1);assert.equal(p.pending.fishId,target.fishId);assert.equal(p.baits.worm,bait-1);assert.equal(g.pulling,false);
  assert.equal(g.holdRod(),false);assert.ok(g.resolveCatch(p.pending.id,'release'));
 }
});
