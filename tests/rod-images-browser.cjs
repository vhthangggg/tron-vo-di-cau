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
 for(const viewport of [{width:1440,height:900},{width:375,height:812}]){
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
  }
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
  checks.push(`${viewport.width}px: all 36 photos and affiliate links, purchase/storage, equipment photo, subpath assets and missing-photo fallback`);
  await context.close();
 }
 console.log(JSON.stringify({status:'passed',checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
