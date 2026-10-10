import {RankedChallenge,RANKED_DT,RANKED_SECONDS,RANKED_RULES} from './ranked-challenge.js';
import {twoHands} from './two-hands.js';
import {getFish} from './content.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kg=g=>(g/1000).toLocaleString('vi-VN',{maximumFractionDigits:3})+' kg';
export function renderRanked(){return `<section class="ranked-page"><div class="online-heading"><div><p class="eyebrow">THỬ THÁCH TUẦN · CÙNG BỘ TRANG BỊ</p><h1>Ba phút bên bờ ao</h1></div><button id="ranked-leave" class="small">Rời thử thách</button></div><div class="ranked-readout"><span>Còn <b id="ranked-time">3:00</b></span><span><b id="ranked-count">0</b> cá</span><span id="ranked-weight">0 kg</span></div><p id="ranked-message" role="status">Chuẩn bị thả câu.</p><div class="ranked-scene"><img src="./assets/ao-lang.webp" alt="Bờ ao làng"><div class="ranked-float" id="ranked-float" aria-hidden="true"></div><div class="ranked-signal" id="ranked-signal">Thả câu để bắt đầu</div></div><div class="ranked-controls"><button id="track-pad" class="ranked-pad" aria-label="Tay trái bám cá"><span>TAY TRÁI · BÁM CÁ</span><i id="ranked-target"></i><i id="ranked-aim"></i></button><button id="strike" class="ranked-pad ranked-force" aria-label="Tay phải giữ và kéo lên xuống để chỉnh lực"><span>TAY PHẢI · GIỮ CẦN</span><i id="ranked-force-fill"></i><strong id="ranked-tension">0%</strong></button></div><div class="online-actions"><button id="ranked-cast" class="primary">Thả câu</button><button id="ranked-retrieve">Thu cần</button><button id="ranked-pause">Tạm dừng</button></div><p class="smalltext">Giật khi phao chìm. Tay trái bám cá, tay phải giữ lực vừa phải. PC: Space giữ cần, W A S D bám cá, ↑ ↓ chỉnh lực.</p><div id="ranked-results" aria-live="polite"></div></section>`;}
export function bindRanked(root,client,session,{leave,toast}){
 if(session.rules!==RANKED_RULES)throw Error('Phiên bản thử thách đã thay đổi. Hãy tải lại game.');
 const $=s=>root.querySelector(s),key='tron-vo-di-cau.ranked.'+client.user.id;
 let run=new RankedChallenge(session.seed),active=true,paused=false,finished=false,submitting=false,last=0,accumulator=0,raf;
 const hands=twoHands(run.controls,{canUse:()=>active&&!paused&&!run.finished,onUpdate:update,mouseTrackingEnabled:()=>matchMedia('(pointer:fine)').matches});
 function savePending(){try{client.storage.setItem(key,JSON.stringify({sessionId:session.id,events:run.events}));}catch{}}
 const previous=(()=>{try{return JSON.parse(client.storage.getItem(key)||'null');}catch{return null;}})();
 if(previous?.sessionId===session.id&&Array.isArray(previous.events)){// Only completed runs are stored for submission retry.
   run.events=previous.events;run.tick=RANKED_SECONDS/RANKED_DT;finished=true;
 }
 function update(){
   if(!active)return;const g=run.game,remaining=Math.max(0,Math.ceil(RANKED_SECONDS-run.tick*RANKED_DT));
   $('#ranked-time').textContent=Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0');$('#ranked-count').textContent=run.catches.length;$('#ranked-weight').textContent=kg(run.scoreGrams);
   $('#ranked-message').textContent=paused?'Đang tạm dừng. Bấm Tiếp tục để trở lại.':g.message;
   $('#ranked-target').style.left=g.fishPosition.x*100+'%';$('#ranked-target').style.top=g.fishPosition.y*100+'%';$('#ranked-target').hidden=!['fight','snag'].includes(g.phase);
   $('#ranked-aim').style.left=g.aim.x*100+'%';$('#ranked-aim').style.top=g.aim.y*100+'%';$('#ranked-aim').hidden=!g.tracking;
   $('#ranked-force-fill').style.height=g.force*100+'%';$('#ranked-tension').textContent=Math.round(g.tension||0)+'%';$('#ranked-tension').classList.toggle('danger',(g.tension||0)>88);
   $('#ranked-float').dataset.phase=g.phase;$('#ranked-signal').textContent={idle:'Sẵn sàng thả câu',failed:'Thả lại để thử tiếp',casting:'Đang thả câu…',waiting:'Phao yên · Chờ cá',nibble:'Cá đang thăm mồi',bite:'PHAO CHÌM · GIẬT CẦN',fight:g.surge?'CÁ BỨT · HẠ LỰC':'BÁM CÁ · GIỮ LỰC',snag:'MẮC ĐÁY · GIỮ NHẸ 15–35%'}[g.phase]||'';
   $('#ranked-cast').disabled=paused||run.finished||!['idle','failed'].includes(g.phase);$('#ranked-retrieve').disabled=paused||run.finished||!['casting','waiting','nibble','bite','snag'].includes(g.phase);
   $('#ranked-pause').textContent=paused?'Tiếp tục':'Tạm dừng';$('#ranked-pause').disabled=run.finished;
 }
 async function submit(){
   if(submitting)return;submitting=true;$('#ranked-results').innerHTML='<div class="panel">Đang xác nhận thành tích…</div>';
   try{const result=await client.request('ranked-submit',{method:'POST',body:{sessionId:session.id,events:run.events}});if(!active)return;client.storage.removeItem(key);$('#ranked-results').innerHTML=`<div class="panel"><h2>Đã xác nhận ${kg(result.scoreGrams)}</h2><p>${result.catches.length} cá · Thành tích đã được ghi nhận.</p><ul>${result.catches.map(c=>`<li>${esc(getFish(c.fishId).name)} · ${kg(c.weightGrams)}</li>`).join('')}</ul><button class="primary" id="ranked-back">Xem bảng xếp hạng</button></div>`;$('#ranked-back').onclick=leave;}
   catch(e){if(!active)return;$('#ranked-results').innerHTML=`<div class="panel"><p>${esc(e.message||'Chưa gửi được kết quả. Lượt chơi được giữ trên máy.')}</p><button id="ranked-retry">Gửi lại kết quả</button></div>`;$('#ranked-retry').onclick=submit;}
   finally{submitting=false;}
 }
 function tick(t){
   if(!active)return;const dt=last?Math.min(.2,(t-last)/1000):0;last=t;
   if(!paused&&!run.finished){accumulator+=dt;while(accumulator>=RANKED_DT&&!run.finished){hands.step(RANKED_DT);run.step();accumulator-=RANKED_DT;}update();}
   if(run.finished&&!finished){finished=true;savePending();hands.clear();update();submit();}
   raf=requestAnimationFrame(tick);
 }
 function pause(){if(run.finished)return;paused=true;hands.clear();accumulator=0;update();}
 function keydown(e){if(!active||paused||run.finished)return;if(hands.keydown(e))return;if(e.code==='Space'&&!e.repeat&&['idle','failed'].includes(run.game.phase)){e.preventDefault();run.command('cast');update();}}
 function hidden(){if(document.hidden)pause();}
 hands.bind();$('#ranked-cast').onclick=()=>{run.command('cast');update();};$('#ranked-retrieve').onclick=()=>{run.command('retrieve');update();};$('#ranked-pause').onclick=()=>{if(paused){paused=false;last=0;update();}else pause();};
 $('#ranked-leave').onclick=()=>{if(!run.finished&&!confirm('Rời buổi thi này? Bạn có thể vào lại từ đầu trước khi buổi thi hết hạn.'))return;leave();};
 addEventListener('keydown',keydown);addEventListener('blur',pause);document.addEventListener('visibilitychange',hidden);update();raf=requestAnimationFrame(tick);if(finished)submit();
 return {destroy(){active=false;cancelAnimationFrame(raf);hands.destroy();removeEventListener('keydown',keydown);removeEventListener('blur',pause);document.removeEventListener('visibilitychange',hidden);}};
}
