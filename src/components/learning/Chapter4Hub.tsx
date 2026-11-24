/* eslint-disable @next/next/no-img-element -- Scientific apparatus screenshot & inline SVG diagrams */
import Link from "next/link";
import { CHAPTER4_LESSONS, type Chapter4LessonSpec } from "@/lib/chapter4-lessons";
import { SGK_TABLE_25_1 } from "@/lib/sgk-b25-decay";
import { Nuclide } from "./Nuclide";
import styles from "./NuclearLabManual.module.css";

function LessonCardVisual({ lesson }: { readonly lesson: Chapter4LessonSpec }) {
  switch (lesson.code) {
    case "B21":
      return (
        <div className={`${styles.lessonCardMedia} ${styles.lessonCardMediaDark}`}>
          <img
            src="/illustrations/rutherford-v3-apparatus.png"
            alt="Bộ thiết bị thí nghiệm tán xạ hạt alpha Rutherford V3 gồm nguồn phát alpha, lá vàng mỏng ở tâm và màn huỳnh quang ZnS"
            width={640}
            height={320}
            className={styles.lessonCardImg}
          />
          <div className={styles.lessonCardMediaCaption}>
            Rutherford V3: Nguồn α → Lá vàng mỏng → Đốm sáng màn ZnS
          </div>
        </div>
      );

    case "B22":
      return (
        <div className={`${styles.lessonCardMedia} ${styles.lessonCardMediaDark}`}>
          <svg
            viewBox="0 0 360 140"
            width="360"
            height="140"
            role="img"
            aria-label="Vết phân nhánh buồng sương Blackett và đường cong năng lượng liên kết riêng"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            {/* Vết buồng sương Blackett bên trái */}
            <rect x="0" y="0" width="176" height="140" fill="#0b1220" />
            <line x1="18" y1="116" x2="88" y2="74" stroke="#38bdf8" strokeWidth="3.2" strokeLinecap="round" />
            <line x1="18" y1="96" x2="72" y2="64" stroke="#334155" strokeWidth="1.4" />
            <line x1="22" y1="128" x2="78" y2="94" stroke="#334155" strokeWidth="1.4" />
            <circle cx="88" cy="74" r="4" fill="#facc15" />
            {/* Hai nhánh sau va chạm: proton mảnh dài + O-17 dày ngắn */}
            <line x1="88" y1="74" x2="162" y2="24" stroke="#fde047" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="88" y1="74" x2="124" y2="92" stroke="#fb7185" strokeWidth="4" strokeLinecap="round" />
            <text x="14" y="20" fill="#e2e8f0" fontSize="10.5" fontWeight="600">
              Vết phân nhánh Blackett
            </text>
            <text x="152" y="42" fill="#fde047" fontSize="10" fontWeight="700">
              p
            </text>
            <text x="128" y="98" fill="#fda4af" fontSize="10">
              ¹⁷O
            </text>

            {/* Đồ thị W_lk / A bên phải */}
            <rect x="178" y="0" width="182" height="140" fill="#121b2e" />
            <line x1="196" y1="112" x2="346" y2="112" stroke="#64748b" strokeWidth="1.2" />
            <line x1="196" y1="112" x2="196" y2="22" stroke="#64748b" strokeWidth="1.2" />
            <path
              d="M 200 104 Q 214 42 238 34 Q 268 30 342 46"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2.5"
            />
            <circle cx="238" cy="34" r="3.8" fill="#4ade80" />
            <text x="247" y="37" fill="#86efac" fontSize="10" fontWeight="700">
              ⁵⁶Fe (8,8 MeV)
            </text>
            <text x="196" y="16" fill="#cbd5e1" fontSize="10" fontWeight="600">
              Đồ thị Eₗₖᵣ = Eₗₖ/A (MeV/nucleon)
            </text>
          </svg>
        </div>
      );

    case "B23":
      return (
        <div className={`${styles.lessonCardMedia} ${styles.lessonCardMediaDark}`}>
          <svg
            viewBox="0 0 360 140"
            width="360"
            height="140"
            role="img"
            aria-label="Độ đâm xuyên của tia alpha, beta, gamma qua giấy, nhôm và chì"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            <rect x="0" y="0" width="360" height="140" fill="#0b1220" />
            {/* Vật chắn: Giấy, Nhôm, Chì */}
            <rect x="132" y="18" width="8" height="104" fill="#e2e8f0" />
            <rect x="212" y="18" width="14" height="104" fill="#94a3b8" />
            <rect x="294" y="18" width="28" height="104" fill="#475569" />
            <text x="122" y="134" fill="#cbd5e1" fontSize="10">Giấy</text>
            <text x="205" y="134" fill="#cbd5e1" fontSize="10">Nhôm</text>
            <text x="299" y="134" fill="#cbd5e1" fontSize="10">Chì</text>

            {/* Tia alpha */}
            <line x1="36" y1="40" x2="131" y2="40" stroke="#fb7185" strokeWidth="3.5" />
            <circle cx="131" cy="40" r="3.5" fill="#fb7185" />
            <text x="14" y="44" fill="#fda4af" fontSize="11" fontWeight="700">α</text>

            {/* Tia beta */}
            <line x1="36" y1="70" x2="211" y2="70" stroke="#38bdf8" strokeWidth="2.2" />
            <circle cx="211" cy="70" r="3" fill="#38bdf8" />
            <text x="14" y="74" fill="#7dd3fc" fontSize="11" fontWeight="700">β</text>

            {/* Tia gamma */}
            <line x1="36" y1="100" x2="342" y2="100" stroke="#facc15" strokeWidth="2" strokeDasharray="5 3" />
            <text x="14" y="104" fill="#fde047" fontSize="11" fontWeight="700">γ</text>
          </svg>
        </div>
      );

    case "B24":
      return (
        <div className={styles.lessonCardMedia} style={{ background: "#f8fafc", padding: "8px 12px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#0f62fe", marginBottom: "5px" }}>
            Sơ đồ truyền năng lượng nhà máy điện hạt nhân &amp; ứng dụng bức xạ
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "5px",
              fontSize: "11px",
              lineHeight: 1.3,
            }}
          >
            {[
              ["1. Lò phản ứng", "Phân hạch ²³⁵U"],
              ["2. Chu trình 1", "Tải nhiệt kín"],
              ["3. Bộ sinh hơi", "Chu trình 2 quay tua-bin"],
              ["4. Máy phát", "Phát điện lưới"],
            ].map(([step, desc]) => (
              <div
                key={step}
                style={{
                  background: "#ffffff",
                  border: "1px solid #d0d7de",
                  borderTop: "3px solid #0f62fe",
                  padding: "5px 6px",
                }}
              >
                <strong style={{ display: "block", color: "#161616", marginBottom: "1px" }}>
                  {step}
                </strong>
                <span style={{ color: "#525252" }}>{desc}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "6px", fontSize: "11px", color: "#525252" }}>
            Y học &amp; nông nghiệp: Chẩn đoán – xạ trị (<Nuclide sym="Ra" a={223} z={88} />, <Nuclide sym="Lu" a={177} z={71} />), phân bón (<Nuclide sym="P" a={32} z={15} />), chiếu xạ vải thiều.
          </div>
        </div>
      );

    case "B25": {
      const previewRows = SGK_TABLE_25_1.slice(0, 4);
      return (
        <div className={styles.lessonCardMedia}>
          <div className={styles.b25MiniPreview}>
            <table className={styles.b25MiniTable} aria-label="Trích Bảng 25.1 SGK trang 121">
              <thead>
                <tr>
                  <th scope="col">t (s)</th>
                  <th scope="col">H (Bq)</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr key={row.t}>
                    <td>{row.t}</td>
                    <td>{row.h}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <svg
              viewBox="0 0 150 96"
              width="150"
              height="96"
              role="img"
              aria-label="Đồ thị độ phóng xạ H(t) giảm theo thời gian từ Bảng 25.1"
              style={{ width: "100%", height: "96px", display: "block" }}
            >
              <line x1="20" y1="82" x2="142" y2="82" stroke="#8d8d8d" strokeWidth="1.2" />
              <line x1="20" y1="82" x2="20" y2="10" stroke="#8d8d8d" strokeWidth="1.2" />
              {/* Đường H0/2 = 75,5 Bq */}
              <line x1="20" y1="46" x2="142" y2="46" stroke="#0f62fe" strokeWidth="1" strokeDasharray="3 3" />
              <polyline
                fill="none"
                stroke="#0f62fe"
                strokeWidth="2.2"
                points="20,14 30,42 40,56 60,67 80,71 100,75 120,77 140,78"
              />
              {[
                [20, 14],
                [30, 42],
                [40, 56],
                [60, 67],
                [80, 71],
                [100, 75],
                [120, 77],
                [140, 78],
              ].map(([cx, cy]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.8" fill="#161616" />
              ))}
              <text x="64" y="42" fill="#0f62fe" fontSize="9.5" fontWeight="700">
                H₀/2 = 75,5 Bq
              </text>
            </svg>
          </div>
        </div>
      );
    }
  }
}

export function Chapter4Hub() {
  return (
    <div className={styles.manualRoot} data-nuclear-manual="hub">
      <header className={styles.hubMasthead}>
        <div>
          <p className={styles.hubChapterLabel}>
            VẬT LÍ 12 · CHƯƠNG IV: VẬT LÍ HẠT NHÂN (BÀI 21 – BÀI 25)
          </p>
          <h1 className={styles.hubTitle}>Kho học liệu số &amp; Bàn thí nghiệm Vật lí hạt nhân</h1>
          <p className={styles.hubSubtitle}>
            Chọn bài học theo đúng thứ tự SGK để mở tiến trình 3 pha cho học sinh, hoặc mở chế độ soạn bài dành cho giáo viên.
          </p>
        </div>
        <div className={styles.hubActions}>
          <Link href="/hoc-lieu/soan-ke-hoach?template=B21" className={styles.cdsBtn}>
            Phần chuẩn bị của giáo viên
          </Link>
          <a href="#tra-cuu-hoc-lieu-le" className={`${styles.cdsBtn} ${styles.cdsBtnGhost}`}>
            Tra cứu tài liệu lẻ ↓
          </a>
        </div>
      </header>

      <section aria-label="Danh mục 5 bài học Chương IV theo thứ tự SGK">
        <ol className={styles.lessonLedgerGrid}>
          {CHAPTER4_LESSONS.map((lesson, idx) => {
            const isBottomRow = idx >= 3;
            return (
              <li
                key={lesson.code}
                className={`${styles.lessonLedgerItem} ${
                  isBottomRow ? styles.lessonLedgerItemWide : ""
                }`}
              >
                <article className={styles.lessonCard}>
                  <div>
                    <LessonCardVisual lesson={lesson} />
                    <div className={styles.lessonCardBody}>
                      <div className={styles.lessonMetaRow}>
                        <span className={styles.lessonCodeBadge}>
                          Bài {lesson.number} ({lesson.code})
                        </span>
                        <span>{lesson.sgkPages}</span>
                      </div>
                      <h2 className={styles.lessonCardTitle}>{lesson.title}</h2>
                      <p className={styles.lessonCardQuestion}>{lesson.guidingQuestion}</p>
                    </div>
                  </div>
                  <div className={styles.lessonCardFooter}>
                    <Link
                      href={`/hoc-lieu/truc-quan?bai=${lesson.code}`}
                      className={`${styles.cdsBtn} ${styles.cdsBtnPrimary} ${styles.cdsBtnSmall}`}
                    >
                      <span>Mở bài học</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                    {lesson.code === "B21" && (
                      <Link
                        href="/hoc-lieu/truc-quan?bai=B21&muc=b21-atomic-models"
                        className={`${styles.cdsBtn} ${styles.cdsBtnGhost} ${styles.cdsBtnSmall}`}
                      >
                        Mô hình nguyên tử
                      </Link>
                    )}
                    <Link
                      href={`/hoc-lieu/truc-quan?bai=${lesson.code}&che-do=giao-vien`}
                      className={`${styles.cdsBtn} ${styles.cdsBtnGhost} ${styles.cdsBtnSmall}`}
                    >
                      Chế độ giáo viên
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
