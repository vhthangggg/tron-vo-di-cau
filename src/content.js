// Các thông số là cân bằng gameplay v0.1, không phải hướng dẫn sinh học.
export const MAPS = [
  {id:'AO',name:'Ao Làng',caption:'Bên cầu tre, buổi sớm',price:0,current:0,tint:'ao',spots:[{name:'Chân cầu tre',x:.53,y:.58,depth:1.8},{name:'Mép bèo',x:.29,y:.64,depth:1.1},{name:'Hố bùn',x:.76,y:.56,depth:2.6}]},
  {id:'KENH',name:'Kênh Đồng',caption:'Mép cỏ, con nước chậm',price:18000,current:.08,tint:'kenh',spots:[{name:'Mép cỏ',x:.28,y:.62,depth:1.0},{name:'Dòng chậm',x:.55,y:.56,depth:1.6},{name:'Cống nhỏ',x:.77,y:.58,depth:2.0}]},
  {id:'HO',name:'Hồ Núi',caption:'Vịnh kín, làn nước sâu',price:36000,current:.03,tint:'ho',spots:[{name:'Vịnh kín',x:.3,y:.62,depth:2.1},{name:'Bãi đá',x:.56,y:.58,depth:2.6},{name:'Cây chìm',x:.76,y:.55,depth:3.0}]}
];
export const FISH = [
  {id:'fish_01',name:'Cá chép',maps:['AO','HO'],baits:['worm','corn','dough'],tech:['don','dai'],depth:'bottom',min:.15,max:2.8,price:22000,color:'#B0804B'},
  {id:'fish_02',name:'Cá diếc',maps:['AO','HO'],baits:['worm','dough'],tech:['don','dai'],depth:'bottom',min:.08,max:.7,price:26000,color:'#A4A479'},
  {id:'fish_03',name:'Cá rô đồng',maps:['AO','KENH'],baits:['worm'],tech:['don','dai'],depth:'mid',min:.06,max:.4,price:30000,color:'#6F8056'},
  {id:'fish_04',name:'Cá lóc',maps:['AO','KENH','HO'],baits:['lure'],tech:['lure'],depth:'mid',min:.3,max:2.0,price:48000,color:'#6B7463'},
  {id:'fish_05',name:'Cá trê vàng',maps:['AO','KENH'],baits:['worm'],tech:['don'],depth:'bottom',min:.15,max:1.2,price:35000,color:'#8D854E'},
  {id:'fish_06',name:'Cá rô phi vằn',maps:['AO','KENH','HO'],baits:['worm','dough'],tech:['don','dai'],depth:'mid',min:.15,max:1.0,price:20000,color:'#788E7B'},
  {id:'fish_07',name:'Cá trắm cỏ',maps:['AO','HO'],baits:['corn','dough'],tech:['dai'],depth:'bottom',min:.4,max:3.2,price:24000,color:'#6C8462'},
  {id:'fish_08',name:'Cá mè trắng',maps:['AO','HO'],baits:['cloudbait'],tech:['dai'],depth:'mid',min:.3,max:2.2,price:18000,color:'#9FAEA6'},
  {id:'fish_09',name:'Cá mè hoa',maps:['AO','HO'],baits:['cloudbait'],tech:['dai'],depth:'mid',min:.4,max:2.6,price:19000,color:'#888C7B'},
  {id:'fish_10',name:'Cá trôi',maps:['AO','HO'],baits:['dough','corn'],tech:['dai'],depth:'bottom',min:.3,max:2.2,price:23000,color:'#9E947B'},
  {id:'fish_11',name:'Cá sặc rằn',maps:['KENH'],baits:['worm','dough'],tech:['don','dai'],depth:'mid',min:.05,max:.3,price:28000,color:'#8F9D7E'},
  {id:'fish_12',name:'Cá sặc bướm',maps:['KENH'],baits:['worm'],tech:['don'],depth:'mid',min:.04,max:.2,price:26000,color:'#9C9E7C'}
];
export const RODS = [
  {id:'bamboo',name:'Cần tre ao',tech:'don',label:'Câu đơn',power:1.2,price:0,note:'Bộ khởi đầu miễn phí. Dẫn cá bằng cần; không có máy.'},
  {id:'dai',name:'Cần Đài 3.6',tech:'dai',label:'Câu Đài',power:2.0,price:45000,note:'Giữ phao ổn định, câu mồi bột, ngô và mồi mây.'},
  {id:'spinning',name:'Bộ lure nhập môn',tech:'lure',label:'Lure',power:2.7,price:60000,note:'Cần + máy + mồi giả. Thu mồi để dụ cá lóc.'}
];
export const BAITS = [
  {id:'worm',name:'Giun',mass:.08,price:1000,amount:12,note:'Hợp câu đơn; có thể đào giun miễn phí.'},
  {id:'dough',name:'Mồi bột',mass:.12,price:1800,amount:12,note:'Chép, diếc, rô phi và trôi.'},
  {id:'corn',name:'Ngô',mass:.10,price:1600,amount:12,note:'Chép và trắm cỏ với bộ phù hợp.'},
  {id:'cloudbait',name:'Mồi mây',mass:.10,price:2000,amount:12,note:'Dùng với cần Đài, tìm cá mè giữa nước.'},
  {id:'lure',name:'Mồi mềm',mass:0,price:0,amount:0,note:'Có sẵn trong bộ lure. Dùng lại sau mỗi lần thả.'}
];
export const LESSONS = [
  {id:'signal',name:'Đọc phao',question:'Phao chỉ rung nhẹ rồi trở lại. Bạn làm gì?',options:['Chờ tín hiệu rõ hơn','Giật cần ngay','Thu hết dây'],answer:0,explain:'Rung có thể là gió hoặc cá thăm mồi. Trong bản game này, giật khi phao chìm rõ sẽ đóng lưỡi.'},
  {id:'tension',name:'Dẫn cá',question:'Lực căng đã vượt vùng đỏ. Bạn làm gì?',options:['Kéo mạnh hơn','Nới lực, chờ cá dịu','Bỏ cần'],answer:1,explain:'Nới lực giúp giảm tải. Khi lực trở lại vùng xanh, tiếp tục dẫn cá; thả quá chùng cũng dễ mất cá.'},
  {id:'depth',name:'Chọn tầng nước',question:'Muốn tìm cá ăn đáy tại điểm sâu 1,8 m, chọn mồi ở đâu?',options:['Sát mặt nước','Gần đáy 1,8 m','Cố định 3,2 m ở mọi điểm'],answer:1,explain:'Trong mô hình game, cá ăn đáy tiếp cận mồi gần độ sâu của điểm câu. Cá giữa nước cần tầng nông hơn.'}
];
export const getMap = id => MAPS.find(x=>x.id===id) || MAPS[0];
export const getRod = id => RODS.find(x=>x.id===id) || RODS[0];
export const getBait = id => BAITS.find(x=>x.id===id) || BAITS[0];
export const getFish = id => FISH.find(x=>x.id===id);
