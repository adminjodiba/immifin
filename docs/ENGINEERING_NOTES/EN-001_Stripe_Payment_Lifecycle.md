# Stripe Payment Lifecycle

| Field | Value |
|-------|-------|
| **Engineering Note** | EN-001 |
| **Version** | 1.0 |
| **Sprint** | Sprint 7 — Commercial Platform |
| **Task** | DOC-EN-001 |
| **Status** | Living document |

---

## Purpose

This note explains the **complete Stripe payment journey** in IMMIFIN — from a user considering an upgrade on the Pricing page through billing synchronization and eventual feature access. It describes architecture and philosophy, not line-by-line implementation.

Readers should finish this document understanding **why** each layer exists and **what must never be trusted** at each step.

---

## Audience

- Future IMMIFIN engineers onboarding to billing work
- AI coding agents implementing or reviewing Stripe-related tasks
- Maintainers debugging subscription state
- The Product Owner reviewing architectural intent

---

## Relationship to Billing Architecture

This note complements — and does not replace — the approved architecture documents:

| Document | What it owns |
|----------|--------------|
| [BILLING_ARCHITECTURE.md](../BILLING_ARCHITECTURE.md) | Ownership boundaries between IMMIFIN and Stripe (ADR-001) |
| [STRIPE_BILLING_POLICY.md](../STRIPE_BILLING_POLICY.md) | Commercial rules: upgrades, downgrades, cancellations |
| [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](../STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) | Sprint 7 platform design and phased roadmap |
| [STRIPE_OPERATIONS.md](../STRIPE_OPERATIONS.md) | Dashboard setup, secrets placement, operational procedures |

**Golden rule (from Billing Architecture):**

> **Stripe manages money. IMMIFIN manages business policy.**

This note explains how that rule flows through the entire payment lifecycle.

---

## High-Level Philosophy

IMMIFIN is an immigration platform. Stripe is a payment processor. They must remain separate systems with a clear contract between them.

| Stripe owns | IMMIFIN owns |
|-------------|--------------|
| Payment collection | Subscription business rules |
| Customer and subscription objects | Feature gating and capabilities |
| Invoices and receipts | Upgrade/downgrade policy |
| Payment security and PCI scope | User experience and entitlements |
| Webhook delivery | Application truth in Supabase |

### Why this separation exists

1. **Security** — Payment secrets and card data never belong in browser-authoritative flows.
2. **Policy flexibility** — IMMIFIN can change upgrade rules, grace periods, and entitlements without reconfiguring Stripe products for every business decision.
3. **Auditability** — Billing state and authorization state are synchronized but stored separately, so engineers can trace *what was paid* independently of *what the user can access*.
4. **Resilience** — Browser redirects fail, tabs close, and networks drop. Server-to-server webhooks are the durable signal that money changed hands.

A common SaaS mistake is letting the success page grant access. IMMIFIN explicitly rejects that pattern.

---

## Complete Payment Journey

```text
User
  │
  ▼
Pricing Page                    (intent only — tier + interval)
  │
  ▼
Checkout API                    (authenticated, server-authoritative)
  │
  ▼
Stripe Checkout                 (Stripe temporarily owns payment UX)
  │
  ▼
Stripe Customer                 (one per IMMIFIN profile, durable mapping)
  │
  ▼
Stripe Webhook                  (server-to-server, signed)
  │
  ▼
Signature Verification          (reject forged or replayed requests)
  │
  ▼
Event Ledger                    (stripe_webhook_events — process once)
  │
  ▼
Subscription Synchronization  (billing state → Supabase)
  │
  ▼
Capability Synchronization    (billing state → effective entitlements)
  │
  ▼
Dashboard / Features            (user experiences Pro or Power access)
```

**Critical insight:** The vertical line between Checkout and Webhook is a trust boundary. Nothing above the webhook layer may grant paid access.

---

## Section 1 — Pricing Page

The Pricing page is a **marketing and intent surface**. It shows plans, features, and upgrade calls-to-action. It does not participate in payment security.

### What the browser may send

| Allowed | Not allowed |
|---------|-------------|
| Tier (`pro`, `power`) | Stripe Price IDs |
| Interval (`monthly`, `annual`) | Customer IDs |
| User navigation | Success/cancel URLs |
| | Subscription status claims |

### Why Price IDs never come from the browser

Stripe Price IDs are environment-specific secrets of commerce configuration. If the browser could supply a Price ID:

- A user could attempt to subscribe at the wrong price
- A malicious client could reference unapproved or deprecated prices
- Sandbox and production could be confused

Instead, IMMIFIN accepts only **human-meaningful plan intent** (tier + interval). The server resolves that intent to an approved Price ID from its own catalog.

**Principle:** The browser expresses *what the user wants*. The server decides *what Stripe object to use*.

---

## Section 2 — Checkout API

The Checkout API is the first server gate in the payment journey. It runs only for authenticated users and only when IMMIFIN approves a new subscription attempt.

### Responsibilities

| Responsibility | Why it matters |
|----------------|----------------|
| Authentication | Only known IMMIFIN users may start Checkout |
| Free-user validation | Paid subscribers must not open duplicate subscriptions |
| Approved Price Catalog | Price resolution is server-side only |
| Customer mapping | Reuse or create exactly one Stripe Customer per profile |
| Session creation | Return only a Checkout URL — no secrets, no entitlement changes |

### Server authority

The Checkout API never trusts:

- Browser-supplied Price IDs
- Redirect URLs from the client
- Claims that payment succeeded
- Metadata as final entitlement proof

Checkout **creates a session**. It does **not** activate Pro or Power. That distinction is intentional and permanent.

---

## Section 3 — Stripe Customer Mapping

Every paying IMMIFIN user maps to exactly one Stripe Customer over the lifetime of that profile.

```text
One IMMIFIN Profile  ──────►  One Stripe Customer
         │                            │
         │                            ├── metadata: immifin_profile_id
         │                            ├── metadata: clerk_user_id
         │                            └── metadata: environment (sandbox/live)
         │
         └── subscriptions.stripe_customer_id (local mapping)
```

### Metadata

Stripe Customer metadata carries **stable identity bridges** — not immigration data, not payment details. The webhook layer uses these bridges to reconcile Stripe events back to the correct IMMIFIN profile.

### Idempotency

Customer creation uses a deterministic idempotency key derived from profile ID and environment. Concurrent Checkout attempts or Stripe retries must not create duplicate customers.

### Environment isolation

Sandbox and Live Mode customers must never be mixed. Metadata and search logic are environment-aware so test customers are not reused in production.

### Why duplicate customers are dangerous

| Risk | Consequence |
|------|-------------|
| Duplicate customers | Split subscription history; broken reconciliation |
| Wrong customer reuse | Billing attached to wrong IMMIFIN profile |
| Missing mapping | Webhooks cannot resolve identity; paid user gets no access |

Customer mapping is infrastructure, not a convenience. It is built before webhooks because webhooks depend on it.

---

## Section 4 — Stripe Checkout

Stripe Checkout is a hosted payment experience. For a period of minutes, **Stripe temporarily owns the payment UX**.

### What happens during Checkout

- User enters payment method on Stripe-hosted pages
- Stripe creates or confirms the subscription object
- User is redirected back to IMMIFIN success or cancel URLs

### Why browser redirects are NOT trusted

Redirects are user-visible and user-controlled:

- A user can bookmark or manually navigate to a success URL
- A network interruption may show success before payment completes
- A malicious actor could probe success URLs without paying

IMMIFIN success pages may show *"We are confirming your subscription"* — they must never set `plan = pro` or `plan = power` based on the redirect alone.

**Principle:** Checkout is an intent pipeline. Webhooks are the confirmation pipeline.

---

## Section 5 — Stripe Webhooks

After Checkout, Stripe communicates with IMMIFIN through **server-to-server webhooks** — HTTP POST requests sent to IMMIFIN's webhook endpoint.

### Why Stripe always sends webhooks

| Event | Why IMMIFIN must know |
|-------|----------------------|
| Checkout completed | Link customer, subscription, and profile |
| Subscription created | Initial billing state |
| Subscription updated | Renewals, past_due, cancel-at-period-end |
| Subscription deleted | Final canceled state |

Webhooks are asynchronous by design. They may arrive seconds after the user sees a success page — or retry minutes later if IMMIFIN was temporarily unavailable.

### Why redirect pages cannot be trusted

| Redirect page | Webhook |
|---------------|---------|
| User-initiated navigation | Stripe-initiated delivery |
| No cryptographic proof | Signed with webhook secret |
| May arrive before payment settles | Arrives when Stripe state is authoritative |
| Easy to fake in isolation | Verified server-side |

The webhook endpoint is the **front door to billing truth**.

---

## Section 6 — Signature Verification

Every webhook request carries a `Stripe-Signature` header. IMMIFIN verifies this signature using the webhook signing secret (`whsec_...`) before parsing the request body.

### Authentication model

| Layer | Authentication |
|-------|----------------|
| Pricing page | None required (public) |
| Checkout API | Clerk session (IMMIFIN user) |
| Webhook endpoint | Stripe signature only (no Clerk) |

The webhook route is public on the network but **not public on trust**. Unsigned or invalid requests are rejected immediately.

### Rejecting forged requests

Without signature verification:

- Anyone could POST fake subscription events
- Attackers could grant themselves Pro access
- Replay attacks could duplicate side effects

Verification happens on the **raw request body** before JSON parsing. The raw body is never logged.

---

## Section 7 — Event Ledger

The `stripe_webhook_events` table is IMMIFIN's durable webhook ledger. It exists because Cloudflare Workers, Stripe retries, and concurrent delivery make in-memory deduplication unsafe.

### Why every event gets a permanent record

| Need | How the ledger helps |
|------|----------------------|
| Idempotency | Unique `stripe_event_id` prevents double processing |
| Retry safety | Failed events can be reclaimed without duplicating writes |
| Operations | Engineers can inspect processing state without log archaeology |
| Audit | Evidence that an event was received and how it was handled |

### Duplicate-event protection

```text
Stripe delivers event evt_123
        │
        ▼
Claim evt_123 in ledger (atomic)
        │
        ├── Already completed? → Acknowledge, no side effects
        ├── In progress?       → Another worker owns it
        └── Claimed            → Process once, mark completed
```

Stripe may deliver the same event multiple times. IMMIFIN must behave correctly every time.

---

## Section 8 — Subscription Synchronization

After verification and claiming, IMMIFIN synchronizes **billing state** from Stripe into Supabase.

### Stripe is billing truth

The authoritative paid plan comes from the **actual Stripe subscription price**, not from Checkout metadata alone. Metadata may record user intent; the subscription item price records what was purchased.

### What gets synchronized

| Field category | Examples |
|----------------|----------|
| Stripe identifiers | Customer ID, Subscription ID, Price ID |
| Billing cycle | Interval, period start/end |
| Provider status | Raw `stripe_status` from Stripe |
| Application status | Normalized IMMIFIN `status` (mapped in backend task) |
| Cancellation state | `cancel_at_period_end`, `canceled_at` |
| Sync metadata | `last_synchronized_at` |

### What does NOT happen at this stage

Subscription synchronization **does not grant capabilities**. It records billing facts. Authorization is a separate downstream step.

This separation prevents a single bug from simultaneously corrupting billing records and feature access.

---

## Section 9 — Capability Synchronization

IMMIFIN separates **billing** from **authorization**.

```text
Billing State (subscriptions table)
        │
        ▼
Capability Resolver (lib/subscription/capabilities)
        │
        ▼
Feature Gates (dashboard, notifications, AI, limits)
        │
        ▼
User Experience
```

### Why billing and authorization are separate

| Concern | Billing system | Capability system |
|---------|----------------|-------------------|
| Question answered | Did the user pay? | What can the user do? |
| Source of truth | Stripe → Supabase sync | Capability resolver |
| Changes when | Webhook events | Resolver rules + billing state |
| Affected by grace periods | Stores `past_due` | May still allow temporary access |

A future dedicated task translates verified billing state into effective entitlements. Until then, Development Subscription Mode may still be used for beta testing — but production entitlements will flow through this resolver, not through Checkout or redirects.

---

## Section 10 — Current Sprint Status

*Snapshot as of DOC-EN-001 (2026-07-12). See implementation documents for authoritative task tracking.*

### Completed

| Area | Status |
|------|--------|
| Stripe platform design and billing ADR | Approved documentation |
| Stripe SDK and server foundation | Released (S7-STR-001) |
| Secure Checkout Session API | Released (S7-STR-002) |
| Stripe Customer mapping | Released (S7-STR-003, S7-STR-003A) |
| Stripe backend foundation release | Committed and deployed (S7-RELEASE-001) |
| Webhook event ledger and subscription schema | Implemented (S7-DB-001, pending PO review/commit) |

### In Progress / Next

| Area | Status |
|------|--------|
| Webhook route and signature verification | S7-STR-004 — ready to resume after S7-DB-001 approval |
| Subscription synchronization service | Part of S7-STR-004 |
| Capability synchronization from billing | Future dedicated task |
| Pricing page Checkout wiring | Not started — infrastructure first |
| Billing Center / Customer Portal | Future phase |

### Remaining (Sprint 7 roadmap)

- Webhook Sandbox validation and Dashboard registration
- End-to-end capability integration
- Billing Portal entry
- Production Stripe cutover and Dev Mode gate

---

## Section 11 — Architecture Principles Learned

These principles emerged from Sprint 7 design and implementation. They should guide all future billing work.

| Principle | Meaning |
|-----------|---------|
| Never trust browser payment status | Success URLs, query params, and client state do not grant access |
| Never trust redirects | Redirects are UX; webhooks are truth |
| Every Stripe Customer is permanent | Map once, reuse forever, isolate environments |
| Every webhook is processed once | Durable ledger, atomic claims, safe retries |
| Database is application truth | Supabase holds normalized billing state; Stripe holds financial objects |
| Billing and authorization are separate | Sync billing first; resolve capabilities second |
| Server is authoritative | Price catalog, customer mapping, and webhook verification are server-only |
| Build infrastructure before UI | Checkout API and webhooks precede Pricing page button wiring |

---

## Section 12 — Future Expansion

This lifecycle will grow as IMMIFIN matures commercially. Planned engineering topics include:

| Topic | Engineering challenge |
|-------|----------------------|
| Subscription upgrades | Mid-cycle tier changes, proration policy |
| Downgrades | Immediate vs end-of-period; capability timing |
| Billing Center | Self-serve subscription management UI |
| Invoices and receipts | Display without exposing Stripe secrets |
| Refunds | Policy-driven, likely manual in Beta |
| Enterprise billing | Custom contracts, seat models |
| Usage billing | Metered features if introduced |
| AI credits | Separate from base subscription if product expands |

Each topic should receive its own Engineering Note when the subsystem matures.

---

## Related Documents

- [README.md](./README.md) — Engineering Notes index
- [BILLING_ARCHITECTURE.md](../BILLING_ARCHITECTURE.md)
- [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](../STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md)
- [STRIPE_OPERATIONS.md](../STRIPE_OPERATIONS.md)

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-12 | DOC-EN-001 | Initial Stripe Payment Lifecycle engineering note |
