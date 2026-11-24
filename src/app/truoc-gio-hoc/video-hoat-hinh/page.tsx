/**
 * Giai đoạn 1 — Trước giờ học
 * Hoạt động 1.1: Video hoạt hình khoa học ngắn — Mô hình hạt nhân 3D
 *
 * Trang chuyên biệt để xem video bài giảng từng bài (B21–B25).
 * Tái sử dụng NuclearLessonVideo component để phát video có sẵn.
 */

import { PhaseActivityPage } from "@/components/learning/PhaseActivityPage";
import { NuclearLessonVideo } from "@/components/learning/NuclearLessonVideo";
import { NUCLEAR_LAB_LESSONS } from "@/lib/nuclear-lab-lessons";
import Link from "next/link";

export const metadata = {
  title: "Video hoạt hình khoa học ngắn | Vật lí hạt nhân",
  description: "Xem video mô hình hạt nhân 3D và minh họa cho B21–B25.",
};

export default function VideoHoatHinhPage() {
  return (
    <PhaseActivityPage
      phase="before"
      activityNo="1.1"
      title="Video hoạt hình khoa học ngắn"
      goal="Xem video mô hình hạt nhân 3D và minh họa động để chuẩn bị kiến thức trước giờ học."
      product="Ghi lại câu hỏi hoặc điều chưa rõ để thảo luận với giáo viên trong giờ học."
    >
      <div style={{ display: "grid", gap: "32px", marginTop: "24px" }}>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "12px" }}>
            Chọn bài để xem video
          </p>
          <nav style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
            {NUCLEAR_LAB_LESSONS.map((lesson) => (
              <Link
                key={lesson.code}
                href={`#${lesson.code}`}
                className="video-hoat-hinh-link"
              >
                {lesson.code}
              </Link>
            ))}
          </nav>
        </div>

        {NUCLEAR_LAB_LESSONS.map((lesson) => (
          <div key={lesson.code} id={lesson.code} style={{ paddingTop: "40px", borderTop: "1px solid var(--border-light)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: 600 }}>
              {lesson.code} · {lesson.title}
            </h3>
            <NuclearLessonVideo lesson={lesson} />
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "16px" }}>
              Video này giới thiệu {lesson.title.toLowerCase()}. Sau khi xem, hãy ghi lại câu hỏi hoặc điều chưa rõ để thảo luận với giáo viên trong giờ học.
            </p>
          </div>
        ))}
      </div>
    </PhaseActivityPage>
  );
}
