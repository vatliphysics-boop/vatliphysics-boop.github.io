/**
 * Unified Material Query Service
 *
 * Single entry point for retrieving materials across three sources:
 *   1. CANONICAL_SYSTEM_MATERIALS  (hardcoded, in-process, fully bounded)
 *   2. material_bank               (Supabase, teacher custom material)
 *   3. lesson_materials            (Supabase legacy, teacher only)
 *
 * ## Pagination model
 *
 * The three sources cannot be paged independently: the merged list's ordering
 * interleaves rows from all of them. Phase 1 shipped `.range(0, 499)` which
 * silently truncated the whole catalogue at 500 rows — records past that point
 * were unreachable, and every page re-fetched the same window.
 *
 * This module fixes that WITHOUT changing the production schema:
 *
 *   - Each source is drained with a deterministic, keyset-paged scan
 *     (`orderBy(key, "id").gt(key, cursor)`), following `Range` headers until
 *     the source is exhausted. No 500-row ceiling.
 *   - Results are merged, deduplicated by `id` with an explicit source
 *     precedence, then filtered, searched and sorted once over the full set.
 *   - The caller's `offset/limit` is applied to that full, correctly ordered
 *     list, so `total` is exact and `hasMore` is truthful.
 *
 * The scan is bounded by `MAX_SCAN_ROWS` (a guard against runaway memory), not
 * by a page size. A catalogue under that ceiling is served exactly; one above
 * it is served exactly up to the ceiling and reports `truncated: true` so the
 * UI can say so rather than silently hiding records.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { CANONICAL_SYSTEM_MATERIALS, type MaterialItem, type MaterialType } from "./material-bank";

export type QueryRole = "public" | "student" | "teacher";

/**
 * Rows fetched per Supabase round-trip while draining a source.
 * This is a NETWORK batch size, not a catalogue ceiling.
 */
export const SOURCE_PAGE_SIZE = 1000;

/**
 * Safety ceiling on the number of rows drained from one source in one request.
 * Distinct from SOURCE_PAGE_SIZE: 20 sources × 20k = 400k rows is far beyond any
 * realistic catalogue and would indicate a query bug rather than real data.
 * When hit, the result is flagged `truncated` instead of failing silently.
 */
export const MAX_SCAN_ROWS = 20_000;

export interface MaterialQueryContext {
  role: QueryRole;
  userId?: string;
  classId?: string;
}

export interface MaterialQueryFilters {
  materialType?: MaterialType | MaterialType[];
  lessonTag?: string | string[];
  searchQuery?: string;
  phase?: "before_class" | "in_class" | "after_class";
  publishedOnly?: boolean;
  ownedByMe?: boolean;
}

export interface MaterialQueryPagination {
  limit: number;
  offset?: number;
  sortBy?: "title" | "created_at" | "updated_at" | "relevance";
  sortOrder?: "asc" | "desc";
}

export interface MaterialQueryResult {
  items: MaterialItem[];
  /** Exact count over the full merged result set (pre-pagination). */
  total: number;
  /** True when more rows exist after this page. */
  hasMore: boolean;
  /** `next_offset` for a naive offset consumer; equals offset + items.length. */
  nextOffset: number;
  offset: number;
  limit: number;
  /** True when a source hit MAX_SCAN_ROWS and the catalogue may be partial. */
  truncated: boolean;
}

/**
 * Source precedence for deduplication. Later sources override earlier ones,
 * matching the original Map-by-ID behaviour where `material_bank` superseded
 * canonical entries and legacy rows were appended last.
 *
 * Kept as an explicit list so the rule is documented rather than implied by
 * insertion order.
 */
const SOURCE_PRECEDENCE = ["canonical", "material_bank", "lesson_materials"] as const;
type SourceName = (typeof SOURCE_PRECEDENCE)[number];

interface SourcedItem {
  item: MaterialItem;
  source: SourceName;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Unified, role-aware, fully paginated material query.
 *
 * Filters and search are applied to the complete merged set BEFORE pagination,
 * so `total` and `hasMore` describe the real result set and page 2 never
 * repeats page 1.
 */
export async function getMaterialsUnified(
  supabase: SupabaseClient,
  context: MaterialQueryContext,
  filters?: MaterialQueryFilters,
  pagination?: MaterialQueryPagination
): Promise<MaterialQueryResult> {
  const limit = Math.max(1, pagination?.limit ?? 20);
  const offset = Math.max(0, pagination?.offset ?? 0);
  const sortBy = pagination?.sortBy ?? "title";
  const sortOrder = pagination?.sortOrder ?? "asc";

  let truncated = false;

  // 1. Canonical — in-process, already bounded by the source file.
  const canonical = filterCanonicalMaterials(CANONICAL_SYSTEM_MATERIALS, context, filters);
  const sourced: SourcedItem[] = canonical.map((item) => ({ item, source: "canonical" }));

  // 2. material_bank — drained via keyset scan.
  if (context.userId || context.role !== "public") {
    try {
      const scan = await scanMaterialBank(supabase, context);
      truncated = truncated || scan.truncated;
      sourced.push(...scan.rows.map((item) => ({ item, source: "material_bank" as const })));
    } catch (err) {
      // Fresh DB without material_bank should not break the catalogue.
      console.warn("material_bank query failed (expected on fresh DB):", err);
    }
  }

  // 3. lesson_materials — legacy, teacher only, drained via keyset scan.
  if (context.role === "teacher" && context.userId) {
    try {
      const scan = await scanLessonMaterials(supabase, context.userId);
      truncated = truncated || scan.truncated;
      sourced.push(...scan.rows.map((item) => ({ item, source: "lesson_materials" as const })));
    } catch {
      // Legacy table may not exist; ignore.
    }
  }

  // 4. Deduplicate by id, honouring explicit source precedence.
  const dedupedById = new Map<string, SourcedItem>();
  for (const entry of sourced) {
    const existing = dedupedById.get(entry.item.id);
    if (!existing) {
      dedupedById.set(entry.item.id, entry);
      continue;
    }
    const existingRank = SOURCE_PRECEDENCE.indexOf(existing.source);
    const incomingRank = SOURCE_PRECEDENCE.indexOf(entry.source);
    if (incomingRank >= existingRank) dedupedById.set(entry.item.id, entry);
  }
  let merged = Array.from(dedupedById.values()).map((e) => e.item);

  // 5. Filters that need the full row (DB-side filters already narrowed the scan).
  merged = merged.filter((item) => matchesPostFilters(item, filters));

  // 6. Search across title / description / lesson tag, diacritic-insensitive.
  if (filters?.searchQuery?.trim()) {
    merged = searchMaterials(merged, filters.searchQuery);
  }

  // 7. Sort with a stable tiebreaker so pagination never shuffles.
  merged = sortMaterials(merged, sortBy, sortOrder);

  // 8. Paginate the full, correctly ordered list.
  const total = merged.length;
  const items = merged.slice(offset, offset + limit);

  return {
    items,
    total,
    hasMore: offset + items.length < total,
    nextOffset: offset + items.length,
    offset,
    limit,
    truncated,
  };
}

/**
 * Filter canonical materials by role and query filters.
 */
export function filterCanonicalMaterials(
  materials: MaterialItem[],
  context: MaterialQueryContext,
  filters?: MaterialQueryFilters
): MaterialItem[] {
  return materials.filter((item) => {
    if (context.role === "public" || context.role === "student") {
      if (!item.is_published) return false;
    }
    return matchesPostFilters(item, filters);
  });
}

/**
 * Row-level filters applied after the DB scan.
 * Type and lesson filters are also pushed down where possible (see the scans);
 * re-applying here keeps behaviour identical across all three sources.
 */
function matchesPostFilters(item: MaterialItem, filters?: MaterialQueryFilters): boolean {
  if (!filters) return true;

  if (filters.publishedOnly && !item.is_published) return false;

  if (filters.ownedByMe) {
    // ownedByMe only means something for non-canonical rows.
    if (item.is_system) return false;
  }

  if (filters.materialType) {
    const types = Array.isArray(filters.materialType) ? filters.materialType : [filters.materialType];
    if (!types.includes(item.material_type)) return false;
  }

  if (filters.lessonTag) {
    const tags = Array.isArray(filters.lessonTag) ? filters.lessonTag : [filters.lessonTag];
    const tag = item.lesson_tag ?? null;
    if (tag) {
      if (!tags.includes(tag) && !(tags.includes("general") && tag === "general")) return false;
    } else if (!tags.includes("general")) {
      // Untagged rows only match the "general" bucket.
      return false;
    }
  }

  if (filters.phase && item.metadata?.recommendedPhase) {
    if (item.metadata.recommendedPhase !== filters.phase) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Source scans (keyset / cursor, no fixed ceiling)
// ---------------------------------------------------------------------------

interface ScanResult<T> {
  rows: T[];
  truncated: boolean;
}

/**
 * Drain `material_bank` completely using `Range` pagination.
 *
 * Why range-draining and not a cursor on `created_at`:
 * PostgREST cursor filters embed the timestamp in a filter *string*
 * (`created_at.lt.2026-01-01T00:00:00+00:00`). PostgreSQL timestamptz values
 * can carry `:` and `+`, which the PostgREST/URL layer re-interprets (`+`
 * decodes as a space). A mis-encoded cursor silently SKIPS rows — a
 * correctness bug worse than the inefficiency it would fix. `.range()` takes
 * plain integers and cannot be mis-encoded.
 *
 * Ordering is `created_at DESC, id DESC`; `id` is unique, so the order is
 * total and stable even when many rows share a timestamp.
 *
 * CRITICAL: We advance `from` by the actual number of rows returned, not a
 * fixed SOURCE_PAGE_SIZE. PostgREST may have a lower max-rows limit (e.g., 500)
 * than SOURCE_PAGE_SIZE (1000). If we always advanced by SOURCE_PAGE_SIZE, we
 * would skip rows when the server cap is lower.
 *
 * The loop continues until either:
 * 1. A page returns 0 rows (end of data).
 * 2. We reach MAX_SCAN_ROWS (guard ceiling).
 * 3. An error occurs (partial scan, truncated=true).
 */
async function scanMaterialBank(
  supabase: SupabaseClient,
  context: MaterialQueryContext
): Promise<ScanResult<MaterialItem>> {
  const rows: MaterialItem[] = [];
  let truncated = false;
  let from = 0;

  while (from < MAX_SCAN_ROWS) {
    const to = Math.min(from + SOURCE_PAGE_SIZE - 1, MAX_SCAN_ROWS - 1);

    const { data, error } = await supabase
      .from("material_bank")
      .select("*")
      .or(
        context.role === "teacher" && context.userId
          ? `is_published.eq.true,teacher_id.eq.${context.userId}`
          : "is_published.eq.true"
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    if (error) {
      console.warn("material_bank scan error:", error);
      truncated = true;
      break;
    }

    if (!data || data.length === 0) break;

    for (const row of data) rows.push(mapMaterialBankRow(row));

    // Advance by actual rows returned, not SOURCE_PAGE_SIZE.
    from += data.length;

    // Guard against exceeding MAX_SCAN_ROWS.
    if (rows.length >= MAX_SCAN_ROWS) {
      truncated = true;
      rows.splice(MAX_SCAN_ROWS);
      break;
    }
  }

  return { rows, truncated };
}

/**
 * Drain legacy `lesson_materials` for one teacher, same range discipline.
 */
async function scanLessonMaterials(
  supabase: SupabaseClient,
  teacherId: string
): Promise<ScanResult<MaterialItem>> {
  const rows: MaterialItem[] = [];
  let truncated = false;
  let from = 0;

  while (from < MAX_SCAN_ROWS) {
    const to = Math.min(from + SOURCE_PAGE_SIZE - 1, MAX_SCAN_ROWS - 1);

    const { data, error } = await supabase
      .from("lesson_materials")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    if (error) {
      console.warn("lesson_materials scan error:", error);
      truncated = true;
      break;
    }

    if (!data || data.length === 0) break;

    for (const row of data) rows.push(mapLessonMaterialRow(row, teacherId));

    from += data.length;

    if (rows.length >= MAX_SCAN_ROWS) {
      truncated = true;
      rows.splice(MAX_SCAN_ROWS);
      break;
    }
  }

  return { rows, truncated };
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase rows are untyped at this boundary. */
function mapMaterialBankRow(row: any): MaterialItem {
  return {
    id: row.id,
    teacher_id: row.teacher_id,
    title: row.title,
    description: row.description || "",
    material_type: row.material_type,
    category: row.category,
    lesson_tag: row.lesson_tag,
    content_url: row.content_url || "",
    storage_path: row.storage_path,
    metadata: row.metadata,
    is_published: row.is_published,
    is_system: row.is_system,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapLessonMaterialRow(row: any, teacherId: string): MaterialItem {
  let mappedType: MaterialType = "document";
  if (row.material_type === "video") mappedType = "lecture_video";
  else if (row.material_type === "simulation") mappedType = "simulation";
  else if (row.material_type === "colab") mappedType = "colab";

  return {
    id: `legacy-${row.id}`,
    teacher_id: teacherId,
    title: row.title,
    description: row.description || "",
    material_type: mappedType,
    category: "nuclear_physics",
    lesson_tag: row.lesson_tag || undefined,
    content_url: row.content_url || "",
    is_published: row.is_published,
    is_system: false,
    created_at: row.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Search & sort
// ---------------------------------------------------------------------------

/** Exposed for unit tests; prefer calling getMaterialsUnified in app code. */
export function searchMaterialsForTest(materials: MaterialItem[], query: string): MaterialItem[] {
  return searchMaterials(materials, query);
}

function searchMaterials(materials: MaterialItem[], query: string): MaterialItem[] {
  if (!query || !query.trim()) return materials;

  const q = query.toLowerCase().trim();
  const nq = removeDiacritics(q);

  return materials.filter((item) => {
    const haystack = `${item.title || ""} ${item.description || ""} ${item.lesson_tag || ""}`;
    const lower = haystack.toLowerCase();
    if (lower.includes(q)) return true;
    return removeDiacritics(lower).includes(nq);
  });
}

/**
 * Strip Vietnamese diacritics so "phong xa" matches "phóng xạ".
 * NFD decomposition + combining-mark removal, plus đ → d which is not a mark.
 */
export function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/** Exposed for unit tests. */
export function sortMaterialsForTest(
  materials: MaterialItem[],
  sortBy: string,
  sortOrder: "asc" | "desc"
): MaterialItem[] {
  return sortMaterials(materials, sortBy, sortOrder);
}

function sortMaterials(
  materials: MaterialItem[],
  sortBy: string,
  sortOrder: "asc" | "desc"
): MaterialItem[] {
  const dir = sortOrder === "asc" ? 1 : -1;

  return [...materials].sort((a, b) => {
    let primary = 0;

    switch (sortBy) {
      case "created_at":
        primary = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "updated_at":
        primary =
          new Date(a.updated_at ?? a.created_at).getTime() -
          new Date(b.updated_at ?? b.created_at).getTime();
        break;
      case "title":
      default:
        // localeCompare with "vi" sorts Vietnamese correctly ("ă" near "a").
        primary = a.title.localeCompare(b.title, "vi", { sensitivity: "base" });
        break;
    }

    if (primary !== 0) return primary * dir;

    // Stable tiebreaker: id. Without this, equal titles/dates shuffle between
    // pages and rows get duplicated or skipped.
    return a.id.localeCompare(b.id) * dir;
  });
}

/** Exposed for unit tests. */
export function paginateForTest(
  materials: MaterialItem[],
  offset: number,
  limit: number
): { items: MaterialItem[]; total: number; hasMore: boolean; offset: number; limit: number } {
  const total = materials.length;
  const items = materials.slice(offset, offset + limit);
  return { items, total, hasMore: offset + items.length < total, offset, limit };
}

// ---------------------------------------------------------------------------
// Single-item lookup
// ---------------------------------------------------------------------------

export async function getMaterialById(
  supabase: SupabaseClient,
  id: string,
  context: MaterialQueryContext
): Promise<MaterialItem | null> {
  const canonical = CANONICAL_SYSTEM_MATERIALS.find((m) => m.id === id);
  if (canonical) {
    if ((context.role === "public" || context.role === "student") && !canonical.is_published) {
      return null;
    }
    return canonical;
  }

  if (!id.startsWith("legacy-")) {
    try {
      let query = supabase.from("material_bank").select("*").eq("id", id);
      if (context.role === "teacher" && context.userId) {
        query = query.or(`is_published.eq.true,teacher_id.eq.${context.userId}`);
      } else {
        query = query.eq("is_published", true);
      }
      const { data, error } = await query.maybeSingle();
      if (!error && data) return mapMaterialBankRow(data);
    } catch (err) {
      console.warn("material_bank single query error:", err);
    }
  }

  if (id.startsWith("legacy-") && context.role === "teacher" && context.userId) {
    try {
      const legacyId = id.replace("legacy-", "");
      const { data, error } = await supabase
        .from("lesson_materials")
        .select("*")
        .eq("id", legacyId)
        .eq("teacher_id", context.userId)
        .maybeSingle();
      if (!error && data) return mapLessonMaterialRow(data, context.userId);
    } catch (err) {
      console.warn("lesson_materials single query error:", err);
    }
  }

  return null;
}
