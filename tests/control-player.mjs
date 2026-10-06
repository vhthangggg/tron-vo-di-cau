// A deterministic skilled player: uses public hand inputs, never edits catch/energy.
export function guideFish(g){
  if(!['fight','snag'].includes(g.phase))return;
  g.setTracking(true,g.fishPosition.x,g.fishPosition.y);
  g.setForce(g.phase==='snag'?.25:g.surge?.22:.52,true);
}
export function freeSnag(g){
  if(g.phase!=='snag')return;
  for(let i=0;i<80&&g.phase==='snag';i++){guideFish(g);g.step(.1);}
}
