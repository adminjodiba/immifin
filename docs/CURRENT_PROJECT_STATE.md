# IMMIFIN Current Project State

**Last Updated:** 2026-09-18 (S7A-SEO-VB-002 — Current Visa Bulletin Dashboard is public READ at `/immigration/visa-bulletin`. Localhost only; not committed, not deployed.)  
**Document role:** Operational single source of truth — where the project is today  
**Program:** [BETA_LAUNCH_PROGRAM.md](./BETA_LAUNCH_PROGRAM.md)  
**Sprint history:** [SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md) · [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) · [SPRINT_8_HANDOFF.md](./SPRINT_8_HANDOFF.md)  
**Persistent-cache ops:** [deployment/CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md)

---

## Executive Summary

IMMIFIN is a production immigration/finance web application on Cloudflare Workers (OpenNext) with Clerk auth, Supabase data, and a Free / Pro / Power capability model.

The project has transitioned from sprint-based feature development into the **IMMIFIN Beta Launch Program (BLP)** — coordinating invite-only beta, billing validation, operations, support, feedback, and controlled Intelligence enablement before any public launch.

**S7A-PERF-003 is CLOSED** — Production persistent OpenNext cache (R2 + D1 + Durable Object queue) is implemented and validated. **S7A-PERF-004 is CLOSED** — remaining warm HIT latency is accepted. **PERF-005 is not authorized.**

**Sprint 7** delivered the commercial Stripe platform **in application code**: Checkout, webhooks with billing-state sync, Pricing UI, Billing Center (plan changes), capability enforcement helpers, and commercial UX polish. **LIVE Free→Pro PASS**; remaining Live matrix and public launch are still pending.

| Field | Value |
|-------|-------|
| **Current Phase** | **IMMIFIN Beta Launch Program** |
| **Engineering Status** | **Sprint 7A go-live release packaged on `release/s7a-go-live` — awaiting Product Owner push/deploy approval** |
| **Operational Status** | **Preparing Invite-only Beta** |
| **Current Recommendation** | **Controlled Beta** |
| **Public Launch** | **Not Approved** |
| **Overall health** | Strong — core product stable; **LIVE Free→Pro PASS**; **LIVE Pro→Power technical PASS** (upgrade UX enhancement required); Intelligence engineered, not beta-enabled |
| **Commercial readiness** | LIVE activation + Pro→Power technical path validated; **Sprint 7 billing UX TEST E2E PASS** (002–008D); **Production-deployed** 2026-08-25 ([REL-002](./S7_BILLING_REL_002_PRODUCTION_DEPLOYMENT.md)); **LIVE UX lifecycle validation not yet performed** |
| **Engineering blockers** | September Monthly Immigration Update bulk send **blocked** until S7-PROD-NOTIFY-FIX-001 is Production-deployed and preview-rechecked ([signoff](./S7_PROD_NOTIFY_FIX_001_MONTH_ALIGNMENT_SIGNOFF.md)) |
| **Sprint 7A release** | Local merge complete (`2334374`). **Not pushed. Not Production-deployed.** |

---

## Sprint 7A go-live release (as-built on `release/s7a-go-live`)

Protected Sprint 7A work and `origin/main` were reconciled in **S7A-RELEASE-MERGE-010**. This section records **implemented** behavior in the release branch. Production (`https://immifin.com`) still serves the prior Worker until Product Owner approves push and deploy.

| Field | Value |
|-------|-------|
| **Release branch** | `release/s7a-go-live` |
| **Merge commit** | `23343740b1d7ef84903303fe6e3f290fe84c2e06` (parents `8f001fc` + `bdd0075`) |
| **Push / Production deploy** | **Not done** |
| **Local validation after merge** | TypeScript PASS · lint PASS (2 known warnings) · `npm run build` PASS · localhost public smoke PASS |

### Public Design System 2.0

| Surface | Implemented behavior |
|---------|----------------------|
| **Production homepage in this branch** | `/` renders `LandingV3PageContent` (DS2 commercial landing). Preview routes `/landing-v2` (locked V7 copy), `/landing-v3` (workspace), and `/landing-v7` (approved source) remain. |
| **Reusable split-scene hero** | `Ds2SplitSceneHero` is the locked method. Playbook: [EMMIFIN-HERO-DESIGN.MD](../EMMIFIN-HERO-DESIGN.MD). Approved reference is `/about/share-feedback`. Contact Us uses the same architecture. |
| **Public About navigation** | Header About menu: About IMMIFIN, What Users Say, Share Your Feedback, Pricing, Contact Us (`lib/about-menu.ts`). |
| **About** | DS2 public About page. |
| **Contact Us** | `/contact` redesigned with split-scene hero + DS2 body. Form waits for Clerk `ready` before fields enable (UX, not a broken submit path). |
| **Share Your Feedback** | `/about/share-feedback` — signed-in submitters only; page is `noindex`. Public visitors cannot submit. |
| **What Users Say** | `/about/what-users-say` — public testimonials from approved Feedback Pool. |

### User Feedback and What Users Say

Locked lifecycle for `/admin/feedback`. Admins moderate only three buckets. All admin feedback APIs use `requireAdmin()`.

| Path | Lifecycle |
|------|-----------|
| **Public** | Submit → Public Review → Approve → Feedback Pool |
| **Public reject** | Submit → Public Review → Reject → Permanent delete |
| **Private** | Submit → Private Review → Acknowledge → Permanent delete |
| **Pool delete** | Feedback Pool → Delete → Permanent delete |

Select All applies to the current page only (max 100), including Feedback Pool. Bulk approve/reject/acknowledge/delete re-validates eligibility server-side. Private feedback cannot be approved. Public feedback cannot be acknowledged. Pool delete cannot remove pending review records. Reject, Acknowledge, and Pool Delete require confirmation and permanently delete; Approve does not. Feedback Pool has no Publish checkbox.

`/about/what-users-say` builds a daily Top-100 snapshot from approved public pool records (`moderation_status = approved` and `publication_permission = true`). Candidate window is 500; unique-user selection is 100; sort is rating DESC, then `created_at` DESC, then `id` DESC. The page shows **four ticker rows** with **alternating direction** and **hover pause**.

Public identity order (server-side, before snapshot/cache):

1. **Display Name** from `user_feedback.display_name` when non-empty
2. Otherwise the submitter's login email from `profiles.email`, **masked** by `maskEmailForPublicDisplay()`
3. Otherwise **IMMIFIN User**

Raw login email is never included in public testimonial payloads or snapshot records. Admin Feedback Review may still use account email for authorized moderation.

Snapshot cache: `unstable_cache` revalidate **86,400 seconds**, tag `what-users-say-daily`. Localhost/development bypasses the cache. **No `revalidateTag` on approve / reject / pool delete.** A deleted pool quote can remain on the public page until snapshot expiry **if** production cache persists. Pending rejects never entered the snapshot. Production/runtime persistence of this 24-hour cache still requires verification after deploy.

### Data Refresh and daily Google Sheet sync

| Item | Implemented behavior |
|------|----------------------|
| **Data Refresh Center** | `/admin` and `/admin/data-refresh` share `AdminDataRefreshCenter`. Admin-only. Manual Visa Bulletin and Visa Stamping refresh remain. |
| **Daily scheduled sync** | Custom Worker `cloudflare/custom-worker.ts` POSTs `/api/internal/daily-sheet-sync` with `Authorization: Bearer <DAILY_SHEET_SYNC_SECRET>`. Route returns 401 without the secret. |
| **Design time** | 12:01 AM America/Chicago. Handler proceeds only when Chicago local time is 00:01. |
| **DST-safe crons** | `1 5 * * *` (05:01 UTC / CDT) and `1 6 * * *` (06:01 UTC / CST). Not live until Production deploy. Set Worker secret `DAILY_SHEET_SYNC_SECRET` before relying on cron. Secret values are not documented. |

### Combined Cloudflare architecture (this release)

Reconciled from `origin/main` persistent-cache close-out and Sprint 7A scheduled sync:

| Component | Status in this branch |
|-----------|------------------------|
| Custom Worker `main` | `./cloudflare/custom-worker.ts` — `scheduled()` plus OpenNext `fetch` delegation |
| 05:01 UTC cron | Yes |
| 06:01 UTC cron | Yes |
| R2 incremental cache | `NEXT_INC_CACHE_R2_BUCKET` → `immifin-prod-opennext-inc-cache` |
| D1 tag cache | `NEXT_TAG_CACHE_D1` → `immifin-prod-opennext-tag-cache` |
| Durable Object queue | `NEXT_CACHE_DO_QUEUE` → `DOQueueHandler` |
| Migration v1 | `new_sqlite_classes: ["DOQueueHandler"]` — do not remove |
| OpenNext persistent cache | `open-next.config.ts` — R2 + D1 + DO + `enableCacheInterception=true` |

Production already validated the persistent-cache bindings (S7A-PERF-003 / PERF-004). Custom Worker + Chicago crons are **in this release only** until the next Production deploy.

### SEO / Google Search Foundation

Source `app/sitemap.ts` lists **15** crawlable public URLs, including `/about/what-users-say`, `/life`, `/pricing`, and the Current Visa Bulletin Dashboard (`/immigration/visa-bulletin`). It does **not** list History, Movement, dashboard, profile, admin, Intelligence, mock routes, or `/about/share-feedback` (`noindex`).

Production Google Search Console (2026-09-17) discovered the previous **14** public URLs after sitemap refresh. The 15th URL (`/immigration/visa-bulletin`) is in source after S7A-SEO-VB-002 and is **not Production-live until this change is committed and deployed**. History and Movement remain Clerk-protected and stay off the sitemap. Runbook: [SPRINT_7A_GOOGLE_SEARCH_FOUNDATION.md](./SPRINT_7A_GOOGLE_SEARCH_FOUNDATION.md).

### Current Visa Bulletin public READ (S7A-SEO-VB-002)

| Field | Value |
|-------|-------|
| **Canonical route** | `/immigration/visa-bulletin` |
| **Access** | **PUBLIC READ** — anonymous visitors, Googlebot, Free, Pro, and Power all receive the existing Current Visa Bulletin Dashboard (HTTP 200) |
| **Data** | Existing Google Sheets pipeline via `getVisaBulletinData()` and `GET /api/visa-bulletin` (exact path only) |
| **Still protected** | History, Movement, Priority Date tracking, saved profile, personalized dashboard, alerts, Intelligence, admin |
| **Favorites** | Account-required; unsigned click uses existing Login Required |
| **Sitemap** | Included in source (15 URLs). Not Production-indexed until deploy |

### Security remediation (code-level, this branch)

| Item | Status |
|------|--------|
| `GET /api/debug/clerk-env` | **Deleted** |
| `GET /api/debug/supabase` | **Deleted** |
| `GET /api/google-test` | **Deleted** |
| `GET /api/visa-bulletin/sheets` | **Deleted** |
| Clerk webhook / profile upsert console logs | Routine email/name/full payload dumps removed; remaining logs use ids only |

### Post-go-live observations (not release blockers)

Recorded in S7A-CODE-SANITY-TRIAGE-005 and still true after merge:

- `components/H1bWageLevelEstimator.tsx:151` — `jsx-a11y/role-has-required-aria-props` (`role="option"` without `aria-selected`)
- `lib/hooks/useFavorites.ts:46` — `react-hooks/exhaustive-deps`
- Admin Feedback year histogram uses one count query per year (`Promise.all` over years) — admin-only optimization opportunity
- What Users Say 24-hour Cloudflare/OpenNext cache persistence still requires **production/runtime verification** after deploy
- Daily WUS snapshot may temporarily retain previously cached approved content until expiry; optional later `revalidateTag('what-users-say-daily')` if Product Owner wants immediate public refresh
- Contact form fields stay disabled until Clerk `ready`
- Unused `ContactOfficeCard` export; unused unbounded `getPublishedUserFeedback()` helper
- Homepage Open Graph still has no `og:image` (SEO F9)

---

## Landing Page Design System workspace (S7A-LANDING-DS2-BASELINE-001)

| Field | Value |
|-------|-------|
| **Approved source** | `/landing-v7` — Product Owner approved commercial landing |
| **Locked commercial baseline** | `/landing-v2` — exact copy of V7; frozen |
| **Design System 2.0 workspace** | `/landing-v3` — working copy; V3-only navigation experiment started |
| **Removed preview routes** | `/landing-v4`, `/landing-v5`, `/landing-v6` |
| **Homepage in this release** | `/` serves Landing V3 (`LandingV3PageContent`). Not Production-deployed yet. |
| **Sprint** | Sprint 7A — Production Marketing / SEO / Public Launch Readiness |

Future Design System work must not modify `/landing-v2` or `/landing-v7`.

## Billing Center Design System 2.0 (S7A-DS2-BILLING-FINAL-007)

| Field | Value |
|-------|-------|
| **Status** | LOCKED paid-user visual architecture |
| **Approved visual** | `public/images/immifin-billing-center-paid-ds2-final-approved.png` |
| **Route** | `/account/billing` |
| **Page architecture** | Current-plan digital card + Billing Details; paid Billing Management (history + subscription actions + scheduled change); Free / Pro / Power identity cards with one-at-a-time hover/focus preview |
| **Plan card identities** | Free blue/navy · Pro purple/violet · Power gold/amber |
| **Not shown** | Duplicate Subscription Details column; current-plan row in Billing Details; old View Plans / Manage Billing cards; Plan Features; HR; payment-method UI |
| **Invoice history** | Not currently supported by production architecture — empty state only, no fabricated rows |
| **My Immifin → Plan & Billing** | Billing Center → `/account/billing`; View full plan → `/pricing` |
| **Workspace sidebar** | Canonical My Immifin list: Immigration Dashboard, My Profile, Personalization, Plan & Billing, Account Settings, Help & Support |
| **Billing/Stripe/entitlement logic** | Unchanged — existing plan-change, interval-change, and downgrade-to-Free actions are presented in the new layout |

## Admin Dashboard Design System 2.0 mock (S7A-DS2-ADMIN-DASHBOARD-MOCK-001)

| Field | Value |
|-------|-------|
| **Status** | Overview remains a DS2 mock/foundation pane. **User Feedback** and **Data Refresh Center** are operational. **Notifications** is Production deployed and verified. |
| **Approved visual** | `public/images/immifin-admin-dashboard-ds2-approved-reference.png` |
| **Mock route** | `/admin/overview` — presentation only; do not treat as a metrics migration |
| **Working pages** | `/admin` (legacy, still available); `/admin/data-refresh` (shared Data Refresh Center); `/admin/feedback` (review queue); `/admin/notifications` (approved DS2 Notifications page) |
| **Information architecture** | Admin stays inside My Immifin. Authorized admins see expandable **Admin Dashboard**: Overview, User Management, User Feedback, Data Refresh Center, Notifications, Content Management, System Logs, Settings |
| **Authorization** | Same `requireAdmin()` / `isAdminRole(profiles.role)` as `/admin` |
| **Still mock-only** | Overview metrics, User Management, Content Management, System Logs, Settings |
| **Notifications migration** | Production deployed and verified. Release commit `2e229f215c25c86104578768662d5f4f3788e58d`. `/admin/notifications` is the operational monthly workspace: Review Audience → Generate Update → Preview → Confirm & Send. Campaign Details distinguish current vs previous bulletin campaigns using the existing summary API. Group workflow is **Notify User Group**; individual workflow is **Notify Individual User**. Existing Sprint 6 Notification Platform business logic, APIs, and database tables are reused. Duplicate bulk send is not offered when the current bulletin is already sent. Development test/preview tools are not exposed on this route. Legacy `/admin` remains temporarily available. Production Bulletin Refreshed still means last `force_sync_visa_bulletin` audit time — follow-up after workflow validation; do not change Data Refresh here. |
| **Follow-up (non-blocking)** | Authenticated Production `/admin/notifications` currently shows Current Bulletin September 2026 and Previous Bulletin July 2026. Observation only — not classified as a defect without investigation. |

## User Feedback Review Queue (S7A-DS2-ADMIN-FEEDBACK)

Locked lifecycle for `/admin/feedback`. Visitors cannot submit feedback. Admins moderate only three buckets.

| Path | Lifecycle |
|------|-----------|
| **Public** | Submit → Public Review → Approve → Feedback Pool |
| **Public reject** | Submit → Public Review → Reject → Permanent delete |
| **Private** | Submit → Private Review → Acknowledge → Permanent delete |
| **Pool delete** | Feedback Pool → Delete → Permanent delete |

Select All applies to the current page only (max 100), including Feedback Pool. Bulk approve/reject/acknowledge/delete re-validates eligibility server-side with `requireAdmin()`. Private feedback cannot be approved. Public feedback cannot be acknowledged. Pool delete cannot remove pending review records. Reject, Acknowledge, and Pool Delete require a confirmation dialog and permanently delete; Approve does not. Feedback Pool has no Publish checkbox. `/about/what-users-say` pulls a daily Top-100 snapshot from approved public pool records.

## Public What Users Say identity (S7A-FEEDBACK-PUBLIC-IDENTITY-004)

Public testimonial cards on `/about/what-users-say` show identity in this order:

1. **Display Name** from `user_feedback.display_name` when the submitter supplied a non-empty value
2. Otherwise the submitter's **login email** from `profiles.email`, **masked on the server** by `maskEmailForPublicDisplay()`
3. Otherwise the privacy-safe generic identity **IMMIFIN User**

**RAW LOGIN EMAIL MUST NEVER BE INCLUDED IN PUBLIC TESTIMONIAL PAYLOADS OR PUBLIC TESTIMONIAL CACHE/SNAPSHOT RECORDS.** Masking happens before `buildWhatUsersSaySnapshot()`. The browser receives only Display Name, the masked email, or IMMIFIN User. Admin Feedback Review may still use account email for authorized moderation and is not subject to this public-display rule.

## My Profile Design System 2.0 (S7A-DS2-MY-PROFILE-FINAL-CLOSE-001)

| Field | Value |
|-------|-------|
| **Status** | LOCKED — current localhost `/user-profile` presentation is the DS2 visual baseline |
| **Visual reference** | `public/images/immifin-my-profile-ds2-final-approved.png` |
| **Route** | `/user-profile` |
| **Workspace sidebar** | One flat My Immifin list: Immigration Dashboard, My Profile, Personalization, Plan & Billing, Account Settings, Help & Support |
| **Page architecture** | Compact action bar + 2×2 quadrants (Personal, Immigration, Green Card, Notifications). No profile tabs. |
| **Save** | One page-level Save All Changes action; existing section save contracts reused |
| **Close** | Returns to `/` |
| **DS2 header My Immifin** | Direct link to `/user-profile` — no mega menu, no chevron |
| **Plan & Billing sidebar** | One item only; Billing / Plans tabs remain on the Billing Center page |
| **Design principle** | Authenticated My Immifin product surfaces use restrained premium SaaS visual language; photography is reserved primarily for marketing/discovery surfaces unless separately approved |
| **Profile / Clerk / Supabase logic** | Unchanged — presentation and coordinated existing persistence only |
| **Further visual refinement** | Do not start another My Profile redesign cycle |

## My Profile access (S7A-DS2-MY-PROFILE-ACCESS-CLOSE-001)

Profile data entry is available to signed-in Free, Pro and Power users.
Subscription entitlements govern premium functionality that consumes or acts
on profile data; they do not prevent the user from maintaining foundational
profile information.

| Field | Value |
|-------|-------|
| **Data entry (Free / Pro / Power)** | Personal Info, Immigration, Green Card, Notifications preferences |
| **Still Pro** | Immigration Dashboard, Priority Date Tracking, Visa Bulletin History, Movement Tracker, Email Alerts delivery, calculator autofill |
| **Still Power** | IMMIFIN AI Advisor |

## My Immifin Personalization (S7A-DS2-MYIMMIFIN-PERSONALIZATION-001)

| Field | Value |
|-------|-------|
| **Status** | Implemented locally — start-page preference for Pro / Power |
| **Route** | `/user-profile/personalization` |
| **Persistence** | `immigration_profiles.preferences.startPage` (existing JSONB; no migration) |
| **Post-login resolver** | `/auth/start` — used only when there is no explicit return path |
| **Safe fallback** | IMMIFIN Home (`/`) |
| **Destinations** | Home (all); Immigration Dashboard (existing `accessPersonalDashboard`); Admin Dashboard (admin role only) |
| **Free** | Sidebar item visible with PRO badge; page is locked; cannot save; default start remains Home |
| **Finance Dashboard** | Not created |

## IMMIFIN Beta Launch Program

| Field | Value |
|-------|-------|
| **Program ID** | BLP-001 (Phase 1 — Program Foundation) |
| **Master document** | [BETA_LAUNCH_PROGRAM.md](./BETA_LAUNCH_PROGRAM.md) |
| **Epics** | Beta Infrastructure · Billing Validation · Operational Readiness · Customer Support · Beta User Management · Analytics · Immigration Data Quality · Intelligence Controlled Rollout · Public Launch Readiness |
| **Sprint 9+** | Not started — resumes only when engineering work is approved |

---

## Sprint 8 Status (preserved)

| Field | Value |
|-------|-------|
| **Engineering status** | **FROZEN** — complete through S8-IIP-001 … S8-IIP-011 (+ S8-IIP-012 handoff) |
| **Operational status** | **PRE-BETA ENABLEMENT PENDING** (Intelligence enablement) |
| **S8-IIP-011 status** | **COMPLETE WITH OPEN PRE-ENABLE ACTIONS** |
| **Launch recommendation (Intelligence)** | **CONDITIONAL GO FOR INVITE-ONLY CONTROLLED BETA** |
| **Public launch** | **NOT APPROVED** |
| **Handoff** | [SPRINT_8_HANDOFF.md](./SPRINT_8_HANDOFF.md) |

### What exists now

* Power-gated single-turn `/intelligence` workspace
* Authenticated `POST /api/intelligence/ask` with `accessAI`
* Server kill switch (`IMMIFIN_INTELLIGENCE_ENABLED`)
* Server controlled-beta allowlist (`IMMIFIN_INTELLIGENCE_BETA_USER_IDS`)
* Ops runbook + readiness audit docs
* Drafted privacy/terms AI wording (pending approval)

### What remains disabled / not validated

* Real invite cohort not selected / not enabled
* OpenAI configuration not production-secret-managed in this freeze
* Authenticated Free/Pro/Power browser matrix not performed
* Live provider smoke test not authorized / not performed
* Legal AI wording not approved
* Kill-switch owner acceptance not recorded

### Before invited users receive Intelligence access

Complete the roadmap **Pre-Beta Enablement Gate** and BLP Epic 8 criteria (see [ROADMAP_v2.md](./ROADMAP_v2.md) and [SPRINT_8_HANDOFF.md](./SPRINT_8_HANDOFF.md)).

### Deferred until real-user feedback

Multi-turn chat, streaming, RAG, citations, durable rate limits, commercial quotas, provider-selector removal debt, broader Intelligence UX.

---

## Latest Production Validation

### LIVE Pro Monthly → Power Monthly (S7-OPS-STRIPE-033 / 034)

| Item | Detail |
|------|--------|
| **Technical LIVE E2E** | **PASS** |
| **Customer upgrade UX** | **ENHANCEMENT REQUIRED** before final commercial UX signoff |
| **Signoff** | [S7_OPS_STRIPE_033_LIVE_PRO_POWER_MONTHLY_E2E_SIGNOFF.md](./S7_OPS_STRIPE_033_LIVE_PRO_POWER_MONTHLY_E2E_SIGNOFF.md) |
| **Validated** | Billing Center → policy → `subscriptions.update` → FetchHttpClient → `customer.subscription.updated` → sync → Power entitlement |
| **Backlog** | **S7-BILLING-REL-002** Production-deployed UX-002–008D (`8f01cd67` / Worker `1200e05b-…`). **008E TEST E2E PASS** remains the TEST authority. **LIVE UX-002–008D lifecycle validation not yet performed.** |

### LIVE Free → Pro Monthly Stripe E2E (S7-OPS-STRIPE-032)

| Item | Detail |
|------|--------|
| **Status** | **PASS** — first successful LIVE Free → Pro Monthly subscription |
| **Signoff** | [S7_OPS_STRIPE_032_LIVE_FREE_PRO_MONTHLY_E2E_SIGNOFF.md](./S7_OPS_STRIPE_032_LIVE_FREE_PRO_MONTHLY_E2E_SIGNOFF.md) |
| **Amount** | $9.99/month Pro Monthly |
| **Transport** | `Stripe.createFetchHttpClient()` on Cloudflare Workers (`lib/stripe/server.ts`) |
| **Fetch git commit** | `f11ee975e3e5b0dea8340da36e92c17574ee7532` |
| **Worker version (Fetch deploy)** | `fc20ff12-a30f-463d-ab28-dd78455ab486` |
| **Validated** | Checkout transport · LIVE payment · LIVE webhook signature (corrected) · subscription sync · Pro entitlement · Billing Center Active |
| **Not complete** | Pro→Power, interval changes, Downgrade to Free / end-of-period, other billing-policy transitions |

Root causes resolved during this path (documented in signoff):

1. **Stripe HTTP transport** — OpenNext/Worker defaulted to NodeHttpClient; fixed with explicit FetchHttpClient  
2. **LIVE webhook signature** — Production `STRIPE_WEBHOOK_SECRET` mismatched active LIVE endpoint; secret corrected (value never documented)

### Clerk Production cutover (S7-OPS-CLERK-015)

| Item | Detail |
|------|--------|
| **Status** | **Complete** — production browser publishable key is Clerk Production (`pk_live_`) |
| **Production** | `https://immifin.com` → Clerk **Production** instance |
| **Localhost / dev tunnel** | `localhost` and `https://dev.immifin.com` remain Clerk **Development** (`pk_test_` via `.env.local`) |
| **Production webhook** | `https://immifin.com/api/webhooks/clerk` (subscribed: `user.created`, `user.updated`, `user.deleted`) |
| **Deploy commit** | `25852ece664c31238a42c32e590fa547bc8219b8` (clean tree; unrelated Sprint 8 / BLP WIP not deployed) |
| **Worker version** | `5a186320-4976-4740-a58d-dbfc6c364b53` |

### Prior product validation (v0.5.1)

| Item | Detail |
|------|--------|
| **Bulletin** | August 2026 Visa Bulletin updated in Google Sheets |
| **Admin Force Sync** | Successfully imported approximately 60 records; August bulletin appeared in production |
| **Defect** | One-day timezone display shift on some cutoff dates (parse path only; Sheets remained correct) |
| **Fix** | **P1-HOTFIX-001** — shared civil-date utility (`lib/dates/civilDate.ts`) for Visa Bulletin and Visa Stamping |
| **Verification** | Signed-in production visual verification; values matched Google Sheets |
| **Release** | **v0.5.1** production verified — see [RELEASE_NOTES_v0.5.1.md](./RELEASE_NOTES_v0.5.1.md) |
| **Commit** | `9b4b8ad4842e511a24d75bbcc6b46b7ee39c6a60` |

---

## Current Release Status

| Area | Status |
|------|--------|
| **Current production version** | **v0.5.1** on `https://immifin.com` — LIVE Free → Pro Monthly E2E **PASS** |
| **Next packaged release** | Sprint 7A go-live on `release/s7a-go-live` @ `2334374` — **ready to push after Product Owner approval**; not on GitHub `main`; not Production-deployed |
| **Target next commercial release** | **v0.5.0** matrix — Free→Pro Monthly LIVE signed off; remaining transitions pending |
| **Active program** | **IMMIFIN Beta Launch Program** — Preparing Invite-only Beta |
| **Sprint 8** | **FROZEN** — Engineering Complete through S8-IIP-011 |
| **Persistent cache** | **S7A-PERF-003 CLOSED** — R2 + D1 + DO queue + cache interception **validated in Production** |
| **Public HIT latency** | **S7A-PERF-004 CLOSED** — typical warm HIT is **accepted**; **PERF-005 is not authorized** |
| **Custom Worker + Chicago crons** | Implemented in this release branch; **not Production-live until the next deploy** |
| **Stripe status** | **Partial LIVE validation** — Free→Pro PASS; Pro→Power **technical** PASS; billing confirmation UX backlog (S7-BILLING-UX-001); other transitions pending |
| **Production readiness (commercial)** | **Partial** — first LIVE activation validated; do not treat full matrix as complete |
| **Public Launch** | **Not Approved** |

---

## Completed Platform Areas

| Area | Summary |
|------|---------|
| **Authentication** | Clerk sign-in/up, protected routes, session handling — **Production instance active on `immifin.com`** (S7-OPS-CLERK-015); localhost/dev tunnel remain Development |
| **Profiles / onboarding** | Account, immigration profile, contact preferences |
| **Visa Bulletin / stamping** | Current, history, movement, wait map |
| **Dashboards / calculators** | My Immifin, journey surfaces, GC/citizenship/H-1B tools |
| **Notifications** | Resend platform — production validated |
| **Stripe commercial path** | Checkout, webhooks, Billing Center — LIVE Free→Pro PASS; LIVE Pro→Power **technical** PASS ([033 signoff](./S7_OPS_STRIPE_033_LIVE_PRO_POWER_MONTHLY_E2E_SIGNOFF.md)); **S7-BILLING-UX-001** pending; Dev tools: **BLP-BILL-FIX-001 / REV1** + **BLP-BILL-DEV-001** + **BLP-BILL-DEV-FIX-002** |
| **Intelligence S8-IIP-001 … 010** | Full foundation through readiness audit |
| **Intelligence S8-IIP-011** | Controlled-beta allowlist + ops + drafted legal — **COMPLETE WITH OPEN PRE-ENABLE ACTIONS** |
| **Sprint 8 freeze / handoff** | S8-IIP-012 documentation governance |
| **Beta Launch Program foundation** | BLP-001 — [BETA_LAUNCH_PROGRAM.md](./BETA_LAUNCH_PROGRAM.md) |
| **OpenNext persistent cache** | Production R2 incremental cache, D1 tag cache, Durable Object revalidation queue; public HTML/RSC HIT proven (S7A-PERF-003) |
| **Sprint 7A public / admin / ops (this branch)** | DS2 homepage + hero playbook; Contact / Share Feedback / What Users Say; Admin Feedback + Data Refresh; daily Chicago sheet sync Worker; SEO sitemap includes `/about/what-users-say`; unused diagnostic routes removed |

For Sprint 7 detail, see [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md). Cache operations: [deployment/CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md). Sprint 7A closeout: [SPRINT_RELEASE_CHECKLIST.md](./SPRINT_RELEASE_CHECKLIST.md).

---

## Production persistent cache (S7A-PERF-003 / PERF-004)

| Field | Production value |
|-------|------------------|
| **Worker** | `immifin` |
| **Serving version** | `e0855e5f-66ec-4c12-828d-87caeeb4bd44` (100% traffic) |
| **Git / `origin/main` at cache close** | `3038ddf4c19a8548a621942c865faab0afb7b3dd` |
| **Architecture** | R2 incremental cache + D1 next-mode tag cache + Durable Object revalidation queue + `enableCacheInterception=true` |
| **R2** | `immifin-prod-opennext-inc-cache` (validated: 31 objects, ~1.44 MB) |
| **D1** | `immifin-prod-opennext-tag-cache` (`revalidations` + `_cf_KV`) |
| **Durable Object** | `NEXT_CACHE_DO_QUEUE` → `DOQueueHandler` (migration **v1** — forward-deploy only; do not remove) |
| **PERF-003** | **CLOSED** — public HTML/RSC persistent HIT, R2 persistence, D1 `revalidateTag`, auth boundaries, no observed user-specific PII in shared cache, no Worker 1102 |
| **PERF-004** | **CLOSED** — typical Worker HIT **~100–130 ms**; Clerk signed-out middleware **~1–5 ms** (not the TTFB bottleneck); current latency **acceptable** |
| **PERF-005** | **Not authorized.** Do not implement Workers Cache for HTML, CDN-in-front-of-Clerk, middleware bypass, or `withRegionalCache` without a new approved workstream. |

---

## Near-Term Priorities

1. Execute Beta Launch Program epics starting when PO authorizes (do not auto-start Epic 1 from BLP-001 alone).  
2. If 008E is accepted: **controlled commit/packaging** of S7-BILLING-UX-002 through 008D only (exclude unrelated Sprint 8 / Intelligence WIP). Do not deploy Production until a dedicated deploy story.  
3. Continue remaining Stripe **LIVE** matrix (interval changes, Downgrade to Free / end-of-period in LIVE).  
4. Prepare invite-only IMMIFIN beta cohort and support readiness.  
5. Enable Intelligence only after Pre-Beta Enablement Gate + PO approval.  
6. Collect real-user feedback before new feature sprints.

Do **not** begin Sprint 9 automatically.

---

## Known Gaps / Deferred

Intentionally deferred: Customer Portal payment-method/invoice sessions; multi-turn Intelligence; durable AI rate limits; Insurance / Finance platform build-out; Commercial Management Platform catalog publishing.

**Sprint 7A post-go-live (not blockers):** H-1B estimator `aria-selected` lint; `useFavorites` exhaustive-deps; Admin Feedback year-count N+1 counts; WUS 24-hour cache persistence verification after Production deploy; Contact Clerk-ready field gate; unused `ContactOfficeCard` / `getPublishedUserFeedback()`; optional `og:image`.

**Deferred UX (observed during LIVE activation wait UI):** “Contact IMMIFIN Support” (and equivalents) should hyperlink to the Contact Us email/contact section — track separately; not part of Stripe signoff implementation.

**Billing UX progress:** **S7-BILLING-UX-002–008D** code complete. **S7-BILLING-UX-008E** full Stripe **TEST** lifecycle **PASS** ([signoff](./S7_BILLING_UX_008_FULL_STRIPE_TEST_E2E_SIGNOFF.md)): Free → Pro Monthly → Power Monthly ($9.97 TEST) → Pro scheduled → scheduled Pro replaced with Free at period end. Final TEST fixture: **Power now / Free on Sep 25, 2026**. **TEST E2E validated. Production Worker unchanged until controlled deploy.**

---

## Quick Links

| Item | Value |
|------|--------|
| **Repository branch (local release)** | `release/s7a-go-live` (`2334374`) — not tracking a remote; not pushed |
| **GitHub `main` / current Production git** | `3038ddf4` (persistent-cache close) until this release is pushed |
| **Production Worker / version** | `immifin` / `e0855e5f-66ec-4c12-828d-87caeeb4bd44` (unchanged until deploy) |
| **Production URL** | `https://immifin.com` |
| **Dev tunnel (typical)** | `https://dev.immifin.com` |
| **Billing Center** | `/account/billing` |
| **Intelligence** | `/intelligence` (Power + beta allowlist; not publicly enabled) |
| **Beta program** | [BETA_LAUNCH_PROGRAM.md](./BETA_LAUNCH_PROGRAM.md) |
| **Verify suite (Intelligence)** | `scripts/verify-s8-iip-*.mjs` |
| **Verify (BLP-001)** | `scripts/verify-blp-001-beta-launch-program.mjs` |
| **Verify (BLP-BILL-FIX-001)** | `scripts/verify-blp-bill-fix-001-billing-center-actions.mjs` |
| **Verify (BLP-BILL-DEV-001)** | `scripts/verify-blp-bill-dev-001-dedicated-test-user.mjs` |
| **Verify (BLP-BILL-DEV-FIX-002)** | `scripts/verify-blp-bill-dev-fix-002-dev-entitlement-authority.mjs` |

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| Prior | 2026-07-14 | DOC-EOD / mid-Sprint 7 | Operational snapshot at ~88% backend narrative |
| Prior | 2026-07-20 | S7-DOC-003 | Concise operational snapshot aligned with Sprint 7 as-built handoff |
| Prior | 2026-07-25 | S8-IIP-010 | Intelligence readiness audit — CONDITIONAL GO |
| Prior | 2026-07-25 | PO freeze (interim) | Incorrectly framed S8-IIP-011 as deferred-only |
| Prior | 2026-07-25 | S8-IIP-012 | Sprint 8 FROZEN; S8-IIP-011 COMPLETE WITH OPEN PRE-ENABLE ACTIONS; handoff |
| Prior | 2026-07-25 | BLP-001 | IMMIFIN Beta Launch Program Phase 1; Controlled Beta recommendation; Public Launch Not Approved |
| Prior | 2026-08-10 | BLP-BILL-FIX-001 | Billing Center entitlement vs Stripe billing action alignment |
| Prior | 2026-08-10 | BLP-BILL-FIX-001-REV1 | Pricing Current Plan + Dev override aligned with Billing Center |
| Prior | 2026-08-10 | BLP-BILL-DEV-001 | Dev Subscription Mode restricted to dedicated local test user |
| Prior | 2026-08-10 | BLP-BILL-DEV-FIX-002 | Dev entitlement overrides historical canceled Stripe for designated test user |
| Prior | 2026-08-23 | S7-OPS-CLERK-015 | Clerk Production cutover on `immifin.com` (`pk_live_` build); localhost/dev remain Development; production webhook active |
| Prior | 2026-08-24 | S7-OPS-STRIPE-032 | LIVE Free → Pro Monthly E2E **PASS**; FetchHttpClient transport + LIVE webhook secret correction documented |
| Prior | 2026-08-24 | S7-OPS-STRIPE-034 | Pro→Power **technical** PASS; customer upgrade UX enhancement required; **S7-BILLING-UX-001** backlog |
| Prior | 2026-08-29 | S7A-PERF-CLOSE | PERF-003/004 closed; Production persistent cache and accepted HIT latency recorded |
| Prior | 2026-09-06 | S7A-LANDING-DS2-BASELINE-001 | Landing Page V7 is the approved source. V2 is the locked exact copy. V3 is the Design System 2.0 working copy. |
| Prior | 2026-09-10 | S7A-DS2-BILLING-FINAL-001 | Billing & Plan Option A locked: current-plan digital card + Billing Details; Free/Pro/Power identities only |
| Prior | 2026-09-15 | S7A-RELEASE-MERGE-010 | origin/main persistent-cache/SEO reconciled into Sprint 7A go-live release |
| **Current** | **2026-09-15** | **S7A-RELEASE-CLOSEOUT-011** | Final Sprint 7A as-built closeout; push/deploy still pending Product Owner approval |
