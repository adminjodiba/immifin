# S7-BILLING-UX-008D — Scheduled Plan Replacement Dialog Visual Redesign

| Field | Value |
|-------|-------|
| **Story** | S7-BILLING-UX-008D |
| **Mode** | Presentation-only refinement of UX-008C |
| **Date** | 2026-08-25 |
| **Git branch** | `main` |
| **HEAD (baseline)** | `f11ee975e3e5b0dea8340da36e92c17574ee7532` |
| **Result** | **PASS** (code + focused verify + UX-002–008C regressions) |
| **Production** | **Not validated · not deployed** |
| **Stripe / TEST schedule mutated** | **NO** |

Visual refinement of the **Replace scheduled plan change?** dialog. S7-BILLING-UX-008C replacement behavior is unchanged.

---

## What changed

The replacement confirmation now uses the approved information architecture:

- Warning icon + title + “You already have a plan change scheduled.”
- Current plan vs currently scheduled, side-by-side on desktop, stacked on narrow screens
- Warning callout that the paid destination will be replaced with Free
- **NO CHARGE TODAY** success callout
- Access-through-date informational callout
- Future destination panel (Free / $0 / paid subscription ends)
- One future destination copy
- **Keep {plan} Scheduled** uses canonical IMMIFIN `btn-primary` (cyan + gold sweep)
- **Replace With Free** uses existing `btn-danger-solid`
- Optional Stripe-managed footer

Values still come from the 008C view model (tier, interval, catalog price, authoritative period end). Fixture strings such as Power Monthly / Sep 25, 2026 are not hard-coded in the dialog.

---

## What did not change

Stripe schedule release, `cancel_at_period_end`, webhooks, entitlements, catalog, FetchHttpClient, and Billing Center confirm/cancel wiring.

---

## Validation

| Check | Result |
|-------|--------|
| `scripts/verify-s7-billing-ux-008d-replacement-dialog-visual.mjs` | **PASS** |
| UX-002 through UX-008C | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| Focused lint | **PASS** |
| localhost / tunnel | **200** / **200** |
| `[ Replace With Free ]` | **NOT EXECUTED** |

---

## Next action

Product Owner opens **Downgrade to Free** on the signed-in TEST Billing Center and visually inspects the redesigned dialog **without** clicking **Replace With Free**.
