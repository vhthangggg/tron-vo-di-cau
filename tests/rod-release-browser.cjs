const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser;
const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
const fixtureApp=app.replace('let rodPose={force:0,bend:0};','let rodPose={force:0,bend:0};globalThis.__rodState=()=>({pose:{...rodPose},force:game.force,pulling:game.pulling,phase:game.phase});');
const engine=fs.readFileSync(path.join(root,'src/engine.js'),'utf8');
const fixtureEngine=engine.replace('this.fish=[];this.populate();}',"this.fish=[];this.populate();this.phase='bite';this.target={id:'fixture',fishId:'fish_01',weight:2,suspicion:0};this.baitPoint={x:.5,y:.65};this.signal='bite';}");
assert.notEqual(fixtureApp,app);assert.notEqual(fixtureEngine,engine);
(async()=>{
 server=spawn(process.execPath,['scripts/serve.mjs','--port','5212'],{cwd:root});await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 const {newPlayer}=await import('../src/save.js');
 for(const [label,width,height,touch,reducedMotion] of [['PC',1366,768,false,'no-preference'],['phone landscape',844,390,true,'no-preference'],['phone portrait',390,844,true,'no-preference'],['reduced motion',844,390,true,'reduce']]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const player=newPlayer();player.settings.sound=false;
  await page.addInitScript(p=>{
   localStorage.setItem('tron-vo-di-cau.v01',JSON.stringify(p));
   const proto=CanvasRenderingContext2D.prototype;
   for(const name of ['beginPath','moveTo','lineTo','quadraticCurveTo','stroke']){
    const original=proto[name];proto[name]=function(...args){
     if(name==='beginPath'){this.__trace=[];this.__line=false;}
     if(name==='moveTo'||name==='lineTo')(this.__trace||=[]).push({x:args[0],y:args[1]});
     if(name==='quadraticCurveTo')this.__line=true;
     if(name==='stroke'&&this.canvas.id==='water'){
      if(this.strokeStyle==='#6f6e43')window.__tip=this.__trace.at(-1);
      if(this.__line&&(this.strokeStyle==='#fffcf5cf'||this.strokeStyle.startsWith('rgba(255, 252, 245')))window.__lineStart=this.__trace[0];
     }
     return original.apply(this,args);
    };
   }
  },player);
  await page.route('**/src/app.js',r=>r.fulfill({contentType:'text/javascript',body:fixtureApp}));
  await page.route('**/src/engine.js',r=>r.fulfill({contentType:'text/javascript',body:fixtureEngine}));
  const time=new Date('2026-10-09T10:00:00Z');await page.clock.install({time});await page.clock.pauseAt(new Date(+time+1000));
  await page.goto('http://127.0.0.1:5212/#fishing');await page.waitForFunction(()=>document.querySelector('.scene')?.dataset.loading==='ready');
  const cdp=touch?await context.newCDPSession(page):null;
  const rodPoint=()=>page.locator('#strike').evaluate(el=>{const r=el.getBoundingClientRect(),rotation=getComputedStyle(el).getPropertyValue('--fishing-rotation').trim()==='90';return rotation?{x:r.left+r.width*.55,y:r.top+r.height*.66}:{x:r.left+r.width*.66,y:r.top+r.height*.45};});
  async function hold(){if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...await rodPoint()}]});else{await page.locator('#main').focus();await page.keyboard.down('Space');}}
  async function release(cancel=false){if(touch)await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});else await page.keyboard.up('Space');}
  const state=()=>page.evaluate(()=>({...__rodState(),tip:window.__tip,line:window.__lineStart}));
  await hold();await page.clock.runFor(300);const raised=await state();assert(raised.pose.force>.5);
  await release();const released=await state();assert.equal(released.force,0);assert.equal(released.pulling,false);assert.deepEqual(released.tip,raised.tip,'No immediate tip teleport on release');
  await page.clock.runFor(34);const early=await state();assert(early.pose.force>raised.pose.force*(reducedMotion==='reduce'?.35:.6)&&early.pose.force<raised.pose.force);
  assert(Math.hypot(early.tip.x-early.line.x,early.tip.y-early.line.y)<.01,'Line remains attached to the animated tip');
  await page.clock.runFor(200);const middle=await state();assert(middle.pose.force<early.pose.force&&middle.pose.force>0);
  await page.clock.runFor(450);const settled=await state();assert(settled.pose.force<.012);assert.equal(settled.phase,'fight');
  await hold();await page.clock.runFor(200);assert((await state()).pose.force>.45);await release(true);await page.clock.runFor(34);assert((await state()).pose.force>.2,'Cancel also lowers smoothly');
  await hold();await page.clock.runFor(150);await page.keyboard.press('p');const paused=await state();await page.clock.runFor(600);assert.deepEqual((await state()).pose,paused.pose,'Pause freezes visual pose');assert.equal((await state()).force,0);
  await release();await page.locator('[data-dialog-action="0"]').click();await page.clock.runFor(300);assert((await state()).pose.force<paused.pose.force*.2,'Resume settles with no stuck hold');
  assert.deepEqual(errors,[]);console.log('PASS '+label+': immediate input release; continuous rod lowering; attached line; regrip/cancel; frozen pause and fresh resume.');await context.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
