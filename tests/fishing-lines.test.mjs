import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {ACCESSORIES} from '../src/content.js';
const catalog=JSON.parse(await readFile(new URL('../data/fishing-lines.catalog.json',import.meta.url),'utf8'));
const mapping={'sewing-thread':'line_basic',nylon:'line18',pe:'braid',copolymer:'line_copolymer'};
for(const entry of catalog.items){
 test('fishing line '+entry.id+' has matching equipment and images',async()=>{
  const item=ACCESSORIES.find(a=>a.id===mapping[entry.id]);
  assert.ok(item);assert.equal(item.assetKey,entry.id);assert.equal(item.breakingStrengthKg,entry.breakingStrengthKg);
  for(const type of ['icon','detail']){
   const path=new URL('../public'+entry.assets[type],import.meta.url);
   const file=await stat(path);assert.ok(file.size>1000,entry.id+' '+type+' is too small');
  }
 });
}
