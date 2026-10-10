const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');
let browser,server;
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 server=spawn(process.execPath,['scripts/serve.mjs','--port','5184','--base','game'],{cwd:root});
 await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 const {newPlayer}=await import('../src/save.js'),{RODS}=await import('../src/content.js');
 const checks=[];
 for(const viewport of [{width:1440,height:900},{width:375,height:812},{width:812,height:375}]){
  const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const p=newPlayer();p.coins=200000;
  await page.addInitScript(p=>{if(!localStorage.getItem('tron-vo-di-cau.v01'))localStorage.setItem('tron-vo-di-cau.v01',JSON.stringify(p));},p);
  await page.goto('http://127.0.0.1:5184/game/#shop');
  await page.locator('[data-shop-category="rod"]').click();
  assert.equal(await page.locator('[data-category="rod"] [data-rod-image]').count(),36);
  for(const rod of RODS){
   const img=page.locator(`[data-category="rod"] [data-rod-image="${rod.id}"]`);
   await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());
   assert(await img.evaluate(e=>e.naturalWidth>1000&&e.naturalHeight>100&&getComputedStyle(e).objectFit==='contain'),rod.id);
   assert((await img.getAttribute('src')).endsWith(rod.asset));
   const card=img.locator('xpath=ancestor::article');
   assert.equal(await card.locator('.rod-affiliate').getAttribute('href'),rod.affiliateUrl);
   assert.equal(await card.locator('.rod-affiliate').getAttribute('target'),'_blank');
   assert.equal(await card.locator('.rod-visual>svg').isVisible(),false);
   assert.equal(await card.locator('[role="meter"]').count(),3);
   assert.equal(await card.locator('.gear-rack,.gear-display-caption').count(),0);
   assert.equal(await card.locator('.rod-visual').evaluate(e=>getComputedStyle(e).transform),'none');
   for(const [stat,value] of [['power',rod.power],['sensitivity',rod.ratings.sensitivity],['cast',rod.ratings.cast]]){
    assert.equal(Number(await card.locator(`[data-stat="${stat}"] [role="meter"]`).getAttribute('aria-valuenow')),value);
   }
   const layout=await card.evaluate(card=>{
    const showcase=card.querySelector('.gear-showcase').getBoundingClientRect(),visual=card.querySelector('.rod-visual').getBoundingClientRect();
    return {opacity:getComputedStyle(card).opacity,buy:card.querySelector('.gear-buy').getBoundingClientRect().height,affiliate:card.querySelector('.rod-affiliate').getBoundingClientRect().height,compact:card.querySelector('.rod-affiliate').getBoundingClientRect().width<card.querySelector('.gear-buy').getBoundingClientRect().width,inside:visual.left>=showcase.left&&visual.right<=showcase.right&&visual.top>=showcase.top&&visual.bottom<=showcase.bottom};
   });
   assert.equal(layout.opacity,'1');assert(layout.buy>=48&&layout.affiliate>=35&&layout.affiliate<=36);assert(layout.compact);assert(layout.inside,rod.id+' rod must not be cropped');
  }
  const card=id=>page.locator(`[data-gear-rod="${id}"]`);
  assert.equal(await card('bamboo').getAttribute('data-rarity'),'common');
  assert.equal(await card('rod_02').getAttribute('data-rarity'),'rare');
  assert.equal(await card('rod_35').getAttribute('data-rarity'),'epic');
  assert.equal(await card('rod_26').getAttribute('data-rarity'),'masterwork');
  assert.equal(await card('rod_31').getAttribute('data-rarity'),'legendary');
  assert(await card('rod_26').locator('.gear-price.is-short').isVisible());
  assert(await card('rod_26').locator('.gear-buy').isDisabled());
  assert.equal(await card('rod_02').locator('[data-stat="power"] .gear-delta').innerText(),'+4,3');
  const gain=await card('rod_02').locator('[data-stat="power"] .gear-gain').evaluate(e=>parseFloat(e.style.width));
  assert(Math.abs(gain-(5.5-1.2)/11*100)<.01);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await card('rod_02').locator('.gear-gain').first().evaluate(e=>getComputedStyle(e).animationName),'none');
  await card('rod_02').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(out,`rod-gear-${viewport.width}.png`)});
  await page.locator('[data-buy="rod"][data-id="rod_35"]').click();
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));
  assert.equal(saved.coins,82000);assert(saved.systems.inventory.stored.rods.includes('rod_35'));
  await page.locator('nav [data-screen="rig"]').click();
  const bamboo=page.locator('[data-rod-image="bamboo"]:visible').first();
  await bamboo.evaluate(e=>e.decode());assert(await bamboo.evaluate(e=>e.naturalWidth>1000));
  await page.locator('nav [data-screen="shop"]').click();await page.locator('[data-shop-category="rod"]').click();
  await page.locator('[data-rod-image="bamboo"]').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(out,`rods-${viewport.width}.png`)});
  assert((await page.evaluate(()=>document.documentElement.scrollWidth))<=viewport.width+1);
  await page.route('**/assets/items/rods/rod_01.webp',r=>r.abort());
  await page.reload();await page.locator('[data-shop-category="rod"]').click();
  const missing=page.locator('[data-rod-image="rod_01"]');await missing.locator('..').scrollIntoViewIfNeeded();
  await missing.locator('..').locator('svg').waitFor({state:'visible'});
  assert.deepEqual(errors,[]);
  // Compare a weaker rod against an equipped premium rod: losses stay visible and never become gains.
  const premium=newPlayer();premium.rod='rod_26';premium.rods.push('rod_26');premium.coins=200000;
  premium.systems.inventory.carried.rods=['rod_26'];premium.bait='lure';premium.baits.lure=1;premium.systems.inventory.carried.baits.lure=1;
  // Install after pagehide saves the previous session, before the new app reads storage.
  await page.addInitScript(p=>localStorage.setItem('tron-vo-di-cau.v01',JSON.stringify(p)),premium);
  await page.reload();await page.locator('[data-shop-category="rod"]').click();
  assert.equal(await card('bamboo').locator('[data-stat="power"] .gear-delta.loss').innerText(),'-7,6');
  assert.equal(await card('bamboo').locator('[data-stat="power"] .gear-gain').count(),0);
  assert.equal(Number(await card('bamboo').locator('[data-stat="power"]').getAttribute('data-previous')),8.8);
  assert.equal(await card('rod_26').locator('.gear-buy').innerText(),'Đang trang bị');
  assert.deepEqual(errors,[]);
  checks.push(`${viewport.width}px: all 36 photos, uncropped horizontal display, rarity tiers, current-rod gains/losses, insufficient funds, compact links, touch targets, reduced motion, purchase/storage and missing-photo fallback`);
  await context.close();
 }
 console.log(JSON.stringify({status:'passed',checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
