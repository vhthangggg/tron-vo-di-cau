const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
let server,browser;
(async()=>{
 server=spawn(process.execPath,['scripts/serve.mjs','--port','5211'],{cwd:root});
 await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 const errors=[];
 for(const viewport of [{width:390,height:844},{width:1024,height:768},{width:1440,height:900}]){
  const context=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5211/#journal');await page.locator('.fish-row').first().waitFor();
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
  assert.equal(await page.locator('.fish-visual.has-photo').count(),56);
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
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await context.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS: 56 uploaded high-resolution fish photos remain inside journal frames, names do not overlap, carp/crab/frog detail dialogs fit on phone and PC, object-fit preserves the complete image, no JavaScript errors.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
