const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const project=path.resolve(__dirname,'..'),out=path.join(project,'test-results');
fs.mkdirSync(out,{recursive:true});
const engine=fs.readFileSync(path.join(project,'src/engine.js'),'utf8');
// Empty population and no snag isolate the quiet-water journey through real UI actions.
const quietEngine=engine.replace('this.fish=[];this.populate();}','this.fish=[];this.populate();this.fish=[];this.environmentRandom=()=>1;}');
assert.notEqual(quietEngine,engine);
let server,browser;
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));
const ready=page=>page.locator('.scene[data-loading=ready]').waitFor({state:'attached'});
const action=(page,label)=>page.locator('#dialog [data-dialog-action]').filter({hasText:label}).click();
const pack=(page,kind,id)=>page.locator(`[data-pack-kind="${kind}"][data-pack-id="${id}"]`);
async function castAndWait(page){await page.locator('#cast').click();await page.clock.runFor(40000);assert.equal(await page.locator('.scene').getAttribute('data-phase'),'waiting');assert(await page.locator('#quiet-fishing-note').isVisible());}
async function fits(page,selector,viewport){const r=await page.locator(selector).boundingBox();assert(r&&r.x>=-1&&r.y>=-1&&r.x+r.width<=viewport.width+1&&r.y+r.height<=viewport.height+1,selector+' fits '+JSON.stringify(r));}

(async()=>{
 server=spawn(process.execPath,['scripts/serve.mjs','--port','5196'],{cwd:project});
 await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);server.once('exit',code=>no(Error('Server exited before ready: '+code)));});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 const {newPlayer}=await import('../src/save.js'),{getMap}=await import('../src/content.js'),checks=[];
 for(const viewport of [{width:1440,height:900},{width:375,height:812},{width:844,height:390}]){
  const label=viewport.width+'x'+viewport.height,p=newPlayer();p.coins=100000;p.rods.push('dai');p.accessories.push('leader12');p.settings.sound=false;
  const context=await browser.newContext({viewport,hasTouch:viewport.width!==1440,isMobile:viewport.width!==1440,reducedMotion:viewport.width===375?'reduce':'no-preference'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.addInitScript(p=>{if(!localStorage.getItem('tron-vo-di-cau.v01'))localStorage.setItem('tron-vo-di-cau.v01',JSON.stringify(p));},p);
  await page.route('**/src/engine.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:quietEngine}));
  await page.clock.install({time:new Date('2026-10-08T08:00:00Z')});await page.clock.pauseAt(new Date('2026-10-08T08:00:01Z'));
  await page.goto('http://127.0.0.1:5196/#prepare');
  assert.match(await page.locator('.bag-capacity').innerText(),/1\/1.*cần/);assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));
  await page.locator('[data-open-packing]').click();await fits(page,'#dialog',viewport);assert(await pack(page,'rods','bamboo').isDisabled());
  await pack(page,'rods','dai').click();assert(!(await pack(page,'rods','dai').isChecked()));assert.deepEqual((await saved(page)).packing.rods,['bamboo']);
  await pack(page,'baits','corn').click();assert(!(await pack(page,'baits','corn').isChecked()));assert.equal((await saved(page)).baits.corn,6);
  await pack(page,'accessories','reel_basic').uncheck();await pack(page,'accessories','leader12').check();assert.equal((await saved(page)).packing.accessories.length,5);
  await page.screenshot({path:path.join(out,'bag-packing-'+label+'.png')});await action(page,'Xong');
  await page.locator('#start-fishing').click();await ready(page);await castAndWait(page);await fits(page,'#quiet-fishing-note',viewport);
  assert(await page.locator('#world-float').isVisible());assert.equal(await page.locator('#dialog').evaluate(el=>el.open),false);let state=await saved(page);assert.equal(state.casts,1);assert.equal(state.baits.worm,17);
  await page.screenshot({path:path.join(out,'bag-quiet-water-'+label+'.png')});await page.locator('#quiet-wait').click();await page.clock.runFor(40000);
  assert.equal(await page.locator('.scene').getAttribute('data-phase'),'waiting');assert(!(await page.locator('#quiet-fishing-note').isVisible()));assert.equal((await saved(page)).baits.worm,17);
  await page.locator('#retrieve').click();await castAndWait(page);await page.locator('#quiet-more').click();await fits(page,'#dialog',viewport);assert.match(await page.locator('#dialog-content').innerText(),/hôm nay/);
  await action(page,'Đổi mồi');assert.equal(await page.locator('[data-field-id=corn]').count(),0);await page.locator('[data-field-id=dough]').click();
  assert.equal(await page.locator('.scene').getAttribute('data-phase'),'idle');state=await saved(page);assert.equal(state.bait,'dough');assert.equal(state.baits.dough,6);assert.equal(state.casts,2);
  await castAndWait(page);await page.locator('#quiet-more').click();await action(page,'Thẻo nhỏ hơn');await page.locator('[data-field-id=leader12]').click();state=await saved(page);assert.equal(state.equipment.line,'leader12');assert.equal(state.baits.dough,5);assert.equal(state.casts,3);
  await castAndWait(page);await page.locator('#quiet-more').click();await action(page,'Đổi vị trí');await page.locator('[data-advice-spot="1"]').click();await ready(page);assert.equal(await page.locator('.scene').getAttribute('data-phase'),'idle');assert.equal(await page.locator('.location-hud p').innerText(),getMap('AO').spots[1].name);
  await castAndWait(page);await page.locator('#quiet-more').click();await action(page,'Về chơi với vợ');assert.equal(await page.locator('body').getAttribute('data-screen'),'home');state=await saved(page);assert.equal(state.casts,5);assert.equal(state.baits.dough,3);
  await page.locator('nav [data-screen=shop]').click();await page.locator('[data-shop-category=bag]').click();assert.equal(await page.locator('[data-category=bag] .product').count(),4);await page.locator('[data-buy=bag][data-id=canvas]').click();assert.equal((await saved(page)).coins,91000);
  await page.locator('nav [data-screen=prepare]').click();await page.locator('[data-open-packing]').click();await page.locator('#packing-bag').selectOption('canvas');await pack(page,'rods','dai').check();await pack(page,'baits','corn').check();
  await page.locator('#packing-bag').selectOption('cloth');assert.equal(await page.locator('#packing-bag').inputValue(),'canvas');state=await saved(page);assert.deepEqual(state.packing.rods,['bamboo','dai']);assert.equal(state.packing.baits.length,3);assert.equal(state.bags.length,2);
  await action(page,'Xong');await page.reload();assert.match(await page.locator('.bag-copy h2').innerText(),/vải dù/);state=await saved(page);assert.equal(state.bag,'canvas');assert.equal(state.coins,91000);assert.equal(state.packing.baits.length,3);assert.equal(state.baits.corn,6);
  await page.screenshot({path:path.join(out,'bag-upgraded-'+label+'.png')});assert.deepEqual(errors,[]);checks.push(label+': capacity rejection, active items, packed-only swaps, quiet cast/wait/bait/leader/spot/home, shop upgrade and reload');await context.close();
 }
 console.log(JSON.stringify({status:'passed',checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
