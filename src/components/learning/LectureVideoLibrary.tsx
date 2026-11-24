"use client";

import React, { useState } from "react";
import Link from "next/link";
import { NuclearLessonVideo } from "@/components/learning/NuclearLessonVideo";
import { LatexMath } from "@/components/learning/LatexMath";
import { NUCLEAR_LAB_LESSONS, type NuclearLabLesson } from "@/lib/nuclear-lab-lessons";

type LessonCode = NuclearLabLesson["code"];

interface LessonNote {
  formulas: string;
  question: string;
}

const LESSON_FORMULA_GUIDES: Record<
  LessonCode,
  { summary: string; latex: string; quickFormulas: string[] }
> = {
  B21: {
    summary: "Kí hiệu hạt nhân, số khối A, số proton Z, số neutron N và bán kính hạt nhân.",
    latex: "{}_{Z}^{A}\\mathrm{X}, \\quad A = Z + N, \\quad R \\approx 1{,}2 \\cdot A^{1/3}\\text{ fm}",
    quickFormulas: [
      "A = Z + N (số nucleon = số proton + số neutron)",
      "q = +Z·e (điện tích hạt nhân)",
      "R ≈ 1,2 · A^(1/3) fm (bán kính hạt nhân)",
    ],
  },
  B22: {
    summary: "Độ hụt khối, năng lượng liên kết, năng lượng liên kết riêng và định luật bảo toàn trong phản ứng hạt nhân.",
    latex: "\\Delta m = Z m_p + (A - Z) m_n - m_{\\text{X}}, \\quad E_{\\text{lk}} = \\Delta m \\cdot c^2, \\quad E_{\\text{lkr}} = \\frac{E_{\\text{lk}}}{A}",
    quickFormulas: [
      "Δm = Z·mp + (A − Z)·mn − mX",
      "Elk = Δm · c² (1 u·c² ≈ 931,5 MeV)",
      "Elkr = Elk / A (đặc trưng cho độ bền hạt nhân)",
      "Bảo toàn số nucleon (∑A) và điện tích (∑Z)",
    ],
  },
  B23: {
    summary: "Bản chất các tia α, β⁻, β⁺, γ; định luật phóng xạ, chu kì bán rã T và độ phóng xạ H.",
    latex: "N(t) = N_0 \\cdot 2^{-\\frac{t}{T}} = N_0 e^{-\\lambda t}, \\quad \\lambda = \\frac{\\ln 2}{T}, \\quad H(t) = \\lambda N(t)",
    quickFormulas: [
      "N(t) = N₀ · 2^(−t/T) = N₀ · e^(−λt)",
      "ΔN(t) = N₀ − N(t) = N₀ · (1 − 2^(−t/T))",
      "λ = ln(2) / T (T tính ra giây khi tính H theo Bq)",
      "H(t) = λ · N(t) = H₀ · 2^(−t/T) (đơn vị: Bq)",
    ],
  },
  B24: {
    summary: "Hệ số nhân neutron k trong lò phản ứng hạt nhân, chu trình hai vòng nước PWR và ứng dụng bức xạ.",
    latex: "k < 1\\text{ (tắt dần)}, \\quad k = 1\\text{ (tới hạn ổn định)}, \\quad k > 1\\text{ (vượt tới hạn)}",
    quickFormulas: [
      "k = 1: phản ứng dây chuyền tự duy trì có kiểm soát",
      "Thanh điều khiển (Boron/Cadmium) hấp thụ neutron để điều chỉnh k",
      "Hai vòng nước sơ cấp và thứ cấp tách biệt trong lò PWR",
    ],
  },
  B25: {
    summary: "Vận dụng tổng hợp: đọc đồ thị độ phóng xạ H(t), cân bằng phương trình hạt nhân và tính năng lượng phản ứng.",
    latex: "H(t) = H_0 \\cdot 2^{-\\frac{t}{T}}, \\quad t = T \\cdot \\log_2\\!\\left(\\frac{H_0}{H(t)}\\right)",
    quickFormulas: [
      "Tại t = T thì H(T) = H₀ / 2",
      "t = T · ln(H₀ / H) / ln(2) (ước lượng tuổi mẫu phóng xạ)",
      "W_tỏa = (m_trước − m_sau) · c²",
    ],
  },
};

export function LectureVideoLibrary() {
  const [selectedCode, setSelectedCode] = useState<LessonCode>("B21");
  const [notesByLesson, setNotesByLesson] = useState<Record<LessonCode, LessonNote>>({
    B21: { formulas: "", question: "" },
    B22: { formulas: "", question: "" },
    B23: { formulas: "", question: "" },
    B24: { formulas: "", question: "" },
    B25: { formulas: "", question: "" },
  });
  const [downloadedNotice, setDownloadedNotice] = useState<string>("");

  const activeLesson =
    NUCLEAR_LAB_LESSONS.find((lesson) => lesson.code === selectedCode) ??
    NUCLEAR_LAB_LESSONS[0];
  const activeGuide = LESSON_FORMULA_GUIDES[activeLesson.code];
  const currentNote = notesByLesson[activeLesson.code];

  const updateNote = (field: keyof LessonNote, value: string) => {
    setDownloadedNotice("");
    setNotesByLesson((prev) => ({
      ...prev,
      [activeLesson.code]: {
        ...prev[activeLesson.code],
        [field]: value,
      },
    }));
  };

  const appendQuickFormula = (formulaText: string) => {
    setDownloadedNotice("");
    setNotesByLesson((prev) => {
      const existing = prev[activeLesson.code].formulas.trim();
      const nextFormulas = existing ? `${existing}\n- ${formulaText}` : `- ${formulaText}`;
      return {
        ...prev,
        [activeLesson.code]: {
          ...prev[activeLesson.code],
          formulas: nextFormulas,
        },
      };
    });
  };

  const handleDownloadNote = () => {
    const content = [
      `PHIẾU GHI CHÚ TRƯỚC GIỜ HỌC — VIDEO BÀI GIẢNG ${activeLesson.code}`,
      `Bài học: ${activeLesson.code} · ${activeLesson.title} (SGK Vật lí 12 trang ${activeLesson.pages})`,
      `Câu hỏi trọng tâm của bài: ${activeLesson.question}`,
      "",
      "1. CÔNG THỨC & KHÁI NIỆM TRỌNG TÂM EM GHI NHẬN:",
      currentNote.formulas.trim() || "(Chưa ghi công thức)",
      "",
      "2. CÂU HỎI / ĐIỀU CHƯA RÕ MANG ĐẾN LỚP:",
      currentNote.question.trim() || "(Chưa ghi câu hỏi)",
      "",
      "Lưu ý: Phiếu được xuất trực tiếp từ trình duyệt để học sinh nộp hoặc trao đổi trên lớp.",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ghi-chu-video-${activeLesson.code.toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadedNotice(`Đã tải phiếu ghi chú bài ${activeLesson.code} về máy.`);
  };

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Bộ chọn bài B21–B25 */}
      <div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-muted)",
            marginBottom: "10px",
          }}
        >
          Chọn bài học (SGK Vật lí 12 — Chương IV: Vật lí hạt nhân)
        </div>
        <div
          role="tablist"
          aria-label="Chọn bài giảng từ B21 đến B25"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "10px",
          }}
        >
          {NUCLEAR_LAB_LESSONS.map((lesson) => {
            const isSelected = lesson.code === activeLesson.code;
            const hasNote =
              Boolean(notesByLesson[lesson.code].formulas.trim()) ||
              Boolean(notesByLesson[lesson.code].question.trim());
            return (
              <button
                key={lesson.code}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setSelectedCode(lesson.code);
                  setDownloadedNotice("");
                }}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  border: isSelected
                    ? "2px solid var(--color-primary)"
                    : "1px solid var(--border-light)",
                  background: isSelected ? "var(--color-primary-soft)" : "var(--bg-page)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "6px",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    className="mono-tag"
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: isSelected ? "var(--color-primary)" : "var(--text-muted)",
                    }}
                  >
                    {lesson.code} · tr. {lesson.pages}
                  </span>
                  {hasNote && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--semantic-success)",
                      }}
                    >
                      Đã ghi chú
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 600, lineHeight: 1.35 }}>
                  {lesson.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Khung phát video bài giảng và nhiệm vụ quan sát */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: 700 }}>
              {activeLesson.code} · {activeLesson.title}
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
              Đối chiếu SGK Vật lí 12 trang {activeLesson.pages} · Hạt nhân minh họa:{" "}
              <strong>{activeLesson.isotopeLabel}</strong>
            </p>
          </div>

          <NuclearLessonVideo key={activeLesson.code} lesson={activeLesson} />

          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-page)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--color-primary)",
                marginBottom: "6px",
              }}
            >
              Nhiệm vụ khi xem video
            </div>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--text-primary)",
              }}
            >
              {activeLesson.videoTask}
            </p>
            <p
              style={{
                margin: "0 0 12px",
                fontSize: "13.5px",
                color: "var(--text-secondary)",
              }}
            >
              <strong>Câu hỏi định hướng:</strong> {activeLesson.question}
            </p>
            <Link
              href={`/hoc-lieu/truc-quan?bai=${activeLesson.code}`}
              style={{
                fontSize: "13.5px",
                fontWeight: 600,
                color: "var(--color-primary)",
                textDecoration: "none",
              }}
            >
              Mở tiếp mô phỏng trực quan bài {activeLesson.code} →
            </Link>
          </div>
        </div>

        {/* Khung ghi chú công thức & câu hỏi mang đến lớp */}
        <div
          style={{
            padding: "20px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-page)",
            border: "1px solid var(--border-light)",
            display: "grid",
            gap: "16px",
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700 }}>
              Phiếu ghi chú bài {activeLesson.code}
            </h3>
            <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-secondary)" }}>
              {activeGuide.summary}
            </p>
          </div>

          <div
            style={{
              padding: "12px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div
              style={{
                fontSize: "11.5px",
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}
            >
              Hệ thức trọng tâm đối chiếu SGK:
            </div>
            <LatexMath block math={activeGuide.latex} />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginTop: "8px",
              }}
            >
              {activeGuide.quickFormulas.map((formula) => (
                <button
                  key={formula}
                  type="button"
                  onClick={() => appendQuickFormula(formula)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "999px",
                    border: "1px solid var(--border-light)",
                    background: "var(--bg-surface-elevated)",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  + Chèn: {formula.split("(")[0].trim()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="lecture-formulas-input"
              style={{
                display: "block",
                fontSize: "13.5px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "6px",
              }}
            >
              1. Ghi chú công thức, kí hiệu & đơn vị cần nhớ
            </label>
            <textarea
              id="lecture-formulas-input"
              rows={4}
              value={currentNote.formulas}
              onChange={(e) => updateNote("formulas", e.target.value)}
              placeholder={`Ví dụ (${activeLesson.code}): Ghi rõ ý nghĩa từng đại lượng, đơn vị đo và điều kiện áp dụng...`}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-dark)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: "14px",
                lineHeight: 1.55,
                resize: "vertical",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="lecture-question-input"
              style={{
                display: "block",
                fontSize: "13.5px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "6px",
              }}
            >
              2. Câu hỏi còn vướng mang đến lớp thảo luận
            </label>
            <textarea
              id="lecture-question-input"
              rows={3}
              value={currentNote.question}
              onChange={(e) => updateNote("question", e.target.value)}
              placeholder={`Gợi ý: "${activeLesson.question}" hoặc nêu một điểm em thấy khác với suy nghĩ ban đầu...`}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-dark)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: "14px",
                lineHeight: 1.55,
                resize: "vertical",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={handleDownloadNote}
              style={{
                padding: "10px 16px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "var(--color-primary)",
                color: "var(--color-primary-on)",
                fontWeight: 600,
                fontSize: "13.5px",
                cursor: "pointer",
              }}
            >
              Tải phiếu ghi chú ({activeLesson.code}) về máy
            </button>

            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Lưu tạm trên trình duyệt hiện tại · Tải tệp `.txt` để nộp trên lớp.
            </span>
          </div>

          {downloadedNotice && (
            <p
              role="status"
              style={{
                margin: 0,
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                background: "var(--semantic-success-soft)",
                color: "var(--semantic-success)",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              ✓ {downloadedNotice}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
