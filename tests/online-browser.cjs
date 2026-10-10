const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results'),origin='http://127.0.0.1:5227',key='tron-vo-di-cau.v01',uid='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
let server,browser;
(async()=>{
 fs.mkdirSync(out,{recursive:true});server=spawn(process.execPath,['scripts/serve.mjs','--port','5227'],{cwd:root});await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 const {newPlayer}=await import('../src/save.js'),{RANKED_RULES,replayRanked,seasonKey,seasonSeed}=await import('../src/ranked-challenge.js');
 // Actual unconfigured backend: no phantom online progress or ranking.
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:900},hasTouch:width<600,isMobile:width<600}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/#online');await page.locator('#online-status').waitFor();assert.match(await page.locator('#online-status').innerText(),/đang được chuẩn bị/);assert(await page.locator('#ranked-start').isDisabled());
  const p=newPlayer();p.coins=34567;await page.locator('#online-import').setInputFiles({name:'save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});await page.getByRole('button',{name:'Nhập bản lưu',exact:true}).click();
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).coins,key),34567);
  await page.locator('#online-import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{broken')});assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).coins,key),34567);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'online-guest-'+width+'.png'),fullPage:true});assert.deepEqual(errors,[]);await ctx.close();
 }
 // Provider/network fixtures are test-only; use the production replay to verify submitted controls.
 const ctx=await browser.newContext({viewport:{width:1280,height:1000}}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let remote=newPlayer(),revision=7,posted=null;remote.coins=45678;
 // Exercise the bundled Supabase SDK, with only the external HTTP provider stubbed.
 const token=[{alg:'HS256',typ:'JWT'},{sub:uid,aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600},'test-signature'].map(v=>Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64url')).join('.');
 const authUser={id:uid,aud:'authenticated',role:'authenticated',email:'test@example.invalid',app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:new Date().toISOString()};
 await page.route('https://ranked-test.supabase.co/auth/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  assert(req.method()==='OPTIONS'||['/auth/v1/token','/auth/v1/user','/auth/v1/logout'].includes(url.pathname));
  if(url.pathname==='/auth/v1/token'&&req.method()!=='OPTIONS')assert.equal(req.postDataJSON().email,authUser.email);
  const result=url.pathname.endsWith('/token')?{access_token:token,token_type:'bearer',expires_in:3600,refresh_token:'test-refresh-token',user:authUser}:url.pathname.endsWith('/user')?authUser:{};
  await route.fulfill({status:req.method()==='OPTIONS'?204:200,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'},contentType:'application/json',body:req.method()==='OPTIONS'?'':JSON.stringify(result)});
 });
 const session={id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',seed:seasonSeed(seasonKey()),rules:RANKED_RULES,started_at:new Date(Date.now()-181000).toISOString()};
 await page.route('**/api/online?*',async route=>{
  const req=route.request(),action=new URL(req.url()).searchParams.get('action'),body=req.method()==='POST'?req.postDataJSON():null;let result;
  if(action==='config')result={enabled:true,url:'https://ranked-test.supabase.co',publicKey:'test-public-key',googleEnabled:false};
  else if(action==='save'){if(body){assert.equal(body.revision,revision);remote=body.save;revision++;result={revision};}else result={save:remote,revision};}
  else if(action==='profile')result={name:body?.name||'Cần thủ thử nghiệm'};
  else if(action==='leaderboard')result={rows:[{rank:1,name:'Cần thủ thử nghiệm',score:1234,self:true}],total:1,me:{rank:1,score:1234},season:seasonKey()};
  else if(action==='ranked-start')result=session;
  else if(action==='ranked-submit'){posted=body;result=replayRanked(session.seed,body.events);assert(result.catches.length>0);}
  else throw Error('Unexpected route '+action);
  await route.fulfill({contentType:'application/json',body:JSON.stringify(result)});
 });
 const guest=newPlayer();guest.coins=88888;await page.addInitScript(({key,guest})=>localStorage.setItem(key,JSON.stringify(guest)),{key,guest});
 await page.goto(origin+'/#online');await page.locator('#online-email').fill(authUser.email);await page.locator('#online-password').fill('fixture-password');await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#online-status')?.textContent.includes('Đã tải tiến độ')).catch(async error=>{console.error('Auth fixture diagnostics:',await page.locator('body').innerText(),errors);throw error;});
 assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).coins,key),88888);
 assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).coins,key+'.user.'+uid),45678);
 await page.screenshot({path:path.join(out,'online-account-desktop.png'),fullPage:true});
 await page.clock.install();await page.locator('#ranked-start').click();await page.locator('#ranked-cast').waitFor();await page.screenshot({path:path.join(out,'ranked-desktop.png'),fullPage:true});
 let held=false,up=false,down=false;
 for(let i=0;i<1400&&!posted;i++){
  const state=await page.evaluate(()=>{const target=document.querySelector('#ranked-target').getBoundingClientRect();return {phase:document.querySelector('#ranked-float').dataset.phase,x:target.x+target.width/2,y:target.y+target.height/2,force:parseFloat(document.querySelector('#ranked-force-fill').style.height)/100,signal:document.querySelector('#ranked-signal').textContent,time:document.querySelector('#ranked-time').textContent};});
  if(['idle','failed'].includes(state.phase)){
   if(held){await page.keyboard.up('Space');held=false;}if(up){await page.keyboard.up('ArrowUp');up=false;}if(down){await page.keyboard.up('ArrowDown');down=false;}
   if(await page.locator('#ranked-cast').isEnabled())await page.locator('#ranked-cast').click();
  }
  if(['bite','fight','snag'].includes(state.phase)){
   if(!held){await page.keyboard.down('Space');held=true;}
   await page.mouse.move(state.x,state.y);
   const wanted=state.phase==='snag'?.25:state.signal.includes('CÁ BỨT')?.2:.45;
   const u=state.force<wanted-.025,d=state.force>wanted+.025;
   if(u!==up){up=u;await page.keyboard[u?'down':'up']('ArrowUp');}if(d!==down){down=d;await page.keyboard[d?'down':'up']('ArrowDown');}
  }
  await page.clock.runFor(150);
 }
 await page.waitForSelector('#ranked-back');assert(posted);assert.equal(posted.score,undefined);assert.equal(posted.seed,undefined);assert(posted.events.length>0);assert.deepEqual(errors,[]);
 await page.screenshot({path:path.join(out,'ranked-verified.png'),fullPage:true});await page.locator('#ranked-back').click();await page.locator('#board-results table').waitFor();assert(await page.locator('#board-results table').isVisible());
 assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).coins,key+'.user.'+uid),45678);
 await ctx.close();console.log('Online browser checks passed: guest/import, desktop/mobile layout, account isolation, complete ranked run and server replay.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
