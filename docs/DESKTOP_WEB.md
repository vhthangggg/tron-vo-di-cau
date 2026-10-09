# Giao diện PC web — 09/10/2026

Trình duyệt có con trỏ chuột chính và vùng hiển thị rộng từ 1024 CSS px tự dùng bố cục PC. Điện thoại và tablet cảm ứng tiếp tục dùng bố cục compact. Thu hẹp cửa sổ PC chuyển về compact, giữ nguyên engine, DOM buổi câu và dữ liệu đã lưu. Cửa sổ PC hẹp không bị xoay 90 độ; chỉ điện thoại cảm ứng dọc dùng fallback xoay hiện có.

Trang nhà, chuẩn bị, đồ nghề, bài học, sổ cá và chợ dùng thanh điều hướng trên đầu ở PC. Khi câu, cảnh ở trái và bảng bên phải hiển thị bộ cần, mồi mang theo, cước/thẻo, rọ và hướng dẫn. Bảng tự cuộn khi cửa sổ thấp. Các vùng tay lớn hơn; thanh lực/tiến độ ở giữa, không che vùng thao tác. Bộ câu và số cá cập nhật theo dữ liệu thật. Các nút đổi đồ/xem rọ tuân thủ khóa lượt câu hiện có.

| Phím / thao tác | Tác dụng |
| --- | --- |
| Space | Thả câu khi sẵn sàng; giữ để giật/giữ cần khi có tín hiệu |
| Chuột trong ô trái + giữ Space | Rê theo dấu cá; không cần giữ nút chuột trong bố cục PC |
| ↑ / ↓ | Tăng / giảm lực cần khi đang giữ cần |
| W A S D | Bám cá bằng bàn phím; dùng với Space hoặc chuột giữ vùng tay phải |
| R | Thu cần; bật/tắt thu mồi đối với lure khi chờ |
| B | Mở đồ mang theo khi lượt câu cho phép |
| K | Xem rọ cá khi lượt câu cho phép |
| P / Esc | Tạm dừng |
| F | Bật/tắt toàn màn hình; có nút trên thanh công cụ nếu browser hỗ trợ |

Mở dialog, mất focus, đổi kích thước hoặc đổi fullscreen đều xóa thao tác đang giữ để không có lực ma. Phím tắt không chiếm Ctrl/Alt/Meta hoặc các ô nhập. Space trên nút giao diện giữ cách kích hoạt gốc; các vùng tay tiếp tục nhận phím chơi. Toàn màn hình phụ thuộc khả năng và quyền của trình duyệt, không tự bật.

## Sửa ảnh loài tràn khung

Ảnh WebP có kích thước gốc lớn làm track Grid tự giãn theo kích thước tối thiểu của ảnh, dù `.fish-visual` có chiều cao cố định. Ảnh vì vậy chồng xuống tên loài. Wrapper hiện là khung block có vị trí tương đối; ảnh và SVG dự phòng đặt tuyệt đối trong khung, giới hạn cả hai chiều và dùng `object-fit: contain`. Khung không còn bị ảnh gốc kéo giãn, toàn bộ ảnh giữ đúng tỷ lệ. Cùng một quy tắc áp dụng cho sổ cá, thông tin loài, cá vừa lên bờ và rọ; không sửa/cắt file ảnh người dùng.

## Kiểm chứng

- `npm test`: 179/179 kiểm thử logic qua.
- `npm run build`: qua; đóng gói cả `desktop.css` và các ảnh đã upload.
- `npm run test:browser:desktop`: qua trên 1024×768, 1280×720, 1366×768, 1920×1080, 2560×1080 và 1280×480. Kiểm tra điều hướng, không tràn ngang, khung cảnh/tay/thanh lực không chồng nhau, Space/R/B/K/F, native button Space, modifier, fullscreen, hover, lực analog, pause, một lần câu tự nhiên, cất rọ, tải lại và đổi breakpoint.
- `npm run test:browser:two-hands`: qua trên desktop, điện thoại dọc 390×844, ngang 844×390 và 640×360. Kiểm tra cảm ứng đồng thời, cancel/capture, câu tự nhiên, gỡ mắc đáy, pause, giữ bản lưu và giảm chuyển động.
- `npm run test:browser:fish-images`: qua với 56 ảnh thật tại 390×844, 1024×768 và 1440×900; từng ảnh nằm trong khung và không chồng tên. Cửa sổ thông tin kiểm tra cá chép, cua đồng và ếch. Ảnh cá vừa câu/rọ cũng được kiểm tra trong vòng câu PC.
- `npm run test:browser:species`: qua. Trường hợp chưa upload ảnh dùng fixture manifest rỗng rõ ràng, vì repo thực tế đã có ảnh; vẫn kiểm tra tìm kiếm, dải cỡ, map, CSV và fallback WebP/PNG.

Kiểm thử browser dùng Chromium headless và giả lập cảm ứng; không thay thế kiểm tra trên thiết bị vật lý hoặc xác nhận hỗ trợ mọi browser. Tiến độ vẫn lưu theo trình duyệt/domain, chưa đồng bộ giữa PC và điện thoại.
