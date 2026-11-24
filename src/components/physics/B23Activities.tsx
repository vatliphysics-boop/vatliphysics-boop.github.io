"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LatexMath } from "@/components/learning/LatexMath";
import { poissonCount } from "@/lib/physics";
import { usePersistedLabState, useSyncLabProgress } from "@/lib/use-persisted-lab-state";
import { ChoiceCheck, Lab, Sources } from "./shared";

export type ActivityProps = {
  onProgress?: (done: boolean) => void;
};

const subscribeNoop = () => () => {};
const getClientHydrated = () => true;
const getServerHydrated = () => false;

function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribeNoop, getClientHydrated, getServerHydrated);
}

/* ══════════════════════════════════════════════════════════════════════════════
   1. GEIGER RANDOM DECAY — Ống đếm Geiger–Müller Hình 23.2 & Bảng 23.1 SGK
   Lưu trữ bền vững: "b23-geiger-v1"
   ══════════════════════════════════════════════════════════════════════════════ */

export const B23_GEIGER_STORAGE_KEY = "b23-geiger-v1";

interface GeigerPersistedState {
  readonly counts: readonly number[];
  readonly hasAnswered: boolean;
}

const INITIAL_GEIGER_STATE: GeigerPersistedState = {
  counts: [],
  hasAnswered: false,
};

function parseGeigerState(
  raw: unknown,
  fallback: GeigerPersistedState
): GeigerPersistedState {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Partial<GeigerPersistedState>;
  const counts = Array.isArray(obj.counts)
    ? obj.counts
        .filter((n): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 200)
        .slice(-24)
    : fallback.counts;
  return {
    counts,
    hasAnswered: Boolean(obj.hasAnswered),
  };
}

const SGK_TABLE_23_1 = [
  { interval: "0 – 5 s", count: 1 },
  { interval: "5 – 10 s", count: 3 },
  { interval: "10 – 15 s", count: 2 },
  { interval: "15 – 20 s", count: 0 },
  { interval: "20 – 25 s", count: 3 },
  { interval: "25 – 30 s", count: 1 },
] as const;

export function GeigerRandomDecay({ onProgress }: ActivityProps) {
  const hydrated = useIsHydrated();
  const [persisted, setPersisted, resetPersisted] = usePersistedLabState(
    B23_GEIGER_STORAGE_KEY,
    INITIAL_GEIGER_STATE,
    parseGeigerState
  );
  const { counts, hasAnswered } = persisted;

  const [isCounting, setIsCounting] = useState(false);
  const [currentCount, setCurrentCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [pulseFlash, setPulseFlash] = useState(false);
  const [resetEpoch, setResetEpoch] = useState(0);

  const currentCountRef = useRef(0);
  const remainingTicksRef = useRef(5);

  const isDone = counts.length >= 3 && hasAnswered;
  useSyncLabProgress(isDone, onProgress);

  useEffect(() => {
    if (!isCounting) return;
    const id = window.setInterval(() => {
      // Tốc độ trung bình 10/6 ≈ 1,67 xung/5s (1/3 xung/s), tương đương cỡ mẫu Bảng 23.1 SGK
      const newDecays = poissonCount(1 / 3);
      currentCountRef.current += newDecays;
      remainingTicksRef.current -= 1;
      setCurrentCount(currentCountRef.current);
      setPulseFlash(newDecays > 0);

      if (remainingTicksRef.current <= 0) {
        window.clearInterval(id);
        const finished = currentCountRef.current;
        setTimeLeft(0);
        setIsCounting(false);
        setPersisted((prev) => ({
          ...prev,
          counts: [...prev.counts.slice(-23), finished],
        }));
      } else {
        setTimeLeft(remainingTicksRef.current);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [isCounting, setPersisted]);

  function startRealtimeCount() {
    if (isCounting) return;
    currentCountRef.current = 0;
    remainingTicksRef.current = 5;
    setCurrentCount(0);
    setPulseFlash(false);
    setTimeLeft(5);
    setIsCounting(true);
  }

  function runInstantFiveSeconds() {
    if (isCounting) return;
    const instant = poissonCount(5 / 3);
    currentCountRef.current = instant;
    setCurrentCount(instant);
    setTimeLeft(0);
    setPulseFlash(instant > 0);
    setPersisted((prev) => ({
      ...prev,
      counts: [...prev.counts.slice(-23), instant],
    }));
  }

  function handleReset() {
    setIsCounting(false);
    currentCountRef.current = 0;
    remainingTicksRef.current = 5;
    setCurrentCount(0);
    setTimeLeft(5);
    setPulseFlash(false);
    setResetEpoch((n) => n + 1);
    resetPersisted();
  }

  const displayedCount = isCounting
    ? currentCount
    : counts.length > 0
      ? counts[counts.length - 1]
      : currentCount;

  const avg =
    counts.length > 0
      ? (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(2)
      : "—";

  return (
    <Lab
      intro="Nguyên lí ống đếm Geiger–Müller (Hình 23.2 SGK tr. 105) và khảo sát tính ngẫu nhiên của phân rã phóng xạ qua các khoảng đếm 5 giây."
      note="Mỗi hạt phóng xạ đi vào ống làm ion hóa khí trơ tạo ra một xung điện ngắn. Số xung trong từng khoảng 5 giây biến thiên ngẫu nhiên (có thể bằng 0) dù nguồn vẫn phát bình thường."
    >
      <div className="physics-guide">
        <p>
          <strong>🔬 Chu trình khám phá (SGK tr. 104–105):</strong>
        </p>
        <ol>
          <li>
            <strong>Tìm hiểu nguyên lí (Hình 23.2):</strong> Xem cách ống đếm biến mỗi hạt phóng xạ bay vào thành đúng 1 xung điện.
          </li>
          <li>
            <strong>Đếm xung 5 giây:</strong> Bấm đếm ít nhất <strong>3 lượt</strong> (có thể dùng <em>Đếm nhanh 5 giây</em> trên điện thoại).
          </li>
          <li>
            <strong>Đối chiếu Bảng 23.1 SGK:</strong> So sánh dãy số ngẫu nhiên của em với số liệu thực nghiệm trong SGK và trả lời câu hỏi.
          </li>
        </ol>
      </div>

      {/* Sơ đồ nguyên lí ống đếm Geiger–Müller chuẩn Hình 23.2 SGK */}
      <div
        style={{
          padding: "14px",
          backgroundColor: "var(--bg-surface-elevated)",
          borderRadius: "10px",
          border: "1px solid var(--border-light)",
          marginBottom: "20px",
        }}
      >
        <h4 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
          [Sơ đồ phóng đại nguyên lí đầu dò (2)] Ống đếm Geiger–Müller — đối chiếu bộ đếm 5 bộ phận Hình 23.2 SGK tr. 105
        </h4>
        <p style={{ margin: "0 0 8px", fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Bộ đếm thực nghiệm <strong>Hình 23.2 SGK tr. 105</strong> gồm: <strong>(1)</strong> nguồn phóng xạ, <strong>(2)</strong> đầu thu phóng xạ (ống GM), <strong>(3)</strong> bộ chuyển đổi tín hiệu, <strong>(4)</strong> loa phát âm thanh cảnh báo và <strong>(5)</strong> đồng hồ hiển thị số đếm. Sơ đồ dưới đây phóng đại mặt cắt bên trong đầu thu <strong>(2)</strong>.
        </p>
        <svg
          viewBox="0 0 560 195"
          role="img"
          aria-label="Sơ đồ phóng đại cấu tạo và nguyên lí tạo xung điện bên trong đầu thu ống đếm Geiger–Müller"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid var(--border-light)",
          }}
        >
          <title>Sơ đồ phóng đại nguyên lí ống đếm Geiger–Müller bên trong đầu thu (2) của Hình 23.2 SGK tr. 105</title>

          {/* Nguồn phóng xạ đặt trước cửa sổ */}
          <rect x="16" y="64" width="44" height="40" rx="5" fill="#334155" />
          <circle cx="38" cy="84" r="7" fill="#f59e0b" />
          <text x="38" y="120" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#334155">
            Nguồn ☢
          </text>

          {/* Tia phóng xạ bay qua cửa sổ mica vào buồng khí */}
          <line
            x1="60"
            y1="84"
            x2="178"
            y2="84"
            stroke="#ef4444"
            strokeWidth="2.4"
            strokeDasharray="5 3"
          />
          <path d="M 172 80 L 180 84 L 172 88" fill="none" stroke="#ef4444" strokeWidth="2.2" />
          <text x="84" y="74" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#dc2626">
            Hạt phóng xạ
          </text>

          {/* Ống trụ kim loại Cathode (-) */}
          <rect
            x="114"
            y="40"
            width="216"
            height="88"
            rx="10"
            fill={pulseFlash ? "#e0f2fe" : "#e2e8f0"}
            stroke="#1e40af"
            strokeWidth="2.8"
          />
          <text x="222" y="31" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#1e40af">
            Vỏ trụ kim loại — Cathode (−)
          </text>

          {/* Cửa sổ mica mỏng ở đầu ống */}
          <line x1="114" y1="46" x2="114" y2="122" stroke="#f59e0b" strokeWidth="5" />
          <text x="114" y="144" textAnchor="middle" fontSize="10" fontWeight="700" fill="#b45309">
            Cửa sổ mica mỏng
          </text>

          {/* Dây kim loại mảnh dọc trục Anode (+) */}
          <line x1="126" y1="84" x2="352" y2="84" stroke="#b91c1c" strokeWidth="2.6" />
          <circle cx="126" cy="84" r="2.8" fill="#b91c1c" />
          <text x="236" y="102" textAnchor="middle" fontSize="10" fontWeight="700" fill="#b91c1c">
            Dây trục kim loại mảnh — Anode (+)
          </text>

          {/* Ion hóa khí trơ Argon bên trong ống */}
          <circle cx="196" cy="64" r="8" fill="#dbeafe" stroke="#2563eb" strokeWidth="1.3" />
          <text x="196" y="67.5" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#1d4ed8">
            Ar⁺
          </text>
          <path d="M 196 55 L 196 44" stroke="#2563eb" strokeWidth="1.3" />

          <circle cx="224" cy="70" r="6.5" fill="#fee2e2" stroke="#dc2626" strokeWidth="1.3" />
          <text x="224" y="73" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#b91c1c">
            e⁻
          </text>
          <path d="M 224 77 L 224 83" stroke="#dc2626" strokeWidth="1.4" />

          <text x="230" y="120" textAnchor="middle" fontSize="9.5" fill="#475569">
            Khí trơ (Ar) áp suất thấp bị ion hóa
          </text>

          {/* Dây nối điện cực + nguồn cao áp HV + điện trở R */}
          <path d="M 290 128 L 290 164 L 380 164" fill="none" stroke="#1e40af" strokeWidth="1.8" />
          <text x="336" y="178" textAnchor="middle" fontSize="10" fontWeight="600" fill="#334155">
            Cao áp (~400–900 V) &amp; điện trở tải R
          </text>
          <path d="M 352 84 L 392 84" fill="none" stroke="#b91c1c" strokeWidth="2" />
          <path d="M 380 164 L 380 84" fill="none" stroke="#64748b" strokeWidth="1.6" strokeDasharray="3 3" />

          {/* Mạch khuếch đại & Bộ đếm xung */}
          <rect
            x="392"
            y="44"
            width="150"
            height="84"
            rx="8"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="2"
          />
          <text x="467" y="64" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#94a3b8">
            Khuếch đại &amp; Bộ đếm xung
          </text>
          {/* Hình dạng 1 xung điện nhọn */}
          <path
            d="M 408 106 L 424 106 L 430 82 L 437 106 L 454 106"
            fill="none"
            stroke="#4ade80"
            strokeWidth="2.2"
          />
          <text x="502" y="105" textAnchor="middle" fontSize="22" fontFamily="monospace" fontWeight="700" fill="#4ade80">
            {String(displayedCount).padStart(2, "0")}
          </text>
        </svg>
        <p style={{ margin: "8px 0 0", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <strong>Vì sao 1 hạt phóng xạ tạo ra 1 xung đếm?</strong> Khi 1 hạt phóng xạ xuyên qua cửa sổ mica vào buồng khí trơ, nó làm{" "}
          <strong>ion hóa</strong> các nguyên tử khí dọc đường đi thành ion dương và electron tự do. Dưới điện trường mạnh giữa dây trục Anode (+) và vỏ trụ Cathode (−), các electron tăng tốc gây thác lũ ion hóa tạo thành{" "}
          <strong>đúng 1 xung dòng điện ngắn</strong> trên điện trở tải, được khuếch đại và làm bộ đếm tăng thêm 1 đơn vị.
        </p>
      </div>

      {/* Hai cột tách biệt hoàn toàn: Mô phỏng ngẫu nhiên của HS vs Bảng 23.1 thực nghiệm SGK */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        {/* Cột 1: Số liệu mô phỏng ngẫu nhiên của em */}
        <div
          style={{
            padding: "16px",
            borderRadius: "10px",
            border: "2px solid #0284c7",
            backgroundColor: "var(--bg-surface)",
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: "999px",
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              🎲 Số liệu mô phỏng ngẫu nhiên của em
            </span>
            {counts.length > 0 && (
              <button
                type="button"
                className="physics-button"
                onClick={handleReset}
                style={{ fontSize: "12px", padding: "4px 10px", minHeight: "32px" }}
              >
                Xóa lượt đếm
              </button>
            )}
          </div>

          <div className="physics-controls" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button
              type="button"
              className="physics-button primary"
              onClick={startRealtimeCount}
              disabled={isCounting}
              style={{ flex: "1 1 150px" }}
            >
              {isCounting ? `Đang đếm… (${timeLeft} s)` : "⏱ Đếm thực (5 giây)"}
            </button>
            <button
              type="button"
              className="physics-button"
              onClick={runInstantFiveSeconds}
              disabled={isCounting}
              style={{ flex: "1 1 140px", fontWeight: 600 }}
            >
              ⚡ Đếm nhanh 5 giây
            </button>
          </div>

          <div
            style={{
              padding: "16px",
              backgroundColor: "#0f172a",
              color: "#4ade80",
              fontFamily: "monospace",
              fontSize: "2.2rem",
              textAlign: "center",
              borderRadius: "8px",
              border: "2px solid #334155",
              marginTop: "12px",
            }}
          >
            {displayedCount} <span style={{ fontSize: "0.95rem", color: "#cbd5e1" }}>xung / 5 s</span>
          </div>

          {counts.length === 0 ? (
            <p style={{ marginTop: "12px", fontSize: "13px", color: "var(--text-secondary)" }}>
              Chưa có lượt đếm nào. Hãy bấm <strong>Đếm thực (5 giây)</strong> hoặc <strong>Đếm nhanh 5 giây</strong> ít nhất 3 lần để lập bảng số liệu của riêng em.
            </p>
          ) : (
            <div style={{ marginTop: "14px", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-surface-elevated)" }}>
                    <th style={{ padding: "7px 8px", border: "1px solid var(--border-light)", textAlign: "left" }}>
                      Lượt (khoảng 5 s)
                    </th>
                    <th style={{ padding: "7px 8px", border: "1px solid var(--border-light)", textAlign: "center" }}>
                      Số xung mô phỏng
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {counts.map((c, i) => (
                    <tr
                      key={i}
                      style={{ backgroundColor: c === 0 ? "#fef3c7" : "inherit" }}
                    >
                      <td style={{ padding: "6px 8px", border: "1px solid var(--border-light)" }}>
                        Lần {i + 1} ({i * 5}–{(i + 1) * 5} s)
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          border: "1px solid var(--border-light)",
                          textAlign: "center",
                          fontWeight: c === 0 ? 700 : 600,
                          color: c === 0 ? "#b45309" : "inherit",
                        }}
                      >
                        {c} {c === 0 ? "(0 xung!)" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                Tổng {counts.length} lượt ({counts.length * 5} s):{" "}
                <strong>{counts.reduce((a, b) => a + b, 0)} xung</strong> · Trung bình:{" "}
                <strong>{avg} xung/5 s</strong> (dữ liệu sinh ngẫu nhiên, không phải số đo thật).
              </p>
            </div>
          )}
        </div>

        {/* Cột 2: Bảng 23.1 – Số liệu thực nghiệm SGK tr. 105 */}
        <div
          style={{
            padding: "16px",
            borderRadius: "10px",
            border: "2px solid #b45309",
            backgroundColor: "var(--bg-surface)",
            minWidth: 0,
          }}
        >
          <div style={{ marginBottom: "10px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: "999px",
                backgroundColor: "#fef3c7",
                color: "#92400e",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              📘 Số liệu thực nghiệm SGK tr. 105 (Bảng 23.1)
            </span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-surface-elevated)" }}>
                <th style={{ padding: "8px", border: "1px solid var(--border-light)", textAlign: "left" }}>
                  Khoảng thời gian (s)
                </th>
                <th style={{ padding: "8px", border: "1px solid var(--border-light)", textAlign: "center" }}>
                  Số tia phóng xạ đếm được
                </th>
              </tr>
            </thead>
            <tbody>
              {SGK_TABLE_23_1.map((row) => (
                <tr
                  key={row.interval}
                  style={{ backgroundColor: row.count === 0 ? "#fef3c7" : "inherit" }}
                >
                  <td style={{ padding: "7px 8px", border: "1px solid var(--border-light)" }}>
                    {row.interval}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      border: "1px solid var(--border-light)",
                      textAlign: "center",
                      fontWeight: row.count === 0 ? 700 : 500,
                      color: row.count === 0 ? "#b45309" : "inherit",
                    }}
                  >
                    {row.count} {row.count === 0 ? "← Không có tia nào!" : ""}
                  </td>
                </tr>
              ))}
              <tr style={{ backgroundColor: "var(--bg-surface-elevated)", fontWeight: 700 }}>
                <td style={{ padding: "8px", border: "1px solid var(--border-light)" }}>
                  Tổng cộng trong 30 s
                </td>
                <td style={{ padding: "8px", border: "1px solid var(--border-light)", textAlign: "center" }}>
                  10 tia
                </td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "10px", lineHeight: 1.55 }}>
            Trung bình thực nghiệm: <strong>10 / 6 ≈ 1,67 tia / 5 s</strong>. Chú ý hai khoảng bằng nhau{" "}
            <strong>5–10 s (3 tia)</strong> và <strong>15–20 s (0 tia)</strong>: ta không thể biết trước trong 5 giây tới có bao nhiêu hạt nhân phân rã!
          </p>
        </div>
      </div>

      <div className="physics-checklist">
        <p>
          <strong>Tiêu chí hoàn thành:</strong>
        </p>
        <ul>
          <li className={counts.length >= 3 ? "is-done" : ""}>
            Thực hiện ít nhất 3 lượt đếm 5 giây ({counts.length}/3) {counts.length >= 3 ? "✓" : ""}
          </li>
          <li className={hasAnswered ? "is-done" : ""}>
            Trả lời đúng câu hỏi kiểm tra về tính ngẫu nhiên {hasAnswered ? "✓" : ""}
          </li>
        </ul>
      </div>

      <ChoiceCheck
        key={hydrated ? `geiger-${resetEpoch}` : "ssr"}
        initialSelected={hasAnswered ? 1 : null}
        initialChecked={hasAnswered}
        onResult={(correct) =>
          setPersisted((prev) => ({ ...prev, hasAnswered: correct }))
        }
        question="Vì sao trong khoảng 15–20 s của Bảng 23.1 SGK, ống đếm Geiger–Müller ghi nhận 0 tia dù nguồn phóng xạ vẫn đặt nguyên trước cửa sổ?"
        options={[
          "Vì nguồn phóng xạ tạm ngừng hoạt động sau 15 giây rồi tự kích hoạt lại ở giây thứ 20.",
          "Vì phân rã phóng xạ có bản chất tự phát và ngẫu nhiên — trong đúng 5 giây đó tình cờ không có hạt nhân nào phóng hạt bay vào ống đếm.",
          "Vì dây Anode của ống đếm phải nghỉ 5 giây để xả điện sau mỗi 3 lần đếm.",
        ]}
        correctIndex={1}
        explanation="Phóng xạ là quá trình hoàn toàn ngẫu nhiên ở cấp độ từng hạt nhân. Trong các khoảng thời gian ngắn 5 s, số hạt phân rã bay vào ống đếm thăng giáng mạnh quanh giá trị trung bình (~1,67 tia/5 s) và hoàn toàn có thể bằng 0."
      />
    </Lab>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. RADIATION PROPERTIES — Tia α, β⁻, β⁺, γ trong E, B (Hình 23.3a,b) & Vật cản (Hình 23.4)
   Lưu trữ bền vững: "b23-radiation-props-v1"
   ══════════════════════════════════════════════════════════════════════════════ */

export const B23_RADIATION_PROPS_STORAGE_KEY = "b23-radiation-props-v1";

type RayType = "alpha" | "beta_neg" | "beta_pos" | "gamma";
type FieldType = "electric" | "magnetic";

interface RayMeta {
  readonly label: string;
  readonly shortSymbol: string;
  readonly color: string;
  readonly charge: string;
  readonly chargeSign: 1 | -1 | 0;
  readonly deflectionPx: number; // tại viewBox cao 180 (trục giữa y = 90): alpha lệch nhẹ 16px, beta lệch mạnh 56px, gamma 0
  readonly nature: string;
  readonly ionization: string;
  readonly penetration: string;
  readonly stoppedBy: string;
  readonly equationLatex: string;
}

const RAY_INFO: Record<RayType, RayMeta> = {
  alpha: {
    label: "Tia α",
    shortSymbol: "α",
    color: "#dc2626",
    charge: "+2e (m_α ≈ 7 300 m_e)",
    chargeSign: 1,
    deflectionPx: 16,
    nature: "Dòng hạt nhân ⁴₂He chuyển động ~ 2·10⁷ m/s",
    ionization: "Mạnh nhất",
    penetration: "Vài cm trong không khí",
    stoppedBy: "Tờ bìa giấy dày ~1 mm (hoặc lớp sừng da ngoài, Hình 23.4 SGK tr. 106)",
    equationLatex: String.raw`{}_{Z}^{A}\mathrm{X} \rightarrow {}_{Z-2}^{A-4}\mathrm{Y} + {}_{2}^{4}\mathrm{He}`,
  },
  beta_neg: {
    label: "Tia β⁻",
    shortSymbol: "β⁻",
    color: "#2563eb",
    charge: "−e (m = m_e)",
    chargeSign: -1,
    deflectionPx: 56,
    nature: "Dòng electron ⁰₋₁e tốc độ gần bằng c, kèm phản neutrino ν̄ₑ",
    ionization: "Trung bình",
    penetration: "Vài mét trong không khí",
    stoppedBy: "Tấm nhôm dày ~1 mm (Hình 23.4 SGK tr. 106)",
    equationLatex: String.raw`{}_{Z}^{A}\mathrm{X} \rightarrow {}_{Z+1}^{A}\mathrm{Y} + {}_{-1}^{0}\mathrm{e} + \bar{\nu}_e`,
  },
  beta_pos: {
    label: "Tia β⁺",
    shortSymbol: "β⁺",
    color: "#7c3aed",
    charge: "+e (m = m_e)",
    chargeSign: 1,
    deflectionPx: 56,
    nature: "Dòng positron ⁰₊₁e tốc độ gần bằng c, kèm neutrino νₑ",
    ionization: "Trung bình",
    penetration: "Vài mét trong không khí",
    stoppedBy: "Tấm nhôm dày ~1 mm (Hình 23.4 SGK tr. 106)",
    equationLatex: String.raw`{}_{Z}^{A}\mathrm{X} \rightarrow {}_{Z-1}^{A}\mathrm{Y} + {}_{+1}^{0}\mathrm{e} + \nu_e`,
  },
  gamma: {
    label: "Tia γ",
    shortSymbol: "γ",
    color: "#059669",
    charge: "0 (không mang điện)",
    chargeSign: 0,
    deflectionPx: 0,
    nature: "Bức xạ điện từ (photon năng lượng cao, λ < 10⁻¹¹ m)",
    ionization: "Yếu nhất",
    penetration: "Đâm xuyên mạnh nhất",
    stoppedBy: "Suy giảm mạnh qua tấm chì dày ~10 cm hoặc bê tông dày (Hình 23.4 SGK tr. 106)",
    equationLatex: String.raw`{}_{Z}^{A}\mathrm{X}^* \rightarrow {}_{Z}^{A}\mathrm{X} + \gamma`,
  },
};

const ALL_RAYS: readonly RayType[] = ["alpha", "beta_neg", "beta_pos", "gamma"];

interface RadiationPropsPersistedState {
  readonly selected: RayType;
  readonly viewedRays: readonly RayType[];
  readonly fieldType: FieldType;
  readonly topPlatePositive: boolean;
  readonly bIntoScreen: boolean;
  readonly hasAnswered: boolean;
}

const INITIAL_RADIATION_PROPS_STATE: RadiationPropsPersistedState = {
  selected: "alpha",
  viewedRays: ["alpha"],
  fieldType: "electric",
  topPlatePositive: true,
  bIntoScreen: false,
  hasAnswered: false,
};

function isRayType(v: unknown): v is RayType {
  return v === "alpha" || v === "beta_neg" || v === "beta_pos" || v === "gamma";
}

function parseRadiationPropsState(
  raw: unknown,
  fallback: RadiationPropsPersistedState
): RadiationPropsPersistedState {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Partial<RadiationPropsPersistedState>;
  const selected = isRayType(obj.selected) ? obj.selected : fallback.selected;
  const rawViewed = Array.isArray(obj.viewedRays)
    ? obj.viewedRays.filter(isRayType)
    : [];
  const viewedSet = new Set<RayType>([selected, ...rawViewed]);
  return {
    selected,
    viewedRays: Array.from(viewedSet),
    fieldType: obj.fieldType === "magnetic" ? "magnetic" : "electric",
    topPlatePositive:
      typeof obj.topPlatePositive === "boolean"
        ? obj.topPlatePositive
        : fallback.topPlatePositive,
    bIntoScreen:
      typeof obj.bIntoScreen === "boolean"
        ? obj.bIntoScreen
        : fallback.bIntoScreen,
    hasAnswered: Boolean(obj.hasAnswered),
  };
}

function getRayDeltaSvgY(
  ray: RayType,
  fieldType: FieldType,
  topPlatePositive: boolean,
  bIntoScreen: boolean
): number {
  const meta = RAY_INFO[ray];
  if (meta.chargeSign === 0) return 0;
  if (fieldType === "electric") {
    // Hạt bay ngang sang phải (+x). Nếu bản + ở trên và − ở dưới, E hướng xuống (+y_svg):
    // Hạt q > 0 (α, β⁺) bị đẩy xuống bản − (+y_svg); hạt q < 0 (β⁻) bị hút lên bản + (−y_svg).
    const eDownSign = topPlatePositive ? 1 : -1;
    return meta.chargeSign * eDownSign * meta.deflectionPx;
  }
  // Từ trường B vuông góc mặt phẳng hình vẽ, vận tốc v₀ hướng sang phải (+x):
  // Quy tắc bàn tay trái:
  // - Khi B hướng vào trong (⊗): ngửa lòng bàn tay trái đón B, 4 ngón chỉ sang phải → ngón cái chỉ LÊN TRÊN (−y_svg).
  //   Vậy hạt dương (α, β⁺) cong lên trên (−y_svg), hạt âm (β⁻) cong xuống dưới (+y_svg).
  // - Khi B hướng ra ngoài (⊙): úp lòng bàn tay trái vào hình vẽ, 4 ngón chỉ sang phải → ngón cái chỉ XUỐNG DƯỚI (+y_svg).
  const posLorentzSvgSign = bIntoScreen ? -1 : 1;
  return meta.chargeSign * posLorentzSvgSign * meta.deflectionPx;
}

export function RadiationProperties({ onProgress }: ActivityProps) {
  const hydrated = useIsHydrated();
  const [persisted, setPersisted] = usePersistedLabState(
    B23_RADIATION_PROPS_STORAGE_KEY,
    INITIAL_RADIATION_PROPS_STATE,
    parseRadiationPropsState
  );

  const {
    selected,
    viewedRays,
    fieldType,
    topPlatePositive,
    bIntoScreen,
    hasAnswered,
  } = persisted;

  const info = RAY_INFO[selected];
  const isDone = viewedRays.length >= 3 && hasAnswered;
  useSyncLabProgress(isDone, onProgress);

  function handleSelectRay(ray: RayType) {
    setPersisted((prev) => {
      const nextViewed = prev.viewedRays.includes(ray)
        ? prev.viewedRays
        : [...prev.viewedRays, ray];
      return { ...prev, selected: ray, viewedRays: nextViewed };
    });
  }

  const activeDy = getRayDeltaSvgY(selected, fieldType, topPlatePositive, bIntoScreen);

  const deflectionSummary = (() => {
    if (info.chargeSign === 0) {
      return "Truyền thẳng (q = 0, không chịu lực điện hay lực Lorentz)";
    }
    const dirWord = activeDy < 0 ? "lên trên" : "xuống dưới";
    if (fieldType === "electric") {
      const targetPlate = info.chargeSign > 0 ? "bản âm (−)" : "bản dương (+)";
      return selected === "alpha"
        ? `Lệch nhẹ ${dirWord} về ${targetPlate} (m_α ≈ 7 300 m_e nên ít cong hơn hẳn β⁺)`
        : `Lệch mạnh ${dirWord} về ${targetPlate} (m_e nhỏ, độ lớn đối xứng giữa β⁻ và β⁺)`;
    }
    const bDesc = bIntoScreen ? "B ⊗ vào trong" : "B ⊙ ra ngoài";
    return selected === "alpha"
      ? `Cong nhẹ ${dirWord} theo quy tắc bàn tay trái (${bDesc}, R = mv/|q|B lớn)`
      : `Cong mạnh ${dirWord} theo quy tắc bàn tay trái (${bDesc}, R nhỏ do m_e ≪ m_α)`;
  })();

  return (
    <Lab
      intro="Khảo sát sự lệch hướng trong điện trường E (Hình 23.3a), từ trường B (Hình 23.3b) và khả năng đâm xuyên qua Giấy – Nhôm – Chì (Hình 23.4 SGK tr. 105–107) của tia α, β⁻, β⁺, γ."
      note="Mô hình định tính chuẩn SGK. Đặc biệt lưu ý: tia α (+2e) lệch cùng phía tia β⁺ (+e) nhưng độ cong nhỏ hơn rất nhiều vì khối lượng hạt α lớn gấp ~7 300 lần electron."
    >
      <div className="physics-guide">
        <p>
          <strong>🔎 Chu trình khám phá:</strong>
        </p>
        <ol>
          <li>
            <strong>Chọn tia:</strong> Khảo sát ít nhất 3 loại tia phóng xạ (α, β⁻, β⁺, γ).
          </li>
          <li>
            <strong>Thử cả 2 trường:</strong> Chuyển đổi giữa <strong>Điện trường E</strong> (đảo cực tụ) và <strong>Từ trường B</strong> (đảo chiều ⊗ / ⊙, kiểm tra bằng quy tắc bàn tay trái).
          </li>
          <li>
            <strong>Đối chiếu đâm xuyên &amp; phương trình:</strong> Quan sát vật cản chặn tia và trả lời câu hỏi.
          </li>
        </ol>
      </div>

      {/* Chọn loại tia */}
      <div className="physics-controls" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {ALL_RAYS.map((ray) => (
          <button
            key={ray}
            type="button"
            className={`physics-button ${selected === ray ? "primary" : ""}`}
            onClick={() => handleSelectRay(ray)}
          >
            {RAY_INFO[ray].label} {viewedRays.includes(ray) ? "✓" : ""}
          </button>
        ))}
      </div>

      {/* Chuyển đổi Điện trường E / Từ trường B + Đảo cực / Đảo chiều */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
          marginTop: "12px",
          padding: "10px 12px",
          backgroundColor: "var(--bg-surface-elevated)",
          borderRadius: "8px",
          border: "1px solid var(--border-light)",
        }}
      >
        <button
          type="button"
          className={`physics-button ${fieldType === "electric" ? "primary" : ""}`}
          onClick={() => setPersisted((prev) => ({ ...prev, fieldType: "electric" }))}
          style={{ fontSize: "13px" }}
        >
          ⚡ Điện trường E (Hình 23.3a)
        </button>
        <button
          type="button"
          className={`physics-button ${fieldType === "magnetic" ? "primary" : ""}`}
          onClick={() => setPersisted((prev) => ({ ...prev, fieldType: "magnetic" }))}
          style={{ fontSize: "13px" }}
        >
          🧲 Từ trường B (Hình 23.3b)
        </button>
        {fieldType === "electric" ? (
          <button
            type="button"
            className="physics-button"
            onClick={() =>
              setPersisted((prev) => ({ ...prev, topPlatePositive: !prev.topPlatePositive }))
            }
            style={{ fontSize: "13px" }}
          >
            ⇄ Đảo cực bản tụ ({topPlatePositive ? "+ ở trên / − ở dưới" : "− ở trên / + ở dưới"})
          </button>
        ) : (
          <button
            type="button"
            className="physics-button"
            onClick={() =>
              setPersisted((prev) => ({ ...prev, bIntoScreen: !prev.bIntoScreen }))
            }
            style={{ fontSize: "13px" }}
          >
            ⇄ Đảo chiều B ({bIntoScreen ? "⊗ hướng vào trong" : "⊙ hướng ra ngoài"})
          </button>
        )}
      </div>

      {/* Lưới responsive không tràn ở 390px */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "18px",
          marginTop: "16px",
        }}
      >
        {/* Sơ đồ 1: Trong điện trường E hoặc từ trường B */}
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
            {fieldType === "electric"
              ? "1. Lệch trong điện trường đều E (Hình 23.3a SGK):"
              : "1. Lệch trong từ trường đều B (Hình 23.3b SGK):"}
          </p>
          <svg
            viewBox="0 0 320 180"
            role="img"
            aria-label={`Quỹ đạo ${info.label} trong ${fieldType === "electric" ? "điện trường E" : "từ trường B"}`}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              border: "1px solid var(--border-light)",
              borderRadius: "8px",
              backgroundColor: "#f8fafc",
            }}
          >
            <title>
              {fieldType === "electric"
                ? "Tia phóng xạ trong điện trường đều E"
                : "Tia phóng xạ trong từ trường đều B"}
            </title>

            {fieldType === "electric" ? (
              <>
                <rect
                  x="72"
                  y="14"
                  width="226"
                  height="10"
                  rx="2"
                  fill={topPlatePositive ? "#ef4444" : "#3b82f6"}
                  opacity={0.88}
                />
                <text
                  x="185"
                  y="11"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill={topPlatePositive ? "#991b1b" : "#1e3a8a"}
                >
                  {topPlatePositive ? "Bản dương (+)" : "Bản âm (−)"}
                </text>

                <rect
                  x="72"
                  y="156"
                  width="226"
                  height="10"
                  rx="2"
                  fill={topPlatePositive ? "#3b82f6" : "#ef4444"}
                  opacity={0.88}
                />
                <text
                  x="185"
                  y="176"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill={topPlatePositive ? "#1e3a8a" : "#991b1b"}
                >
                  {topPlatePositive ? "Bản âm (−)" : "Bản dương (+)"}
                </text>

                {[110, 175, 240].map((ex) => {
                  const y1 = topPlatePositive ? 28 : 152;
                  const y2 = topPlatePositive ? 150 : 30;
                  const tip = topPlatePositive ? -5 : 5;
                  return (
                    <g key={ex} opacity="0.28">
                      <line x1={ex} y1={y1} x2={ex} y2={y2} stroke="#64748b" strokeDasharray="3 3" />
                      <path d={`M ${ex - 3} ${y2 + tip} L ${ex} ${y2} L ${ex + 3} ${y2 + tip}`} fill="none" stroke="#64748b" />
                    </g>
                  );
                })}
              </>
            ) : (
              <>
                <rect
                  x="72"
                  y="18"
                  width="226"
                  height="144"
                  rx="6"
                  fill="#e2e8f0"
                  opacity="0.55"
                  stroke="#94a3b8"
                  strokeDasharray="4 3"
                />
                <text x="185" y="13" textAnchor="middle" fontSize="10" fontWeight="700" fill="#334155">
                  Từ trường đều {bIntoScreen ? "B ⊗ (vào trong)" : "B ⊙ (ra ngoài)"}
                </text>
                {[98, 148, 198, 248, 282].map((bx) =>
                  [42, 74, 106, 138].map((by) => (
                    <g key={`${bx}-${by}`} opacity="0.4">
                      <circle cx={bx} cy={by} r="5.5" fill="none" stroke="#475569" strokeWidth="1.1" />
                      {bIntoScreen ? (
                        <>
                          <line x1={bx - 3} y1={by - 3} x2={bx + 3} y2={by + 3} stroke="#475569" strokeWidth="1.1" />
                          <line x1={bx + 3} y1={by - 3} x2={bx - 3} y2={by + 3} stroke="#475569" strokeWidth="1.1" />
                        </>
                      ) : (
                        <circle cx={bx} cy={by} r="1.8" fill="#475569" />
                      )}
                    </g>
                  ))
                )}
              </>
            )}

            {/* Nguồn chì + mũi tên vận tốc ban đầu v₀ */}
            <rect x="10" y="74" width="32" height="32" rx="4" fill="#334155" />
            <circle cx="24" cy="90" r="4.5" fill="#f59e0b" />
            <line x1="42" y1="90" x2="68" y2="90" stroke="#0f172a" strokeWidth="1.7" />
            <path d="M 63 87 L 69 90 L 63 93" fill="none" stroke="#0f172a" strokeWidth="1.6" />
            <text x="55" y="83" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#0f172a">
              v₀
            </text>

            {/* Nét mờ đối chiếu cả 4 tia */}
            {ALL_RAYS.filter((r) => r !== selected).map((other) => {
              const dy = getRayDeltaSvgY(other, fieldType, topPlatePositive, bIntoScreen);
              const endY = 90 + dy;
              const dPath =
                dy === 0
                  ? "M 42 90 L 286 90"
                  : `M 42 90 L 72 90 C 138 90, 205 ${90 + dy * 0.55}, 286 ${endY}`;
              return (
                <g key={other} opacity="0.26">
                  <path d={dPath} fill="none" stroke={RAY_INFO[other].color} strokeWidth="1.8" strokeDasharray="4 3" />
                  <text x="292" y={endY + 3} fontSize="10" fontWeight="700" fill={RAY_INFO[other].color}>
                    {RAY_INFO[other].shortSymbol}
                  </text>
                </g>
              );
            })}

            {/* Quỹ đạo tia đang chọn */}
            {(() => {
              const endY = 90 + activeDy;
              const activePath =
                activeDy === 0
                  ? "M 42 90 L 286 90"
                  : `M 42 90 L 72 90 C 138 90, 205 ${90 + activeDy * 0.55}, 286 ${endY}`;
              return (
                <>
                  <path d={activePath} fill="none" stroke={info.color} strokeWidth={3} />
                  <circle cx={286} cy={endY} r="4" fill={info.color} />
                  <text x="293" y={endY + 4} fontSize="12" fontWeight="800" fill={info.color}>
                    {info.shortSymbol}
                  </text>
                </>
              );
            })()}
          </svg>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "8px", lineHeight: 1.5 }}>
            <strong>Chiều lệch:</strong> {deflectionSummary}
          </p>
        </div>

        {/* Sơ đồ 2: Đâm xuyên qua Giấy – Nhôm – Chì (Hình 23.4 SGK) */}
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
            2. Đâm xuyên qua vật cản (Hình 23.4 SGK):
          </p>
          <svg
            viewBox="0 0 320 180"
            role="img"
            aria-label={`Khả năng đâm xuyên của ${info.label} qua giấy, nhôm và chì`}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              border: "1px solid var(--border-light)",
              borderRadius: "8px",
              backgroundColor: "#f8fafc",
            }}
          >
            <title>Khả năng đâm xuyên qua Giấy, Nhôm vài mm và Chì dày vài cm</title>
            <rect x="10" y="74" width="28" height="32" rx="4" fill="#334155" />
            <circle cx="24" cy="90" r="4.5" fill={info.color} />

            {/* Giấy */}
            <rect x="92" y="24" width="8" height="122" fill="#fde68a" stroke="#ca8a04" />
            <text x="96" y="162" textAnchor="middle" fontSize="10" fontWeight="600" fill="#854d0e">
              Giấy
            </text>

            {/* Nhôm vài mm */}
            <rect x="160" y="24" width="16" height="122" fill="#cbd5e1" stroke="#64748b" />
            <text x="168" y="162" textAnchor="middle" fontSize="10" fontWeight="600" fill="#334155">
              Nhôm (~mm)
            </text>

            {/* Chì dày vài cm */}
            <rect x="232" y="24" width="34" height="122" fill="#475569" stroke="#1e293b" />
            <text x="249" y="162" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
              Chì (~cm)
            </text>

            {selected === "alpha" && (
              <>
                <line x1="38" y1="90" x2="90" y2="90" stroke={info.color} strokeWidth={3.2} />
                <text x="84" y="78" textAnchor="end" fontSize="11" fontWeight="700" fill={info.color}>
                  ✗ Dừng
                </text>
              </>
            )}
            {(selected === "beta_neg" || selected === "beta_pos") && (
              <>
                <line x1="38" y1="90" x2="158" y2="90" stroke={info.color} strokeWidth={3.2} />
                <text x="152" y="78" textAnchor="end" fontSize="11" fontWeight="700" fill={info.color}>
                  ✗ Dừng
                </text>
              </>
            )}
            {selected === "gamma" && (
              <>
                <line x1="38" y1="90" x2="232" y2="90" stroke={info.color} strokeWidth={3.2} strokeDasharray="6 3" />
                <line x1="266" y1="90" x2="308" y2="90" stroke={info.color} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.45} />
                <text x="288" y="78" textAnchor="middle" fontSize="10" fontWeight="700" fill={info.color}>
                  Suy giảm
                </text>
              </>
            )}
            <text x="48" y="80" fontSize="12" fontWeight="800" fill={info.color}>
              {info.label}
            </text>
          </svg>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "8px", lineHeight: 1.5 }}>
            <strong>Vật cản chặn tối thiểu:</strong> {info.stoppedBy}
          </p>
        </div>
      </div>

      {/* Thẻ tóm tắt bản chất & phương trình phân rã chuẩn SGK */}
      <div
        style={{
          padding: "14px 16px",
          backgroundColor: "var(--bg-surface-elevated)",
          borderRadius: "8px",
          marginTop: "16px",
          borderLeft: `4px solid ${info.color}`,
        }}
      >
        <p style={{ fontSize: "15px", fontWeight: 700, color: info.color, margin: 0 }}>
          {info.label} — Phương trình phân rã &amp; đặc trưng vật lí
        </p>
        <div style={{ margin: "6px 0" }}>
          <LatexMath block math={info.equationLatex} />
        </div>
        <p style={{ fontSize: "13.5px", margin: "4px 0 0" }}>
          Bản chất: <strong>{info.nature}</strong> · Điện tích: <strong>{info.charge}</strong>
        </p>
        <p style={{ fontSize: "13.5px", margin: "4px 0 0" }}>
          Ion hóa không khí: <strong>{info.ionization}</strong> · Đâm xuyên: <strong>{info.penetration}</strong>
        </p>
      </div>

      <div className="physics-checklist">
        <p>
          <strong>Tiêu chí hoàn thành:</strong>
        </p>
        <ul>
          <li className={viewedRays.length >= 3 ? "is-done" : ""}>
            Khảo sát ít nhất 3 loại tia ({viewedRays.length}/3) {viewedRays.length >= 3 ? "✓" : ""}
          </li>
          <li className={hasAnswered ? "is-done" : ""}>
            Trả lời đúng câu hỏi kiểm tra {hasAnswered ? "✓" : ""}
          </li>
        </ul>
      </div>

      <ChoiceCheck
        key={hydrated ? "rad-props-client" : "ssr"}
        initialSelected={hasAnswered ? 1 : null}
        initialChecked={hasAnswered}
        onResult={(correct) =>
          setPersisted((prev) => ({ ...prev, hasAnswered: correct }))
        }
        question="Vì sao trong điện trường đều (Hình 23.3a SGK), tia α mang điện tích +2e lớn gấp đôi độ lớn điện tích của tia β⁺ (+e) nhưng quỹ đạo tia α lại chỉ lệch nhẹ hơn rất nhiều so với tia β⁺?"
        options={[
          "Vì tia α bị không khí trung hòa bớt điện tích ngay khi vừa ra khỏi nguồn.",
          "Vì khối lượng hạt α (m_α ≈ 7 300 m_e) lớn hơn khối lượng positron hàng nghìn lần nên gia tốc ngang và độ cong quỹ đạo nhỏ hơn rất nhiều.",
          "Vì điện trường đều chỉ tác dụng lực mạnh lên các hạt có số khối bằng 0.",
        ]}
        correctIndex={1}
        explanation="Theo định luật II Newton, gia tốc ngang a = |q|E / m. Dù |q_α| = 2e gấp đôi |q_β| = e nhưng m_α ≈ 7 300 m_e lớn hơn rất nhiều nên quỹ đạo hạt α chỉ cong nhẹ về phía bản âm, còn tia β⁺ cong rất mạnh về cùng phía bản âm (và đối xứng với tia β⁻ về phía bản dương)."
      />
    </Lab>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   3. RADIOACTIVE DECAY HALF-LIFE — Tái xuất từ DecayProcessLab
   ══════════════════════════════════════════════════════════════════════════════ */

export { DecayProcessLab as RadioactiveDecayHalfLife } from "./DecayProcessLab";

/* ══════════════════════════════════════════════════════════════════════════════
   4. CARBON-14 DATING — Định tuổi cổ vật bằng đồng vị ¹⁴₆C
   Lưu trữ bền vững: "b23-c14-v1"
   ══════════════════════════════════════════════════════════════════════════════ */

export const B23_C14_STORAGE_KEY = "b23-c14-v1";
const T14C = 5730; // năm

interface C14PersistedState {
  readonly ratio: number;
  readonly hasUsedExample: boolean;
  readonly hasAnswered: boolean;
}

const INITIAL_C14_STATE: C14PersistedState = {
  ratio: 50,
  hasUsedExample: false,
  hasAnswered: false,
};

function parseC14State(
  raw: unknown,
  fallback: C14PersistedState
): C14PersistedState {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Partial<C14PersistedState>;
  const ratio =
    typeof obj.ratio === "number" &&
    Number.isFinite(obj.ratio) &&
    obj.ratio >= 1 &&
    obj.ratio <= 100
      ? Number(obj.ratio.toFixed(1))
      : fallback.ratio;
  return {
    ratio,
    hasUsedExample: Boolean(obj.hasUsedExample),
    hasAnswered: Boolean(obj.hasAnswered),
  };
}

const C14_EXAMPLES = [
  { name: "Cuộn giấy Biển Chết", ratio: 78, context: "Bản thảo cổ đại (~2 000 năm)" },
  { name: "Gỗ quan tài Ai Cập", ratio: 50, context: "Đúng 1 chu kì bán rã" },
  { name: "Mẫu gỗ khảo cổ Việt Nam", ratio: 25, context: "2 chu kì bán rã" },
  { name: "Than củi hang Lascaux", ratio: 12.5, context: "3 chu kì bán rã" },
] as const;

export function Carbon14Dating({ onProgress }: ActivityProps) {
  const hydrated = useIsHydrated();
  const [persisted, setPersisted] = usePersistedLabState(
    B23_C14_STORAGE_KEY,
    INITIAL_C14_STATE,
    parseC14State
  );
  const { ratio, hasUsedExample, hasAnswered } = persisted;

  const isDone = hasUsedExample && hasAnswered;
  useSyncLabProgress(isDone, onProgress);

  const ageYears = Math.round(T14C * Math.log2(100 / ratio));
  const halfLifeCount = (ageYears / T14C).toFixed(2);

  return (
    <Lab
      intro="[Ô đọc thêm Em có biết — SGK tr. 109–110] Ứng dụng định luật phóng xạ định tuổi mẫu vật hữu cơ cổ bằng đồng vị Carbon-14 (¹⁴₆C, chu kì bán rã T ≈ 5 730 năm)."
      note="Giả thiết cơ sở: Khi sinh vật còn sống, trao đổi chất giữ tỉ lệ ¹⁴C/¹²C không đổi như khí quyển. Khi sinh vật chết, ¹⁴C ngừng bổ sung và phân rã β⁻ theo H(t) = H₀·2^(−t/T). Phạm vi tin cậy thực tế khoảng vài trăm đến ~50 000 năm."
    >
      <div className="physics-guide">
        <p>
          <strong>📅 Chu trình khám phá:</strong>
        </p>
        <ol>
          <li>
            <strong>Thử mẫu thực tế:</strong> Bấm chọn ít nhất 1 mẫu khảo cổ hoặc kéo thanh trượt tỉ lệ độ phóng xạ{" "}
            <code>H / H₀ (%)</code>.
          </li>
          <li>
            <strong>Quan sát hệ thức:</strong> Đối chiếu tỉ lệ phần trăm còn lại với số chu kì bán rã đã trôi qua.
          </li>
          <li>
            <strong>Vận dụng:</strong> Trả lời câu hỏi tính niên đại mẫu gỗ cổ.
          </li>
        </ol>
      </div>

      <div className="physics-controls">
        <label className="physics-field">
          <span>
            Tỉ số độ phóng xạ <code>H / H₀</code> của ¹⁴₆C còn lại so với mẫu đang sống:{" "}
            <strong>{ratio}%</strong>
          </span>
          <input
            type="range"
            min={1}
            max={100}
            step={0.5}
            value={ratio}
            onChange={(e) =>
              setPersisted((prev) => ({
                ...prev,
                ratio: Number(e.target.value),
                hasUsedExample: true,
              }))
            }
          />
        </label>
      </div>

      <div
        style={{
          padding: "18px",
          backgroundColor: "var(--bg-surface-elevated)",
          borderRadius: "10px",
          textAlign: "center",
          marginBottom: "16px",
        }}
      >
        <LatexMath
          block
          math={String.raw`{}_{6}^{14}\mathrm{C}\rightarrow {}_{7}^{14}\mathrm{N}+{}_{-1}^{0}\mathrm{e}+\bar{\nu}_e,\qquad t = T\log_2\!\left(\frac{100}{${ratio}}\right)`}
        />
        <p
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            fontWeight: 800,
            color: "var(--color-primary)",
            margin: "6px 0 2px",
          }}
        >
          ≈ {ageYears.toLocaleString("vi-VN")} năm tuổi
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          Tương ứng <strong>{halfLifeCount} chu kì bán rã</strong> (T = 5 730 năm)
        </p>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontSize: "13.5px", fontWeight: 700, marginBottom: "8px" }}>
          Mẫu khảo cổ minh họa (nhấn để nạp thông số):
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {C14_EXAMPLES.map((ex) => (
            <button
              key={ex.name}
              type="button"
              className={`physics-button ${ratio === ex.ratio ? "primary" : ""}`}
              onClick={() =>
                setPersisted((prev) => ({
                  ...prev,
                  ratio: ex.ratio,
                  hasUsedExample: true,
                }))
              }
              style={{ fontSize: "13px" }}
            >
              {ex.name} ({ex.ratio}%)
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: "auto", marginBottom: "12px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--bg-surface-elevated)" }}>
              <th style={{ padding: "8px", border: "1px solid var(--border-light)", textAlign: "left" }}>
                H / H₀ còn lại
              </th>
              <th style={{ padding: "8px", border: "1px solid var(--border-light)", textAlign: "left" }}>
                Số chu kì (t/T)
              </th>
              <th style={{ padding: "8px", border: "1px solid var(--border-light)", textAlign: "left" }}>
                Tuổi ước tính
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              { r: 100, k: "0", label: "0 năm (mẫu đang sống)" },
              { r: 50, k: "1 T", label: "5 730 năm" },
              { r: 25, k: "2 T", label: "11 460 năm" },
              { r: 12.5, k: "3 T", label: "17 190 năm" },
            ].map((row) => (
              <tr
                key={row.r}
                style={{ backgroundColor: ratio === row.r ? "#dbeafe" : "inherit" }}
              >
                <td style={{ padding: "7px 8px", border: "1px solid var(--border-light)" }}>
                  {row.r}%
                </td>
                <td style={{ padding: "7px 8px", border: "1px solid var(--border-light)" }}>
                  {row.k}
                </td>
                <td style={{ padding: "7px 8px", border: "1px solid var(--border-light)" }}>
                  {row.label}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="physics-checklist">
        <p>
          <strong>Tiêu chí hoàn thành:</strong>
        </p>
        <ul>
          <li className={hasUsedExample ? "is-done" : ""}>
            Khảo sát ít nhất 1 mẫu thực tế hoặc đổi tỉ lệ H/H₀ {hasUsedExample ? "✓" : ""}
          </li>
          <li className={hasAnswered ? "is-done" : ""}>
            Trả lời đúng câu hỏi kiểm tra {hasAnswered ? "✓" : ""}
          </li>
        </ul>
      </div>

      <ChoiceCheck
        key={hydrated ? "c14-client" : "ssr"}
        initialSelected={hasAnswered ? 1 : null}
        initialChecked={hasAnswered}
        onResult={(correct) =>
          setPersisted((prev) => ({ ...prev, hasAnswered: correct }))
        }
        question="Một mẫu gỗ cổ có độ phóng xạ ¹⁴₆C bằng 25% (= 1/4) so với mẫu gỗ tươi cùng loại và cùng khối lượng. Biết T = 5 730 năm, tuổi gần đúng của mẫu gỗ cổ là bao nhiêu?"
        options={[
          "5 730 năm (1 chu kì bán rã).",
          "11 460 năm (2 chu kì bán rã).",
          "17 190 năm (3 chu kì bán rã).",
        ]}
        correctIndex={1}
        explanation="Ta có H / H₀ = 0,25 = 1/4 = 2^(−2), suy ra thời gian đã trôi qua bằng t = 2T = 2 × 5 730 = 11 460 năm."
      />
      <Sources
        links={[
          {
            label: "Radiocarbon dating – NOAA",
            url: "https://www.ncei.noaa.gov/news/what-is-radiocarbon-dating",
          },
        ]}
      />
    </Lab>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   5. RADIATION SAFETY — Biển cảnh báo Hình 23.8a,b · 3 nguyên tắc · Chiếu ngoài vs Nhiễm trong
   Lưu trữ bền vững: "b23-safety-v1"
   ══════════════════════════════════════════════════════════════════════════════ */

export const B23_SAFETY_STORAGE_KEY = "b23-safety-v1";

type Scenario = "lab" | "hospital" | "orphan_source";
type ShieldKey = "none" | "wood" | "aluminum" | "lead";
type ExposurePathway = "external" | "internal";

const SHIELD_OPT: Record<
  ShieldKey,
  { readonly label: string; readonly factor: number; readonly desc: string }
> = {
  none: { label: "Không che chắn", factor: 1.0, desc: "Không suy giảm" },
  wood: { label: "Kính / Gỗ 5 cm", factor: 0.6, desc: "Chặn α, giảm nhẹ β/γ (~40%)" },
  aluminum: { label: "Tấm nhôm 3 mm", factor: 0.25, desc: "Chặn α & β, giảm bức xạ tổng (~75%)" },
  lead: { label: "Tường chì dày / Bê tông", factor: 0.05, desc: "Suy giảm mạnh tia γ (~95%)" },
};

const SAFETY_BASE_RATE = 100; // đơn vị tương đối tại r = 1 m, t = 60 phút, không chắn

const SCENARIOS: Record<
  Scenario,
  {
    readonly title: string;
    readonly description: string;
    readonly recommendations: readonly string[];
  }
> = {
  lab: {
    title: "Phòng thí nghiệm nguồn kín",
    description:
      "Thao tác gần nguồn phóng xạ phát tia β và γ. Cần phối hợp đồng thời thời gian, khoảng cách và vách chì.",
    recommendations: [
      "Dùng kẹp dài thao tác từ xa thay vì cầm trực tiếp (tăng khoảng cách r)",
      "Đặt tấm kính chì / gạch chì chắn giữa nguồn và cơ thể",
      "Chuẩn bị thao tác thuần thục để rút ngắn tối đa thời gian ở gần nguồn",
      "Tuyệt đối không ăn uống, mỹ phẩm trong phòng phóng xạ (ngừa nhiễm xạ trong)",
    ],
  },
  hospital: {
    title: "Khu vực xạ trị / Y học hạt nhân",
    description:
      "Nhân viên y tế chăm sóc bệnh nhân vừa dùng dược chất phóng xạ ¹³¹I điều trị tuyến giáp.",
    recommendations: [
      "Giữ khoảng cách ≥ 2 m khi trao đổi không cần tiếp xúc gần",
      "Giới hạn thời gian mỗi lượt thăm khám và luân phiên ca trực",
      "Đeo liều kế cá nhân và găng tay bảo hộ khi xử lí chất thải sinh học",
      "Tuân thủ nghiêm vùng biển cảnh báo phóng xạ Hình 23.8a tại cửa buồng cách li",
    ],
  },
  orphan_source: {
    title: "Gặp vật kim loại lạ gắn biển 23.8b",
    description:
      "Phát hiện một hộp kim loại nặng rơi vãi ở bãi phế liệu có gắn biển tam giác đỏ Hình 23.8b.",
    recommendations: [
      "Rời xa ngay lập tức khỏi khu vực (tăng r tối đa theo hình người chạy trên biển 23.8b)",
      "Tuyệt đối không chạm tay, không cạy mở, không mang về nhà hay đập vỡ (tránh phát tán bụi gây nhiễm xạ trong)",
      "Cảnh báo người xung quanh đứng cách xa nhiều mét sau tường bê tông dày",
      "Báo ngay cho cơ quan chức năng / đường dây nóng ứng phó sự cố bức xạ hạt nhân",
    ],
  },
};

interface SafetyPersistedState {
  readonly distance: number;
  readonly timeMin: number;
  readonly shield: ShieldKey;
  readonly pathway: ExposurePathway;
  readonly scenario: Scenario;
  readonly triedScenarios: readonly Scenario[];
  readonly checkedIndices: readonly number[];
  readonly adjustedSliders: boolean;
  readonly hasAnswered: boolean;
}

const INITIAL_SAFETY_STATE: SafetyPersistedState = {
  distance: 1.0,
  timeMin: 60,
  shield: "none",
  pathway: "external",
  scenario: "lab",
  triedScenarios: ["lab"],
  checkedIndices: [],
  adjustedSliders: false,
  hasAnswered: false,
};

function isScenario(v: unknown): v is Scenario {
  return v === "lab" || v === "hospital" || v === "orphan_source";
}

function isShieldKey(v: unknown): v is ShieldKey {
  return v === "none" || v === "wood" || v === "aluminum" || v === "lead";
}

function parseSafetyState(
  raw: unknown,
  fallback: SafetyPersistedState
): SafetyPersistedState {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Partial<SafetyPersistedState>;
  const distance =
    typeof obj.distance === "number" && Number.isFinite(obj.distance)
      ? Math.max(0.5, Math.min(10, Math.round(obj.distance * 2) / 2))
      : fallback.distance;
  const timeMin =
    typeof obj.timeMin === "number" && Number.isFinite(obj.timeMin)
      ? Math.max(5, Math.min(240, Math.round(obj.timeMin / 5) * 5))
      : fallback.timeMin;
  const shield = isShieldKey(obj.shield) ? obj.shield : fallback.shield;
  const pathway: ExposurePathway =
    obj.pathway === "internal" ? "internal" : "external";
  const scenario = isScenario(obj.scenario) ? obj.scenario : fallback.scenario;
  const rawTried = Array.isArray(obj.triedScenarios)
    ? obj.triedScenarios.filter(isScenario)
    : [];
  const triedSet = new Set<Scenario>([scenario, ...rawTried]);
  const checkedIndices = Array.isArray(obj.checkedIndices)
    ? obj.checkedIndices.filter((i): i is number => Number.isInteger(i) && i >= 0 && i < 10)
    : [];
  return {
    distance,
    timeMin,
    shield,
    pathway,
    scenario,
    triedScenarios: Array.from(triedSet),
    checkedIndices,
    adjustedSliders: Boolean(obj.adjustedSliders),
    hasAnswered: Boolean(obj.hasAnswered),
  };
}

export function RadiationSafety({ onProgress }: ActivityProps) {
  const hydrated = useIsHydrated();
  const [persisted, setPersisted] = usePersistedLabState(
    B23_SAFETY_STORAGE_KEY,
    INITIAL_SAFETY_STATE,
    parseSafetyState
  );

  const {
    distance,
    timeMin,
    shield,
    pathway,
    scenario,
    triedScenarios,
    checkedIndices,
    adjustedSliders,
    hasAnswered,
  } = persisted;

  const rate = SAFETY_BASE_RATE / (distance * distance);
  const shieldedRate = rate * SHIELD_OPT[shield].factor;
  const totalDose = shieldedRate * (timeMin / 60);
  const doseColor =
    totalDose <= 10 ? "#16a34a" : totalDose <= 35 ? "#d97706" : "#dc2626";

  const info = SCENARIOS[scenario];
  const isDone = adjustedSliders && triedScenarios.length >= 2 && hasAnswered;
  useSyncLabProgress(isDone, onProgress);

  return (
    <Lab
      intro="Ảnh hưởng của tia phóng xạ, hai biển cảnh báo chuẩn SGK (Hình 23.8a & 23.8b) và ba nguyên tắc an toàn bức xạ: Giảm thời gian – Tăng khoảng cách – Che chắn (SGK tr. 111–113)."
      note="Liều hiển thị là chỉ số tương đối minh họa quy luật vật lí (tỉ lệ thuận với t, tỉ lệ nghịch với r² và giảm qua vách chắn), không thay thế phép đo liều thực tế bằng Sv."
    >
      <div className="physics-guide">
        <p>
          <strong>🛡️ Chu trình khám phá:</strong>
        </p>
        <ol>
          <li>
            <strong>Nhận diện biển báo:</strong> Phân biệt biển cảnh báo khu vực phóng xạ (Hình 23.8a) với biển nguồn phóng xạ nguy hiểm chết người (Hình 23.8b).
          </li>
          <li>
            <strong>Thử nghiệm 3 nguyên tắc:</strong> Kéo thanh trượt <strong>Thời gian – Khoảng cách (1/r²) – Vách che chắn</strong> để giảm liều chiếu, và so sánh <strong>Chiếu xạ ngoài vs Nhiễm xạ trong</strong>.
          </li>
          <li>
            <strong>Xử lí tình huống:</strong> Thử ít nhất 2 tình huống thực tế và trả lời câu hỏi kiểm tra.
          </li>
        </ol>
      </div>

      {/* Hai biển cảnh báo phóng xạ chuẩn SGK tr. 111–112: Hình 23.8a & Hình 23.8b */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        {/* Hình 23.8a */}
        <div
          style={{
            padding: "14px",
            backgroundColor: "#fefce8",
            border: "2px solid #eab308",
            borderRadius: "10px",
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <svg viewBox="0 0 96 88" width="76" height="70" style={{ flexShrink: 0 }} role="img" aria-label="Hình 23.8a Biển cảnh báo phóng xạ nền vàng">
            <title>Hình 23.8a — Biển cảnh báo khu vực có phóng xạ</title>
            <polygon
              points="48,6 90,80 6,80"
              fill="#facc15"
              stroke="#111827"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <circle cx="48" cy="54" r="5.5" fill="#111827" />
            {[0, 120, 240].map((deg) => (
              <g key={deg} transform={`rotate(${deg}, 48, 54)`}>
                <path
                  d="M 48 46 A 8 8 0 0 1 54.9 58 L 63.6 63 A 18 18 0 0 0 48 36 Z"
                  fill="#111827"
                />
              </g>
            ))}
          </svg>
          <div>
            <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "13.5px", color: "#713f12" }}>
              Hình 23.8a — Biển cảnh báo phóng xạ
            </p>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#422006", lineHeight: 1.5 }}>
              Nền vàng, cánh quạt 3 cánh đen: Cảnh báo phòng/khu vực/thiết bị có bức xạ ion hóa; không tự ý đi vào nếu không có nhiệm vụ và bảo hộ.
            </p>
          </div>
        </div>

        {/* Hình 23.8b */}
        <div
          style={{
            padding: "14px",
            backgroundColor: "#fef2f2",
            border: "2px solid #dc2626",
            borderRadius: "10px",
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <svg viewBox="0 0 96 88" width="76" height="70" style={{ flexShrink: 0 }} role="img" aria-label="Hình 23.8b Biển cảnh báo bổ sung nguồn phóng xạ nguy hiểm nền đỏ">
            <title>Hình 23.8b — Biển cảnh báo bổ sung nguồn phóng xạ nguy hiểm (ISO 21482)</title>
            <polygon
              points="48,6 90,80 6,80"
              fill="#ef4444"
              stroke="#111827"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Đỉnh trên: Nguồn phóng xạ phát tia */}
            <circle cx="48" cy="30" r="3.2" fill="#111827" />
            {[0, 120, 240].map((deg) => (
              <g key={deg} transform={`rotate(${deg}, 48, 30)`}>
                <path d="M 48 25.5 A 4.5 4.5 0 0 1 51.9 32.2 L 56.2 34.7 A 9.5 9.5 0 0 0 48 20.5 Z" fill="#111827" />
              </g>
            ))}
            <line x1="40" y1="39" x2="32" y2="45" stroke="#111827" strokeWidth="2" />
            <line x1="48" y1="41" x2="48" y2="48" stroke="#111827" strokeWidth="2" />
            <line x1="56" y1="39" x2="64" y2="45" stroke="#111827" strokeWidth="2" />

            {/* Góc trái dưới: Đầu lâu xương chéo */}
            <circle cx="30" cy="59" r="6.5" fill="#111827" />
            <circle cx="27.8" cy="58" r="1.4" fill="#ef4444" />
            <circle cx="32.2" cy="58" r="1.4" fill="#ef4444" />
            <line x1="22" y1="68" x2="38" y2="74" stroke="#111827" strokeWidth="2.4" />
            <line x1="38" y1="68" x2="22" y2="74" stroke="#111827" strokeWidth="2.4" />

            {/* Góc phải dưới: Người chạy rời xa nguồn + mũi tên */}
            <circle cx="63" cy="53" r="3.5" fill="#111827" />
            <path d="M 62 57 L 59 66 L 54 73 M 59 66 L 66 73 M 57 60 L 67 60" stroke="#111827" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M 69 73 L 80 73 M 76 69.5 L 80.5 73 L 76 76.5" stroke="#111827" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </svg>
          <div>
            <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "13.5px", color: "#7f1d1d" }}>
              Hình 23.8b — Biển bổ sung nguồn nguy hiểm
            </p>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#450a0a", lineHeight: 1.5 }}>
              Nền đỏ (tia phóng xạ + đầu lâu + người chạy ra xa): Gắn trực tiếp trên nguồn hoạt độ cao. Thông điệp: <strong>“Nguy hiểm chết người — Rời xa ngay lập tức!”</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Khu vực tương tác 3 thanh trượt/nút: Thời gian – Khoảng cách (~1/r²) – Vách che chắn */}
      <div
        style={{
          padding: "16px",
          backgroundColor: "var(--bg-surface-elevated)",
          borderRadius: "10px",
          border: "1px solid var(--border-light)",
          marginBottom: "18px",
        }}
      >
        <h4 style={{ margin: "0 0 12px", fontSize: "14.5px", fontWeight: 700 }}>
          🎛️ Thử nghiệm trực tiếp 3 nguyên tắc giảm liều chiếu xạ ngoài
        </h4>

        <div style={{ display: "grid", gap: "12px", marginBottom: "14px" }}>
          <label className="physics-field">
            <span>
              <strong>1. Thời gian tiếp xúc (t):</strong>{" "}
              <strong>{timeMin} phút</strong> (liều tỉ lệ thuận với thời gian)
            </span>
            <input
              type="range"
              min={5}
              max={240}
              step={5}
              value={timeMin}
              onChange={(e) =>
                setPersisted((prev) => ({
                  ...prev,
                  timeMin: Number(e.target.value),
                  adjustedSliders: true,
                }))
              }
            />
          </label>

          <label className="physics-field">
            <span>
              <strong>2. Khoảng cách tới nguồn (r):</strong>{" "}
              <strong>{distance.toFixed(1)} m</strong> (cường độ giảm nhanh theo{" "}
              <code>1/r²</code>)
            </span>
            <input
              type="range"
              min={0.5}
              max={10}
              step={0.5}
              value={distance}
              onChange={(e) =>
                setPersisted((prev) => ({
                  ...prev,
                  distance: Number(e.target.value),
                  adjustedSliders: true,
                }))
              }
            />
          </label>

          <div>
            <p style={{ fontSize: "13.5px", margin: "0 0 6px" }}>
              <strong>3. Vách che chắn:</strong> {SHIELD_OPT[shield].desc}
            </p>
            <div className="physics-controls" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {(Object.keys(SHIELD_OPT) as ShieldKey[]).map((sKey) => (
                <button
                  key={sKey}
                  type="button"
                  className={`physics-button ${shield === sKey ? "primary" : ""}`}
                  onClick={() =>
                    setPersisted((prev) => ({
                      ...prev,
                      shield: sKey,
                      adjustedSliders: true,
                    }))
                  }
                  style={{ fontSize: "12.5px" }}
                >
                  {SHIELD_OPT[sKey].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sơ đồ trực quan Nguồn – Vách chắn – Người */}
        <svg
          viewBox="0 0 420 116"
          role="img"
          aria-label="Sơ đồ trực quan khoảng cách và vách che chắn bức xạ"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid var(--border-light)",
            marginBottom: "12px",
          }}
        >
          <title>Minh họa suy giảm bức xạ theo khoảng cách r và vách che chắn</title>
          <circle cx="38" cy="54" r="16" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
          <text x="38" y="59" textAnchor="middle" fontSize="14" fill="#78350f">
            ☢
          </text>
          <text x="38" y="88" textAnchor="middle" fontSize="10" fontWeight="600" fill="#78350f">
            Nguồn
          </text>

          {shield !== "none" && (
            <>
              <rect
                x="104"
                y="14"
                width={shield === "lead" ? 20 : 12}
                height="80"
                rx="2"
                fill={shield === "lead" ? "#334155" : shield === "aluminum" ? "#94a3b8" : "#b45309"}
              />
              <text x="114" y="108" textAnchor="middle" fontSize="9.5" fill="#334155">
                {SHIELD_OPT[shield].label}
              </text>
            </>
          )}

          {(() => {
            const px = Number((138 + Math.min((distance - 0.5) * 26, 248)).toFixed(1));
            const beamStart = shield === "none" ? 54 : shield === "lead" ? 124 : 116;
            const strokeW = Number(
              Math.max(0.7, 3.2 * SHIELD_OPT[shield].factor * (1 / distance)).toFixed(2)
            );
            const strokeOp = Number(
              Math.max(0.18, Math.min(0.95, SHIELD_OPT[shield].factor / distance)).toFixed(2)
            );
            return (
              <>
                <line
                  x1={beamStart}
                  y1={54}
                  x2={px - 14}
                  y2={54}
                  stroke="#ef4444"
                  strokeWidth={strokeW}
                  opacity={strokeOp}
                  strokeDasharray="6 3"
                />
                <circle cx={px} cy={34} r="7.5" fill="#fde68a" stroke="#b45309" strokeWidth="1.4" />
                <rect x={px - 6.5} y={42} width="13" height="22" rx="3" fill="#2563eb" />
                <line x1={px - 4} y1={64} x2={px - 6} y2={78} stroke="#1d4ed8" strokeWidth="2.4" />
                <line x1={px + 4} y1={64} x2={px + 6} y2={78} stroke="#1d4ed8" strokeWidth="2.4" />
                <line x1="38" y1="96" x2={px} y2="96" stroke="#64748b" strokeWidth="1.2" />
                <text x={(38 + px) / 2} y="110" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">
                  r = {distance.toFixed(1)} m (giảm {(distance * distance).toFixed(2)} lần so với 1 m)
                </text>
              </>
            );
          })()}
        </svg>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "10px",
          }}
        >
          <div style={{ padding: "10px 12px", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Suất liều tại r = {distance.toFixed(1)} m</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{rate.toFixed(1)} đv/giờ</div>
          </div>
          <div style={{ padding: "10px 12px", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Sau vách chắn ({SHIELD_OPT[shield].label})</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{shieldedRate.toFixed(1)} đv/giờ</div>
          </div>
          <div style={{ padding: "10px 12px", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Tổng liều sau {timeMin} phút</div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: doseColor }}>
              {totalDose.toFixed(1)} đv
            </div>
          </div>
        </div>
      </div>

      {/* Phân biệt Chiếu xạ ngoài vs Nhiễm xạ trong */}
      <div
        style={{
          padding: "14px 16px",
          borderRadius: "10px",
          border: "1px solid var(--border-light)",
          backgroundColor: "var(--bg-surface)",
          marginBottom: "18px",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
          <strong style={{ fontSize: "14px" }}>So sánh cơ chế gây hại:</strong>
          <button
            type="button"
            className={`physics-button ${pathway === "external" ? "primary" : ""}`}
            onClick={() => setPersisted((prev) => ({ ...prev, pathway: "external" }))}
            style={{ fontSize: "13px" }}
          >
            📡 Chiếu xạ ngoài (nguồn bên ngoài)
          </button>
          <button
            type="button"
            className={`physics-button ${pathway === "internal" ? "primary" : ""}`}
            onClick={() => setPersisted((prev) => ({ ...prev, pathway: "internal" }))}
            style={{ fontSize: "13px" }}
          >
            🫁 Nhiễm xạ trong (hít bụi / nuốt nguồn α)
          </button>
        </div>

        {pathway === "external" ? (
          <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.6, color: "var(--text-primary)" }}>
            <strong>Chiếu xạ ngoài:</strong> Nguồn nằm ngoài cơ thể. Tia <strong>α</strong> chỉ đi vài cm không khí và bị lớp tế bào sừng ngoài da chặn lại nên ít nguy hiểm từ xa; trái lại tia <strong>γ</strong> (và tia <strong>β</strong> năng lượng cao) đâm xuyên sâu qua mô sống nên là mối nguy chính → Biện pháp trọng tâm: <strong>Giảm thời gian, tăng khoảng cách (1/r²) và che chắn bằng chì / bê tông dày</strong>.
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.6, color: "#7f1d1d", backgroundColor: "#fef2f2", padding: "10px 12px", borderRadius: "6px" }}>
            <strong>Nhiễm xạ trong (Cực kì nguy hiểm với nguồn phát tia α!):</strong> Khi hít phải khí/bụi phóng xạ (như Radon-222, Polonium-210) hoặc ăn uống thực phẩm nhiễm xạ, đồng vị phát tia <strong>α</strong> áp sát trực tiếp tế bào sống trong phổi và cơ quan nội tạng. Do tia <strong>α có khả năng ion hóa mạnh nhất</strong>, toàn bộ năng lượng hạt α trút hết vào lớp mô rất mỏng làm đứt gãy ADN kép nghiêm trọng! → Biện pháp bắt buộc: <strong>Khẩu trang chuyên dụng, quần áo bảo hộ kín, không ăn uống trong vùng phóng xạ và kiểm soát tẩy xạ</strong>.
          </p>
        )}
      </div>

      {/* Tình huống thực hành */}
      <div className="physics-controls" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {(Object.keys(SCENARIOS) as Scenario[]).map((s) => (
          <button
            key={s}
            type="button"
            className={`physics-button ${scenario === s ? "primary" : ""}`}
            onClick={() =>
              setPersisted((prev) => {
                const nextTried = prev.triedScenarios.includes(s)
                  ? prev.triedScenarios
                  : [...prev.triedScenarios, s];
                return {
                  ...prev,
                  scenario: s,
                  triedScenarios: nextTried,
                  checkedIndices: [],
                };
              })
            }
          >
            {SCENARIOS[s].title} {triedScenarios.includes(s) ? "✓" : ""}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "12px" }}>
        <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginBottom: "8px" }}>
          <strong>Tình huống:</strong> {info.description}
        </p>
        {info.recommendations.map((rec, i) => {
          const isChecked = checkedIndices.includes(i);
          return (
            <label
              key={rec}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px",
                marginBottom: "6px",
                backgroundColor: isChecked
                  ? "var(--semantic-success-light, #dcfce7)"
                  : "var(--bg-surface-elevated)",
                borderRadius: "6px",
                cursor: "pointer",
                border: `1px solid ${isChecked ? "#86efac" : "var(--border-light)"}`,
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() =>
                  setPersisted((prev) => ({
                    ...prev,
                    checkedIndices: prev.checkedIndices.includes(i)
                      ? prev.checkedIndices.filter((x) => x !== i)
                      : [...prev.checkedIndices, i],
                  }))
                }
              />
              <span style={{ fontSize: "13.5px" }}>{rec}</span>
            </label>
          );
        })}
      </div>

      <div className="physics-checklist">
        <p>
          <strong>Tiêu chí hoàn thành:</strong>
        </p>
        <ul>
          <li className={adjustedSliders ? "is-done" : ""}>
            Thử nghiệm thanh trượt Thời gian / Khoảng cách / Vách che chắn {adjustedSliders ? "✓" : ""}
          </li>
          <li className={triedScenarios.length >= 2 ? "is-done" : ""}>
            Khảo sát ít nhất 2 tình huống thực tế ({triedScenarios.length}/2) {triedScenarios.length >= 2 ? "✓" : ""}
          </li>
          <li className={hasAnswered ? "is-done" : ""}>
            Trả lời đúng câu hỏi kiểm tra {hasAnswered ? "✓" : ""}
          </li>
        </ul>
      </div>

      <ChoiceCheck
        key={hydrated ? "safety-client" : "ssr"}
        initialSelected={hasAnswered ? 1 : null}
        initialChecked={hasAnswered}
        onResult={(correct) =>
          setPersisted((prev) => ({ ...prev, hasAnswered: correct }))
        }
        question="Vì sao nguồn phát tia α đặt ngoài xa cơ thể ít gây nguy hiểm chiếu xạ ngoài, nhưng nếu hít phải bụi phóng xạ phát tia α vào phổi (nhiễm xạ trong) lại cực kì nguy hiểm?"
        options={[
          "Vì khi vào trong phổi, tia α tự biến đổi thành tia γ đâm xuyên ra ngoài cơ thể.",
          "Vì ở ngoài cơ thể tia α bị không khí và lớp sừng da chặn lại, còn khi nằm sát tế bào sống trong phổi, khả năng ion hóa cực mạnh của hạt α truyền toàn bộ năng lượng phá hủy trực tiếp tế bào và ADN.",
          "Vì chu kì bán rã của nguồn α giảm xuống 0 ngay khi tiếp xúc với hơi ẩm trong phổi.",
        ]}
        correctIndex={1}
        explanation="Tia α có quãng đi rất ngắn (vài cm không khí, không xuyên qua lớp da sừng) nhưng lại có khả năng ion hóa mạnh nhất. Khi bị hít hoặc nuốt vào trong cơ thể (nhiễm xạ trong), hạt α giải phóng toàn bộ năng lượng ngay tại các tế bào mô mềm lân cận, gây tổn thương sinh học nghiêm trọng."
      />
    </Lab>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   6. SAFETY PRINCIPLES — Tương tác định lượng 3 nguyên tắc (giữ export cho B23Lesson)
   Lưu trữ bền vững: "b23-safety-principles-v1"
   ══════════════════════════════════════════════════════════════════════════════ */

export const B23_SAFETY_PRINCIPLES_STORAGE_KEY = "b23-safety-principles-v1";

interface SafetyPrinciplesState {
  readonly distance: number;
  readonly timeMin: number;
  readonly shield: ShieldKey;
  readonly hasAnswered: boolean;
}

const INITIAL_PRINCIPLES_STATE: SafetyPrinciplesState = {
  distance: 1.0,
  timeMin: 60,
  shield: "none",
  hasAnswered: false,
};

function parsePrinciplesState(
  raw: unknown,
  fallback: SafetyPrinciplesState
): SafetyPrinciplesState {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Partial<SafetyPrinciplesState>;
  const distance =
    typeof obj.distance === "number" && Number.isFinite(obj.distance)
      ? Math.max(0.5, Math.min(10, Math.round(obj.distance * 2) / 2))
      : fallback.distance;
  const timeMin =
    typeof obj.timeMin === "number" && Number.isFinite(obj.timeMin)
      ? Math.max(5, Math.min(480, Math.round(obj.timeMin / 5) * 5))
      : fallback.timeMin;
  const shield = isShieldKey(obj.shield) ? obj.shield : fallback.shield;
  return {
    distance,
    timeMin,
    shield,
    hasAnswered: Boolean(obj.hasAnswered),
  };
}

export function SafetyPrinciples({ onProgress }: ActivityProps) {
  const hydrated = useIsHydrated();
  const [persisted, setPersisted] = usePersistedLabState(
    B23_SAFETY_PRINCIPLES_STORAGE_KEY,
    INITIAL_PRINCIPLES_STATE,
    parsePrinciplesState
  );
  const { distance, timeMin, shield, hasAnswered } = persisted;

  const rate = SAFETY_BASE_RATE / (distance * distance);
  const shieldedRate = rate * SHIELD_OPT[shield].factor;
  const totalDose = shieldedRate * (timeMin / 60);
  const doseColor = (v: number) =>
    v <= 5 ? "#16a34a" : v <= 25 ? "#d97706" : "#dc2626";
  const barWidth = (v: number, max: number) => `${Math.min(v / max, 1) * 100}%`;

  const isDone = totalDose <= 5 && hasAnswered;
  useSyncLabProgress(isDone, onProgress);

  return (
    <Lab
      intro="Thực hành phối hợp ba nguyên tắc an toàn phóng xạ (SGK tr. 112–113): KHOẢNG CÁCH — THỜI GIAN — CHE CHẮN để đưa tổng liều về mức thấp hợp lí (ALARA)."
      note="Đơn vị liều là quy ước tương đối để minh họa quy luật tỉ lệ nghịch bình phương khoảng cách (1/r²), tỉ lệ thuận thời gian (t) và hệ số suy giảm qua vách chắn."
    >
      <div style={{ display: "grid", gap: "14px", marginBottom: "16px" }}>
        <label className="physics-field">
          <span>
            <strong>1. Khoảng cách</strong> — r ={" "}
            <strong>{distance.toFixed(1)} m</strong> (cường độ giảm theo 1/r²)
          </span>
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.5}
            value={distance}
            onChange={(e) =>
              setPersisted((prev) => ({ ...prev, distance: Number(e.target.value) }))
            }
          />
        </label>
        <label className="physics-field">
          <span>
            <strong>2. Thời gian</strong> — t = <strong>{timeMin} phút</strong>{" "}
            (liều tổng tỉ lệ thuận với thời gian phơi nhiễm)
          </span>
          <input
            type="range"
            min={5}
            max={480}
            step={5}
            value={timeMin}
            onChange={(e) =>
              setPersisted((prev) => ({ ...prev, timeMin: Number(e.target.value) }))
            }
          />
        </label>
        <div>
          <p style={{ fontSize: "14px", marginBottom: "8px" }}>
            <strong>3. Che chắn</strong> — chọn vật liệu:
          </p>
          <div className="physics-controls" style={{ flexWrap: "wrap" }}>
            {(Object.keys(SHIELD_OPT) as ShieldKey[]).map((s) => (
              <button
                key={s}
                type="button"
                className={`physics-button ${shield === s ? "primary" : ""}`}
                onClick={() => setPersisted((prev) => ({ ...prev, shield: s }))}
                style={{ fontSize: "13px" }}
              >
                {SHIELD_OPT[s].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "12px",
        }}
      >
        {[
          { label: "Cường độ tại vị trí r", value: rate.toFixed(1), unit: "đv/giờ", max: 100 },
          {
            label: `Sau che chắn (${SHIELD_OPT[shield].label})`,
            value: shieldedRate.toFixed(1),
            unit: "đv/giờ",
            max: 100,
          },
          {
            label: `Liều tổng trong ${timeMin} phút`,
            value: totalDose.toFixed(1),
            unit: "đv",
            max: 400,
          },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              padding: "12px",
              backgroundColor: "var(--bg-surface-elevated)",
              borderRadius: "8px",
            }}
          >
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
              {m.label}
            </p>
            <p
              style={{
                fontSize: "1.45rem",
                fontWeight: 700,
                margin: "6px 0",
                color: doseColor(m.max === 400 ? totalDose : Number(m.value)),
              }}
            >
              {m.value}{" "}
              <span style={{ fontSize: "0.8rem", fontWeight: 400 }}>{m.unit}</span>
            </p>
            <div
              style={{
                height: "8px",
                backgroundColor: "#e5e7eb",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: barWidth(Number(m.value), m.max),
                  backgroundColor: doseColor(
                    m.max === 400 ? totalDose : Number(m.value)
                  ),
                  transition: "width .3s",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: "12px",
          backgroundColor: "#f1f5f9",
          borderRadius: "8px",
          marginTop: "12px",
          fontSize: "13px",
          color: "#334155",
          lineHeight: 1.8,
        }}
      >
        <div>
          Cường độ theo khoảng cách: 100 ÷ {distance.toFixed(1)}² ={" "}
          <strong>{rate.toFixed(1)}</strong> đv/giờ
        </div>
        <div>
          Sau vách chắn: {rate.toFixed(1)} × {SHIELD_OPT[shield].factor} ={" "}
          <strong>{shieldedRate.toFixed(1)}</strong> đv/giờ
        </div>
        <div>
          Liều tổng: {shieldedRate.toFixed(1)} × {(timeMin / 60).toFixed(2)} giờ ={" "}
          <strong style={{ color: doseColor(totalDose) }}>
            {totalDose.toFixed(1)}
          </strong>{" "}
          đv
        </div>
      </div>

      <div className="physics-checklist">
        <p>
          <strong>Tiêu chí hoàn thành:</strong>
        </p>
        <ul>
          <li className={totalDose <= 5 ? "is-done" : ""}>
            Điều chỉnh 3 yếu tố để liều tổng ≤ 5 đv {totalDose <= 5 ? "✓" : ""}
          </li>
          <li className={hasAnswered ? "is-done" : ""}>
            Trả lời đúng câu hỏi kiểm tra {hasAnswered ? "✓" : ""}
          </li>
        </ul>
      </div>

      <ChoiceCheck
        key={hydrated ? "safety-principles-client" : "ssr"}
        initialSelected={hasAnswered ? 1 : null}
        initialChecked={hasAnswered}
        onResult={(correct) =>
          setPersisted((prev) => ({ ...prev, hasAnswered: correct }))
        }
        question="Một kĩ thuật viên đứng cách nguồn điểm 2 m trong 4 giờ. Nếu chỉ chọn một thay đổi dưới đây, cách nào làm giảm tổng liều chiếu xạ NHIỀU NHẤT?"
        options={[
          "Chia nhỏ ca làm việc nhưng tổng thời gian đứng cách nguồn 2 m vẫn đủ 4 giờ.",
          "Lùi ra xa để khoảng cách tới nguồn tăng từ 2 m lên 6 m (vẫn trong 4 giờ).",
          "Mặc thêm một chiếc áo khoác vải thông thường.",
        ]}
        correctIndex={1}
        explanation="Với nguồn điểm, cường độ chùm tia giảm theo 1/r². Tăng khoảng cách từ 2 m lên 6 m (gấp 3 lần) làm cường độ và tổng liều giảm 3² = 9 lần. Chia nhỏ thời gian nhưng tổng thời gian phơi vẫn 4 giờ thì tổng liều không đổi; áo vải thường hầu như không cản được tia γ."
      />
    </Lab>
  );
}
