const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {driveHands,waitForBite}=require('./browser-player.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');
fs.mkdirSync(out,{recursive:true});
const origin='http://127.0.0.1:5197',saveKey='tron-vo-di-cau.v01',checks=[],errors=[],requests=[];
let browser,server,lastPage;
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),saveKey);
const screen=page=>page.locator('body').getAttribute('data-screen');

async function noOverflow(page,label){
  const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert(size.scroll<=size.width+1,label+' horizontal overflow: '+JSON.stringify(size));
}
async function makeScenario(viewport,fixture,label){
  const context=await browser.newContext({viewport,hasTouch:viewport.width<500,isMobile:viewport.width<500});
  const page=await context.newPage();lastPage=page;
  page.setDefaultTimeout(10000);
  page.on('pageerror',error=>errors.push(label+': '+error.message));
  page.on('requestfailed',request=>requests.push(label+': '+request.url()+': '+request.failure()?.errorText));
  await page.addInitScript(({key,value})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(value));},{key:saveKey,value:fixture});
  await page.clock.install({time:new Date('2026-10-07T01:00:00Z')});
  await page.clock.pauseAt(new Date('2026-10-07T01:00:01Z'));
  await page.goto(origin+'/#home');
  return {page,context};
}
async function navigate(page,target){
  if(await screen(page)==='fishing'&&target!=='fishing'){
    if(target==='home')await page.locator('#leave-fishing').click();
    else {await page.locator('#pause').click();await page.locator('[data-dialog-action="1"]').click();}
  }
  if(target==='fishing'){
    if(await screen(page)!=='prepare')await page.locator('nav [data-screen="prepare"]').click();
    await page.locator('#start-fishing').click();
    await page.waitForFunction(()=>document.querySelector('.scene')?.dataset.loading==='ready');
  }else if(await screen(page)!==target)await page.locator('nav [data-screen="'+target+'"]').click();
  assert.equal(await screen(page),target);
  await noOverflow(page,target);
}
async function openStorage(page,index){
  const group=page.locator('.storage-group').nth(index);
  if(!await group.evaluate(el=>el.open))await group.locator('summary').click();
}
async function clickTwiceSameAction(locator){
  // A stale DOM handler models two queued taps with the same reserved action ID.
  const button=await locator.elementHandle();
  assert(button,'Action button exists');
  await button.evaluate(el=>{el.click();el.click();});
  await button.dispose();
}
async function rejectStoredSelection(page,selector,value,expected){
  const option=page.locator(selector+' option[value="'+value+'"]');
  if(await option.count()&&!await option.isDisabled())await page.locator(selector).selectOption(value);
  assert.equal(await page.locator(selector).inputValue(),expected,selector+' must reflect equipped gear after rejection');
}
async function comparisonRow(page,id,label,previous,next){
  const rows=await page.locator('[data-compare="'+id+'"] dl>div').evaluateAll(elements=>elements.map(row=>({label:row.querySelector('dt').textContent,previous:row.querySelector('dd>span')?.textContent,next:row.querySelector('dd>b').textContent})));
  const row=rows.find(row=>row.label===label);assert(row,id+' comparison includes '+label);
  assert.equal(row.previous,previous);assert.equal(row.next,next);
}

(async()=>{
  server=spawn(process.execPath,['scripts/serve.mjs','--port','5197'],{cwd:root});
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>{if(code)reject(Error('Server exit '+code));});});
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),...(process.env.CHROMIUM_ARGS?{args:JSON.parse(process.env.CHROMIUM_ARGS)}:{})});
  const {newPlayer}=await import('../src/save.js');
  const {RODS,ACCESSORIES,BAITS,MAPS}=await import('../src/content.js');
  const {floatState}=await import('../src/rig-physics.js');
  const {STARTER_STEPS}=await import('../src/tutorial.js');

  for(const [label,viewport] of [['desktop',{width:1440,height:980}],['mobile',{width:375,height:812}]]){
    // A real v1 save supplies review currency and historical progress; all actions below use UI.
    const legacy={version:1,coins:200000,baits:{worm:18,dough:6,corn:6},rods:['bamboo'],maps:['AO'],rod:'bamboo',bait:'worm',map:'AO',rig:{depth:1.8,lead:1.08},catches:7,released:1,sold:6,casts:10,collection:{fish_04:{count:7,best:1.7}},lessons:['signal'],pending:null,serial:7,settings:{assist:true,sound:false,deadline:0}};
    const {page,context}=await makeScenario(viewport,legacy,label);
    let state=await saved(page);
    assert.equal(state.schemaVersion,2);assert.equal(state.coins,legacy.coins);
    assert.deepEqual(state.collection,legacy.collection);assert.deepEqual(state.lessons,legacy.lessons);
    assert.equal(state.baits.corn,6);assert.equal(state.systems.inventory.stored.baits.corn,6);
    assert.deepEqual(state.systems.inventory.carried.rods,['bamboo']);
    checks.push(label+': v1 migration preserves money, all bait, collection and lesson progress');

    await navigate(page,'shop');
    await page.locator('[data-shop-category="accessory"]').click();
    await comparisonRow(page,'line18','Đường kính','0,22 mm','0,23 mm');
    await comparisonRow(page,'line18','Tải dây','2,2 kg','2,8 kg');
    await comparisonRow(page,'float_canal','Sức nổi','1,4 g','1,6 g');
    await comparisonRow(page,'hook_barb','Nhịp giật','2,8 giây','3,0 giây');
    await comparisonRow(page,'reel2000','Dẫn cá nhanh hơn','0 %','8 %');
    await comparisonRow(page,'net_fold','Vớt khi sức cá ≤','0 %','6 %');
    await noOverflow(page,label+' numeric shop comparisons');
    checks.push(label+': shop shows precise current-to-new line diameter/strength, float buoyancy, hook timing, reel speed and net threshold');
    const purchases=[['rod','dai'],['rod','spinning'],['accessory','line18'],['accessory','fluoro'],['bait','worm']];
    let expected=legacy.coins;
    for(const [kind,id] of purchases){
      await page.locator('[data-shop-category="'+kind+'"]').click();
      const definition=(kind==='rod'?RODS:kind==='accessory'?ACCESSORIES:BAITS).find(item=>item.id===id);
      expected-=definition.price;
      await clickTwiceSameAction(page.locator('[data-buy="'+kind+'"][data-id="'+id+'"]'));
      assert.equal((await saved(page)).coins,expected,'A queued purchase spends its price once');
    }
    state=await saved(page);
    assert.deepEqual(state.systems.inventory.carried.rods,['bamboo']);
    assert(state.systems.inventory.stored.rods.includes('dai'));
    assert(state.systems.inventory.stored.accessories.includes('fluoro'));
    assert.equal(state.baits.worm,30);assert.equal(state.systems.inventory.carried.baits.worm,18);
    assert.equal(state.systems.inventory.stored.baits.worm,12);
    await navigate(page,'rig');
    await openStorage(page,1);
    await page.locator('[data-transfer-count="worm"]').fill('6');
    await page.locator('[data-transfer-bait="worm"][data-transfer-to="carried"]').click();
    state=await saved(page);assert.equal(state.systems.inventory.carried.baits.worm,24);assert.equal(state.baits.worm,30);
    await openStorage(page,1);
    const beforeCapacity=structuredClone(state.systems.inventory);
    await page.locator('[data-transfer-count="corn"]').fill('6');
    await page.locator('[data-transfer-bait="corn"][data-transfer-to="carried"]').click();
    assert.deepEqual((await saved(page)).systems.inventory,beforeCapacity,'Cloth bag rejects a third bait type without losing stock');
    await page.locator('[data-transfer-id="dai"][data-transfer-to="carried"]').click();
    state=await saved(page);assert.deepEqual(state.systems.inventory.carried.rods,['dai']);assert(state.systems.inventory.stored.rods.includes('bamboo'));
    await page.locator('[data-transfer-id="bamboo"][data-transfer-to="carried"]').click();
    state=await saved(page);assert.equal(state.rod,'bamboo');assert.equal(state.rods.length,3);

    await navigate(page,'shop');await page.locator('[data-shop-category="bag"]').click();
    await page.locator('[data-buy="bag"][data-id="standard"]').click();expected-=14000;
    assert.equal((await saved(page)).coins,expected);
    await navigate(page,'rig');await page.locator('#bag-select').selectOption('standard');
    await page.locator('[data-transfer-id="dai"][data-transfer-to="carried"]').click();
    await page.locator('#bag-select').selectOption('cloth');
    assert.equal(await page.locator('#bag-select').inputValue(),'standard');
    assert.equal((await saved(page)).systems.inventory.carried.rods.length,2,'A smaller bag cannot discard a carried rod');
    await openStorage(page,1);await page.locator('[data-transfer-count="corn"]').fill('6');
    await page.locator('[data-transfer-bait="corn"][data-transfer-to="carried"]').click();
    await openStorage(page,2);await page.locator('[data-transfer-id="line18"][data-transfer-to="carried"]').click();
    await page.locator('#gear-line').selectOption('line18');
    state=await saved(page);assert.equal(state.equipment.line,'line18');assert.equal(state.systems.inventory.carried.baits.corn,6);
    checks.push(label+': purchases are stored and charged once; UI swaps/transfers conserve ownership, enforce cloth limits and reject an undersized bag');

    const balance=state.coins,stock={...state.baits};
    await page.locator('#dig').click();await page.locator('[data-gather="home"]').click();await page.locator('[data-gather="garden"]').click();
    state=await saved(page);assert.equal(state.coins,balance);
    assert.equal(state.baits.worm,stock.worm+6);assert.equal(state.baits.dough,stock.dough+4);assert.equal(state.baits.corn,stock.corn+4);
    await page.locator('#lead').fill('3.5');
    const heavyText=await page.locator('.calibration-readout strong').innerText();
    assert.equal((await saved(page)).rig.lead,3.5);
    await page.locator('#balance').click();
    state=await saved(page);const model=floatState(state,{bottomDepth:MAPS[0].spots[0].depth,current:MAPS[0].current});
    assert.equal(model.balanced,true);
    assert.match(await page.locator('.calibration-readout strong').innerText(),new RegExp('^'+model.marks.toFixed(1).replace('.','\\.')+' vạch'));
    assert.notEqual(await page.locator('.calibration-readout strong').innerText(),heavyText,'Actual lead changes alter the simulated float');
    await page.locator('#preset-name').fill('Cần tre sát bờ');await page.locator('#save-rig').click();
    const preset=(await saved(page)).systems.rigPresets[0];assert(preset);
    await page.locator('#leader-mm').selectOption('0.12');await page.locator('#hook-size').selectOption('2');
    await page.locator('[data-load-rig="'+preset.id+'"]').click();
    assert.deepEqual((await saved(page)).rig,preset.rig);
    await noOverflow(page,label+' calibration');
    checks.push(label+': all three free bait sources work without spending; real float balance responds to lead and saved rigs restore technical setup');

    await navigate(page,'learn');assert.equal(await page.locator('.tutorial-step').count(),10);
    const preReward=(await saved(page)).coins;
    await clickTwiceSameAction(page.locator('[data-tutorial-claim="bait"]'));
    assert.equal((await saved(page)).coins,preReward+STARTER_STEPS.find(step=>step.id==='bait').reward);
    await page.reload();assert(await page.locator('[data-tutorial-claim="bait"]').isDisabled());
    assert.equal((await saved(page)).coins,preReward+160);
    await navigate(page,'fishing');
    assert(await page.locator('video').evaluate(video=>video.readyState>=2&&video.videoWidth===1280&&video.videoHeight===720&&!video.error),'Actual Ao Lang MP4 must decode');
    const beforeCast=await saved(page);
    await page.locator('#cast').click();await page.clock.runFor(900);
    state=await saved(page);const mountId=state.systems.mountedBait?.mountId;
    assert(mountId);assert.equal(state.baits.worm,beforeCast.baits.worm);
    await page.locator('#retrieve').click();state=await saved(page);
    assert.equal(state.baits.worm,beforeCast.baits.worm);assert.equal(state.systems.mountedBait.mountId,mountId);
    await page.locator('#cast').click();await waitForBite(page);
    assert.equal((await saved(page)).systems.mountedBait.mountId,mountId);
    await page.locator('#strike').click();assert.equal(await page.locator('.scene').getAttribute('data-phase'),'fight');
    const afterBite=await saved(page);assert.equal(afterBite.baits.worm,beforeCast.baits.worm-1);assert.equal(afterBite.systems.mountedBait,null);
    await driveHands(page);
    state=await saved(page);assert.equal(state.catches,legacy.catches+1);assert(state.pending);
    assert.equal(state.baits.worm,afterBite.baits.worm,'Landing cannot spend the bitten portion again');
    assert.equal(await page.locator('[data-catch-decision]').count(),2);
    const naturalCatch={...state.pending};await page.locator('[data-catch-decision="keep"]').click();
    state=await saved(page);assert.equal(state.pending,null);assert.equal(state.keptFish.length,1);assert.equal(state.homeFish.length,0);
    assert.equal(state.coins,afterBite.coins);
    await noOverflow(page,label+' fishing');
    checks.push(label+': real MP4, reusable mounted portion through retrieval, natural successful strike spends exactly once, and production two-hand fight lands a keepable fish');

    await navigate(page,'rig');state=await saved(page);const tripId=state.systems.trip.id;
    assert(await page.locator('#bag-select').isDisabled());
    assert(await page.locator('[data-transfer-id="spinning"][data-transfer-to="carried"]').isDisabled());
    await rejectStoredSelection(page,'#rod','spinning','bamboo');
    await rejectStoredSelection(page,'#gear-line','fluoro','line18');
    state=await saved(page);assert.equal(state.rod,'bamboo');assert.equal(state.equipment.line,'line18');
    assert.equal(state.keptFish[0].id,naturalCatch.id);assert.equal(state.systems.trip.id,tripId);
    await page.reload();state=await saved(page);assert.equal(state.keptFish[0].id,naturalCatch.id);assert.equal(state.systems.trip.id,tripId);
    await navigate(page,'shop');
    assert(await page.locator('[data-buy="bait"][data-id="worm"]').isDisabled());
    assert.match(await page.locator('[data-buy="bait"][data-id="worm"]').innerText(),/Về nhà để mua/);
    assert(await page.locator('[data-buy]').evaluateAll(buttons=>buttons.every(button=>button.disabled)),'The shop cannot buy equipment while at the bank');
    await comparisonRow(page,'fluoro','Đường kính','0,23 mm','0,26 mm');
    await comparisonRow(page,'fluoro','Tải dây','2,8 kg','3,6 kg');
    await navigate(page,'learn');const prepReward=(await saved(page)).coins;
    await page.locator('[data-tutorial-claim="prepare"]').click();assert.equal((await saved(page)).coins,prepReward+120);
    await navigate(page,'fishing');await navigate(page,'home');state=await saved(page);
    assert.equal(state.systems.trip,null);assert.equal(state.keptFish.length,0);assert.equal(state.homeFish[0].id,naturalCatch.id);
    await page.locator('[data-open-keepnet]').click();const beforeSale=(await saved(page)).coins;
    await clickTwiceSameAction(page.locator('[data-kept="'+naturalCatch.id+'"][data-fate="sell"]'));
    state=await saved(page);assert.equal(state.coins,beforeSale+naturalCatch.value);assert.equal(state.sold,legacy.sold+1);assert.equal(state.homeFish.length,0);
    await page.getByRole('button',{name:'Xong',exact:true}).click();
    await navigate(page,'learn');await page.locator('[data-tutorial-claim="home"]').click();
    const finalCoins=(await saved(page)).coins;await page.reload();assert.equal((await saved(page)).coins,finalCoins);
    assert(await page.locator('[data-tutorial-claim="home"]').isDisabled());
    await page.screenshot({path:path.join(out,'systems-'+label+'-tutorial.png'),fullPage:true});
    checks.push(label+': bank gear is carried-only, rejected selects reset correctly, trip/fish survive reload, return moves fish once and home sale/rewards cannot replay');
    await context.close();

    // Pending/kept fixtures represent a resumed trip. They exercise UI outcomes and reload, not a fake catch hook.
    const resumed=newPlayer();resumed.settings.sound=false;
    resumed.systems.trip={id:'trip-resume',active:true,mapId:'AO',spotId:'ben-cau-tre'};
    const makeFish=(serial,value)=>({id:'catch-'+serial,fishId:'fish_01',weight:.5,value,mapId:'AO'});
    resumed.keptFish=[makeFish(1,110),makeFish(2,220),makeFish(3,330),makeFish(4,440)];
    resumed.pending=makeFish(5,550);resumed.catches=5;resumed.serial=5;resumed.collection.fish_01={count:5,best:.5};
    const result=await makeScenario(viewport,resumed,label+' outcomes'),p=result.page;
    await p.goto(origin+'/#fishing');await p.waitForFunction(()=>document.querySelector('.scene')?.dataset.loading==='ready');
    if(!await p.locator('#dialog').evaluate(dialog=>dialog.open))await p.locator('#cast').click();
    assert.equal(await p.locator('[data-catch-decision]').count(),2);
    await p.locator('#catch-container').selectOption('bucket');
    await p.locator('[data-catch-decision="release"]').click();
    let outcome=await saved(p);assert.equal(outcome.released,1);assert.equal(outcome.coins,12000);assert.equal(outcome.keptFish.length,4);
    await p.locator('#help').click();await p.locator('#info-keepnet').click();
    assert.equal(await p.locator('[data-fate="sell"],[data-fate="gift"],[data-fate="cook"]').count(),0);
    await p.locator('[data-kept="catch-1"][data-fate="release"]').click();
    outcome=await saved(p);assert.equal(outcome.released,2);assert.equal(outcome.keptFish.length,3);assert.equal(outcome.coins,12000);
    await p.getByRole('button',{name:'Mang rọ về nhà',exact:true}).click();
    outcome=await saved(p);assert.equal(await screen(p),'home');assert.equal(outcome.homeFish.length,3);assert.equal(outcome.keptFish.length,0);
    for(const [id,action,counter] of [['catch-2','sell','sold'],['catch-3','gift','gifted'],['catch-4','cook','cooked']]){
      const previous=await saved(p);
      await clickTwiceSameAction(p.locator('[data-kept="'+id+'"][data-fate="'+action+'"]'));
      outcome=await saved(p);assert.equal(outcome[counter],previous[counter]+1);
      assert.equal(outcome.coins,previous.coins+(action==='sell'?220:0));
      assert(!outcome.homeFish.some(fish=>fish.id===id));
      assert.equal(await p.locator('[data-kept="'+id+'"]').count(),0,'Disposed fish cannot be selected for a second outcome');
    }
    await p.getByRole('button',{name:'Xong',exact:true}).click();await p.reload();
    outcome=await saved(p);assert.equal(outcome.homeFish.length,0);assert.equal(outcome.sold,1);assert.equal(outcome.gifted,1);assert.equal(outcome.cooked,1);assert.equal(outcome.released,2);assert.equal(outcome.coins,12220);
    await noOverflow(p,label+' home outcomes');await result.context.close();
    checks.push(label+': resumed trip keeps all fish, offers only keep/release at the bank, and home sale/gift/cooking are mutually exclusive and exactly once across reload');
  }
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  const result={status:'passed',checks,console_errors:errors,failed_requests:requests,scope:'Desktop and 375px mobile emulation, real Ao Lang MP4 and natural fish simulation. Initial v1 wallet/progress and resumed-trip catches are save fixtures; purchases, transfers, calibration, rewards and fish outcomes use the rendered production UI. Physical Android remains a separate device check.'};
  fs.writeFileSync(path.join(out,'systems-verification.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
})().catch(async error=>{if(lastPage&&!lastPage.isClosed())await lastPage.screenshot({path:path.join(out,'systems-failed.png'),fullPage:true}).catch(()=>{});console.error(error.stack);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
