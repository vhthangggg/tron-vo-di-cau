# v0.2 — Hai tay và mặt nước động

## Trải nghiệm

Giữ vùng bên phải khi có tín hiệu cắn để đóng lưỡi. Vị trí ngón trong vùng này đặt lực cần liên tục từ 0 đến 100%; kéo lên tăng lực, kéo xuống nới lực. Tay trái giữ trong vùng bám cá và di chuyển theo dấu cá cả chiều ngang lẫn dọc. Cả hai vùng giữ nguyên hình học qua lúc giật để không trượt khỏi ngón tay.

Cá có đích chạy, vận tốc và gia tốc, tự đổi hướng theo hạt giống của lượt. Tốc độ, lực bứt và thời gian nghỉ phụ thuộc nhóm dáng, loài và khối lượng. Cá mệt chạy chậm hơn. Hình cá trong cảnh và dấu cá trên ô điều khiển dùng cùng vị trí mô phỏng; chuyển động này vẫn có khi bật giảm chuyển động.

Chỉ tiến gần bờ khi cả hai tay đang giữ, tay trái bám đúng cá và dây trong vùng lực an toàn. Lệch cá liên tục 6 giây sẽ mất cá; kéo quá căng hoặc dây quá chùng cũng có thể thất bại. Nâng cấp dây/lưỡi/máy/vợt tiếp tục có tác dụng. Không có tự bám cá hoặc tự thắng bằng cách giữ một nút.

Máy tính có ba cách phối hợp: chuột giữ/bám cá + Space/↑/↓ giữ/chỉnh lực; W A S D bám cá + chuột giữ/chỉnh lực; hoặc W A S D + Space/↑/↓ bằng bàn phím. Khi di chuyển bằng phím, tay trái giữ vị trí đã đặt, không tự đi theo cá.

Hai pointer độc lập, không lọc ngón thứ hai theo `isPrimary`. Nhấc hoặc mất capture một ngón chỉ giải phóng tay đó. Pause, rời tab, mất focus và resize giải phóng cả hai. Resize không đặt lại lượt câu. Pointer kết thúc sau khi cá lên bờ không được kích hoạt hộp bán/thả.

## Môi trường và mắc đáy

Mỗi map có mặt nạ mặt nước theo tranh nền, tốc độ/hướng dòng, màu phản quang và nhóm cây tiền cảnh riêng. Vệt nước, bọt theo cụm, cành/lá trôi và các nhánh tiền cảnh được vẽ bằng Canvas. Vị trí mặt nạ theo cùng phép cover của ảnh nền trên màn hình dọc/ngang. Số vật thể hữu hạn; không có tích lũy particle hoặc ảnh tải thêm mỗi khung hình.

Thời gian môi trường dùng đồng hồ game, dừng cùng pause. Random trang trí độc lập với random câu cá. Giảm chuyển động giữ cảnh tĩnh, vẫn giữ đầy đủ điều khiển và cá chuyển động. Đây là lớp chuyển động 2D trên tranh nền, không phải mô phỏng chất lỏng.

Mắc đáy được rút một lần mỗi lượt, khi mồi vừa xuống nước. Xác suất theo map/góc bờ, giảm khi đặt mồi xa đáy; lure dùng mức riêng. Mức với bộ hiện tại hiển thị ở Chuẩn bị. Khi mắc: tay trái bám điểm gỡ, tay phải giữ 15–35% khoảng 2,4 giây. Kéo trên 65% lâu sẽ đứt; quá 16 giây sẽ bỏ lượt. Gỡ thành công trở lại chờ cá, không tiêu thêm mồi. Bỏ lượt không xóa phụ kiện đã mua. Không thể tạo cá hoặc tiền qua thao tác gỡ.

## Tương thích và phát hành

Giữ khóa lưu `tron-vo-di-cau.v01` và schema 1. Tiền, đồ, map, bài học, sổ cá và cá chờ bán/thả giữ nguyên. Cá đang dẫn vẫn không lưu giữa hai lần tải như bản trước.

Mốc trước phát hành: `d18786520cf60553694b0f1bbf4f0ccb3e3f7755`. Có thể khôi phục triển khai đó nếu cần rollback. Mã tính cơ chế ở `engine.js`, điều khiển ở `two-hands.js`, hồ sơ loài/map và cảnh động ở `water-world.js`.
