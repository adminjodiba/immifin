# S7-BILLING-UX-008 — Stripe TEST Billing Lifecycle E2E Signoff

| Field | Value |
|-------|-------|
| **Story** | S7-BILLING-UX-008 |
| **Mode** | Stripe **TEST** only · Clerk Development · localhost + `dev.immifin.com` |
| **Date** | 2026-08-25 |
| **Git branch** | `main` |
| **HEAD** | `f11ee975e3e5b0dea8340da36e92c17574ee7532` |
| **Result** | **PARTIAL — BLOCKED** (authenticated browser session required for paid mutation + entitlement sync) |
| **Production** | **Not validated · not deployed** |
| **Stripe LIVE modified** | **NO** |

> Validation-only story. No remediation code was implemented. No commit / push / deploy.

---

## Environments

| Check | Result |
|-------|--------|
| Stripe secret classification | **TEST** (`sk_test_…`) — no LIVE key detected |
| Clerk (local/tunnel) | Development (`.env.local` publishable/test configuration) |
| `http://localhost:3000` | **200** |
| `https://dev.immifin.com` | **200** |
| Cloudflare tunnel `immifin-dev` | Connector present / healthy |
| FetchHttpClient | Present (`Stripe.createFetchHttpClient()` in `lib/stripe/server.ts`) |

---

## Architecture audit (pre-mutation)

| Requirement | Result |
|-------------|--------|
| Preview uses `always_invoice` | **PASS** (`subscription-change-preview.ts`) |
| Execution uses `always_invoice` + `pending_if_incomplete` | **PASS** (`subscription-change.ts`) |
| Trusted `prorationDate` via `previewAuthorization` | **PASS** (create + verify HMAC auth) |
| Browser forbidden: customer/sub/price IDs, raw `prorationDate` | **PASS** (`subscription-change-request.ts`) |
| Sync ignores `pending_update` destination until paid | **PASS** (`subscription-sync.ts`) |
| Material architecture drift | **None found** |

---

## TEST fixture starting state

| Field | Value |
|-------|-------|
| Plan | **Power Monthly** (only active TEST paid subscription found) |
| Status | `active` |
| `cancel_at_period_end` | `false` |
| Stripe schedule attached | `false` |
| Period end (UTC) | `2026-09-13T15:14:31.000Z` |
| Masked payment method (preview resolver) | **present** — display `Link` (no PAN) |
| Preferred Pro→Power | **Unavailable** (fixture already Power) |

Substitution for immediate path: **Power Monthly → Power Annual** (policy `immediate_upgrade`).

---

## Completed validations

### Read-only upgrade preview — PASS

Scenario: Power Monthly → Power Annual

| Field | Observed |
|-------|----------|
| Amount due now | `16418` USD cents (`$164.18`) |
| Credit | `-1225` |
| Prorated charge | `17643` |
| Billing mode | `classified` |
| Confirm label | `Confirm & Pay $164.18` |
| Next renewal | `2026-09-13T15:14:31.000Z` · amount `19999` |
| Payment method | masked `Link` · status `present` |
| `subscriptions.update` during preview | **0** |

### Payment-method portal session (non-mutating) — PASS

| Field | Observed |
|-------|----------|
| Hosted URL host | `billing.stripe.com` |
| Return URL | `https://dev.immifin.com/account/billing?payment_method=updated` |
| Plan unchanged after session create | **Yes** |
| `subscriptions.update` | **0** |

Authenticated UI return → fresh preview invalidation was **not** exercised (no signed-in session).

### Scheduled downgrade dialog (read-only) — PASS

Power → Pro Monthly copy: **No charge today**, retention through **Sep 13, 2026**, starting **Pro Monthly $9.99/month**, confirm **Schedule downgrade**.

### Authenticated browser — BLOCKED

Browser opened `https://dev.immifin.com/account/billing` and was redirected to Clerk Development sign-in. No authenticated TEST session available to the agent.

### Controlled immediate upgrade execution — NOT EXECUTED

Blocked pending authenticated Billing Center session so webhook → Supabase → entitlement can be observed against the real TEST account. Stripe-only mutation without that session would risk fixture damage without proving IMMIFIN sync.

### Scheduled downgrade execution — NOT EXECUTED

Same authentication blocker. Read-only dialog validation only.

### Downgrade to Free — READ-ONLY / NOT SAFE TO EXECUTE

Would conflict with preserving the single useful Power Monthly TEST fixture before authenticated upgrade E2E completes.

---

## Regression suites

| Suite | Result |
|-------|--------|
| UX-002 | **PASS** |
| UX-003 | **PASS** |
| UX-004 | **PASS** (harness reconciled 2026-08-25: stale “no Change PM” assert replaced with UX-005 hosted-control + no raw-card security asserts) |
| UX-005 | **PASS** |
| UX-006 | **PASS** |
| UX-007 | **PASS** |
| `npx tsc --noEmit` | **PASS** |

### D1 — UX-004 verification script drift — RESOLVED (test harness only)

| | |
|--|--|
| **Expected** | Focused UX-004 suite remains green after UX-005 |
| **Actual (before)** | Asserted dialog must **not** contain “Change payment method” |
| **Remediation** | Verification script only: allow Change/Add PM labels; require Stripe-hosted portal client endpoint; keep no cardNumber/CVC/PAN asserts; preview PM server still must not create portal/setup |
| **Production application code modified** | **NO** |
| **Implementation performed (billing behavior)** | **NO** |

### D2 — Billing Center schedule destination display gap (Power→Pro)

| | |
|--|--|
| **Expected** | After scheduling Power→Pro, Billing Center can show destination plan separately from current Power |
| **Actual** | `describeScheduledChange` / `BillingSummary` only clearly models Free via `cancelAtPeriodEnd`; no `scheduledPlan` field for Stripe Subscription Schedule destinations |
| **Evidence** | `lib/billing/billing-center.ts` `describeScheduledChange`; TEST fixture `has_schedule: false` pre-mutation |
| **Failure boundary** | Read-model / display (not proven as schedule persistence bug — schedule execution not run) |
| **Classification** | **A. display/read-model gap** (candidate follow-up), pending execution proof |
| **Implementation performed** | **NO** |

### D3 — Authenticated E2E not completable by agent

| | |
|--|--|
| **Expected** | Signed-in TEST user can complete Confirm & Pay + webhook entitlement proof |
| **Actual** | Clerk sign-in required; no session available |
| **Failure boundary** | Operator authentication / fixture access |
| **Recommended remediation** | Product Owner signs into Development Clerk on `dev.immifin.com`, then re-run Steps 4–7 |
| **Implementation performed** | **NO** |

---

## Production safety

- Stripe LIVE modified: **NO**
- Production deployed: **NO**
- Nothing staged / committed / pushed for this story

---

## GO / NO-GO

**NO-GO for UX-008 PASS** — remaining authenticated Confirm & Pay, webhook entitlement, and scheduled-downgrade execution still required.

**Architecture + read-only TEST evidence are healthy** to continue once signed in.
