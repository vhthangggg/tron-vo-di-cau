# Kiểm chứng bản web v0.1

Kiểm tra ngày 2026-10-06, trước khi xuất bản. Đây là kiểm chứng bản local phục vụ qua HTTP ở đường dẫn `/tron-vo-di-cau/`; không thay thế kiểm tra URL production khi quyền truy cập hosting được thay đổi.

## Cơ chế: 22 test đạt

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
- Tìm sổ cá theo tên, lọc theo map và hiển thị đủ 50 thẻ.
- 375×812: sáu màn không tràn ngang; bảng đồ nghề mở được, đổi điểm, thả, pause và thu bằng cảm ứng.
- 844×390: sáu màn không tràn ngang.
- 768×1024: sáu màn không tràn ngang.
- Zoom 200% có reflow.
- Reduced motion vẫn thao tác được; pause dừng đồng hồ và mô phỏng.

Nút thả/giật/thu đều từ 44×44 CSS px và nằm phía trên thanh điều hướng ở điện thoại, tablet và màn hình ngang.

Không ghi nhận lỗi JavaScript hoặc request tài nguyên lỗi. Đồng hồ ảo tăng animation frames của game; test không tạo cá giả, gọi hookset trực tiếp hay cộng tiền thay cho thao tác người chơi. Ảnh render đã được xem để chỉnh cận cảnh phao, bố cục dẫn cá và focus.

## Bản mở rộng: 8 nhóm kiểm tra trình duyệt đạt

`npm run test:browser:expansion` dùng bản lưu cũ có xu làm fixture để kiểm tra mua đồ. Mọi giao dịch, lắp đồ, đổi map và lượt câu đều đi qua UI thật.

- Di chuyển bản lưu cũ, giữ xu và sổ cá; thêm phụ kiện cơ bản.
- Mua phụ kiện trừ đúng giá, chặn mua lại; lắp dây/lưỡi/phao/vợt, tự cân phao và chặn máy trên cần tay.
- Mua cần đáy/lure/ISO, mồi dùng lại và cả 10 map; tải lại giữ bộ đã lắp.
- Chọn cả 10 map, giải mã đúng tranh cảnh trên mỗi map, đủ ba góc bờ và không tràn ngang.
- Câu đáy: đầu cần báo cắn → giật → dẫn → vợt lên cá → thả; chặn đổi map giữa lượt.
- Crankbait thả/thu bằng spinning, không tiêu hao.
- Sổ 50 loài lọc map, hiển thị mồi/kỹ thuật/tầng nước.
- Bộ chọn map và ô phụ kiện thao tác được tại 375×812, 844×390.

Test cơ chế mở rộng kiểm tra giao dịch/trang bị sai không thay đổi trạng thái, hiệu ứng lưỡi/máy/dây/phao/vợt thực sự tác động mô phỏng, cá lớn hơn 20 kg giữ được trong bản lưu. Một fixture quần thể tách riêng từng loài chạy cùng mô phỏng thật để kiểm chứng cả 50 loài có mồi/kỹ thuật/tầng hợp và có thể đưa lên bờ ở khối lượng tối đa. Đây là kiểm chứng khả năng bắt, không đo tần suất bắt hay tốc độ tiến độ của người chơi.

Không ghi nhận lỗi JavaScript hoặc request tài nguyên lỗi trong hai bộ kiểm tra trình duyệt. `npm run build` kiểm tra đủ cả tranh và ảnh nhỏ của 10 map.

## Giới hạn

Chưa benchmark trên máy điện thoại vật lý, chưa đo FPS/native, chưa kiểm chứng kiến thức câu cá ngoài đời hoặc thời gian giữ chân người chơi. Source CI chạy test cơ chế và build; script Playwright có thể chạy riêng theo README. Vercel Git integration triển khai từ main. Trạng thái deployment được kiểm tra trên commit; URL deployment riêng hiện có Deployment Protection.
