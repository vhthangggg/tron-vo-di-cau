import {BAGS,ALL_RODS as RODS,BAITS,ACCESSORIES,ACCESSORY_SLOTS,getBag,getRod,usesFloat,usesReel,acceptsBait,slotItem} from './content.js';

export const PACK_LABELS={rods:'cần',baits:'loại mồi',accessories:'phụ kiện'};
const definitions={rods:RODS,baits:BAITS,accessories:ACCESSORIES};
const array=value=>Array.isArray(value)?value:[];
export function ownsPackedItem(player,kind,id){
  return !!definitions[kind]?.some(item=>item.id===id)&&(kind==='baits'?(player.baits[id]>0||id===player.bait):array(player[kind]).includes(id));
}
export function requiredPacking(player){
  const rod=getRod(player.rod);
  return {rods:[player.rod],baits:[player.bait],accessories:Object.keys(ACCESSORY_SLOTS).filter(slot=>slot==='float'?usesFloat(rod):slot==='reel'?usesReel(rod):true).map(slot=>slotItem(player,slot).id)};
}
export function normalizePacking(player,raw,bagId=player.bag){
  const bag=getBag(bagId),required=requiredPacking(player),rod=getRod(player.rod),packing={};
  const defaults={rods:player.rods,baits:BAITS.filter(b=>acceptsBait(rod,b)).concat(BAITS.filter(b=>!acceptsBait(rod,b))).map(b=>b.id),accessories:player.accessories};
  for(const kind of Object.keys(PACK_LABELS)){
    const candidates=raw?array(raw[kind]):array(defaults[kind]);
    packing[kind]=[...new Set([...required[kind],...candidates.filter(id=>ownsPackedItem(player,kind,id))])].slice(0,bag[kind]);
  }
  return packing;
}
export function packingError(player,packing=player.packing,bagId=player.bag){
  if(!BAGS.some(b=>b.id===bagId)||!array(player.bags).includes(bagId))return 'Chọn một túi đựng đồ đã sở hữu.';
  const bag=getBag(bagId),required=requiredPacking(player);
  for(const kind of Object.keys(PACK_LABELS)){
    const items=packing?.[kind];
    if(!Array.isArray(items)||new Set(items).size!==items.length||items.some(id=>!ownsPackedItem(player,kind,id)))return 'Túi có món chưa sở hữu hoặc danh sách không hợp lệ. Soạn lại túi trước khi đi.';
    if(items.length>bag[kind])return `${bag.name} chỉ mang được ${bag[kind]} ${PACK_LABELS[kind]}. Bớt đồ hoặc chọn túi lớn hơn.`;
    if(required[kind].some(id=>!items.includes(id)))return 'Bộ câu đang lắp chưa nằm đủ trong túi. Soạn lại túi trước khi đi.';
  }
  return '';
}
export function packingForLoadout(previous,next){
  const candidate=Object.fromEntries(Object.keys(PACK_LABELS).map(kind=>[kind,[...array(previous.packing?.[kind])]]));
  const replace=(kind,oldId,newId)=>{if(oldId===newId)return;candidate[kind]=candidate[kind].map(id=>id===oldId?newId:id);};
  replace('rods',previous.rod,next.rod);replace('baits',previous.bait,next.bait);
  for(const slot of Object.keys(ACCESSORY_SLOTS))replace('accessories',previous.equipment?.[slot],next.equipment?.[slot]);
  return normalizePacking(next,candidate);
}
export function packingChange(player,kind,id,include){
  if(!Object.hasOwn(PACK_LABELS,kind)||!ownsPackedItem(player,kind,id))return {error:'Bạn chưa có món đồ này.'};
  const current=player.packing[kind];
  if(current.includes(id)===include)return {error:include?'Món này đã ở trong túi.':'Món này đang để ở nhà.'};
  if(!include&&requiredPacking(player)[kind].includes(id))return {error:'Đồ đang lắp phải đi cùng bộ câu. Đổi bộ câu trước khi cất món này ở nhà.'};
  const packing={...player.packing,[kind]:include?[...current,id]:current.filter(item=>item!==id)};
  return {packing,error:packingError(player,packing)};
}
