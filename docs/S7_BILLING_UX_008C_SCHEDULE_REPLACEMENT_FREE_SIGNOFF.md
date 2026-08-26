# S7-BILLING-UX-008C — Replace Existing Scheduled Paid Downgrade With Free

| Field | Value |
|-------|-------|
| **Story** | S7-BILLING-UX-008C |
| **Mode** | IMPLEMENT + local/TEST **non-mutating** validation |
| **Date** | 2026-08-25 |
| **Git branch** | `main` |
| **HEAD (baseline)** | `f11ee975e3e5b0dea8340da36e92c17574ee7532` |
| **Result** | **PASS** (code + focused verify + UX-002–008B regressions) |
| **Production** | **Not validated · not deployed** |
| **Existing TEST Stripe schedule mutated** | **NO** — Product Owner must authorize `[ Replace With Free ]` separately |

> Policy: an existing scheduled paid-plan transition may be replaced by Free only after explicit customer confirmation.

---

## Defect / policy gap

S7-BILLING-UX-008B correctly surfaces Power → Pro Monthly on Sep 25, 2026 and suppresses the duplicate **Downgrade to Pro Monthly** CTA. **Downgrade to Free** remained available.

Clicking it previously called `subscriptions.update({ cancel_at_period_end: true })` **without** resolving the attached Subscription Schedule. That is a second, conflicting billing transition (Power→Pro **and** cancel-at-period-end), not a replacement.

---

## Product policy (approved)

If a future paid-plan transition already exists and the customer chooses Free:

| | |
|--|--|
| **Existing** | Power → Pro at period end |
| **New request** | Power → Free at the **same** period end |
| **Result** | Power → Free at period end |

- Not an immediate downgrade or cancellation
- Power entitlement remains until the effective date
- Customer must explicitly authorize replacing the Pro destination
- No charge today
- Do not locally set `profiles.plan` / `subscriptions.plan` / entitlements to Free when the replacement is only scheduled

---

## Stripe replacement architecture

IMMIFIN already creates Power→Pro with `subscriptionSchedules.create({ from_subscription })` then `subscriptionSchedules.update` (two phases, `end_behavior: "release"`).

Rejected alternatives:

| Approach | Why not |
|----------|---------|
| Leave the Pro schedule and also set `cancel_at_period_end` | Conflicting destinations; Stripe typically rejects subscription updates while a schedule is attached |
| `subscriptionSchedules.cancel()` | Cancels the **subscription now** |
| Single `subscriptionSchedules.update` with `end_behavior: "cancel"` only | Stripe manages `cancel_at` on the last phase and does **not** reliably set `cancel_at_period_end`, which Billing Center / webhook sync / duplicate-Free suppression all use |

**Chosen sequence** (smallest Stripe-supported pair that matches IMMIFIN's existing Free path):

1. **`subscriptionSchedules.release`** on the attached active/`not_started` schedule  
   Removes remaining phases (Pro). Current Power subscription stays in place.  
   If this fails → original Power→Pro schedule is unchanged. Retry the whole operation.

2. **`subscriptions.update({ cancel_at_period_end: true })`**  
   Existing IMMIFIN Paid→Free scheduling. Authoritative destination is Free at current period end.  
   If this fails **after** a successful release → Power continues; Pro is gone; Free is not yet scheduled. Customer-visible error asks them to try **Downgrade to Free** again (now a normal cancel, no Pro schedule). Entitlement is not rewritten locally.

Stripe has no atomic “replace next phase with cancel_at_period_end” API. Failure after step 1 is recoverable by retrying step 2 only.

GET Billing Center already retrieves the live subscription. After this story it also uses live `cancel_at_period_end` (fallback to Supabase if retrieve fails) so an authoritative refresh does not wait solely on webhook lag to hide the duplicate Free CTA.

---

## Confirmation UX

When Billing Center has a recognized paid `scheduledPlanChange` and the customer chooses **Downgrade to Free**:

- Title: **Replace scheduled plan change?**
- Names current Power, existing Pro Monthly + date, replacement Free + date
- **NO CHARGE TODAY** (existing uppercase-styled label)
- Power remains through the exact date
- Paid subscription ends on that date
- Left: **Keep Pro Scheduled** (no Stripe mutation)
- Right: **Replace With Free** (destructive)

Generic `[Cancel] [Confirm]` is not used.

Success (when mutation is later authorized): dated copy, e.g.  
`Your downgrade to Free is scheduled for Sep 25, 2026. Your Power access remains active until then.`

---

## Resulting Billing Center (after authorized mutation + refresh)

Expected:

- Current plan: Power Monthly
- Downgrade to Free scheduled: Yes
- Scheduled plan change: Free on Sep 25, 2026 (current plan remains active until then)
- Pro Monthly destination gone
- Duplicate **Downgrade to Free** CTA suppressed (`cancelAtPeriodEnd`)

**Not executed in this story.** TEST fixture left intact.

---

## Validation

| Check | Result |
|-------|--------|
| `scripts/verify-s7-billing-ux-008c-schedule-replacement-free.mjs` | **PASS** |
| UX-002 through UX-008B | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| Focused lint | **PASS** |
| localhost / tunnel | **200** / **200** |
| `[ Replace With Free ]` against TEST Power→Pro fixture | **NOT EXECUTED** |
| Stripe mutations this story | **NONE** |

---

## Next action

Product Owner opens **Downgrade to Free** on the signed-in TEST Billing Center and visually verifies the replacement confirmation dialog **without** clicking **Replace With Free**.
