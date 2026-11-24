"use client";

import { useState } from "react";
import {
  SGK_B21_MASS_CONSTANTS,
  SGK_TABLE_21_1,
  SGK_TABLE_23_1,
  SGK_TABLE_23_2_SAMPLES,
  isVerifiedVideoUrl,
  loadStudentNotebook,
  recordPreClassPrediction,
  saveStudentNotebook,
  type B21ApparatusPartCode,
  type Chapter4SectionSpec,
  type StudentLessonNotebook,
} from "@/lib/chapter4-lessons";
import { NUCLEAR_LAB_LESSONS } from "@/lib/nuclear-lab-lessons";
import { SGK_TABLE_25_1 } from "@/lib/sgk-b25-decay";
import { FixedPhysicsActivityRenderer } from "@/components/physics/FixedPhysicsActivityRenderer";
import {
  BindingEnergyCalculator,
  NuclearEquationBalancer,
} from "@/components/physics/B25Activities";
import { LatexMath } from "./LatexMath";
import { NuclearLessonVideo } from "./NuclearLessonVideo";
import { Nuclide } from "./Nuclide";
import { AtomicModelsComparisonSim } from "./AtomicModelsComparisonSim";
import styles from "./NuclearLabManual.module.css";

const B21_PREDICTION_CHOICES = [
  {
    id: "straight",
    label:
      "Hầu hết hạt α đi xuyên thẳng hoặc chỉ lệch góc rất nhỏ (< 1°); không có hạt nào bật ngược lại.",
  },
  {
    id: "deflect_large",
    label:
      "Đa số hạt α đi xuyên thẳng tới vị trí (1), nhưng có một tỉ lệ rất nhỏ (~10⁻⁴) lệch góc lớn, thậm chí bật ngược về vị trí (2) (> 90°).",
  },
  {
    id: "blocked",
    label: "Lá vàng D chắn gần hết chùm hạt α, hầu như không có đốm sáng ở vị trí (1) đối diện nguồn.",
  },
] as const;

const B21_APPARATUS_PARTS: readonly {
  readonly code: B21ApparatusPartCode;
  readonly label: string;
  readonly correctRole: string;
}[] = [
  {
    code: "R",
    label: "Nguồn phát hạt α (R)",
    correctRole: "emit_alpha",
  },
  {
    code: "D",
    label: "Lá vàng rất mỏng (D)",
    correctRole: "scatter_target",
  },
  {
    code: "S",
    label: "Màn huỳnh quang ZnS (S)",
    correctRole: "flash_screen",
  },
  {
    code: "M",
    label: "Kính hiển vi quan sát (M)",
    correctRole: "observer_microscope",
  },
] as const;

const B21_APPARATUS_ROLE_OPTIONS = [
  { value: "", label: "— Chọn đúng vai trò trên Hình 21.2 —" },
  { value: "emit_alpha", label: "Phát chùm hạt α mang điện dương bắn vào lá vàng D" },
  { value: "scatter_target", label: "Bia tán xạ bằng vàng rất mỏng (dày cỡ 4·10⁻⁷ m) đặt tại tâm" },
  { value: "flash_screen", label: "Màn phủ chất huỳnh quang phát đốm sáng rồi tắt khi hạt α đập vào" },
  { value: "observer_microscope", label: "Nơi người quan sát nhìn qua, di chuyển từ vị trí (1) đến vị trí (2)" },
] as const;

const B21_PRE_SELF_CHECK_OPTIONS = [
  {
    id: "see_tracks",
    label:
      "Mắt đặt ở kính M nhìn thấy trực tiếp các đường quỹ đạo cong của từng hạt α bay qua lá vàng D.",
    feedback:
      "Chưa chính xác. Hãy nhìn lại Hình 21.2b: hạt α kích thước vi mô nên mắt không thể nhìn thấy đường bay trong chân không G; đường quỹ đạo chỉ là mô hình giải thích, còn dấu hiệu thấy được là các đốm sáng lóe lên trên màn S.",
  },
  {
    id: "flashes_ratio",
    label:
      "Mắt chỉ nhìn thấy các đốm sáng trên màn S; khi xoay kính M từ vị trí (1) sang vị trí (2) lệch > 90°, vẫn có đốm sáng nhưng tần suất ít hơn ở (1) cỡ 10⁴ lần.",
    feedback:
      "✓ Chính xác! Trên Hình 21.2b, màn huỳnh quang S biến va chạm của từng hạt α thành đốm sáng quan sát được qua kính M, và tại vị trí (2) số đốm sáng hiếm hơn vị trí (1) khoảng 10 000 lần.",
  },
  {
    id: "equal_everywhere",
    label:
      "Khi xoay kính M từ vị trí (1) sang vị trí (2), số đốm sáng trên màn S xuất hiện dày đặc ngang bằng nhau ở mọi góc.",
    feedback:
      "Chưa chính xác. Đối chiếu lại chú thích tại vị trí (1) và (2) trên Hình 21.2b: đa số hạt đi thẳng tới (1), còn tại vị trí (2) lệch > 90° tần suất đốm sáng ít hơn tới cỡ 10⁴ lần.",
  },
] as const;

const B22_PREDICTION_CHOICES = [
  {
    id: "elastic_bounce",
    label:
      "Hạt α chỉ va chạm đàn hồi làm hạt nhân Nitrogen nảy ra, còn bản thân hạt α bay tiếp tạo nhánh thứ ba mờ quá nên không thấy.",
  },
  {
    id: "nuclear_transmutation",
    label:
      "Hạt α bị hạt nhân ¹⁴₇N bắt giữ biến đổi thành nguyên tố mới ¹⁷₈O (vết đậm ngắn) và phóng ra hạt proton ¹₁H (vết mảnh dài).",
  },
  {
    id: "stopped_air",
    label: "Hạt α tự dừng lại giữa chừng còn hai nhánh chữ Y là hai tia sáng phản xạ trên thành buồng sương.",
  },
] as const;

const B22_TRACK_PARTS = [
  { code: "alpha", label: "1. Vệt thẳng đi tới từ bên trái", correctRole: "incident_alpha" },
  { code: "vertex", label: "2. Đỉnh chữ Y (không có nhánh thứ 3 đi tiếp)", correctRole: "capture_vertex" },
  { code: "proton", label: "3. Nhánh mảnh, vươn rất dài", correctRole: "emitted_proton" },
  { code: "oxygen", label: "4. Nhánh rất đậm, quãng đi ngắn", correctRole: "recoil_oxygen" },
] as const;

const B22_TRACK_ROLE_OPTIONS = [
  { value: "", label: "— Chọn đúng ý nghĩa trên ảnh buồng sương —" },
  { value: "incident_alpha", label: "Vệt hạt α (⁴₂He) bay tới trong khí Nitrogen" },
  { value: "capture_vertex", label: "Điểm hạt α nhập vào ¹⁴₇N gây biến đổi hạt nhân" },
  { value: "emitted_proton", label: "Vệt hạt proton (¹₁H) nhẹ, bay xa và ít ion hóa hơn" },
  { value: "recoil_oxygen", label: "Vệt hạt nhân ¹⁷₈O nặng, mang điện lớn nên ion hóa dày và dừng nhanh" },
] as const;

const B22_PRE_SELF_CHECK_OPTIONS = [
  {
    id: "same_as_b21",
    label: "Giống hệt tán xạ Rutherford ở Bài 21: nguyên tố Nitrogen giữ nguyên, hạt α chỉ đổi hướng.",
    feedback:
      "Chưa chính xác. Hãy nhìn lại đỉnh chữ Y trên sơ đồ Blackett: nếu hạt α chỉ đổi hướng và ¹⁴₇N giật lùi thì không thể tạo ra vệt mảnh dài của proton ¹₁H; ở đây nguyên tố Nitrogen (Z = 7) đã biến thành Oxygen (Z = 8).",
  },
  {
    id: "two_branches_transmute",
    label:
      "Khác hẳn Bài 21: vệt α biến mất tại đỉnh chữ Y, chỉ còn đúng 2 nhánh của ¹₁H và ¹⁷₈O chứng tỏ Nitrogen đã biến đổi thành nguyên tố Oxygen.",
    feedback:
      "✓ Chính xác! Tổng số khối (4 + 14 = 17 + 1) và điện tích (2 + 7 = 8 + 1) bảo toàn, mở đầu cho kỉ nguyên phản ứng hạt nhân kích thích.",
  },
] as const;

const B23_PREDICTION_CHOICES = [
  {
    id: "faulty_meter",
    label: "Ống đếm Geiger bị kẹt hoặc nguồn phóng xạ tạm ngưng hoạt động trong khoảng 15–20 s.",
  },
  {
    id: "random_micro",
    label:
      "Sự phân rã của từng hạt nhân hoàn toàn ngẫu nhiên theo thời gian nên các khoảng 5 s ngắn có số xung thăng giáng (kể cả 0 xung).",
  },
  {
    id: "exhausted_source",
    label: "Mẫu phóng xạ đã phân rã hết sạch sau 15 s đầu rồi tự sinh ra lại ở giây thứ 20.",
  },
] as const;

const B23_PRE_SELF_CHECK_OPTIONS = [
  {
    id: "equal_every_5s",
    label: "Tổng 30 s có 10 xung nên mỗi khoảng 5 s bắt buộc phải có đều đặn gần 2 xung; số 0 ở 15–20 s là do ghi nhầm.",
    feedback:
      "Chưa chính xác. Đối chiếu lại dòng 15–20 s trên Bảng 23.1 SGK tr. 105 (ghi rõ 0 xung) trong khi ngay sau đó 20–25 s lại có 3 xung: đó là bằng chứng thực nghiệm về tính ngẫu nhiên vi mô.",
  },
  {
    id: "random_not_predictable_single",
    label:
      "Không thể biết chính xác thời điểm một hạt nhân riêng lẻ phân rã, nên trong khoảng đo ngắn 5 s số xung dao động ngẫu nhiên (từ 0 đến 3 xung ở Bảng 23.1).",
    feedback:
      "✓ Chính xác! Ở mức từng hạt nhân phân rã là ngẫu nhiên; chỉ khi xét số lượng hạt cực lớn theo thời gian dài mới xuất hiện quy luật thống kê chu kì bán rã ở Pha 2.",
  },
] as const;

const B24_PREDICTION_CHOICES = [
  {
    id: "radiation_hits_turbine",
    label: "Các tia phóng xạ và mảnh phân hạch từ tâm lò bay trực tiếp ra đập làm quay cánh tua-bin.",
  },
  {
    id: "primary_water_hits_turbine",
    label: "Nước tải nhiệt vòng sơ cấp đi xuyên qua tâm lò phản ứng rồi phun thẳng vào làm quay tua-bin.",
  },
  {
    id: "secondary_steam_spins_turbine",
    label:
      "Hơi nước áp suất cao ở vòng thứ cấp (nhận nhiệt qua thành ống bình sinh hơi, cách li phóng xạ với vòng sơ cấp) thực sự làm quay tua-bin.",
  },
] as const;

const B24_LOOP_PARTS = [
  { code: "primary", label: "1. Vòng tải nhiệt sơ cấp (màu cam/đỏ)", correctRole: "closed_reactor_heat" },
  { code: "secondary", label: "2. Vòng hơi nước – nước ngưng thứ cấp (màu lam)", correctRole: "steam_spin_turbine" },
  { code: "cooling", label: "3. Nguồn nước làm mát ngoài (sông, hồ, biển)", correctRole: "condenser_heat_sink" },
] as const;

const B24_LOOP_ROLE_OPTIONS = [
  { value: "", label: "— Chọn đúng chức năng trên Hình 24.1 —" },
  { value: "closed_reactor_heat", label: "Tuần hoàn khép kín qua tâm lò để tải nhiệt sang bình sinh hơi, ngăn rò rỉ phóng xạ" },
  { value: "steam_spin_turbine", label: "Sinh hơi nước sạch áp suất cao làm quay tua-bin kéo máy phát điện rồi ngưng tụ lại" },
  { value: "condenser_heat_sink", label: "Đi qua ống trao đổi nhiệt tại bình ngưng để giải nhiệt mà không trộn với hai vòng kia" },
] as const;

const B24_PRE_SELF_CHECK_OPTIONS = [
  {
    id: "mix_loops",
    label: "Ba dòng nước trên Hình 24.1 hòa trộn chung với nhau tại bình sinh hơi và bình ngưng để truyền nhiệt nhanh hơn.",
    feedback:
      "Chưa chính xác. Hãy quan sát lại các ống xoắn trao đổi nhiệt trong bình sinh hơi và bình ngưng trên Hình 24.1: 3 dòng lưu chất tách kín hoàn toàn để hơi quay tua-bin và nước trả ra môi trường không nhiễm phóng xạ.",
  },
  {
    id: "isolated_three_loops",
    label:
      "Tua-bin quay nhờ hơi nước vòng thứ cấp; vòng sơ cấp qua tâm lò được đóng kín hoàn toàn nên không phát tán chất phóng xạ sang tua-bin hay nguồn nước làm mát.",
    feedback:
      "✓ Chính xác! Đây là nguyên tắc an toàn nhiều lớp cốt lõi của nhà máy điện hạt nhân nước áp lực.",
  },
] as const;

const B25_PREDICTION_CHOICES = [
  {
    id: "direct_charge_cancel",
    label: "Nguồn (1) chỉ phát ra các hạt mang điện trái dấu bay thẳng tới bám vào bản góp (2) để trung hòa điện tích.",
  },
  {
    id: "air_ionization",
    label:
      "Tia phóng xạ từ nguồn (1) làm ion hóa không khí quanh bản góp (2) thành các ion dương và âm tự do, hút về bản góp làm tĩnh điện kế mất điện tích (kim (3) về 0 dù tích điện + hay −).",
  },
  {
    id: "magnetic_pull",
    label: "Vỏ chì của nguồn (1) hút từ tính làm kim tĩnh điện kế (3) quay về vạch 0.",
  },
] as const;

const B25_APPARATUS_PARTS = [
  { code: "p1", label: "Kí hiệu (1) trên Hình 25.1", correctRole: "radioactive_source" },
  { code: "p2", label: "Kí hiệu (2) trên Hình 25.1", correctRole: "collector_plate" },
  { code: "p3", label: "Kí hiệu (3) trên Hình 25.1", correctRole: "electroscope_pointer" },
] as const;

const B25_APPARATUS_ROLE_OPTIONS = [
  { value: "", label: "— Chọn đúng tên gọi & vai trò trên Hình 25.1 —" },
  { value: "radioactive_source", label: "Nguồn phóng xạ phát chùm tia chiếu vào vùng không khí trước tĩnh điện kế" },
  { value: "collector_plate", label: "Bản góp điện tích (đĩa kim loại nối dẫn điện với trục và kim tĩnh điện kế)" },
  { value: "electroscope_pointer", label: "Kim tĩnh điện kế lệch theo độ lớn điện tích và giảm dần về 0 khi phóng điện" },
] as const;

const B25_PRE_SELF_CHECK_OPTIONS = [
  {
    id: "only_one_sign",
    label:
      "Nếu đổi dấu điện tích ban đầu của bản góp (2) từ âm sang dương thì kim (3) sẽ lệch rộng thêm vì nguồn α mang điện dương +2e.",
    feedback:
      "Chưa chính xác. Đối chiếu lại hiện tượng Hình 25.1: thực tế dù tích điện dương hay âm cho bản góp (2), kim (3) đều giảm dần về 0 — bác bỏ giả thuyết hạt từ nguồn trực tiếp tích thêm điện, mà do không khí bị ion hóa tạo cả ion (+) và ion (−)/e⁻.",
  },
  {
    id: "both_signs_discharge",
    label:
      "Dù bản góp (2) tích điện dương hay âm thì kim (3) đều giảm về 0 vì không khí bị ion hóa chứa cả hai loại hạt tải điện trái dấu; nếu chắn nguồn thuần α bằng tờ giấy thì kim ngừng giảm nhanh.",
    feedback:
      "✓ Chính xác! Các ion trái dấu trong không khí bị hút về bản góp (2) để trung hòa điện tích, và tờ giấy chặn được tia α làm quá trình ion hóa dừng lại.",
  },
] as const;

export interface Chapter4SectionBodyProps {
  readonly lessonCode: "B21" | "B22" | "B23" | "B24" | "B25";
  readonly section: Chapter4SectionSpec;
  readonly notebook: StudentLessonNotebook;
  /** Bật trong Chế độ Giáo viên (tự ẩn khi bấm Xem như học sinh) để hiện lời giải mẫu B25 */
  readonly showTeacherSolutions?: boolean;
  readonly onSavePreClassPrediction: (choice: string, reason: string) => void;
  readonly onPatchNotebook?: (
    updater: (current: StudentLessonNotebook) => StudentLessonNotebook
  ) => void;
  readonly onMarkSectionComplete: (
    sectionId: string,
    done: boolean,
    options?: { readonly allowUnmark?: boolean }
  ) => void;
  readonly onJumpToSection: (sectionId: string) => void;
}

function deriveLocalMediaCompanions(url?: string): {
  readonly poster?: string;
  readonly captionsVtt?: string;
} {
  if (!url) return {};
  const trimmed = url.trim();
  if (
    /^\/videos\/nuclear-(?:lessons(?:-v2)?|openers)\/b2[1-5]\.(?:mp4|webm)$/i.test(
      trimmed
    )
  ) {
    return {
      poster: trimmed.replace(/\.(?:mp4|webm)$/i, ".jpg"),
      captionsVtt: trimmed.replace(/\.(?:mp4|webm)$/i, ".vi.vtt"),
    };
  }
  if (trimmed.startsWith("/videos/") && /\.(?:mp4|webm)$/i.test(trimmed)) {
    return {
      captionsVtt: trimmed.replace(/\.(?:mp4|webm)$/i, ".vi.vtt"),
    };
  }
  return {};
}

function VerifiedFlowVideoBlock({
  url,
  title,
  poster,
  captionsVttUrl,
}: {
  readonly url?: string;
  readonly title: string;
  readonly poster?: string;
  readonly captionsVttUrl?: string;
}) {
  // Quy tắc nghiêm ngặt: Video Flow chỉ hiện nút phát khi đã có tệp/URL video thật
  if (!isVerifiedVideoUrl(url)) {
    return null;
  }
  const derived = deriveLocalMediaCompanions(url);
  const resolvedPoster = poster ?? derived.poster;
  const resolvedCaptions = captionsVttUrl ?? derived.captionsVtt;

  return (
    <div style={{ marginBottom: "20px", border: "1px solid #d0d7de", background: "#0b1220", padding: "12px" }}>
      <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 700, color: "#f4f4f4" }}>
        Video minh họa trực quan (Flow): {title}
      </p>
      <video
        controls
        playsInline
        preload="metadata"
        poster={resolvedPoster}
        src={url}
        style={{ width: "100%", maxHeight: "420px", display: "block", background: "#000" }}
      >
        {resolvedCaptions && (
          <track
            kind="captions"
            srcLang="vi"
            label="Tiếng Việt"
            src={resolvedCaptions}
            default
          />
        )}
        Trình duyệt chưa hỗ trợ phát trực tiếp. <a href={url}>Mở tệp video</a>.
      </video>
    </div>
  );
}

function isB21PreClassAllComplete(
  nb: StudentLessonNotebook,
  rolesOverride?: Readonly<Partial<Record<B21ApparatusPartCode, string>>>,
  selfCheckOverride?: string
): boolean {
  const hasPrediction = Boolean(
    (nb.initialPredictionChoice ?? nb.preClassPredictionChoice ?? "").trim()
  );
  const hasReason = Boolean(
    (nb.initialPredictionReason ?? nb.preClassPredictionReason ?? "").trim()
  );
  const roles = rolesOverride ?? nb.preClassWork?.apparatusRoles ?? {};
  const allRolesCorrect = B21_APPARATUS_PARTS.every(
    (part) => roles[part.code] === part.correctRole
  );
  const selfCheck = selfCheckOverride ?? nb.preClassWork?.selfCheckChoice ?? "";
  return hasPrediction && hasReason && allRolesCorrect && selfCheck === "flashes_ratio";
}

function Phase2ProductEchoCard({
  preSectionId,
  lockedChoiceLabel,
  lockedReason,
  actionSummary,
  bringQuestion,
  onJumpToSection,
}: {
  readonly preSectionId: string;
  readonly lockedChoiceLabel?: string;
  readonly lockedReason?: string;
  readonly actionSummary: string;
  readonly bringQuestion?: string;
  readonly onJumpToSection: (sectionId: string) => void;
}) {
  return (
    <div className={styles.predictionEchoBox}>
      {lockedChoiceLabel ? (
        <div>
          <div style={{ marginBottom: "6px" }}>
            <strong>Sản phẩm Pha 1 đã lưu · Dự đoán ban đầu (khóa đối chiếu):</strong>{" "}
            “{lockedChoiceLabel}”
            {lockedReason ? (
              <span>
                {" "}
                — <em>Lí do ban đầu: {lockedReason}</em>
              </span>
            ) : null}
          </div>
          <div style={{ fontSize: "13.5px", color: "#161616", marginBottom: "4px" }}>
            <strong>Kết quả chuẩn bị ở nhà:</strong> {actionSummary}
            {bringQuestion?.trim() ? (
              <span>
                {" "}
                · <strong>Câu hỏi mang vào lớp:</strong> “{bringQuestion.trim()}”
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <span>
            <strong>Đối chiếu sản phẩm Pha 1:</strong> Em chưa khóa dự đoán ban đầu ở mục Trước giờ học. Em có thể mở lại Pha 1 để hoàn thành chuẩn bị hoặc tiếp tục hoạt động trên lớp bên dưới.
          </span>
          <button
            type="button"
            className={`${styles.cdsBtn} ${styles.cdsBtnSmall}`}
            onClick={() => onJumpToSection(preSectionId)}
          >
            Quay lại Pha 1 (Trước giờ học)
          </button>
        </div>
      )}
    </div>
  );
}

export function Chapter4SectionBody({
  lessonCode,
  section,
  notebook,
  showTeacherSolutions = false,
  onSavePreClassPrediction,
  onPatchNotebook,
  onMarkSectionComplete,
  onJumpToSection,
}: Chapter4SectionBodyProps) {
  const patchNotebook = (
    updater: (current: StudentLessonNotebook) => StudentLessonNotebook
  ) => {
    if (onPatchNotebook) {
      onPatchNotebook(updater);
      return;
    }
    const current = loadStudentNotebook(lessonCode);
    saveStudentNotebook(lessonCode, updater(current));
  };

  const [predChoiceDraft, setPredChoiceDraft] = useState<string | null>(null);
  const [predReasonDraft, setPredReasonDraft] = useState<string | null>(null);
  const predChoice = predChoiceDraft ?? notebook.preClassPredictionChoice ?? "";
  const predReason = predReasonDraft ?? notebook.preClassPredictionReason ?? "";
  const [predSavedMsg, setPredSavedMsg] = useState("");

  // State nháp đồng bộ với localStorage cho các mục đọc/vận dụng
  const [alCheckedLocal, setAlCheckedLocal] = useState(false);
  const [structCheckedLocal, setStructCheckedLocal] = useState(false);
  const [isoCheckedLocal, setIsoCheckedLocal] = useState(false);
  const [b22AfterCheckedLocal, setB22AfterCheckedLocal] = useState(false);
  const [b24FoodCheckedLocal, setB24FoodCheckedLocal] = useState(false);
  const [b25TableCheckedLocal, setB25TableCheckedLocal] = useState(false);
  const [b25AfterCheckedLocal, setB25AfterCheckedLocal] = useState(false);
  const [b25EqDone, setB25EqDone] = useState(false);
  const [b25BindDone, setB25BindDone] = useState(false);

  const b21VideoLesson = NUCLEAR_LAB_LESSONS.find((l) => l.code === lessonCode);

  const lockedInitialChoiceId =
    notebook.initialPredictionChoice ?? notebook.preClassPredictionChoice;
  const lockedInitialReason =
    notebook.initialPredictionReason ?? notebook.preClassPredictionReason ?? "";
  const lockedInitialPredictionLabel = B21_PREDICTION_CHOICES.find(
    (c) => c.id === lockedInitialChoiceId
  )?.label;
  const currentPredictionLabel = B21_PREDICTION_CHOICES.find(
    (c) => c.id === notebook.preClassPredictionChoice
  )?.label;

  const apparatusRoles = notebook.preClassWork?.apparatusRoles ?? {};
  const matchedApparatusCount = B21_APPARATUS_PARTS.filter(
    (p) => apparatusRoles[p.code] === p.correctRole
  ).length;
  const allApparatusMatched = matchedApparatusCount === B21_APPARATUS_PARTS.length;
  const preSelfCheckChoice = notebook.preClassWork?.selfCheckChoice ?? "";
  const selectedSelfCheckOption = B21_PRE_SELF_CHECK_OPTIONS.find(
    (opt) => opt.id === preSelfCheckChoice
  );
  const bringToClassQuestion = notebook.preClassWork?.bringToClassQuestion ?? "";
  const preClassReady = isB21PreClassAllComplete(notebook);

  return (
    <div>
      <VerifiedFlowVideoBlock url={section.flowVideoUrl} title={section.title} />

      {/* ====================================================================
          BÀI 21 — 1. PHA 1 (TRƯỚC GIỜ HỌC): TỰ NGHIÊN CỨU HÌNH 21.1 – 21.2
          ==================================================================== */}
      {section.kind === "b21_pre_rutherford" && (
        <div>
          {/* BƯỚC 1: Mô hình nguyên tử ban đầu từ phép tương tự bánh ngọt có mận khô (Hình 21.1 · SGK tr. 91) */}
          <section
            aria-labelledby="b21-hinh-21-1-heading"
            style={{
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "16px",
              marginBottom: "18px",
            }}
          >
            <h4 id="b21-hinh-21-1-heading" style={{ margin: "0 0 10px", fontSize: "16px" }}>
              Bước 1 · Mô hình nguyên tử đầu tiên &amp; phép tương tự Hình 21.1 (SGK tr. 91)
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px",
                alignItems: "center",
              }}
            >
              <figure
                style={{
                  margin: 0,
                  border: "1px solid #e0e0e0",
                  background: "#f8fafc",
                  padding: "12px",
                  textAlign: "center",
                }}
              >
                <svg
                  viewBox="0 0 320 206"
                  width="320"
                  height="206"
                  role="img"
                  aria-label="Sơ đồ hóa mô hình nguyên tử Thomson dựng từ phép tương tự bánh ngọt có mận khô ở Hình 21.1 SGK trang 91: hình cầu đường kính cỡ 10 mũ trừ 10 mét mang điện tích dương phân bố đều khắp không gian nguyên tử và các electron mang điện âm nằm rải rác bên trong"
                  style={{ width: "100%", maxWidth: "320px", height: "auto", display: "inline-block" }}
                >
                  <defs>
                    <radialGradient id="b21ThomsonPosSphere" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fde68a" />
                      <stop offset="65%" stopColor="#fcd34d" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </radialGradient>
                  </defs>
                  <circle
                    cx="155"
                    cy="94"
                    r="68"
                    fill="url(#b21ThomsonPosSphere)"
                    stroke="#b45309"
                    strokeWidth="2"
                  />
                  {[
                    [155, 46],
                    [116, 66],
                    [194, 66],
                    [138, 94],
                    [174, 94],
                    [118, 122],
                    [192, 122],
                    [155, 142],
                  ].map(([cx, cy], idx) => (
                    <text
                      key={idx}
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#92400e"
                      fontSize="15"
                      fontWeight="700"
                    >
                      +
                    </text>
                  ))}
                  {[
                    [135, 64],
                    [176, 64],
                    [112, 94],
                    [155, 94],
                    [198, 94],
                    [136, 124],
                    [176, 124],
                  ].map(([ex, ey], idx) => (
                    <g key={idx}>
                      <circle cx={ex} cy={ey} r="9" fill="#0f62fe" />
                      <text
                        x={ex}
                        y={ey}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="700"
                      >
                        e⁻
                      </text>
                    </g>
                  ))}
                  <line x1="87" y1="176" x2="223" y2="176" stroke="#525252" strokeWidth="1.4" />
                  <line x1="87" y1="171" x2="87" y2="181" stroke="#525252" strokeWidth="1.4" />
                  <line x1="223" y1="171" x2="223" y2="181" stroke="#525252" strokeWidth="1.4" />
                  <text x="155" y="194" textAnchor="middle" fill="#161616" fontSize="11.5" fontWeight="700">
                    Cỡ nguyên tử ~ 10⁻¹⁰ m · (+) chiếm gần trọn thể tích
                  </text>
                </svg>
                <figcaption style={{ fontSize: "12.5px", color: "#525252", marginTop: "6px", lineHeight: 1.5 }}>
                  <strong>Sơ đồ mô hình Thomson (dựng từ phép tương tự Hình 21.1 SGK tr. 91):</strong> Trong SGK, Hình 21.1 là ảnh chụp bánh ngọt có mận khô — phần bánh biểu diễn phần mang điện dương nặng gần bằng nguyên tử và chiếm gần trọn không gian, còn các mẩu mận khô biểu diễn các electron (<code>e⁻</code>). <em>(Sơ đồ quy ước định tính, không dùng đo kích thước electron.)</em>
                </figcaption>
              </figure>

              <div>
                <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.6 }}>
                  <strong>[Nội dung SGK tr. 91]:</strong> Trước thí nghiệm của Ernest Rutherford (1911), mô hình nguyên tử đầu tiên hình dung phần mang điện tích dương phân bố khắp không gian nguyên tử (cỡ <code>10⁻¹⁰ m</code>), còn các electron mang điện âm rất nhẹ nằm rải rác bên trong.
                </p>
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#edf5ff",
                    borderLeft: "4px solid #0f62fe",
                    fontSize: "14px",
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color: "#002d9c", display: "block", marginBottom: "4px" }}>
                    Câu hỏi dự đoán mở đầu (nhiệm vụ do nhóm thiết kế xây dựng):
                  </strong>
                  <em>
                    “Nếu điện tích dương trải đều khắp nguyên tử như trên, khi bắn chùm hạt alpha (α, mang điện dương) vào lá vàng rất mỏng thì đường đi của các hạt α sẽ như thế nào?”
                  </em>
                </div>
              </div>
            </div>
          </section>

          {/* BƯỚC 2: Bố trí bộ thí nghiệm Hình 21.2a – 21.2b (CHƯA tiết lộ kết quả đếm đốm sáng) & Nhận diện bộ phận */}
          <section
            aria-labelledby="b21-hinh-21-2-heading"
            style={{
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "16px",
              marginBottom: "18px",
            }}
          >
            <h4 id="b21-hinh-21-2-heading" style={{ margin: "0 0 6px", fontSize: "16px" }}>
              Bước 2 · Nhận diện bố trí thí nghiệm tán xạ hạt alpha (Hình 21.2a &amp; 21.2b · SGK tr. 91) ({matchedApparatusCount}/4 đúng)
            </h4>
            <p style={{ margin: "0 0 12px", fontSize: "13.5px", color: "#525252", lineHeight: 1.55 }}>
              Quan sát hai sơ đồ bố trí dưới đây (chưa bật kết quả thí nghiệm) để chỉ đúng từng bộ phận <strong>R, D, S, M, G, P</strong> trước khi ghi dự đoán ở Bước 3:
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "14px",
                marginBottom: "14px",
              }}
            >
              {/* Sơ đồ 21.2a: Phối cảnh có nhãn chỉ rõ R, D, S, M, G, P đọc rõ trên màn hình 390px */}
              <figure className={styles.darkBenchStage} style={{ margin: 0 }}>
                <svg
                  viewBox="0 0 420 240"
                  width="420"
                  height="240"
                  role="img"
                  aria-label="Sơ đồ phối cảnh đối chiếu Hình 21.2a SGK trang 91: hộp chân không G đặt trên chân đế P, bên trong có nguồn phát hạt alpha R ở bên phải bắn vào lá vàng mỏng D ở giữa, kính phủ chất huỳnh quang S và kính hiển vi M quan sát từ bên ngoài"
                  style={{ width: "100%", height: "auto", display: "block", background: "#0b1220" }}
                >
                  {/* Chân đế P (đúng vị trí Hình 21.2a SGK) */}
                  <ellipse cx="222" cy="218" rx="64" ry="12" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                  <rect x="210" y="182" width="24" height="34" fill="#475569" stroke="#94a3b8" strokeWidth="1.2" />
                  <line x1="234" y1="204" x2="274" y2="204" stroke="#cbd5e1" strokeWidth="1.2" />
                  <text x="280" y="208" fill="#f8fafc" fontSize="13" fontWeight="700">
                    P (chân đế)
                  </text>

                  {/* Thân hộp chân không hình trụ G (mở mặt cắt phía trước như Hình 21.2a) */}
                  <ellipse cx="222" cy="64" rx="108" ry="26" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.8" />
                  <path
                    d="M 114 64 L 114 156 A 108 26 0 0 0 330 156 L 330 64"
                    fill="#111b2e"
                    stroke="#94a3b8"
                    strokeWidth="1.8"
                  />
                  {/* Khung cửa cắt bên trong hộp G */}
                  <rect x="150" y="78" width="154" height="74" rx="6" fill="#080e1a" stroke="#475569" strokeWidth="1.4" />
                  <text x="162" y="169" fill="#cbd5e1" fontSize="13" fontWeight="700">
                    G (hộp chân không)
                  </text>

                  {/* Nguồn phát R (bên phải như Hình 21.2a SGK) */}
                  <rect x="266" y="102" width="32" height="24" rx="3" fill="#64748b" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="282" y="96" textAnchor="middle" fill="#fde047" fontSize="13" fontWeight="700">
                    R
                  </text>

                  {/* Tia mảnh định hướng từ R tới lá vàng D */}
                  <line x1="266" y1="114" x2="224" y2="114" stroke="#facc15" strokeWidth="2" strokeDasharray="4 3" />

                  {/* Lá vàng mỏng D ở tâm */}
                  <rect x="219" y="92" width="5" height="44" fill="#fbbf24" />
                  <line x1="221" y1="136" x2="221" y2="150" stroke="#94a3b8" strokeWidth="2" />
                  <text x="222" y="87" textAnchor="middle" fill="#fde047" fontSize="13" fontWeight="700">
                    D
                  </text>

                  {/* Màn S có phủ chất huỳnh quang trước đầu kính M */}
                  <ellipse cx="164" cy="114" rx="8" ry="20" fill="#14532d" stroke="#4ade80" strokeWidth="2" />
                  <text x="182" y="119" fill="#86efac" fontSize="13" fontWeight="700">
                    S
                  </text>

                  {/* Ống kính hiển vi M (bên trái như Hình 21.2a SGK) */}
                  <rect x="64" y="103" width="92" height="22" rx="4" fill="#eab308" stroke="#fef08a" strokeWidth="1.4" />
                  <ellipse cx="64" cy="114" rx="6" ry="11" fill="#1e293b" stroke="#fef08a" strokeWidth="1.4" />
                  <text x="108" y="95" textAnchor="middle" fill="#fef08a" fontSize="13.5" fontWeight="700">
                    M (kính hiển vi)
                  </text>
                </svg>
                <figcaption className={styles.darkBenchCaption}>
                  <strong>a) Sơ đồ phối cảnh (đối chiếu Hình 21.2a SGK tr. 91):</strong> Nguồn <strong>R</strong> bắn chùm hạt α vào lá vàng mỏng <strong>D</strong> (<code>~4·10⁻⁷ m</code>) đặt trong hộp chân không <strong>G</strong> trên chân đế <strong>P</strong>; kính hiển vi <strong>M</strong> quan sát màn huỳnh quang <strong>S</strong>.
                </figcaption>
              </figure>

              {/* Sơ đồ 21.2b: Mặt cắt giữ đúng hướng SGK tr. 91 (R bên phải, (1) bên trái, (2) lệch > 90° bên phải) — KHÔNG lộ kết quả */}
              <figure className={styles.darkBenchStage} style={{ margin: 0 }}>
                <svg
                  viewBox="0 0 420 240"
                  width="420"
                  height="240"
                  role="img"
                  aria-label="Sơ đồ mặt cắt đối chiếu Hình 21.2b SGK trang 91: nguồn phát hạt alpha R ở bên phải chiếu chùm hạt sang trái vào lá vàng D ở tâm hộp chân không; vòng màn S bao quanh; kính hiển vi M có thể di chuyển từ vị trí (1) đối diện nguồn ở bên trái sang vị trí (2) ở phía lệch hơn 90 độ bên dưới phải"
                  style={{ width: "100%", height: "auto", display: "block", background: "#0b1220" }}
                >
                  {/* Thành hộp chân không */}
                  <circle cx="205" cy="116" r="88" fill="#111b2e" stroke="#94a3b8" strokeWidth="2.4" />
                  <text x="205" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="12.5" fontWeight="700">
                    Chân không (G)
                  </text>

                  {/* Vòng màn phủ chất huỳnh quang S */}
                  <circle cx="205" cy="116" r="74" fill="none" stroke="#4ade80" strokeWidth="2.8" strokeDasharray="6 3" />
                  <line x1="94" y1="154" x2="140" y2="154" stroke="#86efac" strokeWidth="1.2" />
                  <text x="78" y="158" fill="#86efac" fontSize="13" fontWeight="700">
                    S
                  </text>

                  {/* Nguồn phát hạt alpha R ở bên phải (đúng hướng Hình 21.2b SGK) */}
                  <path d="M 262 102 L 280 102 L 280 130 L 262 130 L 262 122 L 272 122 L 272 110 L 262 110 Z" fill="#38bdf8" stroke="#bae6fd" strokeWidth="1.2" />
                  <text x="260" y="92" fill="#bae6fd" fontSize="13" fontWeight="700">
                    R
                  </text>
                  <text x="304" y="112" fill="#e2e8f0" fontSize="11.5" fontWeight="600">
                    Nguồn phát
                  </text>
                  <text x="304" y="127" fill="#e2e8f0" fontSize="11.5" fontWeight="600">
                    hạt alpha
                  </text>

                  {/* Chùm tia alpha đi từ R (phải) tới lá vàng D (giữa) */}
                  <line x1="270" y1="113" x2="208" y2="113" stroke="#f87171" strokeWidth="1.8" />
                  <line x1="270" y1="119" x2="208" y2="119" stroke="#f87171" strokeWidth="1.8" />
                  <polygon points="214,116 222,111 222,121" fill="#f87171" />

                  {/* Lá vàng mỏng D ở tâm */}
                  <line x1="205" y1="90" x2="205" y2="142" stroke="#facc15" strokeWidth="4" />
                  <text x="192" y="84" fill="#fde047" fontSize="13" fontWeight="700">
                    D
                  </text>

                  {/* Đánh dấu vị trí (1) đối diện nguồn R (bên trái) và vị trí (2) lệch > 90° (dưới phải) */}
                  <circle cx="131" cy="116" r="5" fill="none" stroke="#fef08a" strokeWidth="2" />
                  <text x="80" y="120" fill="#fef08a" fontSize="12.5" fontWeight="700">
                    (1) đối diện R
                  </text>

                  <circle cx="258" cy="168" r="5" fill="none" stroke="#fda4af" strokeWidth="2" />
                  <text x="274" y="176" fill="#fda4af" fontSize="12.5" fontWeight="700">
                    (2) lệch &gt; 90°
                  </text>

                  {/* Kính hiển vi M đang xoay trên cung từ (1) sang (2) */}
                  <g transform="translate(174, 183) rotate(114)">
                    <rect x="0" y="-8" width="38" height="16" rx="2" fill="#eab308" stroke="#fef08a" strokeWidth="1.2" />
                  </g>
                  <text x="150" y="226" fill="#fef08a" fontSize="13" fontWeight="700">
                    M (xoay từ (1) đến (2))
                  </text>
                </svg>
                <figcaption className={styles.darkBenchCaption}>
                  <strong>b) Sơ đồ mặt cắt góc đo (đối chiếu Hình 21.2b SGK tr. 91):</strong> Kính hiển vi <strong>M</strong> di chuyển dọc màn <strong>S</strong> từ <strong>vị trí (1)</strong> (đối diện nguồn phát <strong>R</strong>) sang <strong>vị trí (2)</strong> (lệch hơn <code>90°</code> về phía nguồn). <em>(Chiều trái/phải chỉ phụ thuộc góc đặt mắt nhìn thiết bị.)</em>
                </figcaption>
              </figure>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "12px",
              }}
            >
              {B21_APPARATUS_PARTS.map((part) => {
                const selectedRole = apparatusRoles[part.code] ?? "";
                const isCorrect = selectedRole === part.correctRole;
                return (
                  <div
                    key={part.code}
                    style={{
                      padding: "10px 12px",
                      border: selectedRole
                        ? isCorrect
                          ? "1px solid #198038"
                          : "1px solid #da1e28"
                        : "1px solid #e0e0e0",
                      background: selectedRole
                        ? isCorrect
                          ? "#defbe6"
                          : "#fff1f1"
                        : "#fafafa",
                    }}
                  >
                    <label
                      htmlFor={`b21-part-${part.code}`}
                      style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
                    >
                      {part.label}
                    </label>
                    <select
                      id={`b21-part-${part.code}`}
                      value={selectedRole}
                      onChange={(e) => {
                        const val = e.target.value;
                        const nextRoles = {
                          ...apparatusRoles,
                          [part.code]: val,
                        };
                        patchNotebook((cur) => ({
                          ...cur,
                          preClassWork: {
                            ...cur.preClassWork,
                            apparatusRoles: {
                              ...cur.preClassWork?.apparatusRoles,
                              [part.code]: val,
                            },
                          },
                        }));
                        if (isB21PreClassAllComplete(notebook, nextRoles)) {
                          onMarkSectionComplete(section.id, true);
                        }
                      }}
                      style={{
                        width: "100%",
                        minHeight: "40px",
                        padding: "6px 8px",
                        border: "1px solid #8d8d8d",
                        background: "#ffffff",
                        fontSize: "13.5px",
                        color: "#161616",
                      }}
                    >
                      {B21_APPARATUS_ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {selectedRole && (
                      <small
                        style={{
                          display: "block",
                          marginTop: "6px",
                          fontWeight: 600,
                          color: isCorrect ? "#198038" : "#b42332",
                        }}
                      >
                        {isCorrect
                          ? `✓ Đúng vai trò của kí hiệu ${part.code}.`
                          : `Chưa khớp: hãy đối chiếu lại kí hiệu ${part.code} trên hai sơ đồ Hình 21.2 ở trên.`}
                      </small>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* BƯỚC 3: Lưu nguyên dự đoán ban đầu + lí do TRƯỚC khi xem kết quả thực nghiệm */}
          <section
            aria-labelledby="b21-pre-prediction-heading"
            style={{
              border: "1px solid #8d8d8d",
              background: "#ffffff",
              padding: "16px",
              marginBottom: "18px",
            }}
          >
            <h4 id="b21-pre-prediction-heading" style={{ margin: "0 0 6px", fontSize: "16px" }}>
              Bước 3 · Ghi và khóa dự đoán ban đầu kèm lí do (trước khi xem kết quả thí nghiệm)
            </h4>
            <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#525252", lineHeight: 1.55 }}>
              Từ mô hình ở Bước 1 và bố trí thiết bị ở Bước 2, hãy chọn dự đoán của riêng em và nêu rõ lí do.{" "}
              <strong>Dự đoán chốt lần đầu tiên được giữ nguyên (kể cả khi chưa khớp kết quả thí nghiệm)</strong> để mang vào Pha 2 đối chiếu khoa học trên lớp.
            </p>

            {lockedInitialPredictionLabel && (
              <div
                style={{
                  marginBottom: "12px",
                  padding: "10px 12px",
                  background: "#fcf4d6",
                  borderLeft: "4px solid #8e6a00",
                  fontSize: "13.5px",
                  lineHeight: 1.5,
                }}
              >
                <strong>Dự đoán ban đầu đã khóa để đối chiếu trên lớp:</strong> “{lockedInitialPredictionLabel}”
                {lockedInitialReason ? (
                  <span>
                    {" "}
                    — <em>Lí do ban đầu: {lockedInitialReason}</em>
                  </span>
                ) : null}
              </div>
            )}

            <fieldset style={{ border: "none", margin: "0 0 12px", padding: 0 }}>
              <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
                Chọn phương án dự đoán của em:
              </legend>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {B21_PREDICTION_CHOICES.map((opt) => (
                  <label
                    key={opt.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "10px 12px",
                      border:
                        predChoice === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                      background: predChoice === opt.id ? "#edf5ff" : "#fafafa",
                      cursor: "pointer",
                      fontSize: "14px",
                      lineHeight: 1.5,
                    }}
                  >
                    <input
                      type="radio"
                      name="b21-pre-prediction"
                      value={opt.id}
                      checked={predChoice === opt.id}
                      onChange={() => {
                        setPredChoiceDraft(opt.id);
                        setPredSavedMsg("");
                      }}
                      style={{ marginTop: "3px" }}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label
              style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
              htmlFor="b21-pre-reason"
            >
              Lí do cho dự đoán của em (bắt buộc):
            </label>
            <textarea
              id="b21-pre-reason"
              className={styles.evidenceTextarea}
              rows={2}
              value={predReason}
              onChange={(e) => {
                setPredReasonDraft(e.target.value);
                setPredSavedMsg("");
              }}
              placeholder="Ví dụ: Nếu điện tích dương trải đều khắp nguyên tử như phép tương tự Hình 21.1 thì lực đẩy tĩnh điện ở mọi chỗ đều yếu nên hạt α sẽ…"
            />

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginTop: "12px" }}>
              <button
                type="button"
                className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                onClick={() => {
                  if (!predChoice) {
                    setPredSavedMsg("Em hãy chọn một phương án dự đoán trước khi lưu.");
                    return;
                  }
                  if (!predReason.trim()) {
                    setPredSavedMsg("Em hãy viết ngắn gọn lí do cho dự đoán của mình trước khi lưu.");
                    return;
                  }
                  onSavePreClassPrediction(predChoice, predReason.trim());
                  const updatedNb = recordPreClassPrediction(
                    notebook,
                    predChoice,
                    predReason.trim()
                  );
                  if (isB21PreClassAllComplete(updatedNb)) {
                    onMarkSectionComplete(section.id, true);
                  }
                  setPredSavedMsg(
                    lockedInitialChoiceId
                      ? "Đã cập nhật ghi chú dự đoán (dự đoán chốt lần đầu vẫn được giữ nguyên để đối chiếu ở Pha 2)."
                      : "Đã khóa dự đoán ban đầu kèm lí do. Hãy đối chiếu tiếp kết quả thực nghiệm và hoàn thành Bước 4 bên dưới!"
                  );
                }}
              >
                Lưu dự đoán trước giờ học
              </button>
              {predSavedMsg && (
                <span
                  role="status"
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: predChoice && predReason.trim() ? "#198038" : "#b42332",
                  }}
                >
                  {predSavedMsg}
                </span>
              )}
            </div>
          </section>

          {/* BƯỚC 4: Kết quả thực nghiệm trên màn S (SGK tr. 91–92), tách 2 lớp Quan sát vs Mô hình & Câu tự kiểm tra */}
          <section
            aria-labelledby="b21-pre-selfcheck-heading"
            style={{
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "16px",
              marginBottom: "18px",
            }}
          >
            <h4 id="b21-pre-selfcheck-heading" style={{ margin: "0 0 8px", fontSize: "16px" }}>
              Bước 4 · Đối chiếu kết quả thực nghiệm (SGK tr. 91–92) &amp; Câu tự kiểm tra
            </h4>
            <p style={{ margin: "0 0 12px", fontSize: "14px", lineHeight: 1.6 }}>
              <strong>[Kết quả thí nghiệm Rutherford — SGK tr. 91]:</strong> Khi di chuyển kính hiển vi <strong>M</strong> từ{" "}
              <strong>vị trí (1)</strong> đến <strong>vị trí (2)</strong> (Hình 21.2b), tần suất đốm sáng xuất hiện trên màn <strong>S</strong> giảm đi rất nhanh. Tại <strong>vị trí (2)</strong> vẫn thấy xuất hiện các đốm sáng (lóe lên rồi tắt) nhưng{" "}
              <strong>tần suất ít hơn so với tại vị trí (1) cỡ <code>10⁴</code> lần</strong>.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              <div style={{ border: "1px solid #a6c8ff", background: "#edf5ff", padding: "12px 14px" }}>
                <strong style={{ display: "block", color: "#002d9c", marginBottom: "4px" }}>
                  Lớp 1 · Dấu hiệu quan sát qua kính M (Thực nghiệm)
                </strong>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                  Người quan sát chỉ nhìn thấy <strong>từng đốm sáng xuất hiện rồi tắt trên màn huỳnh quang S</strong> mỗi khi một hạt α đập tới màn.
                </p>
              </div>
              <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
                <strong style={{ display: "block", color: "#161616", marginBottom: "4px" }}>
                  Lớp 2 · Đường quỹ đạo (Mô hình giải thích — Hình 21.3, 21.4 SGK)
                </strong>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                  Mắt <strong>không nhìn thấy đường bay của hạt α</strong>. Các đường thẳng và vết cong ở Hình 21.3–21.4 thuộc lớp <em>“Mô hình giải thích”</em> dùng để suy luận cấu tạo nguyên tử vàng.
                </p>
              </div>
            </div>

            {b21VideoLesson && (
              <div
                style={{
                  border: "1px solid #d0d7de",
                  background: "#f8fafc",
                  padding: "12px 14px",
                  marginBottom: "14px",
                }}
              >
                <p style={{ margin: "0 0 8px", fontSize: "13.5px", lineHeight: 1.55 }}>
                  <strong>Tư liệu video bổ trợ Pha 1 (có thuyết minh &amp; phụ đề tiếng Việt):</strong>{" "}
                  <span style={{ color: "#002d9c", fontWeight: 600 }}>
                    Nếu chưa xem video, học sinh vẫn hoàn thành trọn vẹn Pha 1 từ sơ đồ Hình 21.1–21.2 và dữ kiện SGK ngay trên trang
                  </span>{" "}
                  (việc mở hay phát video không tự tính là hoàn thành bài).
                </p>
                <NuclearLessonVideo lesson={b21VideoLesson} />
              </div>
            )}

            <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
              <legend style={{ fontWeight: 700, fontSize: "14px", marginBottom: "10px", lineHeight: 1.5 }}>
                Câu tự kiểm tra: Dựa vào Hình 21.2b và kết quả trên, điều gì được người làm thí nghiệm quan sát trực tiếp khi chuyển kính hiển vi M từ vị trí (1) sang vị trí (2)?
              </legend>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {B21_PRE_SELF_CHECK_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                      padding: "10px 12px",
                      border:
                        preSelfCheckChoice === opt.id
                          ? "2px solid #0f62fe"
                          : "1px solid #e0e0e0",
                      background: preSelfCheckChoice === opt.id ? "#edf5ff" : "#fafafa",
                      cursor: "pointer",
                      fontSize: "14px",
                      lineHeight: 1.5,
                    }}
                  >
                    <input
                      type="radio"
                      name="b21-pre-self-check"
                      checked={preSelfCheckChoice === opt.id}
                      onChange={() => {
                        patchNotebook((cur) => ({
                          ...cur,
                          preClassWork: {
                            ...cur.preClassWork,
                            selfCheckChoice: opt.id,
                          },
                        }));
                        if (isB21PreClassAllComplete(notebook, undefined, opt.id)) {
                          onMarkSectionComplete(section.id, true);
                        }
                      }}
                      style={{ marginTop: "3px" }}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {selectedSelfCheckOption && (
              <div
                role="status"
                style={{
                  marginTop: "12px",
                  padding: "10px 14px",
                  background:
                    selectedSelfCheckOption.id === "flashes_ratio" ? "#defbe6" : "#fff1f1",
                  borderLeft:
                    selectedSelfCheckOption.id === "flashes_ratio"
                      ? "4px solid #198038"
                      : "4px solid #b42332",
                  fontSize: "13.5px",
                  lineHeight: 1.55,
                }}
              >
                {selectedSelfCheckOption.feedback}
              </div>
            )}
          </section>

          {/* BƯỚC 6: Thẻ tóm tắt “Sản phẩm mang vào lớp” & Câu hỏi muốn kiểm chứng */}
          <section
            aria-labelledby="b21-bring-to-class-heading"
            style={{
              border: "2px solid #0f62fe",
              background: "#edf5ff",
              padding: "16px",
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
              <h4 id="b21-bring-to-class-heading" style={{ margin: 0, fontSize: "16px", color: "#002d9c" }}>
                Sản phẩm mang vào lớp (Liên thông sang Pha 2 &amp; Pha 3)
              </h4>
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  background: preClassReady ? "#defbe6" : "#fcf4d6",
                  color: preClassReady ? "#198038" : "#8e6a00",
                  border: preClassReady ? "1px solid #42be65" : "1px solid #f1c21b",
                }}
              >
                {preClassReady
                  ? "✓ Đã đủ điều kiện hoàn thành Pha 1"
                  : "Cần đủ: Dự đoán + lí do, 4/4 bộ phận Hình 21.2 và câu tự kiểm tra"}
              </span>
            </div>

            <ul style={{ margin: "0 0 12px", paddingLeft: "18px", fontSize: "14px", lineHeight: 1.6 }}>
              <li>
                <strong>1. Dự đoán ban đầu đã khóa:</strong>{" "}
                {lockedInitialPredictionLabel ? (
                  <>
                    “{lockedInitialPredictionLabel}”
                    {lockedInitialReason ? (
                      <span> (Lí do: {lockedInitialReason})</span>
                    ) : (
                      <span style={{ color: "#b42332" }}> — Chưa ghi lí do</span>
                    )}
                  </>
                ) : (
                  <span style={{ color: "#b42332" }}>Chưa lưu dự đoán ở Bước 3.</span>
                )}
              </li>
              <li>
                <strong>2. Nhận diện 4 bộ phận Hình 21.2 (R, D, S, M):</strong>{" "}
                {allApparatusMatched ? (
                  <span style={{ color: "#198038", fontWeight: 600 }}>
                    Đã ghép đúng 4/4 bộ phận (Nguồn α R, Lá vàng D, Màn huỳnh quang S, Kính hiển vi M).
                  </span>
                ) : (
                  <span>Đã ghép đúng {matchedApparatusCount}/4 bộ phận.</span>
                )}
              </li>
              <li>
                <strong>3. Câu tự kiểm tra Pha 1:</strong>{" "}
                {preSelfCheckChoice === "flashes_ratio" ? (
                  <span style={{ color: "#198038", fontWeight: 600 }}>
                    Đã phân biệt đúng đốm sáng trên màn S và tỉ lệ 10⁴ lần giữa vị trí (1) và (2).
                  </span>
                ) : (
                  <span>Chưa trả lời đúng ở Bước 5.</span>
                )}
              </li>
            </ul>

            <label
              htmlFor="b21-bring-question"
              style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
            >
              4. Câu hỏi hoặc điều em muốn kiểm chứng trên bàn thí nghiệm Rutherford V3 ở lớp:
            </label>
            <input
              id="b21-bring-question"
              type="text"
              value={bringToClassQuestion}
              onChange={(e) => {
                const val = e.target.value;
                patchNotebook((cur) => ({
                  ...cur,
                  preClassWork: {
                    ...cur.preClassWork,
                    bringToClassQuestion: val,
                  },
                }));
              }}
              placeholder="Ví dụ: Hạt α phải đi gần tâm nguyên tử vàng tới mức nào (tham số va chạm b bao nhiêu fm) thì bị bật ngược > 90°?"
              style={{
                width: "100%",
                minHeight: "42px",
                padding: "8px 12px",
                border: "1px solid #8d8d8d",
                background: "#ffffff",
                fontSize: "14px",
                marginBottom: "12px",
              }}
            />

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              <button
                type="button"
                className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                onClick={() => onJumpToSection("b21-rutherford-v3")}
              >
                Mở ngay Rutherford V3 (Trong giờ học) →
              </button>
              <small style={{ color: "#525252", fontSize: "12.5px" }}>
                Toàn bộ sản phẩm trên được lưu trực tiếp trên trình duyệt của em và tự động hiển thị lại ở Pha 2 &amp; Pha 3.
              </small>
            </div>
          </section>
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — 2. PHA 2 (TRONG GIỜ HỌC): THÍ NGHIỆM TÁN XẠ HẠT ALPHA (RUTHERFORD V3)
          ==================================================================== */}
      {section.kind === "b21_rutherford_v3" && (
        <div>
          <div className={styles.predictionEchoBox}>
            {lockedInitialPredictionLabel ? (
              <div>
                <div style={{ marginBottom: "6px" }}>
                  <strong>Sản phẩm Pha 1 đã lưu · Dự đoán ban đầu (khóa đối chiếu):</strong>{" "}
                  “{lockedInitialPredictionLabel}”
                  {lockedInitialReason ? (
                    <span>
                      {" "}
                      — <em>Lí do ban đầu: {lockedInitialReason}</em>
                    </span>
                  ) : null}
                </div>
                {currentPredictionLabel &&
                  notebook.preClassPredictionChoice !== lockedInitialChoiceId && (
                    <div style={{ marginBottom: "6px", fontSize: "13px", color: "#525252" }}>
                      <em>Dự đoán cập nhật gần nhất:</em> “{currentPredictionLabel}”
                    </div>
                  )}
                <div style={{ fontSize: "13.5px", color: "#161616", marginBottom: "6px" }}>
                  <strong>Bộ phận Hình 21.2 đã nhận diện:</strong> {matchedApparatusCount}/4 đúng
                  {bringToClassQuestion.trim() ? (
                    <span>
                      {" "}
                      · <strong>Câu hỏi mang vào lớp:</strong> “{bringToClassQuestion.trim()}”
                    </span>
                  ) : null}
                </div>
                <div style={{ color: "#525252", fontSize: "13.5px" }}>
                  Hãy dùng bàn thí nghiệm Rutherford V3 bên dưới, lưu{" "}
                  <strong>hai lượt đo cùng động năng E nhưng khác tham số va chạm b</strong> để kiểm chứng trực tiếp dự đoán ban đầu của em (kể cả khi dự đoán ban đầu chưa khớp thực nghiệm).
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <span>
                  <strong>Đối chiếu sản phẩm Pha 1:</strong> Em chưa khóa dự đoán ban đầu ở mục Trước giờ học. Em có thể mở lại Pha 1 để lưu dự đoán + nhận diện bộ phận R, D, S, M hoặc đo trực tiếp bên dưới.
                </span>
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnSmall}`}
                  onClick={() => onJumpToSection("b21-pre-setup")}
                >
                  Quay lại Pha 1 (Trước giờ học)
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              padding: "10px 14px",
              background: "#f8fafc",
              border: "1px solid #d0d7de",
              marginBottom: "14px",
              fontSize: "13.5px",
              lineHeight: 1.55,
            }}
          >
            <strong>Tách rõ 2 lớp hiển thị trên bàn thí nghiệm:</strong>{" "}
            (1) <strong>Lớp đốm sáng xanh lá trên vòng màn huỳnh quang S</strong> là{" "}
            <em>dữ kiện thực nghiệm quan sát được qua kính hiển vi M</em>;{" "}
            (2) <strong>Lớp đường tia màu lam quanh tâm</strong> là{" "}
            <em>quỹ đạo mô hình tĩnh điện</em> giúp giải thích vì sao góc tán xạ <code>θ</code> tăng vọt khi hạt α đi sát tâm hạt nhân.
          </div>

          <FixedPhysicsActivityRenderer
            activityKey="rutherford_alpha_scattering"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />

          {/* Đối chiếu 3 câu hỏi thảo luận SGK tr. 92 */}
          <div
            style={{
              marginTop: "16px",
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "14px 16px",
            }}
          >
            <h4 style={{ margin: "0 0 10px", fontSize: "15.5px" }}>
              Đối chiếu 3 câu hỏi thảo luận hiện tượng tán xạ hạt α (SGK tr. 92)
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: "12px",
              }}
            >
              <div style={{ border: "1px solid #e0e0e0", background: "#f8fafc", padding: "12px" }}>
                <strong style={{ display: "block", fontSize: "13.5px", color: "#002d9c", marginBottom: "4px" }}>
                  1. Tại vị trí (1) đối diện nguồn R
                </strong>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                  Hầu hết hạt α xuyên thẳng qua lá vàng <strong>D</strong> tới vị trí <strong>(1)</strong> chứng tỏ nguyên tử <strong>không đặc khít</strong> mà phần lớn thể tích là <strong>khoảng trống</strong>.
                </p>
              </div>
              <div style={{ border: "1px solid #e0e0e0", background: "#f8fafc", padding: "12px" }}>
                <strong style={{ display: "block", fontSize: "13.5px", color: "#002d9c", marginBottom: "4px" }}>
                  2. Tương tác làm lệch hướng hạt α
                </strong>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                  Hạt α mang điện dương (<code>+2e</code>) bị đẩy lệch hướng bởi <strong>lực đẩy tĩnh điện (Coulomb)</strong> rất mạnh khi bay gần phần tích điện dương của nguyên tử vàng (electron quá nhẹ nên không làm lệch đáng kể hạt α).
                </p>
              </div>
              <div style={{ border: "1px solid #e0e0e0", background: "#f8fafc", padding: "12px" }}>
                <strong style={{ display: "block", fontSize: "13.5px", color: "#002d9c", marginBottom: "4px" }}>
                  3. Tỉ lệ cỡ 10⁻⁴ ở vị trí (2) (&gt; 90°)
                </strong>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                  Chỉ khoảng <strong>1 trong 10⁴ hạt α</strong> bật ngược về vị trí <strong>(2)</strong> chứng tỏ toàn bộ điện tích dương và gần như toàn bộ khối lượng nguyên tử tập trung tại <strong>hạt nhân rất nhỏ ở tâm</strong> (đường kính cỡ <code>10⁻⁴</code> lần nguyên tử).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — 3. PHA 2 (TRONG GIỜ HỌC): SO SÁNH CÁC MÔ HÌNH NGUYÊN TỬ
          ==================================================================== */}
      {section.kind === "b21_atomic_models" && (
        <div>
          <AtomicModelsComparisonSim
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
            onOpenRutherfordV3={() => onJumpToSection("b21-rutherford-v3")}
          />

          {/* Chú thích đối chiếu trực tiếp Hình 21.1, Hình 21.5a và Hình 21.5b SGK */}
          <div
            style={{
              marginTop: "14px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
            }}
          >
            <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
              <strong style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
                Hình 21.1 · Mô hình nguyên tử Thomson
              </strong>
              <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                Điện tích dương phân bố đều khắp thể tích nguyên tử (<code>~10⁻¹⁰ m</code>), các electron nằm rải rác bên trong — <em>bị bác bỏ</em> bởi hiện tượng hạt α tán xạ góc lớn.
              </p>
            </div>
            <div style={{ border: "1px solid #a6c8ff", background: "#edf5ff", padding: "12px 14px" }}>
              <strong style={{ display: "block", fontSize: "14px", color: "#002d9c", marginBottom: "4px" }}>
                Hình 21.5a · Mô hình hành tinh nguyên tử (Rutherford)
              </strong>
              <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                Gồm 3 thành phần chú thích chuẩn SGK tr. 93: <strong>Hạt nhân</strong> mang điện dương rất nhỏ ở tâm, các electron chuyển động trên <strong>Quỹ đạo của electron</strong> và phần lớn thể tích giữa chúng là <strong>Khoảng trống</strong>.
              </p>
            </div>
            <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
              <strong style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
                Hình 21.5b · Mô hình hiện đại (Đám mây electron)
              </strong>
              <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                Giữ nguyên <strong>Hạt nhân</strong> rất nhỏ ở tâm; các electron có thể xuất hiện ở mọi vị trí trong không gian nguyên tử với xác suất nào đó và <strong>mật độ xác suất có mặt của electron</strong> được biểu diễn bằng <strong>Đám mây electron</strong> (không phải quỹ đạo cố định hay vệt nhòe chuyển động).
              </p>
            </div>
          </div>

          {/* Ô đọc thêm "Em có biết" — SGK tr. 93 */}
          <div
            style={{
              marginTop: "14px",
              border: "1px solid #b5c7e3",
              background: "#f4f8ff",
              padding: "12px 16px",
              fontSize: "13.5px",
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: "#002d9c", display: "block", marginBottom: "4px" }}>
              [Ô đọc thêm “Em có biết” — SGK tr. 93] Từ mẫu hành tinh Rutherford đến Bohr (1913) và Schrödinger
            </strong>
            Mẫu hành tinh nguyên tử của Rutherford chưa giải thích được <em>tính bền vững</em> của nguyên tử và sự tạo thành <em>quang phổ vạch</em>. Năm 1913, <strong>Niels Bohr</strong> giữ mô hình hành tinh của Rutherford nhưng bổ sung các tiên đề lượng tử, giải thích thành công quang phổ vạch của nguyên tử hydrogen (dù chưa giải thích được nhiều nguyên tử phức tạp khác). Hiện nay, cơ học lượng tử của <strong>Erwin Schrödinger</strong> biểu diễn mật độ xác suất có mặt của electron bằng <strong>đám mây electron</strong> (Hình 21.5b), giải thích được quang phổ vạch của các loại nguyên tử.
          </div>

          <details
            style={{
              marginTop: "14px",
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "12px 16px",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "14px",
                color: "#161616",
              }}
            >
              Bảng tóm tắt đối chiếu ba mô hình theo ba câu hỏi cốt lõi (SGK tr. 91–93)
            </summary>
            <div className={styles.tableScroll} style={{ marginTop: "12px", marginBottom: 0 }}>
              <table className={styles.cdsTable}>
                <thead>
                  <tr>
                    <th scope="col" style={{ minWidth: "170px" }}>Câu hỏi so sánh</th>
                    <th scope="col" style={{ minWidth: "190px" }}>1. Hình 21.1 (Thomson)</th>
                    <th scope="col" style={{ minWidth: "200px" }}>2. Hình 21.5a (Hành tinh Rutherford)</th>
                    <th scope="col" style={{ minWidth: "200px" }}>3. Hình 21.5b (Đám mây electron)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Điện tích dương ở đâu?</th>
                    <td>Phân bố trong toàn bộ thể tích hình cầu nguyên tử cỡ <code>10⁻¹⁰ m</code>.</td>
                    <td>Tập trung tại <strong>Hạt nhân</strong> rất nhỏ ở tâm cỡ <code>10⁻¹⁴ – 10⁻¹⁵ m</code>.</td>
                    <td>Tập trung tại <strong>Hạt nhân</strong> rất nhỏ ở tâm.</td>
                  </tr>
                  <tr>
                    <th scope="row">Electron &amp; không gian nguyên tử?</th>
                    <td>Nằm bên trong vùng tích điện dương.</td>
                    <td>Chuyển động trên <strong>Quỹ đạo của electron</strong> quanh tâm; phần còn lại là <strong>Khoảng trống</strong>.</td>
                    <td>Biểu diễn bằng <strong>Đám mây electron</strong>; mật độ chấm đo vị trí tỉ lệ với xác suất có mặt của electron.</td>
                  </tr>
                  <tr>
                    <th scope="row">Liên hệ với thí nghiệm lá vàng?</th>
                    <td>Không giải thích được các hạt α lệch góc lớn hoặc bật ngược.</td>
                    <td><strong>Được chứng minh trực tiếp</strong> về sự tập trung điện tích dương ở hạt nhân nhỏ.</td>
                    <td>Kế thừa hạt nhân nhỏ của Rutherford; phần đám mây xác suất dựa trên cơ học lượng tử.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — 4. PHA 2 (TRONG GIỜ HỌC): CẤU TẠO VÀ KÍCH THƯỚC HẠT NHÂN
          ==================================================================== */}
      {section.kind === "b21_structure_size" && (
        <div>
          {/* 1. Hạt nhân mẫu Silic-28 (Hình 21.6) & Hằng số khối lượng SGK tr. 93 */}
          <div
            style={{
              border: "1px solid #d0d7de",
              background: "#f8fafc",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
              1. Cấu tạo hạt nhân qua nguyên tử Silicon-28 (<Nuclide sym="Si" a={28} z={14} />) &amp; đơn vị khối lượng nguyên tử (SGK tr. 93)
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "14px",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div>
                <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.55 }}>
                  Theo mô hình Rutherford, hạt nhân tích điện dương <code>+Z·e</code> (<code>Z</code> là số thứ tự trong bảng tuần hoàn, gọi là <strong>số hiệu nguyên tử</strong>). Hạt nhân được tạo thành bởi hai loại hạt là <strong>proton (p)</strong> mang điện <code>+e ≈ 1,6·10⁻¹⁹ C</code> và <strong>neutron (n)</strong> trung hòa về điện; hai loại hạt này có tên chung là <strong>nucleon</strong>. Tổng số nucleon được kí hiệu là <strong>A</strong> (<strong>số khối</strong>).
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "8px",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", padding: "8px 10px" }}>
                    <span style={{ fontSize: "12px", color: "#525252", display: "block" }}>Số proton (Z)</span>
                    <strong style={{ fontSize: "16px", color: "#b42332" }}>14 proton (+14e)</strong>
                  </div>
                  <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", padding: "8px 10px" }}>
                    <span style={{ fontSize: "12px", color: "#525252", display: "block" }}>Số neutron (N = A − Z)</span>
                    <strong style={{ fontSize: "16px", color: "#0043ce" }}>14 neutron</strong>
                  </div>
                  <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", padding: "8px 10px" }}>
                    <span style={{ fontSize: "12px", color: "#525252", display: "block" }}>Số khối (A)</span>
                    <strong style={{ fontSize: "16px", color: "#161616" }}>A = 28 nucleon</strong>
                  </div>
                </div>
              </div>

              {/* Sơ đồ vector chuẩn Hình 21.6 SGK tr. 93 */}
              <figure
                style={{
                  margin: 0,
                  background: "#ffffff",
                  border: "1px solid #d0d7de",
                  padding: "10px 12px",
                  textAlign: "center",
                }}
              >
                <svg
                  viewBox="0 0 260 155"
                  role="img"
                  aria-label="Hình 21.6 SGK trang 93: Hạt nhân Si-28 gồm 14 proton đỏ và 14 neutron xanh"
                  style={{ width: "100%", maxWidth: "250px", height: "auto" }}
                >
                  <defs>
                    <radialGradient id="b21ProtonGrad" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stopColor="#ff8389" />
                      <stop offset="100%" stopColor="#da1e28" />
                    </radialGradient>
                    <radialGradient id="b21NeutronGrad" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stopColor="#78a9ff" />
                      <stop offset="100%" stopColor="#0043ce" />
                    </radialGradient>
                  </defs>
                  {/* Cụm 28 nucleon xếp cầu đặc trưng (14 đỏ + 14 xanh) */}
                  {[
                    [112, 46, "n"], [132, 44, "p"], [150, 50, "n"],
                    [96, 58, "p"], [118, 60, "p"], [138, 59, "n"], [158, 64, "p"],
                    [88, 76, "n"], [106, 75, "n"], [126, 74, "p"], [146, 75, "p"], [166, 80, "n"],
                    [92, 94, "p"], [112, 92, "p"], [132, 91, "n"], [152, 92, "n"], [164, 98, "p"],
                    [100, 110, "n"], [120, 108, "n"], [140, 108, "p"], [154, 112, "n"],
                    [114, 122, "p"], [132, 122, "p"], [146, 121, "n"],
                    [110, 68, "p"], [140, 68, "n"], [118, 84, "n"], [138, 84, "p"],
                  ].map(([cx, cy, t], idx) => (
                    <circle
                      key={idx}
                      cx={Number(cx)}
                      cy={Number(cy)}
                      r="11.5"
                      fill={t === "p" ? "url(#b21ProtonGrad)" : "url(#b21NeutronGrad)"}
                      stroke="#ffffff"
                      strokeWidth="0.7"
                    />
                  ))}
                  {/* Mũi tên chú thích Proton & Neutron đúng Hình 21.6 */}
                  <text x="16" y="34" fontSize="12" fontWeight="700" fill="#b42332">Proton</text>
                  <line x1="56" y1="32" x2="90" y2="52" stroke="#161616" strokeWidth="1.3" />
                  <polygon points="90,52 83,51 86,46" fill="#161616" />

                  <text x="194" y="34" fontSize="12" fontWeight="700" fill="#0043ce">Neutron</text>
                  <line x1="205" y1="38" x2="160" y2="50" stroke="#161616" strokeWidth="1.3" />
                  <polygon points="160,50 167,51 165,45" fill="#161616" />
                </svg>
                <figcaption style={{ fontSize: "12px", color: "#525252", marginTop: "4px" }}>
                  <strong>Hình 21.6 (SGK tr. 93).</strong> Hạt nhân <Nuclide sym="Si" a={28} z={14} /> gồm 14 proton và 14 neutron
                </figcaption>
              </figure>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "8px",
                padding: "10px 12px",
                background: "#ffffff",
                border: "1px solid #d0d7de",
                fontSize: "13.5px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <div>
                <strong>Khối lượng proton:</strong>{" "}
                <code>m_p ≈ {SGK_B21_MASS_CONSTANTS.protonKg}</code>
              </div>
              <div>
                <strong>Khối lượng neutron:</strong>{" "}
                <code>m_n ≈ {SGK_B21_MASS_CONSTANTS.neutronKg}</code>
              </div>
              <div>
                <strong>Đơn vị khối lượng nguyên tử:</strong>{" "}
                <code>1 amu ≈ {SGK_B21_MASS_CONSTANTS.amuKg}</code> (= 1/12 khối lượng nguyên tử ¹²₆C)
              </div>
            </div>

            {/* Câu hỏi ? SGK tr. 93 (không lộ đáp án trước khi học sinh tự chia) */}
            <details
              style={{
                marginTop: "10px",
                background: "#ffffff",
                border: "1px solid #d0d7de",
                padding: "10px 12px",
                fontSize: "13.5px",
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: 700, color: "#002d9c" }}>
                Câu hỏi ? (SGK tr. 93): Xác định khối lượng của proton và neutron theo đơn vị amu (tự bấm máy trước khi mở đối chiếu)
              </summary>
              <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
                Lấy khối lượng tính bằng kg chia cho <code>1 amu ≈ 1,66054·10⁻²⁷ kg</code>:{" "}
                <code>m_p = 1,67262 / 1,66054 ≈ 1,00727 amu</code> và{" "}
                <code>m_n = 1,67493 / 1,66054 ≈ 1,00867 amu</code>. Cả proton và neutron đều có khối lượng <strong>xấp xỉ bằng 1 amu</strong>, nên khối lượng hạt nhân (tính ra amu) xấp xỉ bằng số khối <code>A</code>.
              </p>
            </details>
          </div>

          {/* Cảnh báo rõ ràng khi đổi tỉ lệ phóng đại giữa nguyên tử và hạt nhân */}
          <div className={styles.scaleWarningBox}>
            <strong>Chú thích bắt buộc khi đổi tỉ lệ phóng đại (SGK tr. 93–94):</strong>{" "}
            Với Silicon (<Nuclide sym="Si" a={28} z={14} />), bán kính nguyên tử là{" "}
            <code>2,1 × 10⁻¹⁰ m</code> còn bán kính hạt nhân chỉ là{" "}
            <code>3,1 × 10⁻¹⁵ m</code> (nhỏ hơn khoảng <strong>67 700 lần</strong>). Vì vậy mọi sơ đồ vẽ cả nguyên tử lẫn các hạt proton, neutron bên trong hạt nhân đều phải{" "}
            <strong>đổi sang tỉ lệ phóng đại lớn hơn hàng chục nghìn lần cho riêng vùng hạt nhân</strong>; nếu giữ nguyên một tỉ lệ mà nguyên tử rộng <code>10 m</code> thì hạt nhân ở tâm chỉ nhỏ cỡ <code>0,15 mm</code>.
          </div>

          <div style={{ marginBottom: "12px" }}>
            <LatexMath
              block
              math={String.raw`R = 1{,}2 \times 10^{-15}\,A^{1/3}\;(\mathrm{m}) \quad (21.1), \qquad 1\,\mathrm{fm} = 10^{-15}\,\mathrm{m}`}
            />
          </div>

          {/* Bảng 21.1 chính xác 100% SGK tr. 94 (4 cột số liệu gốc SGK, không trộn sẵn cột tính sẵn làm lộ câu ?) */}
          <div className={styles.tableScroll}>
            <table className={styles.cdsTable}>
              <caption>
                Bảng 21.1. Kích thước của một số hạt nhân (SGK Vật lí 12, tr. 94)
              </caption>
              <thead>
                <tr>
                  <th scope="col">Tên nguyên tố</th>
                  <th scope="col" className={styles.numCell}>Số khối A</th>
                  <th scope="col" className={styles.numCell}>Bán kính nguyên tử (10⁻¹⁰ m)</th>
                  <th scope="col" className={styles.numCell}>Bán kính hạt nhân (10⁻¹⁵ m)</th>
                </tr>
              </thead>
              <tbody>
                {SGK_TABLE_21_1.map((row) => (
                  <tr
                    key={row.symbol}
                    style={
                      row.symbol === "Si"
                        ? { background: "#fcf4d6", fontWeight: 600 }
                        : undefined
                    }
                  >
                    <th scope="row">
                      {row.elementName} (<Nuclide sym={row.symbol} a={row.massNumberA} z={row.z} />)
                    </th>
                    <td className={styles.numCell}>{row.massNumberA}</td>
                    <td className={styles.numCell}>{row.atomicRadius10m10}</td>
                    <td className={styles.numCell}>{row.nuclearRadius10m15}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Câu hỏi ? SGK tr. 94: Nghiệm lại công thức (21.1) cho Bảng 21.1 với A > 12 */}
          <details
            style={{
              marginBottom: "16px",
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "12px 14px",
              fontSize: "13.5px",
            }}
          >
            <summary style={{ cursor: "pointer", fontWeight: 700, color: "#002d9c" }}>
              Câu hỏi ? (SGK tr. 94): Công thức (21.1) cho kết quả tốt hơn với A &gt; 12. Nghiệm lại sự chính xác của công thức này cho Bảng 21.1
            </summary>
            <div style={{ marginTop: "10px", lineHeight: 1.6 }}>
              <p style={{ margin: "0 0 8px" }}>
                Thay số khối <code>A</code> vào <code>R_tính = 1,2·10⁻¹⁵·A¹/³</code> (đơn vị <code>10⁻¹⁵ m</code>) và đối chiếu với cột thực nghiệm trong Bảng 21.1:
              </p>
              <div className={styles.tableScroll} style={{ marginBottom: "8px" }}>
                <table className={styles.cdsTable}>
                  <thead>
                    <tr>
                      <th scope="col">Hạt nhân</th>
                      {SGK_TABLE_21_1.map((r) => (
                        <th key={r.symbol} scope="col" className={styles.numCell}>
                          {r.symbol} (A={r.massNumberA})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Bảng 21.1 (10⁻¹⁵ m)</th>
                      {SGK_TABLE_21_1.map((r) => (
                        <td key={r.symbol} className={styles.numCell}>{r.nuclearRadius10m15}</td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">Công thức (21.1)</th>
                      {SGK_TABLE_21_1.map((r) => (
                        <td key={r.symbol} className={styles.numCell}>{r.formulaRadius10m15}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p style={{ margin: 0 }}>
                <strong>Nhận xét vật lí:</strong> Với hạt nhân rất nhẹ như Hydrogen (<code>A = 1</code>), công thức cho <code>1,2·10⁻¹⁵ m</code> lệch tới ~33% so với giá trị <code>0,9·10⁻¹⁵ m</code> vì 1 proton đơn lẻ chưa thể coi như một “giọt chất lỏng” gồm nhiều nucleon xếp sát nhau. Với các hạt nhân có <code>A &gt; 12</code> (từ Oxygen <code>A = 16</code> trở lên), công thức <code>R = R₀·A¹/³</code> phản ánh tốt quy luật thể tích hạt nhân tỉ lệ thuận với số nucleon <code>A</code> (hệ số <code>R₀ ≈ 1,2 fm</code> là giá trị trung bình gần đúng dùng trong chương trình phổ thông).
              </p>
            </div>
          </details>

          {/* Ô đọc thêm "Em có biết" — Hình 21.7 SGK tr. 94: Cỡ kích thước các hạt vi mô & hạt quark */}
          <div
            style={{
              marginBottom: "18px",
              border: "1px solid #b5c7e3",
              background: "#f4f8ff",
              padding: "14px 16px",
            }}
          >
            <strong style={{ color: "#002d9c", display: "block", fontSize: "14px", marginBottom: "6px" }}>
              [Ô đọc thêm “Em có biết” — SGK tr. 94] Hình 21.7 · Cỡ kích thước của một số loại hạt vi mô và hạt quark
            </strong>
            <p style={{ margin: "0 0 10px", fontSize: "13.5px", lineHeight: 1.55 }}>
              Hạt nucleon (proton, neutron) vẫn chưa phải là hạt nhỏ nhất: bên trong mỗi nucleon còn có các hạt nhỏ bé hơn cấu tạo nên chúng, gọi là <strong>hạt quark</strong>. <em>(Lưu ý đọc hình: trục dưới đây ghi bậc độ lớn theo lũy thừa của 10, hình minh họa từng bậc được vẽ tách riêng, không cùng tỉ lệ tuyến tính.)</em>
            </p>
            <div style={{ overflowX: "auto" }}>
              <svg
                viewBox="0 0 760 128"
                role="img"
                aria-label="Hình 21.7 SGK trang 94: Thang bậc độ lớn từ tinh thể 10 mũ trừ 2 mét đến electron 10 mũ trừ 18 mét và hạt quark trong proton"
                style={{ width: "100%", minWidth: "560px", height: "auto", background: "#ffffff", border: "1px solid #d0d7de" }}
              >
                {[
                  { x: 68, title: "Tinh thể", scale: "10⁻² m", color: "#8d8d8d", note: "" },
                  { x: 192, title: "Phân tử", scale: "10⁻⁹ m", color: "#f1c21b", note: "" },
                  { x: 316, title: "Nguyên tử", scale: "10⁻¹⁰ m", color: "#4589ff", note: "" },
                  { x: 440, title: "Hạt nhân", scale: "10⁻¹⁴ m", color: "#0043ce", note: "" },
                  { x: 568, title: "Proton", scale: "10⁻¹⁵ m", color: "#da1e28", note: "chứa 3 Quark" },
                  { x: 692, title: "Electron", scale: "10⁻¹⁸ m", color: "#8a3ffc", note: "" },
                ].map((item, idx, arr) => (
                  <g key={item.title}>
                    {idx === 0 && (
                      <polygon
                        points="68,24 90,38 84,64 52,64 46,38"
                        fill="#e5e7eb"
                        stroke="#525252"
                        strokeWidth="1.5"
                      />
                    )}
                    {idx === 1 && (
                      <g>
                        <circle cx="192" cy="44" r="13" fill="#da1e28" />
                        <circle cx="177" cy="53" r="9" fill="#f1c21b" stroke="#8d8d8d" strokeWidth="0.8" />
                        <circle cx="207" cy="53" r="9" fill="#f1c21b" stroke="#8d8d8d" strokeWidth="0.8" />
                      </g>
                    )}
                    {idx === 2 && (
                      <g>
                        <circle cx="316" cy="45" r="22" fill="#edf5ff" stroke="#78a9ff" strokeDasharray="3 2" />
                        <circle cx="316" cy="45" r="4" fill="#da1e28" />
                        <circle cx="302" cy="36" r="2.5" fill="#0043ce" />
                        <circle cx="331" cy="52" r="2.5" fill="#0043ce" />
                      </g>
                    )}
                    {idx === 3 && (
                      <g>
                        <circle cx="434" cy="40" r="8" fill="#da1e28" />
                        <circle cx="446" cy="40" r="8" fill="#0043ce" />
                        <circle cx="440" cy="51" r="8" fill="#da1e28" />
                        <circle cx="429" cy="50" r="7.5" fill="#0043ce" />
                        <circle cx="450" cy="50" r="7.5" fill="#da1e28" />
                      </g>
                    )}
                    {idx === 4 && (
                      <g>
                        <circle cx="568" cy="46" r="20" fill="#ffd7d9" stroke="#da1e28" strokeWidth="1.6" />
                        <line x1="560" y1="40" x2="576" y2="40" stroke="#161616" strokeWidth="1.4" />
                        <line x1="560" y1="40" x2="568" y2="54" stroke="#161616" strokeWidth="1.4" />
                        <line x1="576" y1="40" x2="568" y2="54" stroke="#161616" strokeWidth="1.4" />
                        <circle cx="560" cy="40" r="4" fill="#198038" />
                        <circle cx="576" cy="40" r="4" fill="#0043ce" />
                        <circle cx="568" cy="54" r="4" fill="#da1e28" />
                        <text x="568" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#198038">
                          Quark
                        </text>
                      </g>
                    )}
                    {idx === 5 && <circle cx="692" cy="46" r="7" fill="#8a3ffc" />}

                    {idx < arr.length - 1 && (
                      <g>
                        <path
                          d={`M ${item.x + 28} 56 Q ${item.x + 62} 68 ${arr[idx + 1].x - 28} 56`}
                          fill="none"
                          stroke="#0f62fe"
                          strokeWidth="1.6"
                        />
                        <polygon
                          points={`${arr[idx + 1].x - 28},56 ${arr[idx + 1].x - 35},54 ${arr[idx + 1].x - 33},60`}
                          fill="#0f62fe"
                        />
                      </g>
                    )}

                    <text x={item.x} y="92" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#161616">
                      {item.title}
                    </text>
                    <text x={item.x} y="109" textAnchor="middle" fontSize="12" fontWeight="600" fill="#002d9c">
                      {item.scale}
                    </text>
                    {item.note && (
                      <text x={item.x} y="122" textAnchor="middle" fontSize="10.5" fill="#525252">
                        ({item.note})
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Nhiệm vụ nhỏ có lưu localStorage: đọc 1 dòng Bảng 21.1 (Silicon A=28) & giải thích tỉ lệ phóng đại */}
          {(() => {
            const structWork = notebook.structureSizeWork ?? {};
            const atomicInput = structWork.atomicRadiusInput ?? "";
            const nuclearInput = structWork.nuclearRadiusInput ?? "";
            const scaleExp = structWork.scaleExplanation ?? "";
            const isChecked = Boolean(structWork.checked) || structCheckedLocal;
            const norm = (s: string) => s.trim().replace(",", ".");
            const atomicOk = Number(norm(atomicInput)) === 2.1;
            const nuclearOk = Number(norm(nuclearInput)) === 3.1;
            const expOk = scaleExp.trim().length >= 10;
            const allStructOk = atomicOk && nuclearOk && expOk;

            return (
              <div
                style={{
                  border: "1px solid #8d8d8d",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "20px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "15.5px" }}>
                  2. Nhiệm vụ đọc Bảng 21.1 &amp; giải thích tỉ lệ phóng đại (tự động lưu vào sổ học tập)
                </h4>
                <p style={{ margin: "0 0 12px", fontSize: "13.5px", color: "#525252", lineHeight: 1.55 }}>
                  Tra dòng <strong>Silicon (A = 28)</strong> trên Bảng 21.1 (chú ý đơn vị lũy thừa ở tiêu đề cột) và giải thích vì sao sách giáo khoa phải phóng lớn hạt nhân trên hình minh họa:
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                    Bán kính nguyên tử Silicon (nhân với <code>10⁻¹⁰ m</code>):
                    <input
                      type="text"
                      inputMode="decimal"
                      value={atomicInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStructCheckedLocal(false);
                        patchNotebook((cur) => ({
                          ...cur,
                          structureSizeWork: {
                            ...cur.structureSizeWork,
                            selectedElement: "Si",
                            atomicRadiusInput: val,
                            checked: false,
                          },
                        }));
                      }}
                      placeholder="Tra cột 3 Bảng 21.1…"
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: "6px",
                        minHeight: "40px",
                        padding: "6px 10px",
                        border: "1px solid #8d8d8d",
                        fontSize: "14px",
                      }}
                    />
                  </label>
                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                    Bán kính hạt nhân Silicon (nhân với <code>10⁻¹⁵ m</code>):
                    <input
                      type="text"
                      inputMode="decimal"
                      value={nuclearInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStructCheckedLocal(false);
                        patchNotebook((cur) => ({
                          ...cur,
                          structureSizeWork: {
                            ...cur.structureSizeWork,
                            selectedElement: "Si",
                            nuclearRadiusInput: val,
                            checked: false,
                          },
                        }));
                      }}
                      placeholder="Tra cột 4 Bảng 21.1…"
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: "6px",
                        minHeight: "40px",
                        padding: "6px 10px",
                        border: "1px solid #8d8d8d",
                        fontSize: "14px",
                      }}
                    />
                  </label>
                </div>

                <label
                  htmlFor="b21-scale-explanation"
                  style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
                >
                  Giải thích ngắn gọn vì sao trên hình minh họa nguyên tử phải phóng lớn hạt nhân:
                </label>
                <textarea
                  id="b21-scale-explanation"
                  className={styles.evidenceTextarea}
                  rows={2}
                  value={scaleExp}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStructCheckedLocal(false);
                    patchNotebook((cur) => ({
                      ...cur,
                      structureSizeWork: {
                        ...cur.structureSizeWork,
                        selectedElement: "Si",
                        scaleExplanation: val,
                        checked: false,
                      },
                    }));
                  }}
                  placeholder="So sánh bậc độ lớn giữa bán kính hạt nhân và bán kính nguyên tử để giải thích…"
                />

                <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={`${styles.cdsBtn} ${styles.cdsBtnPrimary} ${styles.cdsBtnSmall}`}
                    onClick={() => {
                      setStructCheckedLocal(true);
                      patchNotebook((cur) => ({
                        ...cur,
                        structureSizeWork: {
                          ...cur.structureSizeWork,
                          selectedElement: "Si",
                          checked: true,
                        },
                      }));
                      if (allStructOk) {
                        onMarkSectionComplete(section.id, true);
                      }
                    }}
                  >
                    Kiểm tra &amp; lưu bài đọc Bảng 21.1
                  </button>
                  {isChecked && (
                    <span
                      role="status"
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 600,
                        color: allStructOk ? "#198038" : "#b42332",
                      }}
                    >
                      {allStructOk
                        ? "✓ Chính xác! Nguyên tử Silicon có bán kính 2,1·10⁻¹⁰ m, lớn gấp khoảng 68 000 lần hạt nhân (3,1·10⁻¹⁵ m) nên hình vẽ bắt buộc phải phóng lớn vùng hạt nhân."
                        : "Kiểm tra lại dòng Silicon (A = 28) trên Bảng 21.1 và ghi ít nhất một câu giải thích tỉ lệ phóng đại."}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          <h4 style={{ margin: "20px 0 10px", fontSize: "16px" }}>
            3. Thực hành dựng hạt nhân mẫu và kiểm tra Z, N, A
          </h4>
          <FixedPhysicsActivityRenderer
            activityKey="nuclear_structure_builder"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — 5. PHA 2 (TRONG GIỜ HỌC): KÍ HIỆU HẠT NHÂN VÀ ĐỒNG VỊ
          ==================================================================== */}
      {section.kind === "b21_symbol_isotopes" && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "14px",
              marginBottom: "14px",
            }}
          >
            {/* Hiển thị chỉ số A, Z to rõ trên điện thoại 390px + kí hiệu rút gọn ᴬX */}
            <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "14px 16px" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "15.5px" }}>
                2. Kí hiệu hạt nhân chuẩn và kí hiệu rút gọn (SGK tr. 94–95)
              </h4>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-around",
                  gap: "12px",
                  flexWrap: "wrap",
                  padding: "12px",
                  marginBottom: "10px",
                  background: "#ffffff",
                  border: "1px solid #a6c8ff",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "30px", color: "#002d9c", lineHeight: 1.2 }}>
                    <Nuclide sym="X" a="A" z="Z" />
                  </div>
                  <small style={{ color: "#525252", fontWeight: 600 }}>Kí hiệu đầy đủ (ví dụ ¹²₆C)</small>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "28px", color: "#161616", fontWeight: 700, lineHeight: 1.2 }}>
                    <sup style={{ fontSize: "0.68em", marginRight: "1px" }}>A</sup>X
                  </div>
                  <small style={{ color: "#525252", fontWeight: 600 }}>
                    Kí hiệu gọn (ví dụ <sup>12</sup>C)
                  </small>
                </div>
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "14px", lineHeight: 1.6 }}>
                <li>
                  <strong>X</strong>: Kí hiệu hóa học của nguyên tố (ví dụ{" "}
                  <Nuclide sym="C" a={12} z={6} />, <Nuclide sym="Si" a={28} z={14} />).
                </li>
                <li>
                  <strong>Chỉ số trên A (số khối)</strong>: Tổng số nucleon trong hạt nhân.
                </li>
                <li>
                  <strong>Chỉ số dưới Z (số hiệu nguyên tử)</strong>: Số proton trong hạt nhân (điện tích <code>+Z·e</code>).
                </li>
                <li>
                  <strong>Kí hiệu gọn <sup>A</sup>X</strong>: Vì kí hiệu hóa học <strong>X</strong> gắn với duy nhất một ô thứ tự <strong>Z</strong> trong bảng tuần hoàn nên SGK thường viết gọn là <code>¹²C</code>.
                </li>
              </ul>
            </div>

            <div style={{ border: "1px solid #a6c8ff", background: "#edf5ff", padding: "14px 16px" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "15.5px", color: "#002d9c" }}>
                3. Đồng vị bền, đồng vị phóng xạ &amp; ví dụ Hydrogen, Carbon (SGK tr. 95)
              </h4>
              <p style={{ margin: "0 0 8px", fontSize: "14px", lineHeight: 1.6 }}>
                Các hạt nhân <strong>đồng vị</strong> là những hạt nhân có <strong>cùng số Z, khác số A</strong>, nghĩa là <strong>cùng số proton và khác số neutron</strong>.
              </p>
              <p style={{ margin: "0 0 8px", fontSize: "14px", lineHeight: 1.6 }}>
                Các đồng vị được chia làm hai loại: <strong>đồng vị bền</strong> và <strong>đồng vị phóng xạ (không bền)</strong>. Hầu hết các mẫu chất trong tự nhiên đều là hỗn hợp của nhiều đồng vị.
              </p>
              <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55, background: "#ffffff", padding: "8px 10px", border: "1px solid #b5c7e3" }}>
                <strong>Ví dụ Carbon (SGK tr. 95):</strong> Carbon có ba đồng vị chính là{" "}
                <Nuclide sym="C" a={12} z={6} />, <Nuclide sym="C" a={13} z={6} />,{" "}
                <Nuclide sym="C" a={14} z={6} />; trong đó <Nuclide sym="C" a={12} z={6} /> và{" "}
                <Nuclide sym="C" a={13} z={6} /> là <strong>đồng vị bền</strong> chiếm hơn <strong>99%</strong> carbon tự nhiên, còn{" "}
                <Nuclide sym="C" a={14} z={6} /> là đồng vị phóng xạ.
              </p>
            </div>
          </div>

          {/* Ba câu hỏi ? mục 2 Kí hiệu hạt nhân — SGK tr. 95 (không lộ sẵn trước khi học sinh tự làm) */}
          <details
            style={{
              marginBottom: "16px",
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "12px 14px",
              fontSize: "13.5px",
            }}
          >
            <summary style={{ cursor: "pointer", fontWeight: 700, color: "#002d9c" }}>
              Câu hỏi ? mục 2 (SGK tr. 95): Tự trả lời 3 câu hỏi về N = A − Z, kí hiệu gọn ᴬX và viết kí hiệu vàng (Au), helium (He), nitrogen (N)
            </summary>
            <ol style={{ margin: "10px 0 0", paddingLeft: "20px", lineHeight: 1.65 }}>
              <li>
                <strong>Đại lượng <code>N = A − Z</code> cho biết gì? Vì sao?</strong> Cho biết <strong>số lượng hạt neutron</strong> trong hạt nhân, vì hạt nhân chỉ gồm proton và neutron nên tổng số nucleon <code>A = Z + N ⇒ N = A − Z</code>.
              </li>
              <li>
                <strong>Cách tìm <code>Z</code> và <code>N</code> từ kí hiệu dạng <code>ᴬX</code>?</strong> Dựa vào kí hiệu hóa học <code>X</code>, tra ô thứ tự của nguyên tố trong <strong>bảng tuần hoàn</strong> để biết số hiệu nguyên tử <code>Z</code>, sau đó lấy số khối <code>A</code> trừ đi <code>Z</code> để tìm <code>N = A − Z</code>.
              </li>
              <li>
                <strong>Viết kí hiệu hạt nhân vàng (Au), helium (He) và nitrogen (N) có số nucleon lần lượt là 197; 4 và 14:</strong> Tra bảng tuần hoàn được <code>Z_Au = 79</code>, <code>Z_He = 2</code>, <code>Z_N = 7</code>; từ đó viết được:{" "}
                <Nuclide sym="Au" a={197} z={79} />, <Nuclide sym="He" a={4} z={2} /> và{" "}
                <Nuclide sym="N" a={14} z={7} />.
              </li>
            </ol>
          </details>

          <div className={styles.tableScroll}>
            <table className={styles.cdsTable}>
              <caption>
                Bảng đối chiếu ba đồng vị của nguyên tố Hydrogen (SGK Vật lí 12, tr. 95)
              </caption>
              <thead>
                <tr>
                  <th scope="col">Tên gọi theo SGK tr. 95</th>
                  <th scope="col">Kí hiệu hạt nhân</th>
                  <th scope="col" className={styles.numCell}>Số proton Z</th>
                  <th scope="col" className={styles.numCell}>Số khối A</th>
                  <th scope="col" className={styles.numCell}>Số neutron N = A − Z</th>
                  <th scope="col">Phân loại &amp; đặc điểm vật lí</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Hydrogen thường</th>
                  <td style={{ fontSize: "16px" }}>
                    <Nuclide sym="H" a={1} z={1} />
                  </td>
                  <td className={styles.numCell}>1</td>
                  <td className={styles.numCell}>1</td>
                  <td className={styles.numCell}>0</td>
                  <td>Đồng vị bền, chiếm ~99,985% hydrogen tự nhiên; hạt nhân chỉ gồm 1 proton.</td>
                </tr>
                <tr>
                  <th scope="row">Hydrogen nặng (deuterium)</th>
                  <td style={{ fontSize: "16px" }}>
                    <Nuclide sym="H" a={2} z={1} /> (hay <Nuclide sym="D" a={2} z={1} />)
                  </td>
                  <td className={styles.numCell}>1</td>
                  <td className={styles.numCell}>2</td>
                  <td className={styles.numCell}>1</td>
                  <td>Đồng vị bền (~0,015%); tạo nước nặng D₂O có khối lượng riêng (~1,11 g/cm³) lớn hơn nước thường H₂O.</td>
                </tr>
                <tr>
                  <th scope="row">Hydrogen siêu nặng (tritium)</th>
                  <td style={{ fontSize: "16px" }}>
                    <Nuclide sym="H" a={3} z={1} /> (hay <Nuclide sym="T" a={3} z={1} />)
                  </td>
                  <td className={styles.numCell}>1</td>
                  <td className={styles.numCell}>3</td>
                  <td className={styles.numCell}>2</td>
                  <td>Đồng vị phóng xạ (không bền); hạt nhân có 1 proton và 2 neutron.</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bài tập nhanh tìm N = A - Z và câu hỏi ? SGK tr. 95 về khối lượng riêng đồng vị (lưu localStorage) */}
          {(() => {
            const isoWork = notebook.symbolIsotopeWork ?? {};
            const nInput = isoWork.targetNeutronInput ?? "";
            const densityChoice = isoWork.densityChoice ?? "";
            const isoChecked = Boolean(isoWork.checked) || isoCheckedLocal;
            const nOk = Number(nInput.trim()) === 118;
            const densityOk = densityChoice === "heavier_nucleus";
            const allIsoQuickOk = nOk && densityOk;

            return (
              <div
                style={{
                  border: "1px solid #8d8d8d",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 10px", fontSize: "15.5px" }}>
                  Bài tập nhanh &amp; Câu hỏi ? mục 3 (SGK tr. 95): Tính số neutron &amp; giải thích sự khác nhau về khối lượng riêng
                </h4>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "12px" }}>
                  1. Hạt nhân vàng trong lá vàng Rutherford có số khối <code>A = 197</code> và số hiệu nguyên tử <code>Z = 79</code>. Số neutron <code>N = A − Z</code> của hạt nhân này bằng bao nhiêu?
                  <input
                    type="number"
                    inputMode="numeric"
                    value={nInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setIsoCheckedLocal(false);
                      patchNotebook((cur) => ({
                        ...cur,
                        symbolIsotopeWork: {
                          ...cur.symbolIsotopeWork,
                          targetNeutronInput: val,
                          checked: false,
                        },
                      }));
                    }}
                    placeholder="Nhập giá trị N…"
                    style={{
                      display: "block",
                      width: "100%",
                      maxWidth: "280px",
                      marginTop: "6px",
                      minHeight: "40px",
                      padding: "6px 10px",
                      border: "1px solid #8d8d8d",
                      fontSize: "14.5px",
                    }}
                  />
                </label>

                <fieldset style={{ border: "none", margin: "0 0 12px", padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
                    2. (Câu hỏi ? SGK tr. 95) Tại sao các mẫu đơn chất tạo từ cùng một nguyên tố (xét ở cùng điều kiện nhiệt độ, áp suất và cùng kiểu cấu trúc phân tử/tinh thể, ví dụ khí ²₁H₂ so với ¹₁H₂) nhưng khối lượng riêng vẫn có thể khác nhau?
                  </legend>
                  {[
                    [
                      "heavier_nucleus",
                      "Vì các đồng vị của cùng nguyên tố có cùng số proton Z (kích thước vỏ nguyên tử/khoảng cách phân tử xấp xỉ như nhau) nhưng khác số neutron N, làm khối lượng hạt nhân (và khối lượng nguyên tử) khác nhau nên khối lượng trên một đơn vị thể tích khác nhau.",
                    ],
                    [
                      "more_protons",
                      "Vì các đồng vị nặng hơn có nhiều proton hơn nên hút vỏ electron co nhỏ lại một nửa.",
                    ],
                  ].map(([val, label]) => (
                    <label
                      key={val}
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
                        name="b21-iso-density"
                        checked={densityChoice === val}
                        onChange={() => {
                          setIsoCheckedLocal(false);
                          patchNotebook((cur) => ({
                            ...cur,
                            symbolIsotopeWork: {
                              ...cur.symbolIsotopeWork,
                              densityChoice: val,
                              checked: false,
                            },
                          }));
                        }}
                        style={{ marginTop: "3px" }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </fieldset>

                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={`${styles.cdsBtn} ${styles.cdsBtnPrimary} ${styles.cdsBtnSmall}`}
                    onClick={() => {
                      setIsoCheckedLocal(true);
                      patchNotebook((cur) => ({
                        ...cur,
                        symbolIsotopeWork: {
                          ...cur.symbolIsotopeWork,
                          checked: true,
                        },
                      }));
                      if (allIsoQuickOk) {
                        onMarkSectionComplete(section.id, true);
                      }
                    }}
                  >
                    Kiểm tra bài tập nhanh
                  </button>
                  {isoChecked && (
                    <span
                      role="status"
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 600,
                        color: allIsoQuickOk ? "#198038" : "#b42332",
                      }}
                    >
                      {allIsoQuickOk
                        ? "✓ Chính xác! ¹⁹⁷₇₉Au có N = 197 − 79 = 118 neutron; ngoài ra các đồng vị khác số neutron làm khối lượng nguyên tử khác nhau nên tỉ lệ đồng vị khác nhau sẽ cho khối lượng riêng khác nhau (bên cạnh yếu tố dạng thù hình tinh thể như kim cương/than chì ở chất rắn)."
                        : "Kiểm tra lại phép trừ N = A − Z và nhớ rằng các đồng vị có cùng số proton Z nhưng khác số neutron N."}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          <h4 style={{ margin: "20px 0 10px", fontSize: "16px" }}>
            Thực hành khảo sát đồng vị và kích thước hạt nhân
          </h4>
          <FixedPhysicsActivityRenderer
            activityKey="isotope_and_nuclear_size"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — 6. PHA 3 (SAU GIỜ HỌC): KIỂM TRA, ĐÁNH GIÁ (²⁷₁₃Al & ĐỐI CHIẾU PHA 1)
          ==================================================================== */}
      {section.kind === "b21_after_transfer" &&
        (() => {
          const afterWork = notebook.afterClassWork ?? {};
          const alZ = afterWork.alZ ?? "";
          const alN = afterWork.alN ?? "";
          const alRadiusFm = afterWork.alRadiusFm ?? "";
          const alChoice = afterWork.alChoice ?? "";
          const predictionReflection = afterWork.predictionReflection ?? "";
          const alChecked = Boolean(afterWork.checked) || alCheckedLocal;

          const parsedR = Number(alRadiusFm.trim().replace(",", "."));
          const rOk = Number.isFinite(parsedR) && Math.abs(parsedR - 3.6) <= 0.05;
          const zOk = Number(alZ.trim()) === 13;
          const nOk = Number(alN.trim()) === 14;
          const choiceOk = alChoice === "smaller";
          const reflectionOk = predictionReflection.trim().length >= 8;
          const allAfterOk = zOk && nOk && rOk && choiceOk && reflectionOk;

          return (
            <div style={{ border: "1px solid #d0d7de", padding: "18px", background: "#ffffff" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "16.5px" }}>
                Tình huống vận dụng sau giờ học: Tán xạ hạt α trên lá nhôm mỏng{" "}
                <Nuclide sym="Al" a={27} z={13} /> &amp; đối chiếu dự đoán Pha 1
              </h4>
              <p style={{ margin: "0 0 14px", fontSize: "14.5px", lineHeight: 1.6 }}>
                Một nhóm học sinh giữ nguyên nguồn phát hạt α (<code>E = 6 MeV</code>) nhưng thay lá vàng mỏng{" "}
                <Nuclide sym="Au" a={197} z={79} /> bằng lá nhôm mỏng{" "}
                <Nuclide sym="Al" a={27} z={13} /> có cùng mật độ diện tích nguyên tử.
              </p>

              {/* Hiển thị lại dự đoán ban đầu đã khóa ở Pha 1 để học sinh phản tư */}
              <div
                style={{
                  marginBottom: "14px",
                  padding: "10px 14px",
                  background: "#edf5ff",
                  borderLeft: "4px solid #0f62fe",
                  fontSize: "13.5px",
                  lineHeight: 1.55,
                }}
              >
                <strong>Dự đoán ban đầu của em ở Pha 1:</strong>{" "}
                {lockedInitialPredictionLabel ? (
                  <>
                    “{lockedInitialPredictionLabel}”
                    {lockedInitialReason ? <span> (Lí do: {lockedInitialReason})</span> : null}
                  </>
                ) : (
                  <span>Chưa lưu dự đoán ở Pha 1 — hãy nêu nhận xét của em sau khi học xong bài bên dưới.</span>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                  1. Số proton Z của <Nuclide sym="Al" a={27} z={13} />:
                  <input
                    type="number"
                    inputMode="numeric"
                    value={alZ}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAlCheckedLocal(false);
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: {
                          ...cur.afterClassWork,
                          alZ: val,
                          checked: false,
                        },
                      }));
                    }}
                    placeholder="Nhập Z…"
                    style={{
                      display: "block",
                      width: "100%",
                      marginTop: "6px",
                      minHeight: "42px",
                      padding: "8px 10px",
                      border: "1px solid #8d8d8d",
                      fontSize: "15px",
                    }}
                  />
                </label>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                  2. Số neutron N = A − Z của <Nuclide sym="Al" a={27} z={13} />:
                  <input
                    type="number"
                    inputMode="numeric"
                    value={alN}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAlCheckedLocal(false);
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: {
                          ...cur.afterClassWork,
                          alN: val,
                          checked: false,
                        },
                      }));
                    }}
                    placeholder="Nhập N…"
                    style={{
                      display: "block",
                      width: "100%",
                      marginTop: "6px",
                      minHeight: "42px",
                      padding: "8px 10px",
                      border: "1px solid #8d8d8d",
                      fontSize: "15px",
                    }}
                  />
                </label>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                  3. Bán kính gần đúng R của <Nuclide sym="Al" a={27} z={13} /> (đơn vị <code>10⁻¹⁵ m</code> hay <code>fm</code>):
                  <input
                    type="text"
                    inputMode="decimal"
                    value={alRadiusFm}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAlCheckedLocal(false);
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: {
                          ...cur.afterClassWork,
                          alRadiusFm: val,
                          checked: false,
                        },
                      }));
                    }}
                    placeholder="Tính 1,2 × 27^(1/3)…"
                    style={{
                      display: "block",
                      width: "100%",
                      marginTop: "6px",
                      minHeight: "42px",
                      padding: "8px 10px",
                      border: "1px solid #8d8d8d",
                      fontSize: "15px",
                    }}
                  />
                </label>
              </div>

              <fieldset style={{ border: "none", padding: 0, margin: "0 0 14px" }}>
                <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
                  4. Khi xét cùng tham số va chạm b = 15 fm và động năng E = 6 MeV, góc lệch của hạt α qua hạt nhân{" "}
                  <Nuclide sym="Al" a={27} z={13} /> thay đổi thế nào so với qua hạt nhân{" "}
                  <Nuclide sym="Au" a={197} z={79} />?
                </legend>
                {[
                  [
                    "smaller",
                    "Góc tán xạ nhỏ hơn rõ rệt vì điện tích hạt nhân nhôm (+13e) nhỏ hơn hạt nhân vàng (+79e) khoảng 6 lần nên lực đẩy tĩnh điện yếu hơn.",
                  ],
                  [
                    "larger",
                    "Góc tán xạ lớn hơn vì hạt nhân nhôm nhẹ hơn nên đẩy hạt α mạnh hơn.",
                  ],
                  [
                    "same",
                    "Góc tán xạ không đổi vì chùm hạt α vẫn có cùng động năng E = 6 MeV.",
                  ],
                ].map(([val, label]) => (
                  <label
                    key={val}
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
                      name="b21-al-transfer"
                      checked={alChoice === val}
                      onChange={() => {
                        setAlCheckedLocal(false);
                        patchNotebook((cur) => ({
                          ...cur,
                          afterClassWork: {
                            ...cur.afterClassWork,
                            alChoice: val,
                            checked: false,
                          },
                        }));
                      }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>

              <label
                htmlFor="b21-after-reflection"
                style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
              >
                5. Đối chiếu lại dự đoán ban đầu của em ở Pha 1: Bằng chứng nào trong bài học hôm nay đã khẳng định hoặc giúp em điều chỉnh suy nghĩ ban đầu?
              </label>
              <textarea
                id="b21-after-reflection"
                className={styles.evidenceTextarea}
                rows={2}
                value={predictionReflection}
                onChange={(e) => {
                  const val = e.target.value;
                  setAlCheckedLocal(false);
                  patchNotebook((cur) => ({
                    ...cur,
                    afterClassWork: {
                      ...cur.afterClassWork,
                      predictionReflection: val,
                      checked: false,
                    },
                  }));
                }}
                placeholder="Ví dụ: Lúc đầu em đoán không có hạt nào bật ngược, nhưng tỉ lệ ~10⁻⁴ đốm sáng ở vị trí (2) chứng tỏ điện tích dương tập trung ở hạt nhân rất nhỏ…"
              />

              <div style={{ marginTop: "12px" }}>
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                  onClick={() => {
                    setAlCheckedLocal(true);
                    patchNotebook((cur) => ({
                      ...cur,
                      afterClassWork: {
                        ...cur.afterClassWork,
                        checked: true,
                      },
                    }));
                    if (allAfterOk) {
                      onMarkSectionComplete(section.id, true);
                    }
                  }}
                >
                  Kiểm tra &amp; lưu đáp án Pha 3
                </button>
              </div>

              {alChecked && (
                <div
                  role="status"
                  style={{
                    marginTop: "12px",
                    padding: "12px 14px",
                    background: allAfterOk ? "#defbe6" : "#fff0f1",
                    borderLeft: allAfterOk ? "4px solid #198038" : "4px solid #b42332",
                    fontSize: "14px",
                    lineHeight: 1.55,
                  }}
                >
                  {allAfterOk ? (
                    <>
                      <strong>✓ Hoàn thành chính xác Pha 3!</strong> Hạt nhân{" "}
                      <Nuclide sym="Al" a={27} z={13} /> có <code>Z = 13</code> proton,{" "}
                      <code>N = 27 − 13 = 14</code> neutron, bán kính gần đúng{" "}
                      <code>R = 1,2 × 27¹/³ = 3,6 fm</code> (<code>3,6 × 10⁻¹⁵ m</code>), góc tán xạ nhỏ hơn so với vàng và đáp án của em đã được lưu bền vững trong sổ học tập.
                    </>
                  ) : (
                    <>
                      <strong>Kiểm tra lại từng mục:</strong>{" "}
                      {!zOk && "Chỉ số dưới Z của ²⁷₁₃Al bằng 13. "}
                      {!nOk && "Số neutron N = 27 − 13 = 14. "}
                      {!rOk && "Bán kính R = 1,2 × 27¹/³ = 1,2 × 3 = 3,6 (fm hay 10⁻¹⁵ m). "}
                      {!choiceOk && "Lực đẩy tĩnh điện tỉ lệ thuận với điện tích hạt nhân bia (+13e < +79e). "}
                      {!reflectionOk && "Em hãy viết ít nhất một câu đối chiếu lại với dự đoán ở Pha 1."}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })()}

      {/* ====================================================================
          BÀI 22 — PHẢN ỨNG HẠT NHÂN & NĂNG LƯỢNG LIÊN KẾT (Eₗₖ, Eₗₖᵣ = Eₗₖ/A)
          ==================================================================== */}
      {section.kind === "b22_blackett_track" &&
        (() => {
          const lockedB22Label = B22_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          const trackRoles = notebook.preClassWork?.b22TrackRoles ?? {};
          const matchedTrackCount = B22_TRACK_PARTS.filter(
            (p) => trackRoles[p.code] === p.correctRole
          ).length;
          const b22SelfCheck = notebook.preClassWork?.selfCheckChoice ?? "";
          const b22SelfOpt = B22_PRE_SELF_CHECK_OPTIONS.find(
            (o) => o.id === b22SelfCheck
          );
          const checkB22PreReady = (
            nb: StudentLessonNotebook,
            rolesOv?: typeof trackRoles,
            selfOv?: string
          ) => {
            const hasP = Boolean(
              (nb.initialPredictionChoice ?? nb.preClassPredictionChoice ?? "").trim()
            );
            const hasR = Boolean(
              (nb.initialPredictionReason ?? nb.preClassPredictionReason ?? "").trim()
            );
            const rMap = rolesOv ?? nb.preClassWork?.b22TrackRoles ?? {};
            const rolesOk = B22_TRACK_PARTS.every((p) => rMap[p.code] === p.correctRole);
            const sc = selfOv ?? nb.preClassWork?.selfCheckChoice ?? "";
            return hasP && hasR && rolesOk && sc === "two_branches_transmute";
          };
          const b22Ready = checkB22PreReady(notebook);

          return (
            <div>
              {/* Bước 1: Câu hỏi mở đầu Hình 22.1–22.2 */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 1 · Câu hỏi mở đầu từ ảnh chụp buồng sương Blackett (Hình 22.1–22.2 · SGK tr. 96)
                </h4>
                <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.6 }}>
                  Năm 1925, P. M. S. Blackett chụp hàng chục nghìn bức ảnh chùm hạt α phóng qua buồng sương chứa khí Nitrogen (<Nuclide sym="N" a={14} z={7} />). Hầu hết vệt sương đều là đường thẳng song song, nhưng thỉnh thoảng xuất hiện một vệt đặc biệt tách nhánh hình chữ Y.
                </p>
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#edf5ff",
                    borderLeft: "4px solid #0f62fe",
                    fontSize: "14.5px",
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color: "#002d9c", display: "block", marginBottom: "4px" }}>
                    Câu hỏi mở đầu cần suy nghĩ:
                  </strong>
                  <em>
                    “Vì sao giữa hàng chục nghìn vệt hạt α đi thẳng trong buồng sương chứa Nitrogen lại có một vệt biến mất tại đỉnh rẽ nhánh chữ Y?”
                  </em>
                </div>
              </section>

              {/* Bước 2: Tư liệu quan sát Hình 22.1 & Hình 22.2 (chưa lộ tên sản phẩm trước khi học sinh dự đoán & ghép vai trò) */}
              <section style={{ marginBottom: "18px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "16px" }}>
                  Bước 2 · Quan sát sơ đồ Hình 22.1 (Rutherford) và vết rẽ nhánh chữ Y Hình 22.2 (Blackett · SGK tr. 96)
                </h4>
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#fcf4d6",
                    border: "1px solid #f1c21b",
                    borderLeft: "4px solid #8e6a00",
                    marginBottom: "14px",
                    fontSize: "14px",
                    lineHeight: 1.55,
                  }}
                >
                  <strong>Chỉ dẫn quan sát trọng tâm (chưa lộ đáp án):</strong>{" "}
                  <em>
                    “Trên Hình 22.2, hãy để ý tại đỉnh (2) vệt hạt α đi tới (1) biến mất (không có nhánh thứ 3 đi tiếp), chỉ xuất hiện một nhánh mảnh – rất dài (3) và một nhánh rất đậm – ngắn (4).”
                  </em>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "12px",
                    marginBottom: "14px",
                  }}
                >
                  {/* Hình 22.1 SGK tr. 96: Sơ đồ thí nghiệm của Rutherford */}
                  <figure
                    style={{
                      margin: 0,
                      border: "1px solid #d0d7de",
                      background: "#ffffff",
                      padding: "12px",
                    }}
                  >
                    <svg
                      viewBox="0 0 340 185"
                      role="img"
                      aria-label="Hình 22.1 SGK trang 96: Sơ đồ thí nghiệm của Rutherford gồm nguồn Po-210 phát hạt alpha tại P trong buồng chứa khí nitrogen dẫn qua ống A, màn huỳnh quang S và kính hiển vi K"
                      style={{ width: "100%", height: "auto", display: "block" }}
                    >
                      <rect x="0" y="0" width="340" height="185" fill="#f8fafc" />
                      {/* Thành buồng khí */}
                      <rect x="26" y="48" width="214" height="96" fill="#ffffff" stroke="#0f62fe" strokeWidth="2" />
                      {/* Hai van nạp/hút khí A */}
                      <path d="M 74 48 L 74 20 M 86 48 L 86 20" stroke="#0f62fe" strokeWidth="1.8" />
                      <ellipse cx="80" cy="30" rx="10" ry="5" fill="#e0e7ff" stroke="#161616" strokeWidth="1.2" />
                      <text x="64" y="63" fontSize="12" fontWeight="700" fill="#161616">A</text>

                      <path d="M 190 48 L 190 20 M 202 48 L 202 20" stroke="#0f62fe" strokeWidth="1.8" />
                      <ellipse cx="196" cy="30" rx="10" ry="5" fill="#e0e7ff" stroke="#161616" strokeWidth="1.2" />
                      <text x="180" y="63" fontSize="12" fontWeight="700" fill="#161616">A</text>

                      {/* Nguồn P phát chùm alpha trong khí N-14 */}
                      <line x1="36" y1="126" x2="236" y2="126" stroke="#525252" strokeWidth="2" />
                      <rect x="148" y="96" width="6" height="30" fill="#0f62fe" />
                      <line x1="154" y1="104" x2="178" y2="104" stroke="#da1e28" strokeWidth="2" />
                      <polygon points="178,104 171,100 171,108" fill="#da1e28" />
                      <text x="160" y="96" fontSize="12.5" fontWeight="700" fill="#b42332">P (²¹⁰₈₄Po)</text>
                      <text x="44" y="98" fontSize="11.5" fill="#525252">Khí chứa ¹⁴₇N</text>

                      {/* Màn huỳnh quang S và kính hiển vi K */}
                      <rect x="240" y="42" width="8" height="108" fill="#a6c8ff" stroke="#0043ce" strokeWidth="1.4" />
                      <text x="252" y="138" fontSize="12.5" fontWeight="700" fill="#002d9c">S</text>
                      <polygon
                        points="256,96 286,84 324,84 324,108 286,108"
                        fill="#e5e7eb"
                        stroke="#161616"
                        strokeWidth="1.5"
                      />
                      <text x="298" y="100" fontSize="12.5" fontWeight="700" fill="#161616">K</text>
                    </svg>
                    <figcaption style={{ fontSize: "12.5px", color: "#525252", marginTop: "6px", lineHeight: 1.5 }}>
                      <strong>Hình 22.1 (SGK tr. 96) · Sơ đồ thí nghiệm của Rutherford:</strong> Nguồn{" "}
                      <Nuclide sym="Po" a={210} z={84} /> đặt tại <code>P</code> phát hạt α bắn phá{" "}
                      <Nuclide sym="N" a={14} z={7} /> trong không khí (nạp/hút qua <code>A</code>). Kính hiển vi <code>K</code> thấy vết sáng trên màn <code>S</code> gợi ý có hạt{" "}
                      <Nuclide sym="H" a={1} z={1} />, nhưng chưa thấy trực tiếp diễn biến tương tác.
                    </figcaption>
                  </figure>

                  {/* Hình 22.2 SGK tr. 96: Buồng sương Blackett (chỉ đánh số 1-4 chưa lộ đáp án) */}
                  <figure className={styles.darkBenchStage} style={{ margin: 0 }}>
                    <svg
                      viewBox="0 0 420 185"
                      role="img"
                      aria-label="Hình 22.2 SGK trang 96: Vết sương rẽ nhánh trong buồng sương của Blackett với 4 chi tiết đánh số (1), (2), (3), (4) để học sinh nhận diện"
                      style={{ width: "100%", height: "auto", display: "block" }}
                    >
                      <rect x="0" y="0" width="420" height="185" fill="#0b1220" />
                      {/* Các vệt sương thẳng không va chạm */}
                      {[34, 60, 138, 164].map((y) => (
                        <line key={y} x1="22" y1={y} x2="250" y2={y} stroke="#334155" strokeWidth="2" />
                      ))}
                      {/* (1) Vệt thẳng đi tới */}
                      <line x1="22" y1="98" x2="188" y2="98" stroke="#38bdf8" strokeWidth="4" />
                      {/* (2) Đỉnh chữ Y */}
                      <circle cx="188" cy="98" r="6" fill="#facc15" />
                      {/* (3) Nhánh mảnh vươn rất dài */}
                      <line x1="188" y1="98" x2="392" y2="28" stroke="#fde047" strokeWidth="2.1" />
                      {/* (4) Nhánh rất đậm, quãng đi ngắn */}
                      <line
                        x1="188"
                        y1="98"
                        x2="262"
                        y2="140"
                        stroke="#fb7185"
                        strokeWidth="5.5"
                        strokeLinecap="round"
                      />
                      <text x="28" y="86" fill="#7dd3fc" fontSize="12.5" fontWeight="700">
                        (1) Vệt thẳng đi tới
                      </text>
                      <text x="116" y="122" fill="#facc15" fontSize="12" fontWeight="700">
                        (2) Đỉnh rẽ nhánh chữ Y
                      </text>
                      <text x="252" y="26" fill="#fde047" fontSize="12.5" fontWeight="700">
                        (3) Nhánh mảnh, rất dài
                      </text>
                      <text x="268" y="146" fill="#fda4af" fontSize="12.5" fontWeight="700">
                        (4) Nhánh đậm, ngắn
                      </text>
                    </svg>
                    <figcaption className={styles.darkBenchCaption}>
                      <strong>Hình 22.2 (SGK tr. 96) · Vết sương rẽ nhánh của Blackett (1925):</strong> Buồng sương siêu bão hòa giúp chụp được vệt đường đi của các hạt tích điện. Hãy dự đoán điều gì xảy ra tại đỉnh <code>(2)</code> ở Bước 3 và ghép vai trò <code>(1)–(4)</code> ở Bước 4!
                    </figcaption>
                  </figure>
                </div>

                {b21VideoLesson && (
                  <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "13.5px", lineHeight: 1.55 }}>
                      <strong>Tư liệu video bổ trợ Pha 1 Bài 22:</strong> Theo dõi diễn biến trước – trong – sau tương tác hạt nhân và cách kiểm tra tổng A, Z.{" "}
                      <span style={{ color: "#002d9c", fontWeight: 600 }}>
                        Nếu chưa xem video, học sinh vẫn hoàn thành trọn vẹn Pha 1 từ Hình 22.1 – 22.2 ngay trên trang
                      </span>{" "}
                      (mở hoặc phát video không tự tính hoàn thành).
                    </p>
                    <NuclearLessonVideo lesson={b21VideoLesson} />
                  </div>
                )}
              </section>

              {/* Bước 3: Khóa dự đoán ban đầu + lí do */}
              <section
                style={{
                  border: "1px solid #8d8d8d",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 6px", fontSize: "16px" }}>
                  Bước 3 · Ghi và khóa dự đoán ban đầu kèm lí do (trước khi xem kết luận của Blackett)
                </h4>
                {lockedB22Label && (
                  <div
                    style={{
                      marginBottom: "12px",
                      padding: "10px 12px",
                      background: "#fcf4d6",
                      borderLeft: "4px solid #8e6a00",
                      fontSize: "13.5px",
                    }}
                  >
                    <strong>Dự đoán ban đầu đã khóa:</strong> “{lockedB22Label}”
                    {lockedInitialReason ? <span> — <em>Lí do: {lockedInitialReason}</em></span> : null}
                  </div>
                )}
                <fieldset style={{ border: "none", margin: "0 0 12px", padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
                    Chọn dự đoán của em về hiện tượng tại đỉnh rẽ nhánh chữ Y trên Hình 22.2:
                  </legend>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {B22_PREDICTION_CHOICES.map((opt) => (
                      <label
                        key={opt.id}
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                          padding: "10px 12px",
                          border: predChoice === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                          background: predChoice === opt.id ? "#edf5ff" : "#fafafa",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        <input
                          type="radio"
                          name="b22-pre-prediction"
                          checked={predChoice === opt.id}
                          onChange={() => {
                            setPredChoiceDraft(opt.id);
                            setPredSavedMsg("");
                          }}
                          style={{ marginTop: "3px" }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label
                  htmlFor="b22-pre-reason"
                  style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
                >
                  Lí do cho dự đoán của em (bắt buộc):
                </label>
                <textarea
                  id="b22-pre-reason"
                  className={styles.evidenceTextarea}
                  rows={2}
                  value={predReason}
                  onChange={(e) => {
                    setPredReasonDraft(e.target.value);
                    setPredSavedMsg("");
                  }}
                  placeholder="Nêu ngắn gọn vì sao em dự đoán như vậy dựa trên số nhánh sương sau va chạm…"
                />
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "10px" }}>
                  <button
                    type="button"
                    className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                    onClick={() => {
                      if (!predChoice || !predReason.trim()) {
                        setPredSavedMsg("Em hãy chọn dự đoán và viết ngắn gọn lí do trước khi lưu.");
                        return;
                      }
                      onSavePreClassPrediction(predChoice, predReason.trim());
                      const updated = recordPreClassPrediction(notebook, predChoice, predReason.trim());
                      if (checkB22PreReady(updated)) onMarkSectionComplete(section.id, true);
                      setPredSavedMsg("Đã lưu và khóa dự đoán ban đầu cho Bài 22.");
                    }}
                  >
                    Lưu dự đoán trước giờ học
                  </button>
                  {predSavedMsg && (
                    <span
                      role="status"
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 600,
                        color: predChoice && predReason.trim() ? "#198038" : "#b42332",
                      }}
                    >
                      {predSavedMsg}
                    </span>
                  )}
                </div>
              </section>

              {/* Bước 4: Thao tác nhỏ ghép đúng 4 chi tiết trên vết chữ Y */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 4 · Thao tác ghép đúng 4 chi tiết trên vết buồng sương Blackett ({matchedTrackCount}/4 đúng)
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {B22_TRACK_PARTS.map((part) => {
                    const sel = trackRoles[part.code] ?? "";
                    const ok = sel === part.correctRole;
                    return (
                      <div
                        key={part.code}
                        style={{
                          padding: "10px 12px",
                          border: sel ? (ok ? "1px solid #198038" : "1px solid #da1e28") : "1px solid #e0e0e0",
                          background: sel ? (ok ? "#defbe6" : "#fff1f1") : "#fafafa",
                        }}
                      >
                        <label
                          htmlFor={`b22-track-${part.code}`}
                          style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
                        >
                          {part.label}
                        </label>
                        <select
                          id={`b22-track-${part.code}`}
                          value={sel}
                          onChange={(e) => {
                            const val = e.target.value;
                            const nextRoles = { ...trackRoles, [part.code]: val };
                            patchNotebook((cur) => ({
                              ...cur,
                              preClassWork: {
                                ...cur.preClassWork,
                                b22TrackRoles: nextRoles,
                              },
                            }));
                            if (checkB22PreReady(notebook, nextRoles)) {
                              onMarkSectionComplete(section.id, true);
                            }
                          }}
                          style={{
                            width: "100%",
                            minHeight: "40px",
                            padding: "6px 8px",
                            border: "1px solid #8d8d8d",
                            background: "#ffffff",
                            fontSize: "13.5px",
                          }}
                        >
                          {B22_TRACK_ROLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Bước 5: Đối chiếu kết luận thực nghiệm Blackett (SGK tr. 96–97) & câu tự kiểm tra */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 5 · Đối chiếu kết quả phân tích của Blackett (SGK tr. 96–97) &amp; tự kiểm tra
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "10px 12px" }}>
                    <strong style={{ display: "block", marginBottom: "4px" }}>
                      Bài 21 · Tán xạ hạt α trên lá vàng
                    </strong>
                    <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                      Hạt α chỉ bị lực đẩy tĩnh điện làm <strong>đổi hướng bay</strong>; hạt nhân vàng{" "}
                      <Nuclide sym="Au" a={197} z={79} /> <strong>giữ nguyên là nguyên tố vàng</strong>.
                    </p>
                  </div>
                  <div style={{ border: "1px solid #a6c8ff", background: "#edf5ff", padding: "10px 12px" }}>
                    <strong style={{ display: "block", color: "#002d9c", marginBottom: "4px" }}>
                      Bài 22 · Kết luận của Blackett từ Hình 22.2
                    </strong>
                    <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                      Trong một số trường hợp, hạt <Nuclide sym="He" a={4} z={2} /> bắn phá{" "}
                      <Nuclide sym="N" a={14} z={7} /> đã tạo ra hai hạt nhân mới là{" "}
                      <Nuclide sym="O" a={17} z={8} /> (nhánh đậm ngắn) và <Nuclide sym="H" a={1} z={1} /> (nhánh mảnh dài):{" "}
                      <strong>
                        <Nuclide sym="He" a={4} z={2} /> + <Nuclide sym="N" a={14} z={7} /> →{" "}
                        <Nuclide sym="O" a={17} z={8} /> + <Nuclide sym="H" a={1} z={1} />
                      </strong>.
                    </p>
                  </div>
                </div>
                <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>
                    Đối chiếu sơ đồ Blackett với thí nghiệm lá vàng Rutherford ở Bài 21, nhận định nào đúng?
                  </legend>
                  {B22_PRE_SELF_CHECK_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-start",
                        padding: "10px 12px",
                        marginBottom: "8px",
                        border: b22SelfCheck === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                        background: b22SelfCheck === opt.id ? "#edf5ff" : "#fafafa",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      <input
                        type="radio"
                        name="b22-pre-selfcheck"
                        checked={b22SelfCheck === opt.id}
                        onChange={() => {
                          patchNotebook((cur) => ({
                            ...cur,
                            preClassWork: { ...cur.preClassWork, selfCheckChoice: opt.id },
                          }));
                          if (checkB22PreReady(notebook, undefined, opt.id)) {
                            onMarkSectionComplete(section.id, true);
                          }
                        }}
                        style={{ marginTop: "3px" }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </fieldset>
                {b22SelfOpt && (
                  <div
                    role="status"
                    style={{
                      marginTop: "8px",
                      padding: "10px 14px",
                      background: b22SelfOpt.id === "two_branches_transmute" ? "#defbe6" : "#fff1f1",
                      borderLeft:
                        b22SelfOpt.id === "two_branches_transmute"
                          ? "4px solid #198038"
                          : "4px solid #b42332",
                      fontSize: "13.5px",
                      lineHeight: 1.55,
                    }}
                  >
                    {b22SelfOpt.feedback}
                  </div>
                )}
              </section>

              {/* Bước 6: Thẻ Sản phẩm mang vào lớp */}
              <section style={{ border: "2px solid #0f62fe", background: "#edf5ff", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "#002d9c" }}>
                    Sản phẩm mang vào lớp · Bài 22
                  </h4>
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      background: b22Ready ? "#defbe6" : "#fcf4d6",
                      color: b22Ready ? "#198038" : "#8e6a00",
                    }}
                  >
                    {b22Ready
                      ? "✓ Đã hoàn thành Pha 1 Bài 22"
                      : "Cần đủ: Dự đoán + lí do, 4/4 chi tiết chữ Y và câu tự kiểm tra"}
                  </span>
                </div>
                <ul style={{ margin: "0 0 12px", paddingLeft: "18px", fontSize: "14px", lineHeight: 1.6 }}>
                  <li>
                    <strong>Dự đoán ban đầu:</strong> {lockedB22Label ? `“${lockedB22Label}”` : "Chưa lưu"}
                  </li>
                  <li>
                    <strong>Nhận diện vết chữ Y Blackett:</strong> {matchedTrackCount}/4 chi tiết đúng.
                  </li>
                  <li>
                    <strong>Đối chiếu B21 – B22:</strong>{" "}
                    {b22SelfCheck === "two_branches_transmute" ? "Đã nắm vững sự biến đổi nguyên tố" : "Chưa hoàn tất"}
                  </li>
                </ul>
                <label htmlFor="b22-bring-q" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                  Câu hỏi muốn trao đổi thêm trên lớp:
                </label>
                <input
                  id="b22-bring-q"
                  type="text"
                  value={bringToClassQuestion}
                  onChange={(e) => {
                    const val = e.target.value;
                    patchNotebook((cur) => ({
                      ...cur,
                      preClassWork: { ...cur.preClassWork, bringToClassQuestion: val },
                    }));
                  }}
                  placeholder="Ví dụ: Khối lượng tổng cộng của ¹⁷₈O và ¹₁H lớn hơn hay nhỏ hơn ⁴₂He + ¹⁴₇N?"
                  style={{
                    width: "100%",
                    minHeight: "40px",
                    padding: "8px 10px",
                    border: "1px solid #8d8d8d",
                    background: "#ffffff",
                    fontSize: "14px",
                    marginBottom: "10px",
                  }}
                />
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                  onClick={() => onJumpToSection("b22-conservation")}
                >
                  Chuyển sang Pha 2: Bảo toàn A và Z →
                </button>
              </section>
            </div>
          );
        })()}

      {section.kind === "b22_conservation" &&
        (() => {
          const lockedB22Label = B22_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          const trackRoles = notebook.preClassWork?.b22TrackRoles ?? {};
          const matchedTrackCount = B22_TRACK_PARTS.filter(
            (p) => trackRoles[p.code] === p.correctRole
          ).length;

          return (
            <div>
              <Phase2ProductEchoCard
                preSectionId="b22-blackett-track"
                lockedChoiceLabel={lockedB22Label}
                lockedReason={lockedInitialReason}
                actionSummary={`Đã ghép đúng ${matchedTrackCount}/4 chi tiết vết phân nhánh Blackett (⁴₂He + ¹⁴₇N → ¹⁷₈O + ¹₁H)`}
                bringQuestion={bringToClassQuestion}
                onJumpToSection={onJumpToSection}
              />

              <div className={styles.tableScroll}>
                <table className={styles.cdsTable}>
                  <caption>
                    Phân loại hai nhóm phản ứng hạt nhân và các định luật bảo toàn (SGK tr. 97)
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Loại phản ứng hạt nhân</th>
                      <th scope="col">Bản chất vật lí (SGK tr. 97)</th>
                      <th scope="col">Ví dụ điển hình</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">1. Phản ứng hạt nhân kích thích</th>
                      <td>Quá trình các hạt nhân tương tác với các hạt khác (hạt nhân, neutron,…) tạo ra các hạt nhân mới (như phân hạch, tổng hợp hạt nhân).</td>
                      <td>
                        <Nuclide sym="He" a={4} z={2} /> + <Nuclide sym="N" a={14} z={7} /> →{" "}
                        <Nuclide sym="O" a={17} z={8} /> + <Nuclide sym="H" a={1} z={1} /> (Blackett)
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">2. Phản ứng hạt nhân tự phát</th>
                      <td>Quá trình tự phân rã của một hạt nhân không bền vững thành các hạt nhân mới (như phân rã phóng xạ của Uranium được Henri Becquerel công bố).</td>
                      <td>
                        <Nuclide sym="U" a={238} z={92} /> → <Nuclide sym="Th" a={234} z={90} /> +{" "}
                        <Nuclide sym="He" a={4} z={2} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  background: "#f8fafc",
                  border: "1px solid #d0d7de",
                  marginBottom: "12px",
                  fontSize: "13.5px",
                  lineHeight: 1.6,
                }}
              >
                <strong>Định luật bảo toàn trong phản ứng hạt nhân{" "}
                <code>ᴬ¹_Z₁X₁ + ᴬ²_Z₂X₂ → ᴬ³_Z₃X₃ + ᴬ⁴_Z₄X₄</code> (SGK tr. 97):</strong>
                <ul style={{ margin: "6px 0 0", paddingLeft: "18px" }}>
                  <li>
                    <strong>Bảo toàn số nucleon (số khối A):</strong> <code>A₁ + A₂ = A₃ + A₄</code> (ví dụ Hình 22.2: <code>4 + 14 = 17 + 1 = 18</code>).
                  </li>
                  <li>
                    <strong>Bảo toàn điện tích:</strong> <code>Z₁ + Z₂ = Z₃ + Z₄</code> (ví dụ Hình 22.2: <code>2 + 7 = 8 + 1 = 9</code>).
                  </li>
                  <li>
                    Hệ kín các hạt tương tác còn tuân theo bảo toàn năng lượng toàn phần và động lượng; <em>không</em> có định luật bảo toàn khối lượng nghỉ.
                  </li>
                </ul>
              </div>

              {/* Câu hỏi ? & Hoạt động SGK tr. 97 (không lộ đáp án trước khi học sinh tự làm) */}
              <details
                style={{
                  marginBottom: "16px",
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "12px 14px",
                  fontSize: "13.5px",
                }}
              >
                <summary style={{ cursor: "pointer", fontWeight: 700, color: "#002d9c" }}>
                  Câu hỏi ? &amp; Bài tập hoạt động (SGK tr. 97): Phân biệt với phản ứng hóa học &amp; tìm hạt nhân X, Y khi bắn ²³⁵₉₂U bằng neutron
                </summary>
                <div style={{ marginTop: "10px", lineHeight: 1.6 }}>
                  <p style={{ margin: "0 0 8px" }}>
                    <strong>1. Khác nhau giữa phản ứng hạt nhân và phản ứng hóa học:</strong> Phản ứng hạt nhân làm biến đổi chính hạt nhân (thường tạo ra nguyên tố mới, tỏa/thu năng lượng cỡ hàng triệu eV trên mỗi hạt nhân và không phụ thuộc nhiệt độ, áp suất thông thường), trong khi phản ứng hóa học chỉ sắp xếp lại liên kết electron ở lớp vỏ và giữ nguyên các hạt nhân nguyên tố.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>2. Bắn phá <Nuclide sym="U" a={235} z={92} /> bằng <Nuclide sym="n" a={1} z={0} /> hợp nhất thành X, rồi X phân rã thành <Nuclide sym="Mo" a={99} z={42} />, 3 neutron và Y:</strong>
                    <br />
                    a) Phương trình: <Nuclide sym="n" a={1} z={0} /> + <Nuclide sym="U" a={235} z={92} /> →{" "}
                    <Nuclide sym="U" a={236} z={92} />* và <Nuclide sym="U" a={236} z={92} />* →{" "}
                    <Nuclide sym="Mo" a={99} z={42} /> + <Nuclide sym="Sn" a={134} z={50} /> + 3·<Nuclide sym="n" a={1} z={0} />.
                    <br />
                    b) Áp dụng bảo toàn <code>A</code> và <code>Z</code>: <strong>X</strong> là đồng vị Uranium{" "}
                    <Nuclide sym="U" a={236} z={92} />; <strong>Y</strong> có <code>Z = 92 − 42 = 50</code>,{" "}
                    <code>A = 236 − 99 − 3 = 134</code>, tra bảng tuần hoàn ô <code>Z = 50</code> là <strong>Thiếc (Tin)</strong>{" "}
                    <Nuclide sym="Sn" a={134} z={50} />.
                  </p>
                </div>
              </details>

              <FixedPhysicsActivityRenderer
                activityKey="nuclear_reaction_balancer"
                onProgress={(done) => onMarkSectionComplete(section.id, done)}
              />
            </div>
          );
        })()}

      {section.kind === "b22_binding_energy" && (
        <div>
          {/* 1. Lực hạt nhân & Hình 22.3 + Hình 22.5 (SGK tr. 98 & tr. 100) */}
          <div style={{ border: "1px solid #d0d7de", background: "#ffffff", padding: "14px 16px", marginBottom: "14px" }}>
            <h4 style={{ margin: "0 0 6px", fontSize: "15.5px" }}>
              1. Lực hạt nhân &amp; Đồ thị năng lượng liên kết riêng Hình 22.3 (SGK tr. 98) – Hình 22.5 (SGK tr. 100)
            </h4>
            <p style={{ margin: "0 0 10px", fontSize: "13.5px", lineHeight: 1.6 }}>
              <strong>Lực hạt nhân</strong> là lực hút rất mạnh liên kết các nucleon trong hạt nhân, không phụ thuộc điện tích (không phải lực tĩnh điện) và chỉ phát huy tác dụng trong phạm vi bán kính rất ngắn cỡ kích thước hạt nhân (<code>≤ 10⁻¹⁵ m</code>). Năng lượng tối thiểu dùng để tách toàn bộ số nucleon ra khỏi hạt nhân bằng <strong>năng lượng liên kết</strong> <code>Eₗₖ</code>; mức độ bền vững của hạt nhân phụ thuộc vào <strong>năng lượng liên kết riêng</strong> <code>Eₗₖᵣ = Eₗₖ / A</code> (công thức 22.1).
            </p>
            <svg
              viewBox="0 0 660 225"
              width="660"
              height="225"
              role="img"
              aria-label="Đối chiếu Hình 22.3 SGK trang 98 và Hình 22.5 SGK trang 100: đồ thị năng lượng liên kết riêng E_lkr (MeV) theo số khối A với các mốc M, N, T, Q, P; đỉnh bền vững nhất tại Fe-56 và Y-89 khoảng 8,8 MeV"
              style={{ width: "100%", height: "auto", display: "block", border: "1px solid #e5e7eb", background: "#fcfcfd" }}
            >
              <line x1="64" y1="186" x2="628" y2="186" stroke="#525252" strokeWidth="1.5" />
              <line x1="64" y1="186" x2="64" y2="22" stroke="#525252" strokeWidth="1.5" />
              {/* Vạch chia trục E_lkr (0..10 MeV) */}
              {[0, 2, 4, 6, 8, 10].map((v) => {
                const y = 186 - v * 15.5;
                return (
                  <g key={v}>
                    <line x1="60" y1={y} x2="620" y2={y} stroke="#eef2f6" strokeWidth="1" />
                    <text x="52" y={y + 4} textAnchor="end" fontSize="11" fill="#525252">{v}</text>
                  </g>
                );
              })}
              {/* Vạch chia trục số khối A (0..240) */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240].map((a) => {
                const x = 64 + a * 2.2;
                return (
                  <g key={a}>
                    <line x1={x} y1="186" x2={x} y2="191" stroke="#525252" strokeWidth="1.2" />
                    <text x={x} y="204" textAnchor="middle" fontSize="11" fill="#525252">{a}</text>
                  </g>
                );
              })}
              {/* Vùng hạt nhân trung bình bền nhất */}
              <rect x={64 + 50 * 2.2} y="26" width={45 * 2.2} height="160" fill="#defbe6" opacity="0.5" />
              {/* Đường cong đơn giản hóa Hình 22.5 (M - N - T - Q - P) kết hợp điểm đặc trưng Hình 22.3 */}
              <path
                d="M 68 170 L 73 76 L 84 94 L 91 64 L 130 50 Q 192 46 264 51 Q 405 60 590 68"
                fill="none"
                stroke="#0f62fe"
                strokeWidth="2.8"
              />
              {/* Các mốc M, N, T, Q, P của Hình 22.5 SGK tr. 100 */}
              <circle cx="68" cy="170" r="4" fill="#da1e28" />
              <text x="75" y="174" fontSize="11.5" fontWeight="700" fill="#b42332">M (²H ≈ 1,1 MeV)</text>

              <circle cx="91" cy="64" r="3.8" fill="#0f62fe" />
              <text x="72" y="56" fontSize="11" fontWeight="700" fill="#0043ce">⁴He · N</text>

              <circle cx="187" cy="49" r="5" fill="#198038" />
              <circle cx="260" cy="51" r="4.5" fill="#198038" />
              <text x="174" y="39" fontSize="11.5" fontWeight="700" fill="#198038">
                T · Đỉnh bền nhất: ⁵⁶Fe, ⁸⁹Y (≈ 8,8 MeV)
              </text>

              <circle cx="380" cy="58" r="4" fill="#002d9c" />
              <text x="374" y="49" fontSize="11.5" fontWeight="700" fill="#002d9c">Q</text>

              <circle cx="588" cy="68" r="4.2" fill="#161616" />
              <text x="510" y="84" fontSize="11.5" fontWeight="700" fill="#161616">P · ²³⁸U (≈ 7,6 MeV)</text>

              {/* Hai mũi tên chuyển dịch Tổng hợp (MN→NT) & Phân hạch (PQ→QT) đúng Hình 22.5 */}
              <text x="98" y="128" fill="#8e6a00" fontSize="11.5" fontWeight="700">Tổng hợp hạt nhân (MN → NT) ↗</text>
              <text x="405" y="106" fill="#002d9c" fontSize="11.5" fontWeight="700">↖ Phân hạch hạt nhân (PQ → QT)</text>

              <text x="612" y="218" fill="#161616" fontSize="12" fontWeight="700">Số khối A</text>
              <text x="12" y="16" fill="#161616" fontSize="12" fontWeight="700">Eₗₖᵣ (MeV/nucleon)</text>
            </svg>
          </div>

          {/* 2. Hình 22.4 SGK tr. 99 (Cân hai đĩa độ hụt khối Δm) & Hệ thức Einstein E = mc², Eₗₖ = Δm·c² */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "14px",
              alignItems: "center",
              padding: "14px 16px",
              background: "#f8fafc",
              border: "1px solid #d0d7de",
              marginBottom: "14px",
            }}
          >
            <div>
              <h4 style={{ margin: "0 0 6px", fontSize: "15.5px" }}>
                2. Độ hụt khối Δm (Hình 22.4 · SGK tr. 99) &amp; Hệ thức Einstein
              </h4>
              <p style={{ margin: "0 0 8px", fontSize: "13.5px", lineHeight: 1.6 }}>
                So sánh khối lượng hạt nhân <Nuclide sym="He" a={4} z={2} /> (<code>m_He ≈ 4,00015 amu</code>) với tổng khối lượng 4 nucleon riêng rẽ (<code>2m_p + 2m_n ≈ 2·1,00728 + 2·1,00866 = 4,03188 amu</code>), khối lượng hạt nhân luôn <strong>nhỏ hơn</strong> tổng khối lượng các nucleon tạo thành nó:
              </p>
              <LatexMath
                block
                math={String.raw`\Delta m = \left[Z m_p + (A - Z) m_n\right] - m_X \;\;(22.2), \qquad E_{\mathrm{lk}} = \Delta m \cdot c^2 \;\;(22.4)`}
              />
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#525252", lineHeight: 1.5 }}>
                Hệ thức Einstein (22.3): <code>E = m·c²</code> (vật ở trạng thái nghỉ khối lượng <code>m₀</code> có năng lượng nghỉ <code>E₀ = m₀·c²</code>; đổi đơn vị tiện tính: <code>1 amu·c² ≈ 931,5 MeV</code>).
              </p>
            </div>

            {/* Sơ đồ vector chuẩn Hình 22.4 SGK tr. 99: Cân hai đĩa He nhẹ hơn 2p + 2n */}
            <figure
              style={{
                margin: 0,
                background: "#ffffff",
                border: "1px solid #d0d7de",
                padding: "10px 12px",
                textAlign: "center",
              }}
            >
              <svg
                viewBox="0 0 280 155"
                role="img"
                aria-label="Hình 22.4 SGK trang 99: Cân hai đĩa minh họa hạt nhân He-4 nhẹ hơn tổng 2 proton cộng 2 neutron rời nhau"
                style={{ width: "100%", maxWidth: "270px", height: "auto" }}
              >
                {/* Trụ cân */}
                <rect x="114" y="136" width="52" height="8" rx="3" fill="#8e6a00" />
                <line x1="140" y1="30" x2="140" y2="136" stroke="#8e6a00" strokeWidth="4" />
                {/* Đòn cân nghiêng về phía 2p + 2n (nặng hơn) */}
                <line x1="56" y1="38" x2="224" y2="56" stroke="#b28600" strokeWidth="3.2" />
                <circle cx="140" cy="47" r="4.5" fill="#161616" />

                {/* Đĩa trái cao hơn: Hạt nhân He đã liên kết */}
                <line x1="56" y1="38" x2="40" y2="88" stroke="#525252" strokeWidth="1.1" />
                <line x1="56" y1="38" x2="72" y2="88" stroke="#525252" strokeWidth="1.1" />
                <path d="M 34 88 Q 56 96 78 88 Z" fill="#d0d7de" stroke="#525252" />
                <circle cx="52" cy="82" r="5" fill="#da1e28" />
                <circle cx="60" cy="82" r="5" fill="#0043ce" />
                <circle cx="56" cy="75" r="5" fill="#da1e28" />
                <circle cx="56" cy="85" r="4.5" fill="#0043ce" />
                <text x="56" y="108" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#002d9c">
                  ⁴₂He (4,00015 amu)
                </text>

                {/* Đĩa phải thấp hơn: 2p + 2n rời nhau */}
                <line x1="224" y1="56" x2="202" y2="108" stroke="#525252" strokeWidth="1.1" />
                <line x1="224" y1="56" x2="246" y2="108" stroke="#525252" strokeWidth="1.1" />
                <path d="M 196 108 Q 224 116 252 108 Z" fill="#d0d7de" stroke="#525252" />
                <circle cx="206" cy="103" r="4.8" fill="#da1e28" />
                <circle cx="218" cy="103" r="4.8" fill="#da1e28" />
                <circle cx="230" cy="103" r="4.8" fill="#0043ce" />
                <circle cx="242" cy="103" r="4.8" fill="#0043ce" />
                <text x="224" y="127" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#b42332">
                  2p + 2n (4,03188 amu)
                </text>
              </svg>
              <figcaption style={{ fontSize: "12px", color: "#525252", marginTop: "4px" }}>
                <strong>Hình 22.4 (SGK tr. 99).</strong> Các nucleon đã liên kết thành hạt nhân nhẹ hơn khi đứng riêng rẽ
              </figcaption>
            </figure>
          </div>

          {/* Câu hỏi ? & Hoạt động SGK tr. 98–100 (tự tính trước khi mở đối chiếu) */}
          <details
            style={{
              marginBottom: "16px",
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "12px 14px",
              fontSize: "13.5px",
            }}
          >
            <summary style={{ cursor: "pointer", fontWeight: 700, color: "#002d9c" }}>
              Câu hỏi ? &amp; Bài tập hoạt động (SGK tr. 98–100): Đọc Hình 22.3, tính Δm của ¹⁶₈O và Eₗₖ, Eₗₖᵣ của ⁴₂He
            </summary>
            <ul style={{ margin: "10px 0 0", paddingLeft: "18px", lineHeight: 1.65 }}>
              <li>
                <strong>Đọc đồ thị Hình 22.3 (SGK tr. 98):</strong> Hai hạt nhân bền vững nhất trên đồ thị là{" "}
                <code>⁵⁶Fe</code> và <code>⁸⁹Y</code> với <code>Eₗₖᵣ ≈ 8,8 MeV/nucleon</code>. Năm hạt nhân nhẹ (<code>A ≤ 30</code>) có <code>Eₗₖᵣ &lt; 8,2 MeV</code> gồm <code>²H, ⁶Li, ⁹Be, ¹¹B, ⁴He</code> (hoặc <code>¹²C, ¹⁴N, ¹⁹F, ²⁰Ne</code>); bốn hạt nhân nặng (<code>A ≥ 160</code>) có <code>Eₗₖᵣ &lt; 8,2 MeV</code> là <code>¹⁶⁰Dy, ¹⁸⁰Hf, ¹⁹⁷Au, ²⁰⁹Bi</code> (hoặc <code>²³⁸U</code>).
              </li>
              <li>
                <strong>Tính độ hụt khối của <Nuclide sym="O" a={16} z={8} /> biết <code>m_O ≈ 15,99492 amu</code> (SGK tr. 99):</strong>{" "}
                <code>Δm = 8·1,00728 + 8·1,00866 − 15,99492 = 16,12752 − 15,99492 = 0,13260 amu</code>.
              </li>
              <li>
                <strong>Hệ số chuyển đổi <code>amu</code> sang <code>MeV/c²</code> &amp; tính cho <Nuclide sym="He" a={4} z={2} /> (SGK tr. 100):</strong>{" "}
                <code>1 amu ≈ 1,66054·10⁻²⁷ kg ⇒ 1 amu·c² ≈ 931,5 MeV</code> (nên <code>1 amu ≈ 931,5 MeV/c²</code>). Với <code>Δm_He = 4,03188 − 4,00015 = 0,03173 amu</code> (theo tr. 99), ta có{" "}
                <code>Eₗₖ ≈ 0,03173 × 931,5 ≈ 29,56 MeV</code> và <code>Eₗₖᵣ = Eₗₖ / 4 ≈ 7,39 MeV/nucleon</code> (nếu dùng khối lượng hạt nhân trừ vỏ electron <code>m_α ≈ 4,0015 amu</code> thì <code>Eₗₖ ≈ 28,3 MeV</code>, <code>Eₗₖᵣ ≈ 7,07 MeV/nucleon</code>).
              </li>
            </ul>
          </details>

          <FixedPhysicsActivityRenderer
            activityKey="binding_energy_lab"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {section.kind === "b22_fission" && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
              <strong style={{ display: "block", marginBottom: "4px" }}>
                1. Tiến trình phân hạch của <Nuclide sym="U" a={235} z={92} /> (Otto Hahn, 1939 · Hình 22.6 SGK tr. 100–101)
              </strong>
              <p style={{ margin: "0 0 6px", fontSize: "13.5px", lineHeight: 1.55 }}>
                Dùng <strong>neutron nhiệt</strong> (động năng <code>&lt; 0,1 eV</code>) bắn vào{" "}
                <Nuclide sym="U" a={235} z={92} /> tạo trạng thái kích thích không bền{" "}
                <Nuclide sym="U" a={236} z={92} />*; sau khoảng <code>10⁻¹⁴ s</code> hạt nhân biến dạng vỡ thành hai mảnh khối lượng trung bình và giải phóng <code>k = 1, 2, 3</code> neutron (tỏa khoảng <code>200 MeV</code> mỗi phân hạch):
              </p>
              <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#002d9c" }}>
                <Nuclide sym="n" a={1} z={0} /> + <Nuclide sym="U" a={235} z={92} /> →{" "}
                <Nuclide sym="U" a={236} z={92} />* → <Nuclide sym="Y" a={95} z={39} /> +{" "}
                <Nuclide sym="I" a={138} z={53} /> + 3·<Nuclide sym="n" a={1} z={0} />
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "12.5px", color: "#525252" }}>
                Ngoài <Nuclide sym="U" a={235} z={92} />, các đồng vị <Nuclide sym="Np" a={237} z={93} />,{" "}
                <Nuclide sym="Pu" a={239} z={94} />, <Nuclide sym="Cf" a={251} z={98} /> cũng có tính phân hạch tương tự.
              </p>
            </div>

            <div style={{ border: "1px solid #b5c7e3", background: "#f4f8ff", padding: "12px 14px" }}>
              <strong style={{ display: "block", color: "#002d9c", marginBottom: "4px" }}>
                [Ô đọc thêm “Em có biết” — SGK tr. 102] Hình 22.7 · Hệ số nhân neutron k &amp; khối lượng tới hạn m_th
              </strong>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13.5px", lineHeight: 1.55 }}>
                <li>
                  Gọi <code>k</code> là số neutron trung bình sau mỗi phân hạch tiếp tục kích thích được các hạt nhân{" "}
                  <Nuclide sym="U" a={235} z={92} /> khác: <code>k &lt; 1</code> phản ứng dây chuyền tắt dần;{" "}
                  <code>k ≥ 1</code> phản ứng dây chuyền tự duy trì (<code>k = 1</code> ổn định trong lò phản ứng; <code>k &gt; 1</code> bùng nổ như Hình 22.7).
                </li>
                <li>
                  Để giảm neutron thoát ra ngoài, khối lượng chất phân hạch phải vượt <strong>khối lượng tới hạn <code>m_th</code></strong> (với mẫu làm giàu ~90% không nén/phản xạ neutron: <code>m_th(²³⁵U) ≈ 47 kg</code>, <code>m_th(²³⁹Pu) ≈ 10 kg</code>).
                </li>
              </ul>
            </div>
          </div>

          <details
            style={{
              marginBottom: "14px",
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "10px 14px",
              fontSize: "13.5px",
            }}
          >
            <summary style={{ cursor: "pointer", fontWeight: 700, color: "#002d9c" }}>
              Câu hỏi ? mục 2 (SGK tr. 101): Tính năng lượng tỏa ra khi phân hạch hoàn toàn 1 kg ²³⁵₉₂U (mỗi phân hạch tỏa 200 MeV)
            </summary>
            <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
              Số hạt nhân trong <code>1 kg = 1000 g</code> <Nuclide sym="U" a={235} z={92} /> là{" "}
              <code>N = (1000 / 235) × 6,022·10²³ ≈ 2,56·10²⁴</code> hạt nhân. Năng lượng toàn phần tỏa ra:{" "}
              <code>E = N × 200 MeV ≈ 5,13·10²⁶ MeV ≈ 8,2·10¹³ J</code> (tương đương đốt hàng nghìn tấn than đá!).
            </p>
          </details>

          <FixedPhysicsActivityRenderer
            activityKey="nuclear_fission"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {section.kind === "b22_fusion" && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <div style={{ border: "1px solid #a6c8ff", background: "#edf5ff", padding: "12px 14px" }}>
              <strong style={{ display: "block", color: "#002d9c", marginBottom: "4px" }}>
                IV. Phản ứng tổng hợp hạt nhân (phản ứng nhiệt hạch · SGK tr. 102)
              </strong>
              <p style={{ margin: "0 0 6px", fontSize: "13.5px", lineHeight: 1.55 }}>
                Là phản ứng trong đó hai hay nhiều hạt nhân nhẹ (đoạn <code>MN</code> trên Hình 22.5) tổng hợp lại thành một hạt nhân nặng hơn có <code>Eₗₖᵣ</code> lớn hơn (đoạn <code>NT</code>). Trong thí nghiệm máy gia tốc của Oliphant với dòng hạt deuterium (SGK tr. 102):
              </p>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#002d9c", marginBottom: "6px" }}>
                <Nuclide sym="H" a={2} z={1} /> + <Nuclide sym="H" a={2} z={1} /> →{" "}
                <Nuclide sym="He" a={3} z={2} /> + <Nuclide sym="n" a={1} z={0} /> (tỏa khoảng 4 MeV)
              </div>
              <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.55 }}>
                Để thắng lực đẩy tĩnh điện Coulomb giữa các hạt nhân mang điện dương và tiến lại gần nhau đến phạm vi lực hạt nhân, thực tế cần nung nóng tới nhiệt độ cực cao <code>10⁷ – 10⁸ K</code> nên gọi là <strong>phản ứng nhiệt hạch</strong>.
              </p>
            </div>
            <div style={{ border: "1px solid #b5c7e3", background: "#f4f8ff", padding: "12px 14px" }}>
              <strong style={{ display: "block", color: "#002d9c", marginBottom: "4px" }}>
                [Ô đọc thêm “Em có biết” — SGK tr. 103] Điều kiện J. D. Lawson cho phản ứng tổng hợp hạt nhân
              </strong>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13.5px", lineHeight: 1.55 }}>
                <li>Nhiệt độ cực cao vào khoảng <code>10⁷</code> đến <code>10⁸ K</code>.</li>
                <li>Mật độ hạt nhân <code>n</code> phải đủ lớn.</li>
                <li>
                  Thời gian <code>Δt</code> duy trì nhiệt độ cao phải đủ dài sao cho thỏa mãn điều kiện Lawson:{" "}
                  <strong><code>n · Δt &gt; 10¹⁴ s/cm³</code></strong>.
                </li>
              </ul>
            </div>
          </div>

          <details
            style={{
              marginBottom: "14px",
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "10px 14px",
              fontSize: "13.5px",
            }}
          >
            <summary style={{ cursor: "pointer", fontWeight: 700, color: "#002d9c" }}>
              Câu hỏi ? mục IV (SGK tr. 103): So sánh định tính phản ứng tổng hợp hạt nhân và phản ứng phân hạch về nhiên liệu &amp; điều kiện xảy ra
            </summary>
            <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
              <strong>Về nhiên liệu:</strong> Phân hạch dùng các hạt nhân rất nặng, hiếm và sinh chất thải phóng xạ mạnh (<Nuclide sym="U" a={235} z={92} />, <Nuclide sym="Pu" a={239} z={94} />); tổng hợp hạt nhân dùng các hạt nhân rất nhẹ, dồi dào trong nước biển (<Nuclide sym="H" a={2} z={1} />, <Nuclide sym="H" a={3} z={1} />).{" "}
              <strong>Về điều kiện xảy ra:</strong> Phân hạch chỉ cần neutron nhiệt ở nhiệt độ thông thường và khối lượng đạt mức tới hạn <code>m_th</code>; tổng hợp hạt nhân đòi hỏi nhiệt độ cực cao (<code>10⁷ – 10⁸ K</code>) để thắng rào thế đẩy tĩnh điện Coulomb kèm điều kiện mật độ và thời gian duy trì đủ lớn.
            </p>
          </details>

          <FixedPhysicsActivityRenderer
            activityKey="nuclear_fusion"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {section.kind === "b22_after_transfer" &&
        (() => {
          const b22AfterChoice = notebook.afterClassWork?.b22AfterChoice ?? "";
          const b22NeutronCount = notebook.afterClassWork?.b22NeutronCount ?? "";
          const b22ReasonNote = notebook.afterClassWork?.b22ReasonNote ?? "";
          const b22Checked = Boolean(notebook.afterClassWork?.b22Checked) || b22AfterCheckedLocal;
          const kOk = Number(b22NeutronCount.trim()) === 2;
          const choiceOk = b22AfterChoice === "correct";
          const noteOk = b22ReasonNote.trim().length >= 8;
          const allB22AfterOk = kOk && choiceOk && noteOk;

          return (
            <div style={{ border: "1px solid #d0d7de", padding: "16px", background: "#ffffff" }}>
              <h4 style={{ margin: "0 0 10px", fontSize: "16px" }}>
                Kiểm tra, đánh giá Pha 3: Bảo toàn số nucleon A và lập luận từ đồ thị Eₗₖᵣ = Eₗₖ / A
              </h4>

              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}>
                1. Cho phản ứng phân hạch:{" "}
                <Nuclide sym="n" a={1} z={0} /> + <Nuclide sym="U" a={235} z={92} /> →{" "}
                <Nuclide sym="Mo" a={95} z={42} /> + <Nuclide sym="La" a={139} z={57} /> +{" "}
                <code>k</code>·<Nuclide sym="n" a={1} z={0} /> + 7·<Nuclide sym="e" a={0} z={-1} />. Giá trị số neutron thứ cấp <code>k</code> bằng bao nhiêu?
                <input
                  type="number"
                  inputMode="numeric"
                  value={b22NeutronCount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setB22AfterCheckedLocal(false);
                    patchNotebook((cur) => ({
                      ...cur,
                      afterClassWork: { ...cur.afterClassWork, b22NeutronCount: val, b22Checked: false },
                    }));
                  }}
                  placeholder="Tính từ 1 + 235 = 95 + 139 + k…"
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: "280px",
                    marginTop: "6px",
                    minHeight: "40px",
                    padding: "6px 10px",
                    border: "1px solid #8d8d8d",
                    fontSize: "14.5px",
                  }}
                />
              </label>

              <fieldset style={{ border: "none", padding: 0, margin: "0 0 12px" }}>
                <legend style={{ margin: "0 0 8px", fontWeight: 700, fontSize: "14px" }}>
                  2. Dựa vào đồ thị năng lượng liên kết riêng <code>Eₗₖᵣ = Eₗₖ / A</code> (Hình 22.3), vì sao cả phân hạch{" "}
                  <Nuclide sym="U" a={235} z={92} /> lẫn tổng hợp <Nuclide sym="H" a={2} z={1} /> +{" "}
                  <Nuclide sym="H" a={3} z={1} /> đều tỏa năng lượng lớn?
                </legend>
                {[
                  [
                    "correct",
                    "Vì các hạt nhân tạo thành sau phản ứng đều dịch chuyển về vùng số khối trung bình có năng lượng liên kết riêng Eₗₖᵣ lớn hơn các hạt nhân ban đầu (tổng độ hụt khối tăng, tổng khối lượng nghỉ giảm).",
                  ],
                  [
                    "wrong1",
                    "Vì tổng số nucleon A sau phản ứng bị hụt đi để biến thành năng lượng.",
                  ],
                  [
                    "wrong2",
                    "Vì các hạt nhân sản phẩm có năng lượng liên kết riêng Eₗₖᵣ nhỏ hơn hạt nhân ban đầu.",
                  ],
                ].map(([val, label]) => (
                  <label key={val} style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "14px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="b22-after"
                      checked={b22AfterChoice === val}
                      onChange={() => {
                        setB22AfterCheckedLocal(false);
                        patchNotebook((cur) => ({
                          ...cur,
                          afterClassWork: { ...cur.afterClassWork, b22AfterChoice: val, b22Checked: false },
                        }));
                      }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>

              <label
                htmlFor="b22-after-reason"
                style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
              >
                3. Viết ngắn gọn nhận xét của em đối chiếu với dự đoán ở Pha 1 (vì sao phản ứng hạt nhân tạo ra nguyên tố mới và tỏa năng lượng):
              </label>
              <textarea
                id="b22-after-reason"
                className={styles.evidenceTextarea}
                rows={2}
                value={b22ReasonNote}
                onChange={(e) => {
                  const val = e.target.value;
                  setB22AfterCheckedLocal(false);
                  patchNotebook((cur) => ({
                    ...cur,
                    afterClassWork: { ...cur.afterClassWork, b22ReasonNote: val, b22Checked: false },
                  }));
                }}
                placeholder="Ví dụ: Tổng A và Z bảo toàn nhưng các nucleon sắp xếp lại thành hạt nhân có Eₗₖᵣ cao hơn nên phần khối lượng nghỉ giảm đi tỏa ra thành năng lượng…"
              />

              <div style={{ marginTop: "10px" }}>
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                  onClick={() => {
                    setB22AfterCheckedLocal(true);
                    patchNotebook((cur) => ({
                      ...cur,
                      afterClassWork: { ...cur.afterClassWork, b22Checked: true },
                    }));
                    if (allB22AfterOk) onMarkSectionComplete(section.id, true);
                  }}
                >
                  Kiểm tra &amp; lưu đáp án Bài 22
                </button>
              </div>

              {b22Checked && (
                <p
                  role="status"
                  style={{
                    margin: "10px 0 0",
                    fontWeight: 600,
                    color: allB22AfterOk ? "#198038" : "#b42332",
                  }}
                >
                  {allB22AfterOk
                    ? "✓ Chính xác! k = 236 − (95 + 139) = 2 neutron; hạt nhân sản phẩm có Eₗₖᵣ cao hơn nên bền vững hơn và tỏa năng lượng."
                    : "Kiểm tra lại: bảo toàn số khối 1 + 235 = 95 + 139 + k ⇒ k = 2, chọn đúng chiều tăng Eₗₖᵣ và ghi ít nhất một câu nhận xét."}
                </p>
              )}
            </div>
          );
        })()}

      {/* ====================================================================
          BÀI 23 — HIỆN TƯỢNG PHÓNG XẠ (BẢNG 23.1 SGK TR. 105 & BIỂN HÌNH 23.8)
          ==================================================================== */}
      {section.kind === "b23_cloud_geiger" &&
        (() => {
          const lockedB23Label = B23_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          const c5to10 = notebook.preClassWork?.b23Count5to10 ?? "";
          const c15to20 = notebook.preClassWork?.b23Count15to20 ?? "";
          const b23SelfCheck = notebook.preClassWork?.selfCheckChoice ?? "";
          const b23SelfOpt = B23_PRE_SELF_CHECK_OPTIONS.find(
            (o) => o.id === b23SelfCheck
          );
          const checkB23PreReady = (
            nb: StudentLessonNotebook,
            ov5?: string,
            ov15?: string,
            selfOv?: string
          ) => {
            const hasP = Boolean(
              (nb.initialPredictionChoice ?? nb.preClassPredictionChoice ?? "").trim()
            );
            const hasR = Boolean(
              (nb.initialPredictionReason ?? nb.preClassPredictionReason ?? "").trim()
            );
            const v5 = (ov5 ?? nb.preClassWork?.b23Count5to10 ?? "").trim();
            const v15 = (ov15 ?? nb.preClassWork?.b23Count15to20 ?? "").trim();
            const countsOk = v5 === "3" && v15 === "0";
            const sc = selfOv ?? nb.preClassWork?.selfCheckChoice ?? "";
            return (
              hasP &&
              hasR &&
              countsOk &&
              sc === "random_not_predictable_single"
            );
          };
          const b23Ready = checkB23PreReady(notebook);

          return (
            <div>
              {/* Bước 1: Câu hỏi mở đầu gắn với Bảng 23.1 */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 1 · Câu hỏi mở đầu từ phép đếm xung phóng xạ (Bảng 23.1 · SGK tr. 105)
                </h4>
                <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.6 }}>
                  Đặt một mẫu phóng xạ cố định trước cửa sổ ống đếm Geiger–Müller và ghi lại số xung đếm được trong các khoảng thời gian bằng nhau (mỗi khoảng 5 giây) liên tiếp.
                </p>
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#edf5ff",
                    borderLeft: "4px solid #0f62fe",
                    fontSize: "14.5px",
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color: "#002d9c", display: "block", marginBottom: "4px" }}>
                    Câu hỏi mở đầu cần suy nghĩ:
                  </strong>
                  <em>
                    “Vì sao cùng một nguồn phóng xạ đứng yên mà khoảng 5–10 s máy đếm ghi 3 xung nhưng khoảng 15–20 s lại ghi 0 xung?”
                  </em>
                </div>
              </section>

              {/* Bước 2: Thí nghiệm đếm tia phóng xạ Hình 23.2 (SGK tr. 105) + Bảng 23.1 chuẩn SGK */}
              <section style={{ marginBottom: "18px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "16px" }}>
                  Bước 2 · Bố trí thí nghiệm đếm tia phóng xạ (Hình 23.2) và Bảng 23.1 số liệu thực nghiệm (SGK tr. 105)
                </h4>
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#fcf4d6",
                    border: "1px solid #f1c21b",
                    borderLeft: "4px solid #8e6a00",
                    marginBottom: "14px",
                    fontSize: "14px",
                    lineHeight: 1.55,
                  }}
                >
                  <strong>Chỉ dẫn quan sát trọng tâm:</strong>{" "}
                  <em>
                    “Theo dõi đường truyền tín hiệu từ nguồn (1) → đầu thu Geiger–Müller (2) → bộ chuyển đổi (3) → loa (4) &amp; màn hình đếm (5) trên Hình 23.2, rồi đối chiếu các cột thời gian 5 giây liên tiếp trên Bảng 23.1.”
                  </em>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "14px",
                    marginBottom: "14px",
                  }}
                >
                  {/* Sơ đồ chuẩn Hình 23.2 SGK tr. 105: Bộ thí nghiệm đếm tia phóng xạ 5 bộ phận */}
                  <figure className={styles.darkBenchStage} style={{ margin: 0 }}>
                    <svg
                      viewBox="0 0 430 210"
                      width="430"
                      height="210"
                      role="img"
                      aria-label="Hình 23.2 SGK trang 105: Thí nghiệm đếm tia phóng xạ gồm (1) nguồn phóng xạ, (2) đầu thu phóng xạ Geiger-Müller, (3) thiết bị chuyển đổi tín hiệu, (4) loa phát xung âm thanh và (5) màn hình hiển thị số đếm"
                      style={{ width: "100%", height: "auto", display: "block" }}
                    >
                      <rect x="0" y="0" width="430" height="210" fill="#0b1220" />
                      {/* Bệ đỡ nguồn (1) & đầu thu GM (2) */}
                      <rect x="16" y="76" width="170" height="72" rx="4" fill="#1e293b" stroke="#475569" />
                      {/* (1) Nguồn phóng xạ trên giá */}
                      <rect x="28" y="96" width="38" height="24" rx="3" fill="#b45309" stroke="#fde047" strokeWidth="1.5" />
                      <text x="47" y="112" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="700">Nguồn</text>
                      <line x1="47" y1="96" x2="47" y2="44" stroke="#7dd3fc" strokeWidth="1.4" />
                      <circle cx="47" cy="34" r="10" fill="#0f62fe" />
                      <text x="47" y="38" textAnchor="middle" fill="#ffffff" fontSize="11.5" fontWeight="700">1</text>

                      {/* Chùm tia hướng sang đầu thu (2) */}
                      <line x1="68" y1="108" x2="112" y2="108" stroke="#facc15" strokeWidth="2.2" strokeDasharray="4 3" />

                      {/* (2) Đầu thu phóng xạ Geiger–Müller */}
                      <rect x="114" y="94" width="64" height="28" rx="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                      <text x="146" y="112" textAnchor="middle" fill="#bae6fd" fontSize="10.5" fontWeight="700">GM</text>
                      <line x1="146" y1="94" x2="146" y2="44" stroke="#7dd3fc" strokeWidth="1.4" />
                      <circle cx="146" cy="34" r="10" fill="#0f62fe" />
                      <text x="146" y="38" textAnchor="middle" fill="#ffffff" fontSize="11.5" fontWeight="700">2</text>

                      {/* Dây cáp tín hiệu nối sang bộ chuyển đổi (3) */}
                      <path d="M 178 108 C 206 108, 206 54, 240 68" fill="none" stroke="#94a3b8" strokeWidth="2.5" />

                      {/* (3) Thiết bị chuyển đổi tín hiệu (vỏ đỏ như Hình 23.2) */}
                      <rect x="236" y="62" width="174" height="86" rx="6" fill="#7f1d1d" stroke="#fca5a5" strokeWidth="1.8" />
                      <line x1="254" y1="148" x2="236" y2="176" stroke="#7dd3fc" strokeWidth="1.4" />
                      <circle cx="230" cy="184" r="10" fill="#0f62fe" />
                      <text x="230" y="188" textAnchor="middle" fill="#ffffff" fontSize="11.5" fontWeight="700">3</text>

                      {/* (5) Màn hình hiển thị số đếm điện tử */}
                      <rect x="252" y="78" width="76" height="36" rx="3" fill="#090d16" stroke="#cbd5e1" strokeWidth="1.4" />
                      <text x="290" y="102" textAnchor="middle" fill="#fb7185" fontSize="17" fontFamily="monospace" fontWeight="700">
                        0010
                      </text>
                      <line x1="290" y1="114" x2="290" y2="174" stroke="#7dd3fc" strokeWidth="1.4" />
                      <circle cx="290" cy="184" r="10" fill="#0f62fe" />
                      <text x="290" y="188" textAnchor="middle" fill="#ffffff" fontSize="11.5" fontWeight="700">5</text>

                      {/* (4) Loa phát xung âm thanh */}
                      <rect x="344" y="76" width="52" height="46" rx="3" fill="#e2e8f0" stroke="#475569" strokeWidth="1.4" />
                      {[354, 362, 370, 378, 386].map((lx) => (
                        <line key={lx} x1={lx} y1="84" x2={lx} y2="114" stroke="#334155" strokeWidth="1.5" />
                      ))}
                      <line x1="370" y1="122" x2="384" y2="174" stroke="#7dd3fc" strokeWidth="1.4" />
                      <circle cx="388" cy="184" r="10" fill="#0f62fe" />
                      <text x="388" y="188" textAnchor="middle" fill="#ffffff" fontSize="11.5" fontWeight="700">4</text>
                    </svg>
                    <figcaption className={styles.darkBenchCaption}>
                      <strong>Hình 23.2 (SGK tr. 105) · Thí nghiệm đếm tia phóng xạ:</strong>{" "}
                      <strong>(1)</strong> Nguồn phóng xạ · <strong>(2)</strong> Đầu thu Geiger–Müller ·{" "}
                      <strong>(3)</strong> Bộ chuyển đổi tín hiệu · <strong>(4)</strong> Loa phát xung âm thanh ·{" "}
                      <strong>(5)</strong> Màn hình nhảy thêm 1 đơn vị mỗi khi có tia phóng xạ đi tới đầu thu.
                    </figcaption>
                  </figure>

                  {/* Bảng 23.1 chuẩn SGK tr. 105 (không tô màu lộ sẵn hai dòng câu hỏi Bước 4) */}
                  <div className={styles.tableScroll} style={{ margin: 0 }}>
                    <table className={styles.cdsTable}>
                      <caption>
                        Bảng 23.1. Kết quả ghi nhận số tia phóng xạ theo thời gian (SGK tr. 105 — tách biệt với mô phỏng)
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Khoảng thời gian (s)</th>
                          <th scope="col" className={styles.numCell}>Số tia phóng xạ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SGK_TABLE_23_1.map((row) => (
                          <tr key={row.windowSeconds}>
                            <td>{row.windowSeconds}</td>
                            <td className={styles.numCell}>{row.counts}</td>
                          </tr>
                        ))}
                        <tr style={{ background: "#f4f4f4", fontWeight: 700 }}>
                          <td>Tổng cộng trong 30 s (6 khoảng 5 s)</td>
                          <td className={styles.numCell}>10</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {b21VideoLesson && (
                  <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "13.5px", lineHeight: 1.55 }}>
                      <strong>Tư liệu video bổ trợ Pha 1 Bài 23:</strong> Phân biệt số tia phóng xạ ngẫu nhiên ghi nhận trong từng khoảng đo ngắn với đường cong kì vọng khi mẫu rất lớn.{" "}
                      <span style={{ color: "#002d9c", fontWeight: 600 }}>
                        Nếu chưa xem video, học sinh vẫn hoàn thành trọn vẹn Pha 1 từ sơ đồ Hình 23.2 và Bảng 23.1 ngay trên trang
                      </span>{" "}
                      (mở hoặc phát video không tự tính hoàn thành).
                    </p>
                    <NuclearLessonVideo lesson={b21VideoLesson} />
                  </div>
                )}
              </section>

              {/* Bước 3: Khóa dự đoán ban đầu + lí do */}
              <section
                style={{
                  border: "1px solid #8d8d8d",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 6px", fontSize: "16px" }}>
                  Bước 3 · Ghi và khóa dự đoán ban đầu kèm lí do
                </h4>
                {lockedB23Label && (
                  <div
                    style={{
                      marginBottom: "12px",
                      padding: "10px 12px",
                      background: "#fcf4d6",
                      borderLeft: "4px solid #8e6a00",
                      fontSize: "13.5px",
                    }}
                  >
                    <strong>Dự đoán ban đầu đã khóa:</strong> “{lockedB23Label}”
                    {lockedInitialReason ? <span> — <em>Lí do: {lockedInitialReason}</em></span> : null}
                  </div>
                )}
                <fieldset style={{ border: "none", margin: "0 0 12px", padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
                    Chọn dự đoán của em để giải thích sự chênh lệch số tia phóng xạ trên Bảng 23.1:
                  </legend>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {B23_PREDICTION_CHOICES.map((opt) => (
                      <label
                        key={opt.id}
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                          padding: "10px 12px",
                          border: predChoice === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                          background: predChoice === opt.id ? "#edf5ff" : "#fafafa",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        <input
                          type="radio"
                          name="b23-pre-prediction"
                          checked={predChoice === opt.id}
                          onChange={() => {
                            setPredChoiceDraft(opt.id);
                            setPredSavedMsg("");
                          }}
                          style={{ marginTop: "3px" }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label htmlFor="b23-pre-reason" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                  Lí do cho dự đoán của em (bắt buộc):
                </label>
                <textarea
                  id="b23-pre-reason"
                  className={styles.evidenceTextarea}
                  rows={2}
                  value={predReason}
                  onChange={(e) => {
                    setPredReasonDraft(e.target.value);
                    setPredSavedMsg("");
                  }}
                  placeholder="Giải thích vì sao sau khoảng 15–20 s ghi 0 tia thì khoảng 20–25 s lại ghi 3 tia…"
                />
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "10px" }}>
                  <button
                    type="button"
                    className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                    onClick={() => {
                      if (!predChoice || !predReason.trim()) {
                        setPredSavedMsg("Em hãy chọn dự đoán và ghi rõ lí do trước khi lưu.");
                        return;
                      }
                      onSavePreClassPrediction(predChoice, predReason.trim());
                      const updated = recordPreClassPrediction(notebook, predChoice, predReason.trim());
                      if (checkB23PreReady(updated)) onMarkSectionComplete(section.id, true);
                      setPredSavedMsg("Đã lưu và khóa dự đoán ban đầu cho Bài 23.");
                    }}
                  >
                    Lưu dự đoán trước giờ học
                  </button>
                  {predSavedMsg && (
                    <span
                      role="status"
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 600,
                        color: predChoice && predReason.trim() ? "#198038" : "#b42332",
                      }}
                    >
                      {predSavedMsg}
                    </span>
                  )}
                </div>
              </section>

              {/* Bước 4: Thao tác nhỏ đọc cặp số liệu trên Bảng 23.1 */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 4 · Thao tác đọc cặp số liệu trên Bảng 23.1 SGK tr. 105
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                  }}
                >
                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                    Số tia phóng xạ trong khoảng <code>5 – 10 s</code>:
                    <input
                      type="number"
                      inputMode="numeric"
                      value={c5to10}
                      onChange={(e) => {
                        const val = e.target.value;
                        patchNotebook((cur) => ({
                          ...cur,
                          preClassWork: { ...cur.preClassWork, b23Count5to10: val },
                        }));
                        if (checkB23PreReady(notebook, val, undefined)) {
                          onMarkSectionComplete(section.id, true);
                        }
                      }}
                      placeholder="Tra dòng 5 – 10 s…"
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: "6px",
                        minHeight: "40px",
                        padding: "6px 10px",
                        border: "1px solid #8d8d8d",
                        fontSize: "14.5px",
                      }}
                    />
                  </label>
                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                    Số tia phóng xạ trong khoảng <code>15 – 20 s</code>:
                    <input
                      type="number"
                      inputMode="numeric"
                      value={c15to20}
                      onChange={(e) => {
                        const val = e.target.value;
                        patchNotebook((cur) => ({
                          ...cur,
                          preClassWork: { ...cur.preClassWork, b23Count15to20: val },
                        }));
                        if (checkB23PreReady(notebook, undefined, val)) {
                          onMarkSectionComplete(section.id, true);
                        }
                      }}
                      placeholder="Tra dòng 15 – 20 s…"
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: "6px",
                        minHeight: "40px",
                        padding: "6px 10px",
                        border: "1px solid #8d8d8d",
                        fontSize: "14.5px",
                      }}
                    />
                  </label>
                </div>
                {(c5to10 !== "" || c15to20 !== "") && (
                  <small
                    style={{
                      display: "block",
                      marginTop: "8px",
                      fontWeight: 600,
                      color: c5to10.trim() === "3" && c15to20.trim() === "0" ? "#198038" : "#b42332",
                    }}
                  >
                    {c5to10.trim() === "3" && c15to20.trim() === "0"
                      ? "✓ Đã đọc chính xác hai dòng thực nghiệm Bảng 23.1 (5–10 s: 3 tia; 15–20 s: 0 tia)."
                      : "Hãy đối chiếu lại cột Số tia phóng xạ ở dòng 5 – 10 s và 15 – 20 s của Bảng 23.1."}
                  </small>
                )}
              </section>

              {/* Bước 5: Câu tự kiểm tra có phản hồi */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 5 · Câu tự kiểm tra trước giờ học
                </h4>
                <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>
                    Từ số liệu thực nghiệm Bảng 23.1 SGK tr. 105, ta rút ra kết luận nào về sự phân rã phóng xạ?
                  </legend>
                  {B23_PRE_SELF_CHECK_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-start",
                        padding: "10px 12px",
                        marginBottom: "8px",
                        border: b23SelfCheck === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                        background: b23SelfCheck === opt.id ? "#edf5ff" : "#fafafa",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      <input
                        type="radio"
                        name="b23-pre-selfcheck"
                        checked={b23SelfCheck === opt.id}
                        onChange={() => {
                          patchNotebook((cur) => ({
                            ...cur,
                            preClassWork: { ...cur.preClassWork, selfCheckChoice: opt.id },
                          }));
                          if (checkB23PreReady(notebook, undefined, undefined, opt.id)) {
                            onMarkSectionComplete(section.id, true);
                          }
                        }}
                        style={{ marginTop: "3px" }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </fieldset>
                {b23SelfOpt && (
                  <div
                    role="status"
                    style={{
                      marginTop: "8px",
                      padding: "10px 14px",
                      background:
                        b23SelfOpt.id === "random_not_predictable_single" ? "#defbe6" : "#fff1f1",
                      borderLeft:
                        b23SelfOpt.id === "random_not_predictable_single"
                          ? "4px solid #198038"
                          : "4px solid #b42332",
                      fontSize: "13.5px",
                      lineHeight: 1.55,
                    }}
                  >
                    {b23SelfOpt.feedback}
                  </div>
                )}
              </section>

              {/* Bước 6: Sản phẩm mang vào lớp + Mô phỏng trải nghiệm thêm */}
              <section
                style={{
                  border: "2px solid #0f62fe",
                  background: "#edf5ff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "#002d9c" }}>
                    Sản phẩm mang vào lớp · Bài 23
                  </h4>
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      background: b23Ready ? "#defbe6" : "#fcf4d6",
                      color: b23Ready ? "#198038" : "#8e6a00",
                    }}
                  >
                    {b23Ready
                      ? "✓ Đã hoàn thành Pha 1 Bài 23"
                      : "Cần đủ: Dự đoán + lí do, cặp số Bảng 23.1 và câu tự kiểm tra"}
                  </span>
                </div>
                <ul style={{ margin: "0 0 12px", paddingLeft: "18px", fontSize: "14px", lineHeight: 1.6 }}>
                  <li>
                    <strong>Dự đoán ban đầu:</strong> {lockedB23Label ? `“${lockedB23Label}”` : "Chưa lưu"}
                  </li>
                  <li>
                    <strong>Cặp số liệu Bảng 23.1:</strong>{" "}
                    {c5to10.trim() === "3" && c15to20.trim() === "0"
                      ? "5–10 s: 3 tia vs 15–20 s: 0 tia (tổng 10 tia/30 s)"
                      : "Chưa đọc đúng hai khoảng mẫu"}
                  </li>
                </ul>
                <label htmlFor="b23-bring-q" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                  Câu hỏi muốn kiểm chứng ở Pha 2:
                </label>
                <input
                  id="b23-bring-q"
                  type="text"
                  value={bringToClassQuestion}
                  onChange={(e) => {
                    const val = e.target.value;
                    patchNotebook((cur) => ({
                      ...cur,
                      preClassWork: { ...cur.preClassWork, bringToClassQuestion: val },
                    }));
                  }}
                  placeholder="Ví dụ: Nếu có hàng tỉ tỉ hạt nhân cùng phân rã ngẫu nhiên thì đồ thị theo thời gian có trơn mượt không?"
                  style={{
                    width: "100%",
                    minHeight: "40px",
                    padding: "8px 10px",
                    border: "1px solid #8d8d8d",
                    background: "#ffffff",
                    fontSize: "14px",
                    marginBottom: "10px",
                  }}
                />
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                  onClick={() => onJumpToSection("b23-radiation-types")}
                >
                  Chuyển sang Pha 2 (Trong giờ học) →
                </button>
              </section>

              <details style={{ border: "1px solid #d0d7de", background: "#ffffff", padding: "12px 14px" }}>
                <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "14px" }}>
                  Thử nghiệm bổ trợ: Mô phỏng xung ngẫu nhiên ống đếm Geiger (tách biệt với số liệu thật Bảng 23.1)
                </summary>
                <div style={{ marginTop: "12px" }}>
                  <FixedPhysicsActivityRenderer
                    activityKey="geiger_random_decay"
                    onProgress={(done) => {
                      if (done && checkB23PreReady(notebook)) {
                        onMarkSectionComplete(section.id, true);
                      }
                    }}
                  />
                </div>
              </details>
            </div>
          );
        })()}

      {section.kind === "b23_radiation_types" &&
        (() => {
          const lockedB23Label = B23_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          return (
            <div>
              <Phase2ProductEchoCard
                preSectionId="b23-cloud-geiger"
                lockedChoiceLabel={lockedB23Label}
                lockedReason={lockedInitialReason}
                actionSummary={`Đã đối chiếu Bảng 23.1 SGK (5–10 s: ${notebook.preClassWork?.b23Count5to10 || "—"} tia; 15–20 s: ${notebook.preClassWork?.b23Count15to20 || "—"} tia)`}
                bringQuestion={bringToClassQuestion}
                onJumpToSection={onJumpToSection}
              />

              {/* Sơ đồ đối chiếu chuẩn Hình 23.3a (Điện trường) & Hình 23.3b (Từ trường B hướng ra ngoài ⊙) SGK tr. 105 + Hình 23.4 tr. 106 */}
              <div
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "14px 16px",
                  marginBottom: "16px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "15.5px" }}>
                  Đối chiếu Hình 23.3 (SGK tr. 105): Sự lệch của các tia α, β⁻, β⁺, γ trong điện trường (a) &amp; từ trường (b)
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  {/* Hình 23.3a: Điện trường E hướng từ trên (+) xuống dưới (-) */}
                  <figure style={{ margin: 0, border: "1px solid #e5e7eb", background: "#f8fafc", padding: "10px", textAlign: "center" }}>
                    <svg
                      viewBox="0 0 300 165"
                      role="img"
                      aria-label="Hình 23.3a SGK trang 105: Bản dương ở trên, bản âm ở dưới, điện trường E hướng xuống; chùm tia đi từ trái sang phải có beta trừ lệch mạnh lên trên, gamma đi thẳng, alpha lệch nhẹ xuống dưới, beta cộng lệch mạnh xuống dưới"
                      style={{ width: "100%", maxWidth: "290px", height: "auto" }}
                    >
                      <rect x="48" y="22" width="196" height="6" fill="#0f62fe" />
                      {[72, 118, 164, 210].map((x) => (
                        <g key={x}>
                          <text x={x} y="17" textAnchor="middle" fontSize="12" fontWeight="700" fill="#002d9c">+</text>
                          <line x1={x} y1="28" x2={x} y2="128" stroke="#93c5fd" strokeWidth="1" />
                          <polygon points={`${x},78 ${x - 3},71 ${x + 3},71`} fill="#60a5fa" />
                          <text x={x} y="148" textAnchor="middle" fontSize="13" fontWeight="700" fill="#b42332">−</text>
                        </g>
                      ))}
                      <rect x="48" y="128" width="196" height="6" fill="#da1e28" />
                      <text x="30" y="68" fontSize="13" fontWeight="700" fill="#002d9c">E⃗ ↓</text>

                      {/* β⁻ lệch mạnh lên bản (+) */}
                      <path d="M 48 80 Q 140 76 254 44" fill="none" stroke="#0043ce" strokeWidth="2.1" />
                      <text x="260" y="46" fontSize="12.5" fontWeight="700" fill="#0043ce">β⁻</text>
                      {/* γ đi thẳng */}
                      <line x1="48" y1="84" x2="254" y2="84" stroke="#161616" strokeWidth="2" />
                      <text x="260" y="88" fontSize="12.5" fontWeight="700" fill="#161616">γ</text>
                      {/* α lệch nhẹ xuống bản (-) */}
                      <path d="M 48 88 Q 150 90 254 106" fill="none" stroke="#b42332" strokeWidth="2.4" />
                      <text x="260" y="109" fontSize="12.5" fontWeight="700" fill="#b42332">α</text>
                      {/* β⁺ lệch mạnh xuống bản (-) */}
                      <path d="M 48 92 Q 140 96 254 122" fill="none" stroke="#198038" strokeWidth="2.1" />
                      <text x="260" y="126" fontSize="12.5" fontWeight="700" fill="#198038">β⁺</text>
                    </svg>
                    <figcaption style={{ fontSize: "12px", color: "#525252", marginTop: "4px" }}>
                      <strong>a) Điện trường đều E⃗ hướng xuống:</strong> <code>β⁻</code> lệch về bản (+); <code>α</code> và <code>β⁺</code> lệch về bản (−), trong đó <code>β⁺</code> nhẹ hơn <code>α</code> ~7300 lần nên lệch mạnh hơn nhiều.
                    </figcaption>
                  </figure>

                  {/* Hình 23.3b: Từ trường đều B hướng từ trong ra ngoài (⊙), nguồn ở đáy bắn thẳng đứng lên */}
                  <figure style={{ margin: 0, border: "1px solid #e5e7eb", background: "#f8fafc", padding: "10px", textAlign: "center" }}>
                    <svg
                      viewBox="0 0 300 165"
                      role="img"
                      aria-label="Hình 23.3b SGK trang 105: Nguồn phóng xạ ở dưới bắn thẳng đứng lên trên vào từ trường đều B hướng từ trong ra ngoài mặt giấy (chấm tròn); lực Lorentz làm beta trừ lệch mạnh sang trái, gamma đi thẳng, alpha lệch nhẹ sang phải, beta cộng lệch mạnh sang phải"
                      style={{ width: "100%", maxWidth: "290px", height: "auto" }}
                    >
                      {/* Lưới kí hiệu ⊙ (từ trường B hướng ra ngoài mặt giấy) */}
                      {[76, 112, 148, 184, 220].map((gx) =>
                        [32, 62, 92, 122].map((gy) => (
                          <g key={`${gx}-${gy}`}>
                            <circle cx={gx} cy={gy} r="5.5" fill="none" stroke="#7dd3fc" strokeWidth="1" />
                            <circle cx={gx} cy={gy} r="1.5" fill="#0284c7" />
                          </g>
                        ))
                      )}
                      <text x="28" y="42" fontSize="13" fontWeight="700" fill="#0284c7">B⃗ ⊙</text>

                      {/* Hộp chì chứa nguồn ở đáy */}
                      <path d="M 126 130 L 126 150 L 170 150 L 170 130 L 156 130 L 156 142 L 140 142 L 140 130 Z" fill="#64748b" />

                      {/* β⁻ lệch mạnh sang trái */}
                      <path d="M 145 138 Q 142 84 114 26" fill="none" stroke="#0043ce" strokeWidth="2.1" />
                      <text x="104" y="20" fontSize="12.5" fontWeight="700" fill="#0043ce">β⁻</text>
                      {/* γ đi thẳng đứng */}
                      <line x1="148" y1="138" x2="148" y2="24" stroke="#161616" strokeWidth="2" />
                      <text x="144" y="18" fontSize="12.5" fontWeight="700" fill="#161616">γ</text>
                      {/* α lệch nhẹ sang phải */}
                      <path d="M 150 138 Q 152 84 166 26" fill="none" stroke="#b42332" strokeWidth="2.4" />
                      <text x="162" y="20" fontSize="12.5" fontWeight="700" fill="#b42332">α</text>
                      {/* β⁺ lệch mạnh sang phải */}
                      <path d="M 152 138 Q 158 84 188 26" fill="none" stroke="#198038" strokeWidth="2.1" />
                      <text x="186" y="20" fontSize="12.5" fontWeight="700" fill="#198038">β⁺</text>
                    </svg>
                    <figcaption style={{ fontSize: "12px", color: "#525252", marginTop: "4px" }}>
                      <strong>b) Từ trường đều B⃗ hướng ra ngoài (⊙), chùm tia bắn lên:</strong> Lực Lorentz <code>F⃗ = q(v⃗ × B⃗)</code> hướng sang phải với hạt dương (<code>α, β⁺</code>) và sang trái với hạt âm (<code>β⁻</code>).
                    </figcaption>
                  </figure>
                </div>
                <p style={{ margin: "10px 0 0", fontSize: "13px", color: "#525252", lineHeight: 1.55 }}>
                  <strong>Khả năng đâm xuyên chuẩn Hình 23.4 (SGK tr. 106):</strong> Tia <strong>α</strong> (hạt nhân <Nuclide sym="He" a={4} z={2} />, tốc độ <code>~2·10⁷ m/s</code>) ion hóa rất mạnh nhưng bị chặn bởi <strong>tờ giấy dày ~1 mm</strong>; tia <strong>β</strong> (<code>β⁻</code> là <Nuclide sym="e" a={0} z={-1} />, <code>β⁺</code> là positron <Nuclide sym="e" a={0} z={1} />, tốc độ xấp xỉ <code>c</code>) xuyên qua giấy nhưng bị chặn bởi <strong>tấm nhôm dày ~1 mm</strong>; tia <strong>γ</strong> (sóng điện từ bước sóng rất ngắn, cũng là hạt photon năng lượng cao) đi xuyên qua cả giấy và nhôm, cần <strong>tấm chì dày</strong> mới cản bớt được.
                </p>
              </div>

              <FixedPhysicsActivityRenderer
                activityKey="radiation_properties"
                onProgress={(done) => onMarkSectionComplete(section.id, done)}
              />
            </div>
          );
        })()}

      {section.kind === "b23_half_life" &&
        (() => {
          const lockedB23Label = B23_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          return (
            <div>
              <Phase2ProductEchoCard
                preSectionId="b23-cloud-geiger"
                lockedChoiceLabel={lockedB23Label}
                lockedReason={lockedInitialReason}
                actionSummary="Liên kết từ thăng giáng ngẫu nhiên ở Bảng 23.1 (Pha 1) sang quy luật hàm mũ khi số hạt N₀ rất lớn"
                bringQuestion={bringToClassQuestion}
                onJumpToSection={onJumpToSection}
              />

              {/* Bảng phân biệt rõ N(t) và H(t) */}
              <div className={styles.tableScroll}>
                <table className={styles.cdsTable}>
                  <caption>
                    Phân biệt số hạt nhân chưa phân rã N_t và độ phóng xạ H_t (SGK tr. 107–109)
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Đại lượng</th>
                      <th scope="col">Ý nghĩa vật lí</th>
                      <th scope="col">Công thức theo thời gian t</th>
                      <th scope="col">Đơn vị</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Số hạt nhân còn lại N_t</th>
                      <td>Tổng số hạt nhân mẹ <strong>chưa bị phân rã</strong> còn tồn tại trong mẫu ở thời điểm <code>t</code>.</td>
                      <td>
                        <code>N_t = N₀ · 2^(−t/T) = N₀ · e^(−λt)</code> (23.1)
                      </td>
                      <td>Hạt nhân (hằng số phóng xạ <code>λ = ln 2 / T</code> có đơn vị <code>s⁻¹</code>)</td>
                    </tr>
                    <tr>
                      <th scope="row">Độ phóng xạ H_t</th>
                      <td>Đặc trưng cho tính phóng xạ mạnh hay yếu, bằng <strong>số hạt nhân phân rã trong một giây</strong>.</td>
                      <td>
                        <code>H_t = λ · N_t = H₀ · 2^(−t/T)</code> (23.2–23.3)
                      </td>
                      <td>
                        <strong>Becơren (Bq)</strong>: <code>1 Bq = 1 phân rã/s</code>; thực tế còn dùng <strong>Curi (Ci)</strong>: <code>1 Ci = 3,7·10¹⁰ Bq</code> (xấp xỉ 1 g <Nuclide sym="Ra" a={226} z={88} />)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bảng 23.2 đầy đủ 7 đồng vị gốc SGK tr. 108 */}
              <div className={styles.tableScroll}>
                <table className={styles.cdsTable}>
                  <caption>
                    Bảng 23.2. Chu kì bán rã của một số đồng vị phóng xạ (SGK Vật lí 12, tr. 108 — đủ 7 đồng vị)
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Đồng vị phóng xạ</th>
                      <th scope="col" className={styles.numCell}>Chu kì bán rã T</th>
                      <th scope="col">Ghi chú tia phát ra &amp; liên hệ bài học</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SGK_TABLE_23_2_SAMPLES.map((item) => (
                      <tr key={`${item.sym}-${item.a}`}>
                        <th scope="row">
                          {item.name} (<Nuclide sym={item.sym} a={item.a} z={item.z} />)
                        </th>
                        <td className={styles.numCell}>{item.halfLife}</td>
                        <td>{item.radiation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <details
                style={{
                  marginBottom: "16px",
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "10px 14px",
                  fontSize: "13.5px",
                }}
              >
                <summary style={{ cursor: "pointer", fontWeight: 700, color: "#002d9c" }}>
                  Câu hỏi ? mục II.1 (SGK tr. 108): Đồng vị ¹⁵₈O sau 244 s có 75% số hạt nhân ban đầu đã bị phân rã. Tính chu kì bán rã T của ¹⁵₈O
                </summary>
                <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
                  Sau <code>t = 244 s</code> đã phân rã <code>75%</code> nên số hạt nhân <Nuclide sym="O" a={15} z={8} /> <strong>còn lại chưa phân rã</strong> là{" "}
                  <code>N_t = (100% − 75%)·N₀ = 25%·N₀ = (1/4)·N₀ = N₀ · 2^(−2)</code>. Do đó{" "}
                  <code>t / T = 2 ⇒ T = 244 / 2 = 122 s ≈ 1,2·10² giây</code> (khớp chính xác dòng Oxygen trên Bảng 23.2!).
                </p>
              </details>

              <FixedPhysicsActivityRenderer
                activityKey="radioactive_decay_half_life"
                onProgress={(done) => onMarkSectionComplete(section.id, done)}
              />
            </div>
          );
        })()}

      {section.kind === "b23_safety" && (
        <div>
          {/* Hai biển cảnh báo phóng xạ chuẩn Hình 23.8a & Hình 23.8b SGK tr. 111 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "14px",
              marginBottom: "14px",
            }}
          >
            <figure
              style={{
                margin: 0,
                border: "1px solid #d0d7de",
                background: "#ffffff",
                padding: "14px",
                textAlign: "center",
              }}
            >
              <svg
                viewBox="0 0 220 170"
                width="220"
                height="170"
                role="img"
                aria-label="Hình 23.8a biển cảnh báo khu vực có chất phóng xạ: hình tam giác đều nền vàng viền đen, ở giữa là biểu tượng cánh quạt 3 cánh màu đen quanh chấm tròn tâm"
                style={{ width: "100%", maxWidth: "210px", height: "auto" }}
              >
                <polygon
                  points="110,14 202,156 18,156"
                  fill="#facc15"
                  stroke="#161616"
                  strokeWidth="7"
                  strokeLinejoin="round"
                />
                <circle cx="110" cy="110" r="8" fill="#161616" />
                <path d="M110,110 L90,76 A38,38 0 0,1 130,76 Z" fill="#161616" />
                <path d="M110,110 L149,112 A38,38 0 0,1 127,144 Z" fill="#161616" />
                <path d="M110,110 L93,144 A38,38 0 0,1 71,112 Z" fill="#161616" />
                <circle cx="110" cy="110" r="13" fill="none" stroke="#facc15" strokeWidth="4" />
              </svg>
              <figcaption style={{ fontSize: "13px", lineHeight: 1.5, marginTop: "6px", textAlign: "left" }}>
                <strong>Hình 23.8a (Biển cảnh báo phóng xạ thông thường · SGK tr. 111):</strong> Tam giác nền vàng viền đen với biểu tượng 3 cánh — cảnh báo khu vực có nguồn phóng xạ hoặc bức xạ ion hóa, không tự ý tiếp cận.
              </figcaption>
            </figure>

            <figure
              style={{
                margin: 0,
                border: "1px solid #d0d7de",
                background: "#ffffff",
                padding: "14px",
                textAlign: "center",
              }}
            >
              <svg
                viewBox="0 0 220 170"
                width="220"
                height="170"
                role="img"
                aria-label="Hình 23.8b biển cảnh báo bổ sung ISO 2007 nền đỏ cho nguồn phóng xạ nguy hiểm chết người: phía trên là cánh quạt phát tia, bên trái là đầu lâu xương chéo, bên phải là hình người chạy rời xa theo mũi tên"
                style={{ width: "100%", maxWidth: "210px", height: "auto" }}
              >
                <polygon
                  points="110,14 202,156 18,156"
                  fill="#da1e28"
                  stroke="#161616"
                  strokeWidth="7"
                  strokeLinejoin="round"
                />
                <circle cx="110" cy="68" r="11" fill="#161616" />
                <line x1="96" y1="82" x2="82" y2="96" stroke="#161616" strokeWidth="3" />
                <line x1="110" y1="84" x2="110" y2="100" stroke="#161616" strokeWidth="3" />
                <line x1="124" y1="82" x2="138" y2="96" stroke="#161616" strokeWidth="3" />
                <circle cx="72" cy="124" r="11" fill="#ffffff" stroke="#161616" strokeWidth="2.5" />
                <circle cx="68" cy="122" r="2.2" fill="#161616" />
                <circle cx="76" cy="122" r="2.2" fill="#161616" />
                <line x1="58" y1="138" x2="86" y2="146" stroke="#161616" strokeWidth="3.5" />
                <line x1="86" y1="138" x2="58" y2="146" stroke="#161616" strokeWidth="3.5" />
                <circle cx="138" cy="112" r="6" fill="#161616" />
                <polyline points="128,124 138,122 146,134 136,146" fill="none" stroke="#161616" strokeWidth="4" />
                <line x1="152" y1="142" x2="176" y2="142" stroke="#ffffff" strokeWidth="4" />
                <polygon points="176,136 186,142 176,148" fill="#ffffff" />
              </svg>
              <figcaption style={{ fontSize: "13px", lineHeight: 1.5, marginTop: "6px", textAlign: "left" }}>
                <strong>Hình 23.8b (Biển cảnh báo nguồn phóng xạ nguy hiểm · ISO 2007 / SGK tr. 111):</strong> Tam giác nền đỏ — cảnh báo trực quan <em>“Nguy hiểm – Chạy ra xa ngay lập tức – Không chạm vào!”</em>.
              </figcaption>
            </figure>
          </div>

          {/* Hình 23.10 SGK tr. 111 (Nguồn phơi nhiễm tự nhiên & nhân tạo) + Em có biết đơn vị Sievert (Sv) tr. 112–113 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px",
              marginBottom: "16px",
              fontSize: "13.5px",
              lineHeight: 1.55,
            }}
          >
            <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
              <strong style={{ display: "block", marginBottom: "4px" }}>
                Hình 23.10 (SGK tr. 111) · Các nguồn phóng xạ tự nhiên &amp; nhân tạo quanh ta
              </strong>
              Con người luôn chịu phơi nhiễm bức xạ nền ở mức thấp từ tự nhiên và y tế: <strong>Không khí (chủ yếu khí Radon): 51%</strong> · <strong>Thực phẩm &amp; nước uống: 14%</strong> · <strong>Tia vũ trụ: 14%</strong> · <strong>Bức xạ từ mặt đất/vật liệu: 10%</strong> · <strong>Chẩn đoán y tế &amp; nguồn nhân tạo khác: 11%</strong>. Ba nguyên tắc giảm liều chiếu ngoài (Hình 23.11 tr. 112): <strong>giảm thời gian tiếp xúc</strong>, <strong>tăng khoảng cách</strong> và <strong>che chắn thích hợp</strong>.
            </div>
            <div style={{ border: "1px solid #b5c7e3", background: "#f4f8ff", padding: "12px 14px" }}>
              <strong style={{ display: "block", color: "#002d9c", marginBottom: "4px" }}>
                [Ô đọc thêm “Em có biết” — SGK tr. 112–113] Đơn vị đo tác dụng sinh học của bức xạ (Sievert · Sv)
              </strong>
              Mức độ ảnh hưởng sinh học của tia phóng xạ lên cơ thể người được đánh giá qua liều hiệu dụng có đơn vị là <strong>Sievert (Sv)</strong> hoặc <strong>milisievert (1 mSv = 10⁻³ Sv)</strong> (chụp X-quang ngực thông thường cỡ <code>0,1 mSv</code>; liều nền tự nhiên trung bình khoảng <code>2,4 mSv/năm</code>).
            </div>
          </div>

          <FixedPhysicsActivityRenderer
            activityKey="radiation_safety"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {section.kind === "b23_carbon14" && (
        <div>
          <div
            style={{
              marginBottom: "14px",
              padding: "12px 14px",
              border: "1px solid #b5c7e3",
              background: "#f4f8ff",
              fontSize: "13.5px",
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: "#002d9c", display: "block", marginBottom: "4px" }}>
              [Ô đọc thêm “Em có biết” — SGK tr. 109–110] Nguyên tắc định tuổi cổ vật bằng đồng vị Carbon-14 (<Nuclide sym="C" a={14} z={6} />)
            </strong>
            Tia vũ trụ tương tác với khí quyển liên tục tạo ra đồng vị phóng xạ <Nuclide sym="C" a={14} z={6} /> (<code>T ≈ 5 730 năm</code>). Khi sinh vật còn sống, quá trình trao đổi chất giữ tỉ lệ <Nuclide sym="C" a={14} z={6} /> / <Nuclide sym="C" a={12} z={6} /> trong cơ thể gần như không đổi bằng khí quyển; khi sinh vật chết đi, sự trao đổi dừng lại và lượng <Nuclide sym="C" a={14} z={6} /> giảm dần theo quy luật bán rã <code>H_t = H₀ · 2^(−t/T)</code> (so trên cùng khối lượng carbon với mẫu đang sống).
          </div>
          <FixedPhysicsActivityRenderer
            activityKey="carbon14_dating"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {/* ====================================================================
          BÀI 24 — CÔNG NGHIỆP HẠT NHÂN (HÌNH 24.1, HÌNH 24.2–24.3 & HÌNH 24.5 SGK)
          ==================================================================== */}
      {section.kind === "b24_energy_chain" &&
        (() => {
          const lockedB24Label = B24_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          const loopRoles = notebook.preClassWork?.b24LoopRoles ?? {};
          const matchedLoopCount = B24_LOOP_PARTS.filter(
            (p) => loopRoles[p.code] === p.correctRole
          ).length;
          const b24SelfCheck = notebook.preClassWork?.selfCheckChoice ?? "";
          const b24SelfOpt = B24_PRE_SELF_CHECK_OPTIONS.find(
            (o) => o.id === b24SelfCheck
          );
          const checkB24PreReady = (
            nb: StudentLessonNotebook,
            rolesOv?: typeof loopRoles,
            selfOv?: string
          ) => {
            const hasP = Boolean(
              (nb.initialPredictionChoice ?? nb.preClassPredictionChoice ?? "").trim()
            );
            const hasR = Boolean(
              (nb.initialPredictionReason ?? nb.preClassPredictionReason ?? "").trim()
            );
            const rMap = rolesOv ?? nb.preClassWork?.b24LoopRoles ?? {};
            const loopsOk = B24_LOOP_PARTS.every((p) => rMap[p.code] === p.correctRole);
            const sc = selfOv ?? nb.preClassWork?.selfCheckChoice ?? "";
            return hasP && hasR && loopsOk && sc === "isolated_three_loops";
          };
          const b24Ready = checkB24PreReady(notebook);

          return (
            <div>
              {/* Bước 1: Câu hỏi mở đầu gắn với Hình 24.1 */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 1 · Câu hỏi mở đầu về nhà máy điện hạt nhân (Hình 24.1 · SGK tr. 114–115)
                </h4>
                <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.6 }}>
                  Nhà máy điện hạt nhân khai thác năng lượng tỏa ra từ phản ứng phân hạch dây chuyền có điều khiển trong lò phản ứng để sản xuất điện năng quy mô lớn.
                </p>
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#edf5ff",
                    borderLeft: "4px solid #0f62fe",
                    fontSize: "15px",
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color: "#002d9c", display: "block", marginBottom: "4px" }}>
                    Câu hỏi mở đầu cần suy nghĩ:
                  </strong>
                  <em>“Bộ phận nào thực sự làm quay tua-bin?”</em>
                </div>
              </section>

              {/* Bước 2: Mặt cắt màu Hình 24.1 chuẩn 3 chu trình lưu chất tách biệt (chưa lộ đáp án câu dự đoán Bước 3) */}
              <section style={{ marginBottom: "18px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "16px" }}>
                  Bước 2 · Sơ đồ mặt cắt Hình 24.1 SGK và chú giải màu 3 chu trình lưu chất tách biệt
                </h4>
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#fcf4d6",
                    border: "1px solid #f1c21b",
                    borderLeft: "4px solid #8e6a00",
                    marginBottom: "14px",
                    fontSize: "14px",
                    lineHeight: 1.55,
                  }}
                >
                  <strong>Chỉ dẫn quan sát trọng tâm (chưa lộ đáp án):</strong>{" "}
                  <em>
                    “Lần theo đường ống nối trực tiếp vào tua-bin trên Hình 24.1 và kiểm tra xem 3 chu trình lưu chất có trộn lẫn vào nhau hay chỉ trao đổi nhiệt qua thành ống kín.”
                  </em>
                </div>

                <figure className={styles.darkBenchStage} style={{ margin: "0 0 14px" }}>
                  <svg
                    viewBox="0 0 720 290"
                    width="720"
                    height="290"
                    role="img"
                    aria-label="Hình 24.1 SGK trang 114: sơ đồ nhà máy điện hạt nhân với (1) Chu trình thứ nhất tải nhiệt sơ cấp màu cam đỏ khép kín trong tòa nhà lò phản ứng, (2) Chu trình thứ hai màu xanh dương từ bộ phận sinh hơi sang tua-bin rồi xuống bộ ngưng tụ hơi, (3) Nguồn nước làm mát ngoài màu ngọc lam qua bộ ngưng tụ và tháp làm mát"
                    style={{ width: "100%", height: "auto", display: "block" }}
                  >
                    <rect x="0" y="0" width="720" height="290" fill="#0b1220" />

                    {/* Vòm nhà lò bảo vệ */}
                    <path
                      d="M 24 236 L 24 82 Q 152 14 280 82 L 280 236 Z"
                      fill="#121b2e"
                      stroke="#94a3b8"
                      strokeWidth="2.5"
                    />
                    <text x="58" y="42" fill="#e2e8f0" fontSize="12" fontWeight="700">
                      Tòa nhà bảo vệ lò phản ứng
                    </text>

                    {/* Tâm lò phản ứng + thanh điều khiển */}
                    <rect x="50" y="114" width="76" height="96" rx="6" fill="#1e293b" stroke="#f97316" strokeWidth="2.5" />
                    <line x1="72" y1="88" x2="72" y2="148" stroke="#cbd5e1" strokeWidth="4" />
                    <line x1="88" y1="88" x2="88" y2="156" stroke="#cbd5e1" strokeWidth="4" />
                    <line x1="104" y1="88" x2="104" y2="148" stroke="#cbd5e1" strokeWidth="4" />
                    <text x="56" y="182" fill="#fdba74" fontSize="11" fontWeight="700">
                      Lò phản ứng
                    </text>
                    <text x="48" y="82" fill="#cbd5e1" fontSize="10.5">
                      Thanh điều khiển
                    </text>

                    {/* Bộ phận sinh hơi */}
                    <rect x="172" y="88" width="84" height="126" rx="10" fill="#1e293b" stroke="#60a5fa" strokeWidth="2.2" />
                    <text x="178" y="108" fill="#bfdbfe" fontSize="10.5" fontWeight="700">
                      Bộ phận sinh hơi
                    </text>

                    {/* CHU TRÌNH THỨ NHẤT (MÀU CAM/ĐỎ) */}
                    <path
                      d="M 126 132 L 194 132 Q 232 156 194 184 L 126 184"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="6"
                      strokeLinejoin="round"
                    />
                    <circle cx="152" cy="184" r="9" fill="#ea580c" stroke="#fed7aa" strokeWidth="1.5" />

                    {/* CHU TRÌNH THỨ HAI (MÀU LAM): Đường ống dẫn từ Bộ phận sinh hơi sang Tua-bin */}
                    <path
                      d="M 214 88 L 214 58 L 392 58 L 392 98"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="6"
                    />
                    <text x="234" y="50" fill="#7dd3fc" fontSize="11" fontWeight="700">
                      Ống dẫn hơi nước (Chu trình thứ hai) →
                    </text>

                    {/* Tua-bin & Máy phát điện */}
                    <polygon
                      points="356,98 432,84 432,140 356,126"
                      fill="#1d4ed8"
                      stroke="#93c5fd"
                      strokeWidth="2"
                    />
                    <text x="370" y="116" fill="#ffffff" fontSize="12" fontWeight="700">
                      Tua-bin
                    </text>
                    <line x1="432" y1="112" x2="474" y2="112" stroke="#facc15" strokeWidth="5" />
                    <rect x="474" y="88" width="84" height="48" rx="4" fill="#1e293b" stroke="#facc15" strokeWidth="2" />
                    <text x="486" y="110" fill="#fde047" fontSize="11.5" fontWeight="700">
                      Máy phát
                    </text>
                    <text x="488" y="126" fill="#f8fafc" fontSize="10.5">
                      điện (~)
                    </text>
                    <line x1="558" y1="104" x2="696" y2="104" stroke="#facc15" strokeWidth="2.2" />
                    <text x="580" y="96" fill="#fde047" fontSize="11" fontWeight="700">
                      Lưới điện
                    </text>

                    {/* Bộ ngưng tụ hơi */}
                    <rect x="352" y="164" width="96" height="62" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                    <text x="358" y="181" fill="#cbd5e1" fontSize="10.5" fontWeight="700">
                      Bộ ngưng tụ hơi
                    </text>
                    <line x1="396" y1="136" x2="396" y2="164" stroke="#38bdf8" strokeWidth="5" strokeDasharray="5 3" />
                    <path
                      d="M 352 204 L 214 204 L 214 214"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="5"
                    />

                    {/* VÒNG 3 (MÀU LỤC LAM): Nước làm mát ngoài / Tháp làm mát */}
                    <path
                      d="M 692 214 L 418 214 Q 382 198 418 186 L 692 186"
                      fill="none"
                      stroke="#2dd4bf"
                      strokeWidth="5"
                    />
                    <text x="472" y="178" fill="#5eead4" fontSize="11" fontWeight="700">
                      Nước làm mát ngoài / Tháp làm mát
                    </text>

                    {/* Bảng chú giải 3 màu lưu chất ở đáy hình */}
                    <rect x="24" y="248" width="672" height="32" rx="3" fill="#121b2e" stroke="#263552" />
                    <rect x="34" y="258" width="14" height="10" fill="#f97316" />
                    <text x="54" y="267" fill="#fed7aa" fontSize="10.5" fontWeight="600">
                      (1) Chu trình thứ nhất (sơ cấp kín)
                    </text>
                    <rect x="250" y="258" width="14" height="10" fill="#38bdf8" />
                    <text x="270" y="267" fill="#bae6fd" fontSize="10.5" fontWeight="600">
                      (2) Chu trình thứ hai (sinh hơi – ngưng tụ)
                    </text>
                    <rect x="508" y="258" width="14" height="10" fill="#2dd4bf" />
                    <text x="528" y="267" fill="#99f6e4" fontSize="10.5" fontWeight="600">
                      (3) Nước làm mát ngoài
                    </text>
                  </svg>
                  <figcaption className={styles.darkBenchCaption}>
                    <strong>Hình 24.1 (Sơ đồ nhà máy điện hạt nhân · SGK tr. 114):</strong> Ba chu trình lưu chất trao đổi nhiệt qua thành ống kín và <strong>không trộn lẫn trực tiếp với nhau</strong>. Hãy quan sát đường ống nối vào tua-bin để khóa dự đoán ở Bước 3!
                  </figcaption>
                </figure>

                {b21VideoLesson && (
                  <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "13.5px", lineHeight: 1.55 }}>
                      <strong>Tư liệu video bổ trợ Pha 1 Bài 24:</strong> Quan sát chuỗi chuyển hóa năng lượng từ phân hạch tới điện năng.{" "}
                      <span style={{ color: "#002d9c", fontWeight: 600 }}>
                        Nếu chưa xem video, học sinh vẫn hoàn thành trọn vẹn Pha 1 từ mặt cắt màu Hình 24.1 ngay trên trang
                      </span>{" "}
                      (mở hoặc phát video không tự tính hoàn thành).
                    </p>
                    <NuclearLessonVideo lesson={b21VideoLesson} />
                  </div>
                )}
              </section>

              {/* Bước 3: Khóa dự đoán ban đầu + lí do */}
              <section
                style={{
                  border: "1px solid #8d8d8d",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 6px", fontSize: "16px" }}>
                  Bước 3 · Ghi và khóa dự đoán ban đầu kèm lí do
                </h4>
                {lockedB24Label && (
                  <div
                    style={{
                      marginBottom: "12px",
                      padding: "10px 12px",
                      background: "#fcf4d6",
                      borderLeft: "4px solid #8e6a00",
                      fontSize: "13.5px",
                    }}
                  >
                    <strong>Dự đoán ban đầu đã khóa:</strong> “{lockedB24Label}”
                    {lockedInitialReason ? <span> — <em>Lí do: {lockedInitialReason}</em></span> : null}
                  </div>
                )}
                <fieldset style={{ border: "none", margin: "0 0 12px", padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
                    Trả lời câu hỏi mở đầu: Bộ phận/tác nhân nào thực sự làm quay tua-bin?
                  </legend>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {B24_PREDICTION_CHOICES.map((opt) => (
                      <label
                        key={opt.id}
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                          padding: "10px 12px",
                          border: predChoice === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                          background: predChoice === opt.id ? "#edf5ff" : "#fafafa",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        <input
                          type="radio"
                          name="b24-pre-prediction"
                          checked={predChoice === opt.id}
                          onChange={() => {
                            setPredChoiceDraft(opt.id);
                            setPredSavedMsg("");
                          }}
                          style={{ marginTop: "3px" }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label htmlFor="b24-pre-reason" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                  Lí do cho dự đoán của em (bắt buộc):
                </label>
                <textarea
                  id="b24-pre-reason"
                  className={styles.evidenceTextarea}
                  rows={2}
                  value={predReason}
                  onChange={(e) => {
                    setPredReasonDraft(e.target.value);
                    setPredSavedMsg("");
                  }}
                  placeholder="Giải thích vì sao không dẫn thẳng chất tải nhiệt từ tâm lò phản ứng ra quay tua-bin…"
                />
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "10px" }}>
                  <button
                    type="button"
                    className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                    onClick={() => {
                      if (!predChoice || !predReason.trim()) {
                        setPredSavedMsg("Em hãy chọn dự đoán và ghi rõ lí do trước khi lưu.");
                        return;
                      }
                      onSavePreClassPrediction(predChoice, predReason.trim());
                      const updated = recordPreClassPrediction(notebook, predChoice, predReason.trim());
                      if (checkB24PreReady(updated)) onMarkSectionComplete(section.id, true);
                      setPredSavedMsg("Đã lưu và khóa dự đoán ban đầu cho Bài 24.");
                    }}
                  >
                    Lưu dự đoán trước giờ học
                  </button>
                  {predSavedMsg && (
                    <span
                      role="status"
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 600,
                        color: predChoice && predReason.trim() ? "#198038" : "#b42332",
                      }}
                    >
                      {predSavedMsg}
                    </span>
                  )}
                </div>
              </section>

              {/* Bước 4: Thao tác ghép đúng 3 vòng lưu chất trên Hình 24.1 */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 4 · Thao tác ghép đúng vai trò 3 dòng lưu chất trên Hình 24.1 ({matchedLoopCount}/3 đúng)
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {B24_LOOP_PARTS.map((part) => {
                    const sel = loopRoles[part.code] ?? "";
                    const ok = sel === part.correctRole;
                    return (
                      <div
                        key={part.code}
                        style={{
                          padding: "10px 12px",
                          border: sel ? (ok ? "1px solid #198038" : "1px solid #da1e28") : "1px solid #e0e0e0",
                          background: sel ? (ok ? "#defbe6" : "#fff1f1") : "#fafafa",
                        }}
                      >
                        <label
                          htmlFor={`b24-loop-${part.code}`}
                          style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
                        >
                          {part.label}
                        </label>
                        <select
                          id={`b24-loop-${part.code}`}
                          value={sel}
                          onChange={(e) => {
                            const val = e.target.value;
                            const nextRoles = { ...loopRoles, [part.code]: val };
                            patchNotebook((cur) => ({
                              ...cur,
                              preClassWork: { ...cur.preClassWork, b24LoopRoles: nextRoles },
                            }));
                            if (checkB24PreReady(notebook, nextRoles)) {
                              onMarkSectionComplete(section.id, true);
                            }
                          }}
                          style={{
                            width: "100%",
                            minHeight: "40px",
                            padding: "6px 8px",
                            border: "1px solid #8d8d8d",
                            background: "#ffffff",
                            fontSize: "13.5px",
                          }}
                        >
                          {B24_LOOP_ROLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Bước 5: Câu tự kiểm tra có phản hồi */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 5 · Câu tự kiểm tra trước giờ học
                </h4>
                <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>
                    Đối chiếu chú giải màu trên Hình 24.1 SGK, nhận xét nào đúng về an toàn bức xạ trong nhà máy điện hạt nhân?
                  </legend>
                  {B24_PRE_SELF_CHECK_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-start",
                        padding: "10px 12px",
                        marginBottom: "8px",
                        border: b24SelfCheck === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                        background: b24SelfCheck === opt.id ? "#edf5ff" : "#fafafa",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      <input
                        type="radio"
                        name="b24-pre-selfcheck"
                        checked={b24SelfCheck === opt.id}
                        onChange={() => {
                          patchNotebook((cur) => ({
                            ...cur,
                            preClassWork: { ...cur.preClassWork, selfCheckChoice: opt.id },
                          }));
                          if (checkB24PreReady(notebook, undefined, opt.id)) {
                            onMarkSectionComplete(section.id, true);
                          }
                        }}
                        style={{ marginTop: "3px" }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </fieldset>
                {b24SelfOpt && (
                  <div
                    role="status"
                    style={{
                      marginTop: "8px",
                      padding: "10px 14px",
                      background: b24SelfOpt.id === "isolated_three_loops" ? "#defbe6" : "#fff1f1",
                      borderLeft:
                        b24SelfOpt.id === "isolated_three_loops"
                          ? "4px solid #198038"
                          : "4px solid #b42332",
                      fontSize: "13.5px",
                      lineHeight: 1.55,
                    }}
                  >
                    {b24SelfOpt.feedback}
                  </div>
                )}
              </section>

              {/* Bước 6: Sản phẩm mang vào lớp + Mô phỏng dòng truyền năng lượng */}
              <section
                style={{
                  border: "2px solid #0f62fe",
                  background: "#edf5ff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "#002d9c" }}>
                    Sản phẩm mang vào lớp · Bài 24
                  </h4>
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      background: b24Ready ? "#defbe6" : "#fcf4d6",
                      color: b24Ready ? "#198038" : "#8e6a00",
                    }}
                  >
                    {b24Ready
                      ? "✓ Đã hoàn thành Pha 1 Bài 24"
                      : "Cần đủ: Dự đoán + lí do, 3/3 vòng lưu chất và câu tự kiểm tra"}
                  </span>
                </div>
                <ul style={{ margin: "0 0 12px", paddingLeft: "18px", fontSize: "14px", lineHeight: 1.6 }}>
                  <li>
                    <strong>Dự đoán ban đầu:</strong> {lockedB24Label ? `“${lockedB24Label}”` : "Chưa lưu"}
                  </li>
                  <li>
                    <strong>Phân biệt 3 chu trình lưu chất Hình 24.1:</strong> {matchedLoopCount}/3 dòng đúng.
                  </li>
                </ul>
                <label htmlFor="b24-bring-q" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                  Câu hỏi muốn tìm hiểu thêm trên lớp:
                </label>
                <input
                  id="b24-bring-q"
                  type="text"
                  value={bringToClassQuestion}
                  onChange={(e) => {
                    const val = e.target.value;
                    patchNotebook((cur) => ({
                      ...cur,
                      preClassWork: { ...cur.preClassWork, bringToClassQuestion: val },
                    }));
                  }}
                  placeholder="Ví dụ: Làm thế nào thanh điều khiển giữ cho lò phản ứng không vượt quá nhiệt độ an toàn?"
                  style={{
                    width: "100%",
                    minHeight: "40px",
                    padding: "8px 10px",
                    border: "1px solid #8d8d8d",
                    background: "#ffffff",
                    fontSize: "14px",
                    marginBottom: "10px",
                  }}
                />
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                  onClick={() => onJumpToSection("b24-reactor-control")}
                >
                  Chuyển sang Pha 2: Điều khiển lò phản ứng →
                </button>
              </section>

              <details style={{ border: "1px solid #d0d7de", background: "#ffffff", padding: "12px 14px" }}>
                <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "14px" }}>
                  Mô phỏng bổ trợ: Khảo sát dòng truyền năng lượng qua lò phản ứng
                </summary>
                <div style={{ marginTop: "12px" }}>
                  <FixedPhysicsActivityRenderer
                    activityKey="nuclear_power_energy_flow"
                    onProgress={(done) => {
                      if (done && checkB24PreReady(notebook)) {
                        onMarkSectionComplete(section.id, true);
                      }
                    }}
                  />
                </div>
              </details>
            </div>
          );
        })()}

      {section.kind === "b24_reactor_control" &&
        (() => {
          const lockedB24Label = B24_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          const loopRoles = notebook.preClassWork?.b24LoopRoles ?? {};
          const matchedLoopCount = B24_LOOP_PARTS.filter(
            (p) => loopRoles[p.code] === p.correctRole
          ).length;

          return (
            <div>
              <Phase2ProductEchoCard
                preSectionId="b24-energy-chain"
                lockedChoiceLabel={lockedB24Label}
                lockedReason={lockedInitialReason}
                actionSummary={`Đã phân biệt ${matchedLoopCount}/3 chu trình lưu chất trên Hình 24.1`}
                bringQuestion={bringToClassQuestion}
                onJumpToSection={onJumpToSection}
              />

              {/* Sơ đồ chuẩn Hình 24.2 (Thiết bị lưu trữ khô nhiên liệu đã qua sử dụng) & Ô đọc thêm Hình 24.3 (Mặt cắt lò phản ứng) SGK tr. 115 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <figure
                  style={{
                    margin: 0,
                    padding: "12px 14px",
                    background: "#f8fafc",
                    border: "1px solid #d0d7de",
                    borderLeft: "4px solid #0f62fe",
                  }}
                >
                  <strong style={{ display: "block", fontSize: "14px", marginBottom: "6px" }}>
                    Hình 24.2 (SGK tr. 115) · Cấu tạo thiết bị lưu trữ nhiên liệu hạt nhân đã qua sử dụng
                  </strong>
                  <svg
                    viewBox="0 0 320 135"
                    role="img"
                    aria-label="Hình 24.2 SGK trang 115: Thiết bị lưu trữ khô hình trụ gồm tường thép mạ nickel bao bọc các quả cầu bằng than chì, bên trong là các thanh nhiên liệu đã qua sử dụng, khe tản nhiệt và cửa đậy hai lớp có chốt kim loại"
                    style={{ width: "100%", maxWidth: "310px", height: "auto", display: "block", margin: "0 auto 6px", background: "#ffffff", border: "1px solid #e0e0e0" }}
                  >
                    {/* Vỏ hình trụ tường thép mạ nickel + lớp quả cầu than chì */}
                    <rect x="64" y="24" width="184" height="86" rx="14" fill="#fef3c7" stroke="#525252" strokeWidth="2.2" />
                    <rect x="78" y="36" width="156" height="62" rx="8" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
                    {/* Các quả cầu than chì quanh chu vi */}
                    {[86, 106, 126, 146, 166, 186, 206, 224].map((cx) => (
                      <g key={cx}>
                        <circle cx={cx} cy="30" r="3.2" fill="#334155" />
                        <circle cx={cx} cy="104" r="3.2" fill="#334155" />
                      </g>
                    ))}
                    {/* Các thanh nhiên liệu đã qua sử dụng ở lõi + khe tản nhiệt */}
                    {[48, 60, 72, 84].map((ry) => (
                      <line key={ry} x1="96" y1={ry} x2="218" y2={ry} stroke="#b42332" strokeWidth="3.2" />
                    ))}
                    {/* Cửa đậy hai lớp có chốt kim loại ở đầu trái */}
                    <ellipse cx="68" cy="67" rx="12" ry="38" fill="#cbd5e1" stroke="#161616" strokeWidth="1.8" />
                    <circle cx="68" cy="67" r="4" fill="#161616" />
                    <text x="158" y="18" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#161616">
                      Tường thép mạ nickel + các quả cầu than chì
                    </text>
                    <text x="158" y="124" textAnchor="middle" fontSize="10.5" fill="#525252">
                      Cửa hai lớp chốt kim loại · Lõi thanh nhiên liệu &amp; khe tản nhiệt
                    </text>
                  </svg>
                  <figcaption style={{ fontSize: "13px", lineHeight: 1.55, color: "#334155" }}>
                    Nhà máy điện hạt nhân không trực tiếp thải khí <code>CO₂, CO</code>, nhưng thanh nhiên liệu đã qua sử dụng chứa đồng vị chu kì bán rã lớn (như <code>⁹⁰Sr, ¹³⁷Cs</code> có <code>T ≈ 30 năm</code>) nên phải đóng trong thiết bị lưu trữ độ bền rất cao để bảo quản hàng trăm năm.
                  </figcaption>
                </figure>

                <div
                  style={{
                    padding: "12px 14px",
                    background: "#f4f8ff",
                    border: "1px solid #b5c7e3",
                    fontSize: "13.5px",
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ display: "block", color: "#002d9c", marginBottom: "4px" }}>
                    [Ô đọc thêm “Em có biết” — SGK tr. 115] Hình 24.3 · Sơ đồ mặt cắt lò phản ứng neutron nhiệt (Fermi, 1942)
                  </strong>
                  Nhiên liệu phân hạch thường là <code>²³⁵U</code> hoặc <code>²³⁹Pu</code>. Tám bộ phận chính trên Hình 24.3 gồm:{" "}
                  <strong>(1) Thanh nhiên liệu</strong> · <strong>(2) Chất làm chậm neutron</strong> (giảm tốc về neutron nhiệt <code>&lt; 0,1 eV</code>) · <strong>(3) Vỏ kim loại</strong> · <strong>(4) Lớp tán xạ neutron bằng than chì</strong> · <strong>(5) Ống làm lạnh &amp; chất tải nhiệt</strong> · <strong>(6) Thanh điều khiển chứa Bo hay Cd</strong> hấp thụ neutron nhiệt thừa (khi <code>k &gt; 1</code> thì hạ ngập sâu hơn để giữ <code>k = 1</code>, công suất tỏa nhiệt ổn định) · <strong>(7) Thành bảo vệ phóng xạ</strong> · <strong>(8) Đường ống làm thí nghiệm</strong>.
                </div>
              </div>

              <FixedPhysicsActivityRenderer
                activityKey="reactor_control_concept"
                onProgress={(done) => onMarkSectionComplete(section.id, done)}
              />
            </div>
          );
        })()}

      {section.kind === "b24_medicine" && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px",
              marginBottom: "14px",
              fontSize: "13.5px",
              lineHeight: 1.6,
            }}
          >
            <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
              <strong style={{ display: "block", marginBottom: "4px" }}>
                II. Ứng dụng trong y học: Chẩn đoán chức năng &amp; điều trị ung thư (SGK tr. 116–117)
              </strong>
              Đưa đồng vị phóng xạ theo dõi vào cơ thể để kiểm tra hoạt động của các cơ quan nội tạng (tuyến giáp, thận, <strong>gan – mật</strong>,…). Trong điều trị ung thư, bệnh nhân dùng dược chất phóng xạ đích (như thuốc Xofigo chứa đồng vị Radium <code>²²³₈₈Ra</code>{" "}
              <em>— lưu ý bản in SGK tr. 117 in nhầm chỉ số dưới 86, số hiệu chuẩn của Ra là Z = 88</em>, hoặc Lutathera chứa <Nuclide sym="Lu" a={177} z={71} />) hoặc chiếu tia từ máy xạ trị ngoài vào khối u (cần kiểm soát liều vì tia xạ cũng tác động lên tế bào lành xung quanh).
            </div>
            <div style={{ border: "1px solid #b5c7e3", background: "#f4f8ff", padding: "12px 14px" }}>
              <strong style={{ display: "block", color: "#002d9c", marginBottom: "4px" }}>
                [Ô đọc thêm “Em có biết” — SGK tr. 116] Hình 24.4 · Chụp cắt lớp phóng xạ SPECT và PET
              </strong>
              Máy <strong>SPECT</strong> và <strong>PET</strong> thu nhận bức xạ gamma phát ra từ dược chất phóng xạ tập trung tại mô đích để dựng ảnh cắt lớp chức năng chi tiết.{" "}
              <em>(Giải thích vật lí mở rộng cho mô phỏng bên dưới: SPECT thường dùng đồng vị phát γ trực tiếp như <code>⁹⁹₄₃Tc*</code> có <code>T ≈ 6 h</code>; PET dùng đồng vị phát <code>β⁺</code> như <Nuclide sym="F" a={18} z={9} /> tạo cặp 2 photon γ bay ngược chiều 180°.)</em>
            </div>
          </div>
          <FixedPhysicsActivityRenderer
            activityKey="nuclear_medicine"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {section.kind === "b24_bio_food" &&
        (() => {
          const foodEssay = notebook.inClassWork?.b24FoodEvidenceEssay ?? "";
          const foodChecked = Boolean(notebook.inClassWork?.b24FoodChecked) || b24FoodCheckedLocal;
          const essayOk = foodEssay.trim().length >= 20;

          return (
            <div>
              {/* Đối chiếu trực quan đúng thứ tự Hình 24.5 SGK tr. 117: (a) đã chiếu xạ bên trái, (b) vải thường bên phải + đồng vị đánh dấu ³²P */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "14px",
                  marginBottom: "16px",
                }}
              >
                <figure
                  style={{
                    margin: 0,
                    border: "1px solid #d0d7de",
                    background: "#ffffff",
                    padding: "14px",
                  }}
                >
                  <svg
                    viewBox="0 0 380 145"
                    width="380"
                    height="145"
                    role="img"
                    aria-label="Hình 24.5 SGK trang 117: (a) bên trái là vải thiều được chiếu xạ vẫn giữ vỏ tươi đỏ sau 7 ngày kể từ khi thu hoạch; (b) bên phải là vải thiều thường bị thâm nâu và nấm mốc sau 7 ngày"
                    style={{ width: "100%", height: "auto", display: "block" }}
                  >
                    {/* Bên trái: a) Vải thiều được chiếu xạ (đỏ tươi) */}
                    <rect x="0" y="0" width="182" height="145" fill="#defbe6" stroke="#42be65" />
                    <text x="12" y="22" fill="#198038" fontSize="12" fontWeight="700">
                      a) Vải thiều được chiếu xạ
                    </text>
                    <circle cx="58" cy="76" r="22" fill="#e11d48" />
                    <circle cx="94" cy="84" r="22" fill="#be123c" />
                    <circle cx="126" cy="72" r="21" fill="#f43f5e" />
                    <circle cx="94" cy="84" r="11" fill="#fff1f2" />
                    <text x="12" y="130" fill="#161616" fontSize="11" fontWeight="600">
                      Sau 7 ngày: tươi đỏ · không nhiễm xạ
                    </text>

                    {/* Bên phải: b) Vải thiều thường (thâm hỏng) */}
                    <rect x="198" y="0" width="182" height="145" fill="#fff1f1" stroke="#e0e0e0" />
                    <text x="210" y="22" fill="#a2191f" fontSize="12" fontWeight="700">
                      b) Vải thiều thường
                    </text>
                    <circle cx="258" cy="76" r="22" fill="#78350f" />
                    <circle cx="294" cy="84" r="22" fill="#57534e" />
                    <circle cx="326" cy="72" r="21" fill="#44403c" />
                    <circle cx="294" cy="84" r="10" fill="#d6d3d1" />
                    <text x="210" y="130" fill="#525252" fontSize="11">
                      Sau 7 ngày: vi sinh vật làm thâm hỏng
                    </text>
                  </svg>
                  <figcaption style={{ fontSize: "13px", lineHeight: 1.5, marginTop: "8px" }}>
                    <strong>Hình 24.5 (SGK tr. 117):</strong> Vải thiều được chiếu xạ <strong>(a)</strong> và vải thiều thường <strong>(b)</strong> sau 7 ngày kể từ khi thu hoạch.
                  </figcaption>
                </figure>

                <div className={styles.tableScroll} style={{ margin: 0 }}>
                  <table className={styles.cdsTable}>
                    <caption>Ứng dụng trong công nghệ sinh học &amp; bảo quản thực phẩm (SGK tr. 117–118)</caption>
                    <thead>
                      <tr>
                        <th scope="col">Ứng dụng</th>
                        <th scope="col">Cơ chế &amp; lưu ý khoa học</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">Đánh dấu phóng xạ (<Nuclide sym="P" a={32} z={15} />)</th>
                        <td>Bón phân có đồng vị phóng xạ β <Nuclide sym="P" a={32} z={15} /> và chụp ảnh phóng xạ cây tại các thời điểm cách đều nhau để nghiên cứu đường đi của phân bón, tối ưu chăm sóc cây trồng.</td>
                      </tr>
                      <tr>
                        <th scope="row">Gây đột biến tạo giống</th>
                        <td>Tạo giống mới kháng sâu bệnh, năng suất cao, quả trái mùa hoặc không hạt (tuy nhiên cần đánh giá kĩ tác động tới côn trùng và hệ sinh thái).</td>
                      </tr>
                      <tr>
                        <th scope="row">Chiếu xạ bảo quản (Hình 24.5–24.6)</th>
                        <td>Chùm tia năng lượng phù hợp đi xuyên qua diệt vi sinh vật gây hại giúp kéo dài thời hạn sử dụng thực phẩm mà <strong>không để lại chất phóng xạ trong thực phẩm</strong>.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Câu hỏi tự luận ngắn yêu cầu nêu bằng chứng cụ thể từ bài (lưu localStorage) */}
              <div
                style={{
                  border: "1px solid #8d8d8d",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <label
                  htmlFor="b24-food-essay"
                  style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}
                >
                  Câu hỏi lập luận có bằng chứng: Từ Hình 24.5 (so sánh mẫu a và mẫu b sau 7 ngày) và cơ chế chiếu xạ ngoài, em hãy nêu bằng chứng giải thích vì sao trái cây chiếu xạ vừa giữ tươi lâu hơn, vừa không làm người ăn bị nhiễm phóng xạ?
                </label>
                <textarea
                  id="b24-food-essay"
                  className={styles.evidenceTextarea}
                  rows={3}
                  value={foodEssay}
                  onChange={(e) => {
                    const val = e.target.value;
                    setB24FoodCheckedLocal(false);
                    patchNotebook((cur) => ({
                      ...cur,
                      inClassWork: {
                        ...cur.inClassWork,
                        b24FoodEvidenceEssay: val,
                        b24FoodChecked: false,
                      },
                    }));
                  }}
                  placeholder="Nêu rõ 2 ý: (1) Tác dụng của chùm bức xạ lên vi sinh vật/nấm mốc giữa mẫu (a) và (b) trên Hình 24.5; (2) Thực phẩm có tiếp xúc hay giữ lại nguồn phóng xạ không…"
                />
                <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={`${styles.cdsBtn} ${styles.cdsBtnPrimary} ${styles.cdsBtnSmall}`}
                    onClick={() => {
                      setB24FoodCheckedLocal(true);
                      patchNotebook((cur) => ({
                        ...cur,
                        inClassWork: { ...cur.inClassWork, b24FoodChecked: true },
                      }));
                      if (essayOk) onMarkSectionComplete(section.id, true);
                    }}
                  >
                    Lưu câu trả lời lập luận
                  </button>
                  {foodChecked && (
                    <span
                      role="status"
                      style={{ fontSize: "13.5px", fontWeight: 600, color: essayOk ? "#198038" : "#b42332" }}
                    >
                      {essayOk
                        ? "✓ Đã lưu lập luận! Điểm cốt lõi: chùm tia chỉ đi xuyên qua tiêu diệt vi sinh vật/nấm mốc tương tự tia X hay ánh sáng, thực phẩm hoàn toàn không trộn lẫn nguồn phóng xạ."
                        : "Em hãy viết đầy đủ hơn (ít nhất 1–2 câu nêu rõ cả tác dụng diệt vi sinh vật và việc không tiếp xúc nguồn phóng xạ)."}
                    </span>
                  )}
                </div>
              </div>

              <FixedPhysicsActivityRenderer
                activityKey="radiation_applications"
                onProgress={(done) => onMarkSectionComplete(section.id, done)}
              />
            </div>
          );
        })()}

      {section.kind === "b24_after_transfer" &&
        (() => {
          const b24AfterChoice = notebook.afterClassWork?.b24AfterChoice ?? "";
          return (
            <div style={{ border: "1px solid #d0d7de", padding: "16px", background: "#ffffff" }}>
              <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "14.5px" }}>
                Để ghi hình chức năng tuyến giáp từ bên ngoài cơ thể mà hạn chế tối đa liều chiếu cho bệnh nhân, dược chất phóng xạ đưa vào cơ thể cần thỏa mãn tiêu chí nào?
              </p>
              {[
                [
                  "correct",
                  "Phát tia có khả năng xuyên thoát ra ngoài cơ thể tới đầu thu (như tia γ hoặc positron tạo cặp γ) và có chu kì bán rã ngắn.",
                ],
                [
                  "alpha_long",
                  "Phát thuần tia α quãng đi cực ngắn và có chu kì bán rã hàng trăm năm.",
                ],
              ].map(([val, label]) => (
                <label key={val} style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "14px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="b24-after"
                    checked={b24AfterChoice === val}
                    onChange={() => {
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: { ...cur.afterClassWork, b24AfterChoice: val },
                      }));
                      if (val === "correct") onMarkSectionComplete(section.id, true);
                    }}
                  />
                  <span>{label}</span>
                </label>
              ))}
              {b24AfterChoice && (
                <p role="status" style={{ margin: "8px 0 0", fontWeight: 600, color: b24AfterChoice === "correct" ? "#198038" : "#b42332" }}>
                  {b24AfterChoice === "correct"
                    ? "✓ Chính xác! Tia γ thoát ra ngoài cơ thể để máy SPECT/PET ghi hình, còn chu kì bán rã ngắn giúp hoạt độ giảm nhanh sau khi chẩn đoán xong."
                    : "Chưa đúng. Tia α bị hấp thụ ngay trong mô nên máy thu bên ngoài không ghi hình được và còn gây tổn thương mô mạnh."}
                </p>
              )}
            </div>
          );
        })()}

      {/* ====================================================================
          BÀI 25 — BÀI TẬP VỀ VẬT LÍ HẠT NHÂN (HÌNH 25.1, BẢNG 25.1 & BÀI 6 TR. 122)
          ==================================================================== */}
      {section.kind === "b25_electroscope" &&
        (() => {
          const lockedB25Label = B25_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          const partRoles = notebook.preClassWork?.b25PartRoles ?? {};
          const matchedPartCount = B25_APPARATUS_PARTS.filter(
            (p) => partRoles[p.code] === p.correctRole
          ).length;
          const paperChoice = notebook.preClassWork?.b25PaperChoice ?? "";
          const b25SelfCheck = notebook.preClassWork?.selfCheckChoice ?? "";
          const b25SelfOpt = B25_PRE_SELF_CHECK_OPTIONS.find(
            (o) => o.id === b25SelfCheck
          );
          const checkB25PreReady = (
            nb: StudentLessonNotebook,
            rolesOv?: typeof partRoles,
            paperOv?: string,
            selfOv?: string
          ) => {
            const hasP = Boolean(
              (nb.initialPredictionChoice ?? nb.preClassPredictionChoice ?? "").trim()
            );
            const hasR = Boolean(
              (nb.initialPredictionReason ?? nb.preClassPredictionReason ?? "").trim()
            );
            const rMap = rolesOv ?? nb.preClassWork?.b25PartRoles ?? {};
            const partsOk = B25_APPARATUS_PARTS.every((p) => rMap[p.code] === p.correctRole);
            const pOk = (paperOv ?? nb.preClassWork?.b25PaperChoice ?? "") === "stop";
            const sc = selfOv ?? nb.preClassWork?.selfCheckChoice ?? "";
            return hasP && hasR && partsOk && pOk && sc === "both_signs_discharge";
          };
          const b25Ready = checkB25PreReady(notebook);

          return (
            <div>
              {/* Bước 1: Câu hỏi mở đầu bác bỏ giả thuyết sai */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 1 · Câu hỏi mở đầu từ bài tập ví dụ tĩnh điện kế (Hình 25.1 · SGK tr. 119–120)
                </h4>
                <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.6 }}>
                  Một tĩnh điện kế đã được tích điện nên kim điện kế <strong>(3)</strong> đang lệch một góc lớn. Khi nhấc mẫu phóng xạ <strong>(1)</strong> từ bình chì đưa lại gần đầu thu điện <strong>(2)</strong> (chưa chạm vào đầu thu điện), độ lệch của kim điện kế <strong>(3)</strong> giảm rất nhanh về vị trí <code>0</code> rồi dừng lại — hiện tượng xảy ra như nhau dù ban đầu tĩnh điện kế tích điện dương hay âm.
                </p>
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#edf5ff",
                    borderLeft: "4px solid #0f62fe",
                    fontSize: "14.5px",
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color: "#002d9c", display: "block", marginBottom: "4px" }}>
                    Câu hỏi mở đầu cần suy nghĩ:
                  </strong>
                  <em>
                    “Độ lệch kim giảm nhanh chứng tỏ tĩnh điện kế nhận thêm điện tích trái dấu hoặc mất bớt điện tích. Đó là do các hạt mang điện trái dấu từ mẫu (1) bay trực tiếp vào tích điện cho (2), hay do không khí quanh (2) đã biến đổi tính chất dẫn điện?”
                  </em>
                </div>
              </section>

              {/* Bước 2: Sơ đồ Hình 25.1 đúng bố cục SGK tr. 119 (chưa in chữ lộ đáp án trước Bước 3) */}
              <section style={{ marginBottom: "18px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "16px" }}>
                  Bước 2 · Quan sát Hình 25.1 SGK tr. 119 với đúng 3 kí hiệu (1), (2), (3)
                </h4>
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#fcf4d6",
                    border: "1px solid #f1c21b",
                    borderLeft: "4px solid #8e6a00",
                    marginBottom: "14px",
                    fontSize: "14px",
                    lineHeight: 1.55,
                  }}
                >
                  <strong>Chỉ dẫn quan sát trọng tâm (chưa lộ đáp án):</strong>{" "}
                  <em>
                    “Quan sát mẫu phóng xạ (1) được nhấc từ bình chì đưa lại gần đầu thu điện (2), khoảng không khí giữa (1) và (2), và chuyển động của kim điện kế (3) về vạch 0 (mà không lệch tăng trở lại về phía bên kia).”
                  </em>
                </div>

                <figure
                  style={{
                    margin: "0 0 14px",
                    border: "1px solid #d0d7de",
                    background: "#f8fafc",
                    padding: "14px",
                  }}
                >
                  <svg
                    viewBox="0 0 460 220"
                    width="460"
                    height="220"
                    role="img"
                    aria-label="Hình 25.1 SGK trang 119: Thí nghiệm đưa mẫu phóng xạ (1) nhấc từ bình chì bên phải lại gần đầu thu điện (2) của tĩnh điện kế bên trái làm kim điện kế (3) giảm nhanh độ lệch về vị trí 0"
                    style={{ width: "100%", maxWidth: "480px", height: "auto", display: "block", margin: "0 auto" }}
                  >
                    {/* Tĩnh điện kế ở bên trái đúng bố cục Hình 25.1 SGK tr. 119 */}
                    {/* (2) Đầu thu điện trên đỉnh tĩnh điện kế */}
                    <rect x="128" y="68" width="44" height="7" rx="3" fill="#da1e28" />
                    <line x1="150" y1="75" x2="150" y2="184" stroke="#b91c1c" strokeWidth="3.5" />
                    <text x="116" y="60" fontSize="13" fontWeight="700" fill="#161616">(2)</text>
                    <line x1="128" y1="62" x2="142" y2="68" stroke="#161616" strokeWidth="1.2" />

                    {/* Vỏ tròn tĩnh điện kế & chân đế */}
                    <circle cx="150" cy="138" r="50" fill="#ffffff" stroke="#0284c7" strokeWidth="3" />
                    <rect x="114" y="190" width="72" height="10" rx="2" fill="#94a3b8" />
                    <rect x="142" y="186" width="16" height="6" fill="#64748b" />

                    {/* (3) Kim điện kế đang giảm góc lệch về vị trí thẳng đứng 0 */}
                    <line x1="112" y1="108" x2="188" y2="168" stroke="#fca5a5" strokeWidth="2.4" strokeDasharray="4 3" />
                    <line x1="132" y1="96" x2="168" y2="180" stroke="#da1e28" strokeWidth="3.4" strokeLinecap="round" />
                    <circle cx="150" cy="138" r="4" fill="#161616" />
                    <path d="M 182 162 Q 176 172 168 176" fill="none" stroke="#0f62fe" strokeWidth="1.8" />
                    <text x="176" y="128" fontSize="13" fontWeight="700" fill="#161616">(3)</text>
                    <line x1="174" y1="130" x2="160" y2="140" stroke="#161616" strokeWidth="1.2" />

                    {/* Bình chì bảo vệ nguồn ở góc phải dưới + đường chấm nhấc mẫu (1) lên */}
                    <path d="M 358 156 L 368 156 L 368 148 L 384 148 L 384 156 L 394 156 L 398 198 L 354 198 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1.6" />
                    <polygon points="376,166 388,186 364,186" fill="#facc15" stroke="#161616" strokeWidth="1.2" />
                    <circle cx="376" cy="180" r="2.2" fill="#161616" />

                    {/* Quỹ đạo nhấc mẫu phóng xạ (1) từ bình chì đưa lại gần (2) */}
                    <path d="M 376 146 Q 368 48 228 56" fill="none" stroke="#64748b" strokeWidth="1.3" strokeDasharray="4 3" />
                    <path d="M 228 56 Q 194 60 176 70" fill="none" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 3" />

                    {/* Giá treo & (1) Mẫu phóng xạ màu đỏ phát bức xạ ra xung quanh */}
                    <rect x="216" y="18" width="24" height="7" fill="#94a3b8" />
                    <line x1="228" y1="25" x2="228" y2="54" stroke="#475569" strokeWidth="1.8" />
                    <circle cx="228" cy="56" r="8" fill="#fca5a5" opacity="0.55" />
                    <circle cx="228" cy="56" r="4.5" fill="#da1e28" />
                    <text x="248" y="42" fontSize="13" fontWeight="700" fill="#161616">(1)</text>
                    <line x1="246" y1="40" x2="230" y2="45" stroke="#161616" strokeWidth="1.2" />
                  </svg>
                  <figcaption style={{ fontSize: "13px", lineHeight: 1.5, marginTop: "8px", textAlign: "center" }}>
                    <strong>Hình 25.1 (SGK tr. 119) · Thí nghiệm đưa mẫu phóng xạ lại gần tĩnh điện kế:</strong> Hãy khóa dự đoán nguyên nhân ở Bước 3 và ghép đúng tên gọi <code>(1), (2), (3)</code> ở Bước 4!
                  </figcaption>
                </figure>

                {b21VideoLesson && (
                  <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "13.5px", lineHeight: 1.55 }}>
                      <strong>Tư liệu video bổ trợ Pha 1 Bài 25:</strong> Ôn tập phương pháp đọc hiện tượng và xử lí bảng số liệu phóng xạ.{" "}
                      <span style={{ color: "#002d9c", fontWeight: 600 }}>
                        Nếu chưa xem video, học sinh vẫn hoàn thành trọn vẹn Pha 1 từ Hình 25.1 ngay trên trang
                      </span>{" "}
                      (mở hoặc phát video không tự tính hoàn thành).
                    </p>
                    <NuclearLessonVideo lesson={b21VideoLesson} />
                  </div>
                )}
              </section>

              {/* Bước 3: Khóa dự đoán ban đầu + lí do */}
              <section
                style={{
                  border: "1px solid #8d8d8d",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 6px", fontSize: "16px" }}>
                  Bước 3 · Ghi và khóa dự đoán ban đầu kèm lí do
                </h4>
                {lockedB25Label && (
                  <div
                    style={{
                      marginBottom: "12px",
                      padding: "10px 12px",
                      background: "#fcf4d6",
                      borderLeft: "4px solid #8e6a00",
                      fontSize: "13.5px",
                    }}
                  >
                    <strong>Dự đoán ban đầu đã khóa:</strong> “{lockedB25Label}”
                    {lockedInitialReason ? <span> — <em>Lí do: {lockedInitialReason}</em></span> : null}
                  </div>
                )}
                <fieldset style={{ border: "none", margin: "0 0 12px", padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
                    Chọn giải thích dự đoán của em cho hiện tượng trên Hình 25.1:
                  </legend>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {B25_PREDICTION_CHOICES.map((opt) => (
                      <label
                        key={opt.id}
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                          padding: "10px 12px",
                          border: predChoice === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                          background: predChoice === opt.id ? "#edf5ff" : "#fafafa",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        <input
                          type="radio"
                          name="b25-pre-prediction"
                          checked={predChoice === opt.id}
                          onChange={() => {
                            setPredChoiceDraft(opt.id);
                            setPredSavedMsg("");
                          }}
                          style={{ marginTop: "3px" }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label htmlFor="b25-pre-reason" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                  Lí do cho dự đoán của em (bắt buộc):
                </label>
                <textarea
                  id="b25-pre-reason"
                  className={styles.evidenceTextarea}
                  rows={2}
                  value={predReason}
                  onChange={(e) => {
                    setPredReasonDraft(e.target.value);
                    setPredSavedMsg("");
                  }}
                  placeholder="Giải thích điều gì sẽ xảy ra với kim (3) sau khi về 0 nếu chỉ có hạt trái dấu bay thẳng vào tích điện cho (2)…"
                />
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "10px" }}>
                  <button
                    type="button"
                    className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                    onClick={() => {
                      if (!predChoice || !predReason.trim()) {
                        setPredSavedMsg("Em hãy chọn dự đoán và ghi rõ lí do trước khi lưu.");
                        return;
                      }
                      onSavePreClassPrediction(predChoice, predReason.trim());
                      const updated = recordPreClassPrediction(notebook, predChoice, predReason.trim());
                      if (checkB25PreReady(updated)) onMarkSectionComplete(section.id, true);
                      setPredSavedMsg("Đã lưu và khóa dự đoán ban đầu cho Bài 25.");
                    }}
                  >
                    Lưu dự đoán trước giờ học
                  </button>
                  {predSavedMsg && (
                    <span
                      role="status"
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 600,
                        color: predChoice && predReason.trim() ? "#198038" : "#b42332",
                      }}
                    >
                      {predSavedMsg}
                    </span>
                  )}
                </div>
              </section>

              {/* Bước 4: Nhận diện (1), (2), (3) & thử đặt tờ giấy chắn nguồn thuần α */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 4 · Thao tác nhận diện (1), (2), (3) ({matchedPartCount}/3 đúng) và thử chắn bằng tờ giấy
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                    marginBottom: "14px",
                  }}
                >
                  {B25_APPARATUS_PARTS.map((part) => {
                    const sel = partRoles[part.code] ?? "";
                    const ok = sel === part.correctRole;
                    return (
                      <div
                        key={part.code}
                        style={{
                          padding: "10px 12px",
                          border: sel ? (ok ? "1px solid #198038" : "1px solid #da1e28") : "1px solid #e0e0e0",
                          background: sel ? (ok ? "#defbe6" : "#fff1f1") : "#fafafa",
                        }}
                      >
                        <label
                          htmlFor={`b25-part-${part.code}`}
                          style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
                        >
                          {part.label}
                        </label>
                        <select
                          id={`b25-part-${part.code}`}
                          value={sel}
                          onChange={(e) => {
                            const val = e.target.value;
                            const nextRoles = { ...partRoles, [part.code]: val };
                            patchNotebook((cur) => ({
                              ...cur,
                              preClassWork: { ...cur.preClassWork, b25PartRoles: nextRoles },
                            }));
                            if (checkB25PreReady(notebook, nextRoles)) {
                              onMarkSectionComplete(section.id, true);
                            }
                          }}
                          style={{
                            width: "100%",
                            minHeight: "40px",
                            padding: "6px 8px",
                            border: "1px solid #8d8d8d",
                            background: "#ffffff",
                            fontSize: "13.5px",
                          }}
                        >
                          {B25_APPARATUS_ROLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "6px" }}>
                    Thử đặt một tờ giấy mỏng (~1 mm) chắn giữa mẫu phóng xạ thuần α (1) và đầu thu điện (2):
                  </legend>
                  {[
                    [
                      "stop",
                      "Kim (3) ngừng giảm nhanh vì tờ giấy chặn hầu hết hạt α, lớp không khí quanh đầu thu điện (2) không còn bị ion hóa mạnh.",
                    ],
                    [
                      "faster",
                      "Kim (3) tụt về 0 nhanh hơn vì tia α xuyên mạnh hơn qua giấy.",
                    ],
                  ].map(([val, label]) => (
                    <label key={val} style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "13.5px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="b25-paper-shield"
                        checked={paperChoice === val}
                        onChange={() => {
                          patchNotebook((cur) => ({
                            ...cur,
                            preClassWork: { ...cur.preClassWork, b25PaperChoice: val },
                          }));
                          if (checkB25PreReady(notebook, undefined, val)) {
                            onMarkSectionComplete(section.id, true);
                          }
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </fieldset>
              </section>

              {/* Bước 5: Phân tích bác bỏ trường hợp sai (SGK tr. 119–120) & Câu tự kiểm tra */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 5 · Lập luận loại trừ hai trường hợp theo SGK tr. 119–120 &amp; tự kiểm tra
                </h4>
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "10px 12px",
                    background: "#f8fafc",
                    border: "1px solid #d0d7de",
                    fontSize: "13.5px",
                    lineHeight: 1.6,
                  }}
                >
                  <strong>Phân tích hai trường hợp trong SGK tr. 119–120:</strong> Nếu điện tích của hạt trong tia phóng xạ trực tiếp trái dấu với điện tích trên tĩnh điện kế và bay vào tích cho nó, thì sau khi trung hòa điện về <code>0</code>, tĩnh điện kế sẽ <strong>tiếp tục tích điện trái dấu làm độ lệch kim (3) lại tăng dần lên</strong> — trái với hiện tượng thực tế! Do đó nguyên nhân chính là <strong>tia phóng xạ làm ion hóa không khí</strong> xung quanh, khiến không khí trở nên dẫn điện tốt và dẫn điện tích của tĩnh điện kế thoát ra môi trường làm kim về <code>0</code>.
                </div>
                <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>
                    Bằng chứng nào bác bỏ giả thuyết sai “chỉ có một loại hạt mang điện trái dấu từ mẫu (1) bay vào tích điện cho đầu thu (2)”?
                  </legend>
                  {B25_PRE_SELF_CHECK_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-start",
                        padding: "10px 12px",
                        marginBottom: "8px",
                        border: b25SelfCheck === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                        background: b25SelfCheck === opt.id ? "#edf5ff" : "#fafafa",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      <input
                        type="radio"
                        name="b25-pre-selfcheck"
                        checked={b25SelfCheck === opt.id}
                        onChange={() => {
                          patchNotebook((cur) => ({
                            ...cur,
                            preClassWork: { ...cur.preClassWork, selfCheckChoice: opt.id },
                          }));
                          if (checkB25PreReady(notebook, undefined, undefined, opt.id)) {
                            onMarkSectionComplete(section.id, true);
                          }
                        }}
                        style={{ marginTop: "3px" }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </fieldset>
                {b25SelfOpt && (
                  <div
                    role="status"
                    style={{
                      marginTop: "8px",
                      padding: "10px 14px",
                      background: b25SelfOpt.id === "both_signs_discharge" ? "#defbe6" : "#fff1f1",
                      borderLeft:
                        b25SelfOpt.id === "both_signs_discharge"
                          ? "4px solid #198038"
                          : "4px solid #b42332",
                      fontSize: "13.5px",
                      lineHeight: 1.55,
                    }}
                  >
                    {b25SelfOpt.feedback}
                  </div>
                )}
              </section>

              {showTeacherSolutions && (
                <div
                  data-testid="b25-teacher-solution-electroscope"
                  style={{
                    marginBottom: "18px",
                    padding: "14px 16px",
                    background: "#fffdf5",
                    border: "1px solid #d2a106",
                    borderLeft: "4px solid #8e6a00",
                    fontSize: "13.5px",
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ display: "block", color: "#5e4600", marginBottom: "4px" }}>
                    Hướng dẫn giải &amp; Đáp án chi tiết cho Giáo viên · Bài tập ví dụ 1 (Hình 25.1 SGK tr. 119–120)
                  </strong>
                  Xét hai khả năng: (1) Tia phóng xạ từ mẫu <strong>(1)</strong> làm <strong>ion hóa không khí</strong> xung quanh khiến không khí dẫn điện tốt hơn, điện tích từ đầu thu <strong>(2)</strong> thoát ra môi trường nên kim <strong>(3)</strong> dịch nhanh về <code>0</code> và dừng ở <code>0</code>; (2) Nếu do hạt mang điện trái dấu từ tia phóng xạ tích trực tiếp vào tĩnh điện kế, nó sẽ trung hòa điện rồi lại tích điện trái dấu khiến kim giảm về <code>0</code> sau đó <em>tăng dần lên lại</em> (trái thực tế) — hơn nữa hiện tượng giảm về <code>0</code> xảy ra với cả hai dấu điện tích ban đầu của tĩnh điện kế.
                </div>
              )}

              {/* Bước 6: Sản phẩm mang vào lớp */}
              <section style={{ border: "2px solid #0f62fe", background: "#edf5ff", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "#002d9c" }}>
                    Sản phẩm mang vào lớp · Bài 25
                  </h4>
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      background: b25Ready ? "#defbe6" : "#fcf4d6",
                      color: b25Ready ? "#198038" : "#8e6a00",
                    }}
                  >
                    {b25Ready
                      ? "✓ Đã hoàn thành Pha 1 Bài 25"
                      : "Cần đủ: Dự đoán + lí do, 3/3 kí hiệu Hình 25.1, tờ giấy chắn và câu tự kiểm tra"}
                  </span>
                </div>
                <ul style={{ margin: "0 0 12px", paddingLeft: "18px", fontSize: "14px", lineHeight: 1.6 }}>
                  <li>
                    <strong>Dự đoán ban đầu:</strong> {lockedB25Label ? `“${lockedB25Label}”` : "Chưa lưu"}
                  </li>
                  <li>
                    <strong>Nhận diện Hình 25.1:</strong> {matchedPartCount}/3 kí hiệu (1), (2), (3) đúng.
                  </li>
                </ul>
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                  onClick={() => onJumpToSection("b25-table-25-1")}
                >
                  Chuyển sang Pha 2: Bảng 25.1 &amp; ước lượng T →
                </button>
              </section>
            </div>
          );
        })()}

      {section.kind === "b25_table_25_1" &&
        (() => {
          const lockedB25Label = B25_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          const partRoles = notebook.preClassWork?.b25PartRoles ?? {};
          const matchedPartCount = B25_APPARATUS_PARTS.filter(
            (p) => partRoles[p.code] === p.correctRole
          ).length;

          const halfInput = notebook.inClassWork?.b25HalfH0Input ?? "";
          const bracketChoice = notebook.inClassWork?.b25BracketChoice ?? "";
          const estTInput = notebook.inClassWork?.b25EstimatedTInput ?? "";
          const estNote = notebook.inClassWork?.b25EstimateMethodNote ?? "";
          const tableChecked = Boolean(notebook.inClassWork?.b25TableChecked) || b25TableCheckedLocal;

          const parsedHalf = Number(halfInput.trim().replace(",", ".").replace(/\s*bq$/i, ""));
          const halfOk = Number.isFinite(parsedHalf) && Math.abs(parsedHalf - 75.5) <= 0.2;
          const bracketOk = bracketChoice === "30_60";
          const parsedT = Number(estTInput.trim().replace(",", ".").replace(/\s*s$/i, ""));
          const tOk = Number.isFinite(parsedT) && parsedT >= 38 && parsedT <= 46;
          const noteOk = estNote.trim().length >= 10;
          const allB25TableOk = halfOk && bracketOk && tOk && noteOk;

          return (
            <div>
              <Phase2ProductEchoCard
                preSectionId="b25-electroscope"
                lockedChoiceLabel={lockedB25Label}
                lockedReason={lockedInitialReason}
                actionSummary={`Đã nhận diện ${matchedPartCount}/3 bộ phận Hình 25.1 và cơ chế ion hóa không khí`}
                bringQuestion={bringToClassQuestion}
                onJumpToSection={onJumpToSection}
              />

              <p style={{ margin: "0 0 10px", fontSize: "14.5px", lineHeight: 1.55 }}>
                <strong>Bài 2 · Bảng 25.1 (SGK Vật lí 12, trang 121):</strong> Người ta đo độ phóng xạ{" "}
                <code>H</code> (đơn vị <code>Bq</code>) của một đồng vị theo thời gian{" "}
                <code>t</code> (đơn vị <code>s</code>) và điền kết quả vào Bảng 25.1. Hãy quan sát 8 cặp dữ liệu gốc dưới đây để: <em>a) Vẽ/đối chiếu đồ thị độ phóng xạ theo thời gian</em> và <em>b) Ước lượng chu kì bán rã T của đồng vị này</em>:
              </p>

              <div
                style={{
                  padding: "10px 12px",
                  background: "#f4f4f4",
                  border: "1px solid #e0e0e0",
                  borderBottom: "none",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#161616",
                }}
              >
                Bảng 25.1. Độ phóng xạ theo thời gian (SGK tr. 121 — dữ liệu gốc thực nghiệm)
              </div>
              <div className={styles.tableScroll} style={{ marginTop: 0 }} data-testid="b25-table-scroll">
                <table className={styles.cdsTable} aria-label="Bảng 25.1 Độ phóng xạ theo thời gian SGK trang 121">
                  <thead>
                    <tr>
                      <th scope="col" className={styles.numCell}>t(s)</th>
                      <th scope="col" className={styles.numCell}>H (Bq)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SGK_TABLE_25_1.map(({ t, h }) => {
                      const highlightTeacher = showTeacherSolutions && (t === 30 || t === 60);
                      return (
                        <tr
                          key={t}
                          style={highlightTeacher ? { background: "#edf5ff", fontWeight: 600 } : undefined}
                        >
                          <th scope="row" className={styles.numCell}>
                            {t}
                          </th>
                          <td className={styles.numCell}>{h}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phiếu học sinh tự ước lượng T trước (tách rõ dữ liệu gốc vs giá trị học sinh ước lượng vs lời giải mẫu GV) */}
              <div
                style={{
                  border: "1px solid #8d8d8d",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 10px", fontSize: "15.5px" }}>
                  Phiếu tự ước lượng chu kì bán rã T từ Bảng 25.1 (lưu vào sổ học tập)
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                    1. Một nửa độ phóng xạ ban đầu <code>H₀ / 2</code> (đơn vị <code>Bq</code>):
                    <input
                      type="text"
                      inputMode="decimal"
                      value={halfInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setB25TableCheckedLocal(false);
                        patchNotebook((cur) => ({
                          ...cur,
                          inClassWork: { ...cur.inClassWork, b25HalfH0Input: val, b25TableChecked: false },
                        }));
                      }}
                      placeholder="Tính từ H₀ tại t = 0 s…"
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: "6px",
                        minHeight: "40px",
                        padding: "6px 10px",
                        border: "1px solid #8d8d8d",
                        fontSize: "14px",
                      }}
                    />
                  </label>

                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                    2. Khoảng hai mốc thời gian kẹp giá trị <code>H₀ / 2</code>:
                    <select
                      value={bracketChoice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setB25TableCheckedLocal(false);
                        patchNotebook((cur) => ({
                          ...cur,
                          inClassWork: { ...cur.inClassWork, b25BracketChoice: val, b25TableChecked: false },
                        }));
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: "6px",
                        minHeight: "40px",
                        padding: "6px 8px",
                        border: "1px solid #8d8d8d",
                        background: "#ffffff",
                        fontSize: "14px",
                      }}
                    >
                      <option value="">— Chọn khoảng kẹp trên Bảng 25.1 —</option>
                      <option value="0_30">Giữa 0 s và 30 s</option>
                      <option value="30_60">Giữa 30 s và 60 s</option>
                      <option value="60_120">Giữa 60 s và 120 s</option>
                      <option value="120_180">Giữa 120 s và 180 s</option>
                    </select>
                  </label>

                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                    3. Giá trị ước lượng chu kì bán rã <code>T</code> của em (đơn vị <code>s</code>):
                    <input
                      type="text"
                      inputMode="decimal"
                      value={estTInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setB25TableCheckedLocal(false);
                        patchNotebook((cur) => ({
                          ...cur,
                          inClassWork: { ...cur.inClassWork, b25EstimatedTInput: val, b25TableChecked: false },
                        }));
                      }}
                      placeholder="Nhập số giây em ước lượng…"
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: "6px",
                        minHeight: "40px",
                        padding: "6px 10px",
                        border: "1px solid #8d8d8d",
                        fontSize: "14px",
                      }}
                    />
                  </label>
                </div>

                <label
                  htmlFor="b25-estimate-note"
                  style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
                >
                  4. Giải thích ngắn gọn cách em ước lượng <code>T</code> từ bảng hoặc đồ thị (và vì sao đây là ước lượng gần đúng):
                </label>
                <textarea
                  id="b25-estimate-note"
                  className={styles.evidenceTextarea}
                  rows={2}
                  value={estNote}
                  onChange={(e) => {
                    const val = e.target.value;
                    setB25TableCheckedLocal(false);
                    patchNotebook((cur) => ({
                      ...cur,
                      inClassWork: { ...cur.inClassWork, b25EstimateMethodNote: val, b25TableChecked: false },
                    }));
                  }}
                  placeholder="Nêu cách em đối chiếu mức H₀/2 với hai mốc thời gian kẹp trên bảng hoặc đường cong…"
                />

                <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={`${styles.cdsBtn} ${styles.cdsBtnPrimary} ${styles.cdsBtnSmall}`}
                    onClick={() => {
                      setB25TableCheckedLocal(true);
                      patchNotebook((cur) => ({
                        ...cur,
                        inClassWork: { ...cur.inClassWork, b25TableChecked: true },
                      }));
                      onMarkSectionComplete(section.id, allB25TableOk);
                    }}
                  >
                    Kiểm tra ước lượng của em
                  </button>
                  {tableChecked && (
                    <span
                      role="status"
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 600,
                        color: allB25TableOk ? "#198038" : "#b42332",
                      }}
                    >
                      {allB25TableOk
                        ? "✓ Hợp lí! Một nửa độ phóng xạ ban đầu nằm trong khoảng 30 s – 60 s (gần mốc 30 s hơn mốc 60 s) và giá trị ước lượng T của em khớp tốt với dữ liệu thực nghiệm."
                        : `Cần điều chỉnh: ${
                            !halfOk ? "Tính lại H₀/2 từ giá trị H₀ tại t = 0 s trên Bảng 25.1. " : ""
                          }${
                            bracketChoice === ""
                              ? "Em chưa chọn khoảng hai mốc thời gian kẹp H₀/2. "
                              : !bracketOk
                                ? "Khoảng kẹp đã chọn chưa chứa mức H₀/2 (hãy so sánh H tại hai đầu khoảng với H₀/2). "
                                : ""
                          }${
                            !tOk ? "Giá trị ước lượng T chưa nằm hợp lí gần giao điểm mức H₀/2 với đường cong. " : ""
                          }${!noteOk ? "Hãy ghi ngắn gọn cách ước lượng (ít nhất 1 câu)." : ""}`}
                    </span>
                  )}
                </div>
              </div>

              {showTeacherSolutions && (
                <div
                  data-testid="b25-teacher-solution-table"
                  style={{
                    marginBottom: "18px",
                    padding: "14px 16px",
                    background: "#fffdf5",
                    border: "1px solid #d2a106",
                    borderLeft: "4px solid #8e6a00",
                    fontSize: "13.5px",
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ display: "block", color: "#5e4600", marginBottom: "4px" }}>
                    Hướng dẫn giải &amp; Đáp án mẫu tham khảo cho Giáo viên · Bài 2 Bảng 25.1 (SGK tr. 121)
                  </strong>
                  Độ phóng xạ ban đầu tại <code>t = 0 s</code> là <code>H₀ = 151 Bq</code> ⇒{" "}
                  <code>H₀ / 2 = 75,5 Bq</code>. Trên Bảng 25.1, <code>75,5 Bq</code> nằm giữa hai cặp dữ liệu gốc{" "}
                  <strong>(30 s; 85 Bq)</strong> và <strong>(60 s; 55 Bq)</strong>. Nội suy tuyến tính đoạn đầu cho{" "}
                  <code>T ≈ 30 + (85 − 75,5)/(85 − 55) × 30 = 39,5 s</code>; nếu vẽ đường cong hàm mũ trơn qua toàn bộ 8 điểm đo (có thăng giáng thống kê ở vùng độ phóng xạ thấp) thì thu được ước lượng <code>T ≈ 40 – 45 s</code>.
                </div>
              )}

              <h4 style={{ margin: "20px 0 10px", fontSize: "16px" }}>
                Đồ thị độ phóng xạ tương tác &amp; truy ngược từng điểm về dòng Bảng 25.1
              </h4>
              <FixedPhysicsActivityRenderer
                activityKey="nuclear_physics_practice_lab"
                onProgress={(done) => onMarkSectionComplete(section.id, done)}
              />
            </div>
          );
        })()}

      {section.kind === "b25_equations_energy" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {showTeacherSolutions && (
            <div
              data-testid="b25-teacher-solution-equations"
              style={{
                padding: "14px 16px",
                background: "#fffdf5",
                border: "1px solid #d2a106",
                borderLeft: "4px solid #8e6a00",
                fontSize: "13.5px",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ display: "block", color: "#5e4600", marginBottom: "4px" }}>
                Hướng dẫn giải &amp; Lưu ý chấm bài cho Giáo viên · Phương trình &amp; Eₗₖ, Eₗₖᵣ
              </strong>
              Phần A: Kiểm tra tổng số khối <code>ΣA</code> và tổng điện tích <code>ΣZ</code> hai vế (ví dụ Bài tập ví dụ 2 SGK tr. 120: <code>²³⁵₉₂U + ¹₀n → ¹⁴⁰₅₈Ce + ⁹⁴₄₀Zr + 2·¹₀n + 6·⁰₋₁e</code>). Phần B: Áp dụng thống nhất công thức độ hụt khối{" "}
              <code>Δm = [Z·m_p + (A − Z)·m_n] − m_X</code>,{" "}
              <code>Eₗₖ = Δm · 931,5 (MeV)</code> và <code>Eₗₖᵣ = Eₗₖ / A (MeV/nucleon)</code>.
            </div>
          )}

          <div>
            <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
              Phần A · Viết và cân bằng phương trình phản ứng &amp; phân rã α, β⁻, β⁺
            </h4>
            <NuclearEquationBalancer
              onSubDone={(done) => {
                setB25EqDone(done);
                onMarkSectionComplete(section.id, done && b25BindDone);
              }}
            />
          </div>
          <div>
            <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
              Phần B · Tính độ hụt khối Δm, năng lượng liên kết Eₗₖ và năng lượng liên kết riêng Eₗₖᵣ = Eₗₖ / A
            </h4>
            <BindingEnergyCalculator
              onSubDone={(done) => {
                setB25BindDone(done);
                onMarkSectionComplete(section.id, b25EqDone && done);
              }}
            />
          </div>
        </div>
      )}

      {section.kind === "b25_after_transfer" &&
        (() => {
          const b25AfterDays = notebook.afterClassWork?.b25AfterDays ?? "";
          const b25F18Particle = notebook.afterClassWork?.b25F18ParticleChoice ?? "";
          const b25F18Who = notebook.afterClassWork?.b25F18MoreWho ?? "";
          const b25F18PctRaw =
            notebook.afterClassWork?.b25F18PercentInput ?? "";
          const legacyRatioRaw =
            notebook.afterClassWork?.b25F18RatioInput ?? "";
          const b25Checked = Boolean(notebook.afterClassWork?.b25AfterChecked) || b25AfterCheckedLocal;

          const daysOk = Number(b25AfterDays.trim().replace(",", ".")) === 24;
          const particleOk = b25F18Particle === "proton";
          const whoOk = b25F18Who === "later";
          const cleanedPct = b25F18PctRaw.trim().replace("%", "").replace(",", ".");
          const parsedPct = cleanedPct === "" ? NaN : Number(cleanedPct);
          const enteredRatioInsteadOfPct =
            Number.isFinite(parsedPct) && Math.abs(parsedPct - 1.46) <= 0.04;
          const pctOk =
            Number.isFinite(parsedPct) && parsedPct >= 45 && parsedPct <= 46.5;
          const legacyRatioOk =
            b25F18PctRaw === "" &&
            b25F18Particle === "" &&
            b25F18Who === "" &&
            legacyRatioRaw !== "" &&
            Math.abs(Number(legacyRatioRaw.trim().replace(",", ".")) - 1.46) <= 0.03;

          const allB25AfterOk =
            daysOk && ((particleOk && whoOk && pctOk) || legacyRatioOk);

          return (
            <div style={{ border: "1px solid #d0d7de", padding: "16px", background: "#ffffff" }}>
              <h4 style={{ margin: "0 0 10px", fontSize: "16px" }}>
                Kiểm tra, đánh giá Pha 3: Bài toán y học hạt nhân (<Nuclide sym="I" a={131} z={53} /> &amp; Bài 6 SGK tr. 122 <Nuclide sym="F" a={18} z={9} />-FDG)
              </h4>

              {/* Câu 1: I-131 */}
              <div style={{ marginBottom: "16px", paddingBottom: "14px", borderBottom: "1px solid #e0e0e0" }}>
                <p style={{ margin: "0 0 8px", fontSize: "14.5px", lineHeight: 1.6 }}>
                  <strong>Câu 1 (<Nuclide sym="I" a={131} z={53} />):</strong> Đồng vị{" "}
                  <Nuclide sym="I" a={131} z={53} /> có chu kì bán rã <code>T = 8,0 ngày</code>. Một mẫu mới điều chế có độ phóng xạ ban đầu <code>H₀ = 400 MBq</code>. Hỏi sau bao nhiêu ngày thì độ phóng xạ của mẫu giảm xuống còn <code>50 MBq</code>?
                </p>
                <label style={{ fontSize: "13.5px", fontWeight: 700, display: "block" }}>
                  Thời gian cần tìm t (ngày):
                  <input
                    type="number"
                    inputMode="decimal"
                    value={b25AfterDays}
                    onChange={(e) => {
                      const val = e.target.value;
                      setB25AfterCheckedLocal(false);
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: {
                          ...cur.afterClassWork,
                          b25AfterDays: val,
                          b25AfterChecked: false,
                        },
                      }));
                    }}
                    placeholder="Nhập số ngày…"
                    style={{
                      display: "block",
                      width: "100%",
                      maxWidth: "260px",
                      marginTop: "6px",
                      minHeight: "42px",
                      padding: "8px 12px",
                      border: "1px solid #8d8d8d",
                      fontSize: "15px",
                    }}
                  />
                </label>
              </div>

              {/* Câu 2: Đúng nguyên văn Bài 6a & 6b SGK tr. 122 (18F-FDG chụp PET) */}
              <div style={{ marginBottom: "16px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "14.5px", lineHeight: 1.6 }}>
                  <strong>Câu 2 (Bài 6 · SGK tr. 122 · Dược chất phóng xạ FDG chứa <Nuclide sym="F" a={18} z={9} /> chụp cắt lớp PET):</strong>{" "}
                  Đồng vị <Nuclide sym="F" a={18} z={9} /> có chu kì bán rã <code>T = 110 phút</code>, được sản xuất bằng cách bắn phá các hạt đồng vị{" "}
                  <Nuclide sym="O" a={18} z={8} /> nhờ một loại hạt được tăng tốc bằng máy gia tốc (Hình 25.4).
                </p>

                <fieldset style={{ border: "none", padding: 0, margin: "0 0 12px" }}>
                  <legend style={{ fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                    6a) Xác định loại hạt được tăng tốc trong máy gia tốc biết rằng ngoài <Nuclide sym="F" a={18} z={9} />, sản phẩm bắn phá còn có 1 neutron (<Nuclide sym="n" a={1} z={0} />) và phát xạ tia gamma (γ):
                  </legend>
                  {[
                    ["proton", "Hạt proton (¹₁p hay ¹₁H)"],
                    ["alpha", "Hạt alpha (⁴₂He)"],
                    ["neutron", "Hạt neutron (¹₀n)"],
                  ].map(([val, label]) => (
                    <label key={val} style={{ display: "flex", gap: "8px", marginBottom: "6px", fontSize: "14px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="b25-f18-particle"
                        checked={b25F18Particle === val}
                        onChange={() => {
                          setB25AfterCheckedLocal(false);
                          patchNotebook((cur) => ({
                            ...cur,
                            afterClassWork: {
                              ...cur.afterClassWork,
                              b25F18ParticleChoice: val,
                              b25AfterChecked: false,
                            },
                          }));
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </fieldset>

                <p style={{ margin: "0 0 8px", fontSize: "14px", lineHeight: 1.6 }}>
                  <strong>6b)</strong> Trước khi chụp ảnh cắt lớp PET, bệnh nhân được tiêm liều lượng dược chất FDG để đảm bảo <strong>độ phóng xạ trên mỗi kg cân nặng tại thời điểm tiêm là <code>0,1 mCi</code> không đổi</strong>. Hai bệnh nhân cùng cân nặng, cùng sử dụng FDG trong <strong>cùng một đợt sản xuất</strong>, nhưng được tiêm ở <strong>2 thời điểm cách nhau <code>60 phút</code></strong>.
                </p>

                <fieldset style={{ border: "none", padding: 0, margin: "0 0 10px" }}>
                  <legend style={{ fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                    • Người nào sẽ được tiêm lượng FDG nhiều hơn?
                  </legend>
                  {[
                    ["later", "Người được tiêm ở thời điểm sau (muộn hơn 60 phút)"],
                    ["earlier", "Người được tiêm ở thời điểm trước"],
                    ["equal", "Hai người được tiêm lượng FDG bằng nhau"],
                  ].map(([val, label]) => (
                    <label key={val} style={{ display: "flex", gap: "8px", marginBottom: "6px", fontSize: "14px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="b25-f18-who"
                        checked={b25F18Who === val}
                        onChange={() => {
                          setB25AfterCheckedLocal(false);
                          patchNotebook((cur) => ({
                            ...cur,
                            afterClassWork: {
                              ...cur.afterClassWork,
                              b25F18MoreWho: val,
                              b25AfterChecked: false,
                            },
                          }));
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </fieldset>

                <label style={{ fontSize: "13.5px", fontWeight: 700, display: "block" }}>
                  • Xác định phần trăm lượng FDG nhiều hơn này cần được tiêm (đơn vị <code>%</code>, làm tròn đến hàng đơn vị hoặc 1 chữ số thập phân):
                  <input
                    type="text"
                    inputMode="decimal"
                    value={b25F18PctRaw}
                    onChange={(e) => {
                      const val = e.target.value;
                      setB25AfterCheckedLocal(false);
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: {
                          ...cur.afterClassWork,
                          b25F18PercentInput: val,
                          b25AfterChecked: false,
                        },
                      }));
                    }}
                    placeholder="Nhập phần trăm (%), ví dụ từ (2^(60/110) − 1) × 100%…"
                    style={{
                      display: "block",
                      width: "100%",
                      maxWidth: "340px",
                      marginTop: "6px",
                      minHeight: "42px",
                      padding: "8px 12px",
                      border: "1px solid #8d8d8d",
                      fontSize: "15px",
                    }}
                  />
                </label>
              </div>

              <button
                type="button"
                className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                onClick={() => {
                  setB25AfterCheckedLocal(true);
                  patchNotebook((cur) => ({
                    ...cur,
                    afterClassWork: { ...cur.afterClassWork, b25AfterChecked: true },
                  }));
                  onMarkSectionComplete(section.id, allB25AfterOk);
                }}
              >
                Kiểm tra kết quả Pha 3
              </button>

              {b25Checked && (
                <p
                  role="status"
                  style={{
                    margin: "12px 0 0",
                    fontWeight: 600,
                    color: allB25AfterOk ? "#198038" : "#b42332",
                    lineHeight: 1.55,
                  }}
                >
                  {allB25AfterOk
                    ? "✓ Hoàn thành xuất sắc! Câu 1: t = 3 × 8,0 = 24 ngày; Câu 2a: hạt proton ¹₁p (¹⁸₈O + ¹₁p → ¹⁸₉F + ¹₀n + γ); Câu 2b: người tiêm sau 60 phút cần tiêm lượng FDG nhiều hơn (2^(60/110) − 1) × 100% ≈ 45,9% ≈ 46%."
                    : `Kiểm tra lại: ${
                        !daysOk ? "Câu 1 lập tỉ số H/H₀ = 50/400 = 1/8 = 2⁻³ để tìm t. " : ""
                      }${
                        !particleOk ? "Câu 6a bảo toàn A (A_X + 18 = 18 + 1) và Z (Z_X + 8 = 9 + 0). " : ""
                      }${
                        !whoOk ? "Câu 6b sau 60 phút đồng vị ¹⁸F trong lọ đã phân rã bớt nên người tiêm sau cần thể tích/lượng FDG lớn hơn để đạt cùng 0,1 mCi/kg. " : ""
                      }${
                        enteredRatioInsteadOfPct
                          ? "1,46 là tỉ số gấp bao nhiêu lần (m₂/m₁ ≈ 1,46); đề bài hỏi PHẦN TRĂM nhiều hơn nên em hãy lấy (1,46 − 1) × 100% ≈ 46%! "
                          : !pctOk
                            ? "Tính tỉ số lượng FDG m₂/m₁ = 2^(60/110) rồi đổi ra phần trăm tăng thêm ((m₂ − m₁)/m₁ × 100%)."
                            : ""
                      }`}
                </p>
              )}

              {showTeacherSolutions && (
                <div
                  data-testid="b25-teacher-solution-after"
                  style={{
                    marginTop: "14px",
                    padding: "14px 16px",
                    background: "#fffdf5",
                    border: "1px solid #d2a106",
                    borderLeft: "4px solid #8e6a00",
                    fontSize: "13.5px",
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ display: "block", color: "#5e4600", marginBottom: "4px" }}>
                    Hướng dẫn giải &amp; Đáp án chi tiết cho Giáo viên · ¹³¹I &amp; Bài 6 SGK tr. 122 (¹⁸F-FDG)
                  </strong>
                  <div>
                    • <strong>Câu 1 (¹³¹I):</strong>{" "}
                    <code>H / H₀ = 50 / 400 = 1/8 = 2^(−3) ⇒ t = 3T = 3 × 8,0 = 24 ngày</code>.
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    • <strong>Bài 6a (SGK tr. 122):</strong> Phương trình{" "}
                    <code>ᴬ_Z X + ¹⁸₈O → ¹⁸₉F + ¹₀n + γ</code> ⇒ <code>A = 1, Z = 1</code>: hạt được tăng tốc là <strong>proton (¹₁p hay ¹₁H)</strong>.
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    • <strong>Bài 6b (SGK tr. 122 — không gán cứng thời điểm tiêm người 1 bằng 0):</strong> Chọn mốc <code>t = 0</code> là lúc hoàn tất đợt sản xuất FDG (hoạt độ riêng ban đầu là <code>a₀</code> trên một đơn vị lượng FDG). Giả sử bệnh nhân 1 tiêm tại thời điểm <code>t₁ ≥ 0</code> với lượng FDG là <code>m₁</code> và bệnh nhân 2 (cùng cân nặng) tiêm tại <code>t₂ = t₁ + 60</code> (phút) với lượng FDG là <code>m₂</code>. Để độ phóng xạ ngay lúc tiêm của hai người bằng nhau (<code>0,1 mCi/kg</code>):{" "}
                    <code>m₁ · a₀ · 2^(−t₁/110) = m₂ · a₀ · 2^(−(t₁ + 60)/110)</code> ⇒{" "}
                    <code>m₂ / m₁ = 2^(60/110) = 2^(6/11) ≈ 1,459</code>. Vậy <strong>người tiêm sau 60 phút được tiêm lượng FDG nhiều hơn</strong>, và phần trăm lượng FDG nhiều hơn cần tiêm là{" "}
                    <code>((m₂ − m₁) / m₁) × 100% = (2^(6/11) − 1) × 100% ≈ 45,9% ≈ 46%</code>.
                  </div>
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
}
