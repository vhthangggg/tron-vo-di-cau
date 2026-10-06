const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {expect}=require((process.env.PLAYWRIGHT_MODULE||'playwright')+'/test');
const {driveHands,waitForBite,targetPoint}=require('./browser-player.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
let browser,server,lastPage;const checks=[],errors=[],requests=[];
(async()=>{
 server=require('node:child_process').spawn(process.execPath,['scripts/serve.mjs','--base','tron-vo-di-cau','--port','5188'],{cwd:root});await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),...(process.env.CHROMIUM_ARGS?{args:JSON.parse(process.env.CHROMIUM_ARGS)}:{})});
 async function scenario(options={},timestamp=Date.parse('2026-10-07T01:00:00Z')){
  const context=await browser.newContext({viewport:{width:1440,height:980},...options}),page=await context.newPage();
  lastPage=page;page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>requests.push(r.url()));
  await page.clock.install({time:new Date(timestamp)});await page.clock.pauseAt(new Date(timestamp+1000));
  await page.goto('http://127.0.0.1:5188/tron-vo-di-cau/#fishing');await page.evaluate(()=>document.fonts.ready);
  return {context,page,saved:()=>page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')))};
 }
 if(!process.env.TOUCH_ONLY){
 const desktop=await scenario(),p=desktop.page;
 const a=await p.locator('#water').evaluate(el=>el.toDataURL());await p.clock.runFor(1500);const b=await p.locator('#water').evaluate(el=>el.toDataURL());assert.notEqual(a,b,'Water and drift must animate while idle');
 await p.locator('#pause').click();await p.clock.runFor(100);const paused=await p.locator('#water').evaluate(el=>el.toDataURL());await p.clock.runFor(1500);assert.equal(await p.locator('#water').evaluate(el=>el.toDataURL()),paused);await p.locator('[data-dialog-action="0"]').click();
 checks.push('Moving current, foam, drifting debris and foliage; pause freezes decorative time');
 await p.locator('#cast').click();await waitForBite(p);await p.locator('#main').focus();await p.keyboard.down('Space');
 await p.clock.runFor(500);assert.equal(parseInt(await p.locator('#progress-value').innerText()),0,'Right hand alone must not land fish');
 const pos=await targetPoint(p);await p.mouse.move(pos.x,pos.y);await p.mouse.down();await p.clock.runFor(500);assert(parseInt(await p.locator('#progress-value').innerText())>0);
 await p.keyboard.down('ArrowDown');await p.clock.runFor(400);await p.keyboard.up('ArrowDown');assert(parseInt(await p.locator('#force-value').innerText())<40);await p.mouse.up();await p.keyboard.up('Space');
 checks.push('Desktop mouse + held Space + arrow keys: two hands required, rod force is analog');
 await p.locator('#main').focus();await p.keyboard.down('Space');await p.keyboard.down('d');await p.clock.runFor(200);await p.keyboard.up('d');assert.equal(await p.locator('#track-pad').getAttribute('aria-pressed'),'true');await p.keyboard.up('Space');assert.equal(await p.locator('#track-pad').getAttribute('aria-pressed'),'false');
 checks.push('Keyboard tracking stays where placed, moves with WASD and releases with the rod');
 const rb=await p.locator('#strike').boundingBox();await p.mouse.move(rb.x+rb.width*.6,rb.y+rb.height*.5);await p.mouse.down();await p.keyboard.down('a');const aimBefore=await p.locator('#aim-reticle').getAttribute('style');await p.clock.runFor(200);await p.keyboard.up('a');assert(await p.locator('#track-pad').getAttribute('aria-pressed')==='true');assert.notEqual(await p.locator('#aim-reticle').getAttribute('style'),aimBefore);await p.mouse.up();checks.push('Mouse rod + WASD tracking works as the alternate desktop layout');
 await driveHands(p);assert.equal((await desktop.saved()).catches,1);assert((await desktop.saved()).pending);await p.screenshot({path:out+'/two-hands-desktop-catch.png'});await desktop.context.close();
 console.log('Landed desktop');checks.push('Natural starter fish lands through the production two-hand controls on desktop');

 }
 for(const [width,height,label] of [[390,844,'portrait'],[844,390,'landscape'],[640,360,'small-landscape']]){
  const s=await scenario({viewport:{width,height},hasTouch:true,isMobile:true}),page=s.page,cdp=await s.context.newCDPSession(page);
  await page.evaluate(()=>{window.pointerTrace=[];for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>window.pointerTrace.push([type,e.pointerId,e.target.id]));window.pointerIds={};document.addEventListener('pointerdown',e=>{const el=e.target.closest('#strike,#track-pad');if(el)window.pointerIds[el.id]=e.pointerId;},true);});
  let touches=[];
  const rod=async force=>{const r=await page.locator('#strike').boundingBox();return{id:1,x:r.x+r.width*.66,y:r.y+r.height*(1-force),radiusX:6,radiusY:6,force:1};};
  const track=async()=>({id:2,...await targetPoint(page),radiusX:6,radiusY:6,force:1});
  const send=async(type,points)=>{const dispatched=type==='touchEnd'&&points.length?touches.filter(p=>!points.some(q=>q.id===p.id)):points;touches=points;await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:dispatched});if(type==='touchMove')await page.clock.runFor(34);};
  const pressed=id=>page.locator('#'+id).getAttribute('aria-pressed').then(x=>x==='true');
  await page.locator('#cast').tap();await waitForBite(page);const before=await page.locator('#strike').boundingBox();
  // Right first, secondary left pointer: the original primary-only filter must not return.
  await send('touchStart',[await rod(.5)]);await send('touchStart',[await rod(.5),await track()]);assert(await pressed('strike'));assert(await pressed('track-pad'));assert.deepEqual(await page.locator('#strike').boundingBox(),before);
  await page.clock.runFor(500);assert(parseInt(await page.locator('#progress-value').innerText())>0);
  await send('touchMove',[await rod(.8),await track()]);await expect(page.locator('#force-value')).toHaveText('80% lực cần');
  await send('touchMove',[await rod(.23),await track()]);await expect(page.locator('#force-value')).toHaveText('23% lực cần');
  await send('touchEnd',[touches[0]]);assert(await pressed('strike'));assert.equal(await pressed('track-pad'),false);
  await send('touchStart',[await rod(.5),await track()]);await send('touchEnd',[touches[1]]);assert(await pressed('track-pad'));assert.equal(await pressed('strike'),false);await send('touchEnd',[]);
  console.log('Verified '+label+' input');checks.push(label+': independent simultaneous fingers, analog drag and releasing either hand preserves the other');
  // Left first, secondary right pointer, then cancel both.
  await send('touchStart',[await track()]);await send('touchStart',[await track(),await rod(.5)]);assert(await pressed('strike'));assert(await pressed('track-pad'));
  await send('touchCancel',[]);assert.equal(await pressed('strike'),false);assert.equal(await pressed('track-pad'),false);
  await send('touchStart',[await rod(.5),await track()]);await page.keyboard.press('p');await send('touchEnd',[]);assert.equal(await pressed('strike'),false);assert.equal(await pressed('track-pad'),false);assert(await page.locator('#dialog').evaluate(el=>el.open));
  const clock=await page.locator('#session-clock').innerText();await page.clock.runFor(900);assert.equal(await page.locator('#session-clock').innerText(),clock);await page.locator('[data-dialog-action="0"]').tap();assert.equal(await pressed('strike'),false);
  checks.push(label+': reverse finger order, touchcancel, pause, frozen clock and fresh-input resume');
  await send('touchStart',[await rod(.5),await track()]);
  await send('touchMove',[await rod(.51),await track()]);await page.locator('#strike').evaluate(el=>el.releasePointerCapture(window.pointerIds.strike));await send('touchMove',[await rod(.52),await track()]);await expect(page.locator('#strike')).toHaveAttribute('aria-pressed','false');assert(await pressed('track-pad'));await send('touchEnd',[]);
  checks.push(label+': lost capture releases only its hand');
  await send('touchStart',[await rod(.5),await track()]);
  for(let i=0;i<350;i++){
   const state=await page.evaluate(()=>{const t=document.querySelector('#fish-target').getBoundingClientRect(),r=document.querySelector('#strike').getBoundingClientRect();return{dialog:document.querySelector('#dialog').open,phase:document.querySelector('.scene').dataset.phase,surge:document.querySelector('#fight-hint').textContent.startsWith('Cá bứt'),tx:t.x+t.width/2,ty:t.y+t.height/2,rx:r.x+r.width*.66,ry:r.y,rh:r.height};});
   if(state.dialog)break;assert.equal(state.phase,'fight','Fish lost while tracking');
   await send('touchMove',[{id:1,x:state.rx,y:state.ry+state.rh*(1-(state.surge?.22:.52)),force:1},{id:2,x:state.tx,y:state.ty,force:1}]);
   if(i===10)await page.screenshot({path:out+'/two-hands-'+label+'.png'});
   await page.clock.runFor(200);
  }
  assert(await page.locator('#dialog').evaluate(el=>el.open),'Landing dialog missing');await send('touchEnd',[]);assert(await page.locator('#dialog').evaluate(el=>el.open),'Finishing fingers dismissed catch dialog');
  const save=await s.saved();assert.equal(save.catches,1);assert.equal(save.baits.worm,17);assert(save.pending);assert.equal(await pressed('strike'),false);assert.equal(await pressed('track-pad'),false);
  await page.screenshot({path:out+'/two-hands-landed-'+label+'.png'});await page.reload();assert.equal((await s.saved()).pending.id,save.pending.id);await page.locator('[data-dialog-action="1"]').tap();assert.equal((await s.saved()).coins,save.coins+save.pending.value);
  assert.deepEqual(await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.scrollHeight]),[width,height]);
  console.log('Landed '+label);checks.push(label+': natural catch lands, final fingers do not dismiss dialog, reload preserves pending catch, sale is exactly once');
  await s.context.close();
 }
 // Force no state: choose a deterministic real cast seed that naturally snags.
 const {FishingGame}=await import('../src/engine.js'),{newPlayer}=await import('../src/save.js');let timestamp=Date.parse('2026-10-07T01:00:00Z');
 for(let offset=0;offset<200;offset++){const g=new FishingGame(newPlayer(),{seed:timestamp+offset+1000});g.cast();if(g.snagScheduled){timestamp+=offset;break;}}
 const snag=await scenario({},timestamp),sp=snag.page;await sp.locator('#cast').click();for(let i=0;i<40;i++){await sp.clock.runFor(100);if(await sp.locator('.scene').getAttribute('data-phase')==='snag')break;}
 assert.equal(await sp.locator('.scene').getAttribute('data-phase'),'snag');await sp.screenshot({path:out+'/snag-desktop.png'});const bait=(await snag.saved()).baits.worm;await driveHands(sp,'waiting');assert.equal(await sp.locator('.scene').getAttribute('data-phase'),'waiting');assert.equal((await snag.saved()).baits.worm,bait);await snag.context.close();
 checks.push('Natural deterministic snag: visible guidance, two-hand gentle release, no additional bait or currency loss');
 const reduced=await scenario({reducedMotion:'reduce',viewport:{width:375,height:812}}),rp=reduced.page;
 const staticFrame=await rp.locator('#water').evaluate(el=>el.toDataURL());await rp.clock.runFor(2000);assert.equal(await rp.locator('#water').evaluate(el=>el.toDataURL()),staticFrame);
 await rp.locator('#cast').click();await waitForBite(rp);await rp.locator('#strike').click();const initial=await rp.locator('#fish-target').getAttribute('style');await rp.clock.runFor(400);assert.notEqual(await rp.locator('#fish-target').getAttribute('style'),initial,'Essential fish movement must remain available with reduced motion');
 await rp.setViewportSize({width:812,height:375});await rp.clock.runFor(100);assert.equal(await rp.locator('.scene').getAttribute('data-phase'),'fight');assert.equal(await rp.locator('#strike').getAttribute('aria-pressed'),'false');
 await reduced.context.close();checks.push('Reduced motion removes ambient animation, retains essential fish movement; orientation keeps fight and clears hands');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);const result={status:'passed',checks,console_errors:errors,failed_requests:requests,scope:'Real engine, natural fish and CDP multi-touch. No injected catch or gameplay state. Touch emulation, not a physical device benchmark.'};fs.writeFileSync(out+'/two-hands-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(async e=>{if(lastPage&&!lastPage.isClosed())await lastPage.screenshot({path:out+'/two-hands-failed.png'}).catch(()=>{});console.error(e.stack);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.kill();});
