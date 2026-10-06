# ĐI CÂU! - GAME DESIGN DOCUMENT v0.1

Học câu thật bằng cách chơi game.

Ngày: 06/10/2026. Trạng thái: đặc tả thiết kế tiền sản xuất. Ngôn ngữ chính: tiếng Việt. Đối tượng: đội thiết kế, lập trình, mỹ thuật, âm thanh và cố vấn cần thủ.

Tài liệu chốt một hướng triển khai để làm vertical slice. Các ngưỡng phản xạ, sức tải, giá xu, khối lượng cá, tốc độ tăng trưởng và mật độ cá là giá trị thiết kế khởi đầu. Danh mục 50 cá là danh mục ứng viên nội dung, có tên khoa học dự kiến và trạng thái duyệt; chưa phải danh sách sinh học đã được xác minh đầy đủ. Prototype đi kèm minh họa UI và một số tương tác, chưa phải bản game hay mô phỏng vật lý hoàn chỉnh.

## 01. Sản phẩm và lời hứa với người chơi

“ĐI CÂU!” là game câu cá 2D lấy bối cảnh Việt Nam, nơi tiến bộ đến từ việc người chơi quan sát, tự lắp bộ câu, thực hành và hiểu nguyên nhân thành công hoặc thất bại. Đồ họa là cảnh vẽ tay, góc nhìn bên bờ hơi cao. Ao làng, kênh đồng, hồ chứa và cách nói chuyện của cần thủ tạo ra bản sắc.

Một lượt câu có thể kéo dài 10-25 phút thật. Người mới được học bằng thao tác ngắn; người có kinh nghiệm có thể vào thẳng bài kiểm tra và bỏ gợi ý. Mỗi lần thử phải có một điều người chơi hiểu rõ hơn: độ sâu, cân phao, đường đi mồi, lúc đóng cá hoặc cách giữ tải.

| Người chơi | Nhu cầu | Thiết kế đáp ứng |
| --- | --- | --- |
| Tân thủ chưa có đồ | Biết bắt đầu, hiểu tên linh kiện | Cần tre miễn phí, thao tác theo bước, xem nguyên nhân dưới nước |
| Người biết câu sơ sơ | Thử bộ câu và học trường phái mới | Preset có giải thích, phòng cân phao, các bài kiểm tra |
| Cần thủ ít thời gian ra ngoài | Một chuyến câu có nhịp và có tính phán đoán | Map có cá tồn tại, thời tiết, cá cảnh giác, nhật ký chuyến |
| Người thích đời sống cần thủ | Gặp NPC, kiếm đồ, kể chuyện cá | Quán nước, đơn hàng, mode đời thường và hẹn giờ về |

Bốn trụ cột: thao tác có nguyên nhân; bối cảnh Việt Nam cụ thể; kiến thức của người chơi quyết định; thời gian chuẩn bị và chờ được tôn trọng. Độ hiếm và danh vọng mở nội dung, không cộng xác suất cá ăn vào chỉ số nhân vật.

### Mục tiêu kiểm chứng cho vertical slice

Ít nhất 8/10 người thử mới hoàn thành việc thả bộ câu đầu tiên trong 5 phút; 7/10 giải thích được vì sao phao thay đổi khi thêm chì hoặc mồi; 7/10 phân biệt đúng ít nhất 3/4 tình huống sau khi tắt camera. Đây là tiêu chí tuyển người thử, chưa phải kết quả đã đạt. Học chuyển giao ra ngoài đời cần thử riêng với cố vấn; không suy ra từ việc thắng trong game.

## 02. Phạm vi và thứ tự sản xuất

| Giai đoạn | Map/cá | Gameplay | Nội dung và giới hạn |
| --- | --- | --- | --- |
| Vertical slice | 1 Ao Làng / 4 cá | Cần tre, cân phao mẫu, đọc phao, giữ tải, bán/thả | 10 phút đầu; 8 vật phẩm dùng được; cá có ID từ trước khi ném |
| MVP | 1 làng + 3 map / 12 cá | Câu đơn, câu Đài, lure spinning; 15 bài học | Catalog 75 vật phẩm, 30 cần/15 máy/30 mồi và phụ kiện; dùng chung họ asset có chủ ý |
| Mở rộng kỹ thuật | 10 map / tối đa 50 ứng viên đã duyệt | Lăng xê, lục, ISO, baitcasting | Hệ bài học riêng cho mỗi kỹ thuật; không mở biển trước khi hoàn thiện ISO |
| Mở rộng cộng đồng | Các map đạt chất lượng | Giải đấu, hồ 2-8 người, cá huyền thoại chung | Dịch vụ máy chủ, chống gian lận, lưu sở hữu cá; cần thiết kế và ngân sách riêng |

MVP gồm 3 chế độ đơn người chơi, sổ cá, kinh tế cơ bản, NPC và save offline. Phiên MVP của mode đời thường có một nhiệm vụ “Về trước giờ đón con”. Multiplayer, CMS sản phẩm thật, planner chuyến câu thật và tích hợp shop thuộc giai đoạn sau. Baitcasting chỉ có catalog ứng viên trong v0.1, chưa mở sử dụng trong MVP vì cần gameplay kiểm soát rối dây riêng.

Ưu tiên: P0 là tính đúng của bộ câu, tín hiệu và xử lý cá; P1 là trải nghiệm lớp học, kho đồ, map và kinh tế; P2 là cá huyền thoại đơn người chơi, nhiệm vụ đời thường; P3 là server và sản phẩm thật. Nếu lịch trễ, giảm số biến thể đồ trước khi cắt các vòng lặp P0.

## 03. Kịch bản 10 phút đầu

| Thời gian thật dự kiến | Hành động | Phản hồi và kiến thức |
| --- | --- | --- |
| 00:00-00:45 | Bình minh, tiếng chim; bác Hùng hỏi “Biết câu không?” | Chọn “Chưa cầm cần” hoặc “Biết sơ sơ”; có thể bỏ hội thoại |
| 00:45-01:30 | Nhận cần tre, đào 4 ô đất ẩm | Có 6 phần giun; không hết tiền hay bị chặn chơi |
| 01:30-02:30 | Lắp dây, lưỡi, phao; buộc nút mẫu | Cho thấy thứ tự và thử tải; sai được sửa ngay |
| 02:30-03:30 | Dò một điểm, chỉnh sâu và tải chì | Phao phản ứng; biết đáy sâu khoảng 1.8m trong bài mẫu |
| 03:30-04:30 | Ném vào vùng đã quan sát | Cá huấn luyện vốn có trong ao tiếp cận mồi |
| 04:30-06:00 | Thấy thử mồi rồi ăn trong camera lớp học | Hiểu tín hiệu giả và thật; đóng cá, xem lý do sớm/muộn |
| 06:00-07:30 | Lặp lại với camera tắt | Chỉ nhìn phao; có nút phóng to phao |
| 07:30-09:00 | Giữ góc cần, thả tải lúc cá chạy, dùng vợt | Cá 0.2-0.6kg trong kịch bản; không cần phản xạ quá nhanh |
| 09:00-10:00 | Ghi sổ; bán hoặc thả; quay về chọn bài mới | Mở bằng nhập môn khi đủ bài, không ép phải mua cần |

Mốc thời gian là khoảng dự kiến, không phải đồng hồ ép hoàn thành. Khi mắc kẹt trên 30 giây trong bài học, bác Hùng đưa gợi ý tại đúng thao tác. Người chơi có thể bấm “Làm lại bước”, “Cho tôi xem” hoặc chuyển sang thao tác đơn giản. Cá trong bài học có trạng thái được kiểm soát để đảm bảo tình huống xuất hiện; vẫn không tạo cá lúc giật cần.

## 04. Vòng lặp, phiên chơi và ba chế độ

Trong bản web, **Đi câu** là không gian chơi riêng theo luồng **Bến → Chuẩn bị → Đi câu**. Map, điểm, cần và mồi được chọn trước khi vào bờ; đồ nghề, học câu, sổ cá và chợ ở ngoài cảnh chơi. Cảnh câu phủ toàn màn hình với tín hiệu, lực dây và điều khiển. Menu tạm dừng cho tiếp tục, chuẩn bị lại hoặc về bến; rời một lượt đang diễn ra cần xác nhận thu cần. Các chế độ nội dung dưới đây là hướng phát triển, dùng chung không gian chơi này.

Vòng thao tác: quan sát điểm → chọn trường phái → lắp bộ câu → dò/chỉnh → ném/thả → theo dõi tín hiệu → đóng cá → giữ tải → đưa vào vợt → xử lý kết quả. Khi trượt, game giữ lại cảnh và giải thích một nguyên nhân chính cùng bằng chứng, rồi cho sửa bộ câu hoặc ném lại.

Vòng chuyến: chọn map/giờ → chuẩn bị đủ đồ → đến điểm → thử 2-3 giả thuyết → ghi nhận kết quả → bán/thả/hoàn đơn → bảo trì → trở về làng. Vòng dài hạn: hoàn bài học → có chứng chỉ → mở tình huống/map → khám phá loài → làm nhiệm vụ/giải đấu → hoàn thiện bộ đồ theo mục đích.

| Chế độ | Trợ giúp mặc định | Thời gian | Thắng/thua |
| --- | --- | --- | --- |
| Học câu | Camera lớp học, vệt dây, lý do lỗi, thao tác theo bước | Tạm dừng khi mở sách/bộ câu; bài tập theo lượt | Đạt tiêu chí bài; thử lại miễn phí |
| Mô phỏng | Tắt camera cá; có thể phóng phao và bật chỉ báo tải | Đồng hồ game chạy 6 lần giờ thật; có lựa chọn 1 lần | Chuyến có mục tiêu tự chọn, thất bại cho thông tin |
| Cần thủ đời thường | Gợi ý khi yêu cầu; NPC, phí chuyến, hẹn giờ về | Cùng tỷ lệ 6 lần, pause đơn người chơi | Hoàn cam kết/chuyến; trễ giờ thay đổi nhiệm vụ và lời thoại |

Tốc độ đồng hồ chỉ thay ngày/giờ và thời tiết; solver cá, cửa sổ ăn và điều khiển chạy theo giây thật. Khi pause, cá/clock/âm thanh hành động dừng đồng bộ. Khi app mất focus, singleplayer tự pause; quay lại hiện nút tiếp tục. Mode thử phản xạ không tự đổi tốc độ giữa tín hiệu.

## 05. Học viện cần thủ và chứng chỉ

Bài học mở theo đồ thị điều kiện. Nhập môn: L01 → L02/L03 → L04 → L07/L08 → L09/L15. Câu Đài: nhập môn → L05 → L06 → L07. Lure: nhập môn → L10 → L11 → L12/L13 → L14 → L09. L07 có biến thể phao cần tre và phao Đài. Chứng chỉ chấm hiểu tình huống, không chỉ số lần câu được cá.

Mỗi bài có: mục tiêu một câu, bộ đồ mẫu, thao tác, nguyên nhân mô phỏng nhìn thấy, một lượt có hỗ trợ, một lượt giảm hỗ trợ, kiểm tra và lời giải. Nút “Tôi đã biết” đưa vào kiểm tra chứ không buộc xem toàn bộ tutorial. Người dùng có thể xem lại kiến thức đã mở ở bất kỳ lúc nào.

Kết quả hiển thị phản xạ tham khảo, độ chính xác phán đoán và chất lượng xử lý. Không biến con số 0.36 giây thành chuẩn cần thủ giỏi. Hỗ trợ cửa sổ phản xạ, giảm thao tác giữ nút và phóng phao được bật độc lập; không giảm điểm kiến thức vì dùng trợ năng.

| ID | Bài | Thao tác | Đạt bài khi |
| --- | --- | --- | --- |
| L01 | Đào giun | 4 ô đất; chọn vùng ẩm | Có 6 phần giun; không giới hạn số lần thử |
| L02 | Làm nút buộc mẫu | Luồn, quấn, trở lại, làm ẩm, siết | Đúng thứ tự; thử tải 3 lần |
| L03 | Móc giun và chọn lưỡi | Lắp lưỡi; móc mồi | Mồi/lưỡi tương thích 3/4 tình huống |
| L04 | Dò đáy ao | Dò 3 điểm | Ghi đúng 3 độ sâu với sai số game ±0.15m |
| L05 | Cân phao không mồi | Thêm/bớt chì 0.02g | Lộ đúng 4 mục trong cấu hình bài mẫu |
| L06 | Tải mồi và câu đáy | Gắn mồi; đặt độ sâu | Phân biệt lửng/chạm đáy 4/5 |
| L07 | Đọc phao theo tình huống | 10 tín hiệu có nhãn ground-truth | Đúng ≥8/10; giật giả ≤2; xem giải thích |
| L08 | Đóng cá | Giật theo cửa sổ ăn của scenario | Thành công 3/5 lần; không yêu cầu phản xạ cố định |
| L09 | Giữ tải và đưa cá vào vợt | Giữ góc; ngừng/thu/nhả | Vào vợt 2 lần; giải thích nếu đứt |
| L10 | Bộ lure phù hợp | Chọn cần-máy-dây-mồi | Tương thích 4/5 bộ |
| L11 | Ném lure chính xác | Ngắm mép cỏ; canh lực | 3/5 lần trong vùng 1.5m |
| L12 | Retrieve và Stop & Go | Thu đều rồi thu/ngừng | Đúng 3 chu kỳ; thấy đường đi mồi |
| L13 | Walk the dog / Twitch | Chọn mồi tương thích; đổi nhịp | Đạt 3/5 lần đường đi yêu cầu |
| L14 | Chỉnh drag máy | Chỉnh ngưỡng bằng cân tải game | Có nhả dây trước sức bền mắt xích yếu |
| L15 | Bán, thả, ghi sổ | Chọn một kết quả bắt cá | Cá chỉ được xử lý một lần; sổ có nguồn phát hiện |

## 06. Các trường phái và điều khiển khác nhau

| Trường phái | Bộ câu và động từ | Tín hiệu / lỗi cần học | Phạm vi |
| --- | --- | --- | --- |
| Cần tre / câu đơn | Cần không máy, dây, phao tùy bài, lưỡi, mồi; thả, giật, dẫn cá | Độ sâu sai, nút yếu, nâng cần quá cao, giật giả | MVP |
| Câu Đài | Cần tay, trục, thẻo, phao, chì; cân, dò, chỉnh độ sâu, xả mồi, bắt nhịp | Tải mồi đổi phao, thẻo nằm đáy, nhiễu gió/dây | MVP |
| Lure spinning | Cần, máy đứng, dây, leader tùy cấu hình, mồi giả; ném, thu, ngừng, twitch | Chọn sai mồi, tốc độ, tầng nước; vướng cỏ; kéo quá tải | MVP |
| Lure baitcasting | Máy ngang; thêm kiểm soát cuộn dây/phanh khi ném | Backlash, lực ném và mồi không phù hợp | Mở rộng |
| Lăng xê / bottom | Cần máy, chì hoặc lò xo, thẻo, mồi; ném, chờ đầu cần, thu, chỉnh drag | Chì không giữ đáy; mồi tan; dây chùng | Mở rộng |
| Câu lục | Bộ lục/phao theo loại; tập trung dò đáy, điều khiển bộ câu và thời điểm thao tác | Bài học và quy tắc giữ cá cần cố vấn duyệt; có khả năng mắc thân | Mở rộng có điều kiện duyệt |
| ISO | Phao, stopper theo cấu hình, chì kẹp, leader; điều khiển dây, thả trôi, xả mồi | Dây kéo mồi lệch dòng, phao không phù hợp, chạm đá | Mở rộng cùng map biển |

Không có thanh quay máy trên cần tre hoặc cần Đài. Với cần không máy, nhả tải bằng hạ/đổi góc cần và di chuyển trong vùng đứng; dây không tự dài thêm. Nếu cá vượt cự ly bộ dây và sức bền, phải xử lý rủi ro bằng kỹ thuật, không dùng nút “drag” giả.

Một phiên giữ hai preset thiết bị để chuyển sau khi thu hết dây. Lắp đồ khác khi đang fight phải thu/thoát tình huống rõ ràng. Preset có tính tương thích, mục tiêu loài/tầng và ghi chú; không có “bộ mạnh nhất”.

## 07. Buộc nút, lắp bộ câu và tương thích

MVP dạy một nút mẫu phù hợp lưỡi có khoen trên dây mono, được cố vấn chọn. Bước thực hành: luồn qua khoen → tạo vòng/quấn theo recipe → đưa đầu dây về đúng vòng → làm ẩm → siết và cắt đầu thừa. Số vòng là thuộc tính recipe và vật liệu; không viết “mọi nút đều quấn 5-7 vòng”.

Trong game, chất lượng nút được tính bằng việc hoàn thành đúng bước, thứ tự, độ chồng vòng và thao tác siết, với trợ giúp căn vị trí. Hàm khởi đầu Q = clamp(0.45 + 0.12*ordered + 0.12*loop_correct + 0.10*moistened + 0.11*tightened - overlap_penalty, 0.25, 1). Biến nhị phân 0/1; overlap_penalty thuộc [0,0.15]. Tất cả hệ số là tuning, không dự đoán độ bền thật. Mô phỏng tải trình bày sức bền hiệu dụng theo cấu hình và lý do.

Lắp bộ câu là workspace ba cột: danh mục bên trái, bộ câu có dây liên tục ở giữa, thông tin vật đang chọn bên phải. Chọn bằng click/tap rồi bấm “Gắn vào”; kéo thả là tùy chọn. Dây nối và mũi tên cho thấy quan hệ linh kiện; lỗi nằm tại phần sai, ví dụ “Máy ngang cần loại cán phù hợp” hoặc “Mồi 30g vượt dải ném 5-15g của cần mẫu”.

Validator kiểm tra: cần có/không máy; loại máy/cán; dải khối lượng ném; sức bền trục/thẻo/lưỡi; tải phao/chì/mồi; độ sâu và chiều dài bộ dây; loại mồi/kỹ thuật; linh kiện còn số lượng. PE là nhãn vật liệu/kích cỡ, không tự đổi một nhãn PE sang một tải chính xác cho mọi dây. Size máy cũng không được suy ra thành sức mạnh chuẩn chung giữa các hãng.

## 08. Cân phao và dò đáy

Phòng thực hành có ống thử và mặt cắt đáy. Người chơi thay chì, phao, khối lượng mồi và vị trí phao. Mặt nước, vạch trên ngọn và vị trí lưỡi phải nhìn được; con số bổ trợ có thể tắt. Phao chìm hoàn toàn vẫn có nút “Thu bộ câu”, không mất UI.

Bài mẫu dùng ngọn phao có 8 mục, khả năng tải danh định 1.2g và mỗi mục ngọn tương đương 0.04g trong mô hình hiệu chuẩn. Solver không dùng “1.2g” như tổng trọng lượng phao. capacity_g là tải phụ thêm để đưa phao đến vạch tham chiếu; thể tích thân/ngọn và trọng lượng bản thân được asset calibration lưu riêng.

Trong mô hình đơn giản, số mục lộ n = clamp((load_to_tip_submerge_g - effective_downward_load_g)/tip_equivalent_g_per_mark, 0, marks). effective_downward_load gồm chì, tải chìm hiệu dụng của lưỡi/mồi và trục, trừ phần tải được đáy đỡ. Khi dùng mô hình đầy đủ: giải cân bằng lực nổi rho*g*V_submerged với trọng lực và lực căng dây. Độ nổi của mồi và điểm tỳ đáy phải có mặt trong phép tính.

| Tình huống | Quan sát | Bài học |
| --- | --- | --- |
| Bớt chì khi bộ câu lửng | Phao lên; lộ thêm mục | Tổng tải giảm |
| Thêm mồi chìm ở lửng | Phao xuống thêm | Cân không mồi và có mồi khác nhau |
| Lưỡi/mồi tỳ đáy | Một phần tải được đáy đỡ | Số mục chỉ có ý nghĩa khi biết đáy và bộ câu |
| Chì dư so tải phao | Phao mất ngọn | Bớt chì hoặc chọn phao khác; đừng chờ cá giải quyết |
| Dòng/gió kéo dây | Phao lệch, rung hoặc chìm giả | Kết hợp hướng trôi và tính ổn định, không kết luận chỉ từ một nhịp |

Quy trình dò: lắp tải dò → đo ba điểm → ghi độ sâu và độ cứng nền → bỏ tải dò → cân cấu hình → gắn mồi → chỉnh độ sâu câu → kiểm tra lại. “Cân 4 câu 2” chỉ xuất hiện như một bài cấu hình cụ thể đã ghi điều kiện; không trình bày là công thức mặc định mọi ao.

Fog địa hình mở theo bán kính mẫu 2m quanh điểm đo. Chưa đo thì bản đồ ghi “Chưa khảo sát”, không nội suy một mặt đáy quá chính xác. Chỉ khi đủ mẫu mới hiển thị đường gần đúng và độ tin cậy. Người chơi có thể ghi chú bằng văn bản hoặc pin vị trí.

## 09. Đọc tín hiệu, đóng cá và giải thích thất bại

Tín hiệu UI được tạo từ trạng thái cá + lực lên bộ câu + nhiễu môi trường. Bộ luyện có ground-truth do scenario xác định, thay vì lấy hình dạng phao đơn lẻ làm đáp án. Cá có thể thử, giữ, hút, nhả hoặc chạm dây; gió và sóng có thể gây tín hiệu giống ăn.

| Scenario | Trạng thái thật | Lựa chọn đúng trong bài mẫu | Phản hồi khi sai |
| --- | --- | --- | --- |
| Ngọn rung ngắn; mồi chưa vào miệng | Cá thử hoặc chạm mồi | Theo dõi thêm | “Lưỡi chưa vào miệng cá” + replay lớp học |
| Kéo xuống dứt khoát sau khi giữ mồi | Lưỡi có thể đóng | Đóng theo cửa sổ cấu hình | Chỉ ra sớm/muộn trên timeline |
| Phao nâng khi cá đỡ tải mồi | Tải đáy giảm; cá có thể đang giữ | Xem nhịp tiếp theo và bộ câu | Không dạy cứ nhô 2 mục là giật |
| Trôi đều theo gió | Nhiễu; không có cá giữ lưỡi | Sửa cách giữ dây/điểm thả | Hiện nguyên nhân dây bị kéo |
| Phao chìm vì dư chì | Lỗi setup | Thu và chỉnh | “Tải chì lớn hơn cấu hình phao” |

Cửa sổ hookset bắt đầu khi tình huống bite đủ điều kiện; mặc định 0.5-1.4 giây thật tùy scenario, mở rộng theo trợ năng. Độ đóng phụ thuộc mức lưỡi vào miệng, slack và lực giật; không chỉ phụ thuộc bấm đúng nhịp. Đóng sai có thể trượt, làm mồi rơi hoặc tăng cảnh giác, không tự trừ tiền phạt vô cớ.

Sau lỗi, chỉ hiển thị nguyên nhân đã quan sát được trong solver: mồi không còn, móc không vào miệng, dây vượt ngưỡng, rơi cá vì slack, lưỡi vướng nền, cá không trong bán kính phát hiện. Nếu có nhiều nguyên nhân, ưu tiên nguyên nhân trực tiếp rồi mở “Xem chi tiết”. Trong mô phỏng không tiết lộ vị trí con cá chưa nhìn thấy.

## 10. Ném, lure và đường đi mồi

Ném có ngắm hướng, giữ/thả lực hoặc thanh kéo thay thế, gió và tương thích cần-mồi. Điểm đáp dao động có giới hạn từ thao tác/gió; không tự phóng vào cá. Một lần ném xuống bụi có phản hồi ngay: vệt dây, vật cản và khả năng gỡ. Hỗ trợ ném một nút giữ cùng quy luật điểm đến với phạm vi ngắm rộng hơn.

| Kiểu điều khiển | Người chơi thực hiện | Chuyển động mồi |
| --- | --- | --- |
| Thu đều | Giữ/bật nút thu, chọn tốc độ | Đường ổn định theo loại lure và độ sâu |
| Stop & Go | Thu rồi ngừng, đổi thời lượng | Mồi nổi/chìm theo buoyancy; pause có ảnh hưởng thật |
| Twitch/Jerk | Xung ngắn/dài góc đầu cần | Mồi tương thích đảo hướng; xung quá mạnh tạo slack |
| Walk the dog | Đổi trái/phải với nhịp hợp lý | Nhái/mồi mặt zigzag; không áp dụng cho mọi mồi |
| Bottom hopping | Nhấc rồi hạ, để mồi mềm xuống | Đáy và trọng lượng quyết định chạm đáy/vướng |

Nhịp được đọc từ input qua low-pass filter; không thưởng click càng nhanh càng tốt. Fish AI dùng tốc độ/độ sâu/độ lệch đường đi thật của lure. Trong lớp học, mặt cắt và đường đi được hiện; trong mô phỏng, chỉ dấu mặt nước, đầu cần, dây và tiếng máy được thấy. MVP triển khai thu đều, Stop & Go và một biến thể walk/twitch; các biến thể còn lại thuộc bài mở rộng.

## 11. Giữ tải, cần cong và đưa cá lên bờ

Dây tính lực theo N; UI trợ giúp có thể hiện kgf với 1kgf = 9.80665N. nominal_break_kgf là tải danh định của vật mẫu, không là sức bền hiệu dụng. B_eff = min(B_truc*Q_nut_truc, B_theo*Q_nut_theo, B_leader*Q_nut_leader, B_hook) * abrasion_factor. Nếu không có leader, bỏ mắt xích đó. Cần có giới hạn tải riêng, không gộp tải cần thành tải dây.

F_tension khởi đầu từ độ giãn dây, vận tốc tương đối, drag giới hạn của máy, góc cần và vật cản. Tension không được dùng trực tiếp như HP cá. Energy cá giảm theo công và thời gian fight; có các đợt chạy và phục hồi ngắn. Khi cá bơi về phía người chơi, slack tăng và có thể rơi lưỡi dù tải thấp.

Quá tải tạo cảnh báo bằng độ cong cần, tiếng dây/drag, và chữ nếu bật hỗ trợ. Đứt chỉ xảy ra khi vượt ngưỡng hiệu dụng trong khoảng ngắn được solver tích lũy, tránh lệ thuộc một frame. Hư cần kiểm tra thêm góc dựng cao và tải tại ngọn. Drag máy cần có ngưỡng nhả và hysteresis để tránh rung bật/tắt liên tục.

PC: chuột đổi góc trong vùng thao tác, Space giữ/bật thu, Q/E nhả/siết drag khi có máy, Shift tạm dừng thu, N dùng vợt; hỗ trợ remap. Mobile ngang: pad góc bên trái, thu bên phải, drag dạng slider có +/-; ngón tay không che phao. Cần tay dùng nhóm nút dẫn cá riêng. Khi cá vào vùng vợt và năng lượng thấp, bấm vợt; không tự nhận cá ngay khi energy bằng 0.

## 12. Fish AI, cá tồn tại và điều kiện môi trường

Mỗi cá có fish_id bền vững trong save, species_id, vị trí mặt nước và depth, cân nặng game, energy, hunger, fear, home_zone, state, lịch sử bắt/thả và dấu hiệu nhận biết nếu trophy. Cá được tạo khi khởi tạo/khôi phục quần thể map, không khi đóng cá. Bổ sung quần thể theo lịch ecology được ghi event, không sau mỗi cú ném.

State machine: Cruise/Rest → Notice → Inspect → Follow hoặc Sample → Bite → Hooked → Fight → Landed → Released hoặc Removed. Nhánh Reject/Spooked quay về tránh vùng nhiễu; snag là trạng thái rig, không là cá. Mỗi quyết định có guard, cooldown và event log để replay.

Điểm hấp dẫn S = habitat_fit * depth_fit * presentation_fit * bait_fit * hunger * visibility - fear_cost - noise_cost. Các thành phần chuẩn hóa [0,1]. Nếu lure nằm ngoài vùng thấy/ngửi, con cá không được tham gia quyết định ăn. Stochastic decision chỉ dùng để đa dạng hóa cá hiện hữu; sửa setup phải thay S theo nguyên nhân có thể giải thích. Chưa có lời hứa rằng mọi bộ đúng đều câu được.

| Biến | Tác động trong game | Cách người chơi nhận biết |
| --- | --- | --- |
| Nhiệt độ nước và giờ | Vùng/tầng hoạt động theo profile loài | Sổ đã khám phá, khí hậu, gợi ý bài học |
| Dòng chảy | Rig/lure trôi, mồi tan, khu cá trú | Vệt nước, cỏ nghiêng, tốc độ phao |
| Độ đục / ánh sáng | Tầm phát hiện và tín hiệu cần thiết | Màu nước; không có phần trăm lợi thế tuyệt đối |
| Gió và mưa | Nhiễu phao, sai số ném, âm nền | Cành lá, giọt nước, hướng gợn |
| Oxy đơn giản | Giảm/đổi hoạt động trong scenario phù hợp | Dấu hiệu bề mặt có giải thích sau bài |
| Áp suất | Thuộc profile thử nghiệm; chưa khóa quan hệ | Không dạy quy tắc “áp suất X chắc có cá” |

Cảnh giác/mồi quen được giới hạn và hồi phục. Tuning khởi đầu: mồi lặp phạt tối đa 25% presentation score trong vùng nhỏ; fear tăng theo splash/người đứng gần; trở lại nền theo thời gian yên. Đây là cơ chế game phải kiểm tra với cố vấn, không kết luận khoa học rằng cá ghi nhớ một loại mồi theo đúng số phần trăm này.

MVP tối đa 96 cá/map. AI gần mồi chạy 10Hz; cá xa 2Hz; physics 60Hz; render nội suy độc lập. Spatial grid 2m chỉ là khởi điểm benchmark. Lưu RNG state và input để tái hiện lỗi. Camera lớp học dùng cùng trạng thái AI với mặt nước, không dựng một phim minh họa khác đáp án.

## 13. Map, đọc mặt nước và địa hình đáy

Tất cả địa danh là giả tưởng, tổng hợp sinh thái và văn hóa vùng; không thể hiện tọa độ điểm câu thật. Mỗi map có world bounds, bờ đứng, nước, heightfield đáy, nền bùn/cát/đá, cover, current field, fish population, weather profile, khu được phép và điểm ra về. Hình 2D chỉ là phép chiếu của world position; cá có tọa độ ngang và depth để mồi không gặp cá khác tầng một cách vô lý.

Ao Làng được khai báo là ao quản lý có thả một số cá nuôi. Kênh Đồng là hệ sinh thái riêng; không tự chép cá trắm/mè nuôi từ ao sang kênh. Hồ Núi gồm quần thể tự nhiên và cá được thả theo cốt truyện; cần duyệt danh sách theo map. Đặc điểm Bắc Bộ/Nam Bộ không dùng chung chỉ bằng đổi background.

| Map / scope | Không gian | Điểm và độ sâu game | Mục tiêu học |
| --- | --- | --- | --- |
| Ao Làng / MVP | Cầu tre; bờ chuối; hố bùn | Mép bèo, bãi cạn, chân cầu, hố bùn; 0.7-3.2m | Dò đáy; đừng giật khi phao chỉ rung |
| Kênh Đồng / MVP | Lục bình; cầu bê tông; đường đất | Mép cỏ, cống nhỏ, dòng chậm; 0.4-2.5m | Đưa mồi qua mép bèo; xử lý vướng |
| Hồ Núi / MVP | Núi thấp; cây chìm; bãi đá | Drop-off, vịnh kín, cây chìm; 1.5-12m | Chọn điểm; giữ tải khi cá chạy |
| Sông Bãi Bồi / EXPANSION | Bãi ngô; chân cầu; dòng giao nhau | Chân cầu, nước quẩn, rìa luồng; 1-9m | Giữ mồi khi dòng chảy |
| Lòng Đập / EXPANSION | Vách đá; lòng hồ rộng; vùng xả cấm | Vịnh an toàn, bãi đá, lòng cũ; 3-30m | Câu sâu; không đi vào vùng xả |
| Suối Đại Ngàn / EXPANSION | Đá cuội; tre; nước nông trong | Sau đá, mép hố, bóng cây; 0.2-3m | Tiếp cận kín; không dùng tên cá suối làm loài |
| Kênh Miền Tây / EXPANSION | Bến xuồng; dừa nước; bè cá | Mép cỏ, giao kênh, bến vắng; 0.5-5m | Độ đục; giờ nước; sinh thái khác ao Bắc Bộ |
| Hồ Dịch Vụ / EXPANSION | Lều câu; bàn mồi; chủ hồ | Ô gần bờ, góc yên, dải xả mồi; 1.2-5m | Cá cảnh giác; tính chi phí chuyến |
| Cửa Sông / EXPANSION | Bãi bùn; rừng ngập mặn; thuyền | Rìa cát, dòng giao nhau, chân kè; 0.6-8m | Thủy triều; độ mặn; kiểm tra alias |
| Ghềnh Biển / EXPANSION | Kè đá; bọt sóng; vịnh an toàn | Mép đá, khe đá, bãi cát; 1.5-18m | Điều khiển dây; không dạy đứng trên đá trơn |

Đọc mặt nước dựa trên cue có nguyên nhân: vệt quẫy từ cá đang săn, bong bóng từ cá hoặc đáy, cây chìm, mép bèo, rìa dòng và chim kiếm ăn. Cue không luôn xác định một loài; game cho phép giả thuyết sai và giải thích sau khảo sát. “Mắt đại lão” đánh dấu tối đa hai cue quan sát được, không hiện cá xuyên mặt nước.

Mỗi điểm có sơ đồ đáy lưu theo những mẫu đã đo. Người chơi đánh dấu “mồi kẹt cây ở khoảng 12m” hay “độ sâu đo gần 2m”. Nhật ký giữ phương pháp đo và sai số game. Sonar điện tử chỉ là vật mở rộng có giới hạn nội dung, không cần để chơi MVP.

### Ví dụ authored encounter: chép ở Ao Làng

Con world_ao_001 tồn tại gần hố bùn 1.8m. Ném mồi ở bãi cạn ngoài vùng hoạt động → chưa có cá tiếp cận. Dò đáy rồi chỉnh sâu hợp lý → fish inspect có thể xảy ra. Thêm mồi làm phao chìm; chỉnh lại tải → đọc được tín hiệu. Giật khi cá thử → bỏ đi, fear tăng trong vùng. Đợi yên, đổi cách thả → cơ hội quay lại. Mỗi bước có event log để QA phân biệt lỗi AI và lỗi thao tác.

## 14. Danh mục 50 cá và sổ cá Việt Nam

Catalog dùng species_id bền vững. Tên địa phương nằm trong aliases_vi có vùng và nguồn, không là một species_id mới. Cá điêu hồng và trê lai phải được biểu diễn bằng variant/hybrid record, không cộng vào số 50 loài. Một taxon còn tranh luận được khóa phát hành cho đến khi duyệt, nhưng có thể dùng sprite và hành vi mẫu trong build nội bộ với nhãn rõ.

12 mục đầu là roster MVP dự kiến. Khối lượng, giá xu và map gán trong CSV là thông số game; không phải khối lượng phổ biến, giá cá thị trường hay kết luận phân bố. Cả roster MVP cần cố vấn xác nhận. FAO giúp đối chiếu một phần tên cá nuôi ở Việt Nam; tên khoa học trong tài liệu cũ có thể là synonym và phải đối chiếu dữ liệu hiện hành trước phát hành.

| ID / giai đoạn | Tên hiển thị dự kiến | Taxon dự kiến | Trường phái thử |
| --- | --- | --- | --- |
| fish_01 / MVP | Cá chép | Cyprinus carpio | Câu đơn, Đài, Lăng xê |
| fish_02 / MVP | Cá diếc | Carassius auratus | Câu đơn, Đài |
| fish_03 / MVP | Cá rô đồng | Anabas testudineus | Câu đơn, Đài |
| fish_04 / MVP | Cá lóc | Channa striata | Lure, Câu đơn |
| fish_05 / MVP | Cá trê vàng | Clarias macrocephalus | Câu đơn, Lăng xê |
| fish_06 / MVP | Cá rô phi vằn | Oreochromis niloticus | Câu đơn, Đài |
| fish_07 / MVP | Cá trắm cỏ | Ctenopharyngodon idella | Đài, Lăng xê |
| fish_08 / MVP | Cá mè trắng | Hypophthalmichthys molitrix | Đài, Lăng xê |
| fish_09 / MVP | Cá mè hoa | Hypophthalmichthys nobilis | Lăng xê, Đài |
| fish_10 / MVP | Cá trôi Ấn Độ / rohu | Labeo rohita | Đài, Lăng xê |
| fish_11 / MVP | Cá sặc rằn | Trichopodus pectoralis | Câu đơn, Đài |
| fish_12 / MVP | Cá sặc bướm | Trichopodus trichopterus | Câu đơn |
| fish_13 / EXPANSION | Cá trê đen | Clarias fuscus | Câu đơn, Lăng xê |
| fish_14 / EXPANSION | Cá trê phi | Clarias gariepinus | Lăng xê |
| fish_15 / EXPANSION | Cá tra | Pangasianodon hypophthalmus | Lăng xê, Đài |
| fish_16 / EXPANSION | Cá basa | Pangasius bocourti | Lăng xê |
| fish_17 / EXPANSION | Cá lăng đuôi đỏ | Hemibagrus wyckioides | Lăng xê |
| fish_18 / EXPANSION | Cá bỗng | Spinibarbus denticulatus | Câu đơn, Lăng xê |
| fish_19 / EXPANSION | Cá chiên | Bagarius yarrelli | Lăng xê |
| fish_20 / EXPANSION | Cá ngạnh | Cranoglanis bouderius | Lăng xê, Câu đơn |
| fish_21 / EXPANSION | Cá nheo | Silurus asotus | Lăng xê |
| fish_22 / EXPANSION | Cá lóc bông | Channa micropeltes | Lure |
| fish_23 / EXPANSION | Cá thát lát | Notopterus notopterus | Câu đơn, Lăng xê |
| fish_24 / EXPANSION | Cá thát lát cườm | Chitala ornata | Lure, Lăng xê |
| fish_25 / EXPANSION | Cá bống tượng | Oxyeleotris marmorata | Câu đơn, Lăng xê |
| fish_26 / EXPANSION | Cá bống kèo | Pseudapocryptes elongatus | Câu đơn |
| fish_27 / EXPANSION | Cá chạch bùn | Misgurnus anguillicaudatus | Câu đơn |
| fish_28 / EXPANSION | Cá chạch lấu | Mastacembelus favus | Lăng xê, Câu đơn |
| fish_29 / EXPANSION | Cá chày mắt đỏ | Squaliobarbus curriculus | Câu đơn, Đài |
| fish_30 / EXPANSION | Cá mè vinh | Barbonymus gonionotus | Câu đơn, Đài |
| fish_31 / EXPANSION | Cá trắm đen | Mylopharyngodon piceus | Lăng xê |
| fish_32 / EXPANSION | Cá trôi mrigal | Cirrhinus cirrhosus | Đài, Lăng xê |
| fish_33 / EXPANSION | Cá mè trắng Việt Nam | Hypophthalmichthys harmandi | Lăng xê |
| fish_34 / EXPANSION | Cá bống cát | Glossogobius giuris | Câu đơn |
| fish_35 / EXPANSION | Cá chẽm / vược | Lates calcarifer | Lure, ISO, Lăng xê |
| fish_36 / EXPANSION | Cá đối mục | Mugil cephalus | ISO, Câu đơn |
| fish_37 / EXPANSION | Cá mú chấm cam | Epinephelus coioides | ISO, Lăng xê, Lure |
| fish_38 / EXPANSION | Cá mú mè | Epinephelus malabaricus | Lăng xê, ISO |
| fish_39 / EXPANSION | Cá hồng bạc | Lutjanus argentimaculatus | ISO, Lure |
| fish_40 / EXPANSION | Cá hồng chấm đen | Lutjanus russellii | ISO, Lăng xê |
| fish_41 / EXPANSION | Cá dìa chấm | Siganus guttatus | ISO |
| fish_42 / EXPANSION | Cá dìa công | Siganus javus | ISO |
| fish_43 / EXPANSION | Cá chim vây vàng | Trachinotus blochii | ISO, Lure |
| fish_44 / EXPANSION | Cá tráp vây vàng | Acanthopagrus latus | ISO, Lăng xê |
| fish_45 / EXPANSION | Cá tráp đen | Acanthopagrus schlegelii | ISO, Lăng xê |
| fish_46 / EXPANSION | Cá nhồng vàng | Sphyraena obtusata | Lure |
| fish_47 / EXPANSION | Cá cá cháo lớn | Megalops cyprinoides | Lure |
| fish_48 / EXPANSION | Cá cá măng sữa | Chanos chanos | ISO |
| fish_49 / EXPANSION | Cá cá đù bạc | Pennahia argentata | Lăng xê |
| fish_50 / EXPANSION | Cá cá đục | Sillago sihama | Lăng xê, Câu đơn |

Sổ cá có tranh hình thái, tên/alias đã duyệt, nơi người chơi đã gặp, cách tiếp cận đã thử, tầng nước ghi nhận, đồ dùng hiệu quả trong chuyến và lịch sử bắt. Thông tin chưa khám phá ghi “Chưa có quan sát”, cho biết cách tìm, tránh khóa cả kiến thức cơ bản an toàn. Thông tin bài học đã mở vẫn đọc được dù chưa bắt loài đó.

Ba lớp dữ liệu trong một trang sổ: “Quan sát của bạn”, “Kiến thức đã duyệt”, “Gợi ý thử trong game”. Một lần cá ăn lúc 06:10 không biến thành kết luận loài đó chỉ ăn 05:30-08:00. Tên bản địa và khoa học có thể mở độc lập với tiến độ để tránh game dạy nhầm vì che thông tin.

Workflow duyệt: chọn taxon → ghi nguồn định danh → duyệt tên địa phương → duyệt phân bố theo map → duyệt thức ăn/tầng và hành vi → duyệt cách câu → duyệt hình thái sprite → duyệt bài học và quy tắc xử lý cá. Trạng thái draft/reviewed/approved/deprecated nằm trong content pack. Chỉ approved mới là kiến thức chắc chắn trong bản phát hành.

## 15. Mồi miễn phí, thu thập và phối mồi

Giun đất là đường hồi phục miễn phí. Người chơi chọn ô đất ẩm, đào với công cụ mặc định, nhận ít nhất 6 phần trong bài nhập môn; ngoài bài học có đá/cỏ và lượng thu biến thiên có giới hạn. Một lượt 30-60 giây thật; hỗ trợ bỏ minigame vẫn đổi một lượng thời gian game tương đương. Mưa chỉ điều chỉnh tuning của vùng đất, không mặc định “+80%” như một quy luật thực tế.

Dế, tôm, cá mồi và ốc có gameplay thu thập theo vùng ở giai đoạn mở rộng. MVP dùng giun, dế và tôm từ NPC để tiết kiệm asset. Mồi tiêu hao khi rơi, bị ăn/mất, đổi phần hoặc kết thúc sử dụng; ném rồi thu còn nguyên không trừ thêm một phần. Mồi sống được trình bày nhẹ, không làm mô phỏng đau đớn.

Pha mồi có dry ingredients theo tỷ lệ khối lượng khô, còn nước theo gam/100g mồi khô. Đây là hai hệ đo riêng; không đưa “5% nước” vào cùng bảng tổng khô rồi giả định 100%. Người chơi nhìn độ kết dính, độ tan và tốc độ tạo cloud trong ống nước thử.

| Công thức nội bộ để thử | Thành phần khô / 100g | Nước thử | Mục đích trong game |
| --- | --- | --- | --- |
| Hồ lặng | Cám 45g, ngô 25g, khoai 20g, bột cá 10g | 25-40g rồi chỉnh | Kiểm tra cloud và khả năng bám lưỡi |
| Dòng chậm | Cám 40g, ngô 25g, khoai 20g, chất kết dính 15g | 20-35g rồi chỉnh | So sánh thời gian tan và đến đáy |
| Mồi mây | Nền 55g, hạt mịn 30g, phụ gia game 15g | Theo thẻ bài thử | Bài filter-feeding sau khi được cố vấn duyệt |

Các recipe này là ví dụ game, chưa phải hướng dẫn pha mồi ngoài đời. Tuning gồm particle_size, cohesion, dissolution_rate, scent_category, buoyancy và water_added. Bài tập chính: cùng mồi, đổi độ dính và dòng để quan sát mồi tan trước/sau khi tới tầng mục tiêu. Không khuyến khích phụ gia lạ hoặc biến mùi thành phần trăm chắc có cá.

## 16. Thiết bị, sức mạnh và bảo trì

Catalog v0.1 có 30 cần, 15 máy, 30 mồi/phụ kiện. Tên đều giả tưởng; giá dùng xu. Cần dài có lợi cho tiếp cận nhưng nặng và khó ở bờ hẹp; cần nhẹ thuận cá nhỏ nhưng giới hạn tải; gear ratio ảnh hưởng tốc độ theo cuộn dây, không trực tiếp biến thành tỷ lệ bắt cá. Đồ đắt phục vụ trọng lượng/độ hoàn thiện/cosmetic và mục đích chuyên biệt.

Cần tre vô hạn về quyền sở hữu. Gãy cần → nhận nhiệm vụ “Làm lại cần” 60 giây chơi với lựa chọn hỗ trợ; luôn có đường quay lại ao miễn phí và giun miễn phí. Dây/lưỡi rẻ có bộ cứu trợ nhập môn miễn phí trong giới hạn dùng cá nhỏ. Người chơi hết xu không bị buộc chờ 5 phút thật hoặc xem quảng cáo để tiếp tục.

Độ bền: abrasion thuộc dây theo vật cản; wear thuộc máy/cần theo sử dụng; chi phí bảo trì hiển thị trước chuyến. Không random hỏng đồ để ép mua. Khi có hư hại, solver ghi nguyên nhân và mức độ. Cần mạ vàng có tải tương đương cần nền và mô tả vui “độ sĩ”; chỉ số vui không tham gia Fish AI.

### 30 cần

| ID | Vật phẩm | Thông số game | Giá / scope |
| --- | --- | --- | --- |
| rod_01 | Cần tre ao | 3.0m; bamboo; progressive; cần tay | 0 xu / MVP |
| rod_02 | Cần sợi thủy tinh 3.6 | 3.6m; light; progressive; cần tay | 45.000 xu / MVP |
| rod_03 | Cần Đài nhập môn 3.6 | 3.6m; light; medium; cần tay | 90.000 xu / MVP |
| rod_04 | Cần Đài nhập môn 4.5 | 4.5m; medium; medium; cần tay | 140.000 xu / MVP |
| rod_05 | Cần Đài nhập môn 5.4 | 5.4m; medium; medium; cần tay | 220.000 xu / MVP |
| rod_06 | Cần Đài cân bằng 3.6 | 3.6m; medium; fast; cần tay | 260.000 xu / MVP |
| rod_07 | Cần Đài cân bằng 4.5 | 4.5m; medium; fast; cần tay | 380.000 xu / MVP |
| rod_08 | Cần Đài cân bằng 5.4 | 5.4m; medium; fast; cần tay | 520.000 xu / MVP |
| rod_09 | Cần Đài hồ sâu 6.3 | 6.3m; heavy; medium; cần tay | 680.000 xu / MVP |
| rod_10 | Cần Đài hồ sâu 7.2 | 7.2m; heavy; medium; cần tay | 850.000 xu / MVP |
| rod_11 | Cần Đài tốc độ 3.6 | 3.6m; light; fast; cần tay | 1.200.000 xu / MVP |
| rod_12 | Cần Đài chép 4.5 | 4.5m; heavy; fast; cần tay | 1.600.000 xu / MVP |
| rod_13 | Cần Đài chép 5.4 | 5.4m; heavy; fast; cần tay | 2.200.000 xu / MVP |
| rod_14 | Cần Đài đại gia 6.3 | 6.3m; heavy; medium; cần tay | 8.000.000 xu / MVP |
| rod_15 | Cần Đài mạ vàng | 4.5m; heavy; medium; cần tay | 120.000.000 xu / MVP |
| rod_16 | Lure suối UL 1.8 | 1.8m; UL; fast; 1-5g | 180.000 xu / MVP |
| rod_17 | Lure nhẹ L 2.1 | 2.1m; L; fast; 2-8g | 260.000 xu / MVP |
| rod_18 | Lure ao ML 2.1 | 2.1m; ML; fast; 5-15g | 340.000 xu / MVP |
| rod_19 | Lure ao ML 2.4 | 2.4m; ML; fast; 5-15g | 450.000 xu / MVP |
| rod_20 | Lure hồ M 2.4 | 2.4m; M; fast; 7-21g | 650.000 xu / MVP |
| rod_21 | Lure lóc MH 2.1 | 2.1m; MH; fast; 10-30g | 780.000 xu / MVP |
| rod_22 | Lure lóc MH 2.4 | 2.4m; MH; fast; 10-30g | 1.100.000 xu / MVP |
| rod_23 | Lure H 2.4 | 2.4m; H; fast; 15-40g | 1.600.000 xu / MVP |
| rod_24 | Lure thi đấu ML 2.4 | 2.4m; ML; fast; 5-15g | 2.600.000 xu / MVP |
| rod_25 | Lure đại gia M 2.7 | 2.7m; M; fast; 7-21g | 15.000.000 xu / MVP |
| rod_26 | Lure casting MH 2.1 | 2.1m; MH; fast; 10-30g | 1.800.000 xu / MVP |
| rod_27 | Lure casting H 2.4 | 2.4m; H; fast; 15-40g | 3.200.000 xu / MVP |
| rod_28 | Lăng xê M 2.7 | 2.7m; M; medium; 30-80g | 650.000 xu / EXPANSION |
| rod_29 | Lục hồ 4.2 | 4.2m; heavy; medium; 50-120g | 1.800.000 xu / EXPANSION |
| rod_30 | ISO số 1.5 - 5.3 | 5.3m; 1.5; progressive; 2-15g | 2.800.000 xu / EXPANSION |

### 15 máy

| ID | Vật phẩm | Thông số game | Giá / scope |
| --- | --- | --- | --- |
| reel_01 | Máy đứng 1000 - 01 | spinning; nhãn 1000; 5.2:1; drag mẫu 2.8kgf | 87.000 xu / MVP |
| reel_02 | Máy đứng 1000 - 02 | spinning; nhãn 1000; 5.2:1; drag mẫu 2.8kgf | 123.000 xu / MVP |
| reel_03 | Máy đứng 2000 - 03 | spinning; nhãn 2000; 5.2:1; drag mẫu 3.7kgf | 183.000 xu / MVP |
| reel_04 | Máy đứng 2000 - 04 | spinning; nhãn 2000; 5.2:1; drag mẫu 3.7kgf | 267.000 xu / MVP |
| reel_05 | Máy đứng 2500 - 05 | spinning; nhãn 2500; 5.2:1; drag mẫu 4.1kgf | 375.000 xu / MVP |
| reel_06 | Máy đứng 2500 - 06 | spinning; nhãn 2500; 5.2:1; drag mẫu 4.1kgf | 507.000 xu / MVP |
| reel_07 | Máy đứng 3000 - 07 | spinning; nhãn 3000; 5.2:1; drag mẫu 4.5kgf | 663.000 xu / MVP |
| reel_08 | Máy đứng 3000 - 08 | spinning; nhãn 3000; 5.2:1; drag mẫu 4.5kgf | 843.000 xu / MVP |
| reel_09 | Máy đứng 4000 - 09 | spinning; nhãn 4000; 5.2:1; drag mẫu 5.3kgf | 1.047.000 xu / MVP |
| reel_10 | Máy đứng 4000 - 10 | spinning; nhãn 4000; 5.2:1; drag mẫu 5.3kgf | 1.275.000 xu / MVP |
| reel_11 | Máy đứng 5000 - 11 | spinning; nhãn 5000; 5.2:1; drag mẫu 6.2kgf | 1.527.000 xu / MVP |
| reel_12 | Máy đứng 5000 - 12 | spinning; nhãn 5000; 5.2:1; drag mẫu 6.2kgf | 1.803.000 xu / MVP |
| reel_13 | Máy đứng 6000 - 13 | spinning; nhãn 6000; 5.2:1; drag mẫu 7.0kgf | 2.103.000 xu / MVP |
| reel_14 | Máy ngang 2500 - 14 | baitcasting; nhãn 2500; 6.3:1; drag mẫu 4.1kgf | 2.427.000 xu / EXPANSION |
| reel_15 | Máy ngang 4000 - 15 | baitcasting; nhãn 4000; 6.3:1; drag mẫu 5.3kgf | 2.775.000 xu / EXPANSION |

### 30 mồi và phụ kiện

| ID | Vật phẩm | Thông số game | Giá / scope |
| --- | --- | --- | --- |
| other_01 | Giun đất | portions=6 | 0 xu / MVP |
| other_02 | Dế | portions=8 | 8.000 xu / MVP |
| other_03 | Tôm nhỏ | portions=10 | 15.000 xu / MVP |
| other_04 | Cá mồi | portions=8 | 18.000 xu / MVP |
| other_05 | Ngô luộc | portions=20 | 6.000 xu / MVP |
| other_06 | Rau lá | portions=12 | 2.000 xu / MVP |
| other_07 | Cám nền | portions=20 | 12.000 xu / MVP |
| other_08 | Mồi bột chép | portions=20 | 24.000 xu / MVP |
| other_09 | Mồi mây mè | portions=20 | 28.000 xu / MVP |
| other_10 | Nhái nổi 7g | weight_g=7; buoyancy=float; retrieve=walk | 35.000 xu / MVP |
| other_11 | Nhái chìm 12g | weight_g=12; buoyancy=sink; retrieve=stopgo | 45.000 xu / MVP |
| other_12 | Mồi mềm 5g | weight_g=5; buoyancy=sink; retrieve=hop | 22.000 xu / MVP |
| other_13 | Minnow 9g | weight_g=9; buoyancy=suspend; retrieve=twitch | 48.000 xu / MVP |
| other_14 | Spinner 6g | weight_g=6; buoyancy=sink; retrieve=steady | 30.000 xu / MVP |
| other_15 | Spoon 14g | weight_g=14; buoyancy=sink; retrieve=steady | 35.000 xu / MVP |
| other_16 | Dây mono 0.16 | diameter_mm=0.16; nominal_break_kgf=1.4; material=mono | 12.000 xu / MVP |
| other_17 | Dây mono 0.22 | diameter_mm=0.22; nominal_break_kgf=2.8; material=mono | 18.000 xu / MVP |
| other_18 | Dây mono 0.28 | diameter_mm=0.28; nominal_break_kgf=4.0; material=mono | 25.000 xu / MVP |
| other_19 | Dây braid PE mẫu | pe_label=1.0; nominal_break_kgf=5.0; material=braid | 60.000 xu / MVP |
| other_20 | Leader mẫu 0.30 | diameter_mm=0.3; nominal_break_kgf=4.5; material=leader | 28.000 xu / MVP |
| other_21 | Lưỡi nhỏ | size_profile=small; sim_break_kgf=2.0 | 3.000 xu / MVP |
| other_22 | Lưỡi vừa | size_profile=medium; sim_break_kgf=4.0 | 5.000 xu / MVP |
| other_23 | Lưỡi lớn | size_profile=large; sim_break_kgf=6.0 | 8.000 xu / MVP |
| other_24 | Phao thon 1.2g | capacity_g=1.2; tip_marks=8; tip_equivalent_g_per_mark=0.04 | 18.000 xu / MVP |
| other_25 | Phao hồ 2.0g | capacity_g=2; tip_marks=10; tip_equivalent_g_per_mark=0.06 | 28.000 xu / MVP |
| other_26 | Phao ISO | capacity_g=3; tip_marks=5; tip_equivalent_g_per_mark=0.08 | 40.000 xu / EXPANSION |
| other_27 | Chì lá | pack_mass_g=10; cut_step_g=0.02 | 6.000 xu / MVP |
| other_28 | Chì đáy | mass_g=50 | 14.000 xu / EXPANSION |
| other_29 | Lò xo mồi | empty_mass_g=12 | 16.000 xu / EXPANSION |
| other_30 | Vợt cá | landing_radius_m=0.8 | 30.000 xu / MVP |

CSV/JSON đi kèm có thông số chi tiết, ID và tag. Các giá trị nominal_break, sim_working_load và max_drag không được dùng như thông số xác nhận của sản phẩm thật. Bản MVP mở catalog theo chứng chỉ; biến thể bottom/lục/ISO/máy ngang trong dữ liệu chỉ hiện ở bộ nội dung mở rộng.

## 17. Kinh tế, nhiệm vụ và tránh bế tắc

Xu là tiền game, danh vọng là ghi nhận thành tích; không quy đổi sang tiền thật. Bốn nguồn xu: bán cá, nhiệm vụ, đơn hàng và giải đấu. MVP có bán cá và đơn hàng/NPC; giải đấu đơn người chơi được thêm khi loop cơ bản ổn định. Danh vọng mở bài/ngoại hình/sự kiện, không tăng điểm hấp dẫn mồi.

| Dòng kinh tế | Giá trị khởi đầu | Ý nghĩa |
| --- | --- | --- |
| Khởi tạo | 0 xu + cần tre + bộ câu nhập môn | Kiếm tiền bằng kỹ năng từ đầu |
| Cá 0.30kg ở giá 26000 xu/kg | 7800 xu | Phép tính mẫu; không phải giá thị trường |
| Ao Làng / kênh / hồ | 0 / 3000 / 6000 xu một chuyến | Cho quyết định ngân sách; thua vẫn quay về ao |
| Cần Đài nhập môn 3.6m | 90000 xu | Mục tiêu đầu sau vài chuyến, kiểm tra bằng playtest |
| Giun tự đào / gói cám | 0 / 12000 xu | Đổi công sức và phương pháp |
| Bảo trì | Theo hư hại được ghi; chốt trước sửa | Không trừ âm ví; có lựa chọn đồ mặc định |

Chuyến mẫu: bán cá 26000 xu; tiêu hao 3000; phí kênh 3000 → lãi 20000 xu. 5 chuyến tương đương có thể mua cần Đài mẫu; đây là mục tiêu cân bằng, còn tốc độ bắt phải được thử. Bán cá tính weight_kg*price_xu_per_kg rồi làm tròn xu một lần; đơn hàng cộng thưởng một lần khi giao, không vừa bán cùng cá ở chợ vừa giao cùng ID.

Giới hạn túi cá theo khối lượng và rule map. Cá quá nhỏ/ứng viên cần bảo vệ được thả theo luật map giả tưởng đã duyệt, không bán farm. Giá theo loài và hợp đồng, không tăng vô hạn với level. Mồi/đồ chưa mở bằng chứng chỉ không được mua nhầm; UI ghi bài cần hoàn và cho bấm đến bài đó.

Nhiệm vụ mẫu: bác Hùng yêu cầu đo 3 điểm đáy (3000 xu + bài L05); quán ăn cần 3 cá rô có kích cỡ game trong thẻ đơn (12000 xu bonus); chú Sáu cần ảnh sổ cá của một chép được thả (danh vọng); nhiệm vụ về nhà trước giờ cho thưởng hoàn cam kết, không trả thêm vì nói dối.

## 18. Cá trophy, huyền thoại và tính bền vững của thế giới

Trophy có ID cá riêng, cân nặng, dấu nhận diện và lịch sử. Thả cá giữ ID và vị trí gần vùng phù hợp, thêm thời gian hồi phục. Cá đã thả không lập tức ăn lại; trừ thời gian hiện tại, không dùng ngày hệ thống người dùng để farm. Bán hoặc giao cá đổi trạng thái removed trong cùng transaction.

MVP có một “Chép Bãi Tre” đơn người chơi dùng chung logic cá thường với ngưỡng cảnh giác/tải cao hơn và cue được authored. NPC chỉ biết tin đồn hợp lý; không gửi vị trí chính xác. Không gọi đó là cá 14 năm tuổi nếu hệ tăng trưởng chưa có dữ liệu và timeline tương ứng.

Tăng trưởng khi thả là tùy chọn ở mở rộng. Cân nặng thay theo một mô hình chậm cần review, không mặc định 13.2 → 14.1kg sau ba tháng. Người chơi đơn người chơi khác không gặp cùng fish_id qua mạng khi chưa có server. Cá huyền thoại chung cần máy chủ quản lý ID/capture lease, chống duplication và lịch sử toàn hồ.

## 19. Làng, NPC và “Trốn vợ đi câu”

Làng có nhà, điểm ao, shop, bàn chuẩn bị, quán nước và bến. Đây là hub có tương tác ngắn và nút đi nhanh đã mở; không ép đi bộ lòng vòng mỗi lần đổi mồi. NPC nói theo kinh nghiệm và đúng lỗi đang xảy ra: “Phao chìm từ lúc thả rồi, coi lại chì đã” hoặc “Dây đang chùng, thu đều tay”. Một câu gợi ý, sau đó có thể xem hình.

| NPC | Vai trò | Nội dung MVP |
| --- | --- | --- |
| Bác Hùng | Nhập môn / Đài | 9 bài cơ bản, nhận xét bộ câu |
| Anh Cường | Lure | Ném, retrieve, giữ tải với máy |
| Cô Lan quán ăn | Đơn hàng | 3 đơn theo loài đã có trong map |
| Chú Sáu | Chuyện cá / lục sau này | Tin đồn trophy; bài lục khóa chờ mở rộng |
| Bác Hải | ISO sau này | Xuất hiện khi có map biển |

Mode “Trốn vợ đi câu” là lựa chọn hài đời thường, có thể đổi thành “Về trước giờ hẹn” và chọn vai trò người trong nhà. Cam kết, thời gian và đối thoại là cơ chế; người vợ không phải boss combat. Thanh “Độ căng trong nhà” chỉ ở mode này, có giải thích sự kiện làm thay đổi và cách giải quyết bằng giữ hẹn/trao đổi.

Phiên mẫu: 07:00 nhận hẹn về 16:30; game cho thấy giờ lên đường, dự kiến thu đồ và đi về. Lúc 15:40 cá hoạt động, UI ghi “Cần bắt đầu thu đồ lúc 16:05 để về kịp”. Người chơi chọn thêm lượt hay về. Trễ thì có hội thoại và nhiệm vụ sửa cam kết; không mất đồ câu vĩnh viễn. Các lựa chọn vui không được thưởng vì lừa người thân. Mua đồ game lớn làm thay đổi kế hoạch chi tiêu trong nhiệm vụ, không khẳng định gắn số tiền thật với “aggro”.

MVP chỉ có một nhiệm vụ hẹn giờ và 4 kết thúc lời thoại. Hệ xã hội, quán nước multiplayer và tương tác cả gia đình là mở rộng. Cho tắt hội thoại/mode hài độc lập với mức khó của mô phỏng.

## 20. Giải đấu, multiplayer và sản phẩm thật

Giải đơn người chơi trước: câu Đài 15 phút thật tại các ô tương đương; lure 5 cá dài nhất theo quy tắc map; thử thách tìm 4 loài; big fish một phiên. Thả cá vẫn ghi kết quả sau đo. Mẫu seed thời tiết/nhóm cá dùng được cho so sánh; điểm không được chấm bằng đồ đắt hay amount xu đã tiêu.

Multiplayer 2-8 người là một dự án server tiếp nối. Server nắm fish state, quyền xử lý catch và ví/transaction. Client dự đoán đường dây và mồi; server đối chiếu input để xác nhận bắt. Reconnect có grace window và trạng thái cá rõ; không nhân đôi phần thưởng. Chat cần chọn câu sẵn hoặc moderation phù hợp trước mở chat tự do.

Shop thật/affiliate ở màn thông tin vật phẩm ngoài trận câu. Item game và ProductReference là hai entity: item_id → một hoặc nhiều sản phẩm tương đương do người quản trị duyệt. Thẻ sản phẩm có shop, đường dẫn, ngày kiểm tra, giá tham khảo khi có dữ liệu, và nhãn “Liên kết tiếp thị” rõ. Không lấy giá xu làm giá VND, không đưa link mẫu chưa có vào nút có vẻ dùng được.

CMS quản lý active, region, affiliate disclosure, URL và ngày cập nhật. Link chưa được duyệt không được mở; lỗi link giữ người chơi ở màn đồ. Tài trợ chỉ ảnh hưởng vị trí/nhãn nội dung thương mại minh bạch hoặc cosmetic, không sửa sức mạnh cơ học. Tính năng “thử trước khi mua” chỉ minh họa một profile đã hiệu chuẩn; không bảo đảm cảm giác/hiệu suất đúng sản phẩm thật.

## 21. Định hướng mỹ thuật và âm thanh

Ý tưởng thị giác: một sổ tay cần thủ đặt bên bờ ao. Cảnh quan vẽ tay có không khí, UI giữ nét gọn và vật liệu giấy nhẹ để đọc tốt. Xanh ao là màu cấu trúc, giấy kem là mặt đọc, cam đất dành cho hành động chính. Đừng để chất giấy, bóng đổ hay họa tiết chiếm nhiệm vụ quan sát phao.

Hình nền Ao Làng đi kèm là concept art cho bối cảnh, không phải layer/sprite sản xuất. Chữ/UI được typeset bằng mã riêng, không nằm trong hình tạo bằng AI. Bờ tre, chuối, cầu tre, mái ngói, ghế nhựa và xô câu có tỷ lệ hợp lý. Hình cá trong prototype là minh họa vector biểu tượng; roster phát hành cần tranh hình thái riêng đã duyệt.

| Họ asset | Định lượng MVP để lập kế hoạch | Quy tắc |
| --- | --- | --- |
| Map | 3 background, mỗi map 5-8 lớp + collision/đáy riêng | Layer nước/cover/foreground tách; không lộ lỗ khi parallax |
| Cá | 12 loài, 4 trạng thái cơ bản + silhouette | Hình đầu, vây, thân phân biệt; không đổi màu một cá cho mọi loài |
| Cần/máy | 8 họ hình cần, 4 họ máy, vật liệu biến thể | 75 record không đòi 75 hình hoàn toàn riêng |
| Rig/lure | 30 phần mẫu; đường dây và phao procedural | Ngọn phao/vạch sắc, dấu trạng thái đọc được |
| Nhân vật | 2 cần thủ dạy + 3 NPC hub | Thư thái, khẩu hình/động tác nhẹ, không phô diễn cinematic |
| UI | Một họ icon SVG nét 1.7px | Vector cho ngữ nghĩa; icon không thay chữ ở hành động học |

Âm thanh phân lớp: ambient ao (chim/côn trùng/gió), nước theo tương tác, máy drag theo tải, dây/đồ theo thao tác, feedback UI nhẹ. Nhạc tùy chọn thưa và không che tín hiệu. Người chơi tắt nhạc vẫn nghe tín hiệu; người khó nghe có nhãn/visual thay thế. Không dùng tiếng “ting” chung cho cá cắn thật và rung giả nếu điều đó làm lộ đáp án trong mode mô phỏng.

## 22. Design system từ UIUX Pro Max và MengTo

UIUX Pro Max được dùng cho hệ phân cấp, tương tác, touch target, focus, trợ năng, responsive và kiểm tra. Truy vấn thiết kế đầu tiên trả phong cách ứng dụng trẻ em; truy vấn lại có kết quả tối giản/nature. Quyết định cuối là art direction riêng của game người lớn, không bê mẫu landing page hay palette neon gaming vào màn câu. MengTo design-first-ui-prompting cung cấp cách khóa mục tiêu, bố cục, chữ, màu, copy và constraints trước khi làm từng màn; no-ai-design-slop là bộ kiểm tra tính nhất quán và lỗi giao diện.

| Vai trò | Token | Cách dùng |
| --- | --- | --- |
| Giấy nền | #F4F0E6 | Nền hub, lớp đọc |
| Bề mặt | #FFFCF5 | Panel có nội dung |
| Mực | #183D37 | Heading, active, cấu trúc |
| Body | #223E38 | Chữ nội dung |
| Chữ phụ | #5C6E63 | Gợi ý và nhãn |
| Xanh ao | #2D6458 | Feedback/đường dây |
| Hành động | #B44727 | CTA với chữ trắng |
| Lỗi | #9D2929 | Lỗi + chữ giải thích |

Font bản mẫu: Georgia cho heading lớn và DejaVu Sans được nhúng cho phần UI/tài liệu; fallback có đủ dấu tiếng Việt. Font production đề xuất Be Vietnam Pro + một serif có Vietnamese subset sau khi kiểm tra giấy phép và rendering. Tránh viết hoa đoạn dài; số và giá dùng tabular figures. Body 16px tương đương UI desktop cơ sở, caption 13px; bản handheld có scale chữ độc lập.

Spacing theo 4/8px, khoảng nhóm 24/32px. Control radius 8px, panel 12px; panel chỉ dùng khi có layer/nhóm việc rõ. Icon có cùng stroke và nhãn nghĩa. Nút chính cam đất, nền chữ trắng đạt contrast; selected có chữ/dấu, không dùng màu làm thông tin duy nhất.

Motion: nhấn phản hồi khoảng 100ms; panel 180ms; chuyển màn 240ms; input đáp ứng trước khi hiệu ứng xong. Bề mặt phao/dây mô phỏng theo frame không áp dụng easing UI. Reduced motion tắt parallax/rung camera, giữ trạng thái phao cần để chơi; có chế độ tín hiệu tĩnh theo lượt trong lớp học.

## 23. Kiến trúc thông tin và đặc tả màn hình

Điều hướng ngoài chuyến: Bến câu / Học viện / Bàn đồ / Sổ cá / Cửa hàng. “Đi câu” mở màn gameplay từ map được chọn. Trong chuyến chỉ có tạm dừng, bộ câu đang dùng, mục tiêu và điều khiển cần; nav hub không đè lên mặt nước. 7 màn prototype là một mẫu nghiên cứu tương tác của luồng này.

| Màn / ID | Bố cục và điểm tập trung | Hành động chính / chuyển tiếp |
| --- | --- | --- |
| Bến câu S01 | Cảnh Ao Làng lớn; panel chuyến ở phải; selector 3 map dưới | “Đi câu” → S05; “Chuẩn bị bộ câu” → S03 |
| Học viện S02 | Lộ trình ba trường phái; danh sách bài + mục tiêu | Chọn bài → sheet; “Thực hành cân phao” → S04 |
| Bàn đồ S03 | Danh mục bên trái, sơ đồ rig giữa, thông số/lỗi bên phải | “Kiểm tra bộ câu”, “Cân phao” → S04 |
| Cân phao S04 | Ống thử lớn, mồi/lưỡi nhìn được; controls ở phải | Thêm/bớt chì, đặt mồi/sâu; “Ra điểm câu” → S05 |
| Điểm câu S05 | Cảnh ít HUD, phao giữa; điều khiển thấp; gợi ý bên phải | Thả → quan sát → đóng cá → xử lý catch |
| Sổ cá S06 | Danh sách có search/filter; tranh và kiến thức theo nguồn | Chọn loài; xem nhật ký và điều kiện chưa khám phá |
| Cửa hàng S07 | List đồ có loại, thông số so sánh, giá xu | Xem đồ; “Thử bộ mẫu” → S03; mua sau xác nhận |

S03: sơ đồ có hit area rộng cho linh kiện nhỏ. Chọn dây/phao/mồi hiện thông số tại chỗ, không bật modal chồng modal. Bộ lỗi hiển thị checklist có lý do, bấm lỗi focus control cần sửa. Nếu tương thích, nút tiếp tục ghi “Bộ câu đã kiểm tra”; không che độ sâu hay trạng thái phao vì còn cần thực nghiệm.

S04: phao và mặt nước là tiêu điểm; số mục là kết quả, không là mục tiêu mù. Buttons +/- thay kéo slider được; mỗi bước có đơn vị. Khi chì dư, số mục 0 kèm “Phao chìm”, SVG phải chìm tương ứng. Khi thay mồi, ghi đây là tải hiệu dụng trong bài mẫu. Trạng thái chạm đáy có mô tả cùng hình.

S05: tối thiểu 65% vùng trung tâm không có panel. Phao được phóng trong một kính quan sát tự chọn ở góc; kính chỉ phóng hình hiện có, không hiện cá. Thanh tải là trợ giúp, có thể ẩn; tín hiệu vẫn thể hiện bằng cần cong/dây/âm thanh. Giữ nút thu và bấm bật/tắt là hai lựa chọn. Pause, thu bộ câu và về bến luôn tìm được.

Catch sheet: tên loài, số đo game, tình trạng ghi sổ, giá xu và danh vọng. “Thả cá” và “Giữ cá” có nhãn rõ; giữ/giao/bán là các bước khác nhau. UI không tự bán khi bấm đóng sheet. Trong prototype đơn giản, nút bán giải quyết giao dịch ngay với nhãn rõ đây là mẫu, không có inventory/server thật.

## 24. UX mobile, bàn phím và các trạng thái cần có

Gameplay mobile ưu tiên ngang; menu/sổ học dùng dọc được. Nếu mở điểm câu trong dọc, bản production hiển thị khung dọc đơn giản và đề nghị ngang có thể bỏ, không khóa toàn bộ app. Prototype web responsive dọc xếp scene/controls theo cột để đọc; không đại diện đầy đủ thao tác ngón tay của build native.

UI cơ sở: tap target ít nhất 48 CSS px trong prototype; build native theo 44pt iOS/48dp Android, không dùng cùng đơn vị. Khoảng control tối thiểu 8; safe area từ hệ điều hành; không đặt nút giật sát gesture bar. Chọn tay thuận đổi vị trí nhóm điều khiển. Zoom browser/chữ 200% phải reflow menu/bảng, không cắt nhãn.

| Trạng thái | Cách xử lý |
| --- | --- |
| Chưa có cá ghi sổ | Hiện loài bài nhập môn, nút tới bài học; không invent lịch sử |
| Không đủ xu | Giữ lựa chọn, hiện số thiếu và đường về ao/giun miễn phí |
| Bộ câu sai | Báo ngay cạnh control, giải thích và gợi ý linh kiện phù hợp |
| Tải map | Giữ hình/map chọn, progress khi biết; có hủy; không mất save |
| Mất focus / app background | Pause singleplayer; khôi phục vào sheet tiếp tục |
| Save lỗi | Giữ game hiện tại trong RAM; báo chưa lưu và cho retry/export |
| Modal/sheet | Focus vào tiêu đề/nút hợp lý; Escape/đóng; trả focus về trigger |
| Danh mục chưa mở | Nhãn “Cần chứng chỉ”; bấm tới bài; không giả nút mua hoạt động |
| Link sản phẩm thật chưa có | Ẩn nút mở ngoài, ghi “Chưa có liên kết được duyệt” |

Chức năng trợ năng: phóng phao; chữ lớn; màu tín hiệu thay thế kèm shape/chữ; âm lượng từng lớp; phụ đề NPC; hold/toggle; mở rộng cửa sổ thao tác; remap; phương án nút cho kéo thả; bài tín hiệu theo lượt. Screen reader hỗ trợ các màn học/dữ liệu và mô tả tình huống; gameplay thời gian thực cần lộ trình thử riêng, không tự tuyên bố tương đương hoàn toàn.

## 25. Kiến trúc kỹ thuật và công nghệ đề xuất

Chưa có repo/stack của game được người dùng chỉ định. Đề xuất production: Godot 4.x cho desktop/native mobile sau spike xác minh export và hiệu năng; version cụ thể được pin tại kickoff. Tài liệu Godot chính thức có renderer và physics 2D, canvas, mesh, particles, animation. Lựa chọn engine là đề xuất thiết kế, không phải quyết định đã được đội phát triển triển khai.

Prototype UI đi kèm là HTML/CSS/JS tự chứa để đánh giá bố cục. Không dùng nó để chứng minh khả năng solver hay export Steam. Nếu ưu tiên browser, làm spike riêng Canvas/Pixi hoặc Phaser với cùng content pack; sau đo input/memory mới chọn. Không vừa giữ hai engine production từ MVP.

| Module | Đầu vào / đầu ra | Owner logic |
| --- | --- | --- |
| InputActionRouter | Input remapped → intent (cast/reel/strike) | Không sửa ví/cá trực tiếp |
| RigValidator | Item instances + recipe → errors + rig profile | Một nguồn tính tương thích |
| WaterWorld | Map, clock, weather → current/depth/collision | Authoritative offline world |
| RigSolver | Intent + water → line/float/lure/tension | Fixed tick 60Hz |
| FishPopulation / FishAI | Species + existing fish + lure → states/events | Spatial query; không hook-time spawn |
| SessionDirector | Mode/scenario → objectives/assist | Điều phối lớp học, không override vật lý ngoài scenario |
| CatchTransaction | Landed fish + lựa chọn → world/inventory/wallet | Atomic và idempotent |
| Progression | Lesson evidence → certificates/unlocks | Không thay bite probability |
| SaveService | Versioned snapshots/events → file | Atomic write, backup, migration |
| Presentation / Audio | World snapshots → hình/âm/tín hiệu | Read-only với world state |

World dùng đơn vị SI; item display giữ nhãn marketing riêng với nguồn. Physics 60Hz, render mục tiêu 60fps desktop/30fps thiết bị yếu; không lấy frame rate làm tốc độ AI. Benchmark phải ghi thiết bị, độ phân giải, số cá và cấu hình trợ giúp. Mục tiêu khởi đầu: tick physics+AI dưới 4ms trên máy test desktop được chọn; bộ nhớ mobile dưới 250MB; tải map offline dưới 3 giây sau warm-up. Các con số này là budget để kiểm tra, chưa có kết quả đo.

## 26. Mô hình dữ liệu, database và save

Static content được quản lý trong CSV/JSON có schema và version. Runtime nạp thành resource typed; database SQLite hoặc file JSON có atomic replace phục vụ offline. SQLite schema kèm theo là hợp đồng tham khảo, không bắt buộc engine phải dùng SQL cho physics. Tránh gắn logic suy ra loài vào chuỗi name_vi.

| Entity | Khóa / liên kết | Vai trò và bất biến |
| --- | --- | --- |
| Species | species_id | Taxon candidate, alias, review status; không chứa world instance |
| Map / Spot / Population | map_id, spot_id, map-species | Ecology và world bounds; chỉ cá được duyệt vào content phát hành |
| ItemDefinition / ItemInstance | item_id, instance_id | Thông số mẫu tách quantity/durability sở hữu |
| RigPreset / RigComponent | rig_id + slot | Lưu references, knot recipe và config; validator dùng cùng content |
| WorldFish | fish_id → species_id/map_id | Cá tồn tại từ trước, released giữ ID, removed không bắt lại |
| CatchEvent | event_id + fish_id + session_id | Chỉ từ Landed; chứa số đo/lựa chọn/transaction_id |
| Transaction / TransactionLine | transaction_id + unique request_id | Cộng/trừ xu đúng một lần; xử lý duplicate input |
| Lesson / Evidence / Certificate | lesson_id/profile_id | Pass rule theo input và world evidence |
| FishDiscovery | profile_id/species_id/key | Nguồn quan sát khác kiến thức đã duyệt |
| ProductReference | product_id → item_id | URL/giá thật riêng; không có giá thật thì null |

schema_version quản lý cấu trúc save, content_version quản lý catalog. Lưu RNG state, game_clock và cá/trophy đã biến đổi; background static không lưu vào từng save. Migrate version cũ bằng mapping ID và defaults có log. Item bỏ khỏi catalog được deprecated/mapped, không xóa tài sản người chơi. Ghi save.tmp → fsync → atomic rename; giữ save.backup trước snapshot mới.

Catch lifecycle: landed → pending_decision → kept/released/sold/delivered. Mỗi quyết định có request_id. Atomic commit cập nhật fish status, túi cá, ví và event cùng nhau. Retry cùng request_id trả kết quả cũ; không bán/thả hai lần. Trong offline, transaction chỉ là độ nhất quán dữ liệu, chưa là cơ chế chống cheat; server sau này xử lý authoritative.

Ví dụ save có cấu trúc trong data/save_example.json. DDL trong data/database_schema.sql có foreign key và unique request_id. fish_catalog/items/maps/lessons CSV nhập Excel được với UTF-8 BOM; JSON dùng cùng ID. Nội dung nghiên cứu sinh học còn pending nằm trong catalog nội bộ, build release phải có content gate riêng.

## 27. Nghiệm thu, thử người chơi và telemetry

| Mã | Tình huống kiểm tra | Tiêu chí chấp nhận |
| --- | --- | --- |
| SIM01 | Ghi ID cá lúc load, ném và đóng cá | Catch fish_id thuộc population đã có; không có spawn do hookset |
| RIG01 | Lắp sai máy/cần và mồi quá nặng | Validator báo đúng slot và không cho cast nguy cơ trong lớp học |
| FLOAT01 | Tăng tải chì 0.02g khi lửng | Mục lộ giảm theo calibration; không tăng ngược |
| FLOAT02 | Giữ tải, tăng sâu đến tỳ đáy | Tải được đáy đỡ thay đổi phao; mặt cắt và kết quả nhất quán |
| SIGNAL01 | Rung gió, thử mồi, giữ mồi | Đáp án bài dựa ground-truth; replay đúng nguyên nhân |
| FIGHT01 | Tăng drag vượt dây, giảm drag, tạo slack | Các hậu quả theo solver; cần tay không có drag máy |
| SAVE01 | Bán cùng request_id hai lần | Xu chỉ cộng một lần; cá không thể thả/bán tiếp |
| SAVE02 | Thả, save, load | Cùng fish_id/capture history; không nhân đôi quần thể |
| ECON01 | Ví 0 xu, hết mồi, gãy cần | Về Ao Làng và phục hồi bộ mặc định; chơi tiếp được |
| UX01 | 375px dọc, 844x390 ngang, 1440x900 | Không tràn ngang; thao tác chính đến được, nhãn không bị cắt |
| UX02 | Chỉ bàn phím; chữ lớn; reduced motion | Focus nhìn được, Escape sheet, nút thay kéo, nội dung đọc được |
| EDU01 | Mới chơi, tắt camera sau luyện | Kiểm tra phân biệt tín hiệu và lời giải; không tuyên bố chuyển giao chưa đo |
| CONTENT01 | Catalog release | Taxon/alias/map/kỹ thuật/sprite có approval; loại record pending |

Telemetry local có thể bật/tắt: tutorial_step_enter/complete, rig_error, cast, fish_notice, strike, failure_reason, catch_decision, purchase, quit. Không lưu nội dung chat đời thật hay dữ liệu mua hàng ngoài game. Dùng duration và tỷ lệ lỗi để xem người chơi mắc ở đâu, không tối ưu quảng cáo/nghiện bằng biến động tiền.

Playtest 3 vòng: 5 người để tìm điểm kẹt, 10 tân thủ để kiểm tra mục tiêu học, 5-8 cần thủ để rà thuật ngữ/tín hiệu. Trước mỗi vòng có hypothesis rõ; sau mỗi vòng chọn tối đa 3 vấn đề ưu tiên. Bảng “đã học” và “cảm giác vui” đo riêng; lượng cá bắt không đủ kết luận học tốt.

## 28. Roadmap, nhân sự và backlog

Ước lượng kế hoạch: một đội 3-5 người có lập trình game, art 2D và game/UI design, thêm cố vấn cần thủ bán thời gian. Các khoảng tuần là thời gian làm việc dự kiến, phụ thuộc năng lực/scope; không phải cam kết giá hay ngày phát hành. Mốc MVP khoảng 20-30 tuần sau khi có đội và art pipeline phù hợp.

| Mốc | Khoảng dự kiến | Bàn giao | Gate để đi tiếp |
| --- | --- | --- | --- |
| M0 - Spike | 1-2 tuần | Engine export, float/line sandbox, input mobile | Tick ổn định; lực/đơn vị được thống nhất |
| M1 - Vertical slice | 4-6 tuần tiếp | Ao Làng, 4 cá, 10 phút đầu, sale/release/save | Người mới đi trọn loop và giải thích một lỗi |
| M2 - Lớp học và gear | 4-6 tuần tiếp | 15 bài, 75 records, preset/validator, 12 cá | Nội dung MVP được cần thủ duyệt; menu không bế tắc |
| M3 - Lure và 3 map | 5-7 tuần tiếp | Spinning, Ao/Kênh/Hồ, ecology và nhật ký | Kỹ thuật/map khác nhau có nguyên nhân; playtest đạt mục tiêu |
| M4 - Polish / candidate | 4-6 tuần tiếp | Mobile UX, âm, accessibility, save migration | Regression pass; benchmark; release candidate |

Tổng các khoảng là 18-27 tuần cộng buffer 2-3 tuần → 20-30 tuần. Steam/mobile build chỉ tiếp sau nghiệm thu export, input và yêu cầu store tại thời điểm phát hành. Không đưa 50 cá/10 map vào mốc này. Một người làm độc lập cần scope nhỏ hơn hoặc lịch dài hơn, nhất là mỹ thuật và duyệt bài.

Backlog mở đầu: P0-01 RigValidator; P0-02 float calibration; P0-03 persistent fish population; P0-04 hookset ground-truth; P0-05 line/slack/drag; P0-06 catch transaction; P0-07 save/load; P1-01 first-run flow; P1-02 lessons; P1-03 inventory/preset; P1-04 surface cues; P1-05 free recovery; P1-06 notebook; P2-01 hẹn giờ về; P2-02 trophy rumor. Mỗi ticket cần scenario, nguồn state, UI feedback và acceptance code liên quan.

## 29. Rủi ro, quyết định còn mở và yêu cầu duyệt

| Rủi ro | Giải pháp thiết kế | Chủ thể cần xác nhận |
| --- | --- | --- |
| Dạy sai từ tín hiệu phao đơn lẻ | Scenario cùng rig và cause; explanation/replay | Cố vấn câu Đài |
| Tên cá địa phương hoặc synonym sai | Alias theo vùng; review gate per taxon/map | Chuyên gia cá + cần thủ địa phương |
| Loop chờ quá dài hoặc thành bấm nhanh | Nhịp quan sát ngắn có lý do, không farm click | Người thử mới và giàu kinh nghiệm |
| Solver phức tạp làm khó debug | Budget đơn giản; seed, event log, scenario chuẩn | Lập trình game |
| Catalog 75 đồ tốn art hơn lợi ích | Họ asset/biến thể; đo việc đọc thông số | Art lead / game designer |
| Affiliate làm giảm tin cậy | Dữ liệu thật tách item, nhãn thương mại và ngày kiểm tra | Product owner |
| Mode gia đình gây khó chịu | Opt-in, đổi vai trò, giữ hẹn là giải pháp | Người thử mode đời thường |
| Save cá/đồ nhân đôi | Atomic idempotent catch; regression load/retry | Lập trình data |

Quyết định làm ngay trong slice: Ao Làng, cảnh vẽ tay, cần tre và một rig mẫu, 4 cá, phao/line solver đơn giản, một NPC, save offline, loop 10 phút. Trước M2 phải khóa engine version, 12 taxon, recipe nút mẫu, hiệu chuẩn float, hành vi filter feeder và support devices. Trước map biển phải khóa biến tide/salinity, kỹ thuật ISO và roster có review; trước multiplayer phải có thiết kế authority riêng.

## 30. Tài liệu nguồn, phương pháp và bộ bàn giao

Nguồn truy cập ngày 06/10/2026. Các nguồn sau được dùng để đối chiếu một số kiến thức/khả năng công cụ; công thức mô phỏng, scope, giá và UX là thiết kế mới trong tài liệu này.

| Nguồn | Dùng cho phần nào | Giới hạn |
| --- | --- | --- |
| MengTo/Skills, design-first-ui-prompting | Khóa goal/format/layout/type/color/copy/constraints | Phương pháp prompting, không là mẫu UI game sẵn |
| UI UX Pro Max, local search + UX guidance | Contrast, input, responsive, focus, hierarchy | Kết quả phải được chọn theo sản phẩm; style không áp nguyên xi |
| FAO Technical Paper 501 (2007), Table 7.20.1 | Đối chiếu một phần cá nuôi và tên tại Việt Nam | Tài liệu cũ; không xác nhận toàn bộ 50 ứng viên hay phân bố từng map |
| FAO aquaculture/environment mission (1995) | Phân biệt cá nuôi, vùng và cấu trúc ao | Không dùng dữ liệu lịch sử làm hiện trạng 2026 |
| Preston Innovations, Line Safe Plummets | Dò đáy chính xác, đọc contour của điểm | Không đồng nhất pole fishing với mọi setup câu Đài Việt Nam |
| Shimano FAQ, drag / baitcasting | Drag theo tải; máy ngang cần phanh/setup riêng | Hướng dẫn phụ thuộc thiết bị; không là chuẩn sức mạnh size máy |
| Godot stable docs, 2D | Renderer, physics, canvas, animation 2D | Engine version/export phải được spike và pin |

Liên kết đọc:

- https://github.com/MengTo/Skills/blob/main/agent-skills/ui/design-first-ui-prompting/SKILL.md
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- https://www.fao.org/4/a1495e/a1495e.pdf (bảng 7.20.1, PDF trang 518 theo cách đếm 1-based)
- https://www.fao.org/4/ag189e/AG189E02.htm
- https://www.prestoninnovations.com/en/products/accessories/pp-00074
- https://fishshop.shimano.com/pages/shimano-faq
- https://docs.godotengine.org/en/stable/tutorials/2d/index.html

Bộ bàn giao: GDD bản PDF và Markdown; prototype UI tự chứa 7 màn; ảnh chụp các màn desktop/mobile; design_tokens.json; catalog cá/map/item/bài học CSV và JSON; tuning; database_schema.sql; save_example.json; DESIGN.md; IMPLEMENTATION_PROMPTS.md; README. Prototype có mẫu logic tương tác chọn bài, lắp đồ, cân phao, luyện tín hiệu, xử lý catch và lọc danh mục. Chưa kiểm chứng Fish AI/physics trong engine, học chuyển giao hay hiệu năng native; những việc đó có gate rõ ở roadmap.
