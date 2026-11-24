import type { CanonicalActivityKey, NuclearPhysicsLessonCode } from "./curriculum";
import { validateTeachingPlan, type PlanActivity, type PlanPhase, type TeachingPlan } from "./teaching-plan";

export type LessonStudyPhase = "before" | "in_class" | "after";

export interface StudyPhaseMeta {
  readonly id: LessonStudyPhase;
  readonly shortLabel: string;
  readonly fullLabel: string;
  readonly planPhase: PlanPhase;
}

export const CHAPTER4_PHASES: readonly StudyPhaseMeta[] = [
  {
    id: "before",
    shortLabel: "Trước giờ học",
    fullLabel: "Trước giờ học: Tự nghiên cứu",
    planPhase: "before_class",
  },
  {
    id: "in_class",
    shortLabel: "Trong giờ học",
    fullLabel: "Trong giờ học: Khám phá và thảo luận",
    planPhase: "in_class",
  },
  {
    id: "after",
    shortLabel: "Sau giờ học",
    fullLabel: "Sau giờ học: Vận dụng và đánh giá",
    planPhase: "after_class",
  },
] as const;

export function getPhaseMeta(phase: LessonStudyPhase): StudyPhaseMeta {
  return CHAPTER4_PHASES.find((item) => item.id === phase) ?? CHAPTER4_PHASES[0];
}

export type Chapter4SectionKind =
  | "b21_pre_rutherford"
  | "b21_rutherford_v3"
  | "b21_atomic_models"
  | "b21_structure_size"
  | "b21_symbol_isotopes"
  | "b21_after_transfer"
  | "b22_blackett_track"
  | "b22_conservation"
  | "b22_binding_energy"
  | "b22_fission"
  | "b22_fusion"
  | "b22_after_transfer"
  | "b23_cloud_geiger"
  | "b23_radiation_types"
  | "b23_half_life"
  | "b23_safety"
  | "b23_carbon14"
  | "b24_energy_chain"
  | "b24_reactor_control"
  | "b24_medicine"
  | "b24_bio_food"
  | "b24_after_transfer"
  | "b25_electroscope"
  | "b25_table_25_1"
  | "b25_equations_energy"
  | "b25_after_transfer";

export interface SectionTeacherGuide {
  readonly learningObjective: string;
  readonly projectorStrategy: string;
  readonly openQuestions: readonly string[];
  readonly commonMisconceptions: string;
  readonly noVideoFallback: string;
  readonly completionCriteriaNote: string;
}

export interface LessonGoalsSpec {
  readonly knowledge: string;
  readonly competence: string;
  readonly quality: string;
}

export interface SgkTable21Row {
  readonly elementName: string;
  readonly symbol: string;
  readonly z: number;
  readonly massNumberA: number;
  /** Bán kính nguyên tử theo đơn vị 10⁻¹⁰ m (SGK tr. 94) */
  readonly atomicRadius10m10: string;
  /** Bán kính hạt nhân thực nghiệm theo đơn vị 10⁻¹⁵ m (SGK tr. 94) */
  readonly nuclearRadius10m15: string;
  /** Bán kính tính theo công thức R = 1,2·10⁻¹⁵·A¹/³ (đơn vị 10⁻¹⁵ m) */
  readonly formulaRadius10m15: string;
}

export const SGK_B21_MASS_CONSTANTS = {
  protonKg: "1,67262 × 10⁻²⁷ kg",
  neutronKg: "1,67493 × 10⁻²⁷ kg",
  amuKg: "1,66054 × 10⁻²⁷ kg",
} as const;

export const SGK_TABLE_21_1: readonly SgkTable21Row[] = [
  { elementName: "Hydrogen", symbol: "H", z: 1, massNumberA: 1, atomicRadius10m10: "1,2", nuclearRadius10m15: "0,9", formulaRadius10m15: "1,2" },
  { elementName: "Helium", symbol: "He", z: 2, massNumberA: 4, atomicRadius10m10: "1,4", nuclearRadius10m15: "1,7", formulaRadius10m15: "1,9" },
  { elementName: "Oxigen", symbol: "O", z: 8, massNumberA: 16, atomicRadius10m10: "1,5", nuclearRadius10m15: "2,7", formulaRadius10m15: "3,0" },
  { elementName: "Silicon", symbol: "Si", z: 14, massNumberA: 28, atomicRadius10m10: "2,1", nuclearRadius10m15: "3,1", formulaRadius10m15: "3,6" },
  { elementName: "Sắt", symbol: "Fe", z: 26, massNumberA: 56, atomicRadius10m10: "1,9", nuclearRadius10m15: "3,7", formulaRadius10m15: "4,6" },
  { elementName: "Cadimium", symbol: "Cd", z: 48, massNumberA: 114, atomicRadius10m10: "1,6", nuclearRadius10m15: "4,6", formulaRadius10m15: "5,8" },
  { elementName: "Vàng", symbol: "Au", z: 79, massNumberA: 197, atomicRadius10m10: "1,7", nuclearRadius10m15: "5,4", formulaRadius10m15: "7,0" },
  { elementName: "Uranium", symbol: "U", z: 92, massNumberA: 238, atomicRadius10m10: "1,9", nuclearRadius10m15: "5,9", formulaRadius10m15: "7,4" },
] as const;

export interface SgkTable23GeigerRow {
  readonly windowSeconds: string;
  readonly counts: number;
}

/** Bảng 23.1 SGK Vật lí 12 KNTT tr. 105 — Số xung đếm được trong 6 khoảng 5 giây liên tiếp (tổng 10 xung / 30 s) */
export const SGK_TABLE_23_1: readonly SgkTable23GeigerRow[] = [
  { windowSeconds: "0 – 5", counts: 1 },
  { windowSeconds: "5 – 10", counts: 3 },
  { windowSeconds: "10 – 15", counts: 2 },
  { windowSeconds: "15 – 20", counts: 0 },
  { windowSeconds: "20 – 25", counts: 3 },
  { windowSeconds: "25 – 30", counts: 1 },
] as const;

/** Bảng 23.2 SGK Vật lí 12 KNTT tr. 108 — Chu kì bán rã của một số đồng vị phóng xạ (đủ 7 đồng vị gốc SGK) */
export const SGK_TABLE_23_2_SAMPLES = [
  { sym: "C", a: 14, z: 6, name: "Carbon", halfLife: "5,7·10³ năm", radiation: "β⁻ (định tuổi cổ vật · tr. 109–110)" },
  { sym: "I", a: 131, z: 53, name: "Iodine", halfLife: "8,0 ngày", radiation: "β⁻, γ (y học hạt nhân tuyến giáp)" },
  { sym: "O", a: 15, z: 8, name: "Oxygen", halfLife: "1,2·10² giây", radiation: "β⁺ (câu hỏi ? tr. 108: sau 244 s phân rã 75%)" },
  { sym: "Po", a: 210, z: 84, name: "Polonium", halfLife: "1,4·10² ngày", radiation: "α (nguồn hạt α thực nghiệm)" },
  { sym: "Ra", a: 226, z: 88, name: "Radium", halfLife: "1,6·10³ năm", radiation: "α, γ (1 g ²²⁶₈₈Ra có H ≈ 1 Ci = 3,7·10¹⁰ Bq)" },
  { sym: "Rn", a: 219, z: 86, name: "Radon", halfLife: "4,0 giây", radiation: "α (khí hiếm phóng xạ tự nhiên)" },
  { sym: "U", a: 235, z: 92, name: "Uranium", halfLife: "7,0·10⁸ năm", radiation: "α (nhiên liệu phân hạch hạt nhân)" },
] as const;

export interface Chapter4SectionSpec {
  readonly id: string;
  readonly kind: Chapter4SectionKind;
  readonly phase: LessonStudyPhase;
  readonly title: string;
  readonly shortTocTitle: string;
  readonly sgkPages: string;
  readonly minutes: number;
  /** Hiện tượng học sinh cần khám phá */
  readonly phenomenonPrompt: string;
  /** Bằng chứng học sinh cần ghi lại */
  readonly evidencePrompt: string;
  /** Mã hoạt động mô phỏng chuẩn (giữ nguyên hợp đồng FixedPhysicsActivityRenderer) */
  readonly activityKey?: CanonicalActivityKey;
  /** Gợi ý tổ chức dành riêng cho giáo viên */
  readonly teacherTip: string;
  /** Hướng dẫn sư phạm chi tiết cho Chế độ Giáo viên & đồng bộ Kế hoạch bài dạy */
  readonly teacherGuide: SectionTeacherGuide;
  /** Liên kết Video Flow tùy chọn — chỉ hiển thị nút phát khi có URL thật */
  readonly flowVideoUrl?: string;
}

type RawChapter4SectionSpec = Omit<Chapter4SectionSpec, "teacherGuide"> & {
  readonly teacherGuide?: SectionTeacherGuide;
};

type RawChapter4LessonSpec = Omit<Chapter4LessonSpec, "sections"> & {
  readonly sections: readonly RawChapter4SectionSpec[];
};

export interface Chapter4LessonSpec {
  readonly code: NuclearPhysicsLessonCode;
  readonly number: number;
  readonly title: string;
  readonly sgkPages: string;
  /** Câu hỏi dẫn ở Kho học liệu và đầu Trang bài học */
  readonly guidingQuestion: string;
  readonly hubHighlight: string;
  readonly lessonGoals?: LessonGoalsSpec;
  readonly sections: readonly Chapter4SectionSpec[];
}

function buildDefaultTeacherGuide(section: RawChapter4SectionSpec): SectionTeacherGuide {
  if (section.teacherGuide) return section.teacherGuide;
  return {
    learningObjective: section.phenomenonPrompt,
    projectorStrategy: `${section.teacherTip} Trình chiếu sơ đồ hoặc bảng số liệu lên màn hình lớp và yêu cầu học sinh đối chiếu với SGK (${section.sgkPages}).`,
    openQuestions: [
      `Dấu hiệu thực nghiệm trực tiếp trong mục “${section.shortTocTitle}” là gì?`,
      `Từ bằng chứng vừa ghi nhận, ta rút ra quy luật vật lí nào theo SGK (${section.sgkPages})?`,
    ],
    commonMisconceptions:
      "Học sinh dễ nhầm giữa dấu hiệu quan sát thực nghiệm với mô hình giải thích hoặc quên kiểm tra đơn vị trước khi tính toán; cần yêu cầu chỉ rõ dữ kiện gốc trên hình/bảng.",
    noVideoFallback: `Hoàn thành trọn vẹn mục học bằng sơ đồ trực quan, bảng dữ liệu SGK (${section.sgkPages}) và mô phỏng tương tác ngay trên trang mà không phụ thuộc video.`,
    completionCriteriaNote: `Ghi nhận hoàn thành khi học sinh thực hiện trọn vẹn thao tác/câu hỏi kiểm tra và lưu bằng chứng: ${section.evidencePrompt}`,
  };
}

export function getSectionTeacherGuide(section: Chapter4SectionSpec): SectionTeacherGuide {
  return section.teacherGuide;
}

const RAW_CHAPTER4_LESSONS: readonly RawChapter4LessonSpec[] = [
  {
    code: "B21",
    number: 21,
    title: "Cấu trúc hạt nhân",
    sgkPages: "SGK tr. 91–95",
    guidingQuestion:
      "Từ những đốm sáng trên màn, làm sao biết nguyên tử có một hạt nhân rất nhỏ?",
    hubHighlight:
      "Bộ thiết bị tán xạ hạt alpha Rutherford V3, đối chiếu 3 mô hình nguyên tử, cấu tạo hạt nhân Silic-28 và đồng vị Hydrogen.",
    lessonGoals: {
      knowledge:
        "Trình bày được thí nghiệm tán xạ hạt alpha của Rutherford, rút ra mô hình nguyên tử có hạt nhân rất nhỏ mang điện dương ở tâm; nêu được cấu tạo hạt nhân từ proton và neutron (nucleon), đơn vị khối lượng nguyên tử amu, công thức gần đúng bán kính hạt nhân R = 1,2·10⁻¹⁵·A¹/³ (m), kí hiệu hạt nhân ᴬᶻX và khái niệm đồng vị (SGK Vật lí 12, tr. 91–95).",
      competence:
        "Phân biệt được dấu hiệu quan sát thực nghiệm (đốm sáng trên màn huỳnh quang S) với đường quỹ đạo mô hình; tự chuẩn bị dự đoán có lí giải trước giờ học; đọc và xử lí được số liệu Bảng 21.1, giải thích sự khác biệt tỉ lệ phóng đại và vận dụng tính Z, N, R cho hạt nhân mới (²⁷₁₃Al).",
      quality:
        "Trung thực khi lưu giữ nguyên dự đoán ban đầu (kể cả khi dự đoán chưa khớp thực nghiệm) để đối chiếu khoa học trên lớp; cẩn trọng với đơn vị đo lường vi mô (10⁻¹⁰ m và 10⁻¹⁵ m).",
    },
    sections: [
      {
        id: "b21-pre-setup",
        kind: "b21_pre_rutherford",
        phase: "before",
        title: "Nhận diện bộ thí nghiệm tán xạ hạt alpha và ghi dự đoán",
        shortTocTitle: "Nhận diện thiết bị & dự đoán",
        sgkPages: "tr. 91–92",
        minutes: 15,
        phenomenonPrompt:
          "Đối chiếu mô hình nguyên tử ban đầu của Thomson (Hình 21.1) với cấu tạo bộ thí nghiệm tán xạ hạt α (Hình 21.2a–21.2b: nguồn R, lá vàng D, màn huỳnh quang S, kính hiển vi M ở vị trí (1) và (2)).",
        evidencePrompt:
          "Chốt và khóa lưu dự đoán ban đầu kèm lí do, ghép đúng vai trò 4 bộ phận R–D–S–M, trả lời câu tự kiểm tra và ghi câu hỏi mang vào lớp.",
        teacherTip:
          "Giao trước giờ học (15 phút ở nhà). Đầu tiết mở nhanh thống kê dự đoán ban đầu của học sinh làm mâu thuẫn nhận thức mở màn cho Pha 2.",
        teacherGuide: {
          learningObjective:
            "Từ mô hình Thomson (Hình 21.1), nêu được dự đoán có lí do về đường đi của hạt α, nhận diện đúng chức năng 4 bộ phận cốt lõi (R, D, S, M) trên Hình 21.2 và phân biệt được đốm sáng trên màn S với đường quỹ đạo mô hình.",
          projectorStrategy:
            "Không giảng lại toàn bộ mô tả thiết bị; dành 2 phút đầu giờ chiếu Hình 21.1 cạnh Hình 21.2b và gọi 2 học sinh có dự đoán trái ngược đọc to “Sản phẩm mang vào lớp”.",
          openQuestions: [
            "Nếu điện tích dương trải đều khắp nguyên tử như Hình 21.1 thì lực đẩy lên hạt α có đủ mạnh để làm hạt bật ngược lại vị trí (2) không?",
            "Khi kính hiển vi M quay từ vị trí (1) sang vị trí (2) trên Hình 21.2b, mắt người quan sát thật sự nhìn thấy gì trên màn S?",
          ],
          commonMisconceptions:
            "Học sinh thường tưởng mắt đặt ở kính hiển vi M nhìn thấy cả vệt đường bay của hạt α, hoặc tự sửa lại dự đoán ban đầu sau khi đọc trước sách giáo khoa. Cách gỡ: Hệ thống khóa giữ nguyên dự đoán chốt lần đầu (initialPredictionChoice) và nhấn mạnh chỉ đốm sáng lóe lên trên màn S mới là dữ kiện quan sát trực tiếp.",
          noVideoFallback:
            "Học sinh hoàn thành trọn vẹn 100% nhiệm vụ Pha 1 bằng sơ đồ Hình 21.1, ảnh thiết bị Rutherford V3, mặt cắt Hình 21.2b (có số liệu tần suất vị trí (2) ít hơn (1) cỡ 10⁴ lần) và thao tác nối vai trò ngay trên trang.",
          completionCriteriaNote:
            "Chỉ đánh dấu hoàn thành thực chất khi học sinh đã: (1) lưu dự đoán + lí do, (2) ghép đúng vai trò cả 4 bộ phận R–D–S–M, và (3) trả lời đúng câu tự kiểm tra Pha 1. Tuyệt đối không tính hoàn thành khi chỉ mở trang hoặc bấm phát video.",
        },
      },
      {
        id: "b21-rutherford-v3",
        kind: "b21_rutherford_v3",
        phase: "in_class",
        title: "Thí nghiệm tán xạ hạt alpha (Rutherford V3)",
        shortTocTitle: "Thí nghiệm tán xạ hạt alpha",
        sgkPages: "tr. 91–92",
        minutes: 15,
        phenomenonPrompt:
          "Bắn hạt α vào lá vàng mỏng ở cùng động năng E nhưng thay đổi tham số va chạm b để quan sát vị trí đốm sáng và góc tán xạ θ, đối chiếu 3 câu hỏi thảo luận SGK tr. 92.",
        evidencePrompt:
          "Đối chiếu với dự đoán ban đầu đã khóa ở Pha 1, lưu hai lượt đo cùng E khác b và giải thích 3 hiện tượng: đa số tới vị trí (1), lực đẩy tĩnh điện làm lệch hướng, và tỉ lệ ~10⁻⁴ bật về vị trí (2).",
        activityKey: "rutherford_alpha_scattering",
        teacherTip:
          "Chiếu bàn thí nghiệm nền tối lên màn hình lớp (15 phút). Nhắc học sinh giữ nguyên E giữa hai lượt lưu để cô lập vai trò của khoảng cách b tới tâm hạt nhân.",
        teacherGuide: {
          learningObjective:
            "Thực hiện phép đo trên mô phỏng Rutherford V3 để kiểm chứng dự đoán Pha 1 và trả lời trọn vẹn 3 câu hỏi thảo luận SGK tr. 92 về cấu trúc rỗng của nguyên tử và hạt nhân tích điện dương rất nhỏ.",
          projectorStrategy:
            "Chiếu hộp “Sản phẩm Pha 1 đã lưu” ở đầu mục, sau đó bật bàn thí nghiệm Rutherford V3 chế độ tách rõ 2 lớp hiển thị: chỉ bật lớp đốm sáng màn S trước, rồi mới bật lớp quỹ đạo mô hình để giải thích góc lệch θ khi b giảm.",
          openQuestions: [
            "Vì sao ở vị trí (1) đối diện nguồn R lại thu được hầu hết các đốm sáng dù lá vàng D dày tới khoảng 1000 lớp nguyên tử?",
            "Điều gì phải tồn tại ở tâm nguyên tử để khoảng 1 trong 10⁴ hạt α bị đẩy bật ngược về vị trí (2) với góc lệch trên 90°?",
          ],
          commonMisconceptions:
            "Học sinh dễ nghĩ hạt α bật ngược do “va chạm cơ học như hai viên bi cứng” hoặc nghĩ electron làm lệch hạt α. Cách gỡ: Nhấn mạnh electron nhẹ hơn hạt α khoảng 7300 lần nên không thể làm bật ngược hạt α; nguyên nhân là lực đẩy tĩnh điện Coulomb cực mạnh từ điện tích dương +Ze tập trung trong vùng rất nhỏ.",
          noVideoFallback:
            "Sử dụng trực tiếp bàn thí nghiệm tương tác Rutherford V3 và bảng đối chiếu 3 câu hỏi thảo luận SGK tr. 92 ngay trên trang để cả lớp khảo sát theo từng giá trị tham số va chạm b.",
          completionCriteriaNote:
            "Hoàn thành khi mô phỏng Rutherford V3 báo đủ 2 lượt đo hợp lệ (cùng E, khác b) và hoàn tất phiếu lập luận.",
        },
      },
      {
        id: "b21-atomic-models",
        kind: "b21_atomic_models",
        phase: "in_class",
        title: "So sánh các mô hình nguyên tử",
        shortTocTitle: "So sánh các mô hình nguyên tử",
        sgkPages: "tr. 91–93",
        minutes: 10,
        phenomenonPrompt:
          "Đối chiếu trên cùng một nguyên tử Hydrogen trung hòa (¹₁H): Hình 21.1 (Thomson), Hình 21.5a (hành tinh nguyên tử Rutherford: Khoảng trống, Hạt nhân, Quỹ đạo của electron) và Hình 21.5b (Đám mây electron).",
        evidencePrompt:
          "Chọn mô hình khớp trực tiếp với bằng chứng hạt α lệch góc lớn trên lá vàng, viết câu giải thích và phân biệt Hình 21.5a với Hình 21.5b.",
        teacherTip:
          "Trên máy chiếu lớp học (10 phút), bật “Đặt Thomson – Rutherford cạnh nhau” để cả lớp thấy vùng +1e thu về tâm; sau đó chuyển sang Đám mây electron lấy +1 mẫu rồi +100 mẫu.",
        teacherGuide: {
          learningObjective:
            "So sánh được sự phân bố điện tích dương và cách mô tả electron giữa Hình 21.1 (Thomson), Hình 21.5a (mô hình hành tinh nguyên tử Rutherford) và Hình 21.5b (mô hình đám mây electron).",
          projectorStrategy:
            "Chiếu song song Thomson – Rutherford để chốt kết luận từ thí nghiệm lá vàng, rồi chuyển nhanh sang Hình 21.5b lấy mẫu vị trí electron để học sinh thấy đám mây không phải electron bị “nhòe ra” mà là mật độ xác suất tìm thấy electron.",
          openQuestions: [
            "Điểm chung quan trọng nhất về hạt nhân giữa Hình 21.5a và Hình 21.5b là gì?",
            "Thí nghiệm lá vàng của Rutherford chứng minh trực tiếp hạt nhân nhỏ ở tâm hay chứng minh hình dạng đám mây electron?",
          ],
          commonMisconceptions:
            "Học sinh hay hiểu lầm “đám mây electron” nghĩa là 1 electron vỡ vụn trải đều khắp không gian. Cách gỡ: Dùng nút lấy mẫu từng chấm vị trí trên mô phỏng để chỉ rõ mỗi lần đo electron vẫn là một hạt tại một vị trí, còn đám mây biểu diễn vùng xác suất.",
          noVideoFallback:
            "Dùng trực tiếp mô phỏng so sánh 3 mô hình nguyên tử kèm thẻ đối chiếu Hình 21.1, Hình 21.5a và Hình 21.5b ngay bên dưới.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh khảo sát mô phỏng so sánh và gửi lập luận đối chiếu đúng mô hình với bằng chứng tán xạ.",
        },
      },
      {
        id: "b21-structure-size",
        kind: "b21_structure_size",
        phase: "in_class",
        title: "Cấu tạo và kích thước hạt nhân",
        shortTocTitle: "Cấu tạo và kích thước hạt nhân",
        sgkPages: "tr. 93–94",
        minutes: 10,
        phenomenonPrompt:
          "Dùng hạt nhân Silic-28 (²⁸₁₄Si), các hằng số khối lượng m_p, m_n, amu (SGK tr. 93) và Bảng 21.1 đầy đủ 8 nguyên tố (SGK tr. 94) để khảo sát thành phần nucleon và tỉ lệ kích thước nguyên tử / hạt nhân.",
        evidencePrompt:
          "Đọc dòng dữ liệu Silicon (A = 28) trên Bảng 21.1, giải thích vì sao hình minh họa phải phóng lớn hạt nhân và dựng đúng hạt nhân mẫu.",
        activityKey: "nuclear_structure_builder",
        teacherTip:
          "Dành 10 phút: cho học sinh đọc trực tiếp đơn vị 10⁻¹⁰ m và 10⁻¹⁵ m ở đầu cột Bảng 21.1 trước khi làm phép chia tỉ số bán kính.",
        teacherGuide: {
          learningObjective:
            "Nêu được thành phần nucleon (proton, neutron), khối lượng theo kg và amu; đọc chính xác Bảng 21.1 (8 nguyên tố SGK tr. 94), vận dụng công thức R = 1,2·10⁻¹⁵·A¹/³ (m) và giải thích vì sao sơ đồ nguyên tử không thể vẽ hạt nhân theo đúng tỉ lệ thực.",
          projectorStrategy:
            "Chiếu Bảng 21.1 và khoanh đỏ hai mũ lũy thừa 10⁻¹⁰ m (nguyên tử) so với 10⁻¹⁵ m (hạt nhân). Gọi học sinh đọc dòng Silicon (A = 28: 2,1·10⁻¹⁰ m và 3,1·10⁻¹⁵ m) và tính nhanh tỉ số cỡ 6,8·10⁴ lần.",
          openQuestions: [
            "Trên Bảng 21.1, khi số khối A tăng từ 1 (Hydrogen) lên 238 (Uranium) thì bán kính hạt nhân tăng theo quy luật nào, có tăng gấp 238 lần không?",
            "Nếu vẽ nguyên tử Silicon rộng bằng mặt bàn học (1 m) theo đúng tỉ lệ thực thì chấm hạt nhân ở tâm rộng bao nhiêu mi-li-mét?",
          ],
          commonMisconceptions:
            "Học sinh rất hay đọc lướt con số 2,1 và 3,1 ở dòng Silicon mà quên nhân 10⁻¹⁰ m và 10⁻¹⁵ m nên tưởng hạt nhân lớn hơn nguyên tử, hoặc tưởng bán kính R tỉ lệ bậc nhất với A thay vì A¹/³. Cách gỡ: Bắt buộc điền kèm bậc độ lớn trong phiếu đọc Bảng 21.1.",
          noVideoFallback:
            "Dùng trực tiếp Bảng 21.1 chuẩn SGK tr. 94, hộp hằng số khối lượng tr. 93, bài tập đọc bảng có lưu localStorage và mô phỏng dựng hạt nhân trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh trả lời đúng nhiệm vụ đọc Bảng 21.1 & giải thích tỉ lệ phóng đại hoặc hoàn thành mô phỏng dựng hạt nhân.",
        },
      },
      {
        id: "b21-symbol-isotopes",
        kind: "b21_symbol_isotopes",
        phase: "in_class",
        title: "Kí hiệu hạt nhân và đồng vị",
        shortTocTitle: "Kí hiệu hạt nhân và đồng vị",
        sgkPages: "tr. 94–95",
        minutes: 10,
        phenomenonPrompt:
          "Đọc kí hiệu chuẩn ᴬᶻX và kí hiệu rút gọn ᴬX, tính N = A − Z, so sánh ba đồng vị Hydrogen (¹₁H, ²₁H, ³₁H) và giải thích sự khác nhau về khối lượng riêng.",
        evidencePrompt:
          "Hoàn thành bài tập nhanh tính N = A − Z, đối chiếu bảng ba đồng vị Hydrogen đúng thuật ngữ SGK tr. 95 và trả lời câu hỏi khối lượng riêng đồng vị.",
        activityKey: "isotope_and_nuclear_size",
        teacherTip:
          "Dành 10 phút cuối tiết trên lớp: kiểm tra cách viết chỉ số A (trên, trái) và Z (dưới, trái), giải thích rõ vì sao viết rút gọn ¹²C vẫn đủ thông tin.",
        teacherGuide: {
          learningObjective:
            "Viết và đọc đúng kí hiệu hạt nhân ᴬᶻX (cùng dạng rút gọn ᴬX), tính được số neutron N = A − Z, phân biệt ba đồng vị của Hydrogen (Hydrogen thường ¹₁H, Hydrogen nặng/deuterium ²₁H, Hydrogen siêu nặng/tritium ³₁H) và giải thích sự khác nhau về tính chất vật lí như khối lượng riêng.",
          projectorStrategy:
            "Chiếu kí hiệu ᴬᶻX cỡ lớn để chốt vị trí chỉ số, sau đó chiếu 3 hạt nhân ¹₁H – ²₁H – ³₁H cạnh nhau cho học sinh đếm nhanh proton và neutron rồi thảo luận câu hỏi khối lượng riêng nước nặng D₂O so với H₂O.",
          openQuestions: [
            "Vì sao khi viết rút gọn là ¹²C hay ²³⁵U mà không ghi chỉ số dưới Z, ta vẫn biết chắc chắn số proton trong hạt nhân?",
            "Hai đồng vị ²₁H và ¹₁H có cùng kích thước vỏ nguyên tử xấp xỉ nhau nhưng hạt nhân ²₁H nặng gấp đôi; vậy khối lượng riêng của chúng ở cùng điều kiện khác nhau thế nào?",
          ],
          commonMisconceptions:
            "Học sinh thường nhầm chỉ số trên A là số neutron N, hoặc nghĩ các đồng vị của cùng nguyên tố thì mọi tính chất vật lí và hóa học đều giống hệt nhau. Cách gỡ: Chỉ rõ cùng Z nên tính chất hóa học tương tự, nhưng khác A nên khối lượng hạt nhân, khối lượng riêng và tính bền phóng xạ khác nhau.",
          noVideoFallback:
            "Dùng bảng so sánh 3 đồng vị Hydrogen chuẩn SGK tr. 95, thẻ bài tập nhanh N = A − Z, câu hỏi khối lượng riêng và mô phỏng khảo sát đồng vị ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh giải đúng bài tập nhanh N = A − Z + câu hỏi khối lượng riêng đồng vị hoặc hoàn thành hoạt động khảo sát đồng vị.",
        },
      },
      {
        id: "b21-after-transfer",
        kind: "b21_after_transfer",
        phase: "after",
        title: "Kiểm tra, đánh giá: Thay lá vàng bằng lá nhôm mỏng ²⁷₁₃Al",
        shortTocTitle: "Kiểm tra, đánh giá (²⁷₁₃Al)",
        sgkPages: "tr. 95 · Vận dụng",
        minutes: 15,
        phenomenonPrompt:
          "Vận dụng sang tình huống mới sau giờ học: giữ nguyên nguồn phát α nhưng thay lá vàng ¹⁹⁷₇₉Au bằng lá nhôm mỏng ²⁷₁₃Al và nhìn lại dự đoán ban đầu ở Pha 1.",
        evidencePrompt:
          "Tính Z = 13, N = 14, bán kính gần đúng R = 3,6 fm (3,6 × 10⁻¹⁵ m) của ²⁷₁₃Al, giải thích sự thay đổi góc lệch tán xạ và viết câu đối chiếu lại dự đoán Pha 1.",
        teacherTip:
          "Giao sau giờ học (15 phút) để kiểm tra trọn vẹn chuỗi năng lực B21: đọc kí hiệu → tính R theo A¹/³ → suy luận tán xạ Coulomb → phản tư nhận thức Pha 1.",
        teacherGuide: {
          learningObjective:
            "Chuyển giao được mô hình hạt nhân và công thức bán kính R = 1,2·10⁻¹⁵·A¹/³ sang hạt nhân ²⁷₁₃Al (tính đúng Z = 13, N = 14, R = 3,6 fm), dự đoán định tính sự giảm góc tán xạ so với ¹⁹⁷₇₉Au và tự đánh giá sự thay đổi nhận thức so với dự đoán Pha 1.",
          projectorStrategy:
            "Dùng làm nhiệm vụ củng cố sau giờ học hoặc phiếu kiểm tra 5–10 phút đầu tiết kế tiếp; chiếu lại dự đoán khóa ở Pha 1 cạnh câu phản tư Pha 3 để ghi nhận tiến bộ nhận thức của học sinh.",
          openQuestions: [
            "Vì sao hạt nhân ²⁷₁₃Al có số khối A = 27 rất thuận lợi để tính nhẩm căn bậc ba trong công thức R = 1,2·A¹/³ (fm)?",
            "So với suy nghĩ ban đầu của em ở Pha 1 trước khi lên lớp, bằng chứng thực nghiệm nào làm em thuyết phục nhất về sự tồn tại của hạt nhân nhỏ ở tâm?",
          ],
          commonMisconceptions:
            "Học sinh dễ quên lấy căn bậc ba của 27 (lấy 1,2 × 27 thay vì 1,2 × 3 = 3,6 fm) hoặc nghĩ hạt nhân nhẹ hơn thì đẩy hạt α mạnh hơn. Cách gỡ: Phản hồi tức thì nhắc 27¹/³ = 3 và lực đẩy tĩnh điện tỉ lệ thuận với điện tích hạt nhân bia +Ze.",
          noVideoFallback:
            "Phiếu bài tập vận dụng tương tác có chấm phản hồi tức thì và lưu trọn vẹn đáp án vào sổ học tập cục bộ (localStorage), hoạt động độc lập không cần video.",
          completionCriteriaNote:
            "Chỉ ghi nhận hoàn thành khi học sinh nhập đúng Z = 13, N = 14, R = 3,6 fm, chọn đúng giải thích lực đẩy tĩnh điện và ghi nhận xét đối chiếu dự đoán Pha 1.",
        },
      },
    ],
  },
  {
    code: "B22",
    number: 22,
    title: "Phản ứng hạt nhân và năng lượng liên kết",
    sgkPages: "SGK tr. 96–103",
    guidingQuestion:
      "Vì sao vết sương trong buồng Blackett tách làm hai nhánh và phần khối lượng hụt đi của hạt nhân chuyển thành gì?",
    hubHighlight:
      "Vết phân nhánh buồng sương Blackett, bảo toàn A và Z, độ hụt khối Δm, đồ thị năng lượng liên kết riêng Eₗₖᵣ = Eₗₖ/A, phân hạch và nhiệt hạch.",
    lessonGoals: {
      knowledge:
        "Phân biệt được phản ứng hạt nhân tự phát và phản ứng hạt nhân kích thích qua thí nghiệm buồng sương Blackett; phát biểu định luật bảo toàn số khối (số nucleon) A và điện tích Z; nêu được độ hụt khối Δm, năng lượng liên kết Eₗₖ = Δm·c², năng lượng liên kết riêng Eₗₖᵣ = Eₗₖ/A, cơ chế phân hạch và tổng hợp hạt nhân (SGK tr. 96–103).",
      competence:
        "Nhận diện được 4 chi tiết trên vết phân nhánh chữ Y của Blackett và đối chiếu với tán xạ Rutherford (B21); cân bằng phương trình hạt nhân; đọc đồ thị Eₗₖᵣ theo số khối A (Hình 22.3) để giải thích chiều tỏa năng lượng của cả phân hạch lẫn nhiệt hạch.",
      quality:
        "Trung thực lưu giữ dự đoán ban đầu trước giờ học; cẩn trọng kiểm tra bảo toàn A, Z và quy đổi đơn vị amu – MeV/c² – MeV.",
    },
    sections: [
      {
        id: "b22-blackett-track",
        kind: "b22_blackett_track",
        phase: "before",
        title: "Vết phân nhánh trong thí nghiệm buồng sương Blackett",
        shortTocTitle: "Vết phân nhánh Blackett",
        sgkPages: "tr. 96–97",
        minutes: 12,
        phenomenonPrompt:
          "Quan sát Hình 22.1–22.2 (buồng sương chứa khí Nitrogen): giữa hàng chục nghìn vệt hạt α đi thẳng, có một vệt biến mất tại đỉnh rẽ nhánh chữ Y tạo vệt mảnh dài (¹₁H) và vệt đậm ngắn (¹⁷₈O).",
        evidencePrompt:
          "Khóa dự đoán ban đầu kèm lí do, ghép đúng 4 chi tiết vết chữ Y, đối chiếu với tán xạ Rutherford B21 và trả lời câu tự kiểm tra Pha 1.",
        teacherTip:
          "Giao trước giờ học (12 phút). Đầu giờ đối chiếu ngay câu trả lời của học sinh: ở B21 hạt α chỉ bật lệch còn ở B22 vệt α biến mất hoàn toàn để biến Nitrogen thành Oxygen.",
        teacherGuide: {
          learningObjective:
            "Nhận diện được dấu hiệu thực nghiệm của phản ứng hạt nhân kích thích đầu tiên (⁴₂He + ¹⁴₇N → ¹⁷₈O + ¹₁H) trên ảnh buồng sương Blackett và phân biệt với sự tán xạ đàn hồi hạt α ở Bài 21.",
          projectorStrategy:
            "Chiếu sơ đồ vết chữ Y nền tối, che chú thích và gọi học sinh chỉ rõ vì sao không có nhánh thứ 3 của hạt α đi tiếp sau điểm va chạm.",
          openQuestions: [
            "Nếu hạt α chỉ va chạm rồi nảy ra như trong thí nghiệm lá vàng Bài 21 thì sau điểm va chạm trong buồng sương phải có mấy vệt?",
            "Dựa vào độ dày và chiều dài hai nhánh sau điểm va chạm, nhánh nào là proton nhẹ, nhánh nào là hạt nhân Oxygen giật lùi?",
          ],
          commonMisconceptions:
            "Học sinh dễ nghĩ phản ứng hạt nhân cũng bảo toàn nguyên tố hóa học như phản ứng hóa học, hoặc nhầm nhánh đậm ngắn là hạt α đi tiếp. Cách gỡ: Đếm số vệt sau đỉnh chữ Y (chỉ có 2 vệt) và kiểm tra Z: 2 + 7 = 8 (Oxygen) + 1 (Hydrogen).",
          noVideoFallback:
            "Hoàn thành trọn vẹn Pha 1 bằng sơ đồ vết buồng sương Blackett (Hình 22.1–22.2), bảng đối chiếu B21–B22 và thao tác ghép 4 chi tiết ngay trên trang.",
          completionCriteriaNote:
            "Chỉ ghi nhận hoàn thành khi học sinh đã khóa dự đoán + lí do, ghép đúng 4/4 chi tiết vết chữ Y và trả lời đúng câu tự kiểm tra Pha 1.",
        },
      },
      {
        id: "b22-conservation",
        kind: "b22_conservation",
        phase: "in_class",
        title: "Bảo toàn số khối A và điện tích Z trong phản ứng hạt nhân",
        shortTocTitle: "Bảo toàn số khối & điện tích",
        sgkPages: "tr. 97–98",
        minutes: 10,
        phenomenonPrompt:
          "Phân biệt phản ứng hạt nhân tự phát với phản ứng hạt nhân kích thích; kiểm tra tổng số nucleon A và tổng điện tích Z trước – sau phản ứng.",
        evidencePrompt:
          "Đối chiếu Sản phẩm Pha 1, phân biệt hai loại phản ứng hạt nhân và cân bằng đúng các phương trình hạt nhân.",
        activityKey: "nuclear_reaction_balancer",
        teacherTip:
          "Dành 10 phút trên lớp: nhắc rõ neutron (¹₀n) có Z = 0, A = 1 và electron (⁰₋₁e) có Z = −1, A = 0; nhấn mạnh khối lượng nghỉ KHÔNG bảo toàn.",
        teacherGuide: {
          learningObjective:
            "Phân loại được phản ứng hạt nhân tự phát và kích thích; vận dụng định luật bảo toàn số nucleon A và bảo toàn điện tích Z để xác định hạt nhân chưa biết.",
          projectorStrategy:
            "Mở hộp Sản phẩm Pha 1 đã lưu để chuyển từ phương trình Blackett sang quy tắc tổng quát A₁ + A₂ = A₃ + A₄ và Z₁ + Z₂ = Z₃ + Z₄ trên mô phỏng cân bằng.",
          openQuestions: [
            "Trong phản ứng hạt nhân, số proton riêng lẻ và số neutron riêng lẻ có nhất thiết bảo toàn không, hay chỉ tổng số nucleon A bảo toàn?",
            "Điểm khác nhau cốt lõi giữa sự phân rã tự phát của ²³⁸₉₂U và phản ứng bắn phá ¹⁴₇N bằng hạt α là gì?",
          ],
          commonMisconceptions:
            "Học sinh hay áp dụng nhầm “định luật bảo toàn khối lượng” cho khối lượng nghỉ của các hạt nhân hoặc quên điện tích âm Z = −1 của hạt β⁻ (⁰₋₁e). Cách gỡ: Chỉ bảo toàn năng lượng toàn phần, số nucleon A và điện tích Z.",
          noVideoFallback:
            "Sử dụng bảng đối chiếu 2 loại phản ứng hạt nhân và bộ cân bằng phương trình tương tác trực tiếp trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh thực hành quan sát và cân bằng chính xác các phương trình phản ứng hạt nhân trong mô phỏng.",
        },
      },
      {
        id: "b22-binding-energy",
        kind: "b22_binding_energy",
        phase: "in_class",
        title: "Độ hụt khối Δm, năng lượng liên kết Eₗₖ và đồ thị năng lượng liên kết riêng Eₗₖᵣ",
        shortTocTitle: "Độ hụt khối & đồ thị Eₗₖᵣ",
        sgkPages: "tr. 98–100",
        minutes: 15,
        phenomenonPrompt:
          "So sánh tổng khối lượng các nucleon rời rạc với khối lượng hạt nhân thực tế trên cân hai đĩa (Hình 22.4, tr. 99) và khảo sát đồ thị năng lượng liên kết riêng Eₗₖᵣ = Eₗₖ/A theo số khối A (Hình 22.3 tr. 98 & Hình 22.5 tr. 100).",
        evidencePrompt:
          "Tính Δm, Eₗₖ, Eₗₖᵣ = Eₗₖ/A và chỉ ra vùng số khối bền vững nhất (đỉnh quanh ⁵⁶₂₆Fe – ⁸⁹₃₉Y ≈ 8,8 MeV/nucleon).",
        activityKey: "binding_energy_lab",
        teacherTip:
          "Dành 15 phút trọng tâm: thống nhất kí hiệu chuẩn SGK KNTT là Eₗₖ và Eₗₖᵣ = Eₗₖ/A; dùng Hình 22.3 (tr. 98) và Hình 22.5 (tr. 100) để giải thích cả phân hạch lẫn tổng hợp hạt nhân.",
        teacherGuide: {
          learningObjective:
            "Tính được độ hụt khối Δm = [Z·m_p + (A − Z)·m_n] − m_X, năng lượng liên kết Eₗₖ = Δm·c² và dùng năng lượng liên kết riêng Eₗₖᵣ = Eₗₖ/A để so sánh mức độ bền vững giữa các hạt nhân.",
          projectorStrategy:
            "Chiếu đồ thị Hình 22.3 – Hình 22.5 SGK (trục tung Eₗₖᵣ = Eₗₖ/A, trục hoành số khối A) cạnh sơ đồ cân hai đĩa Hình 22.4 (⁴₂He nhẹ hơn 2p + 2n) để học sinh thấy trực quan nguồn gốc Eₗₖ.",
          openQuestions: [
            "Hạt nhân ²³⁸₉₂U có năng lượng liên kết Eₗₖ rất lớn (~1800 MeV), vì sao nó lại kém bền hơn hạt nhân ⁵⁶₂₆Fe (Eₗₖ ≈ 492 MeV)?",
            "Muốn tách hạt nhân ⁴₂He trên đĩa cân Hình 22.4 thành 2 proton và 2 neutron riêng rẽ, hệ phải thu vào hay tỏa ra năng lượng tối thiểu bằng bao nhiêu?",
          ],
          commonMisconceptions:
            "Học sinh thường đánh giá độ bền hạt nhân dựa vào Eₗₖ thay vì tính trên một nucleon Eₗₖᵣ = Eₗₖ/A, hoặc nhầm dấu trong công thức Δm. Cách gỡ: Luôn lấy tổng khối lượng các nucleon tự do trừ khối lượng hạt nhân thực tế (Δm > 0).",
          noVideoFallback:
            "Dùng trực tiếp đồ thị SVG Hình 22.3 – 22.5 chuẩn kí hiệu Eₗₖᵣ, sơ đồ cân hai đĩa Hình 22.4 và phòng thí nghiệm tính Eₗₖ, Eₗₖᵣ ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh khảo sát và hoàn tất bài toán tính Δm, Eₗₖ, Eₗₖᵣ trên phòng thí nghiệm năng lượng liên kết.",
        },
      },
      {
        id: "b22-fission",
        kind: "b22_fission",
        phase: "in_class",
        title: "Phản ứng phân hạch hạt nhân ²³⁵₉₂U",
        shortTocTitle: "Phân hạch hạt nhân",
        sgkPages: "tr. 100–102",
        minutes: 12,
        phenomenonPrompt:
          "Theo dõi một neutron nhiệt (< 0,1 eV) bị ²³⁵₉₂U hấp thụ tạo trạng thái kích thích ²³⁶₉₂U* rồi vỡ thành hai mảnh trung bình kèm k = 1, 2, 3 neutron thứ cấp và tỏa ~200 MeV (Hình 22.6).",
        evidencePrompt:
          "Ghi lại vai trò của neutron nhiệt, trung gian ²³⁶₉₂U* và điều kiện hệ số nhân neutron k kèm khối lượng tới hạn m_th (ô Em có biết Hình 22.7, tr. 102).",
        activityKey: "nuclear_fission",
        teacherTip:
          "Dành 12 phút: cho học sinh phân biệt 1 phân hạch đơn lẻ (Hình 22.6) với phản ứng phân hạch dây chuyền qua hệ số nhân neutron k (Hình 22.7).",
        teacherGuide: {
          learningObjective:
            "Mô tả được cơ chế phân hạch hạt nhân nặng (²³⁵₉₂U, ²³⁹₉₄Pu) khi hấp thụ neutron nhiệt và phân tích được các chế độ phản ứng dây chuyền (k < 1 tắt dần, k ≥ 1 tự duy trì).",
          projectorStrategy:
            "Chiếu mô phỏng phân hạch từng bước (neutron tới → ²³⁶₉₂U* → hai hạt nhân trung bình + k neutron) và đối chiếu năng lượng tỏa ra với đoạn PQ → QT trên Hình 22.5.",
          openQuestions: [
            "Vì sao phân hạch ²³⁵₉₂U là phản ứng hạt nhân kích thích nhưng vẫn có thể tự duy trì thành dây chuyền sau lần kích thích đầu tiên?",
            "Điều gì xảy ra với công suất tỏa nhiệt nếu hệ số nhân neutron giữ ở k = 1 so với k > 1?",
          ],
          commonMisconceptions:
            "Học sinh hay nhầm phân hạch ²³⁵₉₂U với phóng xạ tự phát, hoặc quên cộng neutron tới vào vế trái khi cân bằng phương trình phân hạch. Cách gỡ: Kiểm tra tổng A vế trái luôn là 1 + 235 = 236.",
          noVideoFallback:
            "Sử dụng phòng thí nghiệm phân hạch có hướng dẫn tương tác trực tiếp ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh thực hiện trọn vẹn các bước khảo sát trên phòng thí nghiệm phân hạch.",
        },
      },
      {
        id: "b22-fusion",
        kind: "b22_fusion",
        phase: "in_class",
        title: "Phản ứng tổng hợp hạt nhân (nhiệt hạch)",
        shortTocTitle: "Tổng hợp hạt nhân",
        sgkPages: "tr. 102–103",
        minutes: 8,
        phenomenonPrompt:
          "Tìm hiểu phản ứng tổng hợp hạt nhân bằng máy gia tốc của Oliphant (²₁H + ²₁H → ³₂He + ¹₀n, tỏa ~4 MeV) và điều kiện nhiệt độ 10⁷ – 10⁸ K kèm tiêu chuẩn Lawson n·Δt > 10¹⁴ s/cm³ (Em có biết, tr. 103).",
        evidencePrompt:
          "Giải thích vì sao cần nhiệt độ cực cao 10⁷ – 10⁸ K để thắng lực đẩy tĩnh điện Coulomb giữa hai hạt nhân nhẹ và so sánh với phản ứng phân hạch.",
        activityKey: "nuclear_fusion",
        teacherTip:
          "Dành 8 phút cuối tiết trên lớp: nhấn mạnh vì sao gọi là phản ứng “nhiệt hạch” (cần động năng nhiệt cực lớn để thắng lực đẩy Coulomb giữa hai hạt nhân dương).",
        teacherGuide: {
          learningObjective:
            "Nêu được bản chất phản ứng tổng hợp hạt nhân (đoạn MN → NT trên Hình 22.5), điều kiện nhiệt độ 10⁷ – 10⁸ K để thắng lực đẩy Coulomb và hai điều kiện bổ sung của Lawson (mật độ n, thời gian duy trì Δt).",
          projectorStrategy:
            "Chiếu phản ứng ²₁H + ²₁H → ³₂He + ¹₀n và mô phỏng hai hạt nhân nhẹ tiến lại gần nhau ở nhiệt độ thấp (bật ra do lực đẩy tĩnh điện) so với ở 10⁷ – 10⁸ K (tiến vào phạm vi lực hạt nhân).",
          openQuestions: [
            "Vì sao để phản ứng phân hạch xảy ra người ta dùng neutron (không mang điện), còn phản ứng tổng hợp hai hạt nhân nhẹ lại cần nhiệt độ tới 10⁷ – 10⁸ K?",
            "So sánh phản ứng phân hạch và tổng hợp hạt nhân về nhiên liệu phản ứng và điều kiện xảy ra?",
          ],
          commonMisconceptions:
            "Học sinh tưởng chỉ cần đun nóng thoáng qua là duy trì được tổng hợp hạt nhân. Cách gỡ: Chỉ rõ ngoài nhiệt độ 10⁷–10⁸ K còn cần mật độ hạt nhân n đủ lớn và thời gian duy trì Δt đủ dài (n·Δt > 10¹⁴ s/cm³).",
          noVideoFallback:
            "Dùng thẻ dữ kiện SGK tr. 102–103 kết hợp mô phỏng tổng hợp hạt nhân trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh hoàn tất khảo sát điều kiện nhiệt hạch và câu hỏi kiểm tra trên mô phỏng.",
        },
      },
      {
        id: "b22-after-transfer",
        kind: "b22_after_transfer",
        phase: "after",
        title: "Kiểm tra, đánh giá: Đọc đồ thị Eₗₖᵣ và vận dụng định luật bảo toàn",
        shortTocTitle: "Kiểm tra, đánh giá (Eₗₖᵣ)",
        sgkPages: "tr. 103 · Vận dụng",
        minutes: 12,
        phenomenonPrompt:
          "Vận dụng đồ thị năng lượng liên kết riêng Eₗₖᵣ = Eₗₖ/A và định luật bảo toàn A, Z để giải thích chiều tỏa năng lượng và đối chiếu lại dự đoán Pha 1.",
        evidencePrompt:
          "Xác định số neutron sinh ra trong một kênh phân hạch ²³⁵₉₂U, chọn đúng lập luận từ đồ thị Eₗₖᵣ và viết câu giải thích lưu vào sổ học tập.",
        teacherTip:
          "Giao về nhà sau tiết học (12 phút) để đánh giá đồng thời kĩ năng bảo toàn số khối/điện tích và lập luận vật lí từ đồ thị Eₗₖᵣ.",
        teacherGuide: {
          learningObjective:
            "Vận dụng kết hợp định luật bảo toàn A, Z và đồ thị năng lượng liên kết riêng Eₗₖᵣ để giải bài toán phản ứng hạt nhân và giải thích cơ chế tỏa năng lượng.",
          projectorStrategy:
            "Dùng làm phiếu kiểm tra nhanh đầu tiết sau; chiếu một vài câu giải thích ngắn của học sinh để rèn cách diễn đạt chuẩn thuật ngữ Eₗₖᵣ.",
          openQuestions: [
            "Vì sao tổng số khối A trước và sau phản ứng bằng nhau nhưng tổng khối lượng nghỉ của các hạt sau phản ứng tỏa năng lượng lại nhỏ hơn trước phản ứng?",
            "Trên đồ thị Hình 22.3, cả phân hạch lẫn tổng hợp hạt nhân đều dẫn các hạt nhân dịch chuyển về vùng nào?",
          ],
          commonMisconceptions:
            "Học sinh viết nhầm “số khối A hụt đi biến thành năng lượng”. Cách gỡ: Khẳng định A là tổng số hạt nucleon (luôn nguyên và bảo toàn), còn Δm là độ chênh lệch khối lượng nghỉ.",
          noVideoFallback:
            "Phiếu đánh giá tương tác có phản hồi tức thì và lưu bền vững vào localStorage, không phụ thuộc video.",
          completionCriteriaNote:
            "Chỉ hoàn thành khi học sinh tính đúng số hạt trong phương trình, chọn đúng giải thích theo Eₗₖᵣ và viết lí do ngắn gọn.",
        },
      },
    ],
  },
  {
    code: "B23",
    number: 23,
    title: "Hiện tượng phóng xạ",
    sgkPages: "SGK tr. 104–113",
    guidingQuestion:
      "Không biết lúc nào một hạt nhân riêng lẻ phân rã, làm sao ta vẫn dự đoán chính xác độ phóng xạ của cả mẫu theo thời gian?",
    hubHighlight:
      "Ống đếm Geiger–Müller & Bảng 23.1 chuẩn SGK, bản chất tia α–β–γ, đồ thị bán rã N(t)–H(t) và biển cảnh báo phóng xạ Hình 23.8.",
    lessonGoals: {
      knowledge:
        "Nêu được định nghĩa và đặc điểm tự phát, ngẫu nhiên của hiện tượng phóng xạ qua số liệu ống đếm Geiger–Müller (Bảng 23.1); phân biệt bản chất, khả năng ion hóa và đâm xuyên của tia α, β⁻, β⁺, γ; viết và vận dụng công thức N(t) = N₀·2^(−t/T) = N₀·e^(−λt), độ phóng xạ H(t) = λN(t), biển cảnh báo (Hình 23.8) và 3 nguyên tắc an toàn bức xạ (SGK tr. 104–113).",
      competence:
        "Phân tích được tính ngẫu nhiên từ Bảng 23.1 (có khoảng 5 s đếm 3 xung, có khoảng 5 s đếm 0 xung); phân biệt rõ N(t) với H(t); vận dụng định tuổi bằng ¹⁴₆C và đề xuất biện pháp giảm liều chiếu xạ.",
      quality:
        "Tôn trọng dữ liệu thực nghiệm trung thực (phân biệt số liệu thật Bảng 23.1 với lượt mô phỏng); có ý thức tuân thủ biển cảnh báo và quy tắc an toàn bức xạ.",
    },
    sections: [
      {
        id: "b23-cloud-geiger",
        kind: "b23_cloud_geiger",
        phase: "before",
        title: "Ống đếm Geiger–Müller và Bảng 23.1 số xung trong từng khoảng 5 giây",
        shortTocTitle: "Ống Geiger & Bảng 23.1",
        sgkPages: "tr. 104–105",
        minutes: 12,
        phenomenonPrompt:
          "Tìm hiểu nguyên lí tạo xung điện trong ống đếm Geiger–Müller (Hình 23.2), vết tia trong buồng sương và đọc Bảng 23.1 số liệu thực nghiệm SGK tr. 105 (1, 3, 2, 0, 3, 1 xung).",
        evidencePrompt:
          "Khóa dự đoán ban đầu kèm lí do, đọc chính xác số xung ở khoảng 5–10 s và 15–20 s trên Bảng 23.1 và trả lời câu tự kiểm tra về tính ngẫu nhiên.",
        activityKey: "geiger_random_decay",
        teacherTip:
          "Giao trước giờ học (12 phút). Nhấn mạnh khoảng 15–20 s trên Bảng 23.1 có số xung bằng 0 dù nguồn phóng xạ vẫn ở nguyên vị trí.",
        teacherGuide: {
          learningObjective:
            "Giải thích được sơ lược cách ống đếm Geiger–Müller (Hình 23.2) biến mỗi hạt phóng xạ bay vào thành một xung điện đếm được, và rút ra bản chất ngẫu nhiên của phân rã phóng xạ từ Bảng 23.1 SGK tr. 105.",
          projectorStrategy:
            "Chiếu Bảng 23.1 (0–5 s: 1; 5–10 s: 3; 10–15 s: 2; 15–20 s: 0; 20–25 s: 3; 25–30 s: 1) và hỏi cả lớp vì sao khoảng 15–20 s máy ghi 0 xung không phải do máy hỏng hay hết chất phóng xạ.",
          openQuestions: [
            "Trên Bảng 23.1, hai khoảng thời gian 5–10 s và 15–20 s đều dài đúng 5 giây như nhau, vì sao số xung lại chênh từ 3 xung xuống 0 xung?",
            "Trong ống đếm Geiger–Müller (Hình 23.2), tác dụng nào của tia phóng xạ lên chất khí trong ống giúp tạo ra xung dòng điện tới bộ đếm?",
          ],
          commonMisconceptions:
            "Học sinh thường nghĩ nguồn phóng xạ phát hạt đều đặn theo nhịp đồng hồ (mỗi 5 giây phải ra số hạt bằng nhau) hoặc nhầm số liệu mô phỏng với Bảng 23.1 thực nghiệm. Cách gỡ: Tách bạch nhãn Bảng 23.1 SGK (tổng 10 xung/30 s) và chỉ thẳng vào ô 15–20 s có 0 xung.",
          noVideoFallback:
            "Hoàn thành trọn vẹn Pha 1 bằng sơ đồ ống đếm Geiger–Müller Hình 23.2, vết buồng sương và Bảng 23.1 chuẩn SGK tr. 105 ngay trên trang.",
          completionCriteriaNote:
            "Chỉ ghi nhận hoàn thành khi học sinh đã khóa dự đoán + lí do, nhập đúng cặp số xung Bảng 23.1 (3 xung và 0 xung) và trả lời đúng câu tự kiểm tra Pha 1.",
        },
      },
      {
        id: "b23-radiation-types",
        kind: "b23_radiation_types",
        phase: "in_class",
        title: "Đường đi trong điện từ trường và độ đâm xuyên của tia α, β, γ",
        shortTocTitle: "Bản chất & đâm xuyên α, β, γ",
        sgkPages: "tr. 105–107",
        minutes: 15,
        phenomenonPrompt:
          "Thử đặt tờ giấy, tấm nhôm vài mm và khối chì dày chắn trước các chùm tia α, β⁻, β⁺, γ đồng thời quan sát độ lệch trong điện trường và từ trường.",
        evidencePrompt:
          "Lập bảng so sánh bản chất hạt, điện tích, khả năng ion hóa và vật liệu chắn tối thiểu của tia α, β⁻, β⁺, γ.",
        activityKey: "radiation_properties",
        teacherTip:
          "Dành 15 phút trên lớp: lưu ý độ cong quỹ đạo của hạt α nhỏ hơn nhiều so với tia β vì khối lượng hạt α lớn gấp ~7300 lần electron.",
        teacherGuide: {
          learningObjective:
            "Phân biệt được bản chất, phương trình phân rã, khả năng ion hóa không khí, độ đâm xuyên và hướng lệch trong điện từ trường của 3 loại tia phóng xạ α, β (β⁻, β⁺) và γ.",
          projectorStrategy:
            "Chiếu thí nghiệm đặt lần lượt tờ giấy, lá nhôm, tấm chì chắn trước nguồn và yêu cầu học sinh liên hệ nghịch đảo giữa khả năng ion hóa mạnh (mất năng lượng nhanh → quãng đi ngắn của α) với khả năng đâm xuyên.",
          openQuestions: [
            "Vì sao tia α mang điện tích +2e lớn gấp đôi độ lớn điện tích tia β⁻ nhưng trong điện trường lại lệch ít hơn tia β⁻?",
            "Trong phân rã phóng xạ γ đi kèm sau phân rã α hoặc β, số khối A và điện tích Z của hạt nhân có thay đổi thêm không?",
          ],
          commonMisconceptions:
            "Học sinh dễ tưởng tia γ làm biến đổi hạt nhân sang nguyên tố khác hoặc tưởng tia α đâm xuyên mạnh nhất vì hạt α nặng nhất. Cách gỡ: Hạt α nặng và mang điện +2e nên ion hóa rất mạnh, mất hết năng lượng chỉ sau vài cm không khí hoặc 1 tờ giấy.",
          noVideoFallback:
            "Sử dụng trực tiếp mô phỏng độ đâm xuyên và độ lệch điện trường của các tia α, β, γ ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh khảo sát đủ các vật liệu che chắn và hoàn tất câu hỏi kiểm tra trên mô phỏng.",
        },
      },
      {
        id: "b23-half-life",
        kind: "b23_half_life",
        phase: "in_class",
        title: "Đồ thị bán rã N(t), chu kì bán rã T và độ phóng xạ H(t)",
        shortTocTitle: "Đồ thị bán rã & độ phóng xạ",
        sgkPages: "tr. 108–111",
        minutes: 18,
        phenomenonPrompt:
          "Đối chiếu Sản phẩm Pha 1 (tính ngẫu nhiên khi số hạt ít) với quy luật hàm mũ khi số hạt rất lớn; phân biệt rõ N(t) với độ phóng xạ H(t) = λN(t) và đọc Bảng 23.2.",
        evidencePrompt:
          "Phân biệt ý nghĩa, đơn vị của N(t) và H(t); xác định chu kì bán rã T trên đồ thị và giải thích vì sao sau 2T mẫu còn N₀/4.",
        activityKey: "radioactive_decay_half_life",
        teacherTip:
          "Dành 18 phút trọng tâm: đối chiếu lại Bảng 23.1 ở Pha 1 để học sinh hiểu vì sao mẫu vĩ mô (~10²⁰ hạt) lại tuân theo đường cong hàm mũ mượt.",
        teacherGuide: {
          learningObjective:
            "Phân biệt rạch ròi số hạt nhân chưa phân rã N(t) với độ phóng xạ H(t) = λN(t) = (ln 2 / T)·N(t); đọc được đồ thị hàm mũ qua các mốc T, 2T, 3T và tra cứu Bảng 23.2.",
          projectorStrategy:
            "Chiếu hộp Sản phẩm Pha 1 ở đầu mục để nối mạch “vi mô ngẫu nhiên → vĩ mô thống kê hàm mũ”, sau đó chiếu bảng so sánh N(t) và H(t) trước khi cho học sinh đo trên đồ thị.",
          openQuestions: [
            "Hai mẫu đồng vị ¹³¹I (T = 8 ngày) và ²³⁸U (T = 4,47 tỉ năm) có cùng số hạt nhân N₀ như nhau thì mẫu nào có độ phóng xạ H lớn hơn?",
            "Vì sao sau 1 chu kì bán rã T mất đi một nửa số hạt nhân mẹ, thì sau chu kì T tiếp theo mẫu không mất nốt nửa còn lại để về 0?",
          ],
          commonMisconceptions:
            "Học sinh rất hay đánh đồng N(t) và H(t) là một đại lượng hoặc quên đổi chu kì bán rã T ra giây (s) khi tính H = (ln 2 / T)·N theo đơn vị Becquerel (Bq). Cách gỡ: Đóng khung cảnh báo T phải tính bằng giây khi nhân với N để ra Bq.",
          noVideoFallback:
            "Dùng bảng đối chiếu N(t) – H(t), trích lục Bảng 23.2 SGK tr. 108 và mô phỏng đồ thị bán rã tương tác ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh thực hiện khảo sát đồ thị bán rã và trả lời đúng phiếu câu hỏi của hoạt động.",
        },
      },
      {
        id: "b23-safety",
        kind: "b23_safety",
        phase: "in_class",
        title: "Biển cảnh báo phóng xạ (Hình 23.8) và ba nguyên tắc an toàn bức xạ",
        shortTocTitle: "Biển cảnh báo & an toàn bức xạ",
        sgkPages: "tr. 111–113",
        minutes: 12,
        phenomenonPrompt:
          "Nhận diện hai biển cảnh báo phóng xạ chuẩn SGK tr. 111–112 (Hình 23.8a cánh quạt nền vàng & Hình 23.8b biển bổ sung nền đỏ nguồn nguy hiểm) và thử nghiệm 3 nguyên tắc Thời gian – Khoảng cách – Che chắn.",
        evidencePrompt:
          "Phân biệt ý nghĩa Hình 23.8a với Hình 23.8b và vận dụng 3 nguyên tắc an toàn bức xạ cho tình huống thực tế.",
        activityKey: "radiation_safety",
        teacherTip:
          "Dành 12 phút cuối tiết: chiếu rõ 2 biển cảnh báo Hình 23.8a–23.8b và phân biệt chiếu xạ ngoài với nhiễm xạ trong.",
        teacherGuide: {
          learningObjective:
            "Nhận biết đúng biển cảnh báo khu vực có phóng xạ (Hình 23.8a) và biển cảnh báo bổ sung nguồn phóng xạ nguy hiểm chết người cần tránh xa ngay (Hình 23.8b); áp dụng 3 nguyên tắc giảm liều chiếu xạ.",
          projectorStrategy:
            "Chiếu song song Hình 23.8a và Hình 23.8b, yêu cầu học sinh đọc thông điệp của 3 biểu tượng bên trong biển đỏ ISO (tia bức xạ, đầu lâu xương chéo, người chạy rời xa nguồn).",
          openQuestions: [
            "Khi bắt gặp một vật kim loại lạ rơi vãi có gắn biểu tượng Hình 23.8b, hành động đúng nhất của em là gì?",
            "Vì sao nguồn phát tia α đặt ngoài xa cơ thể ít nguy hiểm hơn tia γ, nhưng nếu hít phải bụi phóng xạ α vào phổi thì lại cực kì nguy hiểm?",
          ],
          commonMisconceptions:
            "Học sinh tưởng mặc áo mưa thông thường chắn được tia γ hoặc tưởng đứng gần nguồn γ chỉ vài phút thì không cần che chắn. Cách gỡ: Thử nghiệm trực tiếp khoảng cách (tỉ lệ nghịch bình phương) và độ dày chì trên mô phỏng.",
          noVideoFallback:
            "Dùng sơ đồ trực quan Hình 23.8a & Hình 23.8b chuẩn SGK tr. 111–112 và mô phỏng an toàn bức xạ ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh khảo sát đủ 3 yếu tố an toàn bức xạ và hoàn tất câu hỏi kiểm tra.",
        },
      },
      {
        id: "b23-carbon14",
        kind: "b23_carbon14",
        phase: "after",
        title: "Kiểm tra, đánh giá: Định tuổi mẫu gỗ cổ bằng đồng vị ¹⁴₆C",
        shortTocTitle: "Kiểm tra, đánh giá (¹⁴₆C)",
        sgkPages: "tr. 109–110 · Em có biết & Vận dụng",
        minutes: 15,
        phenomenonPrompt:
          "Đo độ phóng xạ ¹⁴₆C của mẫu gỗ khảo cổ so với mẫu gỗ đang sống cùng khối lượng (T ≈ 5 730 năm · ô Em có biết SGK tr. 109–110).",
        evidencePrompt:
          "Tính tuổi gần đúng của mẫu cổ vật từ tỉ số H/H₀ và nêu giả thiết cơ sở của phương pháp định tuổi ¹⁴₆C.",
        activityKey: "carbon14_dating",
        teacherTip:
          "Giao sau giờ học (15 phút): học sinh vận dụng trọn vẹn công thức H(t) = H₀·2^(−t/T) vào bài toán khảo cổ thực tế.",
        teacherGuide: {
          learningObjective:
            "Vận dụng định luật phóng xạ H(t) = H₀·2^(−t/T) để xác định niên đại mẫu vật hữu cơ cổ bằng đồng vị ¹⁴₆C (T ≈ 5 730 năm).",
          projectorStrategy:
            "Dùng làm nhiệm vụ vận dụng sau giờ học; lưu ý học sinh chỉ so sánh độ phóng xạ trên cùng một khối lượng carbon của mẫu cổ và mẫu sinh vật đang sống.",
          openQuestions: [
            "Vì sao khi cây còn sống tỉ lệ ¹⁴C/¹²C giữ gần không đổi, nhưng ngay khi cây chết thì lượng ¹⁴C bắt đầu giảm theo quy luật bán rã?",
            "Có thể dùng đồng vị ¹⁴₆C (T ≈ 5 730 năm) để đo tuổi một tảng đá hình thành cách đây hàng tỉ năm không? Vì sao?",
          ],
          commonMisconceptions:
            "Học sinh dùng nhầm H₀ của một mẫu gỗ có khối lượng khác mà không quy về cùng khối lượng carbon. Cách gỡ: Luôn kiểm tra điều kiện “cùng khối lượng” giữa mẫu cổ và mẫu đối chứng.",
          noVideoFallback:
            "Sử dụng phòng thí nghiệm định tuổi Carbon-14 tương tác trực tiếp ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh thực hành đo và xác định đúng tuổi mẫu khảo cổ trên mô phỏng.",
        },
      },
    ],
  },
  {
    code: "B24",
    number: 24,
    title: "Công nghiệp hạt nhân",
    sgkPages: "SGK tr. 114–118",
    guidingQuestion:
      "Năng lượng phân hạch trong lò phản ứng đi qua những vòng truyền nào để phát điện và đồng vị phóng xạ phục vụ y học, nông nghiệp ra sao?",
    hubHighlight:
      "Sơ đồ 3 vòng lưu chất Hình 24.1, điều khiển lò phản ứng Hình 24.3, lưu trữ nhiên liệu Hình 24.2, y học hạt nhân và chiếu xạ thực phẩm Hình 24.5.",
    lessonGoals: {
      knowledge:
        "Trình bày được nguyên lí chuyển hóa năng lượng và thiết kế an toàn các chu trình lưu chất tách biệt trong nhà máy điện hạt nhân (Hình 24.1), cấu tạo thiết bị lưu trữ nhiên liệu đã qua sử dụng (Hình 24.2) và vai trò thanh điều khiển hấp thụ neutron (Hình 24.3); nêu được ứng dụng phóng xạ trong y học hạt nhân, công nghệ sinh học – nông nghiệp (³²P) và chiếu xạ bảo quản thực phẩm (Hình 24.5, SGK tr. 114–118).",
      competence:
        "Chỉ rõ được bộ phận thực sự làm quay tua-bin (hơi nước áp suất cao ở chu trình thứ hai); giải thích cơ chế giữ hệ số nhân neutron k = 1; lập luận bằng bằng chứng cụ thể vì sao thực phẩm chiếu xạ giữ tươi lâu mà không bị nhiễm phóng xạ.",
      quality:
        "Nhìn nhận khách quan, khoa học về lợi ích kinh tế – y tế của công nghệ hạt nhân gắn liền với quy trình kiểm soát an toàn bức xạ nghiêm ngặt.",
    },
    sections: [
      {
        id: "b24-energy-chain",
        kind: "b24_energy_chain",
        phase: "before",
        title: "Bộ phận nào thực sự làm quay tua-bin trong nhà máy điện hạt nhân?",
        shortTocTitle: "Đường truyền năng lượng (Hình 24.1)",
        sgkPages: "tr. 114–115",
        minutes: 12,
        phenomenonPrompt:
          "Quan sát mặt cắt Hình 24.1 SGK: lần theo đường ống từ bộ phận sinh hơi đến tua-bin và phân biệt rõ 3 dòng lưu chất tách biệt (chu trình thứ nhất khép kín, chu trình thứ hai hơi nước – bộ ngưng tụ hơi, và nguồn nước làm mát ngoài).",
        evidencePrompt:
          "Khóa dự đoán ban đầu về bộ phận làm quay tua-bin, ghép đúng vai trò 3 dòng lưu chất trên Hình 24.1 và trả lời câu tự kiểm tra Pha 1.",
        activityKey: "nuclear_power_energy_flow",
        teacherTip:
          "Giao trước giờ học (12 phút). Đầu giờ dùng ngay câu hỏi “Bộ phận nào thực sự làm quay tua-bin?” để gỡ hiểu nhầm tia phóng xạ hay nước nhiễm xạ đập trực tiếp vào tua-bin.",
        teacherGuide: {
          learningObjective:
            "Xác định chính xác hơi nước áp suất cao ở chu trình thứ hai là tác nhân trực tiếp làm quay tua-bin, và giải thích lí do an toàn bức xạ khi tách kín các chu trình lưu chất trên Hình 24.1.",
          projectorStrategy:
            "Chiếu mặt cắt màu Hình 24.1 và gọi học sinh chỉ tay theo 3 màu đường ống: (1) chu trình thứ nhất cam/đỏ khép kín qua lò phản ứng, (2) chu trình thứ hai lam nhạt từ bộ phận sinh hơi quay tua-bin rồi về bộ ngưng tụ hơi, (3) nước làm mát lục lam qua bộ ngưng tụ/tháp làm mát.",
          openQuestions: [
            "Bộ phận nào thực sự làm quay tua-bin để kéo máy phát điện trên Hình 24.1?",
            "Điều gì sẽ xảy ra về mặt an toàn phóng xạ nếu dẫn thẳng chất tải nhiệt từ tâm lò phản ứng ra tua-bin và xả thẳng ra sông, biển?",
          ],
          commonMisconceptions:
            "Học sinh thường tưởng “tia phóng xạ đẩy cánh tua-bin quay” hoặc tưởng nước sông/biển bơm thẳng vào tâm lò phản ứng. Cách gỡ: Đối chiếu bảng chú giải 3 màu lưu chất trên Hình 24.1 — ba dòng chỉ trao đổi nhiệt qua thành ống kín, không bao giờ trộn lẫn.",
          noVideoFallback:
            "Hoàn thành trọn vẹn Pha 1 bằng sơ đồ mặt cắt màu Hình 24.1 có chú giải 3 dòng lưu chất, thao tác ghép vai trò và mô phỏng dòng năng lượng trên trang.",
          completionCriteriaNote:
            "Chỉ ghi nhận hoàn thành khi học sinh đã khóa dự đoán + lí do, ghép đúng 3 vòng lưu chất & tác nhân quay tua-bin, và trả lời đúng câu tự kiểm tra Pha 1.",
        },
      },
      {
        id: "b24-reactor-control",
        kind: "b24_reactor_control",
        phase: "in_class",
        title: "Điều khiển phản ứng dây chuyền (Hình 24.3) & lưu trữ nhiên liệu đã qua sử dụng (Hình 24.2)",
        shortTocTitle: "Điều khiển lò & lưu trữ (Hình 24.2–24.3)",
        sgkPages: "tr. 115",
        minutes: 16,
        phenomenonPrompt:
          "Đối chiếu Sản phẩm Pha 1; điều chỉnh độ ngập thanh điều khiển chứa Bo/Cd để giữ k = 1 (ô Em có biết Hình 24.3) và tìm hiểu cấu tạo thiết bị lưu trữ nhiên liệu hạt nhân đã qua sử dụng (Hình 24.2).",
        evidencePrompt:
          "Giải thích cơ chế giữ k = 1 bằng thanh điều khiển hấp thụ neutron nhiệt, phân biệt với chất làm chậm, và nêu cấu tạo bảo vệ nhiều lớp của thiết bị lưu trữ nhiên liệu Hình 24.2.",
        activityKey: "reactor_control_concept",
        teacherTip:
          "Dành 16 phút trên lớp: kết nối chu trình thứ nhất ở Pha 1 với tâm lò phản ứng (Hình 24.3) và phân tích thiết bị lưu trữ nhiên liệu đã qua sử dụng (Hình 24.2, có đồng vị ⁹⁰Sr, ¹³⁷Cs chu kì bán rã ~30 năm).",
        teacherGuide: {
          learningObjective:
            "Giải thích được cơ chế điều chỉnh hệ số nhân neutron k = 1 bằng thanh điều khiển chứa Bo/Cd (Hình 24.3) và nguyên tắc thiết kế thiết bị lưu trữ nhiên liệu hạt nhân đã qua sử dụng có độ bền cao (Hình 24.2).",
          projectorStrategy:
            "Mở hộp Sản phẩm Pha 1 để nối từ chu trình thứ nhất vào tâm lò Hình 24.3, cho học sinh kéo thanh điều khiển xử lí khi k > 1 và quan sát sơ đồ thiết bị lưu trữ nhiên liệu Hình 24.2 (tường thép mạ nickel bọc quả cầu than chì, khe tản nhiệt, cửa hai lớp chốt kim loại).",
          openQuestions: [
            "Khi số neutron trong lò tăng quá nhiều (k > 1), hệ thống phải rút lên hay cho các thanh điều khiển chứa Bo/Cd ngập sâu vào khu vực nhiên liệu phân hạch?",
            "Vì sao thiết bị lưu trữ thanh nhiên liệu đã qua sử dụng (Hình 24.2) phải dùng tường thép mạ nickel bọc than chì, cửa hai lớp và khe tản nhiệt để cất giữ hàng trăm năm?",
          ],
          commonMisconceptions:
            "Học sinh hay nhầm thanh điều khiển dùng để “làm chậm neutron” hoặc tưởng nhiên liệu dùng xong là hết sạch tính phóng xạ. Cách gỡ: Chất làm chậm (mục 2 Hình 24.3) giảm tốc độ neutron, còn thanh điều khiển (mục 6) hấp thụ neutron thừa; thanh nhiên liệu cũ vẫn chứa ⁹⁰Sr, ¹³⁷Cs có T ≈ 30 năm tỏa nhiệt và phóng xạ mạnh.",
          noVideoFallback:
            "Sử dụng sơ đồ Hình 24.2 – Hình 24.3 SGK tr. 115 và mô phỏng điều khiển lò phản ứng ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh vận hành ổn định lò phản ứng và hoàn tất câu hỏi kiểm tra trên mô phỏng.",
        },
      },
      {
        id: "b24-medicine",
        kind: "b24_medicine",
        phase: "in_class",
        title: "Ứng dụng trong y học hạt nhân: Chẩn đoán hình ảnh và xạ trị",
        shortTocTitle: "Y học hạt nhân",
        sgkPages: "tr. 116–117",
        minutes: 15,
        phenomenonPrompt:
          "Khảo sát cách chọn đồng vị đánh dấu (như ¹³¹₅₃I, ⁹⁹ᵐ₄₃Tc, ¹⁸₉F) có chu kì bán rã ngắn để ghi hình chức năng (SPECT, PET) hoặc tiêu diệt tế bào khối u.",
        evidencePrompt:
          "Giải thích tiêu chí chọn đồng vị chẩn đoán (chu kì bán rã ngắn, phát tia xuyên thoát ra ngoài cơ thể) khác với đồng vị xạ trị tại chỗ.",
        activityKey: "nuclear_medicine",
        teacherTip:
          "Dành 15 phút: kết nối trực tiếp chu kì bán rã T ở Bài 23 với bài toán giảm liều tồn lưu cho bệnh nhân.",
        teacherGuide: {
          learningObjective:
            "Phân biệt được nguyên lí dùng đồng vị phóng xạ đánh dấu để chẩn đoán chức năng cơ quan (cần tia γ thoát ra ngoài để đầu thu ghi hình) và dùng bức xạ tiêu diệt tế bào ung thư trong xạ trị.",
          projectorStrategy:
            "Chiếu mô phỏng y học hạt nhân và cho học sinh chọn thử hai nguồn có đặc tính trái ngược để thấy ngay vì sao chẩn đoán không dùng nguồn phát thuần α chu kì dài.",
          openQuestions: [
            "Vì sao chụp X-quang chủ yếu cho ảnh cấu trúc xương/mô đặc, còn đưa dược chất phóng xạ như ¹³¹I hay ¹⁸F-FDG vào cơ thể lại cho biết hoạt động chuyển hóa của tuyến giáp hay khối u?",
            "Vì sao dược chất phóng xạ đưa vào người bệnh bắt buộc phải có chu kì bán rã ngắn (vài giờ đến vài ngày)?",
          ],
          commonMisconceptions:
            "Học sinh sợ mọi liều phóng xạ y học đều gây hại lâu dài vĩnh viễn. Cách gỡ: Nhấn mạnh liều chẩn đoán rất nhỏ và chu kì bán rã ngắn (ví dụ ¹⁸F chỉ 110 phút) kết hợp đào thải sinh học giúp hoạt độ giảm nhanh về mức nền.",
          noVideoFallback:
            "Sử dụng trực tiếp mô phỏng y học hạt nhân và bảng hồ sơ đồng vị ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh hoàn tất khảo sát chọn đồng vị chẩn đoán/xạ trị trên mô phỏng.",
        },
      },
      {
        id: "b24-bio-food",
        kind: "b24_bio_food",
        phase: "in_class",
        title: "Ứng dụng trong công nghệ sinh học, nông nghiệp và bảo quản thực phẩm",
        shortTocTitle: "Sinh học & bảo quản thực phẩm (Hình 24.5)",
        sgkPages: "tr. 117–118",
        minutes: 14,
        phenomenonPrompt:
          "Đối chiếu Hình 24.5 SGK tr. 118 (trái cây không chiếu xạ bị mốc hỏng vs trái cây đã chiếu xạ vẫn tươi), tìm hiểu đồng vị đánh dấu ³²P trong nông nghiệp và chọn giống đột biến.",
        evidencePrompt:
          "Viết câu trả lời ngắn nêu bằng chứng cụ thể giải thích vì sao chiếu xạ giữ thực phẩm tươi lâu mà không làm thực phẩm nhiễm phóng xạ.",
        activityKey: "radiation_applications",
        teacherTip:
          "Dành 14 phút cuối tiết: yêu cầu học sinh trích dẫn rõ cơ chế chiếu tia từ ngoài (không trộn nguồn phóng xạ vào thực phẩm) trong câu tự luận ngắn.",
        teacherGuide: {
          learningObjective:
            "Trình bày được ứng dụng đồng vị đánh dấu (như ³²P theo dõi hấp thụ phân bón), chiếu xạ tạo giống đột biến và giải thích khoa học vì sao thực phẩm chiếu xạ (Hình 24.5) an toàn, không mang tính phóng xạ.",
          projectorStrategy:
            "Chiếu khung đối chiếu trực quan Hình 24.5 (vải thiều sau 7 ngày bảo quản: mẫu đối chứng thâm mốc vs mẫu chiếu xạ tươi đỏ), sau đó cho học sinh viết 1–2 câu lập luận bằng chứng ngay trên phiếu.",
          openQuestions: [
            "Trên Hình 24.5, tác nhân nào trên vỏ quả vải đã bị chùm tia γ/electron tiêu diệt hoặc ức chế để quả không bị thối mốc nhanh?",
            "Chiếu tia γ xuyên qua thùng trái cây giống với việc chiếu ánh sáng/tia X đi qua hay giống việc rắc bụi phóng xạ lên trái cây?",
          ],
          commonMisconceptions:
            "Hiểu nhầm phổ biến nhất ngoài đời sống: “ăn trái cây chiếu xạ sẽ bị nhiễm phóng xạ”. Cách gỡ: Thực phẩm đi qua chùm tia bức xạ năng lượng kiểm soát (không kích hoạt hạt nhân thực phẩm và tuyệt đối không tiếp xúc với chất phóng xạ).",
          noVideoFallback:
            "Dùng sơ đồ đối chiếu Hình 24.5 SGK tr. 118, câu hỏi tự luận lưu localStorage và mô phỏng ứng dụng bức xạ trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh lưu câu giải thích có bằng chứng cụ thể hoặc hoàn tất hoạt động mô phỏng ứng dụng bức xạ.",
        },
      },
      {
        id: "b24-after-transfer",
        kind: "b24_after_transfer",
        phase: "after",
        title: "Kiểm tra, đánh giá: Lựa chọn giải pháp bức xạ an toàn trong thực tiễn",
        shortTocTitle: "Kiểm tra, đánh giá",
        sgkPages: "tr. 118 · Vận dụng",
        minutes: 12,
        phenomenonPrompt:
          "Đánh giá hồ sơ ứng dụng thực tế (chẩn đoán tuyến giáp, kiểm tra khuyết tật mối hàn công nghiệp, chiếu xạ nông sản xuất khẩu) và đối chiếu lại dự đoán Pha 1.",
        evidencePrompt:
          "Chọn giải pháp bức xạ phù hợp dựa trên khả năng đâm xuyên, chu kì bán rã và an toàn bức xạ.",
        teacherTip:
          "Giao sau giờ học (12 phút) để tổng hợp kiến thức liên bài B23–B24.",
        teacherGuide: {
          learningObjective:
            "Lựa chọn đúng loại bức xạ và chu kì bán rã phù hợp cho từng bài toán công nghiệp, y tế, nông nghiệp thực tiễn.",
          projectorStrategy:
            "Dùng làm nhiệm vụ đánh giá sau giờ học; rà soát mức độ học sinh vận dụng liên thông đặc tính tia α, β, γ sang ứng dụng thực tế.",
          openQuestions: [
            "Để chụp ảnh kiểm tra vết nứt bên trong mối hàn ống thép dày ở công trường, ta cần nguồn phát tia α, β hay γ? Vì sao?",
            "Sau bài học hôm nay, em giải thích thế nào với người thân về sự an toàn của vòng hơi quay tua-bin điện hạt nhân và trái cây chiếu xạ?",
          ],
          commonMisconceptions:
            "Học sinh chọn tia α để soi mối hàn kim loại hoặc chọn đồng vị chu kì hàng trăm năm để tiêm chẩn đoán. Cách gỡ: Đối chiếu độ đâm xuyên và liều tích lũy sinh học.",
          noVideoFallback:
            "Phiếu đánh giá tương tác có phản hồi giải thích chi tiết và lưu localStorage.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh trả lời chính xác câu hỏi tình huống vận dụng thực tiễn.",
        },
      },
    ],
  },
  {
    code: "B25",
    number: 25,
    title: "Bài tập về vật lí hạt nhân",
    sgkPages: "SGK tr. 119–122",
    guidingQuestion:
      "Từ hiện tượng tĩnh điện kế phóng điện và Bảng 25.1 đo độ phóng xạ theo thời gian, ta xác định chu kì bán rã và giải bài toán hạt nhân thế nào?",
    hubHighlight:
      "Tĩnh điện kế kim chỉ Hình 25.1, tự ước lượng T từ Bảng 25.1, cân bằng phương trình – năng lượng liên kết Eₗₖᵣ và liều dược chất ¹⁸F-FDG.",
    lessonGoals: {
      knowledge:
        "Hệ thống hóa và vận dụng tổng hợp kiến thức toàn Chương IV: cơ chế ion hóa không khí làm tĩnh điện kế mất điện tích (Hình 25.1), định luật bảo toàn A và Z, công thức độ hụt khối Δm, năng lượng liên kết Eₗₖ, năng lượng liên kết riêng Eₗₖᵣ = Eₗₖ/A và định luật phóng xạ H(t) = H₀·2^(−t/T) (SGK tr. 119–122).",
      competence:
        "Bác bỏ được giả thuyết sai về sự phóng điện của tĩnh điện kế Hình 25.1; tự đọc Bảng 25.1 để tìm khoảng kẹp H₀/2 và ước lượng chu kì bán rã T trước khi đối chiếu đường cong; giải được bài toán thực tiễn liều dược chất phóng xạ ¹³¹I và ¹⁸F-FDG (Bài 6 tr. 122).",
      quality:
        "Trung thực khi tự ước lượng số liệu thực nghiệm trước khi xem lời giải; cẩn thận với chữ số có nghĩa và đơn vị đo.",
    },
    sections: [
      {
        id: "b25-electroscope",
        kind: "b25_electroscope",
        phase: "before",
        title: "Hiện tượng tĩnh điện kế phóng điện khi đưa nguồn phóng xạ lại gần",
        shortTocTitle: "Tĩnh điện kế (Hình 25.1)",
        sgkPages: "tr. 119 · Hình 25.1",
        minutes: 12,
        phenomenonPrompt:
          "Quan sát Hình 25.1 SGK gồm nguồn phóng xạ (1), bản góp điện tích (2) và kim tĩnh điện kế (3): khi đưa nguồn (1) lại gần bản góp (2) của tĩnh điện kế đã tích điện, góc lệch của kim (3) giảm dần về 0.",
        evidencePrompt:
          "Khóa dự đoán ban đầu, nhận diện đúng 3 bộ phận (1)–(2)–(3) trên Hình 25.1, giải thích bằng sự ion hóa không khí và dự đoán hiện tượng khi chắn tờ giấy.",
        teacherTip:
          "Giao trước giờ học (12 phút). Mở đầu tiết bài tập bằng câu hỏi phản biện: nếu nguồn chỉ phát 1 loại hạt mang điện thì điều gì xảy ra khi đổi dấu điện tích tĩnh điện kế?",
        teacherGuide: {
          learningObjective:
            "Giải thích đúng hiện tượng Bài 25.1 (Hình 25.1 SGK tr. 119): tia phóng xạ ion hóa không khí tạo cả ion dương và ion âm/electron tự do nên tĩnh điện kế tích điện dương hay âm đều bị trung hòa làm kim (3) trở về 0.",
          projectorStrategy:
            "Chiếu Hình 25.1 với đúng 3 kí hiệu (1) nguồn phóng xạ, (2) bản góp, (3) kim tĩnh điện kế; đặt câu hỏi phản biện bác bỏ giả thuyết “hạt mang điện từ nguồn bay trực tiếp sang trung hòa bản góp”.",
          openQuestions: [
            "Nếu giải thích sai rằng “nguồn (1) chỉ phát hạt mang điện dương bay tới trung hòa bản góp (2) đang tích điện âm”, thì khi tích điện DƯƠNG cho bản góp (2), kim (3) lẽ ra phải lệch tăng hay giảm?",
            "Thực nghiệm cho thấy dù bản góp (2) tích điện dương hay âm thì kim (3) đều giảm về 0; điều đó chứng tỏ tia phóng xạ đã tác dụng gì lên lớp không khí quanh bản góp (2)?",
          ],
          commonMisconceptions:
            "Học sinh hay tưởng bản thân điện tích của hạt α hay β từ nguồn bay vào trung hòa trực tiếp quả cầu/bản góp. Cách gỡ: Số hạt trực tiếp rất ít và chỉ mang 1 dấu điện; chính hàng vạn cặp ion (+ / −) sinh ra do ion hóa không khí mới trung hòa bản góp ở cả hai dấu điện tích.",
          noVideoFallback:
            "Hoàn thành trọn vẹn Pha 1 bằng sơ đồ tĩnh điện kế kim chỉ Hình 25.1 đúng kí hiệu (1)–(2)–(3), thao tác nhận diện và câu hỏi phản hồi trên trang.",
          completionCriteriaNote:
            "Chỉ ghi nhận hoàn thành khi học sinh đã khóa dự đoán + lí do, ghép đúng 3 kí hiệu (1)–(2)–(3) trên Hình 25.1 và trả lời đúng câu tự kiểm tra Pha 1.",
        },
      },
      {
        id: "b25-table-25-1",
        kind: "b25_table_25_1",
        phase: "in_class",
        title: "Phân tích Bảng 25.1 và tự ước lượng chu kì bán rã từ đồ thị H(t)",
        shortTocTitle: "Bảng 25.1 & đồ thị H(t)",
        sgkPages: "tr. 121 · Bảng 25.1",
        minutes: 25,
        phenomenonPrompt:
          "Đối chiếu Sản phẩm Pha 1; đọc 8 cặp số liệu thực nghiệm (t, H) trong Bảng 25.1 SGK tr. 121 (từ t = 0 s, H₀ = 151 Bq đến t = 360 s, H = 9 Bq) để tự tìm khoảng kẹp H₀/2 và ước lượng chu kì bán rã T.",
        evidencePrompt:
          "Tự tính giá trị H₀/2 kèm đơn vị Bq, xác định hai mốc thời gian kẹp H₀/2 trên Bảng 25.1, nhập giá trị ước lượng T (s) và viết câu giải thích cách ước lượng.",
        activityKey: "nuclear_physics_practice_lab",
        teacherTip:
          "Dành 25 phút trên lớp: để học sinh ở chế độ Học sinh tự tính H₀/2 và ước lượng T trước; chỉ mở khung Lời giải chi tiết trong Chế độ Giáo viên sau khi cả lớp đã chốt số ước lượng.",
        teacherGuide: {
          learningObjective:
            "Đọc thành thạo bảng số liệu thực nghiệm (t, H), tự xác định mức một nửa hoạt độ ban đầu H₀/2, kẹp khoảng thời gian và ước lượng chu kì bán rã T có tính đến thăng giáng thống kê thực nghiệm.",
          projectorStrategy:
            "Khi học sinh đang làm việc, bật “Xem như học sinh” để màn chiếu KHÔNG lộ sẵn con số T ≈ 39,5 s; sau 10 phút thu kết quả ước lượng của các nhóm rồi quay lại Chế độ Giáo viên mở khung Hướng dẫn giải chi tiết để chốt.",
          openQuestions: [
            "Tại t = 0 s, H₀ = 151 Bq thì một nửa độ phóng xạ ban đầu bằng bao nhiêu Bq và nằm giữa hai cột mốc thời gian nào của Bảng 25.1?",
            "Vì sao nếu kiểm tra tiếp từ 60 s (55 Bq) đến 120 s (31 Bq) thì khoảng giảm một nửa lại xấp xỉ 60 s chứ không đúng bằng 40 s như đoạn đầu?",
          ],
          commonMisconceptions:
            "Học sinh coi số đo thực nghiệm phải nằm khít tuyệt đối trên đường cong lí thuyết nên lúng túng khi tỉ số giữa các mốc không đều nhau. Cách gỡ: Nhắc lại Bảng 23.1 — phân rã có thăng giáng thống kê nên cần vẽ đường cong trơn đi gần đều qua toàn bộ 8 điểm đo.",
          noVideoFallback:
            "Dùng trực tiếp Bảng 25.1 chuẩn SGK tr. 121, phiếu tự ước lượng lưu localStorage và phòng thực hành vẽ đồ thị phân rã ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh tự nhập đúng H₀/2 = 75,5 Bq, chọn đúng khoảng 30 s – 60 s, nhập ước lượng T hợp lí kèm giải thích hoặc hoàn tất phòng thực hành đồ thị.",
        },
      },
      {
        id: "b25-equations-energy",
        kind: "b25_equations_energy",
        phase: "in_class",
        title: "Luyện tập phương trình phản ứng hạt nhân và năng lượng liên kết Eₗₖ, Eₗₖᵣ",
        shortTocTitle: "Phương trình & năng lượng liên kết",
        sgkPages: "tr. 119–120",
        minutes: 20,
        phenomenonPrompt:
          "Vận dụng định luật bảo toàn số khối A, điện tích Z và công thức độ hụt khối Δm, năng lượng liên kết Eₗₖ, năng lượng liên kết riêng Eₗₖᵣ = Eₗₖ/A để giải hệ bài tập định lượng.",
        evidencePrompt:
          "Hoàn thành cân bằng các phương trình phân rã α, β⁻, β⁺ và tính năng lượng liên kết riêng cho tối thiểu ba hạt nhân.",
        teacherTip:
          "Dành 20 phút còn lại trên lớp: rèn kĩ năng kiểm tra đơn vị (amu, MeV/c², MeV) và mở khung Hướng dẫn giải Giáo viên khi chữa bài trên bảng.",
        teacherGuide: {
          learningObjective:
            "Giải chính xác chuỗi bài tập cân bằng phương trình phóng xạ/phản ứng hạt nhân và tính Δm, Eₗₖ, Eₗₖᵣ = Eₗₖ/A với quy đổi 1 amu·c² ≈ 931,5 MeV.",
          projectorStrategy:
            "Chia lớp làm nhanh Phần A (phương trình) trong 8 phút và Phần B (năng lượng liên kết) trong 12 phút; bật Chế độ Giáo viên để đối chiếu từng bước thay số khi chốt đáp án.",
          openQuestions: [
            "Khi đề bài cho khối lượng nguyên tử trung hòa thay vì khối lượng hạt nhân trần, ở trường hợp nào số khối lượng electron ở hai vế tự triệt tiêu?",
            "Một hạt nhân có Δm tính ra âm nghĩa là ta đã nhầm ở bước nào của công thức?",
          ],
          commonMisconceptions:
            "Học sinh quên nhân c² hoặc quên nhân 931,5 MeV/amu khi đổi từ độ hụt khối Δm (amu) sang năng lượng liên kết Eₗₖ (MeV). Cách gỡ: Viết rõ hệ số 1 amu·c² = 931,5 MeV ngay trong dòng biến đổi.",
          noVideoFallback:
            "Sử dụng trực tiếp hai mô-đun luyện tập tương tác cân bằng phương trình và tính năng lượng liên kết trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh giải đúng cả Phần A (cân bằng phương trình) và Phần B (tính năng lượng liên kết).",
        },
      },
      {
        id: "b25-after-transfer",
        kind: "b25_after_transfer",
        phase: "after",
        title: "Kiểm tra, đánh giá: Bài toán dược chất phóng xạ ¹³¹₅₃I và ¹⁸₉F-FDG (Bài 6 tr. 122)",
        shortTocTitle: "Kiểm tra, đánh giá (¹³¹I & ¹⁸F)",
        sgkPages: "tr. 121–122",
        minutes: 15,
        phenomenonPrompt:
          "Giải quyết hai bài toán y học hạt nhân thực tiễn: (1) thời gian giảm độ phóng xạ mẫu ¹³¹₅₃I (T = 8,0 ngày) và (2) Bài 6 SGK tr. 122 về dược chất ¹⁸₉F-FDG chụp PET (T = 110 phút): hai bệnh nhân cùng cân nặng dùng FDG cùng đợt sản xuất, tiêm cách nhau 60 phút để đảm bảo độ phóng xạ lúc tiêm là 0,1 mCi/kg không đổi — xác định ai tiêm nhiều hơn và phần trăm lượng FDG nhiều hơn cần tiêm.",
        evidencePrompt:
          "Tính đúng thời gian t = 24 ngày cho mẫu ¹³¹₅₃I; xác định bệnh nhân tiêm sau 60 phút cần lượng FDG nhiều hơn khoảng 46% (và lập phương trình bắn phá ¹⁸₈O tạo ¹⁸₉F ở câu 6a).",
        teacherTip:
          "Giao sau giờ học (15 phút) để khép lại toàn Chương IV bằng đúng Bài 6 thực tế bệnh viện của SGK tr. 122.",
        teacherGuide: {
          learningObjective:
            "Vận dụng linh hoạt công thức H(t) = H₀·2^(−t/T) cho bài toán tìm thời gian giảm độ phóng xạ ¹³¹I và bài toán thực tế chuẩn bị lượng dược chất ¹⁸F-FDG cho hai bệnh nhân tiêm cách nhau 60 phút (Bài 6 SGK tr. 122).",
          projectorStrategy:
            "Khi chữa Bài 6b tr. 122, bật Chế độ Giáo viên chiếu trục thời gian tổng quát: đợt thuốc sản xuất tại t = 0 → tiêm bệnh nhân 1 tại thời điểm t₁ → tiêm bệnh nhân 2 tại t₂ = t₁ + 60 phút. Vì nồng độ hoạt độ giảm theo 2^(−60/110) trong 60 phút chờ, để lúc tiêm cả hai đều nhận đúng 0,1 mCi/kg thì lượng FDG tiêm cho người thứ hai phải gấp 2^(60/110) ≈ 1,46 lần, tức nhiều hơn ≈ 46%.",
          openQuestions: [
            "Ở câu 6a (SGK tr. 122), bắn phá ¹⁸₈O bằng hạt tăng tốc tạo ra ¹⁸₉F kèm 1 neutron và tia γ: bảo toàn A và Z cho biết hạt được tăng tốc là hạt gì?",
            "Ở câu 6b, không giả sử người thứ nhất tiêm ngay lúc vừa sản xuất xong (t₁ > 0 bất kì), vì sao tỉ số lượng FDG giữa hai người tiêm cách nhau 60 phút vẫn luôn bằng 2^(60/110) ≈ 1,46 (nhiều hơn ~46%)?",
          ],
          commonMisconceptions:
            "Học sinh hay gán cứng thời điểm tiêm người thứ nhất trùng lúc sản xuất t = 0, hoặc nhầm tỉ số gấp 1,46 lần với phần trăm nhiều hơn ((1,46 − 1)×100% ≈ 46%). Cách gỡ: Viết rõ hai thời điểm tiêm t₁ và t₂ = t₁ + 60 phút và trừ đi 100% để ra phần trăm chênh lệch.",
          noVideoFallback:
            "Phiếu bài tập định lượng tương tác có lưu localStorage và khung lời giải chi tiết cho giáo viên.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh giải đúng câu ¹³¹I (24 ngày) và câu 6b ¹⁸F-FDG SGK tr. 122 (người tiêm sau nhiều hơn ~46%).",
        },
      },
    ],
  },
];

export const CHAPTER4_LESSONS: readonly Chapter4LessonSpec[] = RAW_CHAPTER4_LESSONS.map(
  (lesson) => ({
    ...lesson,
    sections: lesson.sections.map((sec) => ({
      ...sec,
      teacherGuide: buildDefaultTeacherGuide(sec),
    })),
  })
);

export function getChapter4Lesson(code?: string): Chapter4LessonSpec {
  const normalized = (code ?? "B21").trim().toUpperCase();
  return (
    CHAPTER4_LESSONS.find((lesson) => lesson.code === normalized) ??
    CHAPTER4_LESSONS[0]
  );
}

/* ==========================================================================
   CHẾ ĐỘ GIÁO VIÊN: BẢN RIÊNG CỦA LỚP & ĐỒNG BỘ SANG KẾ HOẠCH DẠY HỌC
   ========================================================================== */

export interface TeacherSectionOverride {
  readonly id: string;
  readonly title: string;
  readonly phase: LessonStudyPhase;
  readonly phenomenonPrompt: string;
  readonly evidencePrompt: string;
  readonly teacherTip: string;
  readonly flowVideoUrl?: string;
  readonly hidden?: boolean;
}

export interface TeacherLessonDraft {
  readonly version: 1;
  readonly lessonCode: NuclearPhysicsLessonCode;
  readonly customTitle: string;
  readonly classNameNote: string;
  readonly guidingQuestion: string;
  readonly sections: readonly TeacherSectionOverride[];
  readonly updatedAt: string;
}

export const TEACHER_CUSTOM_DRAFT_PREFIX = "physics-chapter4-teacher-draft-v1:";
export const TEACHING_PLAN_LOCAL_KEY = "physics-teaching-plans-v1:local";

export function createDraftFromSample(lesson: Chapter4LessonSpec): TeacherLessonDraft {
  return {
    version: 1,
    lessonCode: lesson.code,
    customTitle: `${lesson.title} (Bản soạn của lớp)`,
    classNameNote: "Lớp 12 Vật lí — tổ chức theo 3 pha (trước, trong và sau giờ học)",
    guidingQuestion: lesson.guidingQuestion,
    sections: lesson.sections.map((sec) => ({
      id: sec.id,
      title: sec.title,
      phase: sec.phase,
      phenomenonPrompt: sec.phenomenonPrompt,
      evidencePrompt: sec.evidencePrompt,
      teacherTip: sec.teacherTip,
      flowVideoUrl: sec.flowVideoUrl ?? "",
      hidden: false,
    })),
    updatedAt: new Date().toISOString(),
  };
}

export function resolveLessonWithDraft(
  sample: Chapter4LessonSpec,
  draft: TeacherLessonDraft | null,
  useCustomDraft: boolean
): {
  readonly title: string;
  readonly guidingQuestion: string;
  readonly classNameNote?: string;
  readonly isCustom: boolean;
  readonly sections: readonly Chapter4SectionSpec[];
} {
  if (!useCustomDraft || !draft || draft.lessonCode !== sample.code) {
    return {
      title: sample.title,
      guidingQuestion: sample.guidingQuestion,
      isCustom: false,
      sections: sample.sections,
    };
  }

  const overrideMap = new Map(draft.sections.map((item) => [item.id, item]));
  const mergedSections: Chapter4SectionSpec[] = [];

  for (const base of sample.sections) {
    const ov = overrideMap.get(base.id);
    if (ov?.hidden) continue;
    mergedSections.push({
      ...base,
      title: ov?.title.trim() ? ov.title.trim() : base.title,
      phase: ov?.phase ?? base.phase,
      phenomenonPrompt: ov?.phenomenonPrompt.trim()
        ? ov.phenomenonPrompt.trim()
        : base.phenomenonPrompt,
      evidencePrompt: ov?.evidencePrompt.trim()
        ? ov.evidencePrompt.trim()
        : base.evidencePrompt,
      teacherTip: ov?.teacherTip.trim() ? ov.teacherTip.trim() : base.teacherTip,
      flowVideoUrl: ov?.flowVideoUrl?.trim() || undefined,
    });
  }

  return {
    title: draft.customTitle.trim() || sample.title,
    guidingQuestion: draft.guidingQuestion.trim() || sample.guidingQuestion,
    classNameNote: draft.classNameNote.trim() || undefined,
    isCustom: true,
    sections: mergedSections.length > 0 ? mergedSections : sample.sections,
  };
}

export function isVerifiedVideoUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/videos/")) return trimmed.endsWith(".mp4") || trimmed.endsWith(".webm");
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function customPlanIdForLesson(code: NuclearPhysicsLessonCode): string {
  return `custom-lesson-plan-${code.toLowerCase()}`;
}

/**
 * Chuyển bản nháp bài dạy trên Trang bài học thành đối tượng TeachingPlan hợp lệ
 * (đạt validateTeachingPlan) để xuất hiện trực tiếp trong /hoc-lieu/soan-ke-hoach.
 */
export function convertLessonDraftToTeachingPlan(
  sample: Chapter4LessonSpec,
  draft: TeacherLessonDraft
): TeachingPlan {
  const overrideMap = new Map(draft.sections.map((s) => [s.id, s]));
  const activities: PlanActivity[] = [];

  for (const base of sample.sections) {
    const ov = overrideMap.get(base.id);
    if (ov?.hidden) continue;
    const phaseMeta = getPhaseMeta(ov?.phase ?? base.phase);
    const title = (ov?.title.trim() || base.title).slice(0, 190);
    const phenomenon = (ov?.phenomenonPrompt.trim() || base.phenomenonPrompt).slice(0, 1800);
    const evidence = (ov?.evidencePrompt.trim() || base.evidencePrompt).slice(0, 1800);
    const tip = (ov?.teacherTip.trim() || base.teacherTip).slice(0, 1800);
    const flowUrl = ov?.flowVideoUrl?.trim();

    const resources: PlanActivity["resources"] = [];
    if (base.activityKey) {
      const resourceUrl = /^[a-z_]+$/.test(base.activityKey)
        ? `activity:${base.activityKey}`
        : `/hoc-lieu/truc-quan?bai=${sample.code}&muc=${base.id}`;
      resources.push({
        id: `sim-${base.id}`,
        title: `Mô phỏng: ${base.shortTocTitle}`.slice(0, 190),
        url: resourceUrl,
        type: "simulation",
      });
    } else {
      resources.push({
        id: `doc-${base.id}`,
        title: `Học liệu ${sample.code}: ${base.shortTocTitle}`.slice(0, 190),
        url: `/learning/${sample.code}-worksheet.pdf`,
        type: "document",
      });
    }

    if (flowUrl && isVerifiedVideoUrl(flowUrl)) {
      resources.push({
        id: `flow-${base.id}`,
        title: `Video Flow: ${base.shortTocTitle}`.slice(0, 190),
        url: flowUrl,
        type: "animation",
      });
    }

    const guide = base.teacherGuide;
    const objectiveText = (
      ov?.phenomenonPrompt.trim() ? phenomenon : guide.learningObjective || phenomenon
    ).slice(0, 3800);
    const openQs = guide.openQuestions.join(" | ");
    const teacherActionsText = [
      `Phương án chiếu dạy: ${guide.projectorStrategy}`,
      `Gợi ý tổ chức: ${tip}`,
      `Câu hỏi gợi mở: ${openQs}`,
      `Hiểu nhầm thường gặp & cách gỡ: ${guide.commonMisconceptions}`,
    ]
      .join("\n")
      .slice(0, 3800);
    const supportText = [
      `SGK Vật lí 12 (${base.sgkPages}).`,
      `Dự phòng khi chưa có video: ${guide.noVideoFallback}`,
    ]
      .join(" ")
      .slice(0, 3800);

    activities.push({
      id: `${sample.code.toLowerCase()}-${base.id}`,
      phase: phaseMeta.planPhase,
      title,
      minutes: base.minutes,
      objective: objectiveText,
      instructions: `Khám phá: ${phenomenon}`.slice(0, 3800),
      teacherActions: teacherActionsText,
      studentActions: `Thực hiện hoạt động và ghi lại bằng chứng: ${evidence}`.slice(0, 3800),
      product: evidence,
      evaluation: guide.completionCriteriaNote.slice(0, 3800),
      support: supportText,
      resources,
      activityType:
        phaseMeta.id === "before"
          ? "opening"
          : phaseMeta.id === "after"
            ? "application"
            : "knowledge",
      assignment: `Giao nhiệm vụ (${base.minutes} phút · ${phaseMeta.shortLabel}): ${phenomenon}`.slice(
        0,
        3800
      ),
      implementation: `Học sinh thao tác trên học liệu/mô phỏng và lưu sản phẩm: ${evidence}`.slice(
        0,
        3800
      ),
      discussion: `Thảo luận theo câu hỏi gợi mở: ${openQs}. Gỡ hiểu nhầm: ${guide.commonMisconceptions}`.slice(
        0,
        3800
      ),
      conclusion: `Chốt kiến thức mục “${base.shortTocTitle}” (${base.sgkPages}) theo mục tiêu: ${guide.learningObjective}`.slice(
        0,
        3800
      ),
    });
  }

  const goalsParts = [
    `Câu hỏi trung tâm: ${draft.guidingQuestion.trim() || sample.guidingQuestion}`,
    sample.lessonGoals?.knowledge ? `Kiến thức: ${sample.lessonGoals.knowledge}` : "",
    sample.lessonGoals?.competence ? `Năng lực: ${sample.lessonGoals.competence}` : "",
    sample.lessonGoals?.quality ? `Phẩm chất: ${sample.lessonGoals.quality}` : "",
  ].filter(Boolean);

  return {
    version: 1,
    id: customPlanIdForLesson(sample.code),
    title: (draft.customTitle.trim() || `${sample.code} · ${sample.title} (Bản của tôi)`).slice(
      0,
      190
    ),
    lessonCode: sample.code,
    classContext: (
      draft.classNameNote.trim() ||
      `Bài ${sample.number}: ${sample.title} (${sample.sgkPages})`
    ).slice(0, 950),
    goals: goalsParts.join("\n").slice(0, 5000),
    preparation:
      "Đồng bộ trực tiếp từ chế độ Giáo viên trên Trang bài học (/hoc-lieu/truc-quan). Mọi mục đều có phương án dự phòng bằng sơ đồ SGK, bảng dữ liệu thật và mô phỏng trực tiếp khi phòng học chưa phát video.",
    reflection:
      "Đối chiếu dự đoán ban đầu đã khóa ở Pha 1 của học sinh với bằng chứng thu được ở Pha 2 và câu phản tư ở Pha 3 để điều chỉnh nhịp thảo luận trên lớp.",
    activities,
    updatedAt: draft.updatedAt,
    flippedForm: "standard",
    ...(sample.lessonGoals
      ? {
          knowledgeGoals: sample.lessonGoals.knowledge.slice(0, 5000),
          competenceGoals: sample.lessonGoals.competence.slice(0, 5000),
          qualityGoals: sample.lessonGoals.quality.slice(0, 5000),
        }
      : {}),
  };
}

export function loadTeacherLessonDraft(code: NuclearPhysicsLessonCode): TeacherLessonDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${TEACHER_CUSTOM_DRAFT_PREFIX}${code}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TeacherLessonDraft;
    if (parsed?.version !== 1 || parsed.lessonCode !== code || !Array.isArray(parsed.sections)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveTeacherLessonDraftAndSyncPlan(
  sample: Chapter4LessonSpec,
  draft: TeacherLessonDraft
): { readonly syncedPlan?: TeachingPlan; readonly error?: string } {
  const nextDraft: TeacherLessonDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  const candidatePlan = convertLessonDraftToTeachingPlan(sample, nextDraft);
  const checked = validateTeachingPlan(candidatePlan);
  if (!checked.plan) {
    return { error: checked.error ?? "Kế hoạch đồng bộ không hợp lệ." };
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        `${TEACHER_CUSTOM_DRAFT_PREFIX}${sample.code}`,
        JSON.stringify(nextDraft)
      );

      const existingRaw = window.localStorage.getItem(TEACHING_PLAN_LOCAL_KEY);
      const existingList: TeachingPlan[] = [];
      if (existingRaw) {
        const parsed: unknown = JSON.parse(existingRaw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const v = validateTeachingPlan(item);
            if (v.plan && v.plan.id !== checked.plan.id) {
              existingList.push(v.plan);
            }
          }
        }
      }
      const merged = [checked.plan, ...existingList].slice(0, 30);
      window.localStorage.setItem(TEACHING_PLAN_LOCAL_KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event("physics-plans-changed"));
      window.dispatchEvent(new Event("chapter4-storage-changed"));
    } catch {
      return { error: "Trình duyệt chưa lưu được vào bộ nhớ cục bộ." };
    }
  }

  return { syncedPlan: checked.plan };
}

/* ==========================================================================
   LƯU BẰNG CHỨNG & DỰ ĐOÁN CỦA HỌC SINH THEO TỪNG BÀI HỌC (LIÊN THÔNG PHA 1→2→3)
   ========================================================================== */

export type B21ApparatusPartCode = "R" | "D" | "S" | "M";

export interface PreClassWorkData {
  readonly apparatusRoles?: Readonly<Partial<Record<B21ApparatusPartCode, string>>>;
  readonly selfCheckChoice?: string;
  readonly bringToClassQuestion?: string;
  readonly b22TrackRoles?: Readonly<Partial<Record<"alpha" | "vertex" | "proton" | "oxygen", string>>>;
  readonly b22BlackettChoice?: string;
  readonly b23Count5to10?: string;
  readonly b23Count15to20?: string;
  readonly b24LoopRoles?: Readonly<Partial<Record<"primary" | "secondary" | "cooling", string>>>;
  readonly b25PartRoles?: Readonly<Partial<Record<"p1" | "p2" | "p3", string>>>;
  readonly b25PaperChoice?: string;
  readonly [key: string]: unknown;
}

export interface InClassWorkData {
  readonly b24FoodEvidenceEssay?: string;
  readonly b24FoodChecked?: boolean;
  readonly b25HalfH0Input?: string;
  readonly b25BracketChoice?: string;
  readonly b25EstimatedTInput?: string;
  readonly b25EstimateMethodNote?: string;
  readonly b25TableChecked?: boolean;
}

export interface StructureSizeWorkData {
  readonly selectedElement?: string;
  readonly atomicRadiusInput?: string;
  readonly nuclearRadiusInput?: string;
  readonly scaleExplanation?: string;
  readonly checked?: boolean;
}

export interface SymbolIsotopeWorkData {
  readonly targetNeutronInput?: string;
  readonly densityChoice?: string;
  readonly checked?: boolean;
}

export interface AfterClassWorkData {
  readonly alZ?: string;
  readonly alN?: string;
  readonly alRadiusFm?: string;
  readonly alChoice?: string;
  readonly predictionReflection?: string;
  readonly checked?: boolean;
  readonly b22AfterChoice?: string;
  readonly b22NeutronCount?: string;
  readonly b22ReasonNote?: string;
  readonly b22Checked?: boolean;
  readonly b24AfterChoice?: string;
  readonly b25ElecChoice?: string;
  readonly b25AfterDays?: string;
  readonly b25F18ParticleChoice?: string;
  readonly b25F18MoreWho?: string;
  readonly b25F18PercentInput?: string;
  readonly b25F18RatioInput?: string;
  readonly b25AfterChecked?: boolean;
}

export interface StudentLessonNotebook {
  /** Dự đoán hiện hành ghi ở pha Trước giờ học */
  readonly preClassPredictionChoice?: string;
  readonly preClassPredictionReason?: string;
  /** Dự đoán chốt lần đầu tiên — khóa giữ nguyên kể cả khi đoán sai để đối chiếu ở Pha 2 & Pha 3 */
  readonly initialPredictionChoice?: string;
  readonly initialPredictionReason?: string;
  /** Kết quả thao tác nhỏ, câu tự kiểm tra và câu hỏi mang vào lớp ở Pha 1 (B21–B25) */
  readonly preClassWork?: PreClassWorkData;
  /** Kết quả bài tập đọc bảng / tự luận ngắn trong giờ học (B24 Hình 24.5, B25 Bảng 25.1) */
  readonly inClassWork?: InClassWorkData;
  /** Kết quả bài tập đọc Bảng 21.1 & giải thích tỉ lệ phóng đại ở mục Cấu tạo – kích thước */
  readonly structureSizeWork?: StructureSizeWorkData;
  /** Kết quả bài tập nhanh N = A − Z & khối lượng riêng đồng vị ở mục Kí hiệu – đồng vị */
  readonly symbolIsotopeWork?: SymbolIsotopeWorkData;
  /** Kết quả bài tập vận dụng Pha 3 (B21–B25) */
  readonly afterClassWork?: AfterClassWorkData;
  /** Ghi chú bằng chứng của từng mục theo section.id */
  readonly sectionNotes: Readonly<Record<string, string>>;
  /** Mục đã hoàn thành thực chất */
  readonly completedSectionIds: readonly string[];
}

export const STUDENT_NOTEBOOK_PREFIX = "physics-chapter4-notebook-v1:";

export const EMPTY_STUDENT_NOTEBOOK: StudentLessonNotebook = {
  sectionNotes: {},
  completedSectionIds: [],
};

/**
 * Ghi nhận dự đoán Pha 1 và KHÓA vĩnh viễn lần chốt đầu tiên vào
 * `initialPredictionChoice` / `initialPredictionReason` kể cả khi học sinh sửa lại sau đó.
 */
export function recordPreClassPrediction(
  current: StudentLessonNotebook,
  choice: string,
  reason: string
): StudentLessonNotebook {
  const trimmedChoice = choice.trim();
  const trimmedReason = reason.trim();
  const hasLockedInitial = Boolean(current.initialPredictionChoice?.trim());

  return {
    ...current,
    preClassPredictionChoice: trimmedChoice,
    preClassPredictionReason: trimmedReason,
    initialPredictionChoice: hasLockedInitial
      ? current.initialPredictionChoice
      : trimmedChoice || undefined,
    initialPredictionReason: hasLockedInitial
      ? current.initialPredictionReason
      : trimmedReason || undefined,
  };
}

function asCleanObject<T extends object>(val: unknown): T | undefined {
  if (!val || typeof val !== "object" || Array.isArray(val)) return undefined;
  return val as T;
}

export function loadStudentNotebook(code: NuclearPhysicsLessonCode): StudentLessonNotebook {
  if (typeof window === "undefined") return EMPTY_STUDENT_NOTEBOOK;
  try {
    const raw = window.localStorage.getItem(`${STUDENT_NOTEBOOK_PREFIX}${code}`);
    if (!raw) return EMPTY_STUDENT_NOTEBOOK;
    const parsed = JSON.parse(raw) as Partial<StudentLessonNotebook>;
    const preChoice =
      typeof parsed.preClassPredictionChoice === "string"
        ? parsed.preClassPredictionChoice
        : undefined;
    const preReason =
      typeof parsed.preClassPredictionReason === "string"
        ? parsed.preClassPredictionReason
        : undefined;
    const initChoice =
      typeof parsed.initialPredictionChoice === "string" && parsed.initialPredictionChoice
        ? parsed.initialPredictionChoice
        : preChoice;
    const initReason =
      typeof parsed.initialPredictionReason === "string"
        ? parsed.initialPredictionReason
        : preReason;

    return {
      preClassPredictionChoice: preChoice,
      preClassPredictionReason: preReason,
      initialPredictionChoice: initChoice,
      initialPredictionReason: initReason,
      preClassWork: asCleanObject<PreClassWorkData>(parsed.preClassWork),
      inClassWork: asCleanObject<InClassWorkData>(parsed.inClassWork),
      structureSizeWork: asCleanObject<StructureSizeWorkData>(parsed.structureSizeWork),
      symbolIsotopeWork: asCleanObject<SymbolIsotopeWorkData>(parsed.symbolIsotopeWork),
      afterClassWork: asCleanObject<AfterClassWorkData>(parsed.afterClassWork),
      sectionNotes:
        parsed.sectionNotes && typeof parsed.sectionNotes === "object"
          ? (parsed.sectionNotes as Record<string, string>)
          : {},
      completedSectionIds: Array.isArray(parsed.completedSectionIds)
        ? parsed.completedSectionIds.filter((x): x is string => typeof x === "string")
        : [],
    };
  } catch {
    return EMPTY_STUDENT_NOTEBOOK;
  }
}

export function saveStudentNotebook(
  code: NuclearPhysicsLessonCode,
  notebook: StudentLessonNotebook
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${STUDENT_NOTEBOOK_PREFIX}${code}`,
      JSON.stringify(notebook)
    );
    window.dispatchEvent(new Event("chapter4-storage-changed"));
  } catch {
    // Ignore storage quota errors cleanly
  }
}
