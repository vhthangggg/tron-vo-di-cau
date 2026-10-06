import test from 'node:test';
import assert from 'node:assert/strict';
import {FishingGame} from '../src/engine.js';
import {newPlayer} from '../src/save.js';
import {FISH,MAPS} from '../src/content.js';
import {fishBehavior,snagChance,waterWorld} from '../src/water-world.js';
import {guideFish,freeSnag} from './control-player.mjs';
function hooked(seed=22){const g=new FishingGame(newPlayer(),{seed});g.cast();for(let i=0;i<500&&g.phase!=='bite';i++){freeSnag(g);g.step(.1);}assert.equal(g.phase,'bite');g.holdRod(.5);return g;}

test('One stationary hand cannot earn progress; losing the moving target loses the fish',()=>{
 const g=hooked();for(let i=0;i<70&&g.phase==='fight';i++){g.setForce(g.surge?.2:.5);g.step(.1);}assert.equal(g.phase,'failed');assert.match(g.message,/Tay trái|tay trái/);assert.equal(g.player.catches,0);
});
test('Analog rod height changes line tension, independently from left-hand position',()=>{
 const low=hooked(),high=hooked();for(let i=0;i<6;i++){for(const [g,f] of [[low,.2],[high,.85]]){g.setTracking(true,g.fishPosition.x,g.fishPosition.y);g.setForce(f);g.step(.1);}}
 assert(high.tension>low.tension+20);assert.equal(low.tracking,true);low.setForce(0,false);assert.equal(low.tracking,true);high.setTracking(false);assert.equal(high.pulling,true);
});
test('Fish movement responds to species and both axes, not a shared visual sine loop',()=>{
 assert.notEqual(fishBehavior(FISH[0]).speed,fishBehavior(FISH[3]).speed);
 const g=hooked(),positions=[];for(let i=0;i<100;i++){guideFish(g);g.step(.1);positions.push({...g.fishPosition});}
 assert(Math.max(...positions.map(p=>p.x))-Math.min(...positions.map(p=>p.x))>.12);assert(Math.max(...positions.map(p=>p.y))-Math.min(...positions.map(p=>p.y))>.12);
 assert(positions.every(p=>p.x>=.09&&p.x<=.91&&p.y>=.09&&p.y<=.91));
});
test('Paused and canceled hands cannot retain force or move the fight',()=>{
 const g=hooked();guideFish(g);g.paused=true;g.releaseHands();const before=[g.time,g.energy,g.tension,{...g.fishPosition}];assert.equal(g.holdRod(.6),false);assert.equal(g.setTracking(true,.2,.8),false);for(let i=0;i<20;i++)g.step(.1);assert.deepEqual([g.time,g.energy,g.tension,g.fishPosition],before);assert.equal(g.pulling,false);assert.equal(g.tracking,false);
});
test('All map risks are bounded, depend on the bank, and fall when fishing above bottom',()=>{
 for(const m of MAPS){assert.equal(waterWorld(m.id).risk.length,3);for(let i=0;i<3;i++){const bottom=snagChance(m,i,m.spots[i].depth,'don'),raised=snagChance(m,i,.4,'don');assert(bottom>0&&bottom<.4);assert(raised<bottom);}}
});
test('Snags are rolled per cast with deterministic seeds and do not destroy owned gear',()=>{
 let found=0;for(let seed=1;seed<=150;seed++){const p=newPlayer(),g=new FishingGame(p,{seed});g.cast();if(!g.snagScheduled)continue;found++;for(let i=0;i<50&&g.phase!=='snag';i++)g.step(.1);assert.equal(g.phase,'snag');const inventory=JSON.stringify(p.equipment),bait=p.baits.worm,coins=p.coins;freeSnag(g);assert.equal(g.phase,'waiting');assert.equal(p.baits.worm,bait);assert.equal(p.coins,coins);assert.equal(JSON.stringify(p.equipment),inventory);assert.equal(p.catches,0);assert.equal(g.snagTriggered,true);}assert(found>0&&found<25);
});
test('A snag rewards gentle aligned two-hand input and punishes forcing the rod',()=>{
 const gentle=hooked(),hard=hooked();gentle.beginSnag();hard.beginSnag();const bait=gentle.player.baits.worm;
 for(let i=0;i<40&&gentle.phase==='snag';i++){guideFish(gentle);gentle.step(.1);}assert.equal(gentle.phase,'waiting');assert.equal(gentle.player.baits.worm,bait);
 for(let i=0;i<30&&hard.phase==='snag';i++){hard.setForce(.9);hard.step(.1);}assert.equal(hard.phase,'failed');assert.match(hard.message,/Mắc đáy/);assert.equal(hard.player.catches,0);
});
test('Snag timeout, abandon, deadline and new-session paths recover without ghost inputs',()=>{
 for(const action of ['timeout','abandon','deadline']){const g=hooked();g.beginSnag();if(action==='timeout')for(let i=0;i<165;i++)g.step(.1);if(action==='abandon')g.retrieve();if(action==='deadline'){g.player.settings.deadline=180;g.elapsed=179.95;g.step(.1);}assert.equal(g.phase,'failed');assert.equal(g.tracking,false);assert.equal(g.pulling,false);assert(g.newSession());assert.equal(g.phase,'idle');assert(g.cast());}
});
test('Invalid control coordinates cannot poison simulation state',()=>{const g=hooked();assert.equal(g.setTracking(true,NaN,Infinity),false);assert.equal(g.setForce(NaN),false);g.setTracking(true,-5,100);assert.deepEqual(g.aim,{x:0,y:1});g.setForce(8);assert.equal(g.force,1);assert(Number.isFinite(g.tension));});
