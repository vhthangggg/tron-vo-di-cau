import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {ACCESSORIES} from '../src/content.js';
import {FishingGame} from '../src/engine.js';
import {newPlayer,validateSave} from '../src/save.js';
const catalog=JSON.parse(await readFile(new URL('../data/fishing-lines.catalog.json',import.meta.url),'utf8'));
const mapping={'sewing-thread':'line_basic',nylon:'line18',pe:'braid',copolymer:'line_copolymer'};
for(const entry of catalog.items){
 test('fishing line '+entry.id+' has matching equipment and images',async()=>{
  const item=ACCESSORIES.find(a=>a.id===mapping[entry.id]);
  assert.ok(item);assert.equal(item.assetKey,entry.id);assert.equal(item.breakingStrengthKg,entry.breakingStrengthKg);
  for(const type of ['icon','detail']){
   const path=new URL('../public'+entry.assets[type],import.meta.url);
   const file=await stat(path);assert.ok(file.size>1000,entry.id+' '+type+' is too small');
   const bytes=await readFile(path);
   assert.equal(bytes.toString('ascii',0,4),'RIFF',entry.id+' '+type+' is a WebP container');
   assert.equal(bytes.toString('ascii',8,12),'WEBP',entry.id+' '+type+' is a WebP image');
  }
 });
}

test('Existing owned and equipped lines survive save migration after adding Co-polymer',()=>{
 for(const id of ['line_basic','line18','fluoro','braid']){
  const player=newPlayer();player.coins=43210;player.accessories.push(id);player.equipment.line=id;
  const restored=validateSave(JSON.parse(JSON.stringify(player)));
  assert.equal(restored.equipment.line,id);assert.ok(restored.accessories.includes(id));assert.equal(restored.coins,43210);
 }
 const starter=newPlayer();
 assert.equal(starter.equipment.line,'line_basic');assert.equal(ACCESSORIES.find(a=>a.id==='line_basic').price,0);
 assert.ok(!starter.accessories.includes('line_copolymer'),'A new paid line is not granted to old saves');
});

test('Co-polymer can be bought once, equipped and restored without spending twice',()=>{
 const player=newPlayer();player.coins=30000;const game=new FishingGame(player);
 assert.ok(game.buy('accessory','line_copolymer'));assert.equal(player.coins,18000);
 assert.equal(game.buy('accessory','line_copolymer'),false);assert.equal(player.coins,18000);
 assert.ok(game.equip('line','line_copolymer'));
 const restored=validateSave(JSON.parse(JSON.stringify(player)));
 assert.equal(restored.coins,18000);assert.equal(restored.equipment.line,'line_copolymer');
 assert.equal(restored.accessories.filter(id=>id==='line_copolymer').length,1);
 assert.ok(restored.accessories.includes('line_basic'));
});
