# Trốn Vợ Đi Câu — giao diện game v0.1

Hướng thiết kế mới: một game câu cá Việt Nam, cảnh ao là trung tâm, HUD và menu nằm trên thế giới chơi. Bến câu là menu chính có nút chơi, chọn địa điểm và theo dõi hành trình; các màn quản lý là những cửa sổ trong game.

## Phương pháp và quyết định

Dùng UIUX Pro Max: đã chạy truy vấn design-system `fishing game immersive adventure`, truy vấn style `game HUD skeuomorphism` và UX `touch controls minimum target`. Kết quả design-system thiên về trang giới thiệu sản phẩm, nên không dùng bố cục chuyển đổi/marketing. Kết quả Skeuomorphism phù hợp HUD game và vật liệu có chiều sâu: biên vàng đồng, nút có gờ, nền đồ nghề như giấy. Chọn xanh rêu, giấy ngà và vàng đồng hợp cảnh ao Việt Nam; không dùng màu tím hay font esports trong kết quả gợi ý.

`styles.css` và `src/ui.js` là phần trình bày. `src/engine.js`, `src/content.js` và định dạng bản lưu được giữ. Tokens cập nhật tại `data/design_tokens.json`.

## Hệ thiết kế

- Forest #163B30, deep #102A23, light #2C5542; chữ trên HUD #FCF5E5, phụ #C7D1BB.
- Vàng đồng #E4BD70 / #F5D998; nút chính dùng chữ tối #382B13.
- Giấy #F1E8D2, bề mặt #FCF5E5; chữ #284336, phụ #566454.
- Font Viet/DejaVu Sans cho nội dung, VietDisplay/DejaVu Serif cho tên game và tiêu đề; WOFF nhúng có dấu Việt. Không tải font ngoài.
- Nút thông thường 48 CSS px; nút gọn và nút biểu tượng điện thoại 44 CSS px. Viền focus 3px; hover/press giữ nguyên kích thước.
- SVG do dự án vẽ, nét 1.8; không dùng emoji điều hướng. Tranh bản đồ nhỏ là biểu tượng cách điệu, không thay thế cảnh map.
- Giảm chuyển động tắt hiệu ứng báo cắn và transition; tín hiệu phao, chữ và nút vẫn dùng được.

## Các màn

| Màn | Thiết kế và thao tác |
|---|---|
| Bến câu | Cảnh ao phủ khung, tiêu đề game, nút chơi lớn, 3 thẻ map. Map mở đi vào cảnh; map khóa mở nhóm bản đồ tại chợ. Nhiệm vụ lấy từ cá, bài học và bộ sưu tập thật. |
| Buổi câu | Ao chiếm toàn bộ vùng chơi. Địa điểm/map trái trên, pause/help phải trên, phao phóng đại phải, thao tác và lực dây đáy giữa. Bảng điểm/đồ có thể thu gọn. |
| Đồ nghề | Ô cần có trạng thái sở hữu/trang bị, minh họa bộ hiện tại, chọn mồi và tinh chỉnh phao. Ô khóa mở chợ cần. |
| Học câu | Ba thẻ nhiệm vụ, số thứ tự, thưởng lần đầu và trạng thái hoàn thành. Quiz có phản hồi, thử lại khi sai. |
| Sổ cá | Thẻ loài, trạng thái khám phá, số gặp, kỷ lục và map. Tìm kiếm tên cá và tiến độ 12 loài. |
| Chợ bến | Thẻ đồ, giá và sở hữu. Lọc tất cả/cần/mồi/bản đồ; nhóm được giữ sau khi mua. |
| Cá lên bờ | Cửa sổ thành tích có hình cá, khối lượng, giá bán và lựa chọn bán/thả. Không đổi cách xử lý giao dịch. |

HUD đầu màn hình có số xu và cấp cần thủ. Cấp là cách trình bày tổng cá đã câu, tăng ở 5/15/30/60 con; không tạo thêm XP, thưởng xu hoặc yêu cầu thay đổi bản lưu. Thanh điều hướng đáy có đúng năm mục; logo đưa về bến.

## Responsive và kiểm chứng

Desktop giữ HUD quanh cảnh, để giữa mặt nước thoáng. Điện thoại thu bảng đồ nghề thành details ngay dưới cảnh và đặt nút chơi phía trên dock. Màn hình ngang thấp dùng HUD gọn, bảng đồ cuộn tại góc trái; giữ điều khiển trong viewport. Chừa safe area cho dock, cho phép cuộn, zoom 200% và thao tác bàn phím.

Dialog có focus trap, Escape, trả focus về trigger. Các nút biểu tượng có tên; hình trang trí ẩn khỏi cây trợ năng. Một vùng live thông báo thay đổi trạng thái, không đọc lại lực dây liên tục. Giữ giải pháp native cho range/select/checkbox.

14 test cơ chế và 15 nhóm kiểm tra trình duyệt, gồm lượt câu tự nhiên, bán một lần sau reload, bài học, mua/đào mồi, chọn map, ô khóa, bộ lọc chợ, cảm ứng, ba viewport, zoom và reduced motion. Xem `VERIFICATION.md` cho phạm vi kiểm chứng.

## Phạm vi hình ảnh

Ba cảnh chơi vẫn dùng chung tranh ao với sắc độ khác nhau. SVG map, đồ và cá là minh họa trong game; chưa phải định danh sinh học hoặc mô hình vật lý. Không giả nút multiplayer, dữ liệu người chơi, loot rarity, thanh năng lượng hay tính năng chưa triển khai.
