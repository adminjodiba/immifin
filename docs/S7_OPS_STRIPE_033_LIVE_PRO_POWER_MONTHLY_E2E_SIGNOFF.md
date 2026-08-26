# S7-OPS-STRIPE-033 — LIVE Pro Monthly → Power Monthly E2E Signoff

| Field | Value |
|-------|-------|
| **Document** | LIVE Pro → Power Monthly Production E2E Signoff |
| **Story (execution)** | S7-OPS-STRIPE-033 |
| **Story (documentation)** | S7-OPS-STRIPE-034 |
| **Date** | 2026-08-24 |
| **Environment** | Production — `https://immifin.com` |
| **Technical LIVE E2E** | **PASS** |
| **Customer upgrade UX** | **ENHANCEMENT REQUIRED BEFORE FINAL COMMERCIAL SIGNOFF** |

> **Authority:** Records successful Production technical validation of Pro Monthly → Power Monthly and Product Owner–approved billing confirmation UX gaps. Does **not** declare the current upgrade dialog final commercial UX.

**Related:** [S7_OPS_STRIPE_032_LIVE_FREE_PRO_MONTHLY_E2E_SIGNOFF.md](./S7_OPS_STRIPE_032_LIVE_FREE_PRO_MONTHLY_E2E_SIGNOFF.md) · [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md) · [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md) · [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md) · [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md)

**Rules:** Do not store secret values, full Stripe object IDs, or payment credentials.

---

## 1. Dual status (read carefully)

| Layer | Status |
|-------|--------|
| **TECHNICAL LIVE E2E** | **PASS** |
| **CUSTOMER UPGRADE UX** | **ENHANCEMENT REQUIRED BEFORE FINAL COMMERCIAL SIGNOFF** |

Technical path validated. Current confirmation UI is **not** final commercial UX.

---

## 2. Technical LIVE E2E result

| Field | Value |
|-------|-------|
| **Transition** | Pro Monthly → Power Monthly |
| **Starting state** | Pro · Monthly · $9.99/month · Active · Aug 24 → Sep 24, 2026 |
| **Human action** | `/account/billing` → Upgrade to Power Monthly → confirm |
| **Backend** | `POST /api/stripe/subscription/change` → Ok |
| **Webhook** | `POST /api/webhooks/stripe` → Ok · `customer.subscription.updated` · completed |
| **Transport** | Existing `getStripeClient()` / `Stripe.createFetchHttpClient()` |

Validated chain:

```text
Billing Center
  → billing policy (immediate_upgrade)
  → Stripe subscriptions.update
  → FetchHttpClient
  → customer.subscription.updated
  → webhook verification
  → Supabase synchronization
  → Power entitlement
```

Confirmation dialog at time of action (as shown):

| Field | Shown |
|-------|--------|
| Current | Pro Monthly — $9.99/month |
| New | Power Monthly — $19.99/month |
| Timing | Immediate |
| Warning | “Stripe may apply prorated charges or credits.” |

---

## 3. Final Production state (after upgrade)

| Field | Value |
|-------|-------|
| Plan | **Power** |
| Interval | **Monthly** |
| Amount | **$19.99/month** |
| Status | **Active** |
| Current period | Aug 24, 2026 → Sep 24, 2026 |
| Renewal | Sep 24, 2026 |
| Scheduled downgrade | No |
| Scheduled plan change | None |

---

## 4. Product Owner UX findings (not final)

### A. Payment method transparency

Upgrade reused the existing Stripe payment method automatically. No Checkout / payment-method confirmation screen. User was not told which stored method would be charged.

**Desired:** Masked method (e.g. `Visa •••• 1234`), clear statement it will be used, and **Change payment method** via Stripe-hosted/secure flow only (never raw card collection in IMMIFIN).

### B. Exact proration transparency

Generic “may apply prorated charges or credits” is insufficient.

**Desired before confirm (Stripe-authoritative preview):** unused Pro credit, Power charge for remaining period, **amount due today**, next renewal amount/date. Do **not** hand-calculate if Stripe preview exists.

### C. Upgrade effective date

Policy: upgrades immediate when allowed. UI should explicitly say Power becomes active **immediately** (not only generic “Immediate”).

### D. Downgrade transparency standard (future)

State benefits retained through `<date>` and new plan starts on `<date>`, including Paid → Free.

---

## 5. IMMIFIN billing confirmation UX principle

**UPGRADE** (when policy allows immediate):

- Immediate entitlement
- Exact Stripe billing preview
- Explicit effective timing
- Explicit masked payment method
- Option to change payment method (Stripe-hosted)
- Explicit amount due today
- Next renewal amount/date

**DOWNGRADE** (when policy is next-cycle):

- No immediate loss of already-paid entitlement
- Exact effective date
- Benefits retained until that date
- Clear next-plan amount
- No ambiguity about future billing

---

## 6. Follow-up backlog

| ID | Title | Status |
|----|-------|--------|
| **S7-BILLING-UX-001** | Transparent Upgrade / Downgrade Billing Confirmation | **Backlog — not implemented** |

Scope: Stripe proration preview; amount due today; unused-plan credit; next renewal; masked saved PM; change-PM option; immediate-upgrade effective date; next-cycle downgrade effective date; consistent confirmation UX across supported transitions.

Also preserve deferred: “Contact IMMIFIN Support” → hyperlink to Contact Us email/contact section.

---

## 7. Signoff

| Decision | Result |
|----------|--------|
| Technical Pro→Power LIVE E2E | **PASS** |
| Final commercial upgrade UX | **Not signed off** — requires S7-BILLING-UX-001 |
| Broader transition matrix | Still pending (interval changes, Downgrade to Free, etc.) |

---

## Revision History

| Version | Date | Story | Description |
|---------|------|-------|-------------|
| v1.0 | 2026-08-24 | S7-OPS-STRIPE-034 | Technical PASS + customer upgrade UX enhancement required |
