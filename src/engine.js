import {FISH,MAPS,RODS,BAITS,LESSONS,getMap,getRod,getBait,getFish} from './content.js';
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function seededRandom(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=Math.imul(n^(n>>>15),1|n);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}
export function floatMarks(player){if(getRod(player.rod).tech==='lure')return 0;return clamp(Math.round((1.4-player.rig.lead-.06-getBait(player.bait).mass)/.045),0,8);}
export function rigError(p){
  if(!p.rods.includes(p.rod))return 'Bạn chưa có bộ cần này.';
  const r=getRod(p.rod);if(r.tech==='lure'&&p.bait!=='lure')return 'Bộ lure cần mồi mềm.';
  if(r.tech!=='lure'&&p.bait==='lure')return 'Mồi mềm cần máy spinning.';
  if(r.tech==='don'&&p.bait==='cloudbait')return 'Mồi mây cần bộ câu Đài.';
  if(r.tech!=='lure'&&(floatMarks(p)<2||floatMarks(p)>7))return 'Phao chưa cân: chỉnh chì để nổi 2–7 vạch.';
  return '';
}
export class FishingGame{
  constructor(player,{seed=Date.now(),onChange=()=>{}}={}){this.player=player;this.random=seededRandom(seed);this.onChange=onChange;this.phase=player.pending?'landed':'idle';this.time=0;this.elapsed=0;this.paused=false;this.pulling=false;this.retrieving=false;this.deadlineReached=false;this.message='Chọn điểm câu. Bắt đầu bằng giun và cần tre.';this.spot=0;this.castId=0;this.hooked=null;this.target=null;this.fish=[];this.populate();}
  changed(){this.onChange(this);}
  get map(){return getMap(this.player.map);}
  get rod(){return getRod(this.player.rod);}
  get spotData(){return this.map.spots[this.spot];}
  get busy(){return !['idle','failed'].includes(this.phase);}
  populate(){
    const species=FISH.filter(f=>f.maps.includes(this.player.map));
    this.fish=[];for(let s=0;s<3;s++)for(let j=0;j<species.length*2;j++){
      const def=species[j%species.length],spot=this.map.spots[s];
      const max=Math.min(def.max,s===0?Math.max(def.min+.15,.8):def.max);
      this.fish.push({id:`${this.player.map}-${s}-${j}-${this.castId}`,fishId:def.id,spot:s,x:clamp(spot.x+(this.random()-.5)*.2,.08,.92),y:clamp(spot.y+(this.random()-.5)*.09,.48,.82),weight:+(def.min+this.random()*(max-def.min)).toFixed(2),depth:def.depth==='bottom'?spot.depth:spot.depth*.55,temper:this.random(),angle:this.random()*Math.PI*2,suspicion:0,caught:false});
    }
  }
  selectMap(id){if(this.busy||!this.player.maps.includes(id))return false;this.player.map=id;this.spot=0;this.player.rig.depth=this.spotData.depth;this.populate();this.message=`Đã đến ${this.map.name}. Chọn mồi và điểm câu.`;this.changed();return true;}
  selectSpot(i){if(this.busy||!this.map.spots[i])return false;this.spot=i;this.player.rig.depth=this.spotData.depth;this.message=`${this.spotData.name}: sâu ${this.spotData.depth.toFixed(1)} m. Chỉnh tầng mồi nếu tìm cá giữa nước.`;this.changed();return true;}
  cast(){
    if(this.busy||this.deadlineReached)return false;
    const error=rigError(this.player);if(error){this.message=error;this.changed();return false;}
    if(this.player.bait!=='lure'&&!(this.player.baits[this.player.bait]>0)){this.message='Hết mồi. Đào giun ở bàn đồ hoặc mua mồi tại cửa hàng.';this.changed();return false;}
    if(this.player.bait!=='lure')this.player.baits[this.player.bait]--;
    this.player.casts++;this.castId++;this.phase='waiting';this.wait=0;this.stageTime=0;this.target=null;this.hooked=null;this.retrieving=false;this.pulling=false;
    this.baitPoint={x:this.spotData.x,y:this.spotData.y};this.signal='quiet';this.message=this.rod.tech==='lure'?'Mồi đã xuống nước. Bật thu mồi để cá chú ý.':'Mồi đã xuống nước. Quan sát phao; rung nhẹ chưa phải lúc giật.';this.changed();return true;
  }
  eligible(f){const def=getFish(f.fishId);return !f.caught&&f.spot===this.spot&&f.suspicion<.6&&def.baits.includes(this.player.bait)&&def.tech.includes(this.rod.tech)&& (this.rod.tech==='lure'||Math.abs(f.depth-this.player.rig.depth)<.65);}
  step(dt){
    if(this.paused||this.deadlineReached)return;
    dt=clamp(dt,0,.1);this.time+=dt;this.elapsed+=dt;
    if(this.player.settings.deadline&&this.elapsed>=this.player.settings.deadline){this.deadlineReached=true;this.pulling=false;if(['waiting','nibble','bite','fight'].includes(this.phase)){this.phase='failed';this.target=null;this.signal='quiet';}this.message='Đến giờ về nhà. Kết thúc buổi câu hoặc bắt đầu một buổi mới.';this.changed();return;}
    for(const f of this.fish){if(f.caught)continue;f.suspicion=Math.max(0,f.suspicion-dt*.025);if(f!==this.target){f.angle+=(this.random()-.5)*dt;f.x=clamp(f.x+Math.cos(f.angle)*dt*.004,.08,.92);f.y=clamp(f.y+Math.sin(f.angle)*dt*.002,.47,.82);}}
    if(['waiting','nibble','bite'].includes(this.phase))this.stepBait(dt);
    if(this.phase==='fight')this.stepFight(dt);
  }
  stepBait(dt){
    this.wait+=dt;this.stageTime+=dt;
    if(this.phase==='waiting'){
      this.signal=(Math.sin(this.time*1.8)>.96)?'wind':'quiet';
      if(this.rod.tech==='lure'&&!this.retrieving)return;
      if(this.wait>1.8&&!this.target){
        const candidates=this.fish.filter(f=>this.eligible(f));
        candidates.sort((a,b)=>(Math.hypot(a.x-this.baitPoint.x,a.y-this.baitPoint.y)+a.temper*.04)-(Math.hypot(b.x-this.baitPoint.x,b.y-this.baitPoint.y)+b.temper*.04));
        this.target=candidates[0]||null;
      }
      if(this.target){
        const t=this.target,dx=this.baitPoint.x-t.x,dy=this.baitPoint.y-t.y,dist=Math.hypot(dx,dy),speed=.013+t.temper*.009;
        if(dist>.005){t.x+=dx/dist*Math.min(dist,speed*dt);t.y+=dy/dist*Math.min(dist,speed*dt);}
        else{this.phase='nibble';this.stageTime=0;this.signal='nibble';this.message=this.player.settings.assist?'Cá đang thăm mồi. Chờ phao chìm rõ.':'Có chuyển động nhẹ dưới mồi.';this.changed();}
      }
      if(this.wait>35){this.fail('Chưa có cá hợp mồi ở tầng này. Đổi mồi, độ sâu hoặc điểm câu.');}
    }else if(this.phase==='nibble'){
      this.signal='nibble';
      if(this.stageTime>1.1+this.target.temper*1.2){this.phase='bite';this.stageTime=0;this.signal='bite';this.message=this.player.settings.assist?'Cá đã ngậm mồi — giật cần ngay!':'Phao chìm rõ, dây dịch chuyển.';this.changed();}
    }else if(this.phase==='bite'&&this.stageTime>2.8){this.target.suspicion=.7;this.fail('Chậm nhịp: cá nhả mồi. Thử lại và giật khi phao chìm rõ.');}
  }
  strike(){
    if(this.paused||this.deadlineReached)return false;
    if(this.phase==='bite'&&this.target){
      this.hooked=this.target;this.phase='fight';this.fightTime=0;this.energy=100;this.tension=44;this.overload=0;this.slack=0;this.pulling=false;this.surge=false;this.nextSurge=2+this.random()*2;this.surgeUntil=0;this.signal='hooked';this.message=this.rod.tech==='lure'?'Đóng lưỡi! Thu dây trong vùng xanh, nới khi cá bứt.':'Đóng lưỡi! Dẫn cá trong vùng xanh, nới khi cá bứt.';this.changed();return true;
    }
    if(['waiting','nibble'].includes(this.phase)){if(this.target)this.target.suspicion=.6;this.fail('Giật sớm: cá chưa ngậm mồi. Rung nhẹ chưa đủ để đóng lưỡi.');}
    return false;
  }
  stepFight(dt){
    this.fightTime+=dt;
    if(this.fightTime>=this.nextSurge){this.surgeUntil=this.fightTime+.9+this.random()*.6;this.nextSurge=this.surgeUntil+2+this.random()*2;}
    this.surge=this.fightTime<this.surgeUntil;
    const ratio=this.hooked.weight/this.rod.power;
    const target=(this.pulling?55:26)+Math.min(25,ratio*15)+(this.surge?(this.pulling?29:19):0);
    this.tension=clamp(this.tension+(target-this.tension)*Math.min(1,dt*3.5),0,100);
    this.overload=this.tension>91?this.overload+dt:Math.max(0,this.overload-dt*2);
    this.slack=this.tension<17?this.slack+dt:Math.max(0,this.slack-dt);
    if(this.overload>.75){this.hooked.suspicion=.9;this.fail('Đứt dây: kéo liên tục khi cá bứt. Nới lực sớm hơn ở vùng đỏ.');return;}
    if(this.slack>2){this.hooked.suspicion=.7;this.fail('Tuột lưỡi: dây bị chùng quá lâu. Giữ lực trong vùng xanh.');return;}
    if(this.pulling&&this.tension>=25&&this.tension<=83)this.energy=Math.max(0,this.energy-dt*(7.2/(1+ratio*.22)));
    else this.energy=Math.min(100,this.energy+dt*.7);
    if(this.energy<=0){this.land();}
  }
  togglePull(){if(this.phase!=='fight'||this.paused)return;this.pulling=!this.pulling;}
  ease(){if(this.phase!=='fight'||this.paused)return;this.pulling=false;this.tension=Math.max(10,this.tension-16);}
  toggleRetrieve(){if(this.phase==='waiting'&&this.rod.tech==='lure')this.retrieving=!this.retrieving;}
  retrieve(){if(['waiting','nibble','bite'].includes(this.phase)){this.phase='idle';this.target=null;this.signal='quiet';this.message='Đã thu cần. Mồi của lượt trước đã dùng; có thể đổi điểm và thả lại.';this.changed();}}
  fail(message){this.phase='failed';this.signal='quiet';this.pulling=false;this.target=null;this.message=message;this.changed();}
  land(){
    const f=this.hooked;f.caught=true;const def=getFish(f.fishId),p=this.player;
    p.serial++;p.pending={id:`catch-${p.serial}`,fishId:f.fishId,weight:f.weight,value:Math.round(def.price*f.weight),mapId:p.map};
    p.catches++;const c=p.collection[f.fishId]||{count:0,best:0};p.collection[f.fishId]={count:c.count+1,best:Math.max(c.best,f.weight)};
    this.phase='landed';this.pulling=false;this.message=`Đã đưa ${def.name.toLocaleLowerCase('vi')} lên bờ.`;this.changed();
  }
  resolveCatch(id,decision){const p=this.player,c=p.pending;if(!c||c.id!==id||!['sell','release'].includes(decision))return false;if(decision==='sell'){p.coins+=c.value;p.sold++;}else p.released++;p.pending=null;this.phase='idle';this.hooked=null;this.target=null;this.signal='quiet';this.message=decision==='sell'?'Đã bán cá. Xu đã vào ví.':'Đã thả cá. Thành tích vẫn được ghi trong sổ.';this.changed();return true;}
  digWorms(){if(this.busy)return false;this.player.baits.worm=Math.min(60,this.player.baits.worm+6);this.message='Đã đào thêm 6 phần giun (tối đa 60). Không tốn xu.';this.changed();return true;}
  buy(kind,id){
    if(this.busy)return false;const p=this.player;
    if(kind==='rod'){const r=RODS.find(r=>r.id===id);if(!r||p.rods.includes(id)||p.coins<r.price)return false;p.coins-=r.price;p.rods.push(id);this.message=`Đã mua ${r.name}. Lắp tại bàn đồ.`;}
    else if(kind==='map'){const m=MAPS.find(m=>m.id===id);if(!m||p.maps.includes(id)||p.coins<m.price)return false;p.coins-=m.price;p.maps.push(id);this.message=`Đã mở ${m.name}, dùng lại không tốn phí chuyến.`;}
    else if(kind==='bait'){const b=BAITS.find(b=>b.id===id);if(!b||b.id==='lure'||p.coins<b.price)return false;p.coins-=b.price;p.baits[id]+=b.amount;this.message=`Đã mua ${b.amount} phần ${b.name.toLocaleLowerCase('vi')}.`;}
    else return false;this.changed();return true;
  }
  answerLesson(id,index){const l=LESSONS.find(l=>l.id===id);if(!l||index!==l.answer)return false;if(!this.player.lessons.includes(id)){this.player.lessons.push(id);this.player.coins+=2500;this.message='Hoàn thành bài học. Thưởng 2.500 xu lần đầu.';this.changed();}return true;}
  newSession(){if(this.player.pending)return false;this.elapsed=0;this.deadlineReached=false;this.phase='idle';this.paused=false;this.populate();this.message='Một buổi câu mới. Chúc bạn gặp cá đẹp.';this.changed();return true;}
}
