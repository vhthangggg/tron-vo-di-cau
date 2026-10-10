const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});let server,browser;
const key='tron-vo-di-cau.v01',D=86400000,H=3600000,start=Date.UTC(2026,9,9,1),origin='http://127.0.0.1:5214';
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
async function noOverflow(page){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');}
(async()=>{
 server=spawn(process.execPath,['scripts/serve.mjs','--port','5214'],{cwd:root});await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 const {newPlayer}=await import('../src/save.js');
 for(const [width,height] of [[390,844],[1366,768],[320,640]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,isMobile:width<500}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const player=newPlayer({now:start+1000});player.settings.sound=false;
  await page.addInitScript(p=>{if(!localStorage.getItem('tron-vo-di-cau.v01'))localStorage.setItem('tron-vo-di-cau.v01',JSON.stringify(p));},player);
  await page.clock.install({time:new Date(start)});await page.clock.pauseAt(new Date(start+1000));
  await page.goto(origin);await page.evaluate(()=>document.fonts.ready);
  if(width>700){const title=await page.locator('.camp-title').boundingBox(),travel=await page.locator('.travel-board').boundingBox();assert(title.y+title.height<travel.y,'Home actions do not overlap travel');await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0)});await page.screenshot({path:path.join(out,'garden-home-'+width+'.png'),fullPage:true});}
  await page.locator('.camp-garden').click();assert.equal(await page.locator('body').getAttribute('data-screen'),'garden');await noOverflow(page);
  assert(await page.locator('#garden-worms-dig').isDisabled());assert(await page.locator('#garden-corn-plant').isDisabled());
  await page.locator('[data-stock="garden"]').click();assert.equal(await page.locator('[data-shop-category="garden"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-category="garden"] .product').count(),8);await noOverflow(page);
  assert(await page.locator('[data-buy="garden"][data-id="hoe_old"]').isDisabled());
  const coins=(await saved(page)).coins;await page.locator('[data-buy="garden"][data-id="watering_can"]').click();assert.equal((await saved(page)).coins,coins-2200);assert(await page.locator('[data-buy="garden"][data-id="watering_can"]').isDisabled());
  await page.locator('[data-buy="garden"][data-id="compost"]').click();assert.equal((await saved(page)).systems.garden.supplies.compost,5);
  await page.locator('[data-category="garden"] a[href="#garden"]').click();assert.match(await page.locator('.garden-kit').innerText(),/Bình tưới/);
  for(const action of ['hoe','feed','water','plant'])await page.locator('#garden-corn-'+action).click();
  for(const action of ['feed','water'])await page.locator('#garden-worms-'+action).click();await page.locator('#garden-composter-compost').click();
  let state=await saved(page);assert(state.systems.garden.corn.crop);assert.equal(state.systems.garden.supplies.corn_seed,2);assert.equal(state.systems.garden.supplies.compost,3);
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0)});await page.screenshot({path:path.join(out,'garden-planted-'+width+'.png'),fullPage:true});
  await page.clock.setSystemTime(new Date(start+1000+12*H));await page.reload();await page.locator('#garden-worms-dig').click();state=await saved(page);assert.equal(state.baits.worm,player.baits.worm+3);assert.equal(state.systems.inventory.carried.baits.worm,18);assert.equal(state.systems.inventory.stored.baits.worm,3);assert(await page.locator('#garden-worms-dig').isDisabled());
  await page.locator('#garden-composter-collect').click();assert.equal((await saved(page)).systems.garden.supplies.compost,4);assert(await page.locator('#garden-composter-compost').isDisabled());
  for(let day=1;day<=3;day++){
   await page.clock.setSystemTime(new Date(start+1000+day*D));await page.reload();
   if(day<3){for(const action of ['water','feed','hoe']){const b=page.locator('#garden-corn-'+action);if(await b.isEnabled())await b.click();}const water=page.locator('#garden-worms-water');if(await water.isEnabled())await water.click();}
  }
  assert(await page.locator('#garden-corn-harvest').isEnabled());await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0)});await page.screenshot({path:path.join(out,'garden-harvest-'+width+'.png'),fullPage:true});
  const cornBefore=(await saved(page)).baits.corn;await page.locator('#garden-corn-harvest').click();state=await saved(page);assert.equal(state.baits.corn,cornBefore+16);assert.equal(state.systems.garden.corn.crop,null);assert.equal(state.systems.garden.supplies.corn_seed,3);assert.equal(state.systems.inventory.stored.baits.corn,22);
  await page.reload();assert.equal((await saved(page)).baits.corn,cornBefore+16);assert.equal(await page.locator('#garden-corn-harvest').count(),0);await noOverflow(page);
  await page.locator('#game-nav a[href="#rig"]').click();assert.equal(await page.locator('#dig,[data-gather]').count(),0);assert(!((await page.locator('#main').innerText()).includes('Trộn mồi bột')));assert(await page.locator('a[href="#garden"]').count());
  assert.deepEqual(errors,[]);console.log('PASS '+width+'px: home garden, real shop purchases, soil prep, sowing, 12h worms/compost, 24h cooldown, 3-day cared crop, harvest into home storage and reload; no instant bait, no overflow/errors.');await context.close();
 }
 // Existing schema-2 saves receive a garden once, without losing caught fish or a depleted lure.
 const p=newPlayer({now:start+1000});p.schemaVersion=2;delete p.systems.garden;p.coins=8130;p.collection.fish_01={count:2,best:.7};p.catches=2;p.rods.push('rod_02');p.baits.lure=0;
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();await page.addInitScript(p=>{if(!localStorage.getItem('tron-vo-di-cau.v01'))localStorage.setItem('tron-vo-di-cau.v01',JSON.stringify(p));},p);
 await page.goto(origin+'/#garden');let migrated=await saved(page);assert.equal(migrated.schemaVersion,3);assert.equal(migrated.coins,p.coins);assert.deepEqual(migrated.collection,p.collection);assert.equal(migrated.baits.lure,0);
 await page.locator('#garden-corn-feed').click();await page.reload();assert.equal((await saved(page)).systems.garden.supplies.compost,1);assert.equal((await saved(page)).coins,p.coins);await context.close();console.log('PASS live UI migration schema 2 → 3: assets, achievements and depleted lure conserved; starter supplies granted once.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
