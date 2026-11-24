import { PhaseActivityPage } from "@/components/learning/PhaseActivityPage";
import { DataProcessingLab } from "@/components/learning/DataProcessingLab";

export const metadata = {
  title: "Xử lý dữ liệu thí nghiệm | Vật lí hạt nhân",
  description: "Xử lý số liệu thí nghiệm ảo, dựng bảng dữ liệu và rút ra quy luật.",
};

export default function XuLyDuLieuPage() {
  return (
    <PhaseActivityPage
      phase="during"
      activityNo="2.1"
      title="Xử lý dữ liệu thí nghiệm"
      goal="Nhóm em sẽ xử lý số liệu từ thí nghiệm ảo, dựng bảng dữ liệu, vẽ đồ thị và rút ra quy luật."
      product="Bảng số liệu đã điền, đồ thị đã vẽ, và một câu diễn giải quy luật em tìm được."
    >
      <div style={{ marginTop: "24px", display: "grid", gap: "24px" }}>
        <div>
          <h2 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: 600 }}>
            Phòng xử lý dữ liệu tương tác
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
            Thay đổi các tham số dưới đây để tạo ra một mẫu dữ liệu mô phỏng. Bảng và
            đồ thị sẽ cập nhật ngay lập tức.
          </p>
          <DataProcessingLab />
        </div>

        <div style={{ paddingTop: "24px", borderTop: "1px solid var(--border-light)" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 600 }}>
            Công việc của nhóm
          </h3>
          <ol style={{ fontSize: "14px", lineHeight: 1.8, color: "var(--text-secondary)", paddingLeft: "24px" }}>
            <li>Mỗi nhóm chọn <strong>hai bộ tham số khác nhau</strong> (N₀ và T).</li>
            <li>Ghi lại bảng số liệu và đồ thị từ cả hai mẫu.</li>
            <li>Vẽ đồ thị trên giấy hoặc slide: trục hoành là t/T, trục tung là N/N₀.</li>
            <li>So sánh: hai mẫu có đồ thị giống nhau không?</li>
            <li>Rút ra: công thức bán rã là gì? Làm sao biết được?</li>
          </ol>
        </div>

        <div style={{ padding: "16px", background: "var(--bg-surface-elevated)", borderRadius: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
          <strong>⚠️ Lưu ý quan trọng:</strong> Dữ liệu ở đây là <strong>mô phỏng</strong>, không phải số đo thí nghiệm thực. Sai khác giữa điểm và đường kì vọng là do
          tính ngẫu nhiên của từng {'"sự kiện"'} rã trong mô hình, dùng để học phương pháp
          xử lý dữ liệu. Số đo thực thí nghiệm sẽ có sai số khác.
        </div>
      </div>
    </PhaseActivityPage>
  );
}
