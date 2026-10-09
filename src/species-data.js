// Biological descriptions are sourced; size bands, bait ranking and fight scores
// are transparent simulation estimates, not population means or force measurements.
export const SPECIES_RESEARCH_DATE = '2026-10-09';
export const FISH_ASSET_ALIASES = Object.freeze({fish_55:'fish_07'});
const rows = [
// id, scientific name, min kg, common kg range, game max kg, common cm range,
// game max cm, relative strength, fight style, recognition, habitat, diet, notes
[1,'Cyprinus carpio',.08,.3,2,12,22,45,85,1.10,'steady','Thân dày, vảy lớn; miệng có hai đôi râu, vây lưng dài.','Ao, hồ và sông chảy chậm; tìm bãi bùn và vùng trống gần thực vật.','Ăn tạp: sinh vật đáy, hạt và thực vật.','Quần thể ở Hồ Dịch Vụ là cá thả nuôi.'],
[2,'Carassius auratus',.03,.1,.35,.7,12,23,32,.65,'dart','Thân cao dẹp, bạc hoặc vàng xám; không có râu miệng.','Ao, hồ, nước chậm và nhiều cây thủy sinh.','Sinh vật nhỏ, mùn hữu cơ và thực vật.','Tên diếc có thể chỉ nhiều loài Carassius; dùng dạng hoang màu bạc, không dùng cá vàng cảnh.'],
[3,'Anabas testudineus',.025,.06,.18,.35,9,16,24,.85,'dart','Thân dẹp, vảy cứng; vây lưng gai, nắp mang có răng cưa.','Ao, ruộng ngập và kênh nước ngọt, gần cỏ và vật trú.','Côn trùng, giáp xác nhỏ và một phần thực vật.','Có cơ quan hô hấp phụ; cá không cần liên tục nổi mặt để cắn mồi.'],
[4,'Channa striata',.1,.3,1.2,3,25,48,75,1.45,'runner','Đầu dẹt như đầu rắn, miệng lớn; vây lưng dài, thân nâu có vân tối.','Nước ngọt chậm, bờ cỏ, ao và kênh; phục kích gần chỗ trú.','Cá nhỏ, ếch, giáp xác và côn trùng.','Mồi cá/tôm cũng phù hợp với câu tự nhiên; lure cần được thu để kích thích đuổi.'],
[5,'Clarias macrocephalus',.08,.2,.7,1.2,20,35,45,1.15,'bottom','Đầu rộng, da trơn, bốn đôi râu; vây lưng và hậu môn kéo dài, đuôi tròn.','Ao bùn, ruộng ngập, kênh chậm; sát đáy và vật trú.','Côn trùng thủy sinh, tôm và cá nhỏ.','Màu vàng nâu biến thiên; không mặc định mọi cá thể có da vàng tươi.'],
[6,'Oreochromis niloticus',.05,.2,.8,3,15,30,50,.90,'dart','Thân cao dẹp; các vạch ngang rõ trên vây đuôi, vây lưng gai dài.','Ao, hồ, kênh nước ngọt; đàn nhỏ gần bờ và vùng có thức ăn.','Tảo, thực vật, mùn và động vật nhỏ.','Dùng rô phi vằn; điêu hồng là dạng nuôi, không thêm một loài.'],
[7,'Ctenopharyngodon idella',.2,1,5,30,35,70,125,1.45,'runner','Thân thuôn, vảy lớn viền sẫm; miệng không râu, lưng xanh ô liu.','Ao/hồ thả nuôi và hồ rộng, gần thảm thực vật.','Cỏ và cây thủy sinh; cá non ăn thêm động vật nhỏ.','fish_55 là ảnh thay thế của fish_07 theo lựa chọn người dùng; không tạo mục sưu tập thứ hai.'],
[8,'Hypophthalmichthys molitrix',.2,.7,3,15,30,58,100,.80,'steady','Bạc sáng, đầu nhỏ hơn mè hoa; mắt thấp, bụng có lườn kéo dài.','Ao/hồ thả nuôi, tầng giữa đến tầng trên.','Lọc phiêu sinh, chủ yếu thực vật phù du.','Mồi mây là mô phỏng cụm thức ăn phân tán, không mô tả cá mè săn mồi.'],
[9,'Hypophthalmichthys nobilis',.3,1,5,25,35,70,120,1.15,'steady','Đầu lớn, mắt thấp; thân có mảng/đốm tối không đều.','Ao và hồ thả nuôi; vùng nước rộng, tầng giữa.','Lọc phiêu sinh, thường nhiều động vật phù du hơn mè trắng.','Đốm và kích thước đầu giúp phân biệt với mè trắng.'],
[10,'Labeo rohita',.2,.7,3,15,30,58,100,1.20,'steady','Thân thuôn, môi dày có nếp; vảy rõ, vây có thể ánh đỏ.','Ao/hồ thả nuôi ở Việt Nam; tìm tầng thấp và đáy.','Thực vật, tảo, mùn và thức ăn tạp theo tuổi.','Tên cá trôi chung chưa đủ định danh; game chọn trôi rohu theo danh mục gốc.'],
[11,'Trichopodus pectoralis',.02,.06,.18,.35,10,17,24,.60,'dart','Thân dẹp, vân rằn/sọc xiên; vây bụng dạng hai sợi dài.','Ruộng ngập, kênh và đầm nước ngọt nhiều thực vật.','Phiêu sinh, mùn, thực vật và động vật nhỏ.','Lưỡi nhỏ và mẩu mồi nhỏ; không dùng nhịp bo kéo dài.'],
[12,'Trichopodus trichopterus',.008,.025,.06,.12,6,10,15,.50,'dart','Thân dẹp, hai đốm tối ở thân và cuống đuôi; vây bụng dạng sợi.','Kênh, ao nước chậm, vùng cây thủy sinh.','Động vật nhỏ, phiêu sinh và thực vật.','Ba chấm gồm hai đốm thân cộng mắt; tên Việt theo vùng.'],
[13,'Clarias fuscus',.05,.12,.35,.6,15,25,32,1.05,'bottom','Da nâu đen, đầu dẹt, bốn đôi râu; đuôi tròn và hai vây dài.','Ao, kênh và vùng nước chậm nước ngọt.','Giun, côn trùng, giáp xác và cá nhỏ.','Tên trê đen có thể chỉ trê khác theo vùng; chọn C. fuscus và giữ thành tích cũ.'],
[14,'Clarias gariepinus',.3,1,5,25,35,70,130,1.35,'bottom','Đầu lớn dẹt, da xám nâu loang, bốn đôi râu; thân dài.','Hồ Dịch Vụ với quần thể thả nuôi.','Cá, giáp xác, côn trùng và nhiều thức ăn khác.','Loài du nhập; không cho xuất hiện tự do tại Ao Làng.'],
[15,'Pangasianodon hypophthalmus',.3,1,5,30,35,75,125,1.30,'runner','Da trơn, thân dài, đuôi chẻ; cá non có sọc, cá lớn thường xám.','Sông/kênh Miền Tây; ở hồ là quần thể thả nuôi.','Ăn tạp, thay đổi theo tuổi; động vật, thực vật và thức ăn viên.','Mồi cám phù hợp quần thể đã quen thức ăn nuôi.'],
[16,'Pangasius bocourti',.3,1,4,20,35,68,110,1.25,'bottom','Thân mập, bụng dày, đầu tròn và mõm tù; đuôi chẻ, da trơn.','Dòng sông lớn lưu vực Mekong, vùng sâu hoặc chảy chậm.','Động vật và thực vật, thức ăn tạp.','Đầu và thân mập giúp phân biệt với cá tra.'],
[17,'Hemibagrus wyckioides',.3,1,6,35,35,80,125,1.55,'bottom','Da trơn, râu dài; cá lớn có vây đuôi đỏ rõ, cá non đuôi nhạt.','Sông và hồ lớn, vùng đáy sâu có dòng chảy.','Cá, tôm và động vật thủy sinh.','Map là môi trường đại diện, không khẳng định có mặt ở mọi sông Việt Nam.'],
[18,'Spinibarbus denticulatus',.1,.3,1,8,20,40,70,1.55,'runner','Thân thuôn, vảy lớn, râu ngắn; có gai hướng trước ở đầu vây lưng.','Sông/suối miền Bắc, hố sâu và dòng chảy sạch.','Thực vật, quả và động vật nhỏ tùy quần thể.','Định danh cá bỗng theo vùng cần đối chiếu; cỡ 8 kg là trần mô phỏng, không phải kỷ lục đã xác nhận.'],
[19,'Bagarius rutilus',.5,2,8,30,45,90,140,1.70,'bottom','Đầu rộng dẹt, miệng lớn, râu; thân nâu loang, vây ngực khỏe.','Sông miền Bắc và lòng đập; đáy đá, khe dòng chảy.','Cá và động vật đáy.','Tên cá chiên gồm nhiều Bagarius; dùng B. rutilus đại diện theo nghiên cứu Việt Nam, không khẳng định ảnh đã được định danh.'],
[20,'Cranoglanis bouderius',.05,.15,.6,1.8,15,30,45,1.15,'bottom','Da trơn, đầu có tấm xương cứng, râu; vây ngực/lưng có gai.','Sông nước ngọt miền Bắc, đáy bùn/cát.','Động vật đáy, côn trùng, tôm và cá nhỏ.','Tên ngạnh là tên địa phương; định danh đại diện theo danh mục gốc.'],
[21,'Silurus asotus',.1,.4,2,10,30,65,105,1.25,'bottom','Vây lưng rất nhỏ, hậu môn rất dài; một đôi râu hàm trên nổi bật.','Sông/hồ nước ngọt, đáy sâu và vùng nước chậm.','Cá và động vật thủy sinh.','Không gộp nheo với mọi loài cá da trơn khác.'],
[22,'Channa micropeltes',.3,1,5,15,35,75,110,1.50,'runner','Miệng lớn; cá lớn có dải tối, cá non thường có dải cam giữa hai sọc đen.','Hồ, đầm và kênh Miền Tây; vùng sâu gần vật trú.','Cá và động vật thủy sinh.','Lure nổi dùng sát chỗ trú, crank dùng vùng nước thoáng.'],
[23,'Notopterus notopterus',.04,.12,.4,.8,18,30,45,1.00,'sway','Thân dẹp như lưỡi dao; hậu môn dài nối đuôi, không có hàng đốm mắt cườm.','Kênh và vùng nước chậm nước ngọt; tầng thấp đến giữa.','Côn trùng, giáp xác và cá nhỏ.','Bạc/xám hoặc ánh đồng tùy cá thể và ánh sáng; không ép mọi cá thể thành nâu.'],
[24,'Chitala ornata',.15,.5,2.5,7,30,60,95,1.25,'sway','Lưng cong cao, thân dạng dao; hàng đốm mắt có viền sáng trên vây hậu môn.','Sông chậm, hồ và kênh lưu vực Mekong.','Cá nhỏ, tôm và côn trùng thủy sinh.','Đốm cườm phân biệt với thát lát thường.'],
[25,'Oxyeleotris marmorata',.05,.2,.7,2,15,30,50,1.20,'ambush','Đầu to, thân nâu vân cẩm thạch; hai vây lưng tách nhau.','Kênh, sông và ao nước ngọt; đáy có vật trú.','Cá, tôm, cua và động vật nhỏ.','Phục kích sát đáy; ưu tiên mồi tự nhiên.'],
[26,'Pseudapocryptes elongatus',.008,.015,.035,.06,9,15,20,.50,'dart','Thân nhỏ dài, đầu tù, da/vảy nhỏ; sống gần bùn ở vùng triều.','Bãi bùn cửa sông, vùng hạ lưu chịu ảnh hưởng mặn.','Tảo, mùn và sinh vật nhỏ.','MT đại diện phần hạ lưu có xâm nhập mặn; không xem toàn kênh Miền Tây là nước mặn.'],
[27,'Misgurnus anguillicaudatus',.008,.02,.06,.12,8,16,25,.45,'bottom','Thân dài, râu nhỏ quanh miệng, hoa văn nâu; vây lưng ngắn, đuôi tròn.','Ao bùn, ruộng ngập và kênh nước ngọt.','Giun, ấu trùng và động vật đáy nhỏ.','Dùng loài đại diện; chạch địa phương cần đối chiếu ảnh.'],
[28,'Mastacembelus favus',.06,.2,.7,1.8,25,45,70,1.05,'sway','Thân dài như lươn nhưng có gai lưng; mõm nhọn, vân lưới nâu.','Sông/kênh, đáy cát sỏi và vùng có chỗ chui trú.','Giun, ấu trùng côn trùng và động vật đáy.','Chạch lấu không phải lươn; tên đại diện cần đối chiếu ảnh địa phương.'],
[29,'Squaliobarbus curriculus',.05,.15,.6,1.6,15,30,48,1.30,'runner','Thân thuôn bạc, mắt có vành đỏ; vây có thể ánh đỏ.','Sông và suối miền Bắc, tầng giữa dòng chảy.','Ăn tạp: thực vật và động vật nhỏ.','Định danh theo tên chày mắt đỏ trong danh mục gốc.'],
[30,'Barbonymus gonionotus',.05,.15,.6,1.2,15,28,40,1.10,'dart','Thân cao bạc, đầu nhỏ; vây bụng/hậu môn ánh cam đỏ.','Kênh và sông Miền Tây, vùng ngập và nước chậm.','Thực vật, tảo và thức ăn tạp.','Không phải nhóm mè trắng lọc phiêu sinh.'],
[31,'Mylopharyngodon piceus',.3,2,8,35,40,85,140,1.65,'bottom','Thân dài, vảy sẫm, vây đen; đầu và miệng khỏe, không có râu.','Ao/hồ thả nuôi, tìm vùng đáy có ốc và nhuyễn thể.','Nhuyễn thể, đặc biệt ốc và trai.','Ưu tiên mồi ốc; giới hạn game thấp hơn các mẫu cực lớn ngoài tự nhiên.'],
[32,'Cirrhinus cirrhosus',.15,.5,2,8,25,50,85,1.15,'steady','Thân bạc thuôn, đầu nhỏ, môi không dày như rohu.','Ao/hồ thả nuôi; kiếm thức ăn sát đáy.','Mùn hữu cơ, thực vật và sinh vật đáy.','C. mrigala và C. cirrhosus có khác biệt xử lý giữa tài liệu; giữ tên của danh mục gốc, ghi rõ ứng viên.'],
[33,'Hypophthalmichthys harmandi',.2,.6,2,5,25,45,60,.85,'steady','Thân bạc dẹp, mắt thấp như nhóm mè; khó phân biệt chắc chắn chỉ bằng ảnh.','Sông/hồ nước ngọt Việt Nam, tầng giữa.','Lọc phiêu sinh; mồi mây là cơ chế cụm thức ăn trong game.','Không tuyên bố định danh chỉ từ màu bạc; cần mẫu/hình rõ để phân biệt H. molitrix.'],
[34,'Glossogobius giuris',.012,.04,.12,.3,8,16,26,.60,'ambush','Đầu dẹt, miệng lớn, hai vây lưng; thân có vệt nâu, thường nằm đáy.','Kênh, sông và cửa sông, đáy cát/bùn.','Cá nhỏ, giáp xác và ấu trùng.','Bống cát là tên dùng cho nhiều loài; chọn loài đại diện theo danh mục.'],
[35,'Lates calcarifer',.2,.8,4,25,30,70,120,1.55,'runner','Thân bạc, miệng lớn với hàm dưới nhô; vây lưng hai phần, đuôi tròn.','Cửa sông, ven biển và hạ lưu có kết nối nước lợ.','Cá và giáp xác.','MT đại diện vùng hạ lưu; cá chịu được dải mặn rộng.'],
[36,'Mugil cephalus',.08,.2,.8,3,20,40,65,.85,'runner','Đầu tù, thân bạc thuôn, hai vây lưng cách xa; miệng nhỏ.','Cửa sông, ven biển và vùng nước lợ.','Mùn, tảo và sinh vật nhỏ trong nền đáy.','Dùng mồi bột nhỏ, không mô tả cá đối là loài săn cá.'],
[37,'Epinephelus coioides',.2,.7,3,12,25,55,105,1.50,'ambush','Miệng lớn; nhiều đốm cam/nâu đỏ, thân có mảng tối.','Cửa sông và ghềnh biển; gần đá, hốc và vật trú.','Cá, tôm và cua.','Có xu hướng ghì về chỗ trú trong mô phỏng.'],
[38,'Epinephelus malabaricus',.3,1,6,35,30,85,150,1.55,'ambush','Đầu/miệng lớn, đốm nhỏ sẫm và mảng loang; thường không có đốm cam đồng đều.','Ghềnh biển, cửa sông và đáy có vật trú.','Cá, giáp xác và chân đầu.','Mú mè có nhiều tên theo vùng; game chọn mú Malabar đại diện.'],
[39,'Lutjanus argentimaculatus',.15,.5,2.5,10,25,55,90,1.45,'runner','Thân khỏe, miệng có răng nanh; màu đồng đỏ đến nâu, cá non có vạch.','Cửa sông/rừng ngập mặn lúc nhỏ; biển và rạn khi lớn.','Cá và giáp xác.','Tên hồng bạc không có nghĩa da luôn bạc trắng.'],
[40,'Lutjanus russellii',.08,.2,.7,2,15,30,48,1.20,'ambush','Đốm đen ở lưng thân; cá non thường có sọc, miệng có răng nanh.','Cửa sông và ghềnh biển, vùng đá/vật trú.','Cá và giáp xác.','Dùng loài đại diện theo danh mục.'],
[41,'Siganus guttatus',.05,.2,.6,1.2,15,28,40,1.10,'dart','Thân dẹp có đốm vàng cam, đốm vàng lớn gần cuối lưng; vây gai.','Cửa sông và ven biển, vùng có tảo/cỏ biển.','Chủ yếu tảo và thực vật thủy sinh.','Gai vây có độc; phần mô phỏng chỉ thể hiện lực kéo.'],
[42,'Siganus javus',.06,.25,.8,1.8,18,32,50,1.10,'dart','Thân dẹp; chấm nhỏ phía trên và sọc uốn ngang ở phần dưới thân.','Ven biển, vịnh và vùng tảo, nước lợ có thể xuất hiện.','Tảo và thực vật thủy sinh.','Tên dìa công thay đổi theo vùng; giữ ứng viên trong danh mục.'],
[43,'Trachinotus blochii',.1,.4,1.5,3.4,20,38,55,1.20,'runner','Thân cao dẹp bạc, vây ánh vàng; đuôi chẻ sâu, vây lưng/hậu môn dạng liềm.','Ven biển nước thoáng, bãi cát và vùng gần rạn.','Giáp xác, nhuyễn thể và sinh vật nhỏ.','Khác cá chim trắng nước ngọt.'],
[44,'Acanthopagrus latus',.08,.2,.7,1.5,15,28,40,1.10,'bottom','Thân bạc dẹp, vây bụng/hậu môn vàng; hàm có răng nghiền.','Cửa sông và ven biển, đáy cát/bùn có nhuyễn thể.','Giáp xác, nhuyễn thể và động vật đáy.','Họ tráp cần đối chiếu vùng biển; A. latus là loài đại diện.'],
[45,'Acanthopagrus schlegelii',.1,.3,1,3.2,18,32,50,1.20,'bottom','Thân bạc xám sẫm, vây tối; lưng gai, hàm có răng nghiền.','Ven biển, đáy cát/đá và vùng nước lợ; đại diện vùng phía Bắc.','Nhuyễn thể, giáp xác và động vật đáy.','Không khẳng định có ở mọi ghềnh biển Việt Nam.'],
[46,'Sphyraena obtusata',.06,.15,.5,1.2,20,35,55,1.30,'runner','Thân dài bạc, hàm có răng nhọn; hai vây lưng cách xa, đuôi chẻ.','Ven biển nước thoáng và gần thảm cỏ biển.','Cá nhỏ và một phần giáp xác.','Nhồng vàng là tên địa phương; chọn S. obtusata trong danh mục gốc.'],
[47,'Megalops cyprinoides',.1,.3,1.5,6,25,55,100,1.45,'jumper','Vảy bạc lớn, mắt to, hàm dưới nhô; tia cuối vây lưng kéo thành sợi.','Cửa sông và vùng nước lợ kết nối sông/biển.','Cá và giáp xác.','Nhịp đổi hướng nhanh và bứt ngắn; không cần hiệu ứng nhảy mới để dùng dữ liệu.'],
[48,'Chanos chanos',.2,.7,3,8,30,65,110,1.30,'runner','Thân bạc thuôn, miệng nhỏ không răng, một vây lưng; đuôi chẻ sâu.','Cửa sông, đầm nước lợ và vùng ven biển.','Tảo, mùn và sinh vật nhỏ.','Không phải cá măng săn mồi nước ngọt.'],
[49,'Pennahia argentata',.05,.15,.4,1,15,27,40,.90,'bottom','Thân bạc thuôn, vây lưng phần gai và mềm nối nhau; miệng hơi chếch.','Ven biển, đáy cát/bùn.','Tôm, giáp xác và cá nhỏ.','Đù bạc có tên địa phương trùng nhau; dùng Pennahia argentata đại diện.'],
[50,'Sillago sihama',.015,.04,.12,.3,10,20,30,.60,'bottom','Thân bạc dài, mõm nhọn, miệng nhỏ; hai vây lưng, sống bãi cát.','Bãi cát ven biển và cửa sông.','Giun nhiều tơ, tôm và giáp xác nhỏ.','Giun trong game đại diện nhóm mồi giun, không khẳng định giun đất tương đương mọi mồi biển.'],
[51,'Otolithoides biauritus',.3,1,6,35,35,80,140,1.60,'bottom','Thân dài ánh đồng/vàng, đầu và miệng lớn; vây lưng mềm dài.','Biển và cửa sông nước lợ; vùng đáy bùn/cát sâu.','Cá và giáp xác.','Người dùng chọn cá sửu biển/sửu vàng; game dùng O. biauritus, không dùng sửu nước ngọt.'],
[52,'Macrobrachium rosenbergii',.012,.03,.12,.25,9,18,28,.35,'prawn','Thân phân đốt, chủy có răng, râu dài; tôm đực lớn có đôi càng dài xanh.','Sông, kênh và ao nước ngọt; ấu trùng cần nước lợ.','Ăn tạp: giun, động vật đáy, mùn và thức ăn động vật.','Tên tôm chưa có ảnh để xác minh; chọn tôm càng xanh đại diện cho câu lưỡi.'],
[53,'Somanniathelphusa sinensis',.006,.012,.03,.06,3,4.5,6,.30,'crab','Mai nâu rộng, hai càng và bốn đôi chân bò; không có chân bơi dạng mái chèo.','Ruộng ngập, ao và kênh nước ngọt; bờ bùn, gốc cỏ.','Động vật nhỏ, xác hữu cơ và thực vật.','Cua đồng là nhóm nhiều loài; S. sinensis là đại diện, cỡ đo là rộng mai.'],
[54,'Pelodiscus sinensis',.15,.5,1.5,3,15,25,33,1.20,'turtle','Mai dẹt mềm phủ da, cổ dài, mõm dạng ống; chân có màng bơi.','Ao, kênh, sông nước ngọt, đáy bùn/cát.','Cá, giáp xác, nhuyễn thể và động vật nhỏ.','Chọn ba ba trơn đại diện; cỡ đo là dài mai, không gồm đầu/cổ.'],
[56,'Scylla paramamosain',.08,.2,.6,1.2,8,14,20,.60,'crab','Mai rộng có răng cạnh, càng to; đôi chân cuối dẹt dạng mái chèo.','Cửa sông nước lợ, bùn ven rừng ngập mặn.','Nhuyễn thể, giáp xác, cá và xác hữu cơ.','Cua biển là tên chung; chọn cua bùn S. paramamosain theo nghiên cứu Việt Nam, không gọi là ghẹ.'],
[57,'Hoplobatrachus rugulosus',.025,.06,.18,.35,6,10,13,.50,'frog','Thân chắc, da nâu/ô liu có vân sẫm và nếp dọc; chân sau dài khỏe.','Bờ ao, ruộng ngập và kênh nước ngọt; mép nước nông.','Côn trùng, giun và động vật nhỏ.','Người dùng chọn ếch đồng; không nhập chàng hiu/nhái cây vào loài này. Cỡ đo mõm–hậu môn.']
];

const styles = {
  steady:{speed:.13,burst:18,rest:3,turn:1.7,label:'Ghì đều, bứt từng nhịp'},
  dart:{speed:.17,burst:15,rest:2.7,turn:1.3,label:'Đảo hướng, bứt ngắn'},
  runner:{speed:.22,burst:23,rest:2.4,turn:1.5,label:'Chạy dài, đổi hướng'},
  bottom:{speed:.12,burst:24,rest:3.5,turn:1.8,label:'Ghì sát đáy, bứt nặng'},
  sway:{speed:.20,burst:18,rest:2.6,turn:1.2,label:'Lạng ngang, đổi hướng'},
  ambush:{speed:.17,burst:27,rest:3,turn:1.4,label:'Bứt về chỗ trú'},
  jumper:{speed:.25,burst:24,rest:2.5,turn:1.1,label:'Đổi hướng nhanh, bứt ngắn'},
  prawn:{speed:.08,burst:6,rest:4,turn:2,label:'Giật lùi ngắn, sức giữ thấp'},
  crab:{speed:.04,burst:4,rest:5,turn:2.6,label:'Bám đáy, kéo chậm; ít bứt'},
  turtle:{speed:.09,burst:15,rest:4,turn:2.2,label:'Ghì đáy, kéo nặng chậm'},
  frog:{speed:.18,burst:8,rest:3.5,turn:1.1,label:'Giật ngắn ở mép nước'}
};

// These are recorded reference values, not runtime caps. TL, SL and FL are not
// interchangeable. Missing maxima deliberately remain null rather than invented.
const references = {
  1:[129,'TL',40.1],2:[48,'TL',1.6],3:[25,'TL',null],4:[100,'SL',3],
  6:[60,'SL',4.3],7:[150,'TL',45],10:[200,'TL',45],11:[25,'TL',.5],
  12:[15,'SL',null],13:[24.5,'SL',null],15:[130,'SL',44],16:[120,'SL',null],
  17:[130,'TL',86],18:[41.5,'SL',1],22:[130,'SL',20],25:[65,'SL',null],
  26:[20,'TL',null],27:[28,'SL',null],28:[70,'SL',null],29:[48.8,'TL',1.6],
  30:[43,'TL',null],31:[180,'TL',73.5],32:[100,'SL',12.7],33:[54.5,'SL',null],
  34:[50,'SL',null],35:[200,'TL',60],36:[100,'SL',null],37:[120,'TL',15],
  38:[234,'TL',150],39:[104,'TL',14.5],40:[50,'TL',null],41:[42,'TL',null],
  42:[53,'TL',null],43:[110,'FL',3.4],44:[40,'FL',1.5],45:[50,'SL',3.2],
  46:[55,'TL',null],47:[150,'TL',18],48:[180,'SL',14],49:[40,'SL',null],
  51:[160,'SL',null],52:[32,'TL',null]
};
const specialSources = {
  19:'https://tapchikhoahoc.nnmt.net.vn/index.php/vjae/article/view/955',
  52:'https://www.fao.org/4/ac741t/ac741t01.htm',
  53:'https://www.researchgate.net/publication/330279406',
  54:'https://www.biosch.hku.hk/ecology/hkreptiles/turtle/Pelodiscus_sinensis.html',
  56:'https://ctujsvn.ctu.edu.vn/index.php/ctujsvn/article/view/2889',
  57:'https://amphibiaweb.org/cgi/amphib_query?account=iucn&where-genus=Hoplobatrachus&where-species=rugulosus'
};
const provisional = new Set([2,10,13,18,19,20,27,28,32,33,34,38,40,42,44,45,46,49,51,52,53,54,56,57]);
export const SPECIES_PROFILES = Object.freeze(Object.fromEntries(rows.map(row=>{
  const [n,scientificName,min,commonLow,commonHigh,max,cmLow,cmHigh,maxCm,strength,style,recognition,habitat,diet,notes]=row;
  const id='fish_'+String(n).padStart(2,'0'),[referenceMaxCm=null,referenceMeasure=null,referenceMaxKg=null]=references[n]||[];
  const group=n===52||n===53||n===56?'crustacean':n===54?'reptile':n===57?'amphibian':'fish';
  const source=specialSources[n]||`https://www.fishbase.se/summary/${scientificName.replaceAll(' ','-')}.html`;
  return [id,{scientificName,group,taxonomyStatus:provisional.has(n)?'representative':'species_profile',recognition,habitat,diet,notes,
    size:{min,common:[commonLow,commonHigh],max,commonCm:[cmLow,cmHigh],maxCm,
      measure:n===53||n===56?'Rộng mai':n===54?'Dài mai':n===57?'Mõm–hậu môn':'Chiều dài',basis:'simulation_estimate'},
    referenceSize:{maxCm:referenceMaxCm,measure:referenceMeasure,maxKg:referenceMaxKg,basis:'published_reference_not_local_record'},
    fight:{...styles[style],style,strength,basis:'simulation'},
    sources:[{label:n<51&&n!==19?'FishBase':n===19?'Nghiên cứu cá chiên Việt Nam':n===52?'FAO – tôm càng xanh':n===53?'Đại học Nha Trang – cua đồng':n===54?'Đại học Hong Kong – ba ba':n===56?'Đại học Cần Thơ – cua biển':n===57?'AmphibiaWeb':'FishBase',url:source},...(n===52?[{label:'USFWS – kích thước tôm càng xanh',url:'https://www.fws.gov/sites/default/files/documents/Ecological-Risk-Screening-Summary-Giant-River-Prawn.pdf'}]:[])],
    assetIds:n===7?['fish_55','fish_07']:[id],researchDate:SPECIES_RESEARCH_DATE}];
})));

export const NEW_CATCHABLE_SPECIES = [
  {id:'fish_51',name:'Cá sửu vàng',maps:['CSONG','GHE'],baits:['livefish','shrimp'],tech:['bottom','iso'],depth:'bottom',price:60000,color:'#b59b69',shape:'long',pattern:'scales'},
  {id:'fish_52',name:'Tôm càng xanh',maps:['MT','SONG','KENH','AO'],baits:['worm','shrimp','clam'],tech:['don','bottom'],depth:'bottom',price:65000,color:'#617f85',shape:'prawn'},
  {id:'fish_53',name:'Cua đồng',maps:['AO','KENH','MT'],baits:['worm','shrimp','clam'],tech:['don','bottom'],depth:'bottom',price:35000,color:'#82643e',shape:'crab'},
  {id:'fish_54',name:'Ba ba',maps:['AO','KENH','SONG','MT'],baits:['livefish','shrimp','worm','clam'],tech:['bottom','don'],depth:'bottom',price:70000,color:'#6c7751',shape:'turtle'},
  {id:'fish_56',name:'Cua biển',maps:['CSONG'],baits:['clam','shrimp','livefish'],tech:['bottom','iso'],depth:'bottom',price:80000,color:'#6b7862',shape:'crab'},
  {id:'fish_57',name:'Ếch đồng',maps:['AO','KENH','MT'],baits:['cricket','worm'],tech:['don'],depth:'surface',price:38000,color:'#73824b',shape:'frog'}
];

const overrides = {
  fish_01:{maps:['AO','HO','DICHVU','MT','SONG','DAP'],tech:['don','dai','bottom']},
  fish_03:{baits:['worm','cricket','shrimp']},
  fish_04:{baits:['lure','crank','popper','livefish','shrimp'],tech:['lure','don','bottom']},
  fish_05:{baits:['worm','shrimp'],tech:['don','bottom']},
  fish_07:{baits:['leaf','corn','dough'],tech:['dai','bottom'],maps:['AO','HO','DICHVU','DAP']},
  fish_08:{tech:['dai','bottom']},fish_09:{tech:['dai','bottom']},
  fish_10:{name:'Cá trôi (rohu)',tech:['dai','bottom']},
  fish_14:{maps:['DICHVU']},
  fish_17:{maps:['SONG','HO','DAP','MT']},
  fish_22:{baits:['popper','crank','lure','livefish'],tech:['lure','bottom']},
  fish_30:{baits:['dough','leaf','worm']},
  fish_33:{tech:['dai','bottom']},
  fish_35:{baits:['shrimp','livefish','crank','lure']},
  fish_38:{maps:['GHE','CSONG']},
  fish_39:{tech:['iso','lure','bottom']},
  fish_42:{maps:['GHE','CSONG']},
  fish_47:{baits:['lure','shrimp','livefish'],tech:['lure','iso','bottom']},
  fish_48:{baits:['dough','leaf']}
};
export function enrichSpecies(def){
  const profile=SPECIES_PROFILES[def.id],result={...def,...overrides[def.id],...profile,min:profile.size.min,max:profile.size.max};
  // A ranked preference is a gameplay approximation grounded in natural diet.
  result.baitWeights=Object.fromEntries(result.baits.map((id,i)=>[id,i===0?1.4:1]));
  return result;
}
