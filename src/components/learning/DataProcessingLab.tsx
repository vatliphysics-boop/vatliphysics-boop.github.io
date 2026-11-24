"use client";

import React, { useMemo, useState } from "react";
import { LatexMath } from "@/components/learning/LatexMath";

/**
 * Bộ sinh số giả ngẫu nhiên tất định Mulberry32 từ seed nguyên.
 * Bảo đảm kết quả thuần khiết (pure) khi render và tái lập được trong lớp học.
 */
function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface SimulationRow {
  stepIndex: number;
  timeSec: number;
  ratioT: number;
  simulatedN: number;
  expectedN: number;
  simulatedFraction: number;
  expectedFraction: number;
}

const TIME_RATIOS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4] as const;

export function DataProcessingLab() {
  const [initialNuclei, setInitialNuclei] = useState<number>(800);
  const [halfLife, setHalfLife] = useState<number>(30);
  const [seed, setSeed] = useState<number>(2026);
  const [normalizedAxes, setNormalizedAxes] = useState<boolean>(false);
  const [ruleNote, setRuleNote] = useState<string>("");

  const rows: SimulationRow[] = useMemo(() => {
    const rng = createMulberry32(seed * 977 + initialNuclei * 13 + halfLife * 31);
    const ln2 = Math.LN2;
    const decayTimes: number[] = [];

    for (let i = 0; i < initialNuclei; i += 1) {
      const u = Math.max(1e-9, 1 - rng());
      const lifetime = (-halfLife * Math.log(u)) / ln2;
      decayTimes.push(lifetime);
    }

    return TIME_RATIOS.map((ratioT, stepIndex) => {
      const timeSec = Number((ratioT * halfLife).toFixed(1));
      let remaining = 0;
      for (let i = 0; i < decayTimes.length; i += 1) {
        if (decayTimes[i] > timeSec) remaining += 1;
      }
      const simulatedN = ratioT === 0 ? initialNuclei : remaining;
      const expectedN = initialNuclei * Math.pow(2, -ratioT);
      return {
        stepIndex,
        timeSec,
        ratioT,
        simulatedN,
        expectedN,
        simulatedFraction: simulatedN / initialNuclei,
        expectedFraction: Math.pow(2, -ratioT),
      };
    });
  }, [initialNuclei, halfLife, seed]);

  const lambdaPerSec = Math.LN2 / halfLife;

  // Cấu hình hệ trục SVG
  const svgWidth = 680;
  const svgHeight = 360;
  const padLeft = 72;
  const padRight = 28;
  const padTop = 28;
  const padBottom = 56;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const maxX = normalizedAxes ? 4 : 4 * halfLife;
  const maxY = normalizedAxes ? 1 : initialNuclei;

  const toSvgX = (xVal: number) => padLeft + (xVal / maxX) * plotW;
  const toSvgY = (yVal: number) => padTop + plotH - (yVal / maxY) * plotH;

  const curvePath = useMemo(() => {
    const samples = 64;
    const parts: string[] = [];
    for (let i = 0; i <= samples; i += 1) {
      const ratio = (4 * i) / samples;
      const xVal = normalizedAxes ? ratio : ratio * halfLife;
      const yVal = normalizedAxes
        ? Math.pow(2, -ratio)
        : initialNuclei * Math.pow(2, -ratio);
      const sx = padLeft + (xVal / maxX) * plotW;
      const sy = padTop + plotH - (yVal / maxY) * plotH;
      const prefix = i === 0 ? "M" : "L";
      parts.push(`${prefix}${sx.toFixed(2)},${sy.toFixed(2)}`);
    }
    return parts.join(" ");
  }, [halfLife, initialNuclei, maxX, maxY, normalizedAxes, padLeft, padTop, plotH, plotW]);

  const handleExportCsv = () => {
    const header = "t (s),t/T,N_mo_phong (hat),N_ki_vong (hat),N_mo_phong/N0,Do_lech";
    const lines = rows.map((r) =>
      [
        r.timeSec.toFixed(1),
        r.ratioT.toFixed(1),
        r.simulatedN,
        r.expectedN.toFixed(1),
        r.simulatedFraction.toFixed(4),
        (r.simulatedN - r.expectedN).toFixed(1),
      ].join(","),
    );
    const metaComment = [
      `# Du lieu mo phong ngau nhien (khong phai so do thuc nghiem)`,
      `# N0 = ${initialNuclei} hat, T = ${halfLife} s, Seed = ${seed}`,
      ruleNote.trim() ? `# Nhan xet nhom: ${ruleNote.trim().replace(/\n/g, " ")}` : "",
      header,
      ...lines,
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([metaComment], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bang-so-lieu-mo-phong-N${initialNuclei}-T${halfLife}-seed${seed}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Nhãn cảnh báo dữ liệu mô phỏng trung thực */}
      <div
        role="note"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-primary-soft)",
          border: "1px solid var(--border-light)",
        }}
      >
        <div style={{ fontSize: "13.5px", color: "var(--text-primary)" }}>
          <strong style={{ color: "var(--color-primary)" }}>
            Nhãn nguồn dữ liệu — MÔ PHỎNG NGẪU NHIÊN CÓ SEED:
          </strong>{" "}
          Mỗi hạt nhân có thời điểm phân rã độc lập sinh từ phân bố mũ giả lập. Dùng để luyện kĩ
          năng lập bảng và đối chiếu đường lí thuyết, không phải số đo từ đồng vị phóng xạ thật.
        </div>
        <div style={{ fontSize: "13px" }}>
          <LatexMath math="N_{\text{lt}}(t) = N_0 \cdot 2^{-\frac{t}{T}}" />
        </div>
      </div>

      {/* Khu vực thanh trượt điều khiển N₀, T và Seed */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
          gap: "16px",
          padding: "20px",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-page)",
          border: "1px solid var(--border-light)",
        }}
      >
        <div>
          <label
            htmlFor="slider-n0"
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "13.5px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            <span>Số hạt ban đầu N₀:</span>
            <strong style={{ color: "var(--color-primary)" }}>{initialNuclei} hạt</strong>
          </label>
          <input
            id="slider-n0"
            type="range"
            min={200}
            max={2000}
            step={100}
            value={initialNuclei}
            onChange={(e) => setInitialNuclei(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--color-primary)" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11.5px",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            <span>200 hạt</span>
            <span>1100 hạt</span>
            <span>2000 hạt</span>
          </div>
        </div>

        <div>
          <label
            htmlFor="slider-half-life"
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "13.5px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            <span>Chu kì bán rã quy ước T:</span>
            <strong style={{ color: "var(--color-primary)" }}>{halfLife} s</strong>
          </label>
          <input
            id="slider-half-life"
            type="range"
            min={10}
            max={100}
            step={5}
            value={halfLife}
            onChange={(e) => setHalfLife(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--color-primary)" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11.5px",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            <span>10 s</span>
            <span>λ ≈ {lambdaPerSec.toFixed(4)} s⁻¹</span>
            <span>100 s</span>
          </div>
        </div>

        <div>
          <label
            htmlFor="seed-input"
            style={{
              display: "block",
              fontSize: "13.5px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Mã mẫu ngẫu nhiên (Seed):
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id="seed-input"
              type="number"
              min={1}
              max={999999}
              value={seed}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                setSeed(Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1);
              }}
              style={{
                width: "110px",
                padding: "7px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-dark)",
                background: "var(--bg-surface)",
                fontSize: "14px",
              }}
            />
            <button
              type="button"
              onClick={() => setSeed((prev) => ((prev * 1664525 + 1013904223) >>> 0) % 9000 + 1000)}
              style={{
                flex: 1,
                padding: "7px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-primary)",
                background: "var(--bg-surface)",
                color: "var(--color-primary)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Đổi Seed khác
            </button>
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "6px" }}>
            Giữ cùng Seed để các máy trong nhóm có cùng bảng số liệu.
          </div>
        </div>
      </div>

      {/* Đồ thị SVG có nhãn trục & đơn vị đối chiếu đường N₀·2^(-t/T) */}
      <div
        style={{
          padding: "20px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-light)",
          background: "var(--bg-surface)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "14px",
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: "16.5px", fontWeight: 700 }}>
              Đồ thị đối chiếu dữ liệu mô phỏng và đường lí thuyết
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
              Chấm tròn cam: dữ liệu mô phỏng ngẫu nhiên (Seed {seed}) · Đường nét liền xanh: kì
              vọng lí thuyết N₀·2^(−t/T)
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              aria-pressed={!normalizedAxes}
              onClick={() => setNormalizedAxes(false)}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                border: !normalizedAxes
                  ? "1.5px solid var(--color-primary)"
                  : "1px solid var(--border-light)",
                background: !normalizedAxes ? "var(--color-primary-soft)" : "var(--bg-page)",
                color: !normalizedAxes ? "var(--color-primary)" : "var(--text-secondary)",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Hệ trục (t, N)
            </button>
            <button
              type="button"
              aria-pressed={normalizedAxes}
              onClick={() => setNormalizedAxes(true)}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                border: normalizedAxes
                  ? "1.5px solid var(--color-primary)"
                  : "1px solid var(--border-light)",
                background: normalizedAxes ? "var(--color-primary-soft)" : "var(--bg-page)",
                color: normalizedAxes ? "var(--color-primary)" : "var(--text-secondary)",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Hệ trục chuẩn hóa (t/T, N/N₀)
            </button>
          </div>
        </div>

        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            role="img"
            aria-label="Đồ thị biểu diễn số hạt nhân còn lại theo thời gian đối chiếu dữ liệu mô phỏng và đường lí thuyết"
            style={{ width: "100%", height: "auto", minWidth: "480px", display: "block" }}
          >
            <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="#ffffff" rx={8} />

            {/* Lưới ngang & nhãn trục tung */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const yVal = frac * maxY;
              const yPos = toSvgY(yVal);
              const label = normalizedAxes
                ? frac.toFixed(2)
                : Math.round(yVal).toString();
              return (
                <g key={`y-${frac}`}>
                  <line
                    x1={padLeft}
                    y1={yPos}
                    x2={svgWidth - padRight}
                    y2={yPos}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                  />
                  <text
                    x={padLeft - 10}
                    y={yPos + 4}
                    textAnchor="end"
                    fontSize={11.5}
                    fill="#425a6b"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Lưới dọc & nhãn trục hoành */}
            {[0, 1, 2, 3, 4].map((stepT) => {
              const xVal = normalizedAxes ? stepT : stepT * halfLife;
              const xPos = toSvgX(xVal);
              const label = normalizedAxes ? `${stepT}` : `${xVal}`;
              return (
                <g key={`x-${stepT}`}>
                  <line
                    x1={xPos}
                    y1={padTop}
                    x2={xPos}
                    y2={padTop + plotH}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                  />
                  <text
                    x={xPos}
                    y={padTop + plotH + 20}
                    textAnchor="middle"
                    fontSize={11.5}
                    fill="#425a6b"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Đường gióng mốc bán rã đầu tiên t = T, N = N₀/2 */}
            <line
              x1={toSvgX(normalizedAxes ? 1 : halfLife)}
              y1={toSvgY(normalizedAxes ? 0.5 : initialNuclei / 2)}
              x2={toSvgX(normalizedAxes ? 1 : halfLife)}
              y2={padTop + plotH}
              stroke="#8c4c12"
              strokeWidth={1.3}
              strokeDasharray="4 4"
            />
            <line
              x1={padLeft}
              y1={toSvgY(normalizedAxes ? 0.5 : initialNuclei / 2)}
              x2={toSvgX(normalizedAxes ? 1 : halfLife)}
              y2={toSvgY(normalizedAxes ? 0.5 : initialNuclei / 2)}
              stroke="#8c4c12"
              strokeWidth={1.3}
              strokeDasharray="4 4"
            />

            {/* Hai trục tọa độ chính */}
            <line
              x1={padLeft}
              y1={padTop}
              x2={padLeft}
              y2={padTop + plotH}
              stroke="#173244"
              strokeWidth={1.8}
            />
            <line
              x1={padLeft}
              y1={padTop + plotH}
              x2={svgWidth - padRight}
              y2={padTop + plotH}
              stroke="#173244"
              strokeWidth={1.8}
            />

            {/* Đường lí thuyết N₀·2^(-t/T) */}
            <path d={curvePath} fill="none" stroke="#2b3b93" strokeWidth={2.6} />

            {/* Các điểm dữ liệu mô phỏng */}
            {rows.map((row) => {
              const xVal = normalizedAxes ? row.ratioT : row.timeSec;
              const yVal = normalizedAxes ? row.simulatedFraction : row.simulatedN;
              const cx = toSvgX(xVal);
              const cy = toSvgY(yVal);
              return (
                <g key={row.stepIndex}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill="#d97706"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                </g>
              );
            })}

            {/* Nhãn tên trục kèm đơn vị */}
            <text
              x={padLeft + plotW / 2}
              y={svgHeight - 12}
              textAnchor="middle"
              fontSize={12.5}
              fontWeight={600}
              fill="#173244"
            >
              {normalizedAxes
                ? "Tỉ số thời gian và chu kì bán rã t / T (không thứ nguyên)"
                : "Thời gian khảo sát t (đơn vị: s)"}
            </text>
            <text
              x={18}
              y={padTop + plotH / 2}
              textAnchor="middle"
              fontSize={12.5}
              fontWeight={600}
              fill="#173244"
              transform={`rotate(-90 18 ${padTop + plotH / 2})`}
            >
              {normalizedAxes
                ? "Tỉ lệ hạt còn lại N / N₀"
                : "Số hạt nhân còn lại N (đơn vị: hạt)"}
            </text>

            {/* Chú giải góc phải trên */}
            <g transform={`translate(${svgWidth - 265}, ${padTop + 10})`}>
              <rect
                x={0}
                y={0}
                width={230}
                height={52}
                rx={6}
                fill="#f4f7fb"
                stroke="#d5e0e6"
              />
              <line x1={12} y1={17} x2={34} y2={17} stroke="#2b3b93" strokeWidth={2.6} />
              <text x={42} y={21} fontSize={11.5} fill="#173244">
                Đường lí thuyết N₀·2^(−t/T)
              </text>
              <circle cx={23} cy={37} r={4.5} fill="#d97706" stroke="#fff" strokeWidth={1.2} />
              <text x={42} y={41} fontSize={11.5} fill="#173244">
                Điểm mô phỏng ngẫu nhiên
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Bảng số liệu mô phỏng chi tiết */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13.5px",
            background: "var(--bg-surface)",
          }}
        >
          <thead>
            <tr style={{ background: "var(--bg-surface-elevated)", textAlign: "left" }}>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-light)" }}>
                Thời điểm t (s)
              </th>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-light)" }}>
                Tỉ số t / T
              </th>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-light)" }}>
                N mô phỏng (hạt)
              </th>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-light)" }}>
                N kì vọng N₀·2^(−t/T)
              </th>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-light)" }}>
                Tỉ lệ N / N₀ (mô phỏng)
              </th>
              <th style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-light)" }}>
                Độ lệch (hạt)
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const diff = row.simulatedN - row.expectedN;
              const isIntegerHalfLife = Number.isInteger(row.ratioT) && row.ratioT > 0;
              return (
                <tr
                  key={row.stepIndex}
                  style={{
                    borderBottom: "1px solid var(--border-light)",
                    background: isIntegerHalfLife ? "var(--bg-page)" : "transparent",
                  }}
                >
                  <td style={{ padding: "9px 12px", fontWeight: 600 }}>{row.timeSec.toFixed(1)}</td>
                  <td style={{ padding: "9px 12px" }}>{row.ratioT.toFixed(1)}</td>
                  <td style={{ padding: "9px 12px", fontWeight: 700, color: "var(--color-primary)" }}>
                    {row.simulatedN}
                  </td>
                  <td style={{ padding: "9px 12px" }}>{row.expectedN.toFixed(1)}</td>
                  <td style={{ padding: "9px 12px" }}>{row.simulatedFraction.toFixed(3)}</td>
                  <td
                    style={{
                      padding: "9px 12px",
                      color:
                        Math.abs(diff) < 1e-6
                          ? "var(--text-muted)"
                          : diff > 0
                            ? "var(--semantic-info)"
                            : "var(--semantic-warning)",
                    }}
                  >
                    {diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Khung ghi câu diễn giải quy luật của nhóm & xuất CSV */}
      <div
        style={{
          padding: "18px",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-page)",
          border: "1px solid var(--border-light)",
          display: "grid",
          gap: "12px",
        }}
      >
        <label
          htmlFor="data-lab-conclusion"
          style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}
        >
          Câu diễn giải quy luật của nhóm (so sánh giữa điểm mô phỏng và đường kì vọng khi đổi N₀, T):
        </label>
        <textarea
          id="data-lab-conclusion"
          rows={2}
          value={ruleNote}
          onChange={(e) => setRuleNote(e.target.value)}
          placeholder="Ví dụ: Cứ sau mỗi khoảng thời gian t = T, tỉ lệ N/N₀ giảm đi xấp xỉ một nửa; khi N₀ càng lớn thì tỉ lệ thăng giáng ngẫu nhiên quanh đường N₀·2^(−t/T) càng nhỏ..."
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-dark)",
            background: "var(--bg-surface)",
            fontSize: "14px",
          }}
        />
        <div>
          <button
            type="button"
            onClick={handleExportCsv}
            style={{
              padding: "9px 16px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "var(--color-primary)",
              color: "var(--color-primary-on)",
              fontWeight: 600,
              fontSize: "13.5px",
              cursor: "pointer",
            }}
          >
            Tải bảng số liệu mô phỏng (.csv)
          </button>
        </div>
      </div>
    </div>
  );
}
