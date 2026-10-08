const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(__dirname,'../test-results'),checks=[];fs.mkdirSync(out,{recursive:true});
let server,browser;
const launch=()=>chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),...(process.env.CHROMIUM_ARGS?{args:JSON.parse(process.env.CHROMIUM_ARGS)}:{})});
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));
async function fits(page,selector,width,height){const r=await page.locator(selector).boundingBox();assert(r&&r.x>=-1&&r.y>=-1&&r.x+r.width<=width+1&&r.y+r.height<=height+1,selector+' fits '+JSON.stringify(r));}
async function makePage(viewport,fixture){
  browser=await launch();const context=await browser.newContext({viewport,hasTouch:true,isMobile:true}),page=await context.newPage();
  page.errors=[];page.on('pageerror',e=>page.errors.push(e.message));
  if(fixture)await page.addInitScript(p=>{if(!localStorage.getItem('tron-vo-di-cau.v01'))localStorage.setItem('tron-vo-di-cau.v01',JSON.stringify(p));},fixture);
  await page.addInitScript(()=>{
    const C=window.AudioContext;window.__soundProbe={contexts:[],started:0,ended:0};
    if(C)window.AudioContext=class extends C{
      constructor(...args){super(...args);this.probeGains=[];window.__soundProbe.contexts.push(this);}
      createGain(){const g=super.createGain();this.probeGains.push(g);return g;}
      trace(s){const start=s.start.bind(s);s.start=(...a)=>{window.__soundProbe.started++;return start(...a);};s.addEventListener('ended',()=>window.__soundProbe.ended++);return s;}
      createOscillator(){return this.trace(super.createOscillator());}
      createBufferSource(){return this.trace(super.createBufferSource());}
    };
  });
  await page.clock.install({time:new Date('2026-10-07T12:00:00Z')});await page.clock.pauseAt(new Date('2026-10-07T12:00:01Z'));
  return page;
}
(async()=>{
  server=spawn(process.execPath,['scripts/serve.mjs','--port','5193'],{cwd:path.resolve(__dirname,'..')});await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
  const {newPlayer}=await import('../src/save.js');
  // Hold the real video request: no timer, keyboard cast or controls may run yet.
  let page=await makePage({width:844,height:390}),held,requests=0;
  await page.route('**/ao-lang-ben-cau-tre.mp4',route=>{requests++;return new Promise(resolve=>{held=async()=>{await route.continue();resolve();};});});
  await page.goto('http://127.0.0.1:5193/');assert.equal(await page.evaluate(()=>window.__soundProbe.contexts.length),0);
  await page.locator('nav [data-screen=prepare]').click();assert.equal(await page.locator('.prepare-destination img').count(),1);assert.equal(await page.locator('.map-hotspot').count(),2);
  await page.screenshot({path:path.join(out,'experience-prepare-landscape.png')});
  await page.locator('#start-fishing').click();await page.waitForFunction(()=>document.querySelector('.scene')?.dataset.loading==='loading');
  assert(await page.locator('#map-loading').isVisible());assert(await page.locator('#cast').isDisabled());
  await page.keyboard.press('Space');await page.clock.runFor(8000);assert.equal(await page.locator('#session-clock').textContent(),'00:00');assert.equal((await saved(page)).casts,0);
  await page.screenshot({path:path.join(out,'experience-arrival.png')});
  assert(held);await held();await page.waitForFunction(()=>document.querySelector('.scene')?.dataset.loading==='ready');
  assert.equal(await page.locator('.left-hand').isVisible(),false);assert.equal(await page.locator('.right-hand').isVisible(),false);assert.equal(await page.locator('#float-zoom').isVisible(),false);assert.equal(await page.locator('#retrieve').isVisible(),false);
  await fits(page,'.fishing-topbar',844,390);
  const hud=await page.evaluate(()=>{const s=document.querySelector('.scene').getBoundingClientRect();let area=0;for(const k of ['.fishing-topbar','.scene-bottom']){const r=document.querySelector(k).getBoundingClientRect();area+=r.width*r.height;}return area/(s.width*s.height);});assert(hud<.23,'More than 77% of scene is clear: '+hud);
  for(const selector of ['#leave-fishing','#sound-toggle','#help','#pause']){const r=await page.locator(selector).boundingBox();assert(r.width>=44&&r.height>=44);}
  await page.waitForFunction(()=>window.__soundProbe.contexts[0]?.state==='running');await page.clock.runFor(500);assert((await page.evaluate(()=>window.__soundProbe.started))>0);
  await page.locator('#sound-toggle').click();assert.equal((await saved(page)).settings.sound,false);await page.waitForFunction(()=>window.__soundProbe.contexts[0].probeGains[0].gain.value<.05);
  await page.locator('#sound-toggle').click();assert.equal((await saved(page)).settings.sound,true);
  await page.locator('#help').click();await page.locator('#info-music').fill('20');await page.locator('#info-effects').fill('35');assert.equal((await saved(page)).settings.music,.2);assert.equal((await saved(page)).settings.effects,.35);
  await page.locator('[data-dialog-action="1"]').click();assert.equal(requests,1);assert.equal(await page.evaluate(()=>window.__soundProbe.contexts.length),1);
  await page.screenshot({path:path.join(out,'experience-clear-water.png')});assert.deepEqual(page.errors,[]);
  checks.push('One overview, full-download arrival gate, frozen clock, compact HUD and gesture-unlocked audio with persisted mix');await browser.close();

  // A failed request keeps arrival open and can recover without starting a cast.
  page=await makePage({width:375,height:812});let fail=true;
  await page.route('**/ao-lang-ben-cau-tre.mp4',async route=>{if(fail){fail=false;await route.fulfill({status:503,body:'unavailable'});}else await route.continue();});
  await page.goto('http://127.0.0.1:5193/#prepare');assert.equal(await page.locator('.prepare-destination img').count(),1);await page.screenshot({path:path.join(out,'experience-prepare-portrait.png')});
  await page.locator('#start-fishing').click();await page.waitForFunction(()=>document.querySelector('.scene')?.dataset.loading==='error');assert(await page.locator('#map-load-retry').isVisible());assert(await page.locator('#cast').isDisabled());
  await page.locator('#map-load-retry').click();await page.waitForFunction(()=>document.querySelector('.scene')?.dataset.loading==='ready');await fits(page,'.scene',375,812);assert.equal((await saved(page)).casts,0);
  await page.screenshot({path:path.join(out,'experience-small-phone.png')});assert.deepEqual(page.errors,[]);checks.push('375px portrait: one map, load error/retry, rotated HUD fits');await browser.close();

  for(const decision of ['keep','release']){
    const p=newPlayer();p.systems.trip={id:'trip-review',active:true,mapId:'AO',spotId:'ben-cau-tre'};p.pending={id:'catch-1',fishId:'fish_01',weight:.6,value:120,mapId:'AO'};p.serial=1;p.catches=1;p.collection.fish_01={count:1,best:.6};
    const viewport=decision==='keep'?{width:844,height:390}:{width:375,height:812};
    page=await makePage(viewport,p);let videoRequests=0;page.on('request',r=>{if(r.url().endsWith('.mp4'))videoRequests++;});
    await page.goto('http://127.0.0.1:5193/#fishing');await page.waitForFunction(()=>document.querySelector('.scene')?.dataset.loading==='ready');
    assert.equal(await page.locator('[data-catch-decision]').count(),2);await fits(page,'#dialog',viewport.width,viewport.height);
    assert(await page.locator('#dialog').evaluate(el=>el.scrollHeight<=el.clientHeight+1),'Both catch choices fit without scrolling');
    if(decision==='keep'){await page.locator('#catch-container').selectOption('bucket');assert.match(await page.locator('[data-catch-decision=keep]').innerText(),/xô/);await page.screenshot({path:path.join(out,'experience-catch-choices.png')});}
    const videoURL=await page.locator('video').getAttribute('src');await page.locator('[data-catch-decision='+decision+']').click();
    let state=await saved(page);assert.equal(state.pending,null);assert.equal(state.coins,12000);assert.equal(state.collection.fish_01.count,1);assert.equal(state.gifted,0);assert.equal(state.released,decision==='release'?1:0);assert.equal(state.keptFish.length,decision==='keep'?1:0);
    assert.equal(await page.locator('video').getAttribute('src'),videoURL);assert.equal(videoRequests,1);
    if(decision==='keep'){
      await page.reload();await page.waitForFunction(()=>document.querySelector('.scene')?.dataset.loading==='ready');state=await saved(page);assert.equal(state.keptFish.length,1);assert.equal(state.container,'bucket');
      await page.locator('#help').click();await page.locator('#info-keepnet').click();assert.equal(await page.locator('[data-fate=sell]').count(),0);await page.getByRole('button',{name:'Mang rọ về nhà'}).click();await page.locator('[data-kept="catch-1"][data-fate=sell]').click();state=await saved(page);assert.equal(state.keptFish.length,0);assert.equal(state.coins,12120);assert.equal(state.sold,1);
    }
    assert.deepEqual(page.errors,[]);checks.push('Catch '+decision+': only store/release at landing'+(decision==='keep'?', return home and gift from persisted keepnet':''));await browser.close();
  }
  console.log(JSON.stringify({status:'passed',checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
