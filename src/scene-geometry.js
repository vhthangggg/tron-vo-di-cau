// Pointer, canvas and video coordinates share one unrotated scene space.
export function pointerPosition(rect,clientX,clientY,rotated=false){
  const x=(clientX-rect.left)/rect.width,y=(clientY-rect.top)/rect.height;
  return rotated?{x:y,y:1-x}:{x,y};
}
export function elementPoint(element,event){
  const rotated=getComputedStyle(element).getPropertyValue('--fishing-rotation').trim()==='90';
  return pointerPosition(element.getBoundingClientRect(),event.clientX,event.clientY,rotated);
}
export function coverFrame(width,height,aspect=16/9){
  const w=Math.max(width,height*aspect),h=w/aspect;
  return {x:(width-w)/2,y:(height-h)/2,width:w,height:h};
}
export function imageToScene(point,frame){return {x:frame.x+point.x*frame.width,y:frame.y+point.y*frame.height};}
export function sceneToImage(point,frame){return {x:(point.x-frame.x)/frame.width,y:(point.y-frame.y)/frame.height};}
export function pointInPolygon(x,y,poly){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const [xi,yi]=poly[i],[xj,yj]=poly[j];
    if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;
  }
  return inside;
}
