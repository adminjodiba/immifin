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

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| 1.0 (Beta) | 2026-07-12 | S7-DOC-002 | Initial approved billing architecture and ownership model |
