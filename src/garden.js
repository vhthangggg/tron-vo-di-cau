// Real-time garden simulation. Ratings and timings are game design, not crop advice.
export const GARDEN_HOUR=3600000, GARDEN_DAY=24*GARDEN_HOUR;
export const CORN_GROWTH_HOURS=72, WORM_CAPACITY=8;
export const GARDEN_ITEMS=Object.freeze([
 {id:'hoe_old',kind:'tool',slot:'hoe',name:'Cuốc cũ',price:0,effect:40,note:'Đồ nhà có sẵn. Xới luống ngô +40 độ tơi.'},
 {id:'water_gourd',kind:'tool',slot:'water',name:'Gáo tưới',price:0,effect:55,note:'Đồ nhà có sẵn. Tưới một góc vườn +55 độ ẩm.'},
 {id:'trowel_old',kind:'tool',slot:'dig',name:'Bay đào cũ',price:0,effect:4,note:'Đồ nhà có sẵn. Đào tối đa 4 phần giun mỗi lượt.'},
 {id:'hoe_steel',kind:'tool',slot:'hoe',name:'Cuốc thép',price:1800,effect:65,note:'Xới luống ngô +65 độ tơi; dùng lâu dài tại nhà.'},
 {id:'watering_can',kind:'tool',slot:'water',name:'Bình tưới',price:2200,effect:80,note:'Tưới +80 độ ẩm; phục hồi đất khô tốt hơn gáo.'},
 {id:'trowel_steel',kind:'tool',slot:'dig',name:'Bay đào thép',price:1400,effect:6,note:'Đào tối đa 6 phần giun mỗi lượt, vẫn cách nhau 24 giờ.'},
 {id:'corn_seed',kind:'supply',name:'Hạt giống ngô',price:300,amount:3,note:'3 lượt gieo / gói. Mỗi vụ dùng 1 lượt giống.'},
 {id:'compost',kind:'supply',name:'Phân hữu cơ',price:240,amount:3,note:'3 phần / gói. Bón luống ngô hoặc thêm thức ăn cho giun.'}
].map(Object.freeze));
const basic=GARDEN_ITEMS.filter(i=>i.kind==='tool'&&!i.price).map(i=>i.id);
const record=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const rating=(v,fallback=0)=>Number.isFinite(v)?clamp(v,0,100):fallback;
const count=(v,max=99)=>Number.isSafeInteger(v)&&v>=0?Math.min(v,max):0;
const timestamp=v=>Number.isSafeInteger(v)&&v>=0&&v<=1e15;
const soil=()=>({moisture:35,nutrients:20,looseness:40});
export function newGarden(now=Date.now()){
 return {version:1,lastAt:now,tools:[...basic],supplies:{corn_seed:3,compost:2},corn:{soil:soil(),crop:null},worms:{soil:soil(),stock:0,lastDugAt:null},composter:{readyAt:null,lastStartedAt:null},harvests:{corn:0,worm:0}};
}
export function normalizeGarden(raw,now=Date.now()){
 if(!record(raw))return newGarden(now);
 const g=newGarden(now),restoreSoil=s=>Object.fromEntries(Object.keys(soil()).map(k=>[k,rating(s?.[k],0)]));
 g.lastAt=timestamp(raw.lastAt)?raw.lastAt:now;
 g.tools=[...new Set([...basic,...(Array.isArray(raw.tools)?raw.tools:[]).filter(id=>GARDEN_ITEMS.some(i=>i.id===id&&i.kind==='tool'))])];
 g.supplies={corn_seed:count(raw.supplies?.corn_seed),compost:count(raw.supplies?.compost)};
 g.corn.soil=restoreSoil(raw.corn?.soil);g.worms.soil=restoreSoil(raw.worms?.soil);
 if(record(raw.corn?.crop))g.corn.crop={progress:Number.isFinite(raw.corn.crop.progress)?clamp(raw.corn.crop.progress,0,CORN_GROWTH_HOURS):0,health:rating(raw.corn.crop.health)};
 g.worms.stock=Number.isFinite(raw.worms?.stock)?clamp(raw.worms.stock,0,WORM_CAPACITY):0;
 g.worms.lastDugAt=timestamp(raw.worms?.lastDugAt)?raw.worms.lastDugAt:null;
 g.composter={readyAt:timestamp(raw.composter?.readyAt)?raw.composter.readyAt:null,lastStartedAt:timestamp(raw.composter?.lastStartedAt)?raw.composter.lastStartedAt:null};
 g.harvests={corn:count(raw.harvests?.corn,100000),worm:count(raw.harvests?.worm,100000)};
 return g;
}
export function gardenTool(g,slot){return GARDEN_ITEMS.filter(i=>i.slot===slot&&g.tools.includes(i.id)).sort((a,b)=>b.effect-a.effect)[0];}
export function gardenSoilReady(soil,bed){return soil.moisture>=35&&soil.nutrients>=30&&(bed!=='corn'||soil.looseness>=40);}
export function advanceGarden(raw,now=Date.now()){
 const g=normalizeGarden(raw,now);
 if(!timestamp(now)||now<=g.lastAt)return g;
 const hours=(now-g.lastAt)/GARDEN_HOUR;
 for(const bed of ['corn','worms']){
  const s=g[bed].soil,moistureRate=bed==='corn'?1.8:2,nutrientRate=bed==='corn'&&g.corn.crop ? .65 : .3;
  // Each soil quality only falls between actions, so healthy time ends at its
  // first threshold crossing. This is identical whether open or closed/reloaded.
  const good=Math.max(0,Math.min(hours,(s.moisture-35)/moistureRate,(s.nutrients-30)/nutrientRate,bed==='corn'?(s.looseness-40)/.55:Infinity)),bad=hours-good;
  if(bed==='corn'&&g.corn.crop?.health>0){
   const crop=g.corn.crop;crop.progress=Math.min(CORN_GROWTH_HOURS,crop.progress+good);
   crop.health=Math.max(0,Math.min(100,crop.health+good*.4)-bad*1.4);
  }
  if(bed==='worms')g.worms.stock=Math.max(0,Math.min(WORM_CAPACITY,g.worms.stock+good*.25)-bad*.12);
  s.moisture=Math.max(0,s.moisture-hours*moistureRate);s.nutrients=Math.max(0,s.nutrients-hours*nutrientRate);s.looseness=Math.max(0,s.looseness-hours*.55);
 }
 g.lastAt=now;return g;
}
const errors={clock:'Đồng hồ thiết bị đang lùi. Đặt lại giờ đúng để tiếp tục chăm vườn.',bed:'Góc vườn không hợp lệ.',action:'Việc làm vườn không hợp lệ.',wet:'Đất đang đủ ẩm. Tưới thêm chưa cần thiết.',loose:'Luống còn tơi. Chưa cần xới lại.',rich:'Đất còn đủ dinh dưỡng. Chưa cần bón thêm.',compost:'Hết phân hữu cơ. Ủ lá ở vườn hoặc mua tại Chợ bến.',seed:'Hết hạt giống. Mua thêm ở mục Đồ làm vườn.',occupied:'Luống đã có ngô. Thu hoạch hoặc dọn cây héo trước.',soil:'Xới đất, bón phân và tưới đủ ẩm trước khi gieo.',growing:'Ngô chưa sẵn sàng. Cây cần 72 giờ có đất đủ ẩm, dinh dưỡng và độ tơi.',dead:'Ngô đã héo. Dọn luống rồi gieo vụ mới.',alive:'Chỉ dọn cây đã héo; cây đang sống vẫn được giữ.',worms:'Chưa đủ giun. Giữ góc đất ẩm và có chất hữu cơ ít nhất 12 giờ.',cooldown:'Để giun hồi phục: mỗi lượt đào cách nhau 24 giờ.',pending:'Đang ủ lá. Chờ mẻ này xong rồi ủ tiếp.',daily:'Mỗi 24 giờ chỉ gom đủ lá cho một mẻ ủ.',unready:'Lá cần 12 giờ để thành phân hữu cơ trong mô phỏng.',full:'Kho vật tư đã đủ 99 phần. Dùng bớt rồi lấy thêm.'};
// Pure atomic proposal: even failed actions return no changed state or rewards.
export function gardenAction(raw,action,bed,now=Date.now()){
 const g=advanceGarden(raw,now),fail=key=>({ok:false,reason:errors[key]||key});
 if(!timestamp(now)||now<g.lastAt)return fail('clock');
 if(['plant','harvest','clear'].includes(action)&&bed!=='corn'||action==='dig'&&bed!=='worms'||['compost','collect'].includes(action)&&bed!=='composter')return fail('bed');
 const s=g[bed]?.soil;let reward=null,message='';
 if(['water','hoe','feed'].includes(action)){
  if(!['corn','worms'].includes(bed))return fail('bed');
  if(action==='water'){if(s.moisture>65)return fail('wet');s.moisture=Math.min(100,s.moisture+gardenTool(g,'water').effect);message='Đã tưới nước. Đất sẽ khô dần theo giờ thật.';}
  if(action==='hoe'){if(bed!=='corn')return fail('bed');if(s.looseness>70)return fail('loose');s.looseness=Math.min(100,s.looseness+gardenTool(g,'hoe').effect);message='Đã xới nhẹ và nhổ cỏ luống ngô. Góc giun được giữ yên.';}
  if(action==='feed'){if(s.nutrients>70)return fail('rich');if(!g.supplies.compost)return fail('compost');g.supplies.compost--;s.nutrients=Math.min(100,s.nutrients+55);message=bed==='corn'?'Đã bón phân hữu cơ cho ngô.':'Đã thêm chất hữu cơ cho góc giun.';}
 }else if(action==='plant'){
  if(g.corn.crop)return fail('occupied');if(!g.supplies.corn_seed)return fail('seed');if(!gardenSoilReady(g.corn.soil,'corn'))return fail('soil');
  g.supplies.corn_seed--;g.corn.crop={progress:0,health:100};message='Đã gieo ngô. Ghé tưới và chăm đất mỗi ngày; chăm tốt khoảng 3 ngày sẽ thu được.';
 }else if(action==='harvest'){
  const crop=g.corn.crop;if(!crop||crop.progress<CORN_GROWTH_HOURS)return fail('growing');if(crop.health<=0)return fail('dead');
  const amount=Math.max(6,Math.round(16*crop.health/100));reward={baitId:'corn',amount};g.corn.crop=null;g.corn.soil.nutrients=Math.max(0,g.corn.soil.nutrients-12);g.corn.soil.looseness=Math.max(0,g.corn.soil.looseness-15);g.harvests.corn++;
  const seed=crop.health>=60&&g.supplies.corn_seed<99;if(seed)g.supplies.corn_seed++;
  message=`Thu ${amount} phần ngô${seed?' và giữ 1 lượt giống cho vụ sau':''}. Mồi đã cất vào kho nhà.`;
 }else if(action==='clear'){
  if(!g.corn.crop||g.corn.crop.health>0)return fail('alive');g.corn.crop=null;message='Đã dọn cây héo. Cải tạo đất trước khi gieo lại.';
 }else if(action==='dig'){
  if(g.worms.lastDugAt!==null&&now-g.worms.lastDugAt<GARDEN_DAY)return fail('cooldown');
  if(!gardenSoilReady(g.worms.soil,'worms')||g.worms.stock<3)return fail('worms');
  const amount=Math.min(Math.floor(g.worms.stock),gardenTool(g,'dig').effect);g.worms.stock-=amount;g.worms.lastDugAt=now;g.worms.soil.moisture=Math.max(0,g.worms.soil.moisture-5);g.harvests.worm++;reward={baitId:'worm',amount};message=`Đào được ${amount} phần giun, cất vào kho nhà. Chăm đất và chờ 24 giờ trước lượt sau.`;
 }else if(action==='compost'){
  if(g.composter.readyAt!==null)return fail('pending');if(g.composter.lastStartedAt!==null&&now-g.composter.lastStartedAt<GARDEN_DAY)return fail('daily');
  g.composter={readyAt:now+12*GARDEN_HOUR,lastStartedAt:now};message='Đã gom và ủ lá khô. Sau 12 giờ nhận 1 phần phân hữu cơ.';
 }else if(action==='collect'){
  if(g.composter.readyAt===null||now<g.composter.readyAt)return fail('unready');if(g.supplies.compost>=99)return fail('full');g.supplies.compost++;g.composter.readyAt=null;message='Đã lấy 1 phần phân hữu cơ từ lá ủ.';
 }else return fail('action');
 return {ok:true,garden:g,reward,message};
}
export function gardenPurchase(raw,id){
 const g=normalizeGarden(raw),item=GARDEN_ITEMS.find(i=>i.id===id);if(!item||!item.price)return null;
 if(item.kind==='tool'){if(g.tools.includes(id))return null;g.tools.push(id);}
 else{if(g.supplies[id]+item.amount>99)return null;g.supplies[id]+=item.amount;}
 return {garden:g,item};
}
