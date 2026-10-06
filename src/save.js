import {FISH, MAPS, RODS, BAITS, LESSONS} from './content.js';
export const SAVE_KEY='tron-vo-di-cau.v01';
const validInt=(v,min=0,max=1e9)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
export function newPlayer(){return {version:1,coins:12000,baits:{worm:18,dough:6,corn:6,cloudbait:0},rods:['bamboo'],maps:['AO'],rod:'bamboo',bait:'worm',map:'AO',rig:{depth:1.8,lead:1.08},catches:0,released:0,sold:0,casts:0,collection:{},lessons:[],pending:null,serial:0,settings:{assist:true,sound:true,deadline:0}};}
export function validateSave(raw){
  if(!raw||raw.version!==1||!validInt(raw.coins)||!validInt(raw.catches)||!validInt(raw.serial)) throw Error('Save không hợp lệ');
  const p=newPlayer();
  for(const k of ['coins','catches','released','sold','casts','serial']) if(validInt(raw[k]))p[k]=raw[k];
  for(const b of BAITS.filter(x=>x.id!=='lure')) if(validInt(raw.baits?.[b.id],0,100000))p.baits[b.id]=raw.baits[b.id];
  p.rods=[...new Set(['bamboo',...(raw.rods||[]).filter(id=>RODS.some(r=>r.id===id))])];
  p.maps=[...new Set(['AO',...(raw.maps||[]).filter(id=>MAPS.some(m=>m.id===id))])];
  p.rod=p.rods.includes(raw.rod)?raw.rod:'bamboo';p.map=p.maps.includes(raw.map)?raw.map:'AO';
  p.bait=BAITS.some(b=>b.id===raw.bait)?raw.bait:'worm';
  if(p.rod==='spinning')p.bait='lure';else if(p.bait==='lure')p.bait='worm';
  if(Number.isFinite(raw.rig?.depth)&&raw.rig.depth>=.4&&raw.rig.depth<=3.2)p.rig.depth=raw.rig.depth;
  if(Number.isFinite(raw.rig?.lead)&&raw.rig.lead>=.7&&raw.rig.lead<=1.5)p.rig.lead=raw.rig.lead;
  for(const f of FISH){const c=raw.collection?.[f.id];if(c&&validInt(c.count,1,100000)&&Number.isFinite(c.best)&&c.best>0&&c.best<20)p.collection[f.id]={count:c.count,best:c.best};}
  p.lessons=[...new Set((raw.lessons||[]).filter(id=>LESSONS.some(l=>l.id===id)))];
  const c=raw.pending;
  if(c&&typeof c.id==='string'&&/^catch-\d+$/.test(c.id)&&FISH.some(f=>f.id===c.fishId)&&Number.isFinite(c.weight)&&c.weight>0&&c.weight<20&&validInt(c.value)&&MAPS.some(m=>m.id===c.mapId))p.pending={id:c.id,fishId:c.fishId,weight:c.weight,value:c.value,mapId:c.mapId};
  p.settings.assist=raw.settings?.assist!==false;p.settings.sound=raw.settings?.sound!==false;
  p.settings.deadline=[0,180,300].includes(raw.settings?.deadline)?raw.settings.deadline:0;
  return p;
}
export function loadPlayer(storage){
  try{const raw=storage.getItem(SAVE_KEY);return {player:raw?validateSave(JSON.parse(raw)):newPlayer(),warning:''};}
  catch{return {player:newPlayer(),warning:'Không đọc được bản lưu. Đang chơi bằng tiến độ mới.'};}
}
export function savePlayer(storage,player){try{storage.setItem(SAVE_KEY,JSON.stringify(player));return true;}catch{return false;}}
