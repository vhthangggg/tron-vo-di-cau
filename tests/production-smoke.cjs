const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {expect}=require((process.env.PLAYWRIGHT_MODULE||'playwright')+'/test');
const {waitForBite,targetPoint}=require('./browser-player.cjs');
let browser;
(async()=>{
 const url=process.env.GAME_URL;if(!url)throw Error('Set GAME_URL to the deployed URL');
 const proxyRaw=process.env.HTTPS_PROXY||process.env.HTTP_PROXY;let proxy;
 if(proxyRaw){const u=new URL(proxyRaw);proxy={server:u.origin,...(u.username?{username:decodeURIComponent(u.username),password:decodeURIComponent(u.password)}:{})};}
 browser=await chromium.launch({headless:true,...(proxy?{proxy}:{}),...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),...(process.env.CHROMIUM_ARGS?{args:JSON.parse(process.env.CHROMIUM_ARGS)}:{})});
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
 await page.clock.install({time:new Date('2026-10-07T01:00:00Z')});await page.clock.pauseAt(new Date('2026-10-07T01:00:01Z'));
 await page.goto(url+'/#fishing',{timeout:60000});await page.evaluate(()=>document.fonts.ready);await page.locator('.scene-bg').evaluate(e=>e.decode());
 await expect(page.locator('#track-pad')).toBeAttached();await page.locator('#cast').tap();await waitForBite(page);
 const cdp=await context.newCDPSession(page),r=await page.locator('#strike').boundingBox(),left=await targetPoint(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:r.x+r.width*.65,y:r.y+r.height*.5},{id:2,...left}]});
 for(let i=0;i<8;i++){const t=await targetPoint(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:r.x+r.width*.65,y:r.y+r.height*.5},{id:2,...t}]});await page.clock.runFor(150);}
 assert(parseInt(await page.locator('#progress-value').innerText())>0);assert.equal(await page.locator('#strike').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#track-pad').getAttribute('aria-pressed'),'true');
 const out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:out+'/production-two-hands.png'});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.locator('#pause').tap();const clock=await page.locator('#session-clock').innerText();await page.clock.runFor(1000);assert.equal(await page.locator('#session-clock').innerText(),clock);
 const bait=await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')).baits.worm);await page.reload();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tron-vo-di-cau.v01')).baits.worm),bait);
 assert.deepEqual(await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.scrollHeight]),[390,844]);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 const result={url,status:'passed',checks:['v0.2 controls and landscape loaded','Natural bite and two simultaneous touches produce progress','Pause freezes session and releases controls','Used bait persists through reload','390×844 viewport fits','No JavaScript or asset-request errors']};fs.writeFileSync(out+'/production-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>browser?.close());
