# IMMIFIN Stripe Subscription Platform Design

| Field | Value |
|-------|-------|
| **Document** | Stripe Subscription Platform Design |
| **Task** | S7-DOC-001 |
| **Version** | v1.0 |
| **Sprint** | Sprint 7 — Commercial Platform |
| **Status** | **Planning** — source of truth before implementation |
| **Created** | 2026-07-11 |
| **Owner** | Product Strategy / Technical Architecture |
| **Handoff** | [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) |

> **Authority:** This document is the **source of truth** for Sprint 7 Stripe Subscription Platform work. Implementation must follow this design. Do not invent pricing, lifecycle, or webhook rules outside this document without Product Owner approval and a documented revision.

**Related:** [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) · [PRODUCT_VISION.md](./PRODUCT_VISION.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [architecture/ADR-007-Development-Subscription-Mode.md](./architecture/ADR-007-Development-Subscription-Mode.md) · [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) · [NOTIFICATION_PLATFORM_SIGNOFF.md](./NOTIFICATION_PLATFORM_SIGNOFF.md) · [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [ROADMAP_v2.md](./ROADMAP_v2.md)

---

## 1. Sprint 7 Overview

### Purpose

Sprint 7 begins the **Commercial Platform** for IMMIFIN: real Stripe-backed subscriptions that assign Free / Pro / Power tiers into the existing capability model.

IMMIFIN already delivers Pro/Power value (Personalized Dashboard, Monthly Immigration Updates, Visa Bulletin History / Movement). Sprint 7 enables customers to **pay for that value**.

### Goals

| Goal | Description |
|------|-------------|
| **Monetize** | Accept real payments for Pro and Power |
| **Preserve architecture** | Stripe updates `plan`; capabilities remain the product gate |
| **Trust** | Only verified Stripe webhooks activate or change subscriptions |
| **Operations** | Customers manage billing via Stripe Customer Portal |
| **Sunset path** | Development Subscription Mode becomes temporary / non-production after Stripe is live |

### Deliverables (Sprint 7)

| Deliverable | Notes |
|-------------|-------|
| This design document | S7-DOC-001 — **source of truth** |
| Architecture review | S7-ARCH-001 — approve design before code |
| Stripe account + products/prices | Test mode first |
| Database foundation | Persist Stripe customer / subscription IDs |
| Checkout | Stripe Checkout for Pro / Power (monthly + annual) |
| Webhooks | Signature-verified, idempotent plan sync |
| Capability integration | Webhook → `plan` → existing `hasCapability` / `canAccess*` |
| Billing Portal | Stripe-hosted manage / cancel / payment method |
| Testing + production release | Test → live cutover checklist |

### Business objectives

| Objective | How Stripe supports it |
|-----------|------------------------|
| Sustainable SaaS revenue | Recurring Pro / Power subscriptions |
| Clear upgrade path | Pricing → Checkout → paid capabilities |
| Reduce support burden | Portal for self-serve billing changes |
| Protect product integrity | Never activate Pro/Power from a browser redirect alone |
| Preserve Notification Platform value | Paid Pro/Power continue to receive Monthly Updates via existing Notification Platform |

### Explicit non-goals (Sprint 7)

- Redesigning Free / Pro / Power capabilities
- Modifying Notification Platform architecture
- Coupons, promotions, or free trials (Beta)
- Custom-built billing UI replacing Stripe Portal
- Enterprise / Business tier sales motion
- Finance / Insurance / AI feature expansion

---

## 2. Commercial Pricing

### Approved launch pricing (Beta)

| Tier | Monthly | Annual |
|------|---------|--------|
| **Free** | **$0** | — |
| **Pro** | **$9.99 / month** | **$99 / year** |
| **Power** | **$19.99 / month** | **$199 / year** |

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

### Price ↔ product mapping (implementation note)

Stripe Products / Prices will be created in the Stripe Dashboard (test then live). IMMIFIN maps each Price ID to:

| Stripe Price | IMMIFIN `plan` |
|--------------|----------------|
| Pro monthly | `pro` |
| Pro annual | `pro` |
| Power monthly | `power` |
| Power annual | `power` |

Billing interval (month vs year) is a **Stripe/billing concern**. Product access remains the **tier** (`pro` / `power`), not the interval.

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

Stripe owns the **commercial billing stack**:

| Responsibility | Detail |
|----------------|--------|
| **Payments** | Card (and Stripe-supported methods) processing |
| **Checkout** | Hosted Checkout Session UX and PCI-sensitive collection |
| **Billing** | Recurring subscription invoices and collection attempts |
| **Customer Portal** | Self-serve manage subscription, payment methods, invoices |
| **Renewals** | Automatic renewal per subscription schedule |
| **Invoices** | Invoice generation and hosted invoice access |
| **Payment methods** | Storage and update of payment instruments |
| **Subscription billing state** | Stripe-side status (`active`, `past_due`, `canceled`, etc.) |

IMMIFIN must not reimplement payment capture or store raw card data.

---

## 5. IMMIFIN Responsibilities

IMMIFIN owns the **product and identity stack**:

| Responsibility | Detail |
|----------------|--------|
| **Authentication** | Clerk — signup, login, sessions |
| **User profiles** | Supabase profiles + immigration data |
| **Capability authorization** | `lib/subscription/capabilities.ts` — unchanged model |
| **Dashboard & product UX** | Personalized journey, tools, Notification Platform delivery |
| **Subscription synchronization** | Map verified Stripe events → `profiles.plan` / `subscriptions.plan` (+ Stripe IDs) |
| **User experience** | Pricing CTAs, success/cancel return pages, portal entry points |

### Integration principle

```text
Stripe owns money.
IMMIFIN owns access.
```

Stripe never decides feature gates directly. IMMIFIN never activates paid access from an untrusted browser callback alone.

---

## 6. Checkout Flow

### Canonical flow

```text
User
  ↓
Pricing (`/pricing`)
  ↓
Checkout (create Stripe Checkout Session — server)
  ↓
Stripe Checkout (hosted)
  ↓
Webhook (Stripe → IMMIFIN — verified)
  ↓
IMMIFIN (update subscription / plan)
  ↓
Capability Activation (existing resolver)
```

### Step detail

| Step | Owner | Behavior |
|------|-------|----------|
| 1. Pricing | IMMIFIN | User selects Pro or Power, monthly or annual |
| 2. Start Checkout | IMMIFIN server | Authenticated user; create Checkout Session with Price ID + customer metadata (`clerk_user_id` / profile id) |
| 3. Redirect to Stripe | Browser | User pays on Stripe-hosted page |
| 4. Return URL | Browser | Success / cancel pages — **UX only** |
| 5. Webhook | Stripe → IMMIFIN | `checkout.session.completed`, subscription lifecycle events |
| 6. Sync | IMMIFIN | Verify signature; idempotent upsert; set `plan` |
| 7. Access | IMMIFIN | `SubscriptionTierProvider` / `hasCapability` unlock features |

### Critical rule — browser redirects never activate subscriptions

| Allowed | Forbidden |
|---------|-----------|
| Success page shows “We’re confirming your subscription…” / refresh access after webhook | Setting `plan = pro` or `power` because the user landed on `/pricing/success` |
| Cancel page returns user to pricing | Trusting client-posted “I paid” payloads |
| Polling or re-fetching plan after webhook processed | Activating access from Checkout Session ID alone without webhook verification |

**Only Stripe webhooks (signature-verified) activate or change subscriptions.**

---

## 7. Subscription Lifecycle

IMMIFIN product lifecycle states (conceptual). Exact Stripe status mapping is finalized in S7-ARCH-001 / implementation, but UX expectations are locked here.

| State | Meaning | Expected user experience |
|-------|---------|---------------------------|
| **Free** | No paid subscription | Free capabilities only; upgrade CTAs to `/pricing` |
| **Checkout Started** | Checkout Session created; payment not completed | Still Free; may resume or restart Checkout |
| **Incomplete** | Payment started but not successfully completed | Still Free; messaging to complete Checkout; no paid features |
| **Active** | Paid subscription current | Pro or Power capabilities per plan; portal available |
| **Past Due** | Renewal/payment failed; Stripe retrying | **Open decision:** grace vs immediate downgrade — see §12 |
| **Cancelled** | User or system cancelled; may still have access until period end | **Open decision:** access until period end vs immediate — see §12 |
| **Expired** | Paid period ended; no active subscription | Revert to Free capabilities; upgrade path restored |

### Notes

- Product `plan` remains `free` | `pro` | `power`.
- Lifecycle states above describe **billing journey**; they may be stored as Stripe status fields plus IMMIFIN `plan`, not as a second authorization system.
- Development Subscription Mode (ADR-007) remains a **non-Stripe** path until production cutover.

---

## 8. Billing Portal

### Decision

Use **Stripe Customer Portal** instead of building custom billing pages for:

- Update payment method
- View invoices
- Cancel or change subscription (within approved portal configuration)
- Billing email / receipt access (as configured in Stripe)

### Why

| Reason | Detail |
|--------|--------|
| **PCI / compliance** | Avoid custom card forms and sensitive billing UI |
| **Speed** | Proven hosted UX; less Sprint 7 surface area |
| **Maintenance** | Stripe owns portal improvements and localization |
| **Consistency** | Aligns with Checkout-hosted payment pattern |

### IMMIFIN responsibilities for Portal

| Item | Behavior |
|------|----------|
| Entry point | Account / Manage Profile / Subscription — “Manage billing” |
| Session creation | Server creates Portal Session for the Stripe Customer |
| Return URL | Back to IMMIFIN account/subscription page |
| Access changes | Still driven by **webhooks**, not portal return alone |

Portal configuration (which changes are allowed) is an **Open Decision** where it affects upgrade/downgrade/proration — see §12.

---

## 9. Capability Activation

### Flow

```text
Stripe
  ↓
Subscription (Stripe object / event)
  ↓
IMMIFIN Subscription State
  (profiles.plan + subscriptions.plan [+ stripe customer/subscription ids])
  ↓
Capability Resolver
  (lib/subscription/capabilities.ts — hasCapability / canAccess*)
  ↓
Feature Access
  (Dashboard, alerts, Notification Platform audience, Premium Feature Discovery, etc.)
```

### Single source of truth for access

| Layer | Role |
|-------|------|
| **Stripe** | Source of truth for **payment / billing status** |
| **IMMIFIN `plan`** | Source of truth for **product tier** after verified sync |
| **Capabilities** | Source of truth for **feature access** |

Rules:

1. Do **not** scatter `if (stripeStatus === 'active')` checks in UI.
2. Do **not** invent a parallel “isPaid” flag that bypasses capabilities.
3. Notification Platform, Dashboard, and Premium Feature Discovery continue to use existing capability gates (`accessEmailAlerts`, `accessPersonalDashboard`, etc.).

### Compatibility with Development Subscription Mode

Until Stripe production cutover:

- ADR-007 may still write the same `plan` field for testing.
- After Stripe is live in production, Dev Mode must be gated off (or admin-only) per S7-OPS / S7-REL — details in Open Decisions if needed.

---

## 10. Security Principles

| Principle | Requirement |
|-----------|-------------|
| **Never trust browser requests** | Client success redirects, query params, or “I subscribed” posts do not grant Pro/Power |
| **Always verify Stripe webhooks** | Validate `Stripe-Signature` with webhook secret; reject invalid payloads |
| **Never expose secret keys** | `STRIPE_SECRET_KEY`, webhook secrets — server-only; never `NEXT_PUBLIC_` |
| **Server-side validation** | Checkout Session and Portal Session creation only on the server |
| **Idempotent webhook processing** | Process each event once; safe retries; store processed event IDs or equivalent |
| **Least privilege metadata** | Pass stable IMMIFIN identity in Checkout metadata; do not put secrets in client |
| **Cloudflare Workers compatible** | Prefer APIs/patterns that work on OpenNext / Workers; no Node-only Stripe shortcuts that break deploy |

---

## 11. Sprint 7 Implementation Roadmap

Proposed phases (documentation → production). Task IDs may be refined after **S7-ARCH-001**.

| Phase | Name | Intent |
|-------|------|--------|
| **Phase 1** | Architecture Review | S7-ARCH-001 — Product Owner + engineering approve this design |
| **Phase 2** | Stripe Account Setup | Products, Prices (Pro/Power × monthly/annual), Portal settings, webhook endpoint (test) |
| **Phase 3** | Database Foundation | Persist Stripe customer ID, subscription ID, relevant status fields; keep `plan` as access tier |
| **Phase 4** | Checkout | Server Checkout Session API + Pricing CTAs + return pages (UX only) |
| **Phase 5** | Webhook Processing | Verified, idempotent handlers; map events → plan sync |
| **Phase 6** | Capability Integration | Confirm end-to-end: paid plan → capabilities → features / Notification audience |
| **Phase 7** | Billing Portal | Portal Session entry from Account / Subscription |
| **Phase 8** | Testing | Test-mode Checkout, renewals, cancel, past_due simulation, Workers deploy |
| **Phase 9** | Production Release | Live keys, live webhook, cutover checklist, gate Dev Mode in production |

**Next task after this document:** **S7-ARCH-001 — Stripe Architecture Review**.

---

## 12. Open Decisions

Items that require future Product Owner / architecture approval. **Do not invent answers in implementation.**

| Topic | Question | Status |
|-------|----------|--------|
| **Grace period** | On `past_due`, how long (if any) does the user keep Pro/Power capabilities? | ⬜ Open |
| **Refund policy** | When are refunds offered; who issues them (Stripe Dashboard vs automated)? | ⬜ Open |
| **Upgrade behavior** | Mid-cycle Free→Pro, Pro→Power: immediate access? Proration? | ⬜ Open |
| **Downgrade behavior** | Power→Pro or paid→Free: immediate vs end of period? | ⬜ Open |
| **Taxes** | Stripe Tax enabled? Inclusive vs exclusive display? | ⬜ Open |
| **Proration** | Default Stripe proration on plan/interval changes? | ⬜ Open |
| **Enterprise pricing** | Business / Enterprise tiers and custom contracts | ⬜ Open (future) |
| **Portal allowed actions** | Can users switch Pro↔Power and monthly↔annual in Portal? | ⬜ Open |
| **Failed payment messaging** | In-app banners / email when past due | ⬜ Open |
| **Dev Mode cutover** | Exact production rule for `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE` | ⬜ Open |

Resolved decisions must be recorded here and in [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) before coding those behaviors.

---

## 13. Architecture constraints (locked)

| Constraint | Detail |
|------------|--------|
| Preserve IMMIFIN architecture | Clerk auth, Supabase profiles, OpenNext Cloudflare Workers |
| Do not redesign completed systems | Dashboard, capability model, Notification Platform remain |
| Documentation is source of truth | Code follows this design + BUSINESS_MODEL |
| Stripe integrates into existing architecture | Updates `plan`; does not replace capabilities |
| Notification Platform untouched | No redesign of email/notification for Sprint 7 unless Product Owner expands scope |

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-11 | S7-DOC-001 | Initial Stripe Subscription Platform Design — Planning |
