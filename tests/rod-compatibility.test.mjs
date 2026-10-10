import test from 'node:test';
import assert from 'node:assert/strict';
import {RODS,ALL_RODS,getRod} from '../src/content.js';
import {LEGACY_RODS} from '../src/legacy-rods.js';
import {newPlayer,validateSave,savePlayer,loadPlayer} from '../src/save.js';
import {ensureInventory,reconcileInventory} from '../src/inventory.js';
import {validateRig} from '../src/equipment.js';
import {FishingGame} from '../src/engine.js';
import {renderShop,renderRig} from '../src/ui.js';

test('all retired rods survive reload with their equipped technique, durability and saved rig',()=>{
 for(const rod of LEGACY_RODS){
  const p=newPlayer();p.coins=987654;p.rods.push(rod.id);p.rod=rod.id;
  p.bait=rod.tech==='lure'?'lure':'worm';if(p.bait==='lure')p.baits.lure=1;
  p.systems.inventory=null;ensureInventory(p);
  p.systems.gearInstances.find(x=>x.definitionId===rod.id).durability=37;
  p.systems.rigPresets=[{id:'old-rig',name:'Bộ đã lưu',rod:rod.id,bait:p.bait,equipment:{...p.equipment},rig:{...p.rig}}];
  p.rods.push('unknown-rod');
  const bytes=new Map(),storage={getItem:k=>bytes.get(k),setItem:(k,v)=>bytes.set(k,v)};
  assert.equal(savePlayer(storage,p),true);
  const q=loadPlayer(storage).player;
  assert.equal(q.coins,987654);assert.deepEqual(q.rods,['bamboo',rod.id]);
  assert.equal(q.rod,rod.id);assert.equal(getRod(q.rod).tech,rod.tech);
  assert.equal(getRod(q.rod).power,rod.power);
  assert.equal(q.systems.gearInstances.find(x=>x.definitionId===rod.id).durability,37);
  assert.equal(q.systems.rigPresets[0].rod,rod.id);
  assert.equal(q.systems.inventory.carried.rods.includes(rod.id),true);
  assert.equal(reconcileInventory(q.systems.inventory,q),true);
  assert.equal(validateRig(q).ok,true);
  const html=renderRig(q,new FishingGame(q));
  assert.ok(html.includes(`value="${rod.id}" selected`));
 }
});

test('shop exposes 36 new rods while retired gear stays available only in owned equipment',()=>{
 const html=renderShop(newPlayer());
 assert.match(html,/36 cần/);
 for(const rod of RODS)assert.ok(html.includes(rod.name));
 for(const rod of LEGACY_RODS)assert.ok(!html.includes(`data-id="${rod.id}"`));
 assert.equal(new Set(ALL_RODS.map(r=>r.id)).size,ALL_RODS.length);
});

test('a newly purchased Rice Fishing rod retains its identity and home storage on reload',()=>{
 const p=newPlayer();p.coins=200000;const game=new FishingGame(p);
 assert.equal(game.buy('rod','rod_35'),true);
 const q=validateSave(JSON.parse(JSON.stringify(p)));
 assert.equal(q.coins,82000);assert.ok(q.rods.includes('rod_35'));
 assert.ok(q.systems.inventory.stored.rods.includes('rod_35'));
 assert.equal(getRod('rod_35').asset,'/assets/items/rods/rod_35.webp');
 assert.equal(getRod('rod_34').asset,'/assets/items/rods/rod_34.webp');
});
