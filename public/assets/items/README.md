# Quy uoc anh vat pham

- Moi vat pham dung mot anh WebP nen trong suot, dung chung cho cua hang, tui do, kho, chi tiet.
- File: tieng Viet khong dau, chu thuong, kebab-case; khong doi ID du lieu.
- Thu muc: public/assets/items/<category>/<filename>.webp
- Khong ap dung cho map, video, animation.
- Khi chua co anh: giao dien phai hien placeholder, khong lam loi trang.

## Cuoc (da chot ten)

| Vat pham | Duong dan |
| --- | --- |
| Soi chi cua vo | public/assets/items/lines/chi-cua-vo.webp |
| Nylon | public/assets/items/lines/cuoc-nylon.webp |
| PE | public/assets/items/lines/cuoc-pe.webp |
| Co-polymer | public/assets/items/lines/cuoc-copolymer.webp |
| Fluorocarbon | public/assets/items/lines/cuoc-fluorocarbon.webp |
| Thien To — Huyen Vu | public/assets/items/lines/thien-to-huyen-vu.webp |

## Nhom danh muc du kien

- rods: can cau
- reels: may cau
- hooks: luoi cau
- floats: phao
- baits: moi cau
- bags: tui do cau
- accessories: phu kien khac

**Chua kiem ke duoc day du catalog hien tai**: khong tu suy dien ten file cho cac vat pham chua xac minh. Khi tich hop, can map tu ID hien co sang file path va kiem thu UI cu.

## Cach upload

1. Chuyen PNG sang WebP va giu alpha.
2. Tren GitHub vao public/assets/items/lines/ va upload 6 anh dung ten bang tren.
3. Neu GitHub chua hien thu muc lines (Git khong luu thu muc rong), tao thu muc bang cach upload file theo dung duong dan hoac them file .gitkeep.
4. Tranh upload anh detail va icon rieng.
