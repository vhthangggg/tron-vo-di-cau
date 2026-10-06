const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
let server,browser;
(async()=>{
 const {MAPS,BAITS,RODS}=await import('../src/content.js');
 server=require('node:child_process').spawn(process.execPath,['scripts/serve.mjs','--base','tron-vo-di-cau','--port','5186'],{cwd:root});
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),...(process.env.CHROMIUM_ARGS?{args:JSON.parse(process.env.CHROMIUM_ARGS)}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:980}}),errors=[],requests=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>requests.push(r.url()));
 // A legacy-save fixture supplies review currency. Every purchase/equip/catch uses normal rendered UI.
 const legacy={version:1,coins:2000000,baits:{worm:18,dough:6,corn:6,cloudbait:0},rods:['bamboo'],maps:['AO'],rod:'bamboo',bait:'worm',map:'AO',rig:{depth:1.8,lead:1.08},catches:7,released:1,sold:6,casts:10,collection:{fish_04:{count:7,best:1.7}},lessons:[],pending:null,serial:7,settings:{assist:true,sound:false,deadline:0}};
 await page.addInitScript(value=>{if(!localStorage.getItem('tron-vo-di-cau.v01'))localStorage.setItem('tron-vo-di-cau.v01',JSON.stringify(value));},legacy);
 await page.clock.install({time:new Date('2026-10-06T12:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-06T12:00:01Z'));
 await page.goto('http://127.0.0.1:5186/tron-vo-di-cau/');await page.evaluate(()=>document.fonts.ready);
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));
 assert.equal((await saved()).coins,2000000);assert.equal((await saved()).collection.fish_04.best,1.7);assert.equal((await saved()).accessories.length,5);
 checks.push('Legacy save migrates in browser, preserving money and journal');

 const nav=async target=>{
   if(await page.locator('body').getAttribute('data-screen')==='fishing'){
     if(target==='fishing')return;
     await page.locator('#leave-fishing').click();
     assert(!await page.locator('#dialog').evaluate(el=>el.open),'Active cast needs an explicit exit decision');
   }
   if(target==='fishing'){
     if(await page.locator('body').getAttribute('data-screen')!=='prepare')await page.locator('nav [data-screen="prepare"]').click();
     await page.locator('#start-fishing').click();
   }else if(await page.locator('body').getAttribute('data-screen')!==target)await page.locator('nav [data-screen="'+target+'"]').click();
 };

 await nav('shop');await page.locator('[data-shop-category="accessory"]').click();
 let balance=(await saved()).coins;
 for(const id of ['braid','hook_pro','float_sea','reel6000','net_pro'])await page.locator('[data-buy="accessory"][data-id="'+id+'"]').click();
 assert.equal((await saved()).coins,balance-226000);assert(await page.locator('[data-buy="accessory"][data-id="braid"]').isDisabled());
 await nav('rig');await page.locator('#gear-line').selectOption('braid');await page.locator('#gear-hook').selectOption('hook_pro');await page.locator('#gear-float').selectOption('float_sea');await page.locator('#gear-net').selectOption('net_pro');
 assert(await page.locator('#gear-reel').isDisabled());assert.match(await page.locator('#rig-state').innerText(),/4 vạch/);assert.equal((await saved()).equipment.line,'braid');
 await page.screenshot({path:out+'/accessories-desktop.png',fullPage:true});
 checks.push('Accessory shop deducts exact prices, rejects duplicates; owned gear equips, balances and blocks incompatible reel');
 await nav('shop');await page.locator('[data-shop-category="rod"]').click();for(const id of ['bottom42','spinheavy','iso53'])await page.locator('[data-buy="rod"][data-id="'+id+'"]').click();
 await page.locator('[data-shop-category="bait"]').click();for(const id of ['crank','spoon','popper','shrimp'])await page.locator('[data-buy="bait"][data-id="'+id+'"]').click();
 assert(await page.locator('[data-buy="bait"][data-id="crank"]').isDisabled());
 await page.locator('[data-shop-category="map"]').click();for(const m of MAPS.filter(m=>m.id!=='AO'))await page.locator('[data-buy="map"][data-id="'+m.id+'"]').click();assert.equal((await saved()).maps.length,10);
 await nav('rig');await page.locator('#rod').selectOption('bottom42');await page.locator('#gear-reel').selectOption('reel6000');
 assert(await page.locator('#gear-float').isDisabled());assert(await page.locator('#lead').isDisabled());assert(await page.locator('#depth').isEnabled());assert.equal((await saved()).equipment.reel,'reel6000');
 await page.reload();assert.equal((await saved()).rod,'bottom42');assert.equal((await saved()).equipment.reel,'reel6000');
 checks.push('New rods, reusable lures and all maps purchase; bottom rod activates reel, hides float settings; loadout survives reload');
 await nav('prepare');await page.locator('[data-open-maps]').click();assert.equal(await page.locator('.atlas-card').count(),10);await page.locator('.atlas-art img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));await page.screenshot({path:out+'/map-atlas-desktop.png'});await page.keyboard.press('Escape');
 for(const m of MAPS){
  await nav('prepare');await page.locator('[data-open-maps]').click();await page.locator('[data-atlas-map="'+m.id+'"]').click();assert.equal(await page.locator('#prepare-map-heading').innerText(),m.name);assert.equal(await page.locator('[data-spot]').count(),3);await page.locator('#start-fishing').click();assert.equal(await page.locator('#map-heading').innerText(),m.name);
  assert.equal(await page.locator('.scene-bg').getAttribute('src'),m.background);await page.locator('.scene-bg').evaluate(el=>el.decode());assert(await page.locator('.scene-bg').evaluate(el=>el.naturalWidth>=1000));
  assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));assert.equal(await page.locator('[data-spot]').count(),0);
  await page.screenshot({path:out+'/map-'+m.id+'.png'});
 }
 checks.push('All 10 map choices render their own decoded landscape and three spots without overflow');
 await nav('prepare');await page.locator('[data-open-maps]').click();await page.locator('[data-atlas-map="AO"]').click();await nav('fishing');await page.locator('#cast').click();assert.equal(await page.locator('[data-open-maps]').count(),0);
 assert(await page.locator('#tip-detail').isVisible());assert(await page.locator('#float-detail').isHidden());
 let bite=false;for(let i=0;i<140;i++){await page.clock.runFor(250);if((await page.locator('#status-title').innerText()).includes('Đúng nhịp')){bite=true;break;}}assert(bite,'Bottom rod did not receive a bite');
 assert.match(await page.locator('#float-label').innerText(),/Đầu cần cong/);await page.locator('#strike').click();
 for(let i=0;i<600;i++){
  if(await page.locator('#dialog').evaluate(el=>el.open))break;
  assert(await page.locator('#fight').isVisible(),'Fight failed');const tension=parseInt(await page.locator('#tension-value').innerText()),surge=(await page.locator('#fight-hint').innerText()).startsWith('Cá bứt');const pulling=await page.locator('#pull').getAttribute('aria-pressed')==='true';
  if((tension>78||surge)&&pulling)await page.locator('#ease').click();else if(tension<76&&!surge&&!pulling)await page.locator('#pull').click();await page.clock.runFor(100);
 }
 assert(await page.locator('#dialog').evaluate(el=>el.open));const caught=await saved();assert.equal(caught.catches,8);assert(caught.pending);await page.locator('[data-dialog-action="0"]').click();assert.equal((await saved()).released,2);
 checks.push('Bottom fishing with upgraded loadout: tip signal → strike → controlled fight → net landing → release; map controls remain in preparation');
 await nav('rig');await page.locator('#rod').selectOption('spinheavy');await page.locator('#bait').selectOption('crank');await nav('fishing');await page.locator('#cast').click();await page.locator('#retrieve').click();assert.equal((await saved()).baits.crank,1);assert.match(await page.locator('#retrieve').innerText(),/Dừng thu mồi/);
 await page.locator('#pause').click();await page.locator('[data-dialog-action="1"]').click();await page.locator('[data-dialog-action="1"]').click();await nav('rig');assert.equal((await saved()).bait,'crank');
 checks.push('Purchased crankbait can cast/retrieve with lure rod and is not consumed');
 await nav('journal');assert.equal(await page.locator('.fish-row').count(),50);await page.locator('#fish-map').selectOption('GHE');const expected= (await import('../src/content.js')).FISH.filter(f=>f.maps.includes('GHE')).length;assert.equal(await page.locator('.fish-row').count(),expected);assert.match(await page.locator('.fish-tips').first().innerText(),/Mồi:/);
 checks.push('50 species journal filters by map and gives bait, technique and depth hints');
 for(const [width,height] of [[375,812],[844,390]]){
  await page.setViewportSize({width,height});await nav('prepare');await page.locator('[data-open-maps]').click();assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));await page.locator('[data-atlas-map="GHE"]').click();await nav('fishing');await page.locator('.scene-bg').evaluate(el=>el.decode());
  assert.equal(await page.locator('#map-heading').innerText(),'Ghềnh Biển');await page.screenshot({path:out+'/expanded-map-'+width+'.png'});
  await nav('rig');assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));await page.locator('#gear-line').selectOption('line_basic');assert.equal((await saved()).equipment.line,'line_basic');
 }
 checks.push('Map atlas and accessory controls work at 375×812 and 844×390');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 const result={status:'passed',checks,console_errors:errors,failed_requests:requests,scope:'Expansion UI on local HTTP /tron-vo-di-cau/. Legacy save supplies review currency; all state changes use production UI and real simulation.'};fs.writeFileSync(out+'/expansion-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 await browser.close();server.kill();
})().catch(async e=>{if(browser)await browser.close();if(server)server.kill();console.error(e.stack);process.exit(1);});
