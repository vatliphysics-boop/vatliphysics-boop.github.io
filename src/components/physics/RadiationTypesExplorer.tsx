"use client";

import { useState } from "react";
import { LatexMath } from "@/components/learning/LatexMath";
import styles from "./RadiationTypesExplorer.module.css";

type RayKey = "alpha" | "betaMinus" | "betaPlus" | "gamma";
type FieldMode = "electric" | "magnetic";

interface RaySpec {
  key: RayKey;
  label: string;
  symbol: string;
  nature: string;
  charge: string;
  chargeSign: 1 | -1 | 0;
  deflectionMagnitude: number; // px in SVG (center y = 125): alpha gentle (22), beta strong (78), gamma 0
  generalLatex: string;
  exampleLatex: string;
  equationNote: string;
  ionization: string;
  penetration: string;
  stoppedAtX: number; // x coordinate in barrier SVG
  color: string;
}

const RAYS: readonly RaySpec[] = [
  {
    key: "alpha",
    label: "Tia alpha",
    symbol: "α",
    nature: "Dòng hạt nhân Helium ⁴₂He (2 proton + 2 neutron), tốc độ ~ 2·10⁷ m/s",
    charge: "+2e (m_α ≈ 7 300 m_e)",
    chargeSign: 1,
    deflectionMagnitude: 22,
    generalLatex: String.raw`{}_{Z}^{A}\mathrm{X} \rightarrow {}_{Z-2}^{A-4}\mathrm{Y} + {}_{2}^{4}\mathrm{He}`,
    exampleLatex: String.raw`{}_{92}^{238}\mathrm{U} \rightarrow {}_{90}^{234}\mathrm{Th} + {}_{2}^{4}\mathrm{He}`,
    equationNote:
      "Số khối A giảm 4, điện tích hạt nhân Z giảm 2. Khối lượng hạt α lớn gấp ~7 300 lần electron nên gia tốc ngang và độ cong quỹ đạo nhỏ hơn hẳn tia β⁺.",
    ionization: "Mạnh nhất (làm ion hóa hàng nghìn phân tử khí trên mỗi cm đường đi)",
    penetration: "Yếu nhất — đi được vài cm trong không khí, bị chặn ngay bởi tờ bìa giấy dày ~1 mm (Hình 23.4 SGK tr. 106)",
    stoppedAtX: 118,
    color: "#c2410c",
  },
  {
    key: "betaMinus",
    label: "Tia beta trừ",
    symbol: "β⁻",
    nature: "Dòng electron ⁰₋₁e tốc độ rất lớn (gần bằng c), phát kèm phản neutrino ν̄ₑ",
    charge: "−e (m = m_e)",
    chargeSign: -1,
    deflectionMagnitude: 78,
    generalLatex: String.raw`{}_{Z}^{A}\mathrm{X} \rightarrow {}_{Z+1}^{A}\mathrm{Y} + {}_{-1}^{0}\mathrm{e} + \bar{\nu}_e`,
    exampleLatex: String.raw`{}_{6}^{14}\mathrm{C} \rightarrow {}_{7}^{14}\mathrm{N} + {}_{-1}^{0}\mathrm{e} + \bar{\nu}_e`,
    equationNote:
      "Trong hạt nhân: n → p + e⁻ + ν̄ₑ. Số khối A giữ nguyên, Z tăng 1. Khối lượng electron rất nhỏ nên tia β⁻ bị lệch rất mạnh.",
    ionization: "Trung bình (yếu hơn tia α nhưng mạnh hơn tia γ)",
    penetration: "Trung bình — xuyên qua giấy, đi vài mét trong không khí, bị chặn bởi tấm nhôm dày ~1 mm (Hình 23.4 SGK tr. 106)",
    stoppedAtX: 214,
    color: "#1d4ed8",
  },
  {
    key: "betaPlus",
    label: "Tia beta cộng",
    symbol: "β⁺",
    nature: "Dòng positron ⁰₊₁e (phản hạt của electron), phát kèm neutrino νₑ",
    charge: "+e (m = m_e)",
    chargeSign: 1,
    deflectionMagnitude: 78,
    generalLatex: String.raw`{}_{Z}^{A}\mathrm{X} \rightarrow {}_{Z-1}^{A}\mathrm{Y} + {}_{+1}^{0}\mathrm{e} + \nu_e`,
    exampleLatex: String.raw`{}_{11}^{22}\mathrm{Na} \rightarrow {}_{10}^{22}\mathrm{Ne} + {}_{+1}^{0}\mathrm{e} + \nu_e`,
    equationNote:
      "Trong hạt nhân: p → n + e⁺ + νₑ. Số khối A giữ nguyên, Z giảm 1. Lệch cùng phía tia α nhưng cong mạnh đối xứng với tia β⁻ vì m_e ≪ m_α.",
    ionization: "Trung bình",
    penetration: "Trung bình — xuyên qua giấy, bị chặn bởi tấm nhôm dày ~1 mm (Hình 23.4 SGK tr. 106)",
    stoppedAtX: 214,
    color: "#7c3aed",
  },
  {
    key: "gamma",
    label: "Tia gamma",
    symbol: "γ",
    nature: "Bức xạ điện từ bước sóng rất ngắn (< 10⁻¹¹ m), là chùm photon năng lượng cao",
    charge: "0 (trung hòa điện)",
    chargeSign: 0,
    deflectionMagnitude: 0,
    generalLatex: String.raw`{}_{Z}^{A}\mathrm{X}^* \rightarrow {}_{Z}^{A}\mathrm{X} + \gamma`,
    exampleLatex: String.raw`{}_{27}^{60}\mathrm{Co}^* \rightarrow {}_{27}^{60}\mathrm{Co} + \gamma`,
    equationNote:
      "Thường đi kèm sau phân rã α hoặc β khi hạt nhân con ở trạng thái kích thích (*) chuyển về mức năng lượng thấp hơn. Không làm thay đổi A và Z.",
    ionization: "Yếu nhất trong ba loại tia",
    penetration: "Mạnh nhất — xuyên qua giấy và nhôm, suy giảm mạnh khi qua tấm chì dày ~10 cm (Hình 23.4 SGK tr. 106)",
    stoppedAtX: 404,
    color: "#15803d",
  },
];

function computeRayDeltaY(
  spec: RaySpec,
  fieldMode: FieldMode,
  topPlatePositive: boolean,
  bIntoScreen: boolean
): number {
  if (spec.chargeSign === 0) return 0;
  if (fieldMode === "electric") {
    // SVG +y is downward.
    // If topPlatePositive (+ at top, - at bottom), E points downward (+y):
    // q > 0 (alpha, beta+) experiences downward force (+y, toward - plate).
    // q < 0 (beta-) experiences upward force (-y, toward + plate).
    const eDownwardSign = topPlatePositive ? 1 : -1;
    return spec.chargeSign * eDownwardSign * spec.deflectionMagnitude;
  }
  // Magnetic field mode (đối chiếu Hình 23.3b SGK tr. 105): trên mô phỏng chùm tia v₀ bay ngang sang phải (+x)
  // (Hình 23.3b SGK vẽ nguồn bắn từ dưới lên trên trong từ trường B ⊙ hướng ra ngoài).
  // Quy tắc bàn tay trái với v₀ sang phải (+x):
  // - Khi B hướng vào trong (⊗, -z): q > 0 cong LÊN TRÊN (-y_svg), q < 0 cong XUỐNG DƯỚI (+y_svg).
  // - Khi B hướng ra ngoài (⊙, +z): q > 0 cong XUỐNG DƯỚI (+y_svg), q < 0 cong LÊN TRÊN (-y_svg).
  const positiveForceSvgSign = bIntoScreen ? -1 : 1;
  return spec.chargeSign * positiveForceSvgSign * spec.deflectionMagnitude;
}

function buildTrajectoryPath(deltaY: number): { path: string; endY: number } {
  const y0 = 125;
  const endY = y0 + deltaY;
  // Straight segment from source exit (58, 125) to field entry (96, 125), then smooth quadratic/cubic deflection
  const path =
    deltaY === 0
      ? `M 58 ${y0} L 392 ${y0}`
      : `M 58 ${y0} L 96 ${y0} C 185 ${y0}, 275 ${y0 + deltaY * 0.55}, 392 ${endY}`;
  return { path, endY };
}

function describeActiveDeflection(
  spec: RaySpec,
  fieldMode: FieldMode,
  topPlatePositive: boolean,
  bIntoScreen: boolean
): string {
  if (spec.chargeSign === 0) {
    return fieldMode === "electric"
      ? "Truyền thẳng (q = 0, lực điện F = 0)"
      : "Truyền thẳng (q = 0, lực Lorentz F_L = 0)";
  }
  const dy = computeRayDeltaY(spec, fieldMode, topPlatePositive, bIntoScreen);
  const dirText = dy < 0 ? "lên phía trên" : "xuống phía dưới";
  if (fieldMode === "electric") {
    const targetPlate = spec.chargeSign > 0 ? "bản âm (−)" : "bản dương (+)";
    const strength = spec.key === "alpha" ? "Lệch nhẹ" : "Lệch mạnh";
    return `${strength} ${dirText} về phía ${targetPlate}`;
  }
  const strength =
    spec.key === "alpha"
      ? "Cong nhẹ (bán kính R = mv/|q|B rất lớn do m_α ≈ 7 300 m_e)"
      : "Cong mạnh (bán kính R nhỏ do m_e rất nhỏ)";
  const bSymbol = bIntoScreen ? "⊗ vào trong" : "⊙ ra ngoài (như Hình 23.3b SGK)";
  return `${strength}, hướng ${dirText} theo quy tắc bàn tay trái (v₀ sang phải, B ${bSymbol})`;
}

export function RadiationTypesExplorer({
  onProgress,
}: {
  onProgress?: (done: boolean) => void;
} = {}) {
  const [active, setActive] = useState<RayKey>("alpha");
  const [viewed, setViewed] = useState<ReadonlySet<RayKey>>(() => new Set(["alpha"]));
  const [fieldMode, setFieldMode] = useState<FieldMode>("electric");
  const [topPlatePositive, setTopPlatePositive] = useState(true);
  const [bIntoScreen, setBIntoScreen] = useState(false);
  const [showAllRays, setShowAllRays] = useState(true);
  const [compared, setCompared] = useState(false);

  const ray = RAYS.find((r) => r.key === active)!;

  function handleSelectRay(nextKey: RayKey) {
    setActive(nextKey);
    setViewed((prev) => {
      if (prev.has(nextKey)) return prev;
      const next = new Set(prev);
      next.add(nextKey);
      if (next.size >= 3) {
        onProgress?.(true);
      }
      return next;
    });
  }

  const activeDeltaY = computeRayDeltaY(ray, fieldMode, topPlatePositive, bIntoScreen);

  return (
    <div className={styles.wrapper}>
      {/* Bộ chọn 4 loại tia */}
      <div className={styles.tabs} role="tablist" aria-label="Chọn loại tia phóng xạ">
        {RAYS.map((r) => (
          <button
            key={r.key}
            type="button"
            role="tab"
            aria-selected={r.key === active}
            className={styles.tab}
            data-active={r.key === active}
            onClick={() => handleSelectRay(r.key)}
          >
            <span className={styles.tabSymbol} style={{ color: r.color }}>
              {r.symbol}
            </span>
            <span>
              {r.label} {viewed.has(r.key) ? "✓" : ""}
            </span>
          </button>
        ))}
      </div>

      {/* Bộ chuyển đổi chế độ trường chuẩn SGK Hình 23.3a & 23.3b */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
          padding: "10px 12px",
          background: "var(--bg-surface-elevated)",
          borderRadius: "8px",
          border: "1px solid var(--border)",
        }}
      >
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)" }}>
          Chế độ trường (Hình 23.3 SGK):
        </span>
        <button
          type="button"
          className={styles.tab}
          data-active={fieldMode === "electric"}
          onClick={() => setFieldMode("electric")}
          style={{ minHeight: "38px", padding: "6px 12px", fontSize: "0.88rem" }}
        >
          ⚡ Điện trường đều E (Hình 23.3a)
        </button>
        <button
          type="button"
          className={styles.tab}
          data-active={fieldMode === "magnetic"}
          onClick={() => setFieldMode("magnetic")}
          style={{ minHeight: "38px", padding: "6px 12px", fontSize: "0.88rem" }}
        >
          🧲 Từ trường đều B (Hình 23.3b)
        </button>

        {fieldMode === "electric" ? (
          <button
            type="button"
            className={styles.compareButton}
            onClick={() => setTopPlatePositive((v) => !v)}
            style={{ minHeight: "38px", padding: "6px 12px", fontSize: "0.86rem" }}
          >
            ⇄ Đảo cực hai bản tụ ({topPlatePositive ? "+ ở trên / − ở dưới" : "− ở trên / + ở dưới"})
          </button>
        ) : (
          <button
            type="button"
            className={styles.compareButton}
            onClick={() => setBIntoScreen((v) => !v)}
            style={{ minHeight: "38px", padding: "6px 12px", fontSize: "0.86rem" }}
          >
            ⇄ Đảo chiều B ({bIntoScreen ? "⊗ hướng vào trong" : "⊙ hướng ra ngoài"})
          </button>
        )}

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            cursor: "pointer",
            marginLeft: "auto",
          }}
        >
          <input
            type="checkbox"
            checked={showAllRays}
            onChange={(e) => setShowAllRays(e.target.checked)}
          />
          Hiện nét mờ đối chiếu cả 4 tia
        </label>
      </div>

      <div className={styles.panel} role="tabpanel">
        <div style={{ display: "grid", gap: "12px", minWidth: 0 }}>
          {/* Sơ đồ lệch trong điện trường / từ trường (Hình 23.3a, 23.3b) */}
          <div className={styles.visual}>
            <svg
              viewBox="0 0 440 250"
              className={styles.svg}
              role="img"
              aria-label={`Minh họa ${ray.label} trong ${fieldMode === "electric" ? "điện trường đều E" : "từ trường đều B"}`}
            >
              <title>
                {fieldMode === "electric"
                  ? "Hình 23.3a — Tia phóng xạ lệch trong điện trường đều E"
                  : "Hình 23.3b — Tia phóng xạ lệch trong từ trường đều B"}
              </title>

              {fieldMode === "electric" ? (
                <>
                  {/* Bản cực trên */}
                  <rect
                    x="92"
                    y="20"
                    width="320"
                    height="9"
                    fill={topPlatePositive ? "#b91c1c" : "#1d4ed8"}
                    rx="2"
                  />
                  <text
                    x="252"
                    y="14"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill={topPlatePositive ? "#b91c1c" : "#1d4ed8"}
                  >
                    {topPlatePositive ? "Bản dương (+)" : "Bản âm (−)"}
                  </text>

                  {/* Bản cực dưới */}
                  <rect
                    x="92"
                    y="221"
                    width="320"
                    height="9"
                    fill={topPlatePositive ? "#1d4ed8" : "#b91c1c"}
                    rx="2"
                  />
                  <text
                    x="252"
                    y="244"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill={topPlatePositive ? "#1d4ed8" : "#b91c1c"}
                  >
                    {topPlatePositive ? "Bản âm (−)" : "Bản dương (+)"}
                  </text>

                  {/* Đường sức điện trường E */}
                  {[135, 215, 295, 375].map((xPos) => {
                    const yStart = topPlatePositive ? 33 : 217;
                    const yEnd = topPlatePositive ? 215 : 35;
                    const tipDir = topPlatePositive ? -6 : 6;
                    return (
                      <g key={xPos} opacity="0.28">
                        <line
                          x1={xPos}
                          y1={yStart}
                          x2={xPos}
                          y2={yEnd}
                          stroke="#64748b"
                          strokeWidth="1.2"
                          strokeDasharray="4 4"
                        />
                        <path
                          d={`M ${xPos - 3.5} ${yEnd + tipDir} L ${xPos} ${yEnd} L ${xPos + 3.5} ${yEnd + tipDir}`}
                          fill="none"
                          stroke="#64748b"
                          strokeWidth="1.3"
                        />
                      </g>
                    );
                  })}
                  <text x="418" y="129" fontSize="11" fontWeight="700" fill="#475569">
                    E {topPlatePositive ? "↓" : "↑"}
                  </text>
                </>
              ) : (
                <>
                  {/* Vùng từ trường đều B */}
                  <rect
                    x="92"
                    y="22"
                    width="320"
                    height="206"
                    rx="8"
                    fill="#e2e8f0"
                    opacity="0.55"
                    stroke="#94a3b8"
                    strokeDasharray="5 4"
                  />
                  <text x="252" y="15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">
                    Từ trường đều B {bIntoScreen ? "(⊗ hướng vuông góc vào trong)" : "(⊙ hướng vuông góc ra ngoài)"}
                  </text>
                  {[125, 185, 245, 305, 365].map((gx) =>
                    [55, 102, 148, 195].map((gy) => (
                      <g key={`${gx}-${gy}`} opacity="0.42">
                        <circle cx={gx} cy={gy} r="7" fill="none" stroke="#475569" strokeWidth="1.2" />
                        {bIntoScreen ? (
                          <>
                            <line x1={gx - 4} y1={gy - 4} x2={gx + 4} y2={gy + 4} stroke="#475569" strokeWidth="1.2" />
                            <line x1={gx + 4} y1={gy - 4} x2={gx - 4} y2={gy + 4} stroke="#475569" strokeWidth="1.2" />
                          </>
                        ) : (
                          <circle cx={gx} cy={gy} r="2.2" fill="#475569" />
                        )}
                      </g>
                    ))
                  )}
                </>
              )}

              {/* Hộp chì chứa nguồn phóng xạ + khe chuẩn trực */}
              <rect x="14" y="103" width="44" height="44" rx="5" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
              <rect x="44" y="121" width="16" height="8" fill="#94a3b8" />
              <circle cx="34" cy="125" r="6" fill="#f59e0b" />
              <text x="36" y="162" textAnchor="middle" fontSize="10" fontWeight="600" fill="#334155">
                Nguồn chì
              </text>

              {/* Mũi tên vận tốc ban đầu v₀ */}
              <line x1="58" y1="125" x2="90" y2="125" stroke="#0f172a" strokeWidth="1.8" />
              <path d="M 85 121.5 L 92 125 L 85 128.5" fill="none" stroke="#0f172a" strokeWidth="1.8" />
              <text x="75" y="117" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">
                v₀
              </text>

              {/* Trục truyền thẳng chuẩn */}
              <line x1="92" y1="125" x2="405" y2="125" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

              {/* Các tia đối chiếu nền mờ */}
              {showAllRays &&
                RAYS.filter((r) => r.key !== active).map((other) => {
                  const dy = computeRayDeltaY(other, fieldMode, topPlatePositive, bIntoScreen);
                  const { path, endY } = buildTrajectoryPath(dy);
                  return (
                    <g key={other.key} opacity="0.28">
                      <path d={path} stroke={other.color} strokeWidth="2" fill="none" strokeDasharray="4 4" />
                      <text x="398" y={endY + 4} fontSize="11" fontWeight="700" fill={other.color}>
                        {other.symbol}
                      </text>
                    </g>
                  );
                })}

              {/* Tia đang chọn + hạt chuyển động + vector lực */}
              {(() => {
                const { path, endY } = buildTrajectoryPath(activeDeltaY);
                const forceDir = activeDeltaY === 0 ? 0 : activeDeltaY > 0 ? 1 : -1;
                const forceLen = ray.key === "alpha" ? 18 : 28;
                const fyEnd = 125 + forceDir * forceLen;
                return (
                  <>
                    <path d={path} stroke={ray.color} strokeWidth="3" fill="none" opacity="0.85" />
                    <circle r="6.5" fill={ray.color}>
                      <animateMotion dur="2.8s" repeatCount="indefinite" path={path} rotate="auto" />
                    </circle>
                    {forceDir !== 0 && (
                      <g>
                        <line x1="112" y1="125" x2="112" y2={fyEnd} stroke="#dc2626" strokeWidth="2" />
                        <path
                          d={`M 108.5 ${fyEnd - forceDir * 5} L 112 ${fyEnd} L 115.5 ${fyEnd - forceDir * 5}`}
                          fill="none"
                          stroke="#dc2626"
                          strokeWidth="2"
                        />
                        <text
                          x="120"
                          y={125 + forceDir * (forceLen * 0.65) + 3}
                          fontSize="10"
                          fontWeight="700"
                          fill="#dc2626"
                        >
                          {fieldMode === "electric" ? "F_E" : "F_L"}
                        </text>
                      </g>
                    )}
                    <text x="398" y={endY + 4} fontSize="14" fontWeight="800" fill={ray.color}>
                      {ray.symbol}
                    </text>
                  </>
                );
              })()}
            </svg>
          </div>

          {/* Sơ đồ khả năng đâm xuyên qua Giấy – Nhôm – Chì (Hình 23.4 SGK) */}
          <div className={styles.visual} style={{ padding: "8px 10px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>
              Khả năng đâm xuyên qua vật cản (Hình 23.4 SGK): Giấy → Nhôm (vài mm) → Chì dày (vài cm)
            </p>
            <svg
              viewBox="0 0 440 112"
              className={styles.svg}
              role="img"
              aria-label={`Khả năng đâm xuyên của ${ray.label} qua giấy, nhôm và chì`}
            >
              <title>Hình 23.4 — So sánh khả năng đâm xuyên của tia α, β và γ</title>
              {/* Nguồn */}
              <rect x="14" y="42" width="32" height="28" rx="4" fill="#334155" />
              <circle cx="30" cy="56" r="5" fill={ray.color} />

              {/* Tờ giấy */}
              <rect x="118" y="14" width="8" height="72" rx="1" fill="#fde68a" stroke="#ca8a04" />
              <text x="122" y="102" textAnchor="middle" fontSize="10" fontWeight="600" fill="#854d0e">
                Tờ giấy
              </text>

              {/* Lá nhôm vài mm */}
              <rect x="214" y="14" width="16" height="72" rx="2" fill="#cbd5e1" stroke="#64748b" />
              <text x="222" y="102" textAnchor="middle" fontSize="10" fontWeight="600" fill="#334155">
                Nhôm (~mm)
              </text>

              {/* Khối chì dày vài cm */}
              <rect x="318" y="14" width="38" height="72" rx="3" fill="#475569" stroke="#1e293b" />
              <text x="337" y="102" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
                Chì dày (~cm)
              </text>

              {/* Đường truyền tia đang chọn */}
              {ray.key === "gamma" ? (
                <>
                  <line x1="46" y1="56" x2="318" y2="56" stroke={ray.color} strokeWidth="3.2" strokeDasharray="6 3" />
                  <line
                    x1="356"
                    y1="56"
                    x2="418"
                    y2="56"
                    stroke={ray.color}
                    strokeWidth="1.6"
                    strokeDasharray="4 4"
                    opacity="0.45"
                  />
                  <text x="388" y="46" textAnchor="middle" fontSize="10" fontWeight="700" fill={ray.color}>
                    Suy giảm mạnh
                  </text>
                </>
              ) : (
                <>
                  <line x1="46" y1="56" x2={ray.stoppedAtX} y2="56" stroke={ray.color} strokeWidth="3.5" />
                  <circle cx={ray.stoppedAtX} cy="56" r="4.5" fill={ray.color} />
                  <text
                    x={ray.stoppedAtX - 8}
                    y="45"
                    textAnchor="end"
                    fontSize="11"
                    fontWeight="700"
                    fill={ray.color}
                  >
                    Bị chặn ✗
                  </text>
                </>
              )}
              <text x="64" y="47" fontSize="12" fontWeight="800" fill={ray.color}>
                {ray.symbol}
              </text>
            </svg>
          </div>
        </div>

        <div className={styles.details}>
          <h3 className={styles.symbolTitle} style={{ color: ray.color }}>
            {ray.symbol} — {ray.label}
          </h3>
          <dl className={styles.facts}>
            <div>
              <dt>Bản chất</dt>
              <dd>{ray.nature}</dd>
            </div>
            <div>
              <dt>Điện tích & Tương quan khối lượng</dt>
              <dd>{ray.charge}</dd>
            </div>
            <div>
              <dt>Khả năng ion hóa không khí</dt>
              <dd>{ray.ionization}</dd>
            </div>
            <div>
              <dt>Khả năng đâm xuyên (Hình 23.4)</dt>
              <dd>{ray.penetration}</dd>
            </div>
            <div>
              <dt>{fieldMode === "electric" ? "Trong điện trường đều E" : "Trong từ trường đều B"}</dt>
              <dd>{describeActiveDeflection(ray, fieldMode, topPlatePositive, bIntoScreen)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className={styles.equation}>
        <p className={styles.equationLabel}>Phương trình phân rã tổng quát & ví dụ chuẩn SGK</p>
        <div style={{ display: "grid", gap: "6px", margin: "6px 0" }}>
          <LatexMath block math={ray.generalLatex} />
          <LatexMath block math={`\\text{Ví dụ: } ${ray.exampleLatex}`} />
        </div>
        <p className={styles.equationNote}>{ray.equationNote}</p>
      </div>

      <button
        type="button"
        className={styles.compareButton}
        onClick={() => setCompared((v) => !v)}
        aria-expanded={compared}
      >
        {compared ? "Ẩn bảng so sánh tổng hợp" : "So sánh bốn loại tia (α, β⁻, β⁺, γ)"}
      </button>

      {compared && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption>So sánh tính chất các tia phóng xạ — đối chiếu Hình 23.3a, 23.3b và 23.4 SGK</caption>
            <thead>
              <tr>
                <th scope="col">Tính chất</th>
                {RAYS.map((r) => (
                  <th key={r.key} scope="col" style={{ color: r.color }}>
                    {r.symbol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Bản chất</th>
                {RAYS.map((r) => (
                  <td key={r.key}>{r.nature}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Điện tích</th>
                {RAYS.map((r) => (
                  <td key={r.key}>{r.charge}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Ion hóa</th>
                {RAYS.map((r) => (
                  <td key={r.key}>{r.ionization}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Đâm xuyên</th>
                {RAYS.map((r) => (
                  <td key={r.key}>{r.penetration}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Độ lệch trong trường E / B</th>
                {RAYS.map((r) => (
                  <td key={r.key}>
                    {describeActiveDeflection(r, fieldMode, topPlatePositive, bIntoScreen)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className={styles.tableNote}>
            Mô hình minh họa định tính chuẩn SGK Vật lí 12 KNTT (trang 105–107). Độ cong thực tế phụ thuộc động năng ban đầu của hạt, cường độ điện trường E hoặc cảm ứng từ B.
          </p>
        </div>
      )}
    </div>
  );
}
