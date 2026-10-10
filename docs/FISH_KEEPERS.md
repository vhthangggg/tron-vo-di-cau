# Rọng đựng cá

Catalog 12 vật phẩm lấy ID, tên, đường dẫn ảnh và link affiliate từ bảng chủ dự án cung cấp. `data/fish-keepers.catalog.json` là bản đối chiếu; `src/fish-keeper-catalog.js` chứa cùng dữ liệu để bản web tĩnh chạy không cần tải file nghiên cứu.

## Thông tin và cân bằng

Giá xu, sức chứa kg, số cá, chiều dài cá, độ bền và hệ số bảo quản là **thông số cân bằng trong game**, không phải thông số SKU hoặc giá bán thật. Các link Shopee rút gọn được giữ nguyên; chưa xác minh được SKU, kích thước, dung tích hoặc giá hiện tại của từng link. Những trường đó để trống trong catalog.

Nguồn tham khảo cấu tạo:

- [Drennan River Keepnet](https://www.drennantackle.com/products/nets-and-handles/keepnets/river-keepnet/): lưới thoát nước, đáy lưới mềm.
- [Drennan Carp Keepnets](https://www.drennantackle.com/products/nets-and-handles/keepnets/drennan-carp-keepnets/): kiểu rọng dài với lưới mềm.
- [Frabill Aerated Bait Bucket](https://www.frabill.com/products/aerated-bait-bucket-1592432): thùng có máy sục khí và lớp cách nhiệt.

Các nguồn giúp chọn tính chất tương đối giữa loại vật chứa; không xác nhận sản phẩm đích của link affiliate. Càn Khôn Dưỡng Ngư Hồ là vật phẩm hư cấu; link thực tế dẫn đến sản phẩm hồ lô trang trí liên quan, được ghi rõ trong chợ.

## Cơ chế

- Người chơi mới có Túi lưới đi chợ của vợ; mua các rọng khác bằng xu, rồi chọn rọng đang dùng. Không thể dùng rọng chưa sở hữu.
- Giữ cá kiểm tra đồng thời số lượng, tổng kg, chiều dài ước tính theo loài và độ bền. Cá không vừa vẫn nằm ở màn cá lên bờ để người chơi đổi rọng, xử lý cá cũ hoặc phóng sinh.
- Mỗi phút chơi chủ động ở bờ, cá giảm sức sống, độ tươi và tình trạng bề ngoài theo rọng, tải trọng và độ bền hiện tại. Tạm dừng, đóng game hoặc để cá ở nhà dừng hao mòn. Phần giây chưa đủ phút được lưu lại.
- Cá sống bán 100%, cá tươi 85%, cá trầy/dập 60%, cá ươn 20% giá gốc. Cá chết không thể ghi nhận phóng sinh. Không tự làm mất cá.
- Sửa rọng tại nhà: tối đa 15% giá mua, tỷ lệ với độ bền thiếu; rọng khởi đầu sửa miễn phí. Giao dịch mua/sửa và bán cá có biên nhận để tránh lặp lại sau tải trang.
- Bản lưu cũ được đổi `keepnet → fish_keeper_08`, `bucket → fish_keeper_05`, `box → fish_keeper_07`, cấp các lựa chọn cũ tương đương. Giữ toàn bộ cá, xu và sổ cá, kể cả khi rọng đang quá tải.

## Upload ảnh

[Upload trực tiếp 12 ảnh vào GitHub](https://github.com/vhthangggg/tron-vo-di-cau/upload/main/public/assets/items/fish-keepers).

Đặt đúng `rong_01.webp` đến `rong_12.webp` theo [bảng tên file](../public/assets/items/fish-keepers/README.md), kéo ảnh vào trang upload rồi bấm **Commit changes** trên `main`. Git integration sẽ triển khai lại. Không thêm thư mục con. Ảnh WebP được căn giữa, giữ tỷ lệ; biểu tượng dự phòng chỉ hiện khi ảnh chưa có hoặc tải lỗi.

## Kiểm tra

`npm test`, `npm run build`, `npm run test:browser:keepers`. Bộ kiểm tra rọng bao gồm mua/sửa đúng một lần, bản lưu cũ, giới hạn chiều dài, bảo quản theo phút, giá bán theo tình trạng, link affiliate và giao diện có/thiếu ảnh trên PC lẫn điện thoại. Kiểm tra ảnh thành công dùng ảnh fixture trong trình duyệt; ảnh rọng thật sẽ xuất hiện sau khi chủ dự án upload.
