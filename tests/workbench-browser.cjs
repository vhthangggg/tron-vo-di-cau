const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const {view,part,item}=require('./workbench-actions.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');
const origin=process.env.WORKBENCH_ORIGIN||'http://127.0.0.1:5219',key='tron-vo-di-cau.v01';
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
const owned=p=>({rods:p.rods,accessories:p.accessories,baits:p.baits,coins:p.coins});
let server,browser;
async function dragItem(page,key,kind){
 const source=page.locator('.inventory-grid [data-inventory-item="'+key+'"]'),target=page.locator('[data-inventory-drop="'+kind+'"]');
 await source.scrollIntoViewIfNeeded();const start=await source.boundingBox();
 await page.mouse.move(start.x+start.width/2,start.y+start.height/2);await page.mouse.down();
 // Start the native drag before scrolling to a destination that may be offscreen.
 await page.mouse.move(start.x+start.width/2+12,start.y+start.height/2+6,{steps:5});
 await target.scrollIntoViewIfNeeded();const end=await target.boundingBox();
 const y=Math.min(page.viewportSize().height-40,end.y+end.height-20,Math.max(180,end.y+20));
 await page.mouse.move(end.x+20,y,{steps:10});await page.mouse.move(end.x+21,y+1);await page.mouse.up();
}

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 if(!process.env.WORKBENCH_ORIGIN){server=spawn(process.execPath,['scripts/serve.mjs','--port','5219'],{cwd:root});await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});}
 const options={headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})};
 if(process.env.WORKBENCH_ORIGIN){const url=new URL(process.env.HTTPS_PROXY||process.env.HTTP_PROXY);options.proxy={server:url.origin,...(url.username?{username:decodeURIComponent(url.username),password:decodeURIComponent(url.password)}:{})};}
 browser=await chromium.launch(options);
 const {newPlayer}=await import('../src/save.js'),{floatState}=await import('../src/rig-physics.js'),{MAPS}=await import('../src/content.js');
 const viewports=process.env.WORKBENCH_ORIGIN?[[1440,900],[390,844]]:[[1440,900],[1024,768],[768,1024],[390,844],[320,640],[844,390]];
 for(const [width,height] of viewports){
  const p=newPlayer();p.rods.push('rod_01','rod_02','rod_28');p.accessories.push('line18','float_slender','hook_pro');p.baits.lure=1;p.baits.pellet=12;p.systems.bags.push('standard');p.settings.sound=false;
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000,ignoreHTTPSErrors:true,reducedMotion:width<500?'reduce':'no-preference'}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.addInitScript(({key,p})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(p));},{key,p});
  await page.goto(origin+'/#rig');await page.evaluate(()=>document.fonts.ready);
  if(process.env.WORKBENCH_COMMIT)assert.equal((await(await page.request.get(origin+'/release.json')).json()).commit,process.env.WORKBENCH_COMMIT);
  const baseline=owned(await saved(page));
  assert.equal(await page.locator('.rig-diagram').first().getAttribute('data-technique'),'don');
  assert.equal(await page.locator('#rig-node-reel').count(),0);
  const targets=await page.locator('.rig-node').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
  for(const [i,r] of targets.entries()){assert(r.width>=44&&r.height>=44);for(const [j,s] of targets.entries())if(j>i)assert(r.x+r.width<=s.x||s.x+s.width<=r.x||r.y+r.height<=s.y||s.y+s.height<=r.y,'Overlapping schematic targets at '+width);}
  await page.locator('#rig-node-line').focus();await page.keyboard.press('Enter');assert(await page.locator('#gear-line').isVisible());
  await page.locator('#gear-line').selectOption('line18');assert.equal((await saved(page)).equipment.line,'line18');
  await page.locator('#rig-tune').click();assert(await page.locator('#depth').evaluate(e=>e===document.activeElement));
  await page.locator('#depth').fill('0.6');assert.equal(Number(await page.locator('#rig-diagram-live .rig-diagram').getAttribute('data-hook-depth')),.6);
  await page.locator('#lead').fill('3.5');await page.locator('#balance').click();
  let state=await saved(page),model=floatState(state,{bottomDepth:MAPS[0].spots[0].depth,current:MAPS[0].current});assert(Math.abs(model.marks-4)<=.2);
  await part(page,'leader');await page.locator('#leader-length').fill('0.4');await page.locator('#leader-length').dispatchEvent('change');await page.locator('#leader-mm').selectOption('0.12');
  await part(page,'hook');await page.locator('#hook-size').selectOption('2');
  await view(page,'presets');await page.locator('#preset-name').fill('Bộ câu thử');await page.locator('#save-rig').click();
  const preset=(await saved(page)).systems.rigPresets[0];assert(preset);
  await part(page,'leader');await page.locator('#leader-mm').selectOption('0.25');await view(page,'presets');await page.locator('[data-load-rig="'+preset.id+'"]').click();assert.deepEqual((await saved(page)).rig,preset.rig);
  await view(page,'setup');await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:path.join(out,'workbench-rig-'+width+'.png'),fullPage:true});
  await view(page,'packing');await page.locator('#inventory-search').fill('nylon');assert.equal(await page.locator('.inventory-grid [data-inventory-item]:visible').count(),1);
  await page.locator('[data-inventory-filter="bait"]').click();assert(await page.locator('#inventory-no-results').isVisible());
  await page.locator('#inventory-search').fill('');await page.locator('[data-inventory-filter="all"]').click();
  await item(page,'bait:corn');await page.locator('#inventory-quantity').fill('4');
  const before=(await saved(page)).systems.inventory;
  await page.locator('[data-transfer-bait="corn"][data-transfer-to="carried"]').click();assert.deepEqual((await saved(page)).systems.inventory,before);
  await page.locator('#bag-select').selectOption('standard');await item(page,'bait:corn');await page.locator('#inventory-quantity').fill('4');await page.locator('[data-transfer-bait="corn"][data-transfer-to="carried"]').click();
  state=await saved(page);assert.equal(state.systems.inventory.carried.baits.corn,4);assert.equal(state.systems.inventory.stored.baits.corn,2);
  if(width>=1024){
   const beforeDrop=(await saved(page)).systems.inventory;
   await dragItem(page,'accessory:hook_pro','bait');assert.deepEqual((await saved(page)).systems.inventory,beforeDrop);
   await dragItem(page,'accessory:hook_pro','accessory');assert((await saved(page)).systems.inventory.carried.accessories.includes('hook_pro'));
   await dragItem(page,'bait:corn','bait');assert.equal((await saved(page)).systems.inventory.carried.baits.corn,6);
   await page.locator('#inventory-location').selectOption('carried');assert.equal(await page.locator('.inventory-grid [data-inventory-item="bait:corn"]').getAttribute('data-item-from'),'carried');
   await dragItem(page,'bait:corn','all');state=await saved(page);assert.equal(state.systems.inventory.carried.baits.corn,0);assert.equal(state.systems.inventory.stored.baits.corn,6);
   await page.locator('#inventory-location').selectOption('stored');assert.equal(await page.locator('.inventory-grid [data-inventory-item="bait:corn"]').getAttribute('data-item-from'),'stored');
   await dragItem(page,'bait:corn','bait');assert.equal((await saved(page)).systems.inventory.carried.baits.corn,6);await page.locator('#inventory-location').selectOption('all');
  }
  await item(page,'rod:rod_01');await page.locator('[data-transfer-id="rod_01"][data-transfer-to="carried"]').click();
  const beforeSmall=(await saved(page)).systems.inventory;await page.locator('#bag-select').selectOption('cloth');assert.deepEqual((await saved(page)).systems.inventory,beforeSmall);assert.equal(await page.locator('#bag-select').inputValue(),'standard');
  await item(page,'rod:rod_28');await page.locator('[data-transfer-id="rod_28"][data-transfer-to="carried"]').click();state=await saved(page);assert.equal(state.rod,'rod_28');assert.equal(state.systems.inventory.carried.rods.length,2);assert(state.systems.inventory.stored.rods.includes('bamboo'));
  await view(page,'setup');assert.equal(await page.locator('#rig-node-float').count(),0);assert.equal(await page.locator('#rig-node-reel').count(),1);assert(await page.locator('#lead').isDisabled());
  await part(page,'rod');await page.locator('#rod').selectOption('rod_02');assert.equal(await page.locator('#rig-node-float').count(),0);assert.equal(await page.locator('#rig-node-sinker').count(),0);assert(await page.locator('#depth').isDisabled());
  await page.locator('#rod').selectOption('bamboo');assert.deepEqual(owned(await saved(page)),baseline);
  await item(page,'bait:worm');await page.locator('#inventory-quantity').fill('1');
  const startWorm=(await saved(page)).systems.inventory.carried.baits.worm;
  await page.locator('[data-transfer-bait="worm"][data-transfer-to="stored"]').evaluate(b=>{const click=b.onclick;click();click();});assert.equal((await saved(page)).systems.inventory.carried.baits.worm,startWorm-1);
  await item(page,'rod:bamboo');assert(await page.locator('[data-transfer-id="bamboo"][data-transfer-to="stored"]').isDisabled());
  await page.locator('#inventory-search').fill('');await page.locator('[data-inventory-filter="all"]').click();
  for(const img of await page.locator('.inventory-grid img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());assert(await img.evaluate(e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return r.width<=p.width+1&&r.height<=p.height+1&&r.top>=p.top-1&&r.bottom<=p.bottom+1;}),'Photo exceeds item frame');}
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'workbench-bag-'+width+'.png'),fullPage:true});
  state=await saved(page);await page.reload();assert.deepEqual(owned(await saved(page)),owned(state));assert.deepEqual((await saved(page)).systems.inventory,state.systems.inventory);
  await page.locator('.page-head a[href="#prepare"]').click();await page.locator('.prepare-rig-preview summary').click();assert(await page.locator('.prepare-rig-preview .rig-diagram').isVisible());await page.locator('#start-fishing').click();await page.locator('.scene[data-loading="ready"]').waitFor();
  await page.evaluate(()=>location.hash='rig');await page.locator('body[data-screen="rig"]').waitFor();await item(page,'rod:rod_02');assert(await page.locator('[data-transfer-id="rod_02"][data-transfer-to="carried"]').isDisabled());assert(await page.locator('#bag-select').isDisabled());
  const trip=(await saved(page)).systems.trip;await part(page,'rod');await page.locator('#rod').selectOption('rod_02');assert.equal((await saved(page)).rod,'bamboo');assert.equal((await saved(page)).systems.trip.id,trip.id);assert.deepEqual(owned(await saved(page)),baseline);
  assert.deepEqual(errors,[]);console.log('PASS '+width+'×'+height+': schematic/keyboard, physics, presets, search, exact transfers, drag/drop, capacity, swaps, photos, replay, reload and trip guards');await ctx.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
