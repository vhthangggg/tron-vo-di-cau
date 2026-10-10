# Tài khoản, bản lưu và bảng xếp hạng v0.6

## Phạm vi

Mở **Hội cần thủ** ở trang nhà, hồ sơ trên đầu trang hoặc trong Tùy chọn. Có đăng nhập email/mật khẩu, đăng ký, đặt lại mật khẩu và Google khi nhà vận hành bật provider. Supabase Auth quản lý mật khẩu và phiên đăng nhập; API xác thực access token qua `/auth/v1/user`.

Bản lưu cá nhân gồm toàn bộ schema hiện hành: xu, đồ, mồi, kho/túi, cá, vườn, bộ câu đã lưu và hướng dẫn. Bản chơi khách và mỗi tài khoản có khóa riêng trong localStorage. Lưu trên máy tức thì, đẩy online sau khoảng 4 giây không có thay đổi. Bản lưu dùng số phiên bản và mã yêu cầu; thiết bị khác đã ghi bản mới thì hiện lựa chọn, không tự ghi đè. Mất phản hồi sau một lần ghi vẫn có thể gửi lại cùng mã. Đổi bản lưu giữ bản trước trên máy; nút tải bản dự phòng và nhập JSON cho phép phục hồi. Xóa dữ liệu trình duyệt vẫn xóa các bản chưa đồng bộ.

Bản lưu cloud là bản sao tiến độ cá nhân, **không phải dữ liệu kinh tế được máy chủ xác thực**. Nó không được dùng để ghi điểm thi, cấp đồ thi hoặc làm bằng chứng chống gian lận. Ruộng vườn trong chế độ cá nhân vẫn dùng logic thời gian hiện tại; chưa chuyển toàn bộ gameplay cá nhân lên server.

## Thử thách và xác minh

Thử thách 180 giây dùng cần tre, mồi giun và bờ Ao Làng cố định, không lấy trang bị hoặc xu từ bản cá nhân. Mỗi tuần (bắt đầu thứ Hai 00:00 giờ Việt Nam) dùng cùng seed. Có thể chơi lại; bảng tuần lấy kết quả tổng trọng lượng tốt nhất. Cá tự được thả sau khi ghi nhận.

Mô phỏng chạy bước cố định 50 ms. Trình duyệt chỉ gửi mã session và các thao tác được cho phép; không gửi điểm, trọng lượng, seed hoặc player save làm nguồn tin cậy. API đọc session thuộc đúng tài khoản từ database, kiểm tra thời gian/hạn phiên bản, chạy lại toàn bộ mô phỏng và tự tính catches/score. RPC hoàn tất khóa bản ghi trong giao dịch, chèn catches và điểm đúng một lần. Mỗi lần bắt có khóa `(session_id, ordinal)`.

Bảng gồm: tổng trọng lượng tốt nhất tuần; kỷ lục từng loài mọi thời gian; số loài khác nhau trong tuần. Chỉ lấy cá từ các buổi thi đã xác minh. Tên hiển thị công khai; email, UUID và bản lưu không xuất hiện trong kết quả bảng. Dữ liệu cũ vẫn ở sổ cá cá nhân.

Đây là xác minh tính hợp lệ của mô phỏng, **không chứng minh có người thật điều khiển**. Bot vẫn có thể tạo chuỗi thao tác hợp lệ; không dùng phiên bản này cho giải có tiền/thưởng giá trị. Session hết hạn sau 30 phút; giới hạn 20 session mới mỗi tài khoản mỗi giờ. Nếu mở lại session chưa hết hạn sẽ nhận lại cùng session. Lượt đã hoàn thành được giữ trên máy để gửi lại khi mất mạng; lượt thi đang chơi chưa được khôi phục giữa lần tải trang.

Khi sửa engine/content/physics ảnh hưởng kết quả, phải đổi `RANKED_RULES` trong `src/ranked-challenge.js`; các phiên đang chạy quy tắc cũ sẽ yêu cầu chơi buổi mới. Kiểm thử replay khóa tính xác định giữa client và server.

## Kích hoạt dịch vụ thật

1. Tạo hoặc chọn một dự án Supabase thuộc chủ sở hữu game. Chọn region gần backend Vercel.
2. Chạy nguyên migration `supabase/migrations/202610090001_online_players.sql` trong Supabase SQL Editor. Hoặc liên kết Supabase CLI rồi chạy `supabase db push`. Không chạy reset trên dữ liệu production.
3. Trong đúng project Vercel `tron-vo-di-cau` (`prj_gFVV5JRtnaGnerNDNfoAeA8w6Pzq`), thêm:

| Biến | Giá trị |
|---|---|
| `SUPABASE_URL` | URL của dự án Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key; hỗ trợ alias `SUPABASE_ANON_KEY` |
| `SUPABASE_SECRET_KEY` | Secret key phía server; hỗ trợ alias `SUPABASE_SERVICE_ROLE_KEY` |
| `ONLINE_ORIGIN` | `https://tron-vo-di-cau-six.vercel.app` |
| `ONLINE_GOOGLE_ENABLED` | `true` khi Google provider đã cấu hình; mặc định `false` |

Không đặt secret/service-role key trong source, biến `NEXT_PUBLIC_*`, bundle frontend hoặc tin nhắn chat. `/api/online?action=config` chỉ trả URL và publishable key sau khi health RPC xác nhận migration đã có.

4. Supabase Authentication → URL Configuration: Site URL là origin production; Redirect URLs cho phép `https://tron-vo-di-cau-six.vercel.app/` và các địa chỉ preview/local cần kiểm thử. Đăng nhập Google cần client ID/secret của Google OAuth và callback URL do Supabase cung cấp. Với email đăng ký/đặt lại mật khẩu cho người chơi công khai, cấu hình SMTP riêng: SMTP mặc định của Supabase chỉ phục vụ thử nghiệm và giới hạn người nhận trong team. Không tắt xác nhận email để né thiết lập SMTP.
5. Redeploy đúng môi trường. Khi thiếu env/migration hoặc backend chưa kết nối được, game hiện trạng thái chưa mở online, giữ chơi khách và nhập/xuất bản lưu. Không dựng bảng điểm mẫu hay giả lập tài khoản trong production.
6. Kiểm chứng live: đăng nhập tài khoản thử, lưu rồi đăng nhập ở thiết bị khác; tạo xung đột hai bản; chơi hết 3 phút; kiểm tra bảng; gửi lại kết quả; kiểm tra người dùng khác không đọc được save.

Quyền: các bảng bật RLS và không cấp quyền trực tiếp cho `anon`/`authenticated`; các RPC chỉ cấp cho `service_role`. Backend lấy user ID từ phiên Auth đã xác thực, không từ request body. Cấu hình CORS/origin của API không thay thế kiểm tra Auth.

## Kiểm thử

- `npm test`: regression của gameplay cùng kiểm thử mới: replay, input giả, session/timing, dữ liệu PostgreSQL qua PGlite, quyền role, save CAS, receipts, account isolation và phục hồi khi mất phản hồi.
- `npm run test:browser:online`: giao diện PC/mobile, chế độ chưa cấu hình, nhập JSON, đăng nhập bằng Supabase SDK đã bundle, nhận bản cloud, giữ bản khách, một lượt thi hoàn chỉnh bằng điều khiển UI và chạy lại trace bằng code production. HTTP của provider/API trong bài browser này dùng fixture kiểm thử; không thay cho kiểm chứng Google/SMTP/Supabase hosted thật.
- `npm run test:browser` và `npm run test:browser:workbench`: hồi quy chơi thường và bộ câu.
- `npm run build`: đóng gói frontend và bundle Supabase SDK cục bộ. API ở `api/online.js` được Vercel đóng gói riêng; thư mục `server`, SQL và khóa bí mật không được copy vào `dist`.

Tại thời điểm triển khai code, connector đọc cấu hình Vercel của scope `vhthang843-2267` trả 403 và CLI không có credential. Chưa tạo Supabase project, chưa chạy migration hosted, chưa cấu hình Google/SMTP, chưa xác nhận live cloud. Cần hoàn tất quyền truy cập và các bước trên để mở online.

Ghi chú hồi quy trình duyệt: bài `browser-check.cjs` hiện mất cá trong bước `driveHands` sau khi đổi kích thước màn hình ở cả bản nền `895b1ff` và bản cập nhật, với Chromium dùng trong môi trường này. Bài bộ câu riêng đã đạt ở sáu kích thước màn hình; không ghi nhận bài chơi thường là đã đạt.

Nguồn: [Supabase Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [migrations](https://supabase.com/docs/guides/deployment/database-migrations), [Vercel Node Functions](https://vercel.com/docs/functions/runtimes/node-js).
