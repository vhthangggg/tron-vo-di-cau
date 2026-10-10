import test from 'node:test';
import assert from 'node:assert/strict';
import {FishingGame,NO_BITE_HINT} from '../src/engine.js';
import {newPlayer,validateSave} from '../src/save.js';
import {BAG_TYPES,inventoryFor,reconcileInventory,validateDeparture} from '../src/inventory.js';
import {renderFieldKit,renderPrepare} from '../src/ui.js';
const tick=(g,seconds)=>{for(let i=0;i<seconds*10;i++)g.step(.1);};
const quietGame=(p=newPlayer())=>{let notices=0;const g=new FishingGame(p,{seed:22,onChange:()=>{if(g.quietHint)notices++;}});g.fish=[];assert.ok(g.cast());g.snagScheduled=false;return {g,notices:()=>notices};};

test('Starter bag carries one rod and two bait types; surplus remains at home',()=>{
 const p=newPlayer(),inv=inventoryFor(p);assert.equal(inv.bagId,'cloth');assert.deepEqual(inv.carried.rods,['bamboo']);assert.equal(Object.values(inv.carried.baits).filter(n=>n>0).length,2);assert.equal(inv.stored.baits.corn,6);assert(validateDeparture(p).ok);assert(reconcileInventory(inv,p));
 assert.deepEqual(Object.values(BAG_TYPES).map(b=>b.rods),[1,2,3,5]);
});
test('Paid bags and carried gear from PR3 saves migrate without loss or downgrade',()=>{
 for(const [oldId,newId,rodCount] of [['canvas','standard',2],['waterproof','specialist',3],['expedition','large',5]]){
  const raw=newPlayer();delete raw.systems;delete raw.schemaVersion;raw.coins=12345;raw.bags=['cloth',oldId];raw.bag=oldId;raw.rods=['bamboo','rod_01','rod_02','rod_23','rod_28'];raw.baits.lure=1;raw.packing={rods:raw.rods.slice(0,rodCount),baits:['worm','dough'],accessories:[...raw.accessories]};raw.catches=7;raw.serial=7;raw.collection.fish_01={count:7,best:1};
  const p=validateSave(raw),inv=inventoryFor(p);assert(p.systems.bags.includes(newId));assert.equal(inv.bagId,newId);assert.deepEqual(inv.carried.rods,raw.packing.rods);
  for(const key of ['coins','rods','baits','accessories','equipment','catches','serial','collection'])assert.deepEqual(p[key],raw[key]);assert(reconcileInventory(inv,p));assert.deepEqual(validateSave(p),p);
 }
});
test('Tampered legacy packing is repaired while every owned item remains available',()=>{
 const raw=newPlayer();delete raw.systems;raw.bags=['cloth','canvas','bad'];raw.bag='bad';raw.rods.push('rod_01');raw.packing={rods:['missing','rod_01','rod_01'],baits:['corn','dough','worm'],accessories:['missing']};
 const p=validateSave(raw),inv=inventoryFor(p);assert.equal(inv.bagId,'cloth');assert(inv.carried.rods.includes('bamboo'));assert.deepEqual(p.rods,raw.rods);assert.deepEqual(p.baits,raw.baits);assert(reconcileInventory(inv,p));assert(validateDeparture(p).ok);
});
test('Bag upgrades charge once and smaller bag rejects overflow without losing stock',()=>{
 const p=newPlayer();p.coins=50000;p.rods.push('rod_01');const g=new FishingGame(p);assert(g.buy('bag','standard'));assert.equal(p.coins,36000);assert.equal(g.buy('bag','standard'),false);assert.equal(p.coins,36000);assert(g.selectBag('standard'));assert(g.moveGear('rods','rod_01','carried'));assert(g.moveBait('corn',3,'carried'));
 const before=JSON.stringify(p);assert.equal(g.selectBag('cloth'),false);assert.equal(JSON.stringify(p),before);assert(reconcileInventory(inventoryFor(p),p));
});
test('At the bank stored items cannot be equipped, bought or transferred',()=>{
 const p=newPlayer();p.coins=50000;p.rods.push('rod_01');const g=new FishingGame(p);assert(g.beginTrip());
 for(const action of [()=>g.equip('rod','rod_01'),()=>g.equip('bait','corn'),()=>g.buy('bag','standard'),()=>g.moveBait('corn',1,'carried'),()=>g.selectBag('cloth')]){const before=JSON.stringify(p);assert.equal(action(),false);assert.equal(JSON.stringify(p),before);}
 assert(g.equip('bait','dough'));assert(g.returnHome());assert(g.equip('rod','rod_01'));assert(validateDeparture(p).ok);
});
test('A carried lure rod cannot replace the active rod until compatible bait is carried',()=>{
 const p=newPlayer();p.coins=50000;p.rods.push('rod_02');p.baits.lure=1;const g=new FishingGame(p);assert(g.buy('bag','standard'));assert(g.selectBag('standard'));assert(g.moveGear('rods','rod_02','carried'));assert(g.beginTrip());
 const before=JSON.stringify(p);assert.equal(g.equip('rod','rod_02'),false);assert.equal(JSON.stringify(p),before);assert(g.returnHome());assert(g.moveBait('lure',1,'carried'));assert(g.beginTrip());assert(g.equip('rod','rod_02'));assert.equal(p.bait,'lure');assert(validateDeparture(p).ok);
});
test('Quiet advice is nonterminal, once per cast, and intact bait survives waiting and recasts',()=>{
 const {g,notices}=quietGame(),p=g.player;tick(g,60);assert.equal(g.phase,'waiting');assert(g.quietHint);assert.equal(g.message,NO_BITE_HINT);assert.equal(notices(),1);assert.equal(p.casts,1);assert.equal(p.baits.worm,18);const mount=p.systems.mountedBait.mountId;
 const wait=g.wait;assert(g.dismissQuietHint());tick(g,60);assert(g.wait>wait);assert.equal(g.quietHint,false);assert.equal(notices(),1);assert.equal(p.baits.worm,18);
 g.retrieve();assert(g.cast());g.snagScheduled=false;tick(g,40);assert(g.quietHint);assert.equal(notices(),2);assert.equal(p.casts,2);assert.equal(p.baits.worm,18);assert.equal(p.systems.mountedBait.mountId,mount);
});
test('Fish can arrive after quiet advice and bite on the original mounted bait',()=>{
 const p=newPlayer(),g=new FishingGame(p,{seed:22}),fish=g.fish.find(f=>g.eligible(f));assert(fish);g.fish=[];assert(g.cast());g.snagScheduled=false;tick(g,45);assert(g.quietHint);
 fish.x=g.baitPoint.x;fish.y=g.baitPoint.y;g.fish=[fish];g.step(.1);assert.equal(g.phase,'nibble');assert.equal(g.target,fish);assert.equal(g.quietHint,false);tick(g,2.5);assert.equal(g.phase,'bite');assert.equal(p.casts,1);assert.equal(p.baits.worm,18);
});
test('A stationary lure receives advice without forced reeling or losing reusable bait',()=>{
 const p=newPlayer();p.coins=100000;const setup=new FishingGame(p);assert(setup.buy('rod','rod_02'));assert(setup.equip('rod','rod_02'));const {g}=quietGame(p);tick(g,40);assert.equal(g.phase,'waiting');assert.equal(g.retrieving,false);assert(g.quietHint);assert.equal(p.baits.lure,1);
});
test('Field advice and prepare UI read the canonical bag and offer thinner leader adjustments',()=>{
 const p=newPlayer(),g=new FishingGame(p);assert.match(renderPrepare(p,g,''),/BAO ĐỰNG ĐỒ CÂU/);assert.match(renderFieldKit(p,g,'baits'),/data-field-id="dough"/);assert.match(renderFieldKit(p,g,'line'),/data-field-kind="leaderMm"/);
 const power=g.stats.power,approach=g.stats.baitApproach;assert(g.setRig('leaderMm',.12));assert(g.stats.power<power);assert(g.stats.baitApproach>approach);
});
