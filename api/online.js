import {configuration,createSupabase,OnlineError} from '../server/supabase.js';
import {createOnlineService} from '../server/online-service.js';
const MAX_BODY=512*1024;
async function readBody(req){
 if(req.body!==undefined){const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(raw)>MAX_BODY)throw new OnlineError(413,'Dữ liệu gửi lên quá lớn.');try{return JSON.parse(raw);}catch{throw new OnlineError(400,'Dữ liệu không hợp lệ.');}}
 let raw='',size=0;for await(const chunk of req){size+=Buffer.byteLength(chunk);if(size>MAX_BODY)throw new OnlineError(413,'Dữ liệu gửi lên quá lớn.');raw+=chunk;}
 try{return raw?JSON.parse(raw):{};}catch{throw new OnlineError(400,'Dữ liệu không hợp lệ.');}
}
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 try{
   const config=configuration(),url=new URL(req.url,'https://localhost'),action=url.searchParams.get('action')||'config';
   if(!['GET','POST'].includes(req.method))throw new OnlineError(405,'Phương thức không hợp lệ.');
   if(req.method==='POST'){
     if(!req.headers['content-type']?.startsWith('application/json'))throw new OnlineError(415,'Định dạng dữ liệu không hợp lệ.');
     const allowed=new Set([process.env.ONLINE_ORIGIN||'https://tron-vo-di-cau-six.vercel.app',...(process.env.VERCEL_URL?['https://'+process.env.VERCEL_URL]:[])]);
     if(process.env.NODE_ENV!=='production')allowed.add('http://127.0.0.1:5173');
     if(req.headers.origin&&!allowed.has(req.headers.origin))throw new OnlineError(403,'Địa chỉ truy cập không hợp lệ.');
   }
   if(action==='config'){
     if(req.method!=='GET')throw new OnlineError(405,'Phương thức không hợp lệ.');
     let ready=false;if(config.enabled)try{ready=(await createSupabase(config).rpc('online_health'))?.version===1;}catch{}
     res.statusCode=200;res.end(JSON.stringify(ready?{enabled:true,url:config.url,publicKey:config.publicKey,googleEnabled:config.googleEnabled}:{enabled:false}));return;
   }
   if(!config.enabled)throw new OnlineError(503,'Dịch vụ online đang được chuẩn bị. Bạn vẫn có thể chơi trên máy.');
   const db=createSupabase(config),token=req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
   const user=action==='leaderboard'&&!token?null:await db.user(token);
   const body=req.method==='POST'?await readBody(req):{};
   if(!body||typeof body!=='object'||Array.isArray(body))throw new OnlineError(400,'Dữ liệu không hợp lệ.');
   const result=await createOnlineService(db)(action,{method:req.method,user,body,query:Object.fromEntries(url.searchParams)});
   res.statusCode=200;res.end(JSON.stringify(result));
 }catch(error){res.statusCode=error.status||500;res.end(JSON.stringify({error:error.status?error.message:'Chưa xử lý được yêu cầu. Vui lòng thử lại.'}));}
}
