"use client";

import { useCallback, useState } from "react";
import { B21Hero } from "./B21Hero";
import { IsotopeActivity, NuclearBuilderActivity } from "./B21Activities";
import { FixedPhysicsActivityRenderer } from "./FixedPhysicsActivityRenderer";
import { AtomicModelsComparisonSim } from "@/components/learning/AtomicModelsComparisonSim";
import { LatexMath } from "@/components/learning/LatexMath";
import styles from "./B21Lesson.module.css";

const TOC = [
  ["khoi-dong", "Khởi động"],
  ["muc-1", "I. Thí nghiệm tán xạ alpha"],
  ["mo-hinh-nguyen-tu", "Mô hình nguyên tử"],
  ["muc-2", "II. Cấu tạo hạt nhân"],
  ["muc-3", "III. Đồng vị và kích thước hạt nhân"],
  ["muc-4", "IV. Tổng hợp"],
  ["video", "Video học liệu"],
] as const;

const FACTS = [
  { label: "Proton", value: "mang điện +e, kí hiệu p", note: "Số proton Z quyết định nguyên tố." },
  { label: "Neutron", value: "không mang điện, kí hiệu n", note: "Cùng khối lượng xấp xỉ proton; có mặt trong mọi hạt nhân trừ hiđro thường." },
  { label: "Số khối A", value: "A = Z + N", note: "Là số nucleon, gần đúng bằng khối lượng nguyên tử theo đơn vị u." },
  { label: "Điện tích hạt nhân", value: "+Z·e", note: "e = 1,6·10⁻¹⁹ C; hạt nhân trung hoà về điện khi ghép với Z electron." },
] as const;

export function B21Lesson() {
  const [done, setDone] = useState({
    rutherford: false,
    atomicModels: false,
    builder: false,
    isotope: false,
  });
  const set = useCallback((key: keyof typeof done, value: boolean) => {
    setDone((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const steps = [
    { key: "rutherford" as const, label: "Chạy thí nghiệm tán xạ và giải thích góc lệch" },
    { key: "atomicModels" as const, label: "So sánh ba mô hình nguyên tử và nối với bằng chứng tán xạ" },
    { key: "builder" as const, label: "Dựng Si-28 và trả lời câu hỏi về neutron" },
    { key: "isotope" as const, label: "So sánh hai hạt nhân và trả lời câu hỏi bán kính" },
  ];

  return (
    <div className={styles.lesson}>
      <section id="khoi-dong"><B21Hero /></section>

      <nav className={styles.toc} aria-label="Mục lục Bài 21">
        {TOC.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>

      <article className={styles.body}>
        <section id="muc-1" className={styles.section}>
          <h2>I. Thí nghiệm tán xạ hạt alpha</h2>
          <p className={styles.lead}>
            Chạy hai lượt bắn với cùng năng lượng nhưng lệch tâm khác nhau. So sánh góc lệch rồi đối chiếu với
            dự đoán: nếu điện tích dương trải đều, hạt phải lệch rất ít ở mọi khoảng cách.
          </p>
          <FixedPhysicsActivityRenderer
            activityKey="rutherford_alpha_scattering"
            onProgress={(v) => set("rutherford", v)}
          />
          <p
            role="status"
            data-b21-rutherford-progress={done.rutherford ? "done" : "pending"}
            style={{
              marginTop: "12px",
              fontSize: "14px",
              fontWeight: 600,
              color: done.rutherford ? "var(--semantic-success, #047857)" : "var(--text-muted, #64748b)",
            }}
          >
            {done.rutherford
              ? "✓ Bài 21 đã ghi nhận hoàn thành: Chạy thí nghiệm tán xạ và giải thích góc lệch"
              : "Tiến độ Bài 21 (Mục I): Chưa hoàn thành — cần dự đoán, lưu 2 lượt đo cùng E khác b và viết lời giải thích."}
          </p>
        </section>

        <section id="mo-hinh-nguyen-tu" className={styles.section}>
          <h2>Mô hình đơn giản của nguyên tử (Thomson – Rutherford – Đám mây electron)</h2>
          <p className={styles.lead}>
            Đối chiếu vùng phân bố điện tích dương trên cùng một nguyên tử Hydrogen trung hòa và nối kết quả tán xạ lá vàng với mô hình hành tinh nguyên tử Rutherford, mẫu Bohr (1913) và mô hình đám mây electron của Erwin Schrödinger (SGK tr. 91–93).
          </p>
          <AtomicModelsComparisonSim
            onProgress={(v) => set("atomicModels", v)}
            onOpenRutherfordV3={() => {
              document.getElementById("muc-1")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </section>

        <section id="muc-2" className={styles.section}>
          <h2>II. Cấu tạo hạt nhân</h2>
          <p className={styles.lead}>
            Hạt nhân cấu thành từ Z proton và N neutron. Thay đổi từng loại để thấy đại lượng nào đổi theo
            nguyên tố, đại lượng nào đổi theo số nucleon.
          </p>
          <div className={styles.factGrid}>
            {FACTS.map((f) => (
              <div key={f.label} className={styles.factCard}>
                <strong>{f.label}</strong>
                <LatexMath block math={f.label === "Số khối A" ? String.raw`A = Z + N` : f.label === "Điện tích hạt nhân" ? String.raw`q = +Ze` : String.raw`\mathrm{ }`} />
                <span className={styles.factValue}>{f.value}</span>
                <span className={styles.factNote}>{f.note}</span>
              </div>
            ))}
          </div>
          <NuclearBuilderActivity onProgress={(v) => set("builder", v)} />
        </section>

        <section id="muc-3" className={styles.section}>
          <h2>III. Đồng vị và kích thước hạt nhân</h2>
          <p className={styles.lead}>
            Hai hạt nhân cùng Z nhưng khác N là đồng vị. Thêm proton thì đổi nguyên tố; thêm neutron thì chỉ
            tăng số khối và bán kính. Bán kính tính theo R ≈ 1,2·A<sup>1/3</sup> fm.
          </p>
          <IsotopeActivity onProgress={(v) => set("isotope", v)} />
          <div className={styles.formulaCard} style={{ marginTop: 16 }}>
            <strong>Vì sao bán kính tăng chậm?</strong>
            <LatexMath block math={String.raw`R=r_0\,A^{1/3}\quad\Rightarrow\quad V=\tfrac{4}{3}\pi R^3=\tfrac{4}{3}\pi r_0^3\,A`} />
            <span className={styles.factNote}>
              Thể tích tỉ lệ bậc nhất với số nucleon A, nên bán kính chỉ tỉ lệ với căn bậc ba của A. A tăng 8
              lần thì R tăng 2 lần. Mật độ nucleon trong hạt nhân gần như nhau ở mọi nguyên tố — đây là một
              trong những đặc điểm đáng chú ý nhất của hạt nhân.
            </span>
          </div>
        </section>

        <section id="muc-4" className={styles.section}>
          <h2>IV. Tổng hợp</h2>
          <p className={styles.lead}>Ba câu hỏi nối thí nghiệm Rutherford với kí hiệu hạt nhân.</p>
          <div className={styles.factGrid}>
            <div className={styles.factCard}>
              <strong>1. Hạt nhân Si-28</strong>
              <span className={styles.factValue}>Z = 14, N = 14, A = 28</span>
              <span className={styles.factNote}>Điện tích +14e. Số khối A không phải số neutron — phải lấy A − Z.</span>
            </div>
            <div className={styles.factCard}>
              <strong>2. Ba đồng vị của Hydrogen</strong>
              <span className={styles.factValue}>¹₁H (0 n), ²₁H (1 n), ³₁H (2 n)</span>
              <span className={styles.factNote}>Cùng Z = 1 nên cùng nguyên tố Hydrogen nhưng khác số neutron N (khác khối lượng riêng). Hai đồng vị ¹₁H, ²₁H bền; đồng vị ³₁H (tritium) phóng xạ (không bền).</span>
            </div>
            <div className={styles.factCard}>
              <strong>3. Vì sao tán xạ là bằng chứng</strong>
              <span className={styles.factValue}>Lực đẩy Coulomb ∝ 1/r²</span>
              <span className={styles.factNote}>Chỉ vùng điện tích tập trung nhỏ mới tạo lực đủ mạnh để bật ngược hạt alpha. Điện tích trải đều không làm được điều đó.</span>
            </div>
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

        <section id="video" className={styles.section}>
          <h2>Video học liệu</h2>
          <p className={styles.lead}>Tóm tắt thí nghiệm Rutherford, cấu tạo hạt nhân và cách đọc kí hiệu.</p>
          <div className={styles.videoCard}>
            <h3 className={styles.videoTitle}>Bài 21 – Cấu trúc hạt nhân</h3>
            <p className={styles.videoMeta}>
              Thời lượng 1:30 · Phụ đề tiếng Việt · Giọng đọc tổng hợp tiếng Việt (VieNeu-TTS) · Biên soạn đối chiếu SGK Vật lí 12 KNTT tr. 91–95
            </p>
            <video className={styles.video} controls preload="metadata" poster="/videos/nuclear-lessons-v2/b21.jpg">
              <source src="/videos/nuclear-lessons-v2/b21.mp4" type="video/mp4" />
              <track kind="subtitles" srcLang="vi" src="/videos/nuclear-lessons-v2/b21.vi.vtt" label="Tiếng Việt" default />
              Trình duyệt của bạn không hỗ trợ video HTML5.
            </video>
          </div>
        </section>
      </article>
    </div>
  );
}
