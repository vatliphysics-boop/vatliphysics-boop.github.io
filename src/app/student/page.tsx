import Link from "next/link";
import { PublicShell } from "@/app/PublicShell";

export default function StaticReviewNoticePage() {
  return (
    <PublicShell>
      <main style={{ maxWidth: "820px", margin: "48px auto", padding: "32px 24px" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "12px",
            padding: "28px",
            boxShadow: "0 4px 16px rgba(15, 23, 42, 0.05)",
          }}
        >
          <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#2563eb", margin: "0 0 8px" }}>
            Phiên bản trực tuyến phục vụ đọc duyệt & thẩm định chuyên môn
          </p>
          <h1 style={{ fontSize: "24px", margin: "0 0 12px" }}>
            Mở trực tiếp toàn bộ học liệu Chương IV (Bài 21–25) không cần tài khoản
          </h1>
          <p style={{ lineHeight: 1.7, color: "#334155", marginBottom: "20px" }}>
            Bản triển khai trực tuyến này mở sẵn toàn bộ kho học liệu, mô phỏng tương tác 3D Bài 21–25 theo tiến trình
            ba pha (Dự đoán – Quan sát – Giải thích), Chế độ Giáo viên, Bàn soạn kế hoạch bài dạy Công văn 5512 và Ngân
            hàng 213 câu hỏi xuất Word công thức OMML để giảng viên hướng dẫn và chuyên gia kiểm tra trực tiếp trên trình
            duyệt (dữ liệu thao tác lưu cục bộ trên thiết bị đang xem). Phân hệ quản lí tài khoản lớp học Supabase vận
            hành riêng khi triển khai nội bộ tại trường phổ thông.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <Link className="btn primary" href="/hoc-lieu">
              Mở Kho học liệu Chương IV
            </Link>
            <Link className="btn" href="/hoc-lieu/truc-quan?bai=B21">
              Bài 21 · Tán xạ Rutherford V3
            </Link>
            <Link className="btn" href="/hoc-lieu/truc-quan?bai=B25&muc=b25-table-25-1">
              Bài 25 · Bảng 25.1 & nội suy T = 39,5 s
            </Link>
            <Link className="btn" href="/hoc-lieu/truc-quan?bai=B21&che-do=giao-vien">
              Chế độ Giáo viên (Bài 21)
            </Link>
            <Link className="btn" href="/hoc-lieu/soan-ke-hoach">
              Soạn KHBD Công văn 5512
            </Link>
            <Link className="btn" href="/hoc-lieu/ai-giao-vien">
              Ngân hàng 213 câu hỏi & Xuất Word
            </Link>
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
