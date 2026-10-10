import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {RODS} from '../src/content.js';
import {FishingGame} from '../src/engine.js';
import {newPlayer,validateSave} from '../src/save.js';

test('each of the 36 current rods has a valid uploaded WebP and Shopee link',async()=>{
 assert.equal(RODS.length,36);
 for(const rod of RODS){
  const bytes=await readFile(new URL('../public'+rod.asset,import.meta.url));
  assert.equal(bytes.toString('ascii',0,4),'RIFF',rod.id);
  assert.equal(bytes.toString('ascii',8,12),'WEBP',rod.id);
  assert.match(rod.affiliateUrl,/^https:\/\/s\.shopee\.vn\//);
 }
});

test('retired rods are absent from the catalog and cannot be purchased or equipped',()=>{
 const p=newPlayer();p.coins=2000000;const g=new FishingGame(p);
 for(const id of ['dai','spinning','fiber','travel','dai45','dai54','spinmedium','spinheavy','bottom36','bottom42','iso53']){
  assert.equal(RODS.some(r=>r.id===id),false);
  assert.equal(g.buy('rod',id),false);assert.equal(g.equip('rod',id),false);
 }
 assert.equal(p.coins,2000000);
 const restored=validateSave({...p,rods:['bamboo','dai'],rod:'dai'});
 assert.deepEqual(restored.rods,['bamboo']);assert.equal(restored.rod,'bamboo');
});

test('a newly purchased Rice Fishing rod retains its identity and storage on reload',()=>{
 const p=newPlayer();p.coins=200000;const g=new FishingGame(p);
 assert.equal(g.buy('rod','rod_35'),true);
 const q=validateSave(JSON.parse(JSON.stringify(p)));
 assert.equal(q.coins,82000);assert.ok(q.rods.includes('rod_35'));
 assert.ok(q.systems.inventory.stored.rods.includes('rod_35'));
});
