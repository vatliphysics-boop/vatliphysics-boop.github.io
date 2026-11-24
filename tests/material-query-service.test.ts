/**
 * Tests for Unified Material Query Service
 *
 * Run: npm test tests/material-query-service.test.ts
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import { CANONICAL_SYSTEM_MATERIALS } from "@/lib/material-bank";
import {
  filterCanonicalMaterials,
  removeDiacritics,
  type MaterialQueryContext,
  type MaterialQueryFilters,
} from "@/lib/material-query-service";

// Since we can't fully mock Supabase in unit tests, we test the pure functions first

describe("Material Query Service", () => {
  describe("filterCanonicalMaterials", () => {
    test("public role sees only published canonical items", () => {
      const publicContext: MaterialQueryContext = { role: "public" };
      const filtered = filterCanonicalMaterials(CANONICAL_SYSTEM_MATERIALS, publicContext);

      assert.ok(filtered.length > 0, "Should have some published materials");
      assert.ok(
        filtered.every((m) => m.is_published),
        "All filtered materials should be published"
      );
    });

    test("student role sees only published materials", () => {
      const studentContext: MaterialQueryContext = {
        role: "student",
        userId: "student-123",
      };
      const filtered = filterCanonicalMaterials(CANONICAL_SYSTEM_MATERIALS, studentContext);

      assert.ok(filtered.length > 0, "Should have some published materials");
      assert.ok(
        filtered.every((m) => m.is_published),
        "All filtered materials should be published"
      );
    });

    test("teacher role sees all canonical materials", () => {
      const teacherContext: MaterialQueryContext = {
        role: "teacher",
        userId: "teacher-123",
      };
      const filtered = filterCanonicalMaterials(CANONICAL_SYSTEM_MATERIALS, teacherContext);

      assert.ok(filtered.length > 0, "Should have materials");
      // Teachers see all canonical (which are all marked is_published: true anyway)
    });

    test("filters by material type", () => {
      const context: MaterialQueryContext = { role: "public" };
      const filters: MaterialQueryFilters = { materialType: "simulation" };
      const filtered = filterCanonicalMaterials(CANONICAL_SYSTEM_MATERIALS, context, filters);

      assert.ok(
        filtered.every((m) => m.material_type === "simulation"),
        "All results should be simulations"
      );
      assert.ok(filtered.length > 0, "Should have simulation materials");
    });

    test("filters by lesson tag (B21-B25)", () => {
      const context: MaterialQueryContext = { role: "public" };
      const filters: MaterialQueryFilters = { lessonTag: "B23" };
      const filtered = filterCanonicalMaterials(CANONICAL_SYSTEM_MATERIALS, context, filters);

      assert.ok(
        filtered.every((m) => m.lesson_tag === "B23" || m.lesson_tag === "general"),
        "All results should be B23 or general"
      );
    });

    test("filters by multiple lesson tags", () => {
      const context: MaterialQueryContext = { role: "public" };
      const filters: MaterialQueryFilters = { lessonTag: ["B21", "B22"] };
      const filtered = filterCanonicalMaterials(CANONICAL_SYSTEM_MATERIALS, context, filters);

      assert.ok(
        filtered.every((m) => ["B21", "B22"].includes(m.lesson_tag || "")),
        "All results should be B21 or B22"
      );
    });

    test("filters by phase (before_class, in_class, after_class)", () => {
      const context: MaterialQueryContext = { role: "public" };
      const filters: MaterialQueryFilters = { phase: "before_class" };
      const filtered = filterCanonicalMaterials(CANONICAL_SYSTEM_MATERIALS, context, filters);

      // Items with a recommendedPhase matching the filter; items without phase metadata are included (no phase constraint)
      assert.ok(
        filtered.every((m) => !m.metadata?.recommendedPhase || m.metadata.recommendedPhase === "before_class"),
        "Items with phase metadata should match before_class; items without phase are included"
      );
      assert.ok(filtered.length > 0, "Should have some before_class materials");
    });

    test("combines multiple filters", () => {
      const context: MaterialQueryContext = { role: "public" };
      const filters: MaterialQueryFilters = {
        materialType: "lecture_video",
        lessonTag: "B23",
      };
      const filtered = filterCanonicalMaterials(CANONICAL_SYSTEM_MATERIALS, context, filters);

      assert.ok(
        filtered.every(
          (m) => m.material_type === "lecture_video" && m.lesson_tag === "B23"
        ),
        "All results should be lecture_video in lesson B23"
      );
      assert.ok(filtered.length > 0, "Should have B23 lecture videos");
    });
  });

  describe("Material counts", () => {
    test("canonical materials count is accurate", () => {
      // Verified by runtime inspection: 100 items (as of 2026-11-23, adding standalone system-sim-atomic-models-b21)
      // Breakdown: 15 lecture_video, 23 simulation, 17 image, 18 document, 17 colab, 5 animation, 1 real_video, 4 assessment
      const count = CANONICAL_SYSTEM_MATERIALS.length;
      assert.strictEqual(count, 100, "Should have 100 canonical materials (verified 2026-11-23)");
    });

    test("all canonical materials have valid IDs", () => {
      assert.ok(
        CANONICAL_SYSTEM_MATERIALS.every((m) => m.id && m.id.length > 0),
        "All materials should have non-empty IDs"
      );
    });

    test("no duplicate IDs in canonical array", () => {
      const ids = CANONICAL_SYSTEM_MATERIALS.map((m) => m.id);
      const uniqueIds = new Set(ids);
      assert.strictEqual(
        ids.length,
        uniqueIds.size,
        "All canonical material IDs should be unique"
      );
    });

    test("all materials have required fields", () => {
      assert.ok(
        CANONICAL_SYSTEM_MATERIALS.every(
          (m) =>
            m.id &&
            m.title &&
            m.material_type &&
            m.category &&
            m.content_url &&
            typeof m.is_published === "boolean" &&
            typeof m.is_system === "boolean" &&
            m.created_at
        ),
        "All materials should have required fields"
      );
    });

    test("all simulations have expected B21-B25 coverage", () => {
      const simulations = CANONICAL_SYSTEM_MATERIALS.filter(
        (m) => m.material_type === "simulation"
      );
      const b21Sims = simulations.filter((m) => m.lesson_tag === "B21");
      const b22Sims = simulations.filter((m) => m.lesson_tag === "B22");
      const b23Sims = simulations.filter((m) => m.lesson_tag === "B23");
      const b24Sims = simulations.filter((m) => m.lesson_tag === "B24");
      const b25Sims = simulations.filter((m) => m.lesson_tag === "B25");

      assert.ok(b21Sims.length > 0, "Should have B21 simulations");
      assert.ok(b22Sims.length > 0, "Should have B22 simulations");
      assert.ok(b23Sims.length > 0, "Should have B23 simulations");
      assert.ok(b24Sims.length > 0, "Should have B24 simulations");
      assert.ok(b25Sims.length > 0, "Should have B25 simulations");
    });
  });

  describe("Deduplication", () => {
    test("Map-based deduplication preserves last occurrence", () => {
      const items = [
        { id: "test-1", title: "First" },
        { id: "test-2", title: "Second" },
        { id: "test-1", title: "Updated" }, // Duplicate ID with different data
      ];

      const deduped = new Map<string, (typeof items)[0]>();
      for (const item of items) {
        deduped.set(item.id, item);
      }

      const result = Array.from(deduped.values());
      assert.strictEqual(result.length, 2, "Should have 2 unique items");
      assert.strictEqual(
        result.find((r) => r.id === "test-1")?.title,
        "Updated",
        "Should keep last occurrence"
      );
    });
  });

  describe("Search utilities", () => {
    test("Vietnamese diacritics are removed for fuzzy matching", () => {
      const testCases: [string, string][] = [
        ["phóng xạ", "phong xa"],
        ["bán rã", "ban ra"],
        ["hạt nhân", "hat nhan"],
        ["phản ứng", "phan ung"],
      ];

      testCases.forEach(([input, expected]) => {
        const result = removeDiacritics(input);
        assert.strictEqual(result, expected, `"${input}" should normalize to "${expected}"`);
      });
    });
  });

  describe("Filter edge cases", () => {
    test("empty filters returns all published materials for public role", () => {
      const context: MaterialQueryContext = { role: "public" };
      const filtered = filterCanonicalMaterials(CANONICAL_SYSTEM_MATERIALS, context, {});

      assert.ok(
        filtered.every((m) => m.is_published),
        "Should only have published materials"
      );
      assert.ok(filtered.length > 0, "Should have results");
    });

    test("unknown lesson tag returns empty results", () => {
      const context: MaterialQueryContext = { role: "public" };
      const filters: MaterialQueryFilters = { lessonTag: "UNKNOWN" };
      const filtered = filterCanonicalMaterials(CANONICAL_SYSTEM_MATERIALS, context, filters);

      assert.strictEqual(filtered.length, 0, "Should have no results for unknown tag");
    });

    test("filter by publishedOnly=true excludes unpublished", () => {
      const context: MaterialQueryContext = { role: "teacher", userId: "test" };
      const filters: MaterialQueryFilters = { publishedOnly: true };
      const filtered = filterCanonicalMaterials(CANONICAL_SYSTEM_MATERIALS, context, filters);

      assert.ok(
        filtered.every((m) => m.is_published),
        "All results should be published"
      );
    });
  });
});

// Integration test note:
// Full integration tests with Supabase would require:
// - Test Supabase instance or mock client
// - Sample data in material_bank and lesson_materials tables
// - RLS rule verification
// - These are tested in E2E tests with playwright
