export class OnlineError extends Error{constructor(status,message){super(message);this.status=status;}}
export function configuration(env=process.env){
 const url=env.SUPABASE_URL||env.NEXT_PUBLIC_SUPABASE_URL;
 const publicKey=env.SUPABASE_PUBLISHABLE_KEY||env.SUPABASE_ANON_KEY||env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const secret=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;
 return {url:url?.replace(/\/$/,''),publicKey,secret,enabled:!!(url&&publicKey&&secret),googleEnabled:env.ONLINE_GOOGLE_ENABLED==='true'};
}
export function createSupabase(config,{fetcher=fetch}={}){
 async function request(path,{body,token,auth=false}={}){
   const key=auth?config.publicKey:config.secret;
   const headers={apikey:key,'Content-Type':'application/json'};
   if(token)headers.Authorization='Bearer '+token;
   else if(key?.startsWith('eyJ'))headers.Authorization='Bearer '+key;
   let response;
   try{response=await fetcher(config.url+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});}catch{throw new OnlineError(503,'Chưa kết nối được máy chủ. Dữ liệu trên máy vẫn được giữ.');}
   const data=await response.json().catch(()=>null);
   if(!response.ok){
     if(auth)throw new OnlineError(401,'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
     if(data?.message==='SAVE_CONFLICT'||data?.code==='40001')throw new OnlineError(409,'Có bản lưu mới trên thiết bị khác. Chọn bản muốn tiếp tục.');
     if(data?.message==='RATE_LIMIT')throw new OnlineError(429,'Bạn thao tác hơi nhanh. Vui lòng thử lại sau.');
     if(data?.message==='SESSION_EXPIRED')throw new OnlineError(410,'Buổi thi đã hết hạn. Hãy bắt đầu buổi mới.');
     if(data?.message==='SESSION_NOT_FOUND')throw new OnlineError(404,'Không tìm thấy buổi thi của bạn.');
     throw new OnlineError(503,'Dịch vụ online chưa sẵn sàng. Vui lòng thử lại sau.');
   }
   return data;
 }
 return {rpc:(name,body={})=>request('/rest/v1/rpc/'+name,{body}),async user(token){if(!token||token.length>8192)throw new OnlineError(401,'Đăng nhập để tiếp tục.');const user=await request('/auth/v1/user',{token,auth:true});if(!user?.id)throw new OnlineError(401,'Phiên đăng nhập không hợp lệ.');return user;}};
}
