"use client";

import React, { useState } from "react";
import { LatexMath } from "@/components/learning/LatexMath";

type ApplicationId = "pwr" | "medicine" | "agriculture" | "carbon14";

interface ApplicationTopic {
  id: ApplicationId;
  title: string;
  tag: string;
  sgkConnection: string;
  latex: string;
  mechanismSummary: string;
  physicsQuestions: string[];
  sourceSuggestions: string[];
}

interface ReportOutline {
  researchQuestion: string;
  physicsPrinciple: string;
  processAndSafety: string;
  referencesToVerify: string;
}

const APPLICATION_TOPICS: ApplicationTopic[] = [
  {
    id: "pwr",
    title: "Điện hạt nhân PWR",
    tag: "NĂNG LƯỢNG · BÀI 22 & BÀI 24",
    sgkConnection: "Đối chiếu SGK Vật lí 12: Phân hạch hạt nhân (B22) và Nhà máy điện hạt nhân (B24).",
    latex: "{}_{0}^{1}\\mathrm{n} + {}_{92}^{235}\\mathrm{U} \\rightarrow \\mathrm{X} + \\mathrm{Y} + k\\,{}_{0}^{1}\\mathrm{n}, \\qquad k = 1",
    mechanismSummary:
      "Lò phản ứng nước áp lực (Pressurized Water Reactor — PWR) duy trì phản ứng phân hạch dây chuyền ở trạng thái tới hạn k = 1 nhờ hệ thống chất làm chậm và thanh điều khiển hấp thụ neutron. Nước ở vòng sơ cấp chịu áp suất cao nhận nhiệt từ tâm lò rồi truyền qua bộ sinh hơi sang vòng thứ cấp để quay tua-bin phát điện mà không trộn lẫn hai dòng nước.",
    physicsQuestions: [
      "Thanh điều khiển chứa Boron/Cadmium và nước làm chậm tác động lên những đại lượng vật lí nào của chùm neutron trong tâm lò?",
      "Vì sao việc giữ áp suất cao ở vòng sơ cấp giúp nước nhận nhiệt lớn mà không sôi ngay trong vùng hoạt?",
      "Thiết kế tách biệt vòng sơ cấp và vòng thứ cấp giải quyết bài toán an toàn phóng xạ nào?",
      "Thách thức vật lí lớn nhất trong việc lưu giữ nhiên liệu hạt nhân đã qua sử dụng là gì?",
    ],
    sourceSuggestions: [
      "SGK Vật lí 12 (Chương IV — Bài 22 & Bài 24)",
      "Tài liệu phổ biến kiến thức của Cơ quan Năng lượng Nguyên tử Quốc tế (IAEA) về lò PWR",
      "Thông tin khoa học từ Viện Năng lượng nguyên tử Việt Nam (VINATOM) / Cục An toàn bức xạ và hạt nhân",
    ],
  },
  {
    id: "medicine",
    title: "Y học hạt nhân chẩn đoán/điều trị",
    tag: "Y TẾ · BÀI 23 & BÀI 24",
    sgkConnection: "Đối chiếu SGK Vật lí 12: Tia phóng xạ α, β, γ (B23) và Y học hạt nhân (B24).",
    latex: "H(t) = H_0 \\cdot 2^{-\\frac{t}{T}} \\quad ({}^{18}\\mathrm{F}:\\; \\beta^+,\\qquad {}^{131}\\mathrm{I}:\\; \\beta^-,\\,\\gamma,\\qquad {}^{60}\\mathrm{Co}:\\; \\gamma)",
    mechanismSummary:
      "Chẩn đoán hình ảnh chức năng (PET, SPECT) sử dụng dược chất gắn đồng vị phát tia β⁺ hoặc γ có chu kì bán rã ngắn (như ¹⁸F, ⁹⁹ᵐTc) để ghi nhận quá trình chuyển hóa tại mô đích. Trong điều trị, bức xạ ion hóa năng lượng phù hợp (như ¹³¹I cho tuyến giáp hoặc chùm tia γ từ ⁶⁰Co) được định hướng để tiêu diệt tế bào ung thư.",
    physicsQuestions: [
      "Tiêu chí chọn chu kì bán rã T và loại tia phóng xạ cho mục đích chẩn đoán khác với mục đích điều trị hủy tế bào u như thế nào?",
      "Trong kĩ thuật chụp PET, sự hủy cặp giữa positron (β⁺) và electron tạo ra các photon theo phương truyền đặc biệt nào giúp định vị khối u?",
      "Nhân viên y tế vận dụng 3 nguyên tắc an toàn phóng xạ (thời gian, khoảng cách, che chắn) ra sao khi thao tác với dược chất phóng xạ?",
      "Vì sao người bệnh điều trị bằng Iodine-131 liều cao cần tuân thủ hướng dẫn cách li tạm thời trong những ngày đầu?",
    ],
    sourceSuggestions: [
      "SGK Vật lí 12 (Bài 23: Hiện tượng phóng xạ & Bài 24: Công nghiệp hạt nhân)",
      "Tài liệu hướng dẫn an toàn bức xạ trong y tế của Bộ Y tế / Bộ Khoa học và Công nghệ",
      "Chuyên trang thông tin bệnh nhân về PET/CT và xạ trị của IAEA (RPOP)",
    ],
  },
  {
    id: "agriculture",
    title: "Chiếu xạ nông sản & giống cây trồng",
    tag: "NÔNG NGHIỆP & THỰC PHẨM · BÀI 24",
    sgkConnection: "Đối chiếu SGK Vật lí 12: Ứng dụng phóng xạ trong nông nghiệp và bảo quản thực phẩm (B24).",
    latex: "{}_{27}^{60}\\mathrm{Co} \\rightarrow {}_{28}^{60}\\mathrm{Ni}^* + {}_{-1}^{0}\\mathrm{e} + \\bar{\\nu}_e \\;\\Rightarrow\\; \\text{phát tia } \\gamma",
    mechanismSummary:
      "Chùm tia gamma đâm xuyên mạnh từ nguồn kín Cobalt-60 (hoặc chùm electron từ máy gia tốc) chiếu qua kiện nông sản giúp phá hủy cấu trúc di truyền của vi khuẩn, côn trùng kiểm dịch và làm chậm sự nảy mầm. Trong chọn giống, chiếu xạ liều kiểm soát lên hạt giống tạo biến dị đột biến để chọn lọc giống năng suất cao, chịu mặn hoặc kháng sâu bệnh.",
    physicsQuestions: [
      "Dựa vào bản chất vật lí của photon tia gamma, hãy giải thích vì sao chiếu xạ thanh trùng KHÔNG làm nông sản trở thành chất phóng xạ?",
      "Vì sao dây chuyền chiếu xạ công nghiệp dùng tia gamma (hoặc tia X/chùm electron) thay vì dùng nguồn phát tia alpha?",
      "Buồng chiếu xạ Cobalt-60 được che chắn bằng tường bê tông dày hoặc bể nước sâu dựa trên nguyên lí vật lí nào?",
      "Sự khác biệt về mục đích sinh học giữa chiếu xạ bảo quản nông sản thương phẩm và chiếu xạ gây đột biến tạo giống mới là gì?",
    ],
    sourceSuggestions: [
      "SGK Vật lí 12 (Bài 24: Công nghiệp hạt nhân)",
      "Ấn phẩm FAO/IAEA về ứng dụng kĩ thuật hạt nhân trong lương thực và nông nghiệp",
      "Báo cáo khoa học công khai của Trung tâm Chiếu xạ / Viện Di truyền Nông nghiệp",
    ],
  },
  {
    id: "carbon14",
    title: "Định tuổi Carbon-14",
    tag: "KHẢO CỔ & ĐỊA CHẤT · BÀI 23 & BÀI 25",
    sgkConnection: "Đối chiếu SGK Vật lí 12: Định luật phóng xạ (B23) và Bài tập định tuổi đồng vị (B25).",
    latex: "{}_{6}^{14}\\mathrm{C} \\rightarrow {}_{7}^{14}\\mathrm{N} + {}_{-1}^{0}\\mathrm{e} + \\bar{\\nu}_e \\quad (T \\approx 5730\\text{ năm}), \\qquad t = T \\cdot \\log_2\\!\\left(\\frac{H_0}{H}\\right)",
    mechanismSummary:
      "Khi sinh vật còn sống, quá trình trao đổi chất giữ tỉ lệ đồng vị phóng xạ ¹⁴C / ¹²C trong cơ thể xấp xỉ không đổi với khí quyển. Khi sinh vật chết đi, sự trao đổi carbon dừng lại và lượng ¹⁴C giảm dần theo định luật phóng xạ với chu kì bán rã T ≈ 5730 năm. Đo tỉ số độ phóng xạ riêng H của mẫu cổ vật so với mẫu hiện đại H₀ cho phép ước lượng niên đại mẫu.",
    physicsQuestions: [
      "Đồng vị ¹⁴C được hình thành liên tục trong tầng cao khí quyển từ phản ứng giữa neutron tia vũ trụ và hạt nhân ¹⁴N theo phương trình nào?",
      "Vì sao phương pháp ¹⁴C chỉ áp dụng cho mẫu vật có nguồn gốc hữu cơ (gỗ, than củi, xương, vải sợi tự nhiên) mà không dùng trực tiếp để đo tuổi tượng đồng hay gốm sứ?",
      "Nếu mẫu vật có tuổi quá lớn (ví dụ hàng triệu năm, tức hàng trăm chu kì T), vì sao phép đo ¹⁴C không còn chính xác?",
      "Những yếu tố thực tế nào khiến các nhà khoa học phải hiệu chuẩn thêm đường cong ¹⁴C thay vì giả sử H₀ hoàn toàn bất biến qua mọi thiên niên kỉ?",
    ],
    sourceSuggestions: [
      "SGK Vật lí 12 (Bài 23 & Bài 25 — bài toán đồng vị Carbon-14)",
      "Tài liệu Nobel Hóa học 1960 của Willard F. Libby về phương pháp định tuổi bằng Carbon phóng xạ",
      "Giáo trình Vật lí nguyên tử và hạt nhân đại cương (NXB Giáo dục Việt Nam)",
    ],
  },
];

const EMPTY_OUTLINE: ReportOutline = {
  researchQuestion: "",
  physicsPrinciple: "",
  processAndSafety: "",
  referencesToVerify: "",
};

export function ApplicationExplorer() {
  const [selectedId, setSelectedId] = useState<ApplicationId>("pwr");
  const [outlines, setOutlines] = useState<Record<ApplicationId, ReportOutline>>({
    pwr: { ...EMPTY_OUTLINE },
    medicine: { ...EMPTY_OUTLINE },
    agriculture: { ...EMPTY_OUTLINE },
    carbon14: { ...EMPTY_OUTLINE },
  });

  const activeTopic =
    APPLICATION_TOPICS.find((t) => t.id === selectedId) ?? APPLICATION_TOPICS[0];
  const currentOutline = outlines[activeTopic.id];

  const updateField = (field: keyof ReportOutline, value: string) => {
    setOutlines((prev) => ({
      ...prev,
      [activeTopic.id]: {
        ...prev[activeTopic.id],
        [field]: value,
      },
    }));
  };

  const handleDownloadOutline = () => {
    const markdown = [
      `# Dàn ý báo cáo vận dụng: ${activeTopic.title}`,
      "",
      `- **Liên hệ chương trình:** ${activeTopic.sgkConnection}`,
      "",
      "## 1. Mục tiêu tìm hiểu & câu hỏi vật lí trọng tâm",
      currentOutline.researchQuestion.trim() || "- (Chưa điền)",
      "",
      "## 2. Cơ sở vật lí hạt nhân áp dụng (khái niệm, định luật, phương trình)",
      currentOutline.physicsPrinciple.trim() || "- (Chưa điền)",
      "",
      "## 3. Quy trình ứng dụng thực tế & nguyên tắc an toàn bức xạ / giới hạn phương pháp",
      currentOutline.processAndSafety.trim() || "- (Chưa điền)",
      "",
      "## 4. Nguồn tài liệu dự kiến tra cứu & kiểm chứng số liệu",
      currentOutline.referencesToVerify.trim() || "- (Chưa điền)",
      "",
      "---",
      "*Ghi chú: Dàn ý lập trên trang học liệu công khai; học sinh tự tra cứu và trích dẫn nguồn khoa học xác thực trước khi hoàn thiện báo cáo.*",
    ].join("\n");

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dan-y-bao-cao-${activeTopic.id}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Chọn 1 trong 4 ứng dụng thực tiễn */}
      <div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-muted)",
            marginBottom: "10px",
          }}
        >
          Chọn 1 trong 4 chủ đề ứng dụng thực tiễn để khám phá và lập dàn ý:
        </div>
        <div
          role="tablist"
          aria-label="Chọn ứng dụng thực tiễn của vật lí hạt nhân"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
            gap: "12px",
          }}
        >
          {APPLICATION_TOPICS.map((topic) => {
            const isSelected = topic.id === activeTopic.id;
            return (
              <button
                key={topic.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedId(topic.id)}
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
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
                  className="mono-tag"
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: isSelected ? "var(--color-primary)" : "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  {topic.tag}
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, lineHeight: 1.35 }}>
                  {topic.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nội dung gợi mở vật lí & Khung lập dàn ý báo cáo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: "22px",
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
            gap: "16px",
          }}
        >
          <div>
            <span
              className="mono-tag"
              style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--color-primary)" }}
            >
              TỔNG QUAN CƠ SỞ VẬT LÍ
            </span>
            <h2 style={{ margin: "4px 0 6px", fontSize: "20px", fontWeight: 700 }}>
              {activeTopic.title}
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
              {activeTopic.sgkConnection}
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
            <LatexMath block math={activeTopic.latex} />
          </div>

          <p
            style={{
              margin: 0,
              fontSize: "14px",
              lineHeight: 1.65,
              color: "var(--text-primary)",
            }}
          >
            {activeTopic.mechanismSummary}
          </p>

          <div
            style={{
              padding: "14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-primary-soft)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-primary)",
                marginBottom: "8px",
              }}
            >
              Câu hỏi vật lí gợi ý tìm hiểu sâu:
            </div>
            <ol
              style={{
                margin: 0,
                paddingLeft: "18px",
                display: "grid",
                gap: "8px",
                fontSize: "13.5px",
                lineHeight: 1.55,
                color: "var(--text-primary)",
              }}
            >
              {activeTopic.physicsQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </div>

          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
              Gợi ý nguồn tài liệu uy tín để tự tra cứu:
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: "18px",
                display: "grid",
                gap: "4px",
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              {activeTopic.sourceSuggestions.map((src) => (
                <li key={src}>{src}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Khung lập dàn ý báo cáo ngắn */}
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
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: "17.5px", fontWeight: 700 }}>
              Khung lập dàn ý báo cáo ngắn: {activeTopic.title}
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
              Điền các ý chính theo 4 mục dưới đây rồi xuất tệp `.md` để hoàn thiện báo cáo của em.
            </p>
          </div>

          <div>
            <label
              htmlFor="outline-question"
              style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "5px" }}
            >
              1. Vấn đề thực tiễn & câu hỏi trọng tâm báo cáo muốn giải đáp
            </label>
            <textarea
              id="outline-question"
              rows={2}
              value={currentOutline.researchQuestion}
              onChange={(e) => updateField("researchQuestion", e.target.value)}
              placeholder="Ví dụ: Làm thế nào nhà máy điện hạt nhân kiểm soát phản ứng phân hạch ổn định và cách li phóng xạ với tua-bin phát điện?"
              style={{
                width: "100%",
                padding: "9px 11px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-dark)",
                background: "var(--bg-surface)",
                fontSize: "13.5px",
                lineHeight: 1.5,
              }}
            />
          </div>

          <div>
            <label
              htmlFor="outline-principle"
              style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "5px" }}
            >
              2. Cơ sở vật lí hạt nhân áp dụng (định luật, đồng vị, công thức chính)
            </label>
            <textarea
              id="outline-principle"
              rows={3}
              value={currentOutline.physicsPrinciple}
              onChange={(e) => updateField("physicsPrinciple", e.target.value)}
              placeholder="Ghi rõ đồng vị sử dụng, loại tia/hạt tham gia, phương trình hạt nhân hoặc quy luật bán rã..."
              style={{
                width: "100%",
                padding: "9px 11px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-dark)",
                background: "var(--bg-surface)",
                fontSize: "13.5px",
                lineHeight: 1.5,
              }}
            />
          </div>

          <div>
            <label
              htmlFor="outline-safety"
              style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "5px" }}
            >
              3. Quy trình vận hành cơ bản, an toàn bức xạ & giới hạn của phương pháp
            </label>
            <textarea
              id="outline-safety"
              rows={3}
              value={currentOutline.processAndSafety}
              onChange={(e) => updateField("processAndSafety", e.target.value)}
              placeholder="Nêu rõ biện pháp che chắn/cách li hoặc phạm vi áp dụng đúng của kĩ thuật..."
              style={{
                width: "100%",
                padding: "9px 11px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-dark)",
                background: "var(--bg-surface)",
                fontSize: "13.5px",
                lineHeight: 1.5,
              }}
            />
          </div>

          <div>
            <label
              htmlFor="outline-refs"
              style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "5px" }}
            >
              4. Danh mục nguồn tài liệu em sẽ đối chiếu và trích dẫn (không tự bịa số liệu)
            </label>
            <textarea
              id="outline-refs"
              rows={2}
              value={currentOutline.referencesToVerify}
              onChange={(e) => updateField("referencesToVerify", e.target.value)}
              placeholder="Ghi tên sách giáo khoa, tài liệu IAEA/VINATOM hoặc bài báo khoa học sẽ tra cứu..."
              style={{
                width: "100%",
                padding: "9px 11px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-dark)",
                background: "var(--bg-surface)",
                fontSize: "13.5px",
                lineHeight: 1.5,
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
              onClick={handleDownloadOutline}
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
              Tải dàn ý báo cáo (.md)
            </button>

            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Tải tệp Markdown về máy để tiếp tục hoàn chỉnh báo cáo.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
