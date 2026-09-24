# Immifin — Technical Decisions

Architecture and implementation conventions for the Immifin codebase. Update this document when making significant technical choices.

---

## Identity and data

### Clerk is the source of truth for identity

- Sign-up, login, sessions, and credentials live in Clerk.
- Immifin never stores passwords.
- Clerk user IDs (`clerk_user_id`) are the stable link between auth and application data.

### Supabase stores synchronized application profile data

- `profiles` holds app-owned fields: `role`, `plan`, `status`, names, avatar URL, activity timestamps.
- Webhooks and server-side helpers keep Supabase in sync with Clerk.
- Supabase is not a second auth system.

### Do not store passwords in Supabase

- Passwords and auth factors remain in Clerk only.
- Server code uses the Supabase service role for profile data, not end-user password handling.

---

## Profile lifecycle

### Use soft delete for deleted Clerk users

- `user.deleted` webhooks call `soft_delete_profile_by_clerk_id()`.
- Profiles are marked `status = 'deleted'`, not hard-deleted.
- Re-signup with the same email restores the existing row (preserves `id`, subscriptions, immigration data).

### Use RPC functions for profile sync

- `upsert_profile_from_clerk()` handles create, update, restore, and relink cases.
- Application code calls RPCs via `lib/supabase/profiles.ts`; avoid ad-hoc profile writes from webhooks.
- Business rules (email uniqueness, lifecycle branches) live in SQL, not scattered in TypeScript.

### Normalize before sync

- `normalizeClerkUser()` in `lib/clerk/normalizeUser.ts` validates and normalizes Clerk webhook payloads.
- `profileSync.ts` maps normalized data to RPC parameters only.

---

## Security and access

- **Middleware** protects `/admin`, `/api/admin`, `/account`, `/api/account`.
- **`requireUser()`** / **`requireAdmin()`** gate server routes; webhooks never promote `role` to `admin`.
- **RLS** enabled on Supabase tables; client policies deferred until account UI needs direct access.
- **Admin bootstrap** via SQL (`set_profile_role`) after first signup — not via webhooks.

---

## Development workflow

### Development Workflow v2.0 (effective 2026-06-30)

All feature work uses **feature branches**. Do not develop features directly on `main`.

| Phase | Action |
|-------|--------|
| Start | Inspect code/docs; explain architecture before implementation |
| Build | Implement on `feature/<description>` branch |
| Verify | Test localhost; obtain user approval |
| Gate | `npm run build` must pass before merge/push |
| Release | Merge to `main` after gates; update docs when architecture/workflow changes |

Never combine infrastructure and feature work in the same branch when avoidable. Keep the repository clean before ending a session.

Full rules: [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) §8 · Decision: [PROJECT_DECISIONS.md](./PROJECT_DECISIONS.md) Decision 007

### Use Cursor for implementation

- Day-to-day coding, migrations, and refactors happen in the repo with Cursor.
- Follow existing patterns in `lib/`, `components/`, and `supabase/migrations/`.

### Use ChatGPT for architecture and review

- High-level design, milestone planning, and cross-cutting reviews.
- Decisions that affect multiple phases should be captured here or in `docs/PROJECT_STATUS.md`.

### Keep project state in `docs/PROJECT_STATUS.md`

- Current phase, sprint, completed work, and next steps live in that file.
- Update it when closing milestones or changing focus.
- This file (`TECHNICAL_DECISIONS.md`) records *why*; `PROJECT_STATUS.md` records *where we are*.

---

## H-1B official wage geography

Official OFLC wage lookup follows **GEO-RESOLUTION-DECISION-001** ([PROJECT_DECISIONS.md](./PROJECT_DECISIONS.md) Decision 008). The authoritative runtime and county-choice UX contract is [H1B_GEOGRAPHIC_RESOLUTION_CONTRACT.md](./H1B_GEOGRAPHIC_RESOLUTION_CONTRACT.md) (DESIGN-002 + UX-011).

- Preserve every official HUD ZIP-to-county row. Do not silently drop a county because of `BUS_RATIO`, `RES_RATIO`, or `TOT_RATIO`.
- Auto-resolve only when those official counties map to **one** OFLC area, including multi-county / single-area ZIPs.
- If official counties map to more than one OFLC area, obtain the work-location county from the user.
- GeoLvl is published wage-record metadata. It is not a geographic-resolution input.
- Frontend consumes `POST /api/h1b/worksite-geography`. It must not recreate resolver logic or submit `area_code` as authority.
- County FIPS remains internal. The frontend never independently determines county → OFLC area.

## H-1B official wage and occupation APIs (H1BWAGE-CHECKPOINT-019 + H1BWAGE-CLOSE-023 + SEC-IP-PROD-012)

Production LIVE (SEC-IP-PROD-011). HUD-USPS 2026 Q2 and OFLC All Industries 2026-27 are ACTIVE. Migration 021 is applied on Production.

- Runtime selects the **ACTIVE** All Industries `wage_datasets` row and the **ACTIVE** HUD geography dataset. Dataset UUID and wage year are never hardcoded as lookup authority.
- `GET /api/h1b/official-occupations?q=` searches ACTIVE `oflc_occupations` only (case-insensitive title, useful SOC prefix, limit 25, deterministic ranking). It does not search the 722-title seed.
- `POST /api/h1b/official-wage` accepts only `soc_code`, `zip`, and optional `county_fips`. Unknown fields including `area_code` are rejected.
- The wage handler re-runs authoritative server-side geography, validates the official SOC, and loads the exact wage record. No closest-area or closest-SOC fallback.
- Annual equivalent (`hourly × 2,080`) is computed only in `lib/h1b/wage/client/formatOfficialWageDisplay.ts`. The wage API does not annualize.
- Canonical page `components/H1bWageLevelEstimator.tsx` is the approved V2 estimator promoted onto the original route. Temporary V2 route/component are removed.
- Recovered estimation lives in `lib/h1b/wage/v2/estimateOfficialWageLevel.ts`. Official wages are the amounts; salary/experience/education scoring is unchanged from approved V2.
- The 722 SOC seed is **enrichment only** (group, Common Job Titles, Typical H-1B) keyed by official SOC. It is not the occupation search source.
- `lib/h1b/wageLevelEstimator.ts` remains for shared types/helpers used by the official estimator. Do not reconnect the old demo `estimateH1bWageLevel` entry point or demo wage tables.
- Ordinary hourly result table renders Official Wage (Hourly Rate) and Annual Equivalent (2,080 Hours) as separate columns. The ×2,080 calculation remains only in `formatOfficialWageDisplay.ts`.
- Lottery Odds handoff is `/immigration/h1b-lottery-odds-calculator?wageLevel={I|II|III|IV}` from the canonical Wage route only.
- Lottery calculation lives in `lib/h1b/h1bLotteryOdds.ts`. Approved constants are `DHS_MODELED_SELECTION_ESTIMATES` (I 15.29 / II 30.58 / III 45.87 / IV 61.16) and `DHS_MODELED_RANDOM_BASELINE` 29.59. Master's eligibility does not modify the modeled estimate. The retired demo boost (`US_MASTERS_CAP_BOOST = 8`) and `MAX_DISPLAYED_ODDS = 95` must not return.
- Lottery on-page SEO lives in server-rendered `components/H1bLotteryOddsSeoContent.tsx` below the calculator. It must not change calculation values. FAQPage JSON-LD is not used; IMMIFIN has no established FAQ structured-data pattern.

### Production authorities and security boundary (SEC-IP-PROD-012)

- HUD-USPS 2026 Q2 is the approved V1 ZIP/county authority. OFLC All Industries 2026-27 is the approved V1 wage authority.
- `county_fips_names` is not required by V1 runtime.
- Proprietary estimator logic remains server-side. Public APIs omit `area_code`, `geo_level`, mapping internals, and `matchScore`. The estimate API accepts only user inputs and re-resolves geography/wages server-side.
- **Public Intelligence Boundary:** explain the result; do not publish the recipe. Do not expose proprietary formulas, scoring weights, decision trees, transformations, mappings, confidence algorithms, or private enrichment merely for transparency or SEO.
- AbuseGate is Production LIVE (Durable Object class `AbuseGate`, binding `ABUSE_GATE`, migration **v2**). Identity uses HMAC-SHA-256 with secret name `ABUSE_IDENTITY_SECRET`. Fail-open. `IMMIFIN_ABUSE_GATE_ENABLED` UNSET means enabled.
- Safe Worker rollback is **post-v2 only**. Retain v1 `DOQueueHandler` and v2 `AbuseGate`. Do not promote pre-v2 `29550ab`. HUD/OFLC stay ACTIVE during Worker rollback.
- Visa Bulletin History and Movement APIs: server-side capability enforcement is **DEPLOYED** (Free denied; Pro/Power allowed). Production account-level entitlement smoke is **PENDING**. Movement Tracker U→U modeling is a separate issue.

---

## Stack (locked for Phase 1)

| Concern | Choice |
|---------|--------|
| Framework | Next.js App Router |
| Auth | Clerk (`@clerk/nextjs`) |
| Database | Supabase Postgres |
| Deploy | Cloudflare Pages |
| Public data fetching | SWR (24h cache for visa bulletin APIs) |

---

## Related docs

- [Project decisions](./PROJECT_DECISIONS.md)
- [Project status](./PROJECT_STATUS.md)
- [Product roadmap](./PRODUCT_ROADMAP.md)
- [Phase 1 auth foundation](./auth/PHASE1.md)
