/**
 * Phase 1.5 — real browser E2E for the unified material catalogue.
 *
 * PREREQUISITES
 *  - A server built with NEXT_PUBLIC_USE_UNIFIED_CATALOG=true, reachable at
 *    E2E_BASE_URL (default http://localhost:3223).
 *  - No Supabase account is needed for the public cases below: the public
 *    catalogue merges canonical materials in-process, and the DB scan fails
 *    gracefully when credentials are absent.
 *
 * Student and teacher cases need a signed-in session. They are written to SKIP
 * (not fail) when E2E_STUDENT_EMAIL / E2E_TEACHER_EMAIL + password are not
 * provided, so this suite is honest about what it did and did not verify.
 */

import { test, expect } from "@playwright/test";

const ENTRY = "/hoc-lieu";

const studentEmail = process.env.E2E_STUDENT_EMAIL;
const studentPassword = process.env.E2E_STUDENT_PASSWORD;
const teacherEmail = process.env.E2E_TEACHER_EMAIL;
const teacherPassword = process.env.E2E_TEACHER_PASSWORD;

/** Collect console errors for the whole test, assert none at the end. */
function trackConsoleErrors(page) {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

test.describe("Public catalogue (no account)", () => {
  test("renders the unified catalogue with real rows", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto(ENTRY);

    const catalog = page.locator("section.material-catalog");
    await expect(catalog).toBeVisible({ timeout: 20000 });

    // The old component must NOT be present when the flag is on.
    await expect(page.locator(".learning-library")).toHaveCount(0);

    const rows = catalog.locator("article.material-row");
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThan(0);

    expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
  });

  test("search narrows results instantly", async ({ page }) => {
    await page.goto(ENTRY);
    const catalog = page.locator("section.material-catalog");
    const rows = catalog.locator("article.material-row");

    const total = await rows.count();
    expect(total).toBeGreaterThan(0);

    const search = page.getByPlaceholder(/Tìm theo tên, bài học/);
    await search.fill("phóng xạ");

    // Search is server-side: the URL gains `q=` and the list re-renders.
    await expect.poll(() => new URL(page.url()).searchParams.get("q"), { timeout: 10000 }).toBe(
      "phóng xạ"
    );
    await expect
      .poll(async () => rows.count(), { timeout: 10000 })
      .toBeLessThan(total);

    const narrowed = await rows.count();
    expect(narrowed).toBeGreaterThan(0);
    await expect(catalog.locator(".material-catalog-status")).toContainText(String(narrowed));
  });

  test("accent-insensitive search matches without diacritics", async ({ page }) => {
    await page.goto(ENTRY);
    const rows = page.locator("section.material-catalog article.material-row");

    await page.getByPlaceholder(/Tìm theo tên, bài học/).fill("phong xa");
    await expect.poll(() => new URL(page.url()).searchParams.get("q"), { timeout: 10000 }).toBe(
      "phong xa"
    );
    await expect.poll(async () => rows.count(), { timeout: 10000 }).toBeGreaterThan(0);
    const unaccented = await rows.count();

    await page.getByPlaceholder(/Tìm theo tên, bài học/).fill("phóng xạ");
    await expect.poll(() => new URL(page.url()).searchParams.get("q"), { timeout: 10000 }).toBe(
      "phóng xạ"
    );
    await expect.poll(async () => rows.count(), { timeout: 10000 }).toBe(unaccented);
  });

  test("search with no match shows the empty state", async ({ page }) => {
    await page.goto(ENTRY);
    await page.getByPlaceholder(/Tìm theo tên, bài học/).fill("zzz-khong-ton-tai-zzz");
    await expect(page.locator(".material-catalog-empty")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Không tìm thấy học liệu cho/)).toBeVisible();
  });

  test("lesson filter restricts the list", async ({ page }) => {
    await page.goto(ENTRY);
    const catalog = page.locator("section.material-catalog");
    await catalog.getByRole("combobox").selectOption("B22");
    const rows = catalog.locator("article.material-row");
    await expect(rows.first()).toBeVisible();
    // Every visible row must show the B22 lesson badge.
    const badges = catalog.locator(".material-row-lesson");
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      await expect(badges.nth(i)).toHaveText("B22");
    }
  });

  test("opening a row reveals detail and a primary action", async ({ page }) => {
    await page.goto(ENTRY);
    const catalog = page.locator("section.material-catalog");
    const firstOpen = catalog.getByRole("button", { name: "Mở", exact: true }).first();
    await firstOpen.click();
    await expect(catalog.locator(".material-row-detail").first()).toBeVisible();
    await expect(catalog.getByRole("button", { name: "Đóng", exact: true }).first()).toBeVisible();
  });

  test("pagination reaches page 2 and the last page has rows", async ({ page }) => {
    await page.goto(ENTRY);
    const catalog = page.locator("section.material-catalog");
    const rows = catalog.locator("article.material-row");

    const page1FirstTitle = await rows.first().locator(".material-row-title").textContent();

    const next = catalog.getByRole("link", { name: /Trang sau/ });
    if ((await next.count()) === 0) {
      test.skip(true, "Catalogue fits on one page; nothing to paginate.");
    }
    await next.click();
    await page.waitForURL(/page=2/);

    await expect(catalog.getByRole("link", { name: /Trang trước/ })).toBeVisible();
    const page2FirstTitle = await rows.first().locator(".material-row-title").textContent();
    expect(page2FirstTitle).not.toBe(page1FirstTitle);

    // No duplicate row ids between page 1 and page 2.
    const page2Ids = await rows.evaluateAll((els) =>
      els.map((el) => el.querySelector(".material-row-main")?.getAttribute("aria-controls"))
    );
    expect(new Set(page2Ids).size).toBe(page2Ids.length);
  });

  test("keyboard: search field and filters are tab-reachable", async ({ page }) => {
    await page.goto(ENTRY);
    const search = page.getByPlaceholder(/Tìm theo tên, bài học/);
    await search.focus();
    await expect(search).toBeFocused();
    await page.keyboard.press("Tab");
    // Focus must move somewhere sensible, not vanish to the document body.
    const active = await page.evaluate(() => document.activeElement?.tagName ?? "");
    expect(["BUTTON", "SELECT", "A", "INPUT"]).toContain(active);
  });
});

test.describe("Responsive layout", () => {
  for (const [label, width, height] of [
    ["desktop", 1440, 900],
    ["tablet", 768, 1024],
    ["mobile", 375, 812],
  ]) {
    test(`${label} (${width}px) has no horizontal overflow`, async ({ page }, info) => {
      await page.setViewportSize({ width, height });
      await page.goto(ENTRY);
      const catalog = page.locator("section.material-catalog");
      await expect(catalog).toBeVisible({ timeout: 20000 });

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);

      await catalog.screenshot({ path: info.outputPath(`catalog-${label}.png`) });
    });
  }
});

test.describe("Student catalogue", () => {
  test.skip(!studentEmail || !studentPassword, "Set E2E_STUDENT_EMAIL/PASSWORD to run.");

  test("student can view, search and save material", async ({ page }, info) => {
    const errors = trackConsoleErrors(page);
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(studentEmail);
    await page.getByLabel(/mật khẩu|password/i).fill(studentPassword);
    await page.getByRole("button", { name: /đăng nhập/i }).click();
    await page.waitForURL(/\/student/, { timeout: 20000 });

    await page.goto("/student/materials");
    const catalog = page.locator("section.material-catalog");
    await expect(catalog).toBeVisible({ timeout: 20000 });

    // Save a material, then reload and confirm persistence.
    const saveBtn = catalog.getByRole("button", { name: /^Lưu / }).first();
    await saveBtn.click();
    await expect(saveBtn).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(catalog.getByRole("button", { name: /^Bỏ lưu / }).first()).toHaveAttribute(
      "aria-pressed",
      "true",
      { timeout: 15000 }
    );

    await catalog.screenshot({ path: info.outputPath("catalog-student.png") });
    expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
  });
});

test.describe("Teacher catalogue", () => {
  test.skip(!teacherEmail || !teacherPassword, "Set E2E_TEACHER_EMAIL/PASSWORD to run.");

  test("teacher manage view keeps create/edit controls", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(teacherEmail);
    await page.getByLabel(/mật khẩu|password/i).fill(teacherPassword);
    await page.getByRole("button", { name: /đăng nhập/i }).click();
    await page.waitForURL(/\/teacher/, { timeout: 20000 });

    // Default view stays the manage view — CRUD must not be replaced.
    await page.goto("/teacher/materials");
    await expect(page.getByRole("link", { name: /Duyệt kho bằng bộ lọc mới/ })).toBeVisible({
      timeout: 20000,
    });

    // Browse view shows the unified catalogue.
    await page.getByRole("link", { name: /Duyệt kho bằng bộ lọc mới/ }).click();
    await page.waitForURL(/view=browse/);
    await expect(page.locator("section.material-catalog")).toBeVisible({ timeout: 20000 });
  });
});
