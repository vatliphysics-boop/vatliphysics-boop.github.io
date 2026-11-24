import { PhaseActivityPage } from "@/components/learning/PhaseActivityPage";
import { MindMapWorkspace } from "@/components/learning/MindMapWorkspace";

export const metadata = {
  title: "Sơ đồ tư duy cộng tác | Vật lí hạt nhân",
  description: "Bản đồ tư duy cộng tác để tổ chức ý tưởng trên lớp.",
};

export default function SoDoDuyPage() {
  return (
    <PhaseActivityPage
      phase="during"
      activityNo="2.2"
      title="Sơ đồ tư duy cộng tác"
      goal="Nhóm em sẽ cùng dựng một sơ đồ tư duy để tổ chức ý tưởng về chủ đề ngày hôm nay."
      product="Sơ đồ tư duy đã hoàn thiện với ít nhất 3 nhánh chính và 2–3 chi tiết trên mỗi nhánh."
    >
      <div style={{ marginTop: "24px", display: "grid", gap: "24px" }}>
        <div>
          <h2 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: 600 }}>
            Không gian sơ đồ tư duy hợp tác
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
            Chọn chủ đề, thêm ý vào từng nhánh, và tải sơ đồ về máy khi hoàn thành.
          </p>
          <MindMapWorkspace />
        </div>

        <div style={{ paddingTop: "24px", borderTop: "1px solid var(--border-light)" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 600 }}>
            Cách sử dụng
          </h3>
          <ol style={{ fontSize: "14px", lineHeight: 1.8, color: "var(--text-secondary)", paddingLeft: "24px" }}>
            <li>Lựa chọn một chủ đề phù hợp với bài học hôm nay.</li>
            <li>Nhóm thảo luận và thêm ý vào từng nhánh.</li>
            <li>Có thể thêm nhánh mới nếu cần.</li>
            <li>Khi hoàn thành, bấm {'"Tải sơ đồ về máy"'} để lưu sản phẩm.</li>
          </ol>
        </div>

        <div style={{ padding: "16px", background: "var(--semantic-warning-soft)", borderRadius: "8px", fontSize: "13px", color: "var(--semantic-warning)" }}>
          💾 <strong>Chú ý:</strong> Sơ đồ được lưu tạm trong trình duyệt và sẽ mất nếu
          tải lại trang. Hãy bấm {'"Tải sơ đồ về máy"'} để giữ lại sản phẩm.
        </div>
      </div>
    </PhaseActivityPage>
  );
}
