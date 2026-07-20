# IMMIFIN Stripe Subscription Platform Design

| Field | Value |
|-------|-------|
| **Document** | Stripe Subscription Platform Design |
| **Task** | S7-DOC-006 (as-built update; original S7-DOC-001) |
| **Version** | v2.0 |
| **Sprint** | Sprint 7 — Commercial Platform |
| **Status** | **As-Built** — application implementation complete; Live Stripe validation pending |
| **Created** | 2026-07-11 |
| **Last Updated** | 2026-07-20 |
| **Owner** | Product Strategy / Technical Architecture |
| **Handoff** | [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) |

> **Authority:** This document is the **as-built functional/technical design** for the IMMIFIN Stripe Subscription Platform after Sprint 7. Prefer the codebase and [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) over earlier planning language. Commercial policy details: [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md). Ownership ADR: [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md).

**Related:** [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md) · [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md) · [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md) · [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) · [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) · [architecture/ADR-007-Development-Subscription-Mode.md](./architecture/ADR-007-Development-Subscription-Mode.md)

---

## 1. Platform Overview

### Purpose

The Stripe Subscription Platform lets IMMIFIN accept real payments for Pro and Power while keeping the existing Free / Pro / Power **capability model** as the authorization layer.

IMMIFIN already delivers Pro/Power value (Personalized Dashboard, Monthly Immigration Updates, Visa Bulletin History / Movement). This platform enables customers to **pay for that value**.

### Ownership (as-built)

| Owner | Manages |
|-------|---------|
| **IMMIFIN** | Plans, capabilities, business rules, subscription lifecycle policy, authorization, Pricing UX, Billing Center plan changes |
| **Stripe** | Checkout payment collection, payment processing, billing objects, invoices, customer records, renewals, webhook delivery |

```text
Stripe owns money.
IMMIFIN owns access and subscription policy.
```

### Goals (delivered in application code)

| Goal | Description | Status |
|------|-------------|--------|
| **Monetize** | Accept payments for Pro and Power via Checkout | ✅ Implemented |
| **Preserve architecture** | Webhooks sync billing state; capabilities remain the product gate | ✅ Implemented |
| **Trust** | Only verified Stripe webhooks activate or change paid access | ✅ Implemented |
| **Operations** | Customers manage **plans** in IMMIFIN Billing Center | ✅ Implemented |
| **Sunset path** | Development Subscription Mode remains until Live cutover gate | ⏳ Pending validation |

### Deliverables (Sprint 7 — as-built)

| Deliverable | Status |
|-------------|--------|
| Design + billing ADR / policy | ✅ Complete |
| Checkout Session API + Pricing CTAs | ✅ Implemented |
| Customer mapping (one customer per profile) | ✅ Implemented |
| Webhook ledger + billing-state sync | ✅ Implemented |
| Subscription change API (upgrade / downgrade / interval / cancel) | ✅ Implemented |
| Billing Center (`/account/billing`) | ✅ Implemented |
| Capability enforcement helpers + premium UI gates | ✅ Implemented |
| Stripe Customer Portal (payment method / invoices) | ⏳ Deferred |
| Live Stripe / production commercial cutover | ⏳ Pending validation |

### Business objectives

| Objective | How the platform supports it |
|-----------|------------------------------|
| Sustainable SaaS revenue | Recurring Pro / Power subscriptions via Stripe |
| Clear upgrade path | Pricing → Checkout → webhook sync → capabilities |
| Self-serve plan management | Billing Center for upgrade / downgrade / interval / cancel-to-free |
| Protect product integrity | Never activate Pro/Power from a browser redirect alone |
| Preserve Notification Platform value | Paid Pro/Power continue to use existing Notification Platform gates |

### Explicit non-goals (Sprint 7)

- Redesigning Free / Pro / Power capabilities
- Modifying Notification Platform architecture
- Coupons, promotions, or free trials (Beta)
- Making Stripe Customer Portal the primary plan-management UX
- Enterprise / Business tier sales motion
- Finance / Insurance / AI feature expansion

---

## 2. Commercial Pricing

### Approved launch pricing (Beta)

| Tier | Monthly | Annual |
|------|---------|--------|
| **Free** | **$0** | — |
| **Pro** | **$9.99 / month** | **$99.99 / year** |
| **Power** | **$19.99 / month** | **$199.99 / year** |

Currency for Beta launch: **USD** (unless Product Owner later approves additional currencies).

### Why annual plans exist

| Reason | Detail |
|--------|--------|
| **Lower effective monthly cost** | Rewards committed subscribers |
| **Cash-flow predictability** | Annual prepaid revenue for the business |
| **Reduced churn friction** | Fewer monthly cancel decision points |
| **Choice** | Some users prefer monthly flexibility; others prefer annual savings |

Exact annual discount messaging on `/pricing` is a UX detail; the approved prices above are the commercial source of truth.

### Beta commercial constraints

During Beta, IMMIFIN launches **without**:

- Coupons
- Promotions / discount codes
- Free trials

Any future coupon, promotion, or trial requires Product Owner approval and a revision to this document and [BUSINESS_MODEL.md](./BUSINESS_MODEL.md).

### Price ↔ product mapping

Stripe Products / Prices are configured in the Stripe Dashboard (test then live). IMMIFIN resolves approved Price IDs from environment configuration (never from the browser) and maps each Price to:

| Stripe Price | IMMIFIN `plan` |
|--------------|----------------|
| Pro monthly | `pro` |
| Pro annual | `pro` |
| Power monthly | `power` |
| Power annual | `power` |

Billing interval (month vs year) is a **billing concern**. Product access remains the **tier** (`pro` / `power`), not the interval.

---

## 3. Product Positioning

### What IMMIFIN is not selling

IMMIFIN is **not** selling raw Visa Bulletin data.

Public bulletin information remains available as part of Free exploration (current bulletin surfaces). Paid tiers do not charge for “access to USCIS data.”

### What IMMIFIN sells

| Value | Tier emphasis |
|-------|----------------|
| **Personalization** | Pro / Power — saved profile, journey-aware dashboard |
| **Automation** | Pro / Power — tracking, alerts, Monthly Immigration Updates |
| **Immigration journey tracking** | Pro / Power — employment + Green Card / citizenship journeys |
| **Peace of mind** | Pro / Power — less manual monthly monitoring |
| **Decision support** | Pro / Power — status, movement, timeline meaning |
| **AI assistance** | Power — intelligent recommendations and assistant (roadmap) |

Positioning aligns with [PRODUCT_VISION.md](./PRODUCT_VISION.md) and [BUSINESS_MODEL.md](./BUSINESS_MODEL.md):

> **Free = Information · Pro = Automation · Power = Intelligence**

---

## 4. Stripe Responsibilities

Stripe owns the **money plane**:

| Responsibility | Detail |
|----------------|--------|
| **Payments** | Card (and Stripe-supported methods) processing |
| **Checkout** | Hosted Checkout Session UX and PCI-sensitive collection |
| **Billing** | Recurring subscription invoices and collection attempts |
| **Renewals** | Automatic renewal per subscription schedule |
| **Invoices** | Invoice generation and invoice objects |
| **Payment methods** | Storage of payment instruments |
| **Customer records** | Stripe Customer objects |
| **Webhook delivery** | Signed events to IMMIFIN |
| **Subscription billing objects** | Stripe-side status (`active`, `past_due`, `canceled`, etc.) |

IMMIFIN must not reimplement payment capture or store raw card data.

Stripe Customer Portal is **not** the primary IMMIFIN subscription UX (see §8 and §11).

---

## 5. IMMIFIN Responsibilities

IMMIFIN owns the **product, policy, and access stack**:

| Responsibility | Detail |
|----------------|--------|
| **Authentication** | Clerk — signup, login, sessions |
| **User profiles** | Supabase profiles + immigration data |
| **Plans & capabilities** | Free / Pro / Power capability map — authorization source of truth |
| **Business rules** | Upgrade / downgrade / interval / cancel policy ([STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md)) |
| **Subscription lifecycle orchestration** | Billing Center + subscription-change APIs (not Portal-driven plan changes) |
| **Subscription synchronization** | Map verified Stripe events → billing state (`plan`, Stripe IDs, periods, status) |
| **Authorization** | Capability helpers + premium UI gates |
| **User experience** | Pricing CTAs, Checkout handoff, Billing Center, success/cancel UX only |

### Integration principle

```text
Stripe owns money.
IMMIFIN owns access and subscription policy.
```

Stripe never decides feature gates directly. IMMIFIN never activates paid access from an untrusted browser callback alone.

---

## 6. Checkout Design

### Canonical flow

```text
Pricing (`/pricing`)
  ↓
Checkout Session (server — tier + interval only from browser)
  ↓
Stripe Checkout (hosted)
  ↓
Return to Pricing (success / cancelled — UX only)
  ↓
Webhook (signed)
  ↓
Subscription Sync → Supabase billing state
  ↓
Capability Sync → Application Access
```

### Step detail

| Step | Owner | Behavior |
|------|-------|----------|
| 1. Pricing | IMMIFIN | User selects Pro or Power, monthly or annual |
| 2. Start Checkout | IMMIFIN server | Authenticated user; resolve approved Price ID; `getOrCreateStripeCustomer`; create Checkout Session with `customer` |
| 3. Redirect to Stripe | Browser | User pays on Stripe-hosted page |
| 4. Return URL | Browser | Success / cancel query on `/pricing` — **UX only** |
| 5. Webhook | Stripe → IMMIFIN | Verified events (see §10) |
| 6. Sync | IMMIFIN | Durable claim; synchronize subscription billing state |
| 7. Access | IMMIFIN | Effective tier → capabilities unlock features |

### Success, cancellation, and errors

| Outcome | Behavior |
|---------|----------|
| **Success return** | User returns to Pricing with success UX; access refreshes after webhook sync |
| **Cancellation return** | User returns to Pricing; remains on current plan (typically Free for new Checkout) |
| **Checkout create errors** | Server rejects unauthenticated / invalid tier-interval / misconfigured Price catalog; client shows non-secret error messaging |

### Critical rule — browser redirects never activate subscriptions

| Allowed | Forbidden |
|---------|-----------|
| Success UX + re-fetch plan after webhook | Setting paid `plan` because the user landed on a success URL |
| Cancel return to Pricing | Trusting client-posted “I paid” payloads |
| Waiting for webhook-authoritative sync | Activating access from Checkout Session ID alone without webhook verification |

**Only Stripe webhooks (signature-verified) activate or change paid subscriptions.**

---

## 7. Subscription Lifecycle

### Implemented lifecycle (happy path)

```text
Free
  ↓
Checkout
  ↓
Stripe
  ↓
Webhook
  ↓
Subscription Sync
  ↓
Capability Sync
  ↓
Billing Center (ongoing plan management)
  ↓
Premium Access
```

### Lifecycle behaviors (as implemented)

| Behavior | Implemented design |
|----------|--------------------|
| **New paid subscription** | Free → Checkout → webhook sync → Pro/Power capabilities |
| **Upgrade** | Billing Center → subscription-change API → immediate upgrade (proration via Stripe) → webhook sync |
| **Downgrade (paid→paid)** | Billing Center → scheduled downgrade at period boundary → webhook sync; access retained until effective |
| **Interval change** | Immediate when upgrade-like; scheduled when downgrade-like (policy engine) |
| **Cancellation (to Free)** | Cancel at period end; access retained until period ends; then Free capabilities |
| **Renewal** | Stripe renews; IMMIFIN learns via subscription webhooks and keeps billing state in sync |
| **Reactivation** | After Free (or cancelled period end), user returns to Pricing → Checkout for a new paid subscription |

### Conceptual billing states

| State | Meaning | Product access |
|-------|---------|----------------|
| **Free** | No paid subscription | Free capabilities; upgrade via Pricing |
| **Checkout Started / Incomplete** | Payment not completed | Still Free |
| **Active** | Paid subscription current | Pro or Power via capabilities |
| **Cancel scheduled** | Cancel at period end | Keep current paid capabilities until period end |
| **Past Due** | Stripe collection retrying | Billing state synced; capability grace policy remains an operational concern (see §14) |
| **Expired / Deleted** | Paid period ended | Free capabilities; upgrade path restored |

### Notes

- Product `plan` remains `free` | `pro` | `power`.
- Lifecycle describes **billing journey**; capabilities remain the authorization system.
- Development Subscription Mode (ADR-007) remains a **non-Stripe** path until Live cutover.

---

## 8. Billing Center

### Decision (as-built)

**Billing Center is the primary subscription management interface.**

Plan changes (upgrade, downgrade, interval change, cancel-to-free) are owned by IMMIFIN policy + APIs + `/account/billing` UI — **not** by Stripe Customer Portal.

### Responsibilities

| Responsibility | Detail |
|----------------|--------|
| Show current plan / interval / billing status | From IMMIFIN subscription billing state |
| Offer allowed plan changes | Policy engine evaluates upgrade / downgrade / interval / cancel |
| Confirm intent | Confirmation UX before calling change APIs |
| Handoff new paid users | Pricing Checkout for users without an active paid subscription |
| Placeholders | Payment method / invoices marked for later (Portal) |

### Capabilities (implemented)

- Upgrade Pro ↔ Power (and Free → paid via Pricing Checkout)
- Downgrade with period-end scheduling where policy requires
- Monthly ↔ annual changes per policy
- Cancel to Free at period end
- Navigation entry from My Immifin / account surfaces

### Current limitations

- No Customer Portal session for payment method or invoices
- Placeholders only for payment method / invoice history
- Live Stripe operational validation still pending

### Relationship with Stripe

Billing Center calls IMMIFIN APIs; those APIs call Stripe to mutate subscription objects. Access changes still arrive through **webhooks → sync → capabilities**, not from the Billing Center UI alone.

### Relationship with Customer Portal

Customer Portal is **not** the primary experience and is **not implemented** for Sprint 7 plan management. See §11.

---

## 9. Customer Mapping

| Rule | Design |
|------|--------|
| **One Stripe Customer per IMMIFIN profile** | Checkout always uses `customer: cus_...` |
| **Environment isolation** | Test and Live customers are not shared; mapping is environment-aware |
| **Idempotent creation** | `getOrCreateStripeCustomer` reuses existing mapping / searchable customer before create |
| **Synchronization** | Customer ID persisted on subscription billing records in Supabase |
| **Recovery** | If mapping is missing, recreate/link via trusted profile identity; do not create duplicate customers casually |

---

## 10. Webhook Design

### Supported events (application)

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### Synchronization sequence

```text
Stripe delivers signed event
  ↓
Verify signature
  ↓
Durable claim / idempotency (event ledger)
  ↓
Dispatch focused handler
  ↓
Synchronize subscription billing state in Supabase
  ↓
Effective tier / capability assignment updates for the user
```

### Failure handling and retry philosophy

| Concern | Design |
|---------|--------|
| **Invalid signature** | Reject; do not mutate billing state |
| **Duplicate delivery** | Idempotent claim — safe Stripe retries |
| **Handler failure after claim** | Fail closed for that attempt; allow controlled retry / completion semantics via ledger |
| **Capability sync** | Derived from synchronized billing state — not a separate webhook side channel |

Browser success redirects never substitute for this sequence.

---

## 11. Customer Portal

### Current status

**Deferred** — not implemented in Sprint 7 application code.

Billing Center shows placeholders for payment method / invoices (“later”).

### Planned responsibilities (when built)

| Planned | Detail |
|---------|--------|
| **Payment method** | Update card / payment instrument |
| **Invoices** | View / download invoices |
| **Receipts** | Receipt access as configured in Stripe |
| **History** | Invoice / billing history |

### Explicit non-primary role

Customer Portal must **not** become the primary plan-change orchestrator. IMMIFIN Billing Center + billing policy remain authoritative for upgrade / downgrade / interval / cancel rules ([BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md)).

---

## 12. Capability Synchronization

### Flow

```text
Subscription (billing state in Supabase)
  ↓
Capability assignment (tier → capability map)
  ↓
Authorization (server helpers on selected APIs)
  ↓
UI visibility (Premium Feature Discovery, nav preview, gates)
  ↓
Feature access (dashboards, tools, Notification Platform audience, etc.)
```

### Single source of truth for access

| Layer | Role |
|-------|------|
| **Stripe** | Source of truth for **payment / billing objects** |
| **IMMIFIN billing state (`plan` + Stripe fields)** | Source of truth for **product tier after verified sync** |
| **Capabilities** | Source of truth for **premium / feature access** |

Rules:

1. Do **not** scatter `if (stripeStatus === 'active')` checks in UI.
2. Do **not** invent a parallel “isPaid” flag that bypasses capabilities.
3. Notification Platform, Dashboard, and Premium Feature Discovery continue to use capability gates.

### Compatibility with Development Subscription Mode

Until Live cutover:

- ADR-007 may still write the same `plan` field for engineering/QA.
- Production Live billing requires an explicit Dev Mode hard-off gate.

---

## 13. Security Principles

| Principle | Requirement |
|-----------|-------------|
| **Never trust browser requests** | Client success redirects, query params, or “I subscribed” posts do not grant Pro/Power |
| **Always verify Stripe webhooks** | Validate signature with webhook secret; reject invalid payloads |
| **Never expose secret keys** | `STRIPE_SECRET_KEY`, webhook secrets — server-only |
| **Server-side validation** | Checkout Session and subscription-change operations only on the server |
| **Idempotent webhook processing** | Durable event ledger; safe Stripe retries |
| **Least privilege metadata** | Pass stable IMMIFIN identity in Checkout metadata; no secrets in client |
| **Cloudflare Workers compatible** | Patterns must work on OpenNext / Workers |

---

## 14. Production Readiness

### Implemented

- ✓ Checkout Session API + Pricing Checkout wiring
- ✓ Customer mapping
- ✓ Webhook processing + subscription / billing-state sync
- ✓ Capability synchronization path (billing state → capabilities → access)
- ✓ Billing Center plan management
- ✓ Subscription-change policy paths (upgrade / downgrade / interval / cancel-to-free)

### Pending validation

- Live Stripe products, prices, webhook, and secrets
- Sandbox / Live signed webhook end-to-end payment proof
- Production Supabase webhook-foundation migration apply (target env)
- Development Subscription Mode hard-off for Live
- Production commercial deployment / v0.5.0 signoff

### Deferred

- Customer Portal sessions (payment method / invoices / receipts / history)
- Portal-centric plan management (explicitly rejected as primary UX)

**Do not claim Live Stripe or commercial production readiness until pending validation is complete.**

---

## 15. Remaining open / operational decisions

Items still requiring Product Owner / ops confirmation before or during Live cutover:

| Topic | Question | Status |
|-------|----------|--------|
| **Past-due grace** | How long (if any) paid capabilities continue on `past_due` | ⬜ Open / ops |
| **Taxes** | Stripe Tax enabled? Display inclusive vs exclusive? | ⬜ Open |
| **Failed payment messaging** | In-app banners / email when past due | ⬜ Open |
| **Dev Mode cutover** | Exact production rule for `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE` | ⏳ Pending Live gate |
| **Enterprise pricing** | Business / Enterprise tiers and custom contracts | ⬜ Future |
| **Portal build-out** | When to implement payment method / invoice Portal sessions | ⏳ Deferred (Sprint 8+) |

### Resolved by Sprint 7 (record)

| Topic | Resolution |
|-------|------------|
| **Primary plan management UX** | IMMIFIN Billing Center (not Customer Portal) |
| **Upgrade behavior** | Immediate with Stripe proration (policy) |
| **Downgrade / cancel** | End of period; no immediate loss of paid access (policy) |
| **Refund philosophy** | Avoid unused-time refunds; exceptional support only (policy) |
| **Checkout trust model** | Webhook-only activation |

Policy detail: [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md) · [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md).

---

## 16. Architecture constraints (locked)

| Constraint | Detail |
|------------|--------|
| Preserve IMMIFIN architecture | Clerk auth, Supabase profiles, OpenNext Cloudflare Workers |
| Do not redesign completed systems | Dashboard, capability model, Notification Platform remain |
| As-built design + policy govern behavior | Code and this document stay aligned; prefer handoff for sprint status |
| Stripe integrates into existing architecture | Syncs billing state; does not replace capabilities |
| Notification Platform untouched | No redesign of email/notification for Sprint 7 |

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-11 | S7-DOC-001 | Initial Stripe Subscription Platform Design — Planning |
| v2.0 | 2026-07-20 | S7-DOC-006 | As-built design — Billing Center primary; Portal deferred; Live validation pending |
