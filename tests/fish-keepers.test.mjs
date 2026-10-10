import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FISH_KEEPERS,advanceFishKeeping,initialFishCare,keeperDurability,keeperRepairCost,catchSaleValue} from '../src/fish-keepers.js';
import {newPlayer,validateSave} from '../src/save.js';
import {FishingGame} from '../src/engine.js';
import {canStoreCatch} from '../src/catch-inventory.js';

const fish=(id=1,extra={})=>({id:'catch-'+id,fishId:'fish_01',weight:.3,value:120,mapId:'AO',status:'kept',...extra});
const roundtrip=p=>validateSave(JSON.parse(JSON.stringify(p)));
function atBank(id='fish_keeper_01'){
 const p=newPlayer();if(!p.fishKeepers.includes(id))p.fishKeepers.push(id);
 p.container=id;p.systems.keeperDurability[id]=FISH_KEEPERS.find(k=>k.id===id).durabilityMax;
 p.systems.trip={id:'trip:keeper-test',mapId:'AO',spotId:'ben-cau-tre',active:true};
 p.keptFish=[fish(1,initialFishCare())];return p;
}

test('the deployed catalog preserves all 12 asset names, unique supplied affiliate links, and explicit fictional attribution',()=>{
 const json=JSON.parse(readFileSync(new URL('../data/fish-keepers.catalog.json',import.meta.url)));
 assert.deepEqual(json,FISH_KEEPERS);assert.equal(json.length,12);
 assert.equal(new Set(json.map(k=>k.affiliateUrl)).size,12);
 for(let i=0;i<12;i++){
  assert.equal(json[i].file,'rong_'+String(i+1).padStart(2,'0')+'.webp');
  assert.equal(json[i].asset,'/assets/items/fish-keepers/'+json[i].file);
  assert.match(json[i].affiliateUrl,/^https:\/\/s\.shopee\.vn\/[a-zA-Z0-9]+$/);
  if(i)assert(json[i].capacityKg>=json[i-1].capacityKg);
 }
 assert.equal(json[11].fictional,true);assert.equal(json[11].maxFishLengthCm,null);
 assert.match(json[11].realProductNote,/trang trí/);
});

test('keeper purchase is atomic, cannot replay after reload, and does not unlock other keepers',()=>{
 const p=newPlayer(),g=new FishingGame(p),coins=p.coins;
 assert.deepEqual(p.fishKeepers,['fish_keeper_01']);assert.equal(g.setContainer('fish_keeper_12'),false);
 assert.equal(g.buy('keeper','fish_keeper_03','purchase:keeper:1'),true);assert.equal(p.coins,coins-350);
 let q=roundtrip(p),again=new FishingGame(q);const before=structuredClone(q);
 assert.equal(again.buy('keeper','fish_keeper_04','purchase:keeper:1'),false);assert.deepEqual(q,before);
 assert.equal(again.buy('keeper','fish_keeper_03'),false);assert.equal(again.setContainer('fish_keeper_03'),true);
 assert.equal(again.setContainer('fish_keeper_12'),false);assert.equal(q.container,'fish_keeper_03');
});

test('legacy free containers migrate without shrinking capacity or losing existing fish, cash or journal entries',()=>{
 for(const [old,id,min] of [['keepnet','fish_keeper_08',35],['bucket','fish_keeper_05',12],['box','fish_keeper_07',25]]){
  const p=atBank();delete p.fishKeepers;p.container=old;p.coins=919191;
  p.keptFish=Array.from({length:103},(_,i)=>fish(i+1));p.serial=103;p.collection.fish_01={count:103,best:.3};
  const q=roundtrip(p);assert.equal(q.container,id);assert.equal(q.keptFish.length,103);assert.equal(q.coins,919191);
  assert(q.fishKeepers.includes(id));assert(FISH_KEEPERS.find(k=>k.id===id).capacityKg>=min);
  assert.deepEqual(q.collection,p.collection);assert.equal(new FishingGame(q).returnHome(),true);assert.equal(q.homeFish.length,103);
 }
});

test('a light long fish cannot bypass length limits by being kept directly at home',()=>{
 const p=newPlayer(),g=new FishingGame(p);p.pending=fish(1,{fishId:'fish_28',weight:.25,status:'landed'});g.phase='landed';
 const before=structuredClone(p.pending);
 assert.equal(canStoreCatch([],p.pending,p.container).reason,'length');
 assert.equal(g.resolveCatch(p.pending.id,'keep'),false);assert.deepEqual(p.pending,before);assert.equal(p.homeFish.length,0);
 assert.equal(g.resolveCatch(p.pending.id,'release'),true);
 assert.equal(canStoreCatch([],fish(2,{weight:2.01}),'fish_keeper_01').reason,'capacity');
});

test('changing to a shorter keeper preserves the equipped keeper and every existing fish',()=>{
 const p=atBank('fish_keeper_12'),g=new FishingGame(p);p.keptFish=[fish(1,{fishId:'fish_28',weight:.25,...initialFishCare()})];
 const before=structuredClone(p.keptFish);assert.equal(g.setContainer('fish_keeper_01'),false);
 assert.equal(p.container,'fish_keeper_12');assert.deepEqual(p.keptFish,before);
});

test('fish care ticks once per active minute and preserves the subminute timer over reload',()=>{
 const p=atBank(),g=new FishingGame(p);for(let i=0;i<590;i++)g.step(.1);
 assert.equal(p.keptFish[0].freshness,100);g.paused=true;for(let i=0;i<900;i++)g.step(.1);
 assert.equal(p.keptFish[0].freshness,100);const q=roundtrip(p),again=new FishingGame(q);
 for(let i=0;i<10;i++)again.step(.1);
 assert(q.keptFish[0].freshness<100);assert(q.keptFish[0].vitality<100);assert(keeperDurability(q)<20);
 const kept=structuredClone(q.keptFish);assert.equal(again.returnHome(),true);
 for(let i=0;i<1000;i++)again.step(.1);assert.deepEqual(q.homeFish,kept.map(c=>({...c,status:'home'})));
});

test('higher quality keepers reduce vitality, freshness and condition loss without reviving dead fish',()=>{
 const cheap=atBank(),premium=atBank('fish_keeper_11');advanceFishKeeping(cheap,600);advanceFishKeeping(premium,600);
 for(const field of ['vitality','freshness','condition'])assert(premium.keptFish[0][field]>cheap.keptFish[0][field]);
 cheap.keptFish[0].isAlive=false;cheap.keptFish[0].vitality=0;cheap.container='fish_keeper_11';cheap.fishKeepers.push(cheap.container);cheap.systems.keeperDurability[cheap.container]=100;
 advanceFishKeeping(cheap,60);assert.equal(cheap.keptFish[0].vitality,0);assert.equal(cheap.keptFish[0].isAlive,false);
});

test('broken keeper rejects new catches and home repair charges exactly once, including across reload',()=>{
 const p=atBank('fish_keeper_03'),g=new FishingGame(p);p.systems.keeperDurability[p.container]=0;
 assert.equal(canStoreCatch([],fish(),p.container,keeperDurability(p)).reason,'durability');
 assert.equal(g.repairKeeper(p.container),false);assert.equal(g.buy('keeper','fish_keeper_04'),false);
 assert.equal(g.returnHome(),true);const cost=keeperRepairCost(p),coins=p.coins;
 assert.equal(g.repairKeeper(p.container,'repair:keeper:1'),true);assert.equal(p.coins,coins-cost);assert.equal(keeperDurability(p),45);
 const q=roundtrip(p),again=new FishingGame(q);q.systems.keeperDurability[q.container]=10;
 assert.equal(again.repairKeeper(q.container,'repair:keeper:1'),false);assert.equal(keeperDurability(q),10);assert.equal(q.coins,p.coins);
 q.coins=0;assert.equal(again.repairKeeper(q.container),false);assert.equal(keeperDurability(q),10);
 const starter=newPlayer(),starterGame=new FishingGame(starter);starter.coins=0;starter.systems.keeperDurability[starter.container]=0;
 assert.equal(starterGame.repairKeeper(starter.container),true);assert.equal(starter.coins,0);assert.equal(keeperDurability(starter),20);
});

test('quality affects both single and bulk sale exactly once and dead fish cannot credit release statistics',()=>{
 const live=fish(1,{value:1000,...initialFishCare()}),fresh=fish(2,{value:1000,...initialFishCare(),vitality:0,isAlive:false});
 const damaged=fish(3,{value:1000,...initialFishCare(),condition:30}),spoiled=fish(4,{value:1000,...initialFishCare(),freshness:20,vitality:0,isAlive:false});
 assert.deepEqual([live,fresh,damaged,spoiled].map(catchSaleValue),[1000,850,600,200]);
 const p=newPlayer(),g=new FishingGame(p);p.homeFish=[live,fresh,damaged,spoiled];const start=p.coins;
 assert.equal(g.resolveKeptCatch(fresh.id,'release'),false);assert.equal(p.released,0);
 assert.equal(g.resolveKeptCatch(damaged.id,'sell'),true);assert.equal(p.coins,start+600);
 const q=roundtrip(p),again=new FishingGame(q);assert.equal(again.resolveKeptCatch(damaged.id,'sell'),false);
 assert.equal(again.sellKeptFish(),true);assert.equal(q.coins,start+2650);assert.equal(q.sold,4);assert.equal(again.sellKeptFish(),false);
});

test('invalid ownership, wear and fish vitality are normalized without resetting existing assets',()=>{
 const p=atBank();p.container='fish_keeper_12';p.fishKeepers.push('__proto__','missing','fish_keeper_01');p.systems.keeperDurability.fish_keeper_01=-10;
 p.keptFish[0]={...p.keptFish[0],freshness:999,condition:-4,vitality:90,isAlive:false};
 const q=roundtrip(p);assert.equal(q.container,'fish_keeper_01');assert.deepEqual(q.fishKeepers,['fish_keeper_01']);assert.equal(keeperDurability(q),0);
 assert.equal(q.keptFish[0].freshness,100);assert.equal(q.keptFish[0].condition,0);assert.equal(q.keptFish[0].vitality,0);assert.equal(q.keptFish[0].isAlive,false);
});
