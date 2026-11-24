"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { VisualLearningStudio } from "@/components/learning/VisualLearningStudio";

function VisualLearningContent() {
  const sp = useSearchParams();
  const bai = sp.get("bai") ?? "B21";
  const initialTeacherMode = sp.get("che-do") === "giao-vien";
  const pha = sp.get("pha") ?? undefined;
  const muc = sp.get("muc") ?? undefined;

  return (
    <PortalShell
      floatingTutor={false}
      aiLessonCode={bai}
      role={initialTeacherMode ? "teacher" : "student"}
      active="materials"
      publicLibrary
      account={
        <Link className="btn small" href="/login">
          Chế độ thẩm định trực tuyến
        </Link>
      }
    >
      <VisualLearningStudio
        key={`${bai}-${initialTeacherMode ? "gv" : "hs"}`}
        code={bai}
        initialTeacherMode={initialTeacherMode}
        initialPhase={pha}
        initialSection={muc}
      />
    </PortalShell>
  );
}

export default function VisualLearningPage() {
  return (
    <Suspense fallback={<div style={{ padding: "32px" }}>Đang mở bài học trực quan…</div>}>
      <VisualLearningContent />
    </Suspense>
  );
}
