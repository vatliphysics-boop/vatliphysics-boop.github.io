"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CHAPTER4_LESSONS,
  CHAPTER4_PHASES,
  EMPTY_STUDENT_NOTEBOOK,
  STUDENT_NOTEBOOK_PREFIX,
  TEACHER_CUSTOM_DRAFT_PREFIX,
  createDraftFromSample,
  customPlanIdForLesson,
  getChapter4Lesson,
  getPhaseMeta,
  loadStudentNotebook,
  loadTeacherLessonDraft,
  recordPreClassPrediction,
  resolveLessonWithDraft,
  saveStudentNotebook,
  saveTeacherLessonDraftAndSyncPlan,
  type Chapter4SectionSpec,
  type LessonStudyPhase,
  type StudentLessonNotebook,
  type TeacherLessonDraft,
} from "@/lib/chapter4-lessons";
import { Chapter4SectionBody } from "./Chapter4SectionBody";
import styles from "./NuclearLabManual.module.css";

const EMPTY_RAW = () => "";

function subscribeChapter4Storage(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("chapter4-storage-changed", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("chapter4-storage-changed", listener);
  };
}

function TocPhaseGroups({
  sections,
  activeSectionId,
  completedIds,
  onSelect,
}: {
  readonly sections: readonly Chapter4SectionSpec[];
  readonly activeSectionId: string;
  readonly completedIds: readonly string[];
  readonly onSelect: (sectionId: string) => void;
}) {
  return (
    <>
      {CHAPTER4_PHASES.map((phase) => {
        const items = sections.filter((sec) => sec.phase === phase.id);
        if (!items.length) return null;
        return (
          <div key={phase.id} className={styles.tocPhaseGroup}>
            <p className={styles.tocPhaseTitle}>{phase.fullLabel}</p>
            <ul className={styles.tocList}>
              {items.map((sec) => {
                const isCurrent = sec.id === activeSectionId;
                const isDone = completedIds.includes(sec.id);
                return (
                  <li key={sec.id}>
                    <button
                      type="button"
                      className={`${styles.tocItemBtn} ${
                        isCurrent ? styles.tocItemBtnActive : ""
                      }`}
                      aria-current={isCurrent ? "step" : undefined}
                      onClick={() => onSelect(sec.id)}
                    >
                      <span>
                        <span>{sec.shortTocTitle}</span>
                        <span className={styles.tocItemMeta}>
                          {sec.sgkPages} · {sec.minutes} phút
                        </span>
                      </span>
                      {isDone && (
                        <span
                          className={styles.tocStatusMark}
                          aria-label="Đã hoàn thành mục này"
                          title="Đã hoàn thành"
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </>
  );
}

export interface VisualLearningStudioProps {
  readonly code?: string;
  readonly initialTeacherMode?: boolean;
  readonly initialPhase?: string;
  readonly initialSection?: string;
}

export function VisualLearningStudio({
  code,
  initialTeacherMode = false,
  initialPhase,
  initialSection,
}: VisualLearningStudioProps) {
  const router = useRouter();
  const sampleLesson = getChapter4Lesson(code);

  // Đọc đồng bộ từ localStorage qua useSyncExternalStore (chuẩn React 19, không setState trong effect)
  const notebookRaw = useSyncExternalStore(
    subscribeChapter4Storage,
    useCallback(() => {
      try {
        return (
          window.localStorage.getItem(
            `${STUDENT_NOTEBOOK_PREFIX}${sampleLesson.code}`
          ) ?? ""
        );
      } catch {
        return "";
      }
    }, [sampleLesson.code]),
    EMPTY_RAW
  );

  const storedDraftRaw = useSyncExternalStore(
    subscribeChapter4Storage,
    useCallback(() => {
      try {
        return (
          window.localStorage.getItem(
            `${TEACHER_CUSTOM_DRAFT_PREFIX}${sampleLesson.code}`
          ) ?? ""
        );
      } catch {
        return "";
      }
    }, [sampleLesson.code]),
    EMPTY_RAW
  );

  const notebook = useMemo<StudentLessonNotebook>(() => {
    if (!notebookRaw) return EMPTY_STUDENT_NOTEBOOK;
    return loadStudentNotebook(sampleLesson.code);
  }, [notebookRaw, sampleLesson.code]);

  const storedTeacherDraft = useMemo<TeacherLessonDraft | null>(() => {
    if (!storedDraftRaw) return null;
    return loadTeacherLessonDraft(sampleLesson.code);
  }, [storedDraftRaw, sampleLesson.code]);

  // Chế độ giáo viên & bản nháp đang chỉnh sửa trực tiếp trên màn hình
  const [teacherMode, setTeacherMode] = useState(initialTeacherMode);
  const [previewAsStudent, setPreviewAsStudent] = useState(false);
  const [useCustomDraft, setUseCustomDraft] = useState(false);
  const [editingDraft, setEditingDraft] = useState(false);
  const [workingDraft, setWorkingDraft] = useState<TeacherLessonDraft | null>(
    null
  );
  const [syncNotice, setSyncNotice] = useState("");

  const effectiveTeacherDraft = workingDraft ?? storedTeacherDraft;

  const resolvedLesson = useMemo(
    () =>
      resolveLessonWithDraft(
        sampleLesson,
        effectiveTeacherDraft,
        useCustomDraft
      ),
    [sampleLesson, effectiveTeacherDraft, useCustomDraft]
  );

  const defaultSectionId = useMemo(() => {
    if (
      initialSection &&
      resolvedLesson.sections.some((sec) => sec.id === initialSection)
    ) {
      return initialSection;
    }
    if (
      initialPhase &&
      CHAPTER4_PHASES.some((p) => p.id === initialPhase)
    ) {
      const match = resolvedLesson.sections.find(
        (sec) => sec.phase === initialPhase
      );
      if (match) return match.id;
    }
    return resolvedLesson.sections[0]?.id ?? "";
  }, [initialPhase, initialSection, resolvedLesson.sections]);

  const [activeSectionId, setActiveSectionId] = useState(defaultSectionId);
  const [visitedSectionIds, setVisitedSectionIds] = useState<
    ReadonlySet<string>
  >(() => new Set([defaultSectionId]));
  const [lastSectionByPhase, setLastSectionByPhase] = useState<
    Partial<Record<LessonStudyPhase, string>>
  >({});

  // Ngăn kéo Chọn hoạt động trên điện thoại
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const mobileTocTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerCloseRef = useRef<HTMLButtonElement>(null);

  const activeSection = useMemo(() => {
    return (
      resolvedLesson.sections.find((sec) => sec.id === activeSectionId) ??
      resolvedLesson.sections[0]
    );
  }, [activeSectionId, resolvedLesson.sections]);

  const activePhaseMeta = getPhaseMeta(activeSection.phase);

  const selectSection = useCallback(
    (sectionId: string) => {
      const target = resolvedLesson.sections.find(
        (sec) => sec.id === sectionId
      );
      if (!target) return;
      setActiveSectionId(target.id);
      setVisitedSectionIds((prev) => {
        if (prev.has(target.id)) return prev;
        const next = new Set(prev);
        next.add(target.id);
        return next;
      });
      setLastSectionByPhase((prev) => ({
        ...prev,
        [target.phase]: target.id,
      }));
    },
    [resolvedLesson.sections]
  );

  const handleMobileSelectSection = useCallback(
    (sectionId: string) => {
      selectSection(sectionId);
      setMobileTocOpen(false);
      requestAnimationFrame(() => mobileTocTriggerRef.current?.focus());
    },
    [selectSection]
  );

  const selectPhase = useCallback(
    (phase: LessonStudyPhase) => {
      const remembered = lastSectionByPhase[phase];
      if (
        remembered &&
        resolvedLesson.sections.some((sec) => sec.id === remembered)
      ) {
        selectSection(remembered);
        return;
      }
      const firstInPhase = resolvedLesson.sections.find(
        (sec) => sec.phase === phase
      );
      if (firstInPhase) {
        selectSection(firstInPhase.id);
      }
    },
    [lastSectionByPhase, resolvedLesson.sections, selectSection]
  );

  useEffect(() => {
    if (!mobileTocOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobileDrawerCloseRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileTocOpen(false);
        requestAnimationFrame(() => mobileTocTriggerRef.current?.focus());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileTocOpen]);

  const handleSavePreClassPrediction = useCallback(
    (choice: string, reason: string) => {
      const current = loadStudentNotebook(sampleLesson.code);
      saveStudentNotebook(
        sampleLesson.code,
        recordPreClassPrediction(current, choice, reason)
      );
    },
    [sampleLesson.code]
  );

  const handlePatchNotebook = useCallback(
    (updater: (current: StudentLessonNotebook) => StudentLessonNotebook) => {
      const current = loadStudentNotebook(sampleLesson.code);
      saveStudentNotebook(sampleLesson.code, updater(current));
    },
    [sampleLesson.code]
  );

  const handleMarkSectionComplete = useCallback(
    (
      sectionId: string,
      done: boolean,
      options?: { readonly allowUnmark?: boolean }
    ) => {
      const current = loadStudentNotebook(sampleLesson.code);
      const has = current.completedSectionIds.includes(sectionId);
      // Bảo vệ tiến độ: chuyển tab/pha hoặc remount mô phỏng chưa tương tác không được xóa mục đã hoàn thành thực chất
      if (has && !done && !options?.allowUnmark) return;
      if (done === has) return;
      const nextIds = done
        ? [...current.completedSectionIds, sectionId]
        : current.completedSectionIds.filter((id) => id !== sectionId);
      saveStudentNotebook(sampleLesson.code, {
        ...current,
        completedSectionIds: nextIds,
      });
    },
    [sampleLesson.code]
  );

  const handleEvidenceNoteChange = useCallback(
    (sectionId: string, value: string) => {
      const current = loadStudentNotebook(sampleLesson.code);
      saveStudentNotebook(sampleLesson.code, {
        ...current,
        sectionNotes: {
          ...current.sectionNotes,
          [sectionId]: value,
        },
      });
    },
    [sampleLesson.code]
  );

  function handleUseSampleLesson() {
    setUseCustomDraft(false);
    setEditingDraft(false);
    setPreviewAsStudent(false);
    setSyncNotice(
      "Đang sử dụng bài mẫu chuẩn SGK để trình chiếu hoặc giảng dạy."
    );
  }

  function handleCreateOrEditCustomDraft() {
    const draft = effectiveTeacherDraft ?? createDraftFromSample(sampleLesson);
    setWorkingDraft(draft);
    setUseCustomDraft(true);
    setEditingDraft(true);
    setPreviewAsStudent(false);
    const result = saveTeacherLessonDraftAndSyncPlan(sampleLesson, draft);
    if (result.error) {
      setSyncNotice(result.error);
    } else {
      setSyncNotice(
        "Đã mở “Bản của tôi” và đồng bộ vào Phần chuẩn bị của giáo viên."
      );
    }
  }

  function handleSaveAndSyncDraft() {
    if (!effectiveTeacherDraft) return;
    const result = saveTeacherLessonDraftAndSyncPlan(
      sampleLesson,
      effectiveTeacherDraft
    );
    if (result.error) {
      setSyncNotice(result.error);
    } else {
      setSyncNotice(
        `Đã lưu bản riêng và đồng bộ sang Phần chuẩn bị (${result.syncedPlan?.title}).`
      );
    }
  }

  function handlePreviewAsStudent() {
    if (useCustomDraft && effectiveTeacherDraft) {
      saveTeacherLessonDraftAndSyncPlan(sampleLesson, effectiveTeacherDraft);
    }
    setPreviewAsStudent(true);
    setSyncNotice("");
  }

  function handleOpenTeacherPreparation() {
    if (useCustomDraft && effectiveTeacherDraft) {
      saveTeacherLessonDraftAndSyncPlan(sampleLesson, effectiveTeacherDraft);
      router.push(
        `/hoc-lieu/soan-ke-hoach?template=${sampleLesson.code}&plan=${encodeURIComponent(
          customPlanIdForLesson(sampleLesson.code)
        )}`
      );
      return;
    }
    router.push(`/hoc-lieu/soan-ke-hoach?template=${sampleLesson.code}`);
  }

  function patchDraftHeader(patch: Partial<TeacherLessonDraft>) {
    const base = effectiveTeacherDraft ?? createDraftFromSample(sampleLesson);
    setWorkingDraft({ ...base, ...patch });
    setSyncNotice(
      "Có thay đổi chưa lưu — nhấn “Lưu & đồng bộ sang Phần chuẩn bị” để cập nhật."
    );
  }

  function patchDraftSection(
    sectionId: string,
    patch: Partial<TeacherLessonDraft["sections"][number]>
  ) {
    const base = effectiveTeacherDraft ?? createDraftFromSample(sampleLesson);
    setWorkingDraft({
      ...base,
      sections: base.sections.map((sec) =>
        sec.id === sectionId ? { ...sec, ...patch } : sec
      ),
    });
    setSyncNotice(
      "Có thay đổi ở mục đang chọn — nhấn “Lưu & đồng bộ sang Phần chuẩn bị” để cập nhật."
    );
  }

  const activeDraftOverride = effectiveTeacherDraft?.sections.find(
    (s) => s.id === activeSection.id
  );

  const completedCount = resolvedLesson.sections.filter((sec) =>
    notebook.completedSectionIds.includes(sec.id)
  ).length;
  const totalSections = resolvedLesson.sections.length;
  const isLessonAllComplete =
    completedCount === totalSections && totalSections > 0;

  const activeIdx = resolvedLesson.sections.findIndex(
    (sec) => sec.id === activeSection.id
  );
  const prevSection =
    activeIdx > 0 ? resolvedLesson.sections[activeIdx - 1] : null;
  const nextSection =
    activeIdx >= 0 && activeIdx < resolvedLesson.sections.length - 1
      ? resolvedLesson.sections[activeIdx + 1]
      : null;

  const showTeacherControls = teacherMode && !previewAsStudent;

  return (
    <div className={styles.manualRoot} data-nuclear-manual="lesson">
      {/* Thanh điều hướng đầu Trang bài học */}
      <div className={styles.lessonTopBar}>
        <div className={styles.lessonBackAndSwitch}>
          <Link href="/hoc-lieu" className={styles.backLink}>
            <span aria-hidden="true">←</span>
            <span>Về kho học liệu</span>
          </Link>
          <nav aria-label="Chuyển nhanh bài học Chương IV">
            <ul className={styles.quickLessonList}>
              {CHAPTER4_LESSONS.map((item) => {
                const isCurrentLesson = item.code === sampleLesson.code;
                return (
                  <li key={item.code}>
                    <Link
                      href={
                        teacherMode
                          ? `/hoc-lieu/truc-quan?bai=${item.code}&che-do=giao-vien`
                          : `/hoc-lieu/truc-quan?bai=${item.code}`
                      }
                      className={`${styles.quickLessonLink} ${
                        isCurrentLesson ? styles.quickLessonLinkActive : ""
                      }`}
                      aria-current={isCurrentLesson ? "page" : undefined}
                    >
                      {item.code}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "12.5px",
              fontWeight: 600,
              padding: "4px 10px",
              background: isLessonAllComplete ? "#defbe6" : "#f4f4f4",
              color: isLessonAllComplete ? "#198038" : "#525252",
              border: "1px solid #e0e0e0",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {isLessonAllComplete
              ? `Đã hoàn thành bài học (${completedCount}/${totalSections})`
              : `Tiến độ: ${completedCount}/${totalSections} mục`}
          </span>
          <button
            type="button"
            className={`${styles.cdsBtn} ${styles.cdsBtnSmall} ${
              teacherMode ? styles.cdsBtnPrimary : ""
            }`}
            aria-pressed={teacherMode}
            onClick={() => {
              setTeacherMode((prev) => {
                const next = !prev;
                if (!next) setPreviewAsStudent(false);
                return next;
              });
            }}
          >
            {teacherMode ? "Đang bật Chế độ Giáo viên" : "Chế độ Giáo viên"}
          </button>
        </div>
      </div>

      {/* Thanh thông báo khi giáo viên đang Xem như học sinh */}
      {teacherMode && previewAsStudent && (
        <div className={styles.studentPreviewBanner} role="status">
          <div>
            <strong>Chế độ Xem như học sinh:</strong> Đang hiển thị{" "}
            <strong>
              {resolvedLesson.isCustom ? "Bản của tôi" : "Bài mẫu SGK"}
            </strong>{" "}
            đúng như giao diện học sinh nhìn thấy trên lớp và ở nhà.
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              className={`${styles.cdsBtn} ${styles.cdsBtnSmall}`}
              onClick={() => setPreviewAsStudent(false)}
            >
              Quay lại bàn chỉnh sửa Giáo viên
            </button>
            <button
              type="button"
              className={`${styles.cdsBtn} ${styles.cdsBtnPrimary} ${styles.cdsBtnSmall}`}
              onClick={handleOpenTeacherPreparation}
            >
              Mở Phần chuẩn bị của giáo viên ↗
            </button>
          </div>
        </div>
      )}

      {/* Bàn điều khiển Giáo viên: Dùng bài mẫu → Tạo bản của tôi → Xem như học sinh */}
      {showTeacherControls && (
        <section
          className={styles.teacherStudioBar}
          aria-label="Công cụ tổ chức và tùy biến bài dạy của giáo viên"
        >
          <div className={styles.teacherStudioHead}>
            <div>
              <strong
                style={{
                  fontSize: "15px",
                  display: "block",
                  marginBottom: "2px",
                }}
              >
                Chế độ Giáo viên · Đường đi từ Bài mẫu tới Bản riêng của lớp
              </strong>
              <span style={{ fontSize: "13.5px", color: "#525252" }}>
                Đang áp dụng:{" "}
                <strong>
                  {resolvedLesson.isCustom
                    ? `Bản của tôi (${resolvedLesson.title})`
                    : "Bài mẫu chuẩn SGK"}
                </strong>
                . Mọi chỉnh sửa trong “Bản của tôi” đều đồng bộ sang Phần chuẩn
                bị của giáo viên.
              </span>
            </div>
            <div className={styles.teacherStudioActions}>
              <button
                type="button"
                className={`${styles.cdsBtn} ${styles.cdsBtnSmall} ${
                  !useCustomDraft ? styles.cdsBtnPrimary : ""
                }`}
                aria-pressed={!useCustomDraft}
                onClick={handleUseSampleLesson}
              >
                Dùng bài mẫu
              </button>
              <button
                type="button"
                className={`${styles.cdsBtn} ${styles.cdsBtnSmall} ${
                  useCustomDraft ? styles.cdsBtnPrimary : ""
                }`}
                aria-pressed={useCustomDraft}
                onClick={handleCreateOrEditCustomDraft}
              >
                {effectiveTeacherDraft
                  ? "Tạo bản của tôi (Chỉnh sửa)"
                  : "Tạo bản của tôi"}
              </button>
              <button
                type="button"
                className={`${styles.cdsBtn} ${styles.cdsBtnSmall}`}
                onClick={handlePreviewAsStudent}
              >
                Xem như học sinh
              </button>
              <button
                type="button"
                className={`${styles.cdsBtn} ${styles.cdsBtnSmall}`}
                onClick={handleOpenTeacherPreparation}
              >
                Mở Phần chuẩn bị của giáo viên ↗
              </button>
            </div>
          </div>

          {sampleLesson.lessonGoals && (
            <details
              style={{
                background: "#ffffff",
                border: "1px solid #a6c8ff",
                padding: "10px 14px",
                fontSize: "13.5px",
                lineHeight: 1.55,
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: 700, color: "#002d9c" }}>
                Mục tiêu tổng thể Bài {sampleLesson.number} &amp; phân bổ thời lượng 3 pha (Trước giờ:{" "}
                {resolvedLesson.sections
                  .filter((s) => s.phase === "before")
                  .reduce((sum, s) => sum + s.minutes, 0)}{" "}
                phút · Trên lớp:{" "}
                {resolvedLesson.sections
                  .filter((s) => s.phase === "in_class")
                  .reduce((sum, s) => sum + s.minutes, 0)}{" "}
                phút · Sau giờ:{" "}
                {resolvedLesson.sections
                  .filter((s) => s.phase === "after")
                  .reduce((sum, s) => sum + s.minutes, 0)}{" "}
                phút)
              </summary>
              <ul style={{ margin: "8px 0 0", paddingLeft: "18px" }}>
                <li>
                  <strong>Kiến thức:</strong> {sampleLesson.lessonGoals.knowledge}
                </li>
                <li>
                  <strong>Năng lực:</strong> {sampleLesson.lessonGoals.competence}
                </li>
                <li>
                  <strong>Phẩm chất:</strong> {sampleLesson.lessonGoals.quality}
                </li>
              </ul>
            </details>
          )}

          {syncNotice && (
            <p
              role="status"
              style={{
                margin: 0,
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#002d9c",
              }}
            >
              {syncNotice}
            </p>
          )}

          {useCustomDraft && editingDraft && effectiveTeacherDraft && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #a6c8ff",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "12px",
                }}
              >
                <label style={{ fontSize: "13px", fontWeight: 700 }}>
                  Tên bản bài dạy của lớp
                  <input
                    type="text"
                    value={effectiveTeacherDraft.customTitle}
                    onChange={(e) =>
                      patchDraftHeader({ customTitle: e.target.value })
                    }
                    style={{
                      display: "block",
                      width: "100%",
                      marginTop: "4px",
                      minHeight: "40px",
                      padding: "6px 10px",
                      border: "1px solid #8d8d8d",
                      fontSize: "14px",
                    }}
                  />
                </label>
                <label style={{ fontSize: "13px", fontWeight: 700 }}>
                  Ghi chú lớp giảng dạy
                  <input
                    type="text"
                    value={effectiveTeacherDraft.classNameNote}
                    onChange={(e) =>
                      patchDraftHeader({ classNameNote: e.target.value })
                    }
                    style={{
                      display: "block",
                      width: "100%",
                      marginTop: "4px",
                      minHeight: "40px",
                      padding: "6px 10px",
                      border: "1px solid #8d8d8d",
                      fontSize: "14px",
                    }}
                  />
                </label>
              </div>

              <label style={{ fontSize: "13px", fontWeight: 700 }}>
                Câu hỏi trung tâm của bài
                <input
                  type="text"
                  value={effectiveTeacherDraft.guidingQuestion}
                  onChange={(e) =>
                    patchDraftHeader({ guidingQuestion: e.target.value })
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: "4px",
                    minHeight: "40px",
                    padding: "6px 10px",
                    border: "1px solid #8d8d8d",
                    fontSize: "14px",
                  }}
                />
              </label>

              {activeDraftOverride && (
                <div
                  style={{ borderTop: "1px solid #e0e0e0", paddingTop: "12px" }}
                >
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0f62fe",
                    }}
                  >
                    Tùy chỉnh mục đang mở ({activeSection.shortTocTitle}):
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <label style={{ fontSize: "13px", fontWeight: 700 }}>
                      Tiêu đề mục hiển thị cho lớp
                      <input
                        type="text"
                        value={activeDraftOverride.title}
                        onChange={(e) =>
                          patchDraftSection(activeSection.id, {
                            title: e.target.value,
                          })
                        }
                        style={{
                          display: "block",
                          width: "100%",
                          marginTop: "4px",
                          minHeight: "38px",
                          padding: "6px 10px",
                          border: "1px solid #8d8d8d",
                          fontSize: "13.5px",
                        }}
                      />
                    </label>
                    <label style={{ fontSize: "13px", fontWeight: 700 }}>
                      Phân vào pha học tập
                      <select
                        value={activeDraftOverride.phase}
                        onChange={(e) =>
                          patchDraftSection(activeSection.id, {
                            phase: e.target.value as LessonStudyPhase,
                          })
                        }
                        style={{
                          display: "block",
                          width: "100%",
                          marginTop: "4px",
                          minHeight: "38px",
                          padding: "6px 10px",
                          border: "1px solid #8d8d8d",
                          fontSize: "13.5px",
                          background: "#fff",
                        }}
                      >
                        {CHAPTER4_PHASES.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.fullLabel}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <label style={{ fontSize: "13px", fontWeight: 700 }}>
                      Yêu cầu ghi bằng chứng của lớp
                      <input
                        type="text"
                        value={activeDraftOverride.evidencePrompt}
                        onChange={(e) =>
                          patchDraftSection(activeSection.id, {
                            evidencePrompt: e.target.value,
                          })
                        }
                        style={{
                          display: "block",
                          width: "100%",
                          marginTop: "4px",
                          minHeight: "38px",
                          padding: "6px 10px",
                          border: "1px solid #8d8d8d",
                          fontSize: "13.5px",
                        }}
                      />
                    </label>
                    <label style={{ fontSize: "13px", fontWeight: 700 }}>
                      Liên kết Video Flow (chỉ hiện nút phát khi nhập URL video
                      thật)
                      <input
                        type="url"
                        value={activeDraftOverride.flowVideoUrl ?? ""}
                        onChange={(e) =>
                          patchDraftSection(activeSection.id, {
                            flowVideoUrl: e.target.value,
                          })
                        }
                        placeholder="Chưa gắn Video Flow — để trống sẽ không hiện nút phát"
                        style={{
                          display: "block",
                          width: "100%",
                          marginTop: "4px",
                          minHeight: "38px",
                          padding: "6px 10px",
                          border: "1px solid #8d8d8d",
                          fontSize: "13.5px",
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnPrimary} ${styles.cdsBtnSmall}`}
                  onClick={handleSaveAndSyncDraft}
                >
                  Lưu &amp; đồng bộ sang Phần chuẩn bị
                </button>
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnSmall}`}
                  onClick={() => setEditingDraft(false)}
                >
                  Thu gọn khung chỉnh sửa
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Khối tiêu đề Bài học + Câu hỏi trung tâm */}
      <header className={styles.lessonHeaderBlock}>
        <p className={styles.lessonKicker}>
          CHƯƠNG IV · BÀI {sampleLesson.number} ({sampleLesson.code}) ·{" "}
          {sampleLesson.sgkPages}
          {resolvedLesson.classNameNote
            ? ` · ${resolvedLesson.classNameNote}`
            : ""}
        </p>
        <h1 className={styles.lessonMainTitle}>
          Bài {sampleLesson.number}: {resolvedLesson.title}
        </h1>
        <p className={styles.centralQuestionBox}>
          <span className={styles.centralQuestionLabel}>
            Câu hỏi trung tâm:
          </span>
          “{resolvedLesson.guidingQuestion}”
        </p>
      </header>

      {/* Thanh 3 pha học tập */}
      <div
        className={styles.phaseTabsBar}
        role="navigation"
        aria-label="Ba pha học tập của bài"
      >
        {CHAPTER4_PHASES.map((phase, index) => {
          const isCurrentPhase = activeSection.phase === phase.id;
          const countInPhase = resolvedLesson.sections.filter(
            (s) => s.phase === phase.id
          ).length;
          return (
            <button
              key={phase.id}
              type="button"
              className={`${styles.phaseTabBtn} ${
                isCurrentPhase ? styles.phaseTabBtnActive : ""
              }`}
              aria-current={isCurrentPhase ? "true" : undefined}
              onClick={() => selectPhase(phase.id)}
            >
              <span className={styles.phaseTabStep}>
                PHA {index + 1} ({countInPhase} mục)
              </span>
              <span className={styles.phaseTabDesc}>{phase.fullLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Bố cục chính: Cột hẹp Mục lục (Desktop) / Nút Chọn hoạt động (Mobile) + Bàn thí nghiệm rộng */}
      <div className={styles.workbenchLayout}>
        <aside
          className={styles.tocSidebar}
          aria-label="Mục lục hoạt động trong bài"
        >
          <h2 className={styles.tocHeading}>Mục lục hoạt động</h2>
          <TocPhaseGroups
            sections={resolvedLesson.sections}
            activeSectionId={activeSection.id}
            completedIds={notebook.completedSectionIds}
            onSelect={selectSection}
          />
          <div
            style={{
              padding: "12px 14px",
              borderTop: "1px solid #e0e0e0",
              background: "#fafafa",
            }}
          >
            <a
              href={`/learning/${sampleLesson.code}-worksheet.pdf`}
              className={`${styles.cdsBtn} ${styles.cdsBtnSmall}`}
              style={{ width: "100%" }}
            >
              <span>Phiếu học tập PDF ({sampleLesson.code})</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </aside>

        {/* Thanh Chọn hoạt động trên điện thoại: luôn hiển thị rõ tên pha + tên hoạt động hiện tại */}
        <div className={styles.mobileTocBar}>
          <div className={styles.mobileTocCurrent}>
            <span className={styles.mobileTocPhase}>
              {activePhaseMeta.fullLabel}
            </span>
            <span className={styles.mobileTocTitle}>{activeSection.title}</span>
          </div>
          <button
            ref={mobileTocTriggerRef}
            type="button"
            className={`${styles.cdsBtn} ${styles.cdsBtnPrimary} ${styles.cdsBtnSmall}`}
            aria-expanded={mobileTocOpen}
            aria-controls="mobile-activity-drawer"
            onClick={() => setMobileTocOpen(true)}
          >
            Chọn hoạt động
          </button>
        </div>

        {/* Cột phải rộng nhất dành cho mô phỏng, hình, bảng số liệu */}
        <div className={styles.stageColumn}>
          {resolvedLesson.sections.map((sec) => {
            const isMounted =
              visitedSectionIds.has(sec.id) || sec.id === activeSection.id;
            if (!isMounted) return null;

            const isActive = sec.id === activeSection.id;
            const secPhaseMeta = getPhaseMeta(sec.phase);
            const isSecDone = notebook.completedSectionIds.includes(sec.id);
            const noteValue = notebook.sectionNotes[sec.id] ?? "";

            return (
              <article
                key={sec.id}
                hidden={!isActive}
                className={styles.activitySheet}
                aria-labelledby={`heading-${sec.id}`}
              >
                <header className={styles.activityHeader}>
                  <div className={styles.activityBadgeRow}>
                    <span className={styles.phasePill}>
                      {secPhaseMeta.fullLabel}
                    </span>
                    <span className={styles.sgkRefPill}>{sec.sgkPages}</span>
                    {isSecDone && (
                      <span className={styles.statusPillDone}>
                        ✓ Đã ghi nhận hoàn thành mục này
                      </span>
                    )}
                  </div>

                  <h2 id={`heading-${sec.id}`} className={styles.activityTitle}>
                    {sec.title}
                  </h2>

                  <div className={styles.studentCompass}>
                    <div className={styles.compassItem}>
                      <span className={styles.compassLabel}>
                        HIỆN TƯỢNG CẦN KHÁM PHÁ
                      </span>
                      <p className={styles.compassText}>
                        {sec.phenomenonPrompt}
                      </p>
                    </div>
                    <div className={styles.compassItem}>
                      <span className={styles.compassLabel}>
                        BẰNG CHỨNG CẦN GHI LẠI
                      </span>
                      <p className={styles.compassText}>{sec.evidencePrompt}</p>
                    </div>
                  </div>

                  {showTeacherControls && (
                    <section
                      aria-label={`Hướng dẫn sư phạm mục ${sec.shortTocTitle}`}
                      data-testid={`teacher-guide-${sec.id}`}
                      style={{
                        marginTop: "14px",
                        border: "1px solid #d2a106",
                        borderLeft: "4px solid #8e6a00",
                        background: "#fffdf5",
                        padding: "14px 16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          flexWrap: "wrap",
                          gap: "8px",
                          marginBottom: "10px",
                        }}
                      >
                        <strong style={{ fontSize: "14px", color: "#5e4600" }}>
                          Bảng hướng dẫn sư phạm cho Giáo viên · {sec.shortTocTitle}
                        </strong>
                        <span
                          style={{
                            fontSize: "12.5px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            background: "#fcf4d6",
                            border: "1px solid #f1c21b",
                            color: "#5e4600",
                          }}
                        >
                          Thời lượng dự kiến: {sec.minutes} phút ({secPhaseMeta.shortLabel})
                        </span>
                      </div>

                      <div className={styles.tableScroll} style={{ margin: 0 }}>
                        <table className={styles.cdsTable}>
                          <tbody>
                            <tr>
                              <th scope="row" style={{ width: "220px" }}>
                                Mục tiêu cần đạt
                              </th>
                              <td>{sec.teacherGuide.learningObjective}</td>
                            </tr>
                            <tr>
                              <th scope="row">Thời lượng dự kiến</th>
                              <td>
                                <strong>{sec.minutes} phút</strong> — thuộc{" "}
                                {secPhaseMeta.fullLabel} ({sec.sgkPages}).
                              </td>
                            </tr>
                            <tr>
                              <th scope="row">Phương án chiếu dạy</th>
                              <td>
                                <div>{sec.teacherGuide.projectorStrategy}</div>
                                {sec.teacherTip && (
                                  <div style={{ marginTop: "4px", color: "#525252" }}>
                                    <em>Lưu ý điều phối nhanh:</em> {sec.teacherTip}
                                  </div>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th scope="row">Một hiểu nhầm thường gặp &amp; cách gỡ</th>
                              <td>{sec.teacherGuide.commonMisconceptions}</td>
                            </tr>
                            <tr>
                              <th scope="row">Câu hỏi gợi mở</th>
                              <td>
                                <ul style={{ margin: 0, paddingLeft: "18px" }}>
                                  {sec.teacherGuide.openQuestions.map((q) => (
                                    <li key={q}>{q}</li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                            <tr>
                              <th scope="row">Phương án dự phòng khi chưa có video</th>
                              <td>{sec.teacherGuide.noVideoFallback}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                </header>

                <Chapter4SectionBody
                  lessonCode={sampleLesson.code}
                  section={sec}
                  notebook={notebook}
                  showTeacherSolutions={showTeacherControls}
                  onSavePreClassPrediction={handleSavePreClassPrediction}
                  onPatchNotebook={handlePatchNotebook}
                  onMarkSectionComplete={handleMarkSectionComplete}
                  onJumpToSection={selectSection}
                />

                <div className={styles.evidenceCard}>
                  <label
                    className={styles.evidenceLabel}
                    htmlFor={`evidence-note-${sec.id}`}
                  >
                    Ghi chép bằng chứng &amp; nhận xét của em cho mục “
                    {sec.shortTocTitle}” (tự động lưu trên thiết bị):
                  </label>
                  <textarea
                    id={`evidence-note-${sec.id}`}
                    className={styles.evidenceTextarea}
                    value={noteValue}
                    onChange={(e) =>
                      handleEvidenceNoteChange(sec.id, e.target.value)
                    }
                    placeholder="Ghi số liệu vừa đọc, điểm khác biệt giữa các mô hình hoặc câu hỏi muốn trao đổi trên lớp…"
                  />
                </div>

                <footer className={styles.sectionFooterNav}>
                  <div>
                    {prevSection ? (
                      <button
                        type="button"
                        className={`${styles.cdsBtn} ${styles.cdsBtnSmall}`}
                        onClick={() => selectSection(prevSection.id)}
                      >
                        ← {prevSection.shortTocTitle}
                      </button>
                    ) : (
                      <Link
                        href="/hoc-lieu"
                        className={`${styles.cdsBtn} ${styles.cdsBtnSmall}`}
                      >
                        ← Về kho học liệu
                      </Link>
                    )}
                  </div>
                  <div>
                    {nextSection && (
                      <button
                        type="button"
                        className={`${styles.cdsBtn} ${styles.cdsBtnPrimary} ${styles.cdsBtnSmall}`}
                        onClick={() => selectSection(nextSection.id)}
                      >
                        <span>Tiếp theo: {nextSection.shortTocTitle}</span>
                        <span aria-hidden="true">→</span>
                      </button>
                    )}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      </div>

      {/* Ngăn kéo Mục lục hoạt động trên điện thoại */}
      {mobileTocOpen && (
        <div
          className={styles.mobileDrawerBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-toc-dialog-title"
          id="mobile-activity-drawer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setMobileTocOpen(false);
              requestAnimationFrame(() => mobileTocTriggerRef.current?.focus());
            }
          }}
        >
          <div className={styles.mobileDrawerSheet}>
            <div className={styles.mobileDrawerHeader}>
              <strong id="mobile-toc-dialog-title" style={{ fontSize: "15px" }}>
                Chọn hoạt động · Bài {sampleLesson.number}
              </strong>
              <button
                ref={mobileDrawerCloseRef}
                type="button"
                className={`${styles.cdsBtn} ${styles.cdsBtnSmall}`}
                onClick={() => {
                  setMobileTocOpen(false);
                  requestAnimationFrame(() =>
                    mobileTocTriggerRef.current?.focus()
                  );
                }}
              >
                Đóng
              </button>
            </div>
            <div className={styles.mobileDrawerBody}>
              <TocPhaseGroups
                sections={resolvedLesson.sections}
                activeSectionId={activeSection.id}
                completedIds={notebook.completedSectionIds}
                onSelect={handleMobileSelectSection}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
