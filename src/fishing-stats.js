import {FISH} from './content.js';

const DAY=86400000,OFFSET=7*3600000;
const count=v=>Number.isSafeInteger(v)&&v>=0;
export const fishingDay=(now=Date.now())=>new Date(now+OFFSET).toISOString().slice(0,10);
export function fishingPeriod(period,now=Date.now()){
 const day=fishingDay(now),time=Date.parse(day+'T00:00:00Z');
 if(period==='all')return {day,from:null,until:null};
 const start=period==='week'?time-((new Date(time).getUTCDay()+6)%7)*DAY:time;
 return {day,from:new Date(start).toISOString().slice(0,10),until:new Date(start+(period==='week'?7:1)*DAY).toISOString().slice(0,10)};
}

// Daily cumulative counters survive offline play; cloud writes merge high-water marks.
// These are personal progress rankings, separate from server-replayed challenge results.
export function normalizeFishingStats(input,{now=Date.now(),catches=0,released=0,collection={}}={}){
 if(!Array.isArray(input))return [];
 const today=fishingDay(now),rows=new Map();
 for(const row of input.slice(0,3660)){
  if(!row||!/^\d{4}-\d{2}-\d{2}$/.test(row.day)||!Number.isFinite(Date.parse(row.day))||new Date(row.day+'T00:00:00Z').toISOString().slice(0,10)!==row.day||row.day>today||row.day<'2020-01-01'||!count(row.catches)||!count(row.released)||row.catches>catches||row.released>released)continue;
  const best=row.best,valid=best&&FISH.some(f=>f.id===best.fishId)&&Number.isInteger(best.weightGrams)&&best.weightGrams>0&&best.weightGrams<=50000&&best.weightGrams<=Math.round((collection[best.fishId]?.best||0)*1000)+1;
  const next={day:row.day,catches:row.catches,released:row.released,best:valid?{fishId:best.fishId,weightGrams:best.weightGrams}:null},old=rows.get(row.day);
  if(old){next.catches=Math.max(old.catches,next.catches);next.released=Math.max(old.released,next.released);if((old.best?.weightGrams||0)>(next.best?.weightGrams||0))next.best=old.best;}
  rows.set(row.day,next);
 }
 const result=[...rows.values()].sort((a,b)=>a.day.localeCompare(b.day));
 if(result.reduce((n,r)=>n+r.catches,0)>catches||result.reduce((n,r)=>n+r.released,0)>released)return [];
 return result;
}
function dayRow(player,now){
 player.systems??={};player.systems.fishingStats??=[];
 const day=fishingDay(now);let row=player.systems.fishingStats.find(r=>r.day===day);
 if(!row){row={day,catches:0,released:0,best:null};player.systems.fishingStats.push(row);}
 return row;
}
export function recordFishingCatch(player,fish,now=Date.now()){
 const row=dayRow(player,now);row.catches++;
 const weightGrams=Math.round(fish.weight*1000);
 if(weightGrams>0&&weightGrams>(row.best?.weightGrams||0))row.best={fishId:fish.fishId,weightGrams};
}
export function recordFishingRelease(player,now=Date.now()){dayRow(player,now).released++;}
