import test from 'node:test';
import assert from 'node:assert/strict';
import {BAGS,loadoutStats} from '../src/content.js';
import {FishingGame,NO_BITE_HINT} from '../src/engine.js';
import {newPlayer,validateSave} from '../src/save.js';
import {packingError,requiredPacking} from '../src/fishing-bag.js';

const snapshot=p=>JSON.stringify(p);
const tick=(g,seconds)=>{for(let i=0;i<seconds*10;i++)g.step(.1);};
const stocked=()=>{const p=newPlayer();p.coins=200000;p.rods.push('dai','spinning');p.accessories.push('leader12','leader16');p.baits.lure=1;return p;};
const quietGame=(p=newPlayer())=>{let notices=0;const g=new FishingGame(p,{seed:22,onChange:()=>{if(g.quietHint)notices++;}});g.fish=[];assert.ok(g.cast());g.snagScheduled=false;return {g,notices:()=>notices};};

test('Starter bag has one rod, two bait types and five accessories; stock stays at home',()=>{
 const p=newPlayer();assert.equal(p.bag,'cloth');assert.deepEqual(p.packing.rods,['bamboo']);assert.deepEqual(p.packing.baits,['worm','dough']);assert.equal(p.packing.accessories.length,5);
 assert.equal(p.baits.corn,6);assert.equal(p.packing.baits.includes('corn'),false);assert.equal(packingError(p),'');
 assert.deepEqual(BAGS.map(b=>[b.rods,b.baits,b.accessories]),[[1,2,5],[2,3,8],[3,5,12],[5,8,18]]);
});

test('Full-bag additions and required-item removal fail atomically without losing owned stock',()=>{
 const p=stocked(),g=new FishingGame(p),before=snapshot(p);
 for(const [kind,id,include] of [['rods','dai',true],['baits','corn',true],['accessories','leader12',true],['rods','bamboo',false],['accessories','net_basic',false],['baits','worm',false],['accessories','missing',true]]){
  assert.equal(g.packItem(kind,id,include),false);assert.equal(snapshot(p),before);
 }
 assert.ok(g.packItem('accessories','reel_basic',false));assert.ok(g.packItem('accessories','leader12',true));assert.equal(p.packing.accessories.length,5);
 assert.ok(p.accessories.includes('reel_basic'));const packed=snapshot(p);assert.equal(g.packItem('accessories','leader12',true),false);assert.equal(snapshot(p),packed);
});

test('Bag purchases charge once; upgrades allow spares and smaller bags reject overflow',()=>{
 const p=stocked(),g=new FishingGame(p),coins=p.coins;
 assert.ok(g.buy('bag','canvas'));assert.equal(p.coins,coins-9000);let before=snapshot(p);
 for(const id of ['canvas','missing']){assert.equal(g.buy('bag',id),false);assert.equal(snapshot(p),before);}
 assert.ok(g.equipBag('canvas'));assert.ok(g.packItem('rods','dai',true));assert.ok(g.packItem('baits','corn',true));assert.ok(g.packItem('accessories','leader12',true));
 before=snapshot(p);assert.equal(g.equipBag('cloth'),false);assert.match(g.message,/chỉ mang được/);assert.equal(snapshot(p),before);
 assert.ok(g.packItem('rods','dai',false));assert.ok(g.packItem('baits','corn',false));assert.ok(g.packItem('accessories','reel_basic',false));assert.ok(g.equipBag('cloth'));assert.equal(packingError(p),'');
 p.coins=0;before=snapshot(p);assert.equal(g.buy('bag','waterproof'),false);assert.equal(snapshot(p),before);
});

test('Old saves gain a cloth bag that contains active gear without deleting progress or ownership',()=>{
 const old=stocked();delete old.bags;delete old.bag;delete old.packing;old.rod='dai';old.bait='corn';old.equipment.line='leader16';old.catches=12;old.serial=12;old.collection.fish_01={count:12,best:.8};
 const p=validateSave(old);assert.equal(p.bag,'cloth');assert.deepEqual(p.packing.rods,['dai']);assert.equal(p.packing.baits[0],'corn');assert.ok(p.packing.accessories.includes('leader16'));
 for(const key of ['coins','baits','rods','accessories','equipment','catches','collection','serial'])assert.deepEqual(p[key],old[key]);assert.equal(packingError(p),'');assert.deepEqual(validateSave(p),p);
});

test('Corrupt and oversized packing is sanitized; unpacked owned items survive reload',()=>{
 const raw=stocked();raw.bags=['cloth','canvas','missing','canvas'];raw.bag='missing';raw.packing={rods:['missing','dai','dai','spinning'],baits:['corn','dough','lure','missing'],accessories:[...raw.accessories,'missing']};
 const p=validateSave(raw);assert.deepEqual(p.bags,['cloth','canvas']);assert.equal(p.bag,'cloth');assert.equal(packingError(p),'');assert.deepEqual(p.packing.rods,['bamboo']);assert.equal(p.packing.baits.length,2);assert.equal(p.packing.accessories.length,5);
 assert.deepEqual(p.rods,raw.rods);assert.deepEqual(p.accessories,raw.accessories);assert.deepEqual(p.baits,raw.baits);
});

test('Changing the home loadout packs its active replacements within the cloth bag',()=>{
 const p=stocked(),g=new FishingGame(p);
 assert.ok(g.equip('rod','dai'));assert.deepEqual(p.packing.rods,['dai']);assert.ok(g.equip('bait','corn'));assert.ok(p.packing.baits.includes('corn'));assert.equal(p.packing.baits.length,2);
 assert.ok(g.equip('line','leader12'));assert.ok(p.packing.accessories.includes('leader12'));assert.equal(p.packing.accessories.length,5);assert.ok(p.accessories.includes('line_basic'));assert.equal(packingError(p),'');
});

test('At the water only packed items can be used; packing and buying wait until returning',()=>{
 const p=stocked(),g=new FishingGame(p);assert.ok(g.packItem('accessories','reel_basic',false));assert.ok(g.packItem('accessories','leader12',true));assert.ok(g.startTrip());let before=snapshot(p);
 for(const action of [()=>g.equip('rod','dai'),()=>g.equip('bait','corn'),()=>g.equip('line','leader16'),()=>g.packItem('baits','corn',true),()=>g.equipBag('cloth'),()=>g.buy('bag','canvas'),()=>g.digWorms()]){assert.equal(action(),false);assert.equal(snapshot(p),before);}
 assert.ok(g.equip('bait','dough'));assert.ok(g.equip('line','leader12'));assert.equal(packingError(p),'');g.endTrip();assert.ok(g.equip('rod','dai'));assert.ok(g.buy('bag','canvas'));
});

test('A spare rod needs carried compatible bait and all required accessories',()=>{
 const p=stocked(),g=new FishingGame(p);assert.ok(g.buy('bag','canvas'));assert.ok(g.equipBag('canvas'));assert.ok(g.packItem('rods','spinning',true));assert.ok(g.startTrip());let before=snapshot(p);
 assert.equal(g.equip('rod','spinning'),false);assert.match(g.message,/mồi phù hợp/);assert.equal(snapshot(p),before);g.endTrip();assert.ok(g.packItem('baits','lure',true));assert.ok(g.packItem('accessories','reel_basic',false));assert.ok(g.startTrip());before=snapshot(p);
 assert.equal(g.equip('rod','spinning'),false);assert.equal(snapshot(p),before);g.endTrip();assert.ok(g.packItem('accessories','reel_basic',true));assert.ok(g.startTrip());assert.ok(g.equip('rod','spinning'));assert.equal(p.bait,'lure');assert.equal(packingError(p),'');
});

test('Missing active gear blocks departure and casts before any bait or cast is spent',()=>{
 const p=newPlayer(),g=new FishingGame(p);p.packing.accessories=p.packing.accessories.filter(id=>id!=='net_basic');let before=snapshot(p);
 assert.equal(g.startTrip(),false);assert.equal(g.tripActive,false);assert.equal(snapshot(p),before);g.tripActive=true;assert.equal(g.cast(),false);assert.equal(snapshot(p),before);
 p.packing.accessories=requiredPacking(p).accessories;p.baits.worm=0;assert.match(g.tripError(),/đã hết/);
});

test('Last active bait portion can be replaced by carried bait without replenishing from home',()=>{
 const p=newPlayer();p.baits.worm=1;const g=new FishingGame(p);assert.ok(g.startTrip());assert.ok(g.cast());g.retrieve();assert.equal(p.baits.worm,0);assert.ok(g.equip('bait','dough'));assert.deepEqual(p.packing.baits,['dough']);assert.equal(g.equip('bait','corn'),false);assert.equal(p.baits.corn,6);assert.equal(packingError(p),'');assert.deepEqual(validateSave(p),p);
});

test('No-bite advice is nonterminal, offered once per cast, and waiting spends no extra bait',()=>{
 const {g,notices}=quietGame(),p=g.player;tick(g,60);assert.equal(g.phase,'waiting');assert.equal(g.quietHint,true);assert.equal(g.message,NO_BITE_HINT);assert.equal(notices(),1);assert.equal(p.casts,1);assert.equal(p.baits.worm,17);
 const wait=g.wait;assert.ok(g.dismissQuietHint());tick(g,60);assert.equal(g.phase,'waiting');assert(g.wait>wait);assert.equal(g.quietHint,false);assert.equal(notices(),1);assert.equal(p.baits.worm,17);
 g.retrieve();assert.ok(g.cast());g.snagScheduled=false;tick(g,40);assert.equal(g.quietHint,true);assert.equal(notices(),2);assert.equal(p.casts,2);assert.equal(p.baits.worm,16);
});

test('Fish can arrive after advice and bite on the original cast',()=>{
 const p=newPlayer(),g=new FishingGame(p,{seed:22}),fish=g.fish.find(f=>g.eligible(f));assert.ok(fish);g.fish=[];assert.ok(g.cast());g.snagScheduled=false;tick(g,45);assert.equal(g.quietHint,true);
 fish.x=g.baitPoint.x;fish.y=g.baitPoint.y;g.fish=[fish];g.step(.1);assert.equal(g.phase,'nibble');assert.equal(g.target,fish);assert.equal(g.quietHint,false);tick(g,2.5);assert.equal(g.phase,'bite');assert.equal(p.casts,1);assert.equal(p.baits.worm,17);
});

test('Resting lure receives advice and thinner leader affects approach with a strength tradeoff',()=>{
 const p=stocked(),g=new FishingGame(p);assert.ok(g.equip('rod','spinning'));const {g:lure}=quietGame(p);tick(lure,40);assert.equal(lure.phase,'waiting');assert.equal(lure.retrieving,false);assert.equal(lure.quietHint,true);assert.equal(p.baits.lure,1);
 const base=newPlayer(),thin=stocked();thin.equipment.line='leader12';const a=loadoutStats(base),b=loadoutStats(thin);assert.equal(a.leaderDiameter,.20);assert.equal(b.leaderDiameter,.12);assert(b.baitApproach>a.baitApproach);assert(b.power<a.power);assert(b.breakGrace<a.breakGrace);
 const travel=player=>{const game=new FishingGame(player,{seed:22}),fish=game.fish.find(f=>game.eligible(f));game.fish=[fish];game.cast();game.snagScheduled=false;fish.x=game.baitPoint.x+.1;fish.y=game.baitPoint.y;for(let i=0;i<200&&game.phase!=='nibble';i++)game.step(.1);assert.equal(game.phase,'nibble');return game.wait;};assert(travel(thin)<travel(base));
});
