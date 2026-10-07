import {pointInPolygon} from './scene-geometry.js';
import {catchRemark,getContainer,MAX_KEPT_FISH} from './catch-fate.js';
import {fishBehavior,snagChance,castHabitat} from './water-world.js';
import {fishFightProfile} from './fight-physics.js';
import {FISH,MAPS,RODS,BAITS,ACCESSORIES,LESSONS,getMap,getRod,getBait,getFish,usesFloat,usesReel,acceptsBait,loadoutStats} from './content.js';
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export const FIGHT_ZONE=Object.freeze({min:30,max:76,red:90});
export function seededRandom(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=Math.imul(n^(n>>>15),1|n);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}
export function floatMarks(player){if(!usesFloat(getRod(player.rod)))return 0;return clamp(Math.round((loadoutStats(player).capacity-player.rig.lead-.06-getBait(player.bait).mass)/.045),0,8);}
export function balancedLead(player){return +clamp(loadoutStats(player).capacity-.06-getBait(player.bait).mass-4*.045,.4,3.5).toFixed(2);}
export function rigError(p){
  if(!p.rods.includes(p.rod))return 'Bạn chưa có bộ cần này.';
  const r=getRod(p.rod),b=getBait(p.bait);
  if(!BAITS.some(x=>x.id===p.bait)||!acceptsBait(r,b))return `${b.name} không hợp ${r.label.toLocaleLowerCase('vi')}. Chọn mồi tại bàn đồ.`;
  if(b.reusable&&!(p.baits[b.id]>0)&&b.id!=='lure')return 'Bạn chưa sở hữu mồi giả này.';
  if(usesFloat(r)&&(floatMarks(p)<2||floatMarks(p)>7))return 'Phao chưa cân: chỉnh chì để nổi 2–7 vạch.';
  return '';
}
export class FishingGame{
  constructor(player,{seed=Date.now(),onChange=()=>{}}={}){this.player=player;this.random=seededRandom(seed);this.onChange=onChange;this.phase=player.pending?'landed':'idle';this.time=0;this.elapsed=0;this.paused=false;this.pulling=false;this.retrieving=false;this.deadlineReached=false;this.message='Chọn điểm câu. Bắt đầu bằng giun và cần tre.';this.spot=0;this.castId=0;this.castTarget=null;this.castHabitat=null;this.castFlight=null;this.force=0;this.tracking=false;this.aim={x:.5,y:.5};this.fishPosition={x:.5,y:.5};this.controlRandom=seededRandom(seed^0xAC51);this.environmentRandom=seededRandom(seed^0xE872);this.hooked=null;this.target=null;this.fish=[];this.populate();}
  changed(){this.onChange(this);}
  get map(){return getMap(this.player.map);}
  get rod(){return getRod(this.player.rod);}
  get stats(){return loadoutStats(this.player);}
  get spotData(){return this.map.spots[this.spot];}
  get busy(){return !['idle','failed'].includes(this.phase);}
  populate(){
    const species=FISH.filter(f=>f.maps.includes(this.player.map));
    this.fish=[];for(let s=0;s<this.map.spots.length;s++)for(let j=0;j<species.length*2;j++){
      const def=species[j%species.length],spot=this.map.spots[s];
      const max=Math.min(def.max,s===0?Math.max(def.min+.15,.8):def.max);
      const depth=def.depth==='bottom'?spot.depth:def.depth==='surface'?.4:spot.depth*(def.depth==='cover'?.7:.55);
      this.fish.push({id:`${this.player.map}-${s}-${j}-${this.castId}`,fishId:def.id,spot:s,x:clamp(spot.x+(this.random()-.5)*.2,.08,.92),y:clamp(spot.y+(this.random()-.5)*.09,.48,.82),weight:+(def.min+this.random()*(max-def.min)).toFixed(2),depth,temper:this.random(),angle:this.random()*Math.PI*2,suspicion:0,caught:false});
    }
  }
  selectMap(id){if(this.busy||!this.player.maps.includes(id))return false;this.player.map=id;this.spot=0;this.resetCastTarget();this.phase='idle';this.target=null;this.hooked=null;this.pulling=false;this.retrieving=false;this.signal='quiet';this.player.rig.depth=this.spotData.depth;this.populate();this.message=`Đã đến ${this.map.name}. Chọn mồi và điểm câu.`;this.changed();return true;}
  selectSpot(i){if(this.busy||!this.map.spots[i])return false;this.spot=i;this.resetCastTarget();this.player.rig.depth=this.spotData.depth;this.message=`${this.spotData.name}: sâu ${this.spotData.depth.toFixed(1)} m. Chỉnh tầng mồi nếu tìm cá giữa nước.`;this.changed();return true;}
  equip(kind,id){
    if(this.busy)return false;
    const p=this.player;
    if(kind==='rod'){
      const rod=RODS.find(r=>r.id===id);if(!rod||!p.rods.includes(id))return false;
      const bait=getBait(p.bait);p.rod=id;
      if(!acceptsBait(rod,bait))p.bait=rod.tech==='lure'?'lure':'worm';
      if(rod.tech==='lure')p.baits.lure=1;
      if(usesFloat(rod))p.rig.lead=balancedLead(p);
      this.message=`Đã lắp ${rod.name}.`;
    }else if(kind==='bait'){
      const bait=BAITS.find(b=>b.id===id);if(!bait||!acceptsBait(this.rod,bait)||(bait.reusable&&!(p.baits[id]>0)))return false;
      p.bait=id;if(usesFloat(this.rod))p.rig.lead=balancedLead(p);this.message=`Đã lắp ${bait.name.toLocaleLowerCase('vi')}.`;
    }else{
      const item=ACCESSORIES.find(a=>a.id===id&&a.slot===kind);
      if(!item||!p.accessories?.includes(id)||(kind==='reel'&&!usesReel(this.rod))||(kind==='float'&&!usesFloat(this.rod)))return false;
      p.equipment[kind]=id;if(kind==='float')p.rig.lead=balancedLead(p);this.message=`Đã trang bị ${item.name.toLocaleLowerCase('vi')}.`;
    }
    this.changed();return true;
  }
  setRig(part,value){
    if(this.busy||!Number.isFinite(value)||!['depth','lead'].includes(part))return false;
    const [min,max]=part==='depth'?[.4,this.map.maxDepth]:[.4,3.5];
    if(value<min||value>max||(part==='lead'&&!usesFloat(this.rod))||(part==='depth'&&this.rod.tech==='lure'))return false;
    this.player.rig[part]=value;this.changed();return true;
  }
  balance(){if(this.busy||!usesFloat(this.rod))return false;this.player.rig.lead=balancedLead(this.player);this.message='Phao đã cân về 4 vạch.';this.changed();return true;}
  resetCastTarget(){this.castTarget=null;this.castHabitat=null;this.baitPoint=null;this.castFlight=null;}
  get defaultCastPoint(){return this.spotData.video?{x:.5,y:.65}:{x:this.spotData.x,y:this.spotData.y};}
  setCastTarget(x,y){
    if(this.busy||this.paused||this.deadlineReached||!Number.isFinite(x)||!Number.isFinite(y))return false;
    if(this.spotData.waterZone&&!pointInPolygon(x,y,this.spotData.waterZone))return false;
    this.castTarget={x:clamp(x,0,1),y:clamp(y,0,1)};this.castHabitat=castHabitat(this.spotData,this.castTarget);const h=this.castHabitat;this.message=h.cover>.45?'Sát bèo/cỏ: rô, trê dễ vào hơn nhưng dễ mắc.':h.far>.68?'Nước xa và sâu hơn: cơ hội gặp cá lớn tăng.':h.near>.72?'Sát bờ: nhiều cá nhỏ, dễ tiếp cận.':'Nước thoáng: hợp chép, trắm và cá đi ăn ngoài.';this.changed();return true;
  }
  cast(){
    if(this.busy||this.paused||this.deadlineReached)return false;
    const error=rigError(this.player);if(error){this.message=error;this.changed();return false;}
    if(!getBait(this.player.bait).reusable&&!(this.player.baits[this.player.bait]>0)){this.message='Hết mồi. Đào giun ở bàn đồ hoặc mua mồi tại cửa hàng.';this.changed();return false;}
    if(!getBait(this.player.bait).reusable)this.player.baits[this.player.bait]--;
    this.player.casts++;this.castId++;this.phase='casting';this.wait=0;this.stageTime=0;this.target=null;this.hooked=null;this.retrieving=false;this.releaseHands();this.snagProgress=0;this.snagTriggered=false;
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
    return score;
  }
  eligible(f){const def=getFish(f.fishId);return !f.caught&&f.spot===this.spot&&f.suspicion<.6&&def.baits.includes(this.player.bait)&&def.tech.includes(this.rod.tech)&& (this.rod.tech==='lure'||Math.abs(f.depth-this.player.rig.depth)<.65);}
  pickTarget(candidates){
    const weighted=candidates.map(f=>({f,w:this.habitatAffinity(getFish(f.fishId),f)/(Math.hypot(f.x-this.baitPoint.x,f.y-this.baitPoint.y)+.07)}));
    const total=weighted.reduce((n,v)=>n+v.w,0);let roll=this.random()*total;
    for(const v of weighted){roll-=v.w;if(roll<=0)return v.f;}return weighted[0]?.f||null;
  }
  step(dt){
    if(this.paused||this.deadlineReached)return;
    dt=clamp(dt,0,.1);this.time+=dt;this.elapsed+=dt;
    if(this.player.settings.deadline&&this.elapsed>=this.player.settings.deadline){this.deadlineReached=true;this.releaseHands();if(['casting','waiting','nibble','bite','fight','snag'].includes(this.phase)){this.phase='failed';this.target=null;this.castFlight=null;this.signal='quiet';}this.message='Đến giờ về nhà. Kết thúc buổi câu hoặc bắt đầu một buổi mới.';this.changed();return;}
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
      this.changed();
    }
  }
  stepBait(dt){
    this.wait+=dt;this.stageTime+=dt;
    if(this.phase==='waiting'&&this.snagScheduled&&!this.snagTriggered&&this.wait>=this.snagAt){this.beginSnag();return;}
    if(this.phase==='waiting'){
      this.signal=(Math.sin(this.time*1.8)>.96)?'wind':'quiet';
      if(this.rod.tech==='lure'&&!this.retrieving)return;
      if(this.wait>1.8&&!this.target){
        const candidates=this.fish.filter(f=>this.eligible(f));
        this.target=this.pickTarget(candidates);
      }
      if(this.target){
        const t=this.target,dx=this.baitPoint.x-t.x,dy=this.baitPoint.y-t.y,dist=Math.hypot(dx,dy),speed=.013+t.temper*.009;
        if(dist>.005){t.x+=dx/dist*Math.min(dist,speed*dt);t.y+=dy/dist*Math.min(dist,speed*dt);}
        else{this.phase='nibble';this.stageTime=0;this.signal='nibble';this.message=this.player.settings.assist?(usesFloat(this.rod)?'Cá đang thăm mồi. Chờ phao chìm rõ.':'Cá đang thăm mồi. Chờ đầu cần cong rõ.'):'Có chuyển động nhẹ dưới mồi.';this.changed();}
      }
      if(this.wait>35){this.fail('Chưa có cá hợp mồi ở tầng này. Đổi mồi, độ sâu hoặc điểm câu.');}
    }else if(this.phase==='nibble'){
      this.signal='nibble';
      if(this.stageTime>1.1+this.target.temper*1.2){this.phase='bite';this.stageTime=0;this.signal='bite';this.message=this.player.settings.assist?'Cá đã ngậm mồi — giật cần ngay!':usesFloat(this.rod)?'Phao chìm rõ, dây dịch chuyển.':'Đầu cần cong rõ, dây kéo căng.';this.changed();}
    }else if(this.phase==='bite'&&this.stageTime>this.stats.biteWindow){this.target.suspicion=.7;this.fail('Chậm nhịp: cá nhả mồi. Thử lại và giật khi tín hiệu rõ.');}
  }
  strike(){
    if(this.paused||this.deadlineReached)return false;
    if(this.phase==='bite'&&this.target){
      this.hooked=this.target;this.behavior=fishBehavior(getFish(this.hooked.fishId));this.fishPosition={x:.5,y:.5};this.velocity={x:0,y:0};this.waypoint={x:.5,y:.5};this.turnAt=0;this.offTarget=0;this.accuracy=0;this.phase='fight';this.fightTime=0;this.energy=100;this.tension=44;this.overload=0;this.slack=0;this.pulling=false;this.surge=false;this.nextSurge=this.behavior.rest+this.controlRandom()*1.5;this.surgeUntil=0;this.signal='hooked';this.message='Đóng lưỡi! Tay trái bám cá, tay phải giữ và kéo lên/xuống để chỉnh lực. Hạ lực khi cá bứt.';this.changed();return true;
    }
    if(['waiting','nibble'].includes(this.phase)){if(this.target)this.target.suspicion=.6;this.fail('Giật sớm: cá chưa ngậm mồi. Rung nhẹ chưa đủ để đóng lưỡi.');}
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
    const stats=this.stats,ratio=this.hooked.weight/stats.power;
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
  retrieve(){if(this.phase==='snag'){this.fail('Đã bỏ lượt mắc đáy. Không mất thêm mồi hay đồ nghề.');return;}if(['casting','waiting','nibble','bite'].includes(this.phase)){this.releaseHands();this.castFlight=null;this.phase='idle';this.target=null;this.retrieving=false;this.signal='quiet';this.message=getBait(this.player.bait).reusable?'Đã thu cần. Mồi giả vẫn còn trong túi, có thể thả lại.':'Đã thu cần. Mồi của lượt trước đã dùng; có thể đổi điểm và thả lại.';this.changed();}}
  fail(message){this.releaseHands();this.castFlight=null;this.phase='failed';this.signal='quiet';this.pulling=false;this.retrieving=false;this.target=null;this.message=message;this.changed();}
  land(){
    const f=this.hooked;f.caught=true;const def=getFish(f.fishId),p=this.player;
    p.serial++;p.pending={id:`catch-${p.serial}`,fishId:f.fishId,weight:f.weight,value:Math.round(def.price*f.weight),mapId:p.map};
    p.catches++;const c=p.collection[f.fishId]||{count:0,best:0};p.collection[f.fishId]={count:c.count+1,best:Math.max(c.best,f.weight)};
    this.phase='landed';this.releaseHands();this.message=`Đã đưa ${def.name.toLocaleLowerCase('vi')} lên bờ.`;this.changed();
  }
  resolveCatch(id,decision){
    const p=this.player,c=p.pending;
    if(!c||c.id!==id||!['sell','release','keep'].includes(decision))return false;
    if(decision==='keep'&&p.keptFish.length>=MAX_KEPT_FISH){this.message=getContainer(p.container).name+' đã đầy. Bán bớt cá hoặc chọn phóng sinh.';return false;}
    if(decision==='sell'){p.coins+=c.value;p.sold++;}
    else if(decision==='keep')p.keptFish.push({...c});
    else p.released++;
    p.pending=null;this.phase='idle';this.hooked=null;this.target=null;this.signal='quiet';
    this.message=catchRemark(c,decision,p.container);this.changed();return true;
  }
  resolveKeptCatch(id,decision){
    if(!['idle','failed','landed'].includes(this.phase)||!['sell','release','gift'].includes(decision))return false;
    const p=this.player,index=p.keptFish.findIndex(c=>c.id===id);if(index<0)return false;
    const [c]=p.keptFish.splice(index,1);
    if(decision==='sell'){p.coins+=c.value;p.sold++;}else if(decision==='gift')p.gifted++;else p.released++;
    this.message=catchRemark(c,decision,p.container);this.changed();return true;
  }
  sellKeptFish(){
    if(!['idle','failed','landed'].includes(this.phase)||!this.player.keptFish.length)return false;
    const p=this.player,n=p.keptFish.length,value=p.keptFish.reduce((sum,c)=>sum+c.value,0);
    p.coins+=value;p.sold+=n;p.keptFish=[];this.message=`Đã bán ${n} con cá. Xu vào ví, rọng lại nhẹ, tay lại ngứa.`;this.changed();return true;
  }
  digWorms(){if(this.busy)return false;this.player.baits.worm=Math.min(60,this.player.baits.worm+6);this.message='Đã đào thêm 6 phần giun (tối đa 60). Không tốn xu.';this.changed();return true;}
  buy(kind,id){
    if(this.busy)return false;const p=this.player;
    if(kind==='rod'){const r=RODS.find(r=>r.id===id);if(!r||p.rods.includes(id)||p.coins<r.price)return false;p.coins-=r.price;p.rods.push(id);if(r.tech==='lure')p.baits.lure=1;this.message=`Đã mua ${r.name}. Lắp tại bàn đồ.`;}
    else if(kind==='map'){const m=MAPS.find(m=>m.id===id);if(!m||p.maps.includes(id)||p.coins<m.price)return false;p.coins-=m.price;p.maps.push(id);this.message=`Đã mở ${m.name}, dùng lại không tốn phí chuyến.`;}
    else if(kind==='bait'){const b=BAITS.find(b=>b.id===id),count=p.baits[id]||0;if(!b||b.price===0||p.coins<b.price||(b.reusable&&count>0)||count+b.amount>100000)return false;p.coins-=b.price;p.baits[id]=count+b.amount;this.message=`Đã mua ${b.reusable?'mồi dùng lại':b.amount+' phần'} ${b.name.toLocaleLowerCase('vi')}.`;}
    else if(kind==='accessory'){const a=ACCESSORIES.find(a=>a.id===id);if(!a||p.accessories.includes(id)||p.coins<a.price)return false;p.coins-=a.price;p.accessories.push(id);this.message=`Đã mua ${a.name}. Lắp tại bàn đồ.`;}
    else return false;this.changed();return true;
  }
  answerLesson(id,index){const l=LESSONS.find(l=>l.id===id);if(!l||index!==l.answer)return false;if(!this.player.lessons.includes(id)){this.player.lessons.push(id);this.player.coins+=2500;this.message='Hoàn thành bài học. Thưởng 2.500 xu lần đầu.';this.changed();}return true;}
  newSession(){if(this.busy||this.player.pending)return false;this.elapsed=0;this.deadlineReached=false;this.phase='idle';this.paused=false;this.releaseHands();this.retrieving=false;this.hooked=null;this.target=null;this.resetCastTarget();this.populate();this.message='Một buổi câu mới. Chúc bạn gặp cá đẹp.';this.changed();return true;}
}
