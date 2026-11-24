import { PhaseActivityPage } from "@/components/learning/PhaseActivityPage";
import { ReflectionStudio } from "@/components/learning/ReflectionStudio";

export const metadata = {
  title: "Phản hồi & tự điều chỉnh | Vật lí hạt nhân",
  description: "Nhận xét từ giáo viên, tự đánh giá và cơ hội sửa bài.",
};

export default function PhanHoiTuDieuChinhPage() {
  return (
    <PhaseActivityPage
      phase="after"
      activityNo="3.2"
      title="Phản hồi & tự điều chỉnh"
      goal="Xem nhận xét từ giáo viên, tự đánh giá bài làm của mình và sửa bài nếu cần."
      product="Phản tư 300–500 từ về điều em đã học được và điều em còn vướng."
    >
      <div style={{ marginTop: "24px" }}>
        <ReflectionStudio />
      </div>
    </PhaseActivityPage>
  );
}
