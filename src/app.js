import {MAPS,FISH,RODS,BAITS,LESSONS,getMap,getRod,getBait,getFish,usesFloat,usesReel} from './content.js';
import {FishingGame,floatMarks,rigError,clamp} from './engine.js';
import {loadPlayer,savePlayer} from './save.js';
import {icon,avatarArt,fishArt,NAV_ITEMS,rankFor,renderHome,renderPrepare,renderFishing,renderRig,renderLearn,journalRows as fishRows,renderJournal,renderShop,renderMapAtlas} from './ui.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('vi-VN').format(v);
const kg=v=>new Intl.NumberFormat('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);
let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};}
const loaded=loadPlayer(storage);let player=loaded.player,saveWarning=loaded.warning;
let screen='home',canvas=null,context=null,sceneObserver=null,toastTimer,previousFocus,dialogPaused=false,audioContext=null,lastPhase='idle',lastFrame=0,lastUpdate=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let game=new FishingGame(player,{onChange:gameChanged});

function persist(){if(!savePlayer(storage,player))saveWarning='Trình duyệt đang chặn lưu. Tiến độ chỉ giữ trong phiên này.';}
function announce(message){$('#live').textContent=message;}
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4200);announce(message);}
function gameChanged(){
  persist();updateWallet();
  if(screen==='fishing')updateFishing();
  if(game.phase!==lastPhase){if(game.phase==='bite')beep('bite');if(game.phase==='fight'){beep('hook');$('#fight')?.scrollIntoView({block:'nearest',behavior:reduced.matches?'auto':'smooth'});}if(game.phase==='landed'){beep('win');showCatch();}if(game.phase==='failed')beep('fail');lastPhase=game.phase;}
  announce(game.message);
}
function updateWallet(){
  $('#wallet').textContent=money(player.coins);
  const rank=rankFor(player.catches);
  $('#profile-rank').textContent=rank.name;$('#rank-count').textContent=rank.label;
  $('#rank-progress').max=rank.max;$('#rank-progress').value=rank.complete?rank.max:rank.count;
  $('#rank-progress').setAttribute('aria-valuetext',rank.name+', '+rank.label);
}
function beep(kind){
  if(!player.settings.sound)return;
  try{if(!audioContext)return;const tones=kind==='win'?[523,659,784]:kind==='bite'?[880,880]:kind==='hook'?[440,660]:[220];
    tones.forEach((frequency,i)=>{const t=audioContext.currentTime+i*.13,o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=frequency;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.045,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.11);o.connect(g);g.connect(audioContext.destination);o.start(t);o.stop(t+.12);});
  }catch{/* Không có âm thanh vẫn chơi được. */}
}
function unlockAudio(){if(!player.settings.sound)return;try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});}catch{}}

function homeHTML(){return renderHome(player,game,saveWarning);}
function prepareHTML(){return renderPrepare(player,game,saveWarning);}
function fishingHTML(){return renderFishing(player,game,saveWarning);}
function rigHTML(){return renderRig(player,game);}
function learnHTML(){return renderLearn(player);}
function journalRows(query='',map='all'){return fishRows(player,query,map);}
function journalHTML(){return renderJournal(player);}
function shopHTML(){return renderShop(player);}
function baitCount(){return getBait(player.bait).reusable?'Dùng lại':`${player.baits[player.bait]||0} phần`;}
let shopCategory='all';
function filterShop(category){
  shopCategory=['all','rod','bait','accessory','map'].includes(category)?category:'all';
  $('#shop-inventory').dataset.filter=shopCategory;
  $$('[data-category]').forEach(section=>section.hidden=shopCategory!=='all'&&section.dataset.category!==shopCategory);
  $$('[data-shop-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.shopCategory===shopCategory)));
}

const renderers={home:homeHTML,prepare:prepareHTML,fishing:fishingHTML,rig:rigHTML,learn:learnHTML,journal:journalHTML,shop:shopHTML};
function render(){sceneObserver?.disconnect();canvas=null;context=null;document.body.dataset.screen=screen;$('#main').innerHTML=renderers[screen]();$$('a[data-screen]').forEach(a=>{if(a.dataset.screen===screen)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});updateWallet();bindScreen();if(screen==='fishing'){canvas=$('#water');context=canvas.getContext('2d');sceneObserver=new ResizeObserver(resizeCanvas);sceneObserver.observe($('.scene'));resizeCanvas();updateFishing();paint();$('#main').focus({preventScroll:true});}}
function changeScreen(next){screen=next;setHash(next);if(next==='fishing')game.paused=document.hidden;render();window.scrollTo(0,0);$('#main').focus({preventScroll:true});}
function navigate(next){
  if(!renderers[next])next='home';if(next===screen)return;
  if(['waiting','nibble','bite','fight'].includes(game.phase)){
    setHash(screen);
    showDialog('Thu cần trước khi rời bờ?',`<p>Buổi câu đang diễn ra. Thu cần sẽ kết thúc lượt này; mồi đã dùng không được hoàn lại.</p>`,[{label:'Ở lại bờ',action:closeDialog},{label:'Thu cần & đi',primary:true,action:()=>{game.fail('Đã thu cần để rời bờ.');closeDialog();changeScreen(next);}}]);return;
  }
  changeScreen(next);
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
function bindScreen(){
  $$('[data-open-maps]').forEach(button=>button.onclick=showMaps);
  $$('[data-travel]').forEach(button=>button.onclick=()=>travel(button.dataset.travel));
  $$('[data-stock]').forEach(button=>button.onclick=()=>{const category=button.dataset.stock;navigate('shop');filterShop(category);});
  if(screen==='home'){
    $('#home-help').onclick=showHelp;$('#home-mode').onclick=showSettings;
  }
  if(screen==='prepare'){
    $$('[data-spot]').forEach(button=>button.onclick=()=>{if(game.selectSpot(+button.dataset.spot)){render();$(`[data-spot="${game.spot}"]`).focus();}});
    $('#prep-rod').onchange=e=>{if(game.equip('rod',e.target.value)){render();$('#prep-rod').focus();}else render();};
    $('#prep-bait').onchange=e=>{if(game.equip('bait',e.target.value)){render();$('#prep-bait').focus();}else render();};
    $('#start-fishing').onclick=()=>{unlockAudio();if(player.pending){showCatch();return;}navigate('fishing');};
  }
  if(screen==='fishing'){
    $('#help').onclick=showHelp;
    $('#pause').onclick=showPause;
    $('#leave-fishing').onclick=()=>navigate('home');
    $('#cast').onclick=()=>{unlockAudio();if(player.pending){showCatch();return;}game.cast();};
    $('#strike').onclick=()=>{unlockAudio();game.strike();};
    $('#retrieve').onclick=()=>{if(game.rod.tech==='lure'&&game.phase==='waiting'){game.toggleRetrieve();updateFishing();}else game.retrieve();};
    $('#pull').onclick=()=>{game.togglePull();updateFishing();};$('#ease').onclick=()=>{game.ease();updateFishing();};
    $('#new-session').onclick=()=>{if(game.newSession())render();};
  }
  if(screen==='rig'){
    $$('[data-equip]').forEach(button=>button.onclick=()=>{
      const id=button.dataset.equip;
      if(!player.rods.includes(id)){navigate('shop');filterShop('rod');return;}
      if(game.equip('rod',id))render();else toast('Xử lý lượt câu trước khi lắp đồ.');
    });
    $('#rod').onchange=e=>{if(game.equip('rod',e.target.value)){render();$('#rod').focus();}else render();};
    $('#bait').onchange=e=>{if(game.equip('bait',e.target.value)){updateRig();$('#bait-note').textContent=getBait(player.bait).note;}else render();};
    $$('[data-accessory]').forEach(select=>select.onchange=e=>{const id=e.target.id;if(game.equip(e.target.dataset.accessory,e.target.value)){render();$('#'+id).focus();}else toast('Phụ kiện chưa có hoặc không hợp bộ cần.');});
    $('#depth').oninput=e=>{game.setRig('depth',+e.target.value);updateRig();};
    $('#lead').oninput=e=>{game.setRig('lead',+e.target.value);updateRig();};
    $('#balance').onclick=()=>{if(game.balance()){updateRig();toast(game.message);}};
    $('#dig').onclick=()=>{if(game.digWorms()){render();toast(game.message);}};
  }
  if(screen==='learn')$$('[data-lesson]').forEach(b=>b.onclick=()=>showLesson(b.dataset.lesson));
  if(screen==='journal'){const filter=()=>$('#fish-results').innerHTML=journalRows($('#fish-search').value,$('#fish-map').value);$('#fish-search').oninput=filter;$('#fish-map').onchange=filter;$('#export').onclick=exportSave;}
  if(screen==='shop'){filterShop(shopCategory);$$('[data-shop-category]').forEach(button=>button.onclick=()=>filterShop(button.dataset.shopCategory));$$('[data-buy]').forEach(b=>b.onclick=()=>{if(game.buy(b.dataset.buy,b.dataset.id)){render();toast(game.message);}else toast('Chưa mua được. Kiểm tra số xu và bộ đã có.');});}
}
function updateRig(){const error=rigError(player);$('#depth-out').textContent=player.rig.depth.toFixed(1)+' m';$('#lead-out').textContent=player.rig.lead.toFixed(2)+' g';$('#lead').value=player.rig.lead;$('#rig-state').textContent=error||(usesFloat(game.rod)?`Phao nổi ${floatMarks(player)} vạch · Bộ câu sẵn sàng`:'Bộ câu sẵn sàng · Không dùng phao');$('#rig-state').classList.toggle('error',!!error);}
function clock(v){return `${String(Math.floor(v/60)).padStart(2,'0')}:${String(Math.floor(v%60)).padStart(2,'0')}`;}
function updateFishing(){
  if(!$('#cast'))return;
  const phase=game.phase,lure=game.rod.tech==='lure',float=usesFloat(game.rod),reel=usesReel(game.rod),active=['waiting','nibble','bite'].includes(phase);
  const names={idle:'Sẵn sàng',waiting:lure?'Mồi đang dưới nước':'Chờ cá tìm mồi',nibble:'Cá đang thăm mồi',bite:'Đúng nhịp — giật cần!',fight:game.surge?'Cá đang bứt — nới lực':'Dẫn cá nhẹ tay',landed:'Cá đã lên bờ',failed:'Thử lại một nhịp mới'};
  $('#status-title').textContent=game.paused?'Buổi câu tạm dừng':game.deadlineReached?'Đến giờ về nhà':(!player.settings.assist&&['nibble','bite'].includes(phase)?'Quan sát tín hiệu':names[phase]);
  $('#status-copy').textContent=game.message;
  $('#cast').disabled=(!['idle','failed','landed'].includes(phase)||game.paused||game.deadlineReached);
  $('#cast').innerHTML=player.pending?`${icon('fish')} Xem cá vừa câu`:`${icon('rod')} Thả câu <span class="key">Space</span>`;
  $('#strike').disabled=!active||game.paused;
  $('#retrieve').disabled=!active||game.paused;
  $('#retrieve').innerHTML=icon('arrow')+'<span>'+(lure&&phase==='waiting'?(game.retrieving?'Dừng thu mồi':'Bật thu mồi'):'Thu cần')+'</span>';
  $('#retrieve').setAttribute('aria-pressed',String(lure&&game.retrieving));
  $('#bank-count').textContent=baitCount();
  $('#pause').innerHTML=icon('pause');$('#pause').setAttribute('aria-label','Tạm dừng buổi câu');$('#pause').setAttribute('aria-pressed',String(game.paused));
  $('#fight').hidden=phase!=='fight';
  $('.scene').classList.toggle('is-fighting',phase==='fight');
  $('.scene').dataset.phase=phase;$('.scene').dataset.assist=String(player.settings.assist);
  const stage=(!player.settings.assist&&phase==='bite')?1:({idle:0,waiting:1,nibble:1,bite:2,fight:3,landed:4,failed:0}[phase]);
  $$('[data-phase-step]').forEach(el=>{el.classList.toggle('current',+el.dataset.phaseStep===stage);el.classList.toggle('done',+el.dataset.phaseStep<stage);});
  if(phase==='fight'){
    const tension=Math.round(game.tension),progress=Math.min(100,Math.round((100-game.energy)/(100-game.stats.landAt)*100));
    $('#tension-value').textContent=tension+'% lực căng';$('#tension-marker').style.left=`calc(${tension}% - 2px)`;
    $('.tension-track').setAttribute('aria-valuenow',tension);
    $('#progress-value').textContent=progress+'%';$('#progress-bar').style.width=progress+'%';$('.energy-track').setAttribute('aria-valuenow',progress);
    $('#pull').innerHTML=`${game.pulling?'Dừng':'Bật'} ${reel?'thu dây':'dẫn cá'} <span class="key">A</span>`;$('#pull').setAttribute('aria-pressed',String(game.pulling));
    $('#pull').disabled=game.paused;$('#ease').disabled=game.paused;
    $('#fight-hint').textContent=game.surge?'Cá bứt mạnh. Nới lực rồi chờ về vùng xanh.':tension>83?'Lực đang cao. Nới một nhịp.':'Vùng xanh: tiếp tục dẫn. Vùng đỏ: nới lực.';
  }
  $('#float-zoom').hidden=false;$('#float-label').textContent=float?(phase==='bite'?'Phao chìm rõ':phase==='nibble'?'Phao rung nhẹ':'Cận cảnh phao'):(phase==='bite'?'Đầu cần cong · Giật!':phase==='nibble'?'Đầu cần rung nhẹ':lure&&game.retrieving?'Đang thu mồi':'Đầu cần thả lỏng');
  if(!float){const bend=phase==='bite'?23:phase==='nibble'?(reduced.matches?6:6+Math.sin(game.time*9)*4):0;$('#tip-rod').setAttribute('d',`M12 90Q28 ${55+bend} 78 ${12+bend}`);$('#tip-line').setAttribute('d',`M78 ${12+bend} 88 90`);}
  const n=floatMarks(player),offset=44+(4-n)*8+(phase==='bite'?41:phase==='nibble'?(reduced.matches?4:Math.sin(game.time*9)*5):game.signal==='wind'?(reduced.matches?2:Math.sin(game.time*3)*3):0);
  $('#zoom-float').setAttribute('transform',`translate(0 ${offset})`);
  $('#session-clock').textContent=clock(player.settings.deadline?Math.max(0,player.settings.deadline-game.elapsed):game.elapsed);
  $('#session-end').hidden=!game.deadlineReached;
  $('.scene').classList.toggle('is-ended',game.deadlineReached);
}

function showDialog(title,body,actions=[],{canClose=true,kind='standard'}={}){
  const open=$('#dialog').open;if(!open){previousFocus=document.activeElement;dialogPaused=game.paused;game.paused=true;}
  $('#dialog').dataset.kind=kind;
  $('#dialog-content').innerHTML=`<div class="dialog-top"><h2 id="dialog-title">${esc(title)}</h2>${canClose?'<button class="close" id="dialog-close" aria-label="Đóng">×</button>':''}</div>${body}<div class="actions">${actions.map((a,i)=>`<button data-dialog-action="${i}" class="${a.primary?'primary':''}">${esc(a.label)}</button>`).join('')}</div>`;
  if($('#dialog-close'))$('#dialog-close').onclick=closeDialog;
  $$('[data-dialog-action]').forEach(b=>b.onclick=()=>actions[+b.dataset.dialogAction].action());
  if(!open)$('#dialog').showModal();
}
function closeDialog(){$('#dialog').close();}
$('#dialog').addEventListener('close',()=>{game.paused=dialogPaused||document.hidden;if(screen==='fishing')updateFishing();if(previousFocus?.isConnected)previousFocus.focus();});
$('#dialog').addEventListener('keydown',e=>{if(e.key!=='Tab')return;const focusable=[...$('#dialog').querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')].filter(el=>el.offsetParent!==null);const first=focusable[0],last=focusable.at(-1);if(!first){e.preventDefault();return;}if(e.shiftKey&&(document.activeElement===first||!$('#dialog').contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!$('#dialog').contains(document.activeElement))){e.preventDefault();first.focus();}});
$('#dialog').addEventListener('click',e=>{if(e.target===$('#dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
function showPause(){
  const resume=()=>{dialogPaused=false;game.paused=document.hidden;previousFocus=$('#main');closeDialog();announce('Tiếp tục buổi câu.');};
  showDialog('Nghỉ tay một nhịp',`<div class="pause-location">${icon('pin')}<div><strong>${game.map.name}</strong><span>${game.spotData.name} · ${clock(game.elapsed)} bên bờ nước</span></div></div><p class="hint-note">Cá và đồng hồ đang dừng. Bạn có thể tiếp tục câu hoặc thu cần để về chuẩn bị.</p>${!game.busy?'<button id="pause-new-session" class="small">Bắt đầu buổi câu mới</button>':''}<div class="pause-options"><label class="checkline"><input type="checkbox" id="pause-assist" ${player.settings.assist?'checked':''}>Gợi ý đọc tín hiệu</label><label class="checkline"><input type="checkbox" id="pause-sound" ${player.settings.sound?'checked':''}>Âm báo phao & cá</label></div>`,[{label:'Tiếp tục câu',primary:true,action:resume},{label:'Chuẩn bị lại',action:()=>{if(game.busy&&!player.pending)navigate('prepare');else{closeDialog();navigate('prepare');}}},{label:'Về bến',action:()=>{if(game.busy&&!player.pending)navigate('home');else{closeDialog();navigate('home');}}}],{kind:'pause'});
  if($('#pause-new-session'))$('#pause-new-session').onclick=()=>{if(game.newSession()){dialogPaused=false;previousFocus=null;closeDialog();render();}};
  $('#pause-assist').onchange=e=>{player.settings.assist=e.target.checked;persist();updateFishing();};
  $('#pause-sound').onchange=e=>{player.settings.sound=e.target.checked;unlockAudio();persist();};
  updateFishing();announce('Buổi câu đã tạm dừng.');
}
function showHelp(){showDialog('Một buổi câu, năm nhịp',`<ol class="help-steps"><li><b>Chuẩn bị ở bến.</b> Chọn map, góc bờ, cần và mồi rồi bấm Bắt đầu đi câu. Bản đồ có ${MAPS.length} vùng; sổ cá ghi cách tìm ${FISH.length} loài.</li><li><b>Thả câu.</b> Chờ cá đến mồi. Lure phải bật thu mồi; mồi giả dùng lại, mồi tự nhiên mất một phần mỗi lượt.</li><li><b>Giật đúng tín hiệu.</b> Câu phao: chờ chìm rõ. Câu đáy/lure: chờ đầu cần cong, dây căng. Nhịp cơ bản 2,8 giây; lưỡi tốt tăng thời gian.</li><li><b>Dẫn trong vùng xanh.</b> Nới khi cá bứt hoặc lực cao. Dây tăng sức tải, máy tăng tốc dẫn, phao giảm lực nước, vợt giúp vớt sớm.</li><li><b>Bán hoặc thả.</b> Xu và sổ cá lưu tự động. Tạm dừng → Chuẩn bị lại để đổi điểm câu, bộ cần hoặc mua thêm đồ.</li></ol><p class="hint-note">Bàn phím: Space thả/giật, A bật/tắt dẫn, D nới, P hoặc Esc tạm dừng. Mọi thao tác có nút tương đương.</p>`,[{label:screen==='fishing'?'Tiếp tục câu':'Chuẩn bị đi câu',primary:true,action:()=>{closeDialog();if(screen!=='fishing')navigate('prepare');}}]);}
function showCatch(){
  const c=player.pending;if(!c)return;const def=getFish(c.fishId),id=c.id;
  showDialog('CÁ LÊN BỜ!',`<p class="catch-banner">${icon('trophy')} ĐÃ GHI VÀO BỘ SƯU TẬP</p><div class="fish-hero">${fishArt(def,true)}</div><h3>${def.name}</h3><p class="muted smalltext">${getMap(c.mapId).name} · Đã ghi vào sổ cá</p><div class="catch-meta"><div><strong>${kg(c.weight)} kg</strong><small>Khối lượng trong game</small></div><div><strong>${money(c.value)} xu</strong><small>Giá bán</small></div></div><p class="hint-note">Thả cá vẫn giữ thành tích. Chọn một lần, rồi tiếp tục buổi câu.</p>`,[{label:'Thả về ao',action:()=>finishCatch(id,'release')},{label:'Bán '+money(c.value)+' xu',primary:true,action:()=>finishCatch(id,'sell')}],{kind:'catch'});
}
function finishCatch(id,decision){if(game.resolveCatch(id,decision)){closeDialog();render();toast(game.message);}}
function showLesson(id){
  const l=LESSONS.find(l=>l.id===id);showDialog(l.name,`<p>${l.question}</p><div class="quiz-options">${l.options.map((o,i)=>`<button data-answer="${i}">${o}</button>`).join('')}</div><div id="quiz-feedback" class="quiz-feedback" aria-live="polite"></div>`);
  $$('[data-answer]').forEach(b=>b.onclick=()=>{const first=!player.lessons.includes(id),correct=game.answerLesson(id,+b.dataset.answer);if(correct){$('#quiz-feedback').className='quiz-feedback good';$('#quiz-feedback').textContent=l.explain+(first?' Hoàn thành, nhận 2.500 xu.':' Bài đã hoàn thành trước đó.');$$('[data-answer]').forEach(x=>x.disabled=true);const done=document.createElement('button');done.className='primary';done.textContent='Ghi vào sổ';done.onclick=()=>{closeDialog();render();};$('#dialog-content .actions').append(done);}else{$('#quiz-feedback').className='quiz-feedback bad';$('#quiz-feedback').textContent='Chưa đúng nhịp. Thử một lựa chọn khác.';}});
}
function showSettings(){
  showDialog('Tùy chọn bên bờ ao',`<div class="settingline"><label for="sound">Âm báo phao & cá</label><input id="sound" type="checkbox" ${player.settings.sound?'checked':''}></div><div class="settingline"><label for="setting-assist">Gợi ý đọc tín hiệu</label><input id="setting-assist" type="checkbox" ${player.settings.assist?'checked':''}></div><label for="deadline">Giờ về nhà (tùy chọn)</label><select id="deadline"><option value="0" ${!player.settings.deadline?'selected':''}>Thư thả · Không giới hạn</option><option value="180" ${player.settings.deadline===180?'selected':''}>Một buổi 3 phút</option><option value="300" ${player.settings.deadline===300?'selected':''}>Một buổi 5 phút</option></select><p class="hint-note" style="margin-top:12px">Đồng hồ chạy khi chơi; dừng lúc tạm dừng, mở hộp thoại hoặc rời tab. Áp dụng ngay cho buổi hiện tại.</p><div class="rule"></div><p class="smalltext muted">Bản web v0.1 · Tiến độ lưu trên trình duyệt này. Xuất bản lưu để giữ một bản riêng. Cấp cần thủ tăng theo tổng cá đã câu: 5, 15, 30 và 60 con.</p>`,[{label:'Xuất bản lưu',action:exportSave},{label:'Xong',primary:true,action:closeDialog}]);
  $('#sound').onchange=e=>{player.settings.sound=e.target.checked;unlockAudio();persist();};$('#setting-assist').onchange=e=>{player.settings.assist=e.target.checked;persist();};$('#deadline').onchange=e=>{player.settings.deadline=+e.target.value;persist();if(screen==='fishing')updateFishing();};
}
function exportSave(){const blob=new Blob([JSON.stringify(player,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tron-vo-di-cau-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Đã xuất bản lưu JSON.');}
$('#settings').onclick=showSettings;
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;e.preventDefault();if(a.classList.contains('skip')){$('#main').focus();return;}navigate(a.getAttribute('href').slice(1));});
addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
document.addEventListener('keydown',e=>{if(screen!=='fishing'||$('#dialog').open||e.repeat||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();showPause();return;}if(/^(BUTTON|A)$/.test(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();unlockAudio();if(game.phase==='idle'||game.phase==='failed')game.cast();else if(['waiting','nibble','bite'].includes(game.phase))game.strike();else if(player.pending)showCatch();}if(e.code==='KeyA')game.togglePull();if(e.code==='KeyD')game.ease();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){game.paused=true;persist();if(screen==='fishing')updateFishing();}});
addEventListener('pagehide',persist);

function resizeCanvas(){if(!canvas)return;const box=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);context.setTransform(dpr,0,0,dpr,0,0);}
addEventListener('resize',resizeCanvas);
function paint(){
  if(!context||!canvas)return;const box=canvas.getBoundingClientRect(),w=box.width,h=box.height,c=context,t=reduced.matches?0:game.time;c.clearRect(0,0,w,h);
  const spot=game.spotData;
  // Chỉ đánh dấu góc bờ đã chọn ở màn Chuẩn bị.
  if(!game.busy){c.beginPath();c.ellipse(spot.x*w,spot.y*h,23,8,0,0,Math.PI*2);c.strokeStyle='#FFFCF5';c.lineWidth=2.5;c.stroke();}
  const px=spot.x*w,py=spot.y*h;
  let fishX=px,fishY=py;
  if(game.phase==='fight'){fishX=px+Math.sin(t*1.5)*w*.10*(game.energy/100);fishY=py+Math.cos(t*1.3)*h*.04;c.fillStyle='#183D3730';c.beginPath();c.ellipse(fishX,fishY+8,28,7,-.3,0,Math.PI*2);c.fill();}
  const endX=game.phase==='fight'?fishX:px,endY=game.phase==='fight'?fishY:py;
  const active=['waiting','nibble','bite','fight'].includes(game.phase);
  const biteBend=!usesFloat(game.rod)?(game.phase==='bite'?h*.035:game.phase==='nibble'?Math.sin(t*9)*h*.008:0):0;
  const rodTip={x:w*.20+(game.phase==='fight'&&game.pulling?w*.05:0),y:h*.39+biteBend};
  c.strokeStyle='#F4EDCF';c.lineWidth=5;c.beginPath();c.moveTo(w*.04,h*.98);c.quadraticCurveTo(w*.09,h*.66,rodTip.x,rodTip.y);c.stroke();c.strokeStyle='#6F6E43';c.lineWidth=1.4;c.stroke();
  if(active){c.strokeStyle='#FFFCF5CF';c.lineWidth=1;c.beginPath();c.moveTo(rodTip.x,rodTip.y);c.quadraticCurveTo((rodTip.x+endX)/2,rodTip.y+h*.04,endX,endY);c.stroke();
    const ripple=game.phase==='bite'||game.phase==='fight'?13:8;c.beginPath();c.ellipse(endX,endY,ripple+(Math.sin(t*4)+1)*4,3+(Math.sin(t*4)+1)*1.5,0,0,Math.PI*2);c.strokeStyle='#FFFCF599';c.lineWidth=1;c.stroke();
    if(usesFloat(game.rod)&&game.phase!=='fight'){
      const dip=game.phase==='bite'?13:game.phase==='nibble'?Math.sin(t*9)*3:game.signal==='wind'?Math.sin(t*3)*2:0;
      c.save();c.beginPath();c.rect(0,0,w,endY);c.clip();const tip=endY-floatMarks(player)*3+dip;for(let i=0;i<8;i++){c.fillStyle=i%2?'#F6DE77':'#B44727';c.fillRect(endX-2,tip+i*3,4,3);}c.restore();
    }else if(game.rod.tech==='lure'&&game.phase!=='fight'){c.fillStyle='#D18B42';c.beginPath();c.ellipse(endX,endY+3,7,2,-.5,0,Math.PI*2);c.fill();}
  }
  if(game.paused&&!$('#dialog').open){c.fillStyle='#183D3730';c.fillRect(0,0,w,h);c.fillStyle='#FFFCF5';c.fillRect(w/2-94,h/2-25,188,50);c.font='14px Viet';c.textAlign='center';c.fillStyle='#183D37';c.fillText('Buổi câu tạm dừng',w/2,h/2+5);}
}
function frame(now){const dt=lastFrame?Math.min(.1,(now-lastFrame)/1000):0;lastFrame=now;if(screen==='fishing')game.step(dt);if(now-lastUpdate>100){if(screen==='fishing')updateFishing();lastUpdate=now;}paint();requestAnimationFrame(frame);}
$('#brand-icon').innerHTML=icon('fish');$('#profile-avatar').innerHTML=avatarArt();$('#coin-icon').innerHTML=icon('coin');$('#settings').innerHTML=icon('settings');
$('#game-nav').innerHTML=NAV_ITEMS.map(([id,symbol,label])=>`<a href="#${id}" data-screen="${id}"><span class="dock-icon">${icon(symbol)}</span><span>${label}</span></a>`).join('');
screen=renderers[location.hash.slice(1)]?location.hash.slice(1):'home';setHash(screen);render();persist();requestAnimationFrame(frame);
if(player.pending)showCatch();
