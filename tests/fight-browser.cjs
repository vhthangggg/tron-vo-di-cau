const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../test-results'),checks=[];fs.mkdirSync(out,{recursive:true});
let server,browser;
const engine=fs.readFileSync(path.resolve(__dirname,'../src/engine.js'),'utf8');
const audioSource=fs.readFileSync(path.resolve(__dirname,'../src/game-audio.js'),'utf8');
const fixtureAudio=audioSource.replace('this.getSettings=getSettings;','globalThis.__fightAudio=this;this.getSettings=getSettings;');
const fixtureEngine=engine.replace("this.fish=[];this.populate();}","this.fish=[];this.populate();const f=globalThis.__fightFixture;if(f){this.phase='bite';this.target={id:'fixture',fishId:f.fishId,weight:f.weight,suspicion:0};this.baitPoint={x:.5,y:.65};this.signal='bite';}}");
assert.notEqual(fixtureEngine,engine);
async function rodPoint(page,level){return page.locator('#strike').evaluate((el,level)=>{
 const r=el.getBoundingClientRect(),rot=getComputedStyle(el).getPropertyValue('--fishing-rotation').trim()==='90',x=.65,y=1-level;
 return rot?{x:r.left+(1-y)*r.width,y:r.top+x*r.height}:{x:r.left+x*r.width,y:r.top+y*r.height};
},level);}
async function hands(page,cdp,level,type='touchMove'){
 const rod=await rodPoint(page,level),fish=await page.locator('#fish-target').boundingBox();assert(fish);
 await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:[{id:1,...rod},{id:2,x:fish.x+fish.width/2,y:fish.y+fish.height/2}]});
}
async function bow(page){return page.evaluate(()=>{
 const p=window.__rodCapture,line=window.__lineCapture;if(!p||p.length!==25)throw Error('Missing rendered rod path');
 const a=p[0],b=p.at(-1),dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy);
 return {curve:Math.max(...p.map(q=>Math.abs(dy*(q.x-a.x)-dx*(q.y-a.y))/l)),tip:b,line,points:p};
});}
(async()=>{
 server=spawn(process.execPath,['scripts/serve.mjs','--port','5194'],{cwd:path.resolve(__dirname,'..')});
 await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 const {newPlayer}=await import('../src/save.js');
 for(const [label,fishId,weight,width,height,max,rod='bamboo'] of [['loach','fish_27',.05,844,390,5],['crucian','fish_02',.1,375,812,6],['carp','fish_01',.5,844,390,12],['snakehead','fish_04',.5,844,390,16],['large','fish_01',2,844,390,40],['dai-line','fish_01',2,844,390,40,'dai54'],['reel-drag','fish_01',2,844,390,40,'bottom36']]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  const player=newPlayer();player.settings.music=0;player.rods=[...new Set(['bamboo',rod])];player.rod=rod;
  await page.addInitScript(p=>localStorage.setItem('tron-vo-di-cau.v01',JSON.stringify(p)),player);
  await page.addInitScript(f=>{
   window.__fightFixture=f;const C=CanvasRenderingContext2D.prototype;
   for(const name of ['beginPath','moveTo','lineTo','quadraticCurveTo','stroke']){
    const original=C[name];C[name]=function(...args){
     if(name==='beginPath')this.__trace=[];
     if(name==='moveTo'||name==='lineTo')(this.__trace||=[]).push({x:args[0],y:args[1]});
     if(name==='quadraticCurveTo')this.__quadratic=true;
     if(name==='beginPath')this.__quadratic=false;
     if(name==='stroke'&&this.canvas.id==='water'){
      if(this.strokeStyle==='#6f6e43')window.__rodCapture=(this.__trace||[]).map(p=>({...p}));
      if(this.__quadratic&&(this.strokeStyle==='#fffcf5cf'||this.strokeStyle.startsWith('rgba(255, 252, 245')))window.__lineCapture=this.__trace?.[0];
     }
     return original.apply(this,args);
    };
   }
  },{fishId,weight});
  await page.route('**/src/engine.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:fixtureEngine}));
  await page.route('**/src/game-audio.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:fixtureAudio}));
  await page.clock.install({time:new Date('2026-10-07T14:00:00Z')});await page.clock.pauseAt(new Date('2026-10-07T14:00:01Z'));
  await page.goto('http://127.0.0.1:5194/#fishing');await page.waitForFunction(()=>document.querySelector('.scene')?.dataset.loading==='ready');
  const cdp=await context.newCDPSession(page);await hands(page,cdp,.52,'touchStart');await page.clock.runFor(100);
  assert.equal(await page.locator('.scene').getAttribute('data-phase'),'fight');let elapsed=.1,heard=false;
  if(label==='large'){
   for(let i=0;i<4;i++){await hands(page,cdp,.25);await page.clock.runFor(100);elapsed+=.1;}const low=await bow(page);
   for(let i=0;i<4;i++){await hands(page,cdp,.8);await page.clock.runFor(100);elapsed+=.1;}const high=await bow(page);
   assert(high.curve>low.curve*1.3,JSON.stringify({low:low.curve,high:high.curve}));
   assert(high.line&&Math.hypot(high.tip.x-high.line.x,high.tip.y-high.line.y)<.01,'Line starts at the flexed tip');
   await page.screenshot({path:path.join(out,'fight-loaded-rod.png')});
   for(let i=0;i<7;i++){await hands(page,cdp,.25);await page.clock.runFor(100);elapsed+=.1;}const eased=await bow(page);
   assert(eased.curve<high.curve*.8,JSON.stringify({high:high.curve,eased:eased.curve}));
   checks.push({check:'Rendered rod bends with load, relaxes with lower force, and keeps line attached',low:low.curve,high:high.curve,eased:eased.curve});
  }
  for(let i=0;i<450;i++){
   const phase=await page.locator('.scene').getAttribute('data-phase');if(phase==='landed')break;
   assert.equal(phase,'fight','Fish failed: '+await page.locator('#status-copy').innerText());
   const surge=(await page.locator('#fight-hint').innerText()).startsWith('Cá bứt');
   await hands(page,cdp,surge?.22:.52);await page.clock.runFor(200);elapsed+=.2;
   const sound=await page.evaluate(()=>window.__fightAudio?.fightVoice?.kind);
   if(sound){assert.equal(sound,rod==='bottom36'?'drag':'line');heard=true;}
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal(await page.locator('.scene').getAttribute('data-phase'),'landed');assert(elapsed<max,label+' took '+elapsed);
  assert(heard,label+' has the correct loaded-rod sound');assert(await page.evaluate(()=>window.__fightAudio.fightVoice===null));
  await page.waitForFunction(()=>![...window.__fightAudio.voices].some(v=>v.source.loop));
  assert.equal(await page.locator('[data-catch-decision]').count(),3);
  const pending=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')).pending);assert.equal(pending.fishId,fishId);assert.equal(pending.weight,weight);
  await page.locator('[data-catch-decision=release]').click();assert.equal(await page.locator('.scene').getAttribute('data-phase'),'idle');
  assert.deepEqual(errors,[]);checks.push({check:label+' two-touch fight, correct sound and catch resolve',seconds:+elapsed.toFixed(1)});await context.close();
 }
 const timing=checks.filter(c=>'seconds'in c);assert(timing.find(c=>c.check.startsWith('snakehead')).seconds>timing.find(c=>c.check.startsWith('carp')).seconds);
 fs.writeFileSync(path.join(out,'fight-verification.json'),JSON.stringify({status:'passed',checks},null,2));console.log(JSON.stringify({status:'passed',checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
