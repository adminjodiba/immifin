# S7-BILLING-UX-008B — Scheduled Plan Change Visibility & Duplicate Action Suppression

| Field | Value |
|-------|-------|
| **Story** | S7-BILLING-UX-008B |
| **Mode** | IMPLEMENT + local/TEST **read-only** validation |
| **Date** | 2026-08-25 |
| **Git branch** | `main` |
| **HEAD (baseline)** | `f11ee975e3e5b0dea8340da36e92c17574ee7532` |
| **Result** | **PASS** (code + focused verify + regressions) |
| **Production** | **Not validated · not deployed** |
| **Existing TEST Stripe schedule mutated** | **NO** |

> Backend Power→Pro schedule already passed in UX-008. This story only surfaces that Stripe Subscription Schedule in Billing Center and suppresses the duplicate CTA.

---

## Defect

After a successful Power Monthly → Pro Monthly schedule:

- Transient banner: “Your downgrade is scheduled.”
- Summary: **Scheduled plan change: None**
- Actions still offered **Downgrade to Pro Monthly**

Stripe schedule was valid. IMMIFIN read model only treated `cancelAtPeriodEnd` (Free) as a scheduled change.

---

## Remediation

- Trusted server GET: retrieve subscription + attached schedule (read-only).
- Map next phase through approved catalog → customer-safe `{ targetTier, targetInterval, effectiveAt }`.
- Billing Center summary uses that destination; exact duplicate CTA suppressed.
- Immediate upgrades while a schedule exists are not offered (existing execute path 409s).
- Other scheduled paid changes that would **update** the existing schedule are not offered (replacement is out of scope).
- **Downgrade to Free** remains (policy follow-up — may conflict with an attached paid schedule).

Unknown/unapproved prices, terminal/released schedules, and same-price next phases → `scheduledPlanChange: null`.

---

## TEST fixture

Existing Power Monthly → Pro Monthly schedule was **not** recreated, cancelled, released, or updated by this story.

---

## Validation

| Check | Result |
|-------|--------|
| `scripts/verify-s7-billing-ux-008b-scheduled-plan-visibility.mjs` | **PASS** |
| UX-002–008A | **PASS** |
| BLP-BILL-FIX-001 actions | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| Focused lint | **PASS** |
| localhost / tunnel | **200** / **200** |
| Authenticated Billing Center reload (agent browser) | **Pending Clerk sign-in** |
| Stripe mutations this story | **NONE** |
