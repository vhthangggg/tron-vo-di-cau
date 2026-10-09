import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {FISH,getFish,getMap,RODS,BAITS,acceptsBait} from '../src/content.js';
import {SPECIES_PROFILES,FISH_ASSET_ALIASES} from '../src/species-data.js';
import {speciesSizeBands,sampleSpecimenWeight,specimenStrength,estimatedSpecimenLength,speciesAssetPaths} from '../src/species-physics.js';
import {fishFightProfile} from '../src/fight-physics.js';
import {FishingGame,seededRandom} from '../src/engine.js';
import {newPlayer,validateSave} from '../src/save.js';
import {journalRows,speciesDetailHTML,fishArt} from '../src/ui.js';
import {fishAssetModule} from '../scripts/fish-assets.mjs';

test('57 artwork IDs resolve to 56 complete profiles, with one canonical grass carp',async()=>{
 assert.equal(FISH.length,56);assert.equal(new Set(FISH.map(f=>f.id)).size,56);
 assert.deepEqual(FISH_ASSET_ALIASES,{fish_55:'fish_07'});
 for(let n=1;n<=57;n++)assert(getFish('fish_'+String(n).padStart(2,'0')));
 assert.equal(getFish('fish_55'),getFish('fish_07'));assert(!FISH.some(f=>f.id==='fish_55'));
 const exported=JSON.parse(await readFile(new URL('../data/fish-catalog-57.json',import.meta.url),'utf8'));
 assert.equal(exported.rows.length,57);assert.equal(exported.rows.filter(r=>r.catchable).length,56);
 for(const f of FISH){
  assert(SPECIES_PROFILES[f.id]);assert(f.recognition.length>20);assert(f.habitat.length>20);assert(f.diet.length>10);
  assert(f.sources.every(s=>new URL(s.url).protocol==='https:'));
  assert(f.size.min<f.size.common[0]&&f.size.common[0]<f.size.common[1]&&f.size.common[1]<f.size.max,f.id);
  assert(f.maps.every(id=>getMap(id).id===id));assert(f.baits.every(id=>BAITS.some(b=>b.id===id)));
  for(const tech of f.tech)assert(f.baits.some(id=>acceptsBait(RODS.find(r=>r.tech===tech),BAITS.find(b=>b.id===id))),f.id+' reachable technique');
  const row=exported.rows.find(r=>r.assetId===f.id);assert.deepEqual(row.size.common,f.size.common);assert.equal(row.size.max,f.max);
 }
});
test('New animals respect water type and correct body measurements',()=>{
 assert.deepEqual(getFish('fish_51').maps,['CSONG','GHE']);assert.match(getFish('fish_51').scientificName,/Otolithoides/);
 assert.equal(getFish('fish_52').scientificName,'Macrobrachium rosenbergii');
 assert.equal(getFish('fish_53').size.measure,'Rộng mai');assert.equal(getFish('fish_54').size.measure,'Dài mai');
 assert.deepEqual(getFish('fish_56').maps,['CSONG']);assert.equal(getFish('fish_57').depth,'surface');
 assert.equal(getFish('fish_57').scientificName,'Hoplobatrachus rugulosus');assert.equal(getFish('fish_57').size.measure,'Mõm–hậu môn');
 assert.deepEqual(getFish('fish_14').maps,['DICHVU']);
 for(const id of ['fish_52','fish_53','fish_54','fish_56','fish_57'])assert.notEqual(getFish(id).group,'fish');
});
test('Authored size distribution produces rare giants rather than uniform weights',()=>{
 const f=getFish('fish_07'),random=seededRandom(227),counts={small:0,common:0,large:0,trophy:0},bands=speciesSizeBands(f);
 for(let i=0;i<20000;i++){
  const weight=sampleSpecimenWeight(f,random);assert(weight>=f.min&&weight<=f.max);
  const band=bands.find(b=>weight<=b.max);counts[band.id]++;
 }
 for(const band of bands)assert(Math.abs(counts[band.id]/20000-band.chance)<.015,JSON.stringify(counts));
 for(const f of FISH)for(let i=0;i<30;i++){
  const cap=Math.min(f.max,.8),weight=sampleSpecimenWeight(f,random,{cap});
  assert(weight>=f.min&&weight<=Math.max(f.min,cap),f.id);
 }
});
test('Every species increases size, pull effort and endurance across its size bands',()=>{
 for(const f of FISH){
  const weights=[f.min,...f.size.common,f.max];let previous={length:0,effort:0,endurance:0};
  for(const w of weights){
   const length=estimatedSpecimenLength(f,w),effort=specimenStrength(f,w).pullIndex,endurance=fishFightProfile(f,w,15).endurance;
   assert(length>previous.length,f.id+' length');assert(effort>previous.effort,f.id+' effort');
   assert(endurance>=previous.endurance,f.id+' endurance');previous={length,effort,endurance};
  }
 }
 assert(fishFightProfile(getFish('fish_04'),.5).endurance>fishFightProfile(getFish('fish_02'),.5).endurance);
 for(const id of ['fish_52','fish_53','fish_57'])assert(fishFightProfile(getFish(id),getFish(id).size.common[1]).endurance<5,id);
});
test('Size samplers and species fight remain deterministic',()=>{
 const a=new FishingGame(newPlayer(),{seed:51}),b=new FishingGame(newPlayer(),{seed:51});assert.deepEqual(a.fish,b.fish);
 assert(a.fish.some(f=>f.fishId==='fish_53'));assert(a.fish.some(f=>f.fishId==='fish_57'));
});
test('Merged artwork alias and new catches survive save restoration without losing legacy records',()=>{
 const p=newPlayer();p.collection.fish_07={count:2,best:2};p.collection.fish_55={count:3,best:6};
 p.pending={id:'catch-1',fishId:'fish_55',weight:6,value:144000,mapId:'HO'};p.serial=1;p.catches=5;
 const q=validateSave(p);assert.deepEqual(q.collection.fish_07,{count:5,best:6});assert(!q.collection.fish_55);assert.equal(q.pending.fishId,'fish_07');
 for(const id of ['fish_51','fish_52','fish_53','fish_54','fish_56','fish_57']){
  p.pending={...p.pending,fishId:id,weight:getFish(id).min};const q=validateSave(p);assert.equal(q.pending.fishId,id);assert.equal(q.pending.weight,getFish(id).min);
 }
});
test('Journal finds scientific and unaccented names and details explain reference/model separation',()=>{
 const p=newPlayer();assert.equal((journalRows(p).match(/data-species="/g)||[]).length,56);
 assert.match(journalRows(p,'ech dong'),/fish_57/);assert.match(journalRows(p,'Otolithoides'),/fish_51/);
 assert.match(journalRows(p,'fish_55'),/data-species="fish_07"/);
 for(const id of ['fish_01','fish_52','fish_53','fish_54','fish_56','fish_57']){
  const html=speciesDetailHTML(getFish(id));assert.match(html,/Cỡ và sức kéo trong mô phỏng/);assert.match(html,/không phải trung bình khảo sát/);
  assert.match(html,/Mồi ưu tiên/);assert.match(html,/Nguồn nhận dạng/);
 }
 assert.match(speciesDetailHTML(getFish('fish_07')),/TL: dài toàn thân/);
 assert(!fishArt(getFish('fish_56')).includes('<img'),'Missing artwork should not issue requests');
 assert.match(speciesAssetPaths(getFish('fish_07'))[0],/fish_55.webp$/);
});
test('Build artwork manifest accepts actual images, ignores placeholders, and retains all safe paths',async()=>{
 const root=await mkdtemp(join(tmpdir(),'fish-art-'));try{
  await mkdir(join(root,'public/assets/fish'),{recursive:true});
  for(const [name,data] of [['fish_01.webp','binary'],['fish_55.png','binary'],['fish_57.webp',''],['fish_99.webp','invalid'],['README.md','info']])await writeFile(join(root,'public/assets/fish',name),data);
  const module=await fishAssetModule(root);assert(module.includes('fish_01.webp'));assert(module.includes('fish_55.png'));assert(!module.includes('fish_99'));assert(!module.includes('fish_57'));assert(!module.includes('README'));
 }finally{await rm(root,{recursive:true,force:true});}
});
