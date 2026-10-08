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
 if(!Array.isArray(rods)||!Array.isArray(accessories)||new Set(rods).size!==rods.length||new Set(accessories).size!==accessories.length)return {ok:false,reason:'Vật phẩm trùng lặp'};
 if(rods.length>bag.rods||accessories.length>bag.accessorySlots||Object.values(baits).filter(n=>n>0).length>bag.baitTypes)return {ok:false,reason:'Túi quá sức chứa'};
 if(rods.some(id=>!owned.rods.includes(id))||accessories.some(id=>!owned.accessories.includes(id)))return {ok:false,reason:'Không sở hữu vật phẩm'};
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
