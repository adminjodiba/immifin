# IMMIFIN Stripe Operations Runbook

| Field | Value |
|-------|-------|
| **Document** | Stripe Operations Runbook |
| **Task** | S7-DOC-002 · S7-SETUP-001 (in progress) |
| **Version** | v1.1 |
| **Sprint** | Sprint 7 — Commercial Platform |
| **Status** | **Operational** — Test Mode catalog setup **pending Product Owner Dashboard action** |
| **Created** | 2026-07-11 |
| **Last setup task** | S7-SETUP-001 — 2026-07-11 |
| **Owner** | Engineering / Operations |

> **Authority:** This document is the **operational handbook** for configuring, maintaining, validating, and operating Stripe for IMMIFIN. It does **not** define product architecture, pricing policy, or webhook lifecycle rules — those belong in [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md).

**Related:** [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) · [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) · [DEPLOYMENT.md](./DEPLOYMENT.md) · [PROJECT_GUIDE.md](./PROJECT_GUIDE.md)

---

## 1. Purpose

This runbook captures **operational information** for the IMMIFIN Stripe platform — account ownership, product and price identifiers, environment secrets placement, webhook and portal configuration, test procedures, production cutover checklists, and security rules.

Use this document when:

- Setting up or verifying Stripe Test and Live accounts
- Recording Product and Price IDs after Dashboard configuration
- Configuring webhook endpoints and signing secrets per environment
- Onboarding engineers to Stripe operations
- Performing production deployment or incident response involving billing

**Do not use this document for:**

- Architecture decisions (see [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md))
- Application implementation details
- Storing secret key values (secrets live in environment configuration only)

Update this runbook whenever Stripe Dashboard configuration changes. Record each change in [§10 Operational Change Log](#10-operational-change-log).

---

## 2. Stripe Accounts

| Field | Test Account | Live Account |
|-------|--------------|--------------|
| **Stripe Dashboard URL** | [https://dashboard.stripe.com/test/dashboard](https://dashboard.stripe.com/test/dashboard) | [https://dashboard.stripe.com/dashboard](https://dashboard.stripe.com/dashboard) |
| **Account ID** | TBD | TBD |
| **Account Owner** | TBD | TBD |
| **Business Name** | TBD | TBD |
| **Business Information** | TBD | TBD |
| **Support Contact (IMMIFIN)** | TBD | TBD |
| **Status** | **Pending PO setup** — see [§13](#13-s7-setup-001-test-mode-setup-procedure) | Not configured |

### Notes

- **S7-SETUP-001 (2026-07-11):** No `STRIPE_SECRET_KEY` in local environment; Stripe CLI not installed. Catalog creation requires Product Owner action in Stripe Dashboard (procedure below).
- Create and validate the **Test account** first (task **S7-SETUP-001**).
- Live account activation requires Product Owner approval and completion of the [§9 Production Checklist](#9-production-checklist).
- Record account IDs here after setup; never store API keys in this document.

---

## 3. Stripe Products

Approved paid products for Beta launch. Free tier has no Stripe Product.

| Product Name | IMMIFIN Plan | Stripe Product ID (Test) | Stripe Product ID (Live) | Status |
|--------------|--------------|----------------------------|--------------------------|--------|
| **IMMIFIN Pro** | `pro` | TBD | TBD | **Pending** — S7-SETUP-001 |
| **IMMIFIN Power** | `power` | TBD | TBD | **Pending** — S7-SETUP-001 |

### Notes

- Product names should be consistent between Test and Live modes.
- Each product may have multiple Prices (monthly and annual).
- Product access tier mapping is defined in [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md §2](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md#2-commercial-pricing).

---

## 4. Stripe Prices

Approved launch pricing (USD). Price IDs are recorded after Dashboard creation.

| Price Label | Amount | Billing Interval | IMMIFIN Plan | Price ID (Test) | Price ID (Live) | Status |
|-------------|--------|------------------|--------------|-----------------|-----------------|--------|
| **Pro Monthly** | $9.99 | Monthly | `pro` | TBD | TBD | **Pending** — S7-SETUP-001 |
| **Pro Annual** | $99.00 | Annual | `pro` | TBD | TBD | **Pending** — S7-SETUP-001 |
| **Power Monthly** | $19.99 | Monthly | `power` | TBD | TBD | **Pending** — S7-SETUP-001 |
| **Power Annual** | $199.00 | Annual | `power` | TBD | TBD | **Pending** — S7-SETUP-001 |

### Notes

- Beta launch excludes coupons, promotions, and free trials (see design doc).
- Billing interval is a Stripe/billing concern; product access uses the tier (`pro` / `power`), not the interval.
- Application code validates against an approved server-side price catalog — never trust browser-supplied Price IDs.

---

## 5. Environment Configuration

Secrets are stored in environment configuration only. **Never commit actual key values to Git.**

### Secret inventory

| Variable | Purpose | Exposure |
|----------|---------|----------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe.js (if used) | Public — Test or Live per environment |
| `STRIPE_SECRET_KEY` | Server-side Stripe API calls | **Server only** — never `NEXT_PUBLIC_` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | **Server only** |
| `STRIPE_PRICE_PRO_MONTHLY_*` | Approved Pro monthly Price ID | **Server only** |
| `STRIPE_PRICE_PRO_ANNUAL_*` | Approved Pro annual Price ID | **Server only** |
| `STRIPE_PRICE_POWER_MONTHLY_*` | Approved Power monthly Price ID | **Server only** |
| `STRIPE_PRICE_POWER_ANNUAL_*` | Approved Power annual Price ID | **Server only** |

Suffix convention for Price ID variables: `_TEST` for Test mode, `_LIVE` for Live mode (exact names finalized during implementation).

### Environment matrix

| Environment | Publishable Key | Secret Key | Webhook Secret | Price IDs | Status |
|-------------|-----------------|------------|----------------|-----------|--------|
| **Localhost** (`.env.local`) | TBD (Test) | TBD (Test) | TBD (Test — Stripe CLI or tunnel) | TBD (Test) | Not configured |
| **Dev tunnel** (`dev.immifin.com`) | TBD (Test) | TBD (Test) | TBD (Test) | TBD (Test) | Not configured |
| **Cloudflare Preview** | TBD (Test) | TBD (Test) | TBD (Test) | TBD (Test) | Not configured |
| **Cloudflare Production** | TBD (Live) | TBD (Live) | TBD (Live) | TBD (Live) | Not configured |

### Where secrets are stored

| Location | Used for | Notes |
|----------|----------|-------|
| `.env.local` | Local development | Gitignored — see [.env.example](../.env.example) |
| `.dev.vars` | Local Cloudflare Workers preview | Gitignored |
| **Cloudflare Dashboard** → Workers → Settings → Variables | Preview and Production | Set per environment; never commit |

See [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) for local dev and tunnel workflow. See [DEPLOYMENT.md](./DEPLOYMENT.md) for Cloudflare deployment.

---

## 6. Webhook Configuration

IMMIFIN activates subscriptions **only** through signature-verified Stripe webhooks. See [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md §6–§10](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md).

### Webhook endpoints (planned)

| Environment | Endpoint URL | Signing Secret | Status |
|-------------|----------------|----------------|--------|
| **Local (Stripe CLI)** | Forward to `http://localhost:3000/api/webhooks/stripe` or tunnel URL | TBD (CLI-generated) | Not configured |
| **Dev tunnel** | `https://dev.immifin.com/api/webhooks/stripe` | TBD (Test) | Not configured |
| **Cloudflare Preview** | TBD | TBD (Test) | Not configured |
| **Cloudflare Production** | TBD (e.g. `https://immifin.com/api/webhooks/stripe`) | TBD (Live) | Not configured |

### Events to enable

Minimum recommended events (see architecture review S7-ARCH-001):

| Event | Purpose |
|-------|---------|
| `checkout.session.completed` | Link customer and subscription after Checkout |
| `customer.subscription.created` | New paid subscription |
| `customer.subscription.updated` | Plan changes, renewals, past_due, cancel-at-period-end |
| `customer.subscription.deleted` | Subscription ended |
| `invoice.paid` | Renewal confirmation (supplementary) |
| `invoice.payment_failed` | Payment failure / past_due signal |

### Local webhook testing

1. Ensure Cloudflare dev tunnel is healthy (see [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md)).
2. Use Stripe CLI to forward events to the local or tunnel webhook URL.
3. Verify signature verification and idempotent processing in application logs.

**Do not store webhook signing secrets in this document.**

---

## 7. Customer Portal Configuration

IMMIFIN uses **Stripe Customer Portal** for self-serve billing management. Architecture and rationale: [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md §8](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md#8-billing-portal).

| Field | Test Mode | Live Mode |
|-------|-----------|-----------|
| **Status** | **Pending** — enable per [§13](#13-s7-setup-001-test-mode-setup-procedure) Step 11 | Not configured |
| **Date configured** | TBD | TBD |
| **Portal Settings** | Customer self-serve billing (Beta) | TBD |
| **Allowed Operations** | Update payment method · View invoices · Download invoices · Cancel subscription | TBD |
| **Disabled Operations** | Plan switching (Pro↔Power) · Interval switching (monthly↔annual) · Upgrade/downgrade | TBD |
| **Return URL** | TBD — recommend `https://dev.immifin.com/account` after tunnel is live | TBD (e.g. `https://immifin.com/account`) |

### Notes

- **S7-SETUP-001 intended Test Mode Portal policy:** Enable payment method updates, invoice view/download, and subscription cancellation. **Disable** plan and interval switching until Product Owner approves (Open Decision in design doc).
- Portal return URLs are **UX only** — subscription changes are applied via webhooks, not portal redirects.
- Record final Portal configuration and return URL here after Product Owner completes Dashboard setup.

---

## 8. Test Cards

Use **official Stripe test cards** for all Test Mode payment validation. Do not copy card numbers into this repository.

| Resource | URL |
|----------|-----|
| **Stripe Testing documentation** | [https://docs.stripe.com/testing](https://docs.stripe.com/testing) |
| **Test card numbers reference** | [https://docs.stripe.com/testing#cards](https://docs.stripe.com/testing#cards) |

### Recommended test scenarios

| Scenario | Reference |
|----------|-----------|
| Successful payment | Stripe docs — standard test Visa |
| Declined payment | Stripe docs — card declined test number |
| Authentication required (3D Secure) | Stripe docs — 3D Secure test cards |
| Insufficient funds | Stripe docs — insufficient funds test number |

Record any IMMIFIN-specific test procedures (Checkout flow, Portal cancel, past_due simulation) in the [§10 Operational Change Log](#10-operational-change-log) after validation.

---

## 9. Production Checklist

Complete before enabling Live Mode billing for customers.

### Stripe Dashboard (Live)

- [ ] Live Stripe account verified and business information complete
- [ ] **Products** — IMMIFIN Pro and IMMIFIN Power created in Live mode
- [ ] **Prices** — Pro Monthly ($9.99), Pro Annual ($99), Power Monthly ($19.99), Power Annual ($199) created in Live mode
- [ ] Product and Price IDs recorded in [§3](#3-stripe-products) and [§4](#4-stripe-prices) of this runbook
- [ ] **Webhook** — Live endpoint registered; signing secret stored in Cloudflare Production variables
- [ ] **Webhook events** — Minimum event set enabled (see [§6](#6-webhook-configuration))
- [ ] **Customer Portal** — Live Portal configured; allowed operations approved by Product Owner
- [ ] **Portal return URL** — Production account URL configured

### Application and infrastructure

- [ ] Live `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` set in Cloudflare Production (not committed)
- [ ] Live Price ID environment variables set (server-only)
- [ ] Live `STRIPE_WEBHOOK_SECRET` set in Cloudflare Production
- [ ] `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE` **unset or false** in Production
- [ ] Development Subscription PATCH route blocked or inert for non-Stripe paths in Production
- [ ] Database migration applied (Stripe customer/subscription fields, event ledger)
- [ ] Application deployed to Cloudflare Production with Stripe integration enabled

### Validation

- [ ] **Test Payment** — End-to-end Test Mode Checkout completed successfully (separate from Live)
- [ ] **Live smoke test** — Single controlled Live Mode transaction with immediate refund (if approved)
- [ ] **Production Verification** — Webhook received and subscription synced in Supabase
- [ ] **Capability verification** — Paid plan unlocks expected Pro/Power features
- [ ] **Portal verification** — Manage billing link opens Live Portal for test customer
- [ ] **Notification check** — No unintended billing emails; product notifications wired separately if approved

### Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Product Owner | TBD | TBD | |
| Engineering | TBD | TBD | |

---

## 10. Operational Change Log

Record Stripe Dashboard, webhook, portal, and environment changes here.

| Date | Change | Environment | Author | Notes |
|------|--------|-------------|--------|-------|
| 2026-07-11 | S7-SETUP-001 initiated — Test Mode setup procedure documented; catalog IDs pending PO Dashboard action | Test | Engineering | No Stripe API key in repo; Stripe CLI not installed |

---

## 11. Security Rules

| Rule | Detail |
|------|--------|
| **Never commit Stripe secrets** | API keys, webhook signing secrets, and Price IDs for Live mode must not appear in Git, PRs, or this runbook |
| **Never store webhook secrets in Git** | Use `.env.local`, `.dev.vars`, or Cloudflare Dashboard variables only |
| **Never expose secret keys to browser code** | Only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` may be client-accessible; `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-only |
| **Rotate secrets if compromised** | Roll keys in Stripe Dashboard; update all environment stores; re-register webhook endpoints if needed; document in [§10](#10-operational-change-log) |
| **Validate webhooks always** | Reject unsigned or invalid `Stripe-Signature` payloads |
| **No browser-authoritative billing** | Checkout success URLs and Portal returns do not activate subscriptions — webhooks only |
| **Least privilege in logs** | Log event IDs and profile IDs; do not log card numbers, full customer PII, or secret values |

See also [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md §10](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md#10-security-principles).

---

## 12. References

| Document | Purpose |
|----------|---------|
| [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) | **Architecture source of truth** — pricing, checkout flow, webhooks, portal, capability integration |
| [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) | Tier definitions, capability map, commercial positioning |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Infrastructure, Cloudflare Workers, Clerk, Supabase |
| [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) | Local dev, Cloudflare tunnel, webhook testing workflow |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Cloudflare deployment and environment variables |
| [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) | Master documentation index |
| [Stripe Documentation](https://docs.stripe.com/) | Official Stripe API, Dashboard, and testing reference |

---

## 13. S7-SETUP-001 Test Mode Setup Procedure

**Task:** S7-SETUP-001 — Stripe Test Account Configuration and Product Catalog Setup  
**Scope:** Stripe Dashboard only — Test Mode. No application code, env vars, or Live Mode.

Complete this procedure in the [Stripe Test Dashboard](https://dashboard.stripe.com/test/dashboard). After each step, copy Product and Price IDs into [§3](#3-stripe-products) and [§4](#4-stripe-prices) above.

### Prerequisites

1. Stripe account exists ([sign up](https://dashboard.stripe.com/register) if needed).
2. **Test Mode** toggle is ON (top-right of Dashboard — orange **Test mode** badge).
3. Business profile reviewed: **Settings** → **Business** → confirm business name and support details.

### Step 1 — Verify account readiness

| Check | Dashboard path |
|-------|----------------|
| Test Mode enabled | Toggle in top-right corner |
| Account accessible | [https://dashboard.stripe.com/test/dashboard](https://dashboard.stripe.com/test/dashboard) |
| Account ID | **Settings** → **Account** → copy Account ID → record in [§2](#2-stripe-accounts) |

### Step 2 — Create product: IMMIFIN Pro

1. **Product catalog** → **Products** → **Add product**
2. Name: **IMMIFIN Pro**
3. Description (optional): *Automation for your immigration journey.*
4. Save product → copy **Product ID** (`prod_…`) → [§3](#3-stripe-products)

### Step 3 — Create prices for IMMIFIN Pro

On the IMMIFIN Pro product page, add two prices:

| Price | Amount | Billing | Action |
|-------|--------|---------|--------|
| Pro Monthly | $9.99 USD | Recurring · Monthly | Add price → copy `price_…` |
| Pro Annual | $99.00 USD | Recurring · Yearly | Add price → copy `price_…` |

### Step 4 — Create product: IMMIFIN Power

1. **Products** → **Add product**
2. Name: **IMMIFIN Power**
3. Description (optional): *Full intelligence for life in America.*
4. Save → copy **Product ID** → [§3](#3-stripe-products)

### Step 5 — Create prices for IMMIFIN Power

| Price | Amount | Billing | Action |
|-------|--------|---------|--------|
| Power Monthly | $19.99 USD | Recurring · Monthly | Add price → copy `price_…` |
| Power Annual | $199.00 USD | Recurring · Yearly | Add price → copy `price_…` |

### Step 6 — Verify catalog

Confirm exactly:

- **2 products** — IMMIFIN Pro, IMMIFIN Power
- **4 prices** — Pro Monthly, Pro Annual, Power Monthly, Power Annual
- All prices in **USD**, **recurring**, correct amounts per [§4](#4-stripe-prices)

### Step 7 — Enable Customer Portal (Test Mode)

1. **Settings** → **Billing** → **Customer portal**
2. **Activate** the portal for Test Mode (if not already active)
3. Configure **Functionality**:

| Setting | S7-SETUP-001 policy |
|---------|---------------------|
| Update payment methods | **Enable** |
| View invoice history | **Enable** |
| Download invoices | **Enable** |
| Cancel subscriptions | **Enable** |
| Switch plans (upgrade/downgrade) | **Disable** |
| Switch products | **Disable** |
| Update subscription quantities | **Disable** (single-seat SaaS) |

4. **Return link** — set default return URL to `https://dev.immifin.com/account` (or `http://localhost:3000/account` until tunnel is used)
5. Save configuration → update [§7](#7-customer-portal-configuration) status to **Configured**

### Step 8 — Record IDs in this runbook

Update these sections (IDs only — **never** API keys or webhook secrets):

- [§2](#2-stripe-accounts) — Account ID, status → **Configured (Test)**
- [§3](#3-stripe-products) — Both Product IDs (Test column)
- [§4](#4-stripe-prices) — All four Price IDs (Test column)
- [§7](#7-customer-portal-configuration) — Status, date configured, return URL
- [§10](#10-operational-change-log) — Row noting catalog + portal configured

### Step 9 — Post-setup verification

- [ ] Test Mode badge visible in Dashboard
- [ ] 2 products listed under **Products**
- [ ] 4 recurring prices with correct USD amounts
- [ ] Customer Portal active with cancellation enabled; plan switching disabled
- [ ] All IDs recorded in this document
- [ ] No API keys committed to Git

### Configuration notes (S7-SETUP-001)

- Approved pricing per [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md): Pro $9.99/mo · $99/yr; Power $19.99/mo · $199/yr.
- Beta excludes coupons, promotions, and free trials.
- Webhook endpoints and API keys are **out of scope** for S7-SETUP-001 — handled in **S7-SETUP-002**.
- Optional: install [Stripe CLI](https://docs.stripe.com/stripe-cli) for later webhook forwarding during implementation.

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-11 | S7-DOC-002 | Initial Stripe Operations Runbook |
| v1.1 | 2026-07-11 | S7-SETUP-001 | Test Mode setup procedure; pending PO Dashboard catalog configuration |
