# IMMIFIN Production Deployment Runbook

| Field | Value |
|-------|-------|
| **Document** | Production Deployment Runbook |
| **Version** | v1.0 |
| **Applies to** | IMMIFIN **v0.5.0** — Commercial Platform |
| **Last Updated** | 2026-07-20 |
| **Task** | S7-DOC-011 |
| **Owner** | Engineering / Operations |
| **Status** | Official — executable cutover procedure |

> **Authority:** This runbook is the step-by-step procedure for deploying and activating IMMIFIN v0.5.0 commercial billing in production. It does **not** replace design or policy docs. Prefer [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md) for day-to-day Stripe ops detail.

**Related:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) · [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md) · [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [RELEASE_NOTES_v0.5.0.md](./RELEASE_NOTES_v0.5.0.md) · [SPRINT_RELEASE_CHECKLIST.md](./SPRINT_RELEASE_CHECKLIST.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)

**Golden rule:** Never assume success. Never skip a failed gate. Never enable Live Stripe until Sandbox validation passes.

---

## 1. Purpose

| Question | Answer |
|----------|--------|
| **Why this runbook exists** | To make v0.5.0 commercial cutover repeatable, gated, and safe — so Live billing is not enabled by improvisation |
| **When to use it** | Before and during production deployment / Live Stripe activation for the commercial platform |
| **Who executes it** | An IMMIFIN engineer with Cloudflare, Supabase, and Stripe Dashboard access, plus Product Owner approval for Live enablement |

This document is an **operational manual**. Follow phases in order. Stop on any failed check.

---

## 2. Deployment Preconditions

Nothing proceeds until **all** items below are complete.

| # | Precondition | Done |
|---|--------------|------|
| 1 | Sprint 7 commercial implementation complete in application code | ☐ |
| 2 | Documentation complete for cutover (handoff, ops, architecture, release notes, this runbook) | ☐ |
| 3 | Git working tree clean of release-scoped changes (no unrelated WIP mixed into the release commit) | ☐ |
| 4 | Release code committed on `main` | ☐ |
| 5 | Release code pushed to `origin/main` | ☐ |
| 6 | Production branch verified (`main` / expected commit SHA recorded) | ☐ |
| 7 | Stripe **Sandbox / Test Mode** signed E2E validated (Checkout → webhook → sync → capabilities → Billing Center) | ☐ |
| 8 | Database migrations prepared and reviewed (`supabase/migrations/` including webhook foundation) | ☐ |
| 9 | Cloudflare access verified (`wrangler whoami` / Dashboard access) | ☐ |
| 10 | Product Owner approval received to proceed with Live enablement | ☐ |

If any box is unchecked, **do not** enable Live keys or declare commercial production ready.

---

## 3. Deployment Sequence

### Phase 1 — Repository Verification

| | |
|---|---|
| **Purpose** | Confirm the exact code about to ship |
| **Required checks** | `git status -sb` clean for release scope; `git log -1` shows expected commit; `git rev-parse HEAD` matches `origin/main`; no secrets in the commit |
| **Expected outcome** | Known commit SHA recorded in §11 |
| **Rollback trigger** | Unexpected files, wrong branch, secrets in tree, local ahead/behind mismatch unresolved |

### Phase 2 — Stripe Verification (Sandbox first)

| | |
|---|---|
| **Purpose** | Prove Test Mode commercial path before any Live secrets |
| **Required checks** | Complete §4 Sandbox checklist; signed webhook delivery; plan + capabilities update after Checkout; Billing Center plan change in Test Mode |
| **Expected outcome** | Written Sandbox pass note (date, tester, Stripe event IDs) |
| **Rollback trigger** | Any Sandbox failure; do **not** proceed to Live keys |

### Phase 3 — Database Verification

| | |
|---|---|
| **Purpose** | Ensure production Supabase can accept webhook ledger + subscription billing fields |
| **Required checks** | Complete §6; webhook foundation migration applied to **production** Supabase; claim/complete RPCs available; no pending required migrations |
| **Expected outcome** | Production DB ready for durable Stripe events |
| **Rollback trigger** | Migration failure, missing tables/columns, broken constraints |

### Phase 4 — Cloudflare Configuration (Live secrets)

| | |
|---|---|
| **Purpose** | Configure Production Worker with Live Stripe catalog and secrets **only after Phase 2 passes** |
| **Required checks** | Complete §5; Live keys/prices/webhook secret set; `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE` unset/false; no Test keys in Production |
| **Expected outcome** | Production env matrix uses Live mode only |
| **Rollback trigger** | Mixed Test/Live values; missing Price IDs; Dev Mode still on |

### Phase 5 — Production Deployment

| | |
|---|---|
| **Purpose** | Ship / confirm Worker build for the release commit on `immifin.com` |
| **Required checks** | Cloudflare deploy succeeds for the recorded SHA; Worker healthy; domain serves expected app |
| **Expected outcome** | Production running release commit; deployment ID recorded in §11 |
| **Rollback trigger** | Build failure, Worker errors, site down, wrong version serving |

### Phase 6 — Smoke Testing

| | |
|---|---|
| **Purpose** | Confirm core product still works after deploy |
| **Required checks** | Complete §7 (non-billing and light billing probes as safe) |
| **Expected outcome** | Auth, dashboard, pricing, profile, admin, notifications baseline OK |
| **Rollback trigger** | Login broken, major pages down, widespread 5xx |

### Phase 7 — Billing Validation (Live, controlled)

| | |
|---|---|
| **Purpose** | Prove Live money path with a controlled PO-approved transaction |
| **Required checks** | Live Checkout → Live webhook → Supabase sync → capabilities; Billing Center change on Live test account; refund/cancel per PO if required |
| **Expected outcome** | Paid access correct; no manual DB entitlement edits required |
| **Rollback trigger** | Checkout, webhook, sync, or capability mismatch |

### Phase 8 — Final Approval

| | |
|---|---|
| **Purpose** | Formal commercial go-live signoff |
| **Required checks** | §9 post-deployment validation complete; Product Owner + Engineering sign §11 |
| **Expected outcome** | v0.5.0 commercial production approved |
| **Rollback trigger** | Any open P0 defect; incomplete checklists |

---

## 4. Stripe Checklist

### Sandbox / Test Mode (required before Live)

| Check | Done | Notes |
|-------|------|-------|
| Test Mode Products / Prices exist (Pro/Power × monthly/annual) | ☐ | Record IDs in [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md) Appendix A |
| Test secret + publishable keys configured in local/tunnel env | ☐ | `sk_test` / `pk_test` only |
| Test Price env vars set (`STRIPE_PRICE_*`) | ☐ | |
| Test webhook endpoint registered (tunnel or CLI forward) | ☐ | e.g. `https://dev.immifin.com/api/webhooks/stripe` |
| Test `STRIPE_WEBHOOK_SECRET` matches endpoint | ☐ | |
| Checkout creates session and completes with Stripe test card | ☐ | |
| Webhook events received and signature-verified | ☐ | `checkout.session.completed` + subscription events |
| Subscription sync written to Supabase | ☐ | plan, customer ID, subscription ID, periods, status |
| Capability sync unlocks expected Pro/Power features | ☐ | |
| Billing Center upgrade / downgrade / cancel path works in Test | ☐ | |
| Browser success URL alone does **not** grant access without webhook | ☐ | |

**Sandbox gate:** All rows above must pass before Phase 4 Live configuration.

### Live Mode (only after Sandbox gate)

| Check | Done | Notes |
|-------|------|-------|
| Live Products created (IMMIFIN Pro, IMMIFIN Power) | ☐ | |
| Live Prices created (approved USD amounts) | ☐ | Record IDs in ops Appendix A |
| Live `STRIPE_SECRET_KEY` in Cloudflare Production | ☐ | Never commit |
| Live `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in Cloudflare Production | ☐ | |
| Live Price IDs in Cloudflare Production (`STRIPE_PRICE_*`) | ☐ | |
| Live webhook endpoint `https://immifin.com/api/webhooks/stripe` | ☐ | |
| Live `STRIPE_WEBHOOK_SECRET` in Cloudflare Production | ☐ | |
| Required events enabled on Live endpoint | ☐ | see design/ops supported list |
| `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE` **disabled** in Production | ☐ | unset or false |
| No Test keys/prices mixed into Production | ☐ | |
| Controlled Live smoke payment approved by Product Owner | ☐ | |

---

## 5. Cloudflare Checklist

| Check | Done | Expected |
|-------|------|----------|
| Worker name `immifin` accessible | ☐ | Dashboard / `wrangler` |
| Deploy source is GitHub `main` (or approved deploy command) | ☐ | Matches release SHA |
| Production domain `https://immifin.com` | ☐ | Resolves to Worker |
| Environment variables / secrets set for Production | ☐ | Clerk, Supabase, Google Sheets, Stripe Live (Phase 4+) |
| Stripe secrets isolated to Production Live values | ☐ | No `sk_test` in Production |
| Dev Subscription Mode off in Production | ☐ | |
| Deployment completes without build error | ☐ | Record deployment ID |
| Health check: home / pricing load | ☐ | HTTP success for public pages |
| Webhook route responds (rejects invalid signature) | ☐ | Not a silent 404 for POST |
| Caching / CDN not serving stale Worker for API routes | ☐ | Billing/webhook changes visible |
| Observability / logs reachable for incident response | ☐ | |

---

## 6. Database Checklist

| Check | Done | Expected |
|-------|------|----------|
| Production Supabase project identified | ☐ | Correct project (not local/dev) |
| Migration `20260712120000_018_stripe_webhook_foundation.sql` applied | ☐ | Or equivalent webhook foundation |
| `stripe_webhook_events` (or ledger) present | ☐ | Durable claim/complete supported |
| `subscriptions` billing columns present | ☐ | Stripe IDs, intervals, periods, status as designed |
| Profiles / plan fields usable by capability resolver | ☐ | |
| No pending **required** migrations for v0.5.0 | ☐ | |
| Indexes / constraints for webhook idempotency healthy | ☐ | |
| Rollback/restore path understood (Supabase backup / PITR) | ☐ | Before Live payment tests |

Do **not** manually edit customer plan rows to “fix” access during cutover.

---

## 7. Smoke Test Checklist

| Surface | Expected result | Done |
|---------|-----------------|------|
| **Landing** `/` | Loads; no hard error | ☐ |
| **Login / Signup** | Clerk auth works; session established | ☐ |
| **Dashboard** `/dashboard` | Loads per tier rules (Free gate / Pro personalization) | ☐ |
| **Pricing** `/pricing` | Plans + monthly/annual UI render; CTAs present | ☐ |
| **Billing Center** `/account/billing` | Authenticated user can open plan management | ☐ |
| **Upgrade path** | Free → Pricing Checkout handoff works (Sandbox/Live per phase) | ☐ |
| **Downgrade / cancel path** | Billing Center offers policy-correct actions | ☐ |
| **Subscription status** | Account reflects synced plan after webhook (not success URL alone) | ☐ |
| **Notifications** | Existing email platform unaffected (no send regression) | ☐ |
| **Profile** `/user-profile` | Manage Profile loads; gated sections respect capabilities | ☐ |
| **Admin** `/admin` | Admin-only access still works for operators | ☐ |

Record defects; any P0 stops the cutover (see §8).

---

## 8. Rollback Plan

**Never continue after a failed gate.**

| Failure | Immediate action |
|---------|------------------|
| **Checkout failure** | Disable Live Checkout CTAs / revert Live keys if just enabled; investigate Price/customer mapping; do not approve |
| **Webhook failure** | Stop Live payments; fix endpoint/secret; replay only after fix; do not grant entitlements manually |
| **Capability mismatch** | Treat as P0; restore correct billing sync; keep Dev Mode off if Live already enabled only if safe—prefer disable Live Checkout |
| **Database migration failure** | Stop cutover; restore from backup/PITR if required; do not run Live payments |
| **Cloudflare deployment failure** | Roll back Worker deployment in Cloudflare Dashboard to last known good; verify `immifin.com` |
| **Authentication failure** | Roll back Worker if deploy-related; verify Clerk production keys; halt billing tests |
| **Sandbox not passed** | **Do not enable Live keys at all** |

### Rollback philosophy

1. Prefer Cloudflare deployment rollback over force-push.
2. Prefer Stripe Dashboard pause / key isolation over DB entitlement hacks.
3. Prefer webhook replay after fix over manual plan edits.
4. Communicate status to Product Owner before any retry of Live payments.

---

## 9. Post-Deployment Validation

Complete after Phase 7 (Live billing validation) and before Phase 8 approval.

| Validation | Done | Evidence |
|------------|------|----------|
| Billing works end-to-end on Live (controlled account) | ☐ | Stripe payment + Supabase row + UI tier |
| Dashboard loads for paid and free users | ☐ | |
| Capabilities synchronized with plan | ☐ | Pro/Power features match entitlement |
| Subscription visible in Billing Center | ☐ | |
| Emails / Notification Platform unaffected | ☐ | Spot-check or recent campaign health |
| Admin pages functional | ☐ | |
| No critical console / Worker errors on billing paths | ☐ | Cloudflare logs + browser |
| Dev Subscription Mode remains off in Production | ☐ | |
| Ops Appendix A updated with Live IDs (no secrets) | ☐ | |

---

## 10. Operational Notes

| Topic | Guidance |
|-------|----------|
| **Deployment window** | Prefer low-traffic window; have Product Owner available for Live smoke approval |
| **Monitoring** | Watch Stripe Webhooks dashboard, Cloudflare Worker logs, Supabase subscription rows, capability access reports from testers |
| **Incident logging** | Record time, symptom, Stripe event ID, commit SHA, deployment ID, action taken in §11 Notes and [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md) change log |
| **Recovery philosophy** | Webhook-authoritative; idempotent retries; no browser-granted premium; no casual Stripe customer edits |
| **Lessons learned** | Update this runbook after each cutover attempt with concrete pitfalls (missing migration, mixed keys, Clerk protect vs true 404, etc.) |

---

## 11. Deployment Record

Copy for each cutover attempt. Leave blank until filled during execution.

| Field | Value |
|-------|-------|
| **Version** | v0.5.0 |
| **Date** | |
| **Engineer** | |
| **Product Owner** | |
| **Git Commit** | |
| **Cloudflare Deployment ID** | |
| **Stripe Mode** | Sandbox / Live (circle one) |
| **Sandbox E2E passed** | Yes / No — date: |
| **Live keys enabled** | Yes / No — date: |
| **Dev Subscription Mode off in Production** | Yes / No |
| **Result** | Pass / Fail / Aborted |
| **Notes** | |

### Sign-off

| Role | Name | Date | Signature / ack |
|------|------|------|-----------------|
| Engineering | | | |
| Product Owner | | | |

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-20 | S7-DOC-011 | Initial production deployment runbook for v0.5.0 commercial cutover |
