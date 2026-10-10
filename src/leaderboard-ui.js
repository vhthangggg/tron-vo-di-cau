import {getFish} from './content.js';
import {icon,fishArt} from './ui.js';
import {fishingPeriod} from './fishing-stats.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>Number(v||0).toLocaleString('vi-VN');
const kg=v=>(Number(v||0)/1000).toLocaleString('vi-VN',{maximumFractionDigits:3})+' kg';
const BOARDS=[['catches','fish','Câu nhiều nhất',10],['released','leaf','Phóng sinh nhiều nhất',10],['biggest','trophy','Cá lớn nhất',3]];
const lunarCan=['Canh','Tân','Nhâm','Quý','Giáp','Ất','Bính','Đinh','Mậu','Kỷ'];
const lunarChi=['Thân','Dậu','Tuất','Hợi','Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi'];
function lunarDate(iso){
 try{
  const parts=new Intl.DateTimeFormat('en-u-ca-chinese',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date(iso+'T00:00:00Z'));
  const value=type=>Number(parts.find(part=>part.type===type)?.value);
  const month=value('month'),day=value('day'),year=Number(parts.find(part=>part.type==='relatedYear')?.value);
  if(!month||!day||!year)throw Error('lunar date unavailable');
  return String(day)+'/'+String(month)+' âm lịch năm '+lunarCan[year%10]+' '+lunarChi[year%12];
 }catch{return 'Âm lịch chưa khả dụng';}
}
function boardShell(){return BOARDS.map(([id,symbol,title,limit])=>`<section class="panel fishing-board" data-fishing-board="${id}"><div class="fishing-board-heading">${icon(symbol)}<div><span>TOP ${limit} CẦN THỦ</span><h2>${title}</h2></div></div><div data-fishing-results="${id}"><p class="fishing-board-empty">Đang tải thành tích…</p></div></section>`).join('');}
export function renderLeaderboard(){return `<section class="leaderboard-page"><div class="online-heading"><div><p class="eyebrow">HỘI CẦN THỦ</p><h1>Bảng xếp hạng</h1><p class="leaderboard-intro">Những buổi câu đáng nhớ. Những con cá được trở về.</p></div><a class="button small" href="#home">${icon('home')} Về nhà</a></div><div class="leaderboard-toolbar"><div class="leaderboard-periods" role="group" aria-label="Thời gian xếp hạng">${[['day','Ngày'],['week','Tuần'],['all','Toàn thời gian']].map(([id,label])=>`<button data-fishing-period="${id}" aria-pressed="${id==='day'}">${label}</button>`).join('')}</div><button class="small" id="fishing-board-refresh">Làm mới</button></div><p class="leaderboard-period-caption" id="fishing-period-caption"></p><p id="fishing-board-status" role="status" class="leaderboard-status"></p><div class="fishing-board-grid" aria-busy="true">${boardShell()}</div><section class="panel fishing-personal"><h2>Thành tích của bạn trên máy</h2><div id="fishing-personal-stats"></div><p>Đăng nhập và đồng bộ tiến độ để ghi tên lên bảng. Thành tích bắt đầu ghi theo ngày từ bản cập nhật này.</p><a class="button small" href="#online">${icon('bag')} Tài khoản & đồng bộ ${icon('arrow')}</a></section><p class="leaderboard-note">Ngày tính theo giờ Việt Nam; tuần bắt đầu từ thứ Hai. Mỗi bảng xếp hạng người chơi, mỗi người xuất hiện một lần. Bảng cá lớn nhất lấy trọng lượng của một con cá.</p></section>`;}
export function bindLeaderboard(root,client,player){
 const $=s=>root.querySelector(s);let period='day',alive=true,generation=0;
 function describe(){
  const range=fishingPeriod(period),date=day=>new Date(day+'T00:00:00Z').toLocaleDateString('vi-VN',{timeZone:'UTC'});
  const until=range.until&&new Date(Date.parse(range.until+'T00:00:00Z')-86400000).toISOString().slice(0,10);
  $('#fishing-period-caption').textContent=period==='all'?'Toàn thời gian · Giờ Việt Nam':period==='day'?`Hôm nay · ${date(range.day)} dương lịch · ${lunarDate(range.day)} · Giờ Việt Nam`:`Tuần này · Từ ${date(range.from)} đến ${date(until)} dương lịch · ${lunarDate(range.from)} đến ${lunarDate(until)} · Giờ Việt Nam`;
  const rows=(player.systems?.fishingStats||[]).filter(r=>(!range.from||r.day>=range.from)&&(!range.until||r.day<range.until));
  const catches=rows.reduce((n,r)=>n+r.catches,0),released=rows.reduce((n,r)=>n+r.released,0),best=Math.max(0,...rows.map(r=>r.best?.weightGrams||0));
  $('#fishing-personal-stats').innerHTML=`<span><strong>${number(catches)}</strong> cá đã câu</span><span><strong>${number(released)}</strong> cá đã phóng sinh</span><span><strong>${best?kg(best):'—'}</strong> cá lớn nhất</span>`;
 }
 function empty(message){for(const [id] of BOARDS)$(`[data-fishing-results="${id}"]`).innerHTML=`<p class="fishing-board-empty">${esc(message)}</p>`;}
 function renderBoards(data){
  for(const [id,,title,limit] of BOARDS){
   const board=data.boards?.[id]||{rows:[]},rows=(board.rows||[]).slice(0,limit);
   const score=n=>id==='biggest'?kg(n):number(n)+' con';
   $(`[data-fishing-results="${id}"]`).innerHTML=rows.length?`<ol class="fishing-rank-list" aria-label="${title}">${rows.map(r=>`<li class="${r.self?'is-self':''}"><span class="fishing-place ${r.rank<=3?'podium-place':''}">${r.rank}</span><div class="fishing-ranked-name"><strong>${esc(r.name)}${r.self?'<small> · Bạn</small>':''}</strong>${id==='biggest'&&r.fishId?`<span>${esc(getFish(r.fishId).name)}</span>`:''}</div><b class="fishing-ranked-score">${score(r.score)}</b>${id==='biggest'&&r.fishId?`<div class="fishing-ranked-art">${fishArt(getFish(r.fishId))}</div>`:''}</li>`).join('')}</ol>${board.me?`<p class="my-rank">Bạn: hạng ${number(board.me.rank)} · ${score(board.me.score)}</p>`:''}`:'<p class="fishing-board-empty">Chưa có thành tích trong khoảng thời gian này.</p>';
  }
 }
 async function load(){
  const id=++generation;describe();$('.fishing-board-grid').setAttribute('aria-busy','true');$('#fishing-board-status').textContent='Đang tải bảng xếp hạng…';
  if(!client.config.enabled){empty('Chưa có dữ liệu trực tuyến.');$('#fishing-board-status').textContent='Bảng đang chờ kết nối cơ sở dữ liệu online. Thành tích của bạn vẫn được ghi trên thiết bị.';$('.fishing-board-grid').setAttribute('aria-busy','false');return;}
  try{
   const data=await client.request('leaderboard',{query:{board:'fishing',period}});if(!alive||id!==generation)return;
   renderBoards(data);$('#fishing-board-status').textContent='Thành tích từ các buổi câu thông thường đã đồng bộ. Bảng được làm mới khi bạn mở trang hoặc bấm Làm mới.';
  }catch(e){if(!alive||id!==generation)return;empty('Chưa tải được thành tích.');$('#fishing-board-status').textContent=e.message||'Kết nối bị gián đoạn. Bấm Làm mới để thử lại.';}
  if(alive&&id===generation)$('.fishing-board-grid').setAttribute('aria-busy','false');
 }
 root.querySelectorAll('[data-fishing-period]').forEach(button=>button.onclick=()=>{period=button.dataset.fishingPeriod;root.querySelectorAll('[data-fishing-period]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));load();});
 $('#fishing-board-refresh').onclick=load;load();return {destroy(){alive=false;generation++;}};
}
