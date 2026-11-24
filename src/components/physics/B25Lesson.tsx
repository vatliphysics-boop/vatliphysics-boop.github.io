"use client";

import { useCallback, useState } from "react";
import { B25Hero } from "./B25Hero";
import { B25DataProcessLab } from "./B25DataProcessLab";
import { BindingEnergyCalculator, NuclearEquationBalancer } from "./B25Activities";
import { LatexMath } from "@/components/learning/LatexMath";
import styles from "./B25Lesson.module.css";

const TOC = [
  ["khoi-dong", "Khởi động"],
  ["muc-1", "I. Hệ thống hóa công thức"],
  ["muc-2", "II. Đọc đồ thị H(t) — Bảng 25.1"],
  ["muc-3", "III. Cân bằng phương trình hạt nhân"],
  ["muc-4", "IV. Năng lượng liên kết"],
  ["muc-5", "V. Sáu bài tập SGK"],
  ["video", "Video học liệu"],
] as const;

const FORMULAS = [
  {
    title: "Định luật phóng xạ",
    math: String.raw`N=N_0\,2^{-t/T}\qquad H=\lambda N=H_0\,2^{-t/T}`,
    note: "N là số hạt nhân còn lại, T là chu kì bán rã, H là độ phóng xạ (Bq = 1 phân rã/giây).",
  },
  {
    title: "Bảo toàn trong phương trình hạt nhân",
    math: String.raw`\textstyle\sum A_{\text{trước}}=\sum A_{\text{sau}}\quad \sum Z_{\text{trước}}=\sum Z_{\text{sau}}`,
    note: "Số khối A và điện tích Z bảo toàn. Với phân rã β hoặc phân hạch phải tính đủ các hạt phát ra.",
  },
  {
    title: "Độ hụt khối và năng lượng liên kết",
    math: String.raw`\Delta m=Z m_{\mathrm{H}}+N m_n-m_{\text{nguyên tử}}\qquad E_{\mathrm{lk}}=\Delta m\,c^2`,
    note: "Dùng 1 u·c² ≈ 931,5 MeV. Năng lượng liên kết riêng Elk/A dùng để so sánh độ bền hạt nhân.",
  },
  {
    title: "Hệ số nhân neutron",
    math: String.raw`k=\frac{\text{số neutron thế hệ sau}}{\text{số neutron thế hệ trước}}`,
    note: "k = 1 duy trì phản ứng dây chuyền ổn định; k < 1 tắt dần; k > 1 tăng theo cấp số nhân.",
  },
] as const;

export function B25Lesson() {
  const [done, setDone] = useState({ graph: false, balance: false, energy: false });
  const set = useCallback((key: keyof typeof done, value: boolean) => {
    setDone((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const steps = [
    { key: "graph" as const, label: "Đánh dấu Bảng 25.1, tự ước lượng chu kì bán rã T và đối chiếu" },
    { key: "balance" as const, label: "Tự nhập A, Z và cân bằng đúng ít nhất hai phương trình hạt nhân" },
    { key: "energy" as const, label: "Tính Elk cho ít nhất ba hạt nhân và trả lời câu hỏi" },
  ];

  return (
    <div className={styles.lesson}>
      <section id="khoi-dong"><B25Hero /></section>

      <nav className={styles.toc} aria-label="Mục lục Bài 25">
        {TOC.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>

      <article className={styles.body}>
        <section id="muc-1" className={styles.section}>
          <h2>I. Hệ thống hóa công thức</h2>
          <p className={styles.lead}>
            Bốn hệ thức dưới đây là toàn bộ công cụ cần cho sáu bài tập SGK. Mỗi thẻ ghi công thức, kí hiệu và
            một lưu ý về đơn vị hoặc điều kiện áp dụng.
          </p>
          <div className={styles.formulaGrid}>
            {FORMULAS.map((f) => (
              <div key={f.title} className={styles.formulaCard}>
                <strong>{f.title}</strong>
                <LatexMath block math={f.math} />
                <span>{f.note}</span>
              </div>
            ))}
          </div>
          <div className="physics-checklist">
            <p><strong>Tiêu chí hoàn thành bài học:</strong></p>
            <ul>
              {steps.map((s) => (
                <li key={s.key} className={done[s.key] ? "is-done" : ""}>
                  {s.label} {done[s.key] ? "✓" : ""}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="muc-2" className={styles.section}>
          <h2>II. Đọc đồ thị H(t) — Bảng 25.1</h2>
          <p className={styles.lead}>
            Tám mốc đo của SGK giữ nguyên, không thay bằng số sinh ngẫu nhiên. Hãy tự đánh dấu mốc kẹp H₀/2,
            nhập chu kì bán rã T ước lượng và lời giải thích của riêng em trước khi mở nhận xét đối chiếu.
          </p>
          <B25DataProcessLab onSubDone={(v) => set("graph", v)} />
        </section>

        <section id="muc-3" className={styles.section}>
          <h2>III. Cân bằng phương trình hạt nhân</h2>
          <p className={styles.lead}>
            Mỗi bài cho phương trình phân rã hoặc phân hạch còn khuyết một hạt nhân. Tự nhập số khối A và số
            proton Z vào hai ô trống rồi kiểm tra. Giải đúng ít nhất hai phương trình để hoàn thành mục này.
          </p>
          <NuclearEquationBalancer onSubDone={(v) => set("balance", v)} />
        </section>

        <section id="muc-4" className={styles.section}>
          <h2>IV. Năng lượng liên kết</h2>
          <p className={styles.lead}>
            Chọn hạt nhân, xem từng bước tính độ hụt khối và năng lượng liên kết, so sánh năng lượng liên kết
            riêng. Xem ít nhất ba hạt nhân và trả lời câu hỏi kiểm tra.
          </p>
          <BindingEnergyCalculator onSubDone={(v) => set("energy", v)} />
        </section>

        <section id="muc-5" className={styles.section}>
          <h2>V. Sáu bài tập SGK</h2>
          <p className={styles.lead}>
            Sáu bài tập trang 121–122. Mỗi bài có gợi ý hướng giải trong phần mở rộng — chỉ mở sau khi em đã
            tự thử tính trên giấy.
          </p>

          <div className={styles.exercise}>
            <div className={styles.exerciseHeader}>
              <span className={styles.exerciseBadge}>Bài 1</span>
              <strong>Lực nào làm lệch hạt α trong lá vàng?</strong>
            </div>
            <p>Trong thí nghiệm tán xạ alpha của Rutherford, hạt α bay gần hạt nhân vàng thì bị lệch hướng mạnh.</p>
            <details className={styles.exerciseAnswer}>
              <summary>Gợi ý và đáp án</summary>
              <p>Hạt α mang điện tích dương +2e, hạt nhân vàng mang điện tích dương +79e. Lực đẩy tĩnh điện Coulomb giữa hai điện tích cùng dấu làm hạt α lệch khỏi phương ban đầu. Lực hấp dẫn nhỏ hơn rất nhiều bậc độ lớn nên bỏ qua.</p>
            </details>
          </div>

          <div className={styles.exercise}>
            <div className={styles.exerciseHeader}>
              <span className={styles.exerciseBadge}>Bài 2</span>
              <strong>Vẽ đồ thị H(t) và ước lượng chu kì bán rã từ Bảng 25.1</strong>
            </div>
            <p>Dùng Bảng 25.1 SGK trang 121 (từ t = 0 s, H₀ = 151 Bq xuống t = 360 s, H = 9 Bq), ước lượng chu kì bán rã của mẫu.</p>
            <details className={styles.exerciseAnswer}>
              <summary>Gợi ý và đáp án</summary>
              <p>Mức một nửa ban đầu là H₀/2 = 75,5 Bq, nằm giữa hai mốc đo (30 s; 85 Bq) và (60 s; 55 Bq). Nội suy tuyến tính giữa hai mốc này cho T ≈ 39,5 s; khớp hàm mũ trên toàn bộ tám điểm đo cho T ≈ 40–45 s (cỡ khoảng 40 s).</p>
            </details>
          </div>

          <div className={styles.exercise}>
            <div className={styles.exerciseHeader}>
              <span className={styles.exerciseBadge}>Bài 3</span>
              <strong>Xác định số nguyên tử ¹⁴₆C và độ tuổi mẫu gỗ cổ (SGK tr. 121)</strong>
            </div>
            <p>
              Mẫu gỗ của một cổ vật phát hiện được 240 phóng xạ mỗi phút (H = 4,0 Bq). Thành phần mẫu gỗ chứa 25 g ¹⁴₆C và ¹²₆C, chu kì bán rã của ¹⁴₆C là T = 5 730 năm, tỉ lệ nguyên tử ¹²₆C : ¹⁴₆C khi sinh vật còn sống là 10¹² : 1.
              <br />a) Xác định số nguyên tử ¹⁴₆C hiện có trong mẫu gỗ.
              <br />b) Xác định độ tuổi của mẫu gỗ này.
            </p>
            <details className={styles.exerciseAnswer}>
              <summary>Gợi ý và đáp án</summary>
              <p>
                • <strong>a) Số nguyên tử ¹⁴₆C hiện có trong mẫu gỗ:</strong> Đổi <code>T = 5 730 × 365,25 × 86 400 ≈ 1,808·10¹¹ s</code> và <code>H = 240 / 60 = 4,0 Bq</code>. Từ <code>H = λ·N = (ln 2 / T)·N ⇒ N = H·T / ln 2 ≈ 4,0 × 1,808·10¹¹ / 0,693 ≈ <strong>1,04·10¹² nguyên tử ¹⁴₆C</strong></code>.
                <br />• <strong>b) Độ tuổi mẫu gỗ:</strong> Trong 25 g carbon (chủ yếu là ¹²₆C) có <code>N(¹²₆C) ≈ (25/12)·6,022·10²³ ≈ 1,255·10²⁴</code> nguyên tử ⇒ lúc sinh vật còn sống có <code>N₀(¹⁴₆C) ≈ 1,255·10¹²</code> nguyên tử. Vậy <code>t = T · log₂(N₀ / N) ≈ 5 730 · log₂(1,255 / 1,043) ≈ <strong>1,5·10³ năm</strong></code>.
              </p>
            </details>
          </div>

          <div className={styles.exercise}>
            <div className={styles.exerciseHeader}>
              <span className={styles.exerciseBadge} data-level="vận dụng">Bài 4</span>
              <strong>Nhiên liệu ²³⁵U cho nhà máy điện hạt nhân trong 1 năm và đối chiếu than đá (SGK tr. 121)</strong>
            </div>
            <p>
              Một nhà máy điện hạt nhân sử dụng nguyên liệu ²³⁵U, mỗi phân hạch tỏa năng lượng 200 MeV. Hiệu suất phát điện của nhà máy là 36 %, công suất phát điện 1 400 MW.
              <br />a) Tính khối lượng nguyên liệu ²³⁵U nhà máy tiêu thụ trong 1 năm (365 ngày).
              <br />b) Tính lượng than đá tiêu thụ để sản xuất ra năng lượng điện tương đương, biết năng suất tỏa nhiệt của than đá là 30 MJ/kg.
            </p>
            <details className={styles.exerciseAnswer}>
              <summary>Gợi ý và đáp án</summary>
              <p>
                • <strong>a) Khối lượng ²³⁵U tiêu thụ trong 1 năm (365 ngày = 3,1536·10⁷ s):</strong> Điện năng sản xuất cả năm <code>A_điện = 1400·10⁶ × 3,1536·10⁷ ≈ 4,415·10¹⁶ J</code>. Năng lượng phân hạch toàn phần cần cung cấp <code>Q = A_điện / 0,36 ≈ 1,226·10¹⁷ J</code>. Mỗi phân hạch tỏa <code>200 MeV ≈ 3,2·10⁻¹¹ J</code> ⇒ số hạt phân hạch <code>N ≈ 3,83·10²⁷</code> hạt ⇒ <code>m(²³⁵U) = (N / 6,022·10²³) × 0,235 kg ≈ <strong>1,50·10³ kg ≈ 1,5 tấn/năm</strong></code> (tức ~4,1 kg/ngày).
                <br />• <strong>b) Khối lượng than đá (q = 30 MJ/kg = 3,0·10⁷ J/kg):</strong> Tính trực tiếp từ năng lượng điện tương đương theo dữ kiện đề bài (khi giả thiết chuyển hóa hoàn toàn nhiệt của than thành <code>A_điện</code>): <code>m_than = A_điện / q ≈ 4,415·10¹⁶ / 3,0·10⁷ ≈ <strong>1,47·10⁹ kg ≈ 1,47 triệu tấn than</strong></code> (lưu ý thực tế nếu nhà máy nhiệt điện than cũng có hiệu suất ~36 % thì cần <code>Q / q ≈ 4,09 triệu tấn than/năm</code>).
              </p>
            </details>
          </div>

          <div className={styles.exercise}>
            <div className={styles.exerciseHeader}>
              <span className={styles.exerciseBadge} data-level="vận dụng">Bài 5</span>
              <strong>Thời gian chiếu xạ tăng dần theo tuổi nguồn Co-60 (SGK tr. 122)</strong>
            </div>
            <p>Nguồn ⁶⁰₂₇Co có T = 5,3 năm. Tháng 1/2022 cần chiếu 150 phút để bảo quản lượng thuốc đông y đầy thùng xe tải tại Trung tâm chiếu xạ Hà Nội. Hỏi vào tháng 6/2024 (sau 29 tháng) người lái xe phải chờ bao nhiêu lâu để chiếu xạ cùng lượng thuốc như vậy?</p>
            <details className={styles.exerciseAnswer}>
              <summary>Gợi ý và đáp án</summary>
              <p>Với khoảng thời gian chiếu ngắn hơn rất nhiều so với T = 5,3 năm, liều chiếu xấp xỉ tỉ lệ với H · Δt. Do độ phóng xạ giảm còn H = H₀ · 2<sup>−29/(12·5,3)</sup>, thời gian chiếu phải tăng tỉ lệ nghịch với H: Δt<sub>mới</sub> = 150 · 2<sup>29/63,6</sup> ≈ <strong>206 phút</strong> (≈ 3,4 giờ).</p>
            </details>
          </div>

          <div className={styles.exercise}>
            <div className={styles.exerciseHeader}>
              <span className={styles.exerciseBadge} data-level="vận dụng">Bài 6</span>
              <strong>Điều chế ¹⁸₉F và xác định phần trăm lượng dược chất ¹⁸₉F-FDG tiêm chụp PET (SGK tr. 122)</strong>
            </div>
            <p>
              Dược chất phóng xạ FDG có thành phần là đồng vị ¹⁸₉F với chu kì bán rã T = 110 phút, được sản xuất bằng cách bắn phá các hạt đồng vị ¹⁸₈O nhờ một loại hạt được tăng tốc bằng máy gia tốc (Hình 25.4).
              <br />
              a) Xác định loại hạt được tăng tốc trong máy gia tốc biết rằng ngoài ¹⁸₉F, sản phẩm bắn phá còn có neutron và phát xạ tia gamma.
              <br />
              b) Trước khi chụp ảnh cắt lớp PET, bệnh nhân được tiêm liều lượng dược chất FDG để đảm bảo độ phóng xạ trên mỗi kg cân nặng là 0,1 mCi không đổi. Hai bệnh nhân cùng cân nặng, cùng sử dụng FDG trong cùng một đợt sản xuất, nhưng được tiêm ở 2 thời điểm cách nhau 60 phút. Hỏi người nào sẽ được tiêm lượng FDG nhiều hơn? Xác định phần trăm lượng FDG nhiều hơn này cần được tiêm.
            </p>
            <details className={styles.exerciseAnswer}>
              <summary>Gợi ý và đáp án</summary>
              <div>
                <p>
                  <strong>a) Loại hạt được tăng tốc</strong> (gọi hạt là <sup>A</sup><sub>Z</sub>X: bảo toàn A cho A + 18 = 18 + 1 ⇒ A = 1; bảo toàn Z cho Z + 8 = 9 + 0 ⇒ Z = 1, vậy hạt được tăng tốc là <strong>proton ¹₁p hay ¹₁H</strong>):
                </p>
                <LatexMath block math={String.raw`{}^{1}_{1}\mathrm{p}+{}^{18}_{8}\mathrm{O}\rightarrow{}^{18}_{9}\mathrm{F}+{}^{1}_{0}\mathrm{n}+\gamma`} />
                <p>
                  <strong>b) So sánh lượng FDG tại hai thời điểm tiêm cách nhau 60 phút:</strong> Chọn mốc <code>t = 0</code> là lúc hoàn tất đợt sản xuất FDG (hoạt độ riêng ban đầu trên mỗi đơn vị khối lượng FDG là <code>a₀</code>). Giả sử bệnh nhân 1 tiêm tại thời điểm <code>t₁ ≥ 0</code> với lượng FDG là <code>m₁</code> và bệnh nhân 2 tiêm tại <code>t₂ = t₁ + 60</code> (phút) với lượng FDG là <code>m₂</code>. Vì hai người cùng cân nặng nên độ phóng xạ ngay lúc tiêm của hai người phải bằng nhau:
                </p>
                <LatexMath
                  block
                  math={String.raw`m_1 a_0 \cdot 2^{-\frac{t_1}{110}} = m_2 a_0 \cdot 2^{-\frac{t_1+60}{110}} \implies \frac{m_2}{m_1}=2^{\frac{60}{110}}=2^{\frac{6}{11}}\approx 1{,}459`}
                />
                <p>
                  <strong>Kết luận:</strong> <strong>Người được tiêm sau (muộn hơn 60 phút)</strong> cần được tiêm lượng FDG nhiều hơn, và phần trăm lượng FDG nhiều hơn cần tiêm là <code>(m₂ − m₁)/m₁ × 100% = (2<sup>6/11</sup> − 1) × 100% ≈ <strong>45,9 % ≈ 46 %</strong></code>.
                </p>
              </div>
            </details>
          </div>
        </section>

        <section id="video" className={styles.section}>
          <h2>Video học liệu</h2>
          <p className={styles.lead}>Hướng dẫn đọc Bảng 25.1 và đối chiếu đường lí thuyết với số liệu SGK.</p>
          <div className={styles.videoCard}>
            <h3 className={styles.videoTitle}>Bài 25 – Bài tập về vật lí hạt nhân</h3>
            <p className={styles.videoMeta}>
              Thời lượng 1:16 · Phụ đề tiếng Việt · Thuyết minh tổng hợp tiếng Việt (VieNeu-TTS · Kim Thanh)
            </p>
            <video className={styles.video} controls preload="metadata" poster="/videos/nuclear-lessons-v2/b25.jpg">
              <source src="/videos/nuclear-lessons-v2/b25.mp4" type="video/mp4" />
              <track kind="subtitles" srcLang="vi" src="/videos/nuclear-lessons-v2/b25.vi.vtt" label="Tiếng Việt" default />
              Trình duyệt của bạn không hỗ trợ video HTML5.
            </video>
          </div>
        </section>
      </article>
    </div>
  );
}
