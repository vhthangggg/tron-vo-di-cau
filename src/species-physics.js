const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function speciesSizeBands(fish){
  const size=fish.size||{min:fish.min,common:[fish.min+(fish.max-fish.min)*.2,fish.min+(fish.max-fish.min)*.6],max:fish.max};
  const [low,high]=size.common,largeEnd=high+(size.max-high)*.65;
  return [
    {id:'small',label:'Nhỏ',min:size.min,max:low,chance:.32},
    {id:'common',label:'Thường gặp',min:low,max:high,chance:.62},
    {id:'large',label:'Lớn',min:high,max:largeEnd,chance:.05},
    {id:'trophy',label:'Cực lớn · hiếm',min:largeEnd,max:size.max,chance:.01}
  ];
}
export function specimenSizeBand(fish,weight){
  const bands=speciesSizeBands(fish);
  return bands.find(b=>weight<=b.max)||bands.at(-1);
}
export function sampleSpecimenWeight(fish,random,{cap=fish.max}={}){
  const upper=clamp(cap,fish.min,fish.max);
  const bands=speciesSizeBands(fish).filter(b=>b.min<upper||upper===fish.min&&b.id==='small');
  const total=bands.reduce((sum,b)=>sum+b.chance,0);let roll=random()*total,band=bands.at(-1);
  for(const b of bands){roll-=b.chance;if(roll<=0){band=b;break;}}
  const low=Math.min(upper,band.min),high=Math.min(upper,band.max);
  return clamp(+(low+random()*(high-low)).toFixed(3),fish.min,upper);
}
// Dimensions are visual estimates anchored to authored size bands. They are not
// field measurements and do not mix published TL/SL/FL references with the model.
export function estimatedSpecimenLength(fish,weight){
  if(!fish.size)return null;
  const s=fish.size,[low,high]=s.common,[cmLow,cmHigh]=s.commonCm,w=Math.max(.001,weight);
  const scaled=(a,b,c,d)=>c+(d-c)*clamp((Math.cbrt(w)-Math.cbrt(a))/(Math.cbrt(b)-Math.cbrt(a)),0,1);
  const length=w<low?cmLow*Math.cbrt(w/low):w<=high?scaled(low,high,cmLow,cmHigh):scaled(high,s.max,cmHigh,s.maxCm);
  return +length.toFixed(1);
}
export function specimenStrength(fish,weight){
  const base=fish.fight?.strength||1,mass=Math.max(.001,weight);
  // Absolute effort index for the game. Relative species strength is separately
  // displayed so a tiny strong species is not mistaken for a giant weak one.
  return {relativeScore:+clamp(base/1.8*10,1,10).toFixed(1),
    powerScore:+clamp(1+4*base*Math.log10(1+mass*4),1,10).toFixed(1),
    pullIndex:+(base*mass**.55).toFixed(3)};
}
export function speciesAssetPaths(fish){
  return (fish.assetIds||[fish.id]).flatMap(id=>['webp','png'].map(ext=>`./assets/fish/${id}.${ext}`));
}
