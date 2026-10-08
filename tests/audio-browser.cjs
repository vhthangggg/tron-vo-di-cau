const assert=require('node:assert/strict'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
let server,browser;
(async()=>{
  server=spawn(process.execPath,['scripts/serve.mjs','--port','5195'],{cwd:path.resolve(__dirname,'..')});
  await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));
  const {newPlayer}=await import('../src/save.js');const player=newPlayer();player.settings.sound=false;
  await page.addInitScript(p=>localStorage.setItem('tron-vo-di-cau.v01',JSON.stringify(p)),player);
  await page.goto('http://127.0.0.1:5195/');
  await page.evaluate(async()=>{
    const {GameAudio}=await import('/src/game-audio.js'),{getRod}=await import('/src/content.js');
    window.mix={sound:true,music:0,effects:.7};window.a=new GameAudio({getSettings:()=>window.mix});
    window.f={phase:'fight',rod:getRod('dai54'),tension:58,surge:false,velocity:{x:.1,y:-.1},hooked:{weight:1.2}};
    const b=document.createElement('button');b.id='unlock-test';b.textContent='Unlock';b.onclick=()=>a.unlock();document.body.prepend(b);
  });
  assert.equal(await page.evaluate(()=>!!a.ctx),false);await page.locator('#unlock-test').click();
  await page.waitForFunction(()=>a.ctx?.state==='running');
  await page.evaluate(()=>{
    a.fishing(f);window.first=a.fightVoice;window.analyser=a.ctx.createAnalyser();analyser.fftSize=2048;a.effects.connect(analyser);
    window.rms=()=>{const samples=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(samples);return Math.sqrt(samples.reduce((sum,v)=>sum+v*v,0)/samples.length);};
  });
  await page.waitForFunction(()=>rms()>.001);
  assert.deepEqual(await page.evaluate(()=>({kind:a.fightVoice.kind,loop:a.fightVoice.source.loop,voices:a.voices.size})),{kind:'line',loop:true,voices:1});
  await page.evaluate(()=>{for(let i=0;i<1000;i++)a.fishing(f);});
  assert(await page.evaluate(()=>a.fightVoice.source===first.source&&a.voices.size===1));
  await page.evaluate(()=>{f.tension=16;a.fishing(f);});await page.waitForFunction(()=>a.fightVoice.gain.gain.value<.001);
  await page.evaluate(()=>{f.tension=85;f.surge=true;a.fishing(f);});await page.waitForFunction(()=>a.fightVoice.gain.gain.value>.08);
  checks.push('Trusted gesture unlocks real Web Audio; taut-line PCM reaches output, pressure changes gain, slack silences, 1000 updates reuse one source');

  await page.evaluate(async()=>{f.rod=(await import('/src/content.js')).getRod('bamboo');f.tension=68;a.fishing(f);});
  await page.waitForFunction(()=>a.voices.size===1&&a.fightVoice?.timbre==='bamboo');await page.waitForFunction(()=>rms()>.001);
  assert(await page.evaluate(()=>a.fightVoice.source.buffer!==first.source.buffer));
  checks.push('Bamboo uses a separate audible soft fibre-creak buffer, while carbon uses taut-line friction');

  await page.evaluate(()=>a.setPaused(true));await page.waitForFunction(()=>a.voices.size===0);assert(await page.evaluate(()=>a.fightVoice===null));
  await page.evaluate(()=>{a.setPaused(false);a.fishing(f);});assert(await page.evaluate(()=>a.fightVoice.kind==='line'));
  await page.evaluate(()=>{mix.effects=0;a.applySettings();a.fishing(f);});await page.waitForFunction(()=>a.voices.size===0);
  await page.evaluate(()=>{mix.effects=.7;a.applySettings();a.fishing(f);mix.sound=false;a.applySettings();});await page.waitForFunction(()=>a.voices.size===0);
  await page.evaluate(()=>{mix.sound=true;a.applySettings();a.fishing(f);a.setHidden(true);});await page.waitForFunction(()=>a.ctx.state==='suspended');assert(await page.evaluate(()=>a.fightVoice===null));
  await page.evaluate(()=>a.setHidden(false));await page.waitForFunction(()=>a.ctx.state==='running');
  await page.evaluate(()=>a.fishing(f));await page.waitForFunction(()=>a.voices.size===1);
  checks.push('Pause, effects=0, mute and background stop loops; return resumes only when fishing runs');

  await page.evaluate(async()=>{f.rod=(await import('/src/content.js')).getRod('bottom36');f.surge=true;a.fishing(f);});
  await page.waitForFunction(()=>a.voices.size===1&&a.fightVoice?.kind==='drag');await page.waitForFunction(()=>rms()>.001);
  assert(await page.evaluate(()=>a.fightVoice.source.buffer!==first.source.buffer));
  await page.evaluate(()=>{window.drag=a.fightVoice;f.tension=55;f.surge=false;f.velocity={x:0,y:.1};a.fishing(f);});await page.waitForFunction(()=>a.fightVoice.gain.gain.value<.001);
  await page.evaluate(()=>{f.surge=true;a.fishing(f);});assert(await page.evaluate(()=>a.fightVoice.source===drag.source));
  await page.evaluate(()=>{for(let i=0;i<500;i++){f.surge=i%2===0;a.fishing(f);}});assert(await page.evaluate(()=>a.voices.size===1));
  checks.push('Reel drag uses distinct audible ratchet PCM; stationary spool is silent, renewed payout reuses its loop');

  for(const phase of ['landed','failed','idle','waiting','snag']){
    await page.evaluate(phase=>{f.phase='fight';f.surge=true;a.fishing(f);f.phase=phase;a.fishing(f);},phase);
    await page.waitForFunction(()=>a.voices.size===0);assert(await page.evaluate(()=>a.fightVoice===null));
  }
  await page.evaluate(()=>{f.phase='fight';a.fishing(f);a.stopFightSound();});await page.waitForFunction(()=>a.voices.size===0);
  await page.evaluate(()=>{f.phase='fight';a.fishing(f);a.dispose();});await page.waitForFunction(()=>a.ctx.state==='closed');
  assert(await page.evaluate(()=>a.fightVoice===null&&a.buffers.size===0));assert.deepEqual(errors,[]);
  checks.push('Landing, failure, departure, waiting, snags and disposal release loop nodes without console errors');
  console.log(JSON.stringify({status:'passed',checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
