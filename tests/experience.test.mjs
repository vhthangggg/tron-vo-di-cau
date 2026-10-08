import test from 'node:test';
import assert from 'node:assert/strict';
import {newPlayer,validateSave} from '../src/save.js';
import {FishingGame} from '../src/engine.js';
import {MAPS} from '../src/content.js';
import {MAX_KEPT_FISH,catchRemark} from '../src/catch-fate.js';
import {AUDIO_THEMES,musicBar} from '../src/game-audio.js';
import {loadSceneVideo} from '../src/scene-loader.js';

const fish=id=>({id:'catch-'+id,fishId:'fish_01',weight:.6,value:120,mapId:'AO',status:'kept'});
function pending(){const p=newPlayer();p.pending={...fish(1),status:'landed'};p.systems.trip={id:'trip-fixture',active:true,mapId:'AO',spotId:'ben-cau-tre'};p.catches=1;p.serial=1;p.collection.fish_01={count:1,best:.6};return p;}

test('Landed fish only keep or release; gifts are resolved once at home',()=>{
  for(const choice of ['keep','release']){
    const p=pending(),g=new FishingGame(p),coins=p.coins;
    assert.equal(g.resolveCatch('catch-1','gift'),false);assert.equal(g.resolveCatch('catch-1','sell'),false);assert(g.resolveCatch('catch-1',choice));assert.equal(g.resolveCatch('catch-1',choice),false);
    assert.equal(p.coins,coins);assert.equal(p.catches,1);assert.equal(p.collection.fish_01.count,1);
    assert.equal(p.gifted,0);assert.equal(p.released,choice==='release'?1:0);assert.equal(p.keptFish.length,choice==='keep'?1:0);
    assert.deepEqual(validateSave(JSON.parse(JSON.stringify(p))),p);assert.match(catchRemark(fish(1),choice),/.+/);
  }
});
test('A fish must be stored before it can be gifted from the keepnet',()=>{
  const p=pending(),g=new FishingGame(p);
  assert.equal(g.resolveKeptCatch('catch-1','gift'),false);assert.equal(g.resolveCatch('catch-1','gift'),false);assert.equal(p.gifted,0);
  assert(g.resolveCatch('catch-1','keep'));assert.equal(p.keptFish.length,1);
  assert.equal(g.resolveKeptCatch('catch-1','gift'),false);assert(g.returnHome());assert(g.resolveKeptCatch('catch-1','gift'));assert.equal(g.resolveKeptCatch('catch-1','gift'),false);
  assert.equal(p.pending,null);assert.equal(p.keptFish.length,0);assert.equal(p.gifted,1);
});
test('Stored fish sell exactly once; bulk sale and active-cast guards preserve the wallet',()=>{
  const p=pending(),g=new FishingGame(p);assert(g.resolveCatch('catch-1','keep'));
  p.keptFish.push(fish(2));p.serial=2;const initial=p.coins;
  g.cast();assert.equal(g.resolveKeptCatch('catch-1','sell'),false);assert.equal(g.sellKeptFish(),false);assert.equal(p.coins,initial);
  g.retrieve();assert.equal(g.resolveKeptCatch('catch-1','sell'),false);assert(g.returnHome());assert(g.resolveKeptCatch('catch-1','sell'));assert.equal(g.resolveKeptCatch('catch-1','sell'),false);assert.equal(p.coins,initial+120);
  assert(g.sellKeptFish());assert.equal(g.sellKeptFish(),false);assert.equal(p.coins,initial+240);assert.equal(p.sold,2);assert.equal(p.keptFish.length,0);
});
test('A full container retains the pending catch for another choice',()=>{
  const p=pending(),g=new FishingGame(p);p.keptFish=Array.from({length:MAX_KEPT_FISH},(_,i)=>fish(i+2));
  assert.equal(g.resolveCatch('catch-1','keep'),false);assert.equal(p.pending.id,'catch-1');assert.equal(p.keptFish.length,MAX_KEPT_FISH);
  assert.equal(g.resolveCatch('catch-1','gift'),false);assert(g.returnHome());assert(g.resolveCatch('catch-1','keep'));assert(g.resolveKeptCatch('catch-1','gift'));assert.equal(p.gifted,1);
});
test('Old saves gain audio/container defaults; invalid and duplicated kept records are ignored',()=>{
  const raw=pending();delete raw.keptFish;delete raw.container;delete raw.gifted;raw.settings={sound:false,assist:true,deadline:0};
  const old=validateSave(raw);assert.equal(old.settings.sound,false);assert.equal(old.settings.music,.45);assert.deepEqual(old.keptFish,[]);
  raw.keptFish=[fish(1),fish(2),fish(2),{...fish(3),fishId:'invalid'},{...fish(4),weight:-1},fish(5)];raw.container='bucket';raw.settings.music=4;raw.settings.effects=-1;
  const p=validateSave(raw);assert.deepEqual(p.keptFish.map(c=>c.id),['catch-2','catch-5']);assert.equal(p.serial,5);assert.equal(p.container,'bucket');assert.equal(p.settings.music,1);assert.equal(p.settings.effects,0);
});
test('Home and every map have a unique, bounded musical arrangement',()=>{
  assert(AUDIO_THEMES.home);const signatures=new Set();
  for(const id of ['home',...MAPS.map(m=>m.id)]){
    assert(AUDIO_THEMES[id]);const plans=Array.from({length:4},(_,i)=>musicBar(id,i));signatures.add(JSON.stringify(plans));
    for(const p of plans){assert(p.length>2&&p.length<5);assert(p.notes.length<=16);for(const n of p.notes){assert(n.at>=0&&n.at<p.length);assert(n.level>0&&n.level<.2);assert(n.midi>=24&&n.midi<=96);}}
  }
  assert.equal(signatures.size,MAPS.length+1);
});

class FakeVideo extends EventTarget{
  dataset={src:'/scene.mp4'};readyState=0;videoWidth=0;src='';paused=true;errorMode=false;plays=0;
  removeAttribute(key){if(key==='src')this.src='';}
  load(){if(this.src)queueMicrotask(()=>{if(!this.src)return;if(this.errorMode)this.dispatchEvent(new Event('error'));else{this.readyState=3;this.videoWidth=1280;this.dispatchEvent(new Event('loadeddata'));}});}
  pause(){this.paused=true;}
  play(){this.plays++;this.paused=false;return Promise.resolve();}
}
function urls(){const created=[],revoked=[];return {created,revoked,createObjectURL(blob){created.push(blob.size);return 'blob:test';},revokeObjectURL(url){revoked.push(url);}};}
test('Arrival waits for every byte and video decode, then releases its blob on departure',async()=>{
  const video=new FakeVideo(),urlAPI=urls(),progress=[];let secondChunk,firstProgress;
  const first=new Promise(resolve=>firstProgress=resolve);
  const body=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(4));secondChunk=()=>{controller.enqueue(new Uint8Array(6));controller.close();};}});
  let ready=0;
  const loader=loadSceneVideo(video,{urlAPI,fetcher:async()=>new Response(body,{headers:{'content-length':'10'}}),onProgress:p=>{progress.push(p);if(p.loaded===4)firstProgress();},onReady:()=>ready++});
  await first;assert.equal(ready,0);assert.equal(video.src,'');assert.equal(video.plays,0);
  secondChunk();assert(await loader.ready);assert.equal(ready,1);assert.equal(video.plays,1);assert.deepEqual(urlAPI.created,[10]);assert.equal(progress.at(-1).stage,'decode');
  loader.cancel();assert.equal(video.paused,true);assert.deepEqual(urlAPI.revoked,['blob:test']);
});
test('Failed, incomplete and undecodable scenes never enable fishing',async()=>{
  for(const mode of ['http','incomplete','decode']){
    const video=new FakeVideo(),urlAPI=urls();video.errorMode=mode==='decode';let reason,ready=0;
    const loader=loadSceneVideo(video,{urlAPI,fetcher:async()=>mode==='http'?new Response('',{status:503}):new Response(new Uint8Array(4),{headers:{'content-length':mode==='incomplete'?'10':'4'}}),onReady:()=>ready++,onError:e=>reason=e.reason});
    assert.equal(await loader.ready,false);assert.equal(ready,0);assert(reason);assert.equal(video.src,'');assert.equal(urlAPI.revoked.length,mode==='decode'?1:0);
  }
});
test('Canceled arrivals stay silent and stalled downloads time out',async()=>{
  for(const cancel of [true,false]){
    const video=new FakeVideo();let errors=0,reason;
    const loader=loadSceneVideo(video,{timeoutMs:15,fetcher:(_,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true})),onError:e=>{errors++;reason=e.reason;}});
    if(cancel)loader.cancel();assert.equal(await loader.ready,false);assert.equal(errors,cancel?0:1);if(!cancel)assert.equal(reason,'timeout');
  }
});
