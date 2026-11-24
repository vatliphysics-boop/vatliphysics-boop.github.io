import { useMemo } from "react";
import { decaySeries, decayState, type DecaySample } from "@/lib/radioactive-decay-model";
import styles from "./ProcessLab.module.css";

export type DecayChartMode = "N" | "H";

const layouts = [
  { name: "compact", width: 320, left: 66, right: 304, top: 30, bottom: 198, height: 248, fontSize: 11.5 },
  { name: "wide", width: 720, left: 82, right: 688, top: 34, bottom: 276, height: 332, fontSize: 13.5 },
] as const;

export interface DecayProcessVisualProps {
  sample: DecaySample;
  time: number;
  duration?: number;
  chartMode?: DecayChartMode;
  trackedIndex?: number;
  onSelectNucleus?: (index: number) => void;
}

/** Pure view: links (1) single nucleus, (2) ensemble grid, and (3) N(t) / H(t) graph at the same time t. */
export function DecayProcessVisual({
  sample,
  time,
  duration = 60,
  chartMode = "N",
  trackedIndex = 0,
  onSelectNucleus,
}: DecayProcessVisualProps) {
  const state = decayState(sample, time);
  const safeTrackedIndex = Math.max(0, Math.min(sample.initialCount - 1, trackedIndex));
  const trackedLifetime = sample.lifetimes[safeTrackedIndex] ?? 0;
  const trackedHasDecayed = trackedLifetime <= time;

  const expected = useMemo(
    () => decaySeries(sample, duration, duration / 120),
    [sample, duration]
  );
  const orderedLifetimes = useMemo(
    () => [...sample.lifetimes].sort((a, b) => a - b),
    [sample.lifetimes]
  );
  const countedBins = useMemo(
    () =>
      Array.from({ length: Math.ceil(time) }, (_, i) => {
        const end = Math.min(i + 1, time);
        return decayState(sample, end, end - i).detections;
      }),
    [sample, time]
  );

  const lambda = Math.LN2 / sample.halfLifeSeconds;
  const initialActivityBq = lambda * sample.initialCount;
  const maxAxisValue = chartMode === "N" ? sample.initialCount : initialActivityBq;
  const countMaximum = Math.max(Math.ceil(sample.initialCount / 4), 3, ...countedBins);

  const columns = Math.ceil(Math.sqrt(sample.initialCount * 1.5));
  const rows = Math.ceil(sample.initialCount / columns);

  const halfLifeMilestones = [1, 2, 3]
    .map((k) => ({
      k,
      t: k * sample.halfLifeSeconds,
      labelT: k === 1 ? "T" : `${k}T`,
      fractionLabel: chartMode === "N" ? `N₀/${2 ** k}` : `H₀/${2 ** k}`,
      value: maxAxisValue / 2 ** k,
    }))
    .filter((m) => m.t <= duration);

  const formatAxisValue = (val: number) => {
    if (chartMode === "N") return String(Math.round(val));
    return val >= 10 ? val.toFixed(1) : val.toFixed(2);
  };

  return (
    <div className={styles.responsiveVisual}>
      {/* 1. BIỂU DIỄN HẠT NHÂN RIÊNG LẺ (#k) */}
      <figure className={styles.visualPanel}>
        <p className={styles.chartTitle}>
          1. Theo dõi 1 hạt nhân riêng lẻ: Hạt #{safeTrackedIndex + 1} / {sample.initialCount}
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 14px",
            alignItems: "center",
            marginBottom: "8px",
            fontSize: "13.5px",
            color: "#e2f1f8",
          }}
        >
          <span
            style={{
              padding: "3px 10px",
              borderRadius: "999px",
              fontWeight: 700,
              background: trackedHasDecayed ? "#7f1d1d" : "#0f766e",
              color: "#ffffff",
            }}
          >
            {trackedHasDecayed
              ? `Đã phân rã lúc t_${safeTrackedIndex + 1} = ${trackedLifetime.toFixed(2)} s`
              : `Tại t = ${time.toFixed(1)} s: Chưa phân rã (không đoán trước được lúc phân rã!)`}
          </span>
          <span style={{ color: "#bcd4e0", fontSize: "12.5px" }}>
            Chu kì bán rã của mẫu T = {sample.halfLifeSeconds} s chỉ là quy luật thống kê của cả tập hợp.
          </span>
        </div>

        <svg
          viewBox="0 0 560 66"
          style={{ width: "100%", height: "auto", display: "block" }}
          role="img"
          aria-label={`Trục thời gian của riêng hạt nhân số ${safeTrackedIndex + 1}`}
        >
          <title>Diễn biến ngẫu nhiên của một hạt nhân riêng lẻ theo thời gian t</title>
          <line x1="28" y1="36" x2="532" y2="36" stroke="#35586c" strokeWidth="4" strokeLinecap="round" />
          {/* Đoạn tồn tại ở trạng thái hạt nhân mẹ */}
          {(() => {
            const xScale = (v: number) => 28 + (504 * Math.min(duration, Math.max(0, v))) / duration;
            const activeEnd = trackedHasDecayed ? Math.min(trackedLifetime, duration) : time;
            return (
              <>
                <line
                  x1="28"
                  y1="36"
                  x2={xScale(activeEnd)}
                  y2="36"
                  stroke="#5ae5c1"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                {trackedHasDecayed && trackedLifetime <= duration && (
                  <>
                    <line
                      x1={xScale(trackedLifetime)}
                      y1="36"
                      x2={xScale(time)}
                      y2="36"
                      stroke="#64748b"
                      strokeWidth="4"
                      strokeDasharray="5 4"
                    />
                    <circle
                      cx={xScale(trackedLifetime)}
                      cy="36"
                      r="7"
                      fill="#fbbf24"
                      stroke="#ffffff"
                      strokeWidth="1.8"
                    />
                    <text
                      x={Math.min(510, Math.max(48, xScale(trackedLifetime)))}
                      y="18"
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill="#fde68a"
                    >
                      Phân rã: {trackedLifetime.toFixed(1)} s
                    </text>
                  </>
                )}
                {/* Con trỏ thời gian hiện tại t */}
                <line x1={xScale(time)} y1="14" x2={xScale(time)} y2="54" stroke="#f43f5e" strokeWidth="2" />
                <circle
                  cx={xScale(time)}
                  cy="36"
                  r="5.5"
                  fill={trackedHasDecayed ? "#64748b" : "#5ae5c1"}
                  stroke="#f43f5e"
                  strokeWidth="2"
                />
                <text x="28" y="60" fontSize="11" fill="#bcd4e0">
                  0 s
                </text>
                <text x="532" y="60" textAnchor="end" fontSize="11" fill="#bcd4e0">
                  {duration} s
                </text>
              </>
            );
          })()}
        </svg>
      </figure>

      {/* 2. BIỂU DIỄN TẬP HỢP NHIỀU HẠT NHÂN (MẠNG LƯỚI N₀ HẠT) */}
      <figure className={styles.visualPanel}>
        <p className={styles.chartTitle}>
          2. Tập hợp {sample.initialCount} hạt nhân (chạm vào chấm bất kì để chọn hạt theo dõi)
        </p>
        {layouts.map((layout) => {
          const spacing = Math.min(28, (layout.width - 44) / columns, 220 / rows);
          const height = Math.max(68, 36 + rows * spacing);
          return (
            <svg
              key={layout.name}
              className={layout.name === "compact" ? styles.compactSvg : styles.wideSvg}
              viewBox={`0 0 ${layout.width} ${height}`}
              role="img"
              aria-label={`Lượt seed ${sample.seed}: ${state.remaining} hạt chưa phân rã và ${state.decayed} hạt đã phân rã tại ${time.toFixed(1)} giây.`}
            >
              <title>Tập hợp các hạt nhân trong mẫu giả định</title>
              {sample.lifetimes.map((lifetime, i) => {
                const decayed = lifetime <= time;
                const recent = decayed && lifetime > time - 1;
                const isTracked = i === safeTrackedIndex;
                const cx = 22 + (i % columns) * spacing;
                const cy = 18 + Math.floor(i / columns) * spacing;
                const r = Math.max(3.2, spacing * 0.31);
                return (
                  <g
                    key={i}
                    onClick={onSelectNucleus ? () => onSelectNucleus(i) : undefined}
                    style={onSelectNucleus ? { cursor: "pointer" } : undefined}
                  >
                    {isTracked && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r + 3.2}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2.2"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={decayed ? "#5c7181" : "#5ae5c1"}
                      stroke={recent ? "#ffcb71" : isTracked ? "#ffffff" : "none"}
                      strokeWidth={recent || isTracked ? "2" : "0"}
                    />
                  </g>
                );
              })}
            </svg>
          );
        })}
        <figcaption className={styles.visualLegend}>
          <span>
            <i style={{ background: "#5ae5c1" }} aria-hidden="true" />
            Chưa phân rã ({state.remaining})
          </span>
          <span>
            <i style={{ background: "#5c7181" }} aria-hidden="true" />
            Đã phân rã ({state.decayed})
          </span>
          <span>
            <i style={{ background: "transparent", border: "2px solid #ffcb71" }} aria-hidden="true" />
            Vừa phân rã trong 1 s
          </span>
          <span>
            <i style={{ background: "transparent", border: "2px solid #f43f5e" }} aria-hidden="true" />
            Hạt #{safeTrackedIndex + 1} đang theo dõi
          </span>
        </figcaption>
      </figure>

      {/* 3. ĐỒ THỊ ĐỒNG BỘ THEO THỜI GIAN t (s): N(t) (hạt) HOẶC H(t) = λN(t) (Bq) */}
      <figure className={styles.visualPanel}>
        <p className={styles.chartTitle}>
          {chartMode === "N"
            ? "3. Đồ thị số hạt nhân mẹ còn lại N(t) (đơn vị: hạt) theo thời gian t (s)"
            : "3. Đồ thị độ phóng xạ H(t) = λN(t) (đơn vị: Bq) theo thời gian t (s)"}
        </p>
        {layouts.map((layout) => {
          const x = (tVal: number) =>
            layout.left + ((layout.right - layout.left) * tVal) / duration;
          const y = (vVal: number) =>
            layout.bottom -
            ((layout.bottom - layout.top) * vVal) / Math.max(maxAxisValue, 1e-9);

          let population = sample.initialCount;
          const scaleFactor = chartMode === "N" ? 1 : lambda;
          let stepPath = `M${x(0)},${y(population * scaleFactor)}`;
          for (const lifetime of orderedLifetimes) {
            if (lifetime > time) break;
            stepPath += `H${x(lifetime)}V${y(--population * scaleFactor)}`;
          }
          stepPath += `H${x(time)}`;

          const currentSimVal = state.remaining * scaleFactor;
          const expectedPolyline = expected
            .map((p) => {
              const val = chartMode === "N" ? p.expected : p.expectedActivityBq;
              return `${x(p.timeSeconds)},${y(val)}`;
            })
            .join(" ");

          const xTicks =
            layout.name === "compact"
              ? [0, Math.round(duration / 2), duration]
              : [
                  0,
                  Math.round(duration / 4),
                  Math.round(duration / 2),
                  Math.round((3 * duration) / 4),
                  duration,
                ];

          return (
            <svg
              key={layout.name}
              className={layout.name === "compact" ? styles.compactSvg : styles.wideSvg}
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              role="img"
              aria-label={
                chartMode === "N"
                  ? `Đồ thị N(t) (hạt) theo t (s). Lượt hiện tại ${state.remaining} hạt; kì vọng ${state.expected.toFixed(1)} hạt.`
                  : `Đồ thị độ phóng xạ H(t) (Bq) theo t (s). Kì vọng ${state.expectedActivityBq.toFixed(2)} Bq.`
              }
            >
              <title>
                {chartMode === "N"
                  ? "Đồ thị số hạt nhân mẹ còn lại N(t) và các mốc bán rã T, 2T, 3T"
                  : "Đồ thị độ phóng xạ H(t) = λN(t) và các mốc bán rã T, 2T, 3T"}
              </title>

              {/* Nhãn trục tung kèm đơn vị */}
              <text
                x="10"
                y="16"
                fill="#effbff"
                fontSize={layout.fontSize}
                fontWeight="700"
              >
                {chartMode === "N" ? "N(t) (hạt)" : "H(t) (Bq)"}
              </text>

              {/* Lưới ngang 0, 1/8, 1/4, 1/2, 1 (N₀ hoặc H₀) */}
              {[
                { f: 0, tag: "0" },
                { f: 0.125, tag: layout.name === "wide" ? (chartMode === "N" ? "N₀/8" : "H₀/8") : "" },
                { f: 0.25, tag: chartMode === "N" ? "N₀/4" : "H₀/4" },
                { f: 0.5, tag: chartMode === "N" ? "N₀/2" : "H₀/2" },
                { f: 1, tag: chartMode === "N" ? "N₀" : "H₀" },
              ].map(({ f, tag }) => {
                const val = f * maxAxisValue;
                return (
                  <g key={f} fill="#c6d9e3" fontSize={layout.fontSize - 1}>
                    <path
                      d={`M${layout.left} ${y(val)}H${layout.right}`}
                      stroke="#244254"
                      strokeDasharray={f === 0 || f === 1 ? undefined : "3 3"}
                    />
                    {tag && (
                      <text x={layout.left - 6} y={y(val) + 4} textAnchor="end">
                        {f === 1 || f === 0
                          ? formatAxisValue(val)
                          : layout.name === "wide"
                            ? `${tag} (${formatAxisValue(val)})`
                            : formatAxisValue(val)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Trục tọa độ */}
              <path
                d={`M${layout.left} ${layout.top - 4}V${layout.bottom}H${layout.right}`}
                fill="none"
                stroke="#8cb2c4"
                strokeWidth="1.4"
              />

              {/* Đánh dấu các mốc chu kì bán rã T, 2T, 3T */}
              {halfLifeMilestones.map((m) => (
                <g key={m.k}>
                  <line
                    x1={x(m.t)}
                    y1={y(m.value)}
                    x2={x(m.t)}
                    y2={layout.bottom}
                    stroke="#f59e0b"
                    strokeWidth="1.3"
                    strokeDasharray="4 3"
                    opacity="0.85"
                  />
                  <line
                    x1={layout.left}
                    y1={y(m.value)}
                    x2={x(m.t)}
                    y2={y(m.value)}
                    stroke="#f59e0b"
                    strokeWidth="1.1"
                    strokeDasharray="3 3"
                    opacity="0.65"
                  />
                  <circle cx={x(m.t)} cy={y(m.value)} r="4" fill="#fbbf24" />
                  <text
                    x={x(m.t)}
                    y={layout.bottom + 15}
                    textAnchor="middle"
                    fill="#fde68a"
                    fontSize={layout.fontSize - 0.5}
                    fontWeight="700"
                  >
                    {m.labelT} ({m.t}s)
                  </text>
                </g>
              ))}

              {/* Mốc thời gian chuẩn dưới trục hoành */}
              {xTicks.map((tTick) => (
                <text
                  key={tTick}
                  x={x(tTick)}
                  y={layout.bottom + 31}
                  textAnchor="middle"
                  fill="#9ec0d1"
                  fontSize={layout.fontSize - 1}
                >
                  {tTick} s
                </text>
              ))}

              {/* Đường kì vọng hàm mũ */}
              <polyline
                points={expectedPolyline}
                fill="none"
                stroke="#7eb9ff"
                strokeWidth="2.8"
                strokeDasharray="7 5"
              />

              {/* Đường bậc thang thực tế của lượt mô phỏng */}
              <path d={stepPath} fill="none" stroke="#5ae5c1" strokeWidth="2.5" />

              {/* Đường dóng thời điểm hiện tại t */}
              <path
                d={`M${x(time)} ${layout.top}V${layout.bottom}`}
                stroke="#ffcb71"
                strokeWidth="1.8"
              />
              <circle cx={x(time)} cy={y(currentSimVal)} r="4.5" fill="#5ae5c1" />
            </svg>
          );
        })}
        <p className={styles.axisCaption}>Trục hoành: Thời gian t (s) — Các mốc vàng đánh dấu T, 2T, 3T</p>
        <figcaption className={styles.visualLegend}>
          <span>
            <i style={{ background: "#5ae5c1" }} aria-hidden="true" />
            {chartMode === "N" ? "N(t) lượt chạy (hạt)" : "λ·N(t) lượt chạy (Bq)"}
          </span>
          <span>
            <i style={{ background: "transparent", borderTop: "3px dashed #7eb9ff", height: 0 }} aria-hidden="true" />
            {chartMode === "N"
              ? "Đường lí thuyết N(t) = N₀·2^(−t/T)"
              : "Đường lí thuyết H(t) = H₀·2^(−t/T)"}
          </span>
          <span>
            <i style={{ background: "#fbbf24" }} aria-hidden="true" />
            Mốc chu kì bán rã T ({sample.halfLifeSeconds} s)
          </span>
        </figcaption>
      </figure>

      {/* Biểu đồ bổ trợ: Số xung ghi nhận trong từng khoảng 1 s */}
      <figure className={styles.visualPanel}>
        <p className={styles.chartTitle}>Số phân rã đếm được trong từng khoảng Δt = 1 s (xung/s)</p>
        {layouts.map((layout) => {
          const x = (tVal: number) =>
            layout.left + ((layout.right - layout.left) * tVal) / duration;
          const top = 22;
          const bottom = layout.name === "compact" ? 132 : 162;
          const maximum = countMaximum;
          return (
            <svg
              key={layout.name}
              className={layout.name === "compact" ? styles.compactSvg : styles.wideSvg}
              viewBox={`0 0 ${layout.width} ${bottom + 36}`}
              role="img"
              aria-label="Số phân rã máy ghi nhận lí tưởng trong từng khoảng một giây"
            >
              <title>Số xung đếm theo từng khoảng đo 1 giây</title>
              <text x="10" y="15" fill="#effbff" fontSize={layout.fontSize - 0.5} fontWeight="700">
                ΔN/Δt (xung/s)
              </text>
              <path d={`M${layout.left} ${top}V${bottom}H${layout.right}`} fill="none" stroke="#b5cbd7" />
              {countedBins.map((count, i) => {
                const height = ((bottom - top) * count) / maximum;
                return (
                  <rect
                    key={i}
                    x={x(i) + 1}
                    y={bottom - height}
                    width={Math.max(1, (layout.right - layout.left) / duration - 2)}
                    height={height}
                    fill="#ffcb71"
                  />
                );
              })}
              <text x={layout.left - 8} y={bottom + 4} textAnchor="end" fill="#d3e4ed" fontSize={layout.fontSize - 1}>
                0
              </text>
              <text x={layout.left - 8} y={top + 6} textAnchor="end" fill="#d3e4ed" fontSize={layout.fontSize - 1}>
                {maximum}
              </text>
              {[0, Math.round(duration / 2), duration].map((tTick) => (
                <text
                  key={tTick}
                  x={x(tTick)}
                  y={bottom + 22}
                  textAnchor="middle"
                  fill="#d3e4ed"
                  fontSize={layout.fontSize - 1}
                >
                  {tTick} s
                </text>
              ))}
            </svg>
          );
        })}
        <p className={styles.axisCaption}>Thời gian t (s)</p>
        <figcaption className={styles.chartCaption}>
          Số xung đếm trong từng giây thăng giáng ngẫu nhiên quanh độ phóng xạ kì vọng H(t) = λN(t).
        </figcaption>
      </figure>
    </div>
  );
}
