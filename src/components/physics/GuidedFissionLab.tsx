"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FISSION_DURATION, FISSION_ENERGY, FISSION_MASS_SOURCE, FISSION_STAGES, fissionConservation, fissionMotion, fissionState, neutronGenerations } from "@/lib/fission-model";
import { usePersistedLabState, useSyncLabProgress } from "@/lib/use-persisted-lab-state";
import { LatexMath } from "@/components/learning/LatexMath";
import { ChoiceCheck, NuclearSymbol } from "./shared";
const FissionScene = dynamic(() => import("./FissionScene"), { ssr: false, loading: () => <p role="status">Đang mở mô hình 3D…</p> });

const formatMass = (value: number, digits: number) => value.toFixed(digits).replace(".", "{,}");
const totals = fissionConservation();

export const B22_FISSION_STORAGE_KEY = "b22-fission-lab-v1";

interface FissionPersistedState {
  readonly observed: boolean;
  readonly count: string;
  readonly trials: readonly number[];
  readonly answered: boolean;
  readonly k: number;
}

const INITIAL_FISSION_STATE: FissionPersistedState = {
  observed: false,
  count: "",
  trials: [],
  answered: false,
  k: 1,
};

function parseFissionState(raw: unknown, fallback: FissionPersistedState): FissionPersistedState {
  if (!raw || typeof raw !== "object") return fallback;
  const p = raw as Partial<FissionPersistedState>;
  const validTrials = Array.isArray(p.trials)
    ? Array.from(new Set(p.trials.filter((v): v is number => v === 0.6 || v === 1 || v === 1.4)))
    : fallback.trials;
  const kVal = p.k === 0.6 || p.k === 1 || p.k === 1.4 ? p.k : fallback.k;
  return {
    observed: typeof p.observed === "boolean" ? p.observed : fallback.observed,
    count: typeof p.count === "string" ? p.count.slice(0, 8) : fallback.count,
    trials: validTrials,
    answered: typeof p.answered === "boolean" ? p.answered : fallback.answered,
    k: kVal,
  };
}

function FissionSchematic({ time, incidentNeutron }: { time: number; incidentNeutron: boolean }) {
  const state = fissionMotion(time, incidentNeutron);
  const center = 320;
  return <svg viewBox="0 0 640 230" width="100%" role="img" aria-label={incidentNeutron ? FISSION_STAGES[state.stage].title : "Hạt nhân U-235, không có neutron tới"}>
    <path d="M64 100H576" stroke="#426984" strokeDasharray="6 9" />
    {state.stage < 3 ? <>
      <ellipse cx={center} cy="100" rx={42 * state.stretchX} ry={42 * state.stretchY} fill="#d46562" />
      <text x={center} y="106" textAnchor="middle" fill="#101f32" fontSize="21" fontWeight="700">{state.stage === 0 ? "U-235" : "U-236*"}</text>
      {state.incidentNeutron && state.stage === 0 && <circle cx={center + 51 * state.incomingX} cy="100" r="9" fill="#72c8f4" />}
    </> : <>
      {state.fragmentOffsets.map((offset, index) => <g key={index}>
        <circle cx={center + offset * 48} cy="100" r={index === 0 ? 29 : 37} fill="#d46562" />
        <text x={center + offset * 48} y="106" textAnchor="middle" fill="#101f32" fontSize="19" fontWeight="700">{index === 0 ? "Y-95" : "I-138"}</text>
      </g>)}
      {state.neutronPositions.map(([x, y], index) => <circle key={index} cx={center + 52 * x} cy={100 - 25 * y} r="7" fill="#72c8f4" />)}
    </>}
    <text x={center} y="206" textAnchor="middle" fill="#d3e7f7" fontSize="17">Sơ đồ 2D · Mỗi đĩa đỏ là một hạt nhân</text>
  </svg>;
}

function ChainBranchSchematic({ k }: { k: number }) {
  const genX = [68, 214, 362, 514] as const;
  const regimeLabel =
    k < 1
      ? "Sơ đồ phân nhánh khi k = 0,6 (k < 1): phần lớn neutron thoát ra hoặc bị hấp thụ, dây chuyền tắt dần"
      : k === 1
        ? "Sơ đồ phân nhánh khi k = 1: thanh điều khiển giữ lại neutron dư, mỗi phân hạch duy trì đúng 1 phân hạch kế tiếp"
        : "Sơ đồ phân nhánh khi k = 1,4 (k > 1): nhiều neutron tiếp tục gây phân hạch mới, phản ứng tăng vọt theo thế hệ";

  return (
    <div style={{ marginTop: "12px", background: "#0f172a", borderRadius: "10px", border: "1px solid var(--border-light)", padding: "10px" }}>
      <svg
        viewBox="0 0 600 232"
        role="img"
        aria-label={regimeLabel}
        style={{ display: "block", width: "100%", height: "auto" }}
      >
        <title>{regimeLabel}</title>
        {genX.map((gx, idx) => (
          <g key={gx}>
            <line x1={gx} y1="26" x2={gx} y2="194" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 4" />
            <text x={gx} y="18" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="600">
              Thế hệ {idx}
            </text>
          </g>
        ))}

        {k < 1 && (
          <g>
            {/* Gen 0 -> Gen 1 */}
            <line x1={genX[0]} y1="112" x2="158" y2="62" stroke="#64748b" strokeWidth="1.8" strokeDasharray="4 3" />
            <line x1={genX[0]} y1="112" x2={genX[1]} y2="112" stroke="#38bdf8" strokeWidth="2.4" />
            <line x1={genX[0]} y1="112" x2="158" y2="162" stroke="#64748b" strokeWidth="1.8" strokeDasharray="4 3" />
            <rect x="152" y="54" width="14" height="14" rx="3" fill="#475569" stroke="#94a3b8" />
            <text x="159" y="65" textAnchor="middle" fill="#f8fafc" fontSize="10">×</text>
            <rect x="152" y="154" width="14" height="14" rx="3" fill="#475569" stroke="#94a3b8" />
            <text x="159" y="165" textAnchor="middle" fill="#f8fafc" fontSize="10">×</text>

            {/* Gen 1 -> Gen 2 (fading out) */}
            <line x1={genX[1]} y1="112" x2="306" y2="68" stroke="#64748b" strokeWidth="1.6" strokeDasharray="4 3" />
            <line x1={genX[1]} y1="112" x2={genX[2]} y2="112" stroke="#38bdf8" strokeWidth="1.8" strokeOpacity="0.6" />
            <line x1={genX[1]} y1="112" x2="306" y2="156" stroke="#64748b" strokeWidth="1.6" strokeDasharray="4 3" />
            <rect x="300" y="60" width="14" height="14" rx="3" fill="#475569" stroke="#94a3b8" />
            <text x="307" y="71" textAnchor="middle" fill="#f8fafc" fontSize="10">×</text>
            <rect x="300" y="148" width="14" height="14" rx="3" fill="#475569" stroke="#94a3b8" />
            <text x="307" y="159" textAnchor="middle" fill="#f8fafc" fontSize="10">×</text>

            {/* Gen 2 -> absorbed before Gen 3 */}
            <line x1={genX[2]} y1="112" x2="452" y2="92" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1={genX[2]} y1="112" x2="452" y2="132" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 3" />
            <rect x="446" y="84" width="14" height="14" rx="3" fill="#475569" stroke="#94a3b8" />
            <text x="453" y="95" textAnchor="middle" fill="#f8fafc" fontSize="10">×</text>
            <rect x="446" y="124" width="14" height="14" rx="3" fill="#475569" stroke="#94a3b8" />
            <text x="453" y="135" textAnchor="middle" fill="#f8fafc" fontSize="10">×</text>
            <circle cx={genX[3]} cy="112" r="14" fill="none" stroke="#475569" strokeDasharray="3 3" />
            <text x={genX[3]} y="116" textAnchor="middle" fill="#94a3b8" fontSize="10">Tắt</text>

            {/* Active nuclei */}
            <circle cx={genX[0]} cy="112" r="16" fill="#ef4444" stroke="#fca5a5" strokeWidth="1.5" />
            <text x={genX[0]} y="116" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">²³⁵U</text>
            <circle cx={genX[1]} cy="112" r="14" fill="#ef4444" fillOpacity="0.8" stroke="#fca5a5" />
            <text x={genX[1]} y="116" textAnchor="middle" fill="#fff" fontSize="9.5" fontWeight="700">0,6</text>
            <circle cx={genX[2]} cy="112" r="12" fill="#ef4444" fillOpacity="0.55" stroke="#fca5a5" />
            <text x={genX[2]} y="116" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700">0,36</text>
          </g>
        )}

        {k === 1 && (
          <g>
            {[0, 1, 2].map((gIdx) => {
              const x1 = genX[gIdx];
              const x2 = genX[gIdx + 1];
              const midX = (x1 + x2) / 2 + 8;
              return (
                <g key={gIdx}>
                  <line x1={x1} y1="112" x2={midX} y2="62" stroke="#64748b" strokeWidth="1.8" strokeDasharray="4 3" />
                  <line x1={x1} y1="112" x2={x2} y2="112" stroke="#38bdf8" strokeWidth="2.6" />
                  <line x1={x1} y1="112" x2={midX} y2="162" stroke="#64748b" strokeWidth="1.8" strokeDasharray="4 3" />
                  <rect x={midX - 18} y="48" width="38" height="16" rx="4" fill="#334155" stroke="#94a3b8" />
                  <text x={midX + 1} y="59" textAnchor="middle" fill="#e2e8f0" fontSize="9">Bo/Cd</text>
                  <rect x={midX - 18} y="156" width="38" height="16" rx="4" fill="#334155" stroke="#94a3b8" />
                  <text x={midX + 1} y="167" textAnchor="middle" fill="#e2e8f0" fontSize="9">Bo/Cd</text>
                  <circle cx={(x1 + x2) / 2} cy="112" r="5" fill="#38bdf8" />
                </g>
              );
            })}
            {genX.map((gx) => (
              <g key={gx}>
                <circle cx={gx} cy="112" r="16" fill="#10b981" stroke="#a7f3d0" strokeWidth="1.5" />
                <text x={gx} y="116" textAnchor="middle" fill="#052e16" fontSize="10" fontWeight="700">²³⁵U</text>
              </g>
            ))}
          </g>
        )}

        {k > 1 && (
          <g>
            {/* Gen 0 -> 2 nodes in Gen 1 */}
            {[74, 150].map((y1) => (
              <line key={y1} x1={genX[0]} y1="112" x2={genX[1]} y2={y1} stroke="#38bdf8" strokeWidth="2.3" />
            ))}
            {/* Gen 1 -> 4 nodes in Gen 2 */}
            <line x1={genX[1]} y1="74" x2={genX[2]} y2="48" stroke="#38bdf8" strokeWidth="2" />
            <line x1={genX[1]} y1="74" x2={genX[2]} y2="92" stroke="#38bdf8" strokeWidth="2" />
            <line x1={genX[1]} y1="150" x2={genX[2]} y2="134" stroke="#38bdf8" strokeWidth="2" />
            <line x1={genX[1]} y1="150" x2={genX[2]} y2="176" stroke="#38bdf8" strokeWidth="2" />
            {/* Gen 2 -> 8 nodes in Gen 3 */}
            {[48, 92, 134, 176].flatMap((y2, idx) => {
              const y3a = 36 + idx * 44;
              const y3b = 56 + idx * 44;
              return [
                <line key={`${y2}-a`} x1={genX[2]} y1={y2} x2={genX[3]} y2={y3a} stroke="#f59e0b" strokeWidth="1.8" />,
                <line key={`${y2}-b`} x1={genX[2]} y1={y2} x2={genX[3]} y2={y3b} stroke="#f59e0b" strokeWidth="1.8" />,
              ];
            })}

            <circle cx={genX[0]} cy="112" r="15" fill="#ef4444" stroke="#fde047" strokeWidth="1.5" />
            <text x={genX[0]} y="116" textAnchor="middle" fill="#fff" fontSize="9.5" fontWeight="700">²³⁵U</text>

            {[74, 150].map((y1) => (
              <g key={y1}>
                <circle cx={genX[1]} cy={y1} r="13" fill="#ef4444" stroke="#fde047" strokeWidth="1.3" />
                <text x={genX[1]} y={y1 + 3.5} textAnchor="middle" fill="#fff" fontSize="8.5" fontWeight="700">²³⁵U</text>
              </g>
            ))}
            {[48, 92, 134, 176].map((y2) => (
              <circle key={y2} cx={genX[2]} cy={y2} r="10.5" fill="#f97316" stroke="#fef08a" strokeWidth="1.2" />
            ))}
            {[36, 56, 80, 100, 124, 144, 168, 188].map((y3) => (
              <circle key={y3} cx={genX[3]} cy={y3} r="8" fill="#facc15" stroke="#fff" strokeWidth="1" />
            ))}
          </g>
        )}

        <text x="300" y="218" textAnchor="middle" fill="#e2e8f0" fontSize="11.5">
          {k < 1
            ? "k < 1 (dưới tới hạn): Phản ứng dây chuyền tắt dần, không tự duy trì."
            : k === 1
              ? "k = 1 (tới hạn): Tự duy trì ổn định trong lò phản ứng hạt nhân (nhờ thanh điều khiển Bo/Cd)."
              : "k > 1 (vượt tới hạn): Phản ứng dây chuyền tự duy trì và tăng vọt không kiểm soát."}
        </text>
      </svg>
    </div>
  );
}

export function GuidedFissionLab({ onProgress }: { onProgress?: (done: boolean) => void }) {
  const [persisted, setPersisted, resetPersisted] = usePersistedLabState(
    B22_FISSION_STORAGE_KEY,
    INITIAL_FISSION_STATE,
    parseFissionState
  );
  const { observed, count, trials, answered, k } = persisted;

  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState("perspective");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState(false);
  const [incidentNeutron, setIncidentNeutron] = useState(true);

  const container = useRef<HTMLElement>(null);
  const clock = useRef(0);
  const observedRef = useRef(observed);
  const state = fissionState(time, incidentNeutron);

  const errorCallback = useCallback((message: string) => {
    setError(message);
    setReady(true);
  }, []);
  const readyCallback = useCallback(() => setReady(true), []);

  useEffect(() => {
    observedRef.current = observed;
  }, [observed]);

  const hasAllTrials = trials.includes(0.6) && trials.includes(1) && trials.includes(1.4);
  const isCountCorrect = count.trim() === "3";
  const isDone = observed && answered && isCountCorrect && hasAllTrials;
  useSyncLabProgress(isDone, onProgress);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const pause = () => setRunning(false);
    const visibility = () => {
      if (document.hidden) pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) pause();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    if (!running || !ready || !incidentNeutron) return;
    let previous = performance.now();
    let frame = 0;
    let lastPaint = 0;
    function advance(now: number) {
      clock.current = Math.min(
        FISSION_DURATION,
        clock.current + Math.min((now - previous) / 1000, 0.1) * speed
      );
      previous = now;
      if (now - lastPaint > 40 || clock.current >= FISSION_DURATION) {
        setTime(clock.current);
        lastPaint = now;
      }
      if (clock.current >= 5 && !observedRef.current) {
        observedRef.current = true;
        setPersisted((prev) => (prev.observed ? prev : { ...prev, observed: true }));
      }
      if (clock.current >= FISSION_DURATION) {
        setRunning(false);
        return;
      }
      frame = requestAnimationFrame(advance);
    }
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [running, speed, ready, incidentNeutron, setPersisted]);

  function seek(value: number) {
    const next = fissionState(value, incidentNeutron).time;
    clock.current = next;
    setTime(next);
    setRunning(false);
    if (next >= 5 && (ready || Boolean(error)) && incidentNeutron && !observedRef.current) {
      observedRef.current = true;
      setPersisted((prev) => (prev.observed ? prev : { ...prev, observed: true }));
    }
  }

  function reset() {
    clock.current = 0;
    observedRef.current = false;
    setTime(0);
    setRunning(false);
    resetPersisted();
    setRevision((v) => v + 1);
    onProgress?.(false);
  }

  const kRegimes = [
    { value: 0.6, label: "k = 0,6 (k < 1 · Tắt dần)" },
    { value: 1, label: "k = 1 (Ổn định · Lò phản ứng)" },
    { value: 1.4, label: "k = 1,4 (k > 1 · Tăng vọt)" },
  ] as const;

  return (
    <section ref={container} className="guided-fission" aria-label="Mô phỏng phân hạch">
      <div className="visual-caption">
        <div>
          <span className="visual-eyebrow">B22 · Phản ứng hạt nhân</span>
          <h3>Mô phỏng phân hạch U-235 &amp; Phản ứng dây chuyền</h3>
          <p>Dự đoán số neutron sinh ra, quan sát mô hình phân hạch và khảo sát hệ số nhân neutron k.</p>
        </div>
      </div>

      <label className="physics-field">
        Điều kiện ban đầu
        <select
          value={incidentNeutron ? "neutron" : "none"}
          onChange={(event) => {
            seek(0);
            setIncidentNeutron(event.target.value === "neutron");
          }}
        >
          <option value="neutron">Có neutron chậm bắn tới</option>
          <option value="none">Không có neutron tới (đối chiếu)</option>
        </select>
      </label>

      <div className="fission-stage">
        {!started ? (
          <div className="fission-ready">
            <span className="fission-ready-symbol">
              {incidentNeutron && (
                <>
                  <NuclearSymbol a={1} z={0} symbol="n" /> +{" "}
                </>
              )}
              <NuclearSymbol a={235} z={92} symbol="U" />
            </span>
            <p>
              Quan sát điều kiện ban đầu rồi theo dõi diễn biến.
              <br />
              Mỗi quả cầu trong hình 3D biểu diễn một nucleon.
            </p>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setStarted(true);
                setRunning(incidentNeutron);
              }}
            >
              Bắt đầu thí nghiệm 3D
            </button>
          </div>
        ) : error ? (
          <FissionSchematic time={time} incidentNeutron={incidentNeutron} />
        ) : (
          <FissionScene
            time={time}
            incidentNeutron={incidentNeutron}
            view={view}
            onError={errorCallback}
            onReady={readyCallback}
          />
        )}
        <div className="fission-legend">
          <span>
            <i className="proton-dot" /> Proton
          </span>
          <span>
            <i className="neutron-dot" /> Neutron
          </span>
          <span>Màu, kích thước và thời gian quy ước</span>
        </div>
      </div>

      <p className="physics-note fission-live-counts" role="status">
        {!incidentNeutron
          ? "U-235 (92p, 143n) đứng riêng trong trường hợp đối chiếu. Không có phân hạch do neutron tới trong lượt này."
          : state.stage === 0
            ? "Trước phản ứng: U-235 (92p, 143n) + 1 neutron chậm tới."
            : state.stage < 3
              ? "Hạt nhân hợp phần kích thích: U-236* (92p, 144n)."
              : "Sau phản ứng: Y-95 (39p, 56n) + I-138 (53p, 85n) + 3 neutron tự do."}
      </p>

      {error && (
        <p role="alert">
          {error} Sơ đồ 2D phía trên dùng cùng diễn tiến.{" "}
          <a href="/illustrations/B22-diagram.svg" target="_blank" rel="noreferrer">
            Mở hình phân hạch ↗
          </a>
        </p>
      )}

      <div className="experiment-controls">
        <button
          type="button"
          className="btn primary"
          disabled={!ready || !incidentNeutron || state.finished}
          onClick={() => setRunning((v) => !v)}
        >
          {state.finished ? "Đã kết thúc lượt" : running ? "Tạm dừng" : "Tiếp tục"}
        </button>
        <button type="button" className="btn" onClick={reset}>
          Đặt lại thí nghiệm
        </button>
        <label>
          Tốc độ{" "}
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
            <option value={0.5}>Chậm · 0,5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
          </select>
        </label>
      </div>

      <div className="fission-steps" aria-label="Các bước phân hạch">
        {FISSION_STAGES.map((step, i) => (
          <button
            type="button"
            key={step.title}
            disabled={!started || !incidentNeutron}
            className={incidentNeutron && state.stage === i ? "is-active" : ""}
            aria-pressed={incidentNeutron && state.stage === i}
            onClick={() => seek(step.time)}
          >
            <span>0{i + 1}</span>
            {step.title}
          </button>
        ))}
      </div>

      <label className="physics-field">
        Xem lại thời điểm · {time.toLocaleString("vi", { maximumFractionDigits: 1 })} trên{" "}
        {FISSION_DURATION} giây mô hình
        <input
          type="range"
          aria-label="Thời điểm phân hạch"
          min={0}
          max={FISSION_DURATION}
          step={0.05}
          value={time}
          disabled={!started || !incidentNeutron}
          onChange={(e) => seek(Number(e.target.value))}
        />
      </label>

      {incidentNeutron && (
        <p className="fission-observation" role="status">
          <strong>{FISSION_STAGES[state.stage].title}. </strong>
          {FISSION_STAGES[state.stage].text}
        </p>
      )}

      {!error && (
        <div className="experiment-views" aria-label="Góc nhìn phân hạch">
          {(
            [
              ["perspective", "Phối cảnh"],
              ["front", "Phía trước"],
              ["top", "Từ trên"],
              ["side", "Bên cạnh"],
            ] as const
          ).map(([value, title]) => (
            <button
              type="button"
              key={value}
              disabled={!started}
              className={`btn small ${view === value ? "primary" : ""}`}
              aria-pressed={view === value}
              onClick={() => setView(value)}
            >
              {title}
            </button>
          ))}
        </div>
      )}

      <p className="physics-note">
        {!error && "Kéo ngang hoặc dùng các nút góc nhìn để xoay. Cuộn trên mô hình bằng chuột để thu phóng. "}
        Mô hình dừng sau một lượt.
      </p>

      {incidentNeutron && (
        <>
          <div className="fission-equation" aria-label="Phương trình phân hạch">
            <span className={state.stage === 0 ? "is-current" : ""}>
              <NuclearSymbol a={1} z={0} symbol="n" /> + <NuclearSymbol a={235} z={92} symbol="U" />
            </span>
            <span>→</span>
            <span className={state.stage === 1 || state.stage === 2 ? "is-current" : ""}>
              <NuclearSymbol a={236} z={92} symbol="U*" />
            </span>
            <span>→</span>
            <span className={state.stage === 3 ? "is-current" : ""}>
              <NuclearSymbol a={95} z={39} symbol="Y" /> + <NuclearSymbol a={138} z={53} symbol="I" /> + 3
              <NuclearSymbol a={1} z={0} symbol="n" />
            </span>
          </div>

          <div className="fission-conservation">
            <div>
              <small>Bảo toàn số khối</small>
              <strong>235 + 1 = 95 + 138 + 3 = 236</strong>
            </div>
            <div>
              <small>Bảo toàn điện tích</small>
              <strong>92 + 0 = 39 + 53 + 0 = 92</strong>
            </div>
          </div>

          <p className="physics-note">
            Đây là một kênh minh họa trong SGK. Các kênh khác có thể tạo sản phẩm khác. Vị trí các quả cầu và quỹ đạo chỉ là quy ước để theo dõi diễn biến.
          </p>

          <details className="fission-chain">
            <summary>Tính năng lượng tỏa ra của kênh Y-95 và I-138</summary>
            <p>
              So sánh tổng khối lượng nghỉ của hệ trước phản ứng và các sản phẩm ở trạng thái cơ bản. Tổng điện tích hai vế đều bằng {totals.inputZ} điện tích nguyên tố nên có thể dùng bảng khối lượng nguyên tử trung hòa cho phép tính gần đúng.
            </p>
            <LatexMath block math={String.raw`m_{\text{trước}}\approx ${formatMass(FISSION_ENERGY.beforeMassU, 6)}\,\mathrm{u}`} />
            <LatexMath block math={String.raw`m_{\text{sau}}\approx ${formatMass(FISSION_ENERGY.afterMassU, 6)}\,\mathrm{u}`} />
            <LatexMath block math={String.raw`Q=(m_{\text{trước}}-m_{\text{sau}})c^2\approx ${formatMass(FISSION_ENERGY.qMeV, 1)}\,\mathrm{MeV}`} />
            <p>
              Đây là năng lượng ứng với chênh lệch khối lượng của kênh đã chọn. Mô hình không chia giá trị này cho từng mảnh, neutron và photon.{" "}
              <a href={FISSION_MASS_SOURCE} target="_blank" rel="noreferrer">
                Bảng khối lượng AME2020 ↗
              </a>
            </p>
          </details>
        </>
      )}

      <label className="physics-field">
        Em quan sát thấy bao nhiêu neutron tự do sau phản ứng?
        <input
          type="number"
          min={0}
          max={10}
          value={count}
          onChange={(e) => {
            const nextCount = e.target.value;
            setPersisted((prev) => ({ ...prev, count: nextCount }));
          }}
          placeholder="Nhập số neutron"
        />
      </label>
      {count !== "" && (
        <p role="status" className={`physics-feedback ${isCountCorrect ? "is-correct" : "is-retry"}`}>
          {isCountCorrect
            ? "✓ Đúng: 3 neutron tự do được giải phóng. Tổng số neutron ở sản phẩm là 56 + 85 + 3 = 144."
            : "Hãy dừng ở bước 4, phân biệt neutron tự do bay ra ngoài với neutron nằm bên trong hai mảnh Y-95 và I-138."}
        </p>
      )}

      <details open className="fission-chain">
        <summary>Khảo sát phản ứng dây chuyền theo hệ số nhân neutron k (SGK tr. 101–102)</summary>
        <p>
          Chọn cả ba chế độ hệ số nhân neutron hiệu dụng <strong>k</strong> để đối chiếu sơ đồ phân nhánh và số phân hạch kì vọng qua từng thế hệ (khác với tổng số neutron sinh ra trong một phân hạch đơn lẻ):
        </p>
        <div className="experiment-controls" style={{ flexWrap: "wrap" }}>
          {kRegimes.map(({ value, label }) => (
            <button
              type="button"
              key={value}
              className={`btn ${k === value ? "primary" : ""}`}
              aria-pressed={k === value}
              onClick={() => {
                setPersisted((prev) => ({
                  ...prev,
                  k: value,
                  trials: prev.trials.includes(value) ? prev.trials : [...prev.trials, value],
                }));
              }}
            >
              {label}
              {trials.includes(value) ? " ✓" : ""}
            </button>
          ))}
        </div>

        <ChainBranchSchematic k={k} />

        <div className="chain-bars">
          {neutronGenerations(k).map(({ generation, expected }) => (
            <div key={generation}>
              <span>Thế hệ {generation}</span>
              <div>
                <i style={{ width: `${Math.max(2, (expected / Math.pow(1.4, 5)) * 100)}%` }} />
              </div>
              <b>{expected.toFixed(2)}</b>
            </div>
          ))}
        </div>

        <p role="status">
          {k < 1
            ? "k < 1 (ví dụ k = 0,6): phản ứng phân hạch dây chuyền tắt dần nhanh chóng."
            : k === 1
              ? "k = 1: phản ứng phân hạch dây chuyền tự duy trì ổn định, năng lượng tỏa ra không đổi theo thời gian (ứng dụng trong lò phản ứng hạt nhân)."
              : "k > 1 (ví dụ k = 1,4): phản ứng phân hạch dây chuyền tự duy trì, số phân hạch tăng vọt không kiểm soát."}{" "}
          Đây là mô hình k không đổi định tính; thực tế còn phụ thuộc khối lượng tới hạn và hình học vùng hoạt.
        </p>
      </details>

      <ChoiceCheck
        key={`${revision}-${answered ? "1" : "0"}`}
        initialSelected={answered ? 1 : null}
        initialChecked={answered}
        question="Vì sao một số neutron sinh ra không gây phân hạch tiếp theo?"
        options={[
          "Mọi neutron đều bắt buộc gây phân hạch ngay.",
          "Neutron có thể thoát ra ngoài khối nhiên liệu hoặc bị các chất khác (như thanh điều khiển Boron/Cadmium) hấp thụ mà không gây phân hạch.",
          "Neutron biến thành electron ngay sau phản ứng.",
        ]}
        correctIndex={1}
        explanation="Phản ứng tiếp theo phụ thuộc việc neutron được làm chậm và gặp hạt nhân ²³⁵U trước khi thoát ra ngoài hoặc bị hấp thụ. Nhờ điều chỉnh mức độ hấp thụ neutron bằng thanh điều khiển, lò phản ứng giữ được k = 1."
        onResult={(correct) => setPersisted((prev) => ({ ...prev, answered: correct }))}
      />

      <div className="physics-checklist" style={{ marginTop: "16px" }}>
        <p>
          <strong>Tiêu chí hoàn thành ({[observed, isCountCorrect, hasAllTrials, answered].filter(Boolean).length}/4):</strong>
        </p>
        <ul>
          <li className={observed ? "is-done" : ""}>
            Quan sát diễn biến phân hạch đến bước 4 (mảnh phân hạch tách ra) {observed ? "✓" : ""}
          </li>
          <li className={isCountCorrect ? "is-done" : ""}>
            Đếm đúng số neutron tự do sau phản ứng (3 neutron) {isCountCorrect ? "✓" : ""}
          </li>
          <li className={hasAllTrials ? "is-done" : ""}>
            Khảo sát đủ cả 3 chế độ hệ số nhân k: tắt dần (0,6), ổn định (1) và tăng vọt (1,4) ({trials.length}/3) {hasAllTrials ? "✓" : ""}
          </li>
          <li className={answered ? "is-done" : ""}>
            Trả lời đúng câu hỏi giải thích {answered ? "✓" : ""}
          </li>
        </ul>
      </div>
    </section>
  );
}
