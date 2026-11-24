import { PhaseActivityPage } from "@/components/learning/PhaseActivityPage";
import { SelfCheckQuiz } from "@/components/learning/SelfCheckQuiz";

export const metadata = {
  title: "Ôn tập & tự kiểm tra | Vật lí hạt nhân",
  description: "Trắc nghiệm ôn tập để kiểm tra mức độ hiểu biết sau giờ học.",
};

export default function OnTapTuKiemTraPage() {
  return (
    <PhaseActivityPage
      phase="after"
      activityNo="3.1"
      title="Ôn tập & tự kiểm tra"
      goal="Làm đề trắc nghiệm ôn tập để tự kiểm tra mức độ hiểu biết về chủ đề hôm nay."
      product="Bảng kết quả tự kiểm tra (điểm số và phân tích từng câu hỏi)."
    >
      <div style={{ marginTop: "24px", display: "grid", gap: "24px" }}>
        <div>
          <h2 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: 600 }}>
            Bộ ôn tập tương tác
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
            Lựa chọn một bộ ôn tập dưới đây, trả lời các câu hỏi, rồi nộp bài để xem kết quả tự động.
          </p>
          <SelfCheckQuiz />
        </div>

        <div style={{ paddingTop: "24px", borderTop: "1px solid var(--border-light)" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 600 }}>
            Sau khi làm xong
          </h3>
          <ul style={{ fontSize: "14px", lineHeight: 1.8, color: "var(--text-secondary)", paddingLeft: "24px" }}>
            <li>📊 Xem điểm số và tỉ lệ trả lời đúng sai.</li>
            <li>🔍 Đọc giải thích của các câu sai để hiểu rõ hơn.</li>
            <li>📝 Ghi lại những phần em còn vướng.</li>
            <li>🎬 Xem lại video bài giảng hoặc mô phỏng 3D về những phần đó.</li>
            <li>🔄 Làm lại bộ ôn tập khác để kiểm tra tiến bộ.</li>
          </ul>
        </div>

        <div style={{ padding: "16px", background: "var(--semantic-warning-soft)", borderRadius: "8px", fontSize: "13px", color: "var(--semantic-warning)" }}>
          ℹ️ <strong>Chú ý:</strong> Điểm số ở đây chỉ để tự đánh giá. Câu tự luận sẽ được
          giáo viên chấm sau. Không cần lo lắng nếu chưa đạt điểm cao — quan trọng là nhận ra
          chỗ cần xem lại và cố gắng cải thiện.
        </div>
      </div>
    </PhaseActivityPage>
  );
}
