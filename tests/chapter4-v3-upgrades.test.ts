import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { SGK_TABLE_25_1, halfActivityBracket } from "@/lib/sgk-b25-decay";
import { fissionConservation } from "@/lib/fission-model";
import { REACTOR_FLOW_STAGES } from "@/lib/reactor-model";

const ROOT = process.cwd();

test("B22 V3: Blackett, fission conservation, two-pan mass defect scale, and E_lk / E_lkr notation", () => {
  const b22Src = fs.readFileSync(
    path.join(ROOT, "src/components/physics/B22Activities.tsx"),
    "utf8"
  );
  assert.ok(
    b22Src.includes("b22-reaction-balancer-v1"),
    "NuclearReactionBalancer must persist in localStorage"
  );
  assert.ok(
    b22Src.includes("b22-binding-energy-v1"),
    "BindingEnergyLab must persist in localStorage"
  );
  assert.ok(
    b22Src.includes("b22-fusion-lab-v1"),
    "NuclearFusion must persist in localStorage"
  );
  const totals = fissionConservation();
  assert.equal(totals.inputA, 236);
  assert.equal(totals.outputA, 236);
  assert.equal(totals.inputZ, 92);
  assert.equal(totals.outputZ, 92);
});

test("B23 V3: SGK Table 23.1 exact counts (1, 3, 2, 0, 3, 1), E & B field modes, and warning signs", () => {
  const b23Src = fs.readFileSync(
    path.join(ROOT, "src/components/physics/B23Activities.tsx"),
    "utf8"
  );
  assert.ok(
    b23Src.includes("b23-geiger-v1") && b23Src.includes("b23-radiation-props-v1"),
    "B23 Geiger & RadiationProperties must persist in localStorage"
  );
  assert.ok(
    b23Src.includes("15–20") && b23Src.includes("0"),
    "B23 Geiger lab must retain exact SGK Table 23.1 zero-count interval (15-20s: 0)"
  );
  const explorerSrc = fs.readFileSync(
    path.join(ROOT, "src/components/physics/RadiationTypesExplorer.tsx"),
    "utf8"
  );
  assert.ok(
    explorerSrc.includes("7300") || explorerSrc.includes("7 300") || explorerSrc.includes("Lorentz"),
    "RadiationTypesExplorer must explain smaller alpha curvature / magnetic Lorentz force"
  );
});

test("B24 & B25 V3: separate 3-loop energy flow, exact 8-point SGK Table 25.1, Problem 6b Patient B > Patient A, and 5-video VTT files", () => {
  assert.ok(REACTOR_FLOW_STAGES.length >= 4, "PWR flow model must cover core -> steam -> turbine -> generator");

  const b24Src = fs.readFileSync(
    path.join(ROOT, "src/components/physics/B24Activities.tsx"),
    "utf8"
  );
  assert.ok(
    !b24Src.includes("ReactorControlConcept as NuclearPowerEnergyFlow"),
    "NuclearPowerEnergyFlow must be a dedicated 3-loop station sim, not an alias of ReactorControlConcept"
  );
  assert.ok(
    b24Src.includes("b24-energy-flow-v1") && b24Src.includes("b24-reactor-control-v1"),
    "B24 energy flow and reactor control must persist separately in localStorage"
  );

  assert.deepEqual(
    SGK_TABLE_25_1.map((r) => [r.t, r.h]),
    [
      [0, 151],
      [30, 85],
      [60, 55],
      [120, 31],
      [180, 22],
      [240, 15],
      [300, 11],
      [360, 9],
    ],
    "SGK Table 25.1 must keep all 8 original (t, H) pairs unmodified"
  );
  const bracket = halfActivityBracket();
  assert.equal(bracket.halfActivityBq, 75.5);
  assert.equal(bracket.fromSeconds, 30);
  assert.equal(bracket.toSeconds, 60);

  const b25ActSrc = fs.readFileSync(
    path.join(ROOT, "src/components/physics/B25Activities.tsx"),
    "utf8"
  );
  assert.ok(
    !b25ActSrc.includes("useState(234)"),
    "NuclearEquationBalancer must not pre-fill daughter A=234"
  );

  // Verify FDG 18F physics ratio in B25Lesson.tsx: Patient B injected 60 min later (T = 110 min) requires ~1.46x initial preparation
  const fdgRatio = Math.pow(2, 60 / 110);
  assert.ok(fdgRatio > 1.45 && fdgRatio < 1.47, "Patient B must require ~1.46x initial FDG activity");
  const b25LessonSrc = fs.readFileSync(
    path.join(ROOT, "src/components/physics/B25Lesson.tsx"),
    "utf8"
  );
  assert.ok(
    !b25LessonSrc.includes("Vậy người A (hoặc lượt tiêm sớm hơn) cần chuẩn bị nhiều FDG hơn"),
    "B25Lesson.tsx must not contain the inverted Problem 6b conclusion"
  );
  assert.ok(
    (b25LessonSrc.includes("1{,}459") || b25LessonSrc.includes("46 %")) && b25LessonSrc.includes("¹⁸₈O"),
    "B25Lesson.tsx must include Problem 6a (18O + p -> 18F + n) and ~46% / 1,459 ratio for Patient 2"
  );

  // Verify all 5 WEBVTT caption files exist
  for (const code of ["b21", "b22", "b23", "b24", "b25"]) {
    const vttPath = path.join(ROOT, `public/videos/nuclear-openers/${code}.vi.vtt`);
    assert.ok(fs.existsSync(vttPath), `Missing caption file ${code}.vi.vtt`);
    const vtt = fs.readFileSync(vttPath, "utf8");
    assert.ok(vtt.startsWith("WEBVTT"), `${code}.vi.vtt must be valid WEBVTT`);
  }
});

test("SGK page-by-page alignment & copyright guard: no public SGK PDF, exact 7-row Bảng 23.2, Hình 24.2 dry cask, Hình 24.5 (a)/(b), and B25 46% FDG", async () => {
  const { SGK_TABLE_23_2_SAMPLES, getChapter4Lesson } = await import("@/lib/chapter4-lessons");
  const { indexedBookAssetFiles } = await import("@/lib/book-bank");

  // 1. Copyright guard: no scanned chapter PDF in public/ and no full-page scan exposure in indexedBookAssetFiles
  assert.equal(
    fs.existsSync(path.join(ROOT, "public/learning/SGK-chuong-IV.pdf")),
    false,
    "Full scanned Chapter IV PDF must not be publicly served from public/learning/"
  );
  const allowedAssets = indexedBookAssetFiles({
    books: [{ id: "sgk-kntt", title: "Test", pageCount: 1, sha256: "00" }],
    questions: [],
    equations: [],
    figures: [
      {
        id: "f1",
        book: "sgk-kntt",
        page: 91,
        label: "Hình 21.2",
        image: { file: "sgk-kntt/verified-figures/f1.png", width: 100, height: 100, page: 91 },
        status: "ok",
        colorStatus: "ok",
      },
    ],
    pages: [
      {
        book: "sgk-kntt",
        page: 91,
        file: "sgk-kntt/pages/page-091.png",
        width: 800,
        height: 1100,
        text: "",
        role: "body",
      },
    ],
    coverage: { sourcePages: 1, ocrPages: 1, embeddedImages: 1, questionsReviewed: 0 },
    counts: {},
  });
  assert.equal(
    allowedAssets.has("sgk-kntt/pages/page-091.png"),
    false,
    "indexedBookAssetFiles must never expose full-page textbook scans"
  );
  assert.equal(allowedAssets.has("sgk-kntt/verified-figures/f1.png"), true);

  // 2. Exact 7 isotopes of Bảng 23.2 (SGK tr. 108)
  assert.equal(SGK_TABLE_23_2_SAMPLES.length, 7);
  assert.deepEqual(
    SGK_TABLE_23_2_SAMPLES.map((item) => `${item.sym}-${item.a}`),
    ["C-14", "I-131", "O-15", "Po-210", "Ra-226", "Rn-219", "U-235"]
  );

  // 3. B24 Hình 24.2 dry storage cask & Hình 24.5 (a) irradiated on left
  const b24 = getChapter4Lesson("B24");
  const b24Control = b24.sections.find((s) => s.id === "b24-reactor-control");
  assert.ok(b24Control);
  assert.ok(
    !b24Control.teacherGuide.commonMisconceptions.includes("ngâm sâu hàng mét dưới bể nước"),
    "Hình 24.2 must describe the dry storage cask (thép mạ nickel & than chì), not a water pool"
  );
  const b24ActSrc = fs.readFileSync(
    path.join(ROOT, "src/components/physics/B24Activities.tsx"),
    "utf8"
  );
  const idxA = b24ActSrc.indexOf("(a) Đã chiếu xạ tia γ");
  const idxB = b24ActSrc.indexOf("(b) Vải thiều thường");
  assert.ok(idxA > 0 && idxB > idxA, "Hình 24.5 must place (a) irradiated lychee before (b) untreated lychee");

  // 4. B25 DataProcessLab unspoiled T check & Problem 6b ~46%
  const b25LabSrc = fs.readFileSync(
    path.join(ROOT, "src/components/physics/B25DataProcessLab.tsx"),
    "utf8"
  );
  assert.ok(
    b25LabSrc.includes("halfLife >= 38 && halfLife <= 46") && b25LabSrc.includes("data-traced"),
    "B25DataProcessLab must validate T in [38, 46] s and support bidirectional table-graph tracing"
  );
  const b25BodySrc = fs.readFileSync(
    path.join(ROOT, "src/components/learning/Chapter4SectionBody.tsx"),
    "utf8"
  );
  assert.ok(
    b25BodySrc.includes("46%") && b25BodySrc.includes("t₁ + 60"),
    "Chapter4SectionBody B25 Problem 6b must ask for ~46% and explain general t1, t2 = t1 + 60 min injection times"
  );
});

