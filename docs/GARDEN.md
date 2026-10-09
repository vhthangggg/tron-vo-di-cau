# Ruộng vườn — v0.4

## Mục đích và nghiên cứu

Ngô và giun không còn là phần thưởng bấm nhận ngay. Người chơi chăm một luống ngô và một góc đất phủ lá tại nhà, thu mồi vào kho rồi tự xếp vào túi trước khi ra bờ. Mồi bột chỉ mua ở Chợ bến. Những phần mồi đã sở hữu, kể cả mồi khởi đầu, được giữ nguyên.

- University of Maryland Extension, [Growing Sweet Corn in a Home Garden](https://www.extension.umd.edu/resource/growing-sweet-corn-home-garden): ngô cần đất giàu hữu cơ, bón bổ sung, kiểm soát cỏ và giữ ẩm đều. Ngô thật thường mất 63–100 ngày; game rút còn 72 giờ đất tốt để tạo thói quen ghé chăm hàng ngày.
- USDA NRCS, [Earthworms](https://www.nrcs.usda.gov/sites/default/files/2022-10/Earthworms.pdf): giun cần đất ẩm, thoáng và chất hữu cơ; lật đất có thể phá hang và môi trường sống. Vì vậy cuốc dùng cho luống ngô, góc giun chỉ tưới và thêm hữu cơ.

Các tỷ lệ, ngưỡng, thời gian ủ và sản lượng dưới đây là thiết kế game, không phải hướng dẫn canh tác thực tế.

## Chu kỳ chơi

1. Vào Nhà → Ruộng vườn. Xới luống, bón 1 phần phân hữu cơ và tưới, rồi gieo bằng 1 lượt giống.
2. Ngô chỉ tăng tiến độ khi độ ẩm ≥35%, dinh dưỡng ≥30% và độ tơi ≥40%. Dụng cụ cũ giữ đủ điều kiện hơn một ngày nếu chuẩn bị đất tốt. Ghé mỗi ngày để xem chỉ số và chăm phần cần thiết.
3. Đủ 72 giờ đất tốt, thu ngô. Cây khỏe cho 16 phần mồi; cây yếu cho ít hơn, tối thiểu 6. Sức cây ≥60% giữ lại 1 lượt giống. Thu xong giảm dinh dưỡng và độ tơi, cần chăm lại cho vụ sau.
4. Góc giun cần độ ẩm ≥35% và hữu cơ ≥30%. Mỗi giờ đất tốt hồi 0,25 phần giun; đủ ít nhất 3 phần mới được đào. Giới hạn tồn tại 8 phần, mỗi lần lấy tối đa 4 bằng bay cũ hoặc 6 bằng bay thép. Các lượt đào cách nhau 24 giờ kể từ lần thành công gần nhất, không dựa vào đổi ngày lịch.
5. Gom lá không tốn xu mỗi 24 giờ, ủ 12 giờ lấy 1 phần phân. Người hết xu vẫn có thể chăm góc giun và chờ để có mồi, không có nút phục hồi ngay. Tải lại trang không rút thời gian.
6. Mồi thu hoạch ở kho nhà. Mở Đồ nghề để bỏ vào túi; giới hạn túi câu giữ nguyên.

## Đất và việc bỏ chăm

| Đại lượng | Luống ngô | Góc giun |
|---|---:|---:|
| Độ ẩm giảm mỗi giờ | 1,8 điểm | 2 điểm |
| Dinh dưỡng giảm mỗi giờ | 0,65 khi có cây; 0,3 khi trống | 0,3 điểm |
| Độ tơi giảm mỗi giờ | 0,55 điểm | Không quyết định khả năng hồi giun |
| Hậu quả mỗi giờ thiếu điều kiện | Ngừng lớn; sức cây −1,4 điểm | Giun −0,12 phần |

Sức cây hồi 0,4 điểm mỗi giờ tốt, tối đa 100. Cây hết sức không hồi sinh; chỉ được dọn cây đã héo rồi gieo lại. Cây chín vẫn cần chăm nếu chưa thu. Không có thu hoạch tự động hoặc tích lũy vô hạn khi đóng game.

## Đồ làm vườn

| Đồ | Giá xu game | Tác dụng |
|---|---:|---|
| Cuốc cũ | Cấp một lần | +40 độ tơi cho ngô |
| Gáo tưới | Cấp một lần | +55 độ ẩm |
| Bay đào cũ | Cấp một lần | Đào tối đa 4 phần giun |
| Cuốc thép | 1.800 | +65 độ tơi |
| Bình tưới | 2.200 | +80 độ ẩm |
| Bay đào thép | 1.400 | Đào tối đa 6 phần giun |
| Hạt ngô giống | 300 / 3 lượt | Mỗi vụ tiêu 1 lượt |
| Phân hữu cơ | 240 / 3 phần | Mỗi lần tiêu 1 phần, +55 dinh dưỡng |

Dụng cụ dùng lâu dài, tự chọn loại tốt nhất đang sở hữu, không chiếm túi câu. Vườn mới có ba dụng cụ cũ, 3 lượt giống và 2 phần phân. Vật tư tối đa 99 phần mỗi loại. Tưới/bón/xới khi đất đã đủ sẽ bị từ chối, không mất vật tư.

## Lưu và giao dịch

- `src/garden.js` chứa định nghĩa duy nhất của đồ, đất, sinh trưởng, cooldown và các đề xuất thao tác thuần. `src/garden-ui.js` vẽ trạng thái thật và diễn giải việc cần làm; render không thay đổi tài sản.
- `player.systems.garden` lưu đất, cây, giun, vật tư, dụng cụ, thời điểm lần đào/mẻ ủ và thống kê thu hoạch. Schema tăng từ 2 lên 3, giữ khóa lưu cũ; migration cấp vườn một lần và giữ xu, mồi, cần, phụ kiện, túi, cá, thành tích, bài học và giao dịch cũ. Mồi giả đã mất ở schema 2 không được tự tạo lại.
- Tiến triển được tính theo thời gian thực đã trôi, kể cả đóng game; tính theo lần vượt ngưỡng đất, không chạy vòng lặp mỗi giờ. Kết quả giống nhau khi mở liên tục hoặc tải lại sau thời gian tương đương.
- Mua hàng và chăm/thu dùng giao dịch có mã chống xử lý lặp. Kiểm tra điều kiện trước khi ghi; kho mồi đầy giữ nguyên cây/giun. Xu, vật tư và mồi đổi đồng thời; thưởng mồi mới ở kho nhà. Chỉ chăm/mua ở nhà và khi không có lượt câu/cá chờ quyết định.
- Đồng hồ lùi không tăng tiến độ, bỏ qua cooldown hay cho thao tác chăm. Game vẫn là bản chơi một người lưu cục bộ; chỉnh đồng hồ tiến hoặc sửa bản lưu không thể được xác thực như máy chủ. Không tuyên bố chống gian lận đầy đủ.

## Kiểm tra

`npm test`: sinh trưởng có/không chăm, cây héo, giới hạn giun, thời gian ủ, 24h rolling cooldown, tính theo lô so với từng giờ, đồng hồ lùi, thao tác sai luống, vật tư cạn/đầy, giao dịch lặp, mua dụng cụ và tự dùng loại tốt nhất, kho đầy, thu vào kho, người hết xu phục hồi, migration và render không đụng tài sản.

`npm run test:browser:garden`: thao tác UI thật ở 320px, 390px và PC 1366px; mua đồ, chăm/gieo, tiến đồng hồ thử nghiệm 12 giờ và 3 ngày, thu giun/phân/ngô, reload không cấp lại, không có nút lấy mồi/trộn bột cũ, không tràn ngang hoặc lỗi JavaScript, migration schema 2 → 3. `test:browser`, `test:browser:systems` và `test:browser:desktop` kiểm tra lại luồng chuẩn bị, túi đồ, câu, xử lý cá và bàn phím.
