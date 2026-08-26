# IMMIFIN Stripe Operations Guide

| Field | Value |
|-------|-------|
| **Document** | Stripe Operations Guide |
| **Task** | S7-DOC-007 (as-built ops update); S7-OPS-STRIPE-032 LIVE E2E update |
| **Version** | v2.4 |
| **Sprint** | Sprint 7 — Commercial Platform |
| **Status** | **Operational** — LIVE Free→Pro PASS; Pro→Power technical PASS; **TEST billing UX E2E PASS** (008E); not Production-deployed |
| **Created** | 2026-07-11 |
| **Last Updated** | 2026-08-25 |
| **Owner** | Engineering / Operations |

> **Authority:** This document is the **operational handbook** for configuring, validating, monitoring, and maintaining Stripe for IMMIFIN. It does **not** define product architecture or commercial policy — those belong in [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md), [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md), and [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md).

**Related:** [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) · [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) · [S7_OPS_STRIPE_032_LIVE_FREE_PRO_MONTHLY_E2E_SIGNOFF.md](./S7_OPS_STRIPE_032_LIVE_FREE_PRO_MONTHLY_E2E_SIGNOFF.md) · [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md) · [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 1. Platform Status

| Field | Status |
|-------|--------|
| **Current production product version** | **v0.5.1** on `https://immifin.com` |
| **Target commercial release** | **v0.5.0** matrix — Free→Pro Monthly LIVE signed off; other transitions pending |
| **Development environment** | `localhost:3000` + tunnel `https://dev.immifin.com` |
| **Stripe Test / Sandbox status** | Application supports Test Mode; use for non-LIVE validation |
| **Stripe Live status** | **LIVE Free→Pro PASS**; **Pro→Power technical PASS** — see [033 signoff](./S7_OPS_STRIPE_033_LIVE_PRO_POWER_MONTHLY_E2E_SIGNOFF.md); confirmation UX enhancement required |
| **Production hosting status** | Active (Cloudflare Workers / OpenNext) with Fetch Stripe transport |
| **Commercial readiness** | Technical paid paths validated; **S7-BILLING-UX-002–008D** TEST E2E **PASS** ([008E signoff](./S7_BILLING_UX_008_FULL_STRIPE_TEST_E2E_SIGNOFF.md)); **not Production-deployed**; remaining **LIVE** transitions pending |

**Do not overstate readiness.** Free → Pro Monthly LIVE is signed off. Pro→Power LIVE remains a **technical** PASS. Sprint 7 billing confirmation UX is **TEST E2E validated** (008E) and **not Production-deployed**. Interval changes and LIVE Downgrade to Free / end-of-period remain pending.

Primary plan management UX: **IMMIFIN Billing Center** (`/account/billing`). Full Customer Portal (invoices / standalone PM panel) remains deferred. **S7-BILLING-UX-005** adds a **narrow** Stripe Billing Portal session for payment-method update during paid upgrade confirmation only.

### Subscription upgrade preview (S7-BILLING-UX-002)

- **Endpoint:** `POST /api/stripe/subscription/preview`
- **Purpose:** Read-only Stripe-authoritative preview for approved **immediate paid upgrades**
- **Stripe API:** `invoices.createPreview` with `subscription_details.proration_behavior: "always_invoice"` (models future invoice-now execution)
- **Input:** `{ targetTier, targetInterval }` only — no Stripe IDs from browser
- **Does not:** mutate subscriptions, create invoices, charge, or change local billing state
- **Execution (S7-BILLING-UX-003, code):** `executeImmediateUpgrade` uses `always_invoice` + `pending_if_incomplete` with signed `previewAuthorization` (HMAC via existing `STRIPE_SECRET_KEY` — no new secret). SCA: return `hostedInvoiceUrl` / `clientSecret`; Billing Center redirects to hosted invoice when required.
- **Entitlement:** sync uses **current** subscription items; while `pending_update` is set, destination plan is not applied — Power is not granted before payment settles.
- **Production:** Worker **unchanged** until controlled deploy of UX-003.
- **Payment method display (S7-BILLING-UX-004, code):** Preview returns customer-safe masked PM (`brand`/`last4`/`displayLabel`) using Stripe precedence: subscription.default_payment_method → customer.invoice_settings.default_payment_method → legacy customer.default_source (Card only).
- **Change / add payment method (S7-BILLING-UX-005, code):** `POST /api/stripe/billing-portal/payment-method` creates a Stripe-hosted Billing Portal session deep-linked to `payment_method_update` using an API-managed **payment-method-only** configuration (cancel / subscription-update disabled). IMMIFIN never collects PAN/CVC. Return URL is application-controlled (`/account/billing?payment_method=updated`). Return **invalidates** the prior upgrade preview / `previewAuthorization` / `prorationDate` and requests a **fresh** preview; explicit Confirm Upgrade remains required. PM update alone does **not** mutate the subscription plan. Optional pin: `STRIPE_BILLING_PORTAL_PM_CONFIGURATION_ID`. **Not Production-deployed.**
- **Transparent upgrade confirmation (S7-BILLING-UX-006, code):** Billing Center shows a preview-first confirmation with Stripe-authoritative amount due now, classified credit/prorated charge (or safe line-item fallback), next renewal, payment method + Change/Add PM, and explicit effective-timing / entitlement copy. Confirm label is `Confirm & Pay $X.XX` only when `amountDue > 0`. Expired preview refreshes for review (does not auto-charge). **Not Production-deployed.**
- **Scheduled downgrade transparency (S7-BILLING-UX-007, code):** Confirmation for `scheduled_downgrade` / `cancel_at_period_end` / `scheduled_interval_change` shows **No charge today**, authoritative `currentPeriodEnd` retention copy, target catalog price (or Free + no further charge), and blocks confirm when period end is missing. Does **not** call invoice preview for these paths. **Not Production-deployed.**
- **Stripe TEST E2E (S7-BILLING-UX-008E):** Full lifecycle **PASS** — Free→Pro Checkout → Pro→Power Confirm & Pay **$9.97** → Power→Pro schedule → Replace With Free at period end. Final TEST: Power Monthly active now, Free scheduled Sep 25, 2026. See [008E signoff](./S7_BILLING_UX_008_FULL_STRIPE_TEST_E2E_SIGNOFF.md). **Not Production validation.**
- **Verify:** `npx tsx scripts/verify-s7-billing-ux-002-subscription-preview.mjs` · `npx tsx scripts/verify-s7-billing-ux-003-immediate-upgrade-charge-now.mjs` · `npx tsx scripts/verify-s7-billing-ux-004-payment-method-preview.mjs` · `npx tsx scripts/verify-s7-billing-ux-005-hosted-payment-method.mjs` · `npx tsx scripts/verify-s7-billing-ux-006-transparent-upgrade-confirmation.mjs` · `npx tsx scripts/verify-s7-billing-ux-007-scheduled-downgrade-transparency.mjs` · `npx tsx scripts/verify-s7-billing-ux-008a-checkout-entitlement-refresh.mjs` · `npx tsx scripts/verify-s7-billing-ux-008b-scheduled-plan-visibility.mjs` · `npx tsx scripts/verify-s7-billing-ux-008c-schedule-replacement-free.mjs` · `npx tsx scripts/verify-s7-billing-ux-008d-replacement-dialog-visual.mjs`

### Cloudflare Workers — Stripe HTTP transport (mandatory)

IMMIFIN Production runs on Cloudflare Workers via OpenNext. The Stripe Node SDK default (`NodeHttpClient`) hangs on outbound Stripe API calls in workerd.

**Required:** server Stripe singleton must use:

```ts
httpClient: Stripe.createFetchHttpClient()
```

(`lib/stripe/server.ts`, API version `2026-06-24.dahlia`). Do not remove this without a controlled Workers transport validation.

### LIVE webhook signature (mandatory)

Production `STRIPE_WEBHOOK_SECRET` **must** match the signing secret of the exact active LIVE endpoint:

`https://immifin.com/api/webhooks/stripe`

TEST and LIVE webhook signing secrets are different. Cloudflare tail “Ok” alone does **not** prove webhook success — confirm Stripe Dashboard HTTP status/response and IMMIFIN synchronized subscription state.

---

## 2. Stripe Environments

| Environment | Purpose | Stripe mode | Typical app URL | Status |
|-------------|---------|-------------|-----------------|--------|
| **Development (local)** | Day-to-day engineering | Test | `http://localhost:3000` | Active for coding; secrets per workstation |
| **Development (tunnel)** | HTTPS webhooks / shared QA | Test | `https://dev.immifin.com` | Active when tunnel + `npm run dev` run |
| **Sandbox / Test Mode** | Signed payment + webhook proof | Test | Local or tunnel | **Pending operational validation** |
| **Production** | Public customers | Live | `https://immifin.com` | Hosting active; **LIVE Free→Pro Monthly PASS**; other transitions pending |

### Isolation rules

| Concern | Rule |
|---------|------|
| **Environment isolation** | Never mix Test and Live keys, Price IDs, or webhook secrets in the same runtime |
| **Price ID isolation** | Test Price IDs only with Test secret key; Live Price IDs only with Live secret key |
| **Customer isolation** | One Stripe Customer per IMMIFIN profile **per environment**; do not reuse Test customers in Live |
| **Webhook isolation** | Separate webhook endpoints and signing secrets for Test vs Live |
| **Dev Subscription Mode** | Engineering/QA override only; must be **hard-off** before Live commercial cutover |

### Live migration strategy (high level)

1. Complete Sandbox/Test Mode signed E2E (Checkout → webhook → Supabase → capabilities).
2. Create Live catalog (Products / Prices) and record IDs in §A.
3. Configure Live webhook endpoint + secrets in Cloudflare Production.
4. Apply production Supabase webhook-foundation migration if not already applied.
5. Disable Development Subscription Mode in Production.
6. Controlled Live smoke test + commercial signoff (v0.5.0).

---

## 3. Environment Variables

Document **names and responsibilities only**. Never commit or paste secret values here.

### Required for Stripe commercial paths

| Variable | Purpose | Environment | Required | Sensitive |
|----------|---------|-------------|----------|-----------|
| `STRIPE_SECRET_KEY` | Server Stripe API | Local / Tunnel / Production | Yes (for Checkout/webhooks) | **Yes** — server only |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client publishable key | Same as secret mode | Yes (if client Stripe.js used) | No (public) |
| `STRIPE_WEBHOOK_SECRET` | Signature verification | Matching webhook endpoint | Yes (for webhooks) | **Yes** — server only |
| `STRIPE_PRICE_PRO_MONTHLY` | Approved Pro monthly Price ID | Matching Test/Live | Yes | Semi-secret — server only |
| `STRIPE_PRICE_PRO_ANNUAL` | Approved Pro annual Price ID | Matching Test/Live | Yes | Semi-secret — server only |
| `STRIPE_PRICE_POWER_MONTHLY` | Approved Power monthly Price ID | Matching Test/Live | Yes | Semi-secret — server only |
| `STRIPE_PRICE_POWER_ANNUAL` | Approved Power annual Price ID | Matching Test/Live | Yes | Semi-secret — server only |

Names match [.env.example](../.env.example). Use Test values in local/tunnel; Live values only in Production cutover.

### Optional / related

| Variable | Purpose | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE` | Dev/beta tier override without Live Stripe | Must be unset/false for Live commercial production |

### Where secrets are stored

| Location | Used for |
|----------|----------|
| `.env.local` | Local `npm run dev` (gitignored) |
| `.dev.vars` | Local Workers preview (gitignored) |
| Cloudflare Dashboard → Worker variables / secrets | Production (and Preview when used) |

See [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) and [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 4. Operational Workflows

Operational steps only — not implementation code. Design detail: [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md).

### New subscription

1. User selects Pro/Power + interval on `/pricing`.
2. App creates Checkout Session (server resolves Price ID + Stripe Customer).
3. User completes payment on Stripe Checkout.
4. User returns to Pricing (success UX only).
5. Operator expectation: webhook arrives → subscription syncs in Supabase → capabilities unlock.
6. If access does not appear, check webhook delivery and sync (see §5–§6) — do **not** manually set premium in the DB as a shortcut.

### Upgrade

1. Authenticated user opens Billing Center (`/account/billing`).
2. Selects higher tier / allowed upgrade path; confirms intent.
3. App applies Stripe subscription change per policy (immediate upgrade / proration).
4. Webhook updates billing state → capabilities refresh.

### Downgrade

1. User selects lower paid plan in Billing Center and confirms.
2. Change is scheduled per policy (typically next period).
3. User retains current paid access until effective date.
4. Webhook at effective time syncs new plan → capabilities adjust.

### Renewal

1. Stripe renews the subscription automatically.
2. IMMIFIN receives subscription lifecycle webhooks.
3. Billing state stays current; capabilities continue if still paid.

### Cancellation

1. User cancels to Free in Billing Center (cancel at period end).
2. Access remains until period end.
3. On period end / deletion webhook, plan returns to Free → Free capabilities.

### Webhook retry

1. Stripe retries failed deliveries automatically.
2. IMMIFIN event ledger is idempotent — duplicate deliveries must not double-apply.
3. Operator: in Stripe Dashboard → Developers → Webhooks, inspect failed events; replay after fixing root cause (secret mismatch, downtime, DB error).

### Customer recovery

1. Confirm IMMIFIN profile identity (Clerk → Supabase profile).
2. Locate Stripe Customer in the correct mode (Test vs Live).
3. Prefer app mapping recovery (`getOrCreate` path / remapping) over creating a second Customer.
4. Never “fix” access by attaching the wrong environment’s customer.

### Capability recovery

1. Verify webhook-synced billing state (`plan`, Stripe subscription status, period fields).
2. Confirm effective tier and capability map — capabilities are the access source of truth.
3. Re-fetch account/subscription state in the app after sync.
4. Do **not** grant premium by bypassing capabilities or editing plan without Stripe truth.

---

## Sandbox Validation Mode

Development Subscription Mode is for **developer productivity** (local Free / Pro / Power switching without payment). It must be **temporarily disabled** when validating the complete Stripe Sandbox customer journey, so Pricing uses real Stripe Test Checkout instead of the Dev Mode activation path.

This procedure is documented from Sprint 7 release execution (S7-REL-003 / S7-REL-003A) and matches [.env.example](../.env.example).

### Purpose

Execute a complete Stripe **Test Mode** validation using the real Stripe Checkout flow while remaining isolated from production.

### Procedure

1. **Update `.env.local`** (local only):

   ```text
   IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE=false
   ```

2. **Restart the development server:**

   ```bash
   npm run dig
   ```

3. **Verify the Pricing page** (`/pricing`):

   | Expected | Not expected |
   |----------|--------------|
   | Monthly / Annual selectors visible | Development Subscription Mode banner |
   | Stripe Checkout CTAs available for paid plans | “No payment is collected” Dev Mode copy |

4. **Execute the complete Sandbox validation:**

   ```text
   Free User
     ↓
   Upgrade to Pro (Pricing)
     ↓
   Stripe Test Checkout
     ↓
   Signed Webhook
     ↓
   Supabase Synchronization
     ↓
   Capability Synchronization
     ↓
   Billing Center Validation
     ↓
   Dashboard Validation
   ```

5. **After Sandbox validation completes**, restore developer productivity:

   ```text
   IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE=true
   ```

   Restart the development server again (`npm run dig`).

### Billing Center vs Dev entitlement (BLP-BILL-FIX-001 / REV1)

Development Subscription Mode changes **entitlement plan** only (`subscriptions.plan` / `profiles.plan`). It does **not** create a Stripe subscription.

Billing Center and Pricing therefore distinguish:

| Concept | Source |
|---------|--------|
| Entitlement plan | `getEffectivePlan` / `getStoredSubscriptionTier` |
| Stripe billing state | `stripe_subscription_id`, `billing_interval`, period fields |

When Dev Mode simulates Pro/Power without Stripe:

* UI shows **Development plan override**
* Amount / billing shows **Not billed** (not Free catalog `$0` as a fake Pro price)
* Free→Paid Checkout actions are **hidden** (Checkout remains Free-only on the server)
* Pricing marks the **tier card** as current entitlement (tier-only); it does **not** claim Monthly or Annual ownership
* Pricing suppresses Stripe switch / handoff CTAs for simulated paid tiers
* Plan switching stays in existing Dev Subscription Mode controls (Account / Pricing)

Real Stripe-paid Current Plan matching remains **tier + billing interval**. Real Pro→Power continues to use `POST /api/stripe/subscription/change`.

### Dedicated local Dev Subscription test user (BLP-BILL-DEV-001 / FIX-002)

Development Subscription Mode is **not** available to every localhost authenticated user.

| Requirement | Detail |
|-------------|--------|
| Enable flag | `IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE=true` |
| Dedicated user | `IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID` = Clerk user ID (server-only) |
| Eligibility | Non-production **and** flag on **and** configured ID non-empty **and** authenticated Clerk ID exact match |
| Fail closed | Missing/empty test-user ID → no one eligible |
| Production | Always disabled in application code, even if both variables are set |
| Authority | `lib/subscription/devSubscriptionAccess.ts` → `canUseDevSubscriptionTools(userId)` |
| API | `PATCH /api/account/subscription` enforces the same resolver using `requireUser()` Clerk ID |
| Entitlement | Authorized Dev sessions use stored simulated plan via `resolveSubscriptionEntitlement` — historical canceled Stripe status does **not** force Free |
| Stripe history | Dev Mode does **not** clear `stripe_subscription_id` / `stripe_status`; production canceled → Free remains unchanged |

Never commit a real Clerk user ID. `.env.example` documents an empty variable only. Do not log or expose the configured ID to the client.

### Important notes

| Rule | Detail |
|------|--------|
| **Local only** | Change `.env.local` on the engineer workstation only |
| **Never touch Production for Sandbox** | Do not modify Cloudflare Production variables for Sandbox testing |
| **Production hard-off** | Application code forces Development Subscription Mode **off** when `NODE_ENV === "production"` |
| **No production deploy required** | Sandbox validation runs against local dig (+ tunnel/CLI webhook as configured) |
| **Sandbox only** | This procedure is only for Stripe Test Mode end-to-end validation — not Live cutover |

Cross-check Live cutover gates in [PRODUCTION_DEPLOYMENT_RUNBOOK.md](./PRODUCTION_DEPLOYMENT_RUNBOOK.md) and [V0_5_0_PRODUCTION_SIGNOFF.md](./V0_5_0_PRODUCTION_SIGNOFF.md). Live enablement still requires Sandbox E2E proof first.

---

## 5. Monitoring

Operators should watch these signals during Sandbox validation and after Live cutover.

| Signal | Where to look | What “healthy” looks like |
|--------|---------------|---------------------------|
| **Webhook failures** | Stripe Dashboard → Webhooks → endpoint | High success rate; failures investigated quickly |
| **Checkout failures** | App logs + Stripe Checkout / Payments | Sessions create; users can pay; no Price catalog misconfig |
| **Subscription sync** | Supabase subscription billing fields vs Stripe subscription | Plan, customer ID, subscription ID, periods align |
| **Capability sync** | User can access expected Pro/Power features after sync | No paid user stuck on Free UI after confirmed webhook |
| **Stripe Dashboard** | Customers, Subscriptions, Events | Expected objects for each successful payment |
| **Cloudflare logs** | Workers logs for Production | Checkout / webhook routes not erroring at scale |
| **Application logs** | Dev terminal or Worker logs | Signature rejects logged; successful syncs without secret leakage |
| **Database consistency** | `stripe_webhook_events` ledger + subscriptions | Events claimed/completed; no stuck failures without follow-up |

### Supported application webhook events

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

## 6. Failure Recovery

| Failure | Recovery approach |
|---------|-------------------|
| **Webhook signature failure** | Confirm `STRIPE_WEBHOOK_SECRET` matches the endpoint’s signing secret; fix env; replay event from Stripe |
| **Webhook endpoint down** | Restore app/Worker; Stripe will retry; verify ledger completes after recovery |
| **Duplicate events** | Expected — ledger idempotency should no-op duplicates; do not delete history casually |
| **Failed capability sync** | Fix billing-state sync first; then re-check effective tier / capabilities — never hardcode feature flags in UI |
| **Customer mismatch** | Verify environment (Test vs Live), profile mapping, and single-customer rule; rematerialize mapping carefully |
| **Partial subscription sync** | Compare Stripe subscription object to Supabase row; replay relevant subscription event; avoid manual field edits unless PO-approved incident procedure |
| **Stripe outage** | Pause cutover actions; communicate; resume when Stripe status recovers; do not invent offline entitlement grants |
| **Checkout create errors** | Check auth, Price env vars, secret key mode mismatch, and customer mapping errors in logs |

### Retry philosophy

- Prefer **Stripe replay** + **idempotent handlers** over manual DB entitlement edits.
- Browser success URLs are never recovery tools for access.
- After recovery, verify: Stripe object → Supabase billing state → capabilities → UI access.

---

## 7. Production Validation Checklist

### Implemented (application)

- [x] Checkout Session API + Pricing Checkout wiring
- [x] Customer mapping (one customer per profile, env-aware)
- [x] Webhook route + durable event ledger + billing-state sync
- [x] Subscription change APIs (upgrade / downgrade / interval / cancel-to-free)
- [x] Billing Center plan management UI
- [x] Capability enforcement helpers + premium UI gates

### Pending validation (operations / Live)

- [ ] Stripe Sandbox/Test Mode: webhook endpoint registered + signed E2E payment proof
- [ ] Live Products / Prices created and recorded (§A)
- [ ] Live webhook endpoint + Live secrets in Cloudflare Production
- [ ] Production Supabase webhook-foundation migration applied (target env)
- [ ] `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE` hard-off in Production
- [ ] Controlled Live payment smoke test (PO-approved)
- [ ] Production subscription change validation (Billing Center → Stripe → sync)
- [ ] Commercial / v0.5.0 signoff

### Deferred

- [ ] Customer Portal sessions (payment method / invoices / receipts)
- [ ] Portal as plan-management surface (**not** planned as primary UX)

### Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Product Owner | TBD | TBD | Required before Live commercial enablement |
| Engineering | TBD | TBD | |

---

## 8. Operational Best Practices

| Practice | Guidance |
|----------|----------|
| **Never edit Stripe customers casually** | Prefer app mapping + Stripe Dashboard only for approved support cases |
| **Never grant premium without capabilities** | Fix sync → tier → capability path; do not bypass gates |
| **Always trust verified webhook events** | Browser redirects and client claims are UX only |
| **Never modify immutable Price IDs in place** | Create new Prices for commercial changes; update env catalog deliberately |
| **Always validate in Test before Live** | Signed Sandbox E2E before Live secrets |
| **Keep environments isolated** | Test keys/prices/webhooks never in Production runtime |
| **Billing Center for plan changes** | Do not reintroduce Portal as the plan orchestrator |
| **Least privilege in logs** | Event IDs / profile IDs OK; never card data or secrets |
| **Record operational changes** | Update §B change log when Dashboard, webhooks, or env catalogs change |
| **Rotate on compromise** | Roll keys/secrets; update Cloudflare/local stores; re-register webhooks; log the change |

---

## 9. Known Limitations

| Limitation | Status |
|------------|--------|
| Customer Portal (payment method / invoices) | **Deferred** — Billing Center placeholders only |
| Live Stripe commercial cutover | **Pending validation** |
| Sandbox signed E2E operational proof | **Pending** |
| Commercial / v0.5.0 production signoff | **Pending** |
| Development Subscription Mode in non-Live envs | Still used for engineering/QA until Live gate |
| Past-due grace / tax / failed-payment messaging | Operational product decisions still open (see design §15) |
| Future operational automation | Monitoring alerts, automated reconciliation jobs not yet built |

---

## Appendix A — Catalog & Account Records

Record IDs here after Dashboard configuration. **Never store API keys or webhook secrets in this document.**

### Stripe accounts

| Field | Test Account | Live Account |
|-------|--------------|--------------|
| **Stripe Dashboard URL** | [Test Dashboard](https://dashboard.stripe.com/test/dashboard) | [Live Dashboard](https://dashboard.stripe.com/dashboard) |
| **Account ID** | TBD | TBD |
| **Account Owner** | TBD | TBD |
| **Status** | Pending / in progress (PO Dashboard) | Not configured for commercial Live |

### Products

| Product Name | IMMIFIN Plan | Product ID (Test) | Product ID (Live) | Status |
|--------------|--------------|-------------------|-------------------|--------|
| **IMMIFIN Pro** | `pro` | TBD | TBD | Record after setup |
| **IMMIFIN Power** | `power` | TBD | TBD | Record after setup |

### Prices (USD)

| Price Label | Amount | Interval | Plan | Price ID (Test) | Price ID (Live) |
|-------------|--------|----------|------|-----------------|-----------------|
| **Pro Monthly** | $9.99 | Monthly | `pro` | TBD | TBD |
| **Pro Annual** | $99.99 | Annual | `pro` | TBD | TBD |
| **Power Monthly** | $19.99 | Monthly | `power` | TBD | TBD |
| **Power Annual** | $199.99 | Annual | `power` | TBD | TBD |

Beta excludes coupons, promotions, and free trials.

### Webhook endpoints

| Environment | Endpoint URL | Status |
|-------------|--------------|--------|
| **Local (Stripe CLI)** | Forward to `http://localhost:3000/api/webhooks/stripe` | Operator-configured |
| **Dev tunnel** | `https://dev.immifin.com/api/webhooks/stripe` | Pending signed validation |
| **Production** | `https://immifin.com/api/webhooks/stripe` | **LIVE active** — signing secret must match Worker `STRIPE_WEBHOOK_SECRET` (validated Free→Pro path 2026-08-24) |

### Test cards

Use official Stripe test cards only — do not copy card numbers into this repository.

| Resource | URL |
|----------|-----|
| Stripe Testing | [https://docs.stripe.com/testing](https://docs.stripe.com/testing) |
| Test cards | [https://docs.stripe.com/testing#cards](https://docs.stripe.com/testing#cards) |

Recommended scenarios: successful payment, declined card, 3D Secure, insufficient funds.

---

## Appendix B — Operational Change Log

| Date | Change | Environment | Author | Notes |
|------|--------|-------------|--------|-------|
| 2026-07-11 | S7-SETUP-001 initiated — Test Mode setup procedure documented; catalog IDs pending PO Dashboard action | Test | Engineering | Catalog IDs TBD |
| 2026-07-20 | S7-DOC-007 — Ops guide rewritten for as-built Sprint 7 (Billing Center primary; Portal deferred; Live pending) | Docs | Engineering | Application ops aligned with handoff |
| 2026-07-20 | S7-DOC-013 — Documented Sandbox Validation Mode (disable Dev Subscription Mode for Test Checkout E2E) | Docs | Engineering | Local `.env.local` only; no Production changes |
| 2026-08-24 | S7-OPS-STRIPE-032 — LIVE Free→Pro Monthly E2E PASS; FetchHttpClient required on Workers; LIVE `STRIPE_WEBHOOK_SECRET` aligned to active endpoint | Production | Engineering | Signoff: [S7_OPS_STRIPE_032…](./S7_OPS_STRIPE_032_LIVE_FREE_PRO_MONTHLY_E2E_SIGNOFF.md); secret values never recorded |
| 2026-08-24 | S7-OPS-STRIPE-034 — Pro→Power technical PASS documented; customer upgrade UX enhancement required; **S7-BILLING-UX-001** backlog | Docs | Engineering | Signoff: [S7_OPS_STRIPE_033…](./S7_OPS_STRIPE_033_LIVE_PRO_POWER_MONTHLY_E2E_SIGNOFF.md) |

---

## Appendix C — Test Mode Catalog Setup Procedure

**Scope:** Stripe Dashboard Test Mode catalog. Use when Products/Prices are not yet recorded in Appendix A.

### Prerequisites

1. Stripe account exists.
2. **Test Mode** toggle ON.
3. Business profile reviewed under Settings → Business.

### Steps

1. Record Account ID in Appendix A.
2. Create products **IMMIFIN Pro** and **IMMIFIN Power**.
3. Create four recurring USD prices: Pro Monthly $9.99, Pro Annual $99.99, Power Monthly $19.99, Power Annual $199.99.
4. Copy Product/Price IDs into Appendix A (Test columns).
5. Configure Test webhook endpoint to tunnel or CLI forward URL; store signing secret in `.env.local` only.
6. Put Test Price IDs into local env vars (names in §3).
7. Run signed Checkout → webhook → Supabase sync validation.
8. Log completion in Appendix B.

### Customer Portal note

Do **not** treat Portal as the primary plan-management UX. Plan changes stay in Billing Center.

**S7-BILLING-UX-005 (code, not Production-deployed):** upgrade confirmation can open a **narrow** hosted payment-method flow:

- Endpoint: `POST /api/stripe/billing-portal/payment-method`
- Stripe: `billingPortal.sessions.create` with `flow_data.type = payment_method_update`
- Configuration: API-managed (or `STRIPE_BILLING_PORTAL_PM_CONFIGURATION_ID`) with **only** `payment_method_update` enabled; cancel / subscription update / customer update / invoice history disabled
- Return: `{APP_ORIGIN}/account/billing?payment_method=updated` (no browser-supplied return URL)
- After return: neutral “Payment method settings refreshed.” + fresh upgrade preview; no claim that the card changed unless later UX proves it; no subscription mutation from the PM flow itself

Standalone Billing Center payment-method panel and invoice history remain deferred.

---

## Appendix D — References

| Document | Purpose |
|----------|---------|
| [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) | As-built platform design |
| [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md) | IMMIFIN vs Stripe ownership |
| [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md) | Upgrade / downgrade / cancel policy |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | System architecture + production status |
| [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) | Sprint 7 as-built record |
| [S7_OPS_STRIPE_032_LIVE_FREE_PRO_MONTHLY_E2E_SIGNOFF.md](./S7_OPS_STRIPE_032_LIVE_FREE_PRO_MONTHLY_E2E_SIGNOFF.md) | LIVE Free→Pro Monthly E2E PASS + root causes |
| [S7_OPS_STRIPE_033_LIVE_PRO_POWER_MONTHLY_E2E_SIGNOFF.md](./S7_OPS_STRIPE_033_LIVE_PRO_POWER_MONTHLY_E2E_SIGNOFF.md) | LIVE Pro→Power technical PASS + billing UX gap |
| [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) | Operational snapshot |
| [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) | Local / tunnel workflow |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Cloudflare deployment |
| [Stripe Documentation](https://docs.stripe.com/) | Official Stripe reference |

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-11 | S7-DOC-002 | Initial Stripe Operations Runbook |
| v1.1 | 2026-07-11 | S7-SETUP-001 | Test Mode setup procedure; pending PO Dashboard catalog |
| v2.0 | 2026-07-20 | S7-DOC-007 | As-built production ops guide — workflows, monitoring, recovery, validation |
| v2.1 | 2026-07-20 | S7-DOC-013 | Sandbox Validation Mode — temporary Dev Mode off for Stripe Test Checkout E2E |
| v2.2 | 2026-08-24 | S7-OPS-STRIPE-032 | LIVE Free→Pro Monthly PASS; FetchHttpClient + LIVE webhook secret lessons |
| v2.4 | 2026-08-25 | S7-BILLING-UX-008E | Full Stripe TEST E2E PASS (Power now / Free at period end); not Production-deployed |
