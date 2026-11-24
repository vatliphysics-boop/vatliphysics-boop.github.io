"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { AILearningWorkspace } from "@/components/learning/AILearningWorkspace";

function AILearningContent() {
  const sp = useSearchParams();
  const bai = sp.get("bai") ?? undefined;
  return (
    <PortalShell
      aiLessonCode={bai}
      role="student"
      active="tutor"
      publicLibrary
      account={
        <Link className="btn small" href="/hoc-lieu">
          Kho học liệu
        </Link>
      }
    >
      <AILearningWorkspace key={bai ?? "B21"} initialCode={bai} headingLevel={1} />
    </PortalShell>
  );
}

export default function AILearningPage() {
  return (
    <Suspense fallback={<div style={{ padding: "32px" }}>Đang mở trợ lí học tập…</div>}>
      <AILearningContent />
    </Suspense>
  );
}
