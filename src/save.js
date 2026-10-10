import {FISH, MAPS, RODS, BAITS, ACCESSORIES, ACCESSORY_SLOTS, LESSONS, getRod, getBait, getFish, acceptsBait} from './content.js';
import {CONTAINERS} from './catch-fate.js';
import {BAG_TYPES, ensureInventory, carriedBaitCount, migratePacking} from './inventory.js';
import {newGarden,normalizeGarden} from './garden.js';

// The existing storage key and v1 marker stay readable; schemaVersion is additive.
export const SAVE_KEY='tron-vo-di-cau.v01';
export const SCHEMA_VERSION=3;
export const SAVE_BACKUP_KEY=SAVE_KEY+'.backup';
export const SAVE_CORRUPT_KEY=SAVE_KEY+'.corrupt';
const validInt=(v,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const record=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const array=v=>Array.isArray(v)?v:[];
const safeId=(v,max=128)=>typeof v==='string'&&v.length>0&&v.length<=max;
const rigBounds={depth:[.4,18],lead:[.4,3.5],leaderMm:[.10,.45],leaderLength:[.10,1.5],hookSize:[1,12],sinkerDistance:[.05,1.5]};
const protection=new WeakMap();
const protect=(storage,state)=>{if(storage&&(typeof storage==='object'||typeof storage==='function'))protection.set(storage,state);};

export function newPlayer({now=Date.now()}={}){
 const base=ACCESSORIES.filter(a=>a.price===0);
 const player={version:1,schemaVersion:SCHEMA_VERSION,coins:12000,baits:{...Object.fromEntries(BAITS.map(b=>[b.id,0])),worm:18,dough:6,corn:6},rods:['bamboo'],maps:['AO'],accessories:base.map(a=>a.id),equipment:Object.fromEntries(base.map(a=>[a.slot,a.id])),rod:'bamboo',bait:'worm',map:'AO',rig:{depth:MAPS[0].spots[0].depth,lead:1.08,leaderMm:.16,leaderLength:.25,hookSize:4,sinkerDistance:.25},catches:0,released:0,sold:0,gifted:0,cooked:0,container:'keepnet',keptFish:[],homeFish:[],casts:0,collection:{},lessons:[],pending:null,serial:0,settings:{assist:true,sound:true,music:.45,effects:.7,deadline:0},systems:{inventory:null,flags:{inventory:true,economy:true,bait:true,rig:true,tutorial:true,catch:true},tutorial:{},transactions:[],sequence:0,bags:['cloth'],mountedBait:null,rigPresets:[],trip:null,gearInstances:[]}};
 player.systems.garden=newGarden(now);ensureInventory(player);
 return player;
}

function restoredRig(raw,fallback,{strict=false}={}){
 if(!record(raw))return strict?null:{...fallback};
 const rig={...fallback};
 for(const [key,[min,max]] of Object.entries(rigBounds)){
  const value=raw[key];
  if(Number.isFinite(value)&&value>=min&&value<=max&&(key!=='hookSize'||Number.isInteger(value)))rig[key]=value;
  else if(strict&&value!==undefined)return null;
 }
 return rig;
}
function catchRecord(raw,status){
 if(record(raw)&&raw.fishId==='fish_55')raw={...raw,fishId:getFish(raw.fishId).id};
 if(!record(raw)||typeof raw.id!=='string'||!/^catch-\d+$/.test(raw.id)||!validInt(Number(raw.id.slice(6)),1)||!FISH.some(f=>f.id===raw.fishId)||!Number.isFinite(raw.weight)||raw.weight<=0||raw.weight>50||!validInt(raw.value)||!MAPS.some(m=>m.id===raw.mapId))return null;
 const fish={id:raw.id,fishId:raw.fishId,weight:raw.weight,value:raw.value,mapId:raw.mapId,status};
 if(validInt(raw.caughtAt,0,1e15)||(typeof raw.caughtAt==='string'&&raw.caughtAt.length<=64&&Number.isFinite(Date.parse(raw.caughtAt))))fish.caughtAt=raw.caughtAt;
 return fish;
}

export function validateSave(raw,{now=Date.now()}={}){
 if(!record(raw)||raw.version!==1||!validInt(raw.coins)||!validInt(raw.catches)||!validInt(raw.serial))throw Error('Save không hợp lệ');
 if(raw.schemaVersion!==undefined&&!validInt(raw.schemaVersion,1,SCHEMA_VERSION)){
  const error=Error('Phiên bản bản lưu chưa được hỗ trợ');error.code='schema';throw error;
 }
 const p=newPlayer({now});
 for(const key of ['coins','catches','released','sold','gifted','cooked','casts','serial'])if(validInt(raw[key]))p[key]=raw[key];
 for(const bait of BAITS)if(validInt(raw.baits?.[bait.id]))p.baits[bait.id]=raw.baits[bait.id];
 p.rods=[...new Set(['bamboo',...array(raw.rods).filter(id=>RODS.some(r=>r.id===id))])];
 p.maps=[...new Set(['AO',...array(raw.maps).filter(id=>MAPS.some(m=>m.id===id))])];
 p.accessories=[...new Set([...p.accessories,...array(raw.accessories).filter(id=>ACCESSORIES.some(a=>a.id===id))])];
 for(const slot of Object.keys(ACCESSORY_SLOTS))if(p.accessories.includes(raw.equipment?.[slot])&&ACCESSORIES.some(a=>a.id===raw.equipment[slot]&&a.slot===slot))p.equipment[slot]=raw.equipment[slot];
 p.rod=p.rods.includes(raw.rod)?raw.rod:'bamboo';p.map=p.maps.includes(raw.map)?raw.map:'AO';
 // v1 omitted the included soft lure; do not regenerate a lost lure in new saves.
 if((raw.schemaVersion??1)<2&&p.rods.some(id=>getRod(id).tech==='lure'))p.baits.lure=Math.max(1,p.baits.lure);
 const rod=getRod(p.rod),bait=getBait(raw.bait);
 p.bait=BAITS.some(b=>b.id===raw.bait)&&acceptsBait(rod,bait)?bait.id:rod.tech==='lure'?'lure':'worm';
 p.rig=restoredRig(raw.rig,p.rig);
 if((raw.schemaVersion??1)<2&&p.map==='AO'&&raw.rig?.depth===1.8)p.rig.depth=MAPS[0].spots[0].depth;
 for(const fish of FISH){
  const c=raw.collection?.[fish.id];
  if(record(c)&&validInt(c.count,1)&&Number.isFinite(c.best)&&c.best>0&&c.best<=50)p.collection[fish.id]={count:c.count,best:c.best};
 }
 const alias=raw.collection?.fish_55;
 if(record(alias)&&validInt(alias.count,1)&&Number.isFinite(alias.best)&&alias.best>0&&alias.best<=50){
  const current=p.collection.fish_07||{count:0,best:0},count=current.count+alias.count;
  if(validInt(count,1))p.collection.fish_07={count,best:Math.max(current.best,alias.best)};
 }
 p.lessons=[...new Set(array(raw.lessons).filter(id=>LESSONS.some(l=>l.id===id)))];
 if(CONTAINERS.some(c=>c.id===raw.container))p.container=raw.container;
 p.settings.assist=raw.settings?.assist!==false;p.settings.sound=raw.settings?.sound!==false;
 for(const key of ['music','effects'])if(Number.isFinite(raw.settings?.[key]))p.settings[key]=Math.max(0,Math.min(1,raw.settings[key]));
 p.settings.deadline=[0,180,300].includes(raw.settings?.deadline)?raw.settings.deadline:0;

 const s=record(raw.systems)?raw.systems:{};
 p.systems.garden=normalizeGarden(s.garden,now);
 p.systems.flags=Object.fromEntries(Object.keys(p.systems.flags).map(key=>[key,s.flags?.[key]!==false]));
 p.systems.bags=[...new Set(['cloth',...array(s.bags).filter(id=>Object.hasOwn(BAG_TYPES,id))])];
 // Receipts are never truncated: deleting old rewards would enable replay after reload.
 p.systems.transactions=[...new Set(array(s.transactions).filter(id=>safeId(id)))];
 p.systems.sequence=validInt(s.sequence)?s.sequence:0;
 for(const id of p.systems.transactions){
  const sequence=Number(id.match(/:(\d+)$/)?.[1]);
  if(validInt(sequence))p.systems.sequence=Math.max(p.systems.sequence,sequence);
 }
 if(record(s.tutorial))for(const [id,state] of Object.entries(s.tutorial)){
  if(/^[a-z0-9_-]{1,64}$/i.test(id)&&!['__proto__','constructor','prototype'].includes(id)&&record(state)&&state.completed===true)p.systems.tutorial[id]={completed:true,claimed:state.claimed===true};
 }
 if(record(s.inventory))p.systems.inventory=s.inventory;
 else p.systems.inventory=null;
 p.systems.gearInstances=array(s.gearInstances);
 migratePacking(p,raw);
 ensureInventory(p);

 const mounted=s.mountedBait,definition=BAITS.find(b=>b.id===mounted?.id);
 if(record(mounted)&&definition&&mounted.id===p.bait&&mounted.condition==='intact'&&mounted.consumed===false&&carriedBaitCount(p,mounted.id)>0){
  p.systems.mountedBait={id:mounted.id,condition:'intact',consumed:false,reusable:definition.reusable===true};
  p.systems.mountedBait.mountId=safeId(mounted.mountId)?mounted.mountId:`bait:${++p.systems.sequence}`;
 }
 const trip=s.trip;
 if(record(trip)&&safeId(trip.id)&&p.maps.includes(trip.mapId)&&safeId(trip.spotId)&&trip.active===true)p.systems.trip={id:trip.id,mapId:trip.mapId,spotId:trip.spotId,active:true};
 const presetIds=new Set();
 for(const preset of array(s.rigPresets)){
  if(p.systems.rigPresets.length>=12)break;
  if(!record(preset)||!safeId(preset.id,64)||presetIds.has(preset.id)||!safeId(preset.name,64)||!p.rods.includes(preset.rod)||!BAITS.some(b=>b.id===preset.bait)||!acceptsBait(getRod(preset.rod),getBait(preset.bait))||!record(preset.equipment))continue;
  const equipment={};let valid=true;
  for(const slot of Object.keys(ACCESSORY_SLOTS)){
   const id=preset.equipment[slot];
   if(!p.accessories.includes(id)||!ACCESSORIES.some(a=>a.id===id&&a.slot===slot)){valid=false;break;}
   equipment[slot]=id;
  }
  const rig=restoredRig(preset.rig,p.rig,{strict:true});
  if(!valid||!rig)continue;
  presetIds.add(preset.id);p.systems.rigPresets.push({id:preset.id,name:preset.name,rod:preset.rod,bait:preset.bait,equipment,rig});
 }

 const seen=new Set();
 const addCatch=(rawFish,status,destination)=>{
  const fish=catchRecord(rawFish,status);
  if(!fish||seen.has(fish.id))return;
  seen.add(fish.id);p.serial=Math.max(p.serial,Number(fish.id.slice(6)));
  if(destination)destination.push(fish);else p.pending=fish;
 };
 addCatch(raw.pending,'landed');
 for(const fish of array(raw.homeFish))addCatch(fish,'home',p.homeFish);
 // Existing catches are assets. A newly selected smaller keepnet never deletes them.
 const destination=raw.schemaVersion!==SCHEMA_VERSION&&!p.systems.trip?p.homeFish:p.keptFish;
 for(const fish of array(raw.keptFish))addCatch(fish,destination===p.homeFish?'home':'kept',destination);
 return p;
}

function preserveCorrupt(storage,raw){
 if(typeof raw!=='string'||!raw.length)return;
 try{storage.setItem(SAVE_CORRUPT_KEY,raw);}catch{/* Continue read-only if storage is unavailable. */}
}
function verifyBackup(storage){
 try{
  const raw=storage.getItem(SAVE_BACKUP_KEY);
  return raw?{player:validateSave(JSON.parse(raw)),raw}:null;
 }catch{return null;}
}

export function loadPlayer(storage){
 let raw;
 try{
  raw=storage.getItem(SAVE_KEY);
  if(!raw){protect(storage,{blocked:false});return {player:newPlayer(),warning:''};}
  const parsed=JSON.parse(raw),player=validateSave(parsed);
  protect(storage,{blocked:false,needsBackup:parsed.schemaVersion!==SCHEMA_VERSION?raw:null});
  return {player,warning:''};
 }catch(error){
  if(error?.code==='schema'){
   protect(storage,{blocked:true});
   return {player:newPlayer(),warning:'Phiên bản này chưa đọc được bản lưu đó. Đang chơi tạm và giữ nguyên bản lưu cũ.'};
  }
  preserveCorrupt(storage,raw);
  const backup=verifyBackup(storage);
  if(backup){
   protect(storage,{blocked:false,recovered:true});
   return {player:backup.player,warning:'Bản lưu hiện tại bị lỗi. Đã khôi phục bản dự phòng; bản lỗi được giữ lại.'};
  }
  protect(storage,{blocked:true});
  return {player:newPlayer(),warning:'Không đọc được bản lưu. Đang chơi tạm; bản lưu cũ được giữ lại và sẽ không bị ghi đè.'};
 }
}

export function savePlayer(storage,player){
 try{
  let state=protection.get(storage);
  if(state?.blocked)return false;
  if(!state){
   const previous=storage.getItem(SAVE_KEY);
   if(previous){
    try{
     const parsed=JSON.parse(previous);validateSave(parsed);
     state={blocked:false,needsBackup:parsed.schemaVersion!==SCHEMA_VERSION?previous:null};
    }catch{
     preserveCorrupt(storage,previous);protect(storage,{blocked:true});return false;
    }
   }else state={blocked:false};
  }
  // A failed backup leaves the original untouched. Migration is not a reset.
  if(state.needsBackup){storage.setItem(SAVE_BACKUP_KEY,state.needsBackup);state.needsBackup=null;}
  const normalized=validateSave(player);
  storage.setItem(SAVE_KEY,JSON.stringify(normalized));
  Object.assign(player,normalized);
  protect(storage,state);
  return true;
 }catch{return false;}
}

// Explicit restore/import only: validate and preserve the previous bytes before
// clearing the read-only protection applied to a corrupt or future-version save.
export function restorePlayer(storage,raw){
 const player=validateSave(raw),previous=storage.getItem(SAVE_KEY);
 if(previous)storage.setItem(SAVE_KEY+'.before-restore',previous);
 storage.setItem(SAVE_KEY,JSON.stringify(player));
 protect(storage,{blocked:false});
 return player;
}
