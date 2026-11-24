import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ATOMIC_VIEWPORT_HALF_A0,
  INITIAL_ATOMIC_MODELS_STATE,
  MAX_ELECTRON_SAMPLES,
  appendHydrogen1sSamples,
  evaluateAtomicModelsEvidence,
  isAtomicModelsInquiryComplete,
  summarizeElectronSamples,
} from "@/simulations-v3/physics/atomic-models-engine";

describe("Atomic Models B21 — Hydrogen 1s z=0 slice sampling", () => {
  it("preserves exact coordinates of previously sampled points when appending +1 and +100", () => {
    const one = appendHydrogen1sSamples([], 1, 1001);
    assert.equal(one.length, 1);
    const firstCoord = { ...one[0] };

    const hundredAndOne = appendHydrogen1sSamples(one, 100, 1001);
    assert.equal(hundredAndOne.length, 101);
    assert.deepEqual(hundredAndOne[0], firstCoord);

    for (const pt of hundredAndOne) {
      assert.ok(Math.abs(pt.xA0) <= ATOMIC_VIEWPORT_HALF_A0);
      assert.ok(Math.abs(pt.yA0) <= ATOMIC_VIEWPORT_HALF_A0);
      assert.ok(pt.rA0 >= 0);
    }
  });

  it("matches analytical Hydrogen 1s equatorial slice areal density exp(-2r/a0)", () => {
    // Trên lát cắt z = 0: P(r <= 1 a0) = 1 - 3*exp(-2) ≈ 59.4% (có điều kiện trong khung ±3.2 a0 ~ 60.1%)
    // Mật độ chấm trên đơn vị diện tích trong hình tròn r ∈ [0, 0.8 a0] phải cao hơn hẳn vành [1.6 a0, 2.4 a0]
    const samples = appendHydrogen1sSamples([], 1000, 424242);
    assert.equal(samples.length, MAX_ELECTRON_SAMPLES);

    const stats = summarizeElectronSamples(samples);
    assert.ok(
      stats.innerPercent >= 53 && stats.innerPercent <= 67,
      `Tỉ lệ mẫu trong r <= 1 a0 (${stats.innerPercent}%) phải khớp lí thuyết ~60%`
    );

    const innerDiskCount = samples.filter((p) => p.rA0 <= 0.8).length;
    const outerRingCount = samples.filter(
      (p) => p.rA0 >= 1.6 && p.rA0 <= 2.4
    ).length;

    const innerDiskArea = Math.PI * 0.8 * 0.8;
    const outerRingArea = Math.PI * (2.4 * 2.4 - 1.6 * 1.6);

    const innerArealDensity = innerDiskCount / innerDiskArea;
    const outerArealDensity = outerRingCount / outerRingArea;

    // Lí thuyết tỉ số mật độ diện tích trung bình ~ > 10 lần
    assert.ok(
      innerArealDensity > outerArealDensity * 6,
      `Mật độ diện tích vùng tâm (${innerArealDensity.toFixed(
        1
      )}) phải lớn hơn nhiều vùng rìa (${outerArealDensity.toFixed(1)})`
    );
  });
});

describe("Atomic Models B21 — Evidence connection & strict completion criteria", () => {
  it("merely opening the simulation or taking 100 samples does NOT mark task complete", () => {
    assert.equal(isAtomicModelsInquiryComplete(INITIAL_ATOMIC_MODELS_STATE), false);

    const sampledOnly = {
      ...INITIAL_ATOMIC_MODELS_STATE,
      activeModel: "cloud" as const,
      hasExploredStage: true,
      sampleCount: 101,
    };
    assert.equal(isAtomicModelsInquiryComplete(sampledOnly), false);
  });

  it("distinguishes nuclear charge concentration (Rutherford) from quantum electron cloud", () => {
    const cloudPick = evaluateAtomicModelsEvidence({
      ...INITIAL_ATOMIC_MODELS_STATE,
      hasExploredStage: true,
      selectedEvidenceModel: "cloud",
      explanationText: "Vì một số ít hạt alpha bị lệch góc rất lớn khi đi gần tâm.",
      submittedEvidence: true,
    });
    assert.equal(cloudPick.status, "epistemic_note");
    assert.ok(cloudPick.detail.includes("đám mây xác suất"));

    const thomsonPick = evaluateAtomicModelsEvidence({
      ...INITIAL_ATOMIC_MODELS_STATE,
      hasExploredStage: true,
      selectedEvidenceModel: "thomson",
      explanationText: "Hạt alpha đi thẳng qua nguyên tử.",
      submittedEvidence: true,
    });
    assert.equal(thomsonPick.status, "needs_revision");
  });

  it("marks complete after stage exploration (even after reset to 0 samples) + Rutherford choice + valid explanation", () => {
    const afterResetAndExplain = {
      ...INITIAL_ATOMIC_MODELS_STATE,
      hasExploredStage: true,
      sampleCount: 0, // Đã nhấn Làm lại về 0 mẫu
      selectedEvidenceModel: "rutherford" as const,
      explanationText:
        "Một số rất ít hạt alpha lệch góc lớn chứng tỏ điện tích dương tập trung ở hạt nhân rất nhỏ.",
      submittedEvidence: true,
    };
    const feedback = evaluateAtomicModelsEvidence(afterResetAndExplain);
    assert.equal(feedback.status, "complete");
    assert.equal(isAtomicModelsInquiryComplete(afterResetAndExplain), true);
  });
});

describe("B21 Standalone Atomic Models & Nucleon/Isotope V3 Upgrades", () => {
  it("registers system-sim-atomic-models-b21 in CANONICAL_SYSTEM_MATERIALS with workspace='atomic-models'", async () => {
    const { CANONICAL_SYSTEM_MATERIALS } = await import("@/lib/material-bank");
    const { safeLearningUrl } = await import("@/lib/pathway-progress");

    const item = CANONICAL_SYSTEM_MATERIALS.find(
      (m) => m.id === "system-sim-atomic-models-b21"
    );
    assert.ok(item, "system-sim-atomic-models-b21 must exist in CANONICAL_SYSTEM_MATERIALS");
    assert.equal(item.lesson_tag, "B21");
    assert.equal(item.material_type, "simulation");
    assert.equal(item.metadata?.workspace, "atomic-models");
    assert.equal(item.is_published, true);
    assert.ok(safeLearningUrl(item.content_url), "content_url must pass safeLearningUrl");
  });

  it("includes Erwin Schrödinger & Niels Bohr (1913), 390px badge wrap, standalone preview & B21Lesson compliance", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const simSrc = fs.readFileSync(
      path.resolve("src/components/learning/AtomicModelsComparisonSim.tsx"),
      "utf8"
    );
    const cssSrc = fs.readFileSync(
      path.resolve("src/components/learning/AtomicModelsComparisonSim.module.css"),
      "utf8"
    );
    const previewSrc = fs.readFileSync(
      path.resolve("src/components/learning/LearningResourcePreview.tsx"),
      "utf8"
    );
    const hubSrc = fs.readFileSync(
      path.resolve("src/components/learning/Chapter4Hub.tsx"),
      "utf8"
    );
    const lessonSrc = fs.readFileSync(
      path.resolve("src/components/physics/B21Lesson.tsx"),
      "utf8"
    );

    assert.ok(simSrc.includes("Niels Bohr (1913)"));
    assert.ok(simSrc.includes("Erwin Schrödinger"));
    assert.ok(cssSrc.includes("white-space: normal;"));
    assert.ok(cssSrc.includes("flex-wrap: wrap;"));
    assert.ok(previewSrc.includes('workspace === "atomic-models"'));
    assert.ok(hubSrc.includes("/hoc-lieu/truc-quan?bai=B21&muc=b21-atomic-models"));
    assert.ok(lessonSrc.includes("AtomicModelsComparisonSim"));
    assert.ok(!lessonSrc.includes("Nguồn: giáo viên bộ môn"));
    assert.ok(lessonSrc.includes("Giọng đọc tổng hợp tiếng Việt"));
  });

  it("upgrades B21Activities, NuclearSymbol, globals.css & FixedPhysicsActivityRenderer for 118 elements and 3 Hydrogen isotopes", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const activitiesSrc = fs.readFileSync(
      path.resolve("src/components/physics/B21Activities.tsx"),
      "utf8"
    );
    const sharedSrc = fs.readFileSync(
      path.resolve("src/components/physics/shared.tsx"),
      "utf8"
    );
    const globalsSrc = fs.readFileSync(
      path.resolve("src/app/globals.css"),
      "utf8"
    );
    const rendererSrc = fs.readFileSync(
      path.resolve("src/components/physics/FixedPhysicsActivityRenderer.tsx"),
      "utf8"
    );

    // Full 118 elements including Hydrogen, Helium, Silicon, Gold, Uranium, Oganesson
    for (const name of ["Hydrogen", "Helium", "Silicon", "Gold", "Uranium", "Oganesson"]) {
      assert.ok(activitiesSrc.includes(`name: '${name}'`), `Missing element ${name}`);
    }
    // Explicit N = A - Z and 3 Hydrogen isotopes
    assert.ok(activitiesSrc.includes("N = A − Z"));
    assert.ok(activitiesSrc.includes("Hydrogen thường ¹₁H"));
    assert.ok(activitiesSrc.includes("Hydrogen nặng / Deuterium ²₁H"));
    assert.ok(activitiesSrc.includes("Hydrogen siêu nặng / Tritium ³₁H"));
    assert.ok(!activitiesSrc.includes("scale(0.8)"));
    assert.ok(activitiesSrc.includes("b21-structure-size-state-v1"));
    assert.ok(activitiesSrc.includes("b21-symbol-isotopes-state-v1"));

    // Crisp NuclearSymbol without broken .physics-nuclide span rule
    assert.ok(sharedSrc.includes("physics-nuclide__scripts"));
    assert.ok(!globalsSrc.includes(".physics-nuclide span {"));
    assert.ok(globalsSrc.includes(".physics-nuclide__scripts"));

    // Open details by default for interactive practice panels
    assert.ok(rendererSrc.includes("<details") && rendererSrc.includes("open"));
  });
});

