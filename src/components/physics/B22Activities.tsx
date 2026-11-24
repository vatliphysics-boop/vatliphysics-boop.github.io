"use client";

import { useMemo, useState } from "react";
import { ChoiceCheck, Lab, NuclearSymbol } from "./shared";
import {
  ATOMIC_MASS_ENERGY_MEV,
  BINDING_NUCLIDES,
  HYDROGEN_ATOM_MASS_U,
  NEUTRON_MASS_U,
  bindingEnergy,
} from "@/lib/physics";
import { usePersistedLabState, useSyncLabProgress } from "@/lib/use-persisted-lab-state";
import { LatexMath } from "@/components/learning/LatexMath";
import { Scientist3DModelCanvas } from "@/components/learning/Canvas3DParticleEngine";

export type ActivityProps = {
  onProgress?: (done: boolean) => void;
};

function formatVi(value: number, digits: number): string {
  return value.toFixed(digits).replace(".", ",");
}

/* ──────────────────────────────────────────────────────────────────────────────
   1. CÂN BẰNG & PHÂN LOẠI PHƯƠNG TRÌNH PHẢN ỨNG HẠT NHÂN
   SGK tr. 96–98 | Blackett–Rutherford (1919), Phân hạch U-235, Phân rã α U-238
   Lưu trữ bền vững: "b22-reaction-balancer-v1"
   ────────────────────────────────────────────────────────────────────────────── */

export const B22_BALANCER_STORAGE_KEY = "b22-reaction-balancer-v1";

type ReactionId = "blackett" | "fission" | "decay";
type ReactionKind = "" | "spontaneous" | "induced";

interface BalancerPersistedState {
  readonly activeId: ReactionId;
  readonly blackettOA: string;
  readonly blackettOZ: string;
  readonly blackettHA: string;
  readonly blackettHZ: string;
  readonly blackettKind: ReactionKind;
  readonly fissionIA: string;
  readonly fissionIZ: string;
  readonly fissionKind: ReactionKind;
  readonly decayThA: string;
  readonly decayThZ: string;
  readonly decayKind: ReactionKind;
  readonly hasAnswered: boolean;
}

const INITIAL_BALANCER_STATE: BalancerPersistedState = {
  activeId: "blackett",
  blackettOA: "",
  blackettOZ: "",
  blackettHA: "",
  blackettHZ: "",
  blackettKind: "",
  fissionIA: "",
  fissionIZ: "",
  fissionKind: "",
  decayThA: "",
  decayThZ: "",
  decayKind: "",
  hasAnswered: false,
};

function sanitizeIntInput(val: unknown): string {
  if (typeof val !== "string") return "";
  return val.replace(/[^0-9-]/g, "").slice(0, 5);
}

function sanitizeKind(val: unknown): ReactionKind {
  return val === "spontaneous" || val === "induced" ? val : "";
}

function parseBalancerState(raw: unknown, fallback: BalancerPersistedState): BalancerPersistedState {
  if (!raw || typeof raw !== "object") return fallback;
  const p = raw as Partial<BalancerPersistedState>;
  const activeId: ReactionId =
    p.activeId === "blackett" || p.activeId === "fission" || p.activeId === "decay"
      ? p.activeId
      : fallback.activeId;
  return {
    activeId,
    blackettOA: sanitizeIntInput(p.blackettOA),
    blackettOZ: sanitizeIntInput(p.blackettOZ),
    blackettHA: sanitizeIntInput(p.blackettHA),
    blackettHZ: sanitizeIntInput(p.blackettHZ),
    blackettKind: sanitizeKind(p.blackettKind),
    fissionIA: sanitizeIntInput(p.fissionIA),
    fissionIZ: sanitizeIntInput(p.fissionIZ),
    fissionKind: sanitizeKind(p.fissionKind),
    decayThA: sanitizeIntInput(p.decayThA),
    decayThZ: sanitizeIntInput(p.decayThZ),
    decayKind: sanitizeKind(p.decayKind),
    hasAnswered: typeof p.hasAnswered === "boolean" ? p.hasAnswered : fallback.hasAnswered,
  };
}

function parseOptionalInt(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isInteger(n) ? n : null;
}

function SpontaneousAlphaDecayDiagram() {
  return (
    <svg
      viewBox="0 0 320 200"
      role="img"
      aria-label="Phân rã phóng xạ tự phát của Uranium-238 tạo Thorium-234 và hạt alpha, không có hạt bắn phá ban đầu"
      style={{
        width: "320px",
        maxWidth: "100%",
        height: "auto",
        display: "block",
        borderRadius: "10px",
        background: "#0f172a",
        border: "1px solid #1e293b",
      }}
    >
      <title>Phân rã phóng xạ tự phát U-238</title>
      <text x="160" y="22" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="600">
        Không cần hạt bắn phá · Hạt nhân mẹ tự biến đổi
      </text>

      {/* Parent U-238 */}
      <circle cx="72" cy="104" r="28" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.8" strokeDasharray="4 3" />
      <circle cx="72" cy="104" r="22" fill="#dc2626" />
      <text x="72" y="102" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">
        ²³⁸U
      </text>
      <text x="72" y="115" textAnchor="middle" fill="#fecaca" fontSize="9.5">
        Z = 92
      </text>
      <text x="72" y="148" textAnchor="middle" fill="#94a3b8" fontSize="10">
        Hạt nhân mẹ kém bền
      </text>

      {/* Spontaneous transition arrow */}
      <line x1="108" y1="104" x2="156" y2="104" stroke="#facc15" strokeWidth="2.2" />
      <polygon points="156,99 166,104 156,109" fill="#facc15" />
      <text x="136" y="94" textAnchor="middle" fill="#fde047" fontSize="9.5" fontWeight="600">
        tự phát
      </text>

      {/* Daughter Th-234 */}
      <line x1="168" y1="104" x2="218" y2="132" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="232" cy="138" r="20" fill="#0284c7" stroke="#bae6fd" strokeWidth="1.5" />
      <text x="232" y="137" textAnchor="middle" fill="#fff" fontSize="11.5" fontWeight="700">
        Th
      </text>
      <text x="232" y="149" textAnchor="middle" fill="#e0f2fe" fontSize="9">
        A?, Z?
      </text>

      {/* Emitted Alpha He-4 */}
      <line x1="168" y1="104" x2="256" y2="58" stroke="#fbbf24" strokeWidth="2.4" />
      <circle cx="268" cy="52" r="13" fill="#eab308" stroke="#fef08a" strokeWidth="1.5" />
      <text x="268" y="56" textAnchor="middle" fill="#1e293b" fontSize="10.5" fontWeight="700">
        ⁴₂He
      </text>
      <text x="268" y="76" textAnchor="middle" fill="#fde047" fontSize="9.5">
        Hạt α phóng ra
      </text>

      <text x="160" y="186" textAnchor="middle" fill="#94a3b8" fontSize="10">
        SGK tr. 97 · Quá trình tự phân rã phóng xạ
      </text>
    </svg>
  );
}

export function NuclearReactionBalancer({ onProgress }: ActivityProps) {
  const [state, setState, resetState] = usePersistedLabState(
    B22_BALANCER_STORAGE_KEY,
    INITIAL_BALANCER_STATE,
    parseBalancerState
  );
  const [revision, setRevision] = useState(0);

  // Evaluate all 3 SGK reactions
  const oA = parseOptionalInt(state.blackettOA);
  const oZ = parseOptionalInt(state.blackettOZ);
  const hA = parseOptionalInt(state.blackettHA);
  const hZ = parseOptionalInt(state.blackettHZ);
  const blackettReady = oA !== null && oZ !== null && hA !== null && hZ !== null;
  const blackettSumA = (oA ?? 0) + (hA ?? 0);
  const blackettSumZ = (oZ ?? 0) + (hZ ?? 0);
  const blackettEqOk = oA === 17 && oZ === 8 && hA === 1 && hZ === 1;
  const blackettKindOk = state.blackettKind === "induced";

  const iA = parseOptionalInt(state.fissionIA);
  const iZ = parseOptionalInt(state.fissionIZ);
  const fissionReady = iA !== null && iZ !== null;
  const fissionSumA = 95 + (iA ?? 0) + 3;
  const fissionSumZ = 39 + (iZ ?? 0);
  const fissionEqOk = iA === 138 && iZ === 53;
  const fissionKindOk = state.fissionKind === "induced";

  const thA = parseOptionalInt(state.decayThA);
  const thZ = parseOptionalInt(state.decayThZ);
  const decayReady = thA !== null && thZ !== null;
  const decaySumA = (thA ?? 0) + 4;
  const decaySumZ = (thZ ?? 0) + 2;
  const decayEqOk = thA === 234 && thZ === 90;
  const decayKindOk = state.decayKind === "spontaneous";

  const balancedCount = [blackettEqOk, fissionEqOk, decayEqOk].filter(Boolean).length;
  const classifiedCount = [blackettKindOk, fissionKindOk, decayKindOk].filter(Boolean).length;
  const isDone = balancedCount >= 2 && classifiedCount >= 2 && state.hasAnswered;

  useSyncLabProgress(isDone, onProgress);

  const reactionsMeta = [
    {
      id: "blackett" as const,
      shortLabel: "1. Blackett – Rutherford",
      title: "Thí nghiệm Blackett – Rutherford (1919 · SGK tr. 96)",
      subtitle: "Chùm hạt α bắn phá khí Nitrogen tạo hạt nhân Oxygen và proton.",
      done: blackettEqOk && blackettKindOk,
    },
    {
      id: "fission" as const,
      shortLabel: "2. Phân hạch U-235",
      title: "Phân hạch kích thích bởi neutron chậm (SGK tr. 101)",
      subtitle: "Hạt nhân Uranium-235 hấp thụ 1 neutron chậm rồi vỡ thành hai mảnh Y-95, I-138 và 3 neutron.",
      done: fissionEqOk && fissionKindOk,
    },
    {
      id: "decay" as const,
      shortLabel: "3. Phân rã α của U-238",
      title: "Phân rã phóng xạ α của Uranium-238 (SGK tr. 97)",
      subtitle: "Hạt nhân Uranium-238 không bền tự phát phóng ra hạt α (⁴₂He) và biến đổi thành Thorium.",
      done: decayEqOk && decayKindOk,
    },
  ];

  const activeMeta = reactionsMeta.find((r) => r.id === state.activeId) ?? reactionsMeta[0];

  const currentComparison = (() => {
    if (state.activeId === "blackett") {
      return {
        beforeA: 18,
        beforeZ: 9,
        beforeAText: "4 + 14 = 18",
        beforeZText: "2 + 7 = 9",
        afterA: blackettSumA,
        afterZ: blackettSumZ,
        afterAText: `${oA ?? "?"} + ${hA ?? "?"} = ${blackettReady ? blackettSumA : "?"}`,
        afterZText: `${oZ ?? "?"} + ${hZ ?? "?"} = ${blackettReady ? blackettSumZ : "?"}`,
        ready: blackettReady,
        eqOk: blackettEqOk,
        kind: state.blackettKind,
        expectedKind: "induced" as const,
        eqHint:
          blackettSumA === 18 && blackettSumZ === 9 && !blackettEqOk
            ? "⚠️ Tổng ∑A và ∑Z đã khớp hai vế, nhưng cần điền đúng từng hạt: proton chính là hạt nhân ¹₁H (A = 1, Z = 1) và đồng vị Oxygen là ¹⁷₈O (A = 17, Z = 8)."
            : "✓ Chính xác! ⁴₂He + ¹⁴₇N → ¹⁷₈O + ¹₁H tuân thủ bảo toàn số nucleon (18 = 18) và điện tích (9 = 9).",
        kindReason:
          "Hạt α có động năng bắn vào hạt nhân ¹⁴₇N gây biến đổi hạt nhân → đây là phản ứng hạt nhân kích thích.",
      };
    }
    if (state.activeId === "fission") {
      return {
        beforeA: 236,
        beforeZ: 92,
        beforeAText: "1 + 235 = 236",
        beforeZText: "0 + 92 = 92",
        afterA: fissionSumA,
        afterZ: fissionSumZ,
        afterAText: `95 + ${iA ?? "?"} + 3×1 = ${fissionReady ? fissionSumA : "?"}`,
        afterZText: `39 + ${iZ ?? "?"} + 3×0 = ${fissionReady ? fissionSumZ : "?"}`,
        ready: fissionReady,
        eqOk: fissionEqOk,
        kind: state.fissionKind,
        expectedKind: "induced" as const,
        eqHint:
          "✓ Chính xác! Mảnh phân hạch còn lại là ¹³⁸₅₃I (A = 236 − 95 − 3 = 138; Z = 92 − 39 = 53).",
        kindReason:
          "Phản ứng xảy ra do neutron chậm bắn vào kích thích hạt nhân ²³⁵₉₂U → đây là phản ứng hạt nhân kích thích.",
      };
    }
    return {
      beforeA: 238,
      beforeZ: 92,
      beforeAText: "238",
      beforeZText: "92",
      afterA: decaySumA,
      afterZ: decaySumZ,
      afterAText: `${thA ?? "?"} + 4 = ${decayReady ? decaySumA : "?"}`,
      afterZText: `${thZ ?? "?"} + 2 = ${decayReady ? decaySumZ : "?"}`,
      ready: decayReady,
      eqOk: decayEqOk,
      kind: state.decayKind,
      expectedKind: "spontaneous" as const,
      eqHint:
        "✓ Chính xác! Hạt nhân con tạo thành là ²³⁴₉₀Th (A = 238 − 4 = 234; Z = 92 − 2 = 90).",
      kindReason:
        "Hạt nhân ²³⁸₉₂U không bền tự phân rã mà không cần hạt nào bắn phá từ ngoài → đây là phản ứng hạt nhân tự phát.",
    };
  })();

  function setActiveKind(kind: "spontaneous" | "induced") {
    setState((prev) => {
      if (prev.activeId === "blackett") return { ...prev, blackettKind: kind };
      if (prev.activeId === "fission") return { ...prev, fissionKind: kind };
      return { ...prev, decayKind: kind };
    });
  }

  function handleReset() {
    resetState();
    setRevision((v) => v + 1);
    onProgress?.(false);
  }

  const inputStyle = {
    width: "54px",
    padding: "5px 4px",
    textAlign: "center" as const,
    fontSize: "14px",
    fontWeight: 600,
    border: "1px solid var(--border-dark)",
    borderRadius: "6px",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
  };

  return (
    <Lab
      intro="Khảo sát định luật bảo toàn số nucleon (số khối A) và bảo toàn điện tích (Z) qua 3 phản ứng hạt nhân điển hình trong SGK Vật lí 12 KNTT (trang 96–98)."
      note="Trong mọi phản ứng hạt nhân, tổng số khối A và tổng số hiệu nguyên tử Z (điện tích) luôn bảo toàn, nhưng không có định luật bảo toàn khối lượng nghỉ."
    >
      <div className="physics-guide">
        <p>
          <strong>🔬 Chu trình khám phá:</strong>
        </p>
        <ol>
          <li>
            <strong>Chọn phản ứng:</strong> Chuyển đổi giữa 3 phản ứng chuẩn SGK ở thanh chọn bên dưới.
          </li>
          <li>
            <strong>Cân bằng A, Z:</strong> Nhập số khối A và số hiệu nguyên tử Z còn thiếu, theo dõi bảng đối chiếu tức thời hai vế.
          </li>
          <li>
            <strong>Phân loại &amp; Giải thích:</strong> Xác định phản ứng thuộc loại <em>Tự phát</em> hay <em>Kích thích</em> và trả lời câu hỏi kiểm chứng.
          </li>
        </ol>
      </div>

      {/* Bộ chọn 3 phản ứng chuẩn SGK */}
      <div
        role="group"
        aria-label="Chọn phương trình phản ứng hạt nhân cần khảo sát"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        {reactionsMeta.map((item) => {
          const active = state.activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`physics-button ${active ? "primary" : ""}`}
              aria-pressed={active}
              onClick={() => setState((prev) => ({ ...prev, activeId: item.id }))}
              style={{ fontWeight: active ? 600 : 500 }}
            >
              {item.shortLabel} {item.done ? "✓" : ""}
            </button>
          );
        })}
        <button
          type="button"
          className="physics-button"
          onClick={handleReset}
          style={{ marginLeft: "auto" }}
        >
          Đặt lại bài tập
        </button>
      </div>

      <div
        style={{
          padding: "16px",
          borderRadius: "12px",
          border: "1px solid var(--border-light)",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        <h4 style={{ margin: "0 0 4px", color: "var(--text-primary)" }}>{activeMeta.title}</h4>
        <p style={{ margin: "0 0 16px", fontSize: "14px", color: "var(--text-secondary)" }}>
          {activeMeta.subtitle}
        </p>

        <div className="physics-split" style={{ gap: "20px", alignItems: "center", margin: 0 }}>
          <div style={{ flex: "1 1 260px", minWidth: 0, display: "flex", justifyContent: "center" }}>
            {state.activeId === "blackett" ? (
              <Scientist3DModelCanvas scientistId="blackett" width={320} height={200} />
            ) : state.activeId === "fission" ? (
              <Scientist3DModelCanvas scientistId="hahn" width={320} height={200} />
            ) : (
              <SpontaneousAlphaDecayDiagram />
            )}
          </div>

          <div style={{ flex: "1 1 280px", minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "1.15rem",
                flexWrap: "wrap",
                justifyContent: "center",
                backgroundColor: "var(--bg-surface-elevated)",
                padding: "16px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-light)",
              }}
            >
              {state.activeId === "blackett" && (
                <>
                  <NuclearSymbol a={4} z={2} symbol="He" />
                  <span>+</span>
                  <NuclearSymbol a={14} z={7} symbol="N" />
                  <span>→</span>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <input
                        type="number"
                        aria-label="Số khối A của Oxygen"
                        value={state.blackettOA}
                        onChange={(e) =>
                          setState((prev) => ({ ...prev, blackettOA: sanitizeIntInput(e.target.value) }))
                        }
                        style={inputStyle}
                        placeholder="A"
                      />
                      <input
                        type="number"
                        aria-label="Số hiệu nguyên tử Z của Oxygen"
                        value={state.blackettOZ}
                        onChange={(e) =>
                          setState((prev) => ({ ...prev, blackettOZ: sanitizeIntInput(e.target.value) }))
                        }
                        style={inputStyle}
                        placeholder="Z"
                      />
                    </div>
                    <strong style={{ fontSize: "1.35rem" }}>O</strong>
                  </div>
                  <span>+</span>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <input
                        type="number"
                        aria-label="Số khối A của Hydrogen (proton)"
                        value={state.blackettHA}
                        onChange={(e) =>
                          setState((prev) => ({ ...prev, blackettHA: sanitizeIntInput(e.target.value) }))
                        }
                        style={inputStyle}
                        placeholder="A"
                      />
                      <input
                        type="number"
                        aria-label="Số hiệu nguyên tử Z của Hydrogen (proton)"
                        value={state.blackettHZ}
                        onChange={(e) =>
                          setState((prev) => ({ ...prev, blackettHZ: sanitizeIntInput(e.target.value) }))
                        }
                        style={inputStyle}
                        placeholder="Z"
                      />
                    </div>
                    <strong style={{ fontSize: "1.35rem" }} title="Proton (hạt nhân ¹₁H)">
                      H
                    </strong>
                  </div>
                </>
              )}

              {state.activeId === "fission" && (
                <>
                  <NuclearSymbol a={1} z={0} symbol="n" />
                  <span>+</span>
                  <NuclearSymbol a={235} z={92} symbol="U" />
                  <span>→</span>
                  <NuclearSymbol a={95} z={39} symbol="Y" />
                  <span>+</span>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <input
                        type="number"
                        aria-label="Số khối A của mảnh Iodine"
                        value={state.fissionIA}
                        onChange={(e) =>
                          setState((prev) => ({ ...prev, fissionIA: sanitizeIntInput(e.target.value) }))
                        }
                        style={inputStyle}
                        placeholder="A"
                      />
                      <input
                        type="number"
                        aria-label="Số hiệu nguyên tử Z của mảnh Iodine"
                        value={state.fissionIZ}
                        onChange={(e) =>
                          setState((prev) => ({ ...prev, fissionIZ: sanitizeIntInput(e.target.value) }))
                        }
                        style={inputStyle}
                        placeholder="Z"
                      />
                    </div>
                    <strong style={{ fontSize: "1.35rem" }}>I</strong>
                  </div>
                  <span>+</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: 700 }}>
                    3<NuclearSymbol a={1} z={0} symbol="n" />
                  </span>
                </>
              )}

              {state.activeId === "decay" && (
                <>
                  <NuclearSymbol a={238} z={92} symbol="U" />
                  <span>→</span>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <input
                        type="number"
                        aria-label="Số khối A của Thorium"
                        value={state.decayThA}
                        onChange={(e) =>
                          setState((prev) => ({ ...prev, decayThA: sanitizeIntInput(e.target.value) }))
                        }
                        style={inputStyle}
                        placeholder="A"
                      />
                      <input
                        type="number"
                        aria-label="Số hiệu nguyên tử Z của Thorium"
                        value={state.decayThZ}
                        onChange={(e) =>
                          setState((prev) => ({ ...prev, decayThZ: sanitizeIntInput(e.target.value) }))
                        }
                        style={inputStyle}
                        placeholder="Z"
                      />
                    </div>
                    <strong style={{ fontSize: "1.35rem" }}>Th</strong>
                  </div>
                  <span>+</span>
                  <NuclearSymbol a={4} z={2} symbol="He" />
                </>
              )}
            </div>

            {/* Bảng đối chiếu trực tiếp hai vế (∑A_trước vs ∑A_sau, ∑Z_trước vs ∑Z_sau) */}
            <div
              role="region"
              aria-label="Bảng đối chiếu bảo toàn hai vế phương trình"
              style={{
                marginTop: "12px",
                border: "1px solid var(--border-light)",
                borderRadius: "8px",
                overflow: "hidden",
                backgroundColor: "var(--bg-surface)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-surface-elevated)", textAlign: "left" }}>
                    <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-light)" }}>
                      Định luật
                    </th>
                    <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-light)" }}>
                      Vế trước
                    </th>
                    <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-light)" }}>
                      Vế sau
                    </th>
                    <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-light)" }}>
                      Đối chiếu
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-light)", fontWeight: 600 }}>
                      Số khối (A)
                    </td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-light)" }}>
                      ∑A<sub>trước</sub>: {currentComparison.beforeAText}
                    </td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-light)" }}>
                      ∑A<sub>sau</sub>: {currentComparison.afterAText}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        borderBottom: "1px solid var(--border-light)",
                        fontWeight: 600,
                        color: !currentComparison.ready
                          ? "var(--text-muted)"
                          : currentComparison.beforeA === currentComparison.afterA
                            ? "var(--semantic-success)"
                            : "var(--semantic-danger)",
                      }}
                    >
                      {!currentComparison.ready
                        ? "Đang nhập…"
                        : currentComparison.beforeA === currentComparison.afterA
                          ? "✓ Bằng nhau"
                          : `✗ Lệch ${currentComparison.afterA - currentComparison.beforeA > 0 ? "+" : ""}${currentComparison.afterA - currentComparison.beforeA}`}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 10px", fontWeight: 600 }}>Điện tích (Z)</td>
                    <td style={{ padding: "8px 10px" }}>
                      ∑Z<sub>trước</sub>: {currentComparison.beforeZText}
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      ∑Z<sub>sau</sub>: {currentComparison.afterZText}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        fontWeight: 600,
                        color: !currentComparison.ready
                          ? "var(--text-muted)"
                          : currentComparison.beforeZ === currentComparison.afterZ
                            ? "var(--semantic-success)"
                            : "var(--semantic-danger)",
                      }}
                    >
                      {!currentComparison.ready
                        ? "Đang nhập…"
                        : currentComparison.beforeZ === currentComparison.afterZ
                          ? "✓ Bằng nhau"
                          : `✗ Lệch ${currentComparison.afterZ - currentComparison.beforeZ > 0 ? "+" : ""}${currentComparison.afterZ - currentComparison.beforeZ}`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {currentComparison.ready && (
              <div
                role="status"
                className={`physics-feedback ${currentComparison.eqOk ? "is-correct" : "is-retry"}`}
              >
                {currentComparison.eqOk
                  ? currentComparison.eqHint
                  : currentComparison.beforeA === currentComparison.afterA &&
                      currentComparison.beforeZ === currentComparison.afterZ
                    ? currentComparison.eqHint
                    : "❌ Phương trình chưa cân bằng: hãy điều chỉnh A, Z sao cho ∑A_trước = ∑A_sau và ∑Z_trước = ∑Z_sau."}
              </div>
            )}

            {/* Phân loại: Phản ứng tự phát hay Phản ứng kích thích */}
            <div
              style={{
                marginTop: "14px",
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-light)",
              }}
            >
              <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600 }}>
                Phân loại phản ứng đang xét (SGK tr. 97):
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <button
                  type="button"
                  className={`physics-button ${currentComparison.kind === "spontaneous" ? "primary" : ""}`}
                  aria-pressed={currentComparison.kind === "spontaneous"}
                  onClick={() => setActiveKind("spontaneous")}
                >
                  Phản ứng tự phát
                </button>
                <button
                  type="button"
                  className={`physics-button ${currentComparison.kind === "induced" ? "primary" : ""}`}
                  aria-pressed={currentComparison.kind === "induced"}
                  onClick={() => setActiveKind("induced")}
                >
                  Phản ứng kích thích
                </button>
              </div>
              {currentComparison.kind !== "" && (
                <p
                  role="status"
                  className={`physics-feedback ${
                    currentComparison.kind === currentComparison.expectedKind ? "is-correct" : "is-retry"
                  }`}
                  style={{ marginBottom: 0 }}
                >
                  {currentComparison.kind === currentComparison.expectedKind
                    ? `✓ Phân loại đúng! ${currentComparison.kindReason}`
                    : "⚠️ Chưa đúng loại phản ứng. Gợi ý: Phản ứng tự phát là sự tự phân rã của 1 hạt nhân không bền; phản ứng kích thích là quá trình các hạt nhân tương tác với nhau (như bắn hạt α hoặc neutron vào hạt nhân bia)."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="physics-checklist" style={{ marginTop: "16px" }}>
        <p>
          <strong>Tiêu chí hoàn thành:</strong>
        </p>
        <ul>
          <li className={balancedCount >= 2 ? "is-done" : ""}>
            Cân bằng đúng ít nhất 2 phương trình chuẩn SGK ({balancedCount}/3 phương trình) {balancedCount >= 2 ? "✓" : ""}
          </li>
          <li className={classifiedCount >= 2 ? "is-done" : ""}>
            Phân loại đúng “Phản ứng tự phát” / “Phản ứng kích thích” ({classifiedCount}/3 phương trình) {classifiedCount >= 2 ? "✓" : ""}
          </li>
          <li className={state.hasAnswered ? "is-done" : ""}>
            Trả lời đúng câu hỏi kiểm tra {state.hasAnswered ? "✓" : ""}
          </li>
        </ul>
      </div>

      <div>
        <ChoiceCheck
          key={`${revision}-${state.hasAnswered ? "1" : "0"}`}
          initialSelected={state.hasAnswered ? 1 : null}
          initialChecked={state.hasAnswered}
          onResult={(correct) => setState((prev) => ({ ...prev, hasAnswered: correct }))}
          question="Thí nghiệm bắn hạt α vào Nitrogen của Rutherford và ảnh chụp buồng sương Blackett chứng minh điều gì?"
          options={[
            "Hạt alpha luôn bị tán xạ đàn hồi bật ngược lại mà không làm đổi hạt nhân bia.",
            "Các nguyên tố có thể biến đổi thành nguyên tố khác thông qua phản ứng hạt nhân kích thích nhân tạo, tuân theo bảo toàn số nucleon và điện tích.",
            "Mọi phản ứng hạt nhân đều tự phát không cần hạt đạn bắn phá.",
            "Tổng khối lượng nghỉ của các hạt trước và sau phản ứng hạt nhân luôn bằng nhau tuyệt đối.",
          ]}
          correctIndex={1}
          explanation="Thí nghiệm Rutherford – Blackett là phản ứng hạt nhân kích thích nhân tạo đầu tiên con người thực hiện (biến đổi ¹⁴₇N thành ¹⁷₈O và proton ¹₁H), tuân thủ bảo toàn số khối A và điện tích Z (SGK tr. 96–98)."
        />
      </div>
    </Lab>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   2. CÂN KHỐI LƯỢNG HAI ĐĨA (ĐỘ HỤT KHỐI Δm) & ĐỒ THỊ NĂNG LƯỢNG LIÊN KẾT RIÊNG E_lkr
   SGK tr. 98–101 | Hình 22.3
   Lưu trữ bền vững: "b22-binding-energy-v1"
   ────────────────────────────────────────────────────────────────────────────── */

export const B22_BINDING_STORAGE_KEY = "b22-binding-energy-v1";

interface LabNuclideSpec {
  readonly name: string;
  readonly sym: string;
  readonly a: number;
  readonly z: number;
  readonly mx: number;
  readonly label: string;
}

const LAB_NUCLIDES: readonly LabNuclideSpec[] = (() => {
  const symMap: Record<number, string> = { 4: "He", 12: "C", 16: "O", 56: "Fe", 235: "U" };
  const fromPhysics: LabNuclideSpec[] = BINDING_NUCLIDES.map((item) => ({
    name: item.name,
    sym: symMap[item.a] ?? "X",
    a: item.a,
    z: item.z,
    mx: item.mx,
    label: item.label,
  }));
  const extras: LabNuclideSpec[] = [
    { name: "²H", sym: "H", a: 2, z: 1, mx: 2.014102, label: "Deuterium-2 (hạt rất nhẹ)" },
    { name: "¹²⁰Sn", sym: "Sn", a: 120, z: 50, mx: 119.902202, label: "Tin-120 (số khối trung bình)" },
    { name: "²³⁸U", sym: "U", a: 238, z: 92, mx: 238.050788, label: "Uranium-238 (hạt rất nặng)" },
  ];
  return [...fromPhysics, ...extras].sort((x, y) => x.a - y.a);
})();

const VALID_A_SET = new Set(LAB_NUCLIDES.map((n) => n.a));

interface BindingPersistedState {
  readonly scaleA: number;
  readonly nuclide1A: number;
  readonly nuclide2A: number;
  readonly activeSlot: 1 | 2;
  readonly visitedAs: readonly number[];
  readonly hasCompared: boolean;
  readonly hasAnswered: boolean;
}

const INITIAL_BINDING_STATE: BindingPersistedState = {
  scaleA: 4,
  nuclide1A: 4,
  nuclide2A: 12,
  activeSlot: 1,
  visitedAs: [4],
  hasCompared: false,
  hasAnswered: false,
};

function parseBindingState(raw: unknown, fallback: BindingPersistedState): BindingPersistedState {
  if (!raw || typeof raw !== "object") return fallback;
  const p = raw as Partial<BindingPersistedState>;
  const scaleA = typeof p.scaleA === "number" && VALID_A_SET.has(p.scaleA) ? p.scaleA : fallback.scaleA;
  const nuclide1A =
    typeof p.nuclide1A === "number" && VALID_A_SET.has(p.nuclide1A) ? p.nuclide1A : fallback.nuclide1A;
  const nuclide2A =
    typeof p.nuclide2A === "number" && VALID_A_SET.has(p.nuclide2A) ? p.nuclide2A : fallback.nuclide2A;
  const activeSlot = p.activeSlot === 2 ? 2 : 1;
  const visitedAs = Array.isArray(p.visitedAs)
    ? Array.from(new Set(p.visitedAs.filter((v): v is number => typeof v === "number" && VALID_A_SET.has(v))))
    : fallback.visitedAs;
  return {
    scaleA,
    nuclide1A,
    nuclide2A,
    activeSlot,
    visitedAs: visitedAs.length > 0 ? visitedAs : fallback.visitedAs,
    hasCompared: typeof p.hasCompared === "boolean" ? p.hasCompared : fallback.hasCompared,
    hasAnswered: typeof p.hasAnswered === "boolean" ? p.hasAnswered : fallback.hasAnswered,
  };
}

function MassDefectScale({ nuclide }: { nuclide: LabNuclideSpec }) {
  const nCount = nuclide.a - nuclide.z;
  const freeMass = nuclide.z * HYDROGEN_ATOM_MASS_U + nCount * NEUTRON_MASS_U;
  const calc = bindingEnergy(nuclide.z, nuclide.a, nuclide.mx);

  // Representative nucleon dots on pans (up to 16 dots so visual stays crisp)
  const displayCount = Math.min(nuclide.a, 14);
  const displayProtons = Math.max(1, Math.round((nuclide.z / nuclide.a) * displayCount));

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        borderRadius: "12px",
        padding: "14px",
        marginBottom: "18px",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "8px", alignItems: "baseline" }}>
        <h4 style={{ margin: 0, color: "var(--text-primary)" }}>
          Mô hình Cân khối lượng hai đĩa — Độ hụt khối Δm của{" "}
          <NuclearSymbol a={nuclide.a} z={nuclide.z} symbol={nuclide.sym} />
        </h4>
        <span style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
          1 amu·c² ≈ {formatVi(ATOMIC_MASS_ENERGY_MEV, 1)} MeV
        </span>
      </div>

      <svg
        viewBox="0 0 540 232"
        role="img"
        aria-label={`Cân khối lượng hai đĩa cho ${nuclide.name}: đĩa trái gồm ${nuclide.z} proton và ${nCount} neutron tự do nặng ${formatVi(freeMass, 6)} amu nghiêng thấp hơn đĩa phải hạt nhân ${nuclide.name} nặng ${formatVi(nuclide.mx, 6)} amu; độ hụt khối Δm = ${formatVi(calc.massDefect, 6)} amu`}
        style={{ display: "block", width: "100%", height: "auto", marginTop: "8px" }}
      >
        <title>Cân hai đĩa minh họa độ hụt khối Δm</title>
        <rect x="4" y="4" width="532" height="224" rx="10" fill="#f8fafc" stroke="#cbd5e1" />

        {/* Base & Pillar */}
        <rect x="210" y="206" width="120" height="10" rx="5" fill="#334155" />
        <polygon points="262,206 278,206 273,116 267,116" fill="#475569" />
        <circle cx="270" cy="114" r="8" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />

        {/* Tilted beam: Left side heavier (y=132), Right side lighter (y=96) */}
        <line x1="108" y1="132" x2="432" y2="96" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />

        {/* Left Pan (heavier -> lower) */}
        <line x1="108" y1="132" x2="68" y2="168" stroke="#64748b" strokeWidth="1.6" />
        <line x1="108" y1="132" x2="148" y2="168" stroke="#64748b" strokeWidth="1.6" />
        <path d="M 52 168 Q 108 182 164 168 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />

        {/* Separated free nucleons on Left Pan */}
        {Array.from({ length: displayCount }, (_, idx) => {
          const col = idx % 5;
          const row = Math.floor(idx / 5);
          const cx = 74 + col * 17 + (row % 2) * 4;
          const cy = 158 - row * 14;
          const isProton = idx < displayProtons;
          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r="5.5"
              fill={isProton ? "#dc2626" : "#2563eb"}
              stroke="#fff"
              strokeWidth="1"
            />
          );
        })}
        <text x="108" y="32" textAnchor="middle" fill="#0f172a" fontSize="11.5" fontWeight="700">
          Đĩa trái: Nucleon tự do rời rạc
        </text>
        <text x="108" y="48" textAnchor="middle" fill="#334155" fontSize="11">
          {nuclide.z}p + {nCount}n ({nuclide.a} nucleon)
        </text>
        <rect x="24" y="186" width="168" height="24" rx="6" fill="#fee2e2" stroke="#fca5a5" />
        <text x="108" y="202" textAnchor="middle" fill="#991b1b" fontSize="10.5" fontWeight="700">
          Z·m(¹H) + N·m_n = {formatVi(freeMass, 6)} amu
        </text>

        {/* Right Pan (lighter -> higher!) */}
        <line x1="432" y1="96" x2="392" y2="132" stroke="#64748b" strokeWidth="1.6" />
        <line x1="432" y1="96" x2="472" y2="132" stroke="#64748b" strokeWidth="1.6" />
        <path d="M 376 132 Q 432 146 488 132 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />

        {/* Tightly bound nucleus on Right Pan */}
        <circle cx="432" cy="112" r="22" fill="#fef08a" fillOpacity="0.55" stroke="#eab308" strokeDasharray="3 2" />
        {Array.from({ length: Math.min(displayCount, 10) }, (_, idx) => {
          const angle = idx * 2.39996;
          const r = Math.sqrt((idx + 0.4) / Math.min(displayCount, 10)) * 11;
          const isProton = idx < Math.max(1, Math.round((nuclide.z / nuclide.a) * Math.min(displayCount, 10)));
          return (
            <circle
              key={idx}
              cx={432 + Math.cos(angle) * r}
              cy={112 + Math.sin(angle) * r}
              r="5.2"
              fill={isProton ? "#dc2626" : "#2563eb"}
              stroke="#fff"
              strokeWidth="0.8"
            />
          );
        })}
        <text x="432" y="32" textAnchor="middle" fill="#0f172a" fontSize="11.5" fontWeight="700">
          Đĩa phải: Hạt nhân tạo thành ({nuclide.name})
        </text>
        <text x="432" y="48" textAnchor="middle" fill="#047857" fontSize="11" fontWeight="600">
          Nhẹ hơn do đã tỏa năng lượng liên kết
        </text>
        <rect x="354" y="152" width="156" height="24" rx="6" fill="#dcfce7" stroke="#86efac" />
        <text x="432" y="168" textAnchor="middle" fill="#065f46" fontSize="11" fontWeight="700">
          m_X = {formatVi(nuclide.mx, 6)} amu
        </text>

        {/* Delta m badge in center-top */}
        <rect x="192" y="58" width="156" height="40" rx="8" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.4" />
        <text x="270" y="75" textAnchor="middle" fill="#1e3a8a" fontSize="11" fontWeight="700">
          Độ hụt khối Δm &gt; 0
        </text>
        <text x="270" y="91" textAnchor="middle" fill="#1d4ed8" fontSize="11.5" fontWeight="700">
          Δm = {formatVi(calc.massDefect, 6)} amu
        </text>
      </svg>

      {/* Readout strip with exact SGK KNTT notation E_lk & E_lkr */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
          gap: "10px",
          marginTop: "12px",
        }}
      >
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            backgroundColor: "var(--bg-surface-elevated)",
          }}
        >
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Độ hụt khối Δm</div>
          <strong style={{ fontSize: "15px", fontVariantNumeric: "tabular-nums" }}>
            {formatVi(calc.massDefect, 6)} amu
          </strong>
        </div>
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            backgroundColor: "var(--bg-surface-elevated)",
          }}
        >
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Năng lượng liên kết E<sub>lk</sub> = Δm·c²
          </div>
          <strong style={{ fontSize: "15px", fontVariantNumeric: "tabular-nums" }}>
            {formatVi(calc.energy, 2)} MeV
          </strong>
        </div>
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            backgroundColor: "var(--color-primary-soft)",
            border: "1px solid var(--border-light)",
          }}
        >
          <div style={{ fontSize: "12px", color: "var(--color-primary)", fontWeight: 600 }}>
            Năng lượng liên kết riêng E<sub>lkr</sub> = E<sub>lk</sub> / A
          </div>
          <strong style={{ fontSize: "15px", color: "var(--color-primary)", fontVariantNumeric: "tabular-nums" }}>
            {formatVi(calc.perNucleon, 2)} MeV/nucleon
          </strong>
        </div>
      </div>
    </div>
  );
}

export function BindingEnergyLab({ onProgress }: ActivityProps) {
  const [state, setState, resetState] = usePersistedLabState(
    B22_BINDING_STORAGE_KEY,
    INITIAL_BINDING_STATE,
    parseBindingState
  );
  const [hoveredA, setHoveredA] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);

  const nuclideMap = useMemo(() => {
    const map = new Map<number, LabNuclideSpec & { massDefect: number; energy: number; perNucleon: number }>();
    for (const item of LAB_NUCLIDES) {
      map.set(item.a, { ...item, ...bindingEnergy(item.z, item.a, item.mx) });
    }
    return map;
  }, []);

  const scaleNuclide = nuclideMap.get(state.scaleA) ?? nuclideMap.get(4)!;
  const n1 = nuclideMap.get(state.nuclide1A) ?? nuclideMap.get(4)!;
  const n2 = nuclideMap.get(state.nuclide2A) ?? nuclideMap.get(12)!;

  const visitedFe = state.visitedAs.includes(56);
  const visitedU = state.visitedAs.includes(235);
  const comparedDistinct = state.hasCompared && state.nuclide1A !== state.nuclide2A;
  const isDone = visitedFe && visitedU && comparedDistinct && state.hasAnswered;

  useSyncLabProgress(isDone, onProgress);

  function selectFromChartOrQuick(a: number) {
    setState((prev) => {
      const nextN1 = prev.activeSlot === 1 ? a : prev.nuclide1A;
      const nextN2 = prev.activeSlot === 2 ? a : prev.nuclide2A;
      const nextVisited = prev.visitedAs.includes(a) ? prev.visitedAs : [...prev.visitedAs, a];
      return {
        ...prev,
        scaleA: a,
        nuclide1A: nextN1,
        nuclide2A: nextN2,
        visitedAs: nextVisited,
        hasCompared: prev.hasCompared || nextN1 !== nextN2,
      };
    });
  }

  function updateComparisonNuclide(slot: 1 | 2, a: number) {
    setState((prev) => {
      const nextN1 = slot === 1 ? a : prev.nuclide1A;
      const nextN2 = slot === 2 ? a : prev.nuclide2A;
      const nextVisited = prev.visitedAs.includes(a) ? prev.visitedAs : [...prev.visitedAs, a];
      return {
        ...prev,
        scaleA: a,
        activeSlot: slot,
        nuclide1A: nextN1,
        nuclide2A: nextN2,
        visitedAs: nextVisited,
        hasCompared: true,
      };
    });
  }

  function handleReset() {
    resetState();
    setRevision((v) => v + 1);
    onProgress?.(false);
  }

  // SVG Chart coordinate helpers (viewBox="0 0 540 276")
  const plotX = (a: number) => 56 + a * 1.82;
  const plotY = (elkr: number) => 226 - elkr * 20;

  const curvePoints = LAB_NUCLIDES.map((item) => {
    const e = nuclideMap.get(item.a)!.perNucleon;
    return `${plotX(item.a).toFixed(1)},${plotY(e).toFixed(1)}`;
  }).join(" ");

  const moreStable = n1.perNucleon >= n2.perNucleon ? n1 : n2;
  const lessStable = n1.perNucleon >= n2.perNucleon ? n2 : n1;
  const deltaElkr = Math.abs(n1.perNucleon - n2.perNucleon);

  return (
    <Lab
      intro="Khảo sát độ hụt khối Δm qua cân hai đĩa và so sánh năng lượng liên kết riêng E_lkr theo số khối A (SGK trang 98–101, Hình 22.3)."
      note="Khối lượng tra bảng nguyên tử trung hòa (1 amu·c² ≈ 931,5 MeV); khối lượng Z electron triệt tiêu ở hai vế khi bỏ qua năng lượng liên kết electron. E_lkr đặc trưng cho mức độ bền vững của hạt nhân về mặt liên kết nucleon."
    >
      <div className="physics-guide">
        <p>
          <strong>🔎 Chu trình khám phá:</strong>
        </p>
        <ol>
          <li>
            <strong>Quan sát cân Δm:</strong> Chọn một hạt nhân để so sánh khối lượng các nucleon tự do rời rạc với khối lượng hạt nhân tạo thành.
          </li>
          <li>
            <strong>Đọc đồ thị &amp; So sánh 2 hạt nhân:</strong> Chọn <strong>Hạt nhân 1</strong> và <strong>Hạt nhân 2</strong> (đặc biệt vùng đỉnh <code>⁵⁶Fe</code> và hạt nặng <code>²³⁵U</code>) để đối chiếu <code>E_lkr</code>.
          </li>
          <li>
            <strong>Giải thích:</strong> Rút ra chiều biến đổi hạt nhân tỏa năng lượng (dịch về vùng đỉnh <code>⁵⁶Fe ≈ 8,8 MeV/nucleon</code>).
          </li>
        </ol>
      </div>

      <div style={{ overflowX: "auto", maxWidth: "100%", marginBottom: "8px" }}>
        <LatexMath
          block
          math={String.raw`\Delta m = Z m_{\mathrm{p}} + (A - Z) m_{\mathrm{n}} - m_{\mathrm{X}}, \quad E_{\mathrm{lk}} = \Delta m c^2, \quad E_{\mathrm{lkr}} = \frac{E_{\mathrm{lk}}}{A}`}
        />
      </div>

      {/* Mô hình Cân khối lượng hai đĩa trực quan */}
      <MassDefectScale nuclide={scaleNuclide} />

      {/* Bộ chọn so sánh trực tiếp 2 hạt nhân bất kỳ */}
      <div
        style={{
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid var(--border-light)",
          backgroundColor: "var(--bg-surface)",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>
            So sánh trực tiếp 2 hạt nhân trên đồ thị E<sub>lkr</sub>(A)
          </strong>
          <button type="button" className="physics-button" onClick={handleReset}>
            Đặt lại thí nghiệm
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
            gap: "12px",
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: state.activeSlot === 1 ? "2px solid #2563eb" : "1px solid var(--border-light)",
              backgroundColor: "var(--bg-surface-elevated)",
            }}
          >
            <label className="physics-field" style={{ minWidth: 0 }}>
              <span style={{ color: "#1d4ed8", fontWeight: 700 }}>● Hạt nhân 1 (đang đặt trên cân khi chọn)</span>
              <select
                aria-label="Chọn Hạt nhân 1"
                value={state.nuclide1A}
                onChange={(e) => updateComparisonNuclide(1, Number(e.target.value))}
              >
                {LAB_NUCLIDES.map((item) => (
                  <option key={item.a} value={item.a}>
                    {item.name} (A = {item.a}, Z = {item.z}) — E_lkr ={" "}
                    {formatVi(nuclideMap.get(item.a)!.perNucleon, 2)} MeV/nucleon
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="physics-button"
              aria-pressed={state.activeSlot === 1}
              onClick={() => setState((prev) => ({ ...prev, activeSlot: 1, scaleA: prev.nuclide1A }))}
              style={{ marginTop: "8px", fontSize: "12.5px", padding: "5px 10px" }}
            >
              {state.activeSlot === 1 ? "Đang gán điểm bấm đồ thị → HN 1" : "Bấm đồ thị để đổi HN 1"}
            </button>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: state.activeSlot === 2 ? "2px solid #d97706" : "1px solid var(--border-light)",
              backgroundColor: "var(--bg-surface-elevated)",
            }}
          >
            <label className="physics-field" style={{ minWidth: 0 }}>
              <span style={{ color: "#b45309", fontWeight: 700 }}>◆ Hạt nhân 2 (đối chiếu)</span>
              <select
                aria-label="Chọn Hạt nhân 2"
                value={state.nuclide2A}
                onChange={(e) => updateComparisonNuclide(2, Number(e.target.value))}
              >
                {LAB_NUCLIDES.map((item) => (
                  <option key={item.a} value={item.a}>
                    {item.name} (A = {item.a}, Z = {item.z}) — E_lkr ={" "}
                    {formatVi(nuclideMap.get(item.a)!.perNucleon, 2)} MeV/nucleon
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="physics-button"
              aria-pressed={state.activeSlot === 2}
              onClick={() => setState((prev) => ({ ...prev, activeSlot: 2, scaleA: prev.nuclide2A }))}
              style={{ marginTop: "8px", fontSize: "12.5px", padding: "5px 10px" }}
            >
              {state.activeSlot === 2 ? "Đang gán điểm bấm đồ thị → HN 2" : "Bấm đồ thị để đổi HN 2"}
            </button>
          </div>
        </div>
      </div>

      {/* Đồ thị E_lkr theo số khối A */}
      <div
        style={{
          position: "relative",
          width: "100%",
          backgroundColor: "var(--bg-surface-elevated)",
          border: "1px solid var(--border-light)",
          padding: "8px",
          borderRadius: "10px",
        }}
      >
        <svg
          viewBox="0 0 540 276"
          role="img"
          aria-label="Đồ thị năng lượng liên kết riêng E_lkr (MeV/nucleon) theo số khối A (nucleon)"
          style={{ display: "block", width: "100%", height: "auto" }}
        >
          <title>Đồ thị E_lkr = E_lk/A (MeV/nucleon) theo Số khối A (nucleon)</title>

          {/* Vùng bền vững nhất A ≈ 50–80 */}
          <rect
            x={plotX(50)}
            y="34"
            width={plotX(88) - plotX(50)}
            height="192"
            fill="#10b981"
            fillOpacity="0.11"
          />
          <text x={plotX(69)} y="46" fontSize="10" fill="#047857" textAnchor="middle" fontWeight="600">
            Đỉnh bền (⁵⁶Fe ≈ 8,8)
          </text>

          {/* Lưới ngang */}
          {[2, 4, 6, 8, 9].map((yVal) => (
            <g key={yVal}>
              <line
                x1="51"
                y1={plotY(yVal)}
                x2="56"
                y2={plotY(yVal)}
                stroke="var(--border-dark)"
                strokeWidth="1"
              />
              <text
                x="46"
                y={plotY(yVal) + 4}
                fontSize="10.5"
                fill="var(--text-secondary)"
                textAnchor="end"
              >
                {yVal}
              </text>
              <line
                x1="56"
                y1={plotY(yVal)}
                x2="516"
                y2={plotY(yVal)}
                stroke="var(--border-light)"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
            </g>
          ))}

          {/* Lưới dọc */}
          {[0, 50, 100, 150, 200, 250].map((xVal) => (
            <g key={xVal}>
              <line
                x1={plotX(xVal)}
                y1="226"
                x2={plotX(xVal)}
                y2="231"
                stroke="var(--border-dark)"
                strokeWidth="1"
              />
              <text
                x={plotX(xVal)}
                y="245"
                fontSize="10.5"
                fill="var(--text-secondary)"
                textAnchor="middle"
              >
                {xVal}
              </text>
            </g>
          ))}

          {/* Trục tọa độ kèm đơn vị đầy đủ */}
          <line x1="56" y1="226" x2="520" y2="226" stroke="var(--text-primary)" strokeWidth="2" />
          <line x1="56" y1="28" x2="56" y2="226" stroke="var(--text-primary)" strokeWidth="2" />
          <text x="290" y="268" fontSize="12.5" fontWeight="600" fill="var(--text-primary)" textAnchor="middle">
            Số khối A (nucleon)
          </text>
          <text x="56" y="19" fontSize="12.5" fontWeight="600" fill="var(--text-primary)">
            E_lkr = E_lk/A (MeV/nucleon)
          </text>

          {/* Đường xu hướng nối các đồng vị */}
          <polyline
            points={curvePoints}
            fill="none"
            stroke="#64748b"
            strokeWidth="2"
            strokeDasharray="5 4"
          />

          {/* Mũi tên so sánh từ hạt kém bền hơn -> hạt bền hơn */}
          {n1.a !== n2.a && (
            <line
              x1={plotX(lessStable.a)}
              y1={plotY(lessStable.perNucleon)}
              x2={plotX(moreStable.a)}
              y2={plotY(moreStable.perNucleon)}
              stroke="#0f766e"
              strokeWidth="2.2"
              strokeDasharray="4 3"
            />
          )}

          {/* Các điểm hạt nhân trên đồ thị */}
          {LAB_NUCLIDES.map((item) => {
            const e = nuclideMap.get(item.a)!.perNucleon;
            const cx = plotX(item.a);
            const cy = plotY(e);
            const isN1 = state.nuclide1A === item.a;
            const isN2 = state.nuclide2A === item.a;
            const isHovered = hoveredA === item.a;
            const visited = state.visitedAs.includes(item.a);

            const labelOffsetY = item.a === 12 ? -12 : item.a === 16 ? -13 : item.a === 235 ? -12 : item.a === 238 ? 17 : -11;
            const labelOffsetX = item.a === 235 ? -14 : item.a === 238 ? 8 : 0;

            return (
              <g
                key={item.a}
                onMouseEnter={() => setHoveredA(item.a)}
                onMouseLeave={() => setHoveredA(null)}
                onClick={() => selectFromChartOrQuick(item.a)}
                style={{ cursor: "pointer" }}
              >
                {isN1 && (
                  <circle cx={cx} cy={cy} r="11" fill="none" stroke="#2563eb" strokeWidth="2.5" />
                )}
                {isN2 && (
                  <circle cx={cx} cy={cy} r="14" fill="none" stroke="#d97706" strokeWidth="2.5" strokeDasharray="3 2" />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered || isN1 || isN2 ? 6.5 : 5}
                  fill={item.a >= 50 && item.a <= 90 ? "#10b981" : item.a > 200 ? "#ef4444" : "#0284c7"}
                  stroke={visited ? "#ffffff" : "none"}
                  strokeWidth={visited ? 1.6 : 0}
                />
                <text
                  x={cx + labelOffsetX}
                  y={cy + labelOffsetY}
                  fontSize="10"
                  fontWeight={isN1 || isN2 ? "700" : "500"}
                  fill="var(--text-primary)"
                  textAnchor="middle"
                >
                  {item.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Danh sách nút bấm nhanh hỗ trợ cảm ứng & bàn phím trên màn hình 390 px */}
      <div className="binding-point-list" aria-label="Chọn nhanh hạt nhân khảo sát">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {LAB_NUCLIDES.map((item) => {
            const e = nuclideMap.get(item.a)!.perNucleon;
            const isSelected = state.scaleA === item.a;
            return (
              <button
                type="button"
                className="btn"
                key={item.a}
                aria-pressed={isSelected}
                onClick={() => selectFromChartOrQuick(item.a)}
                style={{ fontSize: "13px", padding: "6px 10px" }}
              >
                {item.name} (A={item.a}) · {formatVi(e, 2)} MeV/nucleon
                {state.nuclide1A === item.a ? " [HN1]" : ""}
                {state.nuclide2A === item.a ? " [HN2]" : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kết luận đối chiếu trực tiếp Hạt nhân 1 & Hạt nhân 2 */}
      <div
        role="status"
        style={{
          padding: "14px 16px",
          borderRadius: "10px",
          backgroundColor: "var(--color-primary-soft)",
          border: "1px solid var(--border-light)",
          fontSize: "14px",
          lineHeight: 1.65,
        }}
      >
        {n1.a === n2.a ? (
          <p style={{ margin: 0 }}>
            <strong>Đang chọn cùng {n1.name}:</strong> E<sub>lkr</sub> ={" "}
            <strong>{formatVi(n1.perNucleon, 2)} MeV/nucleon</strong>. Hãy chọn <strong>Hạt nhân 2</strong> khác với{" "}
            <strong>Hạt nhân 1</strong> để đối chiếu độ bền vững và chiều tỏa năng lượng!
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            <strong>Kết quả so sánh {n1.name} và {n2.name}:</strong> Hạt nhân <strong>{moreStable.name}</strong> (E
            <sub>lkr</sub> = <strong>{formatVi(moreStable.perNucleon, 2)} MeV/nucleon</strong>) có năng lượng liên kết
            riêng lớn hơn <strong>{lessStable.name}</strong> ({formatVi(lessStable.perNucleon, 2)} MeV/nucleon) một lượng{" "}
            <strong>ΔE<sub>lkr</sub> = {formatVi(deltaElkr, 2)} MeV/nucleon</strong> → các nucleon trong{" "}
            <strong>{moreStable.name}</strong> liên kết chặt chẽ và bền vững hơn. Các quá trình biến đổi từ vùng E
            <sub>lkr</sub> thấp về phía vùng đỉnh bền vững <strong>⁵⁶Fe ≈ 8,8 MeV/nucleon</strong> (tổng hợp hạt nhẹ{" "}
            <em>nhiệt hạch</em> hoặc tách hạt rất nặng <em>phân hạch</em>) đều làm tăng tổng độ hụt khối và{" "}
            <strong>tỏa năng lượng</strong>.
          </p>
        )}
      </div>

      <div className="physics-checklist" style={{ marginTop: "16px" }}>
        <p>
          <strong>Tiêu chí hoàn thành:</strong>
        </p>
        <ul>
          <li className={visitedFe ? "is-done" : ""}>
            Khảo sát hạt nhân vùng đỉnh bền vững ⁵⁶Fe (A = 56, E_lkr ≈ 8,8 MeV/nucleon) {visitedFe ? "✓" : ""}
          </li>
          <li className={visitedU ? "is-done" : ""}>
            Khảo sát hạt nhân nặng ²³⁵U (A = 235, E_lkr ≈ 7,6 MeV/nucleon) {visitedU ? "✓" : ""}
          </li>
          <li className={comparedDistinct ? "is-done" : ""}>
            So sánh trực tiếp 2 hạt nhân khác nhau (Hạt nhân 1 &amp; Hạt nhân 2) {comparedDistinct ? "✓" : ""}
          </li>
          <li className={state.hasAnswered ? "is-done" : ""}>
            Trả lời đúng câu hỏi giải thích {state.hasAnswered ? "✓" : ""}
          </li>
        </ul>
      </div>

      <div>
        <ChoiceCheck
          key={`${revision}-${state.hasAnswered ? "1" : "0"}`}
          initialSelected={state.hasAnswered ? 1 : null}
          initialChecked={state.hasAnswered}
          onResult={(correct) => setState((prev) => ({ ...prev, hasAnswered: correct }))}
          question="Dựa vào đồ thị năng lượng liên kết riêng E_lkr theo số khối A (Hình 22.3 SGK), vì sao cả phân hạch hạt nhân rất nặng (như ²³⁵U) và tổng hợp hạt nhân rất nhẹ (như ²H, ³H) đều tỏa năng lượng?"
          options={[
            "Vì số lượng nucleon tăng thêm sau cả hai quá trình.",
            "Vì cả hai quá trình đều tạo ra các hạt nhân sản phẩm có năng lượng liên kết riêng E_lkr lớn hơn hạt nhân ban đầu (dịch gần về vùng đỉnh bền vững quanh ⁵⁶Fe).",
            "Vì khối lượng nghỉ của các hạt nhân sản phẩm lớn hơn tổng khối lượng nghỉ ban đầu.",
            "Vì mọi hạt nhân trong tự nhiên đều có cùng một giá trị E_lkr.",
          ]}
          correctIndex={1}
          explanation="Khi các hạt nhân biến đổi theo chiều tăng E_lkr (hạt rất nhẹ tổng hợp lại hoặc hạt rất nặng phân hạch thành hai mảnh trung bình tiến về vùng A ≈ 50–80 gần đỉnh ⁵⁶Fe ≈ 8,8 MeV/nucleon), tổng độ hụt khối tăng lên nên tổng khối lượng nghỉ giảm xuống, phần chênh lệch tỏa ra dưới dạng năng lượng."
        />
      </div>
    </Lab>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   3. PHÂN HẠCH DÂY CHUYỀN
   SGK tr. 101–102
   ────────────────────────────────────────────────────────────────────────────── */

export { GuidedFissionLab as NuclearFission } from "./GuidedFissionLab";

/* ──────────────────────────────────────────────────────────────────────────────
   4. PHẢN ỨNG NHIỆT HẠCH (TỔNG HỢP HẠT NHÂN)
   SGK tr. 102–103 | D + T (17,6 MeV) & Thí nghiệm Oliphant 1934 D + D (~4,0 MeV)
   Lưu trữ bền vững: "b22-fusion-lab-v1"
   ────────────────────────────────────────────────────────────────────────────── */

export const B22_FUSION_STORAGE_KEY = "b22-fusion-lab-v1";

type FusionChannelId = "dt" | "dd";
type FusionMode = "idle" | "slow" | "fast";

interface FusionPersistedState {
  readonly channel: FusionChannelId;
  readonly mode: FusionMode;
  readonly hasTriedSlow: boolean;
  readonly hasTriedFast: boolean;
  readonly triedChannels: readonly FusionChannelId[];
  readonly hasAnswered: boolean;
}

const INITIAL_FUSION_STATE: FusionPersistedState = {
  channel: "dt",
  mode: "idle",
  hasTriedSlow: false,
  hasTriedFast: false,
  triedChannels: ["dt"],
  hasAnswered: false,
};

function parseFusionState(raw: unknown, fallback: FusionPersistedState): FusionPersistedState {
  if (!raw || typeof raw !== "object") return fallback;
  const p = raw as Partial<FusionPersistedState>;
  const channel: FusionChannelId = p.channel === "dd" ? "dd" : "dt";
  const mode: FusionMode = p.mode === "slow" || p.mode === "fast" ? p.mode : "idle";
  const triedChannels = Array.isArray(p.triedChannels)
    ? Array.from(new Set(p.triedChannels.filter((c): c is FusionChannelId => c === "dt" || c === "dd")))
    : fallback.triedChannels;
  return {
    channel,
    mode,
    hasTriedSlow: typeof p.hasTriedSlow === "boolean" ? p.hasTriedSlow : fallback.hasTriedSlow,
    hasTriedFast: typeof p.hasTriedFast === "boolean" ? p.hasTriedFast : fallback.hasTriedFast,
    triedChannels: triedChannels.length > 0 ? triedChannels : fallback.triedChannels,
    hasAnswered: typeof p.hasAnswered === "boolean" ? p.hasAnswered : fallback.hasAnswered,
  };
}

const FUSION_CHANNELS = {
  dt: {
    id: "dt" as const,
    buttonLabel: "[Ví dụ mở rộng] ²₁H + ³₁H → ⁴₂He + ¹₀n (17,6 MeV)",
    title: "[Ví dụ mở rộng] Tổng hợp Deuterium – Tritium (²₁H + ³₁H → ⁴₂He + ¹₀n)",
    latex: String.raw`{}^{2}_{1}\mathrm{H} + {}^{3}_{1}\mathrm{H} \rightarrow {}^{4}_{2}\mathrm{He} + {}^{1}_{0}\mathrm{n} + 17{,}6\,\mathrm{MeV}`,
    conservationNote: "[Ví dụ mở rộng ngoài SGK KNTT]: ∑A = 2 + 3 = 4 + 1 = 5; ∑Z = 1 + 1 = 2 + 0 = 2. Tỏa năng lượng 17,6 MeV (~3,52 MeV/nucleon).",
    leftLabel: "²₁H",
    leftName: "Deuterium",
    leftR: 14,
    leftColor: "#3b82f6",
    rightLabel: "³₁H",
    rightName: "Tritium",
    rightR: 16,
    rightColor: "#10b981",
    heLabel: "⁴₂He",
    heR: 18,
    energyBadge: "+17,6 MeV",
  },
  dd: {
    id: "dd" as const,
    buttonLabel: "Chuẩn SGK tr. 102 (Oliphant): ²₁H + ²₁H → ³₂He + ¹₀n (~4,0 MeV)",
    title: "Thí nghiệm Oliphant — SGK tr. 102 (²₁H + ²₁H → ³₂He + ¹₀n)",
    latex: String.raw`{}^{2}_{1}\mathrm{H} + {}^{2}_{1}\mathrm{H} \rightarrow {}^{3}_{2}\mathrm{He} + {}^{1}_{0}\mathrm{n} \quad (\sim 4{,}0\,\mathrm{MeV})`,
    conservationNote: "Ví dụ mạch chính SGK tr. 102 (bản in SGK ghi năm 1927; tư liệu lịch sử vật lí ghi nhận thí nghiệm D–D của Oliphant, Harteck & Rutherford công bố năm 1934): ∑A = 2 + 2 = 3 + 1 = 4; ∑Z = 1 + 1 = 2 + 0 = 2 (tỏa ~4,0 MeV).",
    leftLabel: "²₁H",
    leftName: "Deuterium",
    leftR: 14,
    leftColor: "#3b82f6",
    rightLabel: "²₁H",
    rightName: "Deuterium",
    rightR: 14,
    rightColor: "#0ea5e9",
    heLabel: "³₂He",
    heR: 16,
    energyBadge: "+~4,0 MeV",
  },
} as const;

export function NuclearFusion({ onProgress }: ActivityProps) {
  const [state, setState, resetState] = usePersistedLabState(
    B22_FUSION_STORAGE_KEY,
    INITIAL_FUSION_STATE,
    parseFusionState
  );
  const [runId, setRunId] = useState(0);
  const [revision, setRevision] = useState(0);

  const spec = FUSION_CHANNELS[state.channel];
  const hasBothChannels = state.triedChannels.includes("dt") && state.triedChannels.includes("dd");
  const isDone = state.hasTriedSlow && state.hasTriedFast && hasBothChannels && state.hasAnswered;

  useSyncLabProgress(isDone, onProgress);

  function selectChannel(nextChannel: FusionChannelId) {
    setRunId((v) => v + 1);
    setState((prev) => ({
      ...prev,
      channel: nextChannel,
      mode: "idle",
      triedChannels: prev.triedChannels.includes(nextChannel)
        ? prev.triedChannels
        : [...prev.triedChannels, nextChannel],
    }));
  }

  function fire(mode: "slow" | "fast") {
    setRunId((v) => v + 1);
    setState((prev) => ({
      ...prev,
      mode,
      hasTriedSlow: prev.hasTriedSlow || mode === "slow",
      hasTriedFast: prev.hasTriedFast || mode === "fast",
      triedChannels: prev.triedChannels.includes(prev.channel)
        ? prev.triedChannels
        : [...prev.triedChannels, prev.channel],
    }));
  }

  function handleReset() {
    resetState();
    setRunId((v) => v + 1);
    setRevision((v) => v + 1);
    onProgress?.(false);
  }

  const statusText =
    state.mode === "idle"
      ? "Chọn phản ứng và nhấn nút để phóng hai hạt nhân nhẹ hướng vào tâm (250, 100)."
      : state.mode === "slow"
        ? "Kịch bản nhiệt độ chưa đủ cao: lực đẩy tĩnh điện Coulomb đẩy bật hai hạt nhân mang điện dương ra xa."
        : `Kịch bản nhiệt hạch ở 10⁷ – 10⁸ K: hai hạt nhân thắng hàng rào Coulomb, gặp nhau tại tâm (250, 100) tạo ${spec.heLabel} + ¹₀n (${spec.energyBadge}).`;

  return (
    <Lab
      intro="Quan sát sự va chạm của các hạt nhân nhẹ ở nhiệt độ thường (tán xạ Coulomb) và ở nhiệt độ siêu cao 10⁷ – 10⁸ K (phản ứng nhiệt hạch, SGK tr. 102–103)."
      note="Quỹ đạo, kích thước và tốc độ mô phỏng mang tính quy ước trực quan trong hệ tọa độ chuẩn viewBox 500×200. Ở 10⁷ – 10⁸ K, vật chất ở trạng thái plasma với mật độ và thời gian giam giữ đủ lớn để xác suất nhiệt hạch đáng kể."
    >
      {/* Bộ chọn chuyển đổi 2 kênh phản ứng SGK */}
      <div
        role="group"
        aria-label="Chọn kênh phản ứng nhiệt hạch"
        style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}
      >
        {(["dt", "dd"] as const).map((chId) => {
          const ch = FUSION_CHANNELS[chId];
          const active = state.channel === chId;
          const visited = state.triedChannels.includes(chId);
          return (
            <button
              key={chId}
              type="button"
              className={`physics-button ${active ? "primary" : ""}`}
              aria-pressed={active}
              onClick={() => selectChannel(chId)}
              style={{ fontWeight: active ? 600 : 500 }}
            >
              {ch.buttonLabel} {visited ? "✓" : ""}
            </button>
          );
        })}
      </div>

      <div style={{ overflowX: "auto", maxWidth: "100%" }}>
        <LatexMath block math={spec.latex} />
      </div>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{spec.conservationNote}</p>

      <div className="physics-guide">
        <p>
          <strong>💥 Chu trình khám phá:</strong>
        </p>
        <ol>
          <li>
            <strong>Chuyển đổi phản ứng:</strong> Đối chiếu phản ứng <code>D + T (17,6 MeV)</code> và phản ứng thí nghiệm Oliphant 1934 <code>D + D (~4,0 MeV)</code>.
          </li>
          <li>
            <strong>Thử tán xạ (T thấp) &amp; nhiệt hạch (10⁷ – 10⁸ K):</strong> Quan sát hai hạt nhân tiến về tâm va chạm <code>(250, 100)</code>.
          </li>
          <li>
            <strong>Giải thích:</strong> Trả lời câu hỏi về vai trò của nhiệt độ siêu cao trong phản ứng nhiệt hạch.
          </li>
        </ol>
      </div>

      <div className="physics-controls">
        <button type="button" className="physics-button" onClick={() => fire("slow")}>
          Thử nhiệt độ thấp (Tán xạ Coulomb)
        </button>
        <button type="button" className="physics-button primary" onClick={() => fire("fast")}>
          Thử ở 10⁷ – 10⁸ K (Nhiệt hạch)
        </button>
        <button type="button" className="physics-button" onClick={handleReset}>
          Đặt lại thí nghiệm
        </button>
      </div>

      <p role="status" style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>
        Trạng thái: <strong>{statusText}</strong>
      </p>

      {/* Khung mô phỏng dùng tọa độ nội bộ SVG & <animateTransform> chuẩn viewBox="0 0 500 200" */}
      <div
        className="fusion-sketch"
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "500 / 200",
          backgroundColor: "#0f172a",
          border: "1px solid var(--border-light)",
          borderRadius: "10px",
          overflow: "hidden",
          margin: "16px 0",
        }}
      >
        <svg
          key={`${state.channel}-${state.mode}-${runId}`}
          viewBox="0 0 500 200"
          role="img"
          aria-label={`${spec.title} — chế độ ${state.mode === "fast" ? "nhiệt hạch tại tâm (250, 100)" : state.mode === "slow" ? "tán xạ tĩnh điện Coulomb" : "chờ khởi chạy"}`}
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          <title>{spec.title}</title>

          {/* Trục chuẩn & đánh dấu tâm va chạm (250, 100) */}
          <line x1="24" y1="100" x2="476" y2="100" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="5 5" />
          <circle cx="250" cy="100" r="24" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="250" y1="72" x2="250" y2="128" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
          <text x="250" y="22" fill="#94a3b8" fontSize="11" textAnchor="middle">
            {state.mode === "fast"
              ? "Vùng plasma nhiệt độ siêu cao 10⁷ – 10⁸ K · Tâm hợp nhất (250, 100)"
              : "Tâm va chạm (250, 100)"}
          </text>

          {/* Hàng rào đẩy tĩnh điện Coulomb khi chậm */}
          {state.mode === "slow" && (
            <g opacity="0.65">
              <path d="M 224 54 Q 248 100 224 146" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeDasharray="4 4" />
              <path d="M 276 54 Q 252 100 276 146" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeDasharray="4 4" />
              <text x="250" y="176" fill="#fca5a5" fontSize="11" textAnchor="middle">
                Lực đẩy tĩnh điện Coulomb ngăn hai hạt nhân dương tiếp xúc
              </text>
            </g>
          )}

          {/* Hạt nhân bên trái tiến về chính xác (250, 100) */}
          <g transform="translate(64 100)">
            {state.mode === "slow" && (
              <animateTransform
                attributeName="transform"
                type="translate"
                values="64 100; 206 100; 64 100"
                keyTimes="0; 0.5; 1"
                dur="2.2s"
                fill="freeze"
              />
            )}
            {state.mode === "fast" && (
              <>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="64 100; 250 100; 250 100; 250 100"
                  keyTimes="0; 0.48; 0.5; 1"
                  dur="1.5s"
                  fill="freeze"
                />
                <animate
                  attributeName="opacity"
                  values="1; 1; 0; 0"
                  keyTimes="0; 0.48; 0.5; 1"
                  dur="1.5s"
                  fill="freeze"
                />
              </>
            )}
            <circle cx="0" cy="0" r={spec.leftR} fill={spec.leftColor} stroke="#bae6fd" strokeWidth="1.2" />
            <text x="0" y="4" fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle">
              {spec.leftLabel}
            </text>
            <text x="0" y="29" fill="#cbd5e1" fontSize="10" textAnchor="middle">
              {spec.leftName}
            </text>
          </g>

          {/* Hạt nhân bên phải tiến về chính xác (250, 100) */}
          <g transform="translate(436 100)">
            {state.mode === "slow" && (
              <animateTransform
                attributeName="transform"
                type="translate"
                values="436 100; 294 100; 436 100"
                keyTimes="0; 0.5; 1"
                dur="2.2s"
                fill="freeze"
              />
            )}
            {state.mode === "fast" && (
              <>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="436 100; 250 100; 250 100; 250 100"
                  keyTimes="0; 0.48; 0.5; 1"
                  dur="1.5s"
                  fill="freeze"
                />
                <animate
                  attributeName="opacity"
                  values="1; 1; 0; 0"
                  keyTimes="0; 0.48; 0.5; 1"
                  dur="1.5s"
                  fill="freeze"
                />
              </>
            )}
            <circle cx="0" cy="0" r={spec.rightR} fill={spec.rightColor} stroke="#a7f3d0" strokeWidth="1.2" />
            <text x="0" y="4" fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle">
              {spec.rightLabel}
            </text>
            <text x="0" y="31" fill="#cbd5e1" fontSize="10" textAnchor="middle">
              {spec.rightName}
            </text>
          </g>

          {/* Chớp sáng năng lượng & các hạt sản phẩm sinh ra từ đúng tâm (250, 100) */}
          {state.mode === "fast" && (
            <>
              <circle cx="250" cy="100" r="6" fill="#fde047" opacity="0">
                <animate attributeName="r" values="6; 10; 48; 72" keyTimes="0; 0.47; 0.68; 1" dur="1.5s" fill="freeze" />
                <animate
                  attributeName="opacity"
                  values="0; 0; 0.85; 0"
                  keyTimes="0; 0.47; 0.54; 1"
                  dur="1.5s"
                  fill="freeze"
                />
              </circle>

              {/* Sản phẩm Helium (⁴₂He hoặc ³₂He) */}
              <g transform="translate(250 100)" opacity="0">
                <animate
                  attributeName="opacity"
                  values="0; 0; 1; 1"
                  keyTimes="0; 0.48; 0.52; 1"
                  dur="1.5s"
                  fill="freeze"
                />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="250 100; 250 100; 338 138"
                  keyTimes="0; 0.5; 1"
                  dur="1.5s"
                  fill="freeze"
                />
                <circle cx="0" cy="0" r={spec.heR} fill="#8b5cf6" stroke="#ddd6fe" strokeWidth="1.5" />
                <text x="0" y="4" fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle">
                  {spec.heLabel}
                </text>
              </g>

              {/* Sản phẩm Neutron (¹₀n) bay ngược chiều bảo toàn động lượng */}
              <g transform="translate(250 100)" opacity="0">
                <animate
                  attributeName="opacity"
                  values="0; 0; 1; 1"
                  keyTimes="0; 0.48; 0.52; 1"
                  dur="1.5s"
                  fill="freeze"
                />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="250 100; 250 100; 132 50"
                  keyTimes="0; 0.5; 1"
                  dur="1.5s"
                  fill="freeze"
                />
                <circle cx="0" cy="0" r="9" fill="#f8fafc" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="0" y="3.5" fill="#0f172a" fontSize="10" fontWeight="700" textAnchor="middle">
                  ¹n
                </text>
              </g>

              {/* Nhãn năng lượng tỏa ra */}
              <g opacity="0">
                <animate
                  attributeName="opacity"
                  values="0; 0; 1; 1"
                  keyTimes="0; 0.52; 0.65; 1"
                  dur="1.5s"
                  fill="freeze"
                />
                <rect x="194" y="156" width="112" height="24" rx="12" fill="#422006" stroke="#facc15" />
                <text x="250" y="172" fill="#fef08a" fontSize="11.5" fontWeight="700" textAnchor="middle">
                  Tỏa {spec.energyBadge}
                </text>
              </g>
            </>
          )}
        </svg>
      </div>

      <div className="physics-checklist">
        <p>
          <strong>Tiêu chí hoàn thành:</strong>
        </p>
        <ul>
          <li className={hasBothChannels ? "is-done" : ""}>
            Đã khảo sát cả 2 phản ứng: ²₁H + ³₁H (17,6 MeV) và Oliphant 1934 ²₁H + ²₁H (~4,0 MeV) ({state.triedChannels.length}/2){" "}
            {hasBothChannels ? "✓" : ""}
          </li>
          <li className={state.hasTriedSlow ? "is-done" : ""}>
            Đã quan sát kịch bản tán xạ Coulomb ở nhiệt độ thấp {state.hasTriedSlow ? "✓" : ""}
          </li>
          <li className={state.hasTriedFast ? "is-done" : ""}>
            Đã quan sát kịch bản nhiệt hạch tại tâm ở 10⁷ – 10⁸ K {state.hasTriedFast ? "✓" : ""}
          </li>
          <li className={state.hasAnswered ? "is-done" : ""}>
            Trả lời đúng câu hỏi giải thích {state.hasAnswered ? "✓" : ""}
          </li>
        </ul>
      </div>

      <div>
        <ChoiceCheck
          key={`${revision}-${state.hasAnswered ? "1" : "0"}`}
          initialSelected={state.hasAnswered ? 2 : null}
          initialChecked={state.hasAnswered}
          onResult={(correct) => setState((prev) => ({ ...prev, hasAnswered: correct }))}
          question="Vì sao để phản ứng tổng hợp hạt nhân (nhiệt hạch) xảy ra tự duy trì cần nhiệt độ siêu cao cỡ 10⁷ – 10⁸ K?"
          options={[
            "Để các nguyên tử nặng tự vỡ thành các mảnh nhỏ hơn.",
            "Để sinh ra electron làm trung hòa điện tích hạt nhân trước khi va chạm.",
            "Để các hạt nhân nhẹ có động năng nhiệt đủ lớn thắng lực đẩy tĩnh điện Coulomb và tiến lại đủ gần trong phạm vi lực hạt nhân.",
          ]}
          correctIndex={2}
          explanation="Các hạt nhân nhẹ đều mang điện tích dương nên đẩy nhau bằng lực tĩnh điện Coulomb. Ở nhiệt độ cực cao 10⁷ – 10⁸ K (trạng thái plasma), động năng chuyển động nhiệt đủ lớn giúp các hạt nhân tiến tới khoảng cách cỡ 10⁻¹⁵ m để lực hạt nhân phát huy tác dụng (SGK tr. 102)."
        />
      </div>
    </Lab>
  );
}
