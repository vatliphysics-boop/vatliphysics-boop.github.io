/**
 * Lõi mô phỏng "So sánh các mô hình nguyên tử – Bài 21"
 *
 * Đối tượng chuẩn hóa: Nguyên tử Hydrogen trung hòa (¹₁H: điện tích dương +1e, 1 electron −1e).
 * Hệ tọa độ chung: Tâm tại (0, 0), đơn vị độ dài là bán kính Bohr a₀ ≈ 0,529 × 10⁻¹⁰ m,
 * khung quan sát vuông [-3,2 a₀; +3,2 a₀] × [-3,2 a₀; +3,2 a₀].
 *
 * Cách biểu diễn & lấy mẫu ở mô hình đám mây electron:
 * - Biểu diễn LÁT CẮT PHẲNG ĐI QUA HẠT NHÂN (z = 0) của trạng thái cơ bản Hydrogen 1s:
 *   |ψ₁ₛ(x, y, z = 0)|² = (1 / (π a₀³)) · exp(−2ρ / a₀), với ρ = √(x² + y²).
 * - Để mật độ chấm trên một đơn vị diện tích mặt phẳng (dN / (2πρ dρ)) tỉ lệ đúng với
 *   exp(−2ρ / a₀), bán kính phẳng ρ phải tuân theo phân phối p(ρ) dρ = (4ρ / a₀²) exp(−2ρ / a₀) dρ
 *   (tức phân phối Gamma(2, tỉ lệ a₀/2)), kết hợp góc φ phân bố đều trên [0, 2π):
 *     ρ = −(a₀ / 2) · ln(u₁ · u₂),   φ = 2π · u₃
 *     x = ρ cos φ,                  y = ρ sin φ.
 */

export type AtomicModelId = "thomson" | "rutherford" | "cloud";

export interface ElectronSamplePoint {
  readonly id: number;
  /** Hoành độ tính theo đơn vị bán kính Bohr a₀ */
  readonly xA0: number;
  /** Tung độ tính theo đơn vị bán kính Bohr a₀ */
  readonly yA0: number;
  /** Khoảng cách tới tâm ρ = √(x² + y²) tính theo a₀ */
  readonly rA0: number;
}

export const ATOMIC_VIEWPORT_HALF_A0 = 3.2;
export const THOMSON_SPHERE_RADIUS_A0 = 1.8;
export const RUTHERFORD_ORBIT_RADIUS_A0 = 1.45;
export const BOHR_RADIUS_METERS = 5.29177210544e-11;
export const PROTON_RADIUS_METERS = 0.84e-15;
export const MAX_ELECTRON_SAMPLES = 1000;

/**
 * Bộ sinh số giả ngẫu nhiên tất định Mulberry32 trên khoảng (0, 1)
 * để mỗi chuỗi lấy mẫu có thể kiểm thử độc lập, tái lập và không bao giờ sinh ln(0).
 */
export function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    const raw = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    // Giữ trong (1e-12, 1 - 1e-12) để tránh ln(0)
    return raw <= 1e-12 ? 1e-12 : raw >= 1 - 1e-12 ? 1 - 1e-12 : raw;
  };
}

/**
 * Lấy mẫu 1 vị trí electron trên lát cắt z = 0 của đám mây Hydrogen 1s.
 * Trả về điểm nằm trong khung quan sát [-maxBoundA0, +maxBoundA0]² (sử dụng rejection
 * tự nhiên cho ~1,2% đuôi xa ngoài khung nhìn để không làm méo phân bố trên lát cắt).
 */
export function sampleHydrogen1sSlicePoint(
  nextRandom: () => number,
  id: number,
  maxBoundA0: number = ATOMIC_VIEWPORT_HALF_A0
): ElectronSamplePoint {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const u1 = nextRandom();
    const u2 = nextRandom();
    const u3 = nextRandom();
    const rA0 = -0.5 * Math.log(u1 * u2);
    const phi = 2 * Math.PI * u3;
    const xA0 = rA0 * Math.cos(phi);
    const yA0 = rA0 * Math.sin(phi);
    if (Math.abs(xA0) <= maxBoundA0 && Math.abs(yA0) <= maxBoundA0) {
      return { id, xA0, yA0, rA0 };
    }
  }
  return { id, xA0: 0, yA0: 0, rA0: 0 };
}

/**
 * Nối thêm `count` điểm mẫu mới vào danh sách hiện có mà GIỮ NGUYÊN toàn bộ tọa độ
 * các chấm đã lấy mẫu trước đó.
 */
export function appendHydrogen1sSamples(
  existing: readonly ElectronSamplePoint[],
  count: number,
  seedBase: number = 20260421
): ElectronSamplePoint[] {
  if (count <= 0 || existing.length >= MAX_ELECTRON_SAMPLES) {
    return [...existing];
  }
  const targetTotal = Math.min(MAX_ELECTRON_SAMPLES, existing.length + count);
  const next = [...existing];
  for (let idx = existing.length; idx < targetTotal; idx += 1) {
    // Mỗi chỉ số mẫu có hạt giống riêng để việc bấm +1 một trăm lần hay +100 một lần đều nhất quán
    const rng = createMulberry32(seedBase + Math.imul(idx + 1, 2654435761));
    next.push(sampleHydrogen1sSlicePoint(rng, idx + 1));
  }
  return next;
}

export interface SampleZoneStats {
  readonly total: number;
  /** Số chấm trong vùng gần tâm r ≤ 1 a₀ */
  readonly innerCount: number;
  /** Số chấm ở vùng ngoài r > 1 a₀ */
  readonly outerCount: number;
  readonly innerPercent: number;
}

export function summarizeElectronSamples(
  samples: readonly ElectronSamplePoint[]
): SampleZoneStats {
  const total = samples.length;
  if (total === 0) {
    return { total: 0, innerCount: 0, outerCount: 0, innerPercent: 0 };
  }
  let innerCount = 0;
  for (const pt of samples) {
    if (pt.rA0 <= 1.0) innerCount += 1;
  }
  const outerCount = total - innerCount;
  const innerPercent = Math.round((innerCount / total) * 100);
  return { total, innerCount, outerCount, innerPercent };
}

/* ==========================================================================
   ĐÁNH GIÁ LIÊN HỆ BẰNG CHỨNG RUTHERFORD & TIẾN ĐỘ HOÀN THÀNH MỤC BÀI 21
   ========================================================================== */

export interface AtomicModelsInquiryState {
  readonly activeModel: AtomicModelId;
  readonly compareSideBySide: boolean;
  readonly showPositiveCharge: boolean;
  /** Đánh dấu học sinh đã thực sự thao tác khám phá trên khung mô phỏng */
  readonly hasExploredStage: boolean;
  /** Số mẫu đám mây đang hiển thị (để khôi phục khi rời mục rồi quay lại) */
  readonly sampleCount: number;
  /** Hạt giống phiên lấy mẫu (tăng lên khi bấm Làm lại để tạo đợt đo độc lập mới) */
  readonly sampleSessionSeed: number;
  /** Lựa chọn mô hình ở câu hỏi nối với bằng chứng lá vàng */
  readonly selectedEvidenceModel?: AtomicModelId;
  /** Câu giải thích ngắn của học sinh */
  readonly explanationText: string;
  /** Học sinh đã bấm nút Kiểm tra & lưu lập luận cho phiên trả lời hiện tại */
  readonly submittedEvidence: boolean;
}

export const INITIAL_ATOMIC_MODELS_STATE: AtomicModelsInquiryState = {
  activeModel: "thomson",
  compareSideBySide: false,
  showPositiveCharge: true,
  hasExploredStage: false,
  sampleCount: 0,
  sampleSessionSeed: 20260421,
  selectedEvidenceModel: undefined,
  explanationText: "",
  submittedEvidence: false,
};

export const MIN_ATOMIC_EXPLANATION_CHARS = 12;

export interface EvidenceFeedback {
  readonly status: "incomplete" | "needs_revision" | "epistemic_note" | "complete";
  readonly headline: string;
  readonly detail: string;
}

/**
 * Đánh giá phản hồi sư phạm cho câu hỏi nối mô hình với bằng chứng tán xạ hạt alpha.
 * Phân biệt rõ:
 * 1) Thí nghiệm lá vàng trực tiếp chứng minh điện tích dương tập trung ở hạt nhân rất nhỏ (Rutherford).
 * 2) Mô tả electron bằng đám mây xác suất là bước phát triển kiến thức lượng tử khác, không suy trực tiếp từ thí nghiệm lá vàng.
 */
export function evaluateAtomicModelsEvidence(
  state: AtomicModelsInquiryState
): EvidenceFeedback {
  const trimmed = state.explanationText.trim();

  if (!state.selectedEvidenceModel) {
    return {
      status: "incomplete",
      headline: "Chọn một mô hình để đối chiếu với bằng chứng lá vàng",
      detail:
        "Em hãy chọn mô hình phản ánh đúng kết quả tán xạ hạt alpha trên lá vàng và viết một câu giải thích ngắn.",
    };
  }

  if (state.selectedEvidenceModel === "thomson") {
    return {
      status: "needs_revision",
      headline: "Mô hình Thomson không giải thích được các hạt alpha lệch góc lớn",
      detail:
        "Khi điện tích dương +1e trải đều trong cả thể tích nguyên tử (~10⁻¹⁰ m), điện trường ở mọi nơi đều yếu nên hạt alpha chỉ lệch rất nhỏ, không thể bị bật ngược. Hãy bật “Hiện điện tích dương” để so sánh với Rutherford rồi chọn lại.",
    };
  }

  if (state.selectedEvidenceModel === "cloud") {
    return {
      status: "epistemic_note",
      headline: "Cần phân biệt hai bước kiến thức khác nhau",
      detail:
        "Mô hình đám mây cũng giữ hạt nhân dương nhỏ ở tâm, nhưng bản thân thí nghiệm lá vàng chỉ trực tiếp cung cấp bằng chứng về sự tập trung điện tích dương tại hạt nhân — tức bước chuyển từ Thomson sang mô hình hạt nhân Rutherford. Việc thay quỹ đạo electron bằng đám mây xác suất là một bước kiến thức lượng tử khác (dựa trên phổ nguyên tử và cơ học lượng tử). Em hãy chọn “Mô hình hành tinh Rutherford” để gắn đúng mô hình ra đời trực tiếp từ bằng chứng lá vàng.",
    };
  }

  // selectedEvidenceModel === "rutherford"
  if (trimmed.length < MIN_ATOMIC_EXPLANATION_CHARS) {
    return {
      status: "incomplete",
      headline: "Viết thêm một câu giải thích gắn với quan sát hạt alpha",
      detail: `Em đã chọn đúng mô hình Rutherford. Hãy viết ít nhất một câu hoàn chỉnh (tối thiểu ${MIN_ATOMIC_EXPLANATION_CHARS} kí tự) nêu rõ quan sát hạt alpha lệch góc lớn / đi thẳng gợi ý điều gì về vùng chứa điện tích dương.`,
    };
  }

  return {
    status: "complete",
    headline: "Lập luận phù hợp với bằng chứng thí nghiệm lá vàng",
    detail:
      "Chính việc đa số hạt alpha đi gần như thẳng (nguyên tử phần lớn rỗng) nhưng một tỉ lệ rất ít bị lệch góc lớn hoặc bật ngược đã chứng tỏ điện tích dương và gần hết khối lượng tập trung trong hạt nhân rất nhỏ ở tâm (Rutherford, 1911). Lưu ý thêm: thí nghiệm lá vàng chỉ cho bằng chứng về hạt nhân tích điện dương; còn việc mô tả electron bằng đám mây xác suất là bước kiến thức lượng tử phát triển sau đó.",
  };
}

/**
 * Điều kiện ghi nhận hoàn thành mục "So sánh các mô hình nguyên tử":
 * - Học sinh KHÔNG thể hoàn thành chỉ bằng cách mở trang hoặc chỉ bấm lấy mẫu chấm.
 * - Phải có thao tác khám phá trên mô phỏng (`hasExploredStage`), chọn đúng mô hình gắn
 *   trực tiếp với bằng chứng lá vàng (`rutherford`), viết câu giải thích đủ ý và nhấn kiểm tra.
 */
export function isAtomicModelsInquiryComplete(
  state: AtomicModelsInquiryState
): boolean {
  if (!state.hasExploredStage || !state.submittedEvidence) {
    return false;
  }
  return evaluateAtomicModelsEvidence(state).status === "complete";
}

export const ATOMIC_MODELS_STORAGE_KEY = "b21-atomic-models-inquiry-v1";
