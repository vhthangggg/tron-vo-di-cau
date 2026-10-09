const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {driveHands,waitForBite,targetPoint}=require('./browser-player.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
let server,browser;
const errors=[],checks=[];
(async()=>{
 server=spawn(process.execPath,['scripts/serve.mjs','--port','5210'],{cwd:root});
 await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
 browser=await chromium.launch({headless:true,args:process.env.CHROMIUM_ARGS?JSON.parse(process.env.CHROMIUM_ARGS):['--no-sandbox','--disable-dev-shm-usage'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 const time=new Date('2026-10-07T01:00:00Z');await page.clock.install({time});await page.clock.pauseAt(new Date(time.getTime()+1000));
 await page.goto('http://127.0.0.1:5210/');await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('body').getAttribute('data-layout'),'desktop');
 assert((await page.locator('#game-nav').boundingBox()).y<100,'PC navigation sits below header');
 for(const screen of ['prepare','rig','shop','journal','learn']){
  await page.locator(`#game-nav a[href="#${screen}"]`).click();
  assert.equal(await page.locator('body').getAttribute('data-screen'),screen);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal page overflow');
 }
 checks.push('PC home, prepare, rig, shop, journal and lessons share top navigation without horizontal overflow');
 await page.locator('#game-nav a[href="#prepare"]').click();await page.locator('#start-fishing').click();
 await page.waitForFunction(()=>document.querySelector('.scene')?.dataset.loading==='ready');
 await page.screenshot({path:path.join(out,'desktop-idle-1366.png')});
 assert(await page.locator('.desktop-fishing-panel').isVisible());assert.match(await page.locator('#desktop-line').innerText(),/Thẻo/);
 async function checkGeometry(width,height){
  await page.setViewportSize({width,height});await page.clock.runFor(34);
  const [scene,panel]=await Promise.all([page.locator('.scene').boundingBox(),page.locator('.desktop-fishing-panel').boundingBox()]);
  assert(scene.width>=700);assert(scene.x+scene.width<=panel.x+1,'Sidebar never covers water');
  assert(panel.x+panel.width<=width+1);assert.equal(Math.round(scene.height),height);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight),'Fishing fits viewport');
  const top=await page.locator('.fishing-topbar').boundingBox();assert(top.x>=scene.x&&top.x+top.width<=scene.x+scene.width+1);
 }
 for(const [width,height] of [[1024,768],[1280,720],[1366,768],[1920,1080],[2560,1080],[1280,480]])await checkGeometry(width,height);
 await page.setViewportSize({width:1366,height:768});await page.clock.runFor(34);
 checks.push('Separate water and sidebar at 1024, 1280, 1366, 1920, ultrawide 2560 and short 480px height');
 await page.locator('#main').focus();await page.keyboard.press('b');assert.equal(await page.locator('#dialog').getAttribute('data-kind'),'field-kit');await page.locator('#dialog-close').click();await page.clock.runFor(34);
 await page.locator('#main').focus();await page.keyboard.press('k');assert.equal(await page.locator('#dialog').getAttribute('data-kind'),'keepnet');await page.locator('#dialog-close').click();await page.clock.runFor(34);
 // Native Space activation on a focused button must not cast or strike.
 await page.locator('#desktop-kit').focus();await page.keyboard.press('Space');assert(await page.locator('#dialog').evaluate(el=>el.open));assert.equal(await page.locator('.scene').getAttribute('data-phase'),'idle');await page.locator('#dialog-close').click();await page.clock.runFor(34);
 await page.locator('#main').focus();await page.keyboard.press('Control+b');assert.equal(await page.locator('#dialog').evaluate(el=>el.open),false);
 checks.push('B/K shortcuts, native button Space and browser modifier shortcuts');
 if(await page.evaluate(()=>document.fullscreenEnabled)){
  await page.locator('#main').focus();await page.keyboard.press('f');await page.waitForFunction(()=>!!document.fullscreenElement);
  assert.equal(await page.locator('#desktop-fullscreen').getAttribute('aria-pressed'),'true');
  await page.keyboard.press('f');await page.waitForFunction(()=>!document.fullscreenElement);await page.clock.runFor(34);
  checks.push('F enters/exits fullscreen and updates button state');
 }
 await page.locator('#main').focus();await page.keyboard.press('Space');assert.equal(await page.locator('.scene').getAttribute('data-phase'),'casting');
 await page.clock.runFor(2500);await page.keyboard.press('r');assert.equal(await page.locator('.scene').getAttribute('data-phase'),'idle');
 checks.push('Space casts; R retrieves while preserving intact bait');
 await page.keyboard.press('Space');await waitForBite(page);
 const before=await page.locator('#track-pad').boundingBox();await page.keyboard.down('Space');
 const point=await targetPoint(page);await page.mouse.move(point.x,point.y);await page.clock.runFor(200);
 assert.equal(await page.locator('#track-pad').getAttribute('aria-pressed'),'true','PC hover follows fish without a mouse press');
 assert.deepEqual(await page.locator('#track-pad').boundingBox(),before,'Hook and fight keep control geometry stable');
 const [left,meter,right]=await Promise.all([page.locator('.left-hand').boundingBox(),page.locator('#fight').boundingBox(),page.locator('.right-hand').boundingBox()]);
 assert(left.x+left.width<=meter.x);assert(meter.x+meter.width<=right.x,'Fight meter never covers either hand');
 await page.screenshot({path:path.join(out,'desktop-fight-1366.png')});
 await page.keyboard.down('ArrowDown');await page.clock.runFor(200);await page.keyboard.up('ArrowDown');
 assert(parseInt(await page.locator('#force-value').innerText())<55);
 await page.keyboard.up('Space');assert.equal(await page.locator('#track-pad').getAttribute('aria-pressed'),'false');
 // Pause releases hover and freezes the session until an explicit resume.
 await page.keyboard.down('Space');await page.mouse.move(point.x+1,point.y+1);await page.keyboard.press('p');await page.keyboard.up('Space');
 assert.equal(await page.locator('#strike').getAttribute('aria-pressed'),'false');assert.equal(await page.locator('#track-pad').getAttribute('aria-pressed'),'false');
 const clock=await page.locator('#session-clock').innerText();await page.clock.runFor(1000);assert.equal(await page.locator('#session-clock').innerText(),clock);
 await page.locator('[data-dialog-action="0"]').click();await page.locator('#main').focus();
 checks.push('Hover + Space, analog arrows, stable fight geometry, release and pause cleanup');
 await driveHands(page);assert(await page.locator('#dialog').evaluate(el=>el.open));assert.equal(await page.locator('.scene').getAttribute('data-phase'),'landed');
 async function photoFits(selector){
  await page.waitForFunction(selector=>document.querySelector(selector+' .has-photo'),selector);
  assert(await page.locator(selector).evaluate(el=>{const box=el.getBoundingClientRect(),img=el.querySelector('img').getBoundingClientRect();return img.left>=box.left-.5&&img.right<=box.right+.5&&img.top>=box.top-.5&&img.bottom<=box.bottom+.5;}),'Catch/keepnet photos fit their small frames');
 }
 await photoFits('.fish-hero');
 await page.locator('[data-catch-decision="keep"]').click();assert.match(await page.locator('#desktop-keepnet-label').innerText(),/1 con/);
 await page.clock.runFor(34);await page.locator('#desktop-keepnet').click();await photoFits('.keepnet-art');await page.locator('#dialog-close').click();await page.clock.runFor(34);
 assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')))).keptFish.length,1);
 await page.reload();await page.waitForFunction(()=>document.querySelector('.scene')?.dataset.loading==='ready');assert.match(await page.locator('#desktop-keepnet-label').innerText(),/1 con/);
 checks.push('Natural fish lands, goes into keepnet and survives reload with the sidebar count in sync');
 // A resize keeps the same DOM and save; small PC windows are not rotated.
 await page.setViewportSize({width:900,height:720});await page.clock.runFor(34);await page.waitForFunction(()=>document.body.dataset.layout==='compact');assert.equal(await page.locator('body').getAttribute('data-layout'),'compact');assert.equal(await page.locator('.desktop-fishing-panel').isVisible(),false);
 await page.setViewportSize({width:640,height:800});await page.clock.runFor(34);assert.equal(await page.locator('#main').evaluate(el=>getComputedStyle(el).transform),'none');
 await page.setViewportSize({width:1366,height:768});await page.clock.runFor(34);await page.waitForFunction(()=>document.body.dataset.layout==='desktop');assert(await page.locator('.desktop-fishing-panel').isVisible());assert.match(await page.locator('#desktop-keepnet-label').innerText(),/1 con/);
 checks.push('Desktop ↔ compact resizing preserves saves and small mouse windows never rotate');
 await context.close();
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1280,height:800}]){
  const c=await browser.newContext({viewport,isMobile:true,hasTouch:true,reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:5210/#fishing');await p.waitForFunction(()=>document.querySelector('.scene')?.dataset.loading==='ready');
  assert.equal(await p.locator('body').getAttribute('data-layout'),'compact');assert.equal(await p.locator('.desktop-fishing-panel').isVisible(),false);
  const rotated=await p.locator('#main').evaluate(el=>getComputedStyle(el).transform);
  assert.equal(rotated==='none',viewport.width>700,'Only a portrait phone uses the rotated fallback');
  await p.screenshot({path:path.join(out,`desktop-regression-touch-${viewport.width}.png`)});await c.close();
 }
 checks.push('Phone portrait/landscape and touch tablet keep the mobile interface with reduced motion');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'desktop-report.json'),JSON.stringify({checks,errors},null,2));console.log('PASS\n'+checks.join('\n'));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
