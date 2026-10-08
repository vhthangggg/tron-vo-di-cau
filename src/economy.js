// Deterministic, replay-safe transactions. Caller persists returned state.
export function transact(wallet,tx,{delta=0,items=[]}={}){
 if(!Number.isSafeInteger(delta)||!Number.isSafeInteger(wallet.balance)||!Array.isArray(wallet.applied)||typeof tx!=='string'||!tx)return {ok:false,wallet,reason:'invalid'};
 if(wallet.applied.includes(tx))return {ok:false,wallet,reason:'duplicate'};
 const balance=wallet.balance+delta;
 if(!Number.isSafeInteger(balance)||balance<0)return {ok:false,wallet,reason:'funds'};
 return {ok:true,wallet:{...wallet,balance,applied:[...wallet.applied,tx]},items};
}
