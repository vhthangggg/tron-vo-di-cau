// A bait portion is mounted once and survives retrieval unless explicitly lost.
export function mountBait(stock,id){if(!Number.isSafeInteger(stock[id])||stock[id]<=0)return null;return {id,condition:'intact',consumed:false};}
export function resolveBait(stock,mounted,outcome){
 if(!mounted||!['retrieved','eaten','lost','replaced'].includes(outcome))return null;
 const consume=outcome!=='retrieved'&&!mounted.consumed;
 if(consume&&(!Number.isSafeInteger(stock[mounted.id])||stock[mounted.id]<=0))return null;
 return {stock:consume?{...stock,[mounted.id]:stock[mounted.id]-1}:{...stock},mounted:outcome==='retrieved'?mounted:null,consumed:consume};
}
export function digWorms(stock,{yieldCount=6,limit=60}={}){
 if(!Number.isSafeInteger(yieldCount)||yieldCount<1||!Number.isSafeInteger(limit)||limit<1)return null;
 return {...stock,worm:Math.min(limit,(stock.worm||0)+yieldCount)};
}
