import {FishingGame} from './engine.js';
import {newPlayer} from './save.js';

// Version every change to the ranked simulation or its imported engine/content.
export const RANKED_RULES='pond-2026-10-v1';
export const RANKED_SECONDS=180;
export const RANKED_DT=.05;
export const RANKED_TICKS=RANKED_SECONDS/RANKED_DT;
export const MAX_RANKED_EVENTS=18000;
export function seasonKey(now=Date.now()){
  const d=new Date(now+7*3600000);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));
  return d.toISOString().slice(0,10);
}
export function seasonSeed(season){let h=2166136261;for(const c of RANKED_RULES+season)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>1;}
const round=x=>Math.round(x*10000)/10000;
const unit=x=>Number.isFinite(x)&&x>=0&&x<=1;
const shapes={cast:0,retrieve:0,releaseHands:0,holdRod:1,setForce:2,setTracking:3};
export function validEvent(e){
  if(!Array.isArray(e)||!Number.isInteger(e[0])||e[0]<0||e[0]>=RANKED_TICKS||!Object.hasOwn(shapes,e[1])||e.length!==2+shapes[e[1]])return false;
  if(e[1]==='holdRod')return unit(e[2]);
  if(e[1]==='setForce')return unit(e[2])&&typeof e[3]==='boolean';
  if(e[1]==='setTracking')return typeof e[2]==='boolean'&&unit(e[3])&&unit(e[4]);
  return true;
}
export function validateTrace(events){
  if(!Array.isArray(events)||events.length>MAX_RANKED_EVENTS)throw Error('Lượt chơi quá dài hoặc không hợp lệ.');
  let last=-1,count=0;
  for(const e of events){if(!validEvent(e)||e[0]<last)throw Error('Dữ liệu điều khiển không hợp lệ.');count=e[0]===last?count+1:1;if(count>64)throw Error('Quá nhiều thao tác cùng lúc.');last=e[0];}
  return events;
}
export class RankedChallenge{
  constructor(seed,{onChange=()=>{},record=true}={}){
    if(!Number.isInteger(seed)||seed<0||seed>2147483647)throw Error('Mã buổi câu không hợp lệ.');
    this.tick=0;this.events=[];this.catches=[];this.record=record;this.onChange=onChange;
    const p=newPlayer({now:0});p.settings.deadline=0;p.settings.sound=false;
    this.game=new FishingGame(p,{seed,wallClock:()=>0,onChange:g=>{
      if(g.phase==='landed'&&g.player.pending){
        const c=g.player.pending;this.catches.push({ordinal:this.catches.length+1,fishId:c.fishId,weightGrams:Math.round(c.weight*1000),tick:this.tick,mapId:'AO'});
        g.resolveCatch(c.id,'release');
      }
      this.onChange(this);
    }});
    this.game.balance();this.game.beginTrip();
    const self=this;
    this.controls={get phase(){return self.game.phase;},get aim(){return self.game.aim;}};
    for(const method of Object.keys(shapes))this.controls[method]=(...args)=>this.command(method,...args);
  }
  get finished(){return this.tick>=RANKED_TICKS;}
  get scoreGrams(){return this.catches.reduce((sum,c)=>sum+c.weightGrams,0);}
  command(method,...args){
    if(this.finished)return false;
    if(method==='setTracking'){args=[args[0],Math.max(0,Math.min(1,args[1]??this.game.aim.x)),Math.max(0,Math.min(1,args[2]??this.game.aim.y))];}
    if(method==='setForce')args=[args[0],args[1]??true];
    args=args.map(v=>typeof v==='number'?round(v):v);
    const event=[this.tick,method,...args];if(!validEvent(event))throw Error('Thao tác không hợp lệ.');
    if(method==='setForce'&&this.game.pulling===args[1]&&(!args[1]||this.game.force===args[0]))return true;
    if(method==='setTracking'&&this.game.tracking===args[0]&&(!args[0]||this.game.aim.x===args[1]&&this.game.aim.y===args[2]))return true;
    if(this.record){
      const previous=this.events.at(-1);
      const sameControl=method==='setTracking'?previous?.[2]===args[0]:method==='setForce'?previous?.[3]===args[1]:false;
      if(sameControl&&previous?.[0]===this.tick&&previous[1]===method)this.events[this.events.length-1]=event;
      else {if(this.events.length>=MAX_RANKED_EVENTS)throw Error('Lượt chơi vượt giới hạn thao tác.');this.events.push(event);}
    }
    return this.game[method](...args);
  }
  step(){if(this.finished)return;this.game.step(RANKED_DT);this.tick++;}
}
export function replayRanked(seed,events){
  validateTrace(events);const run=new RankedChallenge(seed,{record:false});let at=0;
  while(!run.finished){while(at<events.length&&events[at][0]===run.tick){const e=events[at++];run.command(e[1],...e.slice(2));}run.step();}
  return {scoreGrams:run.scoreGrams,catches:run.catches,ticks:run.tick,rules:RANKED_RULES};
}
