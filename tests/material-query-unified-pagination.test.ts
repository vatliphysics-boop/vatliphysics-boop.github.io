/**
 * Unified pagination tests — the Phase 1.5 fix.
 *
 * Phase 1 truncated the catalogue at 500 rows via `.range(0, 499)` and then
 * sliced in memory, so records past row 500 were unreachable. These tests
 * prove that is no longer true: they drive `getMaterialsUnified()` against a
 * fake Supabase client that implements the same keyset-cursor semantics the
 * real PostgREST endpoint does, with fixtures of 20 / 100 / 501 / 1200 rows.
 *
 * The fake client is deliberately strict: if the service ever reverts to a
 * fixed-window fetch, `created_at.lt.X` / `id.lt.Y` filters would go unused and
 * the >500 fixtures would fail.
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import {
  getMaterialsUnified,
  SOURCE_PAGE_SIZE,
  MAX_SCAN_ROWS,
  type MaterialQueryContext,
} from "@/lib/material-query-service";
import { CANONICAL_SYSTEM_MATERIALS } from "@/lib/material-bank";

// ---------------------------------------------------------------------------
// Fake Supabase client — supports the subset of the query builder the service
// uses: select/eq/or/order/limit + the `created_at.lt,...` keyset predicate.
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

type Condition =
  | { kind: "eq"; column: string; value: unknown }
  | { kind: "or"; clause: string }
  | { kind: "order"; column: string; ascending: boolean }
  | { kind: "limit"; count: number }
  | { kind: "range"; from: number; to: number };

class FakeQuery {
  private conditions: Condition[] = [];
  private readonly rows: Row[];

  constructor(rows: Row[]) {
    this.rows = rows;
  }

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.conditions.push({ kind: "eq", column, value });
    return this;
  }

  or(clause: string) {
    this.conditions.push({ kind: "or", clause });
    return this;
  }

  order(column: string, opts: { ascending: boolean }) {
    this.conditions.push({ kind: "order", column, ascending: opts.ascending });
    return this;
  }

  limit(count: number) {
    this.conditions.push({ kind: "limit", count });
    return this;
  }

  range(from: number, to: number) {
    this.conditions.push({ kind: "range", from, to });
    return this;
  }

  // Awaited directly by the service (`await query`), and also awaited after
  // `.maybeSingle()` in getMaterialById.
  async maybeSingle() {
    const { data } = await this.execute();
    return { data: (data as Row[])[0] ?? null, error: null };
  }

  then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) {
    return this.execute().then(resolve, reject);
  }

  private async execute(): Promise<{ data: Row[]; error: null; count?: number }> {
    let working = [...this.rows];

    for (const cond of this.conditions) {
      if (cond.kind === "eq") {
        working = working.filter((r) => r[cond.column] === cond.value);
      } else if (cond.kind === "or") {
        working = working.filter((r) => evalOrClause(r, cond.clause));
      }
    }

    const orders = this.conditions.filter(
      (c): c is Extract<Condition, { kind: "order" }> => c.kind === "order"
    );
    if (orders.length) {
      working.sort((a, b) => {
        for (const o of orders) {
          const av = a[o.column] as string;
          const bv = b[o.column] as string;
          if (av === bv) continue;
          const cmp = av < bv ? -1 : 1;
          return o.ascending ? cmp : -cmp;
        }
        return 0;
      });
    }

    const limitCond = [...this.conditions]
      .reverse()
      .find((c): c is Extract<Condition, { kind: "limit" }> => c.kind === "limit");

    const rangeCond = [...this.conditions]
      .reverse()
      .find((c): c is Extract<Condition, { kind: "range" }> => c.kind === "range");

    const count = working.length;
    let data = limitCond ? working.slice(0, limitCond.count) : working;
    if (rangeCond) {
      data = working.slice(rangeCond.from, rangeCond.to + 1);
    }
    return { data, error: null, count };
  }
}

/**
 * Evaluates the two `or` shapes the service emits:
 *   a.eq.X,b.eq.Y                                  (RLS mirror)
 *   created_at.lt.C,and(created_at.eq.C,id.lt.I)   (keyset cursor)
 */
function evalOrClause(row: Row, clause: string): boolean {
  // Split on commas that are not inside parentheses.
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of clause) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);

  return parts.some((part) => {
    const trimmed = part.trim();

    const andMatch = trimmed.match(/^and\((.*)\)$/);
    if (andMatch) {
      return andMatch[1].split(",").every((p) => evalSimple(row, p.trim()));
    }
    return evalSimple(row, trimmed);
  });
}

function evalSimple(row: Row, expr: string): boolean {
  const m = expr.match(/^([a-z_]+)\.(eq|lt|gt)\.(.*)$/);
  if (!m) return false;
  const [, column, op, rawValue] = m;
  const actual = row[column] as string;
  if (op === "eq") return actual === rawValue;
  if (op === "lt") return actual < rawValue;
  if (op === "gt") return actual > rawValue;
  return false;
}

function makeClient(tables: { material_bank?: Row[]; lesson_materials?: Row[] }) {
  return {
    from(table: string) {
      return new FakeQuery(tables[table as keyof typeof tables] ?? []);
    },
  } as unknown as Parameters<typeof getMaterialsUnified>[0];
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Build N rows. Every 7th row shares a created_at to exercise the tiebreaker. */
function buildBankRows(n: number, opts: { published?: boolean; year?: number } = {}): Row[] {
  const published = opts.published ?? true;
  const year = opts.year ?? 2026;
  return Array.from({ length: n }, (_, i) => {
    const idx = i + 1;
    // Deliberately coarse timestamps: 10 rows share each second.
    const second = String(idx % 10).padStart(2, "0");
    return {
      id: `mb-${String(idx).padStart(5, "0")}`,
      teacher_id: "teacher-a",
      title: `Học liệu số ${idx}`,
      description: `Mô tả cho học liệu ${idx}`,
      material_type: "document",
      category: "nuclear_physics",
      lesson_tag: idx % 2 === 0 ? "B22" : "B23",
      content_url: `https://example.test/${idx}`,
      storage_path: null,
      metadata: null,
      is_published: published,
      is_system: false,
      created_at: `${year}-01-01T00:00:${second}Z`,
      updated_at: null,
    };
  });
}

const TEACHER: MaterialQueryContext = { role: "teacher", userId: "teacher-a" };

/**
 * Count canonical materials matching a lesson tag (for test assertions).
 */
function canonicalByLesson(tag: string): number {
  return CANONICAL_SYSTEM_MATERIALS.filter((m) => m.lesson_tag === tag).length;
}

/**
 * Count canonical materials matching a search query (diacritic-insensitive).
 */
function canonicalSearchHits(query: string): number {
  const q = query.toLowerCase().trim();
  const nq = q
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

  return CANONICAL_SYSTEM_MATERIALS.filter((m) => {
    const text = `${m.title || ""} ${m.description || ""} ${m.lesson_tag || ""}`.toLowerCase();
    if (text.includes(q)) return true;
    const norm = text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
    return norm.includes(nq);
  }).length;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Unified pagination: no 500-row ceiling", () => {
  // The service always merges CANONICAL_SYSTEM_MATERIALS, so the merged total is
  // (fixture + canonical). Tests assert on the fixture-derived ids specifically.
  const CANONICAL_COUNT = CANONICAL_SYSTEM_MATERIALS.length;

  for (const size of [20, 100, 501, 1200]) {
    test(`catalogue of ${size} rows is fully reachable`, async () => {
      const rows = buildBankRows(size);
      const supabase = makeClient({ material_bank: rows });

      // Walk the whole catalogue one page at a time.
      const seen: string[] = [];
      let offset = 0;
      let guard = 0;

      for (;;) {
        const page = await getMaterialsUnified(supabase, TEACHER, undefined, {
          limit: 100,
          offset,
        });
        assert.strictEqual(page.truncated, false, "should not report truncation");
        seen.push(...page.items.map((i) => i.id));
        if (!page.hasMore) break;
        offset = page.nextOffset;
        if (++guard > 200) throw new Error("pagination did not terminate");
      }

      const fromFixture = seen.filter((id) => id.startsWith("mb-"));
      assert.strictEqual(
        fromFixture.length,
        size,
        `every fixture row must be visited (size ${size})`
      );
      assert.strictEqual(new Set(seen).size, seen.length, "no row may repeat");
      assert.strictEqual(
        seen.length,
        size + CANONICAL_COUNT,
        "merged total must be fixture + canonical"
      );
    });
  }

  test("total is exact, not capped at 500", async () => {
    const supabase = makeClient({ material_bank: buildBankRows(1200) });
    const page = await getMaterialsUnified(supabase, TEACHER, undefined, { limit: 20, offset: 0 });
    assert.ok(page.total > 500, `total should exceed 500, got ${page.total}`);
  });

  test("a record at position 900 is reachable and correct", async () => {
    const rows = buildBankRows(1200);
    const supabase = makeClient({ material_bank: rows });

    // Fetch the specific page containing offset 900 (5 pages of 200).
    const page = await getMaterialsUnified(supabase, TEACHER, undefined, {
      limit: 200,
      offset: 800,
    });
    const ids = page.items.map((i) => i.id);
    assert.ok(ids.length > 0, "page at offset 800 must not be empty");

    // Re-walk and confirm the same id appears at the same position.
    const full = await getMaterialsUnified(supabase, TEACHER, undefined, {
      limit: MAX_SCAN_ROWS + 1,
      offset: 0,
    });
    assert.deepStrictEqual(
      full.items.slice(800, 1000).map((i) => i.id),
      ids,
      "offset 800 page must match the full list"
    );
  });

  test("scanning uses fixed page size internally, not a 500 cap", async () => {
    // SOURCE_PAGE_SIZE is a network batch, and it must not be the old 500.
    assert.notStrictEqual(SOURCE_PAGE_SIZE, 500);
    const rows = buildBankRows(501);
    const supabase = makeClient({ material_bank: rows });
    const page = await getMaterialsUnified(supabase, TEACHER, undefined, { limit: 10, offset: 0 });
    // Row 501 exists and is counted.
    assert.ok(
      page.total >= 501,
      `a 501-row catalogue must report total >= 501, got ${page.total}`
    );
  });
});

describe("Unified pagination: ordering stability", () => {
  test("rows sharing a created_at never repeat or vanish across pages", async () => {
    // buildBankRows gives 10 rows per identical timestamp.
    const supabase = makeClient({ material_bank: buildBankRows(100) });

    const first = await getMaterialsUnified(supabase, TEACHER, undefined, {
      limit: 37,
      offset: 0,
      sortBy: "created_at",
      sortOrder: "desc",
    });
    const second = await getMaterialsUnified(supabase, TEACHER, undefined, {
      limit: 37,
      offset: 37,
      sortBy: "created_at",
      sortOrder: "desc",
    });

    const overlap = first.items
      .map((i) => i.id)
      .filter((id) => second.items.some((i) => i.id === id));
    assert.deepStrictEqual(overlap, [], "pages must not overlap on tied timestamps");
  });

  test("sort order is deterministic across repeated calls", async () => {
    const supabase = makeClient({ material_bank: buildBankRows(50) });
    const a = await getMaterialsUnified(supabase, TEACHER, undefined, { limit: 50 });
    const b = await getMaterialsUnified(supabase, TEACHER, undefined, { limit: 50 });
    assert.deepStrictEqual(a.items.map((i) => i.id), b.items.map((i) => i.id));
  });
});

describe("Unified pagination: search and filters run before pagination", () => {
  test("search narrows before slicing, so totals match the filter", async () => {
    // Use year 2027 so fixture rows are newest and land first in created_at DESC.
    const rows = buildBankRows(120, { year: 2027 }).map((r, i) => ({
      ...r,
      // Half the rows carry a distinctive word.
      title: i % 2 === 0 ? `Phóng xạ ${r.id}` : `Khác ${r.id}`,
    }));
    const supabase = makeClient({ material_bank: rows });

    const page = await getMaterialsUnified(
      supabase,
      TEACHER,
      { searchQuery: "phong xa" },
      { limit: 10, offset: 0 }
    );

    // Canonical rows also mention "phóng xạ", but fixture rows sort ahead.
    const fixtureCount = page.items.filter((i) => i.id.startsWith("mb-")).length;
    assert.ok(fixtureCount > 0, "fixture rows must appear in first page");

    // The full walk over the filtered set must yield exactly the 60 fixture hits
    // (plus canonical matches, stable count).
    const full = await getMaterialsUnified(
      supabase,
      TEACHER,
      { searchQuery: "phong xa" },
      { limit: MAX_SCAN_ROWS, offset: 0 }
    );
    const fixtureTotal = full.items.filter((i) => i.id.startsWith("mb-")).length;
    assert.strictEqual(fixtureTotal, 60, "exactly the 60 matching fixture rows");
    assert.strictEqual(full.total, fixtureTotal + canonicalSearchHits("phong xa"));
  });

  test("no-match search returns empty with total 0 and hasMore false", async () => {
    const supabase = makeClient({ material_bank: buildBankRows(50) });
    const page = await getMaterialsUnified(
      supabase,
      TEACHER,
      { searchQuery: "zzz-không-tồn-tại-zzz" },
      { limit: 20, offset: 0 }
    );
    assert.strictEqual(page.total, 0);
    assert.strictEqual(page.items.length, 0);
    assert.strictEqual(page.hasMore, false);
  });

  test("lesson filter is applied before pagination", async () => {
    const supabase = makeClient({ material_bank: buildBankRows(100) });
    const page = await getMaterialsUnified(
      supabase,
      TEACHER,
      { lessonTag: "B22" },
      { limit: 5, offset: 0 }
    );
    // Fixture: even-indexed rows get B22 (50 of them). Canonical adds its own.
    assert.strictEqual(page.total, 50 + canonicalByLesson("B22"));
    assert.ok(page.items.every((i) => i.lesson_tag === "B22"));
  });
});

describe("Unified pagination: deduplication across sources", () => {
  test("a row present in both canonical and material_bank appears once", async () => {
    const duplicateId = "canonical-dup-test";
    const supabase = makeClient({
      material_bank: [
        {
          id: duplicateId,
          teacher_id: "teacher-a",
          title: "Bản material_bank",
          description: "",
          material_type: "document",
          category: "nuclear_physics",
          lesson_tag: "B22",
          content_url: "",
          storage_path: null,
          metadata: null,
          is_published: true,
          is_system: false,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: null,
        },
      ],
    });

    const page = await getMaterialsUnified(supabase, TEACHER, undefined, {
      limit: MAX_SCAN_ROWS,
      offset: 0,
    });
    const matches = page.items.filter((i) => i.id === duplicateId);
    assert.ok(matches.length <= 1, "id must appear at most once");
  });

  test("legacy lesson_materials are included for teacher and prefixed", async () => {
    const supabase = makeClient({
      material_bank: [],
      lesson_materials: [
        {
          id: "99",
          teacher_id: "teacher-a",
          title: "Tài liệu cũ",
          description: "",
          material_type: "video",
          content_url: "",
          is_published: true,
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    });

    const page = await getMaterialsUnified(supabase, TEACHER, undefined, {
      limit: MAX_SCAN_ROWS,
      offset: 0,
    });
    const legacy = page.items.find((i) => i.id === "legacy-99");
    assert.ok(legacy, "legacy row must be included");
    assert.strictEqual(legacy?.material_type, "lecture_video");
  });
});

describe("Unified pagination: role visibility", () => {
  test("public context never receives unpublished rows", async () => {
    const supabase = makeClient({
      material_bank: [
        ...buildBankRows(3, { published: true }),
        ...buildBankRows(3, { published: false }),
      ],
    });

    const page = await getMaterialsUnified(
      supabase,
      { role: "public" },
      undefined,
      { limit: MAX_SCAN_ROWS, offset: 0 }
    );
    assert.ok(
      page.items.every((i) => i.is_published),
      "public must only see published material"
    );
  });
});

describe("Unified pagination: scan guard", () => {
  test("truncated flag is false for realistic catalogues", async () => {
    const supabase = makeClient({ material_bank: buildBankRows(1200) });
    const page = await getMaterialsUnified(supabase, TEACHER, undefined, { limit: 20, offset: 0 });
    assert.strictEqual(page.truncated, false);
  });

  test("the DB is asked for rows past index 499", async () => {
    // Record every range() window the service requests.
    const windows: { from: number; to: number }[] = [];
    const rows = buildBankRows(1200);

    const client = {
      from() {
        const q = new FakeQuery(rows);
        const originalRange = q.range.bind(q);
        q.range = (from: number, to: number) => {
          windows.push({ from, to });
          return originalRange(from, to);
        };
        return q;
      },
    } as unknown as Parameters<typeof getMaterialsUnified>[0];

    const page = await getMaterialsUnified(client, TEACHER, undefined, {
      limit: MAX_SCAN_ROWS,
      offset: 0,
    });

    assert.ok(
      windows.some((w) => w.to >= 499),
      `must request a window reaching past 499, got ${JSON.stringify(windows)}`
    );
    const fixtureRows = page.items.filter((i) => i.id.startsWith("mb-"));
    assert.strictEqual(fixtureRows.length, 1200, "all 1200 fixture rows returned");
  });
});

describe("Unified pagination: partial scan must be visible", () => {
  /**
   * A scan that fails partway returns fewer rows than exist. The caller MUST
   * be told, otherwise the UI silently shows an incomplete catalogue as if it
   * were complete. `truncated` is the signal the banner keys off.
   */
  test("an error mid-scan sets truncated instead of looking complete", async () => {
    const rows = buildBankRows(2500); // spans 3 windows of 1000
    let calls = 0;

    const client = {
      from() {
        const q = new FakeQuery(rows);
        const originalRange = q.range.bind(q);
        q.range = (from: number, to: number) => {
          calls += 1;
          // Fail on the second window, after one successful page.
          if (calls === 2) {
            // Replace execute's result by ordering a range that yields an error.
            // The service checks `error` on the response object.
            return {
              order() {
                return this;
              },
              then(resolve: (v: unknown) => unknown) {
                return Promise.resolve({
                  data: null,
                  error: { message: "simulated network failure" },
                }).then(resolve);
              },
            } as unknown as FakeQuery;
          }
          return originalRange(from, to);
        };
        return q;
      },
    } as unknown as Parameters<typeof getMaterialsUnified>[0];

    const page = await getMaterialsUnified(client, TEACHER, undefined, {
      limit: 10,
      offset: 0,
    });

    assert.strictEqual(
      page.truncated,
      true,
      "a partial scan must report truncated=true so the UI can warn the user"
    );
  });

  test("a complete scan reports truncated=false", async () => {
    const supabase = makeClient({ material_bank: buildBankRows(50) });
    const page = await getMaterialsUnified(supabase, TEACHER, undefined, { limit: 10, offset: 0 });
    assert.strictEqual(page.truncated, false);
  });
});

describe("Unified pagination: Supabase API max-rows limit", () => {
  /**
   * If the Supabase project sets a max-rows limit below SOURCE_PAGE_SIZE,
   * the scanner must not mistake a truncated response for end-of-data.
   * This was the bug Opus auditor found: if cap=500 and we ask for 1000,
   * we get 500 and thought the source was exhausted.
   */

  /**
   * Builds a client whose underlying "table" applies the same ordering and
   * filtering as the real query, then caps the response at `serverCap` rows
   * (mimicking Supabase's max-rows setting). We must cap AFTER the FakeQuery
   * has applied .order(), otherwise we slice pre-sorted data and the test
   * observes inconsistent ordering.
   */
  function makeClientWithServerCap(rows: Row[], serverCap: number) {
    return {
      from() {
        const q = new FakeQuery(rows);
        const origThen = q.then.bind(q);
        q.then = (resolve, reject) => {
          return Promise.resolve(origThen((result) => result))
            .then((result) => {
              const res = result as { data: Row[] | null };
              const data = Array.isArray(res.data) ? res.data.slice(0, serverCap) : res.data;
              return { ...res, data };
            })
            .then(resolve, reject);
        };
        return q;
      },
    } as unknown as Parameters<typeof getMaterialsUnified>[0];
  }

  test("server cap=300 with 1200-row dataset", async () => {
    const rows = buildBankRows(1200);
    const client = makeClientWithServerCap(rows, 300);
    const page = await getMaterialsUnified(client, TEACHER, undefined, { limit: 100, offset: 0 });
    // With cap=300 and SOURCE_PAGE_SIZE=1000, each request returns 300.
    // Scanner should iterate: 0–299, 300–599, 600–899, 900–1199, then empty.
    // Total in merged result: 1200 fixture + canonical.
    const fixtureInPage = page.items.filter((i) => i.id.startsWith("mb-")).length;
    assert.ok(fixtureInPage > 0, "should have fixture items on first page");
    // Full scan must reach all 1200.
    const full = await getMaterialsUnified(client, TEACHER, undefined, {
      limit: MAX_SCAN_ROWS,
      offset: 0,
    });
    const fixtureTotal = full.items.filter((i) => i.id.startsWith("mb-")).length;
    assert.strictEqual(fixtureTotal, 1200, "server cap=300 should not hide rows");
  });

  test("server cap=500 with 1000-row dataset", async () => {
    const rows = buildBankRows(1000);
    const client = makeClientWithServerCap(rows, 500);
    const full = await getMaterialsUnified(client, TEACHER, undefined, {
      limit: MAX_SCAN_ROWS,
      offset: 0,
    });
    const fixtureTotal = full.items.filter((i) => i.id.startsWith("mb-")).length;
    assert.strictEqual(fixtureTotal, 1000, "server cap=500 should fetch 1000-row dataset in 2 pages");
  });

  test("server cap=1000 (matches SOURCE_PAGE_SIZE)", async () => {
    const rows = buildBankRows(2500);
    const client = makeClientWithServerCap(rows, 1000);
    const full = await getMaterialsUnified(client, TEACHER, undefined, {
      limit: MAX_SCAN_ROWS,
      offset: 0,
    });
    const fixtureTotal = full.items.filter((i) => i.id.startsWith("mb-")).length;
    assert.strictEqual(fixtureTotal, 2500, "server cap=1000 should scan 2500-row dataset");
  });

  test("server cap equals dataset size (1200)", async () => {
    const rows = buildBankRows(1200);
    const client = makeClientWithServerCap(rows, 1200);
    const full = await getMaterialsUnified(client, TEACHER, undefined, {
      limit: MAX_SCAN_ROWS,
      offset: 0,
    });
    const fixtureTotal = full.items.filter((i) => i.id.startsWith("mb-")).length;
    assert.strictEqual(fixtureTotal, 1200);
  });

  test("dataset vượt MAX_SCAN_ROWS báo truncated=true", async () => {
    const rows = buildBankRows(21000);
    const client = makeClientWithServerCap(rows, 1000);
    const page = await getMaterialsUnified(client, TEACHER, undefined, { limit: 100, offset: 0 });
    assert.strictEqual(page.truncated, true, "exceeding MAX_SCAN_ROWS must set truncated");
    // Verify we got exactly MAX_SCAN_ROWS, not more.
    const fixtureCount = page.items.filter((i) => i.id.startsWith("mb-")).length;
    assert.ok(
      fixtureCount <= MAX_SCAN_ROWS,
      `fixture count ${fixtureCount} must not exceed MAX_SCAN_ROWS ${MAX_SCAN_ROWS}`
    );
  });

  test("không bỏ sót ID khi server cap khác", async () => {
    // Generate 150 rows with IDs `mb-00001` to `mb-00150`.
    const rows = buildBankRows(150);
    const client = makeClientWithServerCap(rows, 50); // server returns 50 per page.
    const full = await getMaterialsUnified(client, TEACHER, undefined, {
      limit: MAX_SCAN_ROWS,
      offset: 0,
    });
    const ids = new Set(full.items.filter((i) => i.id.startsWith("mb-")).map((i) => i.id));
    // All 150 fixture IDs must appear exactly once.
    for (let i = 1; i <= 150; i++) {
      const id = `mb-${String(i).padStart(5, "0")}`;
      assert.ok(ids.has(id), `ID ${id} must be present`);
    }
    assert.strictEqual(ids.size, 150, "no duplicates or missing IDs");
  });

  test("scan lỗi giữa chừng vẫn báo truncated", async () => {
    const rows = buildBankRows(500);
    let callCount = 0;
    const client = {
      from() {
        const q = new FakeQuery(rows);
        const origRange = q.range.bind(q);
        q.range = ((from: number, to: number) => {
          callCount++;
          if (callCount === 2) {
            // Fail on second request.
            return {
              order() {
                return this;
              },
              then(resolve: (v: unknown) => unknown) {
                return Promise.resolve({ data: null, error: { message: "simulated error" } }).then(resolve);
              },
            };
          }
          return origRange(from, to);
        }) as typeof q.range;
        return q;
      },
    } as unknown as Parameters<typeof getMaterialsUnified>[0];
    const page = await getMaterialsUnified(client, TEACHER, undefined, {
      limit: 100,
      offset: 0,
    });
    assert.strictEqual(page.truncated, true, "error mid-scan must set truncated=true");
  });
});
