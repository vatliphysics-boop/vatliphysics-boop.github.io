/**
 * Rutherford apparatus component registry
 * Based on Geiger–Marsden (1909–1913) experimental setup & SGK Vật lí 12 KNTT Hình 21.2 (tr. 91–92)
 *
 * References:
 * - Geiger, H., & Marsden, E. (1909). On a Diffuse Reflection of the α-Particles.
 *   Proceedings of the Royal Society A, 82(557), 495–500.
 * - Rutherford, E. (1911). The Scattering of α and β Particles by Matter and the
 *   Structure of the Atom. Philosophical Magazine, 21(125), 669–688.
 * - SGK Vật lí 12 Kết nối tri thức với cuộc sống, Bài 21, Hình 21.2 (kí hiệu R, P, D, S, M, G).
 */

import type { ApparatusComponent, CameraMode } from "../../core/types";
import { createComponentRegistry } from "../../core/ComponentRegistry";
import { RUTHERFORD_LIMITS } from "../../physics/rutherford-engine";
import type { InquiryRun, RunSlot, RutherfordPrediction } from "./inquiry";

/** All apparatus components in the Rutherford scattering experiment */
export const RUTHERFORD_COMPONENTS: readonly ApparatusComponent[] = [
  // Source components
  {
    id: "alpha-source",
    nameVi: "Nguồn phát hạt alpha (R)",
    nameEn: "Alpha particle source (R)",
    role: "Kí hiệu R (Hình 21.2 SGK): Bộ phận phát chùm hạt α (hạt nhân helium He-4 mang điện +2e) có năng lượng xác định",
    roleEn: "Emits alpha particles (helium-4 nuclei) with defined energy",
    category: "source",
  },
  {
    id: "source-housing",
    nameVi: "Hộp chì chứa nguồn phóng xạ (quanh R)",
    nameEn: "Lead source housing",
    role: "Hộp chì bao quanh nguồn R (Hình 21.2 SGK): che chắn bức xạ mọi phía, chỉ để chùm hạt α thoát ra hướng thẳng tới lá vàng D",
    roleEn: "Contains and shields radioactive source, allows particles through aperture",
    category: "source",
  },

  // Collimation
  {
    id: "collimator",
    nameVi: "Khe chuẩn trực chùm hạt α",
    nameEn: "Collimator slit",
    role: "Tấm chắn chì có khe hẹp định hướng chùm hạt α mảnh chiếu thẳng tới lá vàng D (chi tiết kĩ thuật của bộ thí nghiệm; lưu ý kí hiệu P trên Hình 21.2a SGK chỉ chân đế đỡ hộp G)",
    roleEn: "Creates parallel beam of particles directed at target",
    category: "collimator",
  },

  // Target
  {
    id: "gold-foil",
    nameVi: "Lá vàng mỏng (D)",
    nameEn: "Gold foil (D)",
    role: "Kí hiệu D (Hình 21.2 SGK): Bia tán xạ — lá vàng rất mỏng (~4·10⁻⁷ m ≈ 400 nm), nơi hạt α tương tác với hạt nhân vàng",
    roleEn: "Scattering target — very thin gold leaf (~400 nm), alpha particles interact with gold nuclei",
    category: "target",
  },
  {
    id: "foil-holder",
    nameVi: "Giá đỡ lá vàng (D)",
    nameEn: "Foil holder",
    role: "Giữ lá vàng mỏng D cố định thẳng đứng tại đúng tâm thiết bị",
    roleEn: "Holds gold foil in fixed position at apparatus center",
    category: "target",
  },

  // Detection
  {
    id: "scintillation-screen",
    nameVi: "Màn phát quang ZnS (S)",
    nameEn: "ZnS scintillation screen (S)",
    role: "Kí hiệu S (Hình 21.2 SGK): Kính/màn phủ chất huỳnh quang (ZnS) — mỗi khi một hạt α đập vào sẽ xuất hiện một đốm sáng nhỏ rồi tắt",
    roleEn: "Screen coated with zinc sulfide — emits light flashes when alpha particles strike",
    category: "detector",
  },
  {
    id: "rotating-microscope",
    nameVi: "Kính hiển vi quan sát (M)",
    nameEn: "Rotating microscope (M)",
    role: "Kí hiệu M (Hình 21.2 SGK): Người quan sát đặt mắt nhìn qua kính M xoay quanh trục lá vàng D (từ vị trí (1) đối diện nguồn sang vị trí (2) lệch > 90°) để đếm đốm sáng trên vùng màn S tương ứng",
    roleEn: "Microscope that rotates around screen to observe light flashes at different angles",
    category: "measurement",
  },
  {
    id: "angular-scale",
    nameVi: "Thang đo góc tán xạ",
    nameEn: "Angular scale",
    role: "Vòng chia độ quanh tâm lá vàng D giúp đọc vị trí góc của kính hiển vi quan sát M (từ 0° đến 180°)",
    roleEn: "Measures angular position of microscope (scattering angle)",
    category: "measurement",
  },

  // Structure
  {
    id: "vacuum-chamber",
    nameVi: "Hộp chân không (G)",
    nameEn: "Vacuum chamber (G)",
    role: "Kí hiệu G (Hình 21.2 SGK): Hộp hút chân không đặt trên chân đế P, bao kín hệ R–D–S để hạt α không bị va chạm với các phân tử không khí",
    roleEn: "Low-pressure chamber — reduces unwanted scattering with air molecules",
    category: "structure",
  },
  {
    id: "chamber-window",
    nameVi: "Thành kính hộp chân không (G)",
    nameEn: "Observation window",
    role: "Thành trong suốt của hộp chân không G giúp quan sát bố trí các bộ phận R, D, S bên trong buồng",
    roleEn: "Transparent window for observing inside chamber",
    category: "structure",
  },
  {
    id: "base-platform",
    nameVi: "Chân đế & ống nối hút chân không (P)",
    nameEn: "Base stand & vacuum port (P)",
    role: "Kí hiệu P (Hình 21.2a SGK): Trụ chân đế kèm ống nối bơm hút chân không ở đáy buồng G, giữ thiết bị và cơ cấu xoay kính hiển vi M ổn định",
    roleEn: "Fixed stand and bottom vacuum pump port holding the vacuum chamber and microscope assembly",
    category: "structure",
  },
] as const;

/** Registry instance for Rutherford apparatus */
export const rutherfordRegistry = createComponentRegistry(RUTHERFORD_COMPONENTS);

/** Get component by ID with type safety */
export function getRutherfordComponent(id: string): ApparatusComponent | undefined {
  return rutherfordRegistry.getById(id);
}

/** Get all components by category */
export function getRutherfordByCategory(
  category: ApparatusComponent["category"],
): readonly ApparatusComponent[] {
  return rutherfordRegistry.getByCategory(category);
}

/**
 * Bộ phận cốt lõi đối chiếu trực tiếp với Hình 21.2 SGK Vật lí 12 KNTT (tr. 91)
 * Dùng cho thanh nút nhận diện đồng bộ 2 chiều với cảnh 3D (kể cả cảm ứng 390px).
 */
export interface CoreSgk212PartSpec {
  readonly partId: string;
  readonly sgkSymbol: "R" | "D" | "S" | "M" | "G";
  readonly buttonLabel: string;
  readonly questionCue: string;
  readonly detailRole: string;
}

export const CORE_SGK_21_2_PARTS: readonly CoreSgk212PartSpec[] = [
  {
    partId: "alpha-source",
    sgkSymbol: "R",
    buttonLabel: "Nguồn hạt α (R)",
    questionCue: "Bộ phận phát hạt",
    detailRole:
      "Phát chùm hạt α (hạt nhân ⁴₂He mang điện +2e) hướng thẳng vào lá vàng mỏng D ở tâm hộp chân không G.",
  },
  {
    partId: "gold-foil",
    sgkSymbol: "D",
    buttonLabel: "Lá vàng mỏng (D)",
    questionCue: "Bộ phận làm bia tán xạ",
    detailRole:
      "Lá vàng dát cực mỏng (~4·10⁻⁷ m) đặt tại tâm thiết bị; các hạt α đi xuyên qua đây và chịu lực đẩy tĩnh điện khi bay gần hạt nhân vàng.",
  },
  {
    partId: "scintillation-screen",
    sgkSymbol: "S",
    buttonLabel: "Màn phát quang ZnS (S)",
    questionCue: "Nơi tạo đốm sáng",
    detailRole:
      "Lớp kẽm sunfua (ZnS) phủ mặt trong màn sẽ phát ra một đốm sáng xanh lục nhỏ mỗi khi có một hạt α đập trúng.",
  },
  {
    partId: "rotating-microscope",
    sgkSymbol: "M",
    buttonLabel: "Kính hiển vi quan sát (M)",
    questionCue: "Người quan sát nhìn qua đâu",
    detailRole:
      "Người làm thí nghiệm đặt mắt nhìn qua thị kính M (xoay từ vị trí (1) 0° đến vị trí (2) > 90°) để đếm tần suất đốm sáng trên màn S.",
  },
  {
    partId: "vacuum-chamber",
    sgkSymbol: "G",
    buttonLabel: "Hộp chân không (G)",
    questionCue: "Buồng giữ chân không",
    detailRole:
      "Toàn bộ thiết bị đặt trong hộp G đã hút chân không để hạt α không bị mất năng lượng hay lệch hướng do va chạm phân tử không khí.",
  },
] as const;

/** Các bộ phận vỏ ngoài cần ẩn đi khi chọn chế độ Cắt lớp (cutaway) */
export const CUTAWAY_HIDDEN_PARTS: readonly string[] = [
  "vacuum-chamber",
  "chamber-window",
  "base-platform",
] as const;

/** Danh sách linh kiện bên trong được ưu tiên bắt tia click xuyên qua lớp vỏ kính chân không */
export const RUTHERFORD_INNER_PRIORITY_PARTS: readonly string[] = [
  "alpha-source",
  "collimator",
  "gold-foil",
  "scintillation-screen",
  "rotating-microscope",
  "angular-scale",
] as const;

const SECONDARY_INNER_PARTS: readonly string[] = [
  "source-housing",
  "foil-holder",
] as const;

/**
 * Phân giải linh kiện được chọn từ danh sách thứ tự va chạm tia (raycast hits từ gần tới xa).
 * Ưu tiên linh kiện chức năng bên trong xuyên qua thành kính `chamber-window` / `vacuum-chamber`.
 */
export function resolveRutherfordRaycastPart(hitPartIds: readonly string[]): string | null {
  if (hitPartIds.length === 0) return null;
  for (const id of hitPartIds) {
    if (RUTHERFORD_INNER_PRIORITY_PARTS.includes(id)) {
      return id;
    }
  }
  for (const id of hitPartIds) {
    if (SECONDARY_INNER_PARTS.includes(id)) {
      return id;
    }
  }
  return hitPartIds[0] ?? null;
}

/** Mô tả thị trường kính quan sát M theo góc xoay (0° Vị trí (1) → 160° Vị trí (2), SGK tr. 91–92) */
export interface ObserverPositionSummary {
  readonly angleDeg: number;
  readonly zone: "position_1" | "intermediate" | "position_2";
  readonly positionTitle: string;
  readonly relativeFrequencyLabel: string;
  readonly sampleFlashCount: number;
  readonly physicalMeaning: string;
}

export function describeObserverPosition(rawAngleDeg: number): ObserverPositionSummary {
  const angleDeg = Math.max(0, Math.min(160, Math.round(rawAngleDeg)));
  if (angleDeg <= 15) {
    return {
      angleDeg,
      zone: "position_1",
      positionTitle: `Vị trí (1) · Đối diện nguồn phát (${angleDeg}°)`,
      relativeFrequencyLabel: "Tần suất đốm sáng cực đại (chuẩn so sánh = 1)",
      sampleFlashCount: 28,
      physicalMeaning:
        "Đốm sáng nhấp nháy dày đặc nhất ngay đối diện chùm tia tới — chứng tỏ hầu hết hạt α xuyên thẳng qua lá vàng D, phần lớn không gian nguyên tử là khoảng trống.",
    };
  }
  if (angleDeg <= 90) {
    const sampleFlashCount = angleDeg <= 45 ? 7 : 3;
    return {
      angleDeg,
      zone: "intermediate",
      positionTitle: `Góc lệch trung gian (${angleDeg}°)`,
      relativeFrequencyLabel:
        angleDeg <= 45
          ? "Tần suất giảm rất nhanh theo quy luật 1/sin⁴(θ/2)"
          : "Tần suất rất thấp (chỉ vài hạt trên hàng nghìn hạt tới)",
      sampleFlashCount,
      physicalMeaning:
        "Một số hạt α đi đủ gần tâm mang điện dương chịu lực đẩy tĩnh điện Coulomb nên bị đổi hướng chuyển động.",
    };
  }
  return {
    angleDeg,
    zone: "position_2",
    positionTitle: `Vị trí (2) · Tán xạ góc lớn / bật ngược (${angleDeg}° > 90°)`,
    relativeFrequencyLabel: "Nhỏ hơn vị trí (1) cỡ 10⁴ lần (tỉ lệ ~ 10⁻⁴, chỉ ~1 trong 10 000 hạt α)",
    sampleFlashCount: 1,
    physicalMeaning:
      "Theo SGK Vật lí 12 tr. 91–92, tần suất đốm sáng ở vị trí (2) (> 90°) nhỏ hơn ở vị trí (1) (0°) cỡ 10⁴ lần — chứng tỏ toàn bộ điện tích dương và phần lớn khối lượng nguyên tử tập trung tại hạt nhân cực nhỏ.",
  };
}

/**
 * Lấy mẫu tất định (có seed lặp lại được) số đốm sáng đếm được trong cùng khoảng thời gian Δt = 10 s
 * và cùng cường độ nguồn R tại góc quan sát của kính hiển vi M.
 * Phân biệt rõ kết quả một lượt ngẫu nhiên (Poisson) với giá trị kì vọng thống kê (tỉ số (2)/(1) ≈ 10⁻⁴ theo SGK tr. 91).
 */
export interface EqualTimeFlashSample {
  readonly durationSec: 10;
  readonly angleDeg: number;
  readonly zone: "position_1" | "intermediate" | "position_2";
  readonly count: number;
  readonly expectedCount: number;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleEqualTimeFlashCount(
  rawAngleDeg: number,
  seed: number,
): EqualTimeFlashSample {
  const angleDeg = Math.max(0, Math.min(160, Math.round(rawAngleDeg)));
  const rng = mulberry32((seed * 2654435761 + angleDeg * 97) >>> 0);

  if (angleDeg <= 15) {
    const expectedCount = 10000;
    // Xấp xỉ chuẩn quanh λ = 10 000 (độ lệch chuẩn √λ = 100) bằng tổng Irwin–Hall 12 mẫu đều
    let uSum = 0;
    for (let i = 0; i < 12; i++) uSum += rng();
    const z = uSum - 6;
    const count = Math.max(9600, Math.round(expectedCount + z * 100));
    return { durationSec: 10, angleDeg, zone: "position_1", count, expectedCount };
  }

  if (angleDeg <= 90) {
    const expectedCount = angleDeg <= 45 ? 220 : 12;
    const L = Math.exp(-expectedCount);
    let k = 0;
    let p = 1;
    if (expectedCount <= 30) {
      do {
        k++;
        p *= Math.max(1e-9, rng());
      } while (p > L);
      return { durationSec: 10, angleDeg, zone: "intermediate", count: k - 1, expectedCount };
    }
    let uSum = 0;
    for (let i = 0; i < 12; i++) uSum += rng();
    const count = Math.max(1, Math.round(expectedCount + (uSum - 6) * Math.sqrt(expectedCount)));
    return { durationSec: 10, angleDeg, zone: "intermediate", count, expectedCount };
  }

  // Vị trí (2) (> 90°): kì vọng thống kê λ = 1 đốm / 10 s (tỉ số λ₂/λ₁ = 1 / 10 000 = 10⁻⁴ chuẩn SGK tr. 91).
  // Một lượt đếm ngẫu nhiên theo phân bố Poisson(1) có thể cho 0, 1, 2, 3… đốm!
  const expectedCount = 1;
  const L = Math.exp(-expectedCount);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.max(1e-9, rng());
  } while (p > L);
  return { durationSec: 10, angleDeg, zone: "position_2", count: k - 1, expectedCount };
}

/** Khoá lưu trữ bền vững trạng thái Rutherford V3 & nhiệm vụ điều tra */
export const RUTHERFORD_V3_STORAGE_KEY = "b21-rutherford-v3-state-v1";

export interface RutherfordV3PersistedState {
  readonly impactFm: number;
  readonly energyMeV: number;
  readonly cameraMode: CameraMode;
  readonly selectedPartId: string | null;
  readonly showScintillation: boolean;
  readonly showBeam: boolean;
  readonly observerAngleDeg: number;
  readonly countPos1?: number | null;
  readonly countPos2?: number | null;
  readonly countTrialSeed?: number;
  readonly prediction: RutherfordPrediction | "";
  readonly run1: InquiryRun | null;
  readonly run2: InquiryRun | null;
  readonly lastCapturedSlot: RunSlot | null;
  readonly conclusion: string;
}

export const INITIAL_RUTHERFORD_V3_STATE: RutherfordV3PersistedState = {
  impactFm: 10,
  energyMeV: 8,
  cameraMode: "orbit",
  selectedPartId: null,
  showScintillation: true,
  showBeam: true,
  observerAngleDeg: 0,
  countPos1: null,
  countPos2: null,
  countTrialSeed: 1,
  prediction: "",
  run1: null,
  run2: null,
  lastCapturedSlot: null,
  conclusion: "",
};

const VALID_CAMERA_MODES: readonly CameraMode[] = [
  "orbit",
  "front",
  "back",
  "left",
  "right",
  "top",
  "cutaway",
  "exploded",
  "instrument",
  "measurement",
];

function isValidInquiryRun(v: unknown): v is InquiryRun {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.b === "number" &&
    Number.isFinite(r.b) &&
    typeof r.e === "number" &&
    Number.isFinite(r.e) &&
    typeof r.theta === "number" &&
    Number.isFinite(r.theta)
  );
}

export function parseRutherfordV3State(raw: string): RutherfordV3PersistedState {
  if (!raw) return INITIAL_RUTHERFORD_V3_STATE;
  try {
    const p = JSON.parse(raw) as Partial<RutherfordV3PersistedState>;
    const impactFm =
      typeof p.impactFm === "number" && Number.isFinite(p.impactFm)
        ? Math.max(RUTHERFORD_LIMITS.impactFm.min, Math.min(RUTHERFORD_LIMITS.impactFm.max, p.impactFm))
        : INITIAL_RUTHERFORD_V3_STATE.impactFm;
    const energyMeV =
      typeof p.energyMeV === "number" && Number.isFinite(p.energyMeV)
        ? Math.max(RUTHERFORD_LIMITS.energyMeV.min, Math.min(RUTHERFORD_LIMITS.energyMeV.max, p.energyMeV))
        : INITIAL_RUTHERFORD_V3_STATE.energyMeV;
    const cameraMode =
      typeof p.cameraMode === "string" && VALID_CAMERA_MODES.includes(p.cameraMode as CameraMode)
        ? (p.cameraMode as CameraMode)
        : INITIAL_RUTHERFORD_V3_STATE.cameraMode;
    const selectedPartId =
      typeof p.selectedPartId === "string" && RUTHERFORD_COMPONENTS.some((c) => c.id === p.selectedPartId)
        ? p.selectedPartId
        : null;
    const showScintillation =
      typeof p.showScintillation === "boolean"
        ? p.showScintillation
        : INITIAL_RUTHERFORD_V3_STATE.showScintillation;
    const showBeam =
      typeof p.showBeam === "boolean" ? p.showBeam : INITIAL_RUTHERFORD_V3_STATE.showBeam;
    const observerAngleDeg =
      typeof p.observerAngleDeg === "number" && Number.isFinite(p.observerAngleDeg)
        ? Math.max(0, Math.min(160, Math.round(p.observerAngleDeg)))
        : INITIAL_RUTHERFORD_V3_STATE.observerAngleDeg;
    const countPos1 =
      typeof p.countPos1 === "number" && Number.isFinite(p.countPos1) && p.countPos1 >= 0
        ? Math.round(p.countPos1)
        : null;
    const countPos2 =
      typeof p.countPos2 === "number" && Number.isFinite(p.countPos2) && p.countPos2 >= 0
        ? Math.round(p.countPos2)
        : null;
    const countTrialSeed =
      typeof p.countTrialSeed === "number" && Number.isFinite(p.countTrialSeed) && p.countTrialSeed >= 1
        ? Math.floor(p.countTrialSeed)
        : 1;
    const prediction: RutherfordPrediction | "" =
      p.prediction === "increase" || p.prediction === "decrease" || p.prediction === "unchanged"
        ? p.prediction
        : "";
    const run1 = isValidInquiryRun(p.run1) ? p.run1 : null;
    const run2 = isValidInquiryRun(p.run2) ? p.run2 : null;
    const lastCapturedSlot: RunSlot | null =
      p.lastCapturedSlot === 1 || p.lastCapturedSlot === 2 ? p.lastCapturedSlot : null;
    const conclusion =
      typeof p.conclusion === "string" ? p.conclusion.slice(0, 2000) : "";

    return {
      impactFm,
      energyMeV,
      cameraMode,
      selectedPartId,
      showScintillation,
      showBeam,
      observerAngleDeg,
      countPos1,
      countPos2,
      countTrialSeed,
      prediction,
      run1,
      run2,
      lastCapturedSlot,
      conclusion,
    };
  } catch {
    return INITIAL_RUTHERFORD_V3_STATE;
  }
}
