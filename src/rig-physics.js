import {getRod, slotItem, usesFloat} from './content.js';
import {getRigStats} from './equipment.js';

const MARK_COUNT=8;
const WATER_DENSITY=1; // Freshwater grams per cm³. All external loads are apparent submerged grams.
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const finiteOr=(value,fallback)=>Number.isFinite(value)?value:fallback;

// Authored geometry; these are distinct gameplay floats, not measurements of a retail product.
// One unit of tip height is one painted mark. Radius ratios specify the taper of each segment.
const PROFILES=Object.freeze({
  float_basic:{aspect:2.1,topHalfLift:.18,radii:[1.32,1.28,1.23,1.18,1.12,1.07,1.02,.96,.9]},
  float_canal:{aspect:1.55,topHalfLift:.21,radii:[1.48,1.45,1.41,1.36,1.30,1.22,1.13,1.03,.92]},
  float_slender:{aspect:3.9,topHalfLift:.12,radii:[1.30,1.25,1.20,1.14,1.07,1.00,.94,.88,.82]},
  float_sea:{aspect:1.25,topHalfLift:.255,radii:[1.64,1.59,1.53,1.46,1.37,1.27,1.16,1.04,.91]}
});

function frustumVolume(r0,r1,height){return Math.PI*height*(r0*r0+r0*r1+r1*r1)/3;}

function geometry(player){
  const item=slotItem(player,'float');
  const profile=PROFILES[item.id]||PROFILES.float_basic;
  const capacity=item.capacity;
  const unscaledTop=profile.radii.slice(4,-1).reduce((sum,r,index)=>sum+frustumVolume(r,profile.radii[index+5],1),0);
  const radiusScale=Math.sqrt(profile.topHalfLift/(unscaledTop*WATER_DENSITY));
  const radii=profile.radii.map(radius=>radius*radiusScale);
  const tipVolumes=radii.slice(0,-1).map((radius,index)=>frustumVolume(radius,radii[index+1],1));
  const tipLift=tipVolumes.reduce((sum,volume)=>sum+volume*WATER_DENSITY,0);
  const bodyLift=Math.max(.01,capacity-tipLift);
  // V = 4πa²c/3 for the ellipsoid; c/a is the selected float's body aspect ratio.
  const bodyRadius=Math.cbrt((bodyLift/WATER_DENSITY)*3/(4*Math.PI*profile.aspect));
  const bodyHeight=2*bodyRadius*profile.aspect;
  return {capacity,radii,tipVolumes,tipLift,bodyLift,bodyHeight,totalHeight:bodyHeight+MARK_COUNT};
}

function displacedLift(shape,height){
  if(height<=0)return 0;
  if(height<shape.bodyHeight){
    // Integrate the ellipsoid's horizontal cross section from its bottom to the waterline.
    const z=2*height/shape.bodyHeight-1;
    return shape.bodyLift*(.5+.75*z-.25*z*z*z);
  }
  let lift=shape.bodyLift,remaining=clamp(height-shape.bodyHeight,0,MARK_COUNT);
  for(let index=0;index<MARK_COUNT&&remaining>0;index++){
    const length=Math.min(1,remaining),start=shape.radii[index];
    const end=start+(shape.radii[index+1]-start)*length;
    lift+=frustumVolume(start,end,length)*WATER_DENSITY;
    remaining-=length;
  }
  return lift;
}

function immersionForLoad(shape,load){
  let low=0,high=shape.totalHeight;
  for(let iteration=0;iteration<40;iteration++){
    const middle=(low+high)/2;
    if(displacedLift(shape,middle)<load)low=middle;else high=middle;
  }
  return (low+high)/2;
}

/**
 * Solve the buoyant volume supporting the suspended rig. A mark is a visible length, never a
 * fixed gram increment: tapered tip sections and the ellipsoid body have different volumes.
 * bottomDepth=null is the free-water calibration tank; lineTension is downward gram-equivalent.
 */
export function floatState(player,{bottomDepth=null,current=0,lineTension=0}={}){
  const stats=getRigStats(player);
  const depth=clamp(stats.depth,.4,18),lead=clamp(stats.lead,.4,3.5);
  const bottom=Number.isFinite(bottomDepth)&&bottomDepth>0?bottomDepth:null;
  const over=bottom===null?-1:depth-bottom;
  const contact=over<0?'suspended':over>Math.max(.025,stats.leaderLength*.3)?'overdepth':'bottom';
  const hookDepth=bottom===null?depth:Math.min(depth,bottom);
  if(!usesFloat(getRod(player?.rod)))return {
    marks:0,visibleMarks:0,balanced:true,sensitivity:1,contact,hookDepth,lead,
    buoyancy:0,effectiveLoad:0,warning:'',requiresCalibration:false,calibrationPossible:true,
    bottomSupport:0,currentLoad:0,loadPerMark:0,bodyImmersion:0
  };

  const shape=geometry(player);
  const velocity=clamp(finiteOr(current,0),0,1);
  const tension=clamp(finiteOr(lineTension,0),0,5);
  const hookSupport=over>=0?(stats.hookMass+stats.baitMass)*clamp(.55+over/Math.max(.1,stats.leaderLength),0,1):0;
  const leadSupport=over>=0?lead*clamp((over-stats.sinkerDistance)/.08,0,1):0;
  const bottomSupport=hookSupport+leadSupport;
  // PE size has no measured mm diameter; use its dimensionless game drag rating.
  const currentLoad=velocity*velocity*.9*Math.max(.2,hookDepth)*(.8+stats.mainlineDrag)*(1-stats.stability*.5);
  const effectiveLoad=Math.max(0,lead+stats.hookMass+stats.baitMass-bottomSupport+tension+currentLoad);
  const immersion=immersionForLoad(shape,Math.min(effectiveLoad,shape.capacity));
  const marks=effectiveLoad>=shape.capacity?0:clamp(shape.totalHeight-immersion,0,MARK_COUNT);
  const visibleMarks=Math.round(marks);
  const balanced=marks>=2-1e-8&&marks<=7+1e-8;
  const localHeight=clamp(immersion,shape.bodyHeight,shape.totalHeight);
  const loadPerMark=displacedLift(shape,Math.min(shape.totalHeight,localHeight+.5))-displacedLift(shape,Math.max(shape.bodyHeight,localHeight-.5));
  const geometricSensitivity=clamp(.05/Math.max(.02,loadPerMark),.3,1);
  const balanceQuality=marks>0&&marks<8?clamp(1-Math.abs(marks-4)*.055,.55,1):.22;
  const supportDamping=contact==='suspended'?1:contact==='bottom'?.8:.48;
  const leaderDamping=clamp(1-(stats.leaderMm-.16)*.8,.7,1.05);
  const sensitivity=clamp(geometricSensitivity*balanceQuality*supportDamping*leaderDamping/(1+velocity*(1-stats.stability)*1.7),.08,1);
  const calibrationPossible=leadSupport<lead*.999;
  let warning='';
  if(contact==='overdepth')warning='Dư độ sâu: thẻo chùng hoặc chì nằm đáy, tín hiệu cá ăn bị giảm.';
  else if(!balanced)warning=marks<2?'Phao chìm thấp: giảm chì hoặc chọn phao sức nổi lớn hơn.':'Phao nổi cao: tăng chì để đọc tín hiệu rõ hơn.';
  return {
    marks,visibleMarks,balanced,sensitivity,contact,hookDepth,lead,buoyancy:shape.capacity,
    effectiveLoad,warning,requiresCalibration:true,calibrationPossible,
    bottomSupport,currentLoad,loadPerMark,bodyImmersion:clamp(immersion/shape.bodyHeight,0,1)
  };
}

/** Find the lead closest to the requested equilibrium, including submerged bait and bottom support. */
export function balancedLead(player,{bottomDepth=null,current=0,targetMarks=4}={}){
  if(!usesFloat(getRod(player?.rod)))return clamp(finiteOr(player?.rig?.lead,1.08),.4,3.5);
  const target=clamp(finiteOr(targetMarks,4),0,MARK_COUNT);
  const stateAt=lead=>floatState({...player,rig:{...player.rig,lead}},{bottomDepth,current});
  let low=.4,high=3.5;
  const minimum=stateAt(low).marks,maximum=stateAt(high).marks;
  if(target>=minimum)return low;
  if(target<=maximum)return Math.abs(minimum-target)<=Math.abs(maximum-target)?low:high;
  for(let iteration=0;iteration<36;iteration++){
    const middle=(low+high)/2;
    if(stateAt(middle).marks>target)low=middle;else high=middle;
  }
  return +clamp((low+high)/2,.4,3.5).toFixed(2);
}
