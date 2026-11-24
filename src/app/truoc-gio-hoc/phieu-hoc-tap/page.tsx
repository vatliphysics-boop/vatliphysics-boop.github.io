/**
 * Giai đoạn 1 — Trước giờ học
 * Hoạt động 1.4: Phiếu học tập số
 */

import { PhaseActivityPage } from "@/components/learning/PhaseActivityPage";
import Link from "next/link";

export const metadata = {
  title: "Phiếu học tập số | Vật lí hạt nhân",
  description: "Phiếu học tập PDF để chuẩn bị trước giờ học.",
};

export default function PhieuHocTapPage() {
  const worksheets = [
    { code: "B21", title: "Cấu trúc hạt nhân", url: "/learning/B21-worksheet.pdf" },
    { code: "B22", title: "Phản ứng hạt nhân & năng lượng liên kết", url: "/learning/B22-worksheet.pdf" },
    { code: "B23", title: "Phóng xạ & bán rã", url: "/learning/B23-worksheet.pdf" },
    { code: "B24", title: "Công nghiệp hạt nhân", url: "/learning/B24-worksheet.pdf" },
    { code: "B25", title: "Ôn tập và phân tích số liệu", url: "/learning/B25-worksheet.pdf" },
  ];

  return (
    <PhaseActivityPage
      phase="before"
      activityNo="1.4"
      title="Phiếu học tập số"
      goal="Điền phiếu để ghi dự đoán, lí do, quan sát và câu hỏi trước khi đến lớp."
      product="Phiếu đã điền (bản giấy hoặc bản số) với phần dự đoán và câu hỏi chưa rõ."
    >
      <div style={{ marginTop: "24px", display: "grid", gap: "24px" }}>
        <p style={{ fontSize: "15px", lineHeight: 1.65, color: "var(--text-secondary)" }}>
          Mỗi phiếu học tập giúp em:
        </p>
        <ul style={{ fontSize: "15px", lineHeight: 1.8, color: "var(--text-secondary)", paddingLeft: "24px" }}>
          <li>Ghi lại dự đoán trước khi xem video hoặc mô phỏng</li>
          <li>Viết lí do cho dự đoán của em</li>
          <li>Lưu lại quan sát và dữ liệu</li>
          <li>Ghi câu hỏi hoặc điều chưa rõ</li>
        </ul>

        <div style={{ marginTop: "32px", padding: "20px", background: "var(--bg-surface-elevated)", borderRadius: "8px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Phiếu theo từng bài</h3>
          <ul style={{ margin: 0, paddingLeft: "24px", display: "grid", gap: "12px" }}>
            {worksheets.map((ws) => (
              <li key={ws.code}>
                <Link
                  href={ws.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--color-primary)", textDecoration: "none" }}
                >
                  {ws.code} — {ws.title}
                </Link>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}> (PDF)</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: "24px", padding: "16px", background: "var(--semantic-warning-soft)", borderRadius: "8px", fontSize: "13px", color: "var(--semantic-warning)" }}>
          💡 <strong>Cách sử dụng:</strong> Tải PDF, in ra, hoặc điền trực tuyến bằng ứng dụng soạn thảo. Nộp phiếu hoàn thành cho giáo viên thông qua lớp học.
        </div>
      </div>
    </PhaseActivityPage>
  );
}
