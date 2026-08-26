# S7-OPS-STRIPE-032 — LIVE Free → Pro Monthly Production E2E Signoff

| Field | Value |
|-------|-------|
| **Document** | LIVE Free → Pro Monthly Production E2E Signoff |
| **Story** | S7-OPS-STRIPE-032 |
| **Date** | 2026-08-24 |
| **Environment** | Production — `https://immifin.com` |
| **Result** | **PASS** |
| **Status** | **Signed off — documentation record** |

> **Authority:** Historical production validation and root-cause record for IMMIFIN’s first successful LIVE Stripe Free → Pro Monthly subscription. Operational handbook: [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md). As-built design: [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md). Sprint as-built: [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md).

**Related:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [ROADMAP_v2.md](./ROADMAP_v2.md) · [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md) · [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md)

**Rules:** Do not store secret values (`sk_*`, `whsec_*`), full Stripe object IDs, or payment credentials in this document. Mask identifiers when needed.

---

## 1. Executive result

| Field | Value |
|-------|-------|
| **E2E** | LIVE Free → Pro Monthly |
| **Amount** | $9.99/month |
| **Final entitlement** | Pro |
| **Billing Center** | Active · Pro · Monthly |
| **Verdict** | **PASS** |

Validated chain:

```text
IMMIFIN Free account
  → Checkout request
  → Stripe Customer creation
  → customer mapping persistence
  → Stripe LIVE Checkout Session
  → real $9.99 payment
  → checkout.session.completed
  → valid webhook delivery
  → Stripe subscription synchronization
  → IMMIFIN Pro entitlement
  → Billing Center Active state
```

This signoff does **not** mark every Stripe billing transition complete. Remaining controlled validations are listed in §9.

---

## 2. Release artifacts (Fetch transport)

| Artifact | Value |
|----------|-------|
| **Git commit (FetchHttpClient)** | `f11ee975e3e5b0dea8340da36e92c17574ee7532` (`f11ee97`) — `fix(stripe): use fetch transport for Cloudflare Workers` |
| **Production Worker version** | `fc20ff12-a30f-463d-ab28-dd78455ab486` (controlled deploy of that commit) |
| **Code change** | `lib/stripe/server.ts` — `httpClient: Stripe.createFetchHttpClient()` |
| **API version** | `2026-06-24.dahlia` (unchanged) |
| **Stripe SDK** | 22.3.1 |

Prior related Production baseline (customer Search skip on first-time Checkout): commit `5916e0abb3ad3fa7b009eecd3d34728e2f522ebb` / Worker `97a1e9ec-8fb5-42c3-964d-b61a171a8220` (S7-OPS-STRIPE-026 / 027). Transport hang remained until FetchHttpClient.

---

## 3. Root cause #1 — Stripe HTTP transport (Cloudflare Workers)

### Production failure

Checkout reached:

- `CHECKOUT_REQUEST_RECEIVED`
- `AUTH_COMPLETE`
- `PROFILE_SUBSCRIPTION_READY`
- `CHECKOUT_ELIGIBILITY_PASSED`
- `STRIPE_CLIENT_READY`
- `CUSTOMER_RESOLUTION_START`

First-time customer path reached `CUSTOMER_CREATE_START` and stalled on `stripe.customers.create(...)`. Cloudflare cancelled the request / `waitUntil` work. Browser showed **Failed to fetch**.

Local Node / Stripe TEST did **not** reproduce the hang.

### Diagnosis

| Finding | Detail |
|---------|--------|
| Stripe SDK | 22.3.1 |
| OpenNext Production bundle | Resolved Stripe **Node** entry → default **NodeHttpClient** |
| Runtime | Cloudflare Workers / workerd |
| Effect | Outbound Stripe API calls hung (Customer Search historically; Customer Create after Search was removed from the Checkout critical path) |

### Remediation

Explicit Fetch transport on the server singleton:

```ts
httpClient: Stripe.createFetchHttpClient()
```

No Stripe products/prices/Dashboard changes. No database schema change. No Clerk change. No billing policy change.

### Pre-deploy TEST validation (`dev.immifin.com`)

Authenticated TEST Checkout completed without multi-minute stall. Representative sequence:

- Through `CHECKOUT_RESPONSE_RETURNED`
- `POST /api/stripe/checkout` → **200**
- No payment performed during TEST validation

### Controlled Production Fetch deploy

Commit `f11ee97` pushed to `main`; OpenNext Production build with Clerk `pk_live_` bake-in; Worker deploy version `fc20ff12-a30f-463d-ab28-dd78455ab486`.

### Post-deploy LIVE Checkout (pre-payment)

Production Free → Pro Monthly Checkout succeeded end-to-end through session creation. Representative timings:

| Checkpoint | Approx. elapsed |
|------------|-----------------|
| `CUSTOMER_CREATE_COMPLETE` | ~723 ms |
| `CUSTOMER_MAPPING_PERSIST_COMPLETE` | ~966 ms |
| `CHECKOUT_SESSION_CREATE_COMPLETE` | ~2088 ms |
| `CHECKOUT_RESPONSE_RETURNED` | ~2088 ms |

`POST /api/stripe/checkout` → OK. Stripe LIVE Checkout opened. **Cloudflare Stripe outbound HTTP transport issue resolved.**

---

## 4. LIVE payment

| Field | Value |
|-------|-------|
| **Plan** | Pro Monthly |
| **Amount** | $9.99/month |
| **Mode** | Stripe LIVE |

Observed Stripe success-class events (names only; no object IDs):

- `payment_intent.succeeded`
- `charge.succeeded`
- `invoice.paid`
- `invoice.payment_succeeded`
- `checkout.session.completed`
- `customer.subscription.created`

Card details and payment credentials are **not** recorded here.

---

## 5. Root cause #2 — Webhook signature mismatch

### Symptom after payment

IMMIFIN remained Free. UI: “We're still confirming your subscription”. Synchronized billing fields remained unset (`stripe_subscription_id` / `stripe_price_id` / `last_synchronized_at` null; plan Free / inactive). Checkout **had** already persisted `stripe_customer_id`.

### Stripe Dashboard evidence

`checkout.session.completed` delivered to `https://immifin.com/api/webhooks/stripe` returned:

- **HTTP 400 Bad Request**
- Body: `{ "error": "Invalid Stripe webhook signature." }`

### Root cause

Production Worker `STRIPE_WEBHOOK_SECRET` did **not** match the signing secret of the **active LIVE** webhook endpoint. Configuration issue — not entitlement/read-path logic.

### Remediation

`STRIPE_WEBHOOK_SECRET` corrected for the active LIVE endpoint. **Secret value never recorded in docs or logs.** No application code change required.

---

## 6. Controlled webhook recovery

Failed `checkout.session.completed` was manually resent from Stripe Dashboard (two manual attempts). Both ultimately showed **200 OK / Delivered** (retried manually).

At the observed application level, duplicate delivery did **not** create a visible duplicate subscription or duplicate Pro entitlement — consistent with safe webhook idempotency/ledger behavior. This signoff does not over-claim internal ledger row details beyond that application observation.

---

## 7. Final subscription state (after activation)

### Pricing

- Current subscription: **Pro Monthly — $9.99/month**
- Pro: **CURRENT PLAN**
- Free: Downgrade to Free available
- Power: Upgrade to Power available

### Billing Center

| Field | Value |
|-------|-------|
| Current subscription | Pro · Monthly |
| Amount | $9.99/month |
| Subscription status | Active |
| Current period start | Aug 24, 2026 |
| Current period end | Sep 24, 2026 |
| Renewal date | Sep 24, 2026 |
| Downgrade to Free scheduled | No |
| Scheduled plan change | None |

Available actions observed: Upgrade to Power Monthly; Switch to Pro Annual; Downgrade to Free.

---

## 8. Post-activation production health

Fresh Cloudflare Worker tail after activation observed healthy requests, including:

- `GET /account/billing` → Ok
- `GET /api/account/subscription` → Ok
- `GET /api/account/favorites` → Ok
- `GET /api/account/contact-status` → Ok

No new Stripe/webhook/runtime error observed during post-activation Billing refresh.

---

## 9. Remaining Stripe validation matrix

Still require **separate controlled validation** (do not treat as complete):

| Transition / lifecycle | Status |
|------------------------|--------|
| Pro Monthly → Power Monthly | Pending |
| Pro Monthly → Pro Annual | Pending |
| Downgrade to Free / end-of-period | Pending |
| Other supported monthly/yearly transitions | Pending |
| Cancellation / renewal lifecycle (as applicable) | Pending |

Sprint 7 is **not** declared fully complete solely by this Free → Pro Monthly LIVE E2E.

---

## 10. Permanent operational lessons

1. **Cloudflare Stripe transport** — IMMIFIN Stripe API clients on Workers must explicitly use `Stripe.createFetchHttpClient()`. Do not rely on Stripe `NodeHttpClient` via the OpenNext Worker bundle.
2. **LIVE webhook secret** — Production `STRIPE_WEBHOOK_SECRET` must match the signing secret of the exact active LIVE endpoint `https://immifin.com/api/webhooks/stripe`. TEST and LIVE webhook secrets differ.
3. **Cloudflare “Ok” ≠ webhook success** — Tail “Ok” alone does not prove application-level processing. Confirm Stripe Dashboard HTTP status/response **and** IMMIFIN durable subscription state.
4. **Checkout success ≠ entitlement** — Successful payment alone must not grant entitlement. IMMIFIN entitlement remains webhook-driven and must be confirmed from synchronized subscription state.
5. **Never log or document secrets** — Never store `sk_live_` / `sk_test_` / `whsec_` values, full payment credentials, or card data in repository documentation or diagnostic output.

---

## 11. Deferred UX item (do not implement in this story)

Whenever IMMIFIN displays “Contact IMMIFIN Support” (or equivalent), the support text should be a **hyperlink** to the email/contact section of the IMMIFIN Contact Us page. Observed on the delayed subscription-activation warning. Track separately; do not mix into Stripe code releases.

---

## 12. Signoff

| Role | Decision |
|------|----------|
| Engineering / Operations record | LIVE Free → Pro Monthly E2E **PASS** documented 2026-08-24 |
| Broader v0.5.0 commercial matrix | **Not** fully signed off — remaining transitions pending |

---

## Revision History

| Version | Date | Story | Description |
|---------|------|-------|-------------|
| v1.0 | 2026-08-24 | S7-OPS-STRIPE-032 | First LIVE Free → Pro Monthly E2E PASS + transport/webhook root causes |
