"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LatexMath } from "@/components/learning/LatexMath";

type QuizSetId = "B21" | "B22" | "B23" | "B24" | "B25" | "CH4";

interface QuizQuestion {
  id: string;
  lessonRef: string;
  stem: string;
  latex?: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

interface QuizSet {
  id: QuizSetId;
  label: string;
  subtitle: string;
  questions: QuizQuestion[];
}

const QUIZ_SETS: QuizSet[] = [
  {
    id: "B21",
    label: "Bài 21 · Cấu trúc hạt nhân",
    subtitle: "6 câu · Tán xạ alpha, kí hiệu hạt nhân, đồng vị và bán kính",
    questions: [
      {
        id: "b21-q1",
        lessonRef: "B21 · Mục I",
        stem: "Trong thí nghiệm tán xạ hạt alpha trên lá vàng mỏng, kết quả thực nghiệm nào đã bác bỏ mô hình nguyên tử tích điện dương trải đều của Thomson?",
        options: [
          "A. Tất cả các hạt alpha đều bị lá vàng hấp thụ hoàn toàn.",
          "B. Phần lớn hạt alpha đi xuyên thẳng nhưng có một tỉ lệ rất nhỏ bị lệch góc lớn hơn 90°.",
          "C. Mọi hạt alpha đều bị lệch cùng một góc như nhau khi qua lá vàng.",
          "D. Hạt alpha biến đổi thành electron ngay khi chạm vào lá vàng.",
        ],
        correctIndex: 1,
        explanation:
          "Nếu điện tích dương trải đều trong toàn nguyên tử, lực đẩy điện không đủ mạnh để làm hạt alpha bật ngược. Hiện tượng một số rất ít hạt lệch góc lớn (> 90°) chứng tỏ điện tích dương và hầu hết khối lượng nguyên tử tập trung trong hạt nhân kích thước rất nhỏ.",
      },
      {
        id: "b21-q2",
        lessonRef: "B21 · Mục II",
        stem: "Số neutron N có trong một hạt nhân Sắt-56 theo kí hiệu dưới đây là:",
        latex: "{}_{26}^{56}\\mathrm{Fe}",
        options: ["A. 26 neutron", "B. 56 neutron", "C. 30 neutron", "D. 82 neutron"],
        correctIndex: 2,
        explanation:
          "Hạt nhân có số khối A = 56 và số proton Z = 26. Số neutron trong hạt nhân là N = A − Z = 56 − 26 = 30.",
      },
      {
        id: "b21-q3",
        lessonRef: "B21 · Mục III",
        stem: "Các hạt nhân đồng vị của cùng một nguyên tố hóa học là những hạt nhân có:",
        options: [
          "A. Cùng số khối A nhưng khác số proton Z.",
          "B. Cùng số neutron N nhưng khác số proton Z.",
          "C. Cùng số proton Z nhưng khác số neutron N (nên khác số khối A).",
          "D. Cùng số khối A và cùng số neutron N.",
        ],
        correctIndex: 2,
        explanation:
          "Đồng vị (cùng vị trí trong bảng tuần hoàn) có cùng số đơn vị điện tích hạt nhân Z (cùng số proton), nhưng khác số neutron N dẫn đến khác số khối A.",
      },
      {
        id: "b21-q4",
        lessonRef: "B21 · Mục III",
        stem: "Áp dụng công thức bán kính hạt nhân gần đúng theo số khối A, tỉ số bán kính của hạt nhân Strontium-96 so với hạt nhân Carbon-12 là:",
        latex: "R \\approx 1{,}2 \\cdot A^{1/3}\\text{ (fm)}",
        options: ["A. 8 lần", "B. 2 lần", "C. 4 lần", "D. 3 lần"],
        correctIndex: 1,
        explanation:
          "Ta có R_Sr / R_C = (A_Sr / A_C)^(1/3) = (96 / 12)^(1/3) = 8^(1/3) = 2 lần.",
      },
      {
        id: "b21-q5",
        lessonRef: "B21 · Mục II",
        stem: "Điện tích của hạt nhân Nhôm-27 (Z = 13, A = 27) tính theo đơn vị điện tích nguyên tố e là:",
        latex: "{}_{13}^{27}\\mathrm{Al}",
        options: ["A. +27e", "B. +14e", "C. +13e", "D. −13e"],
        correctIndex: 2,
        explanation:
          "Hạt nhân gồm Z = 13 proton (mỗi proton mang điện +e) và 14 neutron không mang điện, do đó điện tích của hạt nhân là q = +Ze = +13e.",
      },
      {
        id: "b21-q6",
        lessonRef: "B21 · Mục III",
        stem: "Từ hệ thức bán kính R tỉ lệ với căn bậc ba của số khối A, nhận xét nào sau đây về thể tích V của hạt nhân là đúng?",
        latex: "V = \\frac{4}{3}\\pi R^3 \\propto A",
        options: [
          "A. Thể tích hạt nhân tỉ lệ thuận với số khối A nên mật độ nucleon hầu như không đổi giữa các hạt nhân.",
          "B. Thể tích hạt nhân không phụ thuộc vào số khối A.",
          "C. Hạt nhân càng nặng thì khoảng cách trung bình giữa các nucleon càng lớn gấp bội.",
          "D. Thể tích hạt nhân tỉ lệ với bình phương số proton Z².",
        ],
        correctIndex: 0,
        explanation:
          "Vì R = r₀·A^(1/3) nên V = (4/3)πr₀³·A tỉ lệ bậc nhất với số nucleon A. Do đó mật độ khối lượng (và mật độ nucleon) của vật chất hạt nhân xấp xỉ như nhau đối với các nguyên tố khác nhau.",
      },
    ],
  },
  {
    id: "B22",
    label: "Bài 22 · Phản ứng & Năng lượng liên kết",
    subtitle: "6 câu · Độ hụt khối, năng lượng liên kết riêng, phân hạch và nhiệt hạch",
    questions: [
      {
        id: "b22-q1",
        lessonRef: "B22 · Mục II",
        stem: "Cho khối lượng proton m_p = 1,0073 u; khối lượng neutron m_n = 1,0087 u và khối lượng hạt nhân Helium-4 là m_He = 4,0015 u. Độ hụt khối Δm của hạt nhân Helium-4 bằng:",
        latex: "\\Delta m = 2m_p + 2m_n - m_{\\text{He}}",
        options: ["A. 0,0305 u", "B. 0,0152 u", "C. 0,0503 u", "D. 4,0320 u"],
        correctIndex: 0,
        explanation:
          "Thay số: Δm = 2 × 1,0073 + 2 × 1,0087 − 4,0015 = 2,0146 + 2,0174 − 4,0015 = 4,0320 − 4,0015 = 0,0305 u.",
      },
      {
        id: "b22-q2",
        lessonRef: "B22 · Mục II",
        stem: "Với độ hụt khối Δm(He-4) = 0,0305 u và 1 u·c² = 931,5 MeV, năng lượng liên kết riêng của hạt nhân Helium-4 xấp xỉ bằng:",
        latex: "E_{\\text{lkr}} = \\frac{\\Delta m \\cdot c^2}{A}",
        options: [
          "A. 28,41 MeV/nucleon",
          "B. 7,10 MeV/nucleon",
          "C. 14,20 MeV/nucleon",
          "D. 8,79 MeV/nucleon",
        ],
        correctIndex: 1,
        explanation:
          "Năng lượng liên kết toàn phần Elk = 0,0305 × 931,5 ≈ 28,41 MeV. Chia cho số khối A = 4 được năng lượng liên kết riêng Elkr = 28,41 / 4 ≈ 7,10 MeV/nucleon.",
      },
      {
        id: "b22-q3",
        lessonRef: "B22 · Mục I",
        stem: "Trong mọi phản ứng hạt nhân, đại lượng nào sau đây KHÔNG được bảo toàn?",
        options: [
          "A. Tổng số nucleon (số khối A).",
          "B. Điện tích toàn phần.",
          "C. Khối lượng nghỉ của hệ các hạt tương tác.",
          "D. Năng lượng toàn phần và động lượng của hệ.",
        ],
        correctIndex: 2,
        explanation:
          "Phản ứng hạt nhân tỏa hoặc thu năng lượng luôn đi kèm sự chênh lệch tổng khối lượng nghỉ trước và sau phản ứng theo hệ thức W = (m_trước − m_sau)c², nên khối lượng nghỉ không bảo toàn.",
      },
      {
        id: "b22-q4",
        lessonRef: "B22 · Mục I",
        stem: "Trong thí nghiệm lịch sử năm 1919 của Rutherford khi bắn hạt alpha vào hạt nhân Nitrogen-14 tạo ra Oxygen-17, hạt còn lại phát ra là:",
        latex: "{}_{2}^{4}\\mathrm{He} + {}_{7}^{14}\\mathrm{N} \\rightarrow {}_{8}^{17}\\mathrm{O} + {}_{Z}^{A}\\mathrm{X}",
        options: [
          "A. Một neutron (A = 1, Z = 0)",
          "B. Một proton (A = 1, Z = 1)",
          "C. Một electron (A = 0, Z = −1)",
          "D. Một hạt nhân Deuteri (A = 2, Z = 1)",
        ],
        correctIndex: 1,
        explanation:
          "Bảo toàn số khối: 4 + 14 = 17 + A ⇒ A = 1. Bảo toàn điện tích: 2 + 7 = 8 + Z ⇒ Z = 1. Hạt có A = 1, Z = 1 chính là proton.",
      },
      {
        id: "b22-q5",
        lessonRef: "B22 · Mục II",
        stem: "Trên đồ thị năng lượng liên kết riêng Elkr theo số khối A, nhóm hạt nhân bền vững nhất nằm ở vùng nào?",
        options: [
          "A. Các hạt nhân rất nhẹ có A < 10.",
          "B. Các hạt nhân có số khối trung bình cỡ 50 < A < 80 (quanh vùng Fe-56), với Elkr đạt cực đại khoảng 8,8 MeV/nucleon.",
          "C. Các hạt nhân siêu nặng có A > 230.",
          "D. Mọi hạt nhân đều có năng lượng liên kết riêng bằng nhau.",
        ],
        correctIndex: 1,
        explanation:
          "Đường cong Elkr(A) đạt đỉnh ở vùng số khối trung bình cỡ 50–80 (tiêu biểu là Fe-56 khoảng 8,8 MeV/nucleon). Vì vậy cả sự phân hạch hạt nhân rất nặng lẫn sự tổng hợp hạt nhân rất nhẹ đều tiến về vùng bền hơn và tỏa năng lượng.",
      },
      {
        id: "b22-q6",
        lessonRef: "B22 · Mục IV",
        stem: "Vì sao phản ứng tổng hợp hạt nhân (nhiệt hạch) đòi hỏi nhiệt độ lên tới hàng chục triệu độ Kelvin mới xảy ra mạnh mẽ?",
        options: [
          "A. Để phá vỡ các electron ra khỏi hạt nhân Helium.",
          "B. Để các hạt nhân nhẹ có động năng nhiệt đủ lớn thắng được lực đẩy tĩnh điện Coulomb và tiến lại đủ gần trong tầm tác dụng của lực hạt nhân.",
          "C. Để làm tăng chu kì bán rã của nhiên liệu.",
          "D. Vì lực hạt nhân chỉ xuất hiện khi áp suất bằng không.",
        ],
        correctIndex: 1,
        explanation:
          "Hai hạt nhân nhẹ đều mang điện tích dương nên đẩy nhau bằng lực Coulomb. Chỉ ở nhiệt độ cực cao (hàng chục triệu độ), động năng chuyển động nhiệt mới giúp chúng vượt rào thế Coulomb để vào phạm vi cỡ 10⁻¹⁵ m của lực hút hạt nhân.",
      },
    ],
  },
  {
    id: "B23",
    label: "Bài 23 · Hiện tượng phóng xạ",
    subtitle: "6 câu · Tia α, β, γ, định luật phóng xạ, độ phóng xạ và an toàn bức xạ",
    questions: [
      {
        id: "b23-q1",
        lessonRef: "B23 · Mục I",
        stem: "Phát biểu nào sau đây nêu ĐÚNG bản chất và tính chất của tia phóng xạ alpha (α)?",
        options: [
          "A. Là sóng điện từ có bước sóng ngắn hơn tia X, đâm xuyên qua tấm chì dày nhiều đề-xi-mét.",
          "B. Là dòng các hạt nhân Helium-4 mang điện +2e, ion hóa không khí mạnh nhưng bị chặn lại bởi một tờ bìa mỏng hoặc vài cm không khí.",
          "C. Là dòng electron chuyển động gần bằng tốc độ ánh sáng.",
          "D. Là dòng các hạt neutron không mang điện tích.",
        ],
        correctIndex: 1,
        explanation:
          "Tia α là dòng hạt nhân Helium-4 (Z = 2, A = 4). Do khối lượng lớn và điện tích +2e, tia α làm ion hóa mạnh môi trường nhưng mất năng lượng rất nhanh nên khả năng đâm xuyên yếu.",
      },
      {
        id: "b23-q2",
        lessonRef: "B23 · Mục I",
        stem: "Đồng vị phóng xạ Iodine-131 phân rã β⁻ theo phương trình dưới đây. Hạt nhân con X tạo thành có số khối A và số proton Z là:",
        latex: "{}_{53}^{131}\\mathrm{I} \\rightarrow {}_{Z}^{A}\\mathrm{X} + {}_{-1}^{0}\\mathrm{e} + \\bar{\\nu}_e",
        options: [
          "A. A = 131, Z = 54 (Xenon-131)",
          "B. A = 131, Z = 52 (Tellurium-131)",
          "C. A = 127, Z = 51 (Antimony-127)",
          "D. A = 130, Z = 54 (Xenon-130)",
        ],
        correctIndex: 0,
        explanation:
          "Bảo toàn số khối: A = 131 − 0 − 0 = 131. Bảo toàn điện tích: 53 = Z + (−1) + 0 ⇒ Z = 54 (Xenon-131).",
      },
      {
        id: "b23-q3",
        lessonRef: "B23 · Mục I",
        stem: "Đặc điểm nào dưới đây là bản chất của quá trình phân rã phóng xạ tự nhiên?",
        options: [
          "A. Xảy ra nhanh gấp đôi khi nung nóng mẫu chất phóng xạ thêm 100°C.",
          "B. Dừng lại hoàn toàn khi đưa mẫu phóng xạ vào buồng chân không tối.",
          "C. Có tính tự phát, ngẫu nhiên và hoàn toàn không phụ thuộc vào các yếu tố ngoại cảnh như nhiệt độ, áp suất hay trạng thái liên kết hóa học.",
          "D. Chỉ xảy ra khi chiếu ánh sáng tử ngoại vào mẫu chất.",
        ],
        correctIndex: 2,
        explanation:
          "Phóng xạ là quá trình biến đổi nội tại bên trong hạt nhân nguyên tử nên không bị chi phối bởi nhiệt độ, áp suất thông thường hay phản ứng hóa học của lớp vỏ electron.",
      },
      {
        id: "b23-q4",
        lessonRef: "B23 · Mục II",
        stem: "Sau khoảng thời gian t = 3T (ba chu kì bán rã), tỉ lệ phần trăm số hạt nhân mẹ CHƯA BỊ PHÂN RÃ còn lại so với số hạt ban đầu N₀ theo quy luật kì vọng là:",
        latex: "\\frac{N(t)}{N_0} = 2^{-\\frac{t}{T}}",
        options: ["A. 33,3%", "B. 25,0%", "C. 12,5%", "D. 87,5%"],
        correctIndex: 2,
        explanation:
          "Với t = 3T, tỉ số N / N₀ = 2^(−3) = 1/8 = 0,125 = 12,5% (còn 87,5% là tỉ lệ hạt đã bị phân rã).",
      },
      {
        id: "b23-q5",
        lessonRef: "B23 · Mục II",
        stem: "Đơn vị đo độ phóng xạ H trong hệ SI là becquerel (kí hiệu Bq). Một becquerel tương ứng với:",
        latex: "1\\text{ Bq} = 1\\text{ phân rã/giây}",
        options: [
          "A. Một hạt nhân phân rã trong một giờ.",
          "B. Một phân rã hạt nhân xảy ra trong một giây.",
          "C. Một gam chất phóng xạ nguyên chất.",
          "D. Năng lượng 1 MeV bức xạ ra trong một phút.",
        ],
        correctIndex: 1,
        explanation:
          "Theo định nghĩa hệ SI, độ phóng xạ 1 Bq bằng tốc độ 1 phân rã trên một giây (1 s⁻¹).",
      },
      {
        id: "b23-q6",
        lessonRef: "B23 · Mục IV",
        stem: "Ba nguyên tắc cơ bản giúp giảm liều chiếu xạ bên ngoài khi làm việc gần nguồn bức xạ ion hóa là:",
        options: [
          "A. Giảm thời gian tiếp xúc, tăng khoảng cách tới nguồn và sử dụng màn che chắn phù hợp.",
          "B. Tăng thời gian quan sát, đứng thật gần nguồn và mở quạt thông gió.",
          "C. Đun sôi nguồn phóng xạ, trung hòa bằng axit và cất trong hộp nhựa mỏng.",
          "D. Dùng từ trường mạnh khử hết tia gamma.",
        ],
        correctIndex: 0,
        explanation:
          "Ba nguyên tắc an toàn phóng xạ chuẩn trong SGK là: (1) Giảm thời gian tiếp xúc; (2) Tăng khoảng cách đến nguồn; (3) Che chắn bằng vật liệu thích hợp (chì, bê tông...).",
      },
    ],
  },
  {
    id: "B24",
    label: "Bài 24 · Công nghiệp hạt nhân",
    subtitle: "6 câu · Lò phản ứng hạt nhân, y học hạt nhân và chiếu xạ công – nông nghiệp",
    questions: [
      {
        id: "b24-q1",
        lessonRef: "B24 · Mục I",
        stem: "Để nhà máy điện hạt nhân vận hành ở mức công suất ổn định theo thời gian, hệ số nhân neutron k trong tâm lò phải được duy trì ở trạng thái:",
        options: ["A. k = 0", "B. k < 1", "C. k = 1", "D. k > 1 liên tục"],
        correctIndex: 2,
        explanation:
          "Khi k = 1 (trạng thái tới hạn), số phân hạch ở mỗi thế hệ giữ không đổi nên năng lượng nhiệt tỏa ra ổn định và có kiểm soát.",
      },
      {
        id: "b24-q2",
        lessonRef: "B24 · Mục I",
        stem: "Khi cần giảm nhanh công suất hoặc dừng lò phản ứng hạt nhân khẩn cấp, hệ thống điều khiển thực hiện thao tác nào?",
        options: [
          "A. Rút toàn bộ các thanh điều khiển ra khỏi tâm lò.",
          "B. Đưa sâu các thanh điều khiển chứa Boron hoặc Cadmium vào vùng hoạt để hấp thụ bớt neutron (làm k < 1).",
          "C. Ngừng bơm nước làm mát qua vùng hoạt.",
          "D. Tăng tỉ lệ làm giàu Uranium-235 ngay trong khi lò đang chạy.",
        ],
        correctIndex: 1,
        explanation:
          "Các thanh điều khiển chứa chất hấp thụ mạnh neutron chậm (Boron, Cadmium). Hạ sâu thanh điều khiển vào lõi làm giảm số neutron gây phân hạch tiếp theo, đưa k xuống nhỏ hơn 1.",
      },
      {
        id: "b24-q3",
        lessonRef: "B24 · Mục I",
        stem: "Chuỗi chuyển hóa năng lượng chính trong nhà máy điện hạt nhân diễn ra theo thứ tự nào?",
        options: [
          "A. Năng lượng hạt nhân → Quang năng → Điện năng.",
          "B. Năng lượng hạt nhân → Nhiệt năng (nội năng nước/hơi) → Cơ năng tua-bin → Điện năng.",
          "C. Hóa năng → Năng lượng hạt nhân → Điện năng.",
          "D. Cơ năng → Năng lượng hạt nhân → Nhiệt năng.",
        ],
        correctIndex: 1,
        explanation:
          "Động năng các mảnh phân hạch chuyển thành nội năng làm nóng chất tải nhiệt, sinh hơi quay tua-bin (cơ năng), kéo máy phát điện tạo ra điện năng.",
      },
      {
        id: "b24-q4",
        lessonRef: "B24 · Mục II",
        stem: "Kĩ thuật chụp cắt lớp phát xạ positron (PET) trong y học hạt nhân sử dụng dược chất gắn đồng vị phát tia β⁺ (như Fluorine-18) nhằm mục đích chính nào?",
        options: [
          "A. Ghi nhận hình ảnh hoạt động chuyển hóa chức năng của mô và phát hiện sớm khối u bất thường.",
          "B. Thay thế hoàn toàn phẫu thuật ngoại khoa cho mọi bệnh lí xương khớp.",
          "C. Làm cho cơ thể người bệnh phát sáng nhìn thấy bằng mắt thường trong phòng tối.",
          "D. Lưu giữ chất phóng xạ vĩnh viễn trong mô lành.",
        ],
        correctIndex: 0,
        explanation:
          "Dược chất phóng xạ tập trung tại các mô có mức chuyển hóa đặc trưng (như tế bào khối u). Máy PET ghi nhận cặp photon sinh ra từ sự hủy positron–electron để tái tạo ảnh chức năng độ nhạy cao.",
      },
      {
        id: "b24-q5",
        lessonRef: "B24 · Mục III",
        stem: "Chiếu xạ nông sản và thực phẩm bằng chùm tia gamma từ nguồn Cobalt-60 ở liều quy định có tác dụng gì?",
        options: [
          "A. Biến nông sản thành nguồn phát phóng xạ thứ cấp.",
          "B. Tiêu diệt vi sinh vật gây hại, ức chế nảy mầm để kéo dài thời gian bảo quản mà không làm thực phẩm nhiễm phóng xạ.",
          "C. Tăng khối lượng nguyên tử Carbon trong nông sản.",
          "D. Thay thế hoàn toàn nhu cầu bảo quản vệ sinh an toàn thực phẩm.",
        ],
        correctIndex: 1,
        explanation:
          "Photon tia gamma từ nguồn Co-60 đi xuyên qua kiện hàng để phá hủy ADN của vi khuẩn, nấm mốc và mầm nảy nhưng không đủ năng lượng kích hoạt phản ứng hạt nhân làm thực phẩm biến thành chất phóng xạ.",
      },
      {
        id: "b24-q6",
        lessonRef: "B24 · Mục III",
        stem: "Trong công nghiệp chế tạo cơ khí và đường ống áp lực, nguồn phát tia gamma được dùng để:",
        options: [
          "A. Chụp ảnh bức xạ kiểm tra khuyết tật bên trong mối hàn kim loại mà không cần phá hủy chi tiết.",
          "B. Nấu chảy thép thay cho lò hồ quang điện.",
          "C. Sơn phủ bề mặt kim loại.",
          "D. Biến sắt thành vàng bằng phân rã tự nhiên.",
        ],
        correctIndex: 0,
        explanation:
          "Dựa vào sự suy giảm cường độ tia gamma khác nhau khi đi qua vùng kim loại đặc và vùng có bọt khí/vết nứt bên trong, kĩ thuật kiểm định không phá hủy (NDT) phát hiện chính xác khuyết tật mối hàn.",
      },
    ],
  },
  {
    id: "B25",
    label: "Bài 25 · Bài tập Vật lí hạt nhân",
    subtitle: "6 câu · Đọc đồ thị H(t), tính hằng số phóng xạ, năng lượng phản ứng và định tuổi C-14",
    questions: [
      {
        id: "b25-q1",
        lessonRef: "B25 · Bảng 25.1 SGK",
        stem: "Trong Bảng 25.1 SGK Vật lí 12, độ phóng xạ đo được tại t = 0 là H₀ = 151 Bq, tại t = 30 s là 85 Bq và tại t = 60 s là 55 Bq. Chu kì bán rã T của mẫu phóng xạ nằm trong khoảng nào?",
        latex: "H(T) = \\frac{151}{2} = 75{,}5\\text{ Bq}",
        options: [
          "A. Từ 0 s đến 30 s",
          "B. Từ 30 s đến 60 s (xấp xỉ khoảng 40 s)",
          "C. Từ 60 s đến 90 s",
          "D. Lớn hơn 120 s",
        ],
        correctIndex: 1,
        explanation:
          "Mức một nửa ban đầu là H₀ / 2 = 75,5 Bq. Vì 85 Bq > 75,5 Bq > 55 Bq nên thời điểm t = T nằm giữa mốc 30 s và 60 s (gần mốc 30 s hơn; nội suy tuyến tính cho T ≈ 39,5 s ≈ 40 s).",
      },
      {
        id: "b25-q2",
        lessonRef: "B25 · Dạng bài phóng xạ",
        stem: "Một mẫu đồng vị phóng xạ nguyên chất có chu kì bán rã T. Sau thời gian t = 2T, tỉ số giữa số hạt nhân ĐÃ PHÂN RÃ ΔN và số hạt nhân mẹ CÒN LẠI N bằng:",
        latex: "\\frac{\\Delta N}{N} = 2^{\\frac{t}{T}} - 1",
        options: ["A. 1/4", "B. 3/4", "C. 3", "D. 4"],
        correctIndex: 2,
        explanation:
          "Tại t = 2T, số hạt còn lại N = N₀ / 4, số hạt đã phân rã ΔN = N₀ − N₀/4 = 3N₀ / 4. Vậy tỉ số ΔN / N = 3.",
      },
      {
        id: "b25-q3",
        lessonRef: "B25 · Đổi đơn vị SI",
        stem: "Đồng vị Polonium-210 có chu kì bán rã T = 138 ngày. Hằng số phóng xạ λ của Polonium-210 tính theo đơn vị chuẩn s⁻¹ là:",
        latex: "\\lambda = \\frac{\\ln 2}{T}",
        options: [
          "A. 5,02 × 10⁻³ s⁻¹",
          "B. 5,81 × 10⁻⁸ s⁻¹",
          "C. 3,49 × 10⁻⁶ s⁻¹",
          "D. 8,37 × 10⁻⁵ s⁻¹",
        ],
        correctIndex: 1,
        explanation:
          "Đổi T sang giây: T = 138 × 86400 = 11 923 200 s. Suy ra λ = ln(2) / 11 923 200 ≈ 0,69315 / 11 923 200 ≈ 5,81 × 10⁻⁸ s⁻¹.",
      },
      {
        id: "b25-q4",
        lessonRef: "B25 · Năng lượng phản ứng",
        stem: "Cho phản ứng nhiệt hạch D + T tạo Helium-4 và neutron với m_D = 2,0141 u; m_T = 3,0160 u; m_He = 4,0026 u; m_n = 1,0087 u; 1 u·c² = 931,5 MeV. Năng lượng tỏa ra của một phản ứng là:",
        latex: "{}_{1}^{2}\\mathrm{H} + {}_{1}^{3}\\mathrm{H} \\rightarrow {}_{2}^{4}\\mathrm{He} + {}_{0}^{1}\\mathrm{n}",
        options: ["A. 17,51 MeV", "B. 18,80 MeV", "C. 8,76 MeV", "D. 28,41 MeV"],
        correctIndex: 0,
        explanation:
          "Tổng khối lượng trước: 2,0141 + 3,0160 = 5,0301 u. Tổng khối lượng sau: 4,0026 + 1,0087 = 5,0113 u. Độ giảm khối lượng Δm = 0,0188 u ⇒ W_tỏa = 0,0188 × 931,5 ≈ 17,51 MeV.",
      },
      {
        id: "b25-q5",
        lessonRef: "B25 · Định tuổi C-14",
        stem: "Một mẫu gỗ cổ có độ phóng xạ của đồng vị Carbon-14 (T = 5730 năm) bằng đúng 25% (tức 1/4) độ phóng xạ của mẫu gỗ tươi cùng loại, cùng khối lượng carbon. Tuổi ước tính của mẫu gỗ cổ khoảng:",
        latex: "H = \\frac{H_0}{4} = H_0 \\cdot 2^{-2}",
        options: ["A. 2865 năm", "B. 5730 năm", "C. 11 460 năm", "D. 17 190 năm"],
        correctIndex: 2,
        explanation:
          "Vì H / H₀ = 1/4 = 2^(−2) nên thời gian phân rã đã trải qua là t = 2T = 2 × 5730 = 11 460 năm.",
      },
      {
        id: "b25-q6",
        lessonRef: "B25 · Cân bằng chuỗi phân rã",
        stem: "Khi hạt nhân Uranium-238 (Z = 92) phóng xạ phát ra một hạt alpha (α) để tạo thành hạt nhân con Thorium, hạt nhân con có số khối A và điện tích hạt nhân Z là:",
        latex: "{}_{92}^{238}\\mathrm{U} \\rightarrow {}_{Z}^{A}\\mathrm{Th} + {}_{2}^{4}\\mathrm{He}",
        options: [
          "A. A = 234, Z = 90",
          "B. A = 236, Z = 91",
          "C. A = 238, Z = 93",
          "D. A = 234, Z = 92",
        ],
        correctIndex: 0,
        explanation:
          "Phóng xạ α làm số khối giảm 4 (A = 238 − 4 = 234) và số proton giảm 2 (Z = 92 − 2 = 90).",
      },
    ],
  },
  {
    id: "CH4",
    label: "Tổng hợp Chương IV",
    subtitle: "8 câu · Kiểm tra toàn diện kiến thức & vận dụng từ B21 đến B25",
    questions: [
      {
        id: "ch4-q1",
        lessonRef: "B21 · Cấu trúc hạt nhân",
        stem: "Hạt nhân Carbon-14 (Z = 6, A = 14) và hạt nhân Nitrogen-14 (Z = 7, A = 14) có cùng đại lượng nào sau đây?",
        options: [
          "A. Cùng số proton Z.",
          "B. Cùng số neutron N.",
          "C. Cùng tổng số nucleon (số khối A = 14).",
          "D. Cùng điện tích hạt nhân.",
        ],
        correctIndex: 2,
        explanation:
          "Cả hai hạt nhân đều có chỉ số trên A = 14 (cùng tổng số nucleon), nhưng C-14 có 6 proton, 8 neutron còn N-14 có 7 proton, 7 neutron.",
      },
      {
        id: "ch4-q2",
        lessonRef: "B21 · Tán xạ alpha",
        stem: "Trong thí nghiệm tán xạ alpha trên lá vàng, nếu giữ nguyên động năng hạt alpha nhưng giảm tham số va chạm b (hạt bay gần tâm hạt nhân vàng hơn) thì góc lệch θ sẽ:",
        options: [
          "A. Tăng lên do lực đẩy tĩnh điện Coulomb cực đại lớn hơn.",
          "B. Giảm xuống về 0°.",
          "C. Không thay đổi vì góc lệch không phụ thuộc đường bay.",
          "D. Đảo chiều thành lực hút.",
        ],
        correctIndex: 0,
        explanation:
          "Khi tham số va chạm b càng nhỏ, hạt alpha tiến tới càng gần hạt nhân vàng mang điện +79e, chịu lực đẩy Coulomb càng mạnh nên quỹ đạo bị uốn cong mạnh hơn và góc tán xạ θ lớn hơn.",
      },
      {
        id: "ch4-q3",
        lessonRef: "B22 · Năng lượng liên kết",
        stem: "Cho hai hạt nhân X và Y có độ hụt khối bằng nhau (Δm_X = Δm_Y), biết số khối A_X < A_Y. Kết luận nào sau đây là ĐÚNG?",
        options: [
          "A. Hạt nhân Y bền vững hơn hạt nhân X.",
          "B. Hạt nhân X bền vững hơn hạt nhân Y vì có năng lượng liên kết riêng lớn hơn.",
          "C. Hai hạt nhân có độ bền vững bằng nhau.",
          "D. Năng lượng liên kết toàn phần của X lớn hơn của Y.",
        ],
        correctIndex: 1,
        explanation:
          "Do Δm_X = Δm_Y nên Elk(X) = Elk(Y). Vì A_X < A_Y nên Elkr(X) = Elk(X)/A_X > Elk(Y)/A_Y = Elkr(Y), suy ra hạt nhân X bền vững hơn hạt nhân Y.",
      },
      {
        id: "ch4-q4",
        lessonRef: "B22 · Phân hạch",
        stem: "Tác nhân trực tiếp kích thích hạt nhân Uranium-235 phân hạch trong các lò phản ứng hạt nhân nhiệt hiện nay là:",
        options: [
          "A. Các electron năng lượng thấp.",
          "B. Các neutron nhiệt (neutron chậm).",
          "C. Ánh sáng nhìn thấy.",
          "D. Từ trường không đổi.",
        ],
        correctIndex: 1,
        explanation:
          "Hạt nhân U-235 có xác suất bắt giữ neutron chậm (neutron nhiệt) rất cao, tạo thành hạt nhân kích thích U-236* không bền rồi phân hạch thành hai mảnh trung bình và giải phóng 2–3 neutron mới.",
      },
      {
        id: "ch4-q5",
        lessonRef: "B23 · Bản chất tia phóng xạ",
        stem: "Sắp xếp ba loại tia phóng xạ α, β, γ theo thứ tự khả năng đâm xuyên TĂNG DẦN qua vật chất:",
        options: [
          "A. γ, β, α",
          "B. α, γ, β",
          "C. α, β, γ",
          "D. β, α, γ",
        ],
        correctIndex: 2,
        explanation:
          "Tia α đâm xuyên kém nhất (bị chặn bởi tờ giấy); tia β xuyên qua giấy nhưng bị chặn bởi tấm nhôm dày vài mm; tia γ đâm xuyên mạnh nhất (cần tấm chì dày hoặc bê tông dày để làm suy giảm).",
      },
      {
        id: "ch4-q6",
        lessonRef: "B23 · Độ phóng xạ",
        stem: "Một mẫu dược chất phóng xạ có độ phóng xạ ban đầu H₀ = 640 MBq và chu kì bán rã T = 6 giờ. Sau 18 giờ, độ phóng xạ của mẫu còn lại là:",
        latex: "H(t) = H_0 \\cdot 2^{-\\frac{t}{T}}",
        options: ["A. 320 MBq", "B. 160 MBq", "C. 80 MBq", "D. 40 MBq"],
        correctIndex: 2,
        explanation:
          "Khoảng thời gian t = 18 giờ = 3T. Độ phóng xạ giảm đi 2³ = 8 lần: H = 640 / 8 = 80 MBq.",
      },
      {
        id: "ch4-q7",
        lessonRef: "B24 · Lò phản ứng hạt nhân",
        stem: "Phân biệt đúng chức năng của hai bộ phận trong nhà máy điện hạt nhân nước áp lực (PWR):",
        options: [
          "A. Thanh điều khiển hấp thụ neutron để giữ k = 1; bộ sinh hơi truyền nhiệt từ vòng sơ cấp sang vòng thứ cấp mà không trộn lẫn hai nguồn nước.",
          "B. Thanh điều khiển đun sôi nước; bộ sinh hơi hấp thụ tia alpha.",
          "C. Cả thanh điều khiển và bộ sinh hơi đều dùng để tăng tốc độ hạt alpha.",
          "D. Bộ sinh hơi nằm bên trong tua-bin gió.",
        ],
        correctIndex: 0,
        explanation:
          "Thanh điều khiển kiểm soát mật độ neutron (điều khiển phản ứng hạt nhân), còn bộ sinh hơi thực hiện trao đổi nhiệt gián tiếp giúp vòng hơi quay tua-bin cách li an toàn với vùng hoạt.",
      },
      {
        id: "ch4-q8",
        lessonRef: "B25 · Phân tích phương trình β⁺",
        stem: "Đồng vị Fluorine-18 dùng trong chụp PET phân rã phóng xạ β⁺ tạo thành hạt nhân Oxygen-18 theo phương trình nào dưới đây?",
        latex: "{}_{9}^{18}\\mathrm{F} \\rightarrow {}_{8}^{18}\\mathrm{O} + {}_{+1}^{0}\\mathrm{e} + \\nu_e",
        options: [
          "A. Z tăng từ 9 lên 10 và phát ra electron.",
          "B. Z giảm từ 9 xuống 8, số khối A = 18 giữ nguyên, phát ra một positron (+e) và một neutrino.",
          "C. Số khối A giảm đi 4 đơn vị.",
          "D. Không có sự thay đổi nguyên tố hóa học.",
        ],
        correctIndex: 1,
        explanation:
          "Trong phân rã β⁺, một proton biến đổi thành một neutron, positron (+1e) và neutrino (ν_e). Do đó số khối A = 18 bảo toàn và số hiệu nguyên tử giảm 1 (từ Z = 9 của F xuống Z = 8 của O).",
      },
    ],
  },
];

export function SelfCheckQuiz() {
  const [selectedSetId, setSelectedSetId] = useState<QuizSetId>("CH4");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showAllReview, setShowAllReview] = useState<boolean>(false);

  const activeSet = QUIZ_SETS.find((s) => s.id === selectedSetId) ?? QUIZ_SETS[0];
  const totalCount = activeSet.questions.length;
  const answeredCount = activeSet.questions.filter(
    (q) => answers[q.id] !== undefined,
  ).length;

  const correctCount = activeSet.questions.filter(
    (q) => answers[q.id] === q.correctIndex,
  ).length;
  const wrongQuestions = activeSet.questions.filter(
    (q) => answers[q.id] !== q.correctIndex,
  );

  const handleSelectSet = (nextId: QuizSetId) => {
    setSelectedSetId(nextId);
    setAnswers({});
    setSubmitted(false);
    setShowAllReview(false);
  };

  const handleChooseOption = (questionId: string, optionIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setShowAllReview(false);
  };

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Bộ chọn đề B21–B25 hoặc Tổng hợp Chương IV */}
      <div
        role="tablist"
        aria-label="Chọn bộ câu hỏi tự kiểm tra"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
          gap: "10px",
        }}
      >
        {QUIZ_SETS.map((quizSet) => {
          const isSelected = quizSet.id === activeSet.id;
          return (
            <button
              key={quizSet.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => handleSelectSet(quizSet.id)}
              style={{
                textAlign: "left",
                padding: "12px 14px",
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
                style={{
                  fontSize: "13.5px",
                  fontWeight: 700,
                  color: isSelected ? "var(--color-primary)" : "var(--text-primary)",
                  marginBottom: "4px",
                }}
              >
                {quizSet.label}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                {quizSet.questions.length} câu trắc nghiệm
              </div>
            </button>
          );
        })}
      </div>

      {/* Thanh trạng thái đề đang chọn */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "14px 18px",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-page)",
          border: "1px solid var(--border-light)",
        }}
      >
        <div>
          <strong style={{ fontSize: "15px" }}>{activeSet.label}</strong>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            {activeSet.subtitle}
          </div>
        </div>
        <div
          className="mono-tag"
          style={{
            fontSize: "12.5px",
            fontWeight: 700,
            color: answeredCount === totalCount ? "var(--semantic-success)" : "var(--color-primary)",
          }}
        >
          Đã trả lời: {answeredCount} / {totalCount} câu
        </div>
      </div>

      {/* Danh sách câu hỏi */}
      <div style={{ display: "grid", gap: "18px" }}>
        {activeSet.questions.map((question, qIdx) => {
          const chosenIdx = answers[question.id];
          return (
            <div
              key={question.id}
              style={{
                padding: "20px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-light)",
                background: "var(--bg-surface)",
                display: "grid",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  className="mono-tag"
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "var(--color-primary)",
                  }}
                >
                  CÂU {qIdx + 1} · {question.lessonRef}
                </span>
                {submitted && (
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 700,
                      color:
                        chosenIdx === question.correctIndex
                          ? "var(--semantic-success)"
                          : "var(--semantic-danger)",
                    }}
                  >
                    {chosenIdx === question.correctIndex ? "✓ Trả lời đúng" : "✗ Cần xem lại"}
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  lineHeight: 1.55,
                  color: "var(--text-primary)",
                }}
              >
                {question.stem}
              </div>

              {question.latex && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-page)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <LatexMath block math={question.latex} />
                </div>
              )}

              <div style={{ display: "grid", gap: "8px" }}>
                {question.options.map((opt, optIdx) => {
                  const isChosen = chosenIdx === optIdx;
                  const isCorrect = optIdx === question.correctIndex;
                  let border = "1px solid var(--border-light)";
                  let bg = "var(--bg-page)";

                  if (!submitted && isChosen) {
                    border = "2px solid var(--color-primary)";
                    bg = "var(--color-primary-soft)";
                  } else if (submitted && isCorrect) {
                    border = "2px solid var(--semantic-success)";
                    bg = "var(--semantic-success-soft)";
                  } else if (submitted && isChosen && !isCorrect) {
                    border = "2px solid var(--semantic-danger)";
                    bg = "var(--semantic-danger-soft)";
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={submitted}
                      aria-pressed={isChosen}
                      onClick={() => handleChooseOption(question.id, optIdx)}
                      style={{
                        textAlign: "left",
                        padding: "11px 14px",
                        borderRadius: "var(--radius-sm)",
                        border,
                        background: bg,
                        color: "var(--text-primary)",
                        fontSize: "14px",
                        fontWeight: isChosen || (submitted && isCorrect) ? 600 : 400,
                        cursor: submitted ? "default" : "pointer",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Nút nộp bài / làm lại */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        {!submitted ? (
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            style={{
              padding: "11px 22px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "var(--color-primary)",
              color: "var(--color-primary-on)",
              fontWeight: 700,
              fontSize: "14.5px",
              cursor: "pointer",
            }}
          >
            Nộp bài & Xem kết quả ({answeredCount}/{totalCount} câu)
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleRetry}
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
              Làm lại đề này
            </button>
            <button
              type="button"
              onClick={() => setShowAllReview((prev) => !prev)}
              style={{
                padding: "10px 16px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-dark)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "13.5px",
                cursor: "pointer",
              }}
            >
              {showAllReview
                ? "Chỉ hiện lời giải các câu sai / bỏ trống"
                : "Hiện lời giải cho tất cả các câu"}
            </button>
          </>
        )}
      </div>

      {/* Bảng kết quả & lời giải chi tiết từng câu sai */}
      {submitted && (
        <div
          role="region"
          aria-label="Kết quả tự kiểm tra và lời giải chi tiết"
          style={{
            padding: "22px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-page)",
            border: "1px solid var(--border-light)",
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
              gap: "12px",
              paddingBottom: "14px",
              borderBottom: "1px solid var(--border-light)",
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "19px", fontWeight: 700 }}>
                Kết quả tự đánh giá: Đúng {correctCount} / {totalCount} câu (
                {Math.round((correctCount / totalCount) * 100)}%)
              </h3>
              <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-secondary)" }}>
                {wrongQuestions.length === 0
                  ? "Em đã nắm vững toàn bộ kiến thức trong bộ đề này!"
                  : `Có ${wrongQuestions.length} câu cần xem kĩ lời giải vật lí bên dưới để tự điều chỉnh.`}
              </p>
            </div>
            <Link
              href="/truoc-gio-hoc/video-bai-giang"
              style={{
                fontSize: "13.5px",
                fontWeight: 600,
                color: "var(--color-primary)",
                textDecoration: "none",
              }}
            >
              Xem lại Video bài giảng B21–B25 →
            </Link>
          </div>

          {(showAllReview ? activeSet.questions : wrongQuestions).map((q) => {
            const userIdx = answers[q.id];
            const isCorrect = userIdx === q.correctIndex;
            return (
              <div
                key={`review-${q.id}`}
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-light)",
                  borderLeft: isCorrect
                    ? "4px solid var(--semantic-success)"
                    : "4px solid var(--semantic-danger)",
                  fontSize: "13.5px",
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: "6px" }}>
                  [{q.lessonRef}] {q.stem}
                </div>
                <div
                  style={{
                    color: isCorrect ? "var(--semantic-success)" : "var(--semantic-danger)",
                  }}
                >
                  Phương án em chọn:{" "}
                  {userIdx !== undefined ? q.options[userIdx] : "(Chưa chọn đáp án)"}
                </div>
                {!isCorrect && (
                  <div style={{ color: "var(--semantic-success)", fontWeight: 600 }}>
                    Đáp án đúng: {q.options[q.correctIndex]}
                  </div>
                )}
                <div style={{ marginTop: "6px", color: "var(--text-primary)" }}>
                  <strong>Lời giải chi tiết:</strong> {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
