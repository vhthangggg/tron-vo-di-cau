export const CONTAINERS = [
  {id:'keepnet',name:'Rọng cá',short:'rọng',line:'Vào rọng nghỉ nhé. Đừng rủ hội cá đến cứu.'},
  {id:'bucket',name:'Xô cá',short:'xô',line:'Xô này không có Wi-Fi. Khỏi gọi cứu viện nhé.'},
  {id:'box',name:'Thùng cá',short:'thùng',line:'Mời lên hạng thương gia: thùng rộng, nước mát.'}
];
export const MAX_KEPT_FISH = 100;
export const getContainer = id => CONTAINERS.find(c=>c.id===id)||CONTAINERS[0];
export function catchTeaser(c,decision,container='keepnet'){
  if(decision==='gift')return c.weight<.3?'Cá nhỏ, thành ý to.':c.weight>=3?'Quà to, xin tha vụ về muộn!':'Xin giấy phép đi câu lần sau.';
  if(decision==='keep')return {keepnet:'Vào rọng nghỉ, đừng gọi cứu viện.',bucket:'Không Wi-Fi, khỏi gọi cứu viện.',box:'Hạng thương gia, miễn tiền vé.'}[getContainer(container).id];
  return 'Lần sau dẫn con to hơn nhé!';
}
export function catchRemark(c,decision,container='keepnet'){
  const variant=Number(c.id?.split('-').at(-1)||0)%3;
  if(decision==='gift'){
    if(c.weight<.3)return 'Cá hơi nhỏ, nhưng thành ý của chồng thì tận mấy cân.';
    if(c.weight>=3)return 'Quà to thế này, chắc hôm nay được tha vụ về muộn!';
    return ['Em ơi, quà đây! Hôm nay anh câu cá, không câu giờ.',
      'Mang cá về nịnh vợ. Xin đổi một con lấy giấy phép đi câu lần sau.',
      'Cá đã về nhà. Điểm chuyên cần của chồng vừa nhích lên một vạch.'][variant];
  }
  if(decision==='keep')return getContainer(container).line;
  if(decision==='release')return ['Về đi nhé. Lần sau nhớ dẫn con to hơn đến gặp tôi.',
    'Hôm nay tha cho đấy. Đừng về kể là tôi giật hụt nhé.',
    'Cá về nước, cần thủ về với cái bụng đói. Nhưng lòng rất nhẹ.'][variant];
  return 'Cá đổi thành xu. Vợ hỏi quà đâu thì cứ đưa… hóa đơn.';
}
