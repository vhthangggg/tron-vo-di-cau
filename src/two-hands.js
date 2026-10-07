import {elementPoint} from './scene-geometry.js';
// Each hand owns an independent pointer. A secondary touch is deliberately accepted.
export function twoHands(game,{canUse,onUpdate}){
  const pointers=new Map(),keys=new Set();
  let force=.55,keyboardTracking=false,trackElement,rodElement;
  const heldKey=()=>keys.has('Space')||keys.has('Enter');
  const hasHand=hand=>[...pointers.values()].some(p=>p.hand===hand);
  function sync(){
    const rod=[...pointers.values()].find(p=>p.hand==='rod');
    game.setForce(rod?.force??force,!!rod||heldKey());
    if(!hasHand('track')&&!(keyboardTracking&&(heldKey()||hasHand('rod'))))game.setTracking(false);
    onUpdate();
  }
  function release(id){
    const pointer=pointers.get(id);if(!pointer)return;
    pointers.delete(id);
    if(pointer.element.hasPointerCapture(id))pointer.element.releasePointerCapture(id);
    sync();
  }
  function clear(){
    const old=[...pointers];pointers.clear();keys.clear();keyboardTracking=false;game.releaseHands();
    for(const [id,p] of old)if(p.element.hasPointerCapture(id))p.element.releasePointerCapture(id);
  }
  function position(element,e){
    const p=elementPoint(element,e);
    return {x:Math.max(0,Math.min(1,p.x)),y:Math.max(0,Math.min(1,p.y))};
  }
  function bindHand(element,hand){
    element.onpointerdown=e=>{
      if(!canUse()||e.button!==0||element.disabled||hasHand(hand))return;
      e.preventDefault();element.focus({preventScroll:true});
      const pos=position(element,e),level=1-pos.y;
      if(hand==='rod'&&!game.holdRod(level))return;
      if(hand==='track'&&!game.setTracking(true,pos.x,pos.y))return;
      pointers.set(e.pointerId,{hand,element,force:level});
      try{element.setPointerCapture(e.pointerId);}catch{/* Global up/cancel still releases. */}
      sync();
    };
    element.onpointermove=e=>{
      const p=pointers.get(e.pointerId);if(!p||!canUse())return;e.preventDefault();
      const pos=position(element,e);
      if(p.hand==='rod'){p.force=1-pos.y;sync();}else{game.setTracking(true,pos.x,pos.y);onUpdate();}
    };
    element.onlostpointercapture=e=>release(e.pointerId);
    element.oncontextmenu=e=>e.preventDefault();
    // A button click cannot silently substitute for the held two-hand gesture.
    element.onclick=e=>e.preventDefault();
  }
  addEventListener('pointerup',e=>release(e.pointerId),true);
  addEventListener('pointercancel',e=>release(e.pointerId),true);
  function keydown(e){
    if(!canUse()||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return false;
    const key=e.code,control=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown'].includes(key);
    if(control&&['fight','snag'].includes(game.phase)){
      e.preventDefault();keys.add(key);if(key.startsWith('Key')){keyboardTracking=true;game.setTracking(true);}return true;
    }
    if((key==='Space'||key==='Enter'&&e.target===rodElement)&&['waiting','nibble','bite','fight','snag'].includes(game.phase)){
      e.preventDefault();if(!e.repeat&&game.holdRod(force)){keys.add(key);sync();}return true;
    }
    return false;
  }
  addEventListener('keyup',e=>{if(keys.delete(e.code)){e.preventDefault();sync();}});
  function step(dt){
    if(!canUse())return;
    if(heldKey()||hasHand('rod')){
      force=Math.max(0,Math.min(1,force+((keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0))*dt*.65));
      if(!hasHand('rod'))game.setForce(force,true);
      if(keyboardTracking&&!hasHand('track')){
        const x=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),y=(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0);
        game.setTracking(true,game.aim.x+x*dt*.7,game.aim.y+y*dt*.7);
      }
    }
  }
  return {clear,keydown,step,bind(){trackElement=document.querySelector('#track-pad');rodElement=document.querySelector('#strike');bindHand(trackElement,'track');bindHand(rodElement,'rod');}};
}
