import test from 'node:test';
import assert from 'node:assert/strict';
import {newGarden,normalizeGarden,advanceGarden,gardenAction,gardenPurchase,GARDEN_HOUR as H,GARDEN_DAY as D,GARDEN_ITEMS} from '../src/garden.js';
import {newPlayer,validateSave,SCHEMA_VERSION} from '../src/save.js';
import {FishingGame} from '../src/engine.js';
import {inventoryFor,carriedBaitCount,reconcileInventory} from '../src/inventory.js';
import {renderGarden} from '../src/garden-ui.js';
const START=Date.UTC(2026,9,9,0);
const act=(g,action,bed,now=START)=>{const r=gardenAction(g,action,bed,now);assert(r.ok,r.reason);return r.garden;};
function plant(){let g=newGarden(START);g.supplies.compost=10;for(const a of ['hoe','feed','water','plant'])g=act(g,a,'corn');return g;}
function worms(){let g=newGarden(START);g=act(g,'feed','worms');return act(g,'water','worms');}
function dailyCorn(g,days=3){for(let day=1;day<=days;day++){const now=START+day*D;g=advanceGarden(g,now);if(day<days){g=act(g,'water','corn',now);if(g.corn.soil.nutrients<=60)g=act(g,'feed','corn',now);if(g.corn.soil.looseness<=70)g=act(g,'hoe','corn',now);}}return g;}
test('No immediate bait; corn requires soil, seed, three healthy days and actual care',()=>{
 let g=newGarden(START);assert.equal(gardenAction(g,'plant','corn',START).ok,false);assert.equal(gardenAction(g,'dig','worms',START).ok,false);
 g=plant();assert.equal(g.supplies.corn_seed,2);assert.equal(gardenAction(g,'harvest','corn',START+2*D).ok,false);
 const neglected=advanceGarden(g,START+3*D);assert(neglected.corn.crop.progress<72);
 g=dailyCorn(g);assert.equal(g.corn.crop.progress,72);const harvest=gardenAction(g,'harvest','corn',START+3*D);
 assert(harvest.ok);assert.deepEqual(harvest.reward,{baitId:'corn',amount:16});assert.equal(harvest.garden.corn.crop,null);assert.equal(harvest.garden.supplies.corn_seed,3);
 assert.equal(gardenAction(harvest.garden,'harvest','corn',START+3*D).ok,false);
});
test('Neglect stops growth, reduces worms, withers corn and requires a fresh crop',()=>{
 const g=plant(),missed=advanceGarden(g,START+2*D);assert(missed.corn.crop.health<100);assert(missed.corn.crop.progress<48);
 const dead=advanceGarden(g,START+7*D);assert.equal(dead.corn.crop.health,0);assert.equal(gardenAction(dead,'harvest','corn',START+7*D).ok,false);
 const cleared=act(dead,'clear','corn',START+7*D);assert.equal(cleared.corn.crop,null);assert.equal(gardenAction(g,'clear','corn',START).ok,false);
 const grown=advanceGarden(worms(),START+24*H);assert.equal(grown.worms.stock,6);
 assert.equal(advanceGarden(grown,START+7*D).worms.stock,0);
});
test('Offline projection is equivalent to hourly checks, even through drying and withering',()=>{
 for(const initial of [plant(),worms()])for(const hours of [12,24,48,200,10000]){
  const batch=advanceGarden(initial,START+hours*H);let hourly=initial;for(let i=1;i<=hours;i++)hourly=advanceGarden(hourly,START+i*H);
  for(const bed of ['corn','worms'])for(const key of ['moisture','nutrients','looseness'])assert(Math.abs(batch[bed].soil[key]-hourly[bed].soil[key])<1e-7);
  assert(Math.abs(batch.worms.stock-hourly.worms.stock)<1e-7);if(batch.corn.crop){assert(Math.abs(batch.corn.crop.progress-hourly.corn.crop.progress)<1e-7);assert(Math.abs(batch.corn.crop.health-hourly.corn.crop.health)<1e-7);}
 }
});
test('Worms need at least 12 healthy hours; rolling 24-hour digs cannot be bypassed by midnight or reload',()=>{
 const g=worms();assert.equal(gardenAction(g,'dig','worms',START+11*H).ok,false);
 const dug=gardenAction(g,'dig','worms',START+12*H);assert(dug.ok);assert.equal(dug.reward.amount,3);
 for(const hours of [12,23,24,35.99])assert.equal(gardenAction(normalizeGarden(dug.garden),'dig','worms',START+hours*H).ok,false);
 let ready=act(dug.garden,'water','worms',START+24*H);ready=advanceGarden(ready,START+36*H);assert(gardenAction(ready,'dig','worms',START+36*H).ok);
});
test('Composting is once per 24 hours, takes 12 hours, and each batch grants exactly one supply',()=>{
 const g=act(newGarden(START),'compost','composter');assert.equal(gardenAction(g,'collect','composter',START+11*H).ok,false);
 const collected=act(g,'collect','composter',START+12*H);assert.equal(collected.supplies.compost,3);
 assert.equal(gardenAction(collected,'collect','composter',START+12*H).ok,false);assert.equal(gardenAction(collected,'compost','composter',START+23*H).ok,false);
 assert(gardenAction(collected,'compost','composter',START+D).ok);
});
test('Invalid, repeated and unnecessary care leaves input state untouched and spends no supplies',()=>{
 const g=plant(),before=JSON.stringify(g);
 for(const [action,bed] of [['plant','worms'],['hoe','worms'],['plant','corn'],['clear','corn'],['dig','missing'],['constructor','corn'],['water','corn'],['feed','corn'],['hoe','corn']])assert.equal(gardenAction(g,action,bed,START).ok,false,action+' '+bed);
 assert.equal(JSON.stringify(g),before);
 const empty=newGarden(START);empty.supplies.compost=0;assert.equal(gardenAction(empty,'feed','corn',START).ok,false);
});
test('Clock rollback cannot restore soil, earn growth, reset digging or restart composting',()=>{
 const g=advanceGarden(worms(),START+D),before=JSON.stringify(g);assert.deepEqual(advanceGarden(g,START),g);
 for(const action of ['water','feed','dig'])assert.equal(gardenAction(g,action,'worms',START).ok,false);
 assert.equal(JSON.stringify(g),before);
});
test('Garden purchases preserve identity, use the best tool and cap supply stacks',()=>{
 let g=newGarden(START);const purchase=gardenPurchase(g,'watering_can');assert(purchase);g=purchase.garden;
 assert.equal(gardenPurchase(g,'watering_can'),null);g.worms.soil.moisture=0;assert.equal(act(g,'water','worms').worms.soil.moisture,80);
 g.supplies.compost=99;assert.equal(gardenPurchase(g,'compost'),null);assert.equal(gardenPurchase(g,'constructor'),null);
});
test('Engine commits garden shop and harvest atomically, stores bait and rejects repeats or full stock',()=>{
 let now=START;const p=newPlayer({now}),game=new FishingGame(p,{wallClock:()=>now});const coins=p.coins;
 assert(game.buy('garden','trowel_steel','buy-garden'));assert.equal(p.coins,coins-1400);assert.equal(game.buy('garden','trowel_steel','buy-garden-again'),false);
 assert(game.buy('garden','compost','buy-compost'));const balance=p.coins,supply=p.systems.garden.supplies.compost;assert.equal(game.buy('garden','compost','buy-compost'),false);assert.equal(p.coins,balance);assert.equal(p.systems.garden.supplies.compost,supply);
 assert(game.workGarden('feed','worms','feed'));assert(game.workGarden('water','worms','water'));now+=D;
 const before=p.baits.worm,carried=carriedBaitCount(p,'worm');assert(game.workGarden('dig','worms','dig'));assert.equal(p.baits.worm,before+6);assert.equal(carriedBaitCount(p,'worm'),carried);assert.equal(inventoryFor(p).stored.baits.worm,6);assert(reconcileInventory(inventoryFor(p),p));
 assert.equal(game.workGarden('dig','worms','dig'),false);assert.equal(game.gather('home'),false);assert.equal(game.gather('garden'),false);assert.equal(game.gather('soil'),false);
 now+=D;assert(game.workGarden('water','worms'));p.baits.worm=100000;const beforeGarden=JSON.stringify(p.systems.garden);assert.equal(game.workGarden('dig','worms'),false);assert.equal(JSON.stringify(p.systems.garden),beforeGarden);
});
test('Garden work and purchases are forbidden at the bank or during unresolved catches',()=>{
 const p=newPlayer({now:START}),game=new FishingGame(p,{wallClock:()=>START});assert(game.beginTrip());
 const before=JSON.stringify(p.systems.garden),coins=p.coins;assert.equal(game.workGarden('water','corn'),false);assert.equal(game.buy('garden','compost'),false);assert.equal(JSON.stringify(p.systems.garden),before);assert.equal(p.coins,coins);
 p.systems.trip=null;p.pending={id:'catch-1'};assert.equal(game.workGarden('water','corn'),false);assert.equal(game.buy('garden','compost'),false);
});
test('Zero-money, zero-bait recovery takes real care and time, then explicit packing',()=>{
 let now=START;const p=newPlayer({now});p.coins=0;for(const id of Object.keys(p.baits))p.baits[id]=0;p.systems.garden.supplies={corn_seed:0,compost:0};
 const game=new FishingGame(p,{wallClock:()=>now});assert.equal(game.cast(),false);assert.equal(game.digWorms(),false);
 assert.equal(game.workGarden('feed','worms'),false);assert(game.workGarden('compost','composter'));now+=12*H;assert(game.workGarden('collect','composter'));assert(game.workGarden('feed','worms'));assert(game.workGarden('water','worms'));now+=12*H;
 assert(game.digWorms());assert.equal(p.coins,0);assert.equal(p.baits.worm,3);assert.equal(carriedBaitCount(p,'worm'),0);
 assert(game.moveBait('worm',3,'carried'));assert(game.cast());
});
test('Schema 2 migration keeps all assets, depleted lures, rig and tutorial while granting one garden kit',()=>{
 const p=newPlayer({now:START});p.schemaVersion=2;delete p.systems.garden;p.rods.push('rod_02');p.baits.lure=0;p.coins=8700;p.rig.depth=1.8;p.systems.tutorial.bait={completed:true,claimed:true};
 const q=validateSave(p,{now:START});assert.equal(q.schemaVersion,SCHEMA_VERSION);assert.equal(q.coins,8700);assert.equal(q.baits.lure,0);assert.equal(q.rig.depth,1.8);assert.deepEqual(q.systems.tutorial.bait,p.systems.tutorial.bait);assert.deepEqual(q.baits,p.baits);assert.equal(q.systems.garden.supplies.corn_seed,3);
 q.systems.garden.supplies.compost=0;q.systems.garden.supplies.corn_seed=0;assert.deepEqual(validateSave(q,{now:START+D}).systems.garden.supplies,{corn_seed:0,compost:0});
});
test('Malformed garden fields are bounded without overwriting the wallet or granting repeat supplies',()=>{
 const p=newPlayer({now:START});p.coins=9100;p.systems.garden={lastAt:'bad',tools:['missing'],supplies:{corn_seed:-4,compost:Infinity},corn:{soil:{moisture:NaN},crop:{progress:Infinity,health:-20}},worms:{stock:Infinity}};
 const q=validateSave(p,{now:START});assert.equal(q.coins,9100);assert.deepEqual(q.systems.garden.supplies,{corn_seed:0,compost:0});assert.equal(q.systems.garden.corn.crop.health,0);assert.equal(q.systems.garden.worms.stock,0);
 assert(GARDEN_ITEMS.every(i=>Number.isSafeInteger(i.price)&&i.note));
});
test('Garden renderer is read-only and shows growth, soil, tools, daily care and stock destination',()=>{
 const p=newPlayer({now:START}),game=new FishingGame(p,{wallClock:()=>START}),before=JSON.stringify(p),html=renderGarden(p,game);
 for(const text of ['Ruộng vườn','72 giờ','Góc đất ủ lá','Xới đất','Độ ẩm','Dinh dưỡng','kho nhà','Ủ lá'])assert(html.includes(text),text);
 assert.equal(JSON.stringify(p),before);assert(!html.includes('data-gather'));assert(!html.includes('Trộn mồi bột'));
});
