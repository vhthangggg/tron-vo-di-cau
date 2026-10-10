import {randomUUID} from 'node:crypto';
import {validateSave} from '../src/save.js';
import {FISH} from '../src/content.js';
import {RANKED_RULES,RANKED_SECONDS,seasonKey,seasonSeed,replayRanked} from '../src/ranked-challenge.js';
import {OnlineError} from './supabase.js';
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
export function createOnlineService(db,{now=Date.now,newId=randomUUID}={}){
 return async function service(action,{method='GET',user=null,body={},query={}}={}){
   const writes=['save','profile','ranked-start','ranked-submit'];
   if(!['save','profile','ranked-start','ranked-submit','leaderboard'].includes(action))throw new OnlineError(404,'Không tìm thấy chức năng.');
   if(!['GET','POST'].includes(method)||(!writes.includes(action)&&method!=='GET')||(['ranked-start','ranked-submit'].includes(action)&&method!=='POST'))throw new OnlineError(405,'Phương thức không hợp lệ.');
   if(action!=='leaderboard'&&!user?.id)throw new OnlineError(401,'Đăng nhập để tiếp tục.');
   if(action==='profile'){
     let name=null;if(method==='POST'){name=typeof body.name==='string'?body.name.trim():null;if(typeof name!=='string'||name.length<2||name.length>24||/[\p{C}<>]/u.test(name))throw new OnlineError(400,'Tên cần thủ cần từ 2 đến 24 ký tự, không chứa ký tự đặc biệt.');}
     return db.rpc('online_profile',{p_user:user.id,p_name:name});
   }
   if(action==='save'){
     if(method==='GET')return db.rpc('online_get_save',{p_user:user.id});
     if(!Number.isSafeInteger(body.revision)||body.revision<0||!uuid(body.requestId))throw new OnlineError(400,'Thông tin phiên bản lưu không hợp lệ.');
     let save;try{save=validateSave(body.save,{now:now()});}catch{throw new OnlineError(400,'Bản lưu không hợp lệ hoặc thuộc phiên bản game mới hơn.');}
     return db.rpc('online_put_save',{p_user:user.id,p_save:save,p_expected:body.revision,p_request:body.requestId});
   }
   if(action==='ranked-start'){
     const season=seasonKey(now());
     return db.rpc('online_start_session',{p_user:user.id,p_id:newId(),p_season:season,p_seed:seasonSeed(season),p_rules:RANKED_RULES,p_duration:RANKED_SECONDS});
   }
   if(action==='ranked-submit'){
     if(!uuid(body.sessionId))throw new OnlineError(400,'Mã buổi thi không hợp lệ.');
     const session=await db.rpc('online_get_session',{p_user:user.id,p_id:body.sessionId});
     if(!session)throw new OnlineError(404,'Không tìm thấy buổi thi của bạn.');
     if(session.status==='verified')return session.result;
     if(session.rules!==RANKED_RULES)throw new OnlineError(409,'Game vừa cập nhật. Hãy bắt đầu buổi thi mới.');
     const elapsed=now()-Date.parse(session.started_at);
     if(now()>Date.parse(session.expires_at))throw new OnlineError(410,'Buổi thi đã hết hạn. Hãy bắt đầu buổi mới.');
     if(elapsed<(RANKED_SECONDS-2)*1000)throw new OnlineError(400,'Buổi thi chưa đủ thời gian.');
     let result;try{result=replayRanked(session.seed,body.events);}catch{throw new OnlineError(400,'Không xác minh được lượt chơi.');}
     return db.rpc('online_finish_session',{p_user:user.id,p_id:body.sessionId,p_result:result});
   }
   const board=query.board||'weekly',species=query.species||null,page=Number(query.page||0);
   if(!['weekly','species','collection'].includes(board)||!Number.isInteger(page)||page<0||page>20||board==='species'&&!FISH.some(f=>f.id===species))throw new OnlineError(400,'Bảng xếp hạng không hợp lệ.');
   return db.rpc('online_leaderboard',{p_board:board,p_season:seasonKey(now()),p_species:species,p_offset:page*25,p_user:user?.id||null});
 };
}
