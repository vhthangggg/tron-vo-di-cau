import test from 'node:test';
import assert from 'node:assert/strict';
import {makeInventory,validateBag,transferBait} from '../src/inventory.js';
import {transact} from '../src/economy.js';
import {mountBait,resolveBait,digWorms} from '../src/bait-system.js';
import {keepCatch,disposeCatch} from '../src/catch-inventory.js';
import {advanceTutorial,claimTutorial} from '../src/tutorial.js';
test('starter bag capacity and ownership',()=>{const i=makeInventory(),owned={rods:['bamboo'],accessories:[],baits:{worm:18}};assert.equal(validateBag(i,owned).ok,true);i.carried.rods.push('dai');assert.equal(validateBag(i,owned).ok,false);});
test('bait transfer rejects missing source',()=>{const i=makeInventory(),owned={rods:['bamboo'],accessories:[],baits:{worm:18}};assert.equal(transferBait(i,owned,'worm',1),null);});
test('transaction cannot replay or overdraft',()=>{const w={balance:100,applied:[]},r=transact(w,'purchase-1',{delta:-80});assert.equal(r.ok,true);assert.equal(transact(r.wallet,'purchase-1',{delta:-80}).reason,'duplicate');assert.equal(transact(r.wallet,'purchase-2',{delta:-80}).reason,'funds');});
test('bait survives retrieval and is consumed once on loss',()=>{const s={worm:2},m=mountBait(s,'worm');assert.equal(resolveBait(s,m,'retrieved').stock.worm,2);const lost=resolveBait(s,m,'lost');assert.equal(lost.stock.worm,1);assert.equal(digWorms({worm:59}).worm,60);});
test('fish cannot be kept twice or disposed twice',()=>{const f={id:'catch-1',weight:2},r=keepCatch([],f);assert.equal(r.ok,true);assert.equal(keepCatch(r.catches,f).ok,false);const d=disposeCatch(r.catches,f.id,'sell');assert.equal(d.ok,true);assert.equal(disposeCatch(d.catches,f.id,'gift').ok,false);});
test('tutorial reward claimed once',()=>{const p=advanceTutorial({},'BAIT_COLLECTED');const r=claimTutorial(p,'bait');assert.equal(r.ok,true);assert.equal(claimTutorial(r.progress,'bait').ok,false);});

import {newPlayer,validateSave} from '../src/save.js';
test('legacy player survives optional systems roundtrip',()=>{
 const old=newPlayer();old.coins=99871;old.baits.worm=17;old.lessons=['signal'];
 const restored=validateSave(JSON.parse(JSON.stringify(old)));
 assert.equal(restored.coins,99871);assert.equal(restored.baits.worm,17);assert.deepEqual(restored.lessons,['signal']);
 assert.deepEqual(restored.systems.tutorial,{});
});
test('tutorial completion survives reload without repeat reward',()=>{
 const p=newPlayer();p.systems.tutorial=advanceTutorial({},'FISH_STORED');
 const first=claimTutorial(p.systems.tutorial,'keep');
 assert.equal(first.ok,true);p.systems.tutorial=first.progress;
 const reloaded=validateSave(JSON.parse(JSON.stringify(p)));
 assert.equal(claimTutorial(reloaded.systems.tutorial,'keep').ok,false);
});
test('malformed optional systems never discards legacy wallet',()=>{
 const p=newPlayer();p.coins=43500;p.systems={inventory:{bagId:'missing'},tutorial:{},transactions:[]};
 const q=validateSave(p);assert.equal(q.coins,43500);assert.equal(q.systems.inventory?.bagId,'cloth');
});

test('legacy gear projects into bag and storage without losing ownership',async()=>{
 const {inventoryFromLegacy,reconcileInventory}=await import('../src/inventory.js');
 const p=newPlayer();p.rods.push('dai');p.baits.worm=17;p.baits.dough=9;
 const inv=inventoryFromLegacy(p);
 assert.ok(inv);assert.equal(inv.carried.rods.length,1);assert.ok(inv.stored.rods.includes('dai'));
 assert.equal(reconcileInventory(inv,p),true);
 const restored=validateSave({...p,systems:{inventory:inv,tutorial:{},transactions:[]}});
 assert.equal(reconcileInventory(restored.systems.inventory,restored),true);
});
test('tampered inventory cannot erase stored equipment on reload',()=>{
 const p=newPlayer();p.rods.push('dai');
 const q=validateSave({...p,systems:{inventory:{bagId:'cloth',carried:{rods:['bamboo'],baits:{worm:18},accessories:[]},stored:{rods:[],baits:{},accessories:[]}},tutorial:{},transactions:[]}});
 assert.ok(q.rods.includes('dai'));assert.ok(q.systems.inventory.stored.rods.includes('dai'));
});

test('rod transfers enforce capacity and retain ownership',async()=>{
 const {inventoryFromLegacy,transferGear,reconcileInventory}=await import('../src/inventory.js');
 const p=newPlayer();p.rods.push('dai');const inv=inventoryFromLegacy(p);
 const owned={rods:p.rods,accessories:p.accessories,baits:p.baits};
 assert.equal(transferGear(inv,owned,'rods','dai','carried'),null);
 const stowed=transferGear(inv,owned,'rods','bamboo','stored');
 assert.ok(stowed);const moved=transferGear(stowed,owned,'rods','dai','carried');
 assert.ok(moved);assert.equal(reconcileInventory(moved,p),true);
});
test('bag summary renderer does not mutate player state',async()=>{
 const {renderInventoryOverview}=await import('../src/ui.js');
 const p=newPlayer(),before=JSON.stringify(p),html=renderInventoryOverview(p);
 assert.match(html,/Kho tại nhà/);assert.match(html,/Túi đồ/);
 assert.equal(JSON.stringify(p),before);
});

test('swap carried rod with stored rod preserves exact ownership',async()=>{
 const {inventoryFromLegacy,swapCarriedRod,reconcileInventory}=await import('../src/inventory.js');
 const p=newPlayer();p.rods.push('dai');
 const before=inventoryFromLegacy(p),after=swapCarriedRod(before,p,'bamboo','dai');
 assert.ok(after);assert.deepEqual(after.carried.rods,['dai']);assert.ok(after.stored.rods.includes('bamboo'));
 assert.equal(reconcileInventory(after,p),true);
 assert.equal(swapCarriedRod(after,p,'bamboo','dai'),null);
});
