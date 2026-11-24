import { PhaseActivityPage } from "@/components/learning/PhaseActivityPage";
import { ApplicationExplorer } from "@/components/learning/ApplicationExplorer";

export const metadata = {
  title: "Vận dụng & mở rộng | Vật lí hạt nhân",
  description: "Chọn một ứng dụng thực tiễn của phóng xạ và lập dàn ý báo cáo ngắn.",
};

export default function VanDungMoRongPage() {
  return (
    <PhaseActivityPage
      phase="after"
      activityNo="3.3"
      title="Vận dụng & mở rộng"
      goal="Liên hệ kiến thức vật lí hạt nhân với một ứng dụng thực tiễn và tìm hiểu thêm bằng câu hỏi gợi ý."
      product="Dàn ý báo cáo ngắn về một ứng dụng của phóng xạ do em chọn."
      limits={
        <>
          Trang này chỉ gợi ý nội dung và giúp em lập dàn ý; không chứa số liệu thực nghiệm. Hãy tự
          tìm và kiểm chứng nguồn tham khảo trước khi đưa số liệu vào báo cáo. Việc giáo viên giao và
          nhận bài vận dụng qua lớp học chưa có trên trang công khai này (đang xây dựng).
        </>
      }
    >
      <div style={{ marginTop: "24px" }}>
        <ApplicationExplorer />
      </div>
    </PhaseActivityPage>
  );
}
