import {sampleSpecimenWeight} from './species-physics.js';
import {pointInPolygon} from './scene-geometry.js';
import {catchRemark,getContainer} from './catch-fate.js';
import {BAG_TYPES,ensureInventory,syncInventory,inventoryFor,carriedBaitCount,validateDeparture,transferGear,transferBait,swapCarriedRod,bagInventory} from './inventory.js';
import {applyTransaction,nextTransactionId} from './economy.js';
import {mountBait,resolveBait,gatherBait,GATHER_SOURCES} from './bait-system.js';
import {keepCatch,canStoreCatch,containerUsage,shipHome} from './catch-inventory.js';
import {advanceTutorial,claimTutorial,STARTER_STEPS} from './tutorial.js';
import {floatState,balancedLead as physicsLead} from './rig-physics.js';
import {validateRig,validatePreset,getRigStats} from './equipment.js';
import {fishBehavior,snagChance,castHabitat} from './water-world.js';
import {fishFightProfile} from './fight-physics.js';
import {FISH,MAPS,RODS,BAITS,BAGS,ACCESSORIES,LESSONS,getMap,getRod,getBait,getFish,getBag,usesFloat,usesReel,acceptsBait,loadoutStats} from './content.js';
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export const FIGHT_ZONE=Object.freeze({min:30,max:76,red:90});
export const NO_BITE_HINT='Cá chưa cắn. Có thể vị trí hoặc mồi chưa hợp, hay hôm nay cá ít hoạt động. Thử đổi vị trí, đổi mồi, dùng thẻo nhỏ hơn hoặc về chơi với vợ.';
export function seededRandom(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=Math.imul(n^(n>>>15),1|n);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}
export function floatMarks(player){if(player.systems?.flags?.rig!==false)return floatState(player).visibleMarks;if(!usesFloat(getRod(player.rod)))return 0;return clamp(Math.round((loadoutStats(player).capacity-player.rig.lead-.06-getBait(player.bait).mass)/.045),0,8);}
export function balancedLead(player){return player.systems?.flags?.rig!==false?physicsLead(player):+clamp(loadoutStats(player).capacity-.06-getBait(player.bait).mass-4*.045,.4,3.5).toFixed(2);}
export function rigError(p){
  if(!p.rods.includes(p.rod))return 'Bạn chưa có bộ cần này.';
  const r=getRod(p.rod),b=getBait(p.bait);
  if(!BAITS.some(x=>x.id===p.bait)||!acceptsBait(r,b))return `${b.name} không hợp ${r.label.toLocaleLowerCase('vi')}. Chọn mồi tại bàn đồ.`;
  if(b.reusable&&!(p.baits[b.id]>0)&&b.id!=='lure')return 'Bạn chưa sở hữu mồi giả này.';
  if(p.systems?.flags?.rig!==false){const result=validateRig(p);if(!result.ok)return result.reason;}
  return '';
}
function applyBaitResolution(player,mounted,result){
 const inv=ensureInventory(player);
 if(result.consumed){if((inv.carried.baits[mounted.id]||0)>0)inv.carried.baits[mounted.id]--;else if(player.systems.flags.inventory===false&&(inv.stored.baits[mounted.id]||0)>0)inv.stored.baits[mounted.id]--;else return false;}
 player.baits=result.stock;player.systems.mountedBait=result.mounted;return true;
}
export class FishingGame{
  constructor(player,{seed=Date.now(),onChange=()=>{}}={}){this.player=player;ensureInventory(player);player.homeFish??=[];player.cooked??=0;this.random=seededRandom(seed);this.onChange=onChange;this.phase=player.pending?'landed':'idle';this.time=0;this.elapsed=0;this.paused=false;this.pulling=false;this.retrieving=false;this.deadlineReached=false;this.quietHint=false;this.quietHintOffered=false;this.message='Chọn điểm câu. Bắt đầu bằng giun và cần tre.';this.spot=0;const savedSpot=this.map.spots.findIndex((s,i)=>(s.id||String(i))===player.systems.trip?.spotId);if(savedSpot>=0)this.spot=savedSpot;this.castId=0;this.castTarget=null;this.castHabitat=null;this.castFlight=null;this.force=0;this.tracking=false;this.aim={x:.5,y:.5};this.fishPosition={x:.5,y:.5};this.controlRandom=seededRandom(seed^0xAC51);this.environmentRandom=seededRandom(seed^0xE872);this.hooked=null;this.target=null;this.fish=[];this.populate();}
  changed(){this.onChange(this);}
  get map(){return getMap(this.player.map);}
  get rod(){return getRod(this.player.rod);}
  get stats(){const stats=loadoutStats(this.player);if(this.enabled('rig')){const sensitivity=this.float.sensitivity;if(!this.float.balanced||this.float.contact==='overdepth')stats.biteWindow*=Math.max(.35,sensitivity);const diameter=this.player.rig.leaderMm??.16;stats.power*=clamp((diameter/.16)**1.2,.5,1.3);stats.baitApproach*=clamp((.16/diameter)**.35,.75,1.2);}return stats;}
  get spotData(){return this.map.spots[this.spot];}
  get busy(){return !['idle','failed'].includes(this.phase);}
  get atHome(){return !this.player.systems?.trip?.active;}
  get float(){return floatState(this.player,{bottomDepth:this.spotData?.depth,current:this.map.current});}
  enabled(key){return this.player.systems?.flags?.[key]!==false;}
  event(name,payload={}){if(this.enabled('tutorial'))this.player.systems.tutorial=advanceTutorial(this.player.systems.tutorial||{},name,payload);}
  error(message){this.message=message;this.changed();return false;}
  transact(id,mutate){const result=applyTransaction(this.player,id,draft=>{if(mutate(draft)===false)return false;syncInventory(draft);return true;});return result.ok;}
  beginTrip(){
    if(this.player.pending)return this.error('Cho cá vào rọ hoặc thả cá trước khi đi câu.');
    const rig=rigError(this.player),bag=this.enabled('inventory')?validateDeparture(this.player):{ok:true};
    if(rig||!bag.ok)return this.error(rig||bag.reason);
    if(!this.atHome)return true;
    const id=nextTransactionId(this.player,'trip');
    this.player.systems.trip={id,mapId:this.player.map,spotId:this.spotData.id||String(this.spot),active:true};
    this.event('DEPARTURE_VALIDATED',{valid:true});this.event('RIG_VALIDATED',{valid:true});
    if(!usesFloat(this.rod))this.event('RIG_CALIBRATED',{valid:true,usesFloat:false});
    this.event('SPOT_SELECTED',{valid:true,inWater:true});this.changed();return true;
  }
  returnHome(){
    if(['casting','waiting','nibble','bite','fight','snag'].includes(this.phase))return this.error('Thu cần trước khi về nhà.');
    const moved=this.player.keptFish.length;
    const transfer=shipHome(this.player.keptFish,this.player.homeFish);
    if(!transfer.ok)return this.error('Không chuyển được cá về nhà; cá vẫn còn nguyên trong rọ.');
    const trip=this.player.systems.trip;
    if(!this.transact(trip?'return:'+trip.id:nextTransactionId(this.player,'return'),p=>{p.homeFish=transfer.home.map(c=>({...c,status:'home'}));p.keptFish=[];p.systems.trip=null;return true;}))return false;
    if(trip)this.event('TRIP_COMPLETED',{completed:true,returned:moved>0,handled:false});
    this.message=`Đã về nhà${moved?' với '+moved+' con cá':''}. Bán, nấu ăn hoặc nịnh vợ tại đây.`;this.changed();return true;
  }
  populate(){
    const species=FISH.filter(f=>f.maps.includes(this.player.map));
    this.fish=[];for(let s=0;s<this.map.spots.length;s++)for(let j=0;j<species.length*2;j++){
      const def=species[j%species.length],spot=this.map.spots[s];
      const max=Math.min(def.max,s===0?Math.max(def.min+.15,.8):def.max);
      const depth=def.depth==='bottom'?spot.depth:def.depth==='surface'?.4:spot.depth*(def.depth==='cover'?.7:.55);
      this.fish.push({id:`${this.player.map}-${s}-${j}-${this.castId}`,fishId:def.id,spot:s,x:clamp(spot.x+(this.random()-.5)*.2,.08,.92),y:clamp(spot.y+(this.random()-.5)*.09,.48,.82),weight:sampleSpecimenWeight(def,this.random,{cap:max}),depth,temper:this.random(),angle:this.random()*Math.PI*2,suspicion:0,caught:false});
    }
  }
  selectMap(id){if(this.busy||!this.player.maps.includes(id))return false;this.player.map=id;this.spot=0;this.resetCastTarget();this.phase='idle';this.target=null;this.hooked=null;this.pulling=false;this.retrieving=false;this.signal='quiet';this.player.rig.depth=this.spotData.depth;this.populate();if(!this.atHome){this.player.systems.trip.mapId=id;this.player.systems.trip.spotId=this.spotData.id||String(this.spot);}this.message=`Đã đến ${this.map.name}. Chọn mồi và điểm câu.`;this.changed();return true;}
  selectSpot(i){if(this.busy||!this.map.spots[i])return false;this.spot=i;this.resetCastTarget();this.player.rig.depth=this.spotData.depth;if(!this.atHome)this.player.systems.trip.spotId=this.spotData.id||String(i);this.message=`${this.spotData.name}: sâu ${this.spotData.depth.toFixed(1)} m. Chỉnh tầng mồi nếu tìm cá giữa nước.`;this.event('SPOT_SELECTED',{valid:true,inWater:true});this.changed();return true;}
  equip(kind,id){
    if(this.busy)return false;
    const current=this.player;
    const def=kind==='rod'?RODS.find(r=>r.id===id):kind==='bait'?BAITS.find(b=>b.id===id):ACCESSORIES.find(a=>a.id===id&&a.slot===kind);
    if(!def)return false;
    if(kind==='rod'&&!current.rods.includes(id)||kind==='bait'&&(!acceptsBait(this.rod,def)||!(current.baits[id]>0))||!['rod','bait'].includes(kind)&&(!current.accessories.includes(id)||kind==='reel'&&!usesReel(this.rod)||kind==='float'&&!usesFloat(this.rod)))return false;
    const home=this.atHome,tracked=this.enabled('inventory');
    if(tracked&&!home){const inv=inventoryFor(current);if(kind==='rod'&&!inv.carried.rods.includes(id)||kind==='bait'&&!(inv.carried.baits[id]>0)||!['rod','bait'].includes(kind)&&!inv.carried.accessories.includes(id))return this.error('Đồ này đang cất ở nhà. Chỉ đổi đồ đã mang theo khi ở bờ.');}
    if(tracked&&!home&&kind==='rod'){
      const candidate={...current,rod:id,bait:acceptsBait(def,getBait(current.bait))?current.bait:def.tech==='lure'?'lure':'worm'};
      const ready=validateDeparture(candidate);if(!ready.ok)return this.error(ready.reason);
    }
    const ok=this.transact(nextTransactionId(current,'equip'),p=>{
      const inv=ensureInventory(p);
      if(kind==='rod'){
        if(tracked&&home&&inv.stored.rods.includes(id)){
          const next=inv.carried.rods.includes(p.rod)?swapCarriedRod(inv,p,p.rod,id):transferGear(inv,p,'rods',id);
          if(!next)return false;p.systems.inventory=next;
        }
        p.rod=id;
        if(!acceptsBait(def,getBait(p.bait)))p.bait=def.tech==='lure'?'lure':'worm';
        if(def.tech==='lure'&&!p.baits.lure)return false;
      }else if(kind==='bait')p.bait=id;
      else{
        if(id==='leader12'||id==='leader16')p.rig.leaderMm=def.diameter;
        if(tracked&&home&&inv.stored.accessories.includes(id)){
          const previous=p.equipment[kind];p.equipment[kind]=id;
          inv.stored.accessories=inv.stored.accessories.filter(x=>x!==id);inv.carried.accessories.push(id);
          // Stow the replaced component so an upgrade never overfills loose slots.
          if(previous&&previous!==id){inv.carried.accessories=inv.carried.accessories.filter(x=>x!==previous);if(!inv.stored.accessories.includes(previous))inv.stored.accessories.push(previous);}
        }else p.equipment[kind]=id;
      }
      const mounted=p.systems.mountedBait;
      if(mounted&&mounted.id!==p.bait){const result=resolveBait(p.baits,mounted,'replaced');if(!result)return false;if(!applyBaitResolution(p,mounted,result))return false;}
      syncInventory(p);
      if(tracked&&home){
        const bag=p.systems.inventory,qty=bag.stored.baits[p.bait]||0;
        if(qty){
          const typeLimit=BAG_TYPES[bag.bagId].baitTypes;
          while(Object.values(bag.carried.baits).filter(n=>n>0).length>=typeLimit){const other=Object.keys(bag.carried.baits).find(x=>x!==p.bait&&bag.carried.baits[x]>0);if(!other)return false;bag.stored.baits[other]=(bag.stored.baits[other]||0)+bag.carried.baits[other];bag.carried.baits[other]=0;}
          bag.carried.baits[p.bait]=(bag.carried.baits[p.bait]||0)+qty;bag.stored.baits[p.bait]=0;
        }
      }
      if(tracked&&!home&&!validateDeparture(p).ok)return false;
      if(usesFloat(getRod(p.rod)))p.rig.lead=balancedLead(p);
      return true;
    });
    if(!ok)return this.error('Không thể lắp đồ. Kiểm tra túi, quyền sở hữu và mồi mang theo.');
    this.event('RIG_VALIDATED',{valid:!rigError(current)});if(!usesFloat(this.rod))this.event('RIG_CALIBRATED',{valid:true,usesFloat:false});
    this.message=`Đã lắp ${def.name}.`;this.changed();return true;
  }
  setRig(part,value){
    if(this.busy||!Number.isFinite(value))return false;
    const bounds={depth:[.4,this.map.maxDepth],lead:[.4,3.5],leaderMm:[.10,.45],leaderLength:[.10,1.5],hookSize:[1,12],sinkerDistance:[.05,1.5]};
    if(!bounds[part]||value<bounds[part][0]||value>bounds[part][1]||(part==='hookSize'&&!Number.isInteger(value))||(part==='lead'&&!usesFloat(this.rod))||(part==='depth'&&this.rod.tech==='lure'))return false;
    this.player.rig[part]=value;this.event('RIG_VALIDATED',{valid:!rigError(this.player)});
    if(usesFloat(this.rod)&&this.float.balanced)this.event('FLOAT_CALIBRATED',{balanced:true});this.changed();return true;
  }
  balance(){if(this.busy||!usesFloat(this.rod))return false;this.player.rig.lead=physicsLead(this.player,{bottomDepth:this.spotData.depth,current:this.map.current});const state=this.float;this.event('FLOAT_CALIBRATED',{balanced:state.balanced});this.message=`Phao đã cân ${state.visibleMarks} vạch; ${state.contact==='suspended'?'mồi lơ lửng':'mồi chạm đáy'}.`;this.changed();return true;}
  moveGear(kind,id,to,txId){
    if(!this.atHome||this.busy)return this.error('Chuyển đồ tại nhà sau khi kết thúc lượt câu.');
    if(to==='stored'&&(kind==='rods'&&id===this.player.rod||kind==='accessories'&&Object.values(this.player.equipment).includes(id)))return this.error('Đồ đang lắp phải được thay bằng món khác trước khi cất.');
    const next=transferGear(ensureInventory(this.player),this.player,kind,id,to);if(!next)return this.error('Túi đã đầy hoặc món đồ không ở vị trí này.');
    if(!this.transact(txId||nextTransactionId(this.player,'transfer'),p=>{p.systems.inventory=next;return true;}))return false;this.message=to==='stored'?'Đã cất đồ vào kho nhà.':'Đã bỏ đồ vào túi.';this.changed();return true;
  }
  moveBait(id,count,to,txId){
    if(!this.atHome||this.busy)return this.error('Chuyển mồi tại nhà sau khi kết thúc lượt câu.');
    if(to==='stored'&&this.player.systems.mountedBait?.id===id){const carried=carriedBaitCount(this.player,id);if(carried-count<1)return this.error('Còn một phần mồi đang mắc trên lưỡi. Thay mồi trước khi cất hết.');}
    const next=transferBait(ensureInventory(this.player),this.player,id,count,to);if(!next)return this.error('Không đủ mồi ở nguồn hoặc túi đã đủ loại mồi.');
    if(!this.transact(txId||nextTransactionId(this.player,'transfer-bait'),p=>{p.systems.inventory=next;return true;}))return false;this.message='Đã chuyển mồi; tổng số mồi vẫn giữ nguyên.';this.changed();return true;
  }
  selectBag(id){
    if(!this.atHome||this.busy||!BAG_TYPES[id]||!this.player.systems.bags?.includes(id))return false;
    const inv=bagInventory(this.player,id);if(!inv)return this.error('Túi nhỏ hơn hành trang hiện có. Cất bớt đồ vào kho trước khi đổi túi.');
    this.player.systems.inventory=inv;
    this.message=`Đang dùng ${BAG_TYPES[id].name}.`;this.changed();return true;
  }
  saveRigPreset(name){
    if(this.busy||!name?.trim()||rigError(this.player))return false;
    if(this.player.systems.rigPresets.length>=12)return this.error('Đã lưu 12 bộ câu. Xóa một bộ trước khi lưu thêm.');
    const p=this.player,id=nextTransactionId(p,'rig');p.systems.rigPresets.push({id,name:name.trim().slice(0,40),rod:p.rod,bait:p.bait,equipment:{...p.equipment},rig:{...p.rig}});
    this.message='Đã lưu bộ câu để dùng lần sau.';this.changed();return true;
  }
  loadRigPreset(id){
    if(this.busy||!this.atHome)return false;
    const preset=this.player.systems.rigPresets.find(p=>p.id===id),valid=preset&&validatePreset(this.player,preset);if(!valid?.ok)return this.error(valid?.reason||'Bộ câu không còn hợp lệ.');
    const ok=this.transact(nextTransactionId(this.player,'load-rig'),p=>{
      const previousRod=p.rod,previousEquipment={...p.equipment},bag=ensureInventory(p);
      if(bag.stored.rods.includes(valid.rod)){
        bag.stored.rods=bag.stored.rods.filter(x=>x!==valid.rod);
        if(bag.carried.rods.length>=BAG_TYPES[bag.bagId].rods){bag.carried.rods=bag.carried.rods.filter(x=>x!==previousRod);bag.stored.rods.push(previousRod);}
        bag.carried.rods.push(valid.rod);
      }
      p.rod=valid.rod;p.bait=valid.bait;p.equipment={...valid.equipment};p.rig={...valid.rig};
      for(const [slot,item] of Object.entries(p.equipment)){
        if(!bag.carried.accessories.includes(item)){bag.stored.accessories=bag.stored.accessories.filter(x=>x!==item);bag.carried.accessories.push(item);}
        const old=previousEquipment[slot];if(old&&old!==item){bag.carried.accessories=bag.carried.accessories.filter(x=>x!==old);if(!bag.stored.accessories.includes(old))bag.stored.accessories.push(old);}
      }
      if(p.systems.mountedBait?.id!==p.bait&&p.systems.mountedBait){const result=resolveBait(p.baits,p.systems.mountedBait,'replaced');if(!result)return false;if(!applyBaitResolution(p,p.systems.mountedBait,result))return false;syncInventory(p);}
      const inv=p.systems.inventory,qty=inv.stored.baits[p.bait]||0;
      if(qty){if(!(inv.carried.baits[p.bait]>0)&&Object.values(inv.carried.baits).filter(n=>n>0).length>=BAG_TYPES[inv.bagId].baitTypes){const old=Object.keys(inv.carried.baits).find(id=>id!==p.bait&&inv.carried.baits[id]>0);inv.stored.baits[old]=(inv.stored.baits[old]||0)+inv.carried.baits[old];inv.carried.baits[old]=0;}inv.carried.baits[p.bait]=(inv.carried.baits[p.bait]||0)+qty;inv.stored.baits[p.bait]=0;}
      return !rigError(p)&&(!this.enabled('inventory')||validateDeparture(p).ok);
    });
    if(!ok)return this.error('Không lắp được bộ đã lưu. Đồ hiện tại vẫn giữ nguyên.');
    this.event('RIG_VALIDATED',{valid:true});this.message='Đã lắp bộ câu đã lưu.';this.changed();return true;
  }
  removeRigPreset(id){if(this.busy||!this.atHome)return false;this.player.systems.rigPresets=this.player.systems.rigPresets.filter(p=>p.id!==id);this.changed();return true;}
  resetCastTarget(){this.castTarget=null;this.castHabitat=null;this.baitPoint=null;this.castFlight=null;}
  get defaultCastPoint(){return this.spotData.video?{x:.5,y:.65}:{x:this.spotData.x,y:this.spotData.y};}
  setCastTarget(x,y){
    if(this.busy||this.paused||this.deadlineReached||!Number.isFinite(x)||!Number.isFinite(y))return false;
    if(this.spotData.waterZone&&!pointInPolygon(x,y,this.spotData.waterZone))return false;
    this.event('SPOT_SELECTED',{valid:true,inWater:true});this.castTarget={x:clamp(x,0,1),y:clamp(y,0,1)};this.castHabitat=castHabitat(this.spotData,this.castTarget);const h=this.castHabitat;this.message=h.cover>.45?'Sát bèo/cỏ: rô, trê dễ vào hơn nhưng dễ mắc.':h.far>.68?'Nước xa và sâu hơn: cơ hội gặp cá lớn tăng.':h.near>.72?'Sát bờ: nhiều cá nhỏ, dễ tiếp cận.':'Nước thoáng: hợp chép, trắm và cá đi ăn ngoài.';this.changed();return true;
  }
  cast(){
    if(this.busy||this.paused||this.deadlineReached)return false;
    const error=rigError(this.player);if(error){this.message=error;this.changed();return false;}
    if(!getBait(this.player.bait).reusable&&!(this.player.baits[this.player.bait]>0)){this.message='Hết mồi. Đào giun ở bàn đồ hoặc mua mồi tại cửa hàng.';this.changed();return false;}
    if(this.enabled('inventory')&&carriedBaitCount(this.player,this.player.bait)<1)return this.error('Mồi này ở kho nhà. Bỏ mồi vào túi trước khi ra bờ.');
    if(!this.beginTrip())return false;
    if(this.enabled('bait')){
      if(!this.player.systems.mountedBait){const mountId=nextTransactionId(this.player,'bait');this.player.systems.mountedBait=mountBait(this.player.baits,this.player.bait,{mountId});if(!this.player.systems.mountedBait)return false;}
    }else if(!getBait(this.player.bait).reusable){this.player.baits[this.player.bait]--;syncInventory(this.player);}
    this.player.casts++;this.castId++;this.phase='casting';this.wait=0;this.quietHint=false;this.quietHintOffered=false;this.stageTime=0;this.target=null;this.hooked=null;this.retrieving=false;this.releaseHands();this.snagProgress=0;this.snagTriggered=false;
    this.castHabitat=castHabitat(this.spotData,this.castTarget||this.defaultCastPoint);
    this.snagScheduled=this.environmentRandom()<snagChance(this.map,this.spot,this.player.rig.depth,this.rod.tech,this.castHabitat);this.snagAt=.85+this.environmentRandom()*.85;
    this.baitPoint={...(this.castTarget||this.defaultCastPoint)};this.castFlight={t:0,duration:.72,start:{x:.16,y:.72},end:{...this.baitPoint}};this.signal='quiet';this.message='Đang vung cần…';this.changed();return true;
  }
  habitatAffinity(def,f){
    const h=this.castHabitat||castHabitat(this.spotData,this.baitPoint),id=def.id;
    let score=1;
    if(['fish_03','fish_05','fish_13','fish_14','fish_27'].includes(id))score*=1+h.cover*2.2;
    if(['fish_01','fish_07','fish_10','fish_31','fish_32'].includes(id))score*=1+h.open*1.55+h.far*.35;
    const weightNorm=clamp((f.weight-def.min)/Math.max(.01,def.max-def.min),0,1);
    score*=.55+(1-Math.abs(weightNorm-h.size))*.9;
    if(h.near>.65&&weightNorm>.55)score*=.38;
    if(h.far>.65&&weightNorm>.6)score*=1.65;
    if(def.fight?.style==='crab'||def.group==='amphibian')score*=1+h.near*2+h.cover;
    return score;
  }
  eligible(f){const def=getFish(f.fishId);return !f.caught&&f.spot===this.spot&&f.suspicion<.6&&def.baits.includes(this.player.bait)&&def.tech.includes(this.rod.tech)&& (this.rod.tech==='lure'||Math.abs(f.depth-this.player.rig.depth)<.65);}
  pickTarget(candidates){
    const weighted=candidates.map(f=>({f,w:this.habitatAffinity(getFish(f.fishId),f)*(getFish(f.fishId).baitWeights?.[this.player.bait]||1)/(Math.hypot(f.x-this.baitPoint.x,f.y-this.baitPoint.y)+.07)}));
    const total=weighted.reduce((n,v)=>n+v.w,0);let roll=this.random()*total;
    for(const v of weighted){roll-=v.w;if(roll<=0)return v.f;}return weighted[0]?.f||null;
  }
  step(dt){
    if(this.paused||this.deadlineReached)return;
    dt=clamp(dt,0,.1);this.time+=dt;this.elapsed+=dt;
    if(this.player.settings.deadline&&this.elapsed>=this.player.settings.deadline){this.deadlineReached=true;this.releaseHands();if(['casting','waiting','nibble','bite','fight','snag'].includes(this.phase)){if(this.phase==='fight'||this.phase==='snag')this.consumeMounted('lost');this.phase='failed';this.target=null;this.castFlight=null;this.signal='quiet';}this.message='Đến giờ về nhà. Kết thúc buổi câu hoặc bắt đầu một buổi mới.';this.changed();return;}
    for(const f of this.fish){if(f.caught)continue;f.suspicion=Math.max(0,f.suspicion-dt*.025);if(f!==this.target){f.angle+=(this.random()-.5)*dt;f.x=clamp(f.x+Math.cos(f.angle)*dt*.004,.08,.92);f.y=clamp(f.y+Math.sin(f.angle)*dt*.002,.47,.82);}}
    if(this.phase==='casting')this.stepCastFlight(dt);
    if(['waiting','nibble','bite'].includes(this.phase))this.stepBait(dt);
    if(this.phase==='fight')this.stepFight(dt);
    else if(this.phase==='snag')this.stepSnag(dt);
  }
  stepCastFlight(dt){
    if(!this.castFlight){this.phase='waiting';return;}
    this.castFlight.t=Math.min(1,this.castFlight.t+dt/this.castFlight.duration);
    if(this.castFlight.t>=1){
      this.castFlight=null;this.phase='waiting';this.wait=0;this.stageTime=0;
      this.message=this.rod.tech==='lure'?'Mồi đã xuống nước. Bật thu mồi để cá chú ý.':usesFloat(this.rod)?'Phao đã chạm nước. Quan sát tín hiệu.':'Mồi đã xuống đáy. Chờ đầu cần cong rõ rồi giật.';
      this.event('CAST_COMPLETED',{valid:true,inWater:true});this.changed();
    }
  }
  stepBait(dt){
    this.wait+=dt;this.stageTime+=dt;
    if(this.phase==='waiting'&&this.snagScheduled&&!this.snagTriggered&&this.wait>=this.snagAt){this.beginSnag();return;}
    if(this.phase==='waiting'){
      this.signal=(Math.sin(this.time*1.8)>.96)?'wind':'quiet';
      if(this.wait>35&&!this.quietHintOffered){this.quietHint=true;this.quietHintOffered=true;this.message=NO_BITE_HINT;this.changed();}
      if(this.rod.tech==='lure'&&!this.retrieving)return;
      if(this.wait>1.8&&!this.target){
        const candidates=this.fish.filter(f=>this.eligible(f));
        this.target=this.pickTarget(candidates);
      }
      if(this.target){
        const t=this.target,dx=this.baitPoint.x-t.x,dy=this.baitPoint.y-t.y,dist=Math.hypot(dx,dy),speed=(.013+t.temper*.009)*this.stats.baitApproach;
        if(dist>.005){t.x+=dx/dist*Math.min(dist,speed*dt);t.y+=dy/dist*Math.min(dist,speed*dt);}
        else{this.phase='nibble';this.quietHint=false;this.stageTime=0;this.signal='nibble';this.message=this.player.settings.assist?(usesFloat(this.rod)?'Cá đang thăm mồi. Chờ phao chìm rõ.':'Cá đang thăm mồi. Chờ đầu cần cong rõ.'):'Có chuyển động nhẹ dưới mồi.';this.changed();}
      }
    }else if(this.phase==='nibble'){
      this.signal='nibble';
      if(this.stageTime>1.1+this.target.temper*1.2){this.phase='bite';this.stageTime=0;this.signal='bite';this.message=this.player.settings.assist?'Cá đã ngậm mồi — giật cần ngay!':usesFloat(this.rod)?'Phao chìm rõ, dây dịch chuyển.':'Đầu cần cong rõ, dây kéo căng.';this.changed();}
    }else if(this.phase==='bite'&&this.stageTime>this.stats.biteWindow){this.target.suspicion=.7;this.fail('Chậm nhịp: cá đã rỉa hết mồi. Thử lại và giật khi tín hiệu rõ.','eaten');}
  }
  strike(){
    if(this.paused||this.deadlineReached)return false;
    if(this.phase==='bite'&&this.target){
      if(this.enabled('rig')&&this.float.sensitivity<.55&&this.controlRandom()>this.float.sensitivity+.25){this.fail('Phao quá chìm hoặc quá nổi: đọc nhịp chưa chuẩn, cá đã rỉa mồi.','eaten');return false;}
      this.event('BITE_RECOGNIZED',{success:true});this.consumeMounted('eaten');
      this.hooked=this.target;this.behavior=fishBehavior(getFish(this.hooked.fishId));this.fishPosition={x:.5,y:.5};this.velocity={x:0,y:0};this.waypoint={x:.5,y:.5};this.turnAt=0;this.offTarget=0;this.accuracy=0;this.phase='fight';this.fightTime=0;this.energy=100;this.tension=44;this.overload=0;this.slack=0;this.pulling=false;this.surge=false;this.nextSurge=this.behavior.rest+this.controlRandom()*1.5;this.surgeUntil=0;this.signal='hooked';this.message='Đóng lưỡi! Tay trái bám cá, tay phải giữ và kéo lên/xuống để chỉnh lực. Hạ lực khi cá bứt.';this.changed();return true;
    }
    if(['waiting','nibble'].includes(this.phase)){if(this.target)this.target.suspicion=.6;this.fail('Giật sớm: cá chưa ngậm mồi. Rung nhẹ chưa đủ để đóng lưỡi.','lost');}
    return false;
  }
  stepFight(dt){
    this.fightTime+=dt;
    const b=this.behavior,profile=fishFightProfile(getFish(this.hooked.fishId),this.hooked.weight,this.stats.power);
    if(this.fightTime>=this.nextSurge){this.surgeUntil=this.fightTime+.45+(.55+this.controlRandom()*.7)*profile.burstScale;this.nextSurge=this.surgeUntil+b.rest+(1-Math.min(1,profile.burstScale))*2+this.controlRandom()*1.8;}
    this.surge=this.fightTime<this.surgeUntil;
    if(this.fightTime>=this.turnAt){
      this.waypoint={x:.12+this.controlRandom()*.76,y:.12+this.controlRandom()*.76};
      this.turnAt=this.fightTime+b.turn+this.controlRandom()*.65;
    }
    const pos=this.fishPosition,dx=this.waypoint.x-pos.x,dy=this.waypoint.y-pos.y,dist=Math.hypot(dx,dy)||1;
    const speed=b.speed*(this.surge?1.9:1)*(.65+.35*this.energy/100)/Math.max(1,Math.sqrt(this.hooked.weight)*.38);
    const smooth=Math.min(1,dt*(this.surge?5:2.8));
    this.velocity.x+=(dx/dist*speed-this.velocity.x)*smooth;this.velocity.y+=(dy/dist*speed-this.velocity.y)*smooth;
    pos.x=clamp(pos.x+this.velocity.x*dt,.09,.91);pos.y=clamp(pos.y+this.velocity.y*dt,.09,.91);
    this.updateAccuracy();
    this.offTarget=this.accuracy<.28?this.offTarget+dt:Math.max(0,this.offTarget-dt*2);
    const stats=this.stats,ratio=this.hooked.weight*profile.strength/stats.power;
    const target=8+this.force*76+Math.min(23,ratio*14)+this.map.current*10*(1-stats.stability)+(this.surge?b.burst*profile.burstScale*(.55+this.force):0)+(this.tracking?(1-this.accuracy)*15:9);
    this.tension=clamp(this.tension+(target-this.tension)*Math.min(1,dt*3.5),0,100);
    this.overload=this.tension>FIGHT_ZONE.red?this.overload+dt:Math.max(0,this.overload-dt*2);
    this.slack=this.tension<16?this.slack+dt:Math.max(0,this.slack-dt);
    if(this.overload>stats.breakGrace){this.hooked.suspicion=.9;this.fail('Đứt dây: lực cần quá mạnh. Hạ tay phải khi cá bứt.');return;}
    if(this.slack>stats.slackGrace+1){this.hooked.suspicion=.7;this.fail('Tuột lưỡi: thả chùng quá lâu. Giữ một ít lực ở tay phải.');return;}
    if(this.offTarget>6){this.hooked.suspicion=.7;this.fail('Cá thoát: tay trái rời cá quá lâu. Bám theo dấu cá đang chạy.');return;}
    const controlled=this.pulling&&this.tracking&&this.accuracy>.4&&this.force>.15&&this.tension>=FIGHT_ZONE.min&&this.tension<=FIGHT_ZONE.max;
    if(controlled)this.energy=Math.max(0,this.energy-dt*(100/profile.endurance*stats.drain*(.45+this.accuracy*.55)));
    else this.energy=Math.min(100,this.energy+dt*1.1);
    if(this.energy<=stats.landAt)this.land();
  }
  updateAccuracy(){this.accuracy=this.tracking?clamp(1-Math.hypot(this.aim.x-this.fishPosition.x,this.aim.y-this.fishPosition.y)/.3,0,1):0;}
  setTracking(held,x=this.aim.x,y=this.aim.y){
    if(!held){this.tracking=false;this.accuracy=0;return true;}
    if(this.paused||this.deadlineReached||!['waiting','nibble','bite','fight','snag'].includes(this.phase)||!Number.isFinite(x)||!Number.isFinite(y))return false;
    this.tracking=true;this.aim={x:clamp(x,0,1),y:clamp(y,0,1)};this.updateAccuracy();return true;
  }
  holdRod(force=.55){
    if(this.paused||this.deadlineReached||!Number.isFinite(force))return false;
    if(!['fight','snag'].includes(this.phase)&&!this.strike())return false;
    return this.setForce(force,true);
  }
  setForce(value,held=true){
    if(!held){this.pulling=false;this.force=0;return true;}
    if(!Number.isFinite(value)||!['fight','snag'].includes(this.phase)||this.paused||this.deadlineReached)return false;
    this.pulling=true;this.force=clamp(value,0,1);return true;
  }
  setPulling(held){return this.setForce(.55,held);}
  releaseHands(){this.setForce(0,false);this.setTracking(false);}
  ease(){this.setForce(0,false);}
  beginSnag(){
    this.snagTriggered=true;this.snagTime=0;this.snagProgress=0;this.overload=0;this.tension=32;this.target=null;this.retrieving=false;
    this.phase='snag';this.signal='snag';this.fishPosition={x:this.environmentRandom()>.5?.22:.78,y:.5};
    this.message='Mắc đáy! Tay trái bám điểm gỡ, tay phải giữ nhẹ 15–35%. Kéo mạnh sẽ mất lượt.';this.changed();
  }
  stepSnag(dt){
    this.snagTime+=dt;this.updateAccuracy();
    const target=18+this.force*112;this.tension+=(target-this.tension)*Math.min(1,dt*3);
    this.overload=this.force>.65?this.overload+dt:Math.max(0,this.overload-dt);
    if(this.overload>this.stats.breakGrace){this.fail('Mắc đáy: kéo quá mạnh làm đứt dây. Chỉnh tầng mồi hoặc chọn góc bờ thoáng hơn.');return;}
    if(this.snagTime>16){this.fail('Chưa gỡ được mắc đáy. Mồi của lượt này đã mất; bạn có thể thả lại.');return;}
    if(this.tracking&&this.accuracy>.5&&this.pulling&&this.force>=.15&&this.force<=.35)this.snagProgress+=dt/2.4;
    else this.snagProgress=Math.max(0,this.snagProgress-dt*.1);
    if(this.snagProgress>=1){this.phase='waiting';this.signal='quiet';this.wait=0;this.stageTime=0;this.releaseHands();this.message='Đã gỡ khỏi đáy. Mồi còn nguyên trong lượt; tiếp tục chờ cá.';this.changed();}
  }
  toggleRetrieve(){if(['casting','waiting'].includes(this.phase)&&this.rod.tech==='lure')this.retrieving=!this.retrieving;}
  dismissQuietHint(){if(!this.quietHint)return false;this.quietHint=false;this.message='Mồi vẫn dưới nước. Cứ chờ thêm, cá có thể vào sau.';this.changed();return true;}
  consumeMounted(outcome){
    const mounted=this.player.systems.mountedBait;if(!this.enabled('bait')||!mounted)return true;
    const result=resolveBait(this.player.baits,mounted,outcome);if(!result)return false;
    const id='mount:'+mounted.mountId+':'+outcome;
    return this.transact(id,p=>applyBaitResolution(p,mounted,result));
  }
  retrieve(){
    if(this.phase==='snag'){this.fail('Đã bỏ lượt mắc đáy. Mồi trên lưỡi bị mất; đồ nghề vẫn còn.','lost');return;}
    if(['casting','waiting','nibble','bite'].includes(this.phase)){
      this.releaseHands();this.castFlight=null;this.phase='idle';this.target=null;this.retrieving=false;this.quietHint=false;this.signal='quiet';
      this.message=getBait(this.player.bait).reusable?'Đã thu cần. Mồi giả dùng lại.':'Đã thu cần. Mồi còn nguyên trên lưỡi, có thể thả lại.';this.changed();
    }
  }
  fail(message,outcome='lost'){this.consumeMounted(outcome);this.releaseHands();this.castFlight=null;this.phase='failed';this.signal='quiet';this.pulling=false;this.retrieving=false;this.quietHint=false;this.target=null;this.message=message;this.changed();}
  land(){
    const f=this.hooked;f.caught=true;const def=getFish(f.fishId),p=this.player;
    p.serial++;p.pending={id:`catch-${p.serial}`,fishId:f.fishId,weight:f.weight,value:Math.round(def.price*f.weight),mapId:p.map};
    p.catches++;const c=p.collection[f.fishId]||{count:0,best:0};p.collection[f.fishId]={count:c.count+1,best:Math.max(c.best,f.weight)};
    p.pending.status='landed';p.pending.caughtAt=Date.now();this.event('FISH_LANDED',{success:true});this.phase='landed';this.releaseHands();this.message=`Đã đưa ${def.name.toLocaleLowerCase('vi')} lên bờ.`;this.changed();
  }
  resolveCatch(id,decision){
    const p=this.player,c=p.pending,legacy=!this.enabled('catch');
    if(!c||c.id!==id||!(legacy?['sell','release','gift','keep']:['release','keep']).includes(decision))return false;
    if(decision==='keep'){const capacity=canStoreCatch(p.keptFish,c,p.container);if(!capacity.ok)return this.error('Rọ đã đầy hoặc con cá vượt sức chứa. Thả cá, đổi vật chứa hoặc mang rọ về nhà; cá vừa câu vẫn được giữ.');}
    const ok=this.transact('catch:'+id+':resolve',draft=>{
      if(decision==='keep'){
        const stored=keepCatch(draft.keptFish,{...c,status:'kept'},draft.container);if(!stored.ok)return false;
        if(this.atHome){const shipped=shipHome(stored.catches,draft.homeFish);if(!shipped.ok)return false;draft.homeFish=shipped.home.map(f=>({...f,status:'home'}));draft.keptFish=[];}else draft.keptFish=stored.catches;
      }else if(decision==='release')draft.released++;
      else if(decision==='sell'){draft.coins+=c.value;draft.sold++;}else draft.gifted++;
      draft.pending=null;return true;
    });
    if(!ok)return false;
    if(decision==='keep')this.event('FISH_STORED',{stored:true});
    this.phase='idle';this.hooked=null;this.target=null;this.signal='quiet';this.message=catchRemark(c,decision,p.container);this.changed();return true;
  }
  resolveKeptCatch(id,decision){
    if(!['idle','failed','landed'].includes(this.phase)||!['sell','release','gift','cook'].includes(decision))return false;
    const p=this.player,home=p.homeFish.find(c=>c.id===id),kept=p.keptFish.find(c=>c.id===id),c=home||kept;
    if(!c||(!this.atHome&&decision!=='release')||(!home&&decision!=='release'&&this.enabled('catch')))return false;
    const ok=this.transact('fish:'+id+':dispose',draft=>{
      const source=home?'homeFish':'keptFish';draft[source]=draft[source].filter(f=>f.id!==id);
      if(decision==='sell'){draft.coins+=c.value;draft.sold++;}else if(decision==='gift')draft.gifted++;else if(decision==='cook')draft.cooked++;else draft.released++;
      return true;
    });
    if(!ok)return false;
    if(home&&this.atHome)this.event('TRIP_COMPLETED',{completed:true,returned:true,handled:true});
    this.message=decision==='cook'?'Cá đã vào bếp. Bữa cơm nhà có thêm món cá.':catchRemark(c,decision,p.container);this.changed();return true;
  }
  sellKeptFish(){
    if(!this.atHome||!['idle','failed','landed'].includes(this.phase)||!this.player.homeFish.length)return false;
    const n=this.player.homeFish.length,value=this.player.homeFish.reduce((sum,c)=>sum+c.value,0);
    if(!this.transact(nextTransactionId(this.player,'sell-all'),p=>{p.coins+=value;p.sold+=n;p.homeFish=[];return true;}))return false;
    this.event('TRIP_COMPLETED',{completed:true,returned:true,handled:true});this.message=`Đã bán ${n} con cá tại nhà. Nhận ${value.toLocaleString('vi-VN')} xu.`;this.changed();return true;
  }
  setContainer(id){
    if(!canStoreCatch([], {id:'capacity-check',weight:.001},id).ok)return false;
    const usage=containerUsage(this.player.keptFish,id);if(usage.count>usage.maxCount||usage.kg>usage.maxKg)return this.error('Vật chứa nhỏ hơn số cá hiện có. Cá vẫn được giữ nguyên; hãy về nhà xử lý trước.');
    this.player.container=id;this.message=`Đang dùng ${getContainer(id).name}.`;this.changed();return true;
  }
  gather(source='soil'){
    if(this.busy)return false;
    const def=GATHER_SOURCES[source];if(!def)return false;
    if(!this.atHome&&source!=='soil')return this.error('Mồi này chỉ kiếm được tại nhà.');
    const gathered=gatherBait(this.player.baits,source);if(!gathered.ok)return this.error('Đã đủ mồi từ nguồn này. Dùng bớt rồi kiếm thêm; mồi đang sở hữu vẫn được giữ nguyên.');
    if(!this.atHome&&this.enabled('inventory')){const inv=inventoryFor(this.player),limit=BAG_TYPES[inv.bagId].baitTypes;if(!(inv.carried.baits[gathered.id]>0)&&Object.values(inv.carried.baits).filter(n=>n>0).length>=limit)return this.error('Túi đã đủ loại mồi. Về nhà để đổi mồi mang theo.');}
    if(!this.transact(nextTransactionId(this.player,'gather'),p=>{
      const inv=ensureInventory(p);p.baits=gathered.stock;const loc=!(inv.carried.baits[gathered.id]>0)&&Object.values(inv.carried.baits).filter(n=>n>0).length>=BAG_TYPES[inv.bagId].baitTypes?'stored':'carried';inv[loc].baits[gathered.id]=(inv[loc].baits[gathered.id]||0)+gathered.gained;return true;
    }))return false;
    this.event('BAIT_COLLECTED',{count:gathered.gained});this.message=`Đã kiếm ${gathered.gained} phần ${getBait(gathered.id).name.toLocaleLowerCase('vi')}, không tốn xu.`;this.changed();return true;
  }
  digWorms(){return this.gather('soil');}
  buy(kind,id,txId){
    if(this.busy||!this.atHome)return this.error('Mua và cất đồ tại nhà trước khi đi câu.');
    const p=this.player,item=kind==='rod'?RODS.find(r=>r.id===id):kind==='bait'?BAITS.find(b=>b.id===id):kind==='accessory'?ACCESSORIES.find(a=>a.id===id):kind==='map'?MAPS.find(m=>m.id===id):kind==='bag'?BAG_TYPES[id]:null;
    if(!item||!item.price||p.coins<item.price)return false;
    if(kind==='rod'&&p.rods.includes(id)||kind==='accessory'&&p.accessories.includes(id)||kind==='map'&&p.maps.includes(id)||kind==='bag'&&p.systems.bags.includes(id)||kind==='bait'&&(item.reusable&&p.baits[id]>0||(p.baits[id]||0)+item.amount>100000))return false;
    if(!this.transact(txId||nextTransactionId(p,'buy'),draft=>{
      draft.coins-=item.price;
      if(kind==='rod'){draft.rods.push(id);if(item.tech==='lure')draft.baits.lure=1;}
      else if(kind==='bait')draft.baits[id]=(draft.baits[id]||0)+item.amount;
      else if(kind==='accessory')draft.accessories.push(id);
      else if(kind==='map')draft.maps.push(id);
      else draft.systems.bags.push(id);
      return true;
    }))return false;
    this.message=`Đã mua ${item.name}. Đồ mới ở kho nhà; bỏ vào túi hoặc lắp trước khi đi câu.`;this.changed();return true;
  }
  answerLesson(id,index){
    const l=LESSONS.find(l=>l.id===id);if(!l||index!==l.answer)return false;
    if(!this.player.lessons.includes(id)){if(!this.transact('lesson:'+id,p=>{p.lessons.push(id);p.coins+=2500;return true;}))return false;this.message='Hoàn thành bài học. Thưởng 2.500 xu lần đầu.';this.changed();}return true;
  }
  claimTutorial(id){
    const lesson=STARTER_STEPS.find(s=>s.id===id),result=claimTutorial(this.player.systems.tutorial,id);if(!lesson||!result.ok)return false;
    if(!this.transact('tutorial:'+id,p=>{p.systems.tutorial=result.progress;p.coins+=lesson.reward||120;return true;}))return false;
    this.message=`Đã nhận ${lesson.reward||120} xu cho bài thực hành.`;this.changed();return true;
  }
  newSession(){if(this.busy||this.player.pending)return false;this.elapsed=0;this.deadlineReached=false;this.phase='idle';this.paused=false;this.releaseHands();this.retrieving=false;this.hooked=null;this.target=null;this.resetCastTarget();this.populate();this.message='Một buổi câu mới. Chúc bạn gặp cá đẹp.';this.changed();return true;}
}
