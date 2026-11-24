"use client";

import { useMemo, useRef, useSyncExternalStore } from "react";
import {
  createDecaySample,
  decayState,
  decayProcessCSV,
  DECAY_COMPARISON,
  type DecayParameters,
} from "@/lib/radioactive-decay-model";
import { usePersistedLabState, useSyncLabProgress } from "@/lib/use-persisted-lab-state";
import { LatexMath } from "@/components/learning/LatexMath";
import { ChoiceCheck } from "./shared";
import { DecayProcessVisual, type DecayChartMode } from "./DecayProcessVisual";
import { useProcessClock } from "./useProcessClock";
import styles from "./ProcessLab.module.css";

export const B23_DECAY_LAB_STORAGE_KEY = "b23-decay-lab-v1";

interface DecayLabPersistedState {
  readonly parameters: DecayParameters;
  readonly comparison: DecayParameters | null;
  readonly trackedIndex: number;
  readonly chartMode: DecayChartMode;
  readonly changedCondition: boolean;
  readonly observed: boolean;
  readonly answered: boolean;
}

const INITIAL_DECAY_LAB_STATE: DecayLabPersistedState = {
  parameters: { ...DECAY_COMPARISON.a },
  comparison: null,
  trackedIndex: 0,
  chartMode: "N",
  changedCondition: false,
  observed: false,
  answered: false,
};

function parseValidDecayParams(raw: unknown, fallback: DecayParameters): DecayParameters {
  if (!raw || typeof raw !== "object") return fallback;
  const p = raw as Partial<DecayParameters>;
  const initialCount =
    typeof p.initialCount === "number" &&
    Number.isInteger(p.initialCount) &&
    p.initialCount >= 32 &&
    p.initialCount <= 256
      ? p.initialCount
      : fallback.initialCount;
  const halfLifeSeconds =
    typeof p.halfLifeSeconds === "number" &&
    Number.isFinite(p.halfLifeSeconds) &&
    p.halfLifeSeconds >= 5 &&
    p.halfLifeSeconds <= 60
      ? Math.round(p.halfLifeSeconds)
      : fallback.halfLifeSeconds;
  const seed =
    typeof p.seed === "number" &&
    Number.isInteger(p.seed) &&
    p.seed >= 0 &&
    p.seed <= 999999
      ? p.seed
      : fallback.seed;
  return { initialCount, halfLifeSeconds, seed };
}

function parseDecayLabState(
  raw: unknown,
  fallback: DecayLabPersistedState
): DecayLabPersistedState {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Partial<DecayLabPersistedState>;
  const parameters = parseValidDecayParams(obj.parameters, fallback.parameters);
  const comparison =
    obj.comparison && typeof obj.comparison === "object"
      ? parseValidDecayParams(obj.comparison, fallback.parameters)
      : null;
  const trackedIndex =
    typeof obj.trackedIndex === "number" && Number.isInteger(obj.trackedIndex)
      ? Math.max(0, Math.min(parameters.initialCount - 1, obj.trackedIndex))
      : 0;
  const chartMode: DecayChartMode = obj.chartMode === "H" ? "H" : "N";
  return {
    parameters,
    comparison,
    trackedIndex,
    chartMode,
    changedCondition: Boolean(obj.changedCondition),
    observed: Boolean(obj.observed),
    answered: Boolean(obj.answered),
  };
}

const subscribeNoop = () => () => {};
const getClientHydrated = () => true;
const getServerHydrated = () => false;

const decayEquations = (
  <div style={{ overflowX: "auto", maxWidth: "100%" }}>
    <LatexMath
      block
      math={String.raw`N(t)=N_0\cdot 2^{-\frac{t}{T}}=N_0\,e^{-\lambda t},\quad \lambda=\frac{\ln 2}{T}`}
    />
    <LatexMath
      block
      math={String.raw`H(t)=\lambda N(t)=\frac{\ln 2}{T}\,N(t)=H_0\cdot 2^{-\frac{t}{T}}\;\;(\mathrm{Bq})`}
    />
  </div>
);

const SGK_TABLE_23_2 = [
  { nuclide: "¹⁴₆C (Carbon-14)", halfLife: "5,7·10³ năm" },
  { nuclide: "¹³¹₅₃I (Iodine-131)", halfLife: "8,0 ngày" },
  { nuclide: "¹⁵₈O (Oxygen-15)", halfLife: "1,2·10² giây" },
  { nuclide: "²¹⁰₈₄Po (Polonium-210)", halfLife: "1,4·10² ngày" },
  { nuclide: "²²⁶₈₈Ra (Radium-226)", halfLife: "1,6·10³ năm" },
  { nuclide: "²¹⁹₈₆Rn (Radon-219)", halfLife: "4,0 giây" },
  { nuclide: "²³⁵₉₂U (Uranium-235)", halfLife: "7,0·10⁸ năm" },
] as const;

export function DecayProcessLab({
  onProgress,
}: {
  onProgress?: (done: boolean) => void;
}) {
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    getClientHydrated,
    getServerHydrated
  );
  const [persisted, setPersisted, resetPersisted] = usePersistedLabState(
    B23_DECAY_LAB_STORAGE_KEY,
    INITIAL_DECAY_LAB_STATE,
    parseDecayLabState
  );

  const {
    parameters,
    comparison,
    trackedIndex,
    chartMode,
    changedCondition,
    observed,
    answered,
  } = persisted;

  const chartDuration = Math.max(60, 3 * parameters.halfLifeSeconds);
  const sample = useMemo(() => createDecaySample(parameters), [parameters]);
  const other = useMemo(
    () => (comparison ? createDecaySample(comparison) : null),
    [comparison]
  );

  const container = useRef<HTMLDivElement>(null);
  const clock = useProcessClock(chartDuration, 4, container);
  const state = decayState(sample, clock.time);
  const alternate = other ? decayState(other, clock.time) : null;

  const hasObserved = observed || clock.time >= 1;
  const complete = changedCondition && hasObserved && answered;
  useSyncLabProgress(complete, onProgress);

  const safeTrackedIndex = Math.min(trackedIndex, parameters.initialCount - 1);
  const trackedLifetime = sample.lifetimes[safeTrackedIndex] ?? 0;

  const change = (next: Partial<DecayParameters>) => {
    const didChangeCondition =
      (next.initialCount !== undefined &&
        next.initialCount !== parameters.initialCount) ||
      (next.halfLifeSeconds !== undefined &&
        next.halfLifeSeconds !== parameters.halfLifeSeconds);

    setPersisted((prev) => {
      const updatedParams = parseValidDecayParams(
        { ...prev.parameters, ...next },
        prev.parameters
      );
      return {
        ...prev,
        parameters: updatedParams,
        trackedIndex: Math.min(prev.trackedIndex, updatedParams.initialCount - 1),
        changedCondition: prev.changedCondition || didChangeCondition,
      };
    });
    clock.reset();
  };

  const jumpToTime = (targetSeconds: number) => {
    clock.seek(targetSeconds);
    if (targetSeconds >= 1) {
      setPersisted((prev) => (prev.observed ? prev : { ...prev, observed: true }));
    }
  };

  return (
    <div
      ref={container}
      className={styles.lab}
      data-process="B23"
      data-process-ready={clock.ready}
    >
      <h3>Phân rã phóng xạ: từng hạt nhân ngẫu nhiên, cả tập hợp tuân theo quy luật hàm mũ</h3>
      <p className={styles.prompt}>
        <strong>Dự đoán &amp; Khám phá (SGK tr. 108–111):</strong> Một hạt nhân riêng lẻ (#1, #2, #3…) có bắt buộc phân rã đúng vào lúc{" "}
        <code>t = T</code> không? Hãy chọn 1 hạt để theo dõi, đối chiếu với mạng lưới{" "}
        <code>N₀</code> hạt và đọc trực tiếp các mốc <strong>T, 2T, 3T</strong> trên đồ thị{" "}
        <code>N(t)</code> và <code>H(t)</code>.
      </p>

      {/* Điều khiển tham số mẫu */}
      <div className={styles.controls}>
        <label>
          Số hạt ban đầu N₀: <strong>{parameters.initialCount} hạt</strong>
          <input
            aria-label="Số hạt ban đầu N₀"
            type="range"
            disabled={!clock.ready}
            min="32"
            max="256"
            step="32"
            value={parameters.initialCount}
            onChange={(e) => change({ initialCount: +e.target.value })}
          />
        </label>
        <label>
          Chu kì bán rã T: <strong>{parameters.halfLifeSeconds} s</strong>
          <input
            aria-label="Chu kì bán rã T"
            type="range"
            disabled={!clock.ready}
            min="5"
            max="60"
            value={parameters.halfLifeSeconds}
            onChange={(e) => change({ halfLifeSeconds: +e.target.value })}
          />
        </label>
        <label>
          Thời gian quan sát t: <strong>{clock.time.toFixed(1)} s</strong>
          <input
            aria-label="Thanh trượt thời gian t"
            type="range"
            disabled={!clock.ready}
            min="0"
            max={chartDuration}
            step="0.5"
            value={clock.time}
            onChange={(e) => jumpToTime(+e.target.value)}
          />
        </label>
        <label>
          Seed tái lập lượt
          <input
            aria-label="Seed phân rã"
            type="number"
            disabled={!clock.ready}
            min="0"
            max="999999"
            value={parameters.seed}
            onChange={(e) => {
              const seed = e.target.valueAsNumber;
              if (Number.isInteger(seed) && seed >= 0 && seed <= 999999) {
                change({ seed });
              }
            }}
          />
        </label>
      </div>

      {/* Bộ nút điều khiển thời gian + nhảy nhanh tới T, 2T, 3T */}
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.primary}
          disabled={!clock.ready}
          onClick={() => {
            clock.toggle();
            setPersisted((prev) => (prev.observed ? prev : { ...prev, observed: true }));
          }}
        >
          {clock.running
            ? "Tạm dừng"
            : clock.time > 0 && clock.time < chartDuration
              ? "Tiếp tục"
              : "Bắt đầu"}
        </button>
        <button type="button" disabled={!clock.ready} onClick={clock.reset}>
          Đặt lại t = 0
        </button>
        <button
          type="button"
          disabled={!clock.ready}
          onClick={() => {
            clock.step(1);
            setPersisted((prev) => (prev.observed ? prev : { ...prev, observed: true }));
          }}
        >
          Từng bước +1 s
        </button>
        {[1, 2, 3].map((k) => {
          const milestone = k * parameters.halfLifeSeconds;
          return (
            <button
              key={k}
              type="button"
              disabled={!clock.ready}
              onClick={() => jumpToTime(milestone)}
            >
              Mốc {k === 1 ? "T" : `${k}T`} ({milestone} s)
            </button>
          );
        })}
        <button
          type="button"
          disabled={!clock.ready}
          onClick={() => change({ seed: (parameters.seed + 1) % 1000000 })}
        >
          Lượt ngẫu nhiên mới
        </button>
        <button
          type="button"
          disabled={!clock.ready}
          onClick={() => setPersisted((prev) => ({ ...prev, comparison: { ...parameters } }))}
        >
          Lưu cấu hình so sánh
        </button>
        <button
          type="button"
          disabled={!clock.ready}
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob([decayProcessCSV(sample, chartDuration)], {
                type: "text/csv;charset=utf-8",
              })
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = `phan-ra-seed-${sample.seed}.csv`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          Tải CSV
        </button>
        <label>
          Tốc độ phát
          <select
            aria-label="Tốc độ phân rã"
            value={clock.speed}
            disabled={!clock.ready}
            onChange={(e) => clock.setSpeed(+e.target.value)}
          >
            <option value="0.25">1 s mô hình / s xem</option>
            <option value="1">4 s mô hình / s xem</option>
            <option value="2">8 s mô hình / s xem</option>
          </select>
        </label>
      </div>

      {/* Thanh công cụ chọn 1 hạt nhân riêng lẻ & chuyển đổi đồ thị N(t) ↔ H(t) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "12px",
          margin: "12px 0 16px",
          padding: "12px",
          background: "#e5f2f2",
          borderRadius: "12px",
          border: "1px solid #b8d4dc",
        }}
      >
        <div>
          <p style={{ margin: "0 0 8px", fontSize: "13.5px", fontWeight: 700 }}>
            🎯 Chọn 1 hạt nhân riêng lẻ để theo dõi thời điểm phân rã ngẫu nhiên:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                type="button"
                aria-pressed={safeTrackedIndex === idx}
                onClick={() => setPersisted((prev) => ({ ...prev, trackedIndex: idx }))}
                style={{ minHeight: "36px", padding: "5px 10px", fontSize: "13px" }}
              >
                Hạt #{idx + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                setPersisted((prev) => ({
                  ...prev,
                  trackedIndex: (safeTrackedIndex + 1) % parameters.initialCount,
                }))
              }
              style={{ minHeight: "36px", padding: "5px 10px", fontSize: "13px" }}
            >
              Hạt kế tiếp (#{((safeTrackedIndex + 1) % parameters.initialCount) + 1})
            </button>
          </div>
        </div>

        <div>
          <p style={{ margin: "0 0 8px", fontSize: "13.5px", fontWeight: 700 }}>
            📈 Chọn đại lượng biểu diễn trên trục tung đồ thị:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <button
              type="button"
              aria-pressed={chartMode === "N"}
              onClick={() => setPersisted((prev) => ({ ...prev, chartMode: "N" }))}
              style={{ minHeight: "36px", padding: "5px 12px", fontSize: "13px" }}
            >
              Số hạt còn lại N(t) (hạt)
            </button>
            <button
              type="button"
              aria-pressed={chartMode === "H"}
              onClick={() => setPersisted((prev) => ({ ...prev, chartMode: "H" }))}
              style={{ minHeight: "36px", padding: "5px 12px", fontSize: "13px" }}
            >
              Độ phóng xạ H(t) = λN(t) (Bq)
            </button>
          </div>
        </div>
      </div>

      {/* Chỉ số đồng bộ ở cùng thời điểm t */}
      <dl className={styles.metrics}>
        <div>
          <dt>Thời gian mô hình t</dt>
          <dd data-time>{clock.time.toFixed(1)} s</dd>
        </div>
        <div>
          <dt>Hạt #{safeTrackedIndex + 1} riêng lẻ</dt>
          <dd style={{ fontSize: "15px" }}>
            {clock.time >= trackedLifetime
              ? `Đã rã (${trackedLifetime.toFixed(1)} s)`
              : "Chưa phân rã"}
          </dd>
        </div>
        <div>
          <dt>N(t) còn lại (lượt này)</dt>
          <dd data-remaining>{state.remaining} hạt</dd>
        </div>
        <div>
          <dt>N(t) kì vọng lí thuyết</dt>
          <dd>{state.expected.toFixed(1)} hạt</dd>
        </div>
        <div>
          <dt>Độ phóng xạ H(t) kì vọng</dt>
          <dd>{state.expectedActivityBq.toFixed(2)} Bq</dd>
        </div>
        <div>
          <dt>Số đếm trong 1 s qua</dt>
          <dd>
            {state.detections} xung / {state.windowDurationSeconds.toFixed(1)} s
          </dd>
        </div>
      </dl>

      <div className={styles.grid}>
        <div className={styles.figure}>
          <DecayProcessVisual
            sample={sample}
            time={clock.time}
            duration={chartDuration}
            chartMode={chartMode}
            trackedIndex={safeTrackedIndex}
            onSelectNucleus={(idx) =>
              setPersisted((prev) => ({ ...prev, trackedIndex: idx }))
            }
          />
        </div>

        <div>
          {decayEquations}

          {/* Bảng phân biệt rạch ròi N(t) và H(t) */}
          <div className={styles.table}>
            <table>
              <caption>Phân biệt hai đại lượng cốt lõi trong SGK tr. 108–110</caption>
              <thead>
                <tr>
                  <th>Đại lượng</th>
                  <th>Ý nghĩa vật lí</th>
                  <th>Đơn vị</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>N(t)</strong>
                  </td>
                  <td>Số hạt nhân mẹ chưa phân rã còn lại trong mẫu ở thời điểm t</td>
                  <td>hạt</td>
                </tr>
                <tr>
                  <td>
                    <strong>H(t) = λN(t)</strong>
                  </td>
                  <td>
                    Độ phóng xạ — đặc trưng cho tính phóng xạ mạnh hay yếu (số phân rã trung bình trong 1 giây)
                  </td>
                  <td>Bq (phân rã/s)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p
            style={{
              padding: "10px 12px",
              background: "#fff4df",
              borderLeft: "4px solid #b87722",
              borderRadius: "6px",
              fontSize: "13.5px",
              lineHeight: 1.6,
            }}
          >
            <strong>Lưu ý đổi đơn vị chuẩn SI:</strong> Khi tính{" "}
            <code>H(t) = (ln 2 / T) · N(t)</code> ra đơn vị{" "}
            <strong>Becquerel (Bq)</strong>, chu kì bán rã <code>T</code> bắt buộc phải đổi ra{" "}
            <strong>giây (s)</strong>!
          </p>

          {alternate && other && (
            <div className={styles.table}>
              <table>
                <caption>So sánh hai cấu hình tại cùng t = {clock.time.toFixed(1)} s</caption>
                <thead>
                  <tr>
                    <th>Cấu hình</th>
                    <th>N còn lại</th>
                    <th>N kì vọng</th>
                    <th>H kì vọng (Bq)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      Đã lưu: N₀={other.initialCount}, T={other.halfLifeSeconds} s (seed {other.seed})
                    </td>
                    <td>{alternate.remaining}</td>
                    <td>{alternate.expected.toFixed(1)}</td>
                    <td>{alternate.expectedActivityBq.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>
                      Hiện tại: N₀={sample.initialCount}, T={sample.halfLifeSeconds} s (seed {sample.seed})
                    </td>
                    <td>{state.remaining}</td>
                    <td>{state.expected.toFixed(1)}</td>
                    <td>{state.expectedActivityBq.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <details style={{ marginBottom: "10px" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              Tra cứu nhanh Bảng 23.2 SGK tr. 108 — Chu kì bán rã một số đồng vị
            </summary>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Đồng vị phóng xạ</th>
                    <th>Chu kì bán rã T</th>
                  </tr>
                </thead>
                <tbody>
                  {SGK_TABLE_23_2.map((row) => (
                    <tr key={row.nuclide}>
                      <td>{row.nuclide}</td>
                      <td>{row.halfLife}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <details>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              Quy luật thống kê, giới hạn mô hình và nguồn tham khảo
            </summary>
            <p className={styles.note}>
              Mỗi hạt nhân có thời điểm phân rã độc lập được lấy mẫu từ phân bố mũ bằng phép biến đổi nghịch đảo; thay đổi tốc độ xem không làm thay đổi các thời điểm đã sinh. Mẫu thật ngoài đời chứa tới{" "}
              <code>~10²⁰</code> hạt nhân nên đường bậc thang hội tụ sát khít đường cong hàm mũ mượt.
            </p>
            <LatexMath block math={String.raw`t_i=-\frac{\ln(1-u_i)}{\lambda},\quad 0<u_i<1`} />
            <p className={styles.note}>
              Nguồn tham khảo:{" "}
              <a
                href="https://openstax.org/books/university-physics-volume-3/pages/10-3-radioactive-decay"
                target="_blank"
                rel="noreferrer"
              >
                OpenStax · Radioactive Decay ↗
              </a>{" "}
              &amp; SGK Vật lí 12 Kết nối tri thức Bài 23 (tr. 108–111). Dữ liệu trong mô phỏng là dữ liệu sinh từ mô hình xác suất, không phải số đo thực nghiệm.
            </p>
          </details>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          marginTop: "10px",
        }}
      >
        <p className={styles.note} role="status" style={{ margin: 0 }}>
          Tiêu chí hoàn thành: (1) Đổi N₀ hoặc T {changedCondition ? "✓" : "○"} · (2) Quan sát diễn biến tối thiểu 1 s {hasObserved ? "✓" : "○"} · (3) Trả lời đúng câu kiểm tra {answered ? "✓" : "○"}.
          {complete && <strong> ✓ Đã hoàn thành hoạt động!</strong>}
        </p>
        <button
          type="button"
          onClick={() => {
            clock.reset();
            resetPersisted();
          }}
          style={{ minHeight: "36px", fontSize: "13px" }}
        >
          Khôi phục mặc định
        </button>
      </div>

      <ChoiceCheck
        key={hydrated ? `client-${parameters.initialCount}-${parameters.halfLifeSeconds}-${parameters.seed}` : "ssr"}
        initialSelected={answered ? 1 : null}
        initialChecked={answered}
        question="Nếu chu kì bán rã T tăng gấp đôi (giữ nguyên số hạt ban đầu N₀), đường cong kì vọng N(t) và độ phóng xạ ban đầu H₀ = λN₀ thay đổi như thế nào?"
        options={[
          "Đường N(t) dốc hơn và độ phóng xạ ban đầu H₀ tăng gấp đôi.",
          "Đường N(t) thoải hơn (giảm chậm hơn) và độ phóng xạ ban đầu H₀ giảm đi một nửa do λ = ln 2 / T giảm một nửa.",
          "Mọi hạt nhân riêng lẻ (#1, #2, #3…) đều phân rã đúng vào thời điểm 2T.",
        ]}
        correctIndex={1}
        explanation="Khi T tăng gấp đôi thì hằng số phóng xạ λ = ln 2 / T giảm đi một nửa, nên độ phóng xạ ban đầu H₀ = λN₀ giảm một nửa và đường cong N(t) thoải hơn. Thời điểm phân rã của từng hạt nhân riêng lẻ vẫn hoàn toàn ngẫu nhiên."
        onResult={(correct) =>
          setPersisted((prev) => ({ ...prev, answered: correct }))
        }
      />
    </div>
  );
}
