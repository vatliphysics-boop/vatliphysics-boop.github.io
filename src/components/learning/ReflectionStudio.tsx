"use client";

import React, { useState } from "react";

interface RubricItem {
  id: string;
  title: string;
  description: string;
}

const SELF_EVALUATION_RUBRIC: RubricItem[] = [
  {
    id: "r1",
    title: "1. Cấu trúc hạt nhân & đồng vị (B21)",
    description:
      "Giải thích được thí nghiệm tán xạ alpha, đọc đúng số proton Z, số neutron N = A − Z và ước lượng kích thước hạt nhân.",
  },
  {
    id: "r2",
    title: "2. Năng lượng liên kết & phản ứng hạt nhân (B22)",
    description:
      "Tính được độ hụt khối Δm, năng lượng liên kết riêng Elkr và kiểm tra bảo toàn số khối A, điện tích Z trong phân hạch – nhiệt hạch.",
  },
  {
    id: "r3",
    title: "3. Hiện tượng phóng xạ & an toàn bức xạ (B23)",
    description:
      "Phân biệt được tia α, β⁻, β⁺, γ; áp dụng đúng N(t) = N₀·2^(−t/T), H = λN và ba nguyên tắc an toàn bức xạ.",
  },
  {
    id: "r4",
    title: "4. Công nghiệp hạt nhân & ứng dụng thực tiễn (B24)",
    description:
      "Trình bày được vai trò thanh điều khiển (k = 1), hai vòng trao đổi nhiệt PWR và ứng dụng đồng vị trong y học, nông nghiệp.",
  },
  {
    id: "r5",
    title: "5. Tự học, xử lí dữ liệu & kiểm chứng thông tin (B25 & SRL)",
    description:
      "Biết đọc chu kì bán rã từ bảng/đồ thị H(t), chủ động ghi lại câu sai để tự điều chỉnh và kiểm chứng công thức với SGK.",
  },
];

const RATING_LABELS: Record<number, string> = {
  1: "1 · Chưa hiểu rõ, cần học lại từ đầu",
  2: "2 · Mới nhớ khái niệm rời rạc, còn nhầm công thức",
  3: "3 · Hiểu cơ bản, làm được bài tập áp dụng trực tiếp",
  4: "4 · Nắm chắc bản chất, tự phát hiện và sửa được lỗi sai",
  5: "5 · Thành thạo, có thể giải thích rõ cho bạn cùng nhóm",
};

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function ReflectionStudio() {
  const [ratings, setRatings] = useState<Record<string, number>>({
    r1: 4,
    r2: 3,
    r3: 4,
    r4: 4,
    r5: 3,
  });
  const [teacherFeedbackNote, setTeacherFeedbackNote] = useState<string>("");
  const [reflectionText, setReflectionText] = useState<string>("");
  const [downloadedNotice, setDownloadedNotice] = useState<string>("");

  const wordCount = countWords(reflectionText);
  const averageScore = (
    Object.values(ratings).reduce((sum, val) => sum + val, 0) /
    SELF_EVALUATION_RUBRIC.length
  ).toFixed(1);

  const wordFeedback =
    wordCount === 0
      ? "Chưa nhập bài phản tư (mục tiêu khuyến nghị: 300–500 từ)"
      : wordCount < 300
        ? `Cần viết thêm khoảng ${300 - wordCount} từ để đạt độ sâu phản tư 300–500 từ`
        : wordCount <= 500
          ? "Độ dài phù hợp mục tiêu sản phẩm (300–500 từ)"
          : `Đang vượt ${wordCount - 500} từ so với khung gọn 300–500 từ`;

  const handleDownloadReflection = () => {
    const rubricLines = SELF_EVALUATION_RUBRIC.map(
      (item) => `- ${item.title}: Mức ${ratings[item.id]}/5 (${RATING_LABELS[ratings[item.id]]})`,
    ).join("\n");

    const content = [
      "PHIẾU TỰ ĐÁNH GIÁ & PHẢN TƯ SAU GIỜ HỌC — CHƯƠNG IV: VẬT LÍ HẠT NHÂN 12",
      "======================================================================",
      "",
      `I. KẾT QUẢ TỰ ĐÁNH GIÁ THEO TIÊU CHÍ (Trung bình: ${averageScore}/5):`,
      rubricLines,
      "",
      "II. GHI NHẬN NHẬN XÉT CỦA GIÁO VIÊN / BẠN CÙNG LỚP:",
      teacherFeedbackNote.trim() || "(Chưa ghi nhận xét trên lớp)",
      "",
      `III. BÀI VIẾT PHẢN TƯ & KẾ HOẠCH TỰ ĐIỀU CHỈNH (${wordCount} từ):`,
      reflectionText.trim() || "(Chưa nhập nội dung phản tư)",
      "",
      "Lưu ý: Tệp được xuất trực tiếp từ trình duyệt để học sinh lưu hồ sơ học tập hoặc nộp theo hướng dẫn của giáo viên.",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "phieu-phan-tu-vat-li-hat-nhan-12.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadedNotice("Đã tải phiếu tự đánh giá và bài phản tư (.txt) về máy.");
  };

  return (
    <div style={{ display: "grid", gap: "28px" }}>
      {/* Phần 1: Bảng tự đánh giá theo 5 tiêu chí */}
      <div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18.5px", fontWeight: 700 }}>
            1. Bảng tự đánh giá mức độ nắm vững & năng lực tự học
          </h2>
          <span
            className="mono-tag"
            style={{
              padding: "4px 10px",
              borderRadius: "999px",
              background: "var(--color-primary-soft)",
              color: "var(--color-primary)",
              fontSize: "12.5px",
              fontWeight: 700,
            }}
          >
            Mức tự đánh giá trung bình: {averageScore} / 5.0
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13.5px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
            }}
          >
            <thead>
              <tr style={{ background: "var(--bg-surface-elevated)", textAlign: "left" }}>
                <th style={{ padding: "12px", borderBottom: "1px solid var(--border-light)" }}>
                  Tiêu chí kiến thức & kĩ năng
                </th>
                <th
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid var(--border-light)",
                    minWidth: "230px",
                  }}
                >
                  Chọn mức tự đánh giá (1 → 5)
                </th>
              </tr>
            </thead>
            <tbody>
              {SELF_EVALUATION_RUBRIC.map((item) => {
                const currentVal = ratings[item.id];
                return (
                  <tr
                    key={item.id}
                    style={{ borderBottom: "1px solid var(--border-light)" }}
                  >
                    <td style={{ padding: "12px", verticalAlign: "top" }}>
                      <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
                        {item.title}
                      </div>
                      <div style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {item.description}
                      </div>
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                        {[1, 2, 3, 4, 5].map((level) => {
                          const selected = currentVal === level;
                          return (
                            <button
                              key={level}
                              type="button"
                              aria-pressed={selected}
                              aria-label={`${item.title}: mức ${level}`}
                              onClick={() => {
                                setDownloadedNotice("");
                                setRatings((prev) => ({ ...prev, [item.id]: level }));
                              }}
                              style={{
                                width: "36px",
                                height: "34px",
                                borderRadius: "var(--radius-sm)",
                                border: selected
                                  ? "2px solid var(--color-primary)"
                                  : "1px solid var(--border-dark)",
                                background: selected
                                  ? "var(--color-primary)"
                                  : "var(--bg-page)",
                                color: selected ? "#ffffff" : "var(--text-primary)",
                                fontWeight: 700,
                                fontSize: "13.5px",
                                cursor: "pointer",
                              }}
                            >
                              {level}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {RATING_LABELS[currentVal]}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phần 2: Ghi lại nhận xét từ giáo viên trên lớp */}
      <div
        style={{
          padding: "18px",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-page)",
          border: "1px solid var(--border-light)",
        }}
      >
        <label
          htmlFor="teacher-feedback-note"
          style={{
            display: "block",
            fontSize: "14.5px",
            fontWeight: 700,
            marginBottom: "6px",
          }}
        >
          2. Ghi nhận nhận xét từ giáo viên hoặc nhóm phản biện trên lớp (nếu có)
        </label>
        <p style={{ margin: "0 0 10px", fontSize: "13px", color: "var(--text-secondary)" }}>
          Ghi lại những điểm giáo viên đã góp ý cho phiếu học tập, đồ thị hoặc phần thảo luận của
          em để đối chiếu khi sửa bài.
        </p>
        <textarea
          id="teacher-feedback-note"
          rows={3}
          value={teacherFeedbackNote}
          onChange={(e) => {
            setDownloadedNotice("");
            setTeacherFeedbackNote(e.target.value);
          }}
          placeholder="Ví dụ: Giáo viên lưu ý cần đổi chu kì bán rã T ra giây trước khi nhân với N để tính độ phóng xạ H theo đơn vị Bq..."
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-dark)",
            background: "var(--bg-surface)",
            fontSize: "14px",
            lineHeight: 1.55,
            resize: "vertical",
          }}
        />
      </div>

      {/* Phần 3: Khung viết phản tư có đếm từ & nút tải về máy */}
      <div
        style={{
          padding: "20px",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-page)",
          border: "1px solid var(--border-light)",
          display: "grid",
          gap: "14px",
        }}
      >
        <div>
          <label
            htmlFor="reflection-essay-input"
            style={{
              display: "block",
              fontSize: "16px",
              fontWeight: 700,
              marginBottom: "6px",
            }}
          >
            3. Bài viết phản tư & kế hoạch tự điều chỉnh (khuyến nghị 300–500 từ)
          </label>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.55 }}>
            Gợi ý cấu trúc 3 đoạn: (a) Những khái niệm/quy luật vật lí hạt nhân em đã hiểu sâu hơn
            sau chuỗi hoạt động trước và trong giờ; (b) Một nhầm lẫn cụ thể em đã gặp (ví dụ giữa số
            hạt còn lại N và số hạt đã phân rã ΔN, hoặc bảo toàn khối lượng nghỉ) và cách khắc phục;
            (c) Kế hoạch xem lại bài giảng/mô phỏng nào trong tuần tới.
          </div>
        </div>

        <textarea
          id="reflection-essay-input"
          rows={10}
          value={reflectionText}
          onChange={(e) => {
            setDownloadedNotice("");
            setReflectionText(e.target.value);
          }}
          placeholder="Nhập bài phản tư 300–500 từ của em tại đây..."
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-dark)",
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            fontSize: "14px",
            lineHeight: 1.65,
            resize: "vertical",
          }}
        />

        <div
          role="status"
          aria-live="polite"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            padding: "10px 12px",
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-light)",
            fontSize: "13px",
          }}
        >
          <span>
            Đếm từ trực tiếp: <strong>{wordCount} từ</strong>
          </span>
          <span
            style={{
              fontWeight: 600,
              color:
                wordCount >= 300 && wordCount <= 500
                  ? "var(--semantic-success)"
                  : "var(--text-muted)",
            }}
          >
            {wordFeedback}
          </span>
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
            onClick={handleDownloadReflection}
            style={{
              padding: "10px 18px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "var(--color-primary)",
              color: "var(--color-primary-on)",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Tải bản phản tư về máy (.txt)
          </button>

          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Trang công khai không tự đồng bộ bài viết lên máy chủ; hãy tải tệp về máy để lưu trữ và nộp bài.
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
  );
}
