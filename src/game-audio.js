import {usesReel} from './content.js';

// Original, gently paced arrangements. No downloads, autoplay or third-party music.
export const AUDIO_THEMES = {
  home:{title:'Hiên nhà',root:50,bpm:68,mode:'major',voice:'nylon',air:'birds'},
  AO:{title:'Sớm ở ao làng',root:50,bpm:64,mode:'major',voice:'nylon',air:'birds'},
  KENH:{title:'Gió đồng',root:55,bpm:70,mode:'major',voice:'nylon',air:'water'},
  HO:{title:'Mây trên hồ',root:57,bpm:60,mode:'minor',voice:'piano',air:'wind'},
  SONG:{title:'Nước xuôi bãi bồi',root:48,bpm:72,mode:'major',voice:'nylon',air:'water'},
  SUOI:{title:'Suối dưới tán cây',root:52,bpm:66,mode:'minor',voice:'piano',air:'birds'},
  MT:{title:'Chiều miền Tây',root:53,bpm:68,mode:'major',voice:'nylon',air:'water'},
  DICHVU:{title:'Một ngày thảnh thơi',root:60,bpm:74,mode:'major',voice:'piano',air:'birds'},
  DAP:{title:'Khoảng trời lòng đập',root:50,bpm:58,mode:'minor',voice:'piano',air:'wind'},
  CSONG:{title:'Con nước lặng',root:55,bpm:62,mode:'minor',voice:'nylon',air:'water'},
  GHE:{title:'Gió qua ghềnh',root:48,bpm:60,mode:'major',voice:'piano',air:'wind'}
};
export const audioTheme = id => AUDIO_THEMES[id]||AUDIO_THEMES.home;
const hz = midi => 440*2**((midi-69)/12);
const clamp = n => Math.max(0,Math.min(1,Number.isFinite(n)?n:0));

export const LINE_AUDIO_PROFILES = Object.freeze({
  line_basic:{tone:0.64,roughness:0.88,air:0.27,flutter:0.82},
  line18:{tone:0.82,roughness:0.35,air:0.38,flutter:0.35},
  braid:{tone:1.32,roughness:0.82,air:0.73,flutter:0.65},
  line_copolymer:{tone:1.05,roughness:0.42,air:0.49,flutter:0.3},
  line_fluorocarbon:{tone:1.19,roughness:0.62,air:0.55,flutter:0.26},
  line_carbyne:{tone:1.68,roughness:0.17,air:0.74,flutter:0.12}
});
export function lineSoundState(game){
  if(game.phase!=='fight'||game.paused)return null;
  const id=game.player?.equipment?.line||'line_basic';
  const profile=LINE_AUDIO_PROFILES[id]||LINE_AUDIO_PROFILES.line_basic;
  const tension=clamp(game.tension/100);
  const motion=clamp(Math.hypot(game.velocity?.x||0,game.velocity?.y||0)/.35);
  const load=clamp(Math.sqrt(Math.max(0,game.hooked?.weight||0)/Math.max(.1,game.rod.power))/1.3);
  const active=tension>.28&&(motion>.08||game.surge||game.pulling);
  return {kind:'line',timbre:'material:'+id,profile,
    level:active?(.055+Math.max(0,tension-.28)*.19+motion*.045+load*.035):0,
    rate:.72+motion*.44+tension*.26,
    frequency:(850+tension*1050+motion*370)*profile.tone};
}
export function fightSoundState(game){
  if(game.phase!=='fight'||game.paused)return null;
  const reel=usesReel(game.rod);
  if(!reel)return lineSoundState(game);
  const tension=clamp(game.tension/100);
  const motion=clamp(Math.hypot(game.velocity?.x||0,game.velocity?.y||0)/.35);
  const load=clamp(Math.sqrt(Math.max(0,game.hooked?.weight||0)/Math.max(.1,game.rod.power))/1.3);
  // Drag is a spool mechanism, not simply high line tension.
  const payingOut=game.surge||(game.velocity?.y||0)<-.025;
  const active=tension>.35&&payingOut;
  return {kind:'drag',timbre:'drag',level:active?(.09+Math.max(0,tension-.28)*.26+load*.06+motion*.025):0,
    rate:.65+motion*.75+tension*.7+(game.surge?.25:0),
    frequency:650+tension*700};
}

// Seamless friction and ratchet PCM, cached once per AudioContext.
export function fillFightSound(samples,rate,kind){
  let seed=kind==='drag'?73:191,pink=0,body=0,phase=0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1;};
  const duration=samples.length/rate,clicks=Math.round(duration*28),cycle=samples.length/clicks;
  for(let i=0;i<samples.length;i++){
    const t=i/rate,noise=random();pink=pink*.96+noise*.04;
    if(kind==='drag'){
      const click=(i%cycle)/rate,envelope=Math.exp(-click/ .0028);
      samples[i]=envelope*(noise*.42+Math.sin(2*Math.PI*2300*click)*.34+Math.sin(2*Math.PI*3700*click)*.12)+pink*.08;
    }else if(kind==='bamboo'){
      // Midrange line rub stays audible on phone speakers; low fibre creaks alone
      // disappear through a bandpass. A bamboo pole still has no spool ratchet.
      body=body*.975+noise*.025;
      const flex=.55+.3*Math.sin(2*Math.PI*t*1.7)+.15*Math.sin(2*Math.PI*t*3.1+.8);
      phase+=2*Math.PI*(1150+120*Math.sin(2*Math.PI*t*2.1/duration))/rate;
      const rub=(noise-body)*.36+pink*.2;
      const squeak=Math.sin(phase)*.13+Math.sin(phase*1.71+.8)*.035;
      samples[i]=(body*.65+rub+squeak)*flex;
    }else{
      // A moving inharmonic guide squeak sits inside a soft abrasive hiss;
      // its uneven pitch and level avoid the steady motor-like note.
      body=body*.985+noise*.015;
      phase+=2*Math.PI*(1550+115*Math.sin(2*Math.PI*t*2.1/duration)+58*Math.sin(2*Math.PI*t*.63/duration))/rate;
      const flutter=.9+.07*Math.sin(2*Math.PI*t*2.3/duration)+.03*Math.sin(2*Math.PI*t*6.7/duration);
      const rub=(noise-body*.72)*.28+pink*.18;
      const squeak=Math.sin(phase)*.085+Math.sin(phase*1.93+.7)*.025;
      samples[i]=(rub+squeak)*flutter;
    }
  }
  // Remove the loop seam without changing the repeated texture.
  const edge=Math.min(Math.floor(rate*.005),Math.floor(samples.length/2));
  for(let i=0;i<edge;i++){const fade=i/edge;samples[i]*=fade;samples[samples.length-1-i]*=fade;}
}
// A material-specific friction loop; no machine ratchet is mixed into pole sounds.
export function fillMaterialLineSound(samples,rate,profile){
  let seed=293,pink=0,phase=0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1;};
  for(let i=0;i<samples.length;i++){
    const t=i/rate,noise=random();pink=pink*.955+noise*.045;
    const vibrato=1+.024*Math.sin(t*13.1)+.013*Math.sin(t*29.7);
    phase+=2*Math.PI*(1100*profile.tone*vibrato)/rate;
    const texture=(noise-pink)*profile.roughness*.23+pink*profile.air*.26;
    const filament=Math.sin(phase)*(.06+.075*profile.air);
    const flutter=1-profile.flutter*.19*(.5+.5*Math.sin(t*37));
    samples[i]=(texture+filament)*flutter;
  }
  const edge=Math.min(Math.floor(rate*.006),Math.floor(samples.length/2));
  for(let i=0;i<edge;i++){const fade=i/edge;samples[i]*=fade;samples[samples.length-1-i]*=fade;}
}
export function musicBar(id,bar){
  const t=audioTheme(id),minor=t.mode==='minor';
  const roots=minor?[0,-4,3,-2]:[0,-3,-7,-5];
  const chords=minor?[[0,3,7,10],[0,4,7,11],[0,4,7,14],[0,4,7,14]]:[[0,4,7,14],[0,3,7,10],[0,4,7,11],[0,4,7,14]];
  const i=bar%4,root=t.root+roots[i],chord=chords[i].map(n=>root+n),beat=60/t.bpm;
  const notes=[{at:0,midi:root-12,voice:'bass',level:.16,duration:beat*3.7}];
  for(const midi of [chord[0]+12,chord[1]+12,chord[3]])notes.push({at:0,midi,voice:'pad',level:.025,duration:beat*4.8});
  const order=bar%2?[0,2,1,3,2,1]:[0,1,2,3,2,1];
  [0,.75,1.5,2,2.75,3.5].forEach((at,j)=>notes.push({at:at*beat,midi:chord[order[j]]+12,voice:t.voice,level:.15,duration:2.8,pan:j%2?.12:-.12}));
  const scale=minor?[0,3,5,7,10]:[0,2,4,7,9];
  if(bar%2===1)for(const [j,at] of [1.25,2.5,3.25].entries())notes.push({at:at*beat,midi:t.root+24+scale[(bar+j*2)%scale.length],voice:'piano',level:.085,duration:2.5,pan:.08});
  return {length:beat*4,notes};
}

export class GameAudio{
  constructor({getSettings,contextFactory=()=>{const C=globalThis.AudioContext||globalThis.webkitAudioContext;return C?new C():null;}}){
    this.getSettings=getSettings;this.contextFactory=contextFactory;this.theme='home';this.paused=false;this.hidden=false;
    this.voices=new Set();this.buffers=new Map();this.bar=0;this.unlocked=false;this.lastReel=-9;this.lastWarning=-9;this.lineVoice=null;
  }
  unlock(){
    try{
      if(!this.ctx){
        const c=this.contextFactory();if(!c)return;this.ctx=c;
        this.master=c.createGain();this.music=c.createGain();this.effects=c.createGain();
        const compressor=c.createDynamicsCompressor();compressor.threshold.value=-20;compressor.ratio.value=4;compressor.attack.value=.01;compressor.release.value=.25;
        this.music.connect(this.master);this.effects.connect(this.master);this.master.connect(compressor);compressor.connect(c.destination);
        const reverb=c.createConvolver(),wet=c.createGain();wet.gain.value=.18;
        const impulse=c.createBuffer(2,Math.ceil(c.sampleRate*1.5),c.sampleRate);
        for(let channel=0;channel<2;channel++){const a=impulse.getChannelData(channel);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length)**3*.38;}
        reverb.buffer=impulse;this.music.connect(reverb);reverb.connect(wet);wet.connect(this.master);
      }
      this.unlocked=true;if(!this.hidden)this.ctx.resume().catch(()=>{});this.applySettings();
    }catch{/* Sound is optional when Web Audio is unavailable. */}
  }
  ramp(param,value,seconds=.06){const now=this.ctx.currentTime;param.cancelScheduledValues(now);param.setTargetAtTime(value,now,seconds);}
  applySettings(){
    if(!this.ctx)return;
    const s=this.getSettings();this.ramp(this.master.gain,s.sound?1:0,.02);this.ramp(this.effects.gain,clamp(s.effects??.7)*.65);
    if(!s.sound||!clamp(s.effects??.7)||this.paused||this.hidden)this.stopFightSound(this.hidden?0:.12);
    this.ramp(this.music.gain,this.musicLevel());
    this.syncMusic();
  }
  musicLevel(){return this.paused||this.hidden?0:clamp(this.getSettings().music??.45)*.7*(this.fightMix?.4:1);}
  setFightMix(active){
    if(this.fightMix===active)return;this.fightMix=active;
    if(this.ctx)this.ramp(this.music.gain,this.musicLevel(),active?.1:.25);
  }
  setScene(id){
    id=AUDIO_THEMES[id]?id:'home';if(id===this.theme)return;
    this.theme=id;this.bar=0;this.stopMusic(.3);if(this.ctx){this.ramp(this.music.gain,0,.06);this.nextBar=this.ctx.currentTime+.38;this.applySettings();}
  }
  setPaused(value){if(this.paused===value)return;this.paused=value;this.applySettings();}
  setHidden(value){
    if(this.hidden===value)return;this.hidden=value;
    if(!this.ctx)return;
    this.applySettings();
    if(value){for(const v of this.voices)this.stopVoice(v,this.ctx.currentTime);this.ctx.suspend().catch(()=>{});}
    else if(this.unlocked)this.ctx.resume().catch(()=>{});
  }
  stopVoice(v,at){try{v.source.stop(at);}catch{}}
  stopMusic(fade=.12){
    clearInterval(this.timer);this.timer=null;
    if(!this.ctx)return;
    for(const v of this.voices)if(v.bus==='music'){this.ramp(v.gain.gain,0,Math.max(.01,fade/3));this.stopVoice(v,this.ctx.currentTime+fade);}
    this.nextBar=Math.max(this.nextBar||0,this.ctx.currentTime+fade+.03);
  }
  syncMusic(){
    const s=this.getSettings();
    if(!this.unlocked||!s.sound||!clamp(s.music??.45)||this.paused||this.hidden){this.stopMusic();return;}
    if(this.timer)return;
    this.nextBar=Math.max(this.nextBar||0,this.ctx.currentTime+.07);
    const schedule=()=>{
      if(this.ctx.state!=='running')return;
      while(this.nextBar<this.ctx.currentTime+.6){
        const plan=musicBar(this.theme,this.bar++),at=this.nextBar;
        for(const n of plan.notes)this.note(n,at+n.at);
        if(this.bar%8===3&&audioTheme(this.theme).air==='birds')this.chirp(at+1.5);
        this.nextBar+=plan.length;
      }
    };
    schedule();this.timer=setInterval(schedule,200);
  }
  voice(source,{at=this.ctx.currentTime,duration,level,bus='effects',filter,pan=0}={}){
    if(this.voices.size>=48){source.disconnect();return;}
    const c=this.ctx,g=c.createGain(),nodes=[source,g];
    g.gain.setValueAtTime(Math.max(.0001,level),at);
    if(filter){source.connect(filter);filter.connect(g);nodes.push(filter);}else source.connect(g);
    let end=g;
    if(pan&&c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=pan;g.connect(p);end=p;nodes.push(p);}
    end.connect(this[bus]);const v={source,gain:g,bus};this.voices.add(v);
    source.onended=()=>{this.voices.delete(v);for(const n of nodes)n.disconnect();};
    source.start(at);if(Number.isFinite(duration))source.stop(at+duration);return v;
  }
  startFightSound(kind,timbre=kind){
    const c=this.ctx,key='fight:'+timbre;let buffer=this.buffers.get(key);
    if(!buffer){buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate);fillFightSound(buffer.getChannelData(0),c.sampleRate,timbre==='carbon'?'line':timbre);this.buffers.set(key,buffer);}
    const source=c.createBufferSource();source.buffer=buffer;source.loop=true;
    const filter=c.createBiquadFilter();filter.type=kind==='drag'?'highpass':'bandpass';filter.Q.value=kind==='drag'?.6:timbre==='bamboo'?.5:.8;
    const voice=this.voice(source,{duration:Infinity,level:.0001,filter});
    if(voice)this.fightVoice={...voice,kind,timbre,filter};
  }
  stopFightSound(fade=.12){
    this.stopLineSound(fade);
    this.setFightMix(false);
    const v=this.fightVoice;if(!v)return;this.fightVoice=null;
    this.ramp(v.gain.gain,0,Math.max(.005,fade/4));this.stopVoice(v,this.ctx.currentTime+fade);
  }
  stopLineSound(fade=.12){
    const v=this.lineVoice;if(!v||!this.ctx)return;this.lineVoice=null;
    this.ramp(v.gain.gain,0,Math.max(.005,fade/4));this.stopVoice(v,this.ctx.currentTime+fade);
  }
  updateLineSound(game){
    const state=lineSoundState(game);
    if(!state||state.level<=0){this.stopLineSound();return;}
    if(this.lineVoice?.timbre!==state.timbre)this.stopLineSound();
    if(!this.lineVoice){
      const c=this.ctx,key='line:'+state.timbre;let buffer=this.buffers.get(key);
      if(!buffer){buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate);
        fillMaterialLineSound(buffer.getChannelData(0),c.sampleRate,state.profile);this.buffers.set(key,buffer);}
      const source=c.createBufferSource();source.buffer=buffer;source.loop=true;
      const filter=c.createBiquadFilter();filter.type='bandpass';filter.Q.value=.55;
      const voice=this.voice(source,{duration:Infinity,level:.0001,filter});
      if(voice)this.lineVoice={...voice,timbre:state.timbre,filter};
    }
    const v=this.lineVoice;if(!v)return;
    this.ramp(v.gain.gain,state.level,.035);
    this.ramp(v.source.playbackRate,state.rate,.05);
    this.ramp(v.filter.frequency,state.frequency,.05);
  }
  updateFightSound(game){
    const s=this.getSettings();
    const state=s.sound&&clamp(s.effects??.7)&&this.ctx.state==='running'&&!this.paused&&!this.hidden?fightSoundState(game):null;
    if(!state){this.stopFightSound();return;}
    if(state.kind==='drag')this.updateLineSound(game);else this.stopLineSound();
    if(this.fightVoice&&this.fightVoice.timbre!==state.timbre)this.stopFightSound();
    this.setFightMix(state.level>0||(this.lineVoice!=null));
    if(!this.fightVoice&&state.level>0)this.startFightSound(state.kind,state.timbre);
    const v=this.fightVoice;if(!v)return;
    this.ramp(v.gain.gain,state.level,.035);this.ramp(v.source.playbackRate,state.rate,.05);this.ramp(v.filter.frequency,state.frequency,.05);
  }
  instrument(midi,kind,duration){
    const key=kind+':'+midi+':'+duration.toFixed(2);if(this.buffers.has(key))return this.buffers.get(key);
    const c=this.ctx,rate=c.sampleRate,buffer=c.createBuffer(1,Math.ceil(rate*duration),rate),a=buffer.getChannelData(0),frequency=hz(midi);
    if(kind==='nylon'){
      const period=Math.round(rate/frequency);let seed=midi*137+11;
      for(let i=0;i<period;i++){seed=(seed*1664525+1013904223)>>>0;a[i]=(seed/4294967296*2-1)*.45+Math.sin(i/period*Math.PI*2)*.3;}
      for(let i=period;i<a.length;i++)a[i]=(a[i-period]+a[i-period+1])*.4985;
      for(let i=0;i<a.length;i++)a[i]*=Math.min(1,i/(rate*.003))*Math.min(1,(a.length-i)/(rate*.08));
    }else{
      for(let i=0;i<a.length;i++){const t=i/rate,phase=2*Math.PI*frequency*t;
        a[i]=(Math.sin(phase)*.62+Math.sin(phase*2)*.2*Math.exp(-t*2.5)+Math.sin(phase*3)*.08*Math.exp(-t*5))*Math.min(1,t/.008)*Math.exp(-t*(kind==='bass'?.7:1.7))*Math.min(1,(duration-t)/.12);
      }
    }
    // Bound cached PCM on long sessions / many maps.
    if(this.buffers.size>=56)this.buffers.delete(this.buffers.keys().next().value);
    this.buffers.set(key,buffer);return buffer;
  }
  note(n,at){
    const c=this.ctx;
    if(n.voice==='pad'){
      const o=c.createOscillator();o.type='sine';o.frequency.value=hz(n.midi);o.detune.value=n.midi%2?3:-3;
      const v=this.voice(o,{at,duration:n.duration,level:.0001,bus:'music'});if(!v)return;
      v.gain.gain.linearRampToValueAtTime(n.level,at+1.1);v.gain.gain.setTargetAtTime(.0001,at+n.duration-1.5,.45);return;
    }
    const source=c.createBufferSource();source.buffer=this.instrument(n.midi,n.voice,n.duration);
    const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=n.voice==='bass'?460:2600;
    this.voice(source,{at,duration:n.duration,level:n.level,bus:'music',filter:f,pan:n.pan});
  }
  tone(frequency,at,duration,level,type='sine',endFrequency=frequency,bus='effects'){
    const o=this.ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(frequency,at);o.frequency.exponentialRampToValueAtTime(Math.max(30,endFrequency),at+duration);
    const v=this.voice(o,{at,duration,level:.0001,bus});if(!v)return;
    v.gain.gain.exponentialRampToValueAtTime(Math.max(.0002,level),at+.012);v.gain.gain.exponentialRampToValueAtTime(.0001,at+duration-.01);
  }
  noise(at,duration,level,frequency=900,type='lowpass'){
    const c=this.ctx,key='noise';let buffer=this.buffers.get(key);
    if(!buffer){buffer=c.createBuffer(1,c.sampleRate,c.sampleRate);const a=buffer.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;this.buffers.set(key,buffer);}
    const source=c.createBufferSource();source.buffer=buffer;const f=c.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(frequency,at);f.frequency.exponentialRampToValueAtTime(Math.max(100,frequency*.3),at+duration);
    const v=this.voice(source,{at,duration,level:.0001,filter:f});if(!v)return;
    v.gain.gain.linearRampToValueAtTime(level,at+.015);v.gain.gain.exponentialRampToValueAtTime(.0001,at+duration-.01);
  }
  chirp(at){this.tone(1550,at,.18,.014,'sine',2400,'music');this.tone(2100,at+.23,.13,.01,'sine',1550,'music');}
  cue(kind){
    const s=this.getSettings();if(!this.ctx||this.ctx.state!=='running'||!s.sound||!clamp(s.effects??.7)||this.hidden)return;
    const t=this.ctx.currentTime;
    if(kind==='cast'){this.noise(t,.38,.14,1500,'bandpass');this.tone(190,t,.26,.025,'sine',90);}
    else if(kind==='splash'||kind==='release'){this.noise(t,.36,.24,2100);this.tone(230,t,.16,.05,'sine',75);}
    else if(kind==='nibble'){this.tone(540,t,.07,.045);}
    else if(kind==='bite'){this.tone(780,t,.12,.14);this.tone(1040,t+.15,.16,.12);}
    else if(kind==='hook'){this.noise(t,.08,.17,1350);this.tone(260,t,.24,.075,'triangle',440);}
    else if(kind==='snag'){this.tone(180,t,.3,.08,'triangle',110);this.noise(t+.06,.2,.05,600);}
    else if(kind==='win'||kind==='gift'){[392,494,587,784].forEach((f,i)=>this.tone(f,t+i*.14,.45,.075));this.noise(t,.14,.03,1000);}
    else if(kind==='fail'){this.tone(330,t,.3,.07,'sine',150);}
    else if(kind==='keep'){this.noise(t,.22,.11,1200);this.tone(190,t,.14,.05,'sine',110);}
    else if(kind==='retrieve'||kind==='reel'){this.noise(t,.045,.075,900,'bandpass');this.noise(t+.075,.04,.055,1300,'bandpass');}
    else if(kind==='warning'){this.tone(580,t,.12,.08);this.tone(580,t+.18,.12,.08);}
    else if(kind==='sell'){this.tone(880,t,.14,.055);this.tone(1174,t+.1,.22,.045);}
    else this.tone(440,t,.055,.025);
  }
  fishing(game){
    if(!this.ctx)return;
    this.updateFightSound(game);
    if(game.paused||this.paused||this.hidden)return;
    const t=this.ctx.currentTime;
    if(usesReel(game.rod)&&(game.retrieving||game.pulling)&&['waiting','snag'].includes(game.phase)&&t-this.lastReel>.4){this.lastReel=t;this.cue('reel');}
    if(game.phase==='fight'&&game.tension>87&&t-this.lastWarning>3){this.lastWarning=t;this.cue('warning');}
  }
  dispose(){clearInterval(this.timer);this.stopFightSound(0);if(this.ctx){for(const v of this.voices)this.stopVoice(v,this.ctx.currentTime);this.ctx.close().catch(()=>{});}this.buffers.clear();}
}
