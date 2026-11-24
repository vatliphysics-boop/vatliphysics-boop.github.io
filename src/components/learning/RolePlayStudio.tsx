"use client";

import React, { useState } from "react";
import { LatexMath } from "@/components/learning/LatexMath";

interface RolePersona {
  id: "physicist" | "doctor" | "safety-engineer" | "resident";
  title: string;
  badge: string;
  focus: string;
  latex: string;
  scientificFacts: string[];
  guidingQuestions: string[];
}

const SCENARIO_CONTEXT = {
  title:
    "Phiên tham vấn cộng đồng: Dự án Trung tâm Ứng dụng Bức xạ Y tế – Nông nghiệp và Lò phản ứng nghiên cứu",
  description:
    "Địa phương đang lấy ý kiến chuyên môn và cộng đồng về việc vận hành một trung tâm hạt nhân phục vụ sản xuất dược chất phóng xạ y tế, chiếu xạ bảo quản nông sản xuất khẩu và nghiên cứu năng lượng sạch. Nhóm em hãy chọn một trong 4 vai dưới đây, đối chiếu kiến thức Vật lí hạt nhân 12 để xây dựng bản lập luận có căn cứ khoa học.",
};

const ROLE_PERSONAS: RolePersona[] = [
  {
    id: "physicist",
    title: "Nhà vật lí hạt nhân",
    badge: "VAI 1 · CƠ CHẾ PHẢN ỨNG & NĂNG LƯỢNG",
    focus:
      "Giải thích bản chất phản ứng phân hạch dây chuyền có kiểm soát (k = 1) và mật độ năng lượng liên kết hạt nhân.",
    latex: "k = 1 \\text{ (trạng thái tới hạn ổn định)}, \\qquad E_{\\text{lk}} = \\Delta m \\cdot c^2",
    scientificFacts: [
      "Nhiên liệu trong lò phản ứng dân dụng chỉ làm giàu Uranium-235 ở mức thấp (khoảng 3–5%), khác hoàn toàn về mặt vật lí với vũ khí hạt nhân nên không thể xảy ra vụ nổ nguyên tử.",
      "Thanh điều khiển chứa Boron hoặc Cadmium hấp thụ neutron chậm giúp duy trì hệ số nhân neutron k = 1 ổn định và có thể dập tắt phản ứng dây chuyền (k < 1) ngay khi cần thiết.",
      "Phản ứng hạt nhân biến đổi ở cấp độ hạt nhân (A, Z), giải phóng năng lượng lớn hơn hàng triệu lần so với phản ứng đốt cháy hóa học cùng khối lượng mà không phát thải trực tiếp khí CO₂.",
    ],
    guidingQuestions: [
      "Vì sao việc cắm sâu thanh điều khiển chứa Boron/Cadmium lại đưa hệ số nhân neutron xuống k < 1?",
      "Cần giải thích thế nào để người dân phân biệt rõ lò phản ứng nghiên cứu/điện hạt nhân với bom nguyên tử?",
    ],
  },
  {
    id: "doctor",
    title: "Bác sĩ y học hạt nhân",
    badge: "VAI 2 · CHẨN ĐOÁN & ĐIỀU TRỊ Y TẾ",
    focus:
      "Làm rõ lợi ích của đồng vị phóng xạ chu kì bán rã ngắn trong chẩn đoán sớm (PET/SPECT) và xạ trị ung thư.",
    latex: "H(t) = H_0 \\cdot 2^{-\\frac{t}{T}} \\quad ({}^{18}\\mathrm{F}: T \\approx 110\\text{ phút};\\; {}^{131}\\mathrm{I}: T \\approx 8\\text{ ngày})",
    scientificFacts: [
      "Các dược chất phóng xạ chẩn đoán như Fluorine-18 (T ≈ 110 phút) hay Technetium-99m (T ≈ 6 giờ) có chu kì bán rã rất ngắn, giúp ghi ảnh chức năng cơ quan chính xác rồi giảm nhanh độ phóng xạ trong cơ thể.",
      "Trong điều trị tuyến giáp bằng Iodine-131 hoặc xạ trị ngoài bằng Cobalt-60, liều chiếu được tính toán để tập trung tiêu diệt tế bào khối u và hạn chế tối đa tổn thương mô lành xung quanh.",
      "Nếu sản xuất được đồng vị ngắn ngày ngay trong nước/khu vực, bệnh viện sẽ chủ động được nguồn thuốc trước khi đồng vị kịp phân rã hết trên đường vận chuyển xa.",
    ],
    guidingQuestions: [
      "Vì sao trong chẩn đoán hình ảnh y khoa, bác sĩ ưu tiên chọn đồng vị phóng xạ có chu kì bán rã T ngắn (vài giờ) thay vì vài năm?",
      "Sau khoảng bao nhiêu chu kì bán rã thì độ phóng xạ H(t) của dược chất trong cơ thể giảm xuống dưới 1% mức ban đầu?",
    ],
  },
  {
    id: "safety-engineer",
    title: "Kỹ sư an toàn bức xạ",
    badge: "VAI 3 · CHE CHẮN & QUAN TRẮC BỨC XẠ",
    focus:
      "Thiết lập quy trình bảo vệ 3 nguyên tắc (Thời gian – Khoảng cách – Che chắn) và quản lí chất thải phóng xạ.",
    latex: "H(t) = \\lambda N(t) = \\frac{\\ln 2}{T} N(t), \\qquad I \\propto \\frac{1}{r^2}",
    scientificFacts: [
      "Ba nguyên tắc an toàn cốt lõi được áp dụng nghiêm ngặt: giảm thời gian tiếp xúc, tăng khoảng cách tới nguồn và dùng nhiều lớp che chắn (bê tông cốt thép dày, chì, nước) phù hợp từng loại tia α, β, γ.",
      "Nông sản chiếu xạ bằng tia gamma từ nguồn Cobalt-60 kín chỉ nhận năng lượng bức xạ để diệt vi sinh vật, hoàn toàn không tiếp xúc trực tiếp với bụi phóng xạ và không trở thành chất phóng xạ.",
      "Chất thải phóng xạ hoạt độ thấp và trung bình được thu gom, đóng rắn trong thùng chuyên dụng, lưu giữ cách li và đo kiểm độ phóng xạ định kì bằng ống đếm bức xạ.",
    ],
    guidingQuestions: [
      "Khả năng đâm xuyên của tia α, β và γ khác nhau thế nào và ảnh hưởng ra sao đến việc chọn vật liệu che chắn?",
      "Vì sao thực phẩm đã qua dây chuyền chiếu xạ tia gamma không gây nhiễm phóng xạ cho người tiêu dùng?",
    ],
  },
  {
    id: "resident",
    title: "Người dân địa phương",
    badge: "VAI 4 · CỘNG ĐỒNG & GIÁM SÁT MINH BẠCH",
    focus:
      "Đặt câu hỏi phản biện thiết thực về an toàn nguồn nước, nông sản, cảnh báo sớm và minh bạch số liệu đo bức xạ.",
    latex: "N(t) = N_0 \\cdot 2^{-\\frac{t}{T}} \\quad (t = 10T \\Rightarrow N \\approx \\frac{N_0}{1024} < 0{,}1\\%\\,N_0)",
    scientificFacts: [
      "Người dân ủng hộ phát triển y tế và bảo quản nông sản nhưng yêu cầu công khai minh bạch chỉ số quan trắc bức xạ môi trường (không khí, nước ngầm) theo thời gian thực.",
      "Cần có quy định vùng bảo vệ rõ ràng gắn biển cảnh báo bức xạ ion hóa theo chuẩn quốc gia và phương án diễn tập ứng phó sự cố định kì cho khu dân cư.",
      "Đối với các đồng vị có chu kì bán rã dài, cộng đồng yêu cầu cam kết bằng văn bản về quy trình lưu giữ kín an toàn trong suốt nhiều chu kì bán rã.",
    ],
    guidingQuestions: [
      "Những thông tin vật lí nào (độ phóng xạ phông tự nhiên, khoảng cách an toàn, quy trình xử lí nước làm mát) cần được công bố dễ hiểu cho người dân?",
      "Nếu xảy ra cảnh báo rò rỉ phóng xạ, người dân cần thực hiện ngay những nguyên tắc an toàn nào để giảm liều chiếu?",
    ],
  },
];

function countVietnameseWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function RolePlayStudio() {
  const [selectedRoleId, setSelectedRoleId] =
    useState<RolePersona["id"]>("physicist");
  const [draftsByRole, setDraftsByRole] = useState<
    Record<RolePersona["id"], string>
  >({
    physicist: "",
    doctor: "",
    "safety-engineer": "",
    resident: "",
  });
  const [groupLabel, setGroupLabel] = useState<string>("");

  const activeRole =
    ROLE_PERSONAS.find((r) => r.id === selectedRoleId) ?? ROLE_PERSONAS[0];
  const currentDraft = draftsByRole[activeRole.id];
  const wordCount = countVietnameseWords(currentDraft);

  const wordStatus =
    wordCount === 0
      ? "Chưa nhập nội dung"
      : wordCount < 500
        ? `Còn thiếu ${500 - wordCount} từ để đạt mốc khuyến nghị (500–800 từ)`
        : wordCount <= 800
          ? "Đạt độ dài khuyến nghị (500–800 từ)"
          : `Đang vượt ${wordCount - 800} từ so với khung tóm tắt 500–800 từ`;

  const handleDownloadArgument = () => {
    const content = [
      "BẢN LẬP LUẬN ĐÓNG VAI — HOẠT ĐỘNG 2.3 (TRONG GIỜ HỌC)",
      groupLabel.trim() ? `Nhóm thực hiện: ${groupLabel.trim()}` : "",
      `Vai đóng: ${activeRole.title}`,
      `Bối cảnh: ${SCENARIO_CONTEXT.title}`,
      `Số từ hiện tại: ${wordCount} từ`,
      "==========================================================",
      "",
      currentDraft.trim() || "(Chưa có nội dung lập luận)",
      "",
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lap-luan-dong-vai-${activeRole.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Khung tình huống chung */}
      <div
        style={{
          padding: "20px",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-page)",
          border: "1px solid var(--border-light)",
        }}
      >
        <div
          className="mono-tag"
          style={{
            fontSize: "11.5px",
            fontWeight: 700,
            color: "var(--color-primary)",
            marginBottom: "6px",
          }}
        >
          TÌNH HUỐNG GIẢ ĐỊNH TRÊN LỚP
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: "18.5px", fontWeight: 700 }}>
          {SCENARIO_CONTEXT.title}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "14.5px",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
          }}
        >
          {SCENARIO_CONTEXT.description}
        </p>
      </div>

      {/* Bộ chọn 4 vai */}
      <div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-muted)",
            marginBottom: "10px",
          }}
        >
          Chọn vai của nhóm em (4 góc nhìn chuyên môn & cộng đồng):
        </div>
        <div
          role="tablist"
          aria-label="Chọn vai trong tình huống đóng vai"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: "12px",
          }}
        >
          {ROLE_PERSONAS.map((persona) => {
            const isSelected = persona.id === activeRole.id;
            const roleWords = countVietnameseWords(draftsByRole[persona.id]);
            return (
              <button
                key={persona.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedRoleId(persona.id)}
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  border: isSelected
                    ? "2px solid var(--color-primary)"
                    : "1px solid var(--border-light)",
                  background: isSelected ? "var(--color-primary-soft)" : "var(--bg-surface)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                <div
                  className="mono-tag"
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: isSelected ? "var(--color-primary)" : "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  {persona.badge}
                </div>
                <div style={{ fontSize: "15.5px", fontWeight: 700, marginBottom: "4px" }}>
                  {persona.title}
                </div>
                <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                  {roleWords > 0 ? `Đã soạn: ${roleWords} từ` : "Nhấp để xem dữ kiện & soạn bài"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hồ sơ vai & Câu hỏi gợi mở lập luận */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-light)",
            background: "var(--bg-surface)",
            display: "grid",
            gap: "14px",
          }}
        >
          <div>
            <span
              className="mono-tag"
              style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--color-primary)" }}
            >
              HỒ SƠ DỮ KIỆN VẬT LÍ CHO VAI ĐÓNG
            </span>
            <h3 style={{ margin: "4px 0 6px", fontSize: "18px", fontWeight: 700 }}>
              {activeRole.title}
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
              {activeRole.focus}
            </p>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-page)",
              border: "1px solid var(--border-light)",
            }}
          >
            <LatexMath block math={activeRole.latex} />
          </div>

          <div>
            <div style={{ fontSize: "13.5px", fontWeight: 700, marginBottom: "8px" }}>
              Căn cứ khoa học đối chiếu SGK Vật lí 12:
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: "20px",
                display: "grid",
                gap: "8px",
                fontSize: "13.5px",
                lineHeight: 1.55,
                color: "var(--text-primary)",
              }}
            >
              {activeRole.scientificFacts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </div>

          <div
            style={{
              padding: "14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-accent-soft)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-accent)",
                marginBottom: "6px",
              }}
            >
              Câu hỏi tình huống nhóm cần giải quyết trong bài phát biểu:
            </div>
            <ol
              style={{
                margin: 0,
                paddingLeft: "18px",
                display: "grid",
                gap: "6px",
                fontSize: "13.5px",
                lineHeight: 1.55,
                color: "var(--text-primary)",
              }}
            >
              {activeRole.guidingQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* Khung soạn lập luận có đếm từ */}
        <div
          style={{
            padding: "20px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-light)",
            background: "var(--bg-page)",
            display: "grid",
            gap: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>
              Khung soạn lập luận ({activeRole.title})
            </h3>
            <input
              type="text"
              value={groupLabel}
              onChange={(e) => setGroupLabel(e.target.value)}
              placeholder="Tên nhóm / thành viên..."
              aria-label="Tên nhóm thực hiện"
              style={{
                padding: "6px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-dark)",
                background: "var(--bg-surface)",
                fontSize: "13px",
              }}
            />
          </div>

          <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Gợi ý bố cục (500–800 từ): (1) Nêu rõ quan điểm và mối quan tâm chính của vai; (2) Phân
            tích ít nhất hai luận điểm có dùng công thức/định luật vật lí hạt nhân; (3) Đề xuất giải
            pháp phối hợp với các bên còn lại.
          </div>

          <textarea
            rows={12}
            value={currentDraft}
            onChange={(e) =>
              setDraftsByRole((prev) => ({
                ...prev,
                [activeRole.id]: e.target.value,
              }))
            }
            aria-label={`Nội dung lập luận cho vai ${activeRole.title}`}
            placeholder={`Nhập bản tóm tắt lập luận của nhóm trong vai "${activeRole.title}"...`}
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
              Số từ hiện tại: <strong>{wordCount} từ</strong>
            </span>
            <span
              style={{
                fontWeight: 600,
                color:
                  wordCount >= 500 && wordCount <= 800
                    ? "var(--semantic-success)"
                    : "var(--text-muted)",
              }}
            >
              {wordStatus}
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
              onClick={handleDownloadArgument}
              style={{
                padding: "10px 16px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "var(--color-primary)",
                color: "var(--color-primary-on)",
                fontWeight: 700,
                fontSize: "13.5px",
                cursor: "pointer",
              }}
            >
              Tải bản lập luận (.txt)
            </button>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Nội dung lưu trong phiên trình duyệt hiện tại; hãy tải tệp về máy trước khi đóng trang.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
