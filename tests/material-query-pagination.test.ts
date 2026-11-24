/**
 * Tests for Material Query Service — pagination and search behavior.
 *
 * This file tests the PURE functions in the service without Supabase mocking.
 * Integration tests with a real DB are covered separately in E2E.
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import {
  filterCanonicalMaterials,
  searchMaterialsForTest,
  sortMaterialsForTest,
  paginateForTest,
  type MaterialQueryContext,
  type MaterialQueryFilters,
} from "@/lib/material-query-service";
import { CANONICAL_SYSTEM_MATERIALS } from "@/lib/material-bank";

describe("Material Query: search behavior", () => {
  test("search matches Vietnamese with diacritics", () => {
    const results = searchMaterialsForTest(CANONICAL_SYSTEM_MATERIALS, "phóng xạ");
    assert.ok(results.length > 0, "Should find materials for 'phóng xạ'");
  });

  test("search matches Vietnamese without diacritics", () => {
    const results = searchMaterialsForTest(CANONICAL_SYSTEM_MATERIALS, "phong xa");
    assert.ok(results.length > 0, "Should find materials for 'phong xa' (no diacritics)");
  });

  test("accented and unaccented searches return same results", () => {
    const withDiacritics = searchMaterialsForTest(CANONICAL_SYSTEM_MATERIALS, "hạt nhân");
    const without = searchMaterialsForTest(CANONICAL_SYSTEM_MATERIALS, "hat nhan");
    assert.strictEqual(
      withDiacritics.length,
      without.length,
      "Both forms should return same count"
    );
  });

  test("search is case-insensitive", () => {
    const lower = searchMaterialsForTest(CANONICAL_SYSTEM_MATERIALS, "mô phỏng");
    const upper = searchMaterialsForTest(CANONICAL_SYSTEM_MATERIALS, "MÔ PHỎNG");
    assert.strictEqual(lower.length, upper.length, "Case should not affect results");
  });

  test("empty query returns all materials", () => {
    const results = searchMaterialsForTest(CANONICAL_SYSTEM_MATERIALS, "");
    assert.strictEqual(
      results.length,
      CANONICAL_SYSTEM_MATERIALS.length,
      "Empty query returns all"
    );
  });

  test("no-match query returns empty", () => {
    const results = searchMaterialsForTest(CANONICAL_SYSTEM_MATERIALS, "xyzzy-unknown-term");
    assert.strictEqual(results.length, 0, "Should return no results");
  });

  test("search finds by lesson tag", () => {
    const results = searchMaterialsForTest(CANONICAL_SYSTEM_MATERIALS, "B23");
    assert.ok(results.length > 0, "Should find materials for B23");
    assert.ok(
      results.some((m) => m.lesson_tag === "B23"),
      "Should include B23 materials"
    );
  });
});

describe("Material Query: sorting", () => {
  test("sort by title ascending", () => {
    const sorted = sortMaterialsForTest(CANONICAL_SYSTEM_MATERIALS, "title", "asc");
    for (let i = 1; i < sorted.length; i++) {
      const cmp = sorted[i - 1].title.localeCompare(sorted[i].title, "vi", { sensitivity: "base" });
      assert.ok(
        cmp <= 0,
        `Title order violated at index ${i}: '${sorted[i - 1].title}' should not be after '${sorted[i].title}'`
      );
    }
  });

  test("sort by title descending", () => {
    const sorted = sortMaterialsForTest(CANONICAL_SYSTEM_MATERIALS, "title", "desc");
    for (let i = 1; i < sorted.length; i++) {
      const cmp = sorted[i - 1].title.localeCompare(sorted[i].title, "vi", { sensitivity: "base" });
      assert.ok(
        cmp >= 0,
        `Title order violated at index ${i}: '${sorted[i - 1].title}' should not be before '${sorted[i].title}'`
      );
    }
  });

  test("sort by created_at descending", () => {
    const sorted = sortMaterialsForTest(CANONICAL_SYSTEM_MATERIALS, "created_at", "desc");
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].created_at).getTime();
      const curr = new Date(sorted[i].created_at).getTime();
      assert.ok(prev >= curr, `Date order violated at index ${i}`);
    }
  });

  test("sort by created_at in both directions works", () => {
    const asc = sortMaterialsForTest(CANONICAL_SYSTEM_MATERIALS, "created_at", "asc");
    const desc = sortMaterialsForTest(CANONICAL_SYSTEM_MATERIALS, "created_at", "desc");

    // Verify ascending order
    for (let i = 1; i < asc.length; i++) {
      const prev = new Date(asc[i - 1].created_at).getTime();
      const curr = new Date(asc[i].created_at).getTime();
      assert.ok(prev <= curr, `Ascending order violated at index ${i}`);
    }

    // Verify descending order
    for (let i = 1; i < desc.length; i++) {
      const prev = new Date(desc[i - 1].created_at).getTime();
      const curr = new Date(desc[i].created_at).getTime();
      assert.ok(prev >= curr, `Descending order violated at index ${i}`);
    }

    // Verify they both have same count
    assert.strictEqual(asc.length, desc.length, "Both sorts should have same count");
  });
});

describe("Material Query: pagination", () => {
  test("first page has correct size", () => {
    const page = paginateForTest(CANONICAL_SYSTEM_MATERIALS, 0, 10);
    assert.strictEqual(page.items.length, 10);
    assert.strictEqual(page.offset, 0);
    assert.strictEqual(page.limit, 10);
  });

  test("total is accurate across all pages", () => {
    const total = CANONICAL_SYSTEM_MATERIALS.length;
    const page1 = paginateForTest(CANONICAL_SYSTEM_MATERIALS, 0, 10);
    const page2 = paginateForTest(CANONICAL_SYSTEM_MATERIALS, 10, 10);
    assert.strictEqual(page1.total, total);
    assert.strictEqual(page2.total, total);
  });

  test("hasMore is true when more items exist", () => {
    const page = paginateForTest(CANONICAL_SYSTEM_MATERIALS, 0, 10);
    assert.strictEqual(page.hasMore, true);
  });

  test("hasMore is false on last page", () => {
    const total = CANONICAL_SYSTEM_MATERIALS.length;
    const page = paginateForTest(CANONICAL_SYSTEM_MATERIALS, total - 5, 10);
    assert.strictEqual(page.hasMore, false);
    assert.strictEqual(page.items.length, 5);
  });

  test("offset beyond total returns empty", () => {
    const page = paginateForTest(CANONICAL_SYSTEM_MATERIALS, 10000, 10);
    assert.strictEqual(page.items.length, 0);
    assert.strictEqual(page.hasMore, false);
  });

  test("pagination preserves item identity", () => {
    const page1 = paginateForTest(CANONICAL_SYSTEM_MATERIALS, 0, 5);
    const page2 = paginateForTest(CANONICAL_SYSTEM_MATERIALS, 5, 5);
    const allIds = [...page1.items, ...page2.items].map((m) => m.id);
    const uniqueIds = new Set(allIds);
    assert.strictEqual(allIds.length, uniqueIds.size, "No duplicates across pages");
  });

  test("all pages cover full set without gaps", () => {
    const limit = 7;
    const total = CANONICAL_SYSTEM_MATERIALS.length;
    const collected = new Set<string>();
    for (let offset = 0; offset < total; offset += limit) {
      const page = paginateForTest(CANONICAL_SYSTEM_MATERIALS, offset, limit);
      for (const item of page.items) collected.add(item.id);
    }
    assert.strictEqual(collected.size, total, "All items covered");
  });
});

describe("Material Query: combined filters", () => {
  test("filter by type simulation and lesson B23", () => {
    const context: MaterialQueryContext = { role: "public" };
    const filters: MaterialQueryFilters = {
      materialType: "simulation",
      lessonTag: "B23",
    };
    const filtered = filterCanonicalMaterials(CANONICAL_SYSTEM_MATERIALS, context, filters);
    assert.ok(filtered.length > 0, "Should have B23 simulations");
    assert.ok(
      filtered.every((m) => m.material_type === "simulation" && m.lesson_tag === "B23"),
      "All results match both filters"
    );
  });

  test("filter by type document and publishedOnly", () => {
    const context: MaterialQueryContext = { role: "teacher", userId: "t1" };
    const filters: MaterialQueryFilters = {
      materialType: "document",
      publishedOnly: true,
    };
    const filtered = filterCanonicalMaterials(CANONICAL_SYSTEM_MATERIALS, context, filters);
    assert.ok(
      filtered.every((m) => m.material_type === "document" && m.is_published),
      "All results are published documents"
    );
  });

  test("array filter with multiple types", () => {
    const context: MaterialQueryContext = { role: "public" };
    const filters: MaterialQueryFilters = {
      materialType: ["simulation", "lecture_video"],
    };
    const filtered = filterCanonicalMaterials(CANONICAL_SYSTEM_MATERIALS, context, filters);
    assert.ok(
      filtered.every((m) => ["simulation", "lecture_video"].includes(m.material_type)),
      "All results match either type"
    );
  });

  test("search composition: filter then search narrows results", () => {
    const context: MaterialQueryContext = { role: "public" };
    const filters: MaterialQueryFilters = { materialType: "simulation" };
    const filtered = filterCanonicalMaterials(CANONICAL_SYSTEM_MATERIALS, context, filters);
    const searched = searchMaterialsForTest(filtered, "bán rã");
    assert.ok(
      searched.length <= filtered.length,
      "Search narrows filtered results"
    );
  });
});
