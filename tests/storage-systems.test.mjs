import test from 'node:test';
import assert from 'node:assert/strict';
import {newPlayer,validateSave,loadPlayer,savePlayer,SCHEMA_VERSION,SAVE_KEY,SAVE_BACKUP_KEY,SAVE_CORRUPT_KEY} from '../src/save.js';
import {BAG_TYPES,ensureInventory,syncInventory,inventoryFor,reconcileInventory,validateBag,validateDeparture,carriedBaitCount,transferBait,transferGear,bagInventory,spareAccessoryCount} from '../src/inventory.js';
import {applyTransaction,transactionId} from '../src/economy.js';

function memoryStorage(initial={}){
 const values=new Map(Object.entries(initial)),writes=[];
 return {values,writes,getItem(key){return values.get(key)??null;},setItem(key,value){writes.push([key,value]);values.set(key,value);}};
}
const fish=(id,extras={})=>({id:`catch-${id}`,fishId:'fish_01',weight:.6,value:120,mapId:'AO',...extras});

test('starter carries the mounted kit and two bait types, independently of spare slots',()=>{
 const p=newPlayer(),inv=p.systems.inventory;
 assert.equal(inv.carried.rods.length,1);assert.equal(Object.values(inv.carried.baits).filter(n=>n>0).length,2);
 assert.deepEqual(new Set(inv.carried.accessories),new Set(p.accessories));
 assert.equal(spareAccessoryCount(inv,p),0);assert.equal(validateBag(inv,p).ok,true);assert.equal(validateDeparture(p).ok,true);
 assert.equal(inv.stored.baits.corn,6);assert.ok(Object.values(BAG_TYPES).every(b=>Number.isSafeInteger(b.price)&&b.note));
});

test('inventory rendering is pure and sync places new ownership home without resetting valid packing',()=>{
 const p=newPlayer();
 const packed=transferBait(p.systems.inventory,p,'worm',10,'stored');assert.ok(packed);p.systems.inventory=packed;
 const before=JSON.stringify(p);inventoryFor(p);assert.equal(JSON.stringify(p),before);
 p.rods.push('dai');p.accessories.push('line18');p.baits.worm+=12;
 syncInventory(p);assert.equal(carriedBaitCount(p,'worm'),8);assert.equal(p.systems.inventory.stored.baits.worm,22);
 assert.deepEqual(p.systems.inventory.carried.rods,['bamboo']);assert.ok(p.systems.inventory.stored.rods.includes('dai'));
 assert.ok(p.systems.inventory.stored.accessories.includes('line18'));assert.equal(reconcileInventory(p.systems.inventory,p),true);
});

test('bait consumption debits carried portions and exhausted types keep their location without using a slot',()=>{
 const p=newPlayer();p.systems.inventory=transferBait(p.systems.inventory,p,'worm',10,'stored');
 p.baits.worm--;syncInventory(p);assert.equal(carriedBaitCount(p,'worm'),7);assert.equal(p.systems.inventory.stored.baits.worm,10);
 p.baits.worm=10;syncInventory(p);assert.equal(carriedBaitCount(p,'worm'),0);assert.ok(Object.hasOwn(p.systems.inventory.carried.baits,'worm'));
 const withCorn=transferBait(p.systems.inventory,p,'corn',6);assert.ok(withCorn);assert.equal(withCorn.carried.baits.corn,6);
 assert.equal(reconcileInventory(withCorn,p),true);
});

test('transfers require a real source and never duplicate inventory, mounted accessories free spare slots',()=>{
 const p=newPlayer();p.accessories.push('line18','fluoro','braid','hook_barb','hook_wide');syncInventory(p);
 for(const id of ['line18','fluoro','braid','hook_barb']){const next=transferGear(p.systems.inventory,p,'accessories',id);assert.ok(next);p.systems.inventory=next;}
 assert.equal(spareAccessoryCount(p.systems.inventory,p),4);
 assert.equal(transferGear(p.systems.inventory,p,'accessories','hook_wide'),null);
 assert.equal(transferGear(p.systems.inventory,p,'accessories','line18'),null);
 assert.equal(transferBait(p.systems.inventory,p,'corn',1),null);
 const previous=structuredClone(p.systems.inventory);assert.equal(transferBait(p.systems.inventory,p,'worm',99,'stored'),null);assert.deepEqual(p.systems.inventory,previous);
});

test('bag downgrades repack only when explicitly chosen at home and preserve all assets',()=>{
 const p=newPlayer();p.systems.bags.push('standard');p.rods.push('dai');syncInventory(p);
 p.systems.inventory=bagInventory(p,'standard');p.systems.inventory=transferGear(p.systems.inventory,p,'rods','dai');
 assert.equal(bagInventory(p,'cloth'),null);
 const small=bagInventory(p,'cloth',{storeExcess:true});assert.ok(small);assert.equal(small.carried.rods.length,1);assert.ok(small.stored.rods.includes('dai'));
 assert.equal(reconcileInventory(small,p),true);
 p.systems.trip={id:'trip-1',mapId:'AO',spotId:'ben-cau-tre',active:true};assert.equal(bagInventory(p,'cloth',{storeExcess:true}),null);
});

test('derived instances retain stable identity and durability across storage and reload',()=>{
 const p=newPlayer();p.rods.push('dai');syncInventory(p);
 const rod=p.systems.gearInstances.find(i=>i.instanceId==='rod-dai');rod.durability=72;
 p.systems.bags.push('standard');p.systems.inventory=bagInventory(p,'standard');p.systems.inventory=transferGear(p.systems.inventory,p,'rods','dai');syncInventory(p);
 const restored=validateSave(p),instance=restored.systems.gearInstances.find(i=>i.instanceId==='rod-dai');
 assert.equal(instance.durability,72);assert.equal(instance.location,'bag');assert.equal(new Set(restored.systems.gearInstances.map(i=>i.instanceId)).size,restored.systems.gearInstances.length);
});

test('malformed optional location records cannot throw or erase authoritative assets',()=>{
 for(const inventory of [null,[],{bagId:'missing'},{bagId:'cloth',carried:{rods:[]},stored:{rods:null}}, {bagId:'cloth',carried:{rods:['ghost','bamboo','bamboo'],baits:{worm:-1},accessories:['ghost']},stored:{rods:[],baits:{},accessories:[]}}]){
  const p=newPlayer();p.coins=98500;p.rods.push('dai');p.systems.inventory=inventory;
  const restored=validateSave(p);assert.equal(restored.coins,98500);assert.ok(restored.rods.includes('dai'));assert.equal(reconcileInventory(restored.systems.inventory,restored),true);
 }
});

test('a damaged storage section retains valid carried choices while rebuilding missing locations',()=>{
 const p=newPlayer();p.rods.push('dai');syncInventory(p);
 p.systems.inventory=transferBait(p.systems.inventory,p,'worm',16,'stored');
 p.systems.inventory.stored=null;
 const restored=validateSave(p);
 assert.equal(carriedBaitCount(restored,'worm'),2);assert.equal(restored.systems.inventory.stored.baits.worm,16);
 assert.ok(restored.systems.inventory.stored.rods.includes('dai'));assert.equal(reconcileInventory(restored.systems.inventory,restored),true);
});

test('departure identifies equipment and bait left home',()=>{
 const p=newPlayer();p.systems.inventory=transferGear(p.systems.inventory,p,'accessories','line_basic','stored');assert.equal(validateDeparture(p).ok,false);
 p.systems.inventory=transferGear(p.systems.inventory,p,'accessories','line_basic','carried');
 p.systems.inventory=transferBait(p.systems.inventory,p,'worm',18,'stored');assert.equal(validateDeparture(p).ok,false);
});

test('player transaction uses a draft, rejects partial failures, and preserves root identity',()=>{
 const p=newPlayer(),root=p,before=structuredClone(p);
 assert.equal(applyTransaction(p,'failed-purchase',draft=>{draft.coins=0;draft.rods.push('dai');return false;}).ok,false);assert.deepEqual(p,before);
 assert.equal(applyTransaction(p,'overdraft',draft=>{draft.coins=-1;return true;}).ok,false);assert.deepEqual(p,before);
 assert.equal(applyTransaction(p,'bad-stock',draft=>{draft.baits.worm=-1;return true;}).ok,false);assert.deepEqual(p,before);
 assert.equal(applyTransaction(p,'purchase-1',draft=>{draft.coins-=1000;draft.baits.worm+=12;syncInventory(draft);return true;}).ok,true);assert.equal(p,root);
 const applied=structuredClone(p);let calls=0;
 assert.equal(applyTransaction(p,'purchase-1',()=>{calls++;return true;}).reason,'duplicate');assert.equal(calls,0);assert.deepEqual(p,applied);
});

test('reload retains every transaction receipt and the monotonic reserved sequence',()=>{
 const p=newPlayer();p.systems.transactions=Array.from({length:1600},(_,i)=>`purchase:${i+1}`);p.systems.sequence=4;
 const restored=validateSave(p);assert.equal(restored.systems.transactions.length,1600);assert.equal(restored.systems.sequence,1600);
 assert.equal(applyTransaction(restored,'purchase:1',draft=>{draft.coins+=100;return true;}).reason,'duplicate');
 assert.equal(transactionId(restored,'buy:rod'), 'buy:rod:1601');
 const sequence=restored.systems.sequence;
 assert.equal(applyTransaction(restored,'new-reward',draft=>{draft.systems.transactions=[];draft.systems.sequence=0;draft.coins+=100;return true;}).ok,true);
 assert.equal(restored.systems.transactions.length,1601);assert.equal(restored.systems.sequence,sequence);
});

test('schema 2 roundtrip preserves mounted bait inclusive stock, flags, presets and active trip',()=>{
 const p=newPlayer();p.systems.mountedBait={id:'worm',condition:'intact',consumed:false,reusable:false,mountId:'mount:1'};
 p.systems.flags.tutorial=false;p.systems.trip={id:'trip:2',mapId:'AO',spotId:'mui-dat',active:true};
 p.rig.leaderMm=.2;p.rig.leaderLength=.4;p.rig.hookSize=5;p.rig.sinkerDistance=.3;
 p.systems.rigPresets=[{id:'rig:3',name:'Bộ câu bờ gần',rod:p.rod,bait:p.bait,equipment:structuredClone(p.equipment),rig:structuredClone(p.rig)}];
 p.pending=fish(1,{status:'landed',caughtAt:1791445200000});p.serial=1;p.catches=1;
 assert.deepEqual(validateSave(JSON.parse(JSON.stringify(p))),p);assert.equal(p.baits.worm,18);assert.equal(carriedBaitCount(p,'worm'),18);
});

test('invalid presets and mounted bait stay optional and cannot reset progress',()=>{
 const p=newPlayer();p.coins=75000;p.systems.rigPresets=[null,{id:'bad',name:'bad',equipment:[],rig:{}},{id:'bad2',name:'bad',rod:'bamboo',bait:'worm',equipment:p.equipment,rig:{lead:-1}}];
 p.systems.mountedBait={id:'missing',condition:'intact',consumed:false};
 const restored=validateSave(p);assert.equal(restored.coins,75000);assert.deepEqual(restored.systems.rigPresets,[]);assert.equal(restored.systems.mountedBait,null);
});

test('v1 migration conserves the full old catch list at home, without imposing keepnet capacity',()=>{
 const old=newPlayer();delete old.schemaVersion;delete old.systems;old.keptFish=Array.from({length:137},(_,i)=>fish(i+2));old.pending=fish(1);old.serial=138;
 const p=validateSave(old);assert.equal(p.keptFish.length,0);assert.equal(p.homeFish.length,137);assert.equal(p.pending.id,'catch-1');
 assert.equal(p.homeFish.every(f=>f.status==='home'),true);assert.equal(p.pending.status,'landed');assert.equal(p.serial,138);
 const duplicate=validateSave({...p,keptFish:[p.homeFish[0],fish(200)]});assert.equal(duplicate.keptFish.length,1);assert.equal(duplicate.serial,200);
});

test('first migrated write preserves the original payload before overwriting the storage key',()=>{
 const old=newPlayer();delete old.schemaVersion;delete old.systems;old.coins=99341;
 const raw=JSON.stringify(old),storage=memoryStorage({[SAVE_KEY]:raw}),loaded=loadPlayer(storage);
 assert.equal(loaded.player.coins,99341);assert.equal(loaded.warning,'');assert.ok(savePlayer(storage,loaded.player));
 assert.equal(storage.values.get(SAVE_BACKUP_KEY),raw);assert.equal(storage.writes[0][0],SAVE_BACKUP_KEY);assert.equal(JSON.parse(storage.values.get(SAVE_KEY)).schemaVersion,3);
});

test('failed migration backup prevents overwriting the original save',()=>{
 const old=newPlayer();delete old.schemaVersion;const raw=JSON.stringify(old),storage=memoryStorage({[SAVE_KEY]:raw});
 const loaded=loadPlayer(storage),write=storage.setItem.bind(storage);storage.setItem=(key,value)=>{if(key===SAVE_BACKUP_KEY)throw Error('quota');write(key,value);};
 assert.equal(savePlayer(storage,loaded.player),false);assert.equal(storage.values.get(SAVE_KEY),raw);
});

test('corrupt save is retained and overwrite stays blocked without a verified backup',()=>{
 const raw='{broken',storage=memoryStorage({[SAVE_KEY]:raw}),loaded=loadPlayer(storage);assert.ok(loaded.warning);
 assert.equal(storage.values.get(SAVE_CORRUPT_KEY),raw);assert.equal(savePlayer(storage,loaded.player),false);assert.equal(storage.values.get(SAVE_KEY),raw);
});

test('corrupt current save recovers a verified backup, preserving its wallet and assets',()=>{
 const backup=newPlayer();backup.coins=84332;backup.rods.push('dai');ensureInventory(backup);
 const storage=memoryStorage({[SAVE_KEY]:'{broken',[SAVE_BACKUP_KEY]:JSON.stringify(backup)}),loaded=loadPlayer(storage);
 assert.equal(loaded.player.coins,84332);assert.ok(loaded.player.rods.includes('dai'));assert.match(loaded.warning,/khôi phục/);
 assert.ok(savePlayer(storage,loaded.player));assert.equal(storage.values.get(SAVE_CORRUPT_KEY),'{broken');
 assert.deepEqual(loadPlayer(storage).player,loaded.player);
});

test('an unsupported future schema cannot be overwritten by an older client',()=>{
 const future={...newPlayer(),schemaVersion:SCHEMA_VERSION+1,coins:85345};assert.throws(()=>validateSave(future));
 const raw=JSON.stringify(future);
 for(const backup of [null,JSON.stringify(newPlayer())]){
  const storage=memoryStorage({[SAVE_KEY]:raw,...(backup?{[SAVE_BACKUP_KEY]:backup}:{})}),loaded=loadPlayer(storage);
  assert.ok(loaded.warning);assert.equal(savePlayer(storage,loaded.player),false);assert.equal(storage.values.get(SAVE_KEY),raw);
 }
});
