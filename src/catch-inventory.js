export const KEEP_CAPACITY=Object.freeze({keepnet:{count:30,kg:35},bucket:{count:12,kg:12},box:{count:20,kg:25}});
export function keepCatch(catches,fish,container='keepnet'){
 const limit=KEEP_CAPACITY[container];if(!limit||!fish?.id||!Number.isFinite(fish.weight)||fish.weight<=0||catches.some(c=>c.id===fish.id))return {ok:false,catches};
 const kg=catches.reduce((sum,c)=>sum+c.weight,0)+fish.weight;
 if(catches.length>=limit.count||kg>limit.kg)return {ok:false,catches};
 return {ok:true,catches:[...catches,{...fish}]};
}
export function disposeCatch(catches,id,action){
 if(!['sell','gift','cook','release'].includes(action))return {ok:false,catches};
 const fish=catches.find(c=>c.id===id);if(!fish)return {ok:false,catches};
 return {ok:true,fish,action,catches:catches.filter(c=>c.id!==id)};
}
