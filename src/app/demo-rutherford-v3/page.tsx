/**
 * Demo route for Rutherford Apparatus V3
 * Testing apparatus-first 3D simulation before integration
 */

import { Suspense, lazy } from "react";

// Lazy load the 3D component (it's client-side with Three.js)
const RutherfordApparatusV3 = lazy(() =>
  import("@/simulations-v3/apparatus/rutherford/RutherfordApparatusV3")
);

export const metadata = {
  title: "Rutherford Apparatus V3 — Demo | Vật lí hạt nhân",
  description: "Thí nghiệm Geiger–Marsden với thiết bị 3D, nhiều góc nhìn và registry linh kiện.",
};

export default function RutherfordV3DemoPage() {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>
        Rutherford Apparatus V3 — Demo
      </h1>
      <p style={{ fontSize: "15px", color: "var(--text-secondary, #64748b)", marginBottom: "32px" }}>
        Thí nghiệm Geiger–Marsden (1909–1913) — Apparatus-first simulation với thiết bị khoa học 3D.
      </p>

      <Suspense
        fallback={
          <div
            style={{
              padding: "120px 24px",
              textAlign: "center",
              background: "var(--bg-surface-elevated, #f8fafc)",
              borderRadius: "12px",
              color: "var(--text-muted, #64748b)",
            }}
          >
            Đang tải mô phỏng 3D...
          </div>
        }
      >
        <RutherfordApparatusV3 />
      </Suspense>

      <div style={{ marginTop: "48px", padding: "24px", background: "var(--bg-surface-elevated, #f8fafc)", borderRadius: "12px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Tính năng Apparatus-First
        </h2>
        <ul style={{ lineHeight: 2, fontSize: "15px", paddingLeft: "24px" }}>
          <li><strong>10 góc nhìn camera:</strong> Orbit, Front, Top, Cutaway, Exploded, Instrument POV, ...</li>
          <li><strong>Registry linh kiện:</strong> Nhấp vào từng bộ phận → xem tên tiếng Việt/Anh + chức năng</li>
          <li><strong>Thiết bị khoa học:</strong> Nguồn alpha, khe chuẩn trực, lá vàng, màn ZnS, kính hiển vi xoay, thang đo góc</li>
          <li><strong>Physics engine độc lập:</strong> Coulomb cổ điển chính xác, CODATA 2022</li>
          <li><strong>Histogram góc:</strong> Phân bố 1/sin⁴(θ/2) — phù hợp thí nghiệm Geiger–Marsden</li>
          <li><strong>Tái sử dụng:</strong> Pure functions, không phụ thuộc React/Three trong physics layer</li>
        </ul>

        <h3 style={{ fontSize: "16px", fontWeight: 600, marginTop: "24px", marginBottom: "12px" }}>
          Nguồn khoa học
        </h3>
        <ul style={{ fontSize: "13px", lineHeight: 1.8, paddingLeft: "24px", color: "var(--text-secondary, #64748b)" }}>
          <li>Geiger, H., & Marsden, E. (1909). On a Diffuse Reflection of the α-Particles. Proceedings of the Royal Society A, 82(557), 495–500.</li>
          <li>Rutherford, E. (1911). The Scattering of α and β Particles by Matter and the Structure of the Atom. Philosophical Magazine, 21(125), 669–688.</li>
          <li>CODATA 2022 — NIST recommended values</li>
        </ul>

        <h3 style={{ fontSize: "16px", fontWeight: 600, marginTop: "24px", marginBottom: "12px" }}>
          Giới hạn mô hình
        </h3>
        <p style={{ fontSize: "13px", lineHeight: 1.8, color: "var(--text-secondary, #64748b)" }}>
          Mô hình Coulomb cổ điển, hạt nhân vàng cố định. Bỏ qua electron, độ giật lùi, tương tác hạt nhân mạnh.
          Kích thước và tỉ lệ trong 3D là quy ước sư phạm để dễ quan sát, không phải ảnh thật.
          Histogram là mô hình lí thuyết, không phải dữ liệu đo.
        </p>
      </div>
    </div>
  );
}
