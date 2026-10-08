const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync(path.join(root,'src/engine.js'),'utf8');
const quietSource=source.replace('this.fish=[];this.populate();}','this.fish=[];this.populate();this.fish=[];this.environmentRandom=()=>1;}');assert.notEqual(source,quietSource);
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));
const ready=page=>page.locator('.scene[data-loading=ready]').waitFor({state:'attached'});
const action=(page,label)=>page.locator('#dialog [data-dialog-action]').filter({hasText:label}).click();
const screen=(page,id)=>page.locator('nav [data-screen="'+id+'"]').click();
const wait=async page=>{await page.locator('#cast').click();await page.clock.runFor(40000);assert.equal(await page.locator('.scene').getAttribute('data-phase'),'waiting');assert(await page.locator('#quiet-fishing-note').isVisible());};
const expand=async(page,index)=>{const d=page.locator('.storage-group').nth(index);if(!await d.evaluate(e=>e.open))await d.locator('summary').click();};
let server,browser;
(async()=>{
 server=spawn(process.execPath,['scripts/serve.mjs','--port','5196'],{cwd:root});await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 const {newPlayer}=await import('../src/save.js'),checks=[];
 for(const viewport of [{width:1440,height:900},{width:375,height:812},{width:844,height:390}]){
  const label=viewport.width+'x'+viewport.height,p=newPlayer();p.coins=200000;p.rods.push('dai');p.accessories.push('leader12');p.settings.sound=false;
  const context=await browser.newContext({viewport,hasTouch:viewport.width<1000,isMobile:viewport.width<1000,reducedMotion:viewport.width===375?'reduce':'no-preference'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.addInitScript(p=>{if(!localStorage.getItem('tron-vo-di-cau.v01'))localStorage.setItem('tron-vo-di-cau.v01',JSON.stringify(p));},p);await page.route('**/src/engine.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:quietSource}));
  await page.clock.install({time:new Date('2026-10-08T08:00:00Z')});await page.clock.pauseAt(new Date('2026-10-08T08:00:01Z'));await page.goto('http://127.0.0.1:5196/#prepare');assert.match(await page.locator('.bag-capacity').innerText(),/1\/1.*cần/s);
  await page.locator('.bag-summary-actions a').click();await expand(page,1);await page.locator('[data-transfer-count="corn"]').fill('4');await page.locator('[data-transfer-bait="corn"][data-transfer-to="carried"]').click();assert.equal((await saved(page)).systems.inventory.stored.baits.corn,6);
  await screen(page,'shop');await page.locator('[data-shop-category="bag"]').click();await page.locator('[data-buy="bag"][data-id="standard"]').click();assert.equal((await saved(page)).coins,186000);
  await screen(page,'rig');await page.locator('#bag-select').selectOption('standard');await page.locator('[data-transfer-kind="rods"][data-transfer-id="dai"]').click();await expand(page,1);await page.locator('[data-transfer-count="corn"]').fill('4');await page.locator('[data-transfer-bait="corn"][data-transfer-to="carried"]').click();await expand(page,2);await page.locator('[data-transfer-kind="accessories"][data-transfer-id="leader12"]').click();
  let state=await saved(page);assert.deepEqual(state.systems.inventory.carried.rods,['bamboo','dai']);assert.equal(state.systems.inventory.carried.baits.corn,4);assert.equal(state.systems.inventory.stored.baits.corn,2);checks.push(label+': bag capacity, paid upgrade and exact home-to-bag quantities');
  await screen(page,'prepare');await page.locator('#start-fishing').click();await ready(page);await wait(page);state=await saved(page);assert.equal(state.baits.worm,18);const mount=state.systems.mountedBait.mountId;
  await page.locator('#quiet-more').click();await action(page,'Tiếp tục chờ');await page.clock.runFor(40000);assert.equal(await page.locator('.scene').getAttribute('data-phase'),'waiting');state=await saved(page);assert.equal(state.systems.mountedBait.mountId,mount);assert.equal(state.baits.worm,18);assert(!(await page.locator('#quiet-fishing-note').isVisible()));
  await page.locator('#retrieve').click();await wait(page);await page.locator('#quiet-more').click();await action(page,'Đổi mồi');await page.locator('[data-field-kind="bait"][data-field-id="dough"]').click();assert.equal((await saved(page)).bait,'dough');assert.equal((await saved(page)).baits.worm,17);await wait(page);
  await page.locator('#quiet-more').click();await action(page,'Thẻo nhỏ hơn');await page.locator('[data-field-kind="leaderMm"][data-field-id="0.12"]').click();assert.equal((await saved(page)).rig.leaderMm,.12);assert.equal((await saved(page)).baits.dough,6);await wait(page);
  await page.locator('#quiet-more').click();await action(page,'Đổi vị trí');await page.locator('[data-advice-spot="1"]').click();await ready(page);assert.match(await page.locator('#map-description').innerText(),/Mũi Đất/);await wait(page);await page.locator('#quiet-more').click();await action(page,'Về chơi với vợ');assert.equal(await page.locator('body').getAttribute('data-screen'),'home');assert.equal((await saved(page)).systems.trip,null);
  await page.reload();state=await saved(page);assert.equal(state.systems.inventory.bagId,'standard');assert.equal(state.coins,186000);assert.equal(state.rig.leaderMm,.12);assert.equal(state.baits.dough,6);assert((await page.evaluate(()=>document.documentElement.scrollWidth))<=viewport.width+1);assert.deepEqual(errors,[]);await page.screenshot({path:path.join(out,'bag-upgraded-'+label+'.png')});checks.push(label+': quiet wait, mounted bait, field bait/leader/spot switches, home and reload');await context.close();
 }
 fs.writeFileSync(path.join(out,'bag-verification.json'),JSON.stringify({status:'passed',checks},null,2));console.log(JSON.stringify({status:'passed',checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
