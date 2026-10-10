const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),origin='http://127.0.0.1:5234',out=path.join(root,'test-results');
let browser,server;
(async()=>{
 fs.mkdirSync(out,{recursive:true});server=spawn(process.execPath,['scripts/serve.mjs','--port','5234'],{cwd:root});
 await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 const {newPlayer}=await import('../src/save.js'),{fishingDay}=await import('../src/fishing-stats.js');
 const checks=[];
 for(const width of [1440,375]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const p=newPlayer();p.catches=2;p.released=1;p.collection.fish_01={count:2,best:.5};p.serial=2;
  p.systems.fishingStats=[{day:fishingDay(),catches:2,released:1,best:{fishId:'fish_01',weightGrams:500}}];
  await page.addInitScript(p=>{if(!localStorage.getItem('tron-vo-di-cau.v01'))localStorage.setItem('tron-vo-di-cau.v01',JSON.stringify(p));},p);
  await page.goto(origin+'/#home');const entry=page.getByRole('link',{name:'Bảng xếp hạng',exact:true});await entry.waitFor();
  if(width<700){const start=await page.locator('.start-button').boundingBox();assert(start.width>180&&start.height<80,'home primary action must remain readable');}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'home overflow');
  await page.screenshot({path:path.join(out,'leaderboard-home-'+width+'.png')});await entry.click();
  await page.locator('.fishing-board-grid[aria-busy="false"]').waitFor();
  assert.equal(await page.locator('[data-fishing-board]').count(),3);assert.match(await page.locator('#fishing-board-status').innerText(),/chờ kết nối cơ sở dữ liệu/);
  assert.equal(await page.locator('.fishing-rank-list li').count(),0);assert.match(await page.locator('#fishing-personal-stats').innerText(),/2/);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:path.join(out,'leaderboard-unconfigured-'+width+'.png'),fullPage:true});
  // Public API fixtures exercise presentation; SQL aggregation is verified separately with real Postgres.
  let requests=0;
  await page.route('**/api/online?**',async route=>{
   const url=new URL(route.request().url()),action=url.searchParams.get('action');
   if(action==='config'){await route.fulfill({json:{enabled:true,url:'https://leader-test.supabase.co',publicKey:'test-public-key'}});return;}
   if(action!=='leaderboard'){await route.fulfill({status:401,json:{error:'Test only'}});return;}
   assert.equal(url.searchParams.get('board'),'fishing');const period=url.searchParams.get('period');assert(['day','week','all'].includes(period));requests++;
   if(period==='week')await new Promise(resolve=>setTimeout(resolve,350));
   const rows=Array.from({length:12},(_,i)=>({rank:i+1,name:`${period} · Cần thủ ${i+1}`,score:120-i,self:i===1}));
   await route.fulfill({json:{period,boards:{catches:{rows,total:12,me:{rank:2,score:119}},released:{rows,total:12},biggest:{rows:rows.map((r,i)=>({...r,score:(12-i)*1000,fishId:'fish_01'})),total:12}}}});
  });
  await page.reload();await page.locator('[data-fishing-board="catches"] li').first().waitFor();
  assert.equal(await page.locator('[data-fishing-board="catches"] li').count(),10);assert.equal(await page.locator('[data-fishing-board="released"] li').count(),10);assert.equal(await page.locator('[data-fishing-board="biggest"] li').count(),3);
  assert.match(await page.locator('[data-fishing-board="biggest"] li').first().innerText(),/12 kg/);
  await page.locator('[data-fishing-period="week"]').click();await page.locator('[data-fishing-period="all"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-fishing-board="catches"] li')?.textContent.includes('all ·'));
  await page.locator('#fishing-board-refresh').click();await page.locator('.fishing-board-grid[aria-busy="false"]').waitFor();
  assert.equal(await page.locator('[data-fishing-period="all"]').getAttribute('aria-pressed'),'true');assert.match(await page.locator('#fishing-period-caption').innerText(),/Toàn thời gian/);
  assert.equal(await page.locator('[data-fishing-board="catches"] li').count(),10);assert(requests>=4);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:path.join(out,'leaderboard-populated-'+width+'.png'),fullPage:true});
  // A resumed real catch uses the renamed action and persists its release once.
  const pending=newPlayer();pending.catches=1;pending.serial=1;pending.collection.fish_01={count:1,best:.5};pending.pending={id:'catch-1',fishId:'fish_01',weight:.5,value:10,mapId:'AO'};
  await page.addInitScript(p=>localStorage.setItem('tron-vo-di-cau.v01',JSON.stringify(p)),pending);
  await page.goto(origin+'/?resumed-catch=1#fishing');
  await page.waitForFunction(()=>document.querySelector('.scene')?.dataset.loading==='ready');
  if(!await page.locator('#dialog').evaluate(e=>e.open))await page.locator('#cast').click();
  const release=page.locator('[data-catch-decision="release"]');await release.waitFor();assert.match(await release.innerText(),/Phóng sinh/);await release.click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')));assert.equal(saved.released,1);assert.equal(saved.systems.fishingStats[0].released,1);
  assert.deepEqual(errors,[]);checks.push(width+'px: visible home entry, honest offline state, top 10/10/3, day/week/all filters, stale-response protection, personal stats and renamed release action');await context.close();
 }
 console.log(JSON.stringify({status:'passed',checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
