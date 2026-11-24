import { PhaseActivityPage } from "@/components/learning/PhaseActivityPage";
import { RolePlayStudio } from "@/components/learning/RolePlayStudio";

export const metadata = {
  title: "Tình huống đóng vai | Vật lí hạt nhân",
  description: "Trò chơi đóng vai để hiểu ứng dụng thực tế của phóng xạ.",
};

export default function TinhHuongDongVaiPage() {
  return (
    <PhaseActivityPage
      phase="during"
      activityNo="2.3"
      title="Trò chơi đóng vai — Tình huống giả định"
      goal="Nhóm em sẽ tham gia vào một tình huống thực tế để vận dụng kiến thức phóng xạ vào giải quyết vấn đề."
      product="Tóm tắt (500–800 từ) về lập luận của nhóm khi đóng vai."
    >
      <div style={{ marginTop: "24px" }}>
        <RolePlayStudio />
      </div>
    </PhaseActivityPage>
  );
}
