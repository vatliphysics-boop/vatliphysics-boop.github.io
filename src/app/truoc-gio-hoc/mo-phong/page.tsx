/**
 * Giai đoạn 1 — Trước giờ học
 * Hoạt động 1.2: Mô phỏng tương tác trực tuyến — Phòng trực quan 3D
 */

import { PhaseActivityPage } from "@/components/learning/PhaseActivityPage";
import Link from "next/link";

export const metadata = {
  title: "Mô phỏng tương tác trực tuyến | Vật lí hạt nhân",
  description: "Phòng trực quan 3D để khám phá hạt nhân và thí nghiệm từng bài.",
};

export default function MoPhongPage() {
  return (
    <PhaseActivityPage
      phase="before"
      activityNo="1.2"
      title="Mô phỏng tương tác trực tuyến"
      goal="Thao tác trên mô hình 3D để quan sát cấu trúc hạt nhân và hiện tượng theo từng bài."
      product="Ghi lại một quan sát em thấy khác với dự đoán ban đầu."
      limits={
        <>
          <strong>Giới hạn mô hình:</strong> hình 3D dùng kích thước và khoảng cách
          quy ước để dễ quan sát, không phải ảnh thật của hạt nhân. Số hạt, tỉ lệ và
          tốc độ trong mô phỏng là lựa chọn sư phạm, không phải số đo thí nghiệm.
        </>
      }
    >
      <div style={{ marginTop: "24px", display: "grid", gap: "24px" }}>
        <p style={{ fontSize: "15px", lineHeight: 1.65, color: "var(--text-secondary)" }}>
          Các mô phỏng 3D dưới đây cho phép em:
        </p>
        <ul style={{ fontSize: "15px", lineHeight: 1.8, color: "var(--text-secondary)", paddingLeft: "24px" }}>
          <li>Quan sát cấu trúc hạt nhân từ nhiều góc độ</li>
          <li>Thay đổi góc nhìn bằng chuột hoặc cảm ứng</li>
          <li>Kiểm tra kích thước và thành phần hạt nhân</li>
          <li>Ghi lại quan sát để so sánh với dự đoán ban đầu</li>
        </ul>

        <div style={{ marginTop: "32px", padding: "20px", background: "var(--bg-surface-elevated)", borderRadius: "8px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Các bài mô phỏng 3D</h3>
          <ul style={{ margin: 0, paddingLeft: "24px", display: "grid", gap: "8px" }}>
            <li>
              <Link href="/hoc-lieu/truc-quan?bai=B21" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                B21 — Cấu trúc hạt nhân (tán xạ alpha)
              </Link>
            </li>
            <li>
              <Link href="/hoc-lieu/truc-quan?bai=B22" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                B22 — Phản ứng hạt nhân và năng lượng liên kết
              </Link>
            </li>
            <li>
              <Link href="/hoc-lieu/truc-quan?bai=B23" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                B23 — Phóng xạ và bán rã
              </Link>
            </li>
            <li>
              <Link href="/hoc-lieu/truc-quan?bai=B24" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                B24 — Công nghiệp hạt nhân
              </Link>
            </li>
            <li>
              <Link href="/hoc-lieu/truc-quan?bai=B25" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                B25 — Ôn tập và phân tích số liệu
              </Link>
            </li>
          </ul>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "24px" }}>
          💡 <strong>Gợi ý:</strong> Dành 15–20 phút để khám phá mô phỏng. Ghi lại những gì em nhận thấy về hạt nhân và hỏi giáo viên những điều chưa hiểu.
        </p>
      </div>
    </PhaseActivityPage>
  );
}
