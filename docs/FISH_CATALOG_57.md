# Bảng loài câu được và 57 ID ảnh

Đối chiếu 2026-10-09. **57 ID ảnh, 56 loài câu được**: người dùng chọn gộp trắm cỏ fish_55 vào fish_07. Toàn bộ 50 ID cũ vẫn tồn tại. fish_56 và fish_57 đã câu được dù chưa có ảnh.

## Cách đọc

Kích cỡ thường gặp, trung điểm, chiều dài ước tính, mồi ưu tiên, phân bố map, xác suất và sức kéo là tham số mô phỏng. Không phải trung bình quần thể khảo sát tại Việt Nam. Cỡ cực lớn công bố là tham chiếu riêng, TL/SL/FL không quy đổi lẫn nhau. Định danh đại diện cần đối chiếu ảnh/mẫu; ảnh người dùng chưa có trong repository.

- Cỡ trong bảng: nhỏ → thường gặp → lớn → cực lớn; cá gần bờ khởi đầu bị giới hạn cỡ để giữ trải nghiệm tân thủ. Tầng sâu hơn có đủ dải cỡ.
- Xác suất chọn dải trước giới hạn điểm câu: nhỏ 32%, thường 62%, lớn 5%, cực lớn 1%. Đây là phân bố game, không phải xác suất ngoài tự nhiên.
- Sức loài so sánh ở cùng cân nặng; sức kéo cụ thể tăng theo cân nặng. Công thức sức kéo: clamp(1 + 4 × hệ số loài × log10(1 + 4 × kg), 1, 10). Điểm này không có đơn vị lực.
- Độ bền bo vẫn dùng cân nặng, hệ số loài và sức tải bộ câu; chỉ trừ sức cá khi cả hai tay điều khiển đúng và dây ở vùng xanh.
- Mồi đầu tiên là ưu tiên mô phỏng (hệ số 1,4), mồi còn lại hệ số 1; chỉ chọn khi kỹ thuật và tầng nước hợp.
- Nguồn chủ yếu là FishBase; thêm FAO, Đại học Nha Trang, Đại học Cần Thơ, Đại học Hong Kong, AmphibiaWeb và nghiên cứu cá chiên Việt Nam. Các tên địa phương không đủ để đảm bảo định danh loài; giữ nhãn đại diện khi cần.
- Tôm = tôm càng xanh đại diện; cua biển = cua bùn Scylla paramamosain; ba ba = ba ba trơn. fish_51 = sửu biển/sửu vàng O. biauritus, fish_57 = ếch đồng theo trả lời người dùng.
- Trê phi chỉ có Hồ Dịch Vụ thả nuôi. Cửa Sông có cua biển; không đặt cua biển ở ao nước ngọt.
- Cỡ mai cua là **rộng mai**, ba ba là **dài mai**, ếch là **mõm–hậu môn**; không bao gồm chân/càng/cổ.

## Bảng tổng hợp

Chi tiết đầy đủ, cỡ cm cho từng dải và các nguồn riêng nằm trong [CSV](../data/fish-catalog-57.csv) và [JSON](../data/fish-catalog-57.json). Game đọc cùng dữ liệu từ src/species-data.js; bảng được xuất bởi scripts/export-fish-catalog.mjs.

| ID ảnh | Loài | Cỡ nhỏ → thường → lớn → cực lớn (kg) | Sức loài /10 | Map | Mồi |
|---|---|---|---|---|---|
| fish_01 | Cá chép | 0.08–0.3 → 0.3–2 → 2–8.5 → 8.5–12 | 6.1 | Ao Làng, Hồ Núi, Hồ Dịch Vụ, Kênh Miền Tây, Sông Bãi Bồi, Lòng Đập | Giun, Ngô, Mồi bột |
| fish_02 | Cá diếc | 0.03–0.1 → 0.1–0.35 → 0.35–0.5774999999999999 → 0.5774999999999999–0.7 | 3.6 | Ao Làng, Hồ Núi, Hồ Dịch Vụ | Giun, Mồi bột |
| fish_03 | Cá rô đồng | 0.025–0.06 → 0.06–0.18 → 0.18–0.2905 → 0.2905–0.35 | 4.7 | Ao Làng, Kênh Đồng, Kênh Miền Tây | Giun, Dế, Tôm |
| fish_04 | Cá lóc | 0.1–0.3 → 0.3–1.2 → 1.2–2.37 → 2.37–3 | 8.1 | Ao Làng, Kênh Đồng, Hồ Núi, Lòng Đập, Suối Đại Ngàn, Kênh Miền Tây | Mồi mềm, Crankbait, Popper nhái, Cá mồi, Tôm |
| fish_05 | Cá trê vàng | 0.08–0.2 → 0.2–0.7 → 0.7–1.025 → 1.025–1.2 | 6.4 | Ao Làng, Kênh Đồng, Kênh Miền Tây | Giun, Tôm |
| fish_06 | Cá rô phi vằn | 0.05–0.2 → 0.2–0.8 → 0.8–2.2300000000000004 → 2.2300000000000004–3 | 5 | Ao Làng, Kênh Đồng, Hồ Núi, Hồ Dịch Vụ, Kênh Miền Tây | Giun, Mồi bột |
| fish_07 | Cá trắm cỏ | 0.2–1 → 1–5 → 5–21.25 → 21.25–30 | 8.1 | Ao Làng, Hồ Núi, Hồ Dịch Vụ, Lòng Đập | Rong lá, Ngô, Mồi bột |
| fish_08 | Cá mè trắng | 0.2–0.7 → 0.7–3 → 3–10.8 → 10.8–15 | 4.4 | Ao Làng, Hồ Núi, Hồ Dịch Vụ | Mồi mây |
| fish_09 | Cá mè hoa | 0.3–1 → 1–5 → 5–18 → 18–25 | 6.4 | Ao Làng, Hồ Núi, Hồ Dịch Vụ | Mồi mây |
| fish_10 | Cá trôi (rohu) | 0.2–0.7 → 0.7–3 → 3–10.8 → 10.8–15 | 6.7 | Ao Làng, Hồ Núi, Hồ Dịch Vụ | Mồi bột, Ngô |
| fish_11 | Cá sặc rằn | 0.02–0.06 → 0.06–0.18 → 0.18–0.2905 → 0.2905–0.35 | 3.3 | Kênh Đồng, Kênh Miền Tây | Giun, Mồi bột |
| fish_12 | Cá sặc bướm | 0.008–0.025 → 0.025–0.06 → 0.06–0.099 → 0.099–0.12 | 2.8 | Kênh Đồng | Giun |
| fish_13 | Cá trê đen | 0.05–0.12 → 0.12–0.35 → 0.35–0.5125 → 0.5125–0.6 | 5.8 | Ao Làng, Sông Bãi Bồi | Giun, Tôm |
| fish_14 | Cá trê phi | 0.3–1 → 1–5 → 5–18 → 18–25 | 7.5 | Hồ Dịch Vụ | Giun, Cá mồi |
| fish_15 | Cá tra | 0.3–1 → 1–5 → 5–21.25 → 21.25–30 | 7.2 | Kênh Miền Tây, Hồ Núi, Hồ Dịch Vụ | Mồi bột, Tôm, Cám viên |
| fish_16 | Cá basa | 0.3–1 → 1–4 → 4–14.4 → 14.4–20 | 6.9 | Kênh Miền Tây | Tôm, Mồi bột, Cám viên |
| fish_17 | Cá lăng đuôi đỏ | 0.3–1 → 1–6 → 6–24.85 → 24.85–35 | 8.6 | Sông Bãi Bồi, Hồ Núi, Lòng Đập, Kênh Miền Tây | Tôm, Cá mồi |
| fish_18 | Cá bỗng | 0.1–0.3 → 0.3–1 → 1–5.55 → 5.55–8 | 8.6 | Sông Bãi Bồi, Suối Đại Ngàn, Hồ Núi | Giun, Dế |
| fish_19 | Cá chiên | 0.5–2 → 2–8 → 8–22.3 → 22.3–30 | 9.4 | Sông Bãi Bồi, Lòng Đập | Cá mồi, Tôm |
| fish_20 | Cá ngạnh | 0.05–0.15 → 0.15–0.6 → 0.6–1.3800000000000001 → 1.3800000000000001–1.8 | 6.4 | Sông Bãi Bồi | Giun, Tôm |
| fish_21 | Cá nheo | 0.1–0.4 → 0.4–2 → 2–7.2 → 7.2–10 | 6.9 | Sông Bãi Bồi, Hồ Núi, Lòng Đập | Cá mồi, Giun |
| fish_22 | Cá lóc bông | 0.3–1 → 1–5 → 5–11.5 → 11.5–15 | 8.3 | Kênh Miền Tây, Hồ Núi, Lòng Đập | Popper nhái, Crankbait, Mồi mềm, Cá mồi |
| fish_23 | Cá thát lát | 0.04–0.12 → 0.12–0.4 → 0.4–0.66 → 0.66–0.8 | 5.6 | Kênh Miền Tây, Kênh Đồng | Giun, Tôm |
| fish_24 | Cá thát lát cườm | 0.15–0.5 → 0.5–2.5 → 2.5–5.425000000000001 → 5.425000000000001–7 | 6.9 | Kênh Miền Tây, Hồ Núi | Mồi mềm, Cá mồi |
| fish_25 | Cá bống tượng | 0.05–0.2 → 0.2–0.7 → 0.7–1.545 → 1.545–2 | 6.7 | Kênh Miền Tây, Kênh Đồng | Tôm, Cá mồi |
| fish_26 | Cá bống kèo | 0.008–0.015 → 0.015–0.035 → 0.035–0.051250000000000004 → 0.051250000000000004–0.06 | 2.8 | Kênh Miền Tây, Cửa Sông | Giun |
| fish_27 | Cá chạch bùn | 0.008–0.02 → 0.02–0.06 → 0.06–0.099 → 0.099–0.12 | 2.5 | Ao Làng, Kênh Đồng | Giun |
| fish_28 | Cá chạch lấu | 0.06–0.2 → 0.2–0.7 → 0.7–1.415 → 1.415–1.8 | 5.8 | Sông Bãi Bồi, Kênh Miền Tây | Giun, Tôm |
| fish_29 | Cá chày mắt đỏ | 0.05–0.15 → 0.15–0.6 → 0.6–1.25 → 1.25–1.6 | 7.2 | Sông Bãi Bồi, Suối Đại Ngàn | Giun, Dế |
| fish_30 | Cá mè vinh | 0.05–0.15 → 0.15–0.6 → 0.6–0.99 → 0.99–1.2 | 6.1 | Kênh Miền Tây, Kênh Đồng | Mồi bột, Rong lá, Giun |
| fish_31 | Cá trắm đen | 0.3–2 → 2–8 → 8–25.55 → 25.55–35 | 9.2 | Ao Làng, Hồ Núi, Hồ Dịch Vụ | Ốc, Tôm |
| fish_32 | Cá trôi mrigal | 0.15–0.5 → 0.5–2 → 2–5.9 → 5.9–8 | 6.4 | Ao Làng, Hồ Núi, Hồ Dịch Vụ | Mồi bột |
| fish_33 | Cá mè trắng Việt Nam | 0.2–0.6 → 0.6–2 → 2–3.95 → 3.95–5 | 4.7 | Sông Bãi Bồi, Hồ Núi | Mồi mây |
| fish_34 | Cá bống cát | 0.012–0.04 → 0.04–0.12 → 0.12–0.237 → 0.237–0.3 | 3.3 | Kênh Đồng, Cửa Sông | Tôm, Giun |
| fish_35 | Cá chẽm / vược | 0.2–0.8 → 0.8–4 → 4–17.65 → 17.65–25 | 8.6 | Cửa Sông, Ghềnh Biển, Kênh Miền Tây | Tôm, Cá mồi, Crankbait, Mồi mềm |
| fish_36 | Cá đối mục | 0.08–0.2 → 0.2–0.8 → 0.8–2.2300000000000004 → 2.2300000000000004–3 | 4.7 | Cửa Sông, Ghềnh Biển | Mồi bột |
| fish_37 | Cá mú chấm cam | 0.2–0.7 → 0.7–3 → 3–8.850000000000001 → 8.850000000000001–12 | 8.3 | Ghềnh Biển, Cửa Sông | Tôm, Mồi mềm, Thịt nghêu |
| fish_38 | Cá mú mè | 0.3–1 → 1–6 → 6–24.85 → 24.85–35 | 8.6 | Ghềnh Biển, Cửa Sông | Cá mồi, Tôm |
| fish_39 | Cá hồng bạc | 0.15–0.5 → 0.5–2.5 → 2.5–7.375 → 7.375–10 | 8.1 | Cửa Sông, Ghềnh Biển | Tôm, Crankbait |
| fish_40 | Cá hồng chấm đen | 0.08–0.2 → 0.2–0.7 → 0.7–1.545 → 1.545–2 | 6.7 | Ghềnh Biển, Cửa Sông | Tôm |
| fish_41 | Cá dìa chấm | 0.05–0.2 → 0.2–0.6 → 0.6–0.99 → 0.99–1.2 | 6.1 | Ghềnh Biển, Cửa Sông | Rong lá, Mồi bột |
| fish_42 | Cá dìa công | 0.06–0.25 → 0.25–0.8 → 0.8–1.4500000000000002 → 1.4500000000000002–1.8 | 6.1 | Ghềnh Biển, Cửa Sông | Rong lá, Mồi bột |
| fish_43 | Cá chim vây vàng | 0.1–0.4 → 0.4–1.5 → 1.5–2.735 → 2.735–3.4 | 6.7 | Ghềnh Biển | Tôm, Thìa kim loại |
| fish_44 | Cá tráp vây vàng | 0.08–0.2 → 0.2–0.7 → 0.7–1.22 → 1.22–1.5 | 6.1 | Cửa Sông, Ghềnh Biển | Tôm, Giun, Thịt nghêu |
| fish_45 | Cá tráp đen | 0.1–0.3 → 0.3–1 → 1–2.43 → 2.43–3.2 | 6.7 | Ghềnh Biển | Tôm, Thịt nghêu |
| fish_46 | Cá nhồng vàng | 0.06–0.15 → 0.15–0.5 → 0.5–0.955 → 0.955–1.2 | 7.2 | Ghềnh Biển | Crankbait, Thìa kim loại |
| fish_47 | Cá cháo lớn | 0.1–0.3 → 0.3–1.5 → 1.5–4.425000000000001 → 4.425000000000001–6 | 8.1 | Cửa Sông | Mồi mềm, Tôm, Cá mồi |
| fish_48 | Cá măng sữa | 0.2–0.7 → 0.7–3 → 3–6.25 → 6.25–8 | 7.2 | Cửa Sông | Mồi bột, Rong lá |
| fish_49 | Cá đù bạc | 0.05–0.15 → 0.15–0.4 → 0.4–0.79 → 0.79–1 | 5 | Ghềnh Biển | Tôm, Giun |
| fish_50 | Cá đục | 0.015–0.04 → 0.04–0.12 → 0.12–0.237 → 0.237–0.3 | 3.3 | Cửa Sông, Ghềnh Biển | Giun, Tôm |
| fish_51 | Cá sửu vàng | 0.3–1 → 1–6 → 6–24.85 → 24.85–35 | 8.9 | Cửa Sông, Ghềnh Biển | Cá mồi, Tôm |
| fish_52 | Tôm càng xanh | 0.012–0.03 → 0.03–0.12 → 0.12–0.20450000000000002 → 0.20450000000000002–0.25 | 1.9 | Kênh Miền Tây, Sông Bãi Bồi, Kênh Đồng, Ao Làng | Giun, Tôm, Thịt nghêu |
| fish_53 | Cua đồng | 0.006–0.012 → 0.012–0.03 → 0.03–0.0495 → 0.0495–0.06 | 1.7 | Ao Làng, Kênh Đồng, Kênh Miền Tây | Giun, Tôm, Thịt nghêu |
| fish_54 | Ba ba | 0.15–0.5 → 0.5–1.5 → 1.5–2.475 → 2.475–3 | 6.7 | Ao Làng, Kênh Đồng, Sông Bãi Bồi, Kênh Miền Tây | Cá mồi, Tôm, Giun, Thịt nghêu |
| fish_55 → fish_07 | Cá trắm cỏ | 0.2–1 → 1–5 → 5–21.25 → 21.25–30 | 8.1 | Ao Làng, Hồ Núi, Hồ Dịch Vụ, Lòng Đập | Rong lá, Ngô, Mồi bột |
| fish_56 | Cua biển | 0.08–0.2 → 0.2–0.6 → 0.6–0.99 → 0.99–1.2 | 3.3 | Cửa Sông | Thịt nghêu, Tôm, Cá mồi |
| fish_57 | Ếch đồng | 0.025–0.06 → 0.06–0.18 → 0.18–0.2905 → 0.2905–0.35 | 2.8 | Ao Làng, Kênh Đồng, Kênh Miền Tây | Dế, Giun |

## Nhận dạng và nguồn

### fish_01 — Cá chép

*Cyprinus carpio* · Hồ sơ loài

Thân dày, vảy lớn; miệng có hai đôi râu, vây lưng dài. Ao, hồ và sông chảy chậm; tìm bãi bùn và vùng trống gần thực vật. Thức ăn: Ăn tạp: sinh vật đáy, hạt và thực vật.

Quần thể ở Hồ Dịch Vụ là cá thả nuôi.

Nguồn: [FishBase](https://www.fishbase.se/summary/Cyprinus-carpio.html)

### fish_02 — Cá diếc

*Carassius auratus* · Định danh đại diện cần đối chiếu ảnh

Thân cao dẹp, bạc hoặc vàng xám; không có râu miệng. Ao, hồ, nước chậm và nhiều cây thủy sinh. Thức ăn: Sinh vật nhỏ, mùn hữu cơ và thực vật.

Tên diếc có thể chỉ nhiều loài Carassius; dùng dạng hoang màu bạc, không dùng cá vàng cảnh.

Nguồn: [FishBase](https://www.fishbase.se/summary/Carassius-auratus.html)

### fish_03 — Cá rô đồng

*Anabas testudineus* · Hồ sơ loài

Thân dẹp, vảy cứng; vây lưng gai, nắp mang có răng cưa. Ao, ruộng ngập và kênh nước ngọt, gần cỏ và vật trú. Thức ăn: Côn trùng, giáp xác nhỏ và một phần thực vật.

Có cơ quan hô hấp phụ; cá không cần liên tục nổi mặt để cắn mồi.

Nguồn: [FishBase](https://www.fishbase.se/summary/Anabas-testudineus.html)

### fish_04 — Cá lóc

*Channa striata* · Hồ sơ loài

Đầu dẹt như đầu rắn, miệng lớn; vây lưng dài, thân nâu có vân tối. Nước ngọt chậm, bờ cỏ, ao và kênh; phục kích gần chỗ trú. Thức ăn: Cá nhỏ, ếch, giáp xác và côn trùng.

Mồi cá/tôm cũng phù hợp với câu tự nhiên; lure cần được thu để kích thích đuổi.

Nguồn: [FishBase](https://www.fishbase.se/summary/Channa-striata.html)

### fish_05 — Cá trê vàng

*Clarias macrocephalus* · Hồ sơ loài

Đầu rộng, da trơn, bốn đôi râu; vây lưng và hậu môn kéo dài, đuôi tròn. Ao bùn, ruộng ngập, kênh chậm; sát đáy và vật trú. Thức ăn: Côn trùng thủy sinh, tôm và cá nhỏ.

Màu vàng nâu biến thiên; không mặc định mọi cá thể có da vàng tươi.

Nguồn: [FishBase](https://www.fishbase.se/summary/Clarias-macrocephalus.html)

### fish_06 — Cá rô phi vằn

*Oreochromis niloticus* · Hồ sơ loài

Thân cao dẹp; các vạch ngang rõ trên vây đuôi, vây lưng gai dài. Ao, hồ, kênh nước ngọt; đàn nhỏ gần bờ và vùng có thức ăn. Thức ăn: Tảo, thực vật, mùn và động vật nhỏ.

Dùng rô phi vằn; điêu hồng là dạng nuôi, không thêm một loài.

Nguồn: [FishBase](https://www.fishbase.se/summary/Oreochromis-niloticus.html)

### fish_07 — Cá trắm cỏ

*Ctenopharyngodon idella* · Hồ sơ loài

Thân thuôn, vảy lớn viền sẫm; miệng không râu, lưng xanh ô liu. Ao/hồ thả nuôi và hồ rộng, gần thảm thực vật. Thức ăn: Cỏ và cây thủy sinh; cá non ăn thêm động vật nhỏ.

fish_55 là ảnh thay thế của fish_07 theo lựa chọn người dùng; không tạo mục sưu tập thứ hai.

Nguồn: [FishBase](https://www.fishbase.se/summary/Ctenopharyngodon-idella.html)

### fish_08 — Cá mè trắng

*Hypophthalmichthys molitrix* · Hồ sơ loài

Bạc sáng, đầu nhỏ hơn mè hoa; mắt thấp, bụng có lườn kéo dài. Ao/hồ thả nuôi, tầng giữa đến tầng trên. Thức ăn: Lọc phiêu sinh, chủ yếu thực vật phù du.

Mồi mây là mô phỏng cụm thức ăn phân tán, không mô tả cá mè săn mồi.

Nguồn: [FishBase](https://www.fishbase.se/summary/Hypophthalmichthys-molitrix.html)

### fish_09 — Cá mè hoa

*Hypophthalmichthys nobilis* · Hồ sơ loài

Đầu lớn, mắt thấp; thân có mảng/đốm tối không đều. Ao và hồ thả nuôi; vùng nước rộng, tầng giữa. Thức ăn: Lọc phiêu sinh, thường nhiều động vật phù du hơn mè trắng.

Đốm và kích thước đầu giúp phân biệt với mè trắng.

Nguồn: [FishBase](https://www.fishbase.se/summary/Hypophthalmichthys-nobilis.html)

### fish_10 — Cá trôi (rohu)

*Labeo rohita* · Định danh đại diện cần đối chiếu ảnh

Thân thuôn, môi dày có nếp; vảy rõ, vây có thể ánh đỏ. Ao/hồ thả nuôi ở Việt Nam; tìm tầng thấp và đáy. Thức ăn: Thực vật, tảo, mùn và thức ăn tạp theo tuổi.

Tên cá trôi chung chưa đủ định danh; game chọn trôi rohu theo danh mục gốc.

Nguồn: [FishBase](https://www.fishbase.se/summary/Labeo-rohita.html)

### fish_11 — Cá sặc rằn

*Trichopodus pectoralis* · Hồ sơ loài

Thân dẹp, vân rằn/sọc xiên; vây bụng dạng hai sợi dài. Ruộng ngập, kênh và đầm nước ngọt nhiều thực vật. Thức ăn: Phiêu sinh, mùn, thực vật và động vật nhỏ.

Lưỡi nhỏ và mẩu mồi nhỏ; không dùng nhịp bo kéo dài.

Nguồn: [FishBase](https://www.fishbase.se/summary/Trichopodus-pectoralis.html)

### fish_12 — Cá sặc bướm

*Trichopodus trichopterus* · Hồ sơ loài

Thân dẹp, hai đốm tối ở thân và cuống đuôi; vây bụng dạng sợi. Kênh, ao nước chậm, vùng cây thủy sinh. Thức ăn: Động vật nhỏ, phiêu sinh và thực vật.

Ba chấm gồm hai đốm thân cộng mắt; tên Việt theo vùng.

Nguồn: [FishBase](https://www.fishbase.se/summary/Trichopodus-trichopterus.html)

### fish_13 — Cá trê đen

*Clarias fuscus* · Định danh đại diện cần đối chiếu ảnh

Da nâu đen, đầu dẹt, bốn đôi râu; đuôi tròn và hai vây dài. Ao, kênh và vùng nước chậm nước ngọt. Thức ăn: Giun, côn trùng, giáp xác và cá nhỏ.

Tên trê đen có thể chỉ trê khác theo vùng; chọn C. fuscus và giữ thành tích cũ.

Nguồn: [FishBase](https://www.fishbase.se/summary/Clarias-fuscus.html)

### fish_14 — Cá trê phi

*Clarias gariepinus* · Hồ sơ loài

Đầu lớn dẹt, da xám nâu loang, bốn đôi râu; thân dài. Hồ Dịch Vụ với quần thể thả nuôi. Thức ăn: Cá, giáp xác, côn trùng và nhiều thức ăn khác.

Loài du nhập; không cho xuất hiện tự do tại Ao Làng.

Nguồn: [FishBase](https://www.fishbase.se/summary/Clarias-gariepinus.html)

### fish_15 — Cá tra

*Pangasianodon hypophthalmus* · Hồ sơ loài

Da trơn, thân dài, đuôi chẻ; cá non có sọc, cá lớn thường xám. Sông/kênh Miền Tây; ở hồ là quần thể thả nuôi. Thức ăn: Ăn tạp, thay đổi theo tuổi; động vật, thực vật và thức ăn viên.

Mồi cám phù hợp quần thể đã quen thức ăn nuôi.

Nguồn: [FishBase](https://www.fishbase.se/summary/Pangasianodon-hypophthalmus.html)

### fish_16 — Cá basa

*Pangasius bocourti* · Hồ sơ loài

Thân mập, bụng dày, đầu tròn và mõm tù; đuôi chẻ, da trơn. Dòng sông lớn lưu vực Mekong, vùng sâu hoặc chảy chậm. Thức ăn: Động vật và thực vật, thức ăn tạp.

Đầu và thân mập giúp phân biệt với cá tra.

Nguồn: [FishBase](https://www.fishbase.se/summary/Pangasius-bocourti.html)

### fish_17 — Cá lăng đuôi đỏ

*Hemibagrus wyckioides* · Hồ sơ loài

Da trơn, râu dài; cá lớn có vây đuôi đỏ rõ, cá non đuôi nhạt. Sông và hồ lớn, vùng đáy sâu có dòng chảy. Thức ăn: Cá, tôm và động vật thủy sinh.

Map là môi trường đại diện, không khẳng định có mặt ở mọi sông Việt Nam.

Nguồn: [FishBase](https://www.fishbase.se/summary/Hemibagrus-wyckioides.html)

### fish_18 — Cá bỗng

*Spinibarbus denticulatus* · Định danh đại diện cần đối chiếu ảnh

Thân thuôn, vảy lớn, râu ngắn; có gai hướng trước ở đầu vây lưng. Sông/suối miền Bắc, hố sâu và dòng chảy sạch. Thức ăn: Thực vật, quả và động vật nhỏ tùy quần thể.

Định danh cá bỗng theo vùng cần đối chiếu; cỡ 8 kg là trần mô phỏng, không phải kỷ lục đã xác nhận.

Nguồn: [FishBase](https://www.fishbase.se/summary/Spinibarbus-denticulatus.html)

### fish_19 — Cá chiên

*Bagarius rutilus* · Định danh đại diện cần đối chiếu ảnh

Đầu rộng dẹt, miệng lớn, râu; thân nâu loang, vây ngực khỏe. Sông miền Bắc và lòng đập; đáy đá, khe dòng chảy. Thức ăn: Cá và động vật đáy.

Tên cá chiên gồm nhiều Bagarius; dùng B. rutilus đại diện theo nghiên cứu Việt Nam, không khẳng định ảnh đã được định danh.

Nguồn: [Nghiên cứu cá chiên Việt Nam](https://tapchikhoahoc.nnmt.net.vn/index.php/vjae/article/view/955)

### fish_20 — Cá ngạnh

*Cranoglanis bouderius* · Định danh đại diện cần đối chiếu ảnh

Da trơn, đầu có tấm xương cứng, râu; vây ngực/lưng có gai. Sông nước ngọt miền Bắc, đáy bùn/cát. Thức ăn: Động vật đáy, côn trùng, tôm và cá nhỏ.

Tên ngạnh là tên địa phương; định danh đại diện theo danh mục gốc.

Nguồn: [FishBase](https://www.fishbase.se/summary/Cranoglanis-bouderius.html)

### fish_21 — Cá nheo

*Silurus asotus* · Hồ sơ loài

Vây lưng rất nhỏ, hậu môn rất dài; một đôi râu hàm trên nổi bật. Sông/hồ nước ngọt, đáy sâu và vùng nước chậm. Thức ăn: Cá và động vật thủy sinh.

Không gộp nheo với mọi loài cá da trơn khác.

Nguồn: [FishBase](https://www.fishbase.se/summary/Silurus-asotus.html)

### fish_22 — Cá lóc bông

*Channa micropeltes* · Hồ sơ loài

Miệng lớn; cá lớn có dải tối, cá non thường có dải cam giữa hai sọc đen. Hồ, đầm và kênh Miền Tây; vùng sâu gần vật trú. Thức ăn: Cá và động vật thủy sinh.

Lure nổi dùng sát chỗ trú, crank dùng vùng nước thoáng.

Nguồn: [FishBase](https://www.fishbase.se/summary/Channa-micropeltes.html)

### fish_23 — Cá thát lát

*Notopterus notopterus* · Hồ sơ loài

Thân dẹp như lưỡi dao; hậu môn dài nối đuôi, không có hàng đốm mắt cườm. Kênh và vùng nước chậm nước ngọt; tầng thấp đến giữa. Thức ăn: Côn trùng, giáp xác và cá nhỏ.

Bạc/xám hoặc ánh đồng tùy cá thể và ánh sáng; không ép mọi cá thể thành nâu.

Nguồn: [FishBase](https://www.fishbase.se/summary/Notopterus-notopterus.html)

### fish_24 — Cá thát lát cườm

*Chitala ornata* · Hồ sơ loài

Lưng cong cao, thân dạng dao; hàng đốm mắt có viền sáng trên vây hậu môn. Sông chậm, hồ và kênh lưu vực Mekong. Thức ăn: Cá nhỏ, tôm và côn trùng thủy sinh.

Đốm cườm phân biệt với thát lát thường.

Nguồn: [FishBase](https://www.fishbase.se/summary/Chitala-ornata.html)

### fish_25 — Cá bống tượng

*Oxyeleotris marmorata* · Hồ sơ loài

Đầu to, thân nâu vân cẩm thạch; hai vây lưng tách nhau. Kênh, sông và ao nước ngọt; đáy có vật trú. Thức ăn: Cá, tôm, cua và động vật nhỏ.

Phục kích sát đáy; ưu tiên mồi tự nhiên.

Nguồn: [FishBase](https://www.fishbase.se/summary/Oxyeleotris-marmorata.html)

### fish_26 — Cá bống kèo

*Pseudapocryptes elongatus* · Hồ sơ loài

Thân nhỏ dài, đầu tù, da/vảy nhỏ; sống gần bùn ở vùng triều. Bãi bùn cửa sông, vùng hạ lưu chịu ảnh hưởng mặn. Thức ăn: Tảo, mùn và sinh vật nhỏ.

MT đại diện phần hạ lưu có xâm nhập mặn; không xem toàn kênh Miền Tây là nước mặn.

Nguồn: [FishBase](https://www.fishbase.se/summary/Pseudapocryptes-elongatus.html)

### fish_27 — Cá chạch bùn

*Misgurnus anguillicaudatus* · Định danh đại diện cần đối chiếu ảnh

Thân dài, râu nhỏ quanh miệng, hoa văn nâu; vây lưng ngắn, đuôi tròn. Ao bùn, ruộng ngập và kênh nước ngọt. Thức ăn: Giun, ấu trùng và động vật đáy nhỏ.

Dùng loài đại diện; chạch địa phương cần đối chiếu ảnh.

Nguồn: [FishBase](https://www.fishbase.se/summary/Misgurnus-anguillicaudatus.html)

### fish_28 — Cá chạch lấu

*Mastacembelus favus* · Định danh đại diện cần đối chiếu ảnh

Thân dài như lươn nhưng có gai lưng; mõm nhọn, vân lưới nâu. Sông/kênh, đáy cát sỏi và vùng có chỗ chui trú. Thức ăn: Giun, ấu trùng côn trùng và động vật đáy.

Chạch lấu không phải lươn; tên đại diện cần đối chiếu ảnh địa phương.

Nguồn: [FishBase](https://www.fishbase.se/summary/Mastacembelus-favus.html)

### fish_29 — Cá chày mắt đỏ

*Squaliobarbus curriculus* · Hồ sơ loài

Thân thuôn bạc, mắt có vành đỏ; vây có thể ánh đỏ. Sông và suối miền Bắc, tầng giữa dòng chảy. Thức ăn: Ăn tạp: thực vật và động vật nhỏ.

Định danh theo tên chày mắt đỏ trong danh mục gốc.

Nguồn: [FishBase](https://www.fishbase.se/summary/Squaliobarbus-curriculus.html)

### fish_30 — Cá mè vinh

*Barbonymus gonionotus* · Hồ sơ loài

Thân cao bạc, đầu nhỏ; vây bụng/hậu môn ánh cam đỏ. Kênh và sông Miền Tây, vùng ngập và nước chậm. Thức ăn: Thực vật, tảo và thức ăn tạp.

Không phải nhóm mè trắng lọc phiêu sinh.

Nguồn: [FishBase](https://www.fishbase.se/summary/Barbonymus-gonionotus.html)

### fish_31 — Cá trắm đen

*Mylopharyngodon piceus* · Hồ sơ loài

Thân dài, vảy sẫm, vây đen; đầu và miệng khỏe, không có râu. Ao/hồ thả nuôi, tìm vùng đáy có ốc và nhuyễn thể. Thức ăn: Nhuyễn thể, đặc biệt ốc và trai.

Ưu tiên mồi ốc; giới hạn game thấp hơn các mẫu cực lớn ngoài tự nhiên.

Nguồn: [FishBase](https://www.fishbase.se/summary/Mylopharyngodon-piceus.html)

### fish_32 — Cá trôi mrigal

*Cirrhinus cirrhosus* · Định danh đại diện cần đối chiếu ảnh

Thân bạc thuôn, đầu nhỏ, môi không dày như rohu. Ao/hồ thả nuôi; kiếm thức ăn sát đáy. Thức ăn: Mùn hữu cơ, thực vật và sinh vật đáy.

C. mrigala và C. cirrhosus có khác biệt xử lý giữa tài liệu; giữ tên của danh mục gốc, ghi rõ ứng viên.

Nguồn: [FishBase](https://www.fishbase.se/summary/Cirrhinus-cirrhosus.html)

### fish_33 — Cá mè trắng Việt Nam

*Hypophthalmichthys harmandi* · Định danh đại diện cần đối chiếu ảnh

Thân bạc dẹp, mắt thấp như nhóm mè; khó phân biệt chắc chắn chỉ bằng ảnh. Sông/hồ nước ngọt Việt Nam, tầng giữa. Thức ăn: Lọc phiêu sinh; mồi mây là cơ chế cụm thức ăn trong game.

Không tuyên bố định danh chỉ từ màu bạc; cần mẫu/hình rõ để phân biệt H. molitrix.

Nguồn: [FishBase](https://www.fishbase.se/summary/Hypophthalmichthys-harmandi.html)

### fish_34 — Cá bống cát

*Glossogobius giuris* · Định danh đại diện cần đối chiếu ảnh

Đầu dẹt, miệng lớn, hai vây lưng; thân có vệt nâu, thường nằm đáy. Kênh, sông và cửa sông, đáy cát/bùn. Thức ăn: Cá nhỏ, giáp xác và ấu trùng.

Bống cát là tên dùng cho nhiều loài; chọn loài đại diện theo danh mục.

Nguồn: [FishBase](https://www.fishbase.se/summary/Glossogobius-giuris.html)

### fish_35 — Cá chẽm / vược

*Lates calcarifer* · Hồ sơ loài

Thân bạc, miệng lớn với hàm dưới nhô; vây lưng hai phần, đuôi tròn. Cửa sông, ven biển và hạ lưu có kết nối nước lợ. Thức ăn: Cá và giáp xác.

MT đại diện vùng hạ lưu; cá chịu được dải mặn rộng.

Nguồn: [FishBase](https://www.fishbase.se/summary/Lates-calcarifer.html)

### fish_36 — Cá đối mục

*Mugil cephalus* · Hồ sơ loài

Đầu tù, thân bạc thuôn, hai vây lưng cách xa; miệng nhỏ. Cửa sông, ven biển và vùng nước lợ. Thức ăn: Mùn, tảo và sinh vật nhỏ trong nền đáy.

Dùng mồi bột nhỏ, không mô tả cá đối là loài săn cá.

Nguồn: [FishBase](https://www.fishbase.se/summary/Mugil-cephalus.html)

### fish_37 — Cá mú chấm cam

*Epinephelus coioides* · Hồ sơ loài

Miệng lớn; nhiều đốm cam/nâu đỏ, thân có mảng tối. Cửa sông và ghềnh biển; gần đá, hốc và vật trú. Thức ăn: Cá, tôm và cua.

Có xu hướng ghì về chỗ trú trong mô phỏng.

Nguồn: [FishBase](https://www.fishbase.se/summary/Epinephelus-coioides.html)

### fish_38 — Cá mú mè

*Epinephelus malabaricus* · Định danh đại diện cần đối chiếu ảnh

Đầu/miệng lớn, đốm nhỏ sẫm và mảng loang; thường không có đốm cam đồng đều. Ghềnh biển, cửa sông và đáy có vật trú. Thức ăn: Cá, giáp xác và chân đầu.

Mú mè có nhiều tên theo vùng; game chọn mú Malabar đại diện.

Nguồn: [FishBase](https://www.fishbase.se/summary/Epinephelus-malabaricus.html)

### fish_39 — Cá hồng bạc

*Lutjanus argentimaculatus* · Hồ sơ loài

Thân khỏe, miệng có răng nanh; màu đồng đỏ đến nâu, cá non có vạch. Cửa sông/rừng ngập mặn lúc nhỏ; biển và rạn khi lớn. Thức ăn: Cá và giáp xác.

Tên hồng bạc không có nghĩa da luôn bạc trắng.

Nguồn: [FishBase](https://www.fishbase.se/summary/Lutjanus-argentimaculatus.html)

### fish_40 — Cá hồng chấm đen

*Lutjanus russellii* · Định danh đại diện cần đối chiếu ảnh

Đốm đen ở lưng thân; cá non thường có sọc, miệng có răng nanh. Cửa sông và ghềnh biển, vùng đá/vật trú. Thức ăn: Cá và giáp xác.

Dùng loài đại diện theo danh mục.

Nguồn: [FishBase](https://www.fishbase.se/summary/Lutjanus-russellii.html)

### fish_41 — Cá dìa chấm

*Siganus guttatus* · Hồ sơ loài

Thân dẹp có đốm vàng cam, đốm vàng lớn gần cuối lưng; vây gai. Cửa sông và ven biển, vùng có tảo/cỏ biển. Thức ăn: Chủ yếu tảo và thực vật thủy sinh.

Gai vây có độc; phần mô phỏng chỉ thể hiện lực kéo.

Nguồn: [FishBase](https://www.fishbase.se/summary/Siganus-guttatus.html)

### fish_42 — Cá dìa công

*Siganus javus* · Định danh đại diện cần đối chiếu ảnh

Thân dẹp; chấm nhỏ phía trên và sọc uốn ngang ở phần dưới thân. Ven biển, vịnh và vùng tảo, nước lợ có thể xuất hiện. Thức ăn: Tảo và thực vật thủy sinh.

Tên dìa công thay đổi theo vùng; giữ ứng viên trong danh mục.

Nguồn: [FishBase](https://www.fishbase.se/summary/Siganus-javus.html)

### fish_43 — Cá chim vây vàng

*Trachinotus blochii* · Hồ sơ loài

Thân cao dẹp bạc, vây ánh vàng; đuôi chẻ sâu, vây lưng/hậu môn dạng liềm. Ven biển nước thoáng, bãi cát và vùng gần rạn. Thức ăn: Giáp xác, nhuyễn thể và sinh vật nhỏ.

Khác cá chim trắng nước ngọt.

Nguồn: [FishBase](https://www.fishbase.se/summary/Trachinotus-blochii.html)

### fish_44 — Cá tráp vây vàng

*Acanthopagrus latus* · Định danh đại diện cần đối chiếu ảnh

Thân bạc dẹp, vây bụng/hậu môn vàng; hàm có răng nghiền. Cửa sông và ven biển, đáy cát/bùn có nhuyễn thể. Thức ăn: Giáp xác, nhuyễn thể và động vật đáy.

Họ tráp cần đối chiếu vùng biển; A. latus là loài đại diện.

Nguồn: [FishBase](https://www.fishbase.se/summary/Acanthopagrus-latus.html)

### fish_45 — Cá tráp đen

*Acanthopagrus schlegelii* · Định danh đại diện cần đối chiếu ảnh

Thân bạc xám sẫm, vây tối; lưng gai, hàm có răng nghiền. Ven biển, đáy cát/đá và vùng nước lợ; đại diện vùng phía Bắc. Thức ăn: Nhuyễn thể, giáp xác và động vật đáy.

Không khẳng định có ở mọi ghềnh biển Việt Nam.

Nguồn: [FishBase](https://www.fishbase.se/summary/Acanthopagrus-schlegelii.html)

### fish_46 — Cá nhồng vàng

*Sphyraena obtusata* · Định danh đại diện cần đối chiếu ảnh

Thân dài bạc, hàm có răng nhọn; hai vây lưng cách xa, đuôi chẻ. Ven biển nước thoáng và gần thảm cỏ biển. Thức ăn: Cá nhỏ và một phần giáp xác.

Nhồng vàng là tên địa phương; chọn S. obtusata trong danh mục gốc.

Nguồn: [FishBase](https://www.fishbase.se/summary/Sphyraena-obtusata.html)

### fish_47 — Cá cháo lớn

*Megalops cyprinoides* · Hồ sơ loài

Vảy bạc lớn, mắt to, hàm dưới nhô; tia cuối vây lưng kéo thành sợi. Cửa sông và vùng nước lợ kết nối sông/biển. Thức ăn: Cá và giáp xác.

Nhịp đổi hướng nhanh và bứt ngắn; không cần hiệu ứng nhảy mới để dùng dữ liệu.

Nguồn: [FishBase](https://www.fishbase.se/summary/Megalops-cyprinoides.html)

### fish_48 — Cá măng sữa

*Chanos chanos* · Hồ sơ loài

Thân bạc thuôn, miệng nhỏ không răng, một vây lưng; đuôi chẻ sâu. Cửa sông, đầm nước lợ và vùng ven biển. Thức ăn: Tảo, mùn và sinh vật nhỏ.

Không phải cá măng săn mồi nước ngọt.

Nguồn: [FishBase](https://www.fishbase.se/summary/Chanos-chanos.html)

### fish_49 — Cá đù bạc

*Pennahia argentata* · Định danh đại diện cần đối chiếu ảnh

Thân bạc thuôn, vây lưng phần gai và mềm nối nhau; miệng hơi chếch. Ven biển, đáy cát/bùn. Thức ăn: Tôm, giáp xác và cá nhỏ.

Đù bạc có tên địa phương trùng nhau; dùng Pennahia argentata đại diện.

Nguồn: [FishBase](https://www.fishbase.se/summary/Pennahia-argentata.html)

### fish_50 — Cá đục

*Sillago sihama* · Hồ sơ loài

Thân bạc dài, mõm nhọn, miệng nhỏ; hai vây lưng, sống bãi cát. Bãi cát ven biển và cửa sông. Thức ăn: Giun nhiều tơ, tôm và giáp xác nhỏ.

Giun trong game đại diện nhóm mồi giun, không khẳng định giun đất tương đương mọi mồi biển.

Nguồn: [FishBase](https://www.fishbase.se/summary/Sillago-sihama.html)

### fish_51 — Cá sửu vàng

*Otolithoides biauritus* · Định danh đại diện cần đối chiếu ảnh

Thân dài ánh đồng/vàng, đầu và miệng lớn; vây lưng mềm dài. Biển và cửa sông nước lợ; vùng đáy bùn/cát sâu. Thức ăn: Cá và giáp xác.

Người dùng chọn cá sửu biển/sửu vàng; game dùng O. biauritus, không dùng sửu nước ngọt.

Nguồn: [FishBase](https://www.fishbase.se/summary/Otolithoides-biauritus.html)

### fish_52 — Tôm càng xanh

*Macrobrachium rosenbergii* · Định danh đại diện cần đối chiếu ảnh

Thân phân đốt, chủy có răng, râu dài; tôm đực lớn có đôi càng dài xanh. Sông, kênh và ao nước ngọt; ấu trùng cần nước lợ. Thức ăn: Ăn tạp: giun, động vật đáy, mùn và thức ăn động vật.

Tên tôm chưa có ảnh để xác minh; chọn tôm càng xanh đại diện cho câu lưỡi.

Nguồn: [FAO – tôm càng xanh](https://www.fao.org/4/ac741t/ac741t01.htm) · [USFWS – kích thước tôm càng xanh](https://www.fws.gov/sites/default/files/documents/Ecological-Risk-Screening-Summary-Giant-River-Prawn.pdf)

### fish_53 — Cua đồng

*Somanniathelphusa sinensis* · Định danh đại diện cần đối chiếu ảnh

Mai nâu rộng, hai càng và bốn đôi chân bò; không có chân bơi dạng mái chèo. Ruộng ngập, ao và kênh nước ngọt; bờ bùn, gốc cỏ. Thức ăn: Động vật nhỏ, xác hữu cơ và thực vật.

Cua đồng là nhóm nhiều loài; S. sinensis là đại diện, cỡ đo là rộng mai.

Nguồn: [Đại học Nha Trang – cua đồng](https://www.researchgate.net/publication/330279406)

### fish_54 — Ba ba

*Pelodiscus sinensis* · Định danh đại diện cần đối chiếu ảnh

Mai dẹt mềm phủ da, cổ dài, mõm dạng ống; chân có màng bơi. Ao, kênh, sông nước ngọt, đáy bùn/cát. Thức ăn: Cá, giáp xác, nhuyễn thể và động vật nhỏ.

Chọn ba ba trơn đại diện; cỡ đo là dài mai, không gồm đầu/cổ.

Nguồn: [Đại học Hong Kong – ba ba](https://www.biosch.hku.hk/ecology/hkreptiles/turtle/Pelodiscus_sinensis.html)

### fish_56 — Cua biển

*Scylla paramamosain* · Định danh đại diện cần đối chiếu ảnh

Mai rộng có răng cạnh, càng to; đôi chân cuối dẹt dạng mái chèo. Cửa sông nước lợ, bùn ven rừng ngập mặn. Thức ăn: Nhuyễn thể, giáp xác, cá và xác hữu cơ.

Cua biển là tên chung; chọn cua bùn S. paramamosain theo nghiên cứu Việt Nam, không gọi là ghẹ.

Nguồn: [Đại học Cần Thơ – cua biển](https://ctujsvn.ctu.edu.vn/index.php/ctujsvn/article/view/2889)

### fish_57 — Ếch đồng

*Hoplobatrachus rugulosus* · Định danh đại diện cần đối chiếu ảnh

Thân chắc, da nâu/ô liu có vân sẫm và nếp dọc; chân sau dài khỏe. Bờ ao, ruộng ngập và kênh nước ngọt; mép nước nông. Thức ăn: Côn trùng, giun và động vật nhỏ.

Người dùng chọn ếch đồng; không nhập chàng hiu/nhái cây vào loài này. Cỡ đo mõm–hậu môn.

Nguồn: [AmphibiaWeb](https://amphibiaweb.org/cgi/amphib_query?account=iucn&where-genus=Hoplobatrachus&where-species=rugulosus)
