"use client";

import { useState, useCallback } from "react";
import { B25DataProcessLab as DecayGraphLab } from "./B25DataProcessLab";
import { LatexMath } from "@/components/learning/LatexMath";
import { ChoiceCheck, Lab, Metrics, NuclearSymbol } from "./shared";
import {
  BINDING_NUCLIDES,
  bindingEnergy,
  HYDROGEN_ATOM_MASS_U,
  NEUTRON_MASS_U,
} from "@/lib/physics";
import { usePersistedLabState, useSyncLabProgress } from "@/lib/use-persisted-lab-state";

export type ActivityProps = {
  onProgress?: (done: boolean) => void;
};

/* ============================================================================
   Sub-lab 2: Cân bằng phương trình hạt nhân (Phân rã & Phân hạch Bài 25 SGK)
   Lưu trữ bền vững: "b25-eq-balancer-v1"
   ============================================================================ */

export const B25_EQ_BALANCER_STORAGE_KEY = "b25-eq-balancer-v1";

type EquationMode = "alpha" | "beta_neg" | "beta_pos" | "fission_u235";

interface EquationTaskSpec {
  readonly key: EquationMode;
  readonly label: string;
  readonly expectedA: number;
  readonly expectedZ: number;
  readonly daughterSymbol: string;
  readonly conservationGuide: string;
}

const EQUATION_TASKS: readonly EquationTaskSpec[] = [
  {
    key: "alpha",
    label: "Phân rã α (²³⁸U)",
    expectedA: 234,
    expectedZ: 90,
    daughterSymbol: "Th",
    conservationGuide:
      "Bảo toàn A: 238 = A + 4 ⇒ A = 234. Bảo toàn Z: 92 = Z + 2 ⇒ Z = 90 (Thorium, Th).",
  },
  {
    key: "beta_neg",
    label: "Phân rã β⁻ (¹⁴C)",
    expectedA: 14,
    expectedZ: 7,
    daughterSymbol: "N",
    conservationGuide:
      "Bảo toàn A: 14 = A + 0 ⇒ A = 14. Bảo toàn Z: 6 = Z + (−1) ⇒ Z = 7 (Nitrogen, N).",
  },
  {
    key: "beta_pos",
    label: "Phân rã β⁺ (¹⁸F)",
    expectedA: 18,
    expectedZ: 8,
    daughterSymbol: "O",
    conservationGuide:
      "Bảo toàn A: 18 = A + 0 ⇒ A = 18. Bảo toàn Z: 9 = Z + 1 ⇒ Z = 8 (Oxygen, O).",
  },
  {
    key: "fission_u235",
    label: "Phân hạch ²³⁵U (Bài 25 SGK)",
    expectedA: 94,
    expectedZ: 40,
    daughterSymbol: "Zr",
    conservationGuide:
      "Vế trái: A = 1 + 235 = 236, Z = 0 + 92 = 92. Vế phải: 140 + A + 2·1 + 6·0 = 236 ⇒ A = 94; 58 + Z + 2·0 + 6·(−1) = 92 ⇒ Z = 40 (Zirconium, Zr).",
  },
] as const;

const VALID_EQ_MODES: readonly EquationMode[] = [
  "alpha",
  "beta_neg",
  "beta_pos",
  "fission_u235",
];

interface EqBalancerPersistedState {
  readonly mode: EquationMode;
  readonly solvedTasks: readonly EquationMode[];
  readonly revealedTasks: readonly EquationMode[];
  readonly savedInputs: Readonly<Partial<Record<EquationMode, { a: string; z: string }>>>;
}

const INITIAL_EQ_BALANCER_STATE: EqBalancerPersistedState = {
  mode: "alpha",
  solvedTasks: [],
  revealedTasks: [],
  savedInputs: {},
};

function parseEqBalancerState(
  raw: unknown,
  fallback: EqBalancerPersistedState
): EqBalancerPersistedState {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const mode: EquationMode = VALID_EQ_MODES.includes(obj.mode as EquationMode)
    ? (obj.mode as EquationMode)
    : fallback.mode;
  const revealedTasks = Array.isArray(obj.revealedTasks)
    ? Array.from(
        new Set(
          obj.revealedTasks.filter((x): x is EquationMode =>
            VALID_EQ_MODES.includes(x as EquationMode)
          )
        )
      )
    : [];
  const solvedTasks = Array.isArray(obj.solvedTasks)
    ? Array.from(
        new Set(
          obj.solvedTasks.filter(
            (x): x is EquationMode =>
              VALID_EQ_MODES.includes(x as EquationMode) && !revealedTasks.includes(x as EquationMode)
          )
        )
      )
    : [];
  const savedInputs: Partial<Record<EquationMode, { a: string; z: string }>> = {};
  if (obj.savedInputs && typeof obj.savedInputs === "object") {
    for (const key of VALID_EQ_MODES) {
      const entry = (obj.savedInputs as Record<string, unknown>)[key];
      if (entry && typeof entry === "object") {
        const rec = entry as Record<string, unknown>;
        savedInputs[key] = {
          a: typeof rec.a === "string" ? rec.a : "",
          z: typeof rec.z === "string" ? rec.z : "",
        };
      }
    }
  }
  return { mode, solvedTasks, revealedTasks, savedInputs };
}

export function NuclearEquationBalancer({ onSubDone }: { onSubDone: (done: boolean) => void }) {
  const [persisted, setPersisted, resetPersisted] = usePersistedLabState(
    B25_EQ_BALANCER_STORAGE_KEY,
    INITIAL_EQ_BALANCER_STATE,
    parseEqBalancerState
  );
  const [draftInputs, setDraftInputs] = useState<{
    forMode: EquationMode;
    a: string;
    z: string;
  } | null>(null);
  const [checkedMode, setCheckedMode] = useState<EquationMode | null>(null);

  const mode = persisted.mode;
  const currentTask = EQUATION_TASKS.find((t) => t.key === mode) ?? EQUATION_TASKS[0];
  const savedForCurrent = persisted.savedInputs[mode];

  // Khởi tạo chuỗi rỗng "" khi chuyển sang bài chưa nhập (tuyệt đối không điền sẵn lộ đáp án!)
  const inputA =
    draftInputs && draftInputs.forMode === mode
      ? draftInputs.a
      : (savedForCurrent?.a ?? "");
  const inputZ =
    draftInputs && draftInputs.forMode === mode
      ? draftInputs.z
      : (savedForCurrent?.z ?? "");

  const parsedA = inputA.trim() === "" ? NaN : Number(inputA.trim());
  const parsedZ = inputZ.trim() === "" ? NaN : Number(inputZ.trim());
  const isCorrectA = Number.isInteger(parsedA) && parsedA === currentTask.expectedA;
  const isCorrectZ = Number.isInteger(parsedZ) && parsedZ === currentTask.expectedZ;
  const isCorrect = isCorrectA && isCorrectZ;

  const isAlreadySolved = persisted.solvedTasks.includes(mode);
  const isRevealed = persisted.revealedTasks.includes(mode);
  const showCheckedFeedback = checkedMode === mode || isAlreadySolved || isRevealed;

  const subDone = persisted.solvedTasks.length >= 2;
  useSyncLabProgress(subDone, onSubDone);

  function selectMode(nextMode: EquationMode) {
    setDraftInputs(null);
    setCheckedMode(null);
    setPersisted((prev) => ({ ...prev, mode: nextMode }));
  }

  function updateField(field: "a" | "z", value: string) {
    setCheckedMode(null);
    setDraftInputs({
      forMode: mode,
      a: field === "a" ? value : inputA,
      z: field === "z" ? value : inputZ,
    });
  }

  function handleCheck() {
    setCheckedMode(mode);
    const trimmedA = inputA.trim();
    const trimmedZ = inputZ.trim();
    const match =
      trimmedA !== "" &&
      trimmedZ !== "" &&
      Number(trimmedA) === currentTask.expectedA &&
      Number(trimmedZ) === currentTask.expectedZ;

    setPersisted((prev) => {
      const nextInputs = {
        ...prev.savedInputs,
        [mode]: { a: trimmedA, z: trimmedZ },
      };
      // Chỉ tính điểm khi tự nhập đúng và CHƯA bấm "Xem gợi ý / đáp án" ở bài này
      const canScore = match && !prev.revealedTasks.includes(mode);
      const nextSolved =
        canScore && !prev.solvedTasks.includes(mode)
          ? [...prev.solvedTasks, mode]
          : prev.solvedTasks;
      return {
        ...prev,
        savedInputs: nextInputs,
        solvedTasks: nextSolved,
      };
    });
    setDraftInputs(null);
  }

  function handleRevealHintOrAnswer() {
    setCheckedMode(mode);
    setDraftInputs(null);
    setPersisted((prev) => {
      // Nếu bài này đã tự giải đúng trước đó thì giữ nguyên điểm; nếu chưa giải mà bấm xem đáp án thì đánh dấu revealed (không tính điểm)
      if (prev.solvedTasks.includes(mode)) return prev;
      const nextRevealed = prev.revealedTasks.includes(mode)
        ? prev.revealedTasks
        : [...prev.revealedTasks, mode];
      return {
        ...prev,
        revealedTasks: nextRevealed,
      };
    });
  }

  const displayA = inputA.trim() !== "" ? inputA.trim() : "?";
  const displayZ = inputZ.trim() !== "" ? inputZ.trim() : "?";
  const displaySymbol =
    (isAlreadySolved || (checkedMode === mode && isCorrect))
      ? currentTask.daughterSymbol
      : "X";

  return (
    <Lab
      intro="Luyện tập viết và cân bằng phương trình phản ứng hạt nhân (phân rã α, β⁻, β⁺ và phân hạch ²³⁵U trong Bài 25 SGK) theo định luật bảo toàn số khối A và điện tích Z."
      note="Tổng số khối A và tổng điện tích Z ở hai vế luôn bảo toàn. Tự nhập và giải đúng ít nhất 2 phương trình (không bấm xem trước đáp án) để hoàn thành mục này."
    >
      <div className="physics-controls" aria-label="Chọn phương trình hạt nhân cần cân bằng">
        {EQUATION_TASKS.map((m) => {
          const solved = persisted.solvedTasks.includes(m.key);
          const revealed = persisted.revealedTasks.includes(m.key);
          return (
            <button
              key={m.key}
              type="button"
              className={`physics-button ${mode === m.key ? "primary" : ""}`}
              onClick={() => selectMode(m.key)}
            >
              {m.label} {solved ? "✓" : revealed ? "(đã xem gợi ý)" : ""}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          padding: "18px 14px",
          backgroundColor: "var(--bg-surface-elevated)",
          borderRadius: "8px",
          marginTop: "16px",
          justifyContent: "center",
          fontSize: "1.15rem",
        }}
      >
        {mode === "alpha" && (
          <>
            <NuclearSymbol a={238} z={92} symbol="U" />
            <span>→</span>
            <UnknownNuclideBox
              displayA={displayA}
              displayZ={displayZ}
              displaySymbol={displaySymbol}
              inputA={inputA}
              inputZ={inputZ}
              checked={checkedMode === mode || isAlreadySolved}
              isCorrectA={isCorrectA}
              isCorrectZ={isCorrectZ}
              onChangeA={(v) => updateField("a", v)}
              onChangeZ={(v) => updateField("z", v)}
            />
            <span>+</span>
            <NuclearSymbol a={4} z={2} symbol="He" />
          </>
        )}

        {mode === "beta_neg" && (
          <>
            <NuclearSymbol a={14} z={6} symbol="C" />
            <span>→</span>
            <UnknownNuclideBox
              displayA={displayA}
              displayZ={displayZ}
              displaySymbol={displaySymbol}
              inputA={inputA}
              inputZ={inputZ}
              checked={checkedMode === mode || isAlreadySolved}
              isCorrectA={isCorrectA}
              isCorrectZ={isCorrectZ}
              onChangeA={(v) => updateField("a", v)}
              onChangeZ={(v) => updateField("z", v)}
            />
            <span>+</span>
            <NuclearSymbol a={0} z={-1} symbol="e" />
            <LatexMath math={String.raw`+ \bar{\nu}_e`} />
          </>
        )}

        {mode === "beta_pos" && (
          <>
            <NuclearSymbol a={18} z={9} symbol="F" />
            <span>→</span>
            <UnknownNuclideBox
              displayA={displayA}
              displayZ={displayZ}
              displaySymbol={displaySymbol}
              inputA={inputA}
              inputZ={inputZ}
              checked={checkedMode === mode || isAlreadySolved}
              isCorrectA={isCorrectA}
              isCorrectZ={isCorrectZ}
              onChangeA={(v) => updateField("a", v)}
              onChangeZ={(v) => updateField("z", v)}
            />
            <span>+</span>
            <NuclearSymbol a={0} z={1} symbol="e" />
            <LatexMath math={String.raw`+ \nu_e`} />
          </>
        )}

        {mode === "fission_u235" && (
          <>
            <NuclearSymbol a={1} z={0} symbol="n" />
            <span>+</span>
            <NuclearSymbol a={235} z={92} symbol="U" />
            <span>→</span>
            <NuclearSymbol a={140} z={58} symbol="Ce" />
            <span>+</span>
            <UnknownNuclideBox
              displayA={displayA}
              displayZ={displayZ}
              displaySymbol={displaySymbol}
              inputA={inputA}
              inputZ={inputZ}
              checked={checkedMode === mode || isAlreadySolved}
              isCorrectA={isCorrectA}
              isCorrectZ={isCorrectZ}
              onChangeA={(v) => updateField("a", v)}
              onChangeZ={(v) => updateField("z", v)}
            />
            <span>+ 2</span>
            <NuclearSymbol a={1} z={0} symbol="n" />
            <span>+ 6</span>
            <NuclearSymbol a={0} z={-1} symbol="e" />
            <LatexMath math={String.raw`+ 6\bar{\nu}_e`} />
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
        <button
          type="button"
          className="physics-button primary"
          disabled={inputA.trim() === "" || inputZ.trim() === ""}
          onClick={handleCheck}
        >
          Kiểm tra A &amp; Z
        </button>
        <button type="button" className="physics-button" onClick={handleRevealHintOrAnswer}>
          Xem gợi ý / đáp án (không tính điểm câu này)
        </button>
        <button
          type="button"
          className="physics-button"
          onClick={() => {
            resetPersisted();
            setDraftInputs(null);
            setCheckedMode(null);
          }}
        >
          Làm lại từ đầu
        </button>
      </div>

      <p className="physics-note" style={{ marginTop: "10px" }}>
        Tiến độ tự giải đúng: <strong>{persisted.solvedTasks.length}/2</strong> phương trình yêu cầu
        {subDone ? " ✓ Đã hoàn thành!" : " (nhập A và Z vào hai ô trống rồi bấm Kiểm tra)."}
      </p>

      {showCheckedFeedback && (
        <div
          role="status"
          style={{
            padding: "12px",
            backgroundColor: isAlreadySolved
              ? "#dcfce7"
              : isRevealed
                ? "#fef3c7"
                : isCorrect
                  ? "#dcfce7"
                  : "#fee2e2",
            borderRadius: "8px",
            marginTop: "10px",
            fontSize: "14px",
            lineHeight: 1.55,
          }}
        >
          {isAlreadySolved
            ? `✓ Chính xác! Hạt nhân cần tìm là A = ${currentTask.expectedA}, Z = ${currentTask.expectedZ} (${currentTask.daughterSymbol}). Đã tính điểm tự giải (${persisted.solvedTasks.length} bài).`
            : isRevealed
              ? `💡 Gợi ý & đáp án mẫu: ${currentTask.conservationGuide} (Câu này đã mở đáp án nên không tính vào số bài tự giải — hãy tự nhập ở các phương trình khác hoặc bấm Làm lại từ đầu).`
              : `❌ Chưa khớp định luật bảo toàn. Hãy lập tổng số khối A và tổng điện tích Z hai vế rồi thử nhập lại!`}
        </div>
      )}
    </Lab>
  );
}

function UnknownNuclideBox({
  displayA,
  displayZ,
  displaySymbol,
  inputA,
  inputZ,
  checked,
  isCorrectA,
  isCorrectZ,
  onChangeA,
  onChangeZ,
}: {
  displayA: string;
  displayZ: string;
  displaySymbol: string;
  inputA: string;
  inputZ: string;
  checked: boolean;
  isCorrectA: boolean;
  isCorrectZ: boolean;
  onChangeA: (value: string) => void;
  onChangeZ: (value: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
      <NuclearSymbol a={displayA} z={displayZ} symbol={displaySymbol} />
      <div style={{ display: "flex", gap: "6px" }}>
        <input
          type="number"
          inputMode="numeric"
          value={inputA}
          onChange={(e) => onChangeA(e.target.value)}
          style={{
            width: "62px",
            padding: "5px 4px",
            textAlign: "center",
            border:
              checked && inputA.trim() !== ""
                ? isCorrectA
                  ? "2px solid #16a34a"
                  : "2px solid #dc2626"
                : "2px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "14px",
          }}
          aria-label="Số khối A của hạt nhân cần tìm"
          placeholder="Nhập A"
        />
        <input
          type="number"
          inputMode="numeric"
          value={inputZ}
          onChange={(e) => onChangeZ(e.target.value)}
          style={{
            width: "62px",
            padding: "5px 4px",
            textAlign: "center",
            border:
              checked && inputZ.trim() !== ""
                ? isCorrectZ
                  ? "2px solid #16a34a"
                  : "2px solid #dc2626"
                : "2px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "14px",
          }}
          aria-label="Số proton Z của hạt nhân cần tìm"
          placeholder="Nhập Z"
        />
      </div>
    </div>
  );
}

/* ============================================================================
   Sub-lab 3 & Phòng thực hành tổng hợp B25
   Lưu trữ bền vững: "b25-binding-calc-v1"
   ============================================================================ */

export const B25_BINDING_CALC_STORAGE_KEY = "b25-binding-calc-v1";

type PracticeSectionKey = "graph" | "balance" | "energy";

interface B25BindingAndPracticeState {
  readonly selectedIdx: number;
  readonly viewedNuclides: readonly number[];
  readonly hasAnswered: boolean;
  readonly activeSection: PracticeSectionKey;
  readonly subDone: {
    readonly graph: boolean;
    readonly balance: boolean;
    readonly energy: boolean;
  };
}

const INITIAL_BINDING_AND_PRACTICE_STATE: B25BindingAndPracticeState = {
  selectedIdx: 0,
  viewedNuclides: [0],
  hasAnswered: false,
  activeSection: "graph",
  subDone: {
    graph: false,
    balance: false,
    energy: false,
  },
};

function parseBindingAndPracticeState(
  raw: unknown,
  fallback: B25BindingAndPracticeState
): B25BindingAndPracticeState {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const maxIdx = BINDING_NUCLIDES.length - 1;
  const selectedIdx =
    typeof obj.selectedIdx === "number" &&
    Number.isInteger(obj.selectedIdx) &&
    obj.selectedIdx >= 0 &&
    obj.selectedIdx <= maxIdx
      ? obj.selectedIdx
      : fallback.selectedIdx;
  const viewedNuclides = Array.isArray(obj.viewedNuclides)
    ? Array.from(
        new Set(
          obj.viewedNuclides.filter(
            (n): n is number =>
              typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= maxIdx
          )
        )
      )
    : fallback.viewedNuclides;
  const validSections: readonly PracticeSectionKey[] = ["graph", "balance", "energy"];
  const activeSection: PracticeSectionKey = validSections.includes(
    obj.activeSection as PracticeSectionKey
  )
    ? (obj.activeSection as PracticeSectionKey)
    : fallback.activeSection;
  const rawSub =
    obj.subDone && typeof obj.subDone === "object"
      ? (obj.subDone as Record<string, unknown>)
      : {};
  const hasAnswered = Boolean(obj.hasAnswered);
  const normalizedViewed = viewedNuclides.length > 0 ? viewedNuclides : [0];
  return {
    selectedIdx,
    viewedNuclides: normalizedViewed,
    hasAnswered,
    activeSection,
    subDone: {
      graph: Boolean(rawSub.graph),
      balance: Boolean(rawSub.balance),
      energy: Boolean(rawSub.energy) || (normalizedViewed.length >= 3 && hasAnswered),
    },
  };
}

export function BindingEnergyCalculator({ onSubDone }: { onSubDone: (done: boolean) => void }) {
  const nuclides = BINDING_NUCLIDES;
  const [persisted, setPersisted] = usePersistedLabState(
    B25_BINDING_CALC_STORAGE_KEY,
    INITIAL_BINDING_AND_PRACTICE_STATE,
    parseBindingAndPracticeState
  );

  const isSubDone = persisted.viewedNuclides.length >= 3 && persisted.hasAnswered;
  useSyncLabProgress(isSubDone, onSubDone);

  function handleSelect(i: number) {
    setPersisted((prev) => {
      const nextViewed = prev.viewedNuclides.includes(i)
        ? prev.viewedNuclides
        : [...prev.viewedNuclides, i];
      const nextEnergyDone = nextViewed.length >= 3 && prev.hasAnswered;
      return {
        ...prev,
        selectedIdx: i,
        viewedNuclides: nextViewed,
        subDone: { ...prev.subDone, energy: nextEnergyDone },
      };
    });
  }

  function handleAnswered(correct: boolean) {
    setPersisted((prev) => {
      const nextEnergyDone = prev.viewedNuclides.length >= 3 && correct;
      return {
        ...prev,
        hasAnswered: correct,
        subDone: { ...prev.subDone, energy: nextEnergyDone },
      };
    });
  }

  const nuc = nuclides[persisted.selectedIdx] ?? nuclides[0];
  const mH = HYDROGEN_ATOM_MASS_U;
  const mn = NEUTRON_MASS_U;
  const sumFree = nuc.z * mH + (nuc.a - nuc.z) * mn;
  const { massDefect: deltaM, energy: elk, perNucleon: elkr } = bindingEnergy(
    nuc.z,
    nuc.a,
    nuc.mx
  );

  return (
    <Lab
      intro="Tính độ hụt khối và năng lượng liên kết từng bước. So sánh ít nhất ba hạt nhân."
      note="Trong SGK tr. 99, công thức (22.2) dùng khối lượng hạt nhân trần: Δm = [Z·m_p + (A − Z)·m_n] − m_X. Khi tra bảng khối lượng nguyên tử trung hòa (OpenStax), Z khối lượng electron ở hai vế tự triệt tiêu nên Δm = Z·m(¹H) + N·m_n − m_nguyên_tử cho cùng độ hụt khối (bỏ qua năng lượng liên kết electron cỡ eV)."
    >
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        {nuclides.map((n, i) => (
          <button
            key={n.name}
            type="button"
            className={`physics-button ${i === persisted.selectedIdx ? "primary" : ""}`}
            onClick={() => handleSelect(i)}
          >
            {n.name} {persisted.viewedNuclides.includes(i) ? "✓" : ""}
          </button>
        ))}
      </div>

      <div className="physics-formula">
        <p>
          <strong>Ví dụ {nuc.name}</strong> ({nuc.label})
        </p>
        <LatexMath block math={String.raw`A=${nuc.a},\quad Z=${nuc.z},\quad N=${nuc.a - nuc.z}`} />
        <LatexMath
          block
          math={String.raw`\Delta m=Z m({}^{1}\mathrm{H})+N m_n-m_{\text{nguyên tử}}`}
        />
        <LatexMath block math={String.raw`\Delta m=\left(${sumFree.toFixed(6)}-${nuc.mx}\right)\,\mathrm{u}`} />
        <LatexMath block math={String.raw`E_{\mathrm{lk}}=\Delta m\,c^2\approx${elk.toFixed(1)}\,\mathrm{MeV}`} />
        <LatexMath
          block
          math={String.raw`\frac{E_{\mathrm{lk}}}{A}\approx${elkr.toFixed(2)}\,\mathrm{MeV}\,\mathrm{nucleon}^{-1}`}
        />
      </div>

      <p className="physics-note">
        Các bước khối lượng hiển thị 6 chữ số thập phân. Phép tính giữ đủ độ chính xác trong bộ nhớ; chỉ làm tròn kết quả hiển thị. Đã khảo sát{" "}
        <strong>{persisted.viewedNuclides.length}/3</strong> hạt nhân yêu cầu.
      </p>
      <Metrics
        items={[
          { label: "Δm (độ hụt khối)", value: `${deltaM.toFixed(6)} u` },
          { label: "Elk (năng lượng liên kết)", value: `${elk.toFixed(1)} MeV` },
          { label: "Elkr (liên kết riêng)", value: `${elkr.toFixed(2)} MeV/nucleon` },
        ]}
      />
      <p className="physics-note">
        Nguồn khối lượng và quy ước tính:{" "}
        <a
          href="https://openstax.org/books/college-physics-2e/pages/a-atomic-masses"
          target="_blank"
          rel="noreferrer"
        >
          OpenStax, bảng khối lượng nguyên tử ↗
        </a>{" "}
        ·{" "}
        <a
          href="https://openstax.org/books/college-physics-2e/pages/31-6-binding-energy"
          target="_blank"
          rel="noreferrer"
        >
          Công thức năng lượng liên kết ↗
        </a>
        .
      </p>

      <div>
        <ChoiceCheck
          key={persisted.hasAnswered ? "bind-solved" : "bind-unsolved"}
          initialSelected={persisted.hasAnswered ? 1 : null}
          initialChecked={persisted.hasAnswered}
          onResult={handleAnswered}
          question="Hạt nhân ⁵⁶Fe có Elkr ≈ 8,79 MeV/nu và ²³⁵U có Elkr ≈ 7,59 MeV/nu. Khi ²³⁵U phân hạch tạo hai mảnh có số khối trung bình A ~ 90–140, năng lượng được tỏa ra hay hấp thụ?"
          options={[
            "Hấp thụ, vì hạt nhân ²³⁵U ban đầu nặng hơn từng mảnh.",
            "Tỏa ra, vì các mảnh trung bình có năng lượng liên kết riêng Elkr cao hơn ²³⁵U — hệ chuyển sang trạng thái bền vững hơn.",
            "Không thay đổi vì số nucleon bảo toàn.",
          ]}
          correctIndex={1}
          explanation="Năng lượng liên kết riêng của các mảnh phân hạch (~8,5 MeV/nucleon) lớn hơn của ²³⁵U (~7,59 MeV/nucleon). Hệ chuyển từ trạng thái kém bền sang bền hơn nên tỏa năng lượng khoảng 200 MeV mỗi phân hạch (Bài 4, SGK trang 121)."
        />
      </div>

      <div style={{ marginTop: "10px" }}>
        <button
          type="button"
          className="physics-button"
          onClick={() =>
            setPersisted((prev) => ({
              ...prev,
              selectedIdx: 0,
              viewedNuclides: [0],
              hasAnswered: false,
              subDone: { ...prev.subDone, energy: false },
            }))
          }
        >
          Đặt lại phần năng lượng liên kết
        </button>
      </div>
    </Lab>
  );
}

/* ============================================================================
   Main export: Phòng thí nghiệm luyện tập tổng hợp B25
   ============================================================================ */

export function NuclearPhysicsPracticeLab({ onProgress }: ActivityProps) {
  const [persisted, setPersisted] = usePersistedLabState(
    B25_BINDING_CALC_STORAGE_KEY,
    INITIAL_BINDING_AND_PRACTICE_STATE,
    parseBindingAndPracticeState
  );

  const handleSubDone = useCallback(
    (key: PracticeSectionKey, done: boolean) => {
      setPersisted((prev) =>
        prev.subDone[key] === done
          ? prev
          : { ...prev, subDone: { ...prev.subDone, [key]: done } }
      );
    },
    [setPersisted]
  );

  const complete = Boolean(
    persisted.subDone.graph && persisted.subDone.balance && persisted.subDone.energy
  );
  useSyncLabProgress(complete, onProgress);

  const sections = [
    {
      key: "graph" as const,
      label: "📊 Đồ thị H(t) – Bảng 25.1",
      isDone: persisted.subDone.graph,
    },
    {
      key: "balance" as const,
      label: "⚗️ Cân bằng phương trình",
      isDone: persisted.subDone.balance,
    },
    {
      key: "energy" as const,
      label: "⚡ Tính Δm và Elk",
      isDone: persisted.subDone.energy,
    },
  ];

  return (
    <Lab
      intro="Phòng thí nghiệm luyện tập vật lí hạt nhân – Bài 25 (SGK trang 119–122). Ba hoạt động: phân tích Bảng 25.1 & tự ước lượng T, cân bằng phương trình hạt nhân, tính năng lượng liên kết."
      note="Bảng H(t) giữ nguyên 8 cặp số đo từ Bảng 25.1 SGK. Khối lượng nguyên tử dùng bảng OpenStax; em tự ước lượng và nhập kết quả trước khi mở đối chiếu."
    >
      <div className="physics-guide">
        <p>
          <strong>📝 Chu trình thực hành Bài 25:</strong>
        </p>
        <ol>
          <li>
            <strong>Đồ thị Bảng 25.1:</strong> Tự tính mức H₀/2 từ t = 0 s, chọn hai mốc kẹp, ước lượng T và viết giải thích trước khi đối chiếu.
          </li>
          <li>
            <strong>Phương trình hạt nhân:</strong> Tự nhập A, Z và giải đúng ít nhất 2 phương trình (phân rã α, β⁻, β⁺ hoặc phân hạch ²³⁵U).
          </li>
          <li>
            <strong>Năng lượng liên kết:</strong> Khảo sát ít nhất 3 hạt nhân và trả lời câu hỏi vận dụng.
          </li>
        </ol>
      </div>

      <div className="physics-controls">
        {sections.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`physics-button ${persisted.activeSection === s.key ? "primary" : ""}`}
            onClick={() => setPersisted((prev) => ({ ...prev, activeSection: s.key }))}
          >
            {s.label} {s.isDone ? "✓" : ""}
          </button>
        ))}
      </div>

      <div className="physics-checklist">
        <p>
          <strong>Tiêu chí hoàn thành tổng:</strong>
        </p>
        <ul>
          {sections.map((s) => (
            <li key={s.key} className={s.isDone ? "is-done" : ""}>
              {s.label} {s.isDone ? "✓" : ""}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: "16px" }}>
        {persisted.activeSection === "graph" && (
          <DecayGraphLab onSubDone={(done) => handleSubDone("graph", done)} />
        )}
        {persisted.activeSection === "balance" && (
          <NuclearEquationBalancer onSubDone={(done) => handleSubDone("balance", done)} />
        )}
        {persisted.activeSection === "energy" && (
          <BindingEnergyCalculator onSubDone={(done) => handleSubDone("energy", done)} />
        )}
      </div>
    </Lab>
  );
}
