const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
let server,browser;
const out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
const checks=[];
async function point(page,selector,x,y){return page.locator(selector).evaluate((el,{x,y})=>{
  const r=el.getBoundingClientRect(),rot=getComputedStyle(el).getPropertyValue('--fishing-rotation').trim()==='90';
  return rot?{x:r.left+(1-y)*r.width,y:r.top+x*r.height}:{x:r.left+x*r.width,y:r.top+y*r.height};
},{x,y});}
async function waterPoint(page,x,y){return page.locator('.scene').evaluate((el,{x,y})=>{
  const w=el.clientWidth,h=el.clientHeight,iw=Math.max(w,h*16/9),ih=iw*9/16;
  const px=((w-iw)/2+x*iw)/w,py=((h-ih)/2+y*ih)/h,r=el.getBoundingClientRect();
  return getComputedStyle(el).getPropertyValue('--fishing-rotation').trim()==='90'?{x:r.left+(1-py)*r.width,y:r.top+px*r.height}:{x:r.left+px*r.width,y:r.top+py*r.height};
},{x,y});}
async function phase(page){return page.locator('.scene').getAttribute('data-phase');}
async function guide(page,cdp,until){
  let down=false;
  for(let i=0;i<400;i++){
    const current=await phase(page);if(current===until)return;
    assert(['bite','fight','snag'].includes(current),'Unexpected fight phase '+current);
    const surge=(await page.locator('#fight-hint').innerText()).startsWith('Cá bứt');
    const level=current==='snag'?.25:surge?.22:.52;
    const rod=await point(page,'#strike',.65,1-level),target=await page.locator('#fish-target').boundingBox();
    await cdp.send('Input.dispatchTouchEvent',{type:down?'touchMove':'touchStart',touchPoints:[{id:1,...rod},{id:2,x:target.x+target.width/2,y:target.y+target.height/2}]});down=true;
    await page.clock.runFor(200);
  }
  assert.fail('Two-handed fight did not finish');
}
(async()=>{
  server=spawn(process.execPath,['scripts/serve.mjs','--port','5192'],{cwd:path.resolve(__dirname,'..')});
  await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
  for(const [width,height,label] of [[1280,720,'desktop'],[844,390,'landscape'],[390,844,'portrait']]){
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),...(process.env.CHROMIUM_ARGS?{args:JSON.parse(process.env.CHROMIUM_ARGS)}:{})});
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:label!=='desktop'}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.clock.install({time:new Date('2026-10-07T01:00:00Z')});await page.clock.pauseAt(new Date('2026-10-07T01:00:01Z'));
    await page.goto('http://127.0.0.1:5192/');await page.locator('nav [data-screen=prepare]').click();
    assert.equal(await page.locator('.prepare-spot-list [data-spot]').count(),2);
    assert.equal(await page.locator('#main').evaluate(e=>getComputedStyle(e).transform),'none');
    for(const spot of [0,1]){
      await page.locator('.prepare-spot-list [data-spot="'+spot+'"]').click();await page.locator('#start-fishing').click();
      await page.waitForFunction(()=>document.querySelector('.scene')?.dataset.loading==='ready'&&document.querySelector('video').readyState>=2);
      const video=await page.locator('video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,error:v.error,paused:v.paused}));
      assert.equal(video.error,null);assert(video.width/video.height>1.7);assert.equal(video.paused,false);
      assert.equal(await phase(page),'idle');
      const sceneBox=await page.locator('.scene').boundingBox();assert(sceneBox.x>=-1&&sceneBox.y>=-1&&sceneBox.x+sceneBox.width<=width+1&&sceneBox.y+sceneBox.height<=height+1,'Scene fits viewport');
      for(const pos of [{x:.5,y:.37},{x:.52,y:.53}]){
        const p=await waterPoint(page,pos.x,pos.y);await page.mouse.click(p.x,p.y);
        assert(await page.locator('.scene').evaluate(e=>e.classList.contains('has-cast-target')),'Water selection accepted');
        await page.locator('#cast').click();assert.equal(await phase(page),'casting');
        await page.locator('#leave-fishing').click();assert.match(await page.locator('#dialog-title').innerText(),/Thu cần/);await page.locator('[data-dialog-action="0"]').click();
        await page.clock.runFor(850);assert.equal(await phase(page),'waiting');
        const marker=await page.locator('#world-float').evaluate(el=>({x:parseFloat(el.style.left),y:parseFloat(el.style.top),scale:+el.style.getPropertyValue('--float-scale'),hidden:el.hidden}));
        const expected=await page.locator('.scene').evaluate((el,pos)=>{const w=el.clientWidth,h=el.clientHeight,iw=Math.max(w,h*16/9),ih=iw*9/16;return {x:(w-iw)/2+pos.x*iw,y:(h-ih)/2+pos.y*ih};},pos);
        assert.equal(marker.hidden,false);assert(Math.abs(marker.x-expected.x)<1&&Math.abs(marker.y-expected.y)<1,'Float is at touched video position '+JSON.stringify({label,spot,pos,marker,expected}));
        if(pos.y<.4)page.farScale=marker.scale;else assert(marker.scale>page.farScale,'Near float is larger');
        await page.locator('#retrieve').click();assert.equal(await phase(page),'idle');
      }
      checks.push(label+' spot '+spot+': video, cast flight, exit guard, coordinates and perspective');console.log(checks.at(-1));
      await page.screenshot({path:path.join(out,`spots-${label}-${spot}.png`)});
      if(spot===0){await page.locator('#leave-fishing').click();await page.locator('nav [data-screen=prepare]').click();}
    }
    await page.locator('#cast').click();const cdp=await context.newCDPSession(page);
    for(let i=0;i<200;i++){
      await page.clock.runFor(200);const current=await phase(page);
      if(current==='snag'){await guide(page,cdp,'waiting');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
      if(current==='bite')break;
      assert.notEqual(current,'failed','Natural bite failed');
    }
    assert.equal(await phase(page),'bite');await guide(page,cdp,'landed');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await page.locator('#dialog').getAttribute('data-kind'),'catch');
    await page.locator('[data-dialog-action="0"]').click();
    assert.equal(await phase(page),'idle');
    await page.locator('#pause').click();const clock=await page.locator('#session-clock').innerText();await page.clock.runFor(1000);assert.equal(await page.locator('#session-clock').innerText(),clock);await page.locator('[data-dialog-action="0"]').click();
    assert.deepEqual(errors,[]);checks.push(label+': two simultaneous touch controls land a natural fish, resolve catch and pause');
    await browser.close();
  }
  console.log(JSON.stringify({status:'passed',checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
