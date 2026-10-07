import test from 'node:test';
import assert from 'node:assert/strict';
import {RODS,getRod,usesReel} from '../src/content.js';
import {fightSoundState,fillFightSound} from '../src/game-audio.js';

const fight=(rod='dai54',extra={})=>({phase:'fight',rod:getRod(rod),tension:55,surge:false,velocity:{x:.1,y:.06},hooked:{weight:.7},...extra});

test('Every hand rod has taut-line friction; every reel rod has a payout drag sound',()=>{
  for(const rod of RODS){
    const state=fightSoundState(fight(rod.id,{surge:true}));
    assert.equal(state.kind,usesReel(rod)?'drag':'line');assert(state.level>0);
  }
  const reel=RODS.find(usesReel).id;
  assert.equal(fightSoundState(fight(reel)).level,0,'A resting spool does not click');
  assert(fightSoundState(fight(reel,{velocity:{x:0,y:-.1}})).level>0,'Fish moving away takes line');
  assert(fightSoundState(fight(reel,{tension:80})).level>0,'High tension slips the spool');
});
test('Fighting sound follows pressure and movement, fades on slack and stops outside a fight',()=>{
  const soft=fightSoundState(fight('dai54',{tension:36,hooked:{weight:.05}}));
  const hard=fightSoundState(fight('dai54',{tension:78,surge:true,velocity:{x:.3,y:-.15},hooked:{weight:2}}));
  assert(hard.level>soft.level);assert(hard.rate>soft.rate);assert(hard.frequency>soft.frequency);
  assert.equal(fightSoundState(fight('dai54',{tension:16})).level,0);
  assert.equal(fightSoundState(fight('dai54',{paused:true})),null);
  for(const phase of ['idle','casting','waiting','nibble','bite','snag','landed','failed'])assert.equal(fightSoundState(fight('dai54',{phase})),null);
});
test('Friction is continuous and drag is a distinct impulsive, bounded loop',()=>{
  const shapes=[];
  for(const kind of ['line','drag']){
    const samples=new Float32Array(48000);fillFightSound(samples,24000,kind);
    let peak=0,power=0;
    for(const v of samples){assert(Number.isFinite(v)&&Math.abs(v)<=1);peak=Math.max(peak,Math.abs(v));power+=v*v;}
    const rms=Math.sqrt(power/samples.length);assert(rms>.03);assert.equal(Math.abs(samples[0]),0);assert.equal(Math.abs(samples.at(-1)),0);
    shapes.push({kind,crest:peak/rms});
  }
  assert(shapes[1].crest>shapes[0].crest*1.5,'Drag has pronounced ratchet clicks');
});
