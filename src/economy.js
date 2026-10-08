// Deterministic, replay-safe transactions. Caller persists returned state.
export function transact(wallet,tx,{delta=0,items=[]}={}){
 if(!Number.isSafeInteger(delta)||!Number.isSafeInteger(wallet?.balance)||!Array.isArray(wallet?.applied)||typeof tx!=='string'||!tx)return {ok:false,wallet,reason:'invalid'};
 if(wallet.applied.includes(tx))return {ok:false,wallet,reason:'duplicate'};
 const balance=wallet.balance+delta;
 if(!Number.isSafeInteger(balance)||balance<0)return {ok:false,wallet,reason:'funds'};
 return {ok:true,wallet:{...wallet,balance,applied:[...wallet.applied,tx]},items};
}

const record=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const validId=id=>typeof id==='string'&&id.length>0&&id.length<=128;
const validCount=value=>Number.isSafeInteger(value)&&value>=0;

/** Reserve an action ID once when presenting it, then reuse it for retries. */
export function transactionId(player,kind='action'){
 if(!record(player)||typeof kind!=='string'||!/^[a-z0-9:_-]{1,96}$/i.test(kind))throw Error('Giao dịch không hợp lệ');
 if(!record(player.systems))player.systems={};
 const previous=validCount(player.systems.sequence)?player.systems.sequence:0;
 if(previous===Number.MAX_SAFE_INTEGER)throw Error('Đã hết số thứ tự giao dịch');
 player.systems.sequence=previous+1;
 return `${kind}:${player.systems.sequence}`;
}
export const nextTransactionId=transactionId;

/** Mutate a draft, validate it, and commit into the existing player only once. */
export function applyTransaction(player,txId,mutate){
 if(!record(player)||!validId(txId)||typeof mutate!=='function'||!validCount(player.coins))return {ok:false,reason:'invalid'};
 const before=record(player.systems)?player.systems:{};
 const ledger=Array.isArray(before.transactions)?[...new Set(before.transactions.filter(validId))]:[];
 if(ledger.includes(txId))return {ok:false,reason:'duplicate'};
 try{
  const draft=structuredClone(player),result=mutate(draft);
  if(result===false||result?.ok===false)return {ok:false,reason:result?.reason||'rejected'};
  if(result&&typeof result.then==='function')return {ok:false,reason:'async'};
  if(!validCount(draft.coins))return {ok:false,reason:'funds'};
  for(const key of ['rods','accessories','maps']){
   if(key in draft&&(!Array.isArray(draft[key])||draft[key].some(id=>typeof id!=='string'||!id)||new Set(draft[key]).size!==draft[key].length))return {ok:false,reason:'ownership'};
  }
  if('baits' in draft&&(!record(draft.baits)||Object.values(draft.baits).some(value=>!validCount(value))))return {ok:false,reason:'bait'};
  for(const key of ['catches','released','sold','gifted','cooked','casts','serial'])if(key in draft&&!validCount(draft[key]))return {ok:false,reason:'progress'};
  if(!record(draft.systems))draft.systems={};
  draft.systems.transactions=[...ledger,txId];
  // A transaction cannot erase the reserved sequence or prior reward receipts.
  draft.systems.sequence=Math.max(validCount(before.sequence)?before.sequence:0,validCount(draft.systems.sequence)?draft.systems.sequence:0);
  for(const key of Object.keys(player))if(!Object.hasOwn(draft,key))delete player[key];
  Object.assign(player,draft);
  return {ok:true,reason:''};
 }catch{return {ok:false,reason:'invalid'};}
}
