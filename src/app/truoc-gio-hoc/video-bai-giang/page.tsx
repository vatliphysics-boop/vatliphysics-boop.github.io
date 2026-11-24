/**
 * Giai đoạn 1 — Trước giờ học
 * Hoạt động 1.5: Video từng bài giảng
 */

import { PhaseActivityPage } from "@/components/learning/PhaseActivityPage";
import { LectureVideoLibrary } from "@/components/learning/LectureVideoLibrary";

export const metadata = {
  title: "Video từng bài giảng | Vật lí hạt nhân",
  description: "Video bài giảng theo từng bài B21–B25, kèm nhiệm vụ khi xem.",
};

export default function VideoBaiGiangPage() {
  return (
    <PhaseActivityPage
      phase="before"
      activityNo="1.5"
      title="Video từng bài giảng"
      goal="Xem lại bài giảng theo từng bài để nắm khái niệm trọng tâm trước giờ lên lớp."
      product="Ghi chú các công thức và một câu hỏi em còn vướng để mang đến lớp."
    >
      <div style={{ marginTop: "24px" }}>
        <LectureVideoLibrary />
      </div>
    </PhaseActivityPage>
  );
}
