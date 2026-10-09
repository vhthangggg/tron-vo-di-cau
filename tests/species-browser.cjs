const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
let server,browser;
(async()=>{
 server=spawn(process.execPath,['scripts/serve.mjs','--port','5209'],{cwd:root});
 await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 for(const viewport of [{width:390,height:844},{width:1280,height:800}]){
  const context=await browser.newContext({viewport,hasTouch:viewport.width<500,isMobile:viewport.width<500,acceptDownloads:true});
  const page=await context.newPage(),errors=[],fishRequests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/assets/fish/'))fishRequests.push(r.url());});
  // Explicit no-upload fixture: the live repository now includes photographs.
  await page.route('**/src/fish-assets.js',r=>r.fulfill({contentType:'text/javascript',body:'export const FISH_IMAGE_FILES={};'}));
  await page.goto('http://127.0.0.1:5209/#journal');await page.locator('.fish-row').first().waitFor();
  assert.equal(await page.locator('.fish-row').count(),56);assert.equal(await page.locator('[data-fish-image]').count(),0);assert.equal(fishRequests.length,0);
  assert.equal(await page.locator('a[download]').count(),0);assert.equal(await page.getByText('Tải bảng', {exact:false}).count(),0);
  for(const file of ['fish-catalog-57.csv','fish-catalog-57.json'])assert.equal((await page.request.get('http://127.0.0.1:5209/data/'+file)).status(),404);
  assert.equal(await page.locator('#export').count(),1,'Personal save export remains available');
  await page.locator('#fish-search').fill('ech dong');assert.equal(await page.locator('.fish-row').count(),1);await page.locator('[data-species-info="fish_57"]').click();
  assert.equal(await page.locator('#dialog-title').innerText(),'Ếch đồng');assert.equal(await page.locator('.species-table tbody tr').count(),4);
  assert.match(await page.locator('#dialog-content').innerText(),/Mõm–hậu môn/);assert.match(await page.locator('#dialog-content').innerText(),/không phải trung bình khảo sát/);
  assert(await page.locator('#dialog').evaluate(el=>el.getBoundingClientRect().width<=innerWidth));
  await page.screenshot({path:path.join(out,`species-frog-${viewport.width}.png`),fullPage:true});
  await page.locator('#dialog-close').click();assert.equal(await page.locator('#dialog').evaluate(el=>el.open),false);
  await page.locator('#fish-search').fill('Otolithoides');assert.equal(await page.locator('.fish-row').count(),1);await page.locator('.species-info').click();
  assert.match(await page.locator('#dialog-content').innerText(),/Cửa Sông · Ghềnh Biển/);assert.match(await page.locator('#dialog-content').innerText(),/160 cm \(SL\)/);
  await page.locator('#dialog-close').click();await page.locator('#fish-search').fill('fish_55');assert.equal(await page.locator('.fish-row').count(),1);
  assert.equal(await page.locator('.fish-row').getAttribute('data-species'),'fish_07');
  await page.locator('#fish-search').fill('');await page.locator('#fish-map').selectOption('CSONG');assert(await page.locator('[data-species="fish_56"]').count());assert.equal(await page.locator('[data-species="fish_53"]').count(),0);
  await page.locator('#fish-map').selectOption('all');await page.locator('#fish-search').fill('cua dong');await page.locator('.species-info').click();assert.match(await page.locator('#dialog-content').innerText(),/Rộng mai/);
  await page.locator('#dialog-close').click();assert.deepEqual(errors,[]);
  await context.close();
 }
 // Artwork fixtures test upload discovery, PNG support, an alias and failed art.
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/fish-assets.js',r=>r.fulfill({contentType:'text/javascript',body:'export const FISH_IMAGE_FILES={"fish_55.webp":true,"fish_07.png":true,"fish_51.webp":true};'}));
 await page.route('**/assets/fish/fish_55.webp',r=>r.fulfill({status:503,body:'test unavailable'}));
 await page.route('**/assets/fish/fish_07.png',r=>r.fulfill({contentType:'image/png',body:fs.readFileSync(path.join(root,'assets/maps/ao-lang.png'))}));
 await page.route('**/assets/fish/fish_51.webp',r=>r.fulfill({status:404,body:'test missing'}));
 await page.goto('http://127.0.0.1:5209/#journal');await page.locator('#fish-search').fill('fish_55');
 await page.waitForFunction(()=>document.querySelector('[data-fish-image="fish_07"]')?.closest('.fish-visual').classList.contains('has-photo'));
 assert.match(await page.locator('[data-fish-image="fish_07"]').getAttribute('src'),/fish_07.png$/);
 await page.locator('.species-info').click();await page.waitForFunction(()=>document.querySelector('.species-detail-art .fish-visual')?.classList.contains('has-photo'));await page.locator('#dialog-close').click();
 await page.locator('#fish-search').fill('fish_51');await page.waitForFunction(()=>!document.querySelector('[data-fish-image="fish_51"]'));
 assert.equal(await page.locator('[data-species="fish_51"] .fish-art svg').count(),1);assert.deepEqual(errors,[]);await context.close();
 console.log('PASS: 56-species journal, scientific/unaccented search, 4 size tiers, freshwater/marine filters, removed catalog downloads (404), personal save export, mobile/desktop dialogs, missing-art zero requests, WebP→PNG alias fallback and failed-image recovery.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
