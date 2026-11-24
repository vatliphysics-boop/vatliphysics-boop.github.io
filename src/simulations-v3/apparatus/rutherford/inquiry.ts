/**
 * Pure state and evaluation logic for the Rutherford V3 student inquiry task.
 * Kept free of React/JSX and Three.js so it can be unit-tested directly in Node.
 */

export type RutherfordPrediction = "increase" | "decrease" | "unchanged";

export interface InquiryRun {
  readonly b: number;
  readonly e: number;
  readonly theta: number;
}

export type RunSlot = 1 | 2;

export type InvalidComparisonReason = "different_energy" | "same_impact" | "both";

export interface RutherfordInquiryState {
  readonly prediction: RutherfordPrediction | "";
  readonly run1: InquiryRun | null;
  readonly run2: InquiryRun | null;
  /** Lượt vừa được lưu gần nhất để chỉ rõ lượt cần đo lại khi hai lượt không hợp lệ */
  readonly lastCapturedSlot: RunSlot | null;
  readonly conclusion: string;
}

export interface RutherfordInquiryEvaluation {
  readonly hasPrediction: boolean;
  readonly savedRunCount: 0 | 1 | 2;
  readonly bothRuns: boolean;
  readonly sameEnergy: boolean;
  readonly differentB: boolean;
  readonly validComparison: boolean;
  readonly invalidReason: InvalidComparisonReason | null;
  readonly remeasureSlot: RunSlot | null;
  readonly remeasureGuidance: string | null;
  readonly smallerBRun: InquiryRun | null;
  readonly largerBRun: InquiryRun | null;
  /** Kết luận thực nghiệm theo đúng chiều câu hỏi dự đoán: khi b tăng (cùng E), góc lệch thay đổi thế nào */
  readonly verdict: RutherfordPrediction | null;
  readonly matchesPrediction: boolean | null;
  readonly hasExplanation: boolean;
  readonly isComplete: boolean;
}

const EPSILON = 1e-9;

export const PREDICTION_LABELS: Record<RutherfordPrediction, string> = {
  increase: "Góc lệch tăng",
  decrease: "Góc lệch giảm",
  unchanged: "Không đổi",
};

/**
 * Evaluate the 4-step Rutherford inquiry workflow:
 * 1. Initial prediction (preserved even if contradicted by measurements)
 * 2. Two controlled runs with equal energy E and distinct impact parameter b
 * 3. Order-independent directional comparison (when b increases)
 * 4. Student's written physical explanation
 */
export function evaluateRutherfordInquiry(
  state: RutherfordInquiryState,
): RutherfordInquiryEvaluation {
  const hasPrediction =
    state.prediction === "increase" ||
    state.prediction === "decrease" ||
    state.prediction === "unchanged";

  const savedRunCount = ((state.run1 ? 1 : 0) + (state.run2 ? 1 : 0)) as 0 | 1 | 2;
  const bothRuns = state.run1 !== null && state.run2 !== null;

  const sameEnergy =
    bothRuns && Math.abs(state.run1!.e - state.run2!.e) < EPSILON;
  const differentB =
    bothRuns && Math.abs(state.run1!.b - state.run2!.b) >= EPSILON;
  const validComparison = sameEnergy && differentB;

  let invalidReason: InvalidComparisonReason | null = null;
  let remeasureSlot: RunSlot | null = null;
  let remeasureGuidance: string | null = null;

  if (bothRuns && !validComparison) {
    const run1 = state.run1!;
    const run2 = state.run2!;
    remeasureSlot = state.lastCapturedSlot === 1 ? 1 : 2;
    const anchorSlot: RunSlot = remeasureSlot === 1 ? 2 : 1;
    const anchorRun = anchorSlot === 1 ? run1 : run2;
    const remeasureRun = remeasureSlot === 1 ? run1 : run2;

    if (!sameEnergy && !differentB) {
      invalidReason = "both";
      remeasureGuidance =
        `Hai lượt đo đang vừa khác động năng (Lượt đo 1: E = ${run1.e} MeV, Lượt đo 2: E = ${run2.e} MeV) ` +
        `vừa trùng tham số va chạm (b = ${run1.b} fm). Cần đo lại Lượt đo ${remeasureSlot}: hãy chỉnh E = ${anchorRun.e} MeV ` +
        `và chọn b khác ${anchorRun.b} fm, sau đó bấm "Ghi đè" ở Lượt đo ${remeasureSlot}.`;
    } else if (!sameEnergy) {
      invalidReason = "different_energy";
      remeasureGuidance =
        `Hai lượt đo đang khác động năng (Lượt đo 1: E = ${run1.e} MeV, Lượt đo 2: E = ${run2.e} MeV). ` +
        `Để kiểm soát biến năng lượng, cần đo lại Lượt đo ${remeasureSlot} ở cùng E = ${anchorRun.e} MeV ` +
        `(với b khác ${anchorRun.b} fm) rồi bấm "Ghi đè" ở Lượt đo ${remeasureSlot} — hoặc nếu muốn khảo sát ở ` +
        `E = ${remeasureRun.e} MeV thì chỉnh b khác ${remeasureRun.b} fm và bấm "Ghi đè" ở Lượt đo ${anchorSlot}.`;
    } else {
      invalidReason = "same_impact";
      remeasureGuidance =
        `Hai lượt đo đang trùng tham số va chạm (b = ${run1.b} fm ở cùng E = ${run1.e} MeV). ` +
        `Cần đo lại Lượt đo ${remeasureSlot}: hãy kéo thanh trượt b sang giá trị khác ${anchorRun.b} fm ` +
        `(giữ nguyên E = ${anchorRun.e} MeV) rồi bấm "Ghi đè" ở Lượt đo ${remeasureSlot}.`;
    }
  }

  let smallerBRun: InquiryRun | null = null;
  let largerBRun: InquiryRun | null = null;
  let verdict: RutherfordPrediction | null = null;

  if (validComparison) {
    const run1 = state.run1!;
    const run2 = state.run2!;
    smallerBRun = run1.b < run2.b ? run1 : run2;
    largerBRun = run1.b < run2.b ? run2 : run1;

    const deltaThetaOnBIncrease = largerBRun.theta - smallerBRun.theta;
    if (Math.abs(deltaThetaOnBIncrease) < 0.01) {
      verdict = "unchanged";
    } else if (deltaThetaOnBIncrease < 0) {
      verdict = "decrease";
    } else {
      verdict = "increase";
    }
  }

  const matchesPrediction =
    verdict !== null && hasPrediction
      ? verdict === state.prediction
      : null;

  const hasExplanation = state.conclusion.trim().length > 0;
  const isComplete = hasPrediction && validComparison && hasExplanation;

  return {
    hasPrediction,
    savedRunCount,
    bothRuns,
    sameEnergy,
    differentB,
    validComparison,
    invalidReason,
    remeasureSlot,
    remeasureGuidance,
    smallerBRun,
    largerBRun,
    verdict,
    matchesPrediction,
    hasExplanation,
    isComplete,
  };
}
