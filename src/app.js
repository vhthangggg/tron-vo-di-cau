import {inventoryFor,carriedBaitCount,BAG_TYPES} from './inventory.js';
import {nextTransactionId} from './economy.js';
import {canStoreCatch,containerUsage} from './catch-inventory.js';
import {elementPoint,coverFrame,imageToScene,sceneToImage,pointInPolygon} from './scene-geometry.js';
import {GameAudio,audioTheme} from './game-audio.js';
import {loadSceneVideo} from './scene-loader.js';
import {CONTAINERS,getContainer,catchTeaser,MAX_KEPT_FISH} from './catch-fate.js';
import {twoHands} from './two-hands.js';
import {paintWater} from './water-world.js';
import {MAPS,FISH,RODS,BAITS,LESSONS,getMap,getRod,getBait,getFish,usesFloat,usesReel} from './content.js';
import {FishingGame,floatMarks,rigError,clamp,FIGHT_ZONE} from './engine.js';
import {loadPlayer,savePlayer} from './save.js';
import {icon,avatarArt,fishArt,NAV_ITEMS,rankFor,renderHome,renderPrepare,renderFishing,renderRig,renderLearn,journalRows as fishRows,renderJournal,renderShop,renderMapAtlas,renderRigCalibration} from './ui.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('vi-VN').format(v);
const kg=v=>new Intl.NumberFormat('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);
let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};}
const loaded=loadPlayer(storage);let player=loaded.player,saveWarning=loaded.warning;
let screen='home',canvas=null,context=null,sceneObserver=null,toastTimer,previousFocus,dialogPaused=false,lastPhase='idle',lastFrame=0,lastUpdate=0,sceneReady=true,sceneLoader=null,pinSignal=false;
const audio=new GameAudio({getSettings:()=>player.settings});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let game=new FishingGame(player,{onChange:gameChanged});
const dialogPointerStarts=new Set();
const hands=twoHands(game,{canUse:()=>screen==='fishing'&&sceneReady&&!game.paused&&!$('#dialog').open&&!game.deadlineReached,onUpdate:()=>{unlockAudio();updateFishing();}});
function clearRodHold(){hands.clear();}

function persist(){if(!savePlayer(storage,player))saveWarning='Trình duyệt đang chặn lưu. Tiến độ chỉ giữ trong phiên này.';}
function announce(message){$('#live').textContent=message;}
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4200);announce(message);}
function gameChanged(){
  if(['landed','failed','idle'].includes(game.phase))clearRodHold();
  persist();updateWallet();
  if(screen==='fishing')updateFishing();
  if(game.phase!==lastPhase){
    const previous=lastPhase;lastPhase=game.phase;
    const cue={casting:'cast',nibble:'nibble',bite:'bite',fight:'hook',snag:'snag',landed:'win',failed:'fail'}[game.phase];
    if(cue)audio.cue(cue);if(previous==='casting'&&game.phase==='waiting')audio.cue('splash');
    if(game.phase==='landed')showCatch();
  }
  announce(game.message);
}
function updateWallet(){
  $('#wallet').textContent=money(player.coins);
  const rank=rankFor(player.catches);
  $('#profile-rank').textContent=rank.name;$('#rank-count').textContent=rank.label;
  $('#rank-progress').max=rank.max;$('#rank-progress').value=rank.complete?rank.max:rank.count;
  $('#rank-progress').setAttribute('aria-valuetext',rank.name+', '+rank.label);
}
function unlockAudio(){if(player.settings.sound)audio.unlock();}
function syncAtmosphere(){
  audio.setScene(screen==='home'?'home':['prepare','fishing'].includes(screen)?player.map:'home');
  audio.setHidden(document.hidden);audio.setPaused(screen==='fishing'&&(!sceneReady||game.paused));
  const video=$('.scene-video');if(video&&sceneReady){if(game.paused||document.hidden)video.pause();else if(video.paused)video.play().catch(()=>{});}
}
function setSound(enabled){
  player.settings.sound=enabled;unlockAudio();audio.applySettings();persist();
  if($('#sound-toggle')){$('#sound-toggle').setAttribute('aria-pressed',String(enabled));$('#sound-toggle').setAttribute('aria-label',enabled?'Tắt âm thanh':'Bật âm thanh');$('#sound-toggle').innerHTML=icon(enabled?'sound':'muted');}
  announce(enabled?'Đã bật nhạc và hiệu ứng âm thanh.':'Đã tắt âm thanh.');
}

function homeHTML(){return renderHome(player,game,saveWarning);}
function prepareHTML(){return renderPrepare(player,game,saveWarning);}
function fishingHTML(){return renderFishing(player,game,saveWarning);}
function rigHTML(){return renderRig(player,game);}
function learnHTML(){return renderLearn(player);}
function journalRows(query='',map='all'){return fishRows(player,query,map);}
function journalHTML(){return renderJournal(player);}
function shopHTML(){return renderShop(player);}
function baitCount(){return getBait(player.bait).reusable?'Dùng lại':`${carriedBaitCount(player,player.bait)} phần trong túi`;}
let shopCategory='all';
function filterShop(category){
  shopCategory=['all','rod','bait','accessory','bag','map'].includes(category)?category:'all';
  $('#shop-inventory').dataset.filter=shopCategory;
  $$('[data-category]').forEach(section=>section.hidden=shopCategory!=='all'&&section.dataset.category!==shopCategory);
  $$('[data-shop-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.shopCategory===shopCategory)));
}

const renderers={home:homeHTML,prepare:prepareHTML,fishing:fishingHTML,rig:rigHTML,learn:learnHTML,journal:journalHTML,shop:shopHTML};
function render(){
  clearRodHold();sceneLoader?.cancel();sceneLoader=null;sceneObserver?.disconnect();canvas=null;context=null;
  sceneReady=screen!=='fishing'||!game.spotData.video;
  document.body.dataset.screen=screen;$('#main').innerHTML=renderers[screen]();
  $$('a[data-screen]').forEach(a=>{if(a.dataset.screen===screen)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  updateWallet();bindScreen();syncAtmosphere();
  if(screen==='fishing'){canvas=$('#water');context=canvas.getContext('2d');sceneObserver=new ResizeObserver(resizeCanvas);sceneObserver.observe($('.scene'));resizeCanvas();updateFishing();paint();$('#main').focus({preventScroll:true});if(!sceneReady)beginMapLoad();}
}
function beginMapLoad(){
  sceneLoader?.cancel();const scene=$('.scene'),video=$('.scene-video');if(!video)return;
  sceneReady=false;scene.dataset.loading='loading';$('#map-loading').hidden=false;$('#map-load-retry').hidden=true;
  $('#map-load-title').textContent='Đang đến '+game.spotData.name;$('#map-load-copy').textContent='Chờ cảnh bờ nước tải xong. Cá chưa tính giờ đâu!';updateFishing();
  sceneLoader=loadSceneVideo(video,{
    onProgress({loaded,total,stage}){
      if(!scene.isConnected)return;
      const progress=$('#map-load-progress');
      if(total)progress.value=stage==='decode'?100:Math.min(99,Math.round(loaded/total*100));else progress.removeAttribute('value');
      $('#map-load-status').textContent=stage==='decode'?'Cảnh đã tải xong · Đang chuẩn bị vào bờ…':total?`Đang tải cảnh câu · ${Math.min(100,Math.round(loaded/total*100))}%`:'Đang tải cảnh câu…';
    },
    onReady(){if(!scene.isConnected)return;sceneReady=true;scene.dataset.loading='ready';$('#map-loading').hidden=true;syncAtmosphere();updateFishing();announce('Đã đến '+game.spotData.name+'. Chọn một điểm trên mặt nước để thả câu.');},
    onError({reason}){if(!scene.isConnected)return;scene.dataset.loading='error';$('#map-load-title').textContent='Chưa tới được bờ';$('#map-load-copy').textContent=reason==='timeout'?'Đường ra bờ hơi tắc. Kiểm tra mạng rồi thử lại nhé.':'Chưa tải được cảnh câu. Bạn có thể thử lại hoặc chọn điểm khác.';$('#map-load-status').textContent='Buổi câu chưa bắt đầu · Đồng hồ vẫn dừng';$('#map-load-retry').hidden=false;}
  });
}
async function setFishingOrientation(active){
  document.body.classList.toggle('fishing-landscape',active);
  if(!window.screen.orientation?.lock)return;
  try{
    if(active)await window.screen.orientation.lock('landscape');
    else window.screen.orientation.unlock();
  }catch{/* Một số mobile browser chỉ cho khóa hướng khi fullscreen/PWA. CSS vẫn giữ layout ngang. */}
}
function changeScreen(next){
  const wasFishing=screen==='fishing';
  if(next==='fishing'&&!player.pending&&!game.beginTrip()){toast(game.message);return;}
  if(next==='home'&&!game.atHome&&!game.returnHome()){toast(game.message);return;}
  screen=next;setHash(next);
  if(next==='fishing')game.paused=document.hidden;
  render();window.scrollTo(0,0);$('#main').focus({preventScroll:true});
  if(next==='fishing')setFishingOrientation(true);
  else if(wasFishing)setFishingOrientation(false);
}
function navigate(next){
  if(!renderers[next])next='home';if(next===screen)return;
  if(['casting','waiting','nibble','bite','fight','snag'].includes(game.phase)){
    setHash(screen);
    showDialog('Thu cần trước khi rời bờ?',`<p>Thu cần để rời bờ. Mồi còn nguyên sẽ được giữ lại; mồi đã bị cá ăn hoặc mắc đáy mới tiêu hao.</p>`,[{label:'Ở lại bờ',action:closeDialog},{label:'Thu cần & đi',primary:true,action:()=>{if(['fight','snag'].includes(game.phase))game.fail('Đã dừng lượt để rời bờ.');else game.retrieve();closeDialog();changeScreen(next);}}]);return;
  }
  if($('#dialog').open)closeDialog();changeScreen(next);
}
function setHash(next){history.replaceState(null,'','#'+next);}
function travel(id){
  if(player.pending){showCatch();return;}
  if(!player.maps.includes(id)){
    navigate('shop');filterShop('map');$(`[data-map-product="${id}"]`)?.scrollIntoView({block:'center',behavior:reduced.matches?'auto':'smooth'});return;
  }
  if(game.selectMap(id)){if(screen==='prepare')render();else navigate('prepare');}else toast('Thu cần trước khi đổi vùng câu.');
}
function showMaps(){
  if(game.busy){toast('Thu cần hoặc xử lý cá vừa câu trước khi đổi vùng.');return;}
  showDialog('Khám phá những bờ nước',renderMapAtlas(player),[],{kind:'atlas'});
  $$('[data-atlas-map]').forEach(button=>button.onclick=()=>{const id=button.dataset.atlasMap;closeDialog();travel(id);});
}
function sceneFrame(w,h){return game.spotData.video?coverFrame(w,h):{x:0,y:0,width:w,height:h};}
function bindWaterCast(){
  const scene=$('.scene'),zone=game.spotData.waterZone;
  if(!scene||!zone?.length)return;
  scene.classList.add('tap-cast-enabled');
  scene.onpointerup=e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    if(e.target.closest('button,.hand-panel,.scene-bottom,.fishing-topbar,.float-zoom,.map-loading'))return;
    if(!sceneReady||!['idle','failed','landed'].includes(game.phase)||player.pending||game.paused||$('#dialog').open)return;
    const p=elementPoint(scene,e),w=scene.clientWidth,h=scene.clientHeight;
    const {x,y}=sceneToImage({x:p.x*w,y:p.y*h},sceneFrame(w,h));
    if(!pointInPolygon(x,y,zone)){toast('Chọn một điểm trên mặt nước thoáng để thả câu.');return;}
    if(game.setCastTarget(x,y))updateFishing();
  };
}
function bindScreen(){
  $$('[data-open-keepnet]').forEach(button=>button.onclick=()=>showKeepnet());
  $$('[data-open-maps]').forEach(button=>button.onclick=showMaps);
  $$('[data-travel]').forEach(button=>button.onclick=()=>travel(button.dataset.travel));
  $$('[data-stock]').forEach(button=>button.onclick=()=>{const category=button.dataset.stock;navigate('shop');filterShop(category);});
  if(screen==='home'){
    $('#home-help').onclick=showHelp;$('#home-mode').onclick=showSettings;
  }
  if(screen==='prepare'){
    $$('[data-spot]').forEach(button=>button.onclick=()=>{if(game.selectSpot(+button.dataset.spot)){audio.cue('ui');const wasMap=button.classList.contains('map-hotspot');render();$(`${wasMap?'.map-hotspot':'.prepare-spot-list button'}[data-spot="${game.spot}"]`).focus({preventScroll:true});}});
    $('#prep-rod').onchange=e=>{if(game.equip('rod',e.target.value)){render();$('#prep-rod').focus();}else render();};
    $('#prep-bait').onchange=e=>{if(game.equip('bait',e.target.value)){render();$('#prep-bait').focus();}else render();};
    $('#start-fishing').onclick=()=>{unlockAudio();if(player.pending){showCatch();return;}navigate('fishing');};
  }
  if(screen==='fishing'){
    $('#help').onclick=showFishingInfo;
    $('#sound-toggle').onclick=()=>setSound(!player.settings.sound);
    $('#pause').onclick=showPause;
    $('#leave-fishing').onclick=()=>navigate('home');
    $('#cast').onclick=()=>{if(!sceneReady)return;unlockAudio();if(player.pending){showCatch();return;}game.cast();$('#main').focus({preventScroll:true});};
    hands.bind();
    bindWaterCast();
    $('#retrieve').onclick=()=>{audio.cue('retrieve');if(game.rod.tech==='lure'&&game.phase==='waiting'){game.toggleRetrieve();updateFishing();}else game.retrieve();};
    $('#ease').onclick=()=>{clearRodHold();game.ease();updateFishing();};
    $('#new-session').onclick=()=>{if(game.newSession())updateFishing();};
    $('#map-load-back').onclick=()=>navigate('prepare');$('#map-load-retry').onclick=beginMapLoad;
  }
  if(screen==='rig'){
    $$('[data-transfer-kind]').forEach(button=>{const tx=nextTransactionId(player,'transfer');button.onclick=()=>{
      const {transferKind:kind,transferId:id,transferTo:to}=button.dataset;
      const inv=inventoryFor(player);
      const ok=kind==='rods'&&to==='carried'&&inv.carried.rods.length>=BAG_TYPES[inv.bagId].rods?game.equip('rod',id):game.moveGear(kind,id,to,tx);
      if(ok){render();toast(game.message);}else toast(game.message);
    };});
    $$('[data-transfer-bait]').forEach(button=>{const tx=nextTransactionId(player,'transfer-bait');button.onclick=()=>{
      const id=button.dataset.transferBait,count=Number($(`[data-transfer-count="${id}"]`).value);
      if(game.moveBait(id,count,button.dataset.transferTo,tx)){render();toast(game.message);}else toast(game.message);
    };});
    const bag=$('#bag-select');if(bag)bag.onchange=e=>{if(game.selectBag(e.target.value)){render();toast(game.message);}else{render();toast(game.message);}};
    $$('[data-gather]').forEach(button=>button.onclick=()=>{if(game.gather(button.dataset.gather)){render();toast(game.message);}else toast(game.message);});
    $('#save-rig').onclick=()=>{if(game.saveRigPreset($('#preset-name').value)){render();toast(game.message);}else toast(game.message||'Nhập tên và kiểm tra bộ câu.');};
    $$('[data-load-rig]').forEach(button=>button.onclick=()=>{if(game.loadRigPreset(button.dataset.loadRig)){render();toast(game.message);}else toast(game.message);});
    $$('[data-remove-rig]').forEach(button=>button.onclick=()=>{if(game.removeRigPreset(button.dataset.removeRig))render();});
    for(const [id,part] of [['leader-mm','leaderMm'],['leader-length','leaderLength'],['hook-size','hookSize'],['sinker-distance','sinkerDistance']])$('#'+id).onchange=e=>{if(!game.setRig(part,Number(e.target.value))){e.target.value=player.rig[part];toast('Thông số chưa hợp lệ hoặc lượt câu chưa kết thúc.');}updateRig();};
    $$('[data-equip]').forEach(button=>button.onclick=()=>{
      const id=button.dataset.equip;
      if(!player.rods.includes(id)){navigate('shop');filterShop('rod');return;}
      if(game.equip('rod',id))render();else toast('Xử lý lượt câu trước khi lắp đồ.');
    });
    $('#rod').onchange=e=>{if(game.equip('rod',e.target.value)){render();$('#rod').focus();}else render();};
    $('#bait').onchange=e=>{if(game.equip('bait',e.target.value)){updateRig();$('#bait-note').textContent=getBait(player.bait).note;}else render();};
    $$('[data-accessory]').forEach(select=>select.onchange=e=>{const id=e.target.id,slot=e.target.dataset.accessory;if(game.equip(slot,e.target.value)){render();$('#'+id).focus();}else{e.target.value=player.equipment[slot];toast(!game.atHome?'Chỉ đổi phụ kiện đã mang theo và hợp bộ cần.':'Phụ kiện chưa có hoặc không hợp bộ cần.');}});
    $('#depth').oninput=e=>{game.setRig('depth',+e.target.value);updateRig();};
    $('#lead').oninput=e=>{game.setRig('lead',+e.target.value);updateRig();};
    $('#balance').onclick=()=>{if(game.balance()){updateRig();toast(game.message);}};
    $('#dig').onclick=()=>{if(game.digWorms()){render();toast(game.message);}};
  }
  if(screen==='learn'){$$('[data-lesson]').forEach(b=>b.onclick=()=>showLesson(b.dataset.lesson));$$('[data-tutorial-claim]').forEach(button=>button.onclick=()=>{if(game.claimTutorial(button.dataset.tutorialClaim)){render();toast(game.message);}});}
  if(screen==='journal'){const filter=()=>$('#fish-results').innerHTML=journalRows($('#fish-search').value,$('#fish-map').value);$('#fish-search').oninput=filter;$('#fish-map').onchange=filter;$('#export').onclick=exportSave;}
  if(screen==='shop'){filterShop(shopCategory);$$('[data-shop-category]').forEach(button=>button.onclick=()=>filterShop(button.dataset.shopCategory));$$('[data-buy]').forEach(b=>{const tx=nextTransactionId(player,'shop');b.onclick=()=>{if(game.buy(b.dataset.buy,b.dataset.id,tx)){render();toast(game.message);}else toast('Chưa mua được. Kiểm tra số xu và bộ đã có.');};});}
}
function updateRig(){
 const error=rigError(player),state=game.float;
 $('#depth-out').textContent=player.rig.depth.toFixed(1)+' m';$('#lead-out').textContent=player.rig.lead.toFixed(2)+' g';$('#lead').value=player.rig.lead;
 $('#rig-state').textContent=error||(usesFloat(game.rod)?`Phao ${state.marks.toFixed(1)} vạch · ${state.warning||'Bộ câu sẵn sàng'}`:'Bộ câu sẵn sàng · Không dùng phao');
 $('#rig-state').classList.toggle('error',!!error);const lab=$('.calibration-lab');if(lab)lab.outerHTML=renderRigCalibration(player,game);
}
function clock(v){return `${String(Math.floor(v/60)).padStart(2,'0')}:${String(Math.floor(v%60)).padStart(2,'0')}`;}
function updateFishing(){
  if(!$('#cast'))return;
  const phase=game.phase,lure=game.rod.tech==='lure',float=usesFloat(game.rod),active=['waiting','nibble','bite'].includes(phase),casting=phase==='casting',fight=phase==='fight',snag=phase==='snag',duel=fight||snag;
  const names={idle:'Sẵn sàng',casting:'Đang vung cần',waiting:lure?'Mồi đang dưới nước':'Chờ cá tìm mồi',nibble:'Cá đang thăm mồi',bite:'Đúng nhịp — giữ tay phải!',fight:game.surge?'Cá bứt — hạ lực cần':'Bám cá · Giữ lực',snag:'Mắc đáy — giữ nhẹ để gỡ',landed:'Cá đã lên bờ',failed:'Thử lại một nhịp mới'};
  $('#status-title').textContent=game.paused?'Buổi câu tạm dừng':game.deadlineReached?'Đến giờ về nhà':(!player.settings.assist&&['nibble','bite'].includes(phase)?'Quan sát tín hiệu':names[phase]);
  $('#status-copy').textContent=game.message;
  $('#cast').disabled=(!sceneReady||!['idle','failed','landed'].includes(phase)||game.paused||game.deadlineReached);
  $('#cast-label').textContent=player.pending?'Xem cá vừa câu':'Thả câu';$('#cast').hidden=casting||active||duel;
  $('#strike').disabled=(!active&&!duel)||game.paused||game.deadlineReached;$('#strike').setAttribute('aria-pressed',String(game.pulling));
  $('#track-pad').disabled=(!active&&!duel)||game.paused||game.deadlineReached;$('#track-pad').setAttribute('aria-pressed',String(game.tracking));
  $('#rod-label').textContent=snag?'Giữ nhẹ':fight?(game.pulling?'Chỉnh lực':'Giữ cần'):'Giữ để giật';
  $('#force-value').textContent=Math.round(game.force*100)+'%';$('#force-fill').style.height=game.force*100+'%';$('#force-knob').style.bottom=`calc(${game.force*100}% - 5px)`;
  $('#tracking-value').textContent=duel?(game.tracking?Math.round(game.accuracy*100)+'%':(snag?'Bám điểm gỡ':'Bám cá')):'Bám cá';
  if($('#fish-target').dataset.kind!==String(snag)){$('#fish-target').dataset.kind=String(snag);$('#fish-target').innerHTML=icon(snag?'pin':'fish');}
  $('#fish-target').style.left=game.fishPosition.x*100+'%';$('#fish-target').style.top=game.fishPosition.y*100+'%';
  $('#aim-reticle').style.left=game.aim.x*100+'%';$('#aim-reticle').style.top=game.aim.y*100+'%';$('#aim-reticle').hidden=!game.tracking;
  $('#track-pad').dataset.locked=String(game.tracking&&game.accuracy>.4);
  $('#retrieve').hidden=fight||(!casting&&!active&&!snag);$('#ease').hidden=true;$('#ease').disabled=game.paused;
  $('#retrieve').disabled=(!casting&&!active&&!snag)||game.paused;
  $('#retrieve-label').textContent=snag?'Bỏ lượt mắc đáy':lure&&phase==='waiting'?(game.retrieving?'Dừng thu mồi':'Bật thu mồi'):'Thu cần';$('#retrieve').setAttribute('aria-pressed',String(lure&&game.retrieving));
  $('#bank-count').textContent=baitCount();$('#pause').setAttribute('aria-pressed',String(game.paused));$('#fight').hidden=!duel;
  $('.scene').classList.toggle('is-fighting',duel);$('.scene').dataset.phase=phase;$('.scene').dataset.assist=String(player.settings.assist);
  const stage=(!player.settings.assist&&phase==='bite')?1:({idle:0,casting:0,waiting:1,nibble:1,bite:2,fight:3,snag:1,landed:4,failed:0}[phase]);
  $$('[data-phase-step]').forEach(el=>{el.classList.toggle('current',+el.dataset.phaseStep===stage);el.classList.toggle('done',+el.dataset.phaseStep<stage);});
  if(duel){
    const tension=Math.round(game.tension),progress=snag?Math.min(100,Math.round(game.snagProgress*100)):Math.min(100,Math.round((100-game.energy)/(100-game.stats.landAt)*100));
    $('#tension-value').textContent=tension+'% căng dây';$('#tension-marker').style.left=`calc(${Math.min(100,tension)}% - 2px)`;$('.tension-track').setAttribute('aria-valuenow',Math.min(100,tension));
    $('#progress-value').textContent=progress+'%';$('#progress-bar').style.width=progress+'%';$('.energy-track').setAttribute('aria-valuenow',progress);
    $('#progress-label').textContent=snag?'Gỡ mắc đáy':'Đưa cá lên bờ';$('.energy-track').setAttribute('aria-label',snag?'Tiến độ gỡ mắc đáy':'Tiến độ đưa cá lên bờ');
    $('#fight-title').textContent=snag?'MẮC ĐÁY':game.surge?'CÁ BỨT!':progress>=85?'GẦN LÊN BỜ!':'BÁM CÁ · GIỮ LỰC';
    $('#fight-hint').textContent=snag?'Bám điểm gỡ · Lực cần 15–35%':game.offTarget>3?'Sắp mất cá! Tay trái bám lại dấu cá.':!game.tracking?'Tay trái: giữ và bám theo cá':game.surge?'Cá bứt mạnh — hạ tay phải, tiếp tục bám cá.':tension>FIGHT_ZONE.max?'Hạ tay phải để giảm căng dây.':!game.pulling?'Tay phải: giữ cần, tránh dây chùng':game.accuracy<.4?'Tay trái đang lệch — bám dấu cá.':game.behavior.label+' · Giữ dây trong vùng xanh';
  }
  const scene=$('.scene'),w=scene.clientWidth,h=scene.clientHeight,frame=sceneFrame(w,h);
  scene.classList.toggle('has-cast-target',!!game.castTarget&&!game.busy);
  if(game.castTarget){const p=imageToScene(game.castTarget,frame);scene.style.setProperty('--cast-x',p.x+'px');scene.style.setProperty('--cast-y',p.y+'px');}
  const worldFloat=$('#world-float'),bp=game.baitPoint||game.castTarget;
  if(worldFloat){
    const show=!!game.spotData.video&&float&&!!bp&&['waiting','nibble','bite'].includes(phase);
    worldFloat.hidden=!show;
    if(show){
      const habitat=game.castHabitat||{far:0};
      const perspective=.56+(1-(habitat.far||0))*.58;
      const biteDip=(phase==='bite'?.24:phase==='nibble'?.08:0)*(game.enabled('rig')?.2+.8*game.float.sensitivity:1);
      const p=imageToScene(bp,frame);worldFloat.style.left=p.x+'px';worldFloat.style.top=p.y+'px';
      worldFloat.style.setProperty('--float-scale',perspective.toFixed(3));
      worldFloat.style.setProperty('--float-dip',biteDip);
      worldFloat.dataset.signal=phase==='bite'?'bite':phase==='nibble'?'nibble':game.signal==='wind'?'wind':'quiet';
    }
  }
  $('#float-zoom').hidden=!sceneReady||duel||!(pinSignal||['nibble','bite'].includes(phase));$('#float-label').textContent=float?(phase==='bite'?'Phao chìm':phase==='nibble'?'Phao rung':'Cận cảnh phao'):(phase==='bite'?'Giật cần!':phase==='nibble'?'Cần rung':lure&&game.retrieving?'Thu mồi':'Đầu cần');
  if(!float){const bend=phase==='bite'?23:phase==='nibble'?(reduced.matches?6:6+Math.sin(game.time*9)*4):0;$('#tip-rod').setAttribute('d',`M12 90Q28 ${55+bend} 78 ${12+bend}`);$('#tip-line').setAttribute('d',`M78 ${12+bend} 88 90`);}
  const n=game.float.visibleMarks,offset=44+(4-n)*8+(phase==='bite'?41:phase==='nibble'?(reduced.matches?4:Math.sin(game.time*9)*5):game.signal==='wind'?(reduced.matches?2:Math.sin(game.time*3)*3):0);
  $('#zoom-float').setAttribute('transform',`translate(0 ${offset})`);$('#session-clock').textContent=clock(player.settings.deadline?Math.max(0,player.settings.deadline-game.elapsed):game.elapsed);
  $('#session-end').hidden=!game.deadlineReached;$('.scene').classList.toggle('is-ended',game.deadlineReached);
  syncAtmosphere();if(sceneReady)audio.fishing(game);
}

function showDialog(title,body,actions=[],{canClose=true,kind='standard'}={}){
  clearRodHold();
  dialogPointerStarts.clear();
  const open=$('#dialog').open;if(!open){previousFocus=document.activeElement;dialogPaused=game.paused;game.paused=true;}
  $('#dialog').dataset.kind=kind;
  $('#dialog-content').innerHTML=`<div class="dialog-top"><h2 id="dialog-title">${esc(title)}</h2>${canClose?'<button class="close" id="dialog-close" aria-label="Đóng">×</button>':''}</div>${body}<div class="actions">${actions.map((a,i)=>`<button data-dialog-action="${i}" ${a.decision?`data-catch-decision="${a.decision}"`:''} class="${a.primary?'primary':''} ${a.copy?'decision-action':''}" ${a.disabled?'disabled':''}>${a.symbol?icon(a.symbol):''}<span class="action-title">${esc(a.label)}</span>${a.copy?`<small class="action-copy">${esc(a.copy)}</small>`:''}</button>`).join('')}</div>`;
  if($('#dialog-close'))$('#dialog-close').onclick=closeDialog;
  $$('[data-dialog-action]').forEach(b=>b.onclick=()=>actions[+b.dataset.dialogAction].action());
  if(!open)$('#dialog').showModal();
  syncAtmosphere();
}
function closeDialog(){$('#dialog').close();}
$('#dialog').addEventListener('close',()=>{dialogPointerStarts.clear();game.paused=dialogPaused||document.hidden;if(screen==='fishing')updateFishing();syncAtmosphere();if(previousFocus?.isConnected)previousFocus.focus();});
// A held fishing gesture can end after the catch dialog appears. Only a fresh
// pointer gesture that starts in this dialog may activate or dismiss it.
$('#dialog').addEventListener('pointerdown',e=>dialogPointerStarts.add(e.pointerId),true);
$('#dialog').addEventListener('click',e=>{
  const started=e.pointerId===undefined?dialogPointerStarts.size>0:dialogPointerStarts.has(e.pointerId);
  dialogPointerStarts.clear();
  if(e.detail>0&&!started){e.preventDefault();e.stopImmediatePropagation();}
},true);
$('#dialog').addEventListener('keydown',e=>{if(e.key!=='Tab')return;const focusable=[...$('#dialog').querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')].filter(el=>el.offsetParent!==null);const first=focusable[0],last=focusable.at(-1);if(!first){e.preventDefault();return;}if(e.shiftKey&&(document.activeElement===first||!$('#dialog').contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!$('#dialog').contains(document.activeElement))){e.preventDefault();first.focus();}});
$('#dialog').addEventListener('click',e=>{if(e.target===$('#dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
function showPause(){
  const resume=()=>{dialogPaused=false;game.paused=document.hidden;previousFocus=$('#main');closeDialog();announce('Tiếp tục buổi câu.');};
  showDialog('Nghỉ tay một nhịp',`<div class="pause-location">${icon('pin')}<div><strong>${game.map.name}</strong><span>${game.spotData.name} · ${clock(game.elapsed)} bên bờ nước</span></div></div><p class="hint-note">Cá và đồng hồ đang dừng. Khi sẵn sàng, mình lại câu tiếp.</p>${!game.busy?'<button id="pause-new-session" class="small">Bắt đầu buổi câu mới</button>':''}<div class="pause-options"><label class="checkline"><input type="checkbox" id="pause-assist" ${player.settings.assist?'checked':''}>Gợi ý đọc tín hiệu</label></div>${audioOptionsHTML('pause')}`,[{label:'Tiếp tục câu',primary:true,action:resume},{label:'Chuẩn bị lại',action:()=>{if(game.busy&&!player.pending)navigate('prepare');else{closeDialog();navigate('prepare');}}},{label:'Về nhà',action:()=>{if(game.busy&&!player.pending)navigate('home');else{closeDialog();navigate('home');}}}],{kind:'pause'});
  if($('#pause-new-session'))$('#pause-new-session').onclick=()=>{if(game.newSession()){dialogPaused=false;previousFocus=null;closeDialog();updateFishing();}};
  $('#pause-assist').onchange=e=>{player.settings.assist=e.target.checked;persist();updateFishing();};
  bindAudioOptions('pause');
  updateFishing();announce('Buổi câu đã tạm dừng.');
}
function showHelp(){showDialog('Một buổi câu, năm nhịp',`<ol class="help-steps"><li><b>Chuẩn bị trước khi đi câu.</b> Chọn map, góc bờ, cần và mồi rồi bấm Bắt đầu đi câu. Bản đồ có ${MAPS.length} vùng; sổ cá ghi cách tìm ${FISH.length} loài.</li><li><b>Thả câu.</b> Chờ cá đến mồi. Lure phải bật thu mồi; mồi giả dùng lại, mồi tự nhiên giữ qua thu cần, chỉ tiêu hao khi bị cá ăn, mất hoặc thay mới.</li><li><b>Giật đúng tín hiệu.</b> Câu phao: chờ chìm rõ. Câu đáy/lure: chờ đầu cần cong, dây căng. Giữ vùng tay phải để đóng lưỡi; tay trái bám theo dấu cá. Nhịp cơ bản 2,8 giây; lưỡi tốt tăng thời gian.</li><li><b>Dẫn trong vùng xanh.</b> Tay phải kéo lên để tăng lực, hạ xuống khi cá bứt. Tay trái phải di chuyển theo dấu cá; lệch quá lâu sẽ mất cá. Tiến độ đạt 100% sẽ tự vớt cá. Dây tăng sức tải, máy tăng tốc dẫn, phao giảm lực nước, vợt giúp vớt sớm.</li><li><b>Cá lên bờ.</b> Cho vào rọ hoặc thả cá. Về nhà với rọ để bán, nấu ăn hoặc nịnh vợ. Mỗi con cá chỉ dùng một lần. Xu và sổ cá lưu tự động. Tạm dừng → Chuẩn bị lại để đổi điểm câu, bộ cần hoặc mua thêm đồ.</li></ol><p class="hint-note">Cảm ứng: giữ hai vùng bằng hai ngón độc lập. Máy tính: chuột bám cá + giữ Space, phím ↑ ↓ chỉnh lực; hoặc W A S D bám cá + chuột giữ cần. P / Esc tạm dừng. Mắc đáy: bám điểm gỡ và giữ lực cần 15–35% trong vài giây.</p>`,[{label:screen==='fishing'?'Tiếp tục câu':'Chuẩn bị đi câu',primary:true,action:()=>{closeDialog();if(screen!=='fishing')navigate('prepare');}}]);}
function containerSelect(id){return `<label class="container-label" for="${id}">Cất cá trong</label><select id="${id}">${CONTAINERS.map(c=>`<option value="${c.id}" ${c.id===player.container?'selected':''}>${c.name}</option>`).join('')}</select>`;}
function showCatch(){
 const c=player.pending;if(!c)return;const def=getFish(c.fishId),id=c.id,container=getContainer(player.container),capacity=canStoreCatch(player.keptFish,c,player.container),usage=containerUsage(player.keptFish,player.container);
 showDialog('Cá lên bờ!',`<div class="catch-summary"><div class="fish-hero">${fishArt(def)}</div><div><p class="catch-banner">${icon('check')} Đã ghi vào sổ cá</p><h3>${def.name}</h3><p>${kg(c.weight)} kg <span>· ${getMap(c.mapId).name}</span></p></div></div><div class="catch-container">${containerSelect('catch-container')}<button class="small" id="catch-open-keepnet">${usage.count}/${usage.maxCount} con · ${kg(usage.kg)}/${usage.maxKg} kg ${icon('arrow')}</button></div><p class="catch-note">${capacity.ok?(game.atHome?'Cá được cất ở nhà. Sau đó mới chọn bán, nấu ăn hoặc nịnh vợ.':'Cá trong rọ sẽ mang về nhà khi chuyến câu kết thúc.'):'Rọ đã đầy hoặc cá vượt sức chứa. Đổi vật chứa, thả cá hoặc mang rọ về nhà. Cá vừa lên bờ vẫn được giữ nguyên.'}</p>${!capacity.ok?'<button class="small" id="catch-return-home">Về nhà để xử lý cá</button>':''}`,[
 {label:'Cho vào '+container.short,decision:'keep',symbol:'bag',copy:catchTeaser(c,'keep',player.container),disabled:!capacity.ok,primary:true,action:()=>finishCatch(id,'keep')},
 {label:'Thả cá',decision:'release',symbol:'leaf',copy:catchTeaser(c,'release'),action:()=>finishCatch(id,'release')}
 ],{kind:'catch'});
 $('#catch-container').onchange=e=>{if(!game.setContainer(e.target.value))toast(game.message);showCatch();};
 $('#catch-open-keepnet').onclick=()=>showKeepnet(true);
 if($('#catch-return-home'))$('#catch-return-home').onclick=()=>{if(game.returnHome()){closeDialog();changeScreen('home');showCatch();}};
}
function refreshCatchUI(){if(screen==='fishing')updateFishing();else render();}
function finishCatch(id,decision){if(game.resolveCatch(id,decision)){audio.cue(decision);closeDialog();refreshCatchUI();toast(game.message);}else toast(game.message);}
function showKeepnet(backToCatch=false){
 if(game.busy&&!player.pending){toast('Thu cần rồi mình xem cá trong rọ nhé.');return;}
 const home=game.atHome,container=getContainer(player.container),usage=containerUsage(player.keptFish,player.container),list=home?player.homeFish:player.keptFish,value=list.reduce((sum,c)=>sum+c.value,0);
 const fishActions=c=>home?`<button data-kept="${c.id}" data-fate="sell" aria-label="Bán cá, ${money(c.value)} xu">${icon('coin')} ${money(c.value)} xu</button><button data-kept="${c.id}" data-fate="cook">Nấu ăn</button><button data-kept="${c.id}" data-fate="gift">Nịnh vợ</button>`:`<button data-kept="${c.id}" data-fate="release">${icon('leaf')} Thả cá</button>`;
 showDialog(home?'Thành quả ở nhà':container.name,`<div class="keepnet-heading"><span>${list.length} con · ${money(value)} xu</span><span>${home?player.cooked+' đã nấu / '+player.gifted+' đã nịnh vợ':usage.count+'/'+usage.maxCount+' con · '+kg(usage.kg)+'/'+usage.maxKg+' kg'}</span></div>${!home?`<div class="catch-container">${containerSelect('keepnet-container')}</div>`:''}${list.length?`<div class="keepnet-list">${list.map(c=>{const f=getFish(c.fishId);return `<article class="keepnet-fish"><span class="keepnet-art">${fishArt(f)}</span><div><strong>${f.name}</strong><small>${kg(c.weight)} kg · ${getMap(c.mapId).name}</small></div><div class="keepnet-fish-actions">${fishActions(c)}</div></article>`;}).join('')}</div>`:`<p class="keepnet-empty">${home?'Chưa có cá mang về nhà.':'Rọ chưa có cá. Khi cá lên bờ, chọn cho vào rọ.'}</p>`}${!home?'<p class="hint-note">Về nhà để bán, nấu ăn hoặc nịnh vợ. Cá trong rọ không mất khi tải lại.</p>':''}`,[
 ...(home&&list.length?[{label:'Bán toàn bộ · '+money(value)+' xu',action:()=>{if(game.sellKeptFish()){audio.cue('sell');refreshCatchUI();showKeepnet(backToCatch);toast(game.message);}}}]:[]),
 ...(!home?[{label:'Mang rọ về nhà',action:()=>{if(game.returnHome()){closeDialog();changeScreen('home');if(player.pending)showCatch();else showKeepnet();}}}]:[]),
 {label:backToCatch?'Quay lại cá vừa lên bờ':'Xong',primary:true,action:()=>{if(backToCatch)showCatch();else{closeDialog();refreshCatchUI();}}}
 ],{kind:'keepnet'});
 if($('#keepnet-container'))$('#keepnet-container').onchange=e=>{if(!game.setContainer(e.target.value))toast(game.message);showKeepnet(backToCatch);};
 $$('[data-kept]').forEach(b=>b.onclick=()=>{if(game.resolveKeptCatch(b.dataset.kept,b.dataset.fate)){audio.cue(b.dataset.fate);refreshCatchUI();showKeepnet(backToCatch);toast(game.message);}});
}
function audioOptionsHTML(prefix){
  return `<fieldset class="audio-options"><legend>Âm thanh</legend><label class="checkline"><input id="${prefix}-sound" type="checkbox" ${player.settings.sound?'checked':''}>Nhạc nền & hiệu ứng</label>${[['music','Nhạc chill'],['effects','Hiệu ứng câu cá']].map(([key,label])=>`<div class="audio-volume"><label for="${prefix}-${key}">${label}</label><output id="${prefix}-${key}-value">${Math.round(player.settings[key]*100)}%</output><input id="${prefix}-${key}" type="range" min="0" max="100" step="5" value="${Math.round(player.settings[key]*100)}"></div>`).join('')}<p class="hint-note">${audioTheme(screen==='home'?'home':player.map).title} · Nhạc đổi theo vùng câu.</p></fieldset>`;
}
function bindAudioOptions(prefix){
  $('#'+prefix+'-sound').onchange=e=>setSound(e.target.checked);
  for(const key of ['music','effects']){const input=$('#'+prefix+'-'+key);input.oninput=e=>{player.settings[key]=+e.target.value/100;$('#'+prefix+'-'+key+'-value').value=e.target.value+'%';unlockAudio();audio.applySettings();persist();};if(key==='effects')input.onchange=()=>audio.cue('splash');}
}
function showFishingInfo(){
  showDialog('Bên bờ '+game.map.name,`<div class="fishing-info"><p><strong>${game.spotData.name}</strong> · Sâu ${game.spotData.depth.toFixed(1)} m</p><p>${game.rod.name} · ${game.rod.label}<br>${getBait(player.bait).name} · ${baitCount()}</p><label class="checkline"><input id="pin-signal" type="checkbox" ${pinSignal?'checked':''}>Luôn hiện cận cảnh tín hiệu</label><p class="hint-note">Cận cảnh tự hiện khi cá thăm mồi. Hai vùng tay hiện khi cần giật và dẫn cá.</p><a class="button small" href="#rig">Đổi mồi / đồ đã mang</a><button id="info-keepnet" ${game.busy&&!player.pending?'disabled':''}>${icon('fish')} ${getContainer(player.container).name} · ${player.keptFish.length} con</button></div>${audioOptionsHTML('info')}`,[{label:'Cách chơi',action:showHelp},{label:'Tiếp tục câu',primary:true,action:closeDialog}],{kind:'info'});
  $('#pin-signal').onchange=e=>{pinSignal=e.target.checked;updateFishing();};$('#info-keepnet').onclick=()=>showKeepnet();bindAudioOptions('info');
}
function showLesson(id){
  const l=LESSONS.find(l=>l.id===id);showDialog(l.name,`<p>${l.question}</p><div class="quiz-options">${l.options.map((o,i)=>`<button data-answer="${i}">${o}</button>`).join('')}</div><div id="quiz-feedback" class="quiz-feedback" aria-live="polite"></div>`);
  $$('[data-answer]').forEach(b=>b.onclick=()=>{const first=!player.lessons.includes(id),correct=game.answerLesson(id,+b.dataset.answer);if(correct){$('#quiz-feedback').className='quiz-feedback good';$('#quiz-feedback').textContent=l.explain+(first?' Hoàn thành, nhận 2.500 xu.':' Bài đã hoàn thành trước đó.');$$('[data-answer]').forEach(x=>x.disabled=true);const done=document.createElement('button');done.className='primary';done.textContent='Ghi vào sổ';done.onclick=()=>{closeDialog();render();};$('#dialog-content .actions').append(done);}else{$('#quiz-feedback').className='quiz-feedback bad';$('#quiz-feedback').textContent='Chưa đúng nhịp. Thử một lựa chọn khác.';}});
}
function showSettings(){
  showDialog('Tùy chọn bên bờ ao',`${audioOptionsHTML('global')}<div class="settingline"><label for="setting-assist">Gợi ý đọc tín hiệu</label><input id="setting-assist" type="checkbox" ${player.settings.assist?'checked':''}></div><label for="deadline">Giờ về nhà (tùy chọn)</label><select id="deadline"><option value="0" ${!player.settings.deadline?'selected':''}>Thư thả · Không giới hạn</option><option value="180" ${player.settings.deadline===180?'selected':''}>Một buổi 3 phút</option><option value="300" ${player.settings.deadline===300?'selected':''}>Một buổi 5 phút</option></select><p class="hint-note" style="margin-top:12px">Đồng hồ chạy khi chơi; dừng lúc tạm dừng, mở hộp thoại hoặc rời tab. Áp dụng ngay cho buổi hiện tại.</p><div class="rule"></div><p class="smalltext muted">Bản web v0.2 · Tiến độ lưu trên trình duyệt này. Xuất bản lưu để giữ một bản riêng. Cấp cần thủ tăng theo tổng cá đã câu: 5, 15, 30 và 60 con.</p>`,[{label:'Xuất bản lưu',action:exportSave},{label:'Xong',primary:true,action:closeDialog}]);
  bindAudioOptions('global');$('#setting-assist').onchange=e=>{player.settings.assist=e.target.checked;persist();};$('#deadline').onchange=e=>{player.settings.deadline=+e.target.value;persist();if(screen==='fishing')updateFishing();};
}
function exportSave(){const blob=new Blob([JSON.stringify(player,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tron-vo-di-cau-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Đã xuất bản lưu JSON.');}
$('#settings').onclick=showSettings;
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;e.preventDefault();if(a.classList.contains('skip')){$('#main').focus();return;}navigate(a.getAttribute('href').slice(1));});
addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
document.addEventListener('keydown',e=>{
  if(screen!=='fishing'||!sceneReady||$('#dialog').open||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;
  if((e.code==='KeyP'||e.code==='Escape')&&!e.repeat){e.preventDefault();showPause();return;}
  if(hands.keydown(e))return;
  if(e.code==='Space'&&!e.repeat&&!/^(BUTTON|A)$/.test(e.target.tagName)){
    e.preventDefault();unlockAudio();if(['idle','failed'].includes(game.phase))game.cast();else if(player.pending)showCatch();
  }
});
function suspendFishing(){clearRodHold();if(screen==='fishing'){game.paused=true;updateFishing();}syncAtmosphere();persist();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendFishing();else syncAtmosphere();});
document.addEventListener('pointerdown',unlockAudio,{capture:true});
document.addEventListener('keydown',unlockAudio,{capture:true});
addEventListener('blur',suspendFishing);
addEventListener('pagehide',persist);

function resizeCanvas(){if(!canvas)return;const box={width:canvas.clientWidth,height:canvas.clientHeight},dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);context.setTransform(dpr,0,0,dpr,0,0);paint();}
addEventListener('resize',()=>{clearRodHold();resizeCanvas();});
addEventListener('orientationchange',suspendFishing);
function paint(){
  if(!context||!canvas)return;const w=canvas.clientWidth,h=canvas.clientHeight,c=context,t=reduced.matches?0:game.time;c.clearRect(0,0,w,h);
  if(!game.spotData.video)paintWater(c,w,h,game,$('.scene-bg'),reduced.matches);
  const spot=game.spotData;
  if(game.phase==='casting'&&game.castFlight){
    const f=game.castFlight,p=Math.min(1,f.t),sx=f.start.x*w,sy=f.start.y*h,end=imageToScene(f.end,sceneFrame(w,h)),ex=end.x,ey=end.y;
    const x=sx+(ex-sx)*p,y=sy+(ey-sy)*p-Math.sin(Math.PI*p)*h*(.20+Math.abs(ex-sx)/w*.08);
    const far=game.castHabitat?.far||0,scale=(1-p)*1.05+p*(.56+(1-far)*.58);
    c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#e65a39';c.beginPath();c.ellipse(0,0,5,9,0,0,Math.PI*2);c.fill();c.strokeStyle='#fff6c8';c.lineWidth=2;c.beginPath();c.moveTo(0,-17);c.lineTo(0,2);c.stroke();c.restore();
    const rodTipX=w*.20,rodTipY=h*.46;c.strokeStyle='#FFFCF5B8';c.lineWidth=1;c.beginPath();c.moveTo(rodTipX,rodTipY);c.quadraticCurveTo((rodTipX+x)/2,Math.min(rodTipY,y)-h*.08,x,y);c.stroke();
    if(p>.86){const q=(p-.86)/.14;c.save();c.globalAlpha=1-q;c.strokeStyle='#fffbd0';c.lineWidth=1.5;c.beginPath();c.ellipse(ex,ey,8+q*25,2.5+q*8,0,0,Math.PI*2);c.stroke();for(let i=0;i<5;i++){const ang=-Math.PI*.85+i*Math.PI*.17,rr=8+q*18;c.beginPath();c.arc(ex+Math.cos(ang)*rr,ey+Math.sin(ang)*rr,1.5,0,Math.PI*2);c.fillStyle='#fffbd0';c.fill();}c.restore();}
  }
  // Chỉ đánh dấu góc bờ đã chọn ở màn Chuẩn bị.
  if(!game.busy&&!spot.video){c.beginPath();c.ellipse(spot.x*w,spot.y*h,23,8,0,0,Math.PI*2);c.strokeStyle='#FFFCF5';c.lineWidth=2.5;c.stroke();}
  const anchor=imageToScene(game.baitPoint||game.castTarget||game.defaultCastPoint,sceneFrame(w,h)),px=anchor.x,py=anchor.y;
  let fishX=px,fishY=py;
  if(['fight','snag'].includes(game.phase)){
    const marker=$('#fish-target');if(marker){marker.style.left=game.fishPosition.x*100+'%';marker.style.top=game.fishPosition.y*100+'%';}
    fishX=w*(.18+game.fishPosition.x*.64);fishY=h*(.32+game.fishPosition.y*.30);
    c.save();c.translate(fishX,fishY);c.rotate(game.velocity?Math.atan2(game.velocity.y,game.velocity.x):0);
    c.fillStyle=game.phase==='snag'?'#bd8142aa':'#183D3780';c.beginPath();c.ellipse(0,0,19,7,0,0,Math.PI*2);c.fill();
    c.beginPath();c.moveTo(-15,0);c.lineTo(-28,-9);c.lineTo(-28,9);c.closePath();c.fill();c.restore();
    c.strokeStyle=game.accuracy>.4?'#f5d893':'#e99b6a';c.lineWidth=1.7;c.beginPath();c.ellipse(fishX,fishY,31,13,0,0,Math.PI*2);c.stroke();
  }
  const endX=['fight','snag'].includes(game.phase)?fishX:px,endY=['fight','snag'].includes(game.phase)?fishY:py;
  const active=['waiting','nibble','bite','fight','snag'].includes(game.phase);
  const biteBend=!usesFloat(game.rod)?(game.phase==='bite'?h*.035:game.phase==='nibble'?Math.sin(t*9)*h*.008:0):0;
  const rodTip={x:w*.20+game.force*w*.09,y:h*(.46-game.force*.17)+biteBend};
  c.strokeStyle='#F4EDCF';c.lineWidth=5;c.beginPath();c.moveTo(w*.04,h*.98);c.quadraticCurveTo(w*.09,h*.66,rodTip.x,rodTip.y);c.stroke();c.strokeStyle='#6F6E43';c.lineWidth=1.4;c.stroke();
  if(active){c.strokeStyle='#FFFCF5CF';c.lineWidth=1;c.beginPath();c.moveTo(rodTip.x,rodTip.y);c.quadraticCurveTo((rodTip.x+endX)/2,rodTip.y+h*.04,endX,endY);c.stroke();
    const ripple=game.phase==='bite'||game.phase==='fight'?13:8;c.beginPath();c.ellipse(endX,endY,ripple+(Math.sin(t*4)+1)*4,3+(Math.sin(t*4)+1)*1.5,0,0,Math.PI*2);c.strokeStyle='#FFFCF599';c.lineWidth=1;c.stroke();
    if(usesFloat(game.rod)&&!spot.video&&game.phase!=='fight'){
      const dip=game.phase==='bite'?13:game.phase==='nibble'?Math.sin(t*9)*3:game.signal==='wind'?Math.sin(t*3)*2:0;
      c.save();c.beginPath();c.rect(0,0,w,endY);c.clip();const tip=endY-game.float.visibleMarks*3+dip;for(let i=0;i<8;i++){c.fillStyle=i%2?'#F6DE77':'#B44727';c.fillRect(endX-2,tip+i*3,4,3);}c.restore();
    }else if(game.rod.tech==='lure'&&game.phase!=='fight'){c.fillStyle='#D18B42';c.beginPath();c.ellipse(endX,endY+3,7,2,-.5,0,Math.PI*2);c.fill();}
  }
  if(game.paused&&!$('#dialog').open){c.fillStyle='#183D3730';c.fillRect(0,0,w,h);c.fillStyle='#FFFCF5';c.fillRect(w/2-94,h/2-25,188,50);c.font='14px Viet';c.textAlign='center';c.fillStyle='#183D37';c.fillText('Buổi câu tạm dừng',w/2,h/2+5);}
}
function frame(now){const dt=lastFrame?Math.min(.1,(now-lastFrame)/1000):0;lastFrame=now;if(screen==='fishing'&&sceneReady){hands.step(dt);game.step(dt);}if(now-lastUpdate>100){if(screen==='fishing')updateFishing();lastUpdate=now;}paint();requestAnimationFrame(frame);}
$('#brand-icon').innerHTML=icon('fish');$('#profile-avatar').innerHTML=avatarArt();$('#coin-icon').innerHTML=icon('coin');$('#settings').innerHTML=icon('settings');
$('#game-nav').innerHTML=NAV_ITEMS.map(([id,symbol,label])=>`<a href="#${id}" data-screen="${id}"><span class="dock-icon">${icon(symbol)}</span><span>${label}</span></a>`).join('');
screen=renderers[location.hash.slice(1)]?location.hash.slice(1):(game.atHome?'home':'prepare');if(!game.atHome&&screen==='home')screen='prepare';setHash(screen);render();if(screen==='fishing')setFishingOrientation(true);persist();requestAnimationFrame(frame);
if(player.pending)showCatch();
