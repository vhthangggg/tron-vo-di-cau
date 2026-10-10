import {SAVE_KEY,validateSave,newPlayer} from './save.js';
const ACTIVE='tron-vo-di-cau.online-user';
const safeRead=(storage,key)=>{try{return JSON.parse(storage.getItem(key)||'null');}catch{return null;}};
export function scopedStorage(storage,userId){
 const prefix=userId?SAVE_KEY+'.user.'+userId:SAVE_KEY;
 const key=k=>k.startsWith(SAVE_KEY)?prefix+k.slice(SAVE_KEY.length):k;
 return {getItem:k=>storage.getItem(key(k)),setItem:(k,v)=>storage.setItem(key(k),v),removeItem:k=>storage.removeItem(key(k))};
}
export class OnlineClient{
 constructor({storage,fetcher=(...args)=>fetch(...args),onStatus=()=>{}}){
   this.storage=storage;this.fetcher=fetcher;this.onStatus=onStatus;
   this.activeUser=safeRead(storage,ACTIVE);if(typeof this.activeUser!=='string'||!/^[\da-f-]{36}$/i.test(this.activeUser))this.activeUser=null;
   this.playerStorage=scopedStorage(storage,this.activeUser);this.hadLocal=!!safeRead(this.playerStorage,SAVE_KEY);
   this.state='loading';this.user=null;this.config={enabled:false};this.message='Đang kết nối…';this.profile=null;this.remote=null;this.lock=null;this.timer=null;
   this.loadMeta();
 }
 loadMeta(){this.metaKey=SAVE_KEY+'.online.'+(this.activeUser||'guest');this.meta=safeRead(this.storage,this.metaKey)||{revision:0,dirty:false,sequence:0};}
 saveMeta(){try{this.storage.setItem(this.metaKey,JSON.stringify(this.meta));}catch{this.setState('error','Không lưu được trạng thái đồng bộ trên máy.');}}
 setState(state,message){this.state=state;this.message=message;this.onStatus(this);}
 setIdentity(user){this.activeUser=user?.id||null;this.storage.setItem(ACTIVE,JSON.stringify(this.activeUser));this.playerStorage=scopedStorage(this.storage,this.activeUser);this.hadLocal=!!safeRead(this.playerStorage,SAVE_KEY);this.loadMeta();}
 async initialize(){
   try{
     const res=await this.fetcher(new URL('../api/online?action=config',import.meta.url),{signal:AbortSignal.timeout(5000)});
     this.config=res.ok?await res.json():{enabled:false};
     if(!this.config.enabled){this.setState('disabled','Tài khoản online đang được chuẩn bị. Tiến độ vẫn được lưu trên máy.');return;}
     const {createClient}=await import('../assets/vendor/supabase.js');
     this.auth=createClient(this.config.url,this.config.publicKey,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
     this.auth.auth.onAuthStateChange((event,session)=>{
       this.user=session?.user||null;
       if(event==='PASSWORD_RECOVERY'){this.recovering=true;this.onStatus(this);}
       if(event==='SIGNED_IN'&&this.initialized&&this.user.id!==this.activeUser){
         // The running game's storage still belongs to the old identity until reload.
         // pagehide must not mark that player's data as a new account's local edits.
         this.switching=true;clearTimeout(this.timer);this.storage.setItem(ACTIVE,JSON.stringify(this.user.id));location.assign(location.pathname+'#online');location.reload();
       }
       if(event==='SIGNED_OUT')this.setState('signed-out','Đăng nhập để đồng bộ tiến độ.');
     });
     const {data,error}=await this.auth.auth.getSession();if(error)throw error;
     this.user=data.session?.user||null;
     if(this.user&&this.user.id!==this.activeUser)this.setIdentity(this.user);
     this.initialized=true;
     this.setState(this.user?'loading':'signed-out',this.user?'Đang kiểm tra bản lưu…':'Chơi khách hoặc đăng nhập để lưu online.');
   }catch{this.setState('offline','Chưa kết nối được dịch vụ online. Tiến độ trên máy vẫn được giữ.');}
 }
 async request(action,{method='GET',body,query={}}={}){
   const url=new URL('../api/online',import.meta.url);url.searchParams.set('action',action);for(const [k,v] of Object.entries(query))if(v!=null)url.searchParams.set(k,v);
   const headers={};if(body!==undefined)headers['Content-Type']='application/json';
   if(this.auth){const {data,error}=await this.auth.auth.getSession();if(error)throw Error('Vui lòng đăng nhập lại.');if(data.session)headers.Authorization='Bearer '+data.session.access_token;}
   const response=await this.fetcher(url,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
   const result=await response.json();if(!response.ok){const error=Error(result.error||'Chưa thực hiện được.');error.status=response.status;throw error;}return result;
 }
 connect({getPlayer,applyPlayer,canReplace}){
   this.getPlayer=getPlayer;this.applyPlayer=applyPlayer;this.canReplace=canReplace;
   if(this.user?.id===this.activeUser)this.checkRemote();
 }
 async checkRemote(){
   if(!this.user||this.user.id!==this.activeUser)return;
   try{
     const [remote,profile]=await Promise.all([this.request('save'),this.request('profile')]);this.remote=remote;this.profile=profile;
     if(this.meta.pending&&remote.requestId===this.meta.pending.id){this.meta.revision=remote.revision;this.meta.dirty=this.meta.sequence!==this.meta.pending.sequence;delete this.meta.pending;this.saveMeta();}
     if(!remote.save){this.setState('choose','Chọn tiến độ khởi đầu cho tài khoản này.');return;}
     if(!this.hadLocal&&!this.meta.dirty&&this.canReplace()){
       this.applyRemote(remote);return;
     }
     if(remote.revision!==this.meta.revision){
       if(!this.meta.dirty&&this.canReplace()){this.applyRemote(remote);return;}
       this.setState('conflict','Có hai bản tiến độ. Chọn bản bạn muốn tiếp tục.');return;
     }
     this.setState(this.meta.dirty?'dirty':'synced',this.meta.dirty?'Có tiến độ trên máy chưa đồng bộ.':'Tiến độ đã đồng bộ.');
     if(this.meta.dirty)this.schedule();
   }catch(error){this.setState('offline',error.message||'Chưa kết nối được máy chủ.');}
 }
 backup(save,kind){this.storage.setItem(SAVE_KEY+'.recovery.'+(this.activeUser||'guest')+'.'+kind,JSON.stringify(save));}
 applyRemote(remote){
   const save=validateSave(remote.save);this.backup(this.getPlayer(),'local');
   this.applyPlayer(save);
   this.meta={revision:remote.revision,dirty:false,sequence:this.meta.sequence+1};this.saveMeta();
   this.hadLocal=true;this.setState('synced','Đã tải tiến độ online. Bản trước đó được giữ để khôi phục.');
 }
 markDirty(){
   if(this.switching||!this.activeUser)return;this.meta.dirty=true;this.meta.sequence++;this.saveMeta();
   if(this.user?.id!==this.activeUser||['choose','conflict','disabled','loading'].includes(this.state))return;
   this.setState('dirty','Đã lưu trên máy · Chờ đồng bộ');this.schedule();
 }
 schedule(){clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush(),4000);}
 async flush(){
   clearTimeout(this.timer);
   if(this.lock)return this.lock;
   if(!this.user||this.user.id!==this.activeUser||!this.getPlayer||['choose','conflict','disabled','loading'].includes(this.state)||!this.meta.dirty)return;
   this.lock=this.upload();try{await this.lock;}finally{this.lock=null;}
 }
 async upload(){
   const identity=this.activeUser;
   if(!this.meta.pending)this.meta.pending={id:crypto.randomUUID(),revision:this.meta.revision,save:structuredClone(this.getPlayer()),sequence:this.meta.sequence};
   this.saveMeta();const pending=this.meta.pending;this.setState('syncing','Đang đồng bộ…');
   try{
     const result=await this.request('save',{method:'POST',body:{save:pending.save,revision:pending.revision,requestId:pending.id}});
     if(this.activeUser!==identity)return;
     this.meta.revision=result.revision;this.meta.dirty=this.meta.sequence!==pending.sequence;delete this.meta.pending;this.saveMeta();
     this.setState(this.meta.dirty?'dirty':'synced',this.meta.dirty?'Đã lưu trên máy · Chờ đồng bộ':'Tiến độ đã đồng bộ.');if(this.meta.dirty)this.schedule();
   }catch(error){if(this.activeUser!==identity)return;if(error.status===409){this.remote=await this.request('save').catch(()=>this.remote);this.setState('conflict','Thiết bị khác vừa lưu tiến độ mới. Hãy chọn bản muốn tiếp tục.');}else this.setState('offline','Chưa đồng bộ được. Bản trên máy được giữ; bạn có thể thử lại.');}
 }
 async choose(source){
   if(this.lock)throw Error('Chờ đồng bộ hiện tại hoàn tất.');
   if(!this.canReplace())throw Error('Kết thúc lượt câu trước khi đổi bản lưu.');
   const remote=await this.request('save');this.remote=remote;
   if(source==='remote'){if(!remote.save)throw Error('Tài khoản chưa có bản lưu.');this.applyRemote(remote);return;}
   const save=source==='guest'?validateSave(safeRead(this.storage,SAVE_KEY)):source==='new'?newPlayer():structuredClone(this.getPlayer());
   this.backup(this.getPlayer(),'local');if(remote.save)this.backup(remote.save,'cloud');
   this.applyPlayer(save);this.meta={revision:remote.revision,dirty:true,sequence:this.meta.sequence+1};this.saveMeta();this.hadLocal=true;
   this.setState('dirty','Đang lưu lựa chọn của bạn…');await this.flush();
 }
 async authAction(action,{email,password}={}){
   if(!this.auth)throw Error('Dịch vụ tài khoản chưa sẵn sàng.');
   const redirect=location.origin+location.pathname;
   let result;
   if(action==='google')result=await this.auth.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirect}});
   else if(action==='signup')result=await this.auth.auth.signUp({email,password,options:{emailRedirectTo:redirect}});
   else if(action==='reset')result=await this.auth.auth.resetPasswordForEmail(email,{redirectTo:redirect});
   else if(action==='password')result=await this.auth.auth.updateUser({password});
   else result=await this.auth.auth.signInWithPassword({email,password});
   if(result.error)throw Error(action==='signin'?'Chưa đăng nhập được. Kiểm tra email, mật khẩu và xác nhận email.':result.error.message);
   if(action==='password')this.recovering=false;
   return result;
 }
 async signOut(){
   await this.flush();if(this.meta.dirty&&!confirm('Tiến độ chưa đồng bộ. Bản trên máy vẫn được giữ riêng cho tài khoản này. Bạn muốn đăng xuất?'))return;
   clearTimeout(this.timer);const {error}=await this.auth.auth.signOut();if(error)throw Error('Chưa đăng xuất được. Vui lòng thử lại.');this.setIdentity(null);location.assign(location.pathname+'#online');location.reload();
 }
}
