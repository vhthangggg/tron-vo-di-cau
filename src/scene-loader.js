// Download the complete loop before exposing the scene. A blob URL reuses the
// downloaded bytes, so changing the HUD or resolving a catch never refetches it.
export function loadSceneVideo(video,{source=video.dataset.src,onProgress=()=>{},onReady=()=>{},onError=()=>{},fetcher=fetch,urlAPI=URL,timeoutMs=45000}={}){
  const controller=new AbortController();
  let canceled=false,blobURL,timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
  const signal=controller.signal;
  function stop(){
    video.pause();video.removeAttribute('src');video.load();
    if(blobURL){urlAPI.revokeObjectURL(blobURL);blobURL=null;}
  }
  function decoded(){
    return new Promise((resolve,reject)=>{
      const done=()=>{if(video.readyState>=2&&video.videoWidth>0){cleanup();resolve();}};
      const failed=()=>{cleanup();reject(Error('decode'));};
      const aborted=()=>{cleanup();reject(Error('aborted'));};
      function cleanup(){for(const type of ['loadeddata','canplay'])video.removeEventListener(type,done);video.removeEventListener('error',failed);signal.removeEventListener('abort',aborted);}
      for(const type of ['loadeddata','canplay'])video.addEventListener(type,done);
      video.addEventListener('error',failed);signal.addEventListener('abort',aborted,{once:true});
      if(signal.aborted)aborted();else done();
    });
  }
  const ready=(async()=>{
    try{
      onProgress({loaded:0,total:0,stage:'download'});
      const response=await fetcher(source,{signal});
      if(!response.ok)throw Error('http-'+response.status);
      const total=Number(response.headers.get('content-length'))||0;
      let loaded=0,blob;
      if(response.body?.getReader){
        const reader=response.body.getReader(),chunks=[];
        try{for(;;){const {done,value}=await reader.read();if(done)break;if(signal.aborted)throw Error('aborted');chunks.push(value);loaded+=value.byteLength;onProgress({loaded,total,stage:'download'});}}
        finally{reader.releaseLock();}
        if(total&&loaded<total)throw Error('incomplete');
        blob=new Blob(chunks,{type:'video/mp4'});
      }else{blob=await response.blob();loaded=blob.size;}
      if(signal.aborted)throw Error('aborted');
      if(!blob.size)throw Error('empty');
      onProgress({loaded,total:total||loaded,stage:'decode'});
      blobURL=urlAPI.createObjectURL(blob);video.src=blobURL;video.load();
      await decoded();
      if(signal.aborted)throw Error('aborted');
      video.currentTime=0;
      await video.play();
      if(signal.aborted){stop();return false;}
      clearTimeout(timer);onReady();return true;
    }catch(error){
      clearTimeout(timer);stop();
      if(!canceled)onError({reason:timedOut?'timeout':error.message});
      return false;
    }
  })();
  return {ready,cancel(){canceled=true;clearTimeout(timer);controller.abort();stop();}};
}
