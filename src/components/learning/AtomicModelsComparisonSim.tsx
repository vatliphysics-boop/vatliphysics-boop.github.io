"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  ATOMIC_MODELS_STORAGE_KEY,
  INITIAL_ATOMIC_MODELS_STATE,
  MAX_ELECTRON_SAMPLES,
  RUTHERFORD_ORBIT_RADIUS_A0,
  THOMSON_SPHERE_RADIUS_A0,
  appendHydrogen1sSamples,
  evaluateAtomicModelsEvidence,
  isAtomicModelsInquiryComplete,
  summarizeElectronSamples,
  type AtomicModelId,
  type AtomicModelsInquiryState,
  type ElectronSamplePoint,
} from "@/simulations-v3/physics/atomic-models-engine";
import { Nuclide } from "./Nuclide";
import styles from "./AtomicModelsComparisonSim.module.css";

/** Quy đổi 1 bán kính Bohr a₀ sang đơn vị SVG (khung -190..+190 chứa ±3,2 a₀ rộng rãi) */
const PX_PER_A0 = 52;

const MODEL_META: Record<
  AtomicModelId,
  {
    readonly shortLabel: string;
    readonly fullTitle: string;
    readonly yearTag: string;
    readonly summaryCaption: string;
  }
> = {
  thomson: {
    shortLabel: "Thomson",
    fullTitle: "Mô hình Thomson",
    yearTag: "1904 · Điện tích dương phân bố đều",
    summaryCaption:
      "Điện tích dương +1e trải đều trong toàn bộ hình cầu nguyên tử (~10⁻¹⁰ m), electron nằm bên trong vùng dương đó.",
  },
  rutherford: {
    shortLabel: "Rutherford",
    fullTitle: "Mô hình hành tinh Rutherford",
    yearTag: "1911 · Hạt nhân rất nhỏ ở tâm",
    summaryCaption:
      "Toàn bộ +1e tập trung tại hạt nhân cực nhỏ ở tâm; electron chuyển động quanh tâm theo quỹ đạo cổ điển (theo mô hình lịch sử).",
  },
  cloud: {
    shortLabel: "Đám mây electron",
    fullTitle: "Mô hình đám mây electron (Hydrogen 1s)",
    yearTag: "Hiện đại · Lát cắt xác suất z = 0",
    summaryCaption:
      "Hạt nhân +1e rất nhỏ ở tâm; mỗi chấm xanh biểu diễn kết quả một lần ghi nhận vị trí của duy nhất 1 electron (mật độ chấm là mật độ xác suất có mặt, KHÔNG phải vệt đường bay chuyển động hay có nhiều electron).",
  },
};

/** Lưới dấu '+' đối xứng biểu diễn mật độ điện tích dương phân bố khắp khối cầu Thomson */
const THOMSON_PLUS_COORDS: readonly [number, number][] = [
  [0, -58],
  [-48, -32],
  [48, -32],
  [-24, -4],
  [36, -6],
  [-56, 26],
  [0, 34],
  [54, 28],
  [-26, 62],
  [28, 62],
];

const EMPTY_RAW = () => "";

function subscribeAtomicStorage(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("b21-atomic-models-changed", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("b21-atomic-models-changed", listener);
  };
}

function parseStoredState(raw: string): AtomicModelsInquiryState {
  if (!raw) return INITIAL_ATOMIC_MODELS_STATE;
  try {
    const p = JSON.parse(raw) as Partial<AtomicModelsInquiryState>;
    const validModel = (v: unknown): v is AtomicModelId =>
      v === "thomson" || v === "rutherford" || v === "cloud";
    return {
      activeModel: validModel(p.activeModel) ? p.activeModel : "thomson",
      compareSideBySide: Boolean(p.compareSideBySide),
      showPositiveCharge:
        typeof p.showPositiveCharge === "boolean" ? p.showPositiveCharge : true,
      hasExploredStage: Boolean(p.hasExploredStage),
      sampleCount:
        typeof p.sampleCount === "number" && Number.isFinite(p.sampleCount)
          ? Math.max(0, Math.min(MAX_ELECTRON_SAMPLES, Math.floor(p.sampleCount)))
          : 0,
      sampleSessionSeed:
        typeof p.sampleSessionSeed === "number" && Number.isFinite(p.sampleSessionSeed)
          ? p.sampleSessionSeed
          : INITIAL_ATOMIC_MODELS_STATE.sampleSessionSeed,
      selectedEvidenceModel: validModel(p.selectedEvidenceModel)
        ? p.selectedEvidenceModel
        : undefined,
      explanationText:
        typeof p.explanationText === "string" ? p.explanationText.slice(0, 2000) : "",
      submittedEvidence: Boolean(p.submittedEvidence),
    };
  } catch {
    return INITIAL_ATOMIC_MODELS_STATE;
  }
}

function writeStoredState(next: AtomicModelsInquiryState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ATOMIC_MODELS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("b21-atomic-models-changed"));
  } catch {
    // Ignore storage quota errors
  }
}

interface AtomicViewportProps {
  readonly model: AtomicModelId;
  readonly showPositiveCharge: boolean;
  readonly samples: readonly ElectronSamplePoint[];
  readonly highlightLatestSample: boolean;
}

function AtomicModelViewport({
  model,
  showPositiveCharge,
  samples,
  highlightLatestSample,
}: AtomicViewportProps) {
  const meta = MODEL_META[model];
  const thomsonRadiusPx = THOMSON_SPHERE_RADIUS_A0 * PX_PER_A0; // 93.6 px
  const rutherfordRx = RUTHERFORD_ORBIT_RADIUS_A0 * PX_PER_A0; // 75.4 px
  const rutherfordRy = 0.88 * PX_PER_A0; // 45.8 px
  const latestPoint =
    highlightLatestSample && samples.length > 0
      ? samples[samples.length - 1]
      : null;

  return (
    <div className={styles.viewportCard}>
      <div className={styles.viewportHeader}>
        <h4 className={styles.viewportTitle}>{meta.fullTitle}</h4>
        <span className={styles.viewportEra}>{meta.yearTag}</span>
      </div>

      <div className={styles.svgFrameWrap}>
        <svg
          viewBox="-190 -190 380 380"
          width="380"
          height="380"
          className={styles.atomSvg}
          role="img"
          aria-label={`Khung quan sát nguyên tử Hydrogen theo ${meta.fullTitle}, tâm tại (0, 0), cùng tỉ lệ bán kính Bohr`}
        >
          <defs>
            <radialGradient id={`thomsonPosGrad-${model}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.42" />
              <stop offset="78%" stopColor="#ff4d4f" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#ff4d4f" stopOpacity="0.12" />
            </radialGradient>
            <radialGradient id={`nucleusGlow-${model}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff8389" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#fa4d56" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#fa4d56" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Lưới tâm chuẩn hóa (0, 0) và vòng tham chiếu 1 a₀, 2 a₀ nhất quán ở cả 3 mô hình */}
          <line x1="-172" y1="0" x2="172" y2="0" stroke="#1e293b" strokeWidth="1" />
          <line x1="0" y1="-168" x2="0" y2="168" stroke="#1e293b" strokeWidth="1" />

          <circle
            cx="0"
            cy="0"
            r={PX_PER_A0}
            fill="none"
            stroke="#334155"
            strokeWidth="1.1"
            strokeDasharray="4 4"
          />
          <circle
            cx="0"
            cy="0"
            r={2 * PX_PER_A0}
            fill="none"
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="2 5"
          />
          <text
            x={-PX_PER_A0 - 5}
            y="-6"
            textAnchor="end"
            fill="#94a3b8"
            fontSize="11.5"
            fontWeight="600"
          >
            1a₀
          </text>

          {/* ==================== 1. MÔ HÌNH THOMSON ==================== */}
          {model === "thomson" && (
            <g>
              <circle
                cx="0"
                cy="0"
                r={thomsonRadiusPx}
                fill={showPositiveCharge ? `url(#thomsonPosGrad-${model})` : "rgba(255, 107, 107, 0.05)"}
                stroke={showPositiveCharge ? "#ff6b6b" : "#64748b"}
                strokeWidth={showPositiveCharge ? "2.4" : "1.4"}
                strokeDasharray={showPositiveCharge ? undefined : "5 4"}
              />

              {showPositiveCharge &&
                THOMSON_PLUS_COORDS.map(([px, py], i) => (
                  <text
                    key={i}
                    x={px}
                    y={py}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#fecaca"
                    fontSize="15"
                    fontWeight="700"
                  >
                    +
                  </text>
                ))}

              {/* Nhãn vùng điện tích dương nổi bật */}
              <text
                x="0"
                y="-154"
                textAnchor="middle"
                fill={showPositiveCharge ? "#fecaca" : "#cbd5e1"}
                fontSize="13.5"
                fontWeight="700"
              >
                {showPositiveCharge
                  ? "Điện tích dương +1e phân bố khắp thể tích nguyên tử"
                  : "Ranh giới nguyên tử (~1,8 a₀) · Đang tắt tô vùng +1e"}
              </text>

              {/* Electron e⁻ nằm bên trong khối tích điện dương */}
              <g transform="translate(22, -16)">
                <circle cx="0" cy="0" r="8.5" fill="#0b1220" stroke="#38bdf8" strokeWidth="2.4" />
                <text
                  x="0"
                  y="0.5"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#7dd3fc"
                  fontSize="12"
                  fontWeight="700"
                >
                  −
                </text>
                <text x="13" y="4" fill="#bae6fd" fontSize="13.5" fontWeight="700">
                  e⁻ (nằm trong khối +1e)
                </text>
              </g>

              <text
                x="0"
                y="148"
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize="12.5"
                fontWeight="600"
              >
                Không có hạt nhân tập trung ở tâm (mô hình lịch sử 1904)
              </text>
            </g>
          )}

          {/* ==================== 2. MÔ HÌNH HÀNH TINH RUTHERFORD ==================== */}
          {model === "rutherford" && (
            <g>
              {/* Vòng mờ ranh giới cũ của Thomson để thấy ngay sự thu gọn về tâm */}
              <circle
                cx="0"
                cy="0"
                r={thomsonRadiusPx}
                fill="none"
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="3 5"
              />

              {/* Quỹ đạo hành tinh cổ điển (có chú thích rõ "theo mô hình lịch sử") */}
              <g transform="rotate(-22)">
                <ellipse
                  cx="0"
                  cy="0"
                  rx={rutherfordRx}
                  ry={rutherfordRy}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.9"
                  strokeDasharray="6 4"
                />
                <g transform={`translate(${rutherfordRx}, 0)`}>
                  <circle cx="0" cy="0" r="7.5" fill="#0b1220" stroke="#38bdf8" strokeWidth="2.4" />
                  <text
                    x="0"
                    y="0.5"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#7dd3fc"
                    fontSize="11.5"
                    fontWeight="700"
                  >
                    −
                  </text>
                </g>
              </g>

              <text
                x="78"
                y="-78"
                textAnchor="middle"
                fill="#7dd3fc"
                fontSize="12.5"
                fontWeight="700"
              >
                e⁻ trên quỹ đạo
              </text>
              <text
                x="78"
                y="-62"
                textAnchor="middle"
                fill="#bae6fd"
                fontSize="11.5"
              >
                (theo mô hình lịch sử)
              </text>

              {/* Làm nổi sự thu gọn điện tích dương +1e về hạt nhân rất nhỏ ở tâm */}
              {showPositiveCharge && (
                <g>
                  <circle cx="0" cy="0" r="24" fill={`url(#nucleusGlow-${model})`} />
                  <circle
                    cx="0"
                    cy="0"
                    r="15"
                    fill="none"
                    stroke="#ff8389"
                    strokeWidth="1.4"
                    strokeDasharray="3 2"
                  />
                  {/* Bốn mũi tên chỉ rõ vùng dương thu gọn vào tâm (0, 0) */}
                  {[
                    [-36, 0, -18, 0],
                    [36, 0, 18, 0],
                    [0, -36, 0, -18],
                    [0, 36, 0, 18],
                  ].map(([x1, y1, x2, y2], idx) => (
                    <line
                      key={idx}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#fca5a5"
                      strokeWidth="1.8"
                    />
                  ))}
                </g>
              )}

              <circle
                cx="0"
                cy="0"
                r={showPositiveCharge ? "6" : "4.2"}
                fill="#ff4d4f"
                stroke="#ffffff"
                strokeWidth="1.2"
              />
              <text x="18" y="27" fill="#fecaca" fontSize="13" fontWeight="700">
                +1e (hạt nhân)
              </text>

              <text
                x="0"
                y="-154"
                textAnchor="middle"
                fill={showPositiveCharge ? "#fecaca" : "#cbd5e1"}
                fontSize="13.5"
                fontWeight="700"
              >
                {showPositiveCharge
                  ? "Toàn bộ +1e thu về hạt nhân rất nhỏ ở tâm (0, 0)"
                  : "Khoảng không nguyên tử gần như rỗng quanh hạt nhân"}
              </text>

              <text
                x="0"
                y="148"
                textAnchor="middle"
                fill="#fde047"
                fontSize="12"
                fontWeight="600"
              >
                Quy ước: chấm hạt nhân đã phóng đại ~10⁴ lần để nhìn thấy
              </text>
            </g>
          )}

          {/* ==================== 3. MÔ HÌNH ĐÁM MÂY ELECTRON (HYDROGEN 1s) ==================== */}
          {model === "cloud" && (
            <g>
              <text
                x="0"
                y="-154"
                textAnchor="middle"
                fill="#bae6fd"
                fontSize="13.5"
                fontWeight="700"
              >
                Lát cắt qua tâm (z = 0) của Hydrogen 1s · {samples.length} mẫu đo
              </text>

              {/* Các chấm kết quả đo vị trí electron được giữ cố định tại tọa độ đã lấy mẫu */}
              <g aria-label={`Tập hợp ${samples.length} chấm đo vị trí electron`}>
                {samples.map((pt) => (
                  <circle
                    key={pt.id}
                    cx={pt.xA0 * PX_PER_A0}
                    cy={-pt.yA0 * PX_PER_A0}
                    r={samples.length > 250 ? 2.1 : 2.6}
                    fill="#38bdf8"
                    fillOpacity={samples.length > 250 ? 0.78 : 0.92}
                  />
                ))}
              </g>

              {/* Vòng đánh dấu mẫu vừa đo gần nhất */}
              {latestPoint && (
                <circle
                  cx={latestPoint.xA0 * PX_PER_A0}
                  cy={-latestPoint.yA0 * PX_PER_A0}
                  r="7"
                  fill="none"
                  stroke="#fde047"
                  strokeWidth="1.8"
                />
              )}

              {/* Hạt nhân +1e ở tâm */}
              {showPositiveCharge && (
                <circle
                  cx="0"
                  cy="0"
                  r="13"
                  fill="none"
                  stroke="#ff8389"
                  strokeWidth="1.4"
                  strokeDasharray="3 2"
                />
              )}
              <circle
                cx="0"
                cy="0"
                r={showPositiveCharge ? "5.2" : "3.8"}
                fill="#ff4d4f"
                stroke="#ffffff"
                strokeWidth="1.1"
              />
              {showPositiveCharge && (
                <text x="9" y="-9" fill="#fecaca" fontSize="12.5" fontWeight="700">
                  +1e
                </text>
              )}

              {samples.length === 0 && (
                <g>
                  <rect
                    x="-148"
                    y="24"
                    width="296"
                    height="48"
                    rx="3"
                    fill="rgba(15, 23, 42, 0.9)"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="45"
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="12.5"
                    fontWeight="700"
                  >
                    Chưa có mẫu vị trí electron (0 mẫu)
                  </text>
                  <text
                    x="0"
                    y="63"
                    textAnchor="middle"
                    fill="#bae6fd"
                    fontSize="11.5"
                  >
                    Nhấn “Ghi nhận vị trí electron” hoặc “Lấy thêm 100 mẫu”
                  </text>
                </g>
              )}

              <text
                x="0"
                y="148"
                textAnchor="middle"
                fill="#fde047"
                fontSize="11.8"
                fontWeight="600"
              >
                Mật độ chấm ∝ |ψ₁ₛ|² · Hạt nhân ở tâm phóng đại ~10⁴ lần
              </text>
            </g>
          )}

          {/* Thước tỉ lệ cố định góc dưới trái */}
          <g transform="translate(-174, 172)">
            <line x1="0" y1="0" x2={PX_PER_A0} y2="0" stroke="#e2e8f0" strokeWidth="2.2" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke="#e2e8f0" strokeWidth="2" />
            <line
              x1={PX_PER_A0}
              y1="-4"
              x2={PX_PER_A0}
              y2="4"
              stroke="#e2e8f0"
              strokeWidth="2"
            />
            <text x={PX_PER_A0 + 8} y="4" fill="#e2e8f0" fontSize="11.5" fontWeight="600">
              1 a₀ ≈ 0,53 × 10⁻¹⁰ m
            </text>
          </g>
        </svg>
      </div>

      <p className={styles.viewportCaption}>{meta.summaryCaption}</p>
    </div>
  );
}

export interface AtomicModelsComparisonSimProps {
  readonly onProgress?: (done: boolean) => void;
  readonly onOpenRutherfordV3?: () => void;
}

export function AtomicModelsComparisonSim({
  onProgress,
  onOpenRutherfordV3,
}: AtomicModelsComparisonSimProps) {
  const storedRaw = useSyncExternalStore(
    subscribeAtomicStorage,
    () => {
      try {
        return window.localStorage.getItem(ATOMIC_MODELS_STORAGE_KEY) ?? "";
      } catch {
        return "";
      }
    },
    EMPTY_RAW
  );

  const state = useMemo(() => parseStoredState(storedRaw), [storedRaw]);
  const [highlightLatest, setHighlightLatest] = useState(false);

  // Tái lập tất định mảng tọa độ chấm từ (sampleCount, sampleSessionSeed)
  // giúp giữ nguyên vị trí từng chấm cả khi thêm mẫu lẫn khi rời mục rồi quay lại.
  const samples = useMemo(
    () =>
      appendHydrogen1sSamples([], state.sampleCount, state.sampleSessionSeed),
    [state.sampleCount, state.sampleSessionSeed]
  );

  const stats = useMemo(() => summarizeElectronSamples(samples), [samples]);
  const feedback = useMemo(() => evaluateAtomicModelsEvidence(state), [state]);
  const isComplete = useMemo(() => isAtomicModelsInquiryComplete(state), [state]);

  // Đồng bộ trạng thái đã hoàn thành từ localStorage lên bài học khi mount (không gọi setState trong useEffect, không bắn false thụ động)
  const hadCompleteRef = useRef(isComplete);
  useEffect(() => {
    if (isComplete || hadCompleteRef.current) {
      onProgress?.(isComplete);
    }
    hadCompleteRef.current = isComplete;
  }, [isComplete, onProgress]);

  const commitState = useCallback(
    (updater: (prev: AtomicModelsInquiryState) => AtomicModelsInquiryState) => {
      const current = parseStoredState(
        typeof window !== "undefined"
          ? window.localStorage.getItem(ATOMIC_MODELS_STORAGE_KEY) ?? ""
          : ""
      );
      const next = updater(current);
      writeStoredState(next);
      onProgress?.(isAtomicModelsInquiryComplete(next));
    },
    [onProgress]
  );

  function handleSelectModel(model: AtomicModelId) {
    setHighlightLatest(false);
    commitState((prev) => ({
      ...prev,
      activeModel: model,
      // Nếu người dùng bấm sang Đám mây thì tắt chế độ ghép đôi Thomson–Rutherford để tập trung lấy mẫu
      compareSideBySide: model === "cloud" ? false : prev.compareSideBySide,
      hasExploredStage: true,
    }));
  }

  function handleTogglePositiveCharge() {
    commitState((prev) => ({
      ...prev,
      showPositiveCharge: !prev.showPositiveCharge,
      hasExploredStage: true,
    }));
  }

  function handleToggleSideBySide() {
    setHighlightLatest(false);
    commitState((prev) => {
      const nextCompare = !prev.compareSideBySide;
      return {
        ...prev,
        compareSideBySide: nextCompare,
        activeModel:
          nextCompare && prev.activeModel === "cloud"
            ? "thomson"
            : prev.activeModel,
        hasExploredStage: true,
      };
    });
  }

  function handleAddSamples(delta: number) {
    setHighlightLatest(delta === 1);
    commitState((prev) => ({
      ...prev,
      activeModel: "cloud",
      compareSideBySide: false,
      hasExploredStage: true,
      sampleCount: Math.min(MAX_ELECTRON_SAMPLES, prev.sampleCount + delta),
    }));
  }

  function handleResetSamples() {
    setHighlightLatest(false);
    commitState((prev) => ({
      ...prev,
      sampleCount: 0,
      sampleSessionSeed: prev.sampleSessionSeed + 1009,
      hasExploredStage: true,
    }));
  }

  const isCloudFocus = state.activeModel === "cloud" && !state.compareSideBySide;

  return (
    <div className={styles.simRoot} data-testid="atomic-models-sim">
      {/* 1. Mở đầu bằng câu hỏi học sinh có thể trả lời bằng hình */}
      <div className={styles.leadQuestionCard}>
        <p className={styles.leadQuestionText}>
          “Điện tích dương nằm ở đâu trong nguyên tử, và ta có thể nói gì về vị trí của electron?”
        </p>
        <span className={styles.atomSubjectBadge}>
          Nguyên tử đối chiếu: Hydrogen trung hòa (<Nuclide sym="H" a={1} z={1} /> · +1e, 1e⁻)
        </span>
      </div>

      {/* 2. Bàn tương tác: Thanh nút chọn mô hình + 2 thao tác khám phá sát ngay khung quan sát */}
      <section
        className={styles.workbenchPanel}
        aria-label="Mô phỏng tương tác so sánh ba mô hình nguyên tử"
      >
        <div className={styles.controlDeck}>
          <div className={styles.topControlRow}>
            <div
              className={styles.modelSegmented}
              role="group"
              aria-label="Chọn mô hình nguyên tử Hydrogen để quan sát"
            >
              {(["thomson", "rutherford", "cloud"] as const).map((modelId) => {
                const isActive =
                  !state.compareSideBySide && state.activeModel === modelId;
                const isPaired =
                  state.compareSideBySide &&
                  (modelId === "thomson" || modelId === "rutherford");
                return (
                  <button
                    key={modelId}
                    type="button"
                    className={`${styles.modelBtn} ${
                      isActive || isPaired ? styles.modelBtnActive : ""
                    }`}
                    aria-pressed={isActive || isPaired}
                    onClick={() => handleSelectModel(modelId)}
                  >
                    {MODEL_META[modelId].shortLabel}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className={`${styles.actionBtn} ${styles.compareDesktopBtn} ${
                state.compareSideBySide ? styles.compareDesktopBtnActive : ""
              }`}
              aria-pressed={state.compareSideBySide}
              onClick={handleToggleSideBySide}
            >
              {state.compareSideBySide
                ? "Đang đặt Thomson – Rutherford cạnh nhau"
                : "Đặt Thomson – Rutherford cạnh nhau"}
            </button>
          </div>

          {/* Hai thao tác khám phá chính */}
          <div className={styles.actionToolbar}>
            <div className={styles.actionGroup}>
              <button
                type="button"
                className={`${styles.actionBtn} ${
                  state.showPositiveCharge ? styles.positiveToggleActive : ""
                }`}
                aria-pressed={state.showPositiveCharge}
                onClick={handleTogglePositiveCharge}
              >
                <span aria-hidden="true">⊕</span>
                <span>
                  {state.showPositiveCharge
                    ? "Hiện điện tích dương: Đang bật"
                    : "Hiện điện tích dương: Đang tắt"}
                </span>
              </button>

              <button
                type="button"
                className={`${styles.actionBtn} ${
                  isCloudFocus ? styles.primarySampleBtn : ""
                }`}
                disabled={state.sampleCount >= MAX_ELECTRON_SAMPLES}
                onClick={() => handleAddSamples(1)}
              >
                Ghi nhận vị trí electron (+1 mẫu)
              </button>

              {isCloudFocus && (
                <>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    disabled={state.sampleCount >= MAX_ELECTRON_SAMPLES}
                    onClick={() => handleAddSamples(100)}
                  >
                    Lấy thêm 100 mẫu
                  </button>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    disabled={state.sampleCount === 0}
                    onClick={handleResetSamples}
                  >
                    Làm lại
                  </button>
                </>
              )}
            </div>

            {isCloudFocus && (
              <div className={styles.sampleStatsPill} role="status" aria-live="polite">
                <span>Bộ đếm: {stats.total} mẫu</span>
                {stats.total > 0 && (
                  <span style={{ color: "#525252", fontWeight: 500 }}>
                    (trong 1a₀: {stats.innerCount} mẫu · {stats.innerPercent}%)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Khung quan sát: Đặt cạnh nhau trên máy tính hoặc cùng khung nhìn đồng tâm */}
        {state.compareSideBySide ? (
          <div className={styles.stageContainerCompare}>
            <div>
              <AtomicModelViewport
                model="thomson"
                showPositiveCharge={state.showPositiveCharge}
                samples={samples}
                highlightLatestSample={false}
              />
            </div>
            <div className={styles.secondaryComparePane}>
              <AtomicModelViewport
                model="rutherford"
                showPositiveCharge={state.showPositiveCharge}
                samples={samples}
                highlightLatestSample={false}
              />
            </div>
          </div>
        ) : (
          <div className={styles.stageContainerSingle}>
            <AtomicModelViewport
              model={state.activeModel}
              showPositiveCharge={state.showPositiveCharge}
              samples={samples}
              highlightLatestSample={highlightLatest}
            />
          </div>
        )}

        {/* Chú giải kí hiệu và quy ước biểu diễn khoa học */}
        <div className={styles.legendAndConventions}>
          <div className={styles.legendItems}>
            <span>
              <span className={styles.legendSwatchPos} aria-hidden="true">
                +
              </span>
              Điện tích dương (+1e)
            </span>
            <span>
              <span className={styles.legendSwatchElec} aria-hidden="true">
                −
              </span>
              Electron (e⁻) / 1 phép đo vị trí electron
            </span>
            <span style={{ color: "#525252", fontWeight: 500 }}>
              Vòng nét đứt: <code>r = 1 a₀</code> và <code>r = 2 a₀</code> quanh tâm <code>(0, 0)</code>
            </span>
          </div>

          <p className={styles.conventionNote}>
            <strong>Quy ước biểu diễn trên hình:</strong> (1){" "}
            <em>Phóng đại hạt nhân:</em> Bán kính proton thực tế (~<code>0,84 × 10⁻¹⁵ m</code>) nhỏ hơn bán kính Bohr{" "}
            <code>a₀</code> (~<code>0,53 × 10⁻¹⁰ m</code>) khoảng <code>63 000</code> lần, nên chấm hạt nhân ở tâm được vẽ phóng đại ~<code>10 000</code> lần để nhìn thấy vị trí. (2){" "}
            <em>Đám mây Hydrogen 1s:</em> Biểu diễn <strong>lát cắt phẳng đi qua tâm hạt nhân (z = 0)</strong>; mỗi chấm là kết quả một phép đo vị trí electron trên một nguyên tử Hydrogen chuẩn bị cùng trạng thái cơ bản <code>1s</code> (không phải có nhiều electron trong cùng một nguyên tử), mật độ chấm tỉ lệ với <code>|ψ₁ₛ|² ∝ e⁻²ʳ/ᵃ⁰</code>.
          </p>
        </div>
      </section>

      {/* 3. Nối mô hình với bằng chứng tán xạ hạt alpha của Rutherford */}
      <section
        className={styles.evidenceBridgeCard}
        aria-labelledby="b21-evidence-bridge-heading"
      >
        <div className={styles.bridgeHeader}>
          <h4 id="b21-evidence-bridge-heading" className={styles.bridgeQuestion}>
            Liên hệ bằng chứng thí nghiệm: “Phần lớn hạt alpha đi gần như thẳng qua lá vàng, nhưng một số rất ít lệch góc lớn. Quan sát nào gợi ý điện tích dương tập trung trong một vùng nhỏ?”
          </h4>
          {onOpenRutherfordV3 && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={onOpenRutherfordV3}
            >
              Mở lại Rutherford V3 để xem thiết bị &amp; kết quả →
            </button>
          )}
        </div>

        <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
          <legend style={{ fontSize: "13.5px", fontWeight: 700, marginBottom: "8px" }}>
            1. Chọn mô hình nguyên tử được chứng minh trực tiếp từ kết quả tán xạ trên lá vàng:
          </legend>
          <div className={styles.choiceList}>
            {(
              [
                [
                  "thomson",
                  "Mô hình Thomson (điện tích dương phân bố khắp thể tích nguyên tử)",
                ],
                [
                  "rutherford",
                  "Mô hình hành tinh Rutherford (điện tích dương tập trung ở hạt nhân rất nhỏ tại tâm)",
                ],
                [
                  "cloud",
                  "Mô hình đám mây electron (thay quỹ đạo bằng mật độ xác suất lượng tử)",
                ],
              ] as const
            ).map(([id, label]) => {
              const selected = state.selectedEvidenceModel === id;
              return (
                <label
                  key={id}
                  className={`${styles.choiceOption} ${
                    selected ? styles.choiceOptionSelected : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="b21-atomic-evidence-model"
                    value={id}
                    checked={selected}
                    onChange={() =>
                      commitState((prev) => ({
                        ...prev,
                        selectedEvidenceModel: id,
                        submittedEvidence: false,
                      }))
                    }
                    style={{ marginTop: "3px" }}
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="b21-atomic-evidence-explanation"
            style={{
              display: "block",
              fontSize: "13.5px",
              fontWeight: 700,
              marginBottom: "6px",
            }}
          >
            2. Viết một câu giải thích của em (quan sát nào trên màn gợi ý vùng điện tích dương rất nhỏ?):
          </label>
          <textarea
            id="b21-atomic-evidence-explanation"
            name="b21-atomic-evidence-explanation"
            autoComplete="off"
            rows={2}
            value={state.explanationText}
            onChange={(e) =>
              commitState((prev) => ({
                ...prev,
                explanationText: e.target.value,
                submittedEvidence: false,
              }))
            }
            placeholder="Ví dụ: Chỉ một số rất ít hạt alpha bị bật ngược hoặc lệch góc lớn chứng tỏ chúng gặp lực đẩy điện cực mạnh từ một hạt nhân rất nhỏ mang điện dương…"
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "14.5px",
              lineHeight: 1.5,
              fontFamily: "inherit",
              color: "#161616",
              backgroundColor: "#ffffff",
              border: "1px solid #8d8d8d",
              borderRadius: "2px",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.primarySampleBtn}`}
            onClick={() =>
              commitState((prev) => ({
                ...prev,
                submittedEvidence: true,
              }))
            }
          >
            Kiểm tra &amp; lưu lập luận
          </button>
          {!state.hasExploredStage && (
            <span style={{ fontSize: "13px", color: "#525252" }}>
              Hãy thử ít nhất một thao tác trên khung mô phỏng phía trên trước khi hoàn tất mục.
            </span>
          )}
        </div>

        {state.submittedEvidence && (
          <div
            role="status"
            aria-live="polite"
            className={`${styles.feedbackBox} ${
              feedback.status === "complete"
                ? styles.feedbackBoxSuccess
                : feedback.status === "needs_revision"
                  ? styles.feedbackBoxError
                  : styles.feedbackBoxWarn
            }`}
          >
            <strong style={{ display: "block", marginBottom: "4px" }}>
              {feedback.headline}
            </strong>
            <span>{feedback.detail}</span>
            {feedback.status === "complete" && !state.hasExploredStage && (
              <p style={{ margin: "6px 0 0", fontWeight: 600, color: "#8e6a00" }}>
                Em hãy bấm chuyển đổi mô hình hoặc thử thao tác trên khung hình phía trên để ghi nhận hoàn thành mục học này.
              </p>
            )}
          </div>
        )}
      </section>

      {/* 4. Phần Đọc thêm về Mô hình Bohr & Erwin Schrödinger theo SGK */}
      <details
        style={{
          border: "1px solid #d0d7de",
          backgroundColor: "#fafafa",
          padding: "12px 16px",
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "14px",
            color: "#0f62fe",
          }}
        >
          Đọc thêm: Niels Bohr (1913) &amp; Erwin Schrödinger — Theo SGK Vật lí 12 tr. 92–93
        </summary>
        <div
          style={{
            marginTop: "10px",
            fontSize: "14px",
            lineHeight: 1.6,
            color: "#161616",
          }}
        >
          <p style={{ margin: "0 0 8px" }}>
            Theo điện động lực học cổ điển, electron chuyển động có gia tốc trên quỹ đạo quanh hạt nhân như trong mô hình hành tinh Rutherford sẽ bức xạ năng lượng liên tục và nhanh chóng rơi vào hạt nhân. Năm 1913,{" "}
            <strong>Niels Bohr (1913)</strong> đưa ra hai tiên đề cho nguyên tử Hydrogen (<Nuclide sym="H" a={1} z={1} />): electron chỉ chuyển động trên những{" "}
            <em>quỹ đạo dừng</em> có bán kính xác định (bán kính quỹ đạo dừng cơ bản là{" "}
            <code>a₀ ≈ 0,53 × 10⁻¹⁰ m</code>) mà không bức xạ; nguyên tử chỉ phát hay hấp thụ photon khi chuyển giữa hai trạng thái dừng.
          </p>
          <p style={{ margin: 0, color: "#393939" }}>
            Đến năm 1926, <strong>Erwin Schrödinger</strong> cùng các nhà sáng lập cơ học lượng tử xây dựng phương trình sóng mô tả trạng thái electron, dẫn tới{" "}
            <strong>mô hình đám mây electron</strong> hiện đại (SGK tr. 93): electron không chuyển động theo quỹ đạo cố định mà được biểu diễn bằng đám mây mật độ xác suất tìm thấy electron quanh hạt nhân.
          </p>
        </div>
      </details>
    </div>
  );
}
