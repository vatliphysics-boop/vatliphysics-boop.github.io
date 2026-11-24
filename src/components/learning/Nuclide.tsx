import type { CSSProperties } from "react";

export interface NuclideProps {
  /** Kí hiệu nguyên tố hoặc hạt, ví dụ "Si", "H", "Au", "U", "n", "p", "e" */
  readonly sym: string;
  /** Số khối A (chỉ số trên bên trái) */
  readonly a: number | string;
  /** Số hiệu nguyên tử / điện tích Z (chỉ số dưới bên trái) */
  readonly z: number | string;
  /** Hậu tố tuỳ chọn, ví dụ "*" cho trạng thái kích thích */
  readonly suffix?: string;
}

const wrapperStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  verticalAlign: "-0.08em",
  fontFamily: "var(--font-sans), sans-serif",
  fontWeight: 600,
  lineHeight: 1,
  whiteSpace: "nowrap",
  gap: "1.5px",
};

const scriptsStyle: CSSProperties = {
  display: "inline-grid",
  gridTemplateRows: "1fr 1fr",
  textAlign: "right",
  fontSize: "0.66em",
  lineHeight: 1.05,
  fontVariantNumeric: "tabular-nums",
  transform: "translateY(-0.04em)",
};

/**
 * Hiển thị kí hiệu hạt nhân chuẩn quốc tế ᴬᶻX rõ nét ở mọi kích thước màn hình,
 * kể cả màn hình điện thoại 390 px, không bị chồng chỉ số trên/dưới.
 */
export function Nuclide({ sym, a, z, suffix }: NuclideProps) {
  return (
    <span
      style={wrapperStyle}
      translate="no"
      aria-label={`${sym}-${a}, số khối ${a}, điện tích ${z}`}
    >
      <span style={scriptsStyle} aria-hidden="true">
        <span>{a}</span>
        <span>{z}</span>
      </span>
      <span>
        {sym}
        {suffix ?? ""}
      </span>
    </span>
  );
}
