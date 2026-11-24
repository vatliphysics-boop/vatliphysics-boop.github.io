"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { TeachingPlanStudio } from "@/components/learning/TeachingPlanStudio";

function OpenPlanContent() {
  const sp = useSearchParams();
  const template = sp.get("template") ?? undefined;
  const material = sp.get("material") ?? undefined;
  const form = sp.get("form") ?? undefined;
  const plan = sp.get("plan") ?? undefined;

  return (
    <PortalShell
      role="teacher"
      active="materials"
      publicLibrary
      account={
        <Link className="btn small" href="/hoc-lieu/ai-giao-vien">
          Ngân hàng 213 câu hỏi
        </Link>
      }
    >
      <header
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}
      >
        <div>
          <p className="page-kicker">Kho học liệu · Phần chuẩn bị của giáo viên</p>
          <h1>Soạn kế hoạch dạy học</h1>
          <p className="page-description">
            Mục tiêu – học liệu – hoạt động – sản phẩm – đánh giá trong ba pha trước, trong và sau giờ học. Bản tùy
            chỉnh từ Trang bài học xuất hiện trực tiếp tại đây.
          </p>
        </div>
        {template && (
          <Link
            className="btn"
            href={`/hoc-lieu/truc-quan?bai=${encodeURIComponent(template)}&che-do=giao-vien`}
          >
            ← Quay lại Trang bài học ({template})
          </Link>
        )}
      </header>
      <TeachingPlanStudio template={template} materialId={material} form={form} initialPlanId={plan} />
    </PortalShell>
  );
}

export default function OpenPlanPage() {
  return (
    <Suspense fallback={<div style={{ padding: "32px" }}>Đang mở bàn soạn kế hoạch bài dạy…</div>}>
      <OpenPlanContent />
    </Suspense>
  );
}
