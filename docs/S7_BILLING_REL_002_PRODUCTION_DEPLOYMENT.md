# S7-BILLING-REL-002 — Controlled Push & Production Deployment Record

| Field | Value |
|-------|-------|
| **Story** | S7-BILLING-REL-002 |
| **Date** | 2026-08-25 |
| **Approved commit** | `8f01cd67cda7ba9eac2ee701943ab2fba892936b` |
| **Parent** | `f11ee975e3e5b0dea8340da36e92c17574ee7532` |
| **Worker** | `immifin` |
| **Cloudflare Version ID** | `1200e05b-6732-427d-9c85-6b995cbcbb8f` |
| **Production URL** | `https://immifin.com` |
| **LIVE billing mutations this story** | **NONE** |
| **UX-002–008D Production lifecycle validation** | **NOT YET PERFORMED** |

> Operational handbook: [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md). TEST E2E authority remains [008E signoff](./S7_BILLING_UX_008_FULL_STRIPE_TEST_E2E_SIGNOFF.md). Historical LIVE Free→Pro: [032](./S7_OPS_STRIPE_032_LIVE_FREE_PRO_MONTHLY_E2E_SIGNOFF.md). Historical LIVE Pro→Power technical: [033](./S7_OPS_STRIPE_033_LIVE_PRO_POWER_MONTHLY_E2E_SIGNOFF.md).

**Do not treat this deploy as LIVE billing UX signoff.** The Sprint 7 confirmation UX stack is now on Production code. Controlled LIVE transitions (Checkout, upgrade, downgrade, Keep My Subscription, payment-method change) were **not** executed in this story.

---

## Release artifacts

| Artifact | Value |
|----------|-------|
| **Git commit** | `8f01cd67cda7ba9eac2ee701943ab2fba892936b` — `feat(billing): complete Stripe subscription UX lifecycle` |
| **origin/main** | Same SHA (fast-forward; no force push) |
| **Production Worker** | `immifin` |
| **Version ID** | `1200e05b-6732-427d-9c85-6b995cbcbb8f` |
| **Deploy command** | Established `npm run deploy` (OpenNext build + Wrangler) after Git auto-deploy did not emit a new code version |
| **Clerk bake-in** | Build-time `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` prefix `pk_live_` |
| **Served HTML Clerk** | `pk_live_` on `/`, `/login`, `/signup`, `/pricing`; no `pk_test_` in those responses |
| **Stripe transport** | `Stripe.createFetchHttpClient()` in `lib/stripe/server.ts` (deployed) |
| **Stripe Dashboard / products / prices / webhook secret** | **Unchanged** this story |
| **Supabase schema / Clerk configuration** | **Unchanged** this story |

---

## What this deploy ships

S7-BILLING-UX-002 through 008D (plus REL-001 packaging/signoffs): preview, immediate paid upgrade, payment-method preview, hosted PM update, transparent upgrade confirmation, scheduled-downgrade transparency, checkout entitlement refresh, scheduled-plan visibility, schedule replacement with Free, replacement dialog visual.

## What this deploy does **not** claim

- LIVE Free → Pro with the new UX stack
- LIVE Pro → Power with confirmation UX
- LIVE Power → Pro scheduled
- LIVE Power → Free / Keep My Subscription
- LIVE payment-method change
- Interval-change LIVE validation
