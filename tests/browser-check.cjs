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
 await page.clock.pauseAt(new Date('2026-10-06T12:00:01Z'));
 await page.goto('http://127.0.0.1:5185/tron-vo-di-cau/');await page.evaluate(()=>document.fonts.ready);
 const nav=async target=>{
   if(await page.locator('body').getAttribute('data-screen')==='fishing'){
     if(target==='fishing')return;
     await page.locator('#leave-fishing').click();
     assert(!await page.locator('#dialog').evaluate(el=>el.open),'Active cast needs an explicit exit decision');
   }
   if(target==='fishing'){
     if(await page.locator('body').getAttribute('data-screen')!=='prepare')await page.locator('nav [data-screen="prepare"]').click();
     await page.locator('#start-fishing').click();
   }else if(await page.locator('body').getAttribute('data-screen')!==target)await page.locator('nav [data-screen="'+target+'"]').click();
 };

 await page.locator('[data-travel="HO"]').click();
 assert.equal(await page.locator('[data-shop-category="map"]').getAttribute('aria-pressed'),'true');
 assert(await page.locator('[data-category="map"]').isVisible());
 assert(!await page.locator('[data-category="rod"]').isVisible());
 await page.locator('[data-shop-category="bait"]').click();assert(await page.locator('[data-category="bait"]').isVisible());
 await page.locator('[data-shop-category="all"]').click();
 await nav('home');await page.locator('[data-travel="AO"]').click();
 assert.equal(await page.locator('#prepare-map-heading').innerText(),'Ao Làng');
 await page.locator('#start-fishing').click();
 checks.push('Camp map travel works; locked destination opens map shop; category filters work');
 for(const screen of ['home','prepare','fishing','rig','learn','journal','shop']){
   await nav(screen);
   await page.screenshot({path:out+'/'+screen+'-desktop.png',fullPage:true});
   assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),screen+' desktop overflow');
 }
 checks.push('Seven screens rendered with repository subpath; all assets loaded');
 assert.deepEqual(errors,[],'Errors while rendering the seven screens');
 await nav('fishing');
 await page.locator('#main').focus();await page.keyboard.press('Space');
 assert(await page.locator('#cast').isDisabled());
 await page.locator('#strike').click();assert.match(await page.locator('#status-copy').innerText(),/Giật sớm/);
 checks.push('Keyboard cast and early-strike failure');
 await page.locator('#cast').click();
 const exitSave=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));
 await page.locator('#leave-fishing').click();assert.match(await page.locator('#dialog-title').innerText(),/Thu cần/);
 const frozen=await page.locator('#session-clock').innerText();await page.clock.runFor(1000);assert.equal(await page.locator('#session-clock').innerText(),frozen);
 await page.locator('[data-dialog-action="0"]').click();assert.equal(await page.locator('body').getAttribute('data-screen'),'fishing');assert.equal(await page.locator('.scene').getAttribute('data-phase'),'waiting');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')).baits.worm),exitSave.baits.worm);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#dialog').getAttribute('data-kind'),'pause');await page.screenshot({path:out+'/pause-desktop.png'});
 await page.locator('[data-dialog-action="1"]').click();assert.match(await page.locator('#dialog-title').innerText(),/Thu cần/);
 await page.locator('[data-dialog-action="1"]').click();assert.equal(await page.locator('body').getAttribute('data-screen'),'prepare');
 const afterExit=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));
 assert.equal(afterExit.baits.worm,exitSave.baits.worm);assert.equal(afterExit.coins,exitSave.coins);assert.equal(afterExit.catches,exitSave.catches);
 await page.locator('#start-fishing').click();assert(await page.locator('#main').evaluate(el=>el===document.activeElement));
 checks.push('Focused mode hides dock/profile/management; Escape pauses; declined exit keeps cast; confirmed return to preparation spends no extra bait');

 await page.locator('#cast').click();
 let bite=false;
 for(let i=0;i<100;i++){await page.clock.runFor(250);if((await page.locator('#status-title').innerText()).includes('Đúng nhịp')){bite=true;break;}}
 assert(bite,'No natural bite within 25 seconds');
 await page.locator('#strike').click();assert(await page.locator('#fight').isVisible());
 for(const [width,height,label] of [[375,812,'mobile'],[844,390,'landscape'],[640,360,'small-landscape']]){
   await page.setViewportSize({width,height});
   for(const id of ['pull','ease','pause','leave-fishing']){
     const box=await page.locator('#'+id).boundingBox();assert(box.height>=44&&box.width>=44,id+' fight touch target');assert(box.y>=0&&box.y+box.height<=height,id+' fight outside viewport');
   }
   const fight=await page.locator('#fight').boundingBox(),caption=await page.locator('.scene-caption').boundingBox(),signal=await page.locator('#float-zoom').boundingBox();
   assert(caption.y+caption.height<=fight.y,'Map info obscures fight at '+label);
   assert(signal.x>=fight.x+fight.width||signal.y+signal.height<=fight.y,'Signal obscures fight at '+label);
   await page.screenshot({path:out+'/fight-'+label+'.png'});
 }
 await page.setViewportSize({width:1440,height:980});
 checks.push('Fight controls remain visible, at least 44 px and clear of map/signal at portrait and two landscape phone sizes');

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
 assert.equal(await page.locator('#rank-count').innerText(),'1 / 5 cá');
 await page.screenshot({path:out+'/catch-desktop.png',fullPage:true});
 await page.reload();await page.evaluate(()=>document.fonts.ready);
 const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));
 assert.equal(restored.pending.id,catchId);assert(await page.locator('#dialog').evaluate(el=>el.open));
 await page.locator('[data-dialog-action="1"]').click();
 const sold=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));
 assert.equal(sold.coins,before.coins+before.pending.value);assert.equal(sold.sold,1);assert.equal(sold.pending,null);
 checks.push('Natural fish approach → bite → controlled fight → catch; unresolved catch survives reload; sale credited once');
 await nav('learn');await page.locator('[data-lesson="signal"]').click();
 await page.locator('[data-answer="1"]').click();assert.match(await page.locator('#quiz-feedback').innerText(),/Chưa đúng/);
 await page.locator('[data-answer="0"]').click();assert.match(await page.locator('#quiz-feedback').innerText(),/2.500/);
 await page.locator('#dialog-content .actions button').click();
 const learned=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));
 assert.equal(learned.coins,sold.coins+2500);
 await page.locator('[data-lesson="signal"]').click();await page.locator('[data-answer="0"]').click();await page.locator('#dialog-content .actions button').click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')).coins),learned.coins);
 checks.push('Lesson: wrong answer retriable, reward issued only once');
 await nav('rig');
 await page.locator('#lead').fill('1.5');await page.locator('#lead').dispatchEvent('input');assert.match(await page.locator('#rig-state').innerText(),/chưa cân/);
 await nav('prepare');assert(await page.locator('#start-fishing').isDisabled());assert.match(await page.locator('#prepare-ready').innerText(),/chưa cân/);await nav('rig');
 await page.locator('#balance').click();assert.match(await page.locator('#rig-state').innerText(),/4 vạch/);
 const worms=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')).baits.worm);
 await page.locator('#dig').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')).baits.worm),worms+6);
 checks.push('Rig balancing and free bait recovery');
 await page.locator('[data-equip="dai"]').click();
 assert.equal(await page.locator('[data-shop-category="rod"]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-shop-category="all"]').click();
 checks.push('Locked gear slot opens upgrade shop; rank HUD reflects the real catch');
 await nav('shop');const wallet=await page.locator('#wallet').innerText();
 await page.locator('[data-buy="bait"][data-id="dough"]').click();assert.notEqual(await page.locator('#wallet').innerText(),wallet);
 await page.reload();assert.equal(await page.locator('[data-buy="rod"][data-id="bamboo"]').isDisabled(),true);
 await page.locator('#settings').click();for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.querySelector('#dialog').contains(document.activeElement)));}
 await page.keyboard.press('Escape');assert(await page.locator('#settings').evaluate(el=>el===document.activeElement));
 checks.push('Purchases persisted; modal traps and restores focus');
 await nav('journal');await page.locator('#fish-search').fill('lóc');assert.equal(await page.locator('.fish-row').count(),2);
 await page.locator('#fish-map').selectOption('AO');assert.equal(await page.locator('.fish-row').count(),1);
 await page.locator('#fish-map').selectOption('all');await page.locator('#fish-search').fill('');assert.equal(await page.locator('.fish-row').count(),50);
 checks.push('Journal filter');
 for(const [width,height,label] of [[375,812,'mobile'],[844,390,'landscape'],[640,360,'small-landscape'],[768,1024,'tablet']]){
   await page.setViewportSize({width,height});
   for(const screen of ['home','prepare','fishing','rig','learn','journal','shop']){
     await nav(screen);
     assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),screen+' '+label+' overflow');
     if(label==='mobile'||screen==='fishing'&&label==='landscape')await page.screenshot({path:out+'/'+screen+'-'+label+'.png',fullPage:true});
   }
   checks.push(label+' no horizontal overflow');
   await nav('fishing');
   assert(await page.locator('#game-nav').isHidden());assert(await page.locator('.game-header').isHidden());
   const scene=await page.locator('.scene').boundingBox();assert.equal(scene.width,width);assert.equal(scene.height,height);assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight),height);
   assert.equal(await page.locator('.scene a,[data-open-maps],.bank-panel').count(),0);
   for(const id of ['cast','strike','retrieve','pause','help','leave-fishing']){
     const box=await page.locator('#'+id).boundingBox();
     assert(box.height>=44&&box.width>=44,id+' '+label+' touch target');
     assert(box.y>=0&&box.y+box.height<=height,id+' '+label+' outside viewport');
   }
   if(label==='mobile'){
     await nav('prepare');await page.locator('[data-spot="1"]').click();await nav('fishing');
     assert.equal(await page.locator('#spot-name').innerText(),'Mép bèo');
     await page.locator('#cast').click();await page.locator('#pause').click();
     const paused=await page.locator('#session-clock').innerText();await page.clock.runFor(1000);
     assert.equal(await page.locator('#session-clock').innerText(),paused);
     await page.locator('[data-dialog-action="0"]').click();await page.locator('#retrieve').click();
     checks.push('Preparation selects a mobile spot; immersive touch cast, pause sheet and resume/retrieve work');
   }
 }
 await page.setViewportSize({width:1440,height:980});await nav('rig');
 await page.evaluate(()=>document.body.style.zoom='2');assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),'Zoom 200% overflow');await page.evaluate(()=>document.body.style.zoom='');
 checks.push('200% zoom reflow');
 await page.emulateMedia({reducedMotion:'reduce'});await nav('fishing');await page.locator('#cast').click();await page.locator('#pause').click();const clock=await page.locator('#session-clock').innerText();await page.clock.runFor(10000);assert.equal(await page.locator('#session-clock').innerText(),clock);await page.locator('[data-dialog-action="0"]').click();await page.locator('#retrieve').click();
 checks.push('Reduced-motion operable; pause freezes active simulation');
 const sessionBait=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')).baits.worm);
 await page.locator('#pause').click();await page.locator('#pause-new-session').click();assert.equal(await page.locator('#session-clock').innerText(),'00:00');assert(await page.locator('#cast').isEnabled());assert(await page.locator('#dialog').evaluate(el=>!el.open));
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')).baits.worm),sessionBait);
 checks.push('Idle pause menu starts a fresh session, resumes controls and does not consume bait');

 assert.deepEqual(errors,[],'Browser errors');assert.deepEqual(requests,[],'Failed network requests');
 const result={status:'passed',checks,console_errors:errors,failed_requests:requests,scope:'Playable web v0.1, local HTTP served under /tron-vo-di-cau/. Virtual clock drives real animation frames; inputs use the rendered UI.'};
 fs.writeFileSync(out+'/verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 await browser.close();server.kill();
})().catch(e=>{if(server)server.kill();console.error(e.stack);process.exit(1);});
