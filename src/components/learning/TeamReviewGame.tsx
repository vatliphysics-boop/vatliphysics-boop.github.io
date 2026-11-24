"use client";

import React, { useState } from "react";
import { LatexMath } from "@/components/learning/LatexMath";

interface TeamQuestion {
  id: string;
  lesson: "B21" | "B22" | "B23" | "B24" | "B25";
  prompt: string;
  latex?: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

const TEAM_QUESTIONS: TeamQuestion[] = [
  {
    id: "tg-1",
    lesson: "B21",
    prompt:
      "Trong thí nghiệm tán xạ hạt alpha của Rutherford, hiện tượng một tỉ lệ rất nhỏ hạt alpha bị lệch ở góc lớn hơn 90° chứng tỏ điều gì?",
    options: [
      "A. Điện tích dương phân bố đồng đều trong toàn bộ thể tích nguyên tử.",
      "B. Toàn bộ điện tích dương và phần lớn khối lượng nguyên tử tập trung tại hạt nhân có kích thước rất nhỏ.",
      "C. Hạt alpha bị các electron ở lớp vỏ hút mạnh làm bật ngược lại.",
      "D. Lá vàng không có khoảng trống giữa các nguyên tử.",
    ],
    correctIndex: 1,
    explanation:
      "Để hạt alpha mang điện +2e bị đẩy bật ngược ở góc lớn (> 90°), lực đẩy tĩnh điện Coulomb phải rất mạnh, nghĩa là hạt alpha tiến tới rất gần một vùng tập trung điện tích dương kích thước cực nhỏ — đó chính là hạt nhân nguyên tử.",
  },
  {
    id: "tg-2",
    lesson: "B21",
    prompt: "Hạt nhân Uranium-235 có kí hiệu chuẩn dưới đây gồm bao nhiêu proton và bao nhiêu neutron?",
    latex: "{}_{92}^{235}\\mathrm{U}",
    options: [
      "A. 92 proton và 235 neutron",
      "B. 235 proton và 92 neutron",
      "C. 92 proton và 143 neutron",
      "D. 143 proton và 92 neutron",
    ],
    correctIndex: 2,
    explanation:
      "Trong kí hiệu hạt nhân, chỉ số dưới Z = 92 là số proton; số khối A = 235 là tổng số nucleon. Số neutron là N = A − Z = 235 − 92 = 143 neutron.",
  },
  {
    id: "tg-3",
    lesson: "B22",
    prompt:
      "Đại lượng vật lí nào sau đây dùng để so sánh trực tiếp mức độ bền vững giữa hai hạt nhân có số khối A khác nhau?",
    latex: "E_{\\text{lkr}} = \\frac{E_{\\text{lk}}}{A} = \\frac{\\Delta m \\cdot c^2}{A}",
    options: [
      "A. Độ hụt khối Δm của hạt nhân.",
      "B. Năng lượng liên kết toàn phần Elk.",
      "C. Năng lượng liên kết riêng Elkr (năng lượng liên kết tính trên một nucleon).",
      "D. Số neutron N có trong hạt nhân.",
    ],
    correctIndex: 2,
    explanation:
      "Hạt nhân có nhiều nucleon hơn có thể có Elk lớn hơn nhưng chưa chắc bền hơn. Năng lượng liên kết riêng Elkr = Elk / A mới phản ánh công cần thiết trung bình để tách một nucleon khỏi hạt nhân, nên hạt nhân có Elkr càng lớn thì càng bền vững.",
  },
  {
    id: "tg-4",
    lesson: "B22",
    prompt:
      "Xác định số khối A và điện tích Z của hạt nhân X chưa biết trong phương trình phản ứng phân hạch sau:",
    latex: "{}_{0}^{1}\\mathrm{n} + {}_{92}^{235}\\mathrm{U} \\rightarrow {}_{56}^{141}\\mathrm{Ba} + {}_{Z}^{A}\\mathrm{X} + 3\\,{}_{0}^{1}\\mathrm{n}",
    options: [
      "A. A = 92, Z = 36 (Krypton-92)",
      "B. A = 94, Z = 36 (Krypton-94)",
      "C. A = 92, Z = 38 (Strontium-92)",
      "D. A = 95, Z = 36 (Krypton-95)",
    ],
    correctIndex: 0,
    explanation:
      "Áp dụng định luật bảo toàn số nucleon: 1 + 235 = 141 + A + 3·1 ⇒ A = 236 − 144 = 92. Bảo toàn điện tích: 0 + 92 = 56 + Z + 3·0 ⇒ Z = 36 (nguyên tố Krypton).",
  },
  {
    id: "tg-5",
    lesson: "B23",
    prompt:
      "Khi chiếu chùm tia phóng xạ đi qua vùng điện trường đều giữa hai bản tụ điện phẳng tích điện trái dấu, tia nào không bị lệch phương truyền?",
    options: [
      "A. Tia alpha (α)",
      "B. Tia beta âm (β⁻)",
      "C. Tia beta dương (β⁺)",
      "D. Tia gamma (γ)",
    ],
    correctIndex: 3,
    explanation:
      "Tia gamma (γ) là sóng điện từ có bước sóng rất ngắn (dòng photon không mang điện tích, q = 0), do đó không chịu tác dụng của lực điện hay lực từ và truyền thẳng.",
  },
  {
    id: "tg-6",
    lesson: "B23",
    prompt:
      "Một mẫu phóng xạ ban đầu có N₀ = 1200 hạt nhân mẹ với chu kì bán rã T = 15 phút. Theo quy luật kì vọng, sau t = 45 phút số hạt nhân ĐÃ BỊ PHÂN RÃ (ΔN) là bao nhiêu?",
    latex: "\\Delta N(t) = N_0 \\left(1 - 2^{-\\frac{t}{T}}\\right)",
    options: [
      "A. 150 hạt",
      "B. 1050 hạt",
      "C. 600 hạt",
      "D. 900 hạt",
    ],
    correctIndex: 1,
    explanation:
      "Ta có t = 45 phút = 3T. Số hạt nhân mẹ còn lại là N = N₀ / 2³ = 1200 / 8 = 150 hạt. Cần đọc kĩ đề hỏi số hạt ĐÃ PHÂN RÃ: ΔN = N₀ − N = 1200 − 150 = 1050 hạt.",
  },
  {
    id: "tg-7",
    lesson: "B24",
    prompt:
      "Trong lò phản ứng hạt nhân nước áp lực (PWR), thanh điều khiển chứa Boron hoặc Cadmium đảm nhận vai trò vật lí nào?",
    options: [
      "A. Truyền nhiệt trực tiếp làm quay tua-bin máy phát điện.",
      "B. Phát ra thêm neutron nhanh để tăng tốc phản ứng.",
      "C. Hấp thụ neutron để điều chỉnh hệ số nhân neutron k quanh giá trị tới hạn k = 1.",
      "D. Tăng nhiệt độ lên hàng trăm triệu độ để gây phản ứng nhiệt hạch.",
    ],
    correctIndex: 2,
    explanation:
      "Boron và Cadmium có tiết diện hấp thụ neutron lớn. Rút bớt hoặc cắm sâu thanh điều khiển giúp điều chỉnh số neutron tiếp tục gây phân hạch ở thế hệ sau, giữ hệ số nhân k = 1 để công suất lò ổn định.",
  },
  {
    id: "tg-8",
    lesson: "B24",
    prompt:
      "Vì sao trong nhà máy điện hạt nhân dùng lò nước áp lực (PWR), dòng nước sơ cấp đi qua vùng tâm lò được giữ tách biệt hoàn toàn với vòng nước–hơi thứ cấp quay tua-bin?",
    options: [
      "A. Để nước ở vòng thứ cấp và tua-bin máy phát không bị nhiễm phóng xạ từ tâm lò.",
      "B. Để hai dòng nước có thể tự sinh ra hạt nhân Uranium mới.",
      "C. Vì nước ở vòng sơ cấp không thể truyền nhiệt qua vách ống kim loại.",
      "D. Để giảm khối lượng bê tông che chắn bên ngoài nhà máy.",
    ],
    correctIndex: 0,
    explanation:
      "Vòng sơ cấp tiếp xúc trực tiếp với vùng hoạt (tâm lò) nên có thể mang theo tạp chất nhiễm phóng xạ. Tại bộ sinh hơi, vòng sơ cấp chỉ truyền nhiệt qua thành ống kín sang vòng thứ cấp, giữ cho hơi nước quay tua-bin hoàn toàn cách li với chất phóng xạ.",
  },
  {
    id: "tg-9",
    lesson: "B25",
    prompt:
      "Từ đồ thị độ phóng xạ H(t) theo thời gian (như Bảng 25.1 SGK với H₀ = 151 Bq tại t = 0), cách xác định gần đúng chu kì bán rã T là:",
    latex: "H(T) = \\frac{H_0}{2}",
    options: [
      "A. Tìm thời điểm mà độ phóng xạ giảm về 0 Bq rồi chia đôi.",
      "B. Xác định mức H₀ / 2 (75,5 Bq) trên trục tung, gióng sang đường đồ thị để đọc mốc thời gian t tương ứng trên trục hoành.",
      "C. Lấy giá trị độ phóng xạ ban đầu H₀ nhân với ln(2).",
      "D. Chỉ lấy duy nhất điểm đo cuối cùng chia cho số lần đo.",
    ],
    correctIndex: 1,
    explanation:
      "Theo định nghĩa, sau một chu kì bán rã t = T thì cả số hạt nhân mẹ N(t) và độ phóng xạ H(t) đều giảm còn một nửa giá trị ban đầu: H(T) = H₀ / 2 = 75,5 Bq.",
  },
  {
    id: "tg-10",
    lesson: "B25",
    prompt:
      "Trong phân rã phóng xạ β⁻ của đồng vị Carbon-14 tạo thành hạt nhân Nitrogen-14, phương trình đầy đủ bảo toàn điện tích và các số lượng tử là:",
    latex: "{}_{6}^{14}\\mathrm{C} \\rightarrow {}_{7}^{14}\\mathrm{N} + {}_{-1}^{0}\\mathrm{e} + \\bar{\\nu}_e",
    options: [
      "A. Carbon-14 phóng ra hạt alpha và biến thành Nitrogen-14.",
      "B. Số khối A giảm đi 1 đơn vị và số proton Z giữ nguyên.",
      "C. Một neutron trong hạt nhân biến đổi thành một proton, đồng thời phát ra một electron và một phản neutrino.",
      "D. Một proton biến đổi thành neutron và phát ra positron.",
    ],
    correctIndex: 2,
    explanation:
      "Kiểm tra bảo toàn: số khối A = 14 = 14 + 0 + 0; điện tích Z = 6 = 7 + (−1) + 0. Bản chất phân rã β⁻ là một neutron trong hạt nhân chuyển thành một proton kèm phát xạ electron và phản neutrino điện tử.",
  },
];

interface MissedLog {
  team: "A" | "B";
  question: TeamQuestion;
  chosenIndex: number;
}

export function TeamReviewGame() {
  const [teamAName, setTeamAName] = useState<string>("Đội A");
  const [teamBName, setTeamBName] = useState<string>("Đội B");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [locked, setLocked] = useState<boolean>(false);
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [missedQuestions, setMissedQuestions] = useState<MissedLog[]>([]);
  const [finished, setFinished] = useState<boolean>(false);

  const currentTeam: "A" | "B" = currentIndex % 2 === 0 ? "A" : "B";
  const currentTeamLabel = currentTeam === "A" ? teamAName || "Đội A" : teamBName || "Đội B";
  const currentQuestion = TEAM_QUESTIONS[currentIndex];

  const handleLockAnswer = () => {
    if (selectedOption === null || locked) return;
    setLocked(true);
    const isCorrect = selectedOption === currentQuestion.correctIndex;
    if (isCorrect) {
      if (currentTeam === "A") setScoreA((prev) => prev + 10);
      else setScoreB((prev) => prev + 10);
    } else {
      setMissedQuestions((prev) => [
        ...prev,
        { team: currentTeam, question: currentQuestion, chosenIndex: selectedOption },
      ]);
    }
  };

  const handleNextTurn = () => {
    if (currentIndex + 1 >= TEAM_QUESTIONS.length) {
      setFinished(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setLocked(false);
  };

  const handleResetGame = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setLocked(false);
    setScoreA(0);
    setScoreB(0);
    setMissedQuestions([]);
    setFinished(false);
  };

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Bảng điểm phiên hiện tại của 2 đội */}
      <div
        aria-label="Bảng điểm phiên chơi hiện tại"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
          gap: "16px",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "var(--radius-md)",
            border:
              !finished && currentTeam === "A"
                ? "2px solid var(--color-primary)"
                : "1px solid var(--border-light)",
            background:
              !finished && currentTeam === "A"
                ? "var(--color-primary-soft)"
                : "var(--bg-page)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div>
            <div
              className="mono-tag"
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--color-primary)",
                marginBottom: "4px",
              }}
            >
              {!finished && currentTeam === "A" ? "▶ ĐANG TỚI LƯỢT TRẢ LỜI" : "ĐỘI THI ĐẤU 1"}
            </div>
            <input
              type="text"
              value={teamAName}
              onChange={(e) => setTeamAName(e.target.value)}
              aria-label="Tên Đội A"
              style={{
                fontSize: "16px",
                fontWeight: 700,
                border: "1px solid var(--border-light)",
                borderRadius: "6px",
                padding: "4px 8px",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                width: "150px",
              }}
            />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-primary)" }}>
              {scoreA}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>điểm</div>
          </div>
        </div>

        <div
          style={{
            padding: "16px 20px",
            borderRadius: "var(--radius-md)",
            border:
              !finished && currentTeam === "B"
                ? "2px solid var(--color-accent)"
                : "1px solid var(--border-light)",
            background:
              !finished && currentTeam === "B"
                ? "var(--color-accent-soft)"
                : "var(--bg-page)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div>
            <div
              className="mono-tag"
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--color-accent)",
                marginBottom: "4px",
              }}
            >
              {!finished && currentTeam === "B" ? "▶ ĐANG TỚI LƯỢT TRẢ LỜI" : "ĐỘI THI ĐẤU 2"}
            </div>
            <input
              type="text"
              value={teamBName}
              onChange={(e) => setTeamBName(e.target.value)}
              aria-label="Tên Đội B"
              style={{
                fontSize: "16px",
                fontWeight: 700,
                border: "1px solid var(--border-light)",
                borderRadius: "6px",
                padding: "4px 8px",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                width: "150px",
              }}
            />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-accent)" }}>
              {scoreB}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>điểm</div>
          </div>
        </div>
      </div>

      {/* Màn hình câu hỏi đang diễn ra hoặc tổng kết phiên chơi */}
      {!finished ? (
        <div
          style={{
            padding: "24px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-light)",
            background: "var(--bg-surface)",
            display: "grid",
            gap: "18px",
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
            <span
              className="mono-tag"
              style={{
                padding: "4px 10px",
                borderRadius: "999px",
                background: "var(--bg-surface-elevated)",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              CÂU {currentIndex + 1} / {TEAM_QUESTIONS.length} · CHỦ ĐỀ {currentQuestion.lesson}
            </span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-primary)" }}>
              Lượt trả lời của: {currentTeamLabel} (+10 điểm nếu đúng)
            </span>
          </div>

          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 600,
              lineHeight: 1.5,
              color: "var(--text-primary)",
            }}
          >
            {currentQuestion.prompt}
          </h3>

          {currentQuestion.latex && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-page)",
                border: "1px solid var(--border-light)",
              }}
            >
              <LatexMath block math={currentQuestion.latex} />
            </div>
          )}

          <div style={{ display: "grid", gap: "10px" }}>
            {currentQuestion.options.map((opt, idx) => {
              const isChosen = selectedOption === idx;
              const isCorrectOption = idx === currentQuestion.correctIndex;
              let borderColor = "1px solid var(--border-light)";
              let bgColor = "var(--bg-page)";

              if (!locked && isChosen) {
                borderColor = "2px solid var(--color-primary)";
                bgColor = "var(--color-primary-soft)";
              } else if (locked && isCorrectOption) {
                borderColor = "2px solid var(--semantic-success)";
                bgColor = "var(--semantic-success-soft)";
              } else if (locked && isChosen && !isCorrectOption) {
                borderColor = "2px solid var(--semantic-danger)";
                bgColor = "var(--semantic-danger-soft)";
              }

              return (
                <button
                  key={opt}
                  type="button"
                  disabled={locked}
                  aria-pressed={isChosen}
                  onClick={() => setSelectedOption(idx)}
                  style={{
                    textAlign: "left",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-sm)",
                    border: borderColor,
                    background: bgColor,
                    color: "var(--text-primary)",
                    fontSize: "14.5px",
                    fontWeight: isChosen || (locked && isCorrectOption) ? 600 : 400,
                    cursor: locked ? "default" : "pointer",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Nút chốt đáp án & chuyển lượt */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
            {!locked ? (
              <button
                type="button"
                disabled={selectedOption === null}
                onClick={handleLockAnswer}
                style={{
                  padding: "10px 20px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background:
                    selectedOption === null ? "var(--border-dark)" : "var(--color-primary)",
                  color: "var(--color-primary-on)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: selectedOption === null ? "not-allowed" : "pointer",
                }}
              >
                Chốt đáp án ({currentTeamLabel})
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextTurn}
                style={{
                  padding: "10px 20px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "var(--color-primary)",
                  color: "var(--color-primary-on)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {currentIndex + 1 < TEAM_QUESTIONS.length
                  ? "Sang câu tiếp theo (Đổi lượt đội) →"
                  : "Xem tổng kết trận đấu →"}
              </button>
            )}
          </div>

          {/* Giải thích vật lí ngay sau khi chốt đáp án */}
          {locked && (
            <div
              role="status"
              style={{
                padding: "16px",
                borderRadius: "var(--radius-md)",
                background:
                  selectedOption === currentQuestion.correctIndex
                    ? "var(--semantic-success-soft)"
                    : "var(--semantic-warning-soft)",
                border: "1px solid var(--border-light)",
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--text-primary)",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: "6px",
                  color:
                    selectedOption === currentQuestion.correctIndex
                      ? "var(--semantic-success)"
                      : "var(--semantic-danger)",
                }}
              >
                {selectedOption === currentQuestion.correctIndex
                  ? `✓ Chính xác! ${currentTeamLabel} ghi thêm 10 điểm.`
                  : `✗ Chưa đúng! Đáp án chuẩn là: ${currentQuestion.options[currentQuestion.correctIndex]}`}
              </div>
              <div>
                <strong>Giải thích vật lí:</strong> {currentQuestion.explanation}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Tổng kết cuối phiên chơi */
        <div
          style={{
            padding: "24px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-light)",
            background: "var(--bg-page)",
            display: "grid",
            gap: "18px",
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: 700 }}>
              Tổng kết phiên thi đấu ôn tập Chương IV
            </h3>
            <p style={{ margin: 0, fontSize: "15px", color: "var(--text-primary)" }}>
              {scoreA > scoreB
                ? `Kết quả: ${teamAName || "Đội A"} dẫn trước (${scoreA} – ${scoreB} điểm).`
                : scoreB > scoreA
                  ? `Kết quả: ${teamBName || "Đội B"} dẫn trước (${scoreB} – ${scoreA} điểm).`
                  : `Kết quả: Hai đội hòa nhau (${scoreA} – ${scoreB} điểm).`}
            </p>
          </div>

          {missedQuestions.length > 0 ? (
            <div style={{ display: "grid", gap: "12px" }}>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                Danh sách câu các đội cần ghi chú ôn lại ({missedQuestions.length} câu):
              </h4>
              {missedQuestions.map((item) => (
                <div
                  key={item.question.id}
                  style={{
                    padding: "14px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-light)",
                    fontSize: "13.5px",
                    lineHeight: 1.55,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                    [{item.question.lesson} · Lượt của{" "}
                    {item.team === "A" ? teamAName || "Đội A" : teamBName || "Đội B"}]{" "}
                    {item.question.prompt}
                  </div>
                  <div style={{ color: "var(--semantic-danger)" }}>
                    Đã chọn: {item.question.options[item.chosenIndex]}
                  </div>
                  <div style={{ color: "var(--semantic-success)", fontWeight: 600 }}>
                    Đáp án đúng: {item.question.options[item.question.correctIndex]}
                  </div>
                  <div style={{ marginTop: "4px", color: "var(--text-secondary)" }}>
                    <strong>Giải thích:</strong> {item.question.explanation}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p
              style={{
                margin: 0,
                padding: "12px",
                borderRadius: "var(--radius-sm)",
                background: "var(--semantic-success-soft)",
                color: "var(--semantic-success)",
                fontWeight: 600,
              }}
            >
              Xuất sắc! Cả hai đội đã trả lời chính xác toàn bộ 10/10 câu hỏi vật lí hạt nhân.
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={handleResetGame}
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
              Bắt đầu phiên chơi mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
