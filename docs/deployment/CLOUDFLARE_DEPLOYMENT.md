# Cloudflare Deployment Guide

**Last updated:** 2026-09-15 (S7A-RELEASE-CLOSEOUT-011 — next deploy not yet authorized)  
**Production domain:** https://immifin.com  
**Worker name:** `immifin`  
**Serving version:** `e0855e5f-66ec-4c12-828d-87caeeb4bd44` (100%)  
**Git / `origin/main`:** `3038ddf4c19a8548a621942c865faab0afb7b3dd`

This document is the authoritative guide for IMMIFIN production deployment on Cloudflare Workers via OpenNext.

**Related:** [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md) · [SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md) · [DEPLOYMENT.md](../DEPLOYMENT.md) · [SPRINT_5_SIGNOFF.md](../SPRINT_5_SIGNOFF.md)

---

## Workers plan note (Error 1102)

IMMIFIN runs on **Workers Paid** (upgraded 2026-07-09). `wrangler.jsonc` sets `limits.cpu_ms: 60000` so OpenNext cold starts (~25–41 ms) are no longer blocked by the Free ~10 ms CPU hard cap that caused intermittent **Error 1102**.

| Action | Effect |
|--------|--------|
| **Workers Paid + `cpu_ms: 60000`** | Primary fix for cold-start 1102 |
| Code optimizations (Sprint 5 / audit remediations) | Slim Visa Stamping API; lazy history; no public `?refresh=true` |
| Manual deploy | `npx @opennextjs/cloudflare build` then `npx wrangler deploy` when Git auto-deploy lags |

Do **not** remove `limits.cpu_ms` or downgrade to Free without expecting 1102 to return.

---

## Deployment flow

```
Cursor (local development)
        ↓
Commit
        ↓
GitHub main
        ↓
Cloudflare Git Build (automatic on push to main)
        ↓
OpenNext Build (opennextjs-cloudflare build)
        ↓
Wrangler Deploy (opennextjs-cloudflare deploy)
        ↓
Production (https://immifin.com)
```

---

## Current build configuration

| Setting | Value |
|---------|-------|
| **Build command** | `npx @opennextjs/cloudflare build` |
| **Deploy command** | `npx wrangler deploy` |
| **Node version** | 22.x |
| **Branch** | `main` (production) |
| **Git integration** | GitHub → Cloudflare automatic deployment |

Wrangler **4.105.0** detects the OpenNext project and uses the `opennextjs-cloudflare` deployment path. That path populates/setup the persistent cache **before** the final Worker deploy. Do **not** document or restore the stale dashboard pair `npm run deploy` + `echo done` as the live Production pipeline.

Local `package.json` still has `npm run deploy` (`opennextjs-cloudflare build && opennextjs-cloudflare deploy`) for **manual** workstation deploys. Cloudflare Builds does **not** use that pair.

### Package.json scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run build` | `next build` | Next.js only — **not sufficient** for Cloudflare Workers |
| `npm run preview` | `opennextjs-cloudflare build && opennextjs-cloudflare preview` | Local Workers preview |
| `npm run deploy` | `opennextjs-cloudflare build && opennextjs-cloudflare deploy` | Local/manual OpenNext build + deploy (not the Cloudflare Builds pair) |

### Version / deployment inspection

```bash
# List recent Worker deployments
npx wrangler deployments list --name immifin

# Put a runtime secret (server-only)
npx wrangler versions secret put VARIABLE_NAME
```

---

## Repository configuration files

| File | Purpose |
|------|---------|
| `open-next.config.ts` | OpenNext Cloudflare adapter configuration (R2 incremental cache, D1 tag cache, Durable Object queue, cache interception) |
| `wrangler.jsonc` | Worker name, compatibility flags, asset bindings, public `vars`, custom `main`, R2/D1/DO, migration v1, Chicago crons |
| `cloudflare/custom-worker.ts` | Custom Worker: `scheduled()` daily sheet sync; `fetch` delegated to OpenNext |
| `package.json` | `deploy` and `preview` scripts |

Generated output (gitignored): `.open-next/`, `.wrangler/`

---

## OpenNext persistent cache (S7A-PERF-003 CLOSED)

**Status: PRODUCTION LIVE AND VALIDATED** (PERF-003D release, PERF-003E proof).

The original OpenNext dummy incremental-cache problem is **closed**. Public HTML and RSC persistent HIT, R2 persistence, and D1 tag invalidation are proven on Worker `e0855e5f`.

| Component | Binding | Physical resource | Purpose |
|-----------|---------|-------------------|---------|
| R2 incremental cache | `NEXT_INC_CACHE_R2_BUCKET` | `immifin-prod-opennext-inc-cache` | Persist SSG/ISR HTML, RSC, fetch/`unstable_cache` |
| D1 tag cache | `NEXT_TAG_CACHE_D1` | `immifin-prod-opennext-tag-cache` (`c1c789db-3370-4f40-9611-172ed7b67fde`) | `revalidateTag` / admin Data Refresh across isolates |
| Durable Object queue | `NEXT_CACHE_DO_QUEUE` → class `DOQueueHandler` | Worker migration **v1** (`new_sqlite_classes: DOQueueHandler`) | Time-based revalidation (not used on ordinary SSG HIT) |
| Cache interception | `enableCacheInterception: true` in `open-next.config.ts` | N/A | Skip Next.js App Router render on prerender HIT **after** middleware |
| Worker self-reference | `WORKER_SELF_REFERENCE` | service `immifin` | OpenNext self-invocation |

**Validated Production inventory (PERF-003E / PERF-004):**

| Resource | Validated state |
|----------|-----------------|
| R2 `immifin-prod-opennext-inc-cache` | Present — **31 objects**, **~1.44 MB**, location WNAM |
| D1 `immifin-prod-opennext-tag-cache` | Tables `_cf_KV`, `revalidations` |
| D1 after one Admin Visa Bulletin refresh | `revalidations` **0 → 2 rows** (`visa-bulletin-sheets`, `visa-bulletin-history`) |

**Request path (HIT):** Cloudflare edge → Worker → OpenNext routing → **Clerk middleware** → route match → cache interceptor → R2 get → D1 tag lookup → cached HTML/RSC. A HIT avoids Next.js App Router render, server layout/page render, page data loaders, and normal DO queue activity. It does **not** skip Clerk or OpenNext routing.

**Hard rules (unchanged):**

- Do **not** enable Cloudflare Workers Cache / CDN cache for HTML in front of Clerk.
- Do **not** bypass middleware for public pages.
- Never shared-cache authenticated/private HTML, APIs, Stripe, or webhooks.
- Clerk middleware must continue to run **before** OpenNext cache interception.
- Do **not** cache-key on user/session.
- Production deploys must use a **clean** Git worktree — never the dirty Sprint 8 WIP tree.

Adapter authority: `@opennextjs/cloudflare` **1.20.1**.

### Custom Worker and daily sheet sync (Sprint 7A — packaged, not yet deployed)

The next Production deploy from `release/s7a-go-live` changes Worker `main` from the generated OpenNext worker to `cloudflare/custom-worker.ts`.

| Item | Value |
|------|-------|
| **fetch** | Delegated to `.open-next/worker.js` (OpenNext unchanged) |
| **Durable Object export** | Custom entrypoint **re-exports** `DOQueueHandler` from `.open-next/worker.js`. Wrangler requires the class on `main`. |
| **scheduled** | Invokes `POST /api/internal/daily-sheet-sync` only at 12:01 AM America/Chicago |
| **Crons** | `1 5 * * *` (05:01 UTC / CDT) and `1 6 * * *` (06:01 UTC / CST) |
| **Auth** | Runtime secret `DAILY_SHEET_SYNC_SECRET` as `Authorization: Bearer …` |
| **Current Production** | Still Worker `e0855e5f` without these crons until this release is deployed |

Set `DAILY_SHEET_SYNC_SECRET` on the Production Worker **before** expecting the first scheduled run. Do not commit or print the value.

### Durable Object migration v1 — forward deploy only

Production migration **v1** is applied (`DOQueueHandler`). A future rollback **must not** assume a pre-v1 Worker version can simply be promoted.

**Approved recovery:** **forward deploy** a good Worker that still declares migration `v1`, `DOQueueHandler`, and the R2/D1/DO bindings. **Do not delete or remove migration `v1`** from `wrangler.jsonc`.

### Admin Visa Bulletin refresh and 24-hour revalidation

`POST /api/admin/refresh-visa-bulletin` calls `revalidateTag()` for `visa-bulletin-sheets` and `visa-bulletin-history`. One controlled Production Admin refresh wrote those two D1 rows. Persistent R2 does **not** freeze Visa Bulletin permanently — data remains designed for **86400 seconds / 24-hour** revalidation.

### Auth and shared-cache safety (PERF-003E)

Signed-out protected routes still redirect to `/login` (Clerk `auth.protect()`), including `/dashboard`, `/admin`, `/account`, `/immigration/visa-bulletin`, `/user-profile`, `/account/billing`, `/intelligence`. No authenticated/private page body was served from shared public cache. Private-cache inspection found no emails, Clerk user IDs, Stripe customer/subscription IDs, or secrets. Generic prerender application shells in R2 are **not** user-specific data.

### Public HIT latency (S7A-PERF-004 CLOSED)

**Verdict: current Production latency is acceptable. PERF-005 is not authorized.**

| Layer | Typical | Notes |
|-------|---------|-------|
| Wall-clock HTML HIT TTFB | **220–360 ms** | Diagnostic client (DFW) |
| RSC HIT TTFB | **200–450 ms** typical | Same R2 object as HTML |
| Worker time on HIT | **~100–130 ms** | OpenNext + R2 get + D1 tag lookup + JSON/headers |
| Clerk signed-out middleware | **~1–5 ms** Worker | Local signed-out; **not** the remaining TTFB cause |
| Client TLS / edge | **~70–180 ms** | Network; static Assets have no Worker span |
| First-request / isolate spikes | **600–1000 ms+** | Isolate/network; not the warm HIT floor |

**Clerk verdict:** do **not** remove Clerk middleware and do **not** move cache ahead of Clerk for protected-route handling.

**Not approved now:** `withRegionalCache`, global Workers Cache for HTML, CDN in front of Clerk, middleware bypass. `withRegionalCache` may reduce some R2/D1 Worker time later but adds invalidation-correctness risk. Treat it as an **optional future design**, not committed work.

### Preview infrastructure cleanup (PERF-003F)

Temporary PERF-003C preview resources were **deleted**. Production was untouched.

| Resource | Name | Status |
|----------|------|--------|
| Preview Worker | `immifin-s7a-perf-003c-preview` | Deleted |
| Preview R2 | `immifin-preview-opennext-inc-cache` | Emptied and deleted |
| Preview D1 | `immifin-preview-opennext-tag-cache` | Deleted |
| Isolated config | `wrangler.preview-003c.jsonc` | Removed from the preview worktree |

### Wrangler tooling notes

- Diagnostic/runtime Wrangler: **4.105.0**
- `wrangler r2 object list` is **unsupported** on this version. Use Cloudflare API or `wrangler r2 object get` / bucket `info` for inspection.
- Cloudflare observability/history did not expose isolate-start time; first-request spikes were inferred, not instrumented.

---

## Branch strategy

| Branch | Environment | Deploy trigger |
|--------|-------------|----------------|
| `main` | Production | Automatic on push |
| Feature branches | Local / tunnel only | No automatic production deploy |

Preview deployments are planned but not yet the primary workflow.

---

## Environment variables

### Build Variables vs Runtime Variables

This distinction is **critical** for IMMIFIN.

| Type | When evaluated | Cloudflare location | Use for |
|------|----------------|---------------------|---------|
| **Build Variables** | During `opennextjs-cloudflare build` / `next build` | Dashboard → Builds → Build variables | `NEXT_PUBLIC_*` variables |
| **Runtime Variables / Secrets** | On each Worker request | Dashboard → Variables and Secrets (Production) | Server-only secrets, API keys |

**Rule:** All `NEXT_PUBLIC_*` variables must exist as **Build Variables** if they affect client bundles or prerendered HTML. Runtime-only variables cannot change prerendered UI after deploy.

Example: `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE=true` must be a **Build Variable** — see [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md).

**Proven Cloudflare Builds environment (names only — never document values):** the Production Builds environment includes `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` as a **Build secret** and `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE` as a Build variable.

### Required (Production)

Set in Cloudflare Dashboard or Wrangler Version Secrets. Never commit values to Git.

| Variable | Purpose | Build or Runtime |
|----------|---------|------------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client key | **Build** |
| `CLERK_SECRET_KEY` | Clerk server key | Runtime (secret) |
| `CLERK_WEBHOOK_SECRET` | Webhook verification | Runtime (secret) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | **Build** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role | Runtime (secret) |
| `GOOGLE_SHEET_ID` | Google Spreadsheet ID | Runtime |
| `GOOGLE_CLIENT_EMAIL` | Service account email | Runtime (secret) |
| `GOOGLE_PRIVATE_KEY` | Service account key | Runtime (secret) |

### Optional

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Clerk sign-in path | `/login` (also in `wrangler.jsonc`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Clerk sign-up path | `/signup` (also in `wrangler.jsonc`) |
| `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE` | Development Subscription Mode | `false` (unset) — **Build Variable when enabled** |
| `VISA_BULLETIN_*` | Bulletin CSV overrides | Committed defaults in `lib/visaBulletinConfig.ts` |
| `DAILY_SHEET_SYNC_SECRET` | Bearer secret for scheduled `POST /api/internal/daily-sheet-sync` | Runtime (secret). Name only — never document the value. Required before cron is useful. |
| `IMMIFIN_WRITE_FREEZE` | Temporary operational write freeze for approved cutover/maintenance. Default **off** (absent/false). Set `true` or `1` only when approved. Runtime — not a Build variable. Do not enable in this capability-deploy. | Runtime |

### Local development

| File | Purpose |
|------|---------|
| `.env.local` | Next.js dev server (`npm run dev`) |
| `.dev.vars` | Wrangler / OpenNext preview |

See [.env.example](../../.env.example) for the full template.

---

## Production deployment process

1. Develop and test on `http://localhost:3000`
2. Verify tunnel (`https://dev.immifin.com`) when auth/webhooks changed
3. Run `npm run build` locally (type-check gate)
4. Commit with descriptive message
5. Push to `main`
6. Cloudflare automatically runs `npx @opennextjs/cloudflare build` then `npx wrangler deploy`
7. Verify deployment in Cloudflare Dashboard → Deployments
8. Smoke test `https://immifin.com` (public HTML should show `x-opennext-cache: HIT` when warm)

---

## How to rebuild production

After changing **Build Variables** (especially `NEXT_PUBLIC_*`):

1. Confirm the variable is set under **Build variables** (not only runtime)
2. Trigger a new build:
   - Push a commit to `main`, or
   - Use Cloudflare Dashboard → Retry deployment, or
   - Empty commit: `git commit --allow-empty -m "chore: rebuild production"`

Runtime variable changes alone do **not** rebuild client bundles or prerendered pages.

---

## How to verify deployment

| Check | How |
|-------|-----|
| Deploy completed | Cloudflare Dashboard → Workers → immifin → Deployments |
| Site loads | `https://immifin.com` returns 200 |
| Auth works | Sign in / sign up |
| Build ID / chunk changed | Inspect `/_next/static/chunks/` hashes after deploy |
| Feature flags | Verify UI matches expected env (e.g. `/pricing` dev mode banner) |
| API routes | Test protected endpoints (e.g. `/api/account/subscription` when signed in) |

Response headers on interceptor HIT pages include `x-opennext-cache: HIT`. Some routes (notably `/`) may show `x-opennext: 1` without the HIT header while still serving quickly from the Next incremental-cache path.

---

## How to rollback

1. Cloudflare Dashboard → Workers & Pages → immifin → Deployments
2. Select a known-good **post-v1** deployment (must still include `DOQueueHandler` / migration **v1**)
3. Prefer **forward deploy** of that good version rather than promoting a pre-v1 Worker

Prefer dashboard rollback over force-push to `main`. **Do not** promote a Worker version from before Durable Object migration v1.

---

## Common deployment problems

### `NEXT_PUBLIC_*` variable not taking effect

**Symptom:** Localhost shows new UI; production shows old UI (e.g. Coming Soon on `/pricing`).

**Cause:** Variable set as runtime-only, or build ran before variable was added.

**Fix:** Add as **Build Variable**; trigger full rebuild. See [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md).

### OpenNext build failures

- Verify Node 22.x in Cloudflare build settings
- Reproduce locally with `npx @opennextjs/cloudflare build` (or `npm run deploy` on a workstation)
- Check for TypeScript errors: `npx tsc --noEmit`
- Clear `.open-next/` locally if preview is stale

### Wrangler deployment failures

- Verify `wrangler.jsonc` worker name matches dashboard
- Confirm secrets are set via `npx wrangler versions secret put`
- Check Cloudflare build logs for auth or quota errors

### Worker runtime secrets missing

**Symptom:** API routes return 500; Clerk or Supabase calls fail in production only.

**Fix:** Set secrets in Cloudflare Dashboard → Variables and Secrets → Production, or via Wrangler.

### Prerendered HTML stale after deploy

**Symptom:** Client JS updated but initial HTML shows old content.

**Cause:** `NEXT_PUBLIC_*` was false/missing at build time; HTML baked with old branch.

**Fix:** Rebuild with correct Build Variables.

---

## Related documentation

| Document | Contents |
|----------|----------|
| [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md) | Production pricing / build variable incident |
| [SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md) | Full infrastructure reference |
| [ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md) | Deployment best practices |
| [ADR-007](../architecture/ADR-007-Development-Subscription-Mode.md) | Development Subscription Mode decision |
