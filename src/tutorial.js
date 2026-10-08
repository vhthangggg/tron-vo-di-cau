export const STARTER_STEPS=Object.freeze([
 ['prepare','Bộ câu sẵn sàng','RIG_VALIDATED'],
 ['bait','Kiếm mồi','BAIT_COLLECTED'],
 ['float','Cân phao','FLOAT_CALIBRATED'],
 ['cast','Quăng đúng vùng nước','CAST_COMPLETED'],
 ['bite','Đọc tín hiệu cá','BITE_RECOGNIZED'],
 ['land','Đưa cá lên bờ','FISH_LANDED'],
 ['keep','Cất cá vào rọ','FISH_STORED'],
 ['home','Về nhà','TRIP_COMPLETED']
].map(([id,title,event])=>({id,title,event})));
export function advanceTutorial(progress,event){
 const next={...progress};
 for(const step of STARTER_STEPS)if(step.event===event&&!next[step.id])next[step.id]={completed:true,claimed:false};
 return next;
}
export function claimTutorial(progress,id){
 if(!progress[id]?.completed||progress[id].claimed)return {ok:false,progress};
 return {ok:true,progress:{...progress,[id]:{...progress[id],claimed:true}}};
}
