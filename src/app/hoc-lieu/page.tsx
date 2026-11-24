"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { Chapter4Hub } from "@/components/learning/Chapter4Hub";
import { MaterialCatalog } from "@/components/learning/MaterialCatalog";
import { CANONICAL_SYSTEM_MATERIALS } from "@/lib/material-bank";
import styles from "@/components/learning/NuclearLabManual.module.css";

function OpenLearningContent() {
  const sp = useSearchParams();
  const type = sp.get("type") ?? "all";
  const bai = sp.get("bai") ?? "all";
  const q = sp.get("q") ?? "";

  const published = CANONICAL_SYSTEM_MATERIALS.filter((m) => m.is_published);

  return (
    <PortalShell
      role="student"
      active="materials"
      publicLibrary
      account={
        <Link href="/login" className="btn small">
          Chế độ thẩm định trực tuyến
        </Link>
      }
    >
      <Chapter4Hub />

      <section
        id="tra-cuu-hoc-lieu-le"
        className={styles.warehouseSection}
        aria-labelledby="warehouse-heading"
      >
        <div className={styles.warehouseHeader}>
          <div>
            <h2 id="warehouse-heading" className={styles.warehouseTitle}>
              Tra cứu kho tài liệu lẻ theo loại và bài học
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#525252" }}>
              Tìm nhanh phiếu học tập PDF, mô phỏng riêng lẻ, video bài giảng và đề tự luyện của Chương IV.
            </p>
          </div>
          <Link href="/hoc-lieu/lop-hoc-dao-nguoc" className="btn small">
            Hướng dẫn 3 pha dạy học
          </Link>
        </div>
        <MaterialCatalog
          materials={published}
          total={published.length}
          hasMore={false}
          role="public"
          showLessonCards={false}
          truncated={false}
          page={1}
          basePath="/hoc-lieu"
          baseQuery=""
          initialType={type}
          initialLesson={bai}
          initialSearch={q}
        />
      </section>
    </PortalShell>
  );
}

export default function OpenLearningPage() {
  return (
    <Suspense fallback={<div style={{ padding: "32px" }}>Đang tải kho học liệu Chương IV…</div>}>
      <OpenLearningContent />
    </Suspense>
  );
}
