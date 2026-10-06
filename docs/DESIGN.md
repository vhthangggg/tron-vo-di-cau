# ĐI CÂU! - Design system v0.1

Visual thesis: sổ tay cần thủ bên bờ nước. Chữ có nhịp rõ, UI gọn, cảnh ao Việt Nam vẽ tay là phần cảm xúc. Cam đất chỉ hướng hành động chính; xanh ao làm cấu trúc và feedback có ý nghĩa.

Nguồn phương pháp: UIUX Pro Max (hierarchy, contrast, input, responsive, accessibility); MengTo design-first-ui-prompting (goal → format → layout → type → color → copy → constraints) và no-ai-design-slop (rendered quality gates). Kết quả palette từ truy vấn skill được biên tập theo người chơi trưởng thành và gameplay.

## Hệ thống

- Tokens: data/design_tokens.json là nguồn màu/khoảng/chữ/timing của handoff.
- Heading: serif có đầy đủ dấu Việt; prototype Georgia, PDF DejaVu Serif.
- Body: DejaVu Sans nhúng; production cân nhắc Be Vietnam Pro sau kiểm tra license/subset.
- Scale desktop: H1 44, H2 32, H3 24, body 16, caption 13. Font game phải kiểm tra kích thước quy đổi theo engine.
- Spacing 4/8; grouping 24/32; panel 12px, control 8px, đường chia 1px. Dùng khoảng cách trước container.
- Buttons ≥48 CSS px, gap ≥8; focus outline 3px; hover không thay bounds.
- Color: paper #F4F0E6, surface #FFFCF5, ink #183D37, text #223E38, muted #5C6E63, pond #2D6458, accent #B44727, danger #9D2929.
- Text-on-accent trắng; text-on-paper xanh mực; UI đặt trên cảnh có surface đủ đặc. Chỉ báo lỗi đi cùng chữ.
- Press 100ms, panel 180ms, screen 240ms. Reduced motion có frame ổn định, không chỉ giảm tốc.

## Desktop

Chuẩn nghiên cứu 1440x900. Header 80px, content margin 40px, max width 1440. S01: scene khoảng 72%, notebook 28%. S03: control/rig/summary xấp xỉ 30/40/30. S04: tank 60%, controls 40%. S05: scene tối thiểu 65% không có HUD trung tâm; điều khiển thấp, pause ở cạnh có safe inset.

Sổ học và shop dùng hàng thông tin có separator; không biến mọi con số thành card. Một hành động chính trong mỗi vùng công việc. Panel sidebar có lý do vì là lớp thông tin ngoài cảnh.

## Mobile và trợ năng

375px dọc: nav có thể wrap, workspace thành một cột, scene/canvas co vừa không tràn. 844x390 ngang: controls gọn, vùng phao không bị ngón tay che; prototype cho cuộn khi cần. Production dùng canvas/native touch riêng, safe area và chế độ tay thuận. Điều khiển bằng keyboard, +/- và click là phương án thay cho kéo.

Modal: focus trap, Escape, trả focus về trigger; một aria-live cho thông báo đầy đủ, không đọc tải liên tục. Search có visible label. Active nav dùng aria-current. Button disabled có lý do trong chữ gần đó. Zoom 200% reflow; không khóa browser zoom.

## Assets và honesty

ao-lang-concept.png là concept art mới được tạo cho tài liệu này; không có chữ baked-in. Đây là một hình bối cảnh, chưa có layer/collision để dùng production. Font DejaVu được nhúng kèm license. Icon/fish schematic SVG do mã prototype vẽ để giải thích UI; hình cá chưa là tranh định danh. Không logo hãng thật, giá thật, link affiliate hay lịch sử người chơi thật trong mẫu.

## Quality gates khi implement

1. Hành động và state của màn nhìn thấy từ đầu.
2. Tín hiệu phao rõ ở cảnh sáng/tối; HUD không che.
3. Chữ Việt có dấu đủ ở mức font và wrap.
4. Modal/nav/search đủ focus semantics và thao tác touch.
5. Nội dung dài/375px/landscape/200% không overflow.
6. Gỡ hiệu ứng không có nhiệm vụ; chỉ giữ chuyển động thể hiện trạng thái/cơ chế.
7. Không gọi prototype UI là game hoàn chỉnh; không để nút giả mang vẻ dùng được.

## Bản chơi web

Bản chơi dùng các nguyên tắc trên, font DejaVu subset WOFF và WebP cho tranh. Nội dung đang chạy nằm ở src/content.js; catalog trong docs/data giữ phạm vi nghiên cứu của GDD. Xem README và VERIFICATION.md để phân biệt bản chơi với prototype thiết kế ban đầu.
