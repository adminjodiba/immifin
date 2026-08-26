# IMMIFIN Billing Architecture

| Field | Value |
|-------|-------|
| **Version** | 1.0 (Beta) |
| **Status** | **Approved** |
| **Owner** | IMMIFIN Engineering |
| **Sprint** | Sprint 7 |
| **Task** | S7-DOC-002 |
| **Decision ID** | ADR-001 |

> **Authority:** This document is the **Architecture Decision Record (ADR)** and source of truth for billing-related development. It defines ownership boundaries between IMMIFIN and Stripe. Commercial policy details live in [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md). Platform design lives in [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md).

**Related:** [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md) · [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md) · [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)

---

## Purpose

Define the ownership boundaries between IMMIFIN and Stripe.

- **IMMIFIN** owns the business rules.
- **Stripe** owns payment processing.

---

## Architecture Principle

### Golden Rule

**Stripe manages money. IMMIFIN manages business policy.**

This principle must always be preserved.

Business decisions should never rely solely on Stripe configuration.

---

## High Level Architecture

```text
Customer
  ↓
IMMIFIN Application
  ↓
Billing Rules Engine
  ↓
Stripe API
  ↓
Stripe Billing
  ↓
Webhook
  ↓
IMMIFIN Database
```

---

## IMMIFIN Responsibilities

IMMIFIN owns:

- Subscription Business Rules
- Upgrade Logic
- Downgrade Logic
- Feature Gating
- User Permissions
- Subscription Status
- Renewal Rules
- Cancellation Policy
- Billing Cycle Rules
- Product Entitlements
- Account Experience

---

## Stripe Responsibilities

Stripe owns:

- Checkout
- Payment Processing
- Subscription Objects
- Customer Objects
- Payment Methods
- Invoices
- Invoice History
- Receipts
- Webhooks
- Payment Security

---

## Billing Rules Engine

The **Billing Rules Engine** is implemented inside IMMIFIN.

Every subscription request must pass through IMMIFIN before communicating with Stripe.

Stripe should never become the source of business decisions.

Implementation note: the engine evaluates [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md), resolves the user's current entitlement state from Supabase, and only then issues Stripe API calls (Checkout, subscription updates, cancellation scheduling).

### Billing Center + Pricing action authority (BLP-BILL-FIX-001 / REV1)

| Effective plan | Stripe paid sub? | Billing Center | Pricing Current Plan |
|----------------|------------------|----------------|----------------------|
| Free | No | Checkout → Pro / Power | Free (tier) |
| Pro / Power (Dev simulated) | No | None (not Checkout); Dev Mode switchers | Tier card current + Development plan override (no Monthly/Annual ownership) |
| Pro + Stripe | Yes | Paid change actions (e.g. upgrade to Power) | Pro + matching interval |
| Power + Stripe | Yes | Approved Power billing actions only | Power + matching interval |

Checkout remains reserved for **new** paid subscriptions from Free. Do not route simulated paid entitlements through Checkout. Real paid Current Plan matching stays **tier + interval**.

**Post-Checkout activation (S7-BILLING-UX-008A):** Pricing may poll `GET /api/account/subscription` after Checkout success, but only after Clerk auth is ready. Entitlement is never granted from the success redirect alone — webhook→Supabase sync remains authoritative.

**Scheduled paid-plan visibility (S7-BILLING-UX-008B):** Billing Center reads the attached Stripe Subscription Schedule on GET (retrieve only). Next-phase approved catalog prices are shown as a customer-safe destination (tier, interval, Stripe effective date). Duplicate equivalent CTAs are suppressed. Current entitlement still comes from webhook-synced current items. **Not Production-deployed.**

**Replace scheduled paid destination with Free (S7-BILLING-UX-008C):** An existing scheduled paid-plan transition may be replaced by Free only after explicit customer confirmation. IMMIFIN does not attach `cancel_at_period_end` to a subscription that still has a paid next phase. The execute path **releases** the attached schedule (current plan remains) and then sets `cancel_at_period_end`. If release succeeds and cancel fails, current entitlement is unchanged; the customer retries Free scheduling. Webhooks remain entitlement authority. GET also reads live Stripe `cancel_at_period_end` from the same retrieve used for schedule visibility. **TEST replacement was executed once by the Product Owner; 008E reconciled Power-now / Free-later. Not Production-deployed.**

### Development Subscription Mode eligibility (BLP-BILL-DEV-001 / FIX-002)

Dev plan simulation is limited to **one** configured local Clerk user:

1. `NODE_ENV !== "production"`
2. `IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE=true`
3. `IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID` set (trimmed non-empty)
4. Authenticated `clerk_user_id` equals that configured ID

**Entitlement (BLP-BILL-DEV-FIX-002):** `resolveSubscriptionEntitlement` — when eligible, stored simulated `subscription.plan` / `profile.plan` is authoritative even if historical `stripe_status` is canceled. `getEffectivePlan` stays production-pure (canceled → Free). Stripe IDs are not cleared.

All other users (including the same Clerk account in production) use normal Stripe/subscription authority. See [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md).

---

## Customer Portal Strategy

### Stripe Customer Portal is used ONLY for

- Update Payment Method
- View Invoice History
- Download Invoices

### IMMIFIN manages

- Upgrade Plan
- Downgrade Plan
- Change Billing Cycle
- Cancel Subscription
- Renewal Scheduling
- Feature Availability

Plan and lifecycle changes remain **in-app** flows backed by the Billing Rules Engine — not Stripe Portal configuration alone.

**S7-BILLING-UX-005 (code):** During paid upgrade confirmation, IMMIFIN opens a Stripe-hosted **payment_method_update** Billing Portal session using a narrow API-managed configuration (PM update only). IMMIFIN never handles raw card details. Returning from Stripe invalidates the prior upgrade preview and requires a fresh preview + explicit confirmation. Full invoice history / standalone portal panel remain deferred. **Not Production-deployed.**

---

## Upgrade Policy

| Transition | Effective | Billing |
|------------|-----------|---------|
| Monthly → Higher Monthly | Immediate | Stripe Proration |
| Monthly → Annual | Immediate | Stripe Proration |
| Annual → Higher Annual | Immediate | Stripe Proration |

See [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md) for examples and rationale.

---

## Downgrade Policy

| Transition | Effective | Refund |
|------------|-----------|--------|
| Higher Monthly → Lower Monthly | Next Billing Cycle | No Refund |
| Higher Annual → Lower Annual | Next Renewal | No Refund |
| Annual → Monthly | Next Renewal | No Refund |

---

## Cancellation Policy

Customers may cancel at any time.

| | |
|---|---|
| **Effective** | End of current billing period |
| **Immediate cancellation** | Not allowed |
| **Automatic refunds** | Not allowed |

---

## Free Plan Strategy

The **Free** plan is **not** represented inside Stripe.

Free users:

- Have no Stripe Customer
- Have no Stripe Subscription
- Have no Payment Method
- Are managed entirely by IMMIFIN

Stripe customers are created **only** when a user purchases Pro or Power.

---

## Subscription Products

Stripe contains only:

### IMMIFIN Pro

- Monthly
- Annual

### IMMIFIN Power

- Monthly
- Annual

**No Stripe Free product.**

---

## Design Principles

1. Keep billing simple.
2. Avoid refund complexity.
3. Reward upgrades immediately.
4. Protect customer value.
5. Never remove paid access early.
6. Keep the user experience inside IMMIFIN.
7. Minimize dependency on Stripe-specific business behavior.

---

## Future Enhancements

Reserved for future releases:

- **S7-BILLING-UX-001** — Transparent Upgrade / Downgrade Billing Confirmation (architecture audit complete)
- **S7-BILLING-UX-002** — **Done** — read-only Stripe upgrade preview foundation
- **S7-BILLING-UX-003** — **Done (code)** — charge-now execution (`always_invoice` + `pending_if_incomplete`), signed preview authorization, SCA via hosted invoice URL / client_secret; entitlement gated by pending_update-safe sync. **Not Production-deployed.**
- **S7-BILLING-UX-004** — **Done (code)** — masked payment method on upgrade preview/confirmation. **Not Production-deployed.**
- **S7-BILLING-UX-005** — **Done (code)** — Stripe-hosted change/add payment method during upgrade confirmation; return forces fresh preview. **Not Production-deployed.**
- **S7-BILLING-UX-006** — **Done (code)** — Transparent immediate-upgrade confirmation (preview-first Stripe amounts + PM + timing). **Not Production-deployed.**
- **S7-BILLING-UX-007** — **Done (code)** — Scheduled downgrade transparency (no charge today + period-end retention). **Not Production-deployed.**
- **S7-BILLING-UX-008B** — **Done (code)** — Scheduled paid-plan visibility + duplicate CTA suppression. **Not Production-deployed.**
- **S7-BILLING-UX-008C** — **Done (code + TEST)** — Replace existing scheduled paid destination with Free after confirmation (`release` then `cancel_at_period_end`). Product Owner executed Replace With Free once; **008E** reconciled. **Not Production-deployed.**
- **S7-BILLING-UX-008D** — **Done (code)** — Visual redesign of the 008C replacement confirmation dialog. Presentation only. **Not Production-deployed.**
- **S7-BILLING-UX-008E** — **Done (TEST E2E)** — Full Stripe TEST lifecycle reconciliation. **TEST validated. Not Production-deployed.**
- Team Plans
- HR Plans
- Enterprise Billing
- Seat Licensing
- Quantity Management
- Promotional Coupons
- Referral Credits
- Corporate Invoicing

---

## Architecture Decision

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-001 |
| **Decision** | IMMIFIN owns billing policy. Stripe owns payment execution. |
| **Scope** | All future billing implementations |

### Consequences

- All subscription mutations flow through IMMIFIN's Billing Rules Engine before Stripe API calls.
- Webhooks update trusted subscription state in Supabase; capabilities remain the feature gate.
- Stripe Customer Portal is limited to payment-method and invoice self-service.
- Free-tier users exist only in IMMIFIN until first paid purchase.
- Proration **amounts** and payment-method presentation for customer confirmation should use Stripe-authoritative preview / hosted PM flows; IMMIFIN must not invent proration math when Stripe preview exists.
- **S7-BILLING-UX-002** provides read-only `POST /api/stripe/subscription/preview` modeling invoice-now (`always_invoice`).
- **S7-BILLING-UX-003** (code) aligns `executeImmediateUpgrade` to invoice-now with signed preview authorization; Production deploy is separate.

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| 1.0 (Beta) | 2026-07-12 | S7-DOC-002 | Initial approved billing architecture and ownership model |
| 1.1 | 2026-08-24 | S7-OPS-STRIPE-034 | Note S7-BILLING-UX-001; Stripe-authoritative preview for confirmation UX |
| 1.2 | 2026-08-24 | S7-BILLING-UX-002 | Preview foundation endpoint; invoice-now modeled in preview only |
| 1.3 | 2026-08-24 | S7-BILLING-UX-003 | Charge-now execution + preview auth + pending_update-safe sync (not Production-deployed) |
| 1.4 | 2026-08-24 | S7-BILLING-UX-004 | Masked payment method on upgrade preview (not Production-deployed) |
| 1.5 | 2026-08-24 | S7-BILLING-UX-005 | Stripe-hosted change/add payment method during upgrade confirmation (not Production-deployed) |
| 1.6 | 2026-08-24 | S7-BILLING-UX-006 | Transparent immediate-upgrade confirmation (not Production-deployed) |
| 1.7 | 2026-08-24 | S7-BILLING-UX-007 | Scheduled downgrade transparency (not Production-deployed) |
| 1.8 | 2026-08-25 | S7-BILLING-UX-008E | Full Stripe TEST E2E PASS — Power now / Free at period end (not Production-deployed) |
