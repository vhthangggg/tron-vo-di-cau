import {ACCESSORIES, BAITS, RODS, TECHNIQUES, acceptsBait, getBait, getMap, getRod, loadoutStats, slotItem, usesFloat, usesReel} from './content.js';

// These are deliberately modest gameplay ratings, not a manufacturer's breaking-load chart.
// Separate leader and hook dimensions keep an old accessory ID valid as the catalog grows.
export const RIG_OPTIONS = Object.freeze({
  leaders: Object.freeze([
    Object.freeze({id:'leader_012', name:'Thẻo mảnh 0,12 mm', diameterMm:.12, strengthKg:.9}),
    Object.freeze({id:'leader_016', name:'Thẻo cơ bản 0,16 mm', diameterMm:.16, strengthKg:1.6}),
    Object.freeze({id:'leader_020', name:'Thẻo 0,20 mm', diameterMm:.20, strengthKg:2.5}),
    Object.freeze({id:'leader_025', name:'Thẻo 0,25 mm', diameterMm:.25, strengthKg:3.8}),
    Object.freeze({id:'leader_030', name:'Thẻo khỏe 0,30 mm', diameterMm:.30, strengthKg:5.4})
  ]),
  hooks: Object.freeze([
    Object.freeze({size:2, name:'Lưỡi số 2 · cá nhỏ'}),
    Object.freeze({size:4, name:'Lưỡi số 4 · cơ bản'}),
    Object.freeze({size:6, name:'Lưỡi số 6 · cá vừa'}),
    Object.freeze({size:8, name:'Lưỡi số 8 · cá lớn'}),
    Object.freeze({size:10, name:'Lưỡi số 10 · mồi lớn'})
  ]),
  leaderLengths: Object.freeze([.15,.25,.4,.6]),
  sinkerDistances: Object.freeze([.1,.25,.45])
});

export const RIG_DEFAULTS = Object.freeze({leaderMm:.16, leaderLength:.25, hookSize:4, sinkerDistance:.25});

const LINE_SPECS = Object.freeze({
  line_basic:{diameterMm:.15,strengthKg:.5,material:'Chỉ may'},
  line18:{diameterMm:.20,strengthKg:3.5,material:'Nylon'},
  fluoro:{diameterMm:.26,strengthKg:3.6,material:'Fluorocarbon'},
  braid:{diameterMm:null,peSize:1,strengthKg:7.5,material:'PE'},
  line_copolymer:{diameterMm:.20,strengthKg:4.2,material:'Co-polymer'},
  leader12:{diameterMm:.12,strengthKg:.9,material:'Nylon'},
  leader16:{diameterMm:.16,strengthKg:1.6,material:'Nylon'}
});
const RIG_FIELDS = Object.freeze(['depth','lead','leaderMm','leaderLength','hookSize','sinkerDistance']);
const finiteOr = (value,fallback) => Number.isFinite(value)?value:fallback;
const isRecord = value => !!value&&typeof value==='object'&&!Array.isArray(value);

/** Catalog measurements shared by the shop and rig summary; values are gameplay ratings. */
export function getEquipmentSpecs(kind,id){
  const item=(kind==='rod'?RODS:kind==='bait'?BAITS:ACCESSORIES).find(item=>item.id===id);
  if(!item)return [];
  const row=(key,label,value,unit='',digits=1)=>({key,label,value,unit,digits});
  if(kind==='rod')return [row('power','Sức cần',item.power)];
  if(kind==='bait')return [row('mass','Tải mồi',item.mass,'g',2),row('amount','Phần / gói',item.amount,'',0)];
  if(item.slot==='line'){
    const spec=LINE_SPECS[id]||LINE_SPECS.line_basic;
    return [spec.peSize?row('peSize','Cỡ PE',spec.peSize,'#'):row('diameter','Đường kính',spec.diameterMm,'mm',2),row('strength','Tải dây (game)',spec.strengthKg,'kg'),row('power','Thêm sức bộ',item.power),row('grace','Chịu lực đỏ',.75+item.grace,'giây',2)];
  }
  if(item.slot==='hook')return [row('bite','Nhịp giật',2.8+item.bite,'giây'),row('slack','Chịu dây chùng',2+item.slack,'giây')];
  if(item.slot==='float')return [row('capacity','Sức nổi',item.capacity,'g'),row('stability','Giảm lực nước',item.stability*100,'%',0)];
  if(item.slot==='reel')return [row('power','Thêm sức bộ',item.power),row('speed','Dẫn cá nhanh hơn',item.speed*100,'%',0)];
  if(item.slot==='net')return [row('land','Vớt khi sức cá ≤',item.land,'%',0)];
  return [];
}

/** A read-only summary. The existing fight ratings remain available without changing the engine. */
export function getRigStats(player){
  const rod=getRod(player?.rod),bait=getBait(player?.bait),rig=player?.rig||{};
  const safePlayer={...player,equipment:player?.equipment||{}};
  const line=slotItem(safePlayer,'line'),hook=slotItem(safePlayer,'hook');
  const lineSpec=LINE_SPECS[line.id]||LINE_SPECS.line_basic;
  const leaderMm=finiteOr(rig.leaderMm,RIG_DEFAULTS.leaderMm);
  const leaderLength=finiteOr(rig.leaderLength,RIG_DEFAULTS.leaderLength);
  const hookSize=finiteOr(rig.hookSize,RIG_DEFAULTS.hookSize);
  const sinkerDistance=finiteOr(rig.sinkerDistance,RIG_DEFAULTS.sinkerDistance);
  const leader=RIG_OPTIONS.leaders.find(option=>Math.abs(option.diameterMm-leaderMm)<1e-6);
  const leaderStrengthKg=leader?.strengthKg||Math.max(.1,1.6*(leaderMm/.16)**2);
  // Apparent submerged grams: the default hook keeps the legacy 0.06 g hardware allowance.
  const hookMass=.06*(Math.max(1,hookSize)/4)**1.5*(1+(hook.bite||0)*.15);
  return {
    ...loadoutStats(safePlayer),
    technique:rod.tech,usesFloat:usesFloat(rod),usesReel:usesReel(rod),
    mainlineMm:lineSpec.diameterMm,peSize:lineSpec.peSize,mainlineDrag:lineSpec.peSize?1:(lineSpec.diameterMm/.2),mainlineStrengthKg:lineSpec.strengthKg,lineMaterial:lineSpec.material,
    leaderMm,leaderLength,leaderStrengthKg,
    breakingStrengthKg:Math.min(lineSpec.strengthKg,leaderStrengthKg),
    hookSize,hookMass,baitMass:Math.max(0,bait.mass||0),sinkerDistance,
    lead:finiteOr(rig.lead,1.08),depth:finiteOr(rig.depth,1)
  };
}

/** Validates ownership and setup, never rejects a cast merely because the float is badly balanced. */
export function validateRig(player){
  const warnings=[];
  const result=(ok,reason='',extra={})=>({ok,reason,warnings,technique:null,components:{},usesFloat:false,...extra});
  if(!isRecord(player))return result(false,'Bộ câu không hợp lệ.');
  const rod=RODS.find(item=>item.id===player.rod);
  if(!rod||!Array.isArray(player.rods)||!player.rods.includes(rod.id))return result(false,'Bạn chưa có bộ cần này.');
  const technique=TECHNIQUES[rod.tech],float=usesFloat(rod);
  const metadata={technique:rod.tech,usesFloat:float};
  if(!technique)return result(false,'Kỹ thuật câu chưa được hỗ trợ.',metadata);
  const bait=BAITS.find(item=>item.id===player.bait);
  if(!bait||!acceptsBait(rod,bait))return result(false,`${bait?.name||'Mồi'} không hợp ${rod.label.toLocaleLowerCase('vi')}. Chọn lại mồi.`,metadata);
  if(bait.reusable&&bait.id!=='lure'&&!(player.baits?.[bait.id]>0))return result(false,'Bạn chưa sở hữu mồi giả này.',metadata);
  if(player.equipment!==undefined&&!isRecord(player.equipment))return result(false,'Thông tin trang bị không hợp lệ.',metadata);
  if(player.rig!==undefined&&!isRecord(player.rig))return result(false,'Thông số bộ câu không hợp lệ.',metadata);

  const components={rod:rod.id,bait:bait.id,line:null,hook:null,float:null,reel:null};
  const slots=['line','hook',...(float?['float']:[]),...(usesReel(rod)?['reel']:[])];
  for(const slot of slots){
    const explicit=player.equipment?.[slot];
    const item=explicit===undefined?slotItem(player,slot):ACCESSORIES.find(item=>item.id===explicit&&item.slot===slot);
    if(!item)return result(false,`Thiếu hoặc sai ${slot==='line'?'dây trục':slot==='hook'?'lưỡi':slot==='float'?'phao':'máy câu'}.`,{...metadata,components});
    // Every old save has the free starter accessories, even before equipment was stored explicitly.
    if(item.price>0&&!player.accessories?.includes(item.id))return result(false,`Bạn chưa sở hữu ${item.name.toLocaleLowerCase('vi')}.`,{...metadata,components});
    components[slot]=item.id;
  }
  const rig=player.rig||{};
  const fields=[
    ['leaderMm',.10,.45,'Đường kính thẻo phải từ 0,10 đến 0,45 mm.'],
    ['leaderLength',.10,1.5,'Thẻo phải dài từ 0,10 đến 1,50 m.'],
    ['hookSize',1,12,'Cỡ lưỡi phải là số nguyên từ 1 đến 12.'],
    ['sinkerDistance',.05,1.5,'Khoảng cách chì đến lưỡi phải từ 0,05 đến 1,50 m.']
  ];
  for(const [field,min,max,reason] of fields){
    const value=rig[field];
    if(value!==undefined&&(!Number.isFinite(value)||value<min||value>max||(field==='hookSize'&&!Number.isInteger(value))))return result(false,reason,{...metadata,components});
  }
  if(rod.tech!=='lure'&&rig.depth!==undefined&&(!Number.isFinite(rig.depth)||rig.depth<.4||rig.depth>getMap(player.map).maxDepth))return result(false,'Độ sâu mồi vượt giới hạn của điểm câu.',{...metadata,components});
  if(float&&rig.lead!==undefined&&(!Number.isFinite(rig.lead)||rig.lead<.4||rig.lead>3.5))return result(false,'Lượng chì phải từ 0,40 đến 3,50 g.',{...metadata,components});

  const stats=getRigStats(player);
  if(Number.isFinite(stats.mainlineMm)&&stats.leaderMm>stats.mainlineMm)warnings.push('Thẻo dày hơn dây trục; khi mắc đáy có thể đứt dây trục trước.');
  if(stats.hookSize<=2&&stats.baitMass>=.16)warnings.push('Mồi lớn trên lưỡi nhỏ có thể che mũi lưỡi, khó đóng cá.');
  if(stats.hookSize>=8&&stats.baitMass<=.08)warnings.push('Lưỡi lớn với mồi nhỏ: cá nhỏ dễ rỉa mà chưa ngậm hết lưỡi.');
  if(rod.tech!=='lure'&&stats.sinkerDistance>=stats.depth)warnings.push('Chì gần phao hơn mồi; bộ câu dễ bị dòng nước kéo lệch.');
  components.leader={diameterMm:stats.leaderMm,length:stats.leaderLength};
  components.sinker={mass:stats.lead,distance:stats.sinkerDistance};
  components.hookSize=stats.hookSize;
  return result(true,'',{...metadata,components});
}

/** Accepts additive presets and older flat calibration records, without touching the current setup. */
export function validatePreset(player,preset){
  const failed=reason=>({ok:false,reason,warnings:[],technique:null,components:{},usesFloat:false});
  if(!isRecord(player)||!isRecord(preset))return failed('Bộ câu đã lưu không hợp lệ.');
  for(const field of ['rig','calibration','equipment'])if(preset[field]!==undefined&&!isRecord(preset[field]))return failed('Thông số bộ câu đã lưu không hợp lệ.');
  const flat=Object.fromEntries(RIG_FIELDS.filter(field=>preset[field]!==undefined).map(field=>[field,preset[field]]));
  const rig={...RIG_DEFAULTS,...player.rig,...preset.calibration,...preset.rig,...flat};
  const equipment={...player.equipment,...preset.equipment};
  const candidate={...player,rod:preset.rod??player.rod,bait:preset.bait??player.bait,rig,equipment};
  const validation=validateRig(candidate);
  if(preset.technique!==undefined&&preset.technique!==validation.technique)return {...validation,ok:false,reason:'Kỹ thuật lưu không khớp với cần.'};
  return {...validation,rig,equipment,rod:candidate.rod,bait:candidate.bait};
}
