const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
let server,browser;const errors=[],checks=[];
const saveKey='tron-vo-di-cau.v01';
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),saveKey);
async function eagerImages(page){await page.locator('[data-keeper-image]').evaluateAll(imgs=>imgs.forEach(img=>img.loading='eager'));}
async function noOverflow(page){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal page overflow');}
(async()=>{
 server=spawn(process.execPath,['scripts/serve.mjs','--port','5222'],{cwd:root});
 await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
 browser=await chromium.launch({headless:true,args:process.env.CHROMIUM_ARGS?JSON.parse(process.env.CHROMIUM_ARGS):['--no-sandbox','--disable-dev-shm-usage'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 const {newPlayer}=await import('../src/save.js'),{FISH_KEEPERS}=await import('../src/fish-keepers.js');
 const context=await browser.newContext({viewport:{width:1366,height:900}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const fixture=newPlayer();fixture.settings.sound=false;
 await page.addInitScript(p=>{if(!localStorage.getItem('tron-vo-di-cau.v01'))localStorage.setItem('tron-vo-di-cau.v01',JSON.stringify(p));},fixture);
 // Missing assets are simulated even after the owner uploads the real files.
 await page.route('**/assets/items/fish-keepers/*.webp',route=>route.fulfill({status:404,body:'Missing keeper fixture'}));
 await page.goto('http://127.0.0.1:5222/#shop');await page.evaluate(()=>document.fonts.ready);await page.locator('[data-shop-category="keeper"]').click();
 assert.equal(await page.locator('.keeper-card').count(),12);await eagerImages(page);
 await page.waitForFunction(()=>document.querySelectorAll('.keeper-card .keeper-visual.image-missing').length===12);
 const links=await page.locator('.keeper-card .rod-affiliate').evaluateAll(a=>a.map(el=>({href:el.href,rel:el.rel,target:el.target})));
 assert.deepEqual(links.map(a=>a.href),FISH_KEEPERS.map(k=>k.affiliateUrl));for(const a of links){assert.match(a.rel,/sponsored/);assert.match(a.rel,/noopener/);assert.equal(a.target,'_blank');}
 assert.equal(await page.locator('.keeper-real-note').count(),1);
 assert(await page.locator('.keeper-visual.image-missing').first().evaluate(el=>getComputedStyle(el.querySelector('img')).display==='none'&&getComputedStyle(el.querySelector('.keeper-fallback')).display==='flex'));
 await noOverflow(page);await page.screenshot({path:path.join(out,'keepers-desktop-missing.png'),fullPage:true});
 checks.push('All 12 named keepers, unchanged sponsored links and exclusive missing-image fallback');
 await page.locator('[data-buy="keeper"][data-id="fish_keeper_03"]').click();assert.equal((await saved(page)).coins,11650);
 await page.locator('[data-use-keeper="fish_keeper_03"]').click();assert.equal((await saved(page)).container,'fish_keeper_03');
 await page.reload();await page.locator('[data-shop-category="keeper"]').click();assert.equal((await saved(page)).container,'fish_keeper_03');
 await page.goto('http://127.0.0.1:5222/#home');await page.locator('[data-open-keepnet]').first().click();
 assert.deepEqual(await page.locator('#keepnet-container option').evaluateAll(options=>options.map(o=>o.value)),['fish_keeper_01','fish_keeper_03']);
 assert.match(await page.locator('.keeper-detail h3').innerText(),/Xô nhựa/);await page.locator('#dialog-close').click();
 await page.addInitScript(key=>{if(sessionStorage.getItem('keeper-test-wear'))return;const p=JSON.parse(localStorage.getItem(key));p.systems.keeperDurability.fish_keeper_03=22.5;localStorage.setItem(key,JSON.stringify(p));sessionStorage.setItem('keeper-test-wear','1');},saveKey);
 await page.goto('http://127.0.0.1:5222/#shop');await page.reload();await page.locator('[data-shop-category="keeper"]').click();
 await page.locator('[data-repair-keeper="fish_keeper_03"]').click();assert.equal((await saved(page)).coins,11623);assert.equal((await saved(page)).systems.keeperDurability.fish_keeper_03,45);
 checks.push('Buy, equip, persist over reload, owned-only selector and paid home repair');
 // Existing fish photo is only a response fixture; no keeper image files are created.
 await page.unroute('**/assets/items/fish-keepers/*.webp');
 const imageFile=fs.readdirSync(path.join(root,'public/assets/fish')).find(file=>file.endsWith('.webp'));assert(imageFile);
 const image=fs.readFileSync(path.join(root,'public/assets/fish',imageFile));
 await page.route('**/assets/items/fish-keepers/*.webp',route=>route.fulfill({status:200,contentType:'image/webp',body:image}));
 for(const width of [1366,768,390,320]){
  await page.setViewportSize({width,height:width<500?844:900});await page.reload();await page.locator('[data-shop-category="keeper"]').click();await eagerImages(page);
  await page.waitForFunction(()=>[...document.querySelectorAll('[data-keeper-image]')].every(img=>img.complete&&img.naturalWidth>0));
  await page.locator('[data-keeper-image]').evaluateAll(async imgs=>{await Promise.all(imgs.map(img=>img.decode()));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  const issues=await page.locator('.keeper-card').evaluateAll(cards=>cards.flatMap(card=>{
   const frame=card.querySelector('.keeper-showcase').getBoundingClientRect(),img=card.querySelector('img').getBoundingClientRect(),style=getComputedStyle(card.querySelector('img'));
   const centered=Math.abs((img.left+img.right)-(frame.left+frame.right))<1&&Math.abs((img.top+img.bottom)-(frame.top+frame.bottom))<1;
   return centered&&img.width<=frame.width*.81&&img.height<=frame.height*.81&&style.objectFit==='contain'&&getComputedStyle(card.querySelector('.keeper-fallback')).display==='none'?[]:[card.dataset.keeper];
  }));
  assert.deepEqual(issues,[],width+'px images fit, center and do not show fallback');await noOverflow(page);
  assert(await page.locator('.keeper-card').evaluateAll(cards=>cards.every(card=>card.querySelectorAll('.keeper-stats>div').length===5)));
  await page.screenshot({path:path.join(out,'keepers-shop-'+width+'.png'),fullPage:true});
 }
 checks.push('Contained centered image fixture, five stat rows and no overflow at 1366/768/390/320px');
 await page.addInitScript(key=>{if(sessionStorage.getItem('keeper-test-pending'))return;const p=JSON.parse(localStorage.getItem(key));p.container='fish_keeper_01';p.serial=1;p.pending={id:'catch-1',fishId:'fish_28',weight:.25,value:120,mapId:'AO',status:'landed',vitality:100,freshness:100,condition:100,isAlive:true};localStorage.setItem(key,JSON.stringify(p));sessionStorage.setItem('keeper-test-pending','1');},saveKey);
 await page.goto('http://127.0.0.1:5222/#home');await page.reload();await page.locator('#catch-container').waitFor();
 assert(await page.locator('[data-catch-decision="keep"]').isDisabled());assert.match(await page.locator('.catch-note').innerText(),/dài/);
 await page.locator('#catch-container').selectOption('fish_keeper_03');assert.equal(await page.locator('[data-catch-decision="keep"]').isDisabled(),false);
 await page.locator('[data-catch-decision="keep"]').click();assert.equal((await saved(page)).homeFish.length,1);assert.equal((await saved(page)).pending,null);
 checks.push('Too-long pending fish remains safe and can be kept after changing to a suitable owned keeper');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'keepers-report.json'),JSON.stringify({checks,errors},null,2));console.log('PASS\n'+checks.join('\n'));await context.close();
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
