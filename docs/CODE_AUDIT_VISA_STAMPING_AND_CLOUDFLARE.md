# Code Audit — Visa Stamping Wait Map & Cloudflare Error 1102

| Field | Value |
|-------|-------|
| **Project** | IMMIFIN |
| **Audit date** | 2026-07-09 |
| **Scope** | Visa Stamping Wait Map, related APIs, Google Sheets loaders, admin refresh, Cloudflare Worker config |
| **Mode** | Audit + remediation (2026-07-09) |
| **Production commit at audit** | `570ed0e` (Sprint 6 kickoff docs on `main`) |
| **Author** | Technical Architecture (CTO) / Cursor audit |

**Related:** [deployment/CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md) · [design-system/VISA_STAMPING_WAIT_MAP_2.0.md](./design-system/VISA_STAMPING_WAIT_MAP_2.0.md) · [SPRINT_5_SIGNOFF.md](./SPRINT_5_SIGNOFF.md) · [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md)

---

## 1. Executive summary

Sprint 5 already shipped important mitigations (slim default API, lazy History Trend, Leaflet/Recharts `dynamic` + `ssr: false`, 24h `unstable_cache`). Those are real and correctly implemented.

**Cloudflare Error 1102 is still primarily an infrastructure ceiling:** Workers **Free** plan allows ~**10 ms CPU** per request, while OpenNext cold starts commonly need **~25–41 ms**. Code can reduce spikes but cannot raise the Free hard cap.

The largest **remaining code risk** is a **public unauthenticated `?refresh=true`** on `/api/visa-stamping-wait-times`, which can force cold sheet reloads and invalidate cache for everyone.

---

## 2. Already mitigated (do not re-fix)

| Mitigation | Evidence |
|------------|----------|
| Default API omits `historyPoints` | `app/api/visa-stamping-wait-times/route.ts` L56–57; bulk build uses `includeHistoryPoints: false` in `lib/visa/visaStampingSheetService.ts` L444–450 |
| History series only on History Trend tab | `components/VisaStampingWaitMap.tsx` L583–595; API gate L59–72 |
| Leaflet client-only | Dynamic import L33–40; `leaflet` / `react-leaflet` only in `components/visa/VisaStampingLeafletMap.tsx` L4–6 |
| Recharts client-only for stamping | Dynamic import L42–53; chart file `VisaStampingHistoryTrendChart.tsx` |
| 24h server cache | `unstable_cache` in `visaStampingSheetService.ts` L581–585; route `revalidate = 86_400` L18 |
| 24h client SWR dedupe | `lib/swr.ts` `visaStampingSwrOptions` |
| Page does not SSR sheet data | `app/immigration/visa-stamping-wait-map/page.tsx` renders client component only |
| Stamping uses published CSV, not Sheets API | `lib/visaStampingSheets.ts`; `lib/googleSheetsClient.ts` is bulletin archive only |
| Admin force refresh is auth-gated | `POST /api/admin/refresh-visa-stamping` + `requireAdmin()` |
| Middleware is Clerk-only (no Supabase) | `middleware.ts` L6–10 |

---

## 3. Critical issues

### C1 — Public unauthenticated cache bypass (`?refresh=true`)

| Field | Detail |
|-------|--------|
| **Severity** | **Critical** |
| **Files** | `app/api/visa-stamping-wait-times/route.ts` L36, L49; `lib/auth/publicRoutes.ts` L13; `lib/visa/visaStampingSheetService.ts` L590–592 |
| **Evidence** | `/api/visa-stamping-wait-times` is a **public** route. `refresh=true` sets `forceRefresh`, which calls `revalidateTag(...)` and reloads **three** CSVs with `cache: "no-store"`, then rebuilds all city × visa-type records. |
| **Risk** | Abuse/DoS → repeated cold CPU → **Error 1102**; cache invalidation for all users; Google published-CSV hammering. UI does not currently pass `refresh`, but the endpoint is open. |
| **Recommended fix** | Remove `refresh` from the public GET handler. Keep force refresh only on admin `POST /api/admin/refresh-visa-stamping`. |
| **Required before production?** | **Yes** (security + stability) |
| **Status** | **Fixed** — public `?refresh=true` removed from GET handler; client no longer builds refresh URLs; admin POST unchanged |

---

## 4. High priority issues

### H1 — Workers Free plan CPU ceiling (primary Error 1102 cause)

| Field | Detail |
|-------|--------|
| **Severity** | **High** |
| **Files** | `wrangler.jsonc` (no `limits.cpu_ms`); `docs/deployment/CLOUDFLARE_DEPLOYMENT.md` § Workers plan note; deploy logs show Worker Startup Time ~25–41 ms |
| **Evidence** | Free plan hard-caps ~10 ms CPU. OpenNext + `nodejs_compat` cold start exceeds that. Attempting `limits.cpu_ms` on Free was rejected by Cloudflare API (code 100328). |
| **Risk** | Intermittent **Error 1102** on cold boot / first request after idle — independent of Visa Stamping correctness. |
| **Recommended fix** | Upgrade to **Workers Paid**, then set `limits.cpu_ms` (e.g. 60000) in `wrangler.jsonc` and redeploy. |
| **Required before production?** | **Yes** (ops) for reliable production |

### H2 — Cold-cache sheet build expands all cities × 13 visa types

| Field | Detail |
|-------|--------|
| **Severity** | **High** |
| **Files** | `lib/visa/visaStampingSheetService.ts` L425–469 (loop), L28–42 (`VISA_TYPE_SHEET_COLUMN`), L537–543 (3-sheet fetch) |
| **Evidence** | On cache miss: fetch current + history + metadata CSVs; for each active city row, loop all 13 visa types; run `buildHistoryAnalysis` (summary only, but still per cell). Result is a full multi-visa dataset cached for 24h. |
| **Risk** | Cache-miss CPU spike can contribute to 1102 on Free; memory grows with sheet size. |
| **Recommended fix** | Build/cache by requested `visaType` (and optionally country); or precompute JSON to KV/R2; keep summary-only analysis on cold path. |
| **Required before production?** | **Yes** if remaining on Free; **Recommended** even on Paid |

### H3 — History tab re-fetches and re-parses history CSV

| Field | Detail |
|-------|--------|
| **Severity** | **High** |
| **Files** | `app/api/visa-stamping-wait-times/route.ts` L67–72; `lib/visaStampingSheets.ts` L104–106, L73–97 |
| **Evidence** | Main `getVisaStampingSheetData()` already loaded history into the cached join. `includeHistory=true` calls `getHistoricalStampingWaitTimes()` again (separate fetch/parse + `console.log` samples). |
| **Risk** | Extra CPU/memory per History Trend open; worse if combined with `refresh=true`. |
| **Recommended fix** | Return/reuse history rows from cached sheet load, or wrap history CSV fetch in `unstable_cache`; build points from in-memory rows only. |
| **Required before production?** | **Yes** (stability) |
| **Status** | **Fixed** — `getVisaStampingHistoryRows()` via `unstable_cache`; History Trend uses cached rows; cold sheet load shares the same history cache |

---

## 5. Medium priority issues

### M1 — `includeHistory` returns full filtered post list, not one consulate

| Field | Detail |
|-------|--------|
| **Severity** | **Medium** |
| **Files** | `lib/visa/visaStampingSheetService.ts` `attachHistoryPointsForPost`; `route.ts` L68–78; `VisaStampingWaitMap.tsx` L583–595 |
| **Evidence** | History request still returns the filtered country/visa dataset; only the matching city gets `historyPoints`. Worldwide + history can serialize many posts. |
| **Risk** | Larger JSON → Worker serialize CPU + client parse cost. |
| **Recommended fix** | Dedicated slim response: single post or `{ historyPoints, summary }` only. |
| **Required before production?** | **No** (recommended) |
| **Status** | **Fixed** — `includeHistory=true` returns a single-post array for the requested city |

### M2 — Every request loads full cached multi-visa dataset then filters

| Field | Detail |
|-------|--------|
| **Severity** | **Medium** |
| **Files** | `route.ts` L49–54; `visaStampingSheetService.ts` L598–634 |
| **Evidence** | Cache stores all visa types/countries; API filters after load. |
| **Risk** | Warm path is acceptable today; grows with sheet size / Worldwide usage. |
| **Recommended fix** | Cache key by `visaType` (+ country). |
| **Required before production?** | **No** |

### M3 — Production `console.log` on sheet fetch hot path

| Field | Detail |
|-------|--------|
| **Severity** | **Medium** |
| **Files** | `lib/visaStampingSheets.ts` L94–95; `lib/visa/visaStampingSheetService.ts` L560; also bulletin `lib/visaBulletinSheets.ts` L63–76, L114 |
| **Evidence** | Logs row counts and sample row objects on every sheet load (including cold miss and history re-fetch). |
| **Risk** | Extra CPU/I/O on Workers; noisy logs. |
| **Recommended fix** | Gate behind `NODE_ENV === "development"` or remove sample dumps. |
| **Required before production?** | **No** (quick win) |
| **Status** | **Fixed** — stamping + bulletin sample `console.log` gated to development |

### M4 — Leaflet permanent tooltips for every visible marker

| Field | Detail |
|-------|--------|
| **Severity** | **Medium** |
| **Files** | `components/visa/VisaStampingLeafletMap.tsx` (Marker/Tooltip/Popup per post) |
| **Evidence** | Worldwide view can create many permanent tooltips + popups in the DOM. |
| **Risk** | Browser jank/memory — **not** Worker 1102, but UX risk. |
| **Recommended fix** | Marker clustering; hover-only tooltips; zoom-based capping. |
| **Required before production?** | **No** |

### M5 — Heavy client deps (mitigated by code-splitting)

| Field | Detail |
|-------|--------|
| **Severity** | **Medium** |
| **Files** | `package.json` L19–24 (`leaflet`, `react-leaflet`, `recharts`); dynamic imports in `VisaStampingWaitMap.tsx` L33–53 |
| **Evidence** | Deps are present but map/chart are dynamically imported with `ssr: false`. Map still loads on successful map view. |
| **Risk** | Large JS chunks / slower mobile first paint if splitting regresses. |
| **Recommended fix** | Keep dynamic imports; optional bundle analyzer; consider lighter chart later. |
| **Required before production?** | **No** |

### M6 — Admin force refresh is expensive (acceptable if rare)

| Field | Detail |
|-------|--------|
| **Severity** | **Medium** |
| **Files** | `app/api/admin/refresh-visa-stamping/route.ts` L10–13; `app/admin/page.tsx` Data Refresh button |
| **Evidence** | Admin POST correctly auth-gated; still runs full cold load. |
| **Risk** | Expected occasional CPU spike. Dangerous mainly if combined with public `refresh=true` (C1). |
| **Recommended fix** | Rate-limit; fix C1 first. |
| **Required before production?** | **No** (after C1) |

### M7 — Visa Bulletin sheet loaders lack `unstable_cache` parity

| Field | Detail |
|-------|--------|
| **Severity** | **Medium** |
| **Files** | `lib/visaBulletinSheets.ts`; admin `refresh-visa-bulletin/route.ts` L22–26 |
| **Evidence** | Stamping has `unstable_cache`; bulletin CSV loaders rely mainly on fetch `revalidate: 86400` and history `unstable_cache`. Admin refresh force-loads 4 sheets + history. |
| **Risk** | Bulletin cold paths can also contribute to 1102; less optimized than stamping. |
| **Recommended fix** | Align bulletin loaders with stamping cache tags; keep admin-only force sync. |
| **Required before production?** | **No** (Sprint 6 ops) |

---

## 6. Low priority cleanup

### L1 — Demo fallback is small and safe

- `lib/visa/visaStampingWaitTimes.ts` demo posts (~13 H-1B entries)
- Fallback path in `visaStampingSheetService.ts` is lightweight
- **Required before production?** No

### L2 — `parseWaitTimeToDays` is not a bottleneck

- `lib/visa/parseWaitTimeToDays.ts` — O(1) regex per cell
- **Required before production?** No

### L3 — Config files have no extra Worker tuning

- `next.config.ts` — default strict mode only
- `open-next.config.ts` — default `defineCloudflareConfig()`
- `wrangler.jsonc` — no `limits` (correct while on Free)
- **Required before production?** No (until Paid upgrade)

### L4 — Debug / test API routes exist

- `app/api/debug/*`, `app/api/google-test/route.ts` are **not** in `PUBLIC_ROUTE_PATTERNS` (Clerk sign-in required)
- `app/api/debug/clerk-env/route.ts` returns key prefixes/first-20 chars with **no** `requireAdmin()` — any signed-in user can hit it
- `app/api/google-test/route.ts` is an unauthenticated-beyond-Clerk connectivity probe
- Prefer admin-only or strip from production builds
- **Required before production?** Review recommended; not anonymously public today

### L5 — `runtime = "nodejs"` on many API routes

- Common across account/admin/bulletin/stamping routes
- Compatible with OpenNext + `nodejs_compat`; adds cold-start weight vs edge runtime
- **Required before production?** No (architectural choice)

---

## 7. Routes that can stress or crash production

| Route | Risk | Notes |
|-------|------|-------|
| `GET /api/visa-stamping-wait-times?refresh=true` | **Critical** | Public cold reload + cache bust |
| `GET /api/visa-stamping-wait-times` (cold miss) | High | 3 CSV fetches + city×visa expansion |
| `GET /api/visa-stamping-wait-times?includeHistory=true&city=` | High | Extra history CSV fetch today |
| `POST /api/admin/refresh-visa-stamping` | Medium | Auth-gated; expected expensive |
| `POST /api/admin/refresh-visa-bulletin` | Medium | Auth-gated; 4 sheets + history |
| Any page on Workers Free cold start | High | OpenNext startup alone can 1102 |

Leaflet is **not** imported server-side for the wait map page (verified). Accidental SSR of Leaflet is **not** a current finding.

---

## 8. Recommended fix order

| Priority | Action | Owner | Status |
|----------|--------|-------|--------|
| **P0** | Remove public `refresh=true` from stamping API | Engineering | **Done** |
| **P0** | Upgrade Cloudflare Workers to **Paid** + set `cpu_ms` | Ops / Founder | Open |
| **P1** | Stop redundant history CSV fetch on `includeHistory` | Engineering | **Done** |
| **P1** | Slim cold build / cache by `visaType` | Engineering | Open |
| **P2** | Slim history API response to one city | Engineering | **Done** |
| **P2** | Gate/remove production `console.log` sample dumps | Engineering | **Done** |
| **P3** | Marker clustering / bundle polish | Engineering | Open |
| **P3** | Bulletin cache parity | Sprint 6 | Open |

---

## 9. Production readiness verdict

| Question | Answer |
|----------|--------|
| Is Visa Stamping feature architecture sound? | **Yes** — CSV + cache + lazy history + client map |
| Can Error 1102 still happen today? | **Yes** — mainly Workers Free cold starts; worsened by public refresh / cold miss |
| Must-fix before calling production “stable”? | **Workers Paid (H1)** remaining; C1/H3/M1/M3 remediated in code (deploy pending) |
| Safe to keep map live meanwhile? | **Yes**, with awareness of intermittent Free-plan 1102 |

---

## 10. Audit checklist coverage

| Focus area | Covered? | Result |
|------------|----------|--------|
| 1. Worker CPU/memory | Yes | Free plan primary; cold sheet build secondary |
| 2. Expensive SSR | Yes | Wait map page avoids SSR data; API is the cost center |
| 3. Sheets fetch/parse | Yes | 3 CSVs; history re-fetch on includeHistory |
| 4. Large API payloads | Yes | Default slim; history response still oversized |
| 5. Leaflet server import | Yes | **Not present** — client dynamic only |
| 6. History for all posts | Yes | Points stripped by default; summary still built for all city×visa on cold load |
| 7. Missing cache | Partial | Stamping cached; history re-fetch gap; bulletin weaker |
| 8. Large client bundles | Yes | Mitigated by dynamic import |
| 9. Console/debug | Yes | Sample logs on sheet load |
| 10. Crash routes | Yes | Public refresh is top crash/DoS vector |

---

## Revision history

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-09 | Initial read-only audit after Sprint 5 closeout / Sprint 6 kickoff |
| v1.1 | 2026-07-09 | Remediated C1, H3, M1, M3 in code; H1 (Workers Paid) and H2 (visaType-scoped cold build) still open |
