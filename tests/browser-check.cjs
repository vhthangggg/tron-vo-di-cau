const fs=require('fs');
const path=require('path');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const project=path.resolve(__dirname,'..');
const out=path.join(project,'test-results');
fs.mkdirSync(out,{recursive:true});
let server;
(async()=>{
 server=require('child_process').spawn(process.execPath,['scripts/serve.mjs','--base','tron-vo-di-cau','--port','5185'],{cwd:project});
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>{if(code)reject(Error('Server exit '+code));});});
 const options={headless:true};
 if(process.env.CHROMIUM_EXECUTABLE)options.executablePath=process.env.CHROMIUM_EXECUTABLE;
 if(process.env.CHROMIUM_ARGS)options.args=JSON.parse(process.env.CHROMIUM_ARGS);
 const browser=await chromium.launch(options);
 const page=await browser.newPage({viewport:{width:1440,height:980},deviceScaleFactor:1});
 const errors=[],requests=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>requests.push(r.url()+': '+r.failure().errorText));
 await page.clock.install({time:new Date('2026-10-06T12:00:00Z')});
 await page.goto('http://127.0.0.1:5185/tron-vo-di-cau/');await page.evaluate(()=>document.fonts.ready);
 for(const screen of ['home','fishing','rig','learn','journal','shop']){
   await page.locator('nav [data-screen="'+screen+'"]').click();
   await page.screenshot({path:out+'/'+screen+'-desktop.png',fullPage:true});
   assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),screen+' desktop overflow');
 }
 checks.push('Six screens rendered with repository subpath; all assets loaded');
 await page.locator('nav [data-screen="fishing"]').click();
 await page.locator('#main').focus();await page.keyboard.press('Space');
 assert(await page.locator('#cast').isDisabled());
 await page.locator('#strike').click();assert.match(await page.locator('#status-copy').innerText(),/Giật sớm/);
 checks.push('Keyboard cast and early-strike failure');
 await page.locator('#cast').click();
 let bite=false;
 for(let i=0;i<100;i++){await page.clock.runFor(250);if((await page.locator('#status-title').innerText()).includes('Đúng nhịp')){bite=true;break;}}
 assert(bite,'No natural bite within 25 seconds');
 await page.locator('#strike').click();assert(await page.locator('#fight').isVisible());
 for(let i=0;i<450;i++){
   if(await page.locator('#dialog').evaluate(el=>el.open))break;
   assert(await page.locator('#fight').isVisible(),'Fight failed: '+await page.locator('#status-copy').innerText());
   const t=parseInt(await page.locator('#tension-value').innerText()),surge=(await page.locator('#fight-hint').innerText()).startsWith('Cá bứt');
   const pulling=await page.locator('#pull').getAttribute('aria-pressed')==='true';
   if((t>78||surge)&&pulling)await page.locator('#ease').click();
   else if(t<76&&!surge&&!pulling)await page.locator('#pull').click();
   await page.clock.runFor(100);
 }
 assert(await page.locator('#dialog').evaluate(el=>el.open),'Catch dialog missing');
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));
 assert.equal(before.catches,1);assert(before.pending);const catchId=before.pending.id;
 await page.screenshot({path:out+'/catch-desktop.png',fullPage:true});
 await page.reload();await page.evaluate(()=>document.fonts.ready);
 const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));
 assert.equal(restored.pending.id,catchId);assert(await page.locator('#dialog').evaluate(el=>el.open));
 await page.locator('[data-dialog-action="1"]').click();
 const sold=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));
 assert.equal(sold.coins,before.coins+before.pending.value);assert.equal(sold.sold,1);assert.equal(sold.pending,null);
 checks.push('Natural fish approach → bite → controlled fight → catch; unresolved catch survives reload; sale credited once');
 await page.locator('nav [data-screen="learn"]').click();await page.locator('[data-lesson="signal"]').click();
 await page.locator('[data-answer="1"]').click();assert.match(await page.locator('#quiz-feedback').innerText(),/Chưa đúng/);
 await page.locator('[data-answer="0"]').click();assert.match(await page.locator('#quiz-feedback').innerText(),/2.500/);
 await page.locator('#dialog-content .actions button').click();
 const learned=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));
 assert.equal(learned.coins,sold.coins+2500);
 await page.locator('[data-lesson="signal"]').click();await page.locator('[data-answer="0"]').click();await page.locator('#dialog-content .actions button').click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')).coins),learned.coins);
 checks.push('Lesson: wrong answer retriable, reward issued only once');
 await page.locator('nav [data-screen="rig"]').click();
 await page.locator('#lead').fill('1.5');await page.locator('#lead').dispatchEvent('input');assert.match(await page.locator('#rig-state').innerText(),/chưa cân/);
 await page.locator('#balance').click();assert.match(await page.locator('#rig-state').innerText(),/4 vạch/);
 const worms=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')).baits.worm);
 await page.locator('#dig').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')).baits.worm),worms+6);
 checks.push('Rig balancing and free bait recovery');
 await page.locator('nav [data-screen="shop"]').click();const wallet=await page.locator('#wallet').innerText();
 await page.locator('[data-buy="bait"][data-id="dough"]').click();assert.notEqual(await page.locator('#wallet').innerText(),wallet);
 await page.reload();assert.equal(await page.locator('[data-buy="rod"][data-id="bamboo"]').isDisabled(),true);
 await page.locator('#settings').click();for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.querySelector('#dialog').contains(document.activeElement)));}
 await page.keyboard.press('Escape');assert(await page.locator('#settings').evaluate(el=>el===document.activeElement));
 checks.push('Purchases persisted; modal traps and restores focus');
 await page.locator('nav [data-screen="journal"]').click();await page.locator('#fish-search').fill('lóc');assert.equal(await page.locator('.fish-row').count(),1);
 checks.push('Journal filter');
 for(const [width,height,label] of [[375,812,'mobile'],[844,390,'landscape'],[768,1024,'tablet']]){
   await page.setViewportSize({width,height});
   for(const screen of ['home','fishing','rig','learn','journal','shop']){
     await page.locator('nav [data-screen="'+screen+'"]').click();
     assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),screen+' '+label+' overflow');
     if(label==='mobile'||screen==='fishing'&&label==='landscape')await page.screenshot({path:out+'/'+screen+'-'+label+'.png',fullPage:true});
   }
   checks.push(label+' no horizontal overflow');
 }
 await page.setViewportSize({width:1440,height:980});await page.locator('nav [data-screen="rig"]').click();
 await page.evaluate(()=>document.body.style.zoom='2');assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),'Zoom 200% overflow');await page.evaluate(()=>document.body.style.zoom='');
 checks.push('200% zoom reflow');
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('nav [data-screen="fishing"]').click();await page.locator('#cast').click();await page.locator('#pause').click();const clock=await page.locator('#session-clock').innerText();await page.clock.runFor(10000);assert.equal(await page.locator('#session-clock').innerText(),clock);await page.locator('#pause').click();await page.locator('#retrieve').click();
 checks.push('Reduced-motion operable; pause freezes active simulation');
 assert.deepEqual(errors,[],'Browser errors');assert.deepEqual(requests,[],'Failed network requests');
 const result={status:'passed',checks,console_errors:errors,failed_requests:requests,scope:'Playable web v0.1, local HTTP served under /tron-vo-di-cau/. Virtual clock drives real animation frames; inputs use the rendered UI.'};
 fs.writeFileSync(out+'/verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 await browser.close();server.kill();
})().catch(e=>{if(server)server.kill();console.error(e.stack);process.exit(1);});
