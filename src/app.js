import {MAPS,FISH,RODS,BAITS,LESSONS,getMap,getRod,getBait,getFish} from './content.js';
import {FishingGame,floatMarks,rigError,clamp} from './engine.js';
import {loadPlayer,savePlayer,SAVE_KEY,newPlayer} from './save.js';

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
function updateWallet(){$('#wallet').textContent=money(player.coins);}
function beep(kind){
  if(!player.settings.sound)return;
  try{if(!audioContext)return;const tones=kind==='win'?[523,659,784]:kind==='bite'?[880,880]:kind==='hook'?[440,660]:[220];
    tones.forEach((frequency,i)=>{const t=audioContext.currentTime+i*.13,o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=frequency;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.045,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.11);o.connect(g);g.connect(audioContext.destination);o.start(t);o.stop(t+.12);});
  }catch{/* Không có âm thanh vẫn chơi được. */}
}
function unlockAudio(){if(!player.settings.sound)return;try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});}catch{}}

function fishArt(f,big=false){
  const dark=f?.color||'#6C8B76',id=f?.id||'unknown';
  const long=['fish_04','fish_05','fish_07','fish_10'].includes(id),rx=long?65:50,ry=long?17:26;
  const whisker=id==='fish_05'?'<path d="M153 38q17-12 26-3M154 46q22 6 25 18" fill="none" stroke="#655F3E" stroke-width="2"/>':'';
  const stripes=['fish_06','fish_11','fish_12'].includes(id)?'<path d="M76 21l-6 38M92 19l-6 43M108 21l-4 37" stroke="#FFF" stroke-opacity=".28" stroke-width="4"/>':'';
  return `<svg viewBox="0 0 200 88" aria-hidden="true"><path d="M${95-rx} 44 15 24 15 64Z" fill="${dark}"/><path d="M76 24 96 9 119 25M81 61l20 14 17-16" fill="${dark}" opacity=".72"/><ellipse cx="98" cy="44" rx="${rx}" ry="${ry}" fill="${dark}"/><path d="M${98-rx+12} 49q45 22 ${rx*2-22} -3" fill="none" stroke="#FFF" stroke-opacity=".22" stroke-width="3"/>${stripes}<path d="M140 31q-9 12 0 23" stroke="#183D37" fill="none" opacity=".35"/><circle cx="147" cy="37" r="3.5" fill="#FFFCF5"/><circle cx="148" cy="37" r="1.8" fill="#183D37"/>${whisker}</svg>`;
}
function toolArt(kind){
  const path=kind==='rod'?'<path d="M9 42 39 5M39 5q-3 9-2 17v18q0 7-7 3"/>':kind==='map'?'<path d="m5 36 13-22 8 12 7-19 11 29ZM6 41q10-5 21 0t18 0"/>':'<path d="M12 33q-8-16 8-17t8 15q-8 13 8 9M17 16q2-9 10-10"/>';
  return `<svg viewBox="0 0 50 50" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${path}</g></svg>`;
}
function warningHTML(){return saveWarning?`<div class="save-warning">${esc(saveWarning)}</div>`:'';}
function homeHTML(){
  const known=Object.keys(player.collection).length;
  return `${warningHTML()}<div class="hero"><div class="hero-picture"><img src="./assets/ao-lang.webp" alt="Ao làng Việt Nam, cầu tre và những ngôi nhà bên bờ nước"><span class="hero-note">AO LÀNG · Một buổi sớm chưa vội</span></div><section class="hero-copy"><p class="eyebrow">Trốn Vợ Đi Câu · Bản web v0.1</p><h1>Bỏ lại ồn ào.<br>Ra ao một lát.</h1><p class="intro">Một chiếc cần tre, vài con giun.<br>Học đọc phao, chờ đúng nhịp,<br>gặp những con cá quen của quê nhà.</p><div class="actions"><a class="button primary" href="#fishing">${player.casts?'Tiếp tục buổi câu':'Xách cần ra ao'} <span aria-hidden="true">&nbsp;↗</span></a><button id="home-help">Cách chơi</button></div><div class="home-stats"><div><strong class="num">${player.catches}</strong><small>cá đã câu</small></div><div><strong class="num">${known}/12</strong><small>loài đã gặp</small></div><div><strong class="num">${player.maps.length}/3</strong><small>điểm đã mở</small></div></div><p class="fineprint">Chơi ngay · Không đăng nhập · Xu trong game</p></section></div><div class="home-bottom"><article><span class="stepnum">01</span><h3>Chọn một góc bờ</h3><p>Mỗi tầng nước, mỗi loại mồi dẫn đến một cuộc gặp khác.</p></article><article><span class="stepnum">02</span><h3>Chờ đúng nhịp</h3><p>Đừng giật khi phao chỉ rung. Chờ cá ngậm mồi, rồi giữ lực vừa đủ.</p></article><article><span class="stepnum">03</span><h3>Giữ lại một lần gặp</h3><p>Bán để sắm đồ, hoặc thả về ao. Sổ vẫn nhớ con cá đẹp nhất.</p></article></div>`;
}
function floatSVG(){return `<svg viewBox="0 0 72 130" aria-hidden="true"><g id="zoom-float"><path d="M36 12v87" stroke="#263F37" stroke-width="3"/>${Array.from({length:8},(_,i)=>`<path d="M36 ${12+i*8}v8" stroke="${i%2?'#F2D876':'#B44727'}" stroke-width="5"/>`).join('')}<ellipse cx="36" cy="83" rx="7" ry="16" fill="#7A8561"/><path d="M36 99v19" stroke="#183D37" stroke-width="2"/></g><path d="M0 88h72v42H0Z" fill="#E4EDE7" opacity=".95"/><path d="M3 88q15-4 33 0t33 0" class="float-water"/></svg>`;}
function fishingHTML(){
  return `${warningHTML()}<div class="page-head"><div><p class="eyebrow">Buổi câu của bạn</p><h1 id="map-heading">${game.map.name}</h1><p id="map-description">${game.map.caption}. Cần nhẹ tay, mắt nhìn phao.</p></div><div class="actions"><button id="help">Cách chơi</button><button id="pause" aria-pressed="${game.paused}">${game.paused?'Tiếp tục':'Tạm dừng'}</button></div></div><div class="map-strip">${MAPS.map(m=>`<button data-map="${m.id}" aria-pressed="${m.id===player.map}" ${!player.maps.includes(m.id)?'disabled':''}>${m.name}${!player.maps.includes(m.id)?' · chưa mở':''}</button>`).join('')}<span class="map-hint">Mở thêm điểm tại cửa hàng</span></div><div class="fishing-layout"><section><div class="scene" data-map="${player.map}"><img class="scene-bg" src="./assets/ao-lang.webp" alt=""><canvas id="water" role="img" aria-label="Ao câu, cần, dây và phao. Dùng các nút phía dưới để chơi."></canvas><div class="scene-caption"><strong id="spot-name">${game.spotData.name}</strong><span id="spot-depth">Sâu ${game.spotData.depth.toFixed(1)} m</span> · <span id="tech-label">${game.rod.label}</span></div><div class="float-zoom" id="float-zoom"><span id="float-label">Cận cảnh phao</span>${floatSVG()}</div></div><div class="water-controls"><button class="primary" id="cast">Thả câu <span class="key">Space</span></button><button class="green" id="strike" disabled>Giật cần <span class="key">Space</span></button><button id="retrieve" disabled>Thu cần</button></div><div class="status-box"><span id="status-title">Sẵn sàng</span><span id="status-copy">${esc(game.message)}</span></div><div class="fight" id="fight" hidden><div class="meter-head"><strong id="fight-title">Dẫn cá</strong><span id="tension-value" class="num">44% lực căng</span></div><div class="tension-track" role="meter" aria-label="Lực căng dây" aria-valuemin="0" aria-valuemax="100" aria-valuenow="44"><i class="tension-marker" id="tension-marker"></i></div><p class="smalltext muted" id="fight-hint" style="margin:9px 0 12px">Giữ trong vùng xanh. Nới khi cá bứt.</p><div class="meter-head"><span>Đưa cá lên bờ</span><span id="progress-value" class="num">0%</span></div><div class="energy-track" role="progressbar" aria-label="Tiến độ đưa cá lên bờ" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="progress-bar"></i></div><div class="fight-actions"><button class="green" id="pull" aria-pressed="false">Bật dẫn cá <span class="key">A</span></button><button id="ease">Nới lực <span class="key">D</span></button></div></div></section><aside class="bank-panel"><h2>Bên bờ ao</h2><div class="bank-spots"><h3>Điểm thả mồi</h3><div class="spot-list">${game.map.spots.map((s,i)=>`<button data-spot="${i}" aria-pressed="${i===game.spot}"><span>${s.name}</span><small>${s.depth.toFixed(1)} m</small></button>`).join('')}</div></div><div class="bank-equipment"><h3>Bộ đang lắp</h3><div class="spec"><span>Cần</span><strong id="bank-rod">${game.rod.name}</strong></div><div class="spec"><span>Mồi</span><strong id="bank-bait">${getBait(player.bait).name}</strong></div><div class="spec"><span>Còn lại</span><strong id="bank-count" class="num">${baitCount()}</strong></div><div class="spec"><span>Tầng mồi</span><strong>${player.rig.depth.toFixed(1)} m</strong></div><a class="button" style="width:100%;margin-top:14px" href="#rig">Chỉnh bộ câu</a></div><div class="bank-guide"><div class="rule"></div><label class="checkline"><input type="checkbox" id="assist" ${player.settings.assist?'checked':''}>Gợi ý đọc tín hiệu</label><p class="hint-note">Phao rung nhẹ: chờ.<br>Phao chìm rõ: giật cần.<br>Cá bứt, lực đỏ: nới.</p><div class="deadline"><span id="timer-label">${player.settings.deadline?'Giờ về nhà':'Thời gian bên ao'}</span><strong id="session-clock" class="num">00:00</strong></div><button id="new-session" style="width:100%;margin-top:12px" hidden>Buổi câu mới</button></div></aside></div>`;
}
function baitCount(){return player.bait==='lure'?'Dùng lại':`${player.baits[player.bait]||0} phần`;}
function rigHTML(){
  const marks=floatMarks(player),lure=game.rod.tech==='lure';
  return `<div class="page-head"><div><p class="eyebrow">Chuẩn bị trước khi xuống nước</p><h1>Bàn đồ</h1><p>Lắp bộ phù hợp, chỉnh tầng mồi và cân phao. Cần tre luôn có sẵn để bắt đầu lại.</p></div><a class="button primary" href="#fishing">Mang ra ao ↗</a></div><div class="rig-layout"><section class="rig-form"><h2>Bộ câu của bạn</h2><label for="rod">Cần và kỹ thuật</label><select id="rod">${RODS.filter(r=>player.rods.includes(r.id)).map(r=>`<option value="${r.id}" ${r.id===player.rod?'selected':''}>${r.name} · ${r.label}</option>`).join('')}</select><p class="smalltext muted" style="margin-top:10px">${game.rod.note}</p><label for="bait">Mồi câu</label><select id="bait">${BAITS.filter(b=>lure?b.id==='lure':b.id!=='lure').map(b=>`<option value="${b.id}" ${b.id===player.bait?'selected':''}>${b.name} · ${b.id==='lure'?'dùng lại':(player.baits[b.id]||0)+' phần'}</option>`).join('')}</select><p class="smalltext muted" id="bait-note" style="margin-top:10px">${getBait(player.bait).note}</p><div class="rule"></div><h3>Mồi miễn phí</h3><p class="smalltext muted">Đào thêm 6 phần giun, tối đa 60. Không cần chờ hay mua xu.</p><button id="dig">Đào giun +6</button><p class="smalltext" id="worm-count" style="margin-top:12px">Bạn đang có ${player.baits.worm} phần giun.</p></section><section class="rig-drawing"><svg viewBox="0 0 310 360" aria-label="Minh họa bộ cần và phao"><path d="M27 300 217 27" stroke="#7C704D" stroke-width="7" stroke-linecap="round"/><path d="M217 27q16 8 18 38v233" stroke="#5C7064" stroke-width="1.5" fill="none"/><path d="M235 105v74" stroke="#183D37" stroke-width="3"/>${Array.from({length:8},(_,i)=>`<path d="M235 ${106+i*6}v6" stroke="${i%2?'#F5CC5B':'#B44727'}" stroke-width="5"/>`).join('')}<ellipse cx="235" cy="177" rx="9" ry="22" fill="#7B8856"/><path d="M235 299q0 24-13 18q-6-2-4-8" stroke="#183D37" fill="none" stroke-width="2"/><path d="M219 313q-10-15-2-18" stroke="#9B7652" fill="none" stroke-width="4"/><path d="M137 224q58-8 130 0" stroke="#729B88" fill="none" stroke-width="2" stroke-dasharray="5 6"/>${lure?'<circle cx="62" cy="262" r="14" fill="#183D37"/><path d="M62 262h19" stroke="#183D37" stroke-width="3"/>':''}</svg><p>${lure?'Bộ lure có máy và mồi mềm. Ra ao, bật thu mồi để cá chú ý.':'Bộ câu tay: cần, dây, phao, chì và lưỡi. Lắp nhẹ, đọc tín hiệu rõ.'}</p></section><section class="rig-summary"><h2>Tầng mồi & phao</h2><div class="input-head"><label for="depth">Độ sâu mồi</label><output id="depth-out">${player.rig.depth.toFixed(1)} m</output></div><input id="depth" type="range" min="0.4" max="3.2" step="0.1" value="${player.rig.depth}" ${lure?'disabled':''}><p class="hint-note">Điểm hiện tại sâu ${game.spotData.depth.toFixed(1)} m. Cá ăn đáy cần mồi gần đáy; cá giữa nước ở tầng nông hơn.</p><div class="input-head"><label for="lead">Chì cân phao</label><output id="lead-out">${player.rig.lead.toFixed(2)} g</output></div><input id="lead" type="range" min="0.7" max="1.5" step="0.01" value="${player.rig.lead}" ${lure?'disabled':''}><div id="rig-state" class="rig-state ${rigError(player)?'error':''}">${lure?'Bộ lure: không dùng phao.':rigError(player)||`Phao nổi ${marks} vạch · Bộ câu sẵn sàng`}</div><button id="balance" ${lure?'disabled':''}>Cân về 4 vạch</button><p class="fineprint">Các mức tải và độ sâu là tham số mô phỏng của bản v0.1.</p></section></div>`;
}
function learnHTML(){return `<div class="page-head"><div><p class="eyebrow">Mỗi lần ra ao, biết thêm một chút</p><h1>Sổ học cần thủ</h1><p>Ba quyết định nhỏ để bắt đầu. Mỗi bài hoàn thành lần đầu thưởng 2.500 xu.</p></div><span class="pill">${player.lessons.length}/3 bài hoàn thành</span></div><div class="split"><section class="lesson-list">${LESSONS.map((l,i)=>`<article class="lesson-row"><span class="lesson-number">0${i+1}</span><div><h3>${l.name}</h3><p>${l.question}</p></div><button data-lesson="${l.id}" ${player.lessons.includes(l.id)?'':'class="green"'}>${player.lessons.includes(l.id)?'Ôn lại':'Bắt đầu'}</button></article>`).join('')}<p class="fineprint">Kiến thức phục vụ cơ chế game. Danh mục sinh học và tình huống ngoài đời cần chuyên gia rà soát trước khi phát hành đầy đủ.</p></section><aside class="learning-aside"><p class="eyebrow">Ghi nhớ bên bờ ao</p><h2>Nhẹ tay.<br>Chậm một nhịp.</h2><p>Phao rung chưa chắc là cá ăn. Khi cá bứt mạnh, kéo thêm chưa chắc đưa cá gần hơn.</p><div class="rule"></div><p>Đọc một tín hiệu, làm một việc.<br>Sai nhịp thì thả lại. Cần tre và giun miễn phí luôn còn đó.</p><a class="button green" href="#fishing">Thử ngay ở ao ↗</a></aside></div>`;}
function journalRows(query=''){
  const rows=FISH.filter(f=>f.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
  return rows.length?rows.map(f=>{const c=player.collection[f.id];return `<article class="fish-row ${c?'':'unknown'}"><div class="fish-art">${fishArt(f)}</div><div><h3>${f.name}</h3><p>${c?`Đã gặp ${c.count} lần · Lớn nhất ${kg(c.best)} kg`:'Chưa câu được'}</p><p>${f.maps.map(id=>getMap(id).name).join(' · ')}</p></div></article>`;}).join(''):'<p class="empty">Không có loài phù hợp. Thử tên ngắn hơn.</p>';
}
function journalHTML(){return `<div class="page-head"><div><p class="eyebrow">Những lần gặp bên bờ nước</p><h1>Sổ cá</h1><p>Cá đã thả vẫn được ghi lại. Thành tích lớn nhất thuộc về lần gặp, không thuộc về chiếc giỏ.</p></div><button id="export">Xuất bản lưu</button></div><div class="journal-summary"><div><strong>${Object.keys(player.collection).length}/12</strong><small>loài đã gặp</small></div><div><strong>${player.catches}</strong><small>cá đã câu</small></div><div><strong>${player.released}</strong><small>cá đã thả</small></div><div><strong>${player.sold}</strong><small>cá đã bán</small></div></div><div class="filter"><label class="search-label" for="fish-search">Tìm theo tên cá</label><input id="fish-search" type="search" placeholder="Chép, rô, lóc…" autocomplete="off"></div><div class="fish-list" id="fish-results">${journalRows()}</div><p class="fineprint">Hình cá là phác thảo minh họa. Phân bố và tập tính trong bản game là mô hình giả tưởng đang được rà soát.</p>`;}
function shopButton(kind,item,owned=false){return `<button data-buy="${kind}" data-id="${item.id}" ${owned||player.coins<item.price?'disabled':''} ${owned?'':'class="green"'}>${owned?'Đã có':player.coins<item.price?'Thiếu xu':'Mua '+money(item.price)}</button>`;}
function shopHTML(){return `<div class="page-head"><div><p class="eyebrow">Đủ đồ cho một buổi câu</p><h1>Cửa hàng bên bến</h1><p>Xu kiếm từ cá và bài học. Chọn bộ câu trước, rồi chọn mồi hợp với bộ.</p></div><span class="pill num">Ví: ${money(player.coins)} xu</span></div><div class="shop-grid"><div><section class="shop-section"><h2>Cần & kỹ thuật</h2>${RODS.map(r=>`<article class="product"><div class="product-icon">${toolArt('rod')}</div><div><h3>${r.name}</h3><p>${r.note}</p><span class="price">${r.price?money(r.price)+' xu':'Luôn miễn phí'}</span></div>${shopButton('rod',r,player.rods.includes(r.id))}</article>`).join('')}</section><section class="shop-section"><h2>Những góc bờ mới</h2>${MAPS.map(m=>`<article class="product map-row"><div class="product-icon">${toolArt('map')}</div><div><h3>${m.name}</h3><p>${m.caption}. Mở một lần, trở lại bao nhiêu lần cũng được.</p><span class="price">${m.price?money(m.price)+' xu':'Bến khởi đầu miễn phí'}</span></div>${shopButton('map',m,player.maps.includes(m.id))}</article>`).join('')}</section></div><section><h2>Mồi câu</h2>${BAITS.filter(b=>b.id!=='lure').map(b=>`<article class="product"><div class="product-icon">${toolArt('bait')}</div><div><h3>${b.name} · ${b.amount} phần</h3><p>${b.note}</p><span class="price">${money(b.price)} xu · Đang có ${player.baits[b.id]}</span></div>${shopButton('bait',b)}</article>`).join('')}<div class="rule"></div><h3>Ví hết xu vẫn ra ao</h3><p class="hint-note">Cần tre có sẵn, giun đào miễn phí. Không có mua xu, quảng cáo hoặc đồng hồ chờ trong bản này.</p><a class="button" href="#rig">Về bàn đồ đào giun</a></section></div>`;}

const renderers={home:homeHTML,fishing:fishingHTML,rig:rigHTML,learn:learnHTML,journal:journalHTML,shop:shopHTML};
function render(){sceneObserver?.disconnect();canvas=null;context=null;$('#main').innerHTML=renderers[screen]();$$('[data-screen]').forEach(a=>{if(a.dataset.screen===screen)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});updateWallet();bindScreen();if(screen==='fishing'){canvas=$('#water');context=canvas.getContext('2d');sceneObserver=new ResizeObserver(resizeCanvas);sceneObserver.observe($('.scene'));resizeCanvas();updateFishing();paint();}}
function navigate(next){
  if(!renderers[next])next='home';if(next===screen)return;
  if(['waiting','nibble','bite','fight'].includes(game.phase)){
    setHash(screen);
    showDialog('Thu cần trước khi rời ao?',`<p>Buổi câu đang diễn ra. Thu cần sẽ kết thúc lượt này; mồi đã dùng không được hoàn lại.</p>`,[{label:'Ở lại ao',action:closeDialog},{label:'Thu cần & đi',primary:true,action:()=>{game.fail('Đã thu cần để rời ao.');closeDialog();screen=next;setHash(next);render();window.scrollTo(0,0);}}]);return;
  }
  screen=next;setHash(next);render();window.scrollTo(0,0);
}
function setHash(next){history.replaceState(null,'','#'+next);}
function bindScreen(){
  if(screen==='home')$('#home-help').onclick=showHelp;
  if(screen==='fishing'){
    $('#help').onclick=showHelp;
    $('#pause').onclick=()=>{game.paused=!game.paused;updateFishing();announce(game.paused?'Buổi câu đã tạm dừng.':'Tiếp tục buổi câu.');};
    $('#cast').onclick=()=>{unlockAudio();if(player.pending){showCatch();return;}game.cast();};
    $('#strike').onclick=()=>{unlockAudio();game.strike();};
    $('#retrieve').onclick=()=>{if(game.rod.tech==='lure'&&game.phase==='waiting'){game.toggleRetrieve();updateFishing();}else game.retrieve();};
    $('#pull').onclick=()=>{game.togglePull();updateFishing();};$('#ease').onclick=()=>{game.ease();updateFishing();};
    $$('[data-map]').forEach(b=>b.onclick=()=>{if(game.selectMap(b.dataset.map))render();});
    $$('[data-spot]').forEach(b=>b.onclick=()=>{if(game.selectSpot(+b.dataset.spot))render();});
    $('#assist').onchange=e=>{player.settings.assist=e.target.checked;persist();};
    $('#new-session').onclick=()=>{if(game.newSession())render();};
    $('#water').onclick=e=>{if(game.busy||game.deadlineReached)return;const box=e.currentTarget.getBoundingClientRect(),x=(e.clientX-box.left)/box.width;let closest=0,d=2;game.map.spots.forEach((s,i)=>{const dist=Math.abs(s.x-x);if(dist<d){d=dist;closest=i;}});if(game.selectSpot(closest))render();};
  }
  if(screen==='rig'){
    $('#rod').onchange=e=>{player.rod=e.target.value;player.bait=game.rod.tech==='lure'?'lure':'worm';balanceRig();persist();render();};
    $('#bait').onchange=e=>{player.bait=e.target.value;persist();updateRig();$('#bait-note').textContent=getBait(player.bait).note;};
    $('#depth').oninput=e=>{player.rig.depth=+e.target.value;persist();updateRig();};
    $('#lead').oninput=e=>{player.rig.lead=+e.target.value;persist();updateRig();};
    $('#balance').onclick=()=>{balanceRig();persist();updateRig();toast('Phao đã cân về 4 vạch.');};
    $('#dig').onclick=()=>{if(game.digWorms()){render();toast(game.message);}};
  }
  if(screen==='learn')$$('[data-lesson]').forEach(b=>b.onclick=()=>showLesson(b.dataset.lesson));
  if(screen==='journal'){$('#fish-search').oninput=e=>$('#fish-results').innerHTML=journalRows(e.target.value);$('#export').onclick=exportSave;}
  if(screen==='shop')$$('[data-buy]').forEach(b=>b.onclick=()=>{if(game.buy(b.dataset.buy,b.dataset.id)){render();toast(game.message);}else toast('Chưa mua được. Kiểm tra số xu và bộ đã có.');});
}
function balanceRig(){player.rig.lead=+(1.4-.06-getBait(player.bait).mass-4*.045).toFixed(2);}
function updateRig(){const error=rigError(player);$('#depth-out').textContent=player.rig.depth.toFixed(1)+' m';$('#lead-out').textContent=player.rig.lead.toFixed(2)+' g';$('#lead').value=player.rig.lead;$('#rig-state').textContent=error||`Phao nổi ${floatMarks(player)} vạch · Bộ câu sẵn sàng`;$('#rig-state').classList.toggle('error',!!error);}
function clock(v){return `${String(Math.floor(v/60)).padStart(2,'0')}:${String(Math.floor(v%60)).padStart(2,'0')}`;}
function updateFishing(){
  if(!$('#cast'))return;
  const phase=game.phase,lure=game.rod.tech==='lure',active=['waiting','nibble','bite'].includes(phase);
  const names={idle:'Sẵn sàng',waiting:lure?'Mồi đang dưới nước':'Chờ cá tìm mồi',nibble:'Cá đang thăm mồi',bite:'Đúng nhịp — giật cần!',fight:game.surge?'Cá đang bứt — nới lực':'Dẫn cá nhẹ tay',landed:'Cá đã lên bờ',failed:'Thử lại một nhịp mới'};
  $('#status-title').textContent=game.paused?'Buổi câu tạm dừng':game.deadlineReached?'Đến giờ về nhà':(!player.settings.assist&&['nibble','bite'].includes(phase)?'Quan sát tín hiệu':names[phase]);
  $('#status-copy').textContent=game.message;
  $('#cast').disabled=(!['idle','failed','landed'].includes(phase)||game.paused||game.deadlineReached);
  $('#cast').innerHTML=player.pending?'Xem cá vừa câu':`Thả câu <span class="key">Space</span>`;
  $('#strike').disabled=!active||game.paused;
  $('#retrieve').disabled=!active||game.paused;
  $('#retrieve').textContent=lure&&phase==='waiting'?(game.retrieving?'Dừng thu mồi':'Bật thu mồi'):'Thu cần';
  $('#retrieve').setAttribute('aria-pressed',String(lure&&game.retrieving));
  $('#bank-count').textContent=baitCount();
  $$('[data-spot],[data-map]').forEach(b=>b.disabled=game.busy||game.deadlineReached||(b.dataset.map&&!player.maps.includes(b.dataset.map)));
  $('#pause').textContent=game.paused?'Tiếp tục':'Tạm dừng';$('#pause').setAttribute('aria-pressed',String(game.paused));
  $('#fight').hidden=phase!=='fight';
  $('.scene').classList.toggle('is-fighting',phase==='fight');
  if(phase==='fight'){
    const tension=Math.round(game.tension),progress=Math.round(100-game.energy);
    $('#tension-value').textContent=tension+'% lực căng';$('#tension-marker').style.left=`calc(${tension}% - 2px)`;
    $('.tension-track').setAttribute('aria-valuenow',tension);
    $('#progress-value').textContent=progress+'%';$('#progress-bar').style.width=progress+'%';$('.energy-track').setAttribute('aria-valuenow',progress);
    $('#pull').innerHTML=`${game.pulling?'Dừng':'Bật'} ${lure?'thu dây':'dẫn cá'} <span class="key">A</span>`;$('#pull').setAttribute('aria-pressed',String(game.pulling));
    $('#pull').disabled=game.paused;$('#ease').disabled=game.paused;
    $('#fight-hint').textContent=game.surge?'Cá bứt mạnh. Nới lực rồi chờ về vùng xanh.':tension>83?'Lực đang cao. Nới một nhịp.':'Vùng xanh: tiếp tục dẫn. Vùng đỏ: nới lực.';
  }
  $('#float-zoom').hidden=lure;$('#float-label').textContent=phase==='bite'?'Phao chìm rõ':phase==='nibble'?'Phao rung nhẹ':'Cận cảnh phao';
  const n=floatMarks(player),offset=44+(4-n)*8+(phase==='bite'?41:phase==='nibble'?(reduced.matches?4:Math.sin(game.time*9)*5):game.signal==='wind'?(reduced.matches?2:Math.sin(game.time*3)*3):0);
  $('#zoom-float').setAttribute('transform',`translate(0 ${offset})`);
  $('#session-clock').textContent=clock(player.settings.deadline?Math.max(0,player.settings.deadline-game.elapsed):game.elapsed);
  $('#new-session').hidden=!game.deadlineReached&&!['idle','failed'].includes(phase);
}

function showDialog(title,body,actions=[],{canClose=true}={}){
  const open=$('#dialog').open;if(!open){previousFocus=document.activeElement;dialogPaused=game.paused;game.paused=true;}
  $('#dialog-content').innerHTML=`<div class="dialog-top"><h2 id="dialog-title">${esc(title)}</h2>${canClose?'<button class="close" id="dialog-close" aria-label="Đóng">×</button>':''}</div>${body}<div class="actions">${actions.map((a,i)=>`<button data-dialog-action="${i}" class="${a.primary?'primary':''}">${esc(a.label)}</button>`).join('')}</div>`;
  if($('#dialog-close'))$('#dialog-close').onclick=closeDialog;
  $$('[data-dialog-action]').forEach(b=>b.onclick=()=>actions[+b.dataset.dialogAction].action());
  if(!open)$('#dialog').showModal();
}
function closeDialog(){$('#dialog').close();}
$('#dialog').addEventListener('close',()=>{game.paused=dialogPaused||document.hidden;if(screen==='fishing')updateFishing();if(previousFocus?.isConnected)previousFocus.focus();});
$('#dialog').addEventListener('keydown',e=>{if(e.key!=='Tab')return;const focusable=[...$('#dialog').querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')].filter(el=>el.offsetParent!==null);const first=focusable[0],last=focusable.at(-1);if(!first){e.preventDefault();return;}if(e.shiftKey&&(document.activeElement===first||!$('#dialog').contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!$('#dialog').contains(document.activeElement))){e.preventDefault();first.focus();}});
$('#dialog').addEventListener('click',e=>{if(e.target===$('#dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
function showHelp(){showDialog('Một buổi câu, năm nhịp',`<ol class="help-steps"><li><b>Chọn điểm.</b> Mặc định giun, cần tre, mồi sát đáy. Chỉnh mồi ở Bàn đồ.</li><li><b>Thả câu.</b> Chờ cá đến mồi. Lure phải bật thu mồi.</li><li><b>Giật khi phao chìm rõ.</b> Rung nhẹ có thể là gió hoặc cá thăm mồi. Cửa sổ giật dài 2,8 giây.</li><li><b>Dẫn trong vùng xanh.</b> Bật dẫn cá; nới lực khi cá bứt hoặc lực cao. Kéo mãi có thể đứt dây.</li><li><b>Bán hoặc thả.</b> Xu và sổ cá được lưu tự động trên trình duyệt.</li></ol><p class="hint-note">Bàn phím: Space thả/giật, A bật/tắt dẫn, D nới, P tạm dừng. Mọi thao tác có nút tương đương.</p>`,[{label:'Ra ao thử',primary:true,action:()=>{closeDialog();if(screen!=='fishing')navigate('fishing');}}]);}
function showCatch(){
  const c=player.pending;if(!c)return;const def=getFish(c.fishId),id=c.id;
  showDialog('Một lần gặp cá đẹp',`<div class="fish-hero">${fishArt(def,true)}</div><h3>${def.name}</h3><p class="muted smalltext">${getMap(c.mapId).name} · Đã ghi vào sổ cá</p><div class="catch-meta"><div><strong>${kg(c.weight)} kg</strong><small>Khối lượng trong game</small></div><div><strong>${money(c.value)} xu</strong><small>Giá bán</small></div></div><p class="hint-note">Thả cá vẫn giữ thành tích. Chọn một lần, rồi tiếp tục buổi câu.</p>`,[{label:'Thả về ao',action:()=>finishCatch(id,'release')},{label:'Bán '+money(c.value)+' xu',primary:true,action:()=>finishCatch(id,'sell')}]);
}
function finishCatch(id,decision){if(game.resolveCatch(id,decision)){closeDialog();render();toast(game.message);}}
function showLesson(id){
  const l=LESSONS.find(l=>l.id===id);showDialog(l.name,`<p>${l.question}</p><div class="quiz-options">${l.options.map((o,i)=>`<button data-answer="${i}">${o}</button>`).join('')}</div><div id="quiz-feedback" class="quiz-feedback" aria-live="polite"></div>`);
  $$('[data-answer]').forEach(b=>b.onclick=()=>{const first=!player.lessons.includes(id),correct=game.answerLesson(id,+b.dataset.answer);if(correct){$('#quiz-feedback').className='quiz-feedback good';$('#quiz-feedback').textContent=l.explain+(first?' Hoàn thành, nhận 2.500 xu.':' Bài đã hoàn thành trước đó.');$$('[data-answer]').forEach(x=>x.disabled=true);const done=document.createElement('button');done.className='primary';done.textContent='Ghi vào sổ';done.onclick=()=>{closeDialog();render();};$('#dialog-content .actions').append(done);}else{$('#quiz-feedback').className='quiz-feedback bad';$('#quiz-feedback').textContent='Chưa đúng nhịp. Thử một lựa chọn khác.';}});
}
function showSettings(){
  showDialog('Tùy chọn bên bờ ao',`<div class="settingline"><label for="sound">Âm báo phao & cá</label><input id="sound" type="checkbox" ${player.settings.sound?'checked':''}></div><div class="settingline"><label for="setting-assist">Gợi ý đọc tín hiệu</label><input id="setting-assist" type="checkbox" ${player.settings.assist?'checked':''}></div><label for="deadline">Giờ về nhà (tùy chọn)</label><select id="deadline"><option value="0" ${!player.settings.deadline?'selected':''}>Thư thả · Không giới hạn</option><option value="180" ${player.settings.deadline===180?'selected':''}>Một buổi 3 phút</option><option value="300" ${player.settings.deadline===300?'selected':''}>Một buổi 5 phút</option></select><p class="hint-note" style="margin-top:12px">Đồng hồ chạy khi chơi; dừng lúc tạm dừng, mở hộp thoại hoặc rời tab. Áp dụng ngay cho buổi hiện tại.</p><div class="rule"></div><p class="smalltext muted">Tiến độ nằm trên trình duyệt này. Xuất bản lưu để giữ một bản riêng.</p>`,[{label:'Xuất bản lưu',action:exportSave},{label:'Xong',primary:true,action:closeDialog}]);
  $('#sound').onchange=e=>{player.settings.sound=e.target.checked;unlockAudio();persist();};$('#setting-assist').onchange=e=>{player.settings.assist=e.target.checked;persist();};$('#deadline').onchange=e=>{player.settings.deadline=+e.target.value;persist();if(screen==='fishing')updateFishing();};
}
function exportSave(){const blob=new Blob([JSON.stringify(player,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tron-vo-di-cau-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Đã xuất bản lưu JSON.');}
$('#settings').onclick=showSettings;
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a||a.classList.contains('skip'))return;e.preventDefault();navigate(a.getAttribute('href').slice(1));});
addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
document.addEventListener('keydown',e=>{if(screen!=='fishing'||$('#dialog').open||/^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(e.target.tagName)||e.repeat)return;if(e.code==='Space'){e.preventDefault();unlockAudio();if(game.phase==='idle'||game.phase==='failed')game.cast();else if(['waiting','nibble','bite'].includes(game.phase))game.strike();else if(player.pending)showCatch();}if(e.code==='KeyA')game.togglePull();if(e.code==='KeyD')game.ease();if(e.code==='KeyP'){game.paused=!game.paused;updateFishing();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){game.paused=true;persist();if(screen==='fishing')updateFishing();}});
addEventListener('pagehide',persist);

function resizeCanvas(){if(!canvas)return;const box=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);context.setTransform(dpr,0,0,dpr,0,0);}
addEventListener('resize',resizeCanvas);
function paint(){
  if(!context||!canvas)return;const box=canvas.getBoundingClientRect(),w=box.width,h=box.height,c=context,t=reduced.matches?0:game.time;c.clearRect(0,0,w,h);
  const spot=game.spotData;
  // Điểm thả mồi có nút tương đương bên cạnh cảnh.
  if(!game.busy)game.map.spots.forEach((s,i)=>{c.beginPath();c.ellipse(s.x*w,s.y*h,23,8,0,0,Math.PI*2);c.strokeStyle=i===game.spot?'#FFFCF5':'#FFFCF580';c.lineWidth=i===game.spot?2.5:1.5;c.setLineDash(i===game.spot?[]:[4,4]);c.stroke();c.setLineDash([]);});
  const px=spot.x*w,py=spot.y*h;
  let fishX=px,fishY=py;
  if(game.phase==='fight'){fishX=px+Math.sin(t*1.5)*w*.10*(game.energy/100);fishY=py+Math.cos(t*1.3)*h*.04;c.fillStyle='#183D3730';c.beginPath();c.ellipse(fishX,fishY+8,28,7,-.3,0,Math.PI*2);c.fill();}
  const endX=game.phase==='fight'?fishX:px,endY=game.phase==='fight'?fishY:py;
  const active=['waiting','nibble','bite','fight'].includes(game.phase);
  const rodTip={x:w*.20+(game.phase==='fight'&&game.pulling?w*.05:0),y:h*.39};
  c.strokeStyle='#F4EDCF';c.lineWidth=5;c.beginPath();c.moveTo(w*.04,h*.98);c.quadraticCurveTo(w*.09,h*.66,rodTip.x,rodTip.y);c.stroke();c.strokeStyle='#6F6E43';c.lineWidth=1.4;c.stroke();
  if(active){c.strokeStyle='#FFFCF5CF';c.lineWidth=1;c.beginPath();c.moveTo(rodTip.x,rodTip.y);c.quadraticCurveTo((rodTip.x+endX)/2,rodTip.y+h*.04,endX,endY);c.stroke();
    const ripple=game.phase==='bite'||game.phase==='fight'?13:8;c.beginPath();c.ellipse(endX,endY,ripple+(Math.sin(t*4)+1)*4,3+(Math.sin(t*4)+1)*1.5,0,0,Math.PI*2);c.strokeStyle='#FFFCF599';c.lineWidth=1;c.stroke();
    if(game.rod.tech!=='lure'&&game.phase!=='fight'){
      const dip=game.phase==='bite'?13:game.phase==='nibble'?Math.sin(t*9)*3:game.signal==='wind'?Math.sin(t*3)*2:0;
      c.save();c.beginPath();c.rect(0,0,w,endY);c.clip();const tip=endY-floatMarks(player)*3+dip;for(let i=0;i<8;i++){c.fillStyle=i%2?'#F6DE77':'#B44727';c.fillRect(endX-2,tip+i*3,4,3);}c.restore();
    }else if(game.rod.tech==='lure'&&game.phase!=='fight'){c.fillStyle='#D18B42';c.beginPath();c.ellipse(endX,endY+3,7,2,-.5,0,Math.PI*2);c.fill();}
  }
  if(game.paused&&!$('#dialog').open){c.fillStyle='#183D3730';c.fillRect(0,0,w,h);c.fillStyle='#FFFCF5';c.fillRect(w/2-94,h/2-25,188,50);c.font='14px Viet';c.textAlign='center';c.fillStyle='#183D37';c.fillText('Buổi câu tạm dừng',w/2,h/2+5);}
}
function frame(now){const dt=lastFrame?Math.min(.1,(now-lastFrame)/1000):0;lastFrame=now;if(screen==='fishing')game.step(dt);if(now-lastUpdate>100){if(screen==='fishing')updateFishing();lastUpdate=now;}paint();requestAnimationFrame(frame);}
screen=renderers[location.hash.slice(1)]?location.hash.slice(1):'home';setHash(screen);render();persist();requestAnimationFrame(frame);
if(player.pending)showCatch();
