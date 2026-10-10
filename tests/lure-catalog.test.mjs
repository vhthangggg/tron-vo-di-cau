import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LURE_CATALOG} from '../src/lure-catalog.js';
import {BAITS,getBait} from '../src/content.js';
import {FishingGame} from '../src/engine.js';
import {newPlayer} from '../src/save.js';

test('twelve lure catalog entries are unique, linked and consistent with the JSON export',async()=>{
 const exported=JSON.parse(await readFile(new URL('../data/lures.catalog.json',import.meta.url),'utf8'));
 assert.equal(LURE_CATALOG.length,12);
 assert.deepEqual(exported.items,LURE_CATALOG);
 assert.equal(new Set(LURE_CATALOG.map(l=>l.id)).size,12);
 assert.equal(new Set(LURE_CATALOG.map(l=>l.file)).size,12);
 for(const lure of LURE_CATALOG){
  assert.match(lure.file,/^moi-[a-z0-9-]+\.webp$/);
  assert.equal(lure.asset,'/assets/items/lures/'+lure.file);
  assert.match(lure.affiliateUrl,/^https:\/\/s\.shopee\.vn\//);
  assert.equal(lure.market.verified,false);
  assert.equal(lure.market.weightG,null);
  assert.equal(lure.market.lengthCm,null);
  assert.ok(lure.game.priceCoins>0);
  assert.ok(lure.game.minDepthM<=lure.game.maxDepthM);
  for(const key of ['snagRisk','durability','attraction'])assert.ok(lure.game[key]>=0&&lure.game[key]<=100);
  assert.equal(getBait(lure.id).reusable,true);
  assert.equal(getBait(lure.id).tech[0],'lure');
 }
});
test('jump frog is configured as floating surface bait without inventing a real SKU measurement',()=>{
 const frog=LURE_CATALOG.find(l=>l.id==='lure_07');
 assert.ok(frog);
 assert.equal(frog.category,'jump_frog');
 assert.equal(frog.file,'moi-nhai-nhay.webp');
 assert.equal(frog.game.buoyancy,'floating');
 assert.equal(frog.game.maxDepthM,0);
 assert.equal(frog.game.compatibleFishBaitId,'popper');
 assert.equal(frog.market.weightG,null);
 const pencil=LURE_CATALOG.find(l=>l.id==='lure_05');
 assert.equal(pencil.game.buoyancy,'sinking');
 assert.ok(pencil.game.maxDepthM>0);
});
test('lure compatibility remains playable for predatory fish and older saves',()=>{
 const player=newPlayer();
 player.rods.push('rod_02');player.rod='rod_02';
 player.bait='lure_07';player.baits.lure_07=1;
 player.systems.inventory=null;
 const game=new FishingGame(player,{seed:12});
 assert.equal(game.eligible({fishId:'fish_04',spot:game.spot,caught:false,suspicion:0,depth:0.5}),true);
 assert.equal(game.eligible({fishId:'fish_01',spot:game.spot,caught:false,suspicion:0,depth:0.5}),false);
 for(const id of ['crank','spoon','popper'])assert.equal(getBait(id).legacyCatalog,true);
 assert.equal(BAITS.filter(b=>b.lureProfile).length,12);
});
