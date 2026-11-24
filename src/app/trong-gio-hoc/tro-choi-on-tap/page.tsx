import { PhaseActivityPage } from "@/components/learning/PhaseActivityPage";
import { TeamReviewGame } from "@/components/learning/TeamReviewGame";

export const metadata = {
  title: "Trò chơi ôn tập cạnh tranh | Vật lí hạt nhân",
  description: "Trò chơi ôn tập hai đội cạnh tranh trên cùng một thiết bị.",
};

export default function TroChoiOnTapPage() {
  return (
    <PhaseActivityPage
      phase="during"
      activityNo="2.4"
      title="Trò chơi ôn tập cạnh tranh"
      goal="Hai đội ôn tập kiến thức về vật lí hạt nhân bằng cách trả lời câu hỏi nhanh trong chế độ cạnh tranh."
      product="Điểm số cuối cùng của hai đội và ghi chú về câu hỏi mà đội em còn sai."
    >
      <div style={{ marginTop: "24px" }}>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>
          Chia lớp thành hai đội, dùng chung một thiết bị. Đội nào có lượt thì chọn đáp án và bấm chốt. Điểm chỉ tính trong phiên chơi này.
        </p>
        <TeamReviewGame />
      </div>
    </PhaseActivityPage>
  );
}
