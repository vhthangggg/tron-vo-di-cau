import {FISH, MAPS, RODS, BAITS, ACCESSORIES, ACCESSORY_SLOTS, LESSONS, getRod, getBait, acceptsBait} from './content.js';
// Additive migration: the existing key and version preserve every v0.1 player's progress.
export const SAVE_KEY='tron-vo-di-cau.v01';
const validInt=(v,min=0,max=1e9)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const array=v=>Array.isArray(v)?v:[];
export function newPlayer(){
  const base=ACCESSORIES.filter(a=>a.price===0);
  return {version:1,coins:12000,baits:{...Object.fromEntries(BAITS.map(b=>[b.id,0])),worm:18,dough:6,corn:6},rods:['bamboo'],maps:['AO'],accessories:base.map(a=>a.id),equipment:Object.fromEntries(base.map(a=>[a.slot,a.id])),rod:'bamboo',bait:'worm',map:'AO',rig:{depth:1.8,lead:1.08},catches:0,released:0,sold:0,casts:0,collection:{},lessons:[],pending:null,serial:0,settings:{assist:true,sound:true,deadline:0}};
}
export function validateSave(raw){
  if(!raw||raw.version!==1||!validInt(raw.coins)||!validInt(raw.catches)||!validInt(raw.serial)) throw Error('Save không hợp lệ');
  const p=newPlayer();
  for(const k of ['coins','catches','released','sold','casts','serial']) if(validInt(raw[k]))p[k]=raw[k];
  for(const b of BAITS)if(validInt(raw.baits?.[b.id],0,100000))p.baits[b.id]=b.reusable?Math.min(1,raw.baits[b.id]):raw.baits[b.id];
  p.rods=[...new Set(['bamboo',...array(raw.rods).filter(id=>RODS.some(r=>r.id===id))])];
  p.maps=[...new Set(['AO',...array(raw.maps).filter(id=>MAPS.some(m=>m.id===id))])];
  p.accessories=[...new Set([...p.accessories,...array(raw.accessories).filter(id=>ACCESSORIES.some(a=>a.id===id))])];
  for(const slot of Object.keys(ACCESSORY_SLOTS))if(p.accessories.includes(raw.equipment?.[slot])&&ACCESSORIES.some(a=>a.id===raw.equipment[slot]&&a.slot===slot))p.equipment[slot]=raw.equipment[slot];
  p.rod=p.rods.includes(raw.rod)?raw.rod:'bamboo';p.map=p.maps.includes(raw.map)?raw.map:'AO';
  // The old save did not store lure ownership. Every owned lure rod includes one soft lure.
  if(p.rods.some(id=>getRod(id).tech==='lure'))p.baits.lure=1;
  const rod=getRod(p.rod),bait=getBait(raw.bait);
  p.bait=BAITS.some(b=>b.id===raw.bait)&&acceptsBait(rod,bait)&&(!bait.reusable||p.baits[bait.id]>0)?bait.id:rod.tech==='lure'?'lure':'worm';
  if(Number.isFinite(raw.rig?.depth)&&raw.rig.depth>=.4&&raw.rig.depth<=18)p.rig.depth=raw.rig.depth;
  if(Number.isFinite(raw.rig?.lead)&&raw.rig.lead>=.4&&raw.rig.lead<=3.5)p.rig.lead=raw.rig.lead;
  for(const f of FISH){const c=raw.collection?.[f.id];if(c&&validInt(c.count,1,100000)&&Number.isFinite(c.best)&&c.best>0&&c.best<=50)p.collection[f.id]={count:c.count,best:c.best};}
  p.lessons=[...new Set(array(raw.lessons).filter(id=>LESSONS.some(l=>l.id===id)))];
  const c=raw.pending;
  if(c&&typeof c.id==='string'&&/^catch-\d+$/.test(c.id)&&FISH.some(f=>f.id===c.fishId)&&Number.isFinite(c.weight)&&c.weight>0&&c.weight<=50&&validInt(c.value)&&MAPS.some(m=>m.id===c.mapId)){
    p.pending={id:c.id,fishId:c.fishId,weight:c.weight,value:c.value,mapId:c.mapId};
    p.serial=Math.max(p.serial,Number(c.id.slice(6)));
  }
  p.settings.assist=raw.settings?.assist!==false;p.settings.sound=raw.settings?.sound!==false;
  p.settings.deadline=[0,180,300].includes(raw.settings?.deadline)?raw.settings.deadline:0;
  return p;
}
export function loadPlayer(storage){
  try{const raw=storage.getItem(SAVE_KEY);return {player:raw?validateSave(JSON.parse(raw)):newPlayer(),warning:''};}
  catch{return {player:newPlayer(),warning:'Không đọc được bản lưu. Đang chơi bằng tiến độ mới.'};}
}
export function savePlayer(storage,player){try{storage.setItem(SAVE_KEY,JSON.stringify(player));return true;}catch{return false;}}
