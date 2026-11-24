import React from "react";
import Link from "next/link";
import { PublicShell } from "@/app/PublicShell";

export interface PhaseActivityPageProps {
  phase: "before" | "during" | "after";
  activityNo: string;
  title: string;
  goal: string;
  product: string;
  limits?: React.ReactNode;
  children: React.ReactNode;
}

const PHASE_META: Record<
  PhaseActivityPageProps["phase"],
  {
    badge: string;
    stageName: string;
    demoPhase: 1 | 2 | 3;
    accentColor: string;
    softBg: string;
  }
> = {
  before: {
    badge: "GIAI ĐOẠN 1 · TRƯỚC GIỜ HỌC",
    stageName: "Chuẩn bị & khám phá trước giờ lên lớp",
    demoPhase: 1,
    accentColor: "var(--color-primary)",
    softBg: "var(--color-primary-soft)",
  },
  during: {
    badge: "GIAI ĐOẠN 2 · TRONG GIỜ HỌC",
    stageName: "Thảo luận, xử lí dữ liệu & hợp tác trên lớp",
    demoPhase: 2,
    accentColor: "var(--color-accent)",
    softBg: "var(--color-accent-soft)",
  },
  after: {
    badge: "GIAI ĐOẠN 3 · SAU GIỜ HỌC",
    stageName: "Củng cố, vận dụng & tự điều chỉnh",
    demoPhase: 3,
    accentColor: "var(--semantic-success)",
    softBg: "var(--semantic-success-soft)",
  },
};

export function PhaseActivityPage({
  phase,
  activityNo,
  title,
  goal,
  product,
  limits,
  children,
}: PhaseActivityPageProps) {
  const meta = PHASE_META[phase];

  return (
    <PublicShell>
      <div
        style={{
          maxWidth: "var(--content-width, 1200px)",
          margin: "0 auto",
          padding: "32px 24px 64px",
        }}
      >
        {/* Điều hướng quay lại Kho học liệu & Tiến trình 3 giai đoạn */}
        <nav
          aria-label="Đường dẫn điều hướng học liệu"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "24px",
            paddingBottom: "14px",
            borderBottom: "1px solid var(--border-light)",
            fontSize: "13.5px",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <Link
              href="/hoc-lieu"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--color-primary)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              ← Về Kho học liệu Chương IV
            </Link>
            <span aria-hidden="true" style={{ color: "var(--text-muted)" }}>
              /
            </span>
            <Link
              href={`/demo-lesson?giai-doan=${meta.demoPhase}`}
              style={{
                color: "var(--text-secondary)",
                textDecoration: "none",
              }}
            >
              {meta.stageName}
            </Link>
            <span aria-hidden="true" style={{ color: "var(--text-muted)" }}>
              /
            </span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              Hoạt động {activityNo}
            </span>
          </div>

          <Link
            href="/hoc-lieu"
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-light)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontWeight: 500,
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            Danh mục bài B21–B25
          </Link>
        </nav>

        {/* Phần đầu trang hoạt động */}
        <header
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <span
              className="mono-tag"
              style={{
                display: "inline-block",
                padding: "5px 10px",
                borderRadius: "999px",
                background: meta.softBg,
                color: meta.accentColor,
                fontSize: "11.5px",
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              {meta.badge}
            </span>
            <span
              className="mono-tag"
              style={{
                display: "inline-block",
                padding: "5px 10px",
                borderRadius: "999px",
                background: "var(--bg-surface-elevated)",
                color: "var(--text-primary)",
                fontSize: "11.5px",
                fontWeight: 600,
              }}
            >
              HOẠT ĐỘNG {activityNo}
            </span>
          </div>

          <h1
            style={{
              margin: "0 0 20px",
              fontSize: "clamp(24px, 3vw, 34px)",
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.25,
            }}
          >
            {title}
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: "16px",
            }}
          >
            <div
              style={{
                padding: "16px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-page)",
                border: "1px solid var(--border-light)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--color-primary)",
                  marginBottom: "6px",
                }}
              >
                Mục tiêu cần đạt
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "14.5px",
                  lineHeight: 1.6,
                  color: "var(--text-primary)",
                }}
              >
                {goal}
              </p>
            </div>

            <div
              style={{
                padding: "16px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-page)",
                border: "1px solid var(--border-light)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--semantic-success)",
                  marginBottom: "6px",
                }}
              >
                Sản phẩm học tập
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "14.5px",
                  lineHeight: 1.6,
                  color: "var(--text-primary)",
                }}
              >
                {product}
              </p>
            </div>
          </div>

          {limits && (
            <div
              role="note"
              aria-label="Giới hạn mô hình và phạm vi sử dụng"
              style={{
                marginTop: "16px",
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--semantic-warning-soft)",
                border: "1px solid var(--border-light)",
                color: "var(--semantic-warning)",
                fontSize: "13.5px",
                lineHeight: 1.6,
              }}
            >
              {limits}
            </div>
          )}
        </header>

        {/* Nội dung tương tác của hoạt động */}
        <section
          aria-label={`Không gian làm việc Hoạt động ${activityNo}`}
          style={{
            marginTop: "24px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {children}
        </section>
      </div>
    </PublicShell>
  );
}
