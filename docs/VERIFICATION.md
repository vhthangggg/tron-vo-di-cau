# Kiểm chứng bản web v0.1

Kiểm tra ngày 2026-10-06, trước khi xuất bản. Đây là kiểm chứng bản local phục vụ qua HTTP ở đường dẫn `/tron-vo-di-cau/`; không thay thế kiểm tra URL production khi quyền truy cập hosting được thay đổi.

## Cơ chế: 14 test đạt

`npm test` kiểm tra cá có trước khi thả câu; giữ đúng cá từ tìm mồi đến bắt; bán đúng một lần sau tải lại; thả cá giữ sổ; giật sớm mất một phần mồi; mồi/tầng không phù hợp không tạo cá cắn giả; bộ chưa cân không tiêu mồi; kéo liên tục cá lớn có thể đứt dây; pause đóng băng cửa sổ giật và đồng hồ; phục hồi khi hết xu/mồi; mua đồ và nhận thưởng một lần; lure cần thu mồi; giờ về nhà; save hỏng/bị chặn và roundtrip dữ liệu.

## Trình duyệt: 15 nhóm kiểm tra đạt

- Chọn map đã mở tại bến đưa vào cảnh câu; map khóa mở đúng nhóm bản đồ trong chợ, bộ lọc hoạt động.
- Sáu màn tải dưới đường dẫn repo, font Việt và assets tải đúng.
- Space thả câu, giật sớm nhận phản hồi.
- Cá tự tìm mồi → cắn → giật → dẫn bằng UI → lên bờ. Cá chưa bán được giữ sau reload, bán cộng đúng giá một lần.
- Trả lời sai có thể thử lại; bài học chỉ cấp thưởng lần đầu.
- Chì chưa cân báo lỗi; cân về bốn vạch; đào giun tăng đúng sáu phần.
- Ô cần chưa sở hữu mở nhóm nâng cấp; HUD cấp cần thủ lấy số cá đã câu thật.
- Mua mồi được lưu; dialog giữ focus trong hộp thoại, Escape trả focus.
- Tìm sổ cá theo tên.
- 375×812: sáu màn không tràn ngang; bảng đồ nghề mở được, đổi điểm, thả, pause và thu bằng cảm ứng.
- 844×390: sáu màn không tràn ngang.
- 768×1024: sáu màn không tràn ngang.
- Zoom 200% có reflow.
- Reduced motion vẫn thao tác được; pause dừng đồng hồ và mô phỏng.

Nút thả/giật/thu đều từ 44×44 CSS px và nằm phía trên thanh điều hướng ở điện thoại, tablet và màn hình ngang.

Không ghi nhận lỗi JavaScript hoặc request tài nguyên lỗi. Đồng hồ ảo tăng animation frames của game; test không tạo cá giả, gọi hookset trực tiếp hay cộng tiền thay cho thao tác người chơi. Ảnh render đã được xem để chỉnh cận cảnh phao, bố cục dẫn cá và focus.

## Giới hạn

Chưa benchmark trên máy điện thoại vật lý, chưa đo FPS/native, chưa kiểm chứng kiến thức câu cá ngoài đời hoặc thời gian giữ chân người chơi. Source CI chạy test cơ chế và build; script Playwright có thể chạy riêng theo README. Vercel Git integration triển khai từ main. Trạng thái deployment được kiểm tra trên commit; URL deployment riêng hiện có Deployment Protection.
