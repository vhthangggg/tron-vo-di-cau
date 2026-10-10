import test from 'node:test';
import assert from 'node:assert/strict';
import {ACCESSORIES,BAITS,RODS} from '../src/content.js';
import {RIG_DEFAULTS,RIG_OPTIONS,getRigStats,validateRig,validatePreset} from '../src/equipment.js';
import {balancedLead,floatState} from '../src/rig-physics.js';

const starter=()=>({rod:'bamboo',bait:'worm',map:'AO',rods:['bamboo'],baits:{worm:18},
  accessories:ACCESSORIES.filter(item=>item.price===0).map(item=>item.id),
  equipment:Object.fromEntries(ACCESSORIES.filter(item=>item.price===0).map(item=>[item.slot,item.id])),
  rig:{depth:1,lead:1.08,...RIG_DEFAULTS}});
const fullyOwned=()=>({...starter(),rods:RODS.map(item=>item.id),accessories:ACCESSORIES.map(item=>item.id),
  baits:Object.fromEntries(BAITS.map(item=>[item.id,item.reusable?1:100]))});

test('the migrated starter stays at four visible marks and calibration is read-only',()=>{
  const player=starter(),before=JSON.stringify(player),state=floatState(player);
  assert.equal(state.visibleMarks,4);assert.equal(state.balanced,true);
  assert.ok(Math.abs(state.marks-4)<.001);assert.equal(balancedLead(player),1.08);
  assert.equal(state.buoyancy,1.4);assert.equal(state.contact,'suspended');
  assert.equal(JSON.stringify(player),before);
});

test('all floats sink monotonically with more lead and expose finite gram-equivalent loads',()=>{
  for(const item of ACCESSORIES.filter(item=>item.slot==='float')){
    const player=fullyOwned();player.equipment.float=item.id;
    let previous=8;
    for(let lead=.4;lead<=3.5;lead+=.05){
      player.rig.lead=lead;const state=floatState(player);
      assert.ok(state.marks<=previous+1e-8,item.id);assert.ok(state.marks>=0&&state.marks<=8);
      assert.ok(Number.isFinite(state.effectiveLoad));assert.ok(state.sensitivity>0);previous=state.marks;
    }
    player.rig.lead=balancedLead(player);assert.equal(floatState(player).visibleMarks,4);
  }
});

test('tip taper produces a nonlinear mark response and a different response for slender geometry',()=>{
  const player=fullyOwned();player.rig.lead=balancedLead(player,{targetMarks:6});
  const upper=floatState(player).marks;player.rig.lead+=.02;const upperChange=upper-floatState(player).marks;
  player.rig.lead=balancedLead(player,{targetMarks:2});
  const lower=floatState(player).marks;player.rig.lead+=.02;const lowerChange=lower-floatState(player).marks;
  assert.ok(Math.abs(upperChange-lowerChange)>.05,'one gram increment cannot map to constant painted marks');
  const response=id=>{player.equipment.float=id;player.rig.lead=balancedLead(player);const start=floatState(player).marks;player.rig.lead+=.02;return start-floatState(player).marks;};
  assert.ok(response('float_slender')>response('float_sea')*1.4);
});

test('bait and hook weight change the waterline and the required calibration',()=>{
  const player=fullyOwned(),worm=floatState(player),wormLead=balancedLead(player);
  player.bait='livefish';assert.ok(floatState(player).marks<worm.marks);assert.ok(balancedLead(player)<wormLead);
  player.bait='worm';player.rig.hookSize=8;assert.ok(floatState(player).marks<worm.marks);
  assert.ok(getRigStats(player).hookMass>getRigStats(starter()).hookMass);
});

test('bottom support raises the float and overdepth reduces the signal instead of deleting all bites',()=>{
  const player=starter(),free=floatState(player),touch=floatState(player,{bottomDepth:1});
  assert.equal(touch.contact,'bottom');assert.equal(touch.hookDepth,1);assert.ok(touch.bottomSupport>0);
  assert.ok(touch.marks>free.marks);assert.ok(touch.sensitivity<free.sensitivity);
  player.rig.depth=1.6;const over=floatState(player,{bottomDepth:1});
  assert.equal(over.contact,'overdepth');assert.equal(over.hookDepth,1);assert.equal(over.calibrationPossible,false);
  assert.equal(over.visibleMarks,8);assert.ok(over.warning);assert.ok(over.sensitivity>0&&over.sensitivity<touch.sensitivity);
  assert.ok(balancedLead(player,{bottomDepth:1})>=.4);
});

test('line tension and moving water affect the equilibrium; a stable float damps current',()=>{
  const player=fullyOwned(),quiet=floatState(player),tense=floatState(player,{lineTension:.1}),moving=floatState(player,{current:.2});
  assert.ok(tense.marks<quiet.marks);assert.ok(moving.marks<quiet.marks);assert.ok(moving.currentLoad>0);
  player.equipment.float='float_sea';player.rig.lead=balancedLead(player);
  assert.ok(floatState(player,{current:.2}).currentLoad<moving.currentLoad);
});

test('lure and bottom fishing do not require a float or calibration',()=>{
  for(const rod of ['rod_02','rod_28']){
    const player=fullyOwned();player.rod=rod;player.bait=rod==='rod_02'?'lure':'worm';
    delete player.equipment.float;player.rig.lead=3.5;
    const state=floatState(player,{bottomDepth:1});
    assert.equal(state.visibleMarks,0);assert.equal(state.balanced,true);assert.equal(state.requiresCalibration,false);
    assert.equal(state.sensitivity,1);assert.equal(validateRig(player).ok,true);
  }
});

test('rig validation blocks missing ownership and incompatible parts, while allowing a badly balanced float',()=>{
  const player=starter();player.rig.lead=1.5;
  assert.equal(floatState(player).balanced,false);assert.equal(validateRig(player).ok,true);
  player.equipment.line='braid';assert.equal(validateRig(player).ok,false);
  player.equipment.line='hook_basic';assert.equal(validateRig(player).ok,false);
  player.equipment.line='line_basic';player.rod='rod_13';assert.equal(validateRig(player).ok,false);
  player.rod='bamboo';player.bait='lure';assert.equal(validateRig(player).ok,false);
  player.bait='worm';player.rig.leaderMm=NaN;assert.equal(validateRig(player).ok,false);
  player.rig.leaderMm=.16;player.rig.hookSize=4.5;assert.equal(validateRig(player).ok,false);
});

test('old equipment records use starter parts and leader choices expose real rig dimensions',()=>{
  const player=starter();delete player.equipment;delete player.rig.leaderMm;
  const result=validateRig(player),stats=getRigStats(player);
  assert.equal(result.ok,true);assert.equal(result.components.line,'line_basic');assert.equal(stats.leaderMm,.16);
  assert.ok(RIG_OPTIONS.leaders.every(leader=>leader.strengthKg>0));assert.equal(stats.breakingStrengthKg,.5);
});

test('presets validate the selected technique and dimensions without mutating the active setup',()=>{
  const player=fullyOwned(),before=JSON.stringify(player);
  const preset={rod:'rod_01',bait:'corn',technique:'dai',equipment:{float:'float_slender'},rig:{depth:1.2,lead:1.5,leaderMm:.12,hookSize:2}};
  const result=validatePreset(player,preset);assert.equal(result.ok,true);assert.equal(result.rig.leaderMm,.12);
  assert.equal(result.equipment.float,'float_slender');assert.equal(JSON.stringify(player),before);
  assert.equal(validatePreset(starter(),preset).ok,false);
  assert.equal(validatePreset(player,{...preset,technique:'lure'}).ok,false);
  assert.equal(validatePreset(player,{...preset,rig:{depth:99}}).ok,false);
  assert.equal(validatePreset(player,{...preset,equipment:null}).ok,false);
  assert.equal(validatePreset(player,{depth:1.4,lead:1.2}).rig.depth,1.4);
});

test('calibration endpoints and malformed optional environment inputs do not emit NaN',()=>{
  const player=starter();
  assert.equal(balancedLead(player,{targetMarks:8}),.4);assert.equal(balancedLead(player,{targetMarks:0}),3.5);
  for(const state of [floatState(player,{bottomDepth:NaN,current:Infinity,lineTension:NaN}),floatState(player,{bottomDepth:0})]){
    assert.ok(Number.isFinite(state.marks));assert.ok(Number.isFinite(state.effectiveLoad));assert.equal(state.contact,'suspended');
  }
});
