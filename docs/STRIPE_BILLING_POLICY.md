# IMMIFIN Stripe Billing Policy

| Field | Value |
|-------|-------|
| **Version** | 1.0 (Beta) |
| **Status** | **Approved** |
| **Owner** | IMMIFIN |
| **Last Updated** | 2026-08-25 (S7-BILLING-UX-008E — TEST E2E reconciled; not Production-deployed) |

> **Authority:** This document is the **source of truth** for IMMIFIN subscription billing behavior — upgrades, downgrades, cancellations, Customer Portal rules, and refund philosophy. Stripe implementation must follow this policy.

**Related:** [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) · [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md) · [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) · [S7_OPS_STRIPE_033_LIVE_PRO_POWER_MONTHLY_E2E_SIGNOFF.md](./S7_OPS_STRIPE_033_LIVE_PRO_POWER_MONTHLY_E2E_SIGNOFF.md)

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

## Billing confirmation UX principle (commercial)

Technical plan changes may succeed before the confirmation UX is considered final.

### Upgrade confirmation (immediate when policy allows)

Before the customer confirms an immediate upgrade, IMMIFIN should present:

- Exact Stripe-authoritative billing preview (unused credit, remaining-period charge, **amount due today**)
- Explicit effective timing (e.g. Power active immediately)
- Masked saved payment method and clear charge statement
- Option to **change payment method** via Stripe-hosted/secure flow only
- Next regular renewal amount and date

List prices alone (or “may apply prorated charges”) are **not** sufficient for final commercial UX.

### Downgrade confirmation (next cycle when policy requires)

Before confirming a next-cycle downgrade or Paid → Free:

- Exact effective date
- Clear statement that current benefits remain through that date
- Clear next-plan / Free start date and amount (or no further charge)
- No ambiguity about future billing

**Product decision (S7-BILLING-UX-002):** Immediate paid upgrades will use an **invoice / charge now** commercial model (`proration_behavior: always_invoice` at execution). Preview models that future strategy today.

**Implemented:** **S7-BILLING-UX-002** — read-only `POST /api/stripe/subscription/preview` (Stripe `invoices.createPreview`, `always_invoice` modeled).

**Implemented (code):** **S7-BILLING-UX-003** — `executeImmediateUpgrade` uses `proration_behavior: "always_invoice"` + `payment_behavior: "pending_if_incomplete"` with signed preview authorization. Entitlement sync uses current subscription items only while `pending_update` is present.

**Implemented (code):** **S7-BILLING-UX-004** — upgrade preview returns customer-safe masked payment method (`displayLabel` such as `Visa •••• 1234`) using Stripe precedence: subscription default PM → customer invoice default PM → legacy card `default_source`.

**Implemented (code):** **S7-BILLING-UX-005** — change/add payment method via Stripe-hosted Billing Portal (`payment_method_update` deep link, PM-only configuration). IMMIFIN never collects PAN/CVC. Return invalidates prior upgrade preview authorization; fresh preview + explicit confirm required. Payment-method update alone does not execute the upgrade.

**Implemented (code):** **S7-BILLING-UX-006** — transparent immediate-upgrade confirmation: preview-first Stripe amount due now, credit/prorated charge when classified (else safe line items), next renewal, payment method, Change/Add PM, and entitlement-after-Stripe-confirm copy. **Not Production-deployed.**

**Implemented (code):** **S7-BILLING-UX-007** — scheduled downgrade transparency for `scheduled_downgrade`, `cancel_at_period_end`, and `scheduled_interval_change`: no charge today, authoritative period-end retention copy, target plan/price (catalog), Paid→Free no-further-charge copy. Does not change Stripe mutation strategy. **Not Production-deployed.**

**Implemented (code):** **S7-BILLING-UX-008B** — Billing Center surfaces a recognized Stripe Subscription Schedule destination (customer-safe tier/interval/effective date) and suppresses the equivalent duplicate paid-plan CTA. Does not persist schedule rows in Supabase; GET retrieves the attached schedule read-only. **Not Production-deployed.**

**Implemented (code):** **S7-BILLING-UX-008C** — An existing scheduled paid-plan transition may be replaced by Free only after explicit customer confirmation. Stripe sequence: `subscriptionSchedules.release` (drop the paid next phase, leave current plan) then `subscriptions.update({ cancel_at_period_end: true })`. Not an immediate cancellation. Entitlement stays on the current paid plan until the effective date. **TEST replacement executed once (PO); 008E reconciled. Not Production-deployed.**

**Implemented (code):** **S7-BILLING-UX-008D** — Visual redesign of the 008C replacement confirmation dialog only (IMMIFIN-native hierarchy, primary Keep CTA, destructive Replace). No Stripe or policy change. **Not Production-deployed.**

**TEST E2E (S7-BILLING-UX-008E):** Full Stripe TEST lifecycle **PASS** — Free → Pro Monthly → Power Monthly ($9.97) → Pro scheduled → Free scheduled at period end. See [008E signoff](./S7_BILLING_UX_008_FULL_STRIPE_TEST_E2E_SIGNOFF.md). **TEST validated. Production Worker unchanged.**

**Still pending:** Production deploy of billing UX; remaining **LIVE** transition matrix.

**Important:** This is **application code** alignment plus **TEST** proof. **Production Worker remains unchanged** until a later controlled deploy of these stories.

---

## Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 (Beta) | 2026-07-12 | Initial approved billing policy — Sprint 7 |
| 1.1 | 2026-08-24 | S7-OPS-STRIPE-034 — billing confirmation UX principle; S7-BILLING-UX-001 backlog |
| 1.2 | 2026-08-24 | S7-BILLING-UX-002 — invoice-now product decision; read-only preview foundation only |
| 1.3 | 2026-08-24 | S7-BILLING-UX-003 — charge-now execution + preview auth + SCA action path (not Production-deployed) |
| 1.4 | 2026-08-24 | S7-BILLING-UX-004 — masked payment method on upgrade preview (not Production-deployed) |
| 1.5 | 2026-08-24 | S7-BILLING-UX-005 — Stripe-hosted change/add payment method; preview invalidation on return (not Production-deployed) |
| 1.6 | 2026-08-24 | S7-BILLING-UX-006 — transparent immediate-upgrade confirmation (not Production-deployed) |
| 1.7 | 2026-08-24 | S7-BILLING-UX-007 — scheduled downgrade transparency (not Production-deployed) |
| 1.8 | 2026-08-25 | S7-BILLING-UX-008C — replace scheduled paid destination with Free after confirmation (not Production-deployed) |
| 1.9 | 2026-08-25 | S7-BILLING-UX-008D — replacement confirmation dialog visual redesign (not Production-deployed) |
| 1.10 | 2026-08-25 | S7-BILLING-UX-008E — full Stripe TEST lifecycle reconciliation PASS (not Production-deployed) |
