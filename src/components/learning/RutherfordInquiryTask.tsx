"use client";

/**
 * RutherfordInquiryTask — nhiệm vụ điều tra cho học sinh lớp 12
 *
 * Quy trình 4 bước: dự đoán → lưu hai lượt đo → so sánh → giải thích.
 * Component này KHÔNG tự tính vật lí: nó nhận (b, E, θ) từ simulator để
 * số liệu hiển thị luôn trùng với quỹ đạo và bảng số liệu đang xem.
 * Lưu trữ bền vững vào localStorage ("b21-rutherford-v3-state-v1") qua useSyncExternalStore.
 */

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import {
  evaluateRutherfordInquiry,
  PREDICTION_LABELS,
  type InquiryRun,
  type RunSlot,
  type RutherfordPrediction,
} from "@/simulations-v3/apparatus/rutherford/inquiry";
import {
  parseRutherfordV3State,
  RUTHERFORD_V3_STORAGE_KEY,
  type RutherfordV3PersistedState,
} from "@/simulations-v3/apparatus/rutherford/parts";

export type { InquiryRun, RutherfordPrediction };

export interface RutherfordInquiryTaskProps {
  /** Trạng thái hiện tại của simulator (đọc từ cùng nguồn với cảnh 3D). */
  readonly current: InquiryRun | null;
  /** Báo trạng thái hoàn thành đủ nhiệm vụ điều tra lên mô phỏng / bài học. */
  readonly onCompleteChange?: (complete: boolean) => void;
}

const EMPTY_RAW = () => "";

export function subscribeRutherfordV3Storage(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("b21-rutherford-v3-changed", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("b21-rutherford-v3-changed", listener);
  };
}

export function getRutherfordV3RawSnapshot(): string {
  try {
    return window.localStorage.getItem(RUTHERFORD_V3_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeRutherfordV3State(
  updater: (prev: RutherfordV3PersistedState) => RutherfordV3PersistedState,
): RutherfordV3PersistedState {
  const current =
    typeof window !== "undefined"
      ? parseRutherfordV3State(getRutherfordV3RawSnapshot())
      : parseRutherfordV3State("");
  const next = updater(current);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(RUTHERFORD_V3_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("b21-rutherford-v3-changed"));
    } catch {
      // Bỏ qua lỗi bộ nhớ trình duyệt đầy hoặc chế độ ẩn danh chặn lưu
    }
  }
  return next;
}

const cardStyle: React.CSSProperties = {
  padding: "16px",
  background: "#ffffff",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const optionStyle = (active: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px",
  background: active ? "#dbeafe" : "#f9fafb",
  border: "1px solid",
  borderColor: active ? "#2563eb" : "#d1d5db",
  borderRadius: "6px",
  cursor: "pointer",
  minHeight: "44px",
  fontSize: "14px",
});

function RunCard({
  slot,
  title,
  hint,
  run,
  needsRemeasure,
  onCapture,
  onClear,
}: {
  slot: RunSlot;
  title: string;
  hint: string;
  run: InquiryRun | null;
  needsRemeasure: boolean;
  onCapture: () => void;
  onClear: () => void;
}) {
  const bg = needsRemeasure ? "#fffbeb" : run ? "#ecfdf5" : "#f9fafb";
  const border = needsRemeasure ? "#f59e0b" : run ? "#10b981" : "#d1d5db";

  return (
    <div
      data-run-slot={slot}
      data-needs-remeasure={needsRemeasure ? "true" : "false"}
      style={{
        padding: "12px",
        background: bg,
        borderRadius: "6px",
        border: "1px solid",
        borderColor: border,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600 }}>{title}</div>
        {needsRemeasure && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: "4px",
              background: "#fef3c7",
              color: "#b45309",
              border: "1px solid #f59e0b",
            }}
          >
            Cần đo lại
          </span>
        )}
      </div>
      <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "8px" }}>{hint}</div>
      {run ? (
        <div style={{ fontSize: "12px", lineHeight: 1.8 }}>
          b = {run.b} fm
          <br />
          E = {run.e} MeV
          <br />
          <strong>θ = {run.theta.toFixed(2)}°</strong>
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={onCapture}
              style={{
                fontSize: "11px",
                padding: "6px 10px",
                border: needsRemeasure ? "1px solid #d97706" : "1px solid #d1d5db",
                borderRadius: "4px",
                background: needsRemeasure ? "#f59e0b" : "#fff",
                color: needsRemeasure ? "#fff" : "#111827",
                fontWeight: needsRemeasure ? 600 : 400,
                cursor: "pointer",
                minHeight: "32px",
              }}
            >
              Ghi đè
            </button>
            <button
              type="button"
              onClick={onClear}
              style={{ fontSize: "11px", padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: "4px", background: "#fff", cursor: "pointer", minHeight: "32px" }}
            >
              Xóa
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onCapture}
          style={{ fontSize: "12px", padding: "8px 12px", border: "1px solid #2563eb", borderRadius: "4px", background: "#2563eb", color: "#fff", cursor: "pointer", minHeight: "36px" }}
        >
          Lưu lượt này
        </button>
      )}
    </div>
  );
}

export function RutherfordInquiryTask({ current, onCompleteChange }: RutherfordInquiryTaskProps) {
  const storedRaw = useSyncExternalStore(
    subscribeRutherfordV3Storage,
    getRutherfordV3RawSnapshot,
    EMPTY_RAW,
  );
  const persisted = useMemo(() => parseRutherfordV3State(storedRaw), [storedRaw]);
  const {
    prediction,
    run1,
    run2,
    lastCapturedSlot,
    conclusion,
    countPos1 = null,
    countPos2 = null,
  } = persisted;

  const evaluation = useMemo(
    () =>
      evaluateRutherfordInquiry({
        prediction,
        run1,
        run2,
        lastCapturedSlot,
        conclusion,
      }),
    [prediction, run1, run2, lastCapturedSlot, conclusion],
  );

  // Bảo vệ tiến độ khi chuyển tab/pha hoặc F5 tải lại trang:
  // Không bao giờ tự bắn onCompleteChange(false) lúc mới mount khi chưa từng hoàn thành.
  const hadCompleteRef = useRef(evaluation.isComplete);
  useEffect(() => {
    if (evaluation.isComplete || hadCompleteRef.current) {
      onCompleteChange?.(evaluation.isComplete);
    }
    hadCompleteRef.current = evaluation.isComplete;
  }, [evaluation.isComplete, onCompleteChange]);

  const handlePredictionChange = useCallback(
    (nextPrediction: RutherfordPrediction) => {
      writeRutherfordV3State((prev) => ({
        ...prev,
        prediction: nextPrediction,
      }));
    },
    [],
  );

  function captureSlot(slot: RunSlot) {
    if (!current) return;
    writeRutherfordV3State((prev) => ({
      ...prev,
      run1: slot === 1 ? current : prev.run1,
      run2: slot === 2 ? current : prev.run2,
      lastCapturedSlot: slot,
    }));
  }

  function clearSlot(slot: RunSlot) {
    writeRutherfordV3State((prev) => {
      if (slot === 1) {
        return {
          ...prev,
          run1: null,
          lastCapturedSlot: prev.run2 ? 2 : null,
        };
      }
      return {
        ...prev,
        run2: null,
        lastCapturedSlot: prev.run1 ? 1 : null,
      };
    });
  }

  return (
    <div
      style={{
        padding: "20px",
        background: "var(--bg-surface-elevated, #f8fafc)",
        borderRadius: "12px",
        marginTop: "8px",
        border: "1px solid #e5e7eb",
      }}
    >
      <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "6px" }}>
        Nhiệm vụ điều tra: Từ tần suất đốm sáng đến tham số va chạm b
      </h3>
      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "14px" }}>
        Thực hiện đối chiếu từ dấu hiệu trên màn <strong>S</strong> (Lớp 1) sang <strong>Mô hình giải thích</strong> (Lớp 2). Dữ liệu dự đoán, lượt đo và lời giải thích được lưu trực tiếp trên trình duyệt.
      </p>

      {/* Bước đối chiếu thực nghiệm: Hai khoảng đếm dài bằng nhau ở vị trí (1) và (2) */}
      <div
        style={{
          ...cardStyle,
          marginBottom: "16px",
          background: "#f0fdf4",
          borderColor: "#86efac",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: "14px", color: "#14532d", marginBottom: "4px" }}>
          Dữ kiện quan sát trên màn S: Trong hai khoảng đếm dài bằng nhau (Δt = 10 s, cùng nguồn R) ở vị trí (1) và (2), em ghi được bao nhiêu đốm ở mỗi vị trí?
        </div>
        <div style={{ fontSize: "13.5px", color: "#166534", lineHeight: 1.6 }}>
          <span>
            <strong>Vị trí (1) (0°):</strong>{" "}
            {countPos1 !== null ? `${countPos1.toLocaleString("vi-VN")} đốm / 10 s` : "Chưa bấm đếm ở khung kính M phía trên"}
          </span>{" "}
          ·{" "}
          <span>
            <strong>Vị trí (2) (140° &gt; 90°):</strong>{" "}
            {countPos2 !== null ? `${countPos2.toLocaleString("vi-VN")} đốm / 10 s` : "Chưa bấm đếm ở khung kính M phía trên"}
          </span>{" "}
          <span style={{ color: "#374151" }}>
            (Xu hướng thống kê nhiều lượt: tỉ số tần suất tại (2) so với (1) cỡ <code>10⁻⁴</code>).
          </span>
        </div>
      </div>

      {/* Bước 1 — Dự đoán */}
      <div style={{ ...cardStyle, marginBottom: "16px" }}>
        <div style={{ fontWeight: 500, marginBottom: "8px" }}>1. Dự đoán trên lớp Mô hình giải thích</div>
        <p style={{ fontSize: "14px", marginBottom: "12px", lineHeight: 1.7 }}>
          Giữ nguyên năng lượng hạt alpha. Khi hạt tới đi <strong>xa tâm hạt nhân hơn</strong> (b tăng),
          góc lệch sẽ thay đổi thế nào?
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {(
            [
              { value: "increase", label: PREDICTION_LABELS.increase },
              { value: "decrease", label: PREDICTION_LABELS.decrease },
              { value: "unchanged", label: PREDICTION_LABELS.unchanged },
            ] as const
          ).map((opt) => (
            <label key={opt.value} style={optionStyle(prediction === opt.value)}>
              <input
                type="radio"
                name="rutherford-prediction"
                value={opt.value}
                checked={prediction === opt.value}
                onChange={() => handlePredictionChange(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
        {evaluation.hasPrediction && evaluation.bothRuns && (
          <p style={{ fontSize: "12px", color: "#4b5563", marginTop: "10px", marginBottom: 0 }}>
            Dự đoán ban đầu đã lưu: <strong>{PREDICTION_LABELS[prediction as RutherfordPrediction]}</strong>. Em hãy giữ nguyên dự đoán ban đầu (kể cả khi trái với số đo) để đối chiếu khoa học.
          </p>
        )}
      </div>

      {/* Bước 2 — Hai lượt đo */}
      <div style={{ ...cardStyle, marginBottom: "16px" }}>
        <div style={{ fontWeight: 500, marginBottom: "8px" }}>2. Lấy hai lượt khảo sát cùng E, khác b</div>
        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px", lineHeight: 1.6 }}>
          Kéo thanh trượt <strong>b</strong> và giữ cố định <strong>E</strong> bên trên để lưu hai lượt ở{" "}
          <strong>cùng một giá trị E</strong> nhưng <strong>khác giá trị b</strong> (ví dụ khoảng 10 fm và 60 fm, lưu theo thứ tự nào cũng được).
        </p>
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <RunCard
            slot={1}
            title="Lượt đo 1"
            hint="Chọn một giá trị b bất kỳ rồi lưu"
            run={run1}
            needsRemeasure={evaluation.remeasureSlot === 1}
            onCapture={() => captureSlot(1)}
            onClear={() => clearSlot(1)}
          />
          <RunCard
            slot={2}
            title="Lượt đo 2"
            hint="Đổi sang giá trị b khác (cùng E) rồi lưu"
            run={run2}
            needsRemeasure={evaluation.remeasureSlot === 2}
            onCapture={() => captureSlot(2)}
            onClear={() => clearSlot(2)}
          />
        </div>
        {current ? (
          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px", marginBottom: 0 }}>
            Đang xem: b = {current.b} fm, E = {current.e} MeV → θ = {current.theta.toFixed(2)}°
          </p>
        ) : (
          <p style={{ fontSize: "12px", color: "#b91c1c", marginTop: "12px", marginBottom: 0 }}>
            Tham số hiện tại không hợp lệ nên chưa lấy được số đo.
          </p>
        )}

        {evaluation.remeasureGuidance && (
          <div
            role="alert"
            data-rutherford-invalid-runs={evaluation.invalidReason ?? ""}
            style={{
              marginTop: "12px",
              padding: "12px 14px",
              background: "#fffbeb",
              border: "1px solid #f59e0b",
              borderRadius: "6px",
              color: "#92400e",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            <strong>Cần đo lại Lượt đo {evaluation.remeasureSlot}:</strong> {evaluation.remeasureGuidance}
          </div>
        )}
      </div>

      {/* Bước 3 — So sánh (chỉ mở khi hai lượt đo hợp lệ: cùng E, khác b) */}
      {evaluation.validComparison && run1 && run2 && evaluation.smallerBRun && evaluation.largerBRun && (
        <div
          style={{
            marginBottom: "16px",
            padding: "16px",
            background: "#fef3c7",
            borderRadius: "8px",
            border: "1px solid #fbbf24",
          }}
        >
          <div style={{ fontWeight: 500, marginBottom: "8px" }}>3. So sánh hai lượt cùng động năng E</div>
          <div style={{ fontSize: "14px", lineHeight: 1.85 }}>
            <div>
              Đã ghi nhận: Lượt đo 1 (<strong>b = {run1.b} fm</strong>, E = {run1.e} MeV → <strong>θ = {run1.theta.toFixed(2)}°</strong>) ·{" "}
              Lượt đo 2 (<strong>b = {run2.b} fm</strong>, E = {run2.e} MeV → <strong>θ = {run2.theta.toFixed(2)}°</strong>).
            </div>
            <div style={{ marginTop: "4px" }}>
              Đối chiếu khi <strong>b tăng</strong> (cùng E = {evaluation.smallerBRun.e} MeV):{" "}
              b từ <strong>{evaluation.smallerBRun.b} fm</strong> → <strong>{evaluation.largerBRun.b} fm</strong> thì{" "}
              θ từ <strong>{evaluation.smallerBRun.theta.toFixed(2)}°</strong> → <strong>{evaluation.largerBRun.theta.toFixed(2)}°</strong>.
            </div>
            <div style={{ marginTop: "4px", fontWeight: 600 }}>
              {evaluation.verdict === "decrease" && (
                <span style={{ color: "#047857" }}>
                  → Góc lệch giảm khi b tăng (ngược lại: khi b giảm, hạt đi gần tâm hạt nhân hơn thì góc lệch tăng).
                </span>
              )}
              {evaluation.verdict === "increase" && (
                <span style={{ color: "#b91c1c" }}>→ Góc lệch tăng khi b tăng.</span>
              )}
              {evaluation.verdict === "unchanged" && (
                <span>→ Góc lệch gần như không đổi khi b thay đổi.</span>
              )}
            </div>
          </div>

          {evaluation.hasPrediction ? (
            <p
              style={{
                fontSize: "13px",
                marginTop: "10px",
                marginBottom: 0,
                color: evaluation.matchesPrediction ? "#047857" : "#92400e",
              }}
            >
              {evaluation.matchesPrediction
                ? `Dự đoán ban đầu của em ("${PREDICTION_LABELS[prediction as RutherfordPrediction]}") khớp với số liệu hai lượt đo.`
                : `Kết quả đo trái với dự đoán ban đầu của em ("${PREDICTION_LABELS[prediction as RutherfordPrediction]}"). Em giữ nguyên dự đoán ban đầu và giải thích nguyên nhân vật lí ở Bước 4.`}
            </p>
          ) : (
            <p style={{ fontSize: "13px", marginTop: "10px", marginBottom: 0, color: "#b45309" }}>
              Em chưa chọn dự đoán ở Bước 1. Hãy chọn dự đoán của em trước khi hoàn thành nhiệm vụ.
            </p>
          )}
        </div>
      )}

      {/* Bước 4 — Giải thích */}
      {evaluation.validComparison && (
        <div style={{ ...cardStyle, marginBottom: "16px" }}>
          <div style={{ fontWeight: 500, marginBottom: "8px" }}>4. Giải thích dựa trên bằng chứng và Mô hình giải thích</div>
          <p style={{ fontSize: "14px", marginBottom: "10px", lineHeight: 1.7 }}>
            Dựa vào sự chênh lệch số đốm sáng giữa vị trí <strong>(1)</strong> và <strong>(2)</strong> cùng hai lượt khảo sát{" "}
            <strong>b</strong> ở trên (Lớp Mô hình giải thích), em lí giải thế nào về những lần hiếm hoi hạt α lệch góc lớn và đối chiếu lại với dự đoán ban đầu của em?
          </p>
          <textarea
            value={conclusion}
            onChange={(e) => {
              const nextConclusion = e.target.value;
              writeRutherfordV3State((prev) => ({
                ...prev,
                conclusion: nextConclusion,
              }));
            }}
            placeholder="Ở vị trí (2) vẫn có đốm sáng nhưng rất hiếm (~10⁻⁴ lần vị trí (1)); kết hợp hai lượt đo cho thấy chỉ khi b rất nhỏ (hạt α tiến sát hạt nhân mang điện dương tập trung ở vùng rất nhỏ) lực đẩy tĩnh điện mới đủ mạnh làm hạt lệch góc lớn…"
            aria-label="Kết luận của học sinh"
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "12px",
              fontSize: "14px",
              fontFamily: "inherit",
              lineHeight: 1.6,
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              resize: "vertical",
            }}
          />
          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px", marginBottom: 0 }}>
            Gợi ý kiểm tra lại: lực đẩy tĩnh điện Coulomb ~ 1/r²; hạt nhân mang điện dương tập trung ở vùng rất nhỏ (~10⁻⁴ kích thước nguyên tử) nên chỉ một tỉ lệ rất ít hạt α đi sát tâm mới lệch mạnh.
          </p>
        </div>
      )}

      {/* Trạng thái hoàn thành nhiệm vụ */}
      <div
        role="status"
        data-rutherford-task-status={evaluation.isComplete ? "complete" : "incomplete"}
        style={{
          padding: "12px 16px",
          borderRadius: "8px",
          background: evaluation.isComplete ? "#ecfdf5" : "#ffffff",
          border: "1px solid",
          borderColor: evaluation.isComplete ? "#10b981" : "#e5e7eb",
          fontSize: "13px",
        }}
      >
        <div style={{ fontWeight: 600, color: evaluation.isComplete ? "#047857" : "#374151", marginBottom: "6px" }}>
          {evaluation.isComplete
            ? "✓ Đã hoàn thành nhiệm vụ điều tra tán xạ Rutherford"
            : "Tiến độ hoàn thành nhiệm vụ điều tra:"}
        </div>
        <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.7, color: "#4b5563" }}>
          <li>
            {evaluation.hasPrediction ? "✓" : "○"} Chọn dự đoán ban đầu ở Bước 1
          </li>
          <li>
            {evaluation.validComparison
              ? "✓ Đã lưu 2 lượt đo hợp lệ (cùng E, khác b)"
              : evaluation.savedRunCount === 0
              ? "○ Lưu 2 lượt đo cùng E nhưng khác b (hiện 0/2 lượt)"
              : evaluation.savedRunCount === 1
              ? "○ Lưu thêm 1 lượt đo nữa ở cùng E nhưng khác b (hiện 1/2 lượt)"
              : `○ Đo lại Lượt đo ${evaluation.remeasureSlot} để hai lượt có cùng E và khác b`}
          </li>
          <li>
            {evaluation.hasExplanation ? "✓" : "○"} Viết lời giải thích vật lí ở Bước 4
          </li>
        </ul>
      </div>
    </div>
  );
}

export default RutherfordInquiryTask;
