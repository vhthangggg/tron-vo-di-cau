import test from 'node:test';
import assert from 'node:assert/strict';
import {RODS,getRod,usesReel} from '../src/content.js';
import {fightSoundState,lineSoundState,LINE_AUDIO_PROFILES,fillMaterialLineSound,fillFightSound} from '../src/game-audio.js';

const fight=(rod='rod_23',extra={})=>({phase:'fight',rod:getRod(rod),tension:55,surge:false,velocity:{x:.1,y:.06},hooked:{weight:.7},...extra});

test('Every hand rod has taut-line friction; every reel rod has a payout drag sound',()=>{
  for(const rod of RODS){
    const state=fightSoundState(fight(rod.id,{surge:true}));
    assert.equal(state.kind,usesReel(rod)?'drag':'line');assert(state.level>0);
  }
  const reel=RODS.find(usesReel).id;
  assert.equal(fightSoundState(fight(reel)).level,0,'A resting spool does not click');
  assert(fightSoundState(fight(reel,{velocity:{x:0,y:-.1}})).level>0,'Fish moving away takes line');
  assert.equal(fightSoundState(fight(reel,{tension:80})).level,0,'Tension alone cannot spin the spool');
});
test('Fighting sound follows pressure and movement, fades on slack and stops outside a fight',()=>{
  const soft=fightSoundState(fight('rod_23',{tension:36,hooked:{weight:.05}}));
  const hard=fightSoundState(fight('rod_23',{tension:78,surge:true,velocity:{x:.3,y:-.15},hooked:{weight:2}}));
  assert(hard.level>soft.level);assert(hard.rate>soft.rate);assert(hard.frequency>soft.frequency);
  assert.equal(fightSoundState(fight('rod_23',{tension:16})).level,0);
  assert.equal(fightSoundState(fight('rod_23',{paused:true})),null);
  for(const phase of ['idle','casting','waiting','nibble','bite','snag','landed','failed'])assert.equal(fightSoundState(fight('rod_23',{phase})),null);
});
test('Friction is continuous and drag is a distinct impulsive, bounded loop',()=>{
  const shapes=[];
  for(const kind of ['line','drag']){
    const samples=new Float32Array(48000);fillFightSound(samples,24000,kind);
    let peak=0,power=0;
    for(const v of samples){assert(Number.isFinite(v)&&Math.abs(v)<=1);peak=Math.max(peak,Math.abs(v));power+=v*v;}
    const rms=Math.sqrt(power/samples.length);assert(rms>.03);assert.equal(Math.abs(samples[0]),0);assert.equal(Math.abs(samples.at(-1)),0);
    if(kind==='line'){
      const lag=Math.round(24000/1850);let xy=0,xx=0,yy=0;
      for(let i=0;i<samples.length-lag;i++){xy+=samples[i]*samples[i+lag];xx+=samples[i]**2;yy+=samples[i+lag]**2;}
      assert(Math.abs(xy/Math.sqrt(xx*yy))<.6,'Line friction should not hold a steady motor-like pitch');
    }
    shapes.push({kind,crest:peak/rms});
  }
  assert(shapes[1].crest>shapes[0].crest*1.5,'Drag has pronounced ratchet clicks');
});

test('Bamboo has softer fibre friction while carbon poles sing and reels use ratchet drag',()=>{
 const bamboo=fightSoundState(fight('bamboo')),carbon=fightSoundState(fight('rod_23'));
 assert.equal(bamboo.timbre,'material:line_basic:bamboo');assert.equal(carbon.timbre,'material:line_basic');
 const a=new Float32Array(48000),b=new Float32Array(48000);fillFightSound(a,24000,'bamboo');fillFightSound(b,24000,'line');assert.notDeepEqual(a,b);assert(a.every(v=>Number.isFinite(v)&&Math.abs(v)<=1));
});

test('All six line materials have unique audio profiles and stable PCM',()=>{
  assert.equal(Object.keys(LINE_AUDIO_PROFILES).length,6);
  const waveforms=[];
  for(const id of Object.keys(LINE_AUDIO_PROFILES)){
    const state=lineSoundState(fight('rod_23',{player:{equipment:{line:id}},surge:true}));
    assert.equal(state.timbre,'material:'+id);
    const samples=new Float32Array(24000);
    fillMaterialLineSound(samples,24000,state.profile);
    assert(samples.every(v=>Number.isFinite(v)&&Math.abs(v)<=1));
    assert.equal(Math.abs(samples[0]),0);assert.equal(Math.abs(samples.at(-1)),0);
    waveforms.push(samples.slice(100,110));
  }
  assert.equal(new Set(waveforms.map(a=>a.join(','))).size,6);
});
