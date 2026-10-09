// Gameplay values, not biological or fishing advice. Each map uses its own water mask.
const WORLDS = {
  AO: {flow:.12, drift:1, tint:'#dedca4', foliage:'bamboo', risk:[.035,.13,.09], water:[[.28,.43],[1,.42],[1,1],[.53,1],[.22,.72]]},
  KENH: {flow:.32, drift:1, tint:'#d6dfa8', foliage:'grass', risk:[.10,.06,.18], water:[[.25,.36],[.94,.34],[1,1],[.2,1],[.03,.67]]},
  HO: {flow:.17, drift:-1, tint:'#c5ebe0', foliage:'pine', risk:[.06,.20,.28], water:[[0,.4],[1,.39],[1,.95],[.3,1],[0,.71]]},
  SONG: {flow:.68, drift:1, tint:'#e7ce9d', foliage:'grass', risk:[.07,.13,.21], water:[[0,.34],[.75,.35],[1,.51],[1,1],[.15,1],[0,.8]]},
  SUOI: {flow:.77, drift:1, tint:'#c5efea', foliage:'bamboo', risk:[.20,.12,.26], water:[[.35,.38],[.7,.38],[1,.65],[.85,.91],[.25,.91],[0,.66]]},
  MT: {flow:.45, drift:1, tint:'#dae3ac', foliage:'palm', risk:[.19,.12,.10], water:[[.2,.36],[.85,.35],[1,.95],[0,.95],[0,.58]]},
  DICHVU: {flow:.13, drift:-1, tint:'#d0e5d2', foliage:'grass', risk:[.025,.05,.08], water:[[0,.39],[1,.39],[1,.85],[.2,.94],[0,.7]]},
  DAP: {flow:.30, drift:1, tint:'#c8dfdf', foliage:'pine', risk:[.14,.29,.23], water:[[.13,.4],[.82,.38],[1,.67],[1,1],[.2,.95],[0,.64]]},
  CSONG: {flow:.74, drift:1, tint:'#d5e3da', foliage:'palm', risk:[.24,.09,.16], water:[[.2,.37],[1,.39],[1,1],[0,1],[0,.68]]},
  GHE: {flow:1, drift:-1, tint:'#def5ee', foliage:'grass', risk:[.13,.28,.34], water:[[.14,.36],[1,.31],[1,1],[.34,1],[.17,.76]]}
};
export const waterWorld = id => WORLDS[id] || WORLDS.AO;
export function castHabitat(spot,point){
  const h=spot.habitat;if(!h||!point)return {cover:0,open:1,near:0,far:0,depth:spot.depth,size:.5,snag:1};
  const cover=Math.max(0,...(h.cover||[]).map(([x,y,r])=>Math.max(0,1-Math.hypot(point.x-x,point.y-y)/r)));
  const open=Math.max(0,1-Math.hypot(point.x-(h.open?.[0]??.5),point.y-(h.open?.[1]??.5))/.48)*(1-cover*.75);
  const span=Math.max(.1,h.bankY-h.farY),far=clamp01((h.bankY-point.y)/span),near=1-far;
  const depth=spot.depth*(.55+far*.75)*(1-cover*.12);
  return {cover,open,near,far,depth,size:clamp01(.18+far*.72-cover*.12),snag:1+cover*2.7+near*.35};
}
const clamp01=v=>Math.max(0,Math.min(1,v));
export function snagChance(map,spot,depth,tech,habitat){
  const bottom=depth>=map.spots[spot].depth-.3,local=habitat?.snag||1;
  return Math.min(.65,waterWorld(map.id).risk[spot]*(tech==='lure'?.55:bottom?1:.12)*local);
}
export function fishBehavior(fish){
  if(fish.fight)return {...fish.fight};
  const base={carp:[.13,17,2.9],catfish:[.12,23,3.5],long:[.22,22,2.2],round:[.17,15,2.6],knife:[.21,18,2.3],grouper:[.19,26,2.8]}[fish.shape] || [.16,20,2.8];
  const id=Number(fish.id.split('_')[1]),variation=.87+(id%7)*.045;
  // Game tuning: quick, darting movement does not imply a strong or enduring fish.
  const strength={2:.65,3:.85,4:1.45,6:.9,7:1.45,8:.8,11:.6,12:.5,18:1.55,22:1.5,25:1.2,26:.5,27:.45,31:1.65,34:.6,35:1.55,36:.85,37:1.5,38:1.55,43:1.2,49:.9,50:.6}[id]
    ?? {carp:1.1,catfish:1.25,long:1.3,round:1,knife:1.15,grouper:1.4}[fish.shape] ?? 1;
  return {speed:base[0]*variation,burst:base[1]+id%4,rest:base[2],turn:1.1+(id%5)*.21,
    strength,
    label:fish.shape==='catfish'?'Ghì sâu, bứt nặng':fish.shape==='long'?'Chạy dài, đổi hướng':fish.shape==='grouper'?'Lao nhanh, ghì mạnh':fish.shape==='knife'?'Lạng ngang liên tục':'Đảo hướng, bứt từng nhịp'};
}

const fract=v=>v-Math.floor(v);
const noise=n=>fract(Math.sin(n*127.1+311.7)*43758.5453);
// Bounded, deterministic decorative animation. It never consumes simulation RNG.
export function paintWater(c,w,h,game,image,reduced=false){
  const world=waterWorld(game.map.id),t=reduced?0:game.time;
  const iw=image?.naturalWidth||1536,ih=image?.naturalHeight||1024,scale=Math.max(w/iw,h/ih);
  const dw=iw*scale,dh=ih*scale,ox=(w-dw)/2,oy=(h-dh)/2;
  const point=([x,y])=>[ox+x*dw,oy+y*dh];
  c.save();c.beginPath();world.water.forEach((p,i)=>{const [x,y]=point(p);i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();c.clip();
  // Long, translucent strokes travel with the map's current, confined to water.
  for(let i=0;i<(w<600?36:58);i++){
    const z=noise(i+40),x=fract(noise(i+1)+t*(.004+world.flow*.012)*world.drift),y=.38+fract(noise(i+91)+t*world.flow*.002)*.61;
    const [px,py]=point([x,y]),len=(.012+z*.04)*dw;
    c.globalAlpha=.06+z*.13;c.strokeStyle=world.tint;c.lineWidth=.65+z;
    c.beginPath();c.moveTo(px,py);c.quadraticCurveTo(px+len*.45,py+Math.sin(t*.65+i)*2,px+len,py);c.stroke();
  }
  // Occasional small foam clusters, with soft birth/death instead of a looping wall.
  if(!reduced)for(let i=0;i<9;i++){
    const life=fract(t/(8+noise(i+200)*6)+noise(i+33));if(life>.42)continue;
    const [x,y]=point([fract(noise(i+67)+t*.005*world.drift),.46+noise(i+120)*.43]);
    c.globalAlpha=Math.sin(life/.42*Math.PI)*(.24+world.flow*.16);c.strokeStyle='#f5f1d4';c.lineWidth=1;
    for(let j=0;j<3;j++){c.beginPath();c.ellipse(x+j*5,y+j%2*3,1.5+life*6,1+life*2,0,0,Math.PI*2);c.stroke();}
  }
  // A few twigs / leaves carried downstream. Bounded at three visible objects.
  for(let i=0;i<3;i++){
    const travel=fract(noise(i+88)+t*(.003+world.flow*.006)),x=world.drift>0?travel:1-travel;
    const [px,py]=point([x,.53+noise(i+14)*.21+travel*.12]);
    c.save();c.translate(px,py);c.rotate(Math.sin(t*.16+i)*.16+i);c.globalAlpha=.65;
    c.strokeStyle='#655442';c.lineWidth=2;c.beginPath();c.moveTo(-12,0);c.quadraticCurveTo(0,3,15,0);c.moveTo(2,1);c.lineTo(8,-5);c.stroke();
    c.fillStyle=i===1?'#ada46c':'#76885b';c.beginPath();c.ellipse(-5,-2,6,2.7,-.25,0,Math.PI*2);c.fill();c.restore();
  }
  if(game.phase==='snag'){
    const [x,y]=point([game.spotData.x,game.spotData.y]);c.globalAlpha=.55;c.strokeStyle='#edb273';c.lineWidth=2;
    c.beginPath();c.ellipse(x,y,20+Math.sin(t*2)*3,7,0,0,Math.PI*2);c.stroke();
  }
  c.restore();
  // Foreground vegetation has its own moving joints; the landscape stays steady.
  c.save();c.globalAlpha=.62;c.strokeStyle='#263f30';c.fillStyle='#38533a';
  const size=Math.min(w*.26,190),sway=Math.sin(t*.7)*.025+Math.sin(t*.31)*.018;
  c.translate(0,h*.23);c.rotate(sway);c.lineWidth=2.6;c.beginPath();c.moveTo(-10,-32);c.quadraticCurveTo(size*.38,-2,size,-size*.17);c.stroke();
  const leaves=world.foliage==='palm'?12:8;
  for(let i=0;i<leaves;i++){
    const x=size*(.13+i/leaves*.8),y=-size*.17*(x/size),l=world.foliage==='pine'?14:world.foliage==='palm'?42:26;
    c.save();c.translate(x,y);c.rotate(.6+Math.sin(t*.8+i)*.05);c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(l*.7,-7,l,7);c.quadraticCurveTo(l*.4,5,0,0);c.fill();c.restore();
  }
  c.restore();
}
