import test from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_PHASE2_ACTIVITY_KEYS } from "@/lib/curriculum";
import { validateTeachingPlan } from "@/lib/teaching-plan";
import {
  CHAPTER4_LESSONS,
  CHAPTER4_PHASES,
  EMPTY_STUDENT_NOTEBOOK,
  SGK_B21_MASS_CONSTANTS,
  SGK_TABLE_21_1,
  SGK_TABLE_23_1,
  convertLessonDraftToTeachingPlan,
  createDraftFromSample,
  getChapter4Lesson,
  isVerifiedVideoUrl,
  recordPreClassPrediction,
  resolveLessonWithDraft,
} from "@/lib/chapter4-lessons";

test("CHAPTER4_LESSONS trình bày đủ 5 bài theo đúng thứ tự SGK B21–B25 và đủ 3 pha", () => {
  assert.deepEqual(
    CHAPTER4_LESSONS.map((l) => l.code),
    ["B21", "B22", "B23", "B24", "B25"]
  );
  assert.deepEqual(
    CHAPTER4_LESSONS.map((l) => l.number),
    [21, 22, 23, 24, 25]
  );

  for (const lesson of CHAPTER4_LESSONS) {
    assert.ok(lesson.title.length > 0);
    assert.ok(lesson.guidingQuestion.length > 0);
    for (const phase of CHAPTER4_PHASES) {
      const inPhase = lesson.sections.filter((s) => s.phase === phase.id);
      assert.ok(
        inPhase.length >= 1,
        `Bài ${lesson.code} phải có ít nhất 1 mục trong pha ${phase.id}`
      );
    }
  }
});

test("Bài 21 có đúng tiêu đề, câu hỏi mở đầu, 6 mục và thời lượng trên lớp đúng 45 phút [15, 10, 10, 10]", () => {
  const b21 = getChapter4Lesson("B21");
  assert.equal(b21.title, "Cấu trúc hạt nhân");
  assert.equal(
    b21.guidingQuestion,
    "Từ những đốm sáng trên màn, làm sao biết nguyên tử có một hạt nhân rất nhỏ?"
  );
  assert.ok(b21.lessonGoals?.knowledge.length);
  assert.ok(b21.lessonGoals?.competence.length);
  assert.ok(b21.lessonGoals?.quality.length);

  const ids = b21.sections.map((s) => s.id);
  assert.deepEqual(ids, [
    "b21-pre-setup",
    "b21-rutherford-v3",
    "b21-atomic-models",
    "b21-structure-size",
    "b21-symbol-isotopes",
    "b21-after-transfer",
  ]);
  assert.ok(
    b21.sections.some((s) => s.title.includes("Kiểm tra, đánh giá")),
    "Bài 21 có mục Kiểm tra, đánh giá ở pha Sau giờ học"
  );

  const beforeSecs = b21.sections.filter((s) => s.phase === "before");
  const inClassSecs = b21.sections.filter((s) => s.phase === "in_class");
  const afterSecs = b21.sections.filter((s) => s.phase === "after");

  assert.deepEqual(beforeSecs.map((s) => s.minutes), [15]);
  assert.deepEqual(inClassSecs.map((s) => s.minutes), [15, 10, 10, 10]);
  assert.equal(
    inClassSecs.reduce((sum, s) => sum + s.minutes, 0),
    45,
    "Tổng thời lượng Trong giờ học của Bài 21 phải đúng 45 phút (1 tiết)"
  );
  assert.deepEqual(afterSecs.map((s) => s.minutes), [15]);
});

test("Bảng 21.1 và hằng số khối lượng Bài 21 khớp chính xác 100% SGK tr. 93–94 (đủ 8 nguyên tố)", () => {
  assert.equal(SGK_TABLE_21_1.length, 8);
  assert.deepEqual(
    SGK_TABLE_21_1.map((r) => [
      r.elementName,
      r.massNumberA,
      r.atomicRadius10m10,
      r.nuclearRadius10m15,
    ]),
    [
      ["Hydrogen", 1, "1,2", "0,9"],
      ["Helium", 4, "1,4", "1,7"],
      ["Oxigen", 16, "1,5", "2,7"],
      ["Silicon", 28, "2,1", "3,1"],
      ["Sắt", 56, "1,9", "3,7"],
      ["Cadimium", 114, "1,6", "4,6"],
      ["Vàng", 197, "1,7", "5,4"],
      ["Uranium", 238, "1,9", "5,9"],
    ]
  );
  assert.ok(SGK_B21_MASS_CONSTANTS.protonKg.includes("1,67262"));
  assert.ok(SGK_B21_MASS_CONSTANTS.neutronKg.includes("1,67493"));
  assert.ok(SGK_B21_MASS_CONSTANTS.amuKg.includes("1,66054"));
});

test("Cả 5 bài B21–B25 đều có tổng thời lượng Trong giờ học đúng 45 phút (1 tiết) và đủ lessonGoals", () => {
  for (const lesson of CHAPTER4_LESSONS) {
    assert.ok(
      lesson.lessonGoals?.knowledge.trim().length,
      `Bài ${lesson.code} phải có mục tiêu kiến thức`
    );
    assert.ok(
      lesson.lessonGoals?.competence.trim().length,
      `Bài ${lesson.code} phải có mục tiêu năng lực`
    );
    assert.ok(
      lesson.lessonGoals?.quality.trim().length,
      `Bài ${lesson.code} phải có mục tiêu phẩm chất`
    );

    const inClassTotal = lesson.sections
      .filter((s) => s.phase === "in_class")
      .reduce((sum, s) => sum + s.minutes, 0);
    assert.equal(
      inClassTotal,
      45,
      `Tổng thời lượng Trong giờ học của ${lesson.code} phải đúng 45 phút`
    );
  }
});

test("Bài 22 chuẩn hóa kí hiệu Eₗₖ, Eₗₖᵣ (không còn Wₗₖ) và Bài 23 Bảng 23.1 đúng số liệu [1, 3, 2, 0, 3, 1]", () => {
  const b22 = getChapter4Lesson("B22");
  const b22Bind = b22.sections.find((s) => s.id === "b22-binding-energy");
  assert.ok(b22Bind);
  assert.ok(b22Bind.title.includes("Eₗₖ"));
  assert.ok(b22Bind.title.includes("Eₗₖᵣ"));
  for (const sec of b22.sections) {
    assert.ok(!sec.title.includes("Wₗₖ") && !sec.shortTocTitle.includes("Wlk"));
    assert.ok(!sec.phenomenonPrompt.includes("Wₗₖ") && !sec.evidencePrompt.includes("Wₗₖ"));
  }

  assert.deepEqual(
    SGK_TABLE_23_1.map((r) => [r.windowSeconds, r.counts]),
    [
      ["0 – 5", 1],
      ["5 – 10", 3],
      ["10 – 15", 2],
      ["15 – 20", 0],
      ["20 – 25", 3],
      ["25 – 30", 1],
    ]
  );
  assert.equal(
    SGK_TABLE_23_1.reduce((sum, r) => sum + r.counts, 0),
    10
  );

  const b24 = getChapter4Lesson("B24");
  assert.ok(b24.sections[0]?.title.includes("Bộ phận nào thực sự làm quay tua-bin"));

  const b25 = getChapter4Lesson("B25");
  const b25TableSec = b25.sections.find((s) => s.id === "b25-table-25-1");
  assert.ok(b25TableSec);
  assert.ok(
    !b25TableSec.evidencePrompt.includes("39,5"),
    "evidencePrompt của Bảng 25.1 không được tiết lộ sẵn đáp án T ≈ 39,5 s cho học sinh"
  );
});

test("Đầy đủ SectionTeacherGuide cho toàn bộ các mục của cả 5 bài B21–B25", () => {
  for (const lesson of CHAPTER4_LESSONS) {
    for (const sec of lesson.sections) {
      assert.ok(sec.teacherGuide, `Mục ${sec.id} phải có teacherGuide`);
      assert.ok(sec.teacherGuide.learningObjective.trim().length > 10);
      assert.ok(sec.teacherGuide.projectorStrategy.trim().length > 10);
      assert.ok(sec.teacherGuide.openQuestions.length >= 2);
      assert.ok(sec.teacherGuide.commonMisconceptions.trim().length > 10);
      assert.ok(sec.teacherGuide.noVideoFallback.trim().length > 10);
      assert.ok(sec.teacherGuide.completionCriteriaNote.trim().length > 10);
    }
  }
});

test("recordPreClassPrediction khóa giữ nguyên dự đoán ban đầu kể cả khi học sinh sửa lại sau đó", () => {
  const firstSave = recordPreClassPrediction(
    EMPTY_STUDENT_NOTEBOOK,
    "straight",
    "Điện tích dương phân bố loãng nên hạt alpha đi thẳng hết."
  );
  assert.equal(firstSave.preClassPredictionChoice, "straight");
  assert.equal(firstSave.initialPredictionChoice, "straight");
  assert.equal(
    firstSave.initialPredictionReason,
    "Điện tích dương phân bố loãng nên hạt alpha đi thẳng hết."
  );

  const secondSave = recordPreClassPrediction(
    firstSave,
    "deflect_large",
    "Em đọc thêm thấy có hạt bật ngược ở vị trí (2)."
  );
  assert.equal(secondSave.preClassPredictionChoice, "deflect_large");
  assert.equal(
    secondSave.preClassPredictionReason,
    "Em đọc thêm thấy có hạt bật ngược ở vị trí (2)."
  );
  // Dự đoán lần chốt đầu tiên phải giữ nguyên để đối chiếu trên lớp!
  assert.equal(secondSave.initialPredictionChoice, "straight");
  assert.equal(
    secondSave.initialPredictionReason,
    "Điện tích dương phân bố loãng nên hạt alpha đi thẳng hết."
  );
});

test("Toàn bộ 17 mã hoạt động CanonicalActivityKey của Chương IV đều được bảo toàn", () => {
  const referencedKeys = new Set(
    CHAPTER4_LESSONS.flatMap((l) =>
      l.sections
        .map((s) => s.activityKey)
        .filter((k): k is NonNullable<typeof k> => Boolean(k))
    )
  );

  for (const key of CANONICAL_PHASE2_ACTIVITY_KEYS) {
    assert.ok(
      referencedKeys.has(key),
      `Thiếu kết nối mã hoạt động chuẩn: ${key}`
    );
  }
});

test("Bản riêng của giáo viên chuyển đổi thành TeachingPlan hợp lệ và đầy đủ sư phạm cho cả B21–B25", () => {
  for (const lesson of CHAPTER4_LESSONS) {
    const draft = createDraftFromSample(lesson);
    const customized = {
      ...draft,
      customTitle: `${lesson.title} — Lớp 12A1`,
      sections: draft.sections.map((s, idx) =>
        idx === 0
          ? { ...s, title: `${s.title} (Nhiệm vụ ở nhà 12A1)` }
          : s
      ),
    };

    const resolved = resolveLessonWithDraft(lesson, customized, true);
    assert.equal(resolved.isCustom, true);
    assert.equal(resolved.title, `${lesson.title} — Lớp 12A1`);
    assert.ok(resolved.sections[0]?.title.includes("12A1"));

    const plan = convertLessonDraftToTeachingPlan(lesson, customized);
    const checked = validateTeachingPlan(plan);
    assert.equal(
      checked.error,
      undefined,
      `Kế hoạch đồng bộ của ${lesson.code} phải đạt validateTeachingPlan`
    );
    assert.ok(checked.plan);
    assert.equal(checked.plan.activities.length, lesson.sections.length);

    if (lesson.code === "B21") {
      assert.ok(checked.plan.knowledgeGoals?.includes("Rutherford"));
      assert.ok(
        checked.plan.activities[0]?.teacherActions?.includes("Phương án chiếu dạy:")
      );
      assert.ok(
        checked.plan.activities[0]?.teacherActions?.includes("Hiểu nhầm thường gặp")
      );
      assert.ok(
        checked.plan.activities[0]?.support.includes("Dự phòng khi chưa có video:")
      );
    }
  }
});

test("isVerifiedVideoUrl chỉ cho phép hiện nút phát Video Flow khi có tệp hoặc URL thật", () => {
  assert.equal(isVerifiedVideoUrl(undefined), false);
  assert.equal(isVerifiedVideoUrl(""), false);
  assert.equal(isVerifiedVideoUrl("   "), false);
  assert.equal(isVerifiedVideoUrl("chua-co-video"), false);
  assert.equal(isVerifiedVideoUrl("/videos/nuclear-lessons/b21.mp4"), true);
  assert.equal(isVerifiedVideoUrl("https://example.com/flow-b21.mp4"), true);
});

