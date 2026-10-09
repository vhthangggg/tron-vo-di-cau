import {GARDEN_HOUR} from '../src/garden.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {FishingGame} from '../src/engine.js';
import {newPlayer,validateSave,loadPlayer,savePlayer} from '../src/save.js';
import {inventoryFor,reconcileInventory,carriedBaitCount,BAG_TYPES} from '../src/inventory.js';
import {KEEP_CAPACITY} from '../src/catch-inventory.js';
import {STARTER_STEPS} from '../src/tutorial.js';
import {guideFish,freeSnag} from './control-player.mjs';
import {validateRig} from '../src/equipment.js';
import {renderRig} from '../src/ui.js';

const fish=(id,status='landed',extra={})=>({id:`catch-${id}`,fishId:'fish_01',weight:.3,value:120,mapId:'AO',status,caughtAt:1791445200000+id,...extra});
const reloaded=player=>validateSave(JSON.parse(JSON.stringify(player)));

test('save repair aligns optional rig bounds with playable setup and preserves assets',()=>{
 const p=newPlayer();p.coins=81573;p.rig.leaderMm=.09;p.rig.leaderLength=.05;p.rig.sinkerDistance=.02;
 p.systems.rigPresets=[{id:'preset:invalid',name:'Old invalid dimensions',rod:p.rod,bait:p.bait,equipment:structuredClone(p.equipment),rig:structuredClone(p.rig)}];
 const q=reloaded(p);assert.equal(q.coins,p.coins);assert.deepEqual(q.baits,p.baits);assert.deepEqual(q.rods,p.rods);
 assert.equal(validateRig(q).ok,true);assert.equal(q.rig.leaderMm,.16);assert.equal(q.rig.leaderLength,.25);assert.equal(q.rig.sinkerDistance,.25);assert.deepEqual(q.systems.rigPresets,[]);
 assert.equal(new FishingGame(q).cast(),true);
});

test('valid saved custom leader and hook dimensions are displayed as equipped',()=>{
 const p=newPlayer();p.rig.leaderMm=.18;p.rig.hookSize=5;const q=reloaded(p),before=JSON.stringify(q),html=renderRig(q,new FishingGame(q));
 assert.equal(validateRig(q).ok,true);assert.match(html,/<option value="0.18" selected>0.18 mm<\/option>/);assert.match(html,/<option value="5" selected>#5<\/option>/);assert.equal(JSON.stringify(q),before);
});
function storage(){const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};}
function advance(g,condition,seconds=70){
 for(let i=0;i<seconds*10;i++){freeSnag(g);g.step(.1);if(condition())return;}
 assert.fail(`Gameplay stalled at ${g.phase}: ${g.message}`);
}
function land(g){
 assert.equal(g.cast(),true,g.message);advance(g,()=>g.phase==='bite');assert.equal(g.holdRod(),true,g.message);
 advance(g,()=>{guideFish(g);return g.phase==='landed';});
 assert.equal(g.player.pending?.status,'landed');
}
function landedFixture(id=1){
 const p=newPlayer();p.pending=fish(id);p.serial=id;p.catches=id;
 p.systems.trip={id:'trip:fixture',mapId:'AO',spotId:'ben-cau-tre',active:true};
 return p;
}
function assets(p){return {coins:p.coins,rods:[...p.rods],accessories:[...p.accessories],baits:{...p.baits},inventory:structuredClone(inventoryFor(p))};}

// Start with blocked actions, then prove the supported recovery changes real gameplay state.
test('integrated recovery with zero money and zero bait remains playable before and after reload',()=>{
 const p=newPlayer();p.coins=0;for(const id of Object.keys(p.baits))p.baits[id]=0;
 let now=p.systems.garden.lastAt;const g=new FishingGame(p,{seed:22,wallClock:()=>now});assert.equal(g.cast(),false);assert.equal(g.buy('bait','worm'),false);
 assert.equal(g.digWorms(),false);assert(g.workGarden('feed','worms'));assert(g.workGarden('water','worms'));now+=12*GARDEN_HOUR;
 assert.equal(g.digWorms(),true);assert.equal(p.coins,0);assert.equal(p.baits.worm,3);assert.equal(carriedBaitCount(p,'worm'),0);assert(g.moveBait('worm',3,'carried'));
 const q=reloaded(p),again=new FishingGame(q,{seed:22,wallClock:()=>now});land(again);assert.equal(q.baits.worm,2);assert.equal(q.coins,0);
 assert.equal(again.resolveCatch(q.pending.id,'keep'),true);assert.equal(again.returnHome(),true);assert.equal(again.sellKeptFish(),true);assert(q.coins>0);
 assert.equal(reconcileInventory(q.systems.inventory,q),true);
});

test('new purchases stay home until packed; capacity failures preserve every owned asset',()=>{
 const p=newPlayer();p.coins=200000;const g=new FishingGame(p);
 assert.equal(g.buy('rod','dai','buy:dai:once'),true);assert.equal(g.buy('accessory','line18','buy:line:once'),true);assert.equal(g.buy('bait','worm','buy:worm:once'),true);
 let inv=inventoryFor(p);assert(inv.stored.rods.includes('dai'));assert(inv.stored.accessories.includes('line18'));assert.equal(inv.carried.baits.worm,18);assert.equal(inv.stored.baits.worm,12);
 const before=assets(p);assert.equal(g.moveGear('rods','dai','carried'),false);assert.equal(g.moveBait('corn',6,'carried'),false);assert.deepEqual(assets(p),before);
 assert.equal(g.buy('bag','standard','buy:bag:once'),true);assert.equal(g.selectBag('standard'),true);assert.equal(g.moveGear('rods','dai','carried'),true);assert.equal(g.moveBait('corn',6,'carried'),true);
 assert.equal(reconcileInventory(p.systems.inventory,p),true);inv=inventoryFor(p);assert.equal(inv.carried.rods.length,2);assert.equal(inv.carried.baits.corn,6);
 const full=assets(p);assert.equal(g.selectBag('cloth'),false);assert.deepEqual(assets(p),full);
 assert.equal(g.moveGear('rods','dai','stored'),true);assert.equal(g.moveBait('corn',6,'stored'),true);assert.equal(g.selectBag('cloth'),true);
 assert.equal(g.equip('line','line18'),true);assert.equal(inventoryFor(p).stored.accessories.includes('line_basic'),true);assert.equal(reconcileInventory(p.systems.inventory,p),true);
});

test('a stale purchase action cannot charge or grant bait twice across persisted reload',()=>{
 const p=newPlayer();p.coins=90000;const g=new FishingGame(p),txId='shop:worm:reserved';
 assert.equal(g.buy('bait','worm',txId),true);const after=assets(p);assert.equal(g.buy('bait','worm',txId),false);assert.deepEqual(assets(p),after);
 const s=storage();assert.equal(savePlayer(s,p),true);const q=loadPlayer(s).player,again=new FishingGame(q);
 assert.equal(again.buy('bait','worm',txId),false);assert.deepEqual(assets(q),after);assert.equal(q.systems.transactions.filter(id=>id===txId).length,1);
});

test('intact mounted bait survives retrieval, repeated casting, persisted reload, then one replacement or loss',()=>{
 const p=newPlayer(),g=new FishingGame(p,{seed:22}),stock=p.baits.worm;
 assert.equal(g.cast(),true);const mount=structuredClone(p.systems.mountedBait);g.retrieve();assert.equal(p.baits.worm,stock);assert.deepEqual(p.systems.mountedBait,mount);
 for(let i=0;i<3;i++){assert.equal(g.cast(),true);g.retrieve();assert.equal(p.baits.worm,stock);assert.equal(p.systems.mountedBait.mountId,mount.mountId);}
 const q=reloaded(p),again=new FishingGame(q,{seed:22});assert.deepEqual(q.systems.mountedBait,mount);assert.equal(again.cast(),true);again.retrieve();
 assert.equal(again.equip('bait','dough'),true);assert.equal(q.baits.worm,stock-1);assert.equal(q.systems.mountedBait,null);
 const dough=q.baits.dough;assert.equal(again.cast(),true);again.fail('Synthetic line-loss terminal outcome','lost');assert.equal(q.baits.dough,dough-1);assert.equal(q.systems.mountedBait,null);
 again.fail('Repeated terminal outcome','lost');assert.equal(q.baits.dough,dough-1);assert.equal(q.baits.worm,stock-1);
});

test('bait used by a genuine fish strike debits the bag first, keeps home stock intact, and charges once',()=>{
 const p=newPlayer(),g=new FishingGame(p,{seed:22});assert.equal(g.moveBait('worm',16,'stored'),true);
 const home=inventoryFor(p).stored.baits.worm,total=p.baits.worm;assert.equal(carriedBaitCount(p,'worm'),2);
 assert.equal(g.cast(),true);assert.equal(p.baits.worm,total);advance(g,()=>g.phase==='bite');assert.equal(p.baits.worm,total);
 assert.equal(g.holdRod(),true);assert.equal(p.baits.worm,total-1);assert.equal(carriedBaitCount(p,'worm'),1);assert.equal(inventoryFor(p).stored.baits.worm,home);
 assert.equal(g.holdRod(),true);g.fail('Fight ended after eaten bait','lost');assert.equal(p.baits.worm,total-1);assert.equal(inventoryFor(p).stored.baits.worm,home);
 assert.equal(reconcileInventory(p.systems.inventory,p),true);
});

for(const outcome of ['lost','replacement-at-bank','replacement-at-home'])test(`partial carried bait debits bag4/home14 once on ${outcome}`,()=>{
 const p=newPlayer(),g=new FishingGame(p,{seed:22});assert.equal(g.moveBait('worm',14,'stored'),true);
 assert.equal(carriedBaitCount(p,'worm'),4);assert.equal(inventoryFor(p).stored.baits.worm,14);assert.equal(g.cast(),true);
 if(outcome==='lost')g.fail('Line and mounted bait lost','lost');
 else{
  g.retrieve();if(outcome==='replacement-at-home')assert.equal(g.returnHome(),true);
  assert.equal(g.equip('bait','dough'),true);
 }
 assert.equal(p.baits.worm,17);assert.equal(carriedBaitCount(p,'worm'),3);assert.equal(inventoryFor(p).stored.baits.worm,14);assert.equal(p.systems.mountedBait,null);
 g.fail('Repeated loss after old mount cleared','lost');assert.equal(p.baits.worm,17);assert.equal(carriedBaitCount(p,'worm'),3);assert.equal(inventoryFor(p).stored.baits.worm,14);
 assert.equal(reconcileInventory(p.systems.inventory,p),true);
});

test('long idle waiting does not spend bait or reset its mount, and a wrong float can still be cast',()=>{
 const p=newPlayer(),g=new FishingGame(p,{seed:22});g.fish=[];assert.equal(g.setRig('lead',1.5),true);assert.equal(g.float.balanced,false);
 const stock=p.baits.worm;assert.equal(g.cast(),true);const mountId=p.systems.mountedBait.mountId;
 for(let i=0;i<1000;i++){freeSnag(g);g.step(.1);}assert.equal(g.phase,'waiting');assert.equal(p.baits.worm,stock);assert.equal(p.systems.mountedBait.mountId,mountId);assert.match(g.message,/Cá chưa cắn/);
 g.retrieve();assert.equal(g.setRig('lead',1.08),true);assert.equal(g.balance(),true);assert.equal(g.float.balanced,true);assert.equal(p.systems.tutorial.float.completed,true);
});

test('rig preset restores all fields in one visible commit and failed load leaves the active setup untouched',()=>{
 const p=newPlayer();p.coins=250000;let observed=[];const g=new FishingGame(p,{onChange:()=>observed.push({rod:p.rod,bait:p.bait,equipment:{...p.equipment},rig:{...p.rig}})});
 assert.equal(g.buy('rod','dai'),true);assert.equal(g.equip('rod','dai'),true);assert.equal(g.equip('bait','corn'),true);assert.equal(g.setRig('leaderMm',.2),true);assert.equal(g.setRig('hookSize',6),true);
 assert.equal(g.saveRigPreset('Bộ ngô bờ ao'),true);const preset=structuredClone(p.systems.rigPresets[0]);
 assert.equal(g.equip('rod','bamboo'),true);assert.equal(g.equip('bait','worm'),true);assert.equal(g.setRig('leaderMm',.16),true);observed=[];
 assert.equal(g.loadRigPreset(preset.id),true);assert.equal(observed.length,1);assert.deepEqual(observed[0],{rod:preset.rod,bait:preset.bait,equipment:preset.equipment,rig:preset.rig});
 assert.equal(reconcileInventory(p.systems.inventory,p),true);
 p.baits.corn=0;observed=[];const before={...assets(p),rod:p.rod,bait:p.bait,equipment:structuredClone(p.equipment),rig:structuredClone(p.rig)};
 assert.equal(g.loadRigPreset(preset.id),false);assert.deepEqual({...assets(p),rod:p.rod,bait:p.bait,equipment:p.equipment,rig:p.rig},before);
 assert.equal(observed.every(snapshot=>snapshot.rod===before.rod&&snapshot.bait===before.bait&&JSON.stringify(snapshot.rig)===JSON.stringify(before.rig)),true);
});

test('active trip persists the current bank after moving to another spot and reloading',()=>{
 const p=newPlayer(),g=new FishingGame(p,{seed:22});assert.equal(g.selectSpot(1),true);assert.equal(g.cast(),true);g.retrieve();
 const id=p.systems.trip.id;assert.equal(g.selectSpot(0),true);const q=reloaded(p),again=new FishingGame(q,{seed:22});
 assert.equal(q.systems.trip.active,true);assert.equal(q.systems.trip.id,id);assert.equal(q.systems.trip.spotId,'ben-cau-tre');assert.equal(again.spot,0);assert.equal(again.spotData.id,'ben-cau-tre');
});

test('non-video maps persist their active numeric bank and trip map when moving locations',()=>{
 const p=newPlayer();p.coins=100000;const g=new FishingGame(p,{seed:22});assert.equal(g.buy('map','KENH'),true);assert.equal(g.selectMap('KENH'),true);assert.equal(g.selectSpot(2),true);
 assert.equal(g.cast(),true);g.retrieve();assert.equal(p.systems.trip.spotId,'2');
 const q=reloaded(p),again=new FishingGame(q);assert.equal(again.spot,2);assert.equal(again.map.id,'KENH');
 assert.equal(again.selectMap('AO'),true);const third=reloaded(q),restored=new FishingGame(third);
 assert.equal(third.systems.trip.mapId,'AO');assert.equal(third.systems.trip.spotId,'ben-cau-tre');assert.equal(restored.map.id,'AO');assert.equal(restored.spot,0);
});

for(const decision of ['sell','gift','cook'])test(`a caught fish moves pending → net → home and ${decision} is applied only once`,()=>{
 const p=landedFixture(),g=new FishingGame(p),money=p.coins;
 assert.equal(g.resolveCatch('catch-1',decision),false);assert.equal(g.resolveCatch('catch-1','keep'),true);assert.equal(g.resolveCatch('catch-1','keep'),false);
 assert.equal(p.pending,null);assert.equal(p.keptFish.length,1);assert.equal(p.keptFish[0].status,'kept');assert.equal(g.resolveKeptCatch('catch-1',decision),false);
 assert.equal(g.returnHome(),true);assert.equal(p.keptFish.length,0);assert.equal(p.homeFish.length,1);assert.equal(p.homeFish[0].status,'home');
 assert.equal(g.resolveKeptCatch('catch-1',decision),true);assert.equal(p.homeFish.length,0);assert.equal(p.coins,money+(decision==='sell'?120:0));assert.equal(p[decision==='sell'?'sold':decision==='gift'?'gifted':'cooked'],1);
 const q=reloaded(p),again=new FishingGame(q);const after=JSON.stringify(q);assert.equal(again.resolveKeptCatch('catch-1','sell'),false);assert.equal(again.resolveKeptCatch('catch-1','gift'),false);assert.equal(JSON.stringify(q),after);
});

test('net capacity failure retains the pending fish, and old overcapacity fish survive save and return',()=>{
 const p=landedFixture(150);p.keptFish=Array.from({length:100},(_,i)=>fish(i+1,'kept'));
 const q=reloaded(p),g=new FishingGame(q);assert.equal(q.keptFish.length,100);assert.equal(g.setContainer('bucket'),false);assert.equal(g.resolveCatch('catch-150','keep'),false);
 assert.equal(q.pending.id,'catch-150');assert.equal(q.keptFish.length,100);assert.equal(g.resolveCatch('catch-150','release'),true);
 assert.equal(g.returnHome(),true);assert.equal(q.keptFish.length,0);assert.equal(q.homeFish.length,100);
 const cash=q.coins;assert.equal(g.sellKeptFish(),true);assert.equal(q.coins,cash+12000);assert.equal(q.sold,100);assert.equal(g.sellKeptFish(),false);
 const again=new FishingGame(reloaded(q));assert.equal(again.resolveKeptCatch('catch-1','sell'),false);assert.equal(again.player.homeFish.length,0);
});

test('returning with a full net preserves the unresolved pending catch, then fits it without losing stored fish',()=>{
 const p=landedFixture(100);p.keptFish=Array.from({length:KEEP_CAPACITY.keepnet.count},(_,i)=>fish(i+1,'kept'));
 const g=new FishingGame(p),pending=structuredClone(p.pending);assert.equal(g.resolveCatch('catch-100','keep'),false);
 assert.equal(g.returnHome(),true);assert.deepEqual(p.pending,pending);assert.equal(p.keptFish.length,0);assert.equal(p.homeFish.length,KEEP_CAPACITY.keepnet.count);
 assert.equal(g.resolveCatch('catch-100','keep'),true);assert.equal(p.pending,null);assert.equal(p.keptFish.length,0);assert.equal(p.homeFish.length,KEEP_CAPACITY.keepnet.count+1);
 assert.equal(new Set(p.homeFish.map(f=>f.id)).size,p.homeFish.length);assert.equal(reloaded(p).homeFish.length,p.homeFish.length);
});

test('an oversized legacy pending fish cannot bypass container weight capacity by returning home first',()=>{
 const p=landedFixture();p.pending=fish(1,'landed',{weight:40,value:40000});p.keptFish=[fish(2,'kept')];p.serial=2;
 const g=new FishingGame(p);assert.equal(g.resolveCatch('catch-1','keep'),false);assert.equal(g.returnHome(),true);
 assert.equal(p.pending.id,'catch-1');assert.equal(p.pending.weight,40);assert.equal(p.homeFish.length,1);
 const before=structuredClone(p);assert.equal(g.resolveCatch('catch-1','keep'),false);assert.deepEqual(p,before);
 assert.equal(g.resolveCatch('catch-1','release'),true);assert.equal(p.pending,null);assert.equal(p.released,1);assert.equal(p.homeFish.length,1);
});

test('normal net limit uses both count and mass, with alternate handling that cannot silently remove fish',()=>{
 const p=landedFixture(100);p.container='bucket';p.keptFish=Array.from({length:KEEP_CAPACITY.bucket.count},(_,i)=>fish(i+1,'kept'));
 const g=new FishingGame(p);assert.equal(g.resolveCatch('catch-100','keep'),false);assert.equal(p.pending.id,'catch-100');assert.equal(p.keptFish.length,KEEP_CAPACITY.bucket.count);
 assert.equal(g.resolveKeptCatch('catch-1','release'),true);assert.equal(g.resolveCatch('catch-100','keep'),true);assert.equal(p.keptFish.length,KEEP_CAPACITY.bucket.count);
 assert.equal(new Set(p.keptFish.map(f=>f.id)).size,p.keptFish.length);assert.equal(p.released,1);
});

test('a bucket can be full by weight before its fish-count limit',()=>{
 const p=landedFixture(100);p.container='bucket';p.keptFish=Array.from({length:4},(_,i)=>fish(i+1,'kept',{fishId:'fish_07',weight:3,value:72000}));
 const g=new FishingGame(p);assert(p.keptFish.length<KEEP_CAPACITY.bucket.count);assert.equal(g.resolveCatch('catch-100','keep'),false);
 assert.equal(p.pending.id,'catch-100');assert.equal(p.keptFish.length,4);assert.equal(g.resolveKeptCatch('catch-1','release'),true);
 assert.equal(g.resolveCatch('catch-100','keep'),true);assert.equal(p.keptFish.length,4);assert.equal(p.keptFish.reduce((sum,f)=>sum+f.weight,0),9.3);
});

test('return transfer merges a matching replay uniquely and conflicts fail without changing player assets',()=>{
 const p=landedFixture();p.pending=null;p.keptFish=[fish(1,'kept')];p.homeFish=[fish(1,'home')];
 const g=new FishingGame(p),coins=p.coins;assert.equal(g.returnHome(),true);assert.equal(p.keptFish.length,0);assert.equal(p.homeFish.length,1);assert.equal(p.coins,coins);
 assert.equal(g.returnHome(),true);assert.equal(p.homeFish.length,1);assert.equal(p.coins,coins);
 const conflict=landedFixture();conflict.pending=null;conflict.keptFish=[fish(1,'kept')];conflict.homeFish=[fish(1,'home',{weight:.4})];
 const broken=new FishingGame(conflict),before=structuredClone(conflict);assert.equal(broken.returnHome(),false);assert.deepEqual(conflict,before);
});

test('ten tutorial lessons are completed by the real loop and claim exactly once after reload',()=>{
 const p=newPlayer();let now=p.systems.garden.lastAt;const g=new FishingGame(p,{seed:22,wallClock:()=>now});const initial=p.coins;
 assert.equal(g.claimTutorial('land'),false);assert(g.workGarden('feed','worms'));assert(g.workGarden('water','worms'));now+=12*GARDEN_HOUR;assert.equal(g.digWorms(),true);assert.equal(g.balance(),true);assert.equal(g.setCastTarget(.5,.65),true);land(g);
 const id=p.pending.id;assert.equal(g.resolveCatch(id,'keep'),true);assert.equal(g.returnHome(),true);assert.notEqual(p.systems.tutorial.home?.completed,true);
 assert.equal(g.resolveKeptCatch(id,'gift'),true);
 for(const lesson of STARTER_STEPS){assert.equal(p.systems.tutorial[lesson.id]?.completed,true,lesson.id);assert.equal(g.claimTutorial(lesson.id),true,lesson.id);}
 const reward=STARTER_STEPS.reduce((total,lesson)=>total+lesson.reward,0);assert.equal(p.coins,initial+reward);
 const q=reloaded(p),again=new FishingGame(q);for(const lesson of STARTER_STEPS)assert.equal(again.claimTutorial(lesson.id),false,lesson.id);
 assert.equal(q.coins,initial+reward);assert.equal(q.systems.transactions.filter(id=>id.startsWith('tutorial:')).length,10);
});

test('failed actions and false tutorial outcome payloads grant neither lesson completion nor reward',()=>{
 const p=newPlayer(),g=new FishingGame(p),coins=p.coins;assert.equal(g.equip('rod','missing'),false);assert.equal(g.selectSpot(999),false);assert.equal(g.setCastTarget(0,0),false);
 for(const [event,payload] of [['DEPARTURE_VALIDATED',{valid:false}],['BAIT_COLLECTED',{count:0}],['RIG_VALIDATED',{valid:false}],['FLOAT_CALIBRATED',{balanced:false}],['CAST_COMPLETED',{valid:false}],['BITE_RECOGNIZED',{success:false}],['FISH_LANDED',{success:false}],['FISH_STORED',{stored:false}],['TRIP_COMPLETED',{completed:true,returned:false,handled:true}]])g.event(event,payload);
 assert.deepEqual(p.systems.tutorial,{});for(const lesson of STARTER_STEPS)assert.equal(g.claimTutorial(lesson.id),false);assert.equal(p.coins,coins);
});

for(const feature of ['inventory','economy','bait','rig','tutorial','catch'])test(`disabling only ${feature} keeps a complete fishing loop playable`,()=>{
 const p=newPlayer();p.systems.flags[feature]=false;const g=new FishingGame(p,{seed:22});land(g);
 assert.equal(g.resolveCatch(p.pending.id,'keep'),true);assert.equal(g.returnHome(),true);assert.equal(g.sellKeptFish(),true);assert.equal(p.pending,null);assert.equal(p.keptFish.length,0);assert.equal(p.homeFish.length,0);
 assert.equal(p.sold,1);assert.equal(p.systems.flags[feature],false);assert.equal(reconcileInventory(p.systems.inventory,p),true);
 if(feature==='tutorial')assert.deepEqual(p.systems.tutorial,{});
});
