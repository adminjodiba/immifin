# IMMIFIN Stripe Billing Policy

| Field | Value |
|-------|-------|
| **Version** | 1.0 (Beta) |
| **Status** | **Approved** |
| **Owner** | IMMIFIN |
| **Last Updated** | Sprint 7 (2026-07-12) |

> **Authority:** This document is the **source of truth** for IMMIFIN subscription billing behavior — upgrades, downgrades, cancellations, Customer Portal rules, and refund philosophy. Stripe implementation must follow this policy.

**Related:** [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) · [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md) · [BUSINESS_MODEL.md](./BUSINESS_MODEL.md)

---

## Guiding Principles

IMMIFIN follows a simple and transparent billing model.

1. Customers always receive what they paid for.
2. Upgrades should be immediate.
3. Downgrades should never remove paid access.
4. Avoid refund complexity.
5. Avoid unexpected billing.
6. Customer experience is more important than maximizing short-term revenue.

---

## Subscription Plans

### IMMIFIN Pro

- Monthly
- Annual

### IMMIFIN Power

- Monthly
- Annual

---

## Upgrade Policy

### Monthly → Monthly

**Example:** Pro Monthly → Power Monthly

| | |
|---|---|
| **Effective** | Immediately |
| **Billing** | Stripe Proration |
| **Reason** | Customer immediately receives additional features. |

### Monthly → Annual

**Examples:**

- Pro Monthly → Pro Annual
- Power Monthly → Power Annual

| | |
|---|---|
| **Effective** | Immediately |
| **Billing** | Stripe Proration — unused monthly amount is credited automatically |
| **Reason** | Reward customers committing to annual billing. |

### Annual → Higher Annual

**Example:** Pro Annual → Power Annual

| | |
|---|---|
| **Effective** | Immediately |
| **Billing** | Stripe Proration |
| **Reason** | Customer immediately receives additional features. |

---

## Downgrade Policy

### Monthly → Lower Monthly

**Example:** Power Monthly → Pro Monthly

| | |
|---|---|
| **Effective** | Next Billing Cycle |
| **Reason** | Customer retains access until the paid month expires. |
| **Refunds** | No refunds. |

### Annual → Lower Annual

**Example:** Power Annual → Pro Annual

| | |
|---|---|
| **Effective** | Next Renewal Date |
| **Reason** | Customer retains access for the entire purchased year. |
| **Refunds** | No refunds. |

### Annual → Monthly

**Examples:**

- Power Annual → Power Monthly
- Pro Annual → Pro Monthly

| | |
|---|---|
| **Effective** | Next Renewal Date |
| **Reason** | Avoid partial refunds and billing complexity. |
| **Refunds** | No refunds. |
| **Self-service** | No self-service immediate conversion. |

---

## Cancellation Policy

Customers may cancel at any time.

| | |
|---|---|
| **Effective** | End of Current Billing Period |
| **Immediate cancellation** | Never |
| **Refunds** | No refunds for unused time |

---

## Customer Portal Rules

### Customer Portal allows

- ✓ Upgrade plans
- ✓ Downgrade plans
- ✓ Monthly → Annual
- ✓ Annual → Higher Annual
- ✓ Update payment method
- ✓ Download invoices
- ✓ View invoice history
- ✓ Cancel subscription

### Customer Portal does NOT allow

- ✗ Quantity changes
- ✗ Seat management
- ✗ Immediate annual refunds
- ✗ Immediate annual → monthly conversion

---

## Future Enterprise Features

Reserved for future versions:

- Team subscriptions
- Seat licensing
- Quantity changes
- Corporate billing
- HR plans
- Enterprise contracts
- Multi-seat management

---

## Business Philosophy

Customers should never feel punished for upgrading.

Customers should never lose access they already paid for.

The billing system should be predictable, transparent, and easy to understand.

Stripe should handle prorations wherever possible.

Manual refunds should be avoided except for exceptional support cases.

---

## Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 (Beta) | 2026-07-12 | Initial approved billing policy — Sprint 7 |
