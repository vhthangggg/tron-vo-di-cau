import test from 'node:test';
import assert from 'node:assert/strict';
import {FishingGame} from '../src/engine.js';
import {MAPS} from '../src/content.js';
import {newPlayer,validateSave} from '../src/save.js';
import {castHabitat,snagChance} from '../src/water-world.js';
import {pointerPosition,coverFrame,imageToScene,sceneToImage,pointInPolygon} from '../src/scene-geometry.js';

test('Every map populates only its actual spots, including the two video banks',()=>{
  for(const map of MAPS){const p=newPlayer();p.map=map.id;const g=new FishingGame(p,{seed:1});
    assert.deepEqual([...new Set(g.fish.map(f=>f.spot))],map.spots.map((_,i)=>i));
    assert(g.fish.every(f=>Number.isFinite(f.depth)));}
});
test('Old Ao Lang starter saves retain progress and receive a playable shallow rig',()=>{
  const p=newPlayer();p.coins=54321;p.rig.depth=1.8;p.catches=7;
  const migrated=validateSave(p),g=new FishingGame(migrated,{seed:1});
  assert.equal(migrated.coins,54321);assert.equal(migrated.catches,7);
  assert.equal(migrated.rig.depth,g.spotData.depth);assert(g.fish.some(f=>g.eligible(f)));
});
test('Casting spends one bait, pauses safely, then lands at the selected water point',()=>{
  const g=new FishingGame(newPlayer(),{seed:1}),bait=g.player.baits.worm;
  assert.equal(g.setCastTarget(.5,.1),false);assert(g.setCastTarget(.52,.56));assert(g.cast());
  assert.equal(g.phase,'casting');assert.equal(g.cast(),false);assert.equal(g.player.baits.worm,bait-1);
  assert.equal(g.holdRod(),false);assert.equal(g.phase,'casting');
  g.paused=true;g.step(.1);assert.equal(g.castFlight.t,0);g.paused=false;
  for(let i=0;i<8;i++)g.step(.1);
  assert.equal(g.phase,'waiting');assert.equal(g.castFlight,null);assert.deepEqual(g.baitPoint,{x:.52,y:.56});
});
test('Retrieve, deadline and new sessions recover from a flight without stuck busy state',()=>{
  for(const action of ['retrieve','deadline']){const g=new FishingGame(newPlayer(),{seed:1});g.cast();
    if(action==='retrieve')g.retrieve();else {g.player.settings.deadline=180;g.elapsed=179.95;g.step(.1);}
    assert.equal(g.busy,false);assert.equal(g.castFlight,null);assert(g.newSession());assert(g.cast());}
});
test('Switching banks or maps clears previous target and habitat',()=>{
  const g=new FishingGame(newPlayer());g.setCastTarget(.5,.55);assert(g.selectSpot(1));
  assert.equal(g.castTarget,null);assert.equal(g.castHabitat,null);assert.equal(g.baitPoint,null);
  assert(pointInPolygon(g.defaultCastPoint.x,g.defaultCastPoint.y,g.spotData.waterZone));
  g.setCastTarget(.5,.55);g.player.maps.push('KENH');assert(g.selectMap('KENH'));assert.equal(g.castTarget,null);
});
test('Cover and distance affect habitat and snag risk in both video banks',()=>{
  for(const [i,spot] of MAPS[0].spots.entries()){
    const near=castHabitat(spot,{x:.5,y:.76}),far=castHabitat(spot,{x:.5,y:.34}),cover=castHabitat(spot,{x:.08,y:.39}),open=castHabitat(spot,{x:.5,y:.5});
    assert(far.depth>near.depth);assert(far.size>near.size);assert(cover.cover>open.cover);
    assert(snagChance(MAPS[0],i,spot.depth,'don',cover)>snagChance(MAPS[0],i,spot.depth,'don',open));
  }
});
test('Pointer coordinates invert a clockwise landscape fallback for both hands',()=>{
  const rect={left:20,top:30,width:120,height:300};
  const p=pointerPosition(rect,44,240,true);assert(Math.abs(p.x-.7)<1e-9);assert(Math.abs(p.y-.8)<1e-9);
  assert.deepEqual(pointerPosition(rect,80,180,false),{x:.5,y:.5});
});
test('Video coordinates survive cover cropping on standard, wide and rotated phone viewports',()=>{
  for(const [w,h] of [[1280,720],[844,390],[812,375],[1440,900]]){
    const frame=coverFrame(w,h);assert(frame.width>=w&&frame.height>=h);
    for(const p of [{x:.3,y:.4},{x:.7,y:.65}]){const q=sceneToImage(imageToScene(p,frame),frame);assert(Math.abs(p.x-q.x)<1e-9);assert(Math.abs(p.y-q.y)<1e-9);}
  }
});
