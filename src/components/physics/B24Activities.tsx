"use client";

import { useState, useEffect, useRef } from "react";
import { ChoiceCheck, Feedback, Lab, Sources } from "./shared";
import { LatexMath } from "@/components/learning/LatexMath";
import {
  REACTOR_FLOW_LAST_STEP,
  REACTOR_FLOW_STAGES,
  REACTOR_LAST_GENERATION,
  REACTOR_SOURCE,
  reactorFlowState,
  reactorState,
} from "@/lib/reactor-model";
import { usePersistedLabState, useSyncLabProgress } from "@/lib/use-persisted-lab-state";
import reactorStyles from "./ReactorActivity.module.css";

export type ActivityProps = {
  onProgress?: (done: boolean) => void;
};

/* ============================================================================
   1. DÒNG TRUYỀN NĂNG LƯỢNG NHÀ MÁY ĐIỆN HẠT NHÂN (Hình 24.1 SGK tr. 114–115)
   Lưu trữ bền vững: "b24-energy-flow-v1"
   ============================================================================ */

export const B24_ENERGY_FLOW_STORAGE_KEY = "b24-energy-flow-v1";

type FluidLoopId = "primary" | "secondary" | "cooling";
type TurbineDriverChoice = "" | "primary_water" | "secondary_steam" | "cooling_water";

interface EnergyFlowPersistedState {
  readonly visitedStages: readonly number[];
  readonly inspectedLoops: readonly FluidLoopId[];
  readonly turbineChoice: TurbineDriverChoice;
  readonly answered: boolean;
}

const INITIAL_ENERGY_FLOW_STATE: EnergyFlowPersistedState = {
  visitedStages: [0],
  inspectedLoops: ["primary"],
  turbineChoice: "",
  answered: false,
};

function parseEnergyFlowState(
  raw: unknown,
  fallback: EnergyFlowPersistedState
): EnergyFlowPersistedState {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const visitedStages = Array.isArray(obj.visitedStages)
    ? Array.from(
        new Set(
          obj.visitedStages.filter(
            (n): n is number =>
              typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= REACTOR_FLOW_LAST_STEP
          )
        )
      )
    : fallback.visitedStages;
  const validLoops: readonly FluidLoopId[] = ["primary", "secondary", "cooling"];
  const inspectedLoops = Array.isArray(obj.inspectedLoops)
    ? Array.from(
        new Set(
          obj.inspectedLoops.filter((x): x is FluidLoopId =>
            validLoops.includes(x as FluidLoopId)
          )
        )
      )
    : fallback.inspectedLoops;
  const turbineChoice: TurbineDriverChoice =
    obj.turbineChoice === "primary_water" ||
    obj.turbineChoice === "secondary_steam" ||
    obj.turbineChoice === "cooling_water"
      ? obj.turbineChoice
      : "";
  return {
    visitedStages: visitedStages.length > 0 ? visitedStages : [0],
    inspectedLoops: inspectedLoops.length > 0 ? inspectedLoops : ["primary"],
    turbineChoice,
    answered: Boolean(obj.answered),
  };
}

const FLUID_LOOPS: ReadonlyArray<{
  id: FluidLoopId;
  badge: string;
  title: string;
  color: string;
  bg: string;
  border: string;
  fluidState: string;
  pathway: string;
  isolationRole: string;
}> = [
  {
    id: "primary",
    badge: "Vòng 1",
    title: "Vòng tải nhiệt sơ cấp khép kín",
    color: "#c2410c",
    bg: "#fff7ed",
    border: "#fdba74",
    fluidState: "Nước (hoặc chất tải nhiệt) ở áp suất rất cao (~155 atm), nóng trên 300 °C nhưng không sôi.",
    pathway: "Tâm lò phản ứng → ống chữ U trong bình sinh hơi → bơm tuần hoàn quay lại tâm lò.",
    isolationRole:
      "Nằm trọn trong vỏ bảo vệ lò phản ứng; truyền nhiệt qua thành ống kim loại sang vòng thứ cấp, giữ kín mọi sản phẩm phóng xạ không thoát ra tua-bin.",
  },
  {
    id: "secondary",
    badge: "Vòng 2",
    title: "Vòng hơi nước – nước ngưng thứ cấp",
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#7dd3fc",
    fluidState: "Nước sạch nhận nhiệt hóa thành hơi nước áp suất cao → sau tua-bin ngưng tụ lại thành nước lỏng.",
    pathway: "Bình sinh hơi → hơi áp suất cao làm quay tua-bin → bình ngưng → bơm cấp nước quay lại bình sinh hơi.",
    isolationRole:
      "Chính dòng hơi nước thứ cấp này trực tiếp đẩy cánh tua-bin quay kéo máy phát điện mà không trộn lẫn với chất tải nhiệt sơ cấp.",
  },
  {
    id: "cooling",
    badge: "Vòng 3",
    title: "Dòng nước làm mát từ sông / hồ / biển",
    color: "#047857",
    bg: "#ecfdf5",
    border: "#6ee7b7",
    fluidState: "Nước tự nhiên nhiệt độ thấp bơm qua chùm ống trao đổi nhiệt tại bình ngưng.",
    pathway: "Nguồn nước tự nhiên (sông/hồ/biển hoặc tháp giải nhiệt) → ống làm mát bình ngưng → trả lại nguồn.",
    isolationRole:
      "Giải nhiệt dư để hơi thứ cấp sau tua-bin ngưng tụ thành nước lỏng; tách biệt qua thành ống bình ngưng nên không tiếp xúc với hơi thứ cấp lẫn vòng sơ cấp.",
  },
];

const ENERGY_TRANSFORMS = [
  {
    step: 0,
    station: "1. Lò phản ứng",
    conversion: "Năng lượng hạt nhân → Nội năng (nhiệt)",
    loopTag: "Vòng 1 (sơ cấp)",
  },
  {
    step: 1,
    station: "2. Bình sinh hơi",
    conversion: "Truyền nhiệt qua thành ống (sơ cấp → thứ cấp hóa hơi)",
    loopTag: "Giao diện Vòng 1 – Vòng 2",
  },
  {
    step: 2,
    station: "3. Tua-bin hơi",
    conversion: "Nội năng dòng hơi áp suất cao → Cơ năng quay",
    loopTag: "Vòng 2 (hơi thứ cấp)",
  },
  {
    step: 3,
    station: "4. Máy phát điện",
    conversion: "Cơ năng trục quay → Điện năng xoay chiều",
    loopTag: "Trục nối cơ khí → Lưới điện",
  },
  {
    step: 4,
    station: "5. Bình ngưng",
    conversion: "Giải nhiệt dư làm hơi thứ cấp ngưng tụ hồi lưu",
    loopTag: "Giao diện Vòng 2 – Vòng 3",
  },
] as const;

const flowPaths = [
  "M120 144H244",
  "M284 122V76H396",
  "M476 76H548",
  "M628 76H676",
  "M436 102V182H292V150",
];

const flowDevices = [
  { x: 30, y: 118, width: 108, title: "1. Lò phản ứng" },
  { x: 222, y: 118, width: 118, title: "2. Bình sinh hơi" },
  { x: 382, y: 50, width: 102, title: "3. Tua-bin" },
  { x: 526, y: 50, width: 114, title: "4. Máy phát" },
  { x: 376, y: 162, width: 114, title: "5. Bình ngưng" },
];

const portraitFlowPaths = [
  "M122 110H168",
  "M218 148V218H74V246",
  "M126 276H172",
  "M264 276H286",
  "M74 308V370 M74 430V468H248V148",
];

const portraitFlowDevices = [
  { x: 18, y: 84, title: ["1. Lò phản", "ứng"] },
  { x: 168, y: 84, title: ["2. Bình", "sinh hơi"] },
  { x: 18, y: 246, title: ["3. Tua-bin"] },
  { x: 168, y: 246, title: ["4. Máy phát"] },
  { x: 18, y: 370, title: ["5. Bình", "ngưng"] },
];

function ThreeLoopEnergyDiagram({
  state,
  activeLoop,
}: {
  state: ReturnType<typeof reactorFlowState>;
  activeLoop: FluidLoopId;
}) {
  return (
    <figure className={reactorStyles.diagram}>
      <svg
        className={reactorStyles.landscape}
        viewBox="0 0 700 264"
        role="img"
        aria-label="Sơ đồ Hình 24.1 SGK: Ba vòng lưu chất không trộn lẫn và chuỗi truyền năng lượng trong nhà máy điện hạt nhân"
      >
        <rect x="12" y="10" width="676" height="244" rx="14" fill="#0f2537" />
        {/* Nhà lò bảo vệ cách li vòng sơ cấp */}
        <rect
          x="22"
          y="88"
          width="330"
          height="124"
          rx="12"
          fill="none"
          stroke="#fb923c"
          strokeWidth="1.5"
          strokeDasharray="6 5"
          opacity="0.65"
        />
        <text x="32" y="106" fill="#fdba74" fontSize="12" fontWeight="600">
          Vỏ bảo vệ lò phản ứng (cách li phóng xạ)
        </text>

        {/* Vòng 1: Sơ cấp khép kín */}
        <path
          d="M138 136H248V178H84V166"
          fill="none"
          stroke="#fb923c"
          strokeWidth={activeLoop === "primary" ? 6.5 : 4.5}
        />
        <path d="M184 130L196 136L184 142ZM176 172L164 178L176 184Z" fill="#fb923c" />

        {/* Vòng 2: Hơi – nước ngưng thứ cấp */}
        <path
          d="M312 118V76H436V162 M376 186H296V166"
          fill="none"
          stroke="#38bdf8"
          strokeWidth={activeLoop === "secondary" ? 6.5 : 4.5}
        />
        <path
          d="M344 70L356 76L344 82ZM430 124L436 136L442 124ZM340 180L328 186L340 192Z"
          fill="#38bdf8"
        />

        {/* Trục cơ năng -> Điện năng */}
        <path
          d="M484 76H676"
          fill="none"
          stroke="#a3e635"
          strokeWidth="4"
          strokeDasharray="8 6"
        />
        <path d="M504 70L516 76L504 82ZM654 70L666 76L654 82Z" fill="#a3e635" />

        {/* Vòng 3: Dòng nước làm mát từ sông/hồ/biển qua Bình ngưng */}
        <path
          d="M490 176H658 M658 198H490"
          fill="none"
          stroke="#34d399"
          strokeWidth={activeLoop === "cooling" ? 6.5 : 4.5}
        />
        <path d="M566 170L554 176L566 182ZM574 192L586 198L574 204Z" fill="#34d399" />
        <text x="664" y="182" fill="#6ee7b7" fontSize="11.5" textAnchor="end" fontWeight="600">
          Nước mát vào (sông/biển)
        </text>
        <text x="664" y="215" fill="#6ee7b7" fontSize="11.5" textAnchor="end">
          Nước giải nhiệt ra
        </text>

        {/* Đường xung năng lượng đang xét */}
        <path
          d={flowPaths[state.step]}
          pathLength="1"
          fill="none"
          stroke="#fde047"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.85"
          strokeDasharray={state.finished ? "1 1" : `${Math.max(0.08, state.progress)} 1`}
        />

        {flowDevices.map(({ x, y, width, title }, index) => (
          <g key={title}>
            <rect
              x={x}
              y={y}
              width={width}
              height="48"
              rx="8"
              fill="#1e3a52"
              stroke={index === state.step ? "#fde047" : "#64879e"}
              strokeWidth={index === state.step ? 3 : 1.5}
            />
            <text
              x={x + width / 2}
              y={y + 29}
              fill="#f8fafc"
              textAnchor="middle"
              fontSize="13.5"
              fontWeight="650"
            >
              {title}
            </text>
          </g>
        ))}

        {/* Chú giải 3 vòng */}
        <g fontSize="12.5" fontWeight="600">
          <text x="30" y="34" fill="#fdba74">
            ● Vòng 1: Tải nhiệt sơ cấp (kín, áp suất cao)
          </text>
          <text x="30" y="54" fill="#7dd3fc">
            ● Vòng 2: Hơi – nước ngưng thứ cấp (quay tua-bin)
          </text>
          <text x="30" y="74" fill="#6ee7b7">
            ● Vòng 3: Nước làm mát sông/hồ/biển (qua bình ngưng)
          </text>
        </g>
      </svg>

      <svg
        className={reactorStyles.portrait}
        viewBox="0 0 300 560"
        role="img"
        aria-label="Sơ đồ Hình 24.1 SGK trên màn hình dọc: Ba vòng lưu chất không trộn lẫn"
      >
        <rect width="300" height="560" rx="14" fill="#0f2537" />
        <text x="16" y="26" fill="#fdba74" fontSize="12.5" fontWeight="650">
          ● Vòng 1: Tải nhiệt sơ cấp (cách li kín)
        </text>
        <text x="16" y="45" fill="#7dd3fc" fontSize="12.5" fontWeight="650">
          ● Vòng 2: Hơi – nước thứ cấp (quay tua-bin)
        </text>
        <text x="16" y="64" fill="#6ee7b7" fontSize="12.5" fontWeight="650">
          ● Vòng 3: Nước mát sông/hồ/biển (bình ngưng)
        </text>

        {/* Vòng 1 */}
        <path
          d="M118 110H182V168H68V144"
          fill="none"
          stroke="#fb923c"
          strokeWidth={activeLoop === "primary" ? 5.5 : 4}
        />
        {/* Vòng 2 */}
        <path
          d="M222 144V218H68V468H252V144"
          fill="none"
          stroke="#38bdf8"
          strokeWidth={activeLoop === "secondary" ? 5.5 : 4}
        />
        {/* Trục máy phát */}
        <path
          d="M118 276H286"
          fill="none"
          stroke="#a3e635"
          strokeWidth="3.5"
          strokeDasharray="7 5"
        />
        {/* Vòng 3 nước làm mát */}
        <path
          d="M118 392H282 M282 414H118"
          fill="none"
          stroke="#34d399"
          strokeWidth={activeLoop === "cooling" ? 5.5 : 4}
        />
        <text x="200" y="384" fill="#6ee7b7" fontSize="11.5" textAnchor="middle">
          Nước sông/biển làm mát
        </text>

        <path
          d={portraitFlowPaths[state.step]}
          pathLength="1"
          fill="none"
          stroke="#fde047"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.85"
          strokeDasharray={state.finished ? "1 1" : `${Math.max(0.08, state.progress)} 1`}
        />

        {portraitFlowDevices.map(({ x, y, title }, index) => (
          <g key={index}>
            <rect
              x={x}
              y={y}
              width="104"
              height="60"
              rx="8"
              fill="#1e3a52"
              stroke={index === state.step ? "#fde047" : "#64879e"}
              strokeWidth={index === state.step ? 3 : 1.5}
            />
            <text
              x={x + 52}
              y={y + (title.length > 1 ? 25 : 35)}
              fill="#f8fafc"
              textAnchor="middle"
              fontSize="13.5"
              fontWeight="650"
            >
              {title.map((line, lineIndex) => (
                <tspan key={line} x={x + 52} dy={lineIndex === 0 ? 0 : 19}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        ))}

        <text x="172" y="330" fill="#a3e635" fontSize="12.5" fontWeight="600">
          Trục cơ năng → Điện
        </text>
        <text x="18" y="502" fill="#7dd3fc" fontSize="12.5">
          Bơm hồi lưu nước ngưng về bình sinh hơi
        </text>
        <text x="18" y="528" fill="#fdba74" fontSize="12">
          Ba vòng trao đổi nhiệt qua thành ống, không trộn lẫn.
        </text>
      </svg>

      <figcaption>
        <strong>{state.stage.label}:</strong> {state.stage.detail}
      </figcaption>
    </figure>
  );
}

export function NuclearPowerEnergyFlow({ onProgress }: ActivityProps) {
  const [persisted, setPersisted, resetPersisted] = usePersistedLabState(
    B24_ENERGY_FLOW_STORAGE_KEY,
    INITIAL_ENERGY_FLOW_STATE,
    parseEnergyFlowState
  );
  const [position, setPosition] = useState(0);
  const [running, setRunning] = useState(false);
  const [activeLoop, setActiveLoop] = useState<FluidLoopId>("primary");
  const container = useRef<HTMLDivElement>(null);
  const positionRef = useRef(0);

  const flow = reactorFlowState(position);
  const currentTransform = ENERGY_TRANSFORMS[flow.step] ?? ENERGY_TRANSFORMS[0];
  const currentLoopInfo =
    FLUID_LOOPS.find((item) => item.id === activeLoop) ?? FLUID_LOOPS[0];

  const isDone =
    persisted.visitedStages.length >= 3 &&
    persisted.inspectedLoops.length >= 3 &&
    persisted.turbineChoice === "secondary_steam" &&
    persisted.answered;

  useSyncLabProgress(isDone, onProgress);

  function markStageVisited(stepIdx: number) {
    setPersisted((prev) =>
      prev.visitedStages.includes(stepIdx)
        ? prev
        : { ...prev, visitedStages: [...prev.visitedStages, stepIdx] }
    );
  }

  function seek(next: number) {
    const clamped = Math.max(0, Math.min(REACTOR_FLOW_LAST_STEP, next));
    positionRef.current = clamped;
    setPosition(clamped);
    setRunning(false);
    markStageVisited(Math.floor(clamped));
  }

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
    if (!running) return;
    let frame = 0;
    let previous = performance.now();
    function animate(now: number) {
      const next = Math.min(
        REACTOR_FLOW_LAST_STEP,
        positionRef.current + Math.min(now - previous, 80) / 1200
      );
      previous = now;
      positionRef.current = next;
      setPosition(next);
      const stepIdx = Math.floor(next);
      setPersisted((prev) =>
        prev.visitedStages.includes(stepIdx)
          ? prev
          : { ...prev, visitedStages: [...prev.visitedStages, stepIdx] }
      );
      if (next >= REACTOR_FLOW_LAST_STEP) setRunning(false);
      else frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [running, setPersisted]);

  function selectLoop(loopId: FluidLoopId) {
    setActiveLoop(loopId);
    setPersisted((prev) =>
      prev.inspectedLoops.includes(loopId)
        ? prev
        : { ...prev, inspectedLoops: [...prev.inspectedLoops, loopId] }
    );
  }

  return (
    <div ref={container}>
      <Lab
        intro="Mô phỏng đường truyền năng lượng và 3 vòng lưu chất cách li trong nhà máy điện hạt nhân kiểu lò nước áp lực (Hình 24.1 SGK trang 114–115)."
        note="Mô hình sơ đồ nguyên lí theo Hình 24.1 SGK Vật lí 12: ba vòng lưu chất trao đổi nhiệt gián tiếp qua thành ống ở bình sinh hơi và bình ngưng, hoàn toàn không trộn lẫn nhau."
      >
        <div className="physics-guide">
          <p>
            <strong>⚡ Nhiệm vụ khám phá Hình 24.1 SGK:</strong>
          </p>
          <ol>
            <li>
              <strong>Lần theo trạm biến đổi năng lượng:</strong> Chạy dòng truyền hoặc bấm qua ít nhất 3 trạm từ <em>Lò phản ứng → Bình sinh hơi → Tua-bin → Máy phát điện → Bình ngưng</em>.
            </li>
            <li>
              <strong>Đọc chú giải 3 vòng lưu chất:</strong> Bấm kiểm tra đủ 3 vòng lưu chất để phân biệt rõ vòng nào qua tâm lò, vòng nào quay tua-bin và vòng nào giải nhiệt ở bình ngưng.
            </li>
            <li>
              <strong>Xác nhận an toàn bức xạ:</strong> Nhận diện đúng lưu chất trực tiếp làm quay tua-bin và trả lời câu hỏi kiểm tra.
            </li>
          </ol>
        </div>

        <div className="physics-controls" aria-label="Điều khiển chạy dòng truyền năng lượng">
          <button
            type="button"
            className="physics-button primary"
            onClick={() => {
              if (positionRef.current >= REACTOR_FLOW_LAST_STEP) seek(0);
              setRunning((r) => !r);
            }}
          >
            {running
              ? "Tạm dừng"
              : position >= REACTOR_FLOW_LAST_STEP
                ? "Chạy lại dòng truyền"
                : position > 0
                  ? "Tiếp tục dòng truyền"
                  : "Chạy dòng năng lượng"}
          </button>
          <button
            type="button"
            className="physics-button"
            disabled={position >= REACTOR_FLOW_LAST_STEP}
            onClick={() => seek(Math.min(REACTOR_FLOW_LAST_STEP, Math.floor(position) + 1))}
          >
            Trạm kế tiếp
          </button>
          <button type="button" className="physics-button" onClick={() => seek(0)}>
            Về trạm 1
          </button>
        </div>

        <div className="physics-controls" aria-label="Chọn từng trạm trên dây chuyền nhà máy">
          {REACTOR_FLOW_STAGES.map((stage, index) => (
            <button
              key={stage.id}
              type="button"
              className={`physics-button ${index === flow.step ? "primary" : ""}`}
              aria-pressed={index === flow.step}
              onClick={() => seek(index)}
            >
              {index + 1}. {stage.label} {persisted.visitedStages.includes(index) ? "✓" : ""}
            </button>
          ))}
        </div>

        <ThreeLoopEnergyDiagram state={flow} activeLoop={activeLoop} />

        <div
          role="status"
          style={{
            padding: "12px 14px",
            borderRadius: "10px",
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
            marginBottom: "14px",
          }}
        >
          <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
            {currentTransform.station} ·{" "}
            <span style={{ color: "#0369a1" }}>{currentTransform.conversion}</span>
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "13.5px", color: "#334155" }}>
            Vòng liên quan: <strong>{currentTransform.loopTag}</strong> — {flow.stage.detail}
          </p>
        </div>

        <div style={{ marginTop: "14px", marginBottom: "16px" }}>
          <p style={{ fontWeight: 700, marginBottom: "8px" }}>
            Phân biệt 3 vòng lưu chất không trộn lẫn trên Hình 24.1 SGK (bấm xem đủ 3 vòng):
          </p>
          <div className="physics-controls" aria-label="Chọn vòng lưu chất để đọc chú giải">
            {FLUID_LOOPS.map((loop) => (
              <button
                key={loop.id}
                type="button"
                className={`physics-button ${activeLoop === loop.id ? "primary" : ""}`}
                aria-pressed={activeLoop === loop.id}
                onClick={() => selectLoop(loop.id)}
              >
                {loop.badge}: {loop.title.replace(/^Vòng\s+/, "")}{" "}
                {persisted.inspectedLoops.includes(loop.id) ? "✓" : ""}
              </button>
            ))}
          </div>

          <div
            style={{
              marginTop: "10px",
              padding: "14px",
              borderRadius: "10px",
              backgroundColor: currentLoopInfo.bg,
              border: `1.5px solid ${currentLoopInfo.border}`,
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, color: currentLoopInfo.color, fontSize: "15px" }}>
              {currentLoopInfo.badge} — {currentLoopInfo.title}
            </p>
            <p style={{ margin: "6px 0 4px", fontSize: "13.5px", lineHeight: 1.55 }}>
              <strong>Trạng thái lưu chất:</strong> {currentLoopInfo.fluidState}
            </p>
            <p style={{ margin: "0 0 4px", fontSize: "13.5px", lineHeight: 1.55 }}>
              <strong>Đường đi tuần hoàn:</strong> {currentLoopInfo.pathway}
            </p>
            <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
              <strong>Vai trò cách li &amp; chuyển hóa:</strong> {currentLoopInfo.isolationRole}
            </p>
          </div>
        </div>

        <div
          style={{
            padding: "14px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#ffffff",
            marginBottom: "14px",
          }}
        >
          <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
            <legend style={{ fontWeight: 700, marginBottom: "8px", fontSize: "14.5px" }}>
              Nhận diện nhanh trên Hình 24.1 SGK: Bộ phận / dòng lưu chất nào trực tiếp làm quay cánh tua-bin?
            </legend>
            {[
              {
                val: "primary_water" as const,
                label: "Dòng nước áp suất cao của vòng tải nhiệt sơ cấp đi trực tiếp từ tâm lò phản ứng sang tua-bin.",
              },
              {
                val: "secondary_steam" as const,
                label: "Hơi nước áp suất cao của vòng thứ cấp sinh ra tại bình sinh hơi (không trộn lẫn với vòng sơ cấp).",
              },
              {
                val: "cooling_water" as const,
                label: "Dòng nước làm mát bơm từ sông, hồ hoặc biển đi qua bình ngưng.",
              },
            ].map((opt) => (
              <label
                key={opt.val}
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "flex-start",
                  marginBottom: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="b24-turbine-driver"
                  checked={persisted.turbineChoice === opt.val}
                  onChange={() =>
                    setPersisted((prev) => ({ ...prev, turbineChoice: opt.val }))
                  }
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </fieldset>
          {persisted.turbineChoice && (
            <Feedback correct={persisted.turbineChoice === "secondary_steam"}>
              {persisted.turbineChoice === "secondary_steam"
                ? "Chính xác! Hơi nước áp suất cao ở vòng thứ cấp làm quay tua-bin rồi ngưng tụ ở bình ngưng để bơm quay lại bình sinh hơi."
                : persisted.turbineChoice === "primary_water"
                  ? "Chưa đúng. Nước vòng sơ cấp bị giữ khép kín trong nhà lò để cách li phóng xạ, tuyệt đối không đi ra tua-bin."
                  : "Chưa đúng. Nước sông/hồ/biển ở vòng 3 chỉ đi qua ống trao đổi nhiệt tại bình ngưng để làm nguội hơi thứ cấp sau khi qua tua-bin."}
            </Feedback>
          )}
        </div>

        <div className="physics-checklist">
          <p>
            <strong>Tiêu chí hoàn thành hoạt động:</strong>
          </p>
          <ul>
            <li className={persisted.visitedStages.length >= 3 ? "is-done" : ""}>
              Khảo sát ít nhất 3 trạm biến đổi năng lượng ({persisted.visitedStages.length}/3){" "}
              {persisted.visitedStages.length >= 3 ? "✓" : ""}
            </li>
            <li className={persisted.inspectedLoops.length >= 3 ? "is-done" : ""}>
              Đọc chú giải phân biệt đủ 3 vòng lưu chất ({persisted.inspectedLoops.length}/3){" "}
              {persisted.inspectedLoops.length >= 3 ? "✓" : ""}
            </li>
            <li className={persisted.turbineChoice === "secondary_steam" ? "is-done" : ""}>
              Nhận diện đúng dòng hơi vòng thứ cấp làm quay tua-bin{" "}
              {persisted.turbineChoice === "secondary_steam" ? "✓" : ""}
            </li>
            <li className={persisted.answered ? "is-done" : ""}>
              Trả lời đúng câu hỏi kiểm tra cách li 3 vòng {persisted.answered ? "✓" : ""}
            </li>
          </ul>
        </div>

        <ChoiceCheck
          key={persisted.answered ? "flow-solved" : "flow-unsolved"}
          initialSelected={persisted.answered ? 1 : null}
          initialChecked={persisted.answered}
          question="Vì sao nhà máy điện hạt nhân trong Hình 24.1 SGK phải thiết kế ba vòng lưu chất (sơ cấp, thứ cấp và nước làm mát) tách biệt qua các thành ống trao đổi nhiệt?"
          options={[
            "Để ba dòng nước trộn đều vào nhau giúp tăng tốc độ quay của tua-bin.",
            "Để truyền nhiệt sinh hơi quay tua-bin và giải nhiệt ngưng tụ hiệu quả nhưng vẫn giữ chất phóng xạ cô lập khép kín trong vòng sơ cấp.",
            "Để không cần dùng bình ngưng và bơm tuần hoàn trong nhà máy điện hạt nhân.",
          ]}
          correctIndex={1}
          explanation="Vòng sơ cấp nhận nhiệt trực tiếp từ tâm lò nên có thể chứa tạp chất phóng xạ và được giữ kín trong vỏ bảo vệ; vòng thứ cấp nhận nhiệt qua thành ống để sinh hơi sạch quay tua-bin; vòng nước sông/biển chỉ làm mát bình ngưng ở ngoài."
          onResult={(correct) =>
            setPersisted((prev) => ({ ...prev, answered: correct }))
          }
        />

        <div style={{ marginTop: "10px" }}>
          <button
            type="button"
            className="physics-button"
            onClick={() => {
              resetPersisted();
              seek(0);
            }}
          >
            Làm lại từ đầu
          </button>
        </div>

        <Sources links={[{ label: "U.S. NRC · Pressurized Water Reactors", url: REACTOR_SOURCE }]} />
      </Lab>
    </div>
  );
}

/* ============================================================================
   2. ĐIỀU KHIỂN HỆ SỐ NHÂN NEUTRON k TRONG LÒ PHẢN ỨNG (Hình 24.3 SGK tr. 115–116)
   Lưu trữ bền vững: "b24-reactor-control-v1"
   ============================================================================ */

export const B24_REACTOR_CONTROL_STORAGE_KEY = "b24-reactor-control-v1";

interface ReactorControlPersistedState {
  readonly rod: number;
  readonly hasWithdrawn: boolean;
  readonly hasCritical: boolean;
  readonly hasInserted: boolean;
  readonly answered: boolean;
}

const INITIAL_REACTOR_CONTROL_STATE: ReactorControlPersistedState = {
  rod: 50,
  hasWithdrawn: false,
  hasCritical: true,
  hasInserted: false,
  answered: false,
};

function parseReactorControlState(
  raw: unknown,
  fallback: ReactorControlPersistedState
): ReactorControlPersistedState {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const rod =
    typeof obj.rod === "number" && Number.isFinite(obj.rod)
      ? Math.min(100, Math.max(0, Math.round(obj.rod / 5) * 5))
      : fallback.rod;
  return {
    rod,
    hasWithdrawn: Boolean(obj.hasWithdrawn) || rod < 35,
    hasCritical: Boolean(obj.hasCritical) || rod === 50,
    hasInserted: Boolean(obj.hasInserted) || rod > 75,
    answered: Boolean(obj.answered),
  };
}

const trendText = {
  rising: {
    label: "Vượt tới hạn (k > 1): số phân hạch kì vọng tăng qua các thế hệ — dùng khi khởi động hoặc nâng công suất có kiểm soát",
    comparison: ">",
    color: "#b45309",
  },
  steady: {
    label: "Tới hạn ổn định (k = 1): số phân hạch duy trì không đổi qua các thế hệ — chế độ phát điện ổn định",
    comparison: "=",
    color: "#086b66",
  },
  falling: {
    label: "Dưới tới hạn (k < 1): số phân hạch giảm dần qua các thế hệ — giảm công suất hoặc dập lò",
    comparison: "<",
    color: "#1d4e9a",
  },
};

const chainMax = reactorState(REACTOR_LAST_GENERATION, 0).expected;
const reactorFormat = (value: number) =>
  value.toLocaleString("vi", { maximumFractionDigits: 2 });

function NeutronPaths({ state }: { state: ReturnType<typeof reactorState> }) {
  const progress = state.finished ? 1 : state.progress;
  const insertion = state.rodPercent / 100;
  return (
    <figure className={reactorStyles.diagram}>
      <svg
        className={reactorStyles.landscape}
        viewBox="0 0 680 228"
        role="img"
        aria-label="Các đường đi quy ước của neutron qua chất làm chậm tới thanh điều khiển Boron/Cadmium hoặc thanh nhiên liệu U-235"
      >
        <rect x="18" y="12" width="644" height="204" rx="14" fill="#10263b" />
        <rect
          x="170"
          y="36"
          width="84"
          height="156"
          rx="10"
          fill="#18435a"
          stroke="#67e8f9"
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />
        <text x="212" y="60" fill="#a5f3fc" fontSize="13.5" textAnchor="middle" fontWeight="600">
          Chất làm chậm
        </text>
        <text x="212" y="78" fill="#cbd5e1" fontSize="12" textAnchor="middle">
          (H₂O / D₂O / C)
        </text>
        <rect
          x="302"
          y="28"
          width="38"
          height={48 + 92 * insertion}
          rx="5"
          fill="#94a3b8"
          stroke="#e2e8f0"
          strokeWidth="1.5"
        />
        <rect
          x="509"
          y="71"
          width="112"
          height="120"
          rx="12"
          fill="#744627"
          stroke="#f9ba82"
          strokeWidth="2"
        />
        <path
          d="M72 103H302 M72 155H509"
          fill="none"
          stroke="#9bcad8"
          strokeWidth="3"
          strokeDasharray="6 8"
        />
        <text x="58" y="54" fill="#e5f6fd" fontSize="18" fontWeight="650">
          Neutron
        </text>
        <text x="321" y="50" fill="#0f172a" fontSize="16" textAnchor="middle" fontWeight="700">
          ↓
        </text>
        <text x="352" y="88" fill="#e2e8f0" fontSize="16" fontWeight="600">
          Thanh điều khiển (B / Cd)
        </text>
        <text x="565" y="128" fill="#fff1df" fontSize="16.5" textAnchor="middle" fontWeight="650">
          Nhiên liệu
        </text>
        <text x="565" y="150" fill="#fed7aa" fontSize="14" textAnchor="middle">
          ²³⁵U phân hạch
        </text>
        <circle cx={72 + 230 * progress} cy="103" r="9.5" fill="#65d5f0" opacity={insertion} />
        <circle
          cx={72 + 437 * Math.min(1, progress / 0.78)}
          cy="155"
          r="9.5"
          fill="#ffc27d"
          opacity={1 - 0.65 * insertion}
        />
        {progress > 0.78 && (
          <g fill="#ffc27d" opacity={1 - 0.65 * insertion}>
            <circle cx={622 + 86 * (progress - 0.78)} cy={128 - 52 * (progress - 0.78)} r="6" />
            <circle cx={622 + 86 * (progress - 0.78)} cy={154 + 52 * (progress - 0.78)} r="6" />
          </g>
        )}
      </svg>

      <svg
        className={reactorStyles.portrait}
        viewBox="0 0 280 380"
        role="img"
        aria-label="Các đường đi quy ước của neutron trên màn hình dọc"
      >
        <rect width="280" height="380" rx="14" fill="#10263b" />
        <rect x="12" y="12" width="256" height="170" rx="10" fill="#19384c" />
        <text x="140" y="38" textAnchor="middle" fill="#d6f4fb" fontSize="15.5" fontWeight="650">
          Thanh điều khiển (Boron / Cadmium)
        </text>
        <text x="140" y="60" textAnchor="middle" fill="#bed6e3" fontSize="13.5">
          Hấp thụ bớt neutron dư
        </text>
        <path d="M36 126H216" stroke="#99c2d3" strokeWidth="3" strokeDasharray="6 8" />
        <rect x="205" y="92" width="30" height={28 + 40 * insertion} rx="5" fill="#94a3b8" />
        <circle cx={36 + 169 * progress} cy="126" r="8.5" fill="#65d5f0" opacity={insertion} />
        <text x="42" y="156" textAnchor="middle" fill="#cbdce5" fontSize="13.5">
          n nhiệt
        </text>

        <rect x="12" y="194" width="256" height="174" rx="10" fill="#19384c" />
        <text x="140" y="222" textAnchor="middle" fill="#ffe0bf" fontSize="15.5" fontWeight="650">
          Qua chất làm chậm tới ²³⁵U
        </text>
        <text x="140" y="244" textAnchor="middle" fill="#bed6e3" fontSize="13.5">
          Duy trì phân hạch thế hệ tiếp theo
        </text>
        <path d="M36 306H205" stroke="#d6b18c" strokeWidth="3" strokeDasharray="6 8" />
        <circle cx="214" cy="306" r="23" fill="#744627" stroke="#f9ba82" strokeWidth="2" />
        <circle
          cx={36 + 155 * Math.min(1, progress / 0.78)}
          cy="306"
          r="8.5"
          fill="#ffc27d"
          opacity={1 - 0.65 * insertion}
        />
        {progress > 0.78 && (
          <g fill="#ffc27d" opacity={1 - 0.65 * insertion}>
            <circle cx={241 + 68 * (progress - 0.78)} cy={292 - 50 * (progress - 0.78)} r="5" />
            <circle cx={241 + 68 * (progress - 0.78)} cy={318 + 50 * (progress - 0.78)} r="5" />
          </g>
        )}
        <text x="42" y="342" textAnchor="middle" fill="#cbdce5" fontSize="13.5">
          n nhiệt
        </text>
      </svg>
      <figcaption>
        Chất làm chậm giảm tốc neutron nhanh thành neutron nhiệt dễ gây phân hạch ²³⁵U; thanh điều khiển chứa Boron hoặc Cadmium hấp thụ neutron để điều chỉnh hệ số nhân k.
      </figcaption>
    </figure>
  );
}

export function ReactorControlConcept({ onProgress }: ActivityProps) {
  const [persisted, setPersisted, resetPersisted] = usePersistedLabState(
    B24_REACTOR_CONTROL_STORAGE_KEY,
    INITIAL_REACTOR_CONTROL_STATE,
    parseReactorControlState
  );
  const [position, setPosition] = useState(0);
  const [running, setRunning] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const positionRef = useRef(0);

  const rod = persisted.rod;
  const chain = reactorState(position, rod);
  const trend = trendText[chain.trend];
  const multiplier = reactorFormat(chain.k).replace(",", "{,}");

  const isDone =
    persisted.hasWithdrawn &&
    persisted.hasCritical &&
    persisted.hasInserted &&
    persisted.answered;

  useSyncLabProgress(isDone, onProgress);

  function seek(next: number) {
    positionRef.current = next;
    setPosition(next);
    setRunning(false);
  }

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
    if (!running) return;
    let frame = 0;
    let previous = performance.now();
    function animate(now: number) {
      const next = Math.min(
        REACTOR_LAST_GENERATION,
        positionRef.current + Math.min(now - previous, 80) / 1250
      );
      previous = now;
      positionRef.current = next;
      setPosition(next);
      if (next >= REACTOR_LAST_GENERATION) setRunning(false);
      else frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  function changeRod(next: number) {
    seek(0);
    setPersisted((prev) => ({
      ...prev,
      rod: next,
      hasWithdrawn: prev.hasWithdrawn || next < 35,
      hasCritical: prev.hasCritical || next === 50,
      hasInserted: prev.hasInserted || next > 75,
    }));
  }

  return (
    <div ref={container}>
      <Lab
        intro="Điều khiển phản ứng phân hạch dây chuyền bằng thanh điều khiển Boron/Cadmium, chất làm chậm và an toàn nhiệt dư (Hình 24.3 SGK trang 115–116)."
        note="Mô hình định tính theo các thế hệ phân hạch: mốc 50% biểu diễn trạng thái tới hạn ổn định k = 1 trong mô hình dạy học; không suy trực tiếp thành độ sâu cơ khí hay công suất tức thời của một lò cụ thể."
      >
        <div className="physics-guide">
          <p>
            <strong>🎛️ Chu trình thí nghiệm điều khiển hệ số nhân neutron k:</strong>
          </p>
          <ol>
            <li>
              <strong>Thử chế độ k &gt; 1 (rút bớt thanh &lt; 35%):</strong> Quan sát số phân hạch kì vọng tăng qua các thế hệ khi mới khởi động lò.
            </li>
            <li>
              <strong>Đưa về k = 1 (mốc cân bằng 50%):</strong> Giữ số neutron gây phân hạch không đổi qua các thế hệ để lò phát điện ổn định.
            </li>
            <li>
              <strong>Thử chế độ k &lt; 1 (cắm sâu thanh &gt; 75%):</strong> Hạ sâu thanh Boron/Cadmium hấp thụ neutron và đọc lưu ý về <em>an toàn nhiệt dư</em>.
            </li>
          </ol>
        </div>

        <div className="physics-controls" aria-label="Chọn nhanh chế độ vận hành thanh điều khiển">
          <button
            type="button"
            className={`physics-button ${rod < 50 ? "primary" : ""}`}
            onClick={() => changeRod(15)}
          >
            Rút bớt thanh (15% · k &gt; 1) {persisted.hasWithdrawn ? "✓" : ""}
          </button>
          <button
            type="button"
            className={`physics-button ${rod === 50 ? "primary" : ""}`}
            onClick={() => changeRod(50)}
          >
            Giữ ổn định (50% · k = 1) {persisted.hasCritical ? "✓" : ""}
          </button>
          <button
            type="button"
            className={`physics-button ${rod > 50 ? "primary" : ""}`}
            onClick={() => changeRod(90)}
          >
            Hạ sâu dập lò (90% · k &lt; 1) {persisted.hasInserted ? "✓" : ""}
          </button>
        </div>

        <label className="physics-field">
          <span>
            Độ ngập thanh điều khiển Boron / Cadmium: <strong>{rod}%</strong>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={rod}
            onChange={(event) => changeRod(Number(event.target.value))}
          />
        </label>

        <div className="physics-controls">
          <button
            type="button"
            className="physics-button primary"
            onClick={() => {
              if (positionRef.current >= REACTOR_LAST_GENERATION) seek(0);
              setRunning((r) => !r);
            }}
          >
            {running
              ? "Tạm dừng"
              : position >= REACTOR_LAST_GENERATION
                ? "Chạy lại các thế hệ"
                : position > 0
                  ? "Tiếp tục"
                  : "Mô phỏng các thế hệ neutron"}
          </button>
          <button
            type="button"
            className="physics-button"
            disabled={position >= REACTOR_LAST_GENERATION}
            onClick={() => seek(Math.min(REACTOR_LAST_GENERATION, Math.floor(position) + 1))}
          >
            Tiến 1 thế hệ
          </button>
          <button type="button" className="physics-button" onClick={() => seek(0)}>
            Về thế hệ 0
          </button>
        </div>

        <NeutronPaths state={chain} />

        <p role="status" className={reactorStyles.current}>
          <strong>Thế hệ {chain.generation}:</strong> {trend.label}.
        </p>
        <LatexMath block math={String.raw`k${trend.comparison}1\qquad k=${multiplier}`} />

        <div className={reactorStyles.generations} aria-label="Chỉ số phân hạch kì vọng theo thế hệ">
          {Array.from({ length: REACTOR_LAST_GENERATION + 1 }, (_, generation) => {
            const expected = reactorState(generation, rod).expected;
            return (
              <div
                key={generation}
                className={reactorStyles.generation}
                aria-current={generation === chain.generation ? "step" : undefined}
              >
                <span>{generation}</span>
                <div aria-hidden="true">
                  <i
                    style={{
                      width: generation > chain.generation ? 0 : `${(100 * expected) / chainMax}%`,
                      backgroundColor: trend.color,
                    }}
                  />
                </div>
                <span>{generation > chain.generation ? "…" : reactorFormat(expected)}</span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "10px",
            margin: "14px 0",
          }}
        >
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "#f0f9ff",
              border: "1px solid #bae6fd",
              fontSize: "13.5px",
              lineHeight: 1.55,
            }}
          >
            <strong>Vai trò chất làm chậm (H₂O, D₂O, than chì):</strong> Neutron sinh ra sau phân hạch là neutron nhanh (~2 MeV) khó gây phân hạch ²³⁵U. Chất làm chậm tán xạ đàn hồi giảm động năng neutron xuống mức <em>neutron nhiệt</em> (~0,025 eV) để duy trì dây chuyền.
          </div>
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              fontSize: "13.5px",
              lineHeight: 1.55,
            }}
          >
            <strong>An toàn nhiệt dư sau khi dập lò (k &lt; 1):</strong> Hạ toàn bộ thanh điều khiển chỉ dừng phân hạch dây chuyền mới, nhưng các sản phẩm phân hạch phóng xạ trong thanh nhiên liệu vẫn phân rã tỏa <em>nhiệt dư</em> — hệ thống bơm làm mát khẩn cấp vẫn bắt buộc phải duy trì.
          </div>
        </div>

        <div className="physics-checklist">
          <p>
            <strong>Tiêu chí hoàn thành:</strong>
          </p>
          <ul>
            <li className={persisted.hasWithdrawn ? "is-done" : ""}>
              Đã khảo sát chế độ rút bớt thanh (k &gt; 1) {persisted.hasWithdrawn ? "✓" : ""}
            </li>
            <li className={persisted.hasCritical ? "is-done" : ""}>
              Đã khảo sát chế độ tới hạn ổn định (k = 1) {persisted.hasCritical ? "✓" : ""}
            </li>
            <li className={persisted.hasInserted ? "is-done" : ""}>
              Đã khảo sát chế độ cắm sâu thanh điều khiển (k &lt; 1) {persisted.hasInserted ? "✓" : ""}
            </li>
            <li className={persisted.answered ? "is-done" : ""}>
              Trả lời đúng câu hỏi điều khiển &amp; an toàn nhiệt dư {persisted.answered ? "✓" : ""}
            </li>
          </ul>
        </div>

        <ChoiceCheck
          key={persisted.answered ? "ctrl-solved" : "ctrl-unsolved"}
          initialSelected={persisted.answered ? 1 : null}
          initialChecked={persisted.answered}
          question="Khi cần dừng phản ứng dây chuyền khẩn cấp, việc hạ sâu các thanh điều khiển chứa Boron hoặc Cadmium vào tâm lò có tác dụng gì và vì sao vẫn phải tiếp tục bơm làm mát?"
          options={[
            "Làm tăng hệ số nhân neutron k > 1 để đốt hết nhiên liệu nhanh hơn.",
            "Hấp thụ mạnh neutron đưa k < 1 để tắt dây chuyền phân hạch, nhưng vẫn phải bơm làm mát để tải nhiệt dư do các mảnh phân hạch phóng xạ tiếp tục phân rã.",
            "Hấp thụ hoàn toàn nhiệt lượng của tâm lò nên có thể tắt ngay mọi hệ thống làm mát.",
          ]}
          correctIndex={1}
          explanation="Boron và Cadmium có tiết diện hấp thụ neutron nhiệt rất lớn nên hạ thanh điều khiển làm k < 1 nhanh chóng. Tuy nhiên các hạt nhân con phóng xạ trong nhiên liệu vẫn phân rã tỏa nhiệt dư nên hệ làm mát phải tiếp tục hoạt động."
          onResult={(correct) =>
            setPersisted((prev) => ({ ...prev, answered: correct }))
          }
        />

        <div style={{ marginTop: "10px" }}>
          <button
            type="button"
            className="physics-button"
            onClick={() => {
              resetPersisted();
              seek(0);
            }}
          >
            Làm lại từ đầu
          </button>
        </div>

        <Sources links={[{ label: "U.S. NRC · Pressurized Water Reactors", url: REACTOR_SOURCE }]} />
      </Lab>
    </div>
  );
}

/* ============================================================================
   3. Y HỌC HẠT NHÂN: ĐỐI CHIẾU CHẨN ĐOÁN HÌNH ẢNH & XẠ TRỊ (SGK tr. 116–117)
   Lưu trữ bền vững: "b24-medicine-v1"
   ============================================================================ */

export const B24_MEDICINE_STORAGE_KEY = "b24-medicine-v1";

type MedTab = "compare" | "spect_pet" | "therapy";
type ClinicalCategory = "spect" | "pet" | "therapy";

interface MedicinePersistedState {
  readonly tab: MedTab;
  readonly viewedTabs: readonly MedTab[];
  readonly caseAnswers: Readonly<Record<string, ClinicalCategory>>;
  readonly answered: boolean;
}

const INITIAL_MEDICINE_STATE: MedicinePersistedState = {
  tab: "compare",
  viewedTabs: ["compare"],
  caseAnswers: {},
  answered: false,
};

function parseMedicineState(
  raw: unknown,
  fallback: MedicinePersistedState
): MedicinePersistedState {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const validTabs: readonly MedTab[] = ["compare", "spect_pet", "therapy"];
  const tab: MedTab = validTabs.includes(obj.tab as MedTab) ? (obj.tab as MedTab) : fallback.tab;
  const viewedTabs = Array.isArray(obj.viewedTabs)
    ? Array.from(
        new Set(obj.viewedTabs.filter((x): x is MedTab => validTabs.includes(x as MedTab)))
      )
    : fallback.viewedTabs;
  const validCats: readonly ClinicalCategory[] = ["spect", "pet", "therapy"];
  const caseAnswers: Record<string, ClinicalCategory> = {};
  if (obj.caseAnswers && typeof obj.caseAnswers === "object") {
    for (const [k, v] of Object.entries(obj.caseAnswers as Record<string, unknown>)) {
      if (validCats.includes(v as ClinicalCategory)) {
        caseAnswers[k] = v as ClinicalCategory;
      }
    }
  }
  return {
    tab,
    viewedTabs: viewedTabs.length > 0 ? viewedTabs : ["compare"],
    caseAnswers,
    answered: Boolean(obj.answered),
  };
}

const CLINICAL_CASES: ReadonlyArray<{
  id: string;
  scenario: string;
  expected: ClinicalCategory;
  feedback: string;
}> = [
  {
    id: "case_bone_spect",
    scenario:
      "Tình huống 1 [Ô Em có biết SGK tr. 116]: Cần ghi hình chức năng cơ quan (như gan – mật, tưới máu cơ tim hoặc xương) bằng đầu thu/camera tia γ bên ngoài cơ thể với đồng vị đánh dấu chu kì bán rã ngắn.",
    expected: "spect",
    feedback:
      "SPECT [Ô Em có biết SGK tr. 116] ghi nhận tia γ đơn photon thoát ra ngoài cơ thể (ví dụ mở rộng thực tế lâm sàng dùng ⁹⁹₄₃Tc* / ⁹⁹ᵐTc, T = 6 giờ, liều chiếu thấp).",
  },
  {
    id: "case_glucose_pet",
    scenario:
      "Tình huống 2 [Ô Em có biết SGK tr. 116 & Bài 6 tr. 122]: Tiêm dược chất FDG gắn ¹⁸₉F phát positron (T = 110 phút) để máy chụp cắt lớp phát xạ positron phát hiện ổ mô tiêu thụ mạnh đường glucose.",
    expected: "pet",
    feedback:
      "PET [Ô Em có biết SGK tr. 116] dùng ¹⁸₉F-FDG (T = 110 phút). [Giải thích vật lí mở rộng]: positron hủy cặp với electron phát 2 photon γ (511 keV) bay ngược chiều 180° giúp định vị 3D chính xác.",
  },
  {
    id: "case_tumor_therapy",
    scenario:
      "Tình huống 3 [Mục II.2 SGK tr. 117]: Tập trung liều bức xạ ion hóa cao để tiêu diệt tế bào ung thư (tiêm dược chất Xofigo chứa ²²³₈₈Ra, Lutathera chứa ¹⁷⁷₇₁Lu hoặc chiếu chùm tia từ máy xạ trị ngoài).",
    expected: "therapy",
    feedback:
      "Điều trị ung thư (SGK tr. 117): tập trung năng lượng bức xạ vào mô bệnh bằng dược chất gắn đích (²²³₈₈Ra — lưu ý bản in SGK tr. 117 in nhầm chỉ số dưới là 86; ¹⁷⁷₇₁Lu) hoặc chiếu tia từ ngoài có che chắn mô lành.",
  },
];

export function NuclearMedicine({ onProgress }: ActivityProps) {
  const [persisted, setPersisted, resetPersisted] = usePersistedLabState(
    B24_MEDICINE_STORAGE_KEY,
    INITIAL_MEDICINE_STATE,
    parseMedicineState
  );

  const allCasesCorrect = CLINICAL_CASES.every(
    (item) => persisted.caseAnswers[item.id] === item.expected
  );
  const isDone = persisted.viewedTabs.length >= 2 && allCasesCorrect && persisted.answered;

  useSyncLabProgress(isDone, onProgress);

  function handleTab(nextTab: MedTab) {
    setPersisted((prev) => ({
      ...prev,
      tab: nextTab,
      viewedTabs: prev.viewedTabs.includes(nextTab)
        ? prev.viewedTabs
        : [...prev.viewedTabs, nextTab],
    }));
  }

  function handleCaseSelect(caseId: string, cat: ClinicalCategory) {
    setPersisted((prev) => ({
      ...prev,
      caseAnswers: { ...prev.caseAnswers, [caseId]: cat },
    }));
  }

  return (
    <Lab
      intro="Y học hạt nhân (SGK trang 116–117, Hình 24.4): Đối chiếu trực tiếp Chẩn đoán hình ảnh chức năng (SPECT, PET) với Xạ trị điều trị."
      note="Đồng vị và nguồn bức xạ được lựa chọn dựa trên loại tia phát ra (khả năng xuyên thoát hay truyền năng lượng tại chỗ), chu kì bán rã T và cơ chế bảo vệ mô lành. Nội dung phục vụ học tập Vật lí 12."
    >
      <div className="physics-guide">
        <p>
          <strong>🏥 Nhiệm vụ khám phá &amp; phân loại lâm sàng:</strong>
        </p>
        <ol>
          <li>
            <strong>Đối chiếu:</strong> Xem bảng đối chiếu trực tiếp giữa <em>Chẩn đoán hình ảnh</em> và <em>Xạ trị điều trị</em> cùng ít nhất 1 thẻ chi tiết.
          </li>
          <li>
            <strong>Phân loại tình huống:</strong> Chọn đúng kỹ thuật cho cả 3 tình huống lâm sàng dựa trên loại bức xạ và chu kì bán rã.
          </li>
          <li>
            <strong>Kiểm tra:</strong> Giải thích cơ chế kép của đồng vị ¹³¹I đối với tuyến giáp.
          </li>
        </ol>
      </div>

      <div className="physics-controls" aria-label="Chọn nội dung y học hạt nhân">
        <button
          type="button"
          className={`physics-button ${persisted.tab === "compare" ? "primary" : ""}`}
          onClick={() => handleTab("compare")}
        >
          Bảng đối chiếu Chẩn đoán vs Xạ trị {persisted.viewedTabs.includes("compare") ? "✓" : ""}
        </button>
        <button
          type="button"
          className={`physics-button ${persisted.tab === "spect_pet" ? "primary" : ""}`}
          onClick={() => handleTab("spect_pet")}
        >
          Chẩn đoán SPECT &amp; PET {persisted.viewedTabs.includes("spect_pet") ? "✓" : ""}
        </button>
        <button
          type="button"
          className={`physics-button ${persisted.tab === "therapy" ? "primary" : ""}`}
          onClick={() => handleTab("therapy")}
        >
          Xạ trị đích &amp; ⁶⁰Co {persisted.viewedTabs.includes("therapy") ? "✓" : ""}
        </button>
      </div>

      {persisted.tab === "compare" && (
        <div style={{ marginTop: "14px", overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13.5px",
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
            }}
          >
            <caption style={{ textAlign: "left", fontWeight: 700, padding: "8px 0" }}>
              Đối chiếu vật lí: Chẩn đoán hình ảnh chức năng vs Xạ trị điều trị (SGK tr. 116–117)
            </caption>
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9" }}>
                <th style={{ padding: "10px", border: "1px solid #cbd5e1", textAlign: "left" }}>
                  Tiêu chí vật lí
                </th>
                <th style={{ padding: "10px", border: "1px solid #cbd5e1", textAlign: "left", color: "#0369a1" }}>
                  Chẩn đoán hình ảnh (SPECT · PET)
                </th>
                <th style={{ padding: "10px", border: "1px solid #cbd5e1", textAlign: "left", color: "#7c3aed" }}>
                  Xạ trị điều trị (Đích trong &amp; Chùm tia ngoài)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" style={{ padding: "10px", border: "1px solid #cbd5e1", textAlign: "left" }}>
                  Đồng vị / nguồn tiêu biểu
                </th>
                <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>
                  SPECT: <strong>⁹⁹ᵐTc</strong> (T = 6 giờ) · PET: <strong>¹⁸F</strong> trong FDG (T = 110 phút)
                </td>
                <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>
                  Thuốc đích: <strong>¹³¹I</strong> (8 ngày), <strong>²²³Ra</strong> Xofigo (11,4 ngày), <strong>¹⁷⁷Lu</strong> Lutathera (6,7 ngày) · Chùm ngoài: <strong>⁶⁰Co</strong> (5,3 năm)
                </td>
              </tr>
              <tr>
                <th scope="row" style={{ padding: "10px", border: "1px solid #cbd5e1", textAlign: "left" }}>
                  Đặc trưng tia &amp; đường truyền
                </th>
                <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>
                  <strong>Tia γ thoát ra ngoài cơ thể</strong> (phát γ trực tiếp ở SPECT hoặc hủy cặp β⁺ + e⁻ → 2 tia γ 511 keV ở PET) để đầu thu bên ngoài ghi hình.
                </td>
                <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>
                  <strong>Tập trung liều diệt tế bào bệnh:</strong> tia α, β⁻ quãng chạy ngắn truyền năng lượng ngay tại mô u, hoặc hội tụ nhiều chùm γ ⁶⁰Co từ ngoài vào khối u.
                </td>
              </tr>
              <tr>
                <th scope="row" style={{ padding: "10px", border: "1px solid #cbd5e1", textAlign: "left" }}>
                  Chu kì bán rã &amp; an toàn mô lành
                </th>
                <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>
                  <strong>T rất ngắn</strong> (vài chục phút đến vài giờ), hoạt độ nhỏ vừa đủ ghi hình và đào thải sinh học nhanh để giảm liều chiếu.
                </td>
                <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>
                  Gắn phân tử hướng đích đặc hiệu mô bệnh hoặc <strong>che chắn bằng khối chì/tungsten, chiếu nhiều góc</strong> để bảo vệ mô lành xung quanh.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {persisted.tab === "spect_pet" && (
        <div
          style={{
            marginTop: "14px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "12px",
          }}
        >
          <div style={{ padding: "12px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px" }}>
            <p style={{ margin: 0, fontWeight: 700, color: "#15803d" }}>
              SPECT · Chụp cắt lớp phát xạ đơn photon
            </p>
            <p style={{ fontSize: "13.5px", margin: "6px 0 0", lineHeight: 1.55 }}>
              • <strong>⁹⁹ᵐTc (T = 6 giờ):</strong> Phát tia γ trực tiếp năng lượng ~140 keV xuyên qua mô ra ngoài để camera gamma quay quanh người bệnh dựng ảnh chức năng tim, xương, thận.
              <br />• T ngắn và không phát hạt α/β⁻ năng lượng lớn nên hạn chế tổn thương mô.
            </p>
          </div>
          <div style={{ padding: "12px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px" }}>
            <p style={{ margin: 0, fontWeight: 700, color: "#1d4ed8" }}>
              PET · Chụp cắt lớp phát xạ positron
            </p>
            <p style={{ fontSize: "13.5px", margin: "6px 0 0", lineHeight: 1.55 }}>
              • <strong>¹⁸F-FDG (T = 110 phút):</strong> Phát positron (β⁺); ngay khi gặp electron trong mô, cặp hạt hủy nhau phát ra <strong>2 photon γ (511 keV) bay ngược chiều 180°</strong> thoát ra vòng đầu thu giúp định vị khối u độ phân giải cao.
            </p>
          </div>
        </div>
      )}

      {persisted.tab === "therapy" && (
        <div
          style={{
            marginTop: "14px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "10px",
          }}
        >
          <div style={{ padding: "12px", backgroundColor: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: "8px" }}>
            <p style={{ margin: 0, fontWeight: 700, color: "#7c3aed" }}>
              Dược chất phóng xạ hướng đích (Chiếu xạ trong)
            </p>
            <p style={{ fontSize: "13.5px", margin: "6px 0 0", lineHeight: 1.55 }}>
              • <strong>¹³¹I (T = 8 ngày):</strong> Tuyến giáp hấp thụ chọn lọc iốt → tia β⁻ tiêu diệt tế bào u tuyến giáp tại chỗ.
              <br />• <strong>²²³Ra Xofigo (T = 11,4 ngày):</strong> Gắn vào mô xương di căn, phát tia α quãng chạy cực ngắn (&lt; 0,1 mm) phá hủy DNA tế bào u.
              <br />• <strong>¹⁷⁷Lu Lutathera (T = 6,7 ngày):</strong> Gắn thụ thể khối u thần kinh nội tiết, phát tia β⁻ diệt u chọn lọc.
            </p>
          </div>
          <div style={{ padding: "12px", backgroundColor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px" }}>
            <p style={{ margin: 0, fontWeight: 700, color: "#c2410c" }}>
              Xạ trị chùm tia ngoài (⁶⁰Co / Máy gia tốc)
            </p>
            <p style={{ fontSize: "13.5px", margin: "6px 0 0", lineHeight: 1.55 }}>
              • Nguồn <strong>⁶⁰Co</strong> phát tia γ năng lượng cao (1,17 &amp; 1,33 MeV) đặt trong đầu máy bọc chì/tungsten dày.
              <br />• Hệ chuẩn trực hướng nhiều chùm tia giao nhau đúng tại khối u sâu để <strong>tập trung liều tại u nhưng giữ liều thấp cho mô lành</strong> trên đường đi.
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: "16px",
          padding: "14px",
          borderRadius: "10px",
          backgroundColor: "#f8fafc",
          border: "1px solid #cbd5e1",
        }}
      >
        <p style={{ margin: "0 0 10px", fontWeight: 700 }}>
          Bài tập phân loại tình huống lâm sàng ({CLINICAL_CASES.filter((c) => persisted.caseAnswers[c.id] === c.expected).length}/{CLINICAL_CASES.length} đúng):
        </p>
        {CLINICAL_CASES.map((item) => {
          const chosen = persisted.caseAnswers[item.id];
          const isRight = chosen === item.expected;
          return (
            <div
              key={item.id}
              style={{
                padding: "10px 12px",
                marginBottom: "10px",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
                border: `1px solid ${chosen ? (isRight ? "#86efac" : "#fca5a5") : "#e2e8f0"}`,
              }}
            >
              <p style={{ margin: "0 0 8px", fontSize: "13.5px", lineHeight: 1.55 }}>
                {item.scenario}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {(
                  [
                    ["spect", "Chẩn đoán SPECT (⁹⁹ᵐTc)"],
                    ["pet", "Chẩn đoán PET (¹⁸F-FDG)"],
                    ["therapy", "Xạ trị điều trị (Đích / ⁶⁰Co)"],
                  ] as const
                ).map(([cat, label]) => (
                  <button
                    key={cat}
                    type="button"
                    className={`physics-button ${chosen === cat ? "primary" : ""}`}
                    aria-pressed={chosen === cat}
                    onClick={() => handleCaseSelect(item.id, cat)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {chosen && (
                <p
                  role="status"
                  style={{
                    margin: "8px 0 0",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: isRight ? "#15803d" : "#b91c1c",
                  }}
                >
                  {isRight ? `✓ Đúng! ${item.feedback}` : "Chưa khớp cơ chế vật lí — hãy chú ý loại tia và mục đích ghi hình hay diệt tế bào bệnh."}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="physics-checklist">
        <p>
          <strong>Tiêu chí hoàn thành:</strong>
        </p>
        <ul>
          <li className={persisted.viewedTabs.length >= 2 ? "is-done" : ""}>
            Khảo sát bảng đối chiếu và thẻ kỹ thuật ({persisted.viewedTabs.length}/2){" "}
            {persisted.viewedTabs.length >= 2 ? "✓" : ""}
          </li>
          <li className={allCasesCorrect ? "is-done" : ""}>
            Phân loại đúng cả 3 tình huống lâm sàng (
            {CLINICAL_CASES.filter((c) => persisted.caseAnswers[c.id] === c.expected).length}/3){" "}
            {allCasesCorrect ? "✓" : ""}
          </li>
          <li className={persisted.answered ? "is-done" : ""}>
            Trả lời câu hỏi kiểm tra về ¹³¹I {persisted.answered ? "✓" : ""}
          </li>
        </ul>
      </div>

      <ChoiceCheck
        key={persisted.answered ? "med-solved" : "med-unsolved"}
        initialSelected={persisted.answered ? 1 : null}
        initialChecked={persisted.answered}
        question="Tại sao đồng vị ¹³¹I (T = 8 ngày) có thể dùng vừa để chẩn đoán ghi hình vừa để điều trị bệnh lí tuyến giáp?"
        options={[
          "Vì tuyến giáp là cơ quan duy nhất trong cơ thể cho phép mọi loại chất phóng xạ đi qua.",
          "Vì tuyến giáp hấp thụ chọn lọc iốt để tổng hợp hormone, đồng thời ¹³¹I phát cả tia γ (thoát ra ngoài giúp ghi hình ở liều thấp) và tia β⁻ (tiêu diệt mô bệnh tại chỗ ở liều điều trị).",
          "Vì ¹³¹I chỉ phát tia α xuyên thẳng ra ngoài cơ thể không bị hấp thụ.",
        ]}
        correctIndex={1}
        explanation="Tuyến giáp chủ động bắt giữ iốt nên ¹³¹I tập trung đặc hiệu tại đây: thành phần tia γ thoát ra ngoài phục vụ ghi hình, còn hạt β⁻ có quãng chạy ngắn (~1–2 mm) tiêu diệt mô tuyến giáp quá sản hoặc ung thư ở liều điều trị."
        onResult={(correct) => setPersisted((prev) => ({ ...prev, answered: correct }))}
      />

      <div style={{ marginTop: "10px" }}>
        <button type="button" className="physics-button" onClick={resetPersisted}>
          Làm lại từ đầu
        </button>
      </div>

      <Sources
        links={[
          {
            label: "Nuclear medicine – WHO",
            url: "https://www.who.int/news-room/fact-sheets/detail/nuclear-medicine",
          },
        ]}
      />
    </Lab>
  );
}

/* ============================================================================
   4. ỨNG DỤNG BỨC XẠ TRONG NÔNG NGHIỆP & ĐỜI SỐNG (SGK tr. 117–118 · Hình 24.5)
   Lưu trữ bền vững: "b24-applications-v1"
   ============================================================================ */

export const B24_APPLICATIONS_STORAGE_KEY = "b24-applications-v1";

type AppCategory = "agriculture" | "industry" | "research";

interface ApplicationsPersistedState {
  readonly category: AppCategory;
  readonly viewedCategories: readonly AppCategory[];
  readonly storageDay: 1 | 7;
  readonly inspectedTracer: boolean;
  readonly evidenceNote: string;
  readonly evidenceSaved: boolean;
  readonly answered: boolean;
}

const INITIAL_APPLICATIONS_STATE: ApplicationsPersistedState = {
  category: "agriculture",
  viewedCategories: ["agriculture"],
  storageDay: 7,
  inspectedTracer: false,
  evidenceNote: "",
  evidenceSaved: false,
  answered: false,
};

function parseApplicationsState(
  raw: unknown,
  fallback: ApplicationsPersistedState
): ApplicationsPersistedState {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const validCats: readonly AppCategory[] = ["agriculture", "industry", "research"];
  const category: AppCategory = validCats.includes(obj.category as AppCategory)
    ? (obj.category as AppCategory)
    : fallback.category;
  const viewedCategories = Array.isArray(obj.viewedCategories)
    ? Array.from(
        new Set(
          obj.viewedCategories.filter((x): x is AppCategory =>
            validCats.includes(x as AppCategory)
          )
        )
      )
    : fallback.viewedCategories;
  const storageDay: 1 | 7 = obj.storageDay === 1 ? 1 : 7;
  const evidenceNote = typeof obj.evidenceNote === "string" ? obj.evidenceNote : "";
  return {
    category,
    viewedCategories: viewedCategories.length > 0 ? viewedCategories : ["agriculture"],
    storageDay,
    inspectedTracer: Boolean(obj.inspectedTracer),
    evidenceNote,
    evidenceSaved: Boolean(obj.evidenceSaved) && evidenceNote.trim().length >= 15,
    answered: Boolean(obj.answered),
  };
}

const APPLICATIONS: Record<
  AppCategory,
  {
    title: string;
    icon: string;
    apps: {
      name: string;
      isotope: string;
      description: string;
      benefit: string;
      limitation: string;
    }[];
  }
> = {
  agriculture: {
    title: "Nông nghiệp và bảo quản thực phẩm",
    icon: "🌾",
    apps: [
      {
        name: "Chiếu xạ bảo quản vải thiều & nông sản (Hình 24.5 SGK)",
        isotope: "⁶⁰Co (tia γ) / chùm e⁻",
        description:
          "Chiếu tia γ liều kiểm soát xuyên qua kiện vải thiều đóng gói → phá vỡ DNA vi sinh vật, nấm mốc và côn trùng kiểm dịch → sau 7 ngày bảo quản quả vẫn đỏ tươi so với lô không chiếu xạ bị thâm mốc.",
        benefit: "Kéo dài thời gian tươi xuất khẩu, không tồn dư hóa chất và không làm thực phẩm nhiễm xạ",
        limitation: "Đầu tư buồng chiếu xạ che chắn dày, cần tuân thủ đúng liều quy chuẩn",
      },
      {
        name: "Đánh dấu phóng xạ ³²P tối ưu hóa phân bón",
        isotope: "³²P (β⁻, T = 14,3 ngày)",
        description:
          "Pha lượng vết đồng vị ³²P vào phân lân trong ô thí nghiệm → đo bức xạ β⁻ ở rễ, thân, lá theo thời gian để xác định chính xác tỉ lệ phân cây hấp thụ ở từng cách bón và giai đoạn sinh trưởng.",
        benefit: "Tối ưu liều lượng, vị trí và thời điểm bón phân, giảm rửa trôi lãng phí",
        limitation: "Chỉ thực hiện ở trạm nghiên cứu nông học có kiểm soát an toàn phóng xạ",
      },
      {
        name: "Chiếu xạ tạo giống cây trồng đột biến có lợi",
        isotope: "⁶⁰Co, ¹³⁷Cs (tia γ)",
        description:
          "Chiếu xạ hạt giống hoặc mô nuôi cấy để tăng tần suất biến dị di truyền, sau đó chọn lọc qua nhiều vụ các dòng lúa, đậu tương năng suất cao, chống chịu sâu bệnh và phèn mặn.",
        benefit: "Rút ngắn thời gian tạo nguồn biến dị quý cho chọn giống",
        limitation: "Đột biến là vô hướng nên cần sàng lọc số lượng cá thể lớn",
      },
    ],
  },
  industry: {
    title: "Công nghiệp và kiểm tra không phá hủy",
    icon: "🏭",
    apps: [
      {
        name: "Chụp ảnh phóng xạ kiểm tra mối hàn (NDT)",
        isotope: "¹⁹²Ir, ⁶⁰Co (tia γ)",
        description:
          "Đặt nguồn γ một bên và tấm thu ảnh bên kia thành ống dẫn dầu/vỏ bình áp lực → chỗ rỗ khí hoặc vết nứt bên trong hấp thụ tia ít hơn nên hiện rõ trên ảnh.",
        benefit: "Phát hiện khuyết tật ẩn sâu trong kim loại mà không phá hủy chi tiết",
        limitation: "Nguồn kín hoạt độ cao phải được cấp phép, vận chuyển và che chắn nghiêm ngặt",
      },
      {
        name: "Đo mức chất lỏng và độ dày vật liệu tự động",
        isotope: "¹³⁷Cs, ⁶⁰Co, ⁹⁰Sr",
        description:
          "Đo độ suy giảm cường độ chùm tia khi đi qua bồn chứa kín hoặc tấm thép/giấy đang cán nóng trên dây chuyền để tự động điều chỉnh độ dày.",
        benefit: "Đo không tiếp xúc trong môi trường nhiệt độ cao, áp suất lớn hoặc ăn mòn",
        limitation: "Định kì phải kiểm xạ và thu hồi nguồn hết hạn đúng quy định",
      },
    ],
  },
  research: {
    title: "Khảo cổ học và nghiên cứu sinh học",
    icon: "🔬",
    apps: [
      {
        name: "Định tuổi cổ vật hữu cơ bằng đồng vị ¹⁴C",
        isotope: "¹⁴C (β⁻, T = 5730 năm)",
        description:
          "Khi sinh vật chết ngừng trao đổi carbon với khí quyển, tỉ số ¹⁴C/¹²C giảm theo chu kì bán rã 5730 năm → đo độ phóng xạ còn lại giúp tính tuổi mẫu gỗ, than, xương cổ.",
        benefit: "Xác định niên đại khách quan cho mẫu hữu cơ tới khoảng 50.000 năm",
        limitation: "Không áp dụng cho đá vô cơ hoặc mẫu quá cổ khi lượng ¹⁴C còn quá nhỏ",
      },
      {
        name: "Nguyên tử đánh dấu trong sinh hóa học phân tử",
        isotope: "³H, ¹⁴C, ³²P, ³⁵S",
        description:
          "Gắn đồng vị phóng xạ vào phân tử hữu cơ để theo dõi hành trình chuyển hóa hoặc trình tự acid nucleic mà không làm thay đổi tính chất hóa học của phân tử đó.",
        benefit: "Độ nhạy phát hiện cực cao ở lượng vết phân tử",
        limitation: "Quản lí chất thải phóng xạ phòng thí nghiệm theo quy chuẩn",
      },
    ],
  },
};

export function RadiationApplications({ onProgress }: ActivityProps) {
  const [persisted, setPersisted, resetPersisted] = usePersistedLabState(
    B24_APPLICATIONS_STORAGE_KEY,
    INITIAL_APPLICATIONS_STATE,
    parseApplicationsState
  );
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const noteValue = draftNote ?? persisted.evidenceNote;
  const info = APPLICATIONS[persisted.category];

  const isDone =
    persisted.viewedCategories.length >= 2 &&
    persisted.evidenceSaved &&
    persisted.answered;

  useSyncLabProgress(isDone, onProgress);

  function handleCategory(cat: AppCategory) {
    setPersisted((prev) => ({
      ...prev,
      category: cat,
      viewedCategories: prev.viewedCategories.includes(cat)
        ? prev.viewedCategories
        : [...prev.viewedCategories, cat],
    }));
  }

  function handleSaveEvidence() {
    const trimmed = noteValue.trim();
    setPersisted((prev) => ({
      ...prev,
      evidenceNote: trimmed,
      evidenceSaved: trimmed.length >= 15,
    }));
    setDraftNote(null);
  }

  const day = persisted.storageDay;

  return (
    <Lab
      intro="Ứng dụng bức xạ và đồng vị phóng xạ trong nông nghiệp, công nghiệp, nghiên cứu (SGK trang 117–118, Hình 24.5)."
      note="Mọi ứng dụng bức xạ đều tuân thủ kiểm soát an toàn bức xạ (tại Việt Nam do Cục An toàn bức xạ và hạt nhân quản lí)."
    >
      <div className="physics-guide">
        <p>
          <strong>🌍 Chu trình khám phá thực tiễn:</strong>
        </p>
        <ol>
          <li>
            <strong>Đối chiếu Hình 24.5 SGK &amp; ³²P:</strong> Quan sát sự khác biệt giữa 2 lô vải thiều sau 7 ngày bảo quản và sơ đồ đánh dấu phóng xạ ³²P tối ưu phân bón.
          </li>
          <li>
            <strong>Khám phá liên ngành:</strong> Xem ít nhất 2 lĩnh vực ứng dụng (Nông nghiệp, Công nghiệp, Nghiên cứu).
          </li>
          <li>
            <strong>Ghi bằng chứng &amp; kiểm tra:</strong> Viết câu trả lời bằng chứng cụ thể và hoàn thành câu hỏi kiểm tra.
          </li>
        </ol>
      </div>

      {/* Minh họa trực quan Hình 24.5 SGK + đánh dấu ³²P */}
      <div
        style={{
          padding: "14px",
          borderRadius: "12px",
          backgroundColor: "#f8fafc",
          border: "1px solid #cbd5e1",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <strong style={{ fontSize: "14.5px", color: "#0f172a" }}>
            Minh họa Hình 24.5 SGK: Đối chiếu 2 lô vải thiều bảo quản &amp; vết phóng xạ ³²P
          </strong>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button
              type="button"
              className={`physics-button ${day === 1 ? "primary" : ""}`}
              onClick={() => setPersisted((prev) => ({ ...prev, storageDay: 1 }))}
            >
              Ngày đầu đóng gói
            </button>
            <button
              type="button"
              className={`physics-button ${day === 7 ? "primary" : ""}`}
              onClick={() => setPersisted((prev) => ({ ...prev, storageDay: 7 }))}
            >
              Sau 7 ngày bảo quản (Hình 24.5)
            </button>
          </div>
        </div>

        <svg
          viewBox="0 0 640 215"
          style={{ width: "100%", height: "auto", display: "block", borderRadius: "10px", background: "#ffffff", border: "1px solid #e2e8f0" }}
          role="img"
          aria-label={`Đối chiếu hai lô vải thiều ở thời điểm ${day === 7 ? "sau 7 ngày bảo quản" : "ngày đầu"} và minh họa đánh dấu phân bón P-32`}
        >
          {/* Khung 1 (trái): (a) Vải thiều được chiếu xạ — chuẩn Hình 24.5a SGK tr. 117 */}
          <rect x="12" y="12" width="196" height="191" rx="10" fill="#f0fdf4" stroke="#86efac" />
          <text x="110" y="34" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#14532d">
            (a) Đã chiếu xạ tia γ (⁶⁰Co)
          </text>
          <text x="110" y="51" textAnchor="middle" fontSize="11.5" fill="#166534">
            {day === 7 ? "Sau 7 ngày: giữ vỏ đỏ tươi" : "Tia γ xuyên qua diệt vi khuẩn"}
          </text>
          {[
            [72, 102],
            [114, 96],
            [148, 108],
            [90, 134],
            [132, 136],
          ].map(([cx, cy], idx) => (
            <g key={idx}>
              <circle cx={cx} cy={cy} r="17" fill="#e11d48" stroke="#be123c" strokeWidth="1.5" />
              <circle cx={cx - 5} cy={cy - 5} r="3.5" fill="#fda4af" opacity="0.7" />
            </g>
          ))}
          <text x="110" y="176" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#15803d">
            ✓ Tươi nguyên, không nấm mốc
          </text>
          <text x="110" y="193" textAnchor="middle" fontSize="11" fill="#166534">
            0 Bq tồn dư (Hình 24.5a SGK tr. 117)
          </text>

          {/* Khung 2 (phải): (b) Vải thiều thường không chiếu xạ — chuẩn Hình 24.5b SGK tr. 117 */}
          <rect x="222" y="12" width="196" height="191" rx="10" fill={day === 7 ? "#fef2f2" : "#fffbeb"} stroke="#cbd5e1" />
          <text x="320" y="34" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#1e293b">
            (b) Vải thiều thường
          </text>
          <text x="320" y="51" textAnchor="middle" fontSize="11.5" fill="#64748b">
            {day === 7 ? "Sau 7 ngày: thâm vỏ, nấm mốc" : "Ngày 1: còn mầm nấm & vi khuẩn"}
          </text>
          {[
            [282, 102],
            [324, 96],
            [358, 108],
            [300, 134],
            [342, 136],
          ].map(([cx, cy], idx) => (
            <g key={idx}>
              <circle
                cx={cx}
                cy={cy}
                r="17"
                fill={day === 7 ? "#78350f" : "#e11d48"}
                stroke={day === 7 ? "#451a03" : "#9f1239"}
                strokeWidth="1.5"
              />
              {day === 7 && (
                <>
                  <circle cx={cx - 5} cy={cy - 4} r="5" fill="#e2e8f0" opacity="0.9" />
                  <circle cx={cx + 6} cy={cy + 5} r="4" fill="#cbd5e1" opacity="0.9" />
                </>
              )}
            </g>
          ))}
          <text x="320" y="176" textAnchor="middle" fontSize="11.5" fontWeight="600" fill={day === 7 ? "#b91c1c" : "#475569"}>
            {day === 7 ? "✗ Nấm mốc phát triển mạnh" : "Vi sinh vật chưa bị ức chế"}
          </text>
          <text x="320" y="193" textAnchor="middle" fontSize="11" fill="#475569">
            Nhanh hỏng (Hình 24.5b SGK tr. 117)
          </text>

          {/* Khung 3: Đánh dấu phóng xạ ³²P tối ưu phân bón */}
          <rect x="432" y="12" width="196" height="191" rx="10" fill="#eff6ff" stroke="#93c5fd" />
          <text x="530" y="34" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#1e3a8a">
            Đánh dấu ³²P phân bón
          </text>
          <text x="530" y="51" textAnchor="middle" fontSize="11.5" fill="#1d4ed8">
            Theo dõi đường đi dinh dưỡng
          </text>
          {/* Đất & Rễ & Thân lá */}
          <rect x="448" y="138" width="164" height="26" rx="4" fill="#d6d3d1" />
          <path d="M530 140V78 M530 112L504 92 M530 100L558 82 M530 140L512 158 M530 140L548 158" stroke="#15803d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="500" cy="149" r="4" fill="#2563eb" />
          <circle cx="530" cy="122" r="4" fill="#2563eb" />
          <circle cx="552" cy="86" r="4" fill="#2563eb" />
          <text x="530" y="178" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#1e40af">
            Đo β⁻ của ³²P từ rễ → lá
          </text>
          <text x="530" y="193" textAnchor="middle" fontSize="11" fill="#1e3a8a">
            Tối ưu liều &amp; thời điểm bón lân
          </text>
        </svg>

        <div style={{ marginTop: "8px", fontSize: "13px", color: "#334155", lineHeight: 1.55 }}>
          <button
            type="button"
            className="physics-button"
            style={{ marginRight: "8px", padding: "4px 10px", fontSize: "12.5px" }}
            onClick={() => setPersisted((prev) => ({ ...prev, inspectedTracer: !prev.inspectedTracer }))}
          >
            {persisted.inspectedTracer ? "Ẩn phân biệt Chiếu xạ γ vs Đánh dấu ³²P" : "So sánh Chiếu xạ γ (Hình 24.5) với Đánh dấu ³²P"}
          </button>
          {persisted.inspectedTracer && (
            <p style={{ margin: "8px 0 0", padding: "10px", background: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
              <strong>Điểm phân biệt cốt lõi:</strong> Trong <em>chiếu xạ vải thiều (Hình 24.5)</em>, quả vải chỉ đi ngang qua chùm tia γ bên ngoài nguồn kín ⁶⁰Co nên thực phẩm hoàn toàn <strong>không chứa đồng vị phóng xạ</strong>. Ngược lại, kỹ thuật <em>đánh dấu ³²P</em> đưa trực tiếp lượng vết đồng vị ³²P vào phân bón trong <strong>ô thí nghiệm nông học có kiểm soát</strong> để đo tốc độ hấp thụ lân, không phải bón đại trà ra nông sản thương phẩm.
            </p>
          )}
        </div>
      </div>

      <div className="physics-controls" aria-label="Chọn lĩnh vực ứng dụng bức xạ">
        {(Object.keys(APPLICATIONS) as AppCategory[]).map((cat) => (
          <button
            key={cat}
            type="button"
            className={`physics-button ${persisted.category === cat ? "primary" : ""}`}
            onClick={() => handleCategory(cat)}
          >
            {APPLICATIONS[cat].icon} {APPLICATIONS[cat].title.split(" ")[0]}{" "}
            {persisted.viewedCategories.includes(cat) ? "✓" : ""}
          </button>
        ))}
      </div>

      <h4 style={{ fontSize: "15px", fontWeight: 600, marginTop: "16px", marginBottom: "12px" }}>
        {info.icon} {info.title}
      </h4>

      {info.apps.map((app) => (
        <div
          key={app.name}
          style={{
            padding: "14px",
            border: "1px solid var(--border-light)",
            borderRadius: "8px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "8px",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", margin: 0 }}>
              {app.name}
            </p>
            <span
              style={{
                fontSize: "12px",
                padding: "2px 8px",
                backgroundColor: "var(--bg-surface-elevated)",
                borderRadius: "4px",
                whiteSpace: "nowrap",
              }}
            >
              {app.isotope}
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px", lineHeight: 1.6 }}>
            {app.description}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "8px",
            }}
          >
            <div style={{ padding: "8px", backgroundColor: "#dcfce7", borderRadius: "4px", fontSize: "12px" }}>
              <strong>✓ Lợi ích:</strong> {app.benefit}
            </div>
            <div style={{ padding: "8px", backgroundColor: "#fef3c7", borderRadius: "4px", fontSize: "12px" }}>
              <strong>⚠ Yêu cầu kiểm soát:</strong> {app.limitation}
            </div>
          </div>
        </div>
      ))}

      {/* Ô nhập câu trả lời bằng chứng cụ thể từ bài */}
      <div
        style={{
          padding: "14px",
          borderRadius: "10px",
          backgroundColor: "#ffffff",
          border: "1px solid #cbd5e1",
          marginBottom: "14px",
        }}
      >
        <label style={{ display: "block", fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>
          Ghi chép bằng chứng từ bài học (Hình 24.5 SGK &amp; ³²P):
          <span style={{ display: "block", fontWeight: 400, fontSize: "13.5px", color: "#475569", marginTop: "4px" }}>
            Nêu bằng chứng cụ thể trên hai lô vải thiều sau 7 ngày và giải thích vì sao chiếu xạ tia γ giúp giữ tươi mà không làm thực phẩm nhiễm phóng xạ (tối thiểu 15 kí tự):
          </span>
          <textarea
            rows={3}
            value={noteValue}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Ví dụ: Sau 7 ngày lô vải chiếu xạ tia γ giữ vỏ đỏ tươi, không mốc như lô đối chứng; tia γ chỉ xuyên qua diệt vi sinh vật chứ không để lại chất phóng xạ trong quả..."
            style={{
              width: "100%",
              marginTop: "8px",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #94a3b8",
              fontFamily: "inherit",
              fontSize: "14px",
            }}
          />
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="physics-button primary"
            disabled={noteValue.trim().length < 15}
            onClick={handleSaveEvidence}
          >
            Lưu câu trả lời bằng chứng
          </button>
          {persisted.evidenceSaved && draftNote === null && (
            <span role="status" style={{ fontSize: "13px", fontWeight: 600, color: "#15803d" }}>
              ✓ Đã lưu bằng chứng vào bộ nhớ trình duyệt ({persisted.evidenceNote.length} kí tự).
            </span>
          )}
        </div>
      </div>

      <div className="physics-checklist">
        <p>
          <strong>Tiêu chí hoàn thành:</strong>
        </p>
        <ul>
          <li className={persisted.viewedCategories.length >= 2 ? "is-done" : ""}>
            Khám phá ít nhất 2 lĩnh vực ứng dụng ({persisted.viewedCategories.length}/2){" "}
            {persisted.viewedCategories.length >= 2 ? "✓" : ""}
          </li>
          <li className={persisted.evidenceSaved ? "is-done" : ""}>
            Viết và lưu câu trả lời bằng chứng từ Hình 24.5 SGK {persisted.evidenceSaved ? "✓" : ""}
          </li>
          <li className={persisted.answered ? "is-done" : ""}>
            Trả lời đúng câu hỏi kiểm tra an toàn chiếu xạ {persisted.answered ? "✓" : ""}
          </li>
        </ul>
      </div>

      <ChoiceCheck
        key={persisted.answered ? "app-solved" : "app-unsolved"}
        initialSelected={persisted.answered ? 1 : null}
        initialChecked={persisted.answered}
        question="Tại sao chiếu xạ thực phẩm bằng tia γ từ nguồn ⁶⁰Co (Hình 24.5 SGK) KHÔNG làm thực phẩm trở nên phóng xạ?"
        options={[
          "Vì tia γ bị vỏ quả phản xạ hoàn toàn, không đi vào bên trong thực phẩm.",
          "Vì tia γ là bức xạ điện từ xuyên qua phá hủy DNA vi khuẩn/nấm mốc ở mức năng lượng cho phép mà không để lại hạt nhân phóng xạ hay gây kích hoạt hạt nhân trong thực phẩm.",
          "Vì vi khuẩn đã hấp thụ toàn bộ các hạt nhân Cobalt-60.",
        ]}
        correctIndex={1}
        explanation="Thực phẩm không tiếp xúc với nguồn ⁶⁰Co; chùm photon γ ở mức năng lượng quy chuẩn (< 5 MeV với tia γ từ ⁶⁰Co có E ≈ 1,17–1,33 MeV) chỉ ion hóa tiêu diệt vi sinh vật gây hỏng mà không biến hạt nhân trong thực phẩm thành đồng vị phóng xạ."
        onResult={(correct) => setPersisted((prev) => ({ ...prev, answered: correct }))}
      />

      <div style={{ marginTop: "10px" }}>
        <button
          type="button"
          className="physics-button"
          onClick={() => {
            resetPersisted();
            setDraftNote(null);
          }}
        >
          Làm lại từ đầu
        </button>
      </div>
    </Lab>
  );
}
