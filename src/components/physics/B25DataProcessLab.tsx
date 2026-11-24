"use client";

import { useId, useMemo, useRef, useState } from "react";
import {
  activityAt,
  B25_COMPARISON,
  halfActivityBracket,
  SGK_TABLE_25_1,
} from "@/lib/sgk-b25-decay";
import { LatexMath } from "@/components/learning/LatexMath";
import { usePersistedLabState, useSyncLabProgress } from "@/lib/use-persisted-lab-state";
import { ChoiceCheck } from "./shared";
import { useProcessClock } from "./useProcessClock";
import styles from "./ProcessLab.module.css";

export const B25_DATA_LAB_STORAGE_KEY = "b25-data-lab-v1";

interface B25DataLabPersistedState {
  readonly halfLife: number;
  readonly bracketKey: string;
  readonly bracketHistoryCount: number;
  readonly plottedTimes: readonly number[];
  readonly explanation: string;
  readonly estimateSaved: boolean;
  readonly showFit: boolean;
  readonly compare: boolean;
  readonly answered: boolean;
}

const VALID_TABLE_TIMES = new Set(SGK_TABLE_25_1.map((r) => r.t));
const BRACKET_OPTIONS = [
  { key: "", label: "— Chọn hai mốc kẹp mức H₀/2 trên Bảng 25.1 —", from: null, to: null },
  { key: "0_30", label: "Khoảng 0 s – 30 s", from: 0, to: 30 },
  { key: "30_60", label: "Khoảng 30 s – 60 s", from: 30, to: 60 },
  { key: "60_120", label: "Khoảng 60 s – 120 s", from: 60, to: 120 },
  { key: "120_180", label: "Khoảng 120 s – 180 s", from: 120, to: 180 },
] as const;

const INITIAL_B25_DATA_STATE: B25DataLabPersistedState = {
  halfLife: B25_COMPARISON.halfLifeB, // Khởi tạo ở 60 s để học sinh tự ước lượng, không lộ trước đáp số
  bracketKey: "",
  bracketHistoryCount: 0,
  plottedTimes: [0],
  explanation: "",
  estimateSaved: false,
  showFit: false,
  compare: false,
  answered: false,
};

function parseB25DataState(
  raw: unknown,
  fallback: B25DataLabPersistedState
): B25DataLabPersistedState {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const halfLife =
    typeof obj.halfLife === "number" &&
    Number.isFinite(obj.halfLife) &&
    obj.halfLife >= 10 &&
    obj.halfLife <= 120
      ? Math.round(obj.halfLife * 2) / 2
      : fallback.halfLife;
  const bracketKey =
    typeof obj.bracketKey === "string" &&
    BRACKET_OPTIONS.some((o) => o.key === obj.bracketKey)
      ? obj.bracketKey
      : "";
  const bracketHistoryCount =
    typeof obj.bracketHistoryCount === "number" && Number.isFinite(obj.bracketHistoryCount)
      ? Math.max(0, Math.floor(obj.bracketHistoryCount))
      : 0;
  const plottedTimes = Array.isArray(obj.plottedTimes)
    ? Array.from(
        new Set(
          obj.plottedTimes.filter(
            (x): x is number => typeof x === "number" && VALID_TABLE_TIMES.has(x)
          )
        )
      )
    : fallback.plottedTimes;
  const explanation = typeof obj.explanation === "string" ? obj.explanation : "";
  return {
    halfLife,
    bracketKey,
    bracketHistoryCount,
    plottedTimes: plottedTimes.length > 0 ? plottedTimes : [0],
    explanation,
    estimateSaved: Boolean(obj.estimateSaved) && explanation.trim().length >= 12,
    showFit: Boolean(obj.showFit),
    compare: Boolean(obj.compare),
    answered: Boolean(obj.answered),
  };
}

const layouts = [
  {
    name: "compact",
    width: 320,
    height: 245,
    left: 46,
    right: 304,
    top: 28,
    bottom: 204,
    fontSize: 11.5,
    ticks: [0, 60, 120, 180, 240, 300, 360],
  },
  {
    name: "wide",
    width: 720,
    height: 320,
    left: 64,
    right: 688,
    top: 34,
    bottom: 268,
    fontSize: 14,
    ticks: [0, 60, 120, 180, 240, 300, 360],
  },
] as const;

const curve = (period: number) =>
  Array.from({ length: 121 }, (_, i) => ({
    time: i * 3,
    activity: activityAt(i * 3, period),
  }));

const equation = (
  <LatexMath block math={String.raw`H_{\text{mô hình}}(t)=H_0\cdot 2^{-\frac{t}{T}}\;\mathrm{Bq}\quad (H_0 = 151\;\mathrm{Bq})`} />
);

export function B25DataProcessLab({ onSubDone }: { onSubDone?: (done: boolean) => void }) {
  const [persisted, setPersisted, resetPersisted] = usePersistedLabState(
    B25_DATA_LAB_STORAGE_KEY,
    INITIAL_B25_DATA_STATE,
    parseB25DataState
  );
  const [draftExplanation, setDraftExplanation] = useState<string | null>(null);
  const [tracedRowTime, setTracedRowTime] = useState<number>(0);
  const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({});
  const explanationValue = draftExplanation ?? persisted.explanation;

  const container = useRef<HTMLDivElement>(null);
  const clipId = useId();
  const clock = useProcessClock(360, 30, container);
  const bracket = halfActivityBracket();
  const t = clock.time;

  const halfLife = persisted.halfLife;
  const showFit = persisted.showFit;
  const compare = persisted.compare;

  const selected = SGK_TABLE_25_1.find((row) => Math.abs(row.t - t) < 0.05);
  const tracedRowIndex = SGK_TABLE_25_1.findIndex((row) => row.t === tracedRowTime);
  const tracedRow = tracedRowIndex >= 0 ? SGK_TABLE_25_1[tracedRowIndex] : SGK_TABLE_25_1[0];

  const comparisonHalfLife =
    Math.abs(halfLife - B25_COMPARISON.halfLifeB) < 5
      ? B25_COMPARISON.halfLifeA
      : B25_COMPARISON.halfLifeB;

  const fitPoints = useMemo(() => curve(halfLife), [halfLife]);
  const comparisonPoints = useMemo(() => curve(comparisonHalfLife), [comparisonHalfLife]);

  const selectedBracketOpt =
    BRACKET_OPTIONS.find((o) => o.key === persisted.bracketKey) ?? BRACKET_OPTIONS[0];
  const isBracketValid = persisted.bracketKey === "30_60";
  const isHalfLifeValid = halfLife >= 38 && halfLife <= 46;

  const hasBracketChecked =
    isBracketValid &&
    persisted.plottedTimes.includes(bracket.fromSeconds) &&
    persisted.plottedTimes.includes(bracket.toSeconds);

  const complete =
    hasBracketChecked &&
    isHalfLifeValid &&
    persisted.estimateSaved &&
    showFit &&
    persisted.answered;

  useSyncLabProgress(complete, onSubDone);

  function tracePointAndRow(timeSec: number, scrollRow = false) {
    setTracedRowTime(timeSec);
    clock.seek(timeSec);
    setPersisted((prev) => ({
      ...prev,
      plottedTimes: prev.plottedTimes.includes(timeSec)
        ? prev.plottedTimes
        : [...prev.plottedTimes, timeSec],
    }));
    if (scrollRow) {
      const targetRow = rowRefs.current[timeSec];
      if (targetRow && typeof targetRow.scrollIntoView === "function") {
        targetRow.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }

  function handleSelectBracket(nextKey: string) {
    const opt = BRACKET_OPTIONS.find((o) => o.key === nextKey);
    setPersisted((prev) => {
      const nextTimes =
        opt && opt.from !== null && opt.to !== null
          ? Array.from(new Set([...prev.plottedTimes, 0, opt.from, opt.to]))
          : prev.plottedTimes;
      return {
        ...prev,
        bracketKey: nextKey,
        bracketHistoryCount: nextKey ? prev.bracketHistoryCount + 1 : prev.bracketHistoryCount,
        plottedTimes: nextTimes,
      };
    });
    if (opt && opt.from !== null) {
      setTracedRowTime(opt.from);
      clock.seek(opt.from);
    }
  }

  function markAllPoints() {
    setPersisted((prev) => ({
      ...prev,
      plottedTimes: SGK_TABLE_25_1.map((r) => r.t),
    }));
  }

  function changeHalfLife(next: number) {
    if (!Number.isFinite(next)) return;
    const clamped = Math.min(120, Math.max(10, Math.round(next * 2) / 2));
    setPersisted((prev) => ({
      ...prev,
      halfLife: clamped,
    }));
  }

  function handleSaveEstimate() {
    const trimmed = explanationValue.trim();
    if (trimmed.length < 12) return;
    setPersisted((prev) => ({
      ...prev,
      explanation: trimmed,
      estimateSaved: true,
      showFit: true,
    }));
    setDraftExplanation(null);
  }

  return (
    <div
      ref={container}
      className={styles.lab}
      data-process="B25"
      data-process-ready={clock.ready}
    >
      <h3>Phân tích Bảng 25.1 &amp; Truy xuất điểm đồ thị ↔ dòng bảng dữ liệu gốc</h3>
      <p className={styles.prompt}>
        <strong>Nhiệm vụ thực hành (tách bạch dữ liệu gốc, giá trị em ước lượng và đường mô hình):</strong>{" "}
        (1) Bấm vào điểm trên đồ thị để truy về đúng dòng trong Bảng 25.1 và chọn khoảng hai mốc thời gian kẹp mức{" "}
        <code>H₀/2</code>; (2) Tự chỉnh chu kì bán rã ước lượng <code>T</code> của em và ghi cách làm; (3) Bật đường mô hình và trả lời câu hỏi kiểm tra.
      </p>

      {/* Bước 1 & 2: Chọn khoảng kẹp H0/2, tự ước lượng T và giải thích */}
      <div
        style={{
          padding: "12px 14px",
          borderRadius: "12px",
          backgroundColor: "#ffffff",
          border: "1px solid #cbdee4",
          marginBottom: "14px",
        }}
      >
        <div className={styles.controls} style={{ margin: "0 0 10px" }}>
          <label style={{ flex: "1 1 220px" }}>
            <span>Khoảng kẹp mức H₀/2 em chọn</span>
            <select
              aria-label="Khoảng kẹp mức một nửa độ phóng xạ ban đầu"
              disabled={!clock.ready}
              value={persisted.bracketKey}
              onChange={(e) => handleSelectBracket(e.target.value)}
            >
              {BRACKET_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>
              T ước lượng của em: <strong>{halfLife.toString().replace(".", ",")} s</strong>
            </span>
            <input
              aria-label="T ước lượng của em"
              type="range"
              disabled={!clock.ready}
              min="10"
              max="120"
              step="0.5"
              value={halfLife}
              onChange={(e) => changeHalfLife(Number(e.target.value))}
            />
          </label>
          <label style={{ flex: "0 1 130px" }}>
            <span>Nhập số T (s)</span>
            <input
              aria-label="Nhập số chu kì bán rã T ước lượng"
              type="number"
              inputMode="decimal"
              disabled={!clock.ready}
              min="10"
              max="120"
              step="0.5"
              value={halfLife}
              onChange={(e) => changeHalfLife(Number(e.target.value))}
            />
          </label>
        </div>

        {/* Phản hồi riêng biệt cho 3 trạng thái: chưa chọn khoảng kẹp / chọn sai / đã chọn hoặc sửa lại đúng */}
        <div
          role="status"
          data-testid="b25-lab-bracket-status"
          style={{
            marginBottom: "10px",
            padding: "8px 10px",
            borderRadius: "6px",
            fontSize: "13px",
            lineHeight: 1.5,
            backgroundColor:
              persisted.bracketKey === ""
                ? "#f8fafc"
                : isBracketValid
                  ? "#ecfdf5"
                  : "#fef2f2",
            border:
              persisted.bracketKey === ""
                ? "1px solid #cbd5e1"
                : isBracketValid
                  ? "1px solid #6ee7b7"
                  : "1px solid #fecaca",
            color:
              persisted.bracketKey === ""
                ? "#334155"
                : isBracketValid
                  ? "#065f46"
                  : "#991b1b",
          }}
        >
          {persisted.bracketKey === ""
            ? "Trạng thái khoảng kẹp: Chưa chọn. Hãy tính H₀/2 từ dòng t = 0 s của Bảng 25.1 rồi chọn hai mốc thời gian kẹp giá trị đó."
            : isBracketValid
              ? persisted.bracketHistoryCount > 1
                ? "✓ Đã điều chỉnh sang khoảng kẹp đúng (30 s – 60 s): tại 30 s độ phóng xạ còn lớn hơn H₀/2, tại 60 s đã giảm xuống dưới H₀/2."
                : "✓ Khoảng kẹp đúng (30 s – 60 s): mức một nửa độ phóng xạ ban đầu nằm giữa hai mốc đo này."
              : `Khoảng ${selectedBracketOpt.label} chưa chứa mức H₀/2: hãy kiểm tra lại giá trị H (Bq) ở hai đầu khoảng trên Bảng 25.1 so với một nửa của H₀ = 151 Bq.`}
        </div>

        <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "8px" }}>
          Giải thích cách em ước lượng T từ Bảng 25.1 / đồ thị (tối thiểu 12 kí tự):
          <textarea
            rows={2}
            value={explanationValue}
            onChange={(e) => setDraftExplanation(e.target.value)}
            placeholder="Nêu cách tính H₀/2 từ t = 0 s, đối chiếu hai mốc thời gian kẹp và cách suy ra giá trị T ước lượng..."
            style={{
              display: "block",
              width: "100%",
              marginTop: "6px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid #83a5b2",
              font: "inherit",
              fontSize: "13.5px",
            }}
          />
        </label>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            className={styles.primary}
            disabled={!clock.ready || explanationValue.trim().length < 12}
            onClick={handleSaveEstimate}
          >
            Chốt ước lượng T &amp; hiện đường mô hình
          </button>
          <button type="button" disabled={!clock.ready} onClick={markAllPoints}>
            Đánh dấu đủ 8 điểm đo trên đồ thị
          </button>
          {persisted.estimateSaved && draftExplanation === null && (
            <span
              role="status"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: isHalfLifeValid ? "#0f766e" : "#b42332",
              }}
            >
              {isHalfLifeValid
                ? `✓ Giá trị ước lượng của em: T = ${halfLife.toString().replace(".", ",")} s (hợp lí với dữ liệu Bảng 25.1).`
                : `Giá trị ước lượng hiện tại T = ${halfLife.toString().replace(".", ",")} s còn lệch nhiều so với vị trí đường cong đi qua mức H₀/2 — hãy quan sát đồ thị và điều chỉnh lại T!`}
            </span>
          )}
        </div>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.primary}
          disabled={!clock.ready}
          onClick={clock.toggle}
        >
          {clock.running ? "Tạm dừng" : t > 0 && t < 360 ? "Tiếp tục" : "Chạy con trỏ"}
        </button>
        <button type="button" disabled={!clock.ready} onClick={clock.reset}>
          Về t = 0
        </button>
        <button type="button" disabled={!clock.ready} onClick={() => clock.step(30)}>
          +30 s
        </button>
        <button
          type="button"
          disabled={!clock.ready}
          aria-pressed={showFit}
          onClick={() => setPersisted((prev) => ({ ...prev, showFit: !prev.showFit }))}
        >
          {showFit ? "Ẩn đường mô hình" : "Hiện đường mô hình"}
        </button>
        <button
          type="button"
          disabled={!clock.ready}
          aria-pressed={showFit && compare}
          onClick={() =>
            setPersisted((prev) => ({
              ...prev,
              compare: !prev.showFit || !prev.compare,
              showFit: true,
            }))
          }
        >
          Đối chiếu thêm T = {comparisonHalfLife} s
        </button>
        <label>
          <span>Thời điểm con trỏ: {t.toFixed(1)} s</span>
          <input
            aria-label="Thời điểm đối chiếu"
            type="range"
            disabled={!clock.ready}
            min="0"
            max="360"
            value={t}
            onChange={(e) => clock.seek(Number(e.target.value))}
          />
        </label>
      </div>

      <figure className={`${styles.figure} ${styles.responsiveVisual} ${styles.visualPanel}`}>
        <p className={styles.chartTitle}>Đồ thị độ phóng xạ H (Bq) theo thời gian t (s) từ Bảng 25.1 SGK</p>
        {layouts.map((layout) => {
          const x = (seconds: number) =>
            layout.left + (seconds / 360) * (layout.right - layout.left);
          const y = (activity: number) =>
            layout.bottom - (activity / 160) * (layout.bottom - layout.top);
          const id = `${clipId}-${layout.name}`;
          const isCompact = layout.name === "compact";
          return (
            <svg
              key={layout.name}
              className={isCompact ? styles.compactSvg : styles.wideSvg}
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              role="img"
              aria-label={`Đồ thị Bảng 25.1 giữ nguyên tám điểm dữ liệu gốc. Điểm đang truy xuất: dòng ${tracedRowIndex + 1}, t = ${tracedRow.t} giây, H = ${tracedRow.h} Bq.${showFit ? ` Đường mô hình T bằng ${halfLife} giây.` : ""}`}
            >
              <title>Số liệu gốc Bảng 25.1 SGK và đường hàm mũ mô hình</title>
              <defs>
                <clipPath id={id}>
                  <rect
                    x={x(0)}
                    y={layout.top - 5}
                    width={Math.max(2, x(t) - x(0))}
                    height={layout.bottom - layout.top + 7}
                  />
                </clipPath>
              </defs>

              <text
                x="8"
                y="17"
                fill="#effbff"
                fontSize={isCompact ? 11.5 : 13.5}
                fontWeight="650"
              >
                H (Bq)
              </text>
              <text
                x={(layout.left + layout.right) / 2}
                y={layout.height - 6}
                textAnchor="middle"
                fill="#effbff"
                fontSize={isCompact ? 11.5 : 13.5}
                fontWeight="650"
              >
                Thời gian t (s)
              </text>

              {[0, 40, 80, 120, 160].map((v) => (
                <g key={v}>
                  <path d={`M${layout.left} ${y(v)}H${layout.right}`} stroke="#294555" />
                  <text
                    x={layout.left - 7}
                    y={y(v) + 4}
                    textAnchor="end"
                    fill="#d3e4ed"
                    fontSize={layout.fontSize}
                  >
                    {v}
                  </text>
                </g>
              ))}

              {layout.ticks.map((v) => (
                <text
                  key={v}
                  x={x(v)}
                  y={layout.bottom + (isCompact ? 17 : 22)}
                  textAnchor="middle"
                  fill="#d3e4ed"
                  fontSize={layout.fontSize}
                >
                  {v}
                </text>
              ))}

              {/* Chỉ vẽ dải kẹp THEO KHOẢNG MÀ HỌC SINH ĐÃ CHỌN (không vẽ sẵn 30–60 s trước khi chọn!) */}
              {selectedBracketOpt.from !== null && selectedBracketOpt.to !== null && (
                <rect
                  x={x(selectedBracketOpt.from)}
                  y={layout.top}
                  width={x(selectedBracketOpt.to) - x(selectedBracketOpt.from)}
                  height={layout.bottom - layout.top}
                  fill={isBracketValid ? "#5ae5c1" : "#fb7185"}
                  opacity="0.14"
                />
              )}
              {/* Chỉ vẽ đường ngang H₀/2 sau khi học sinh đã chọn đúng khoảng kẹp hoặc bật đường mô hình */}
              {(isBracketValid || showFit) && (
                <path
                  d={`M${layout.left} ${y(bracket.halfActivityBq)}H${layout.right}`}
                  stroke="#ffcb71"
                  strokeDasharray="5 4"
                />
              )}

              {showFit && (
                <g clipPath={t > 0 ? `url(#${id})` : undefined}>
                  <polyline
                    points={fitPoints.map((p) => `${x(p.time)},${y(p.activity)}`).join(" ")}
                    fill="none"
                    stroke="#5ae5c1"
                    strokeWidth="2.6"
                  />
                  {compare && (
                    <polyline
                      points={comparisonPoints
                        .map((p) => `${x(p.time)},${y(p.activity)}`)
                        .join(" ")}
                      fill="none"
                      stroke="#ceacff"
                      strokeWidth="2.4"
                      strokeDasharray="6 4"
                    />
                  )}
                </g>
              )}

              {SGK_TABLE_25_1.map((row, idx) => {
                const isPlotted = persisted.plottedTimes.includes(row.t);
                const isTraced = row.t === tracedRowTime;
                return (
                  <g
                    key={row.t}
                    data-testid={`b25-graph-point-${layout.name}-${row.t}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => tracePointAndRow(row.t, true)}
                  >
                    {/* Vòng sáng đánh dấu điểm đang truy về dòng Bảng 25.1 */}
                    {isTraced && (
                      <circle
                        cx={x(row.t)}
                        cy={y(row.h)}
                        r={isCompact ? 9 : 11.5}
                        fill="none"
                        stroke="#fde047"
                        strokeWidth="2.2"
                      />
                    )}
                    <circle
                      cx={x(row.t)}
                      cy={y(row.h)}
                      r={isCompact ? (isPlotted ? 5 : 4) : isPlotted ? 6.5 : 5.2}
                      fill={isTraced ? "#fde047" : isPlotted ? "#ffcb71" : "#648ca3"}
                      stroke="#e6f1f7"
                      strokeWidth={isTraced ? 2.2 : 1.3}
                    />
                    <title>{`Dòng #${idx + 1} Bảng 25.1: t = ${row.t} s, H = ${row.h} Bq (Bấm để truy về dòng bảng)`}</title>
                  </g>
                );
              })}

              <path
                d={`M${x(t)} ${layout.top - 4}V${layout.bottom}`}
                stroke="#f1f9ff"
                opacity="0.8"
              />
            </svg>
          );
        })}

        <div className={styles.visualLegend} style={{ marginTop: "8px" }}>
          <span>
            <i style={{ background: "#fde047" }} aria-hidden="true" />
            Điểm đang truy dòng bảng (#{tracedRowIndex + 1}: {tracedRow.t} s; {tracedRow.h} Bq)
          </span>
          <span>
            <i style={{ background: "#ffcb71" }} aria-hidden="true" />
            Điểm đã đánh dấu ({persisted.plottedTimes.length}/8)
          </span>
          {showFit && (
            <span>
              <i style={{ background: "#5ae5c1" }} aria-hidden="true" />
              Đường mô hình T ước lượng = {halfLife.toString().replace(".", ",")} s
            </span>
          )}
          {showFit && compare && (
            <span>
              <i
                style={{ background: "transparent", borderTop: "3px dashed #ceacff", height: 0 }}
                aria-hidden="true"
              />
              Đối chiếu T = {comparisonHalfLife} s
            </span>
          )}
        </div>
        <figcaption className={styles.chartCaption}>
          Bấm trực tiếp vào bất kì chấm đo nào trên đồ thị để truy ngược về đúng dòng tương ứng trong Bảng 25.1 bên dưới (hoặc bấm dòng trong bảng để định vị điểm trên đồ thị).
        </figcaption>
      </figure>

      {/* Thanh trạng thái truy xuất hai chiều Đồ thị ↔ Dòng Bảng 25.1 */}
      <div
        data-testid="b25-trace-readout"
        style={{
          marginBottom: "12px",
          padding: "10px 12px",
          borderRadius: "8px",
          backgroundColor: "#eff6ff",
          border: "1px solid #93c5fd",
          fontSize: "13.5px",
          lineHeight: 1.5,
          color: "#1e3a8a",
        }}
      >
        <strong>Đang truy xuất điểm đồ thị ↔ Bảng 25.1:</strong> Dòng <strong>#{tracedRowIndex + 1}/8</strong> ·{" "}
        <code>t = {tracedRow.t} s</code> · Độ phóng xạ đo gốc <code>H = {tracedRow.h} Bq</code>
        {showFit && (
          <>
            {" "}· Giá trị đường mô hình (với <code>T = {halfLife.toString().replace(".", ",")} s</code>):{" "}
            <code>{activityAt(tracedRow.t, halfLife).toFixed(1).replace(".", ",")} Bq</code> (độ lệch{" "}
            <code>{(activityAt(tracedRow.t, halfLife) - tracedRow.h).toFixed(1).replace(".", ",")} Bq</code>)
          </>
        )}
      </div>

      {/* Bảng 25.1 giữ NGUYÊN VẸN chỉ số liệu gốc thực nghiệm SGK (tách khỏi giá trị mô hình) */}
      <div className={styles.table}>
        <table style={{ fontSize: "13px" }}>
          <caption style={{ textAlign: "left", fontWeight: 700, marginBottom: "6px" }}>
            Bảng 25.1 gốc · Độ phóng xạ theo thời gian (SGK tr. 121 — bấm dòng hoặc điểm đồ thị để truy xuất hai chiều)
          </caption>
          <thead>
            <tr>
              <th style={{ padding: "7px 6px" }}>Dòng</th>
              <th style={{ padding: "7px 6px" }}>t(s)</th>
              <th style={{ padding: "7px 6px" }}>H (Bq)</th>
              <th style={{ padding: "7px 6px" }}>Truy xuất trên đồ thị</th>
            </tr>
          </thead>
          <tbody>
            {SGK_TABLE_25_1.map((row, idx) => {
              const isPlotted = persisted.plottedTimes.includes(row.t);
              const isTraced = row.t === tracedRowTime;
              const isUserBracketEndpoint =
                selectedBracketOpt.from !== null &&
                (row.t === selectedBracketOpt.from || row.t === selectedBracketOpt.to);
              return (
                <tr
                  key={row.t}
                  ref={(el) => {
                    rowRefs.current[row.t] = el;
                  }}
                  data-testid={`b25-lab-row-${row.t}`}
                  data-traced={isTraced ? "true" : "false"}
                  onClick={() => tracePointAndRow(row.t, false)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: isTraced
                      ? "#fef9c3"
                      : isUserBracketEndpoint
                        ? "#eef7f8"
                        : undefined,
                    outline: isTraced ? "2px solid #ca8a04" : undefined,
                  }}
                >
                  <td style={{ padding: "6px", fontWeight: 600 }}>#{idx + 1}</td>
                  <td style={{ padding: "6px", fontWeight: isTraced ? 700 : 500 }}>{row.t}</td>
                  <td style={{ padding: "6px", fontWeight: isTraced ? 700 : 500 }}>{row.h}</td>
                  <td style={{ padding: "6px" }}>
                    <button
                      type="button"
                      disabled={!clock.ready}
                      onClick={(e) => {
                        e.stopPropagation();
                        tracePointAndRow(row.t, false);
                      }}
                      aria-label={`Truy điểm t bằng ${row.t} giây trên đồ thị`}
                      style={{ minHeight: "32px", padding: "3px 10px" }}
                    >
                      {isTraced ? "● Đang trỏ trên đồ thị" : isPlotted ? "✓ Đã chấm" : "Trỏ điểm"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Khu vực tách riêng công thức & số liệu mô hình (chỉ mở khi bật đường mô hình) */}
      {showFit && (
        <div
          style={{
            marginBottom: "12px",
            padding: "10px 12px",
            borderRadius: "8px",
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
          }}
        >
          <strong style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>
            Mô hình hàm mũ độc lập dùng để đối chiếu (với T ước lượng của em = {halfLife.toString().replace(".", ",")} s):
          </strong>
          {equation}
          <dl className={styles.metrics} style={{ marginTop: "6px" }}>
            <div>
              <dt>Con trỏ t</dt>
              <dd data-time>{t.toFixed(1)} s</dd>
            </div>
            <div>
              <dt>H mô hình (T = {halfLife.toString().replace(".", ",")} s)</dt>
              <dd data-theory>{activityAt(t, halfLife).toFixed(2)} Bq</dd>
            </div>
            <div>
              <dt>H đo gốc tại mốc</dt>
              <dd>{selected ? `${selected.h} Bq` : "Không trùng mốc bảng"}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="physics-checklist" style={{ marginBottom: "12px" }}>
        <p>
          <strong>Tiêu chí hoàn thành xử lí dữ liệu Bảng 25.1:</strong>
        </p>
        <ul>
          <li className={hasBracketChecked ? "is-done" : ""}>
            Chọn đúng khoảng hai mốc thời gian kẹp mức H₀/2 trên Bảng 25.1{" "}
            {hasBracketChecked ? "✓" : ""}
          </li>
          <li className={persisted.estimateSaved && isHalfLifeValid ? "is-done" : ""}>
            Chỉnh chu kì ước lượng T hợp lí của riêng em và lưu câu giải thích{" "}
            {persisted.estimateSaved && isHalfLifeValid ? "✓" : ""}
          </li>
          <li className={showFit && persisted.answered ? "is-done" : ""}>
            Bật đường mô hình và trả lời câu hỏi bản chất dữ liệu thực nghiệm{" "}
            {showFit && persisted.answered ? "✓" : ""}
          </li>
        </ul>
      </div>

      <ChoiceCheck
        key={persisted.answered ? "b25-data-solved" : "b25-data-unsolved"}
        initialSelected={persisted.answered ? 1 : null}
        initialChecked={persisted.answered}
        question="Khi vẽ đường hàm mũ mô hình đi qua điểm đầu H₀ = 151 Bq, tại các mốc đo như t = 30 s (85 Bq) hay t = 180 s (22 Bq) giá trị mô hình vẫn lệch vài Bq so với bảng. Nên xử lí thế nào?"
        options={[
          "Sửa lại các con số trong Bảng 25.1 cho trùng khít hoàn toàn với đường cong công thức.",
          "Giữ nguyên số liệu đo gốc; giải thích sự lệch nhỏ bằng tính ngẫu nhiên của phân rã phóng xạ, sai số phép đo và phông phóng xạ nền.",
          "Kết luận định luật phóng xạ hoàn toàn sai và chu kì bán rã tăng gấp đôi theo thời gian.",
        ]}
        correctIndex={1}
        explanation="Trong thực nghiệm vật lí hạt nhân, số phân rã đếm được dao động thống kê quanh kì vọng lí thuyết và chịu ảnh hưởng của phông nền đo. Luôn giữ nguyên dữ liệu gốc và đối chiếu trên toàn dải thời gian."
        onResult={(correct) =>
          setPersisted((prev) => ({ ...prev, answered: correct }))
        }
      />

      {complete ? (
        <div
          role="status"
          style={{
            marginTop: "14px",
            padding: "14px",
            borderRadius: "10px",
            backgroundColor: "#ecfdf5",
            border: "1.5px solid #6ee7b7",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#065f46" }}>
            ✓ Đối chiếu lời giải mẫu sau khi em đã hoàn thành (giá trị T em ước lượng:{" "}
            {halfLife.toString().replace(".", ",")} s):
          </p>
          <p style={{ margin: 0, color: "#064e3b" }}>
            • <strong>Dữ liệu gốc Bảng 25.1:</strong> Độ phóng xạ ban đầu <code>H₀ = 151 Bq</code> ⇒{" "}
            <code>H₀/2 = 75,5 Bq</code> nằm giữa hai điểm đo <code>(30 s; 85 Bq)</code> và{" "}
            <code>(60 s; 55 Bq)</code>.
            <br />• <strong>Đáp án mẫu tham khảo:</strong> Nội suy tuyến tính giữa hai mốc kẹp cho{" "}
            <strong>
              T ≈ {bracket.linearEstimateSeconds.toFixed(1).replace(".", ",")} s
            </strong>
            ; vẽ đường cong trơn hàm mũ qua toàn bộ 8 điểm đo cho <strong>T ≈ 40–45 s</strong>.
          </p>
        </div>
      ) : (
        <p className={styles.note}>
          Gợi ý thao tác: Bấm chấm trên đồ thị để truy dòng Bảng 25.1, chọn khoảng hai mốc kẹp mức <code>H₀/2</code>, chỉnh <code>T</code> cho đường mô hình khớp dữ liệu, lưu giải thích và trả lời câu hỏi kiểm tra để mở lời giải mẫu đối chiếu.
        </p>
      )}

      <div style={{ marginTop: "10px" }}>
        <button
          type="button"
          onClick={() => {
            resetPersisted();
            setDraftExplanation(null);
            setTracedRowTime(0);
            clock.reset();
          }}
        >
          Làm lại bài xử lí số liệu
        </button>
      </div>
    </div>
  );
}
