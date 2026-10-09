const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
let browser,server;
(async()=>{
 server=spawn(process.execPath,['scripts/serve.mjs','--port','5198'],{cwd:root});await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage',...(process.env.CHROMIUM_ARGS?JSON.parse(process.env.CHROMIUM_ARGS):[])],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 const checks=[];
 const {newPlayer}=await import('../src/save.js'),{ACCESSORIES,ACCESSORY_SLOTS}=await import('../src/content.js');
 for(const viewport of [{width:1440,height:900},{width:375,height:812},{width:640,height:360}]){
  const context=await browser.newContext({viewport,hasTouch:viewport.width<1000,isMobile:viewport.width<1000}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const fixture=newPlayer();fixture.coins=200000;await page.addInitScript(p=>{if(!localStorage.getItem('tron-vo-di-cau.v01'))localStorage.setItem('tron-vo-di-cau.v01',JSON.stringify(p));},fixture);
  await page.goto('http://127.0.0.1:5198/#shop');await page.locator('[data-shop-category="accessory"]').click();
  let coins=fixture.coins;
  for(const slot of Object.keys(ACCESSORY_SLOTS)){
   const tab=page.locator('[data-shop-accessory="'+slot+'"]');if(viewport.width<1000)await tab.tap();else await tab.click();
   const group=page.locator('[data-shop-accessory-group="'+slot+'"]');assert(await group.isVisible());assert.equal(await tab.getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('[data-shop-accessory-group]:visible').count(),1);
   assert.deepEqual(await group.locator('[data-buy]').evaluateAll(items=>items.map(item=>item.dataset.id)),ACCESSORIES.filter(a=>a.slot===slot).map(a=>a.id));
   const bounds=await tab.boundingBox();assert(bounds.width>=44&&bounds.height>=44,'Category is a touch-sized target');
   const item=ACCESSORIES.find(a=>a.slot===slot&&a.price>0&&!fixture.accessories.includes(a.id));await group.locator('[data-buy][data-id="'+item.id+'"]').click();coins-=item.price;
   const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));assert.equal(state.coins,coins);assert(state.accessories.includes(item.id));
   assert.equal(await page.locator('[data-shop-accessory="'+slot+'"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-shop-accessory-group]:visible').count(),1);
   await page.locator('[data-shop-category="rod"]').click();await page.locator('[data-shop-category="accessory"]').click();assert(await group.isVisible(),'Returning to accessories keeps the selected group');
  }
  await page.locator('[data-shop-accessory="line"]').click();
  for(const id of ['line_basic','line18','braid','line_copolymer']){
   const card=page.locator('.product').filter({has:page.locator('[data-line-detail="'+id+'"]')});await card.scrollIntoViewIfNeeded();
   const img=card.locator('.fishing-line-icon');await img.evaluate(e=>e.decode());assert((await img.evaluate(e=>e.naturalWidth))>200);
   await card.locator('[data-line-detail]').click();const detail=page.locator('.line-detail-image');await detail.evaluate(e=>e.decode());assert((await detail.evaluate(e=>e.naturalWidth))>1000);
   const bounds=await page.locator('#dialog').boundingBox();assert(bounds.x>=-1&&bounds.y>=-1&&bounds.x+bounds.width<=viewport.width+1&&bounds.y+bounds.height<=viewport.height+1,'Detail fits viewport');
   if(id==='braid')assert.match(await page.locator('#dialog-content').innerText(),/PE #1.0/);
   await page.locator('#dialog [data-dialog-action]').click();
  }
  assert((await page.evaluate(()=>document.documentElement.scrollWidth))<=viewport.width+1);assert.deepEqual(errors,[]);
  await page.locator('.shop-accessory-tabs').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'line-assets-'+viewport.width+'.png')});checks.push(viewport.width+'px: five touch-sized categories show only their products, purchases and navigation preserve selection; four icons/details and layout fit');await context.close();
 }
 const page=await browser.newPage();await page.route('**/nylon/icon.webp',r=>r.fulfill({status:404,body:'missing icon'}));await page.goto('http://127.0.0.1:5198/#shop');await page.locator('[data-shop-category="accessory"]').click();
 const nylon=page.locator('img[data-line-image="nylon"]');await nylon.scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('img[data-line-image="nylon"]')?.dataset.imageStage==='detail');await nylon.evaluate(e=>e.decode());assert.match(await nylon.getAttribute('src'),/detail.webp$/);
 await page.route('**/nylon/detail.webp',r=>r.fulfill({status:404,body:'missing detail'}));await page.reload();await page.locator('[data-shop-category="accessory"]').click();await page.locator('[data-line-detail="line18"]').scrollIntoViewIfNeeded();await page.locator('.line-image-fallback').waitFor();checks.push('Missing icon falls back to detail; missing pair leaves readable fallback');await page.close();
 fs.writeFileSync(path.join(out,'lines-verification.json'),JSON.stringify({status:'passed',checks},null,2));console.log(JSON.stringify({status:'passed',checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
