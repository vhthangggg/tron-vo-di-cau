# Trốn Vợ Đi Câu

Một buổi câu bên bờ nước Việt Nam. Bản web **v0.1** chơi trực tiếp trên trình duyệt: chọn mồi, đọc phao, dẫn cá, bán hoặc thả rồi ghi lại thành tích.

![Bến câu trong bản web v0.1](docs/preview.webp)

## Giao diện game

Cảnh ao phủ vùng chơi, HUD xanh rêu và vàng đồng, thanh đồ nghề ở đáy. Bến câu có nhiệm vụ theo thành tích thật và thẻ chọn bản đồ; đồ nghề có ô trang bị; sổ cá có thẻ khám phá; chợ lọc theo nhóm hàng. Cấp cần thủ tăng khi câu được 5, 15, 30 và 60 con, không cần thêm tiền hay điểm kinh nghiệm.

![Cảnh chơi và HUD mới](docs/gameplay.webp)

## Đã chơi được

- Ao Làng, Kênh Đồng và Hồ Núi; ba điểm thả mồi tại mỗi map. Hai map sau mở bằng xu trong game.
- 12 loài cá, cần tre, câu Đài và bộ lure. Cá được tạo khi vào map, tìm mồi theo loại mồi, kỹ thuật và tầng nước; cá không được tạo ở thao tác giật cần.
- Phao rung, thăm mồi và chìm; giật sớm hoặc chậm đều có thể mất lượt. Cửa sổ giật 2,8 giây, có gợi ý tùy chọn.
- Cá bứt lực, dây quá căng có thể đứt. Câu tay dùng thao tác dẫn cá; bộ spinning dùng thu dây.
- Bán hoặc thả, sổ loài và thành tích khối lượng. Cá chưa quyết định bán/thả vẫn được giữ khi tải lại; mỗi giao dịch được xử lý một lần.
- Cửa hàng, ba bài học có thưởng lần đầu, cân phao, đào giun miễn phí và xuất bản lưu JSON.
- Lưu tự động trên trình duyệt, bàn phím, nút cảm ứng, giảm chuyển động và chế độ giờ về nhà 3 hoặc 5 phút.

Khởi đầu có cần tre, 12.000 xu và mồi. Xu hoàn toàn là tiền trong game. Không có tài khoản, thanh toán, quảng cáo hoặc dịch vụ máy chủ.

## Cách chơi

1. Vào **Buổi câu**, giữ điểm Chân cầu tre và mồi giun cho lượt đầu.
2. **Thả câu**, quan sát phao. Rung nhẹ chưa phải lúc giật.
3. Khi phao chìm rõ, **Giật cần**.
4. **Bật dẫn cá**, giữ lực trong vùng xanh. **Nới lực** khi cá bứt hoặc lực tăng cao; kéo liên tục ở vùng đỏ có thể đứt dây.
5. **Bán** để kiếm xu hoặc **Thả về ao**; cả hai đều giữ thành tích trong sổ cá.

Space thả/giật, A bật/tắt dẫn, D nới, P tạm dừng khi vùng chơi đang nhận focus. Các nút có hành vi tương đương. Với lure, cần **Bật thu mồi** trước khi cá tiếp cận.

Đổi mồi, bộ cần hoặc độ sâu tại **Đồ nghề**. Chọn điểm mới tự dò độ sâu đáy; chỉnh lại tầng nông hơn để tìm cá giữa nước. Hết mồi và xu vẫn dùng cần tre, đào thêm giun miễn phí. **Buổi câu mới** tạo lại quần thể cho một chuyến mới.

## Chạy tại máy

Cần Node.js 22 trở lên. Game không có thư viện chạy ở phía người chơi và không cần cài gói để phục vụ bản tĩnh.

```sh
npm start
```

Mở `http://127.0.0.1:5173/`. Phải phục vụ qua HTTP vì game dùng ES modules; không mở bằng `file://`.

```sh
npm test
npm run build
```

`dist/` chứa bản tĩnh đầy đủ. Kiểm tra đúng đường dẫn Pages:

```sh
node scripts/serve.mjs --base tron-vo-di-cau --port 5173
```

Mở `http://127.0.0.1:5173/tron-vo-di-cau/`.

Kiểm tra trình duyệt tự động tùy chọn:

```sh
npm ci
npx playwright install chromium
npm run test:browser
```

Script dùng UI thật và đồng hồ ảo để chạy animation frames. Ảnh và báo cáo xuất tại `test-results/`. Có thể đặt `CHROMIUM_EXECUTABLE` khi đã có Chromium. Chi tiết kiểm chứng tại [docs/VERIFICATION.md](docs/VERIFICATION.md).

## Vercel

Repo đã có `vercel.json`: `npm run build` và Output Directory `dist`, Framework Preset **Other**. Push lên nhánh production sẽ kích hoạt triển khai qua Git integration đã kết nối. URL production lấy ở trang project Vercel; URL deployment riêng có thể yêu cầu đăng nhập nếu bật Deployment Protection.

## GitHub Pages

Repo phục vụ trực tiếp từ **main / (root)**. Tất cả assets và module dùng URL tương đối, không phụ thuộc domain gốc.

Nếu Pages chưa bật: **Settings → Pages → Build and deployment → Deploy from a branch → main → / (root) → Save**. Không cần custom domain hay khóa API. Sau khi GitHub báo build thành công, dùng URL hiển thị tại Settings → Pages. Workflow `Check game` kiểm tra cơ chế và bản đóng gói khi cập nhật main; Pages xây và xuất bản từ nhánh đã chọn.

## Cấu trúc

| Đường dẫn | Vai trò |
|---|---|
| `index.html`, `styles.css` | Khung trang, giao diện responsive và font Việt |
| `src/content.js` | Nội dung và cân bằng riêng của bản chơi web |
| `src/engine.js` | Quần thể cá, tìm mồi, phao, giật, dẫn cá và giao dịch |
| `src/save.js` | Bản lưu phiên bản 1, kiểm tra dữ liệu và dự phòng khi không đọc được |
| `src/app.js` | Canvas, âm báo, trợ năng và nối thao tác với engine |
| `src/ui.js` | Màn game, HUD, biểu tượng, ô trang bị và thẻ bộ sưu tập |
| `assets/` | Tranh ao, font, favicon và giấy phép font |
| `tests/` | Kiểm thử cơ chế và vòng chơi qua trình duyệt |
| `scripts/` | Máy chủ local và đóng gói bản tĩnh |
| `docs/` | GDD, hệ thống thiết kế và kết quả kiểm chứng |

## Phạm vi v0.1

Đây là bản chơi web đầu tiên của [GDD v0.1](docs/GDD_v0.1.md), sử dụng UIUX Pro Max và phương pháp design-first/no-ai-design-slop của MengTo cho hướng giao diện. GDD chứa kế hoạch dài hạn với 10 map, 50 cá, 75 đồ và 15 bài; các con số đó chưa phải nội dung đã triển khai trong game.

Ba map hiện dùng chung tranh nền Ao Làng với sắc độ khác nhau; vị trí, quần thể, độ sâu và nội dung map khác nhau. Hình cá là phác thảo SVG, mô hình tìm mồi và lực dây là mô phỏng 2D giản lược. Chưa có nhân vật 3D, mô phỏng nút buộc, thế giới mở, nhiều người chơi hoặc kiểm chứng hiệu năng native. Cân bằng riêng của bản web thay đổi giá đồ và cách mở map so với kế hoạch GDD. Dữ liệu kế hoạch giữ riêng ở `docs/data/`, không điều khiển bản chơi này.

Tiến độ lưu theo trình duyệt/domain, không đồng bộ giữa thiết bị. Xóa dữ liệu trình duyệt sẽ xóa tiến độ. Xuất JSON giữ được bản riêng, nhưng v0.1 chưa có chức năng nhập lại trong giao diện. Thời lượng buổi câu bắt đầu lại khi tải trang; cá đang kéo không giữ giữa hai lần tải, cá đã lên bờ thì được giữ để quyết định bán/thả.

Các mô tả sinh học, tên phân loại và phân bố trong GDD đang chờ rà soát chuyên gia. Game không đưa ra bảo đảm về kỹ thuật câu cá ngoài đời.

## Tài nguyên

Tranh ao được tạo cho dự án; SVG cá và biểu tượng được viết cho giao diện này. Font DejaVu được subset để có dấu Việt, kèm [giấy phép font](assets/FONT_LICENSE.txt). Thông tin tài nguyên và phương pháp ở [ATTRIBUTIONS.md](ATTRIBUTIONS.md). Repo chưa cấp giấy phép mã nguồn mở cho mã và nội dung gốc.
