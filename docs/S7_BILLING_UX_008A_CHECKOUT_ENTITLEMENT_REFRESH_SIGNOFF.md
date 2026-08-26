# S7-BILLING-UX-008A — Post-Checkout Entitlement Refresh Reliability

| Field | Value |
|-------|-------|
| **Story** | S7-BILLING-UX-008A |
| **Mode** | IMPLEMENT + VERIFY — TEST / local + `dev.immifin.com` only |
| **Date** | 2026-08-25 |
| **Git branch** | `main` |
| **HEAD (baseline)** | `f11ee975e3e5b0dea8340da36e92c17574ee7532` |
| **Result** | **PASS** (code + focused verify + regressions) |
| **Production** | **Not validated · not deployed** |
| **Stripe LIVE / TEST mutations this story** | **NONE** |

> Narrow remediation after S7-BILLING-UX-008 Free→Pro TEST Checkout proved payment, webhook signature, ledger, and Supabase sync all PASS — while Pricing stayed on “We're still confirming…” until a manual hard refresh.

---

## Observed symptom (TEST)

- Stripe Checkout Free→Pro Monthly: **PASS**
- Webhooks `checkout.session.completed` + `customer.subscription.created`: **HTTP 200**, signature **PASS**, ledger **completed**
- DB: `plan=pro`, Stripe IDs + `last_synchronized_at` populated
- Billing Center after hard refresh: **Pro Monthly / Active**
- Pricing immediately after return: timeout copy until manual refresh

**Ruled out:** payment failure, webhook failure, `STRIPE_WEBHOOK_SECRET` mismatch, DB sync failure.

---

## Root cause (code)

1. Pricing activation started the **30s poll timeout immediately** on `checkout=success`.
2. `SubscriptionTierProvider.refreshStoredTier()` returned **`null` without fetching** whenever Clerk `isSignedIn` was falsy — including while Clerk was still loading after return from Stripe.
3. Evidence from the TEST window: **no** `GET /api/account/subscription` after Checkout return in Next logs, despite Pro already synced.
4. Hard refresh worked because Clerk was loaded/signed-in and the API returned authoritative Pro.

Secondary hardening: transient fetch errors previously **cleared** stored tier to null; subscription GET lacked explicit `Cache-Control: no-store` response headers (client already used `cache: "no-store"`).

---

## Remediation

| Change | Purpose |
|--------|---------|
| Wait for Clerk `isLoaded && isSignedIn` before starting activation poll **and** timeout | Timeout clock starts only when authoritative reads can run |
| Pure helpers `canStartCheckoutActivationPolling` / `decideCheckoutActivationPoll` / `simulateCheckoutActivationPolling` | Testable activation decisions; no client entitlement grant |
| Provider: do not treat Clerk-loading as signed-out; do not wipe tier on transient errors | Avoid false Free mid-activation |
| Client fetch cache-bust `?_ts=` + `Cache-Control: no-cache` | Fresh entitlement reads while polling |
| `GET /api/account/subscription` → `Cache-Control: private, no-store, max-age=0, must-revalidate` | Narrow server cache safety for entitlement |

Webhook / sync / Checkout payment paths **unchanged**. Entitlement still comes only from authoritative API state.

---

## Validation

| Check | Result |
|-------|--------|
| `scripts/verify-s7-billing-ux-008a-checkout-entitlement-refresh.mjs` | **PASS** |
| UX-002–007 verifies | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| Focused lint | **PASS** |
| Stripe mutations | **NONE** |
| Authenticated browser re-Checkout | **Not re-run** (not authorized); hard-refresh Pro already proven |

---

## Follow-up

Resume **S7-BILLING-UX-008** controlled TEST E2E at **Pro Monthly → Power Monthly** (preview / Confirm & Pay). Do not start automatically from this story.
