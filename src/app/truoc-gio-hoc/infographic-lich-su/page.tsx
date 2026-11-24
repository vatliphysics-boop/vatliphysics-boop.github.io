/**
 * Giai đoạn 1 — Trước giờ học
 * Hoạt động 1.3: Infographic tương tác & Sơ đồ cấu trúc lịch sử
 */
"use client";

import { useState } from "react";
import { PhaseActivityPage } from "@/components/learning/PhaseActivityPage";
import { NuclearHistory } from "@/components/learning/NuclearHistory";
import { InfographicGallery } from "@/components/learning/InfographicReels";
import { getSectionInfographicsByLesson } from "@/data/infographic-reels-all";

export default function InfographicLichSuPage() {
  const [selectedLesson, setSelectedLesson] = useState("B21");
  const infographics = getSectionInfographicsByLesson(selectedLesson);

  return (
    <PhaseActivityPage
      phase="before"
      activityNo="1.3"
      title="Infographic tương tác & Sơ đồ cấu trúc lịch sử"
      goal="Tìm hiểu lịch sử các nhà khoa học và hình ảnh minh họa động để chuẩn bị kiến thức."
      product="Ghi lại một nhà khoa học em thấy thú vị và lý do chọn người đó."
    >
      <div style={{ marginTop: "24px", display: "grid", gap: "40px" }}>
        {/* Lịch sử các nhà khoa học */}
        <div>
          <h2 style={{ margin: "0 0 16px", fontSize: "20px", fontWeight: 600 }}>
            Các nhà khoa học gắn với chương trình
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "24px" }}>
            Chọn bài để xem dòng thời gian và chân dung các nhà khoa học đóng góp cho vật lí hạt nhân.
          </p>
          <div style={{ marginBottom: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "8px" }}>
            {["B21", "B22", "B23", "B24", "B25"].map((code) => (
              <button
                key={code}
                onClick={() => setSelectedLesson(code)}
                style={{
                  padding: "10px 16px",
                  border: selectedLesson === code ? "2px solid var(--color-primary)" : "1px solid var(--border-light)",
                  background: selectedLesson === code ? "var(--color-primary-soft)" : "transparent",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: selectedLesson === code ? 600 : 500,
                  cursor: "pointer",
                  color: selectedLesson === code ? "var(--color-primary)" : "var(--text-secondary)",
                  transition: "all 0.15s",
                }}
              >
                {code}
              </button>
            ))}
          </div>
          <NuclearHistory
            lessonCode={selectedLesson}
            onSelectLesson={(code) => setSelectedLesson(code)}
          />
        </div>

        {/* Infographic */}
        {infographics && infographics.length > 0 && (
          <div>
            <h2 style={{ margin: "0 0 16px", fontSize: "20px", fontWeight: 600 }}>
              Hình minh họa động cho {selectedLesson}
            </h2>
            <InfographicGallery reels={infographics} />
          </div>
        )}

        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "24px" }}>
          💡 <strong>Gợi ý:</strong> Lịch sử các nhà khoa học giúp em hiểu được quá trình phát triển kiến thức. Hình minh họa động cho thấy khái niệm chính. Ghi lại cái gì em thấy thú vị để chia sẻ với bạn bè.
        </p>
      </div>
    </PhaseActivityPage>
  );
}
