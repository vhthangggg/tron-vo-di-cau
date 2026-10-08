import {ACCESSORIES, getRod, usesFloat, usesReel, getBait, acceptsBait} from './content.js';

// Ownership remains in player.rods/accessories/baits. This is only its location.
export const BAG_TYPES=Object.freeze({
 cloth:{id:'cloth',name:'Túi vải',rods:1,baitTypes:2,accessorySlots:4,price:0,note:'Một cần, hai loại mồi và bốn phụ kiện dự phòng. Bộ đã lắp không chiếm ngăn dự phòng.'},
 standard:{id:'standard',name:'Túi phổ thông',rods:2,baitTypes:4,accessorySlots:8,price:14000,note:'Mang hai cần và thêm mồi để thay đổi cách câu tại bờ.'},
 specialist:{id:'specialist',name:'Túi chuyên dụng',rods:3,baitTypes:6,accessorySlots:12,price:36000,note:'Nhiều bộ câu và ngăn phụ kiện cho chuyến dài.'},
 large:{id:'large',name:'Túi nhiều ngăn',rods:5,baitTypes:8,accessorySlots:18,price:62000,note:'Năm cần cùng nhiều mồi và phụ kiện dự phòng.'}
});
export const LEGACY_BAG_IDS=Object.freeze({cloth:'cloth',canvas:'standard',waterproof:'specialist',expedition:'large'});

/** Convert the earlier packing save once, preserving paid bags and carried gear. */
export function migratePacking(player,raw){
 const s=player.systems;
 s.bags=[...new Set([...s.bags,...(Array.isArray(raw.bags)?raw.bags:[]).map(id=>LEGACY_BAG_IDS[id]).filter(Boolean)])];
 if(s.inventory||!raw.packing||typeof raw.packing!=='object')return;
 const selected=LEGACY_BAG_IDS[raw.bag],bagId=selected&&s.bags.includes(selected)?selected:'cloth';
 const packing=raw.packing,carried={rods:[player.rod,...(Array.isArray(packing.rods)?packing.rods:[])],accessories:[...mountedAccessories(player),...(Array.isArray(packing.accessories)?packing.accessories:[])],baits:{}};
 for(const id of Array.isArray(packing.baits)?packing.baits:[])if(Object.hasOwn(player.baits,id))carried.baits[id]=player.baits[id];
 s.inventory={bagId,carried,stored:{rods:[],accessories:[],baits:{}}};
}

const record=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const quantity=v=>Number.isSafeInteger(v)&&v>=0?v:0;
const ids=v=>Array.isArray(v)?[...new Set(v.filter(id=>typeof id==='string'&&id.length>0))]:[];
const location=()=>({rods:[],baits:{},accessories:[]});
const ownedBaits=player=>record(player?.baits)?player.baits:{};
const systems=player=>record(player?.systems)?player.systems:{};

export function makeInventory(){return {bagId:'cloth',carried:{rods:['bamboo'],baits:{worm:6},accessories:[]},stored:location()};}
export function mountedAccessories(player){
 const equipped=record(player?.equipment)?Object.values(player.equipment):ACCESSORIES.filter(a=>a.price===0).map(a=>a.id);
 return [...new Set(equipped.filter(id=>typeof id==='string'&&ids(player?.accessories).includes(id)))];
}
export function spareAccessoryCount(inventory,player){
 const mounted=new Set(mountedAccessories(player));
 return ids(inventory?.carried?.accessories).filter(id=>!mounted.has(id)).length;
}

export function validateBag(inventory,owned){
 const bag=Object.hasOwn(BAG_TYPES,inventory?.bagId)?BAG_TYPES[inventory.bagId]:null;
 if(!bag)return {ok:false,reason:'Túi không hợp lệ'};
 if(!Array.isArray(owned?.rods)||!Array.isArray(owned?.accessories)||!record(owned?.baits))return {ok:false,reason:'Không sở hữu vật phẩm'};
 for(const where of ['carried','stored']){
  const loc=inventory?.[where];
  if(!record(loc)||!Array.isArray(loc.rods)||!Array.isArray(loc.accessories)||!record(loc.baits))return {ok:false,reason:'Dữ liệu hành trang không hợp lệ'};
  for(const kind of ['rods','accessories']){
   if(loc[kind].some(id=>typeof id!=='string')||new Set(loc[kind]).size!==loc[kind].length)return {ok:false,reason:'Vật phẩm trùng lặp'};
   if(loc[kind].some(id=>!owned[kind].includes(id)))return {ok:false,reason:'Không sở hữu vật phẩm'};
  }
  for(const [id,n] of Object.entries(loc.baits)){
   if(!Object.hasOwn(owned.baits,id)||!Number.isSafeInteger(n)||n<0||n>quantity(owned.baits[id]))return {ok:false,reason:'Số lượng mồi không hợp lệ'};
  }
 }
 const c=inventory.carried;
 if(c.rods.length>bag.rods||spareAccessoryCount(inventory,owned)>bag.accessorySlots||Object.values(c.baits).filter(n=>n>0).length>bag.baitTypes)return {ok:false,reason:'Túi quá sức chứa'};
 return {ok:true,reason:''};
}

export function reconcileInventory(inventory,player){
 if(!validateBag(inventory,player).ok)return false;
 for(const kind of ['rods','accessories']){
  const all=[...inventory.carried[kind],...inventory.stored[kind]],owned=ids(player[kind]);
  if(all.length!==owned.length||new Set(all).size!==owned.length||owned.some(id=>!all.includes(id)))return false;
 }
 for(const [id,n] of Object.entries(ownedBaits(player)))if((inventory.carried.baits[id]||0)+(inventory.stored.baits[id]||0)!==quantity(n))return false;
 return true;
}

function projectInventory(player,saved,{legacy=false,bagId}={}){
 const bagOwners=ids(systems(player).bags),ownedBags=bagOwners.length?['cloth',...bagOwners]:['cloth'];
 const selected=bagId||saved?.bagId;
 const selectedBag=Object.hasOwn(BAG_TYPES,selected)&&ownedBags.includes(selected)?selected:'cloth';
 const bag=BAG_TYPES[selectedBag],next={bagId:selectedBag,carried:location(),stored:location()};
 const mounted=new Set(mountedAccessories(player));
 for(const kind of ['rods','accessories']){
  const owned=ids(player?.[kind]);
  const carried=legacy||!Array.isArray(saved?.carried?.[kind])?(kind==='rods'?[player.rod||owned[0]]:[...mounted]):ids(saved.carried[kind]);
  let count=0;
  for(const id of carried){
   if(!owned.includes(id))continue;
   const component=kind==='accessories'&&mounted.has(id);
   if(component||count<(kind==='rods'?bag.rods:bag.accessorySlots)){
    next.carried[kind].push(id);if(!component)count++;
   }
  }
  // Retain storage order; newly purchased items go home until explicitly packed.
  next.stored[kind]=[...ids(saved?.stored?.[kind]),...owned].filter((id,i,all)=>owned.includes(id)&&!next.carried[kind].includes(id)&&all.indexOf(id)===i);
 }
 const rawCarried=record(saved?.carried?.baits)?saved.carried.baits:{};
 const rawStored=record(saved?.stored?.baits)?saved.stored.baits:{};
 const baitEntries=Object.entries(ownedBaits(player));
 const initialBaits=legacy||!record(saved?.carried?.baits);
 if(initialBaits)baitEntries.sort(([a],[b])=>a===player.bait?-1:b===player.bait?1:0);
 let types=0;
 for(const [id,rawTotal] of baitEntries){
  const total=quantity(rawTotal),oldCarried=quantity(rawCarried[id]),oldStored=quantity(rawStored[id]);
  const decrease=Math.max(0,oldCarried+oldStored-total);
  let carried=initialBaits?total:Math.min(total,Math.max(0,oldCarried-decrease));
  if(carried>0){if(types>=bag.baitTypes)carried=0;else types++;}
  // Keep an exhausted carried type in place. It does not use a type slot.
  if(carried>0||Object.hasOwn(rawCarried,id))next.carried.baits[id]=carried;
  if(total-carried>0||Object.hasOwn(rawStored,id)||!Object.hasOwn(next.carried.baits,id))next.stored.baits[id]=total-carried;
 }
 return next;
}

/** Create the first bag without moving ownership into a second data source. */
export function inventoryFromLegacy(player){return projectInventory(player,null,{legacy:true});}
/** Pure projection: rendering this state does not rewrite a player's save. */
export function inventoryFor(player){
 const saved=systems(player).inventory;
 return projectInventory(player,saved,{legacy:!record(saved)||!record(saved.carried)});
}

function updateInstances(player,inventory){
 const previous=Array.isArray(player.systems.gearInstances)?player.systems.gearInstances:[];
 player.systems.gearInstances=['rods','accessories'].flatMap(kind=>ids(player[kind]).map(id=>{
  const instanceId=`${kind==='rods'?'rod':'accessory'}-${id}`;
  const old=previous.find(item=>item?.instanceId===instanceId&&item?.definitionId===id);
  return {instanceId,definitionId:id,kind:kind==='rods'?'rod':'accessory',durability:Number.isFinite(old?.durability)?Math.max(0,Math.min(100,old.durability)):100,location:inventory.carried[kind].includes(id)?'bag':'home'};
 }));
}

/** Reconcile purchases and consumption, retaining every valid carried location. */
export function syncInventory(player){
 if(!record(player.systems))player.systems={};
 const s=player.systems;
 s.flags=Object.fromEntries(['inventory','economy','bait','rig','tutorial','catch'].map(id=>[id,record(s.flags)?s.flags[id]!==false:true]));
 if(!record(s.tutorial))s.tutorial={};
 if(!Array.isArray(s.transactions))s.transactions=[];
 if(!Number.isSafeInteger(s.sequence)||s.sequence<0)s.sequence=0;
 if(!Array.isArray(s.rigPresets))s.rigPresets=[];
 if(s.mountedBait===undefined)s.mountedBait=null;
 if(s.trip===undefined)s.trip=null;
 player.systems.bags=[...new Set(['cloth',...ids(player.systems.bags).filter(id=>Object.hasOwn(BAG_TYPES,id))])];
 player.systems.inventory=inventoryFor(player);
 updateInstances(player,player.systems.inventory);
 return player.systems.inventory;
}
export const ensureInventory=syncInventory;
export function carriedBaitCount(player,id){return quantity(inventoryFor(player).carried.baits[id]);}

/** Transfers are pure: callers commit and persist the entire player atomically. */
export function transferBait(inventory,owned,id,count,to='carried'){
 if(!reconcileInventory(inventory,owned)||!Number.isSafeInteger(count)||count<=0||!['carried','stored'].includes(to))return null;
 const from=to==='carried'?'stored':'carried';
 if((inventory[from].baits[id]||0)<count)return null;
 const next=structuredClone(inventory);
 next[from].baits[id]-=count;next[to].baits[id]=(next[to].baits[id]||0)+count;
 return reconcileInventory(next,owned)?next:null;
}
export function transferGear(inventory,owned,kind,id,to='carried'){
 if(!reconcileInventory(inventory,owned)||!['rods','accessories'].includes(kind)||!['carried','stored'].includes(to)||typeof id!=='string')return null;
 const from=to==='carried'?'stored':'carried';
 if(!inventory[from][kind].includes(id)||inventory[to][kind].includes(id))return null;
 const next=structuredClone(inventory);
 next[from][kind]=next[from][kind].filter(x=>x!==id);next[to][kind].push(id);
 return reconcileInventory(next,owned)?next:null;
}
export function swapCarriedRod(inventory,owned,currentId,nextId){
 if(!reconcileInventory(inventory,owned)||currentId===nextId||!inventory.carried.rods.includes(currentId)||!inventory.stored.rods.includes(nextId))return null;
 const next=structuredClone(inventory);
 next.carried.rods=next.carried.rods.map(id=>id===currentId?nextId:id);
 next.stored.rods=next.stored.rods.map(id=>id===nextId?currentId:id);
 return reconcileInventory(next,owned)?next:null;
}

/** A smaller bag must be explicitly repacked at home, never during a trip. */
export function bagInventory(player,id,{storeExcess=false}={}){
 if(!Object.hasOwn(BAG_TYPES,id)||!ids(systems(player).bags).includes(id)||systems(player).trip?.active)return null;
 const next=inventoryFor(player);next.bagId=id;
 if(validateBag(next,player).ok)return next;
 return storeExcess?projectInventory(player,next,{bagId:id}):null;
}

export function validateDeparture(player){
 const inventory=inventoryFor(player),bagCheck=validateBag(inventory,player);
 if(!bagCheck.ok)return bagCheck;
 if(!inventory.carried.rods.includes(player.rod))return {ok:false,reason:'Cần đang chọn còn ở kho. Hãy cho cần vào túi.'};
 const rod=getRod(player.rod),required=['line','hook','net',...(usesFloat(rod)?['float']:[]),...(usesReel(rod)?['reel']:[])];
 for(const slot of required)if(!inventory.carried.accessories.includes(player.equipment?.[slot]))return {ok:false,reason:'Bộ câu còn thiếu phụ kiện trong túi. Kiểm tra lại trang bị.'};
 if(!acceptsBait(rod,getBait(player.bait)))return {ok:false,reason:'Mồi không phù hợp với cần đang chọn.'};
 if(carriedBaitCount(player,player.bait)<1)return {ok:false,reason:'Chưa có mồi đang chọn trong túi. Lấy mồi từ kho hoặc kiếm mồi miễn phí.'};
 return {ok:true,reason:''};
}
