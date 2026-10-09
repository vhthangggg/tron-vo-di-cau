const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
let server,browser;
async function alignedCards(page,label){
 const geometry=await page.locator('.fish-card').evaluateAll(cards=>cards.map(card=>{
  const rect=el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height};};
  const frame=rect(card),button=rect(card.querySelector('.species-info'));
  return {id:card.dataset.species,frame,gap:frame.bottom-button.bottom,fields:[card.querySelector('.fish-card-top'),card.querySelector('.fish-art'),...card.querySelector('.fish-card-copy').children].map(rect)};
 }));
 const groups=[];for(const card of geometry){let row=groups.find(group=>Math.abs(group[0].frame.top-card.frame.top)<.5);if(!row){row=[];groups.push(row);}row.push(card);}
 for(const row of groups)for(const card of row){
  assert.equal(card.fields.length,12,label+' keeps all 12 card rows');
  assert(Math.abs(card.gap-row[0].gap)<.5,label+' equal bottom inset '+card.id);
  assert(Math.abs(card.frame.height-row[0].frame.height)<.5,label+' equal card height '+card.id);
  card.fields.forEach((field,i)=>{
   assert(Math.abs(field.top-row[0].fields[i].top)<.5,label+' aligned field '+i+' '+card.id);
   assert(Math.abs(field.height-row[0].fields[i].height)<.5,label+' shared field height '+i+' '+card.id);
   if(i)assert(card.fields[i-1].bottom<=field.top+.5,label+' no overlapping fields '+card.id);
  });
 }
 assert(geometry.length);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' no horizontal overflow');
}
(async()=>{
 server=spawn(process.execPath,['scripts/serve.mjs','--port','5211'],{cwd:root});
 await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 const errors=[];const {newPlayer}=await import('../src/save.js');
 for(const viewport of [{width:320,height:640},{width:390,height:844},{width:768,height:1024},{width:1024,height:768},{width:1440,height:900}]){
  const context=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const fixture=newPlayer();fixture.collection.fish_01={count:4,best:.85};fixture.collection.fish_03={count:2,best:.18};fixture.catches=6;await page.addInitScript(p=>localStorage.setItem('tron-vo-di-cau.v01',JSON.stringify(p)),fixture);
  await page.goto('http://127.0.0.1:5211/#journal');await page.evaluate(()=>document.fonts.ready);await page.locator('.fish-row').first().waitFor();
  // Exercise every uploaded photo, including tall frog/crab art, offscreen too.
  await page.locator('[data-fish-image]').evaluateAll(images=>images.forEach(img=>img.loading='eager'));
  await page.waitForFunction(()=>[...document.querySelectorAll('[data-fish-image]')].every(img=>img.complete&&img.naturalWidth>0));
  const issues=await page.locator('.fish-row').evaluateAll(rows=>rows.flatMap(row=>{
   const img=row.querySelector('[data-fish-image]');if(!img)return [];
   const frame=row.querySelector('.fish-art').getBoundingClientRect(),visual=img.closest('.fish-visual').getBoundingClientRect(),photo=img.getBoundingClientRect(),copy=row.querySelector('.fish-card-copy').getBoundingClientRect();
   const inside=(a,b)=>a.left>=b.left-.5&&a.top>=b.top-.5&&a.right<=b.right+.5&&a.bottom<=b.bottom+.5;
   return inside(photo,visual)&&inside(visual,frame)&&frame.bottom<=copy.top+.5?[]:[{id:img.dataset.fishImage,frameHeight:frame.height,visualHeight:visual.height,photoHeight:photo.height,overlap:photo.bottom-copy.top}];
  }));
  assert.deepEqual(issues,[],`All photographs stay in their journal frames at ${viewport.width}px`);
  assert.equal(await page.locator('.fish-visual.has-photo').count(),56);await alignedCards(page,viewport.width+'px mixed discovery');
  await page.screenshot({path:path.join(out,`fish-images-journal-${viewport.width}.png`)});
  for(const id of ['fish_01','fish_53','fish_57']){
   await page.locator('#fish-search').fill(id);await page.locator(`[data-species-info="${id}"]`).click();
   await page.waitForFunction(()=>document.querySelector('.species-detail-art .has-photo'));
   assert(await page.locator('.species-detail-art').evaluate(el=>{
    const f=el.getBoundingClientRect(),p=el.querySelector('img').getBoundingClientRect();
    return p.left>=f.left-.5&&p.right<=f.right+.5&&p.top>=f.top-.5&&p.bottom<=f.bottom+.5&&getComputedStyle(el.querySelector('img')).objectFit==='contain';
   }),`Full ${id} photograph fits its detail frame`);
   await page.screenshot({path:path.join(out,`fish-images-${id}-${viewport.width}.png`)});await page.locator('#dialog-close').click();
  }
  await page.locator('#fish-search').fill('');await page.locator('#fish-map').selectOption('AO');await alignedCards(page,viewport.width+'px filtered');
  if(viewport.width===390){
   await page.locator('#fish-map').selectOption('all');
   await page.evaluate(async()=>{const {FISH}=await import('./src/content.js');const f=FISH[1];f.scientificName=null;f.maps=[];f.tech=[];f.baits=[];f.depth=null;f.size={...f.size,common:null};});
   await page.locator('#fish-search').fill('fish_');
   const empty=page.locator('[data-species="fish_02"]');
   for(const selector of ['.species-scientific','.fish-record'])assert.equal(await empty.locator(selector).innerText(),'-');
   for(const selector of ['.fish-habitat','.fish-techniques','.fish-baits','.species-card-size','.species-card-strength'])assert.match(await empty.locator(selector).innerText(),/-/);
   await alignedCards(page,'missing information stays in its row');
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await context.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS: 56 fish photos stay contained; 12 card rows align within every responsive grid row at 320/390/768/1024/1440px, including discovered/unknown records, wrapped text, filters and missing information placeholders; detail buttons have equal bottom insets; carp/crab/frog dialogs fit; no overflow or JavaScript errors.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
