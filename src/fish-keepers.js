import {FISH_KEEPERS} from './fish-keeper-catalog.js';
export {FISH_KEEPERS};

export const STARTER_KEEPER='fish_keeper_01';
export const LEGACY_KEEPERS=Object.freeze({keepnet:'fish_keeper_08',bucket:'fish_keeper_05',box:'fish_keeper_07'});
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const resolveKeeperId=id=>Object.hasOwn(LEGACY_KEEPERS,id)?LEGACY_KEEPERS[id]:id;
export const findFishKeeper=id=>FISH_KEEPERS.find(keeper=>keeper.id===resolveKeeperId(id));
export const getFishKeeper=id=>findFishKeeper(id)||FISH_KEEPERS[0];
export const ownedFishKeepers=player=>FISH_KEEPERS.filter(keeper=>keeper.id===STARTER_KEEPER||player.fishKeepers?.includes(keeper.id));
export function keeperDurability(player,id=player.container){
 const keeper=getFishKeeper(id),value=player.systems?.keeperDurability?.[keeper.id];
 return Number.isFinite(value)?clamp(value,0,keeper.durabilityMax):keeper.durabilityMax;
}

/** Old free containers are exchanged for keepers with at least their former capacity. */
export function normalizeKeeperState(player,raw=player){
 const migrated=!Array.isArray(raw.fishKeepers)||Object.hasOwn(LEGACY_KEEPERS,raw.container);
 const owned=[STARTER_KEEPER,...(migrated?Object.values(LEGACY_KEEPERS):[]),...(Array.isArray(raw.fishKeepers)?raw.fishKeepers:[])];
 const ids=[...new Set(owned.filter(id=>FISH_KEEPERS.some(keeper=>keeper.id===id)))];
 const selected=resolveKeeperId(raw.container),durability=raw.systems?.keeperDurability,seconds=raw.systems?.keeperSeconds;
 player.fishKeepers=ids;
 player.container=ids.includes(selected)?selected:migrated?LEGACY_KEEPERS.keepnet:STARTER_KEEPER;
 player.systems??={};
 player.systems.keeperDurability=Object.fromEntries(ids.map(id=>{
  const max=getFishKeeper(id).durabilityMax,value=durability?.[id];
  return [id,Number.isFinite(value)?clamp(value,0,max):max];
 }));
 player.systems.keeperSeconds=Number.isFinite(seconds)&&seconds>=0&&seconds<60?seconds:0;
 return player;
}

export function keeperRepairCost(player,id=player.container){
 const keeper=getFishKeeper(id),missing=keeper.durabilityMax-keeperDurability(player,id);
 return missing<=0?0:Math.ceil(keeper.price*.15*missing/keeper.durabilityMax);
}
export function normalizeFishCare(raw){
 if(!['vitality','freshness','condition','isAlive'].some(key=>Object.hasOwn(raw,key)))return {};
 const percent=key=>Number.isFinite(raw[key])?clamp(raw[key],0,100):100;
 const vitality=raw.isAlive===false?0:percent('vitality');
 return {vitality,freshness:percent('freshness'),condition:percent('condition'),isAlive:vitality>0};
}
export const initialFishCare=()=>({vitality:100,freshness:100,condition:100,isAlive:true});
export const isLivingCatch=fish=>fish.isAlive!==false&&(fish.vitality??100)>0;
export function fishQuality(fish){
 if((fish.freshness??100)<35)return {key:'spoiled',label:'Cá ươn',multiplier:.2};
 if((fish.condition??100)<55)return {key:'damaged',label:'Cá trầy / dập',multiplier:.6};
 if(isLivingCatch(fish)&&(fish.freshness??100)>=70)return {key:'alive',label:'Cá còn sống',multiplier:1};
 return {key:'fresh',label:'Cá tươi',multiplier:.85};
}
export const catchSaleValue=fish=>Math.round(fish.value*fishQuality(fish).multiplier);

/** Only active playing time at the bank counts; paused/closed sessions and home storage do not age fish. */
export function advanceFishKeeping(player,seconds){
 if(!player.systems?.trip?.active||!player.keptFish?.length||!Number.isFinite(seconds)||seconds<=0)return false;
 const total=(player.systems.keeperSeconds||0)+seconds,minutes=Math.floor((total+1e-8)/60);
 player.systems.keeperSeconds=Math.max(0,total-minutes*60);
 if(!minutes)return false;
 const keeper=getFishKeeper(player.container),weight=player.keptFish.reduce((sum,fish)=>sum+fish.weight,0);
 const load=weight/keeper.capacityKg,overload=1+Math.max(0,load-1)*1.5;
 let durability=keeperDurability(player);
 for(let minute=0;minute<minutes;minute++){
  const integrity=Math.max(.2,durability/keeper.durabilityMax),water=keeper.waterRetention*integrity;
  const protection=keeper.freshnessProtection*integrity,resist=keeper.damageResist*integrity;
  for(const fish of player.keptFish){
   Object.assign(fish,{...initialFishCare(),...normalizeFishCare(fish)});
   const alive=isLivingCatch(fish),stress=Math.min(6,2+fish.weight*.35);
   fish.vitality=Math.max(0,fish.vitality-(alive?stress*overload*(1-water):0));
   fish.freshness=Math.max(0,fish.freshness-(alive?.4:.9)*overload*(1-protection));
   fish.condition=Math.max(0,fish.condition-(alive?.35:.1)*overload*(1-resist));
   fish.isAlive=fish.vitality>0;
  }
  durability=Math.max(0,durability-(.03+Math.max(0,load-.8)*.2+.08*(1-resist)));
 }
 player.systems.keeperDurability[keeper.id]=durability;
 return true;
}
