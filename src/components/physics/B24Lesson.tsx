"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { B24Hero } from "./B24Hero";
import { NuclearMedicine, RadiationApplications } from "./B24Activities";
import styles from "./B24Lesson.module.css";

const NuclearPowerEnergyFlow = dynamic(
  () => import("./B24Activities").then((m) => m.NuclearPowerEnergyFlow),
  { ssr: false, loading: () => <p role="status">Đang tải sơ đồ dòng truyền năng lượng…</p> },
);

const ReactorControlConcept = dynamic(
  () => import("./B24Activities").then((m) => m.ReactorControlConcept),
  { ssr: false, loading: () => <p role="status">Đang tải mô hình điều khiển lò phản ứng…</p> },
);

const TOC = [
  ["khoi-dong", "Khởi động"],
  ["muc-1", "I. Nhà máy điện hạt nhân & điều khiển lò phản ứng"],
  ["muc-2", "II. Y học hạt nhân"],
  ["muc-3", "III. Chiếu xạ trong công nghiệp và nông nghiệp"],
  ["video", "Video học liệu"],
] as const;

export function B24Lesson() {
  const [done, setDone] = useState({
    energyFlow: false,
    reactor: false,
    medicine: false,
    radiation: false,
  });
  const set = useCallback((key: keyof typeof done, value: boolean) => {
    setDone((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const steps = [
    {
      key: "energyFlow" as const,
      label: "Lần theo dòng truyền năng lượng và phân biệt 3 vòng lưu chất (Hình 24.1)",
    },
    {
      key: "reactor" as const,
      label: "Điều chỉnh thanh điều khiển Boron/Cadmium và quan sát hệ số nhân k (Hình 24.3)",
    },
    {
      key: "medicine" as const,
      label: "Đối chiếu Chẩn đoán hình ảnh với Xạ trị và phân loại tình huống lâm sàng",
    },
    {
      key: "radiation" as const,
      label: "Đối chiếu Hình 24.5 SGK, ³²P và ghi bằng chứng ứng dụng chiếu xạ",
    },
  ];

  return (
    <div className={styles.lesson}>
      <section id="khoi-dong"><B24Hero /></section>

      <nav className={styles.toc} aria-label="Mục lục Bài 24">
        {TOC.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>

      <article className={styles.body}>
        <section id="muc-1" className={styles.section}>
          <h2>I. Nhà máy điện hạt nhân &amp; điều khiển lò phản ứng</h2>
          <p className={styles.lead}>
            Trong nhà máy điện hạt nhân (Hình 24.1 SGK), vòng tải nhiệt sơ cấp khép kín cách li phóng xạ,
            truyền nhiệt qua bình sinh hơi để tạo hơi nước áp suất cao ở vòng thứ cấp làm quay tua-bin kéo
            máy phát điện, còn dòng nước sông/hồ/biển giải nhiệt tại bình ngưng. Bên trong tâm lò (Hình 24.3 SGK),
            thanh điều khiển Boron/Cadmium hấp thụ neutron để giữ hệ số nhân k = 1 ổn định.
          </p>
          <NuclearPowerEnergyFlow onProgress={(v) => set("energyFlow", v)} />
          <div style={{ marginTop: 18 }}>
            <ReactorControlConcept onProgress={(v) => set("reactor", v)} />
          </div>
          <div className="physics-checklist" style={{ marginTop: 12 }}>
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
          <h2>II. Y học hạt nhân</h2>
          <p className={styles.lead}>
            Đồng vị phóng xạ chu kì bán rã ngắn — ¹⁸F (110 phút) và ⁹⁹ᵐTc (6 giờ) — phát tia γ thoát ra
            ngoài cơ thể để ghi hình chức năng bằng PET và SPECT. Trong xạ trị, ¹³¹I, ²²³Ra, ¹⁷⁷Lu hoặc
            chùm tia ngoài ⁶⁰Co tập trung liều tiêu diệt tế bào bệnh kết hợp che chắn bảo vệ mô lành.
          </p>
          <NuclearMedicine onProgress={(v) => set("medicine", v)} />
        </section>

        <section id="muc-3" className={styles.section}>
          <h2>III. Chiếu xạ trong công nghiệp và nông nghiệp</h2>
          <p className={styles.lead}>
            Tia gamma từ ⁶⁰Co hoặc chùm electron từ máy gia tốc được dùng để diệt vi sinh vật bảo quản
            nông sản (Hình 24.5 SGK), kìm hãm nảy mầm và thanh trùng thiết bị y tế, còn đồng vị đánh dấu
            ³²P giúp nghiên cứu tối ưu hóa phân bón. Thực phẩm chiếu xạ không chứa chất phóng xạ.
          </p>
          <RadiationApplications onProgress={(v) => set("radiation", v)} />
        </section>

        <section id="video" className={styles.section}>
          <h2>Video học liệu</h2>
          <p className={styles.lead}>
            Minh họa nguyên lí lò phản ứng, ba vòng lưu chất cách li và các ứng dụng thực tế.
          </p>
          <div className={styles.videoCard}>
            <h3 className={styles.videoTitle}>Bài 24 – Công nghiệp hạt nhân</h3>
            <p className={styles.videoMeta}>
              Thời lượng 1:12 · Phụ đề tiếng Việt · Thuyết minh tổng hợp tiếng Việt (VieNeu-TTS · Kim Thanh)
            </p>
            <video className={styles.video} controls preload="metadata" poster="/videos/nuclear-lessons-v2/b24.jpg">
              <source src="/videos/nuclear-lessons-v2/b24.mp4" type="video/mp4" />
              <track kind="subtitles" srcLang="vi" src="/videos/nuclear-lessons-v2/b24.vi.vtt" label="Tiếng Việt" default />
              Trình duyệt của bạn không hỗ trợ video HTML5.
            </video>
          </div>
        </section>
      </article>
    </div>
  );
}
