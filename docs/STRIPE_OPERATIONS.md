# IMMIFIN Stripe Operations Guide

| Field | Value |
|-------|-------|
| **Document** | Stripe Operations Guide |
| **Task** | S7-DOC-007 (as-built ops update) |
| **Version** | v2.1 |
| **Sprint** | Sprint 7 — Commercial Platform |
| **Status** | **Operational** — application complete; Sandbox/Live validation pending |
| **Created** | 2026-07-11 |
| **Last Updated** | 2026-07-20 |
| **Owner** | Engineering / Operations |

> **Authority:** This document is the **operational handbook** for configuring, validating, monitoring, and maintaining Stripe for IMMIFIN. It does **not** define product architecture or commercial policy — those belong in [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md), [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md), and [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md).

**Related:** [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) · [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) · [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md) · [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 1. Platform Status

| Field | Status |
|-------|--------|
| **Current production product version** | **v0.4.2** + Notification Platform **v1.0** on `https://immifin.com` |
| **Target commercial release** | **v0.5.0** (not signed off) |
| **Development environment** | `localhost:3000` + tunnel `https://dev.immifin.com` |
| **Stripe Test / Sandbox status** | Application supports Test Mode; **signed E2E webhook + payment validation pending** |
| **Stripe Live status** | **Not activated** for commercial production |
| **Production hosting status** | Active (Cloudflare Workers / OpenNext) — Live billing **not** cut over |
| **Commercial readiness** | **Application-ready** for Sandbox validation; **not** Live-production-ready |

**Do not overstate readiness.** Checkout, Billing Center, webhooks, and sync exist in application code. Live payments and production commercial cutover remain pending.

Primary plan management UX: **IMMIFIN Billing Center** (`/account/billing`). Stripe Customer Portal sessions are **deferred**.

---

## 2. Stripe Environments

| Environment | Purpose | Stripe mode | Typical app URL | Status |
|-------------|---------|-------------|-----------------|--------|
| **Development (local)** | Day-to-day engineering | Test | `http://localhost:3000` | Active for coding; secrets per workstation |
| **Development (tunnel)** | HTTPS webhooks / shared QA | Test | `https://dev.immifin.com` | Active when tunnel + `npm run dev` run |
| **Sandbox / Test Mode** | Signed payment + webhook proof | Test | Local or tunnel | **Pending operational validation** |
| **Production** | Public customers | Live | `https://immifin.com` | Hosting active; **Live Stripe pending** |

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
| **Production** | `https://immifin.com/api/webhooks/stripe` | Pending Live cutover |

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

Do **not** treat Portal as required for Sprint 7 plan operations. If Portal is later enabled for payment method / invoices only, record return URL and allowed operations here and keep plan changes in Billing Center.

---

## Appendix D — References

| Document | Purpose |
|----------|---------|
| [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) | As-built platform design |
| [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md) | IMMIFIN vs Stripe ownership |
| [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md) | Upgrade / downgrade / cancel policy |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | System architecture + production status |
| [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) | Sprint 7 as-built record |
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
