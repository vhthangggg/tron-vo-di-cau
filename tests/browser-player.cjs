const assert=require('node:assert/strict');
async function targetPoint(page){const b=await page.locator('#fish-target').boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2};}
async function driveHands(page,until='landed'){
 await page.keyboard.down('Space');let p=await targetPoint(page);await page.mouse.move(p.x,p.y);await page.mouse.down();
 const arrows={ArrowUp:false,ArrowDown:false};
 for(let i=0;i<400;i++){
  const state=await page.evaluate(()=>{const t=document.querySelector('#fish-target').getBoundingClientRect();return {phase:document.querySelector('.scene').dataset.phase,dialog:document.querySelector('#dialog').open,x:t.x+t.width/2,y:t.y+t.height/2,force:parseInt(document.querySelector('#force-value').textContent)/100,hint:document.querySelector('#fight-hint').textContent,message:document.querySelector('#status-copy').textContent,paused:document.querySelector('#pause').getAttribute('aria-pressed'),progress:document.querySelector('#progress-value').textContent};});
  if(i%50===0)console.log('Fight checkpoint',i,state.phase,state.progress,state.hint,'paused='+state.paused);
  if(state.phase===until||state.dialog)break;
  assert.equal(state.paused,'false','Fight unexpectedly paused');
  assert(['fight','snag'].includes(state.phase),'Lost fish: '+state.message);
  await page.mouse.move(state.x,state.y);
  const desired=state.phase==='snag'?.25:state.hint.startsWith('Cá bứt')?.22:.52;
  for(const [key,down] of [['ArrowUp',state.force<desired-.04],['ArrowDown',state.force>desired+.04]])if(arrows[key]!==down){arrows[key]=down;if(down)await page.keyboard.down(key);else await page.keyboard.up(key);}
  await page.clock.runFor(200);
 }
 await page.mouse.up();for(const key of ['ArrowUp','ArrowDown','Space'])await page.keyboard.up(key);
}
async function waitForBite(page){for(let i=0;i<200;i++){await page.clock.runFor(200);const phase=await page.locator('.scene').getAttribute('data-phase');if(phase==='snag')await driveHands(page,'waiting');if(phase==='bite')return;}assert.fail('No natural bite: '+await page.locator('#status-copy').innerText());}
module.exports={driveHands,waitForBite,targetPoint};
