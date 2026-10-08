// Pure inventory helpers. Legacy player fields remain authoritative until migration.
export const BAG_TYPES=Object.freeze({
 cloth:{id:'cloth',name:'Túi vải',rods:1,baitTypes:2,accessorySlots:4},
 standard:{id:'standard',name:'Túi phổ thông',rods:2,baitTypes:4,accessorySlots:8},
 specialist:{id:'specialist',name:'Túi chuyên dụng',rods:3,baitTypes:6,accessorySlots:12},
 large:{id:'large',name:'Túi nhiều ngăn',rods:4,baitTypes:8,accessorySlots:18}
});
export function makeInventory(){return {bagId:'cloth',carried:{rods:['bamboo'],baits:{worm:6},accessories:[]},stored:{rods:[],baits:{},accessories:[]}};}
export function validateBag(inventory,owned){
 const bag=BAG_TYPES[inventory?.bagId];if(!bag)return {ok:false,reason:'Túi không hợp lệ'};
 const c=inventory.carried||{},rods=c.rods||[],baits=c.baits||{},accessories=c.accessories||[];
 if(!Array.isArray(rods)||!Array.isArray(accessories)||!baits||typeof baits!=='object'||Array.isArray(baits)||new Set(rods).size!==rods.length||new Set(accessories).size!==accessories.length)return {ok:false,reason:'Vật phẩm trùng lặp'};
 if(rods.length>bag.rods||accessories.length>bag.accessorySlots||Object.values(baits).filter(n=>n>0).length>bag.baitTypes)return {ok:false,reason:'Túi quá sức chứa'};
 if(!owned||!Array.isArray(owned.rods)||!Array.isArray(owned.accessories)||!owned.baits||rods.some(id=>!owned.rods.includes(id))||accessories.some(id=>!owned.accessories.includes(id)))return {ok:false,reason:'Không sở hữu vật phẩm'};
 for(const [id,n] of Object.entries(baits)){if(!Number.isSafeInteger(n)||n<0||n>(owned.baits[id]||0))return {ok:false,reason:'Số lượng mồi không hợp lệ'};}
 return {ok:true,reason:''};
}
export function transferBait(inventory,owned,id,count,to='carried'){
 if(!Number.isSafeInteger(count)||count<=0||!['carried','stored'].includes(to))return null;
 const next=structuredClone(inventory),from=to==='carried'?'stored':'carried';
 const available=next[from].baits[id]||0;
 if(available<count)return null;
 next[from].baits[id]=available-count;next[to].baits[id]=(next[to].baits[id]||0)+count;
 return validateBag(next,owned).ok?next:null;
}

/** Build a safe carried/stored projection from legacy ownership without deleting items. */
export function inventoryFromLegacy(player){
 const allRods=[...new Set(player.rods||[])],allAccessories=[...new Set(player.accessories||[])];
 const activeRod=allRods.includes(player.rod)?player.rod:allRods[0];
 const equipped=new Set(Object.values(player.equipment||{}));
 const carriedAccessories=allAccessories.filter(id=>equipped.has(id)).slice(0,BAG_TYPES.cloth.accessorySlots);
 const carriedBaits={},storedBaits={};
 const activeBait=player.bait;
 for(const [id,n] of Object.entries(player.baits||{})){
   const qty=Number.isSafeInteger(n)&&n>=0?n:0;
   if(id===activeBait&&qty>0){carriedBaits[id]=qty;storedBaits[id]=0;}
   else{storedBaits[id]=qty;}
 }
 const inv={bagId:'cloth',carried:{rods:activeRod?[activeRod]:[],baits:carriedBaits,accessories:carriedAccessories},
 stored:{rods:allRods.filter(id=>id!==activeRod),baits:storedBaits,accessories:allAccessories.filter(id=>!carriedAccessories.includes(id))}};
 return validateBag(inv,{rods:allRods,accessories:allAccessories,baits:player.baits||{}}).ok?inv:null;
}
export function reconcileInventory(inventory,player){
 const owned={rods:player.rods,accessories:player.accessories,baits:player.baits};
 if(!validateBag(inventory,owned).ok)return false;
 const all=(key)=>[...inventory.carried[key],...inventory.stored[key]];
 if(all('rods').length!==owned.rods.length||new Set(all('rods')).size!==owned.rods.length||!owned.rods.every(id=>all('rods').includes(id)))return false;
 if(all('accessories').length!==owned.accessories.length||new Set(all('accessories')).size!==owned.accessories.length||!owned.accessories.every(id=>all('accessories').includes(id)))return false;
 const counts={};
 for(const loc of ['carried','stored'])for(const [id,n] of Object.entries(inventory[loc].baits||{})){
   if(!Number.isSafeInteger(n)||n<0)return false;
   counts[id]=(counts[id]||0)+n;
 }
 return Object.keys(counts).every(id=>id in owned.baits)&&Object.keys(owned.baits).every(id=>(counts[id]||0)===owned.baits[id]);
}

/** Transfer one unique rod/accessory between home storage and bag. */
export function transferGear(inventory,owned,kind,id,to='carried'){
 if(!['rods','accessories'].includes(kind)||!['carried','stored'].includes(to)||typeof id!=='string')return null;
 const from=to==='carried'?'stored':'carried';
 if(!inventory?.[from]?.[kind]?.includes(id)||inventory[to][kind].includes(id))return null;
 const next=structuredClone(inventory);
 next[from][kind]=next[from][kind].filter(x=>x!==id);
 next[to][kind].push(id);
 return reconcileInventory(next,{rods:owned.rods,accessories:owned.accessories,baits:owned.baits})?next:null;
}
