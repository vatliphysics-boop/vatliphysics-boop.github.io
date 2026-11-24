# Học liệu số Vật lí 12 — Chương IV: Vật lí hạt nhân (Lớp học đảo ngược 3 pha)

Trang trải nghiệm trực tuyến và mã nguồn ứng dụng web phục vụ đọc duyệt, kiểm chứng thiết kế học liệu số kết nối **Dự đoán – Quan sát – Giải thích** từ **Bài 21 đến Bài 25** (Chương IV – *Vật lí hạt nhân*, sách giáo khoa *Vật lí 12* bộ *Kết nối tri thức với cuộc sống*).

## 1. Đường dẫn trải nghiệm trực tiếp (không cần đăng nhập)

- **Trang chủ & Mô hình hạt nhân 3D:** https://vatliphysics-boop.github.io/
- **Kho học liệu Chương IV (89 học liệu & thẻ Bài 21–25):** https://vatliphysics-boop.github.io/hoc-lieu/
- **Trường hợp Bài 21 (Khóa dự đoán Pha 1 & tách Lớp 1 – Lớp 2 tán xạ Rutherford V3):**
  - Toàn bài (bắt đầu từ Pha 1, tiến độ `0/6`): https://vatliphysics-boop.github.io/hoc-lieu/truc-quan/?bai=B21
  - Mở thẳng mô phỏng Rutherford V3 (`Hình 1` trong bài báo): https://vatliphysics-boop.github.io/hoc-lieu/truc-quan/?bai=B21&muc=b21-rutherford-v3
- **Trường hợp Bài 25 (Xử lí số liệu từ Bảng 25.1 SGK & nội suy tuyến tính `T = 39,5 s` — `Hình 2` trong bài báo):**
  - https://vatliphysics-boop.github.io/hoc-lieu/truc-quan/?bai=B25&muc=b25-table-25-1
- **Các bài còn lại của Chương IV:**
  - Bài 22 (*Phản ứng hạt nhân & năng lượng liên kết*): https://vatliphysics-boop.github.io/hoc-lieu/truc-quan/?bai=B22
  - Bài 23 (*Hiện tượng phóng xạ*): https://vatliphysics-boop.github.io/hoc-lieu/truc-quan/?bai=B23
  - Bài 24 (*Công nghiệp hạt nhân*): https://vatliphysics-boop.github.io/hoc-lieu/truc-quan/?bai=B24
- **Chế độ Giáo viên & Chuẩn bị bài dạy:**
  - Chế độ Giáo viên ngay trên bài học: https://vatliphysics-boop.github.io/hoc-lieu/truc-quan/?bai=B21&che-do=giao-vien
  - Bàn soạn Kế hoạch bài dạy theo Công văn 5512: https://vatliphysics-boop.github.io/hoc-lieu/soan-ke-hoach/
  - Ngân hàng 213 câu hỏi Chương IV & Xuất Word công thức OMML: https://vatliphysics-boop.github.io/hoc-lieu/ai-giao-vien/

## 2. Cấu trúc mã nguồn chính để đối chiếu

- `src/simulations-v3/physics/rutherford-engine.ts`: Hàm vật lí giải tích tán xạ Coulomb cổ điển (`createRutherfordRun`, hằng số CODATA 2022).
- `src/simulations-v3/apparatus/rutherford/`: Bộ thiết bị 3D Rutherford V3 (`R, D, S, M, G, P`), công tắc tách `Lớp 1` (tín hiệu do mô phỏng sinh ra trên màn `S`, cửa sổ đếm quy ước `Δt = 10 s` trong `parts.ts`) với `Lớp 2` (quỹ đạo Coulomb) và bộ kiểm tra cố định biến `evaluateRutherfordInquiry` (`inquiry.ts`).
- `src/lib/sgk-b25-decay.ts` & `src/components/physics/B25DataProcessLab.tsx`: Dữ liệu gốc `Bảng 25.1` SGK, hàm xác định khoảng kẹp `30–60 s` quanh `H₀/2 = 75,5 Bq`, nội suy tuyến tính `T = 39,5 s` và dung sai chấm nội bộ `38–46 s`.
- `src/lib/chapter4-lessons.ts` & `src/components/learning/VisualLearningStudio.tsx`: Cấu trúc sổ tay ba pha lưu dự đoán gốc (`recordPreClassPrediction`) và luồng tùy biến bài dạy của giáo viên đồng bộ sang khung Công văn 5512.
- `tests/`: Bộ kiểm thử tự động cho mô hình vật lí, câu hỏi và quy tắc sư phạm.

## 3. Chạy cục bộ từ mã nguồn

```bash
npm install
npm run dev
```
