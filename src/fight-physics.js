import {fishBehavior} from './water-world.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const ROD_SCALE=1.2;

// Endurance is seconds of well-controlled pulling with the starter reel.
// Energy remains a percentage so the progress bar and net bonuses keep their meaning.
export function fishFightProfile(fish,weight,power=1.2){
  const strength=fishBehavior(fish).strength,mass=Math.max(.015,weight),ratio=mass/Math.max(.1,power);
  const endurance=clamp(2.2+8.5*mass**.68*strength,2.2,75)*(1+Math.min(.55,ratio*.16));
  const burstScale=clamp(.2+.8*Math.min(1,mass/.9)*strength,.2,1.15);
  return {endurance,burstScale,strength};
}

export function rodLoad({phase,force=0,tension=0,weight=.1,power=1.2,strength=1}){
  if(!['fight','snag'].includes(phase))return 0;
  const resistance=phase==='snag'?.9:clamp(.15+.65*Math.sqrt(Math.max(0,weight)/Math.max(.1,power))*strength,.15,1.2);
  return clamp(tension/80*resistance*(.4+clamp(force,0,1)*.6),0,1);
}

// A stiff butt and progressively softer tip. The line pulls the tip perpendicular
// to the unloaded rod; cubic flex keeps the handle tangent anchored in the hand.
export function rodGeometry(w,h,{force=0,bend=0,end={x:w*.5,y:h*.6},bite=0}={}){
  const root={x:w*.04,y:h*.98};
  const free={x:root.x+(w*(.20+force*.09)-root.x)*ROD_SCALE,y:root.y+(h*(.46-force*.17)+bite-root.y)*ROD_SCALE};
  const dx=free.x-root.x,dy=free.y-root.y,length=Math.hypot(dx,dy),normal={x:-dy/length,y:dx/length};
  const pull=(end.x-free.x)*normal.x+(end.y-free.y)*normal.y;
  const flex=Math.sign(pull)*Math.min(length*.6,Math.abs(pull)*.85*ROD_SCALE)*clamp(bend,0,1);
  let points=Array.from({length:25},(_,i)=>{const t=i/24,offset=flex*t**3;return {x:root.x+dx*t+normal.x*offset,y:root.y+dy*t+normal.y*offset};});
  const arc=points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-points[i].x,p.y-points[i].y),0),scale=length/arc;
  points=points.map(p=>({x:root.x+(p.x-root.x)*scale,y:root.y+(p.y-root.y)*scale}));
  return {root,free,tip:points.at(-1),points,flex};
}

export function paintRod(c,pose,h){
  const points=pose.points,width=clamp(h*.016,3.5,8)*ROD_SCALE;
  c.save();c.lineCap='round';c.lineJoin='round';
  // Overlapping tapered segments keep the tip fine at phone resolution.
  c.strokeStyle='#F4EDCF';
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i];c.lineWidth=width*(1-i/points.length*.75);
    c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
  }
  c.strokeStyle='#6F6E43';c.lineWidth=.8*ROD_SCALE;c.beginPath();
  points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();
  // Grip and binding bands follow the flexed blank instead of floating beside it.
  c.strokeStyle='#695038';c.lineWidth=width+2*ROD_SCALE;c.beginPath();c.moveTo(points[0].x,points[0].y);c.lineTo(points[3].x,points[3].y);c.stroke();
  c.strokeStyle='#B79A54';c.lineWidth=2*ROD_SCALE;
  for(const i of [6,12,18,22]){
    const p=points[i],q=points[i-1],length=Math.hypot(p.x-q.x,p.y-q.y),nx=-(p.y-q.y)/length,ny=(p.x-q.x)/length,r=width*(1-i/points.length*.75)*.6;
    c.beginPath();c.moveTo(p.x-nx*r,p.y-ny*r);c.lineTo(p.x+nx*r,p.y+ny*r);c.stroke();
  }
  c.restore();
}
