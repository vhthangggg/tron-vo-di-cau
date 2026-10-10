import {guideFish,freeSnag} from './control-player.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {stat,readFile} from 'node:fs/promises';
import {MAPS,FISH,RODS,BAITS,ACCESSORIES,TECHNIQUES,loadoutStats,usesFloat,acceptsBait} from '../src/content.js';
import {FishingGame,floatMarks,balancedLead} from '../src/engine.js';
import {newPlayer,validateSave} from '../src/save.js';
const tickUntil=(g,predicate,max=60)=>{for(let i=0;i<max*10;i++){freeSnag(g);g.step(.1);if(predicate())return;}assert.fail(g.message+' / '+g.phase);};
const fullPlayer=()=>{const p=newPlayer();p.coins=10000000;p.maps=MAPS.map(m=>m.id);p.rods=RODS.map(r=>r.id);p.accessories=ACCESSORIES.map(a=>a.id);p.baits=Object.fromEntries(BAITS.map(b=>[b.id,b.reusable?1:100]));p.systems.inventory=null;return p;};
const bite=g=>{assert.ok(g.cast());if(g.rod.tech==='lure')g.toggleRetrieve();tickUntil(g,()=>g.phase==='bite');};

test('All 10 maps have unique packaged landscape art and valid playable content',async()=>{
 assert.equal(MAPS.length,10);assert.equal(FISH.length,56);assert.equal(RODS.length,36);assert.equal(new Set(RODS.map(r=>r.id)).size,RODS.length);assert.equal(BAITS.length,27); // 15 legacy baits (including 3 for old saves) + 12 new catalog lures
 // New equipment is additive: validate the original IDs instead of freezing the catalog size.
 const legacyAccessories={line:['line_basic','line18','fluoro','braid'],hook:['hook_basic','hook_barb','hook_wide','hook_pro'],float:['float_basic','float_canal','float_slender','float_sea'],reel:['reel_basic','reel2000','reel4000','reel6000'],net:['net_basic','net_fold','net_long','net_pro']};
 assert.equal(new Set(ACCESSORIES.map(a=>a.id)).size,ACCESSORIES.length,'Accessory IDs must remain unique');
 for(const [slot,ids] of Object.entries(legacyAccessories))for(const id of ids)assert.equal(ACCESSORIES.find(a=>a.id===id)?.slot,slot,`Legacy accessory ${id} must retain its slot`);
 assert.equal(new Set(MAPS.map(m=>m.background)).size,10);
 for(const m of MAPS){const file=new URL('../'+m.background,import.meta.url);assert((await stat(file)).size>10000);const bytes=await readFile(file);assert.ok(bytes.toString('ascii',8,12)==='WEBP'||bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Valid PNG/WebP landscape');assert.equal(m.spots.length,m.id==='AO'?2:3);assert(FISH.some(f=>f.maps.includes(m.id)));assert(m.spots.every(s=>s.depth<=m.maxDepth));}
 for(const f of FISH){assert(f.maps.every(id=>MAPS.some(m=>m.id===id)),f.id);assert(f.baits.every(id=>BAITS.some(b=>b.id===id)),f.id);assert(f.tech.every(t=>TECHNIQUES[t]),f.id);assert(f.max>=f.min);}
});

test('Old v0.1 save migrates without losing money, owned gear, catch or pending sale',()=>{
 const old={version:1,coins:43210,baits:{worm:7,dough:5,corn:1,cloudbait:4},rods:['bamboo','rod_02'],maps:['AO','HO'],rod:'rod_02',bait:'lure',map:'HO',rig:{depth:2.6,lead:1.08},catches:8,released:3,sold:4,casts:25,collection:{fish_04:{count:2,best:1.92}},lessons:['signal'],serial:8,pending:{id:'catch-8',fishId:'fish_04',weight:1.92,value:92160,mapId:'HO'},settings:{assist:false,sound:false,deadline:300}};
 const p=validateSave(old);for(const key of ['coins','catches','released','sold','casts','rod','map','collection','lessons'])assert.deepEqual(p[key],old[key]);
 assert.deepEqual(p.settings,{...old.settings,music:.45,effects:.7});assert.equal(p.gifted,0);assert.deepEqual(p.keptFish,[]);
 assert.deepEqual(p.pending,{...old.pending,status:'landed'});assert.equal(p.baits.lure,1);assert.equal(p.baits.shrimp,0);assert.equal(p.accessories.length,5);assert.equal(p.equipment.line,'line_basic');
 const g=new FishingGame(p);assert.ok(g.resolveCatch('catch-8','keep'));assert.ok(g.resolveKeptCatch('catch-8','sell'));assert.equal(p.coins,old.coins+92160);assert.equal(g.resolveCatch('catch-8','sell'),false);
});

test('Accessory purchases/equips reject invalid, unaffordable, duplicate and mid-cast actions atomically',()=>{
 const p=newPlayer(),g=new FishingGame(p,{seed:11});let snapshot=JSON.stringify(p);
 assert.equal(g.buy('accessory','missing'),false);assert.equal(g.buy('accessory','braid'),false);assert.equal(g.equip('line','braid'),false);assert.equal(JSON.stringify(p),snapshot);
 assert.ok(g.buy('accessory','line18'));assert.equal(p.coins,6000);assert.ok(g.equip('line','line18'));assert.equal(p.equipment.line,'line18');snapshot=JSON.stringify(p);
 assert.equal(g.buy('accessory','line18'),false);assert.equal(g.equip('hook','line18'),false);assert.equal(JSON.stringify(p),snapshot);
 assert.ok(g.cast());snapshot=JSON.stringify(p);assert.equal(g.buy('accessory','hook_barb'),false);assert.equal(g.equip('line','line_basic'),false);assert.equal(g.setRig('depth',1),false);assert.equal(g.balance(),false);assert.equal(JSON.stringify(p),snapshot);
 g.retrieve();assert.equal(g.equip('line','line_basic'),false);assert.ok(g.returnHome());assert.ok(g.equip('line','line_basic'));assert.equal(p.coins,6000);
});

test('Reusable purchased lures consume one purchase and zero portions across casts and reload',()=>{
 const p=newPlayer();p.coins=100000;const g=new FishingGame(p);assert.ok(g.buy('rod','rod_02'));assert.equal(p.baits.lure,1);assert.ok(g.buy('bait','crank'));const coins=p.coins;
 assert.equal(g.buy('bait','crank'),false);assert.equal(p.coins,coins);assert.ok(g.equip('rod','rod_02'));assert.ok(g.equip('bait','crank'));
 for(let i=0;i<3;i++){assert.ok(g.cast());g.retrieve();assert.equal(p.baits.crank,1);}
 const restored=validateSave(p);assert.equal(restored.bait,'crank');assert.equal(restored.baits.crank,1);assert.equal(restored.coins,coins);
});

test('Float capacity balances automatically, reel works only on compatible rods, upgraded gear survives reload',()=>{
 const p=fullPlayer(),g=new FishingGame(p);assert.ok(g.equip('float','float_sea'));assert.equal(floatMarks(p),4);assert(p.rig.lead>1.8);
 assert.equal(g.equip('reel','reel6000'),false);const handPower=loadoutStats(p).power;
 assert.ok(g.equip('rod','rod_13'));assert.ok(g.equip('reel','reel6000'));assert(loadoutStats(p).power>handPower);
 assert.ok(g.equip('line','braid'));assert.ok(g.equip('hook','hook_pro'));assert.ok(g.equip('net','net_pro'));
 const restored=validateSave(p);assert.deepEqual(restored.equipment,p.equipment);assert.deepEqual(new Set(restored.accessories),new Set(p.accessories));assert.equal(floatMarks(restored),4);
 assert.ok(g.equip('rod','rod_28'));assert.equal(g.equip('float','float_basic'),false);assert.equal(floatMarks(p),0);assert.ok(g.setRig('depth',2.6));assert.equal(g.setRig('depth',99),false);
});

test('Better hooks extend the actual bite window and an equipped net finishes the fight early',()=>{
 const make=upgraded=>{const p=fullPlayer();if(upgraded){p.equipment.hook='hook_pro';p.equipment.net='net_pro';}return new FishingGame(p,{seed:44});};
 const base=make(false),up=make(true);bite(base);bite(up);
 for(let i=0;i<30;i++){base.step(.1);up.step(.1);}assert.equal(base.phase,'failed');assert.equal(up.phase,'bite');assert.ok(up.strike());
 up.energy=14;up.pulling=false;up.step(.1);assert.equal(up.phase,'landed');assert.ok(up.player.pending);
});

test('Upgraded line, reel and float improve the simulated fight against current',()=>{
 const run=upgraded=>{const p=fullPlayer();p.map='GHE';p.rod='rod_13';p.bait='shrimp';p.rig.depth=2.4;if(upgraded){p.equipment.line='braid';p.equipment.reel='reel6000';p.equipment.float='float_sea';}p.rig.lead=balancedLead(p);
 const g=new FishingGame(p,{seed:7});bite(g);assert.ok(g.holdRod());g.hooked.weight=8;g.nextSurge=100;g.setPulling(true);for(let i=0;i<50;i++){g.setTracking(true,g.fishPosition.x,g.fishPosition.y);g.step(.1);}return g;};
 const base=run(false),up=run(true);assert.equal(base.phase,'fight');assert.equal(up.phase,'fight');assert(up.energy<base.energy,'Faster reel should drain more energy');assert(up.tension<base.tension,'Stronger line and stable float should reduce tension');
});

test('Every species is reachable with matching bait, technique and depth, and can land at maximum weight',()=>{
 for(const def of FISH){
  const p=fullPlayer();p.map=def.maps[0];const rod=RODS.filter(r=>def.tech.includes(r.tech)).sort((a,b)=>b.power-a.power)[0];
  p.rod=rod.id;p.bait=def.baits.find(id=>acceptsBait(rod,BAITS.find(b=>b.id===id)));assert.ok(p.bait,def.id+' bait');
  p.equipment.line='braid';p.equipment.hook='hook_pro';p.equipment.net='net_pro';if(TECHNIQUES[rod.tech].reel)p.equipment.reel='reel6000';if(usesFloat(rod))p.equipment.float='float_sea';p.rig.lead=balancedLead(p);
  const g=new FishingGame(p,{seed:123});const spotIndex=g.map.spots.length-1;g.selectSpot(spotIndex);const target=g.fish.find(f=>f.fishId===def.id&&f.spot===spotIndex);assert.ok(target,def.id+' exists');p.rig.depth=target.depth;
  // A deterministic isolated-population fixture validates each catalog entry through the real simulation.
  g.fish=[target];target.weight=def.max;assert.ok(g.eligible(target),def.id+' reachable');bite(g);assert.equal(g.target.id,target.id);assert.ok(g.holdRod());
  tickUntil(g,()=>{guideFish(g);return g.phase==='landed';},120);
  assert.equal(p.pending.fishId,def.id);assert.equal(p.pending.weight,def.max);assert.equal(validateSave(p).pending.weight,def.max);assert.equal(p.collection[def.id].best,def.max);
  assert.ok(g.resolveCatch(p.pending.id,'release'));
 }
});
