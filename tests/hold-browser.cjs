const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');
fs.mkdirSync(out,{recursive:true});
let server,browser;

(async()=>{
 server=require('node:child_process').spawn(process.execPath,['scripts/serve.mjs','--base','tron-vo-di-cau','--port','5188'],{cwd:root});
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),...(process.env.CHROMIUM_ARGS?{args:JSON.parse(process.env.CHROMIUM_ARGS)}:{})});
 const checks=[],errors=[],requests=[];
 async function scenario(options={}){
  const context=await browser.newContext({viewport:{width:1440,height:980},...options});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>requests.push(r.url()));
  await page.clock.install({time:new Date('2026-10-06T12:00:00Z')});
  await page.clock.pauseAt(new Date('2026-10-06T12:00:01Z'));
  await page.goto('http://127.0.0.1:5188/tron-vo-di-cau/#fishing');await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{window.holdInputTrace=[];for(const type of ['pointerdown','pointerup','pointercancel','gotpointercapture','lostpointercapture','blur','click'])window.addEventListener(type,e=>{window.holdInputTrace.push({type,target:e.target.id||e.target.tagName||'window',id:e.pointerId,pointer:e.pointerType,detail:e.detail,time:performance.now()});if(window.holdInputTrace.length>24)window.holdInputTrace.shift();},true);});
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));
  const pressed=()=>page.locator('#strike').getAttribute('aria-pressed').then(value=>value==='true');
  const progress=()=>page.locator('#progress-value').innerText().then(value=>parseInt(value));
  const point=async()=>{const b=await page.locator('#strike').boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2};};
  async function bite(){
   if(options.hasTouch)await page.locator('#cast').tap();else await page.locator('#cast').click();
   for(let i=0;i<140;i++){await page.clock.runFor(250);if(await page.locator('.scene').getAttribute('data-phase')==='bite')return;}
   assert.fail('No natural bite: '+await page.locator('#status-copy').innerText());
  }
  async function land(setHeld){
   let held=false;
   for(let i=0;i<300;i++){
    if(await page.locator('#dialog').evaluate(el=>el.open))break;
    assert.equal(await page.locator('.scene').getAttribute('data-phase'),'fight','Lost fish: '+await page.locator('#status-copy').innerText());
    const tension=parseInt(await page.locator('#tension-value').innerText()),surge=(await page.locator('#fight-hint').innerText()).startsWith('Cá bứt');
    const next=!surge&&tension<78;
    if(next!==held){await setHeld(next);held=next;}
    await page.clock.runFor(200);
   }
   if(held)await setHeld(false);
   if(!await page.locator('#dialog').evaluate(el=>el.open)){await page.screenshot({path:out+'/hold-failed-'+(options.hasTouch?'touch':'mouse')+'.png'});assert.fail('Fish did not land: '+JSON.stringify({title:await page.locator('#status-title').innerText(),clock:await page.locator('#session-clock').innerText(),progress:await progress(),pressed:await pressed(),trace:await page.evaluate(()=>window.holdInputTrace)}));}
   assert.equal((await saved()).catches,1);assert((await saved()).pending);assert.equal(await pressed(),false);
  }
  return {context,page,saved,pressed,progress,point,bite,land};
 }

 const desktop=await scenario(),{page,saved,pressed,point,bite,land,progress}=desktop;
 assert.equal(await page.locator('#leave-fishing').innerText(),'Về nhà');
 await bite();const before=await page.locator('#strike').boundingBox(),p=await point();
 await page.mouse.move(p.x,p.y);await page.mouse.down();
 assert.equal(await page.locator('.scene').getAttribute('data-phase'),'fight');assert(await pressed());
 const after=await page.locator('#strike').boundingBox();assert.deepEqual(after,before,'Hookset must keep the held button under the finger');
 await page.clock.runFor(600);assert(await progress()>0,'Hold must start progress without a second button or click');
 await page.screenshot({path:out+'/hold-desktop.png'});
 await page.mouse.move(5,5);await page.clock.runFor(200);assert(await pressed(),'Captured hold should survive moving outside the control');
 await page.mouse.up();assert.equal(await pressed(),false);
 checks.push('Mouse down hooks and immediately leads; stable button, visible progress, pointer capture and release outside work');

 await page.locator('#strike').focus();await page.keyboard.down('Space');assert(await pressed());await page.clock.runFor(300);await page.keyboard.up('Space');assert.equal(await pressed(),false);
 await page.locator('#main').focus();await page.keyboard.down('a');assert(await pressed());
 const mixed=await point();await page.mouse.move(mixed.x,mixed.y);await page.mouse.down();await page.keyboard.up('a');assert(await pressed(),'One released source must not cancel the other held source');await page.mouse.up();assert.equal(await pressed(),false);
 checks.push('Space on the focused button and A on the scene hold/release; combined keyboard and pointer sources release independently');

 await page.evaluate(()=>document.addEventListener('pointerdown',e=>window.observedPointerId=e.pointerId,{once:true}));
 const capture=await point();await page.mouse.move(capture.x,capture.y);await page.mouse.down();assert(await pressed());
 // Activate the pending capture with a subsequent pointer event before releasing it.
 await page.mouse.move(capture.x+2,capture.y);await page.clock.runFor(32);
 await page.locator('#strike').evaluate(el=>el.releasePointerCapture(window.observedPointerId));
 await page.mouse.move(capture.x+4,capture.y);await page.clock.runFor(32);assert.equal(await pressed(),false);await page.mouse.up();
 checks.push('Lost pointer capture releases line force instead of leaving a stuck hold');

 const pausePoint=await point();await page.mouse.move(pausePoint.x,pausePoint.y);await page.mouse.down();await page.keyboard.press('p');
 assert.equal(await pressed(),false);assert.equal(await page.locator('#dialog').getAttribute('data-kind'),'pause');
 assert.equal(await page.locator('[data-dialog-action="2"]').innerText(),'Về nhà');
 const clock=await page.locator('#session-clock').innerText();await page.clock.runFor(1000);assert.equal(await page.locator('#session-clock').innerText(),clock);
 await page.screenshot({path:out+'/hold-pause.png'});await page.mouse.up();await page.locator('[data-dialog-action="0"]').click();assert.equal(await pressed(),false);
 await page.keyboard.down('a');assert(await pressed());await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await pressed(),false);assert.match(await page.locator('#status-title').innerText(),/tạm dừng/);await page.keyboard.up('a');
 await page.locator('#pause').click();await page.locator('[data-dialog-action="0"]').click();assert.equal(await pressed(),false);
 checks.push('Pause and window blur clear active holds and freeze the session; resume requires a fresh hold; return action says Về nhà');

 await land(async held=>{if(held){const p=await point();await page.mouse.move(p.x,p.y);await page.mouse.down();}else await page.mouse.up();});
 const caught=await saved(),id=caught.pending.id;await page.reload();assert.equal((await saved()).pending.id,id);
 await page.locator('[data-dialog-action="1"]').click();const sold=await saved();assert.equal(sold.coins,caught.coins+caught.pending.value);assert.equal(sold.sold,1);assert.equal(sold.pending,null);
 await page.locator('#leave-fishing').click();await page.locator('nav [data-screen="prepare"]').click();assert.equal(await page.locator('.page-head a').innerText(),'Về nhà');
 checks.push('Real starter fish reaches landing through mouse holds/releases; pending catch survives reload, sells once, and preparation returns home');
 await desktop.context.close();

 for(const [width,height,label] of [[375,812,'portrait'],[844,390,'landscape']]){
  const s=await scenario({viewport:{width,height},isMobile:true,hasTouch:true}),{page}=s;
  const cdp=await s.context.newCDPSession(page);
  async function touch(held){
   const p=await s.point();await cdp.send('Input.dispatchTouchEvent',held?{type:'touchStart',touchPoints:[{...p,id:1,radiusX:6,radiusY:6,force:1}]}:{type:'touchEnd',touchPoints:[]});
  }
  await s.bite();const before=await page.locator('#strike').boundingBox();await touch(true);assert(await s.pressed());assert.deepEqual(await page.locator('#strike').boundingBox(),before);
  await page.clock.runFor(600);assert(await s.progress()>0);await page.screenshot({path:out+'/hold-'+label+'.png'});
  const button=await page.locator('#strike').boundingBox();assert(button.width>=44&&button.height>=44&&button.y+button.height<=height);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await s.pressed(),false);
  await touch(true);assert(await s.pressed());await touch(false);assert.equal(await s.pressed(),false);
  await s.land(touch);assert.equal((await s.saved()).baits.worm,17);await page.screenshot({path:out+'/hold-landed-'+label+'.png'});await page.locator('[data-dialog-action="0"]').tap();assert.equal((await s.saved()).released,1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight),height);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
  checks.push('Real touch '+label+' '+width+'×'+height+': hold-to-hook, progress, stable target, touchcancel/release, landing dialog survives lifting the finger, and release transaction');
  await s.context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 const result={status:'passed',checks,console_errors:errors,failed_requests:requests,scope:'Production UI and natural starter fish. Mouse down/up, keyboard down/up and Chromium touch input drive the real simulation; no fish or catch injection.'};
 fs.writeFileSync(out+'/hold-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.kill();});
