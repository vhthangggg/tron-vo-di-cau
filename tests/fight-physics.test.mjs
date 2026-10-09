import test from 'node:test';
import assert from 'node:assert/strict';
import {FishingGame} from '../src/engine.js';
import {newPlayer} from '../src/save.js';
import {getFish} from '../src/content.js';
import {fishFightProfile,rodLoad,stepRodPose,rodGeometry,paintRod,ROD_SCALE} from '../src/fight-physics.js';
import {guideFish} from './control-player.mjs';

function hook(fishId,weight,seed=1,rod='bamboo'){
  const p=newPlayer();p.rods=[...new Set([...p.rods,rod])];p.rod=rod;p.systems.inventory=null;
  const g=new FishingGame(p,{seed});assert(g.beginTrip());g.phase='bite';g.target={id:'fixture',fishId,weight,suspicion:0};assert(g.strike());return g;
}
function land(fishId,weight,seed=1,rod='bamboo'){
  const g=hook(fishId,weight,seed,rod);
  for(let i=0;i<1200&&g.phase==='fight';i++){guideFish(g);g.step(.1);}
  assert.equal(g.phase,'landed',g.message);assert.equal(g.player.pending.weight,weight);return g.fightTime;
}

test('Tiny loaches and small crucian carp land in a few controlled seconds across 20 seeds',()=>{
  for(let seed=1;seed<=20;seed++){
    const loach=land('fish_27',.05,seed),crucian=land('fish_02',.1,seed);
    assert(loach>=2&&loach<4,loach);assert(crucian>=3&&crucian<5,crucian);
  }
});
test('Larger fish of the same species take longer; weak and strong species differ at equal weight',()=>{
  const fry=land('fish_01',.15),medium=land('fish_01',.5),large=land('fish_01',2.8);
  assert(fry<medium&&medium<large);assert(large>medium*2);
  const weak=land('fish_02',.5),strong=land('fish_04',.5);
  assert(weak<medium&&strong>medium*1.2);
});
test('A suitable stronger rod reduces fighting time without skipping the two-hand interaction',()=>{
  assert(land('fish_01',2,1,'dai54')<land('fish_01',2));
  for(const hand of ['left','right','off-target']){
    const g=hook('fish_27',.05);
    for(let i=0;i<80&&g.phase==='fight';i++){
      if(hand!=='left')g.setForce(.52);
      if(hand!=='right')g.setTracking(true,hand==='off-target'?0:g.fishPosition.x,hand==='off-target'?0:g.fishPosition.y);
      g.step(.1);
    }
    assert.notEqual(g.phase,'landed');assert.equal(g.player.catches,0);assert.equal(g.player.pending,null);
  }
});
test('Paused tiny-fish fights freeze progress and preserve the pending-catch rules',()=>{
  const g=hook('fish_27',.05);guideFish(g);g.step(.1);g.paused=true;const before=[g.fightTime,g.energy,g.tension];
  for(let i=0;i<100;i++)g.step(.1);assert.deepEqual([g.fightTime,g.energy,g.tension],before);
  g.paused=false;for(let i=0;i<80&&g.phase==='fight';i++){guideFish(g);g.step(.1);}assert.equal(g.phase,'landed');
  const id=g.player.pending.id;assert(g.resolveCatch(id,'keep'));assert.equal(g.resolveCatch(id,'keep'),false);assert.equal(g.player.keptFish.length,1);
});
test('Fighting profiles stay finite and bound large-fish endurance with high-end equipment',()=>{
  for(const mass of [.015,.1,.5,2,20,25]){
    const p=fishFightProfile(getFish('fish_35'),mass,20);
    assert(Number.isFinite(p.endurance));assert(p.endurance>=2.2&&p.endurance<=120);assert(p.burstScale>=.2&&p.burstScale<=1.3);
  }
});
test('Rod flex follows tension, right-hand force, fish load and rod stiffness, and clears outside a fight',()=>{
  const state={phase:'fight',force:.4,tension:45,weight:1,power:1.2,strength:1.1},low=rodLoad(state);
  assert(rodLoad({...state,force:.8,tension:75})>low);
  assert(rodLoad({...state,weight:2})>rodLoad({...state,weight:.05}));assert(rodLoad({...state,power:6.5})<low);
  assert(rodLoad({...state,phase:'snag'})>0);
  for(const phase of ['idle','casting','waiting','bite','landed','failed'])assert.equal(rodLoad({...state,phase}),0);
});
test('Releasing input stops pulling immediately while the visible rod settles without a snap',()=>{
  const game=hook('fish_01',2);game.setForce(.8);game.tension=65;
  const before={force:.8,bend:rodLoad({...game,weight:2,power:game.rod.power})};
  game.releaseHands();assert.equal(game.force,0);assert.equal(game.pulling,false);
  const target={force:game.force,bend:rodLoad({...game,weight:2,power:game.rod.power})};
  let pose=stepRodPose(before,target,1/60);assert(pose.force>.7&&pose.force<.8);assert(pose.bend>target.bend);
  for(let i=0;i<44;i++){const next=stepRodPose(pose,target,1/60);assert(next.force<=pose.force&&next.force>=0);pose=next;}
  assert(pose.force<.01);assert(Math.abs(pose.bend-target.bend)<.002);
  const regripped=stepRodPose(pose,{force:.6,bend:.7},1/60);assert(regripped.force>pose.force&&regripped.force<.6);
});
test('Rod settling is consistent at 30/60/120 FPS; reduced motion shortens the movement',()=>{
  const start={force:.8,bend:.9},target={force:0,bend:.2},poses=[];
  for(const fps of [30,60,120]){let pose=start;for(let i=0;i<fps/2;i++)pose=stepRodPose(pose,target,1/fps);poses.push(pose);}
  for(const pose of poses){assert(Math.abs(pose.force-poses[0].force)<1e-12);assert(Math.abs(pose.bend-poses[0].bend)<1e-12);}
  assert.deepEqual(stepRodPose(start,target,0),start);
  const reduced=stepRodPose(start,target,.5,{reducedMotion:true});assert(reduced.force<poses[0].force);
});
test('Bent rods anchor the handle, keep shaft length, bend toward the line and share one exact tip',()=>{
  for(const [w,h] of [[844,390],[1280,720],[375,812]]){
    const end={x:w*.65,y:h*.62},flat=rodGeometry(w,h,{force:.5,end}),bent=rodGeometry(w,h,{force:.5,bend:.9,end});
    assert.deepEqual(bent.root,flat.root);assert.deepEqual(bent.points[0],bent.root);assert.deepEqual(bent.tip,bent.points.at(-1));
    const length=p=>p.points.slice(1).reduce((sum,v,i)=>sum+Math.hypot(v.x-p.points[i].x,v.y-p.points[i].y),0);
    assert(Math.abs(length(bent)-length(flat))<1e-6);assert(bent.tip.x>flat.tip.x);assert(bent.tip.y>flat.tip.y);
    assert(bent.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h));
    const chord=Math.hypot(bent.tip.x-bent.root.x,bent.tip.y-bent.root.y);
    const bow=Math.max(...bent.points.map(p=>Math.abs((bent.tip.y-bent.root.y)*(p.x-bent.root.x)-(bent.tip.x-bent.root.x)*(p.y-bent.root.y))/chord));
    assert(bow>Math.min(w,h)*.1,'Loaded shaft visibly bows instead of only pivoting');
  }
});

test('The visible rod is 20 percent longer and thicker at phone and desktop sizes',()=>{
  for(const [w,h] of [[640,360],[844,390],[1280,720],[375,812]]){
    for(const force of [0,.5,1]){
      const pose=rodGeometry(w,h,{force});
      const oldLength=Math.hypot(w*(.20+force*.09)-w*.04,h*(.46-force*.17)-h*.98);
      const length=pose.points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-pose.points[i].x,p.y-pose.points[i].y),0);
      assert(Math.abs(length/oldLength-ROD_SCALE)<1e-9);
      assert(pose.points.every(p=>p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h));
      const widths=[],c={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){if(this.strokeStyle==='#F4EDCF')widths.push(this.lineWidth);}};
      paintRod(c,pose,h);
      assert(Math.abs(widths[0]/(Math.max(3.5,Math.min(8,h*.016))*(1-1/25*.75))-ROD_SCALE)<1e-9);
    }
  }
});

test('The second size increase keeps the enlarged rod visible in tall mobile views',()=>{
  for(const [w,h] of [[320,640],[375,812],[390,844],[844,390],[1280,720]]){
    for(const force of [0,.5,1])for(const end of [{x:w*.2,y:h*.35},{x:w*.75,y:h*.42},{x:w*.9,y:h*.85}]){
      const rod=rodGeometry(w,h,{force,bend:.8,end});
      const length=rod.points.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-rod.points[i].x,p.y-rod.points[i].y),0);
      const base=Math.hypot(w*(.20+force*.09)-w*.04,h*(.46-force*.17)-h*.98);
      assert(Math.abs(length/base-ROD_SCALE)<1e-9);
      assert(rod.points.every(p=>p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h),`${w}x${h}, force ${force}, tip ${JSON.stringify(rod.tip)}`);
    }
  }
});
