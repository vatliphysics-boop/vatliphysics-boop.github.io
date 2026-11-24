"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { B23Hero } from "./B23Hero";
import { CloudChamberView } from "./CloudChamberView";
import { RadiationTypesExplorer } from "./RadiationTypesExplorer";
import {
  Carbon14Dating,
  GeigerRandomDecay,
  RadiationSafety,
  SafetyPrinciples,
} from "./B23Activities";
import styles from "./B23Lesson.module.css";

const DecayLab = dynamic(
  () => import("./DecayProcessLab").then((m) => m.DecayProcessLab),
  {
    ssr: false,
    loading: () => <p role="status">Đang tải mô phỏng phân rã…</p>,
  }
);

const TOC = [
  ["khoi-dong", "Khởi động"],
  ["muc-1", "I. Hiện tượng phóng xạ"],
  ["muc-2", "II. Định luật phóng xạ. Độ phóng xạ"],
  ["muc-3", "III. Ảnh hưởng & Biển cảnh báo"],
  ["muc-4", "IV. Nguyên tắc an toàn phóng xạ"],
  ["van-dung", "Vận dụng: Định tuổi ¹⁴C"],
  ["video", "Video học liệu"],
] as const;

export function B23Lesson() {
  const [done, setDone] = useState({
    geiger: false,
    rays: false,
    decay: false,
    safety: false,
    principles: false,
    c14: false,
  });

  const mark = useCallback((key: keyof typeof done, value: boolean) => {
    setDone((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const steps = [
    {
      key: "geiger" as const,
      label: "Khảo sát ống đếm Geiger–Müller và đối chiếu Bảng 23.1 SGK",
    },
    {
      key: "rays" as const,
      label: "So sánh tia α, β⁻, β⁺, γ trong điện trường E, từ trường B và qua vật cản",
    },
    {
      key: "decay" as const,
      label: "Khảo sát 1 hạt riêng lẻ, tập hợp N₀ hạt và đồ thị N(t) – H(t) qua các mốc T, 2T, 3T",
    },
    {
      key: "safety" as const,
      label: "Phân biệt biển báo Hình 23.8a/b, chiếu xạ ngoài vs nhiễm xạ trong",
    },
    {
      key: "principles" as const,
      label: "Phối hợp Thời gian – Khoảng cách – Che chắn để giảm tổng liều",
    },
    {
      key: "c14" as const,
      label: "Vận dụng định luật phóng xạ tính niên đại mẫu cổ vật bằng ¹⁴₆C",
    },
  ];

  return (
    <div className={styles.lesson}>
      <section id="khoi-dong">
        <B23Hero />
      </section>

      <nav className={styles.toc} aria-label="Mục lục Bài 23">
        {TOC.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>

      <article className={styles.body}>
        <section id="muc-1" className={styles.section}>
          <h2>I. Hiện tượng phóng xạ</h2>
          <p className={styles.lead}>
            Phóng xạ không nhìn thấy bằng mắt thường, nhưng để lại dấu vết qua tác dụng ion hóa trong buồng sương và xung điện trong ống đếm Geiger–Müller (SGK tr. 104–107).
          </p>
          <CloudChamberView />
          <h3>1. Tính tự phát và ngẫu nhiên (Hình 23.2 &amp; Bảng 23.1 SGK)</h3>
          <GeigerRandomDecay onProgress={(v) => mark("geiger", v)} />
          <h3>2. Bản chất, độ đâm xuyên và độ lệch của tia α, β⁻, β⁺, γ (Hình 23.3 &amp; 23.4 SGK)</h3>
          <RadiationTypesExplorer onProgress={(v) => mark("rays", v)} />
        </section>

        <section id="muc-2" className={styles.section}>
          <h2>II. Định luật phóng xạ. Độ phóng xạ</h2>
          <p className={styles.lead}>
            Mẫu phóng xạ giả định (SGK tr. 108–111): liên kết trực quan giữa sự phân rã ngẫu nhiên của từng hạt nhân riêng lẻ với quy luật hàm mũ của cả tập hợp qua các mốc chu kì bán rã T, 2T, 3T.
          </p>
          <DecayLab onProgress={(v) => mark("decay", v)} />
        </section>

        <section id="muc-3" className={styles.section}>
          <h2>III. Ảnh hưởng của tia phóng xạ. Biển cảnh báo (Hình 23.8 SGK)</h2>
          <p className={styles.lead}>
            Nhận diện đúng biển cảnh báo phóng xạ chuẩn quốc tế, phân biệt nguy cơ chiếu xạ ngoài với nhiễm xạ trong và thử nghiệm các biện pháp giảm liều.
          </p>
          <RadiationSafety onProgress={(v) => mark("safety", v)} />
        </section>

        <section id="muc-4" className={styles.section}>
          <h2>IV. Nguyên tắc an toàn phóng xạ</h2>
          <p className={styles.lead}>
            Thực hành định lượng ba nguyên tắc Thời gian – Khoảng cách – Che chắn (SGK tr. 112–113).
          </p>
          <SafetyPrinciples onProgress={(v) => mark("principles", v)} />
        </section>

        <section id="van-dung" className={styles.section}>
          <h2>Vận dụng (Ô Em có biết — SGK tr. 109–110): Định tuổi mẫu cổ vật bằng đồng vị ¹⁴₆C</h2>
          <p className={styles.lead}>
            Áp dụng hệ thức độ phóng xạ theo chu kì bán rã T = 5 730 năm vào bài toán khảo cổ học (Ô đọc thêm Em có biết, SGK tr. 109–110).
          </p>
          <Carbon14Dating onProgress={(v) => mark("c14", v)} />

          <div className="physics-checklist" style={{ marginTop: "12px" }}>
            <p>
              <strong>Tiến độ hoàn thành Bài 23:</strong>
            </p>
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
          <p className={styles.lead}>
            Tổng hợp trực quan kiến thức trọng tâm Bài 23: thí nghiệm Becquerel, buồng sương, các tia α – β – γ, định luật phóng xạ và an toàn bức xạ.
          </p>
          <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
            <div
              style={{
                padding: "16px",
                backgroundColor: "var(--bg-surface-elevated)",
                borderRadius: "12px",
                border: "1px solid var(--border-light)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: "1.1rem",
                  color: "var(--color-sgu-navy)",
                }}
              >
                Bài 23 – Hiện tượng phóng xạ
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  marginBottom: "12px",
                  lineHeight: 1.55,
                }}
              >
                Phụ đề tiếng Việt · Giọng đọc thuyết minh tổng hợp tiếng Việt (VieNeu-TTS, có AI hỗ trợ biên tập) · Biên soạn đối chiếu SGK Vật lí 12 Kết nối tri thức tr. 104–113 (dùng để ôn tập trực quan, không thay thế sách giáo khoa và hướng dẫn của giáo viên).
              </p>
              <video
                controls
                preload="metadata"
                poster="/videos/nuclear-lessons-v2/b23.jpg"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid var(--border-light)",
                }}
              >
                <source src="/videos/nuclear-lessons-v2/b23.mp4" type="video/mp4" />
                <track
                  kind="subtitles"
                  srcLang="vi"
                  src="/videos/nuclear-lessons-v2/b23.vi.vtt"
                  label="Tiếng Việt"
                  default
                />
                Trình duyệt của bạn không hỗ trợ video HTML5.
              </video>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
