/**
 * Feature flag: unified material catalogue.
 *
 * `NEXT_PUBLIC_USE_UNIFIED_CATALOG=true` mounts `MaterialCatalog` (server-side
 * unified query, real pagination). Anything else keeps the original
 * `LearningLibrary` / `MaterialBankViewer` UI.
 *
 * ## Build-time, not runtime
 *
 * `NEXT_PUBLIC_*` variables are inlined by Next.js **at build time**. Changing
 * the value in `.env.local` on a running server does NOT take effect — the site
 * must be rebuilt (`npm run build`) and restarted. Plan rollback accordingly:
 * flip the value, rebuild, redeploy.
 *
 * Default is OFF so a deploy of this commit changes nothing visible.
 */

export function isUnifiedCatalogEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_UNIFIED_CATALOG === "true";
}
