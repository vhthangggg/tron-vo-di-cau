# Kiểm chứng v0.2 — hai tay và môi trường động

Kiểm tra ngày 2026-10-07. Mã nền trước thay đổi: `d1878652`. Các phiên trình duyệt dùng bản lưu riêng để không tác động tiến độ đang chơi.

## Cơ chế: 34 test đạt

`npm test` kiểm tra vòng câu, giao dịch chỉ xử lý một lần, bản lưu hỏng/migration, đồ nghề và bài học; thêm lực cần liên tục, hai tay độc lập, mất cá khi không bám, chuyển động theo loài, input không hợp lệ, pause và mắc đáy.

- 50 hạt giống với bộ cần tre: cá tự tìm mồi → giật → bám cá và chỉnh lực mỗi 200 ms → lên bờ. Không thay khối lượng/quần thể trong nhóm này.
- 50 loài ở khối lượng tối đa: fixture quần thể từng loài, bộ đồ phù hợp, điều khiển hai tay qua API của engine. Không gán năng lượng hoặc tạo catch để ép thắng.
- Mắc đáy được rút một lần, phụ thuộc map/góc/tầng; giữ nhẹ và bám đúng gỡ được, kéo quá mạnh hoặc hết giờ mất lượt. Gỡ không tiêu thêm mồi/tiền và không phá đồ đã mua.
- Bản lưu v0.1 giữ tiền, đồ, map, sổ cá, bài học và cá đang chờ bán/thả.

## Kiểm tra trình duyệt

`npm run test:browser`: các màn, phím, lượt câu tự nhiên bằng chuột + Space/↑/↓, bản lưu cá chờ bán sau reload, bán đúng một lần, bài học, đào/mua mồi, đổi điểm, pause, thoát có xác nhận, bố cục bốn kích thước và zoom.

`npm run test:browser:expansion`: mua/lắp phụ kiện, bộ câu đáy/lure/ISO, cả 10 map và tranh riêng, sổ 50 loài, bản lưu cũ, lượt câu đáy bằng hai tay, mồi giả không tiêu hao. Fixture chỉ cung cấp xu và đồ để xét nội dung; hành động đi qua UI.

`npm run test:browser:two-hands` (lệnh `test:browser:hold` trỏ đến cùng bộ):

- Chuột bám cá + giữ Space; ↑/↓ chỉnh lực; W A S D bám cá; chuột giữ cần + W A S D.
- Cảm ứng 390×844, 844×390, 640×360: hai ngón thật qua Chrome DevTools input, nhận ngón thứ hai ở cả hai thứ tự. Giữ nguyên hình học điều khiển qua giật/dẫn.
- Di chuyển tay phải thay lực liên tục; nhấc một tay giữ nguyên tay kia. Cancel, mất pointer capture và pause xóa đúng input, resume không tự giữ lại.
- Câu tự nhiên → dẫn bằng hai ngón → lên bờ; nhấc tay sau khi vớt không đóng hoặc bấm nhầm hộp cá. Reload giữ cá và bán đúng giá một lần.
- Cảnh động thay đổi khi chờ và dừng cùng pause. Giảm chuyển động giữ môi trường tĩnh nhưng cá vẫn di chuyển để có thể điều khiển. Resize giữ lượt câu và nhả hai tay.
- Chọn hạt giống đồng hồ để một lượt tự mắc đáy; UI thật gỡ bằng thao tác nhẹ, không gọi hàm engine hoặc ép trạng thái game từ trình duyệt.

Kết quả và ảnh tự động nằm ở `test-results/` sau khi chạy. Script kiểm tra lỗi JavaScript và request tài nguyên, dùng đường dẫn `/tron-vo-di-cau/` để bảo vệ tính tương thích khi phục vụ dưới subpath.

## Bản dựng và production

`npm run build` đóng gói mã, font và đầy đủ 10 ảnh nền/ảnh nhỏ. `git diff --check` kiểm tra bản vá. `tests/production-smoke.cjs`, với `GAME_URL`, kiểm tra bản live: tải ảnh/điều khiển v0.2, thả câu tự nhiên, hai ngón tạo tiến độ, pause, lưu sau reload và viewport mobile. Tình trạng deployment phải kiểm tra trên đúng commit phát hành; không lấy kết quả local thay bằng kết quả live.

## Giới hạn

Touch được giả lập bằng Chromium, chưa đo trên điện thoại vật lý. Chưa benchmark FPS/giữ chân người chơi, chưa xác nhận tập tính hay kỹ thuật câu ngoài đời. Cảnh động là lớp Canvas trên tranh; không phải mô phỏng chất lỏng hoặc va chạm mọi vật trôi. Nguy cơ mắc đáy là mô hình xác suất theo môi trường, không phải va chạm với từng viên đá trong ảnh.
