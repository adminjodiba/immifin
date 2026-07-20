# IMMIFIN Current Project State

**Last Updated:** 2026-07-20 (S7-DOC-003; UX follow-up)  
**Document role:** Operational single source of truth — where the project is today  
**Sprint history:** [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) (as-built)

---

## Executive Summary

IMMIFIN is a production immigration/finance web application on Cloudflare Workers (OpenNext) with Clerk auth, Supabase data, and a Free / Pro / Power capability model.

**Sprint 7** delivered the commercial Stripe platform **in application code**: Checkout, webhooks with billing-state sync, Pricing UI, Billing Center (plan changes), capability enforcement helpers, and commercial UX polish.

**Production today** remains the stable pre–Live-Stripe baseline (v0.4.2 + Notification Platform v1.0). **Live Stripe cutover, Sandbox/Live payment validation, and v0.5.0 signoff are still pending.**

| Field | Value |
|-------|-------|
| **Overall health** | Strong — core product stable; commercial path implemented, not Live-validated |
| **Commercial readiness** | Application-ready for Sandbox validation; **not** Live-production-ready |
| **Engineering blockers** | None |

---

## Current Release Status

| Area | Status |
|------|--------|
| **Current production version** | **v0.4.2** + Notification Platform **v1.0** on `https://immifin.com` |
| **Target next release** | **v0.5.0** — commercial Stripe platform (not yet signed off) |
| **Development status** | Sprint 7 commercial implementation **substantially complete** in repo |
| **Deployment status** | Production auto-deploy from `main` (Cloudflare Workers Paid) — Live Stripe not activated |
| **Stripe status** | **Pending Validation** — code complete; Sandbox/Live operational proof incomplete |
| **Documentation status** | Sprint 7 handoff as-built updated; broader doc suite still catching up (S7-DOC-001) |
| **Production readiness (commercial)** | **Pending Validation** — do not treat Live billing as ready |

---

## Completed Platform Areas

| Area | Summary |
|------|---------|
| **Authentication** | Clerk sign-in/up, protected routes, session handling; guest menu clicks open Login Required modal over Home |
| **User profiles** | Account profile, immigration profile, contact preferences / onboarding |
| **Visa Bulletin platform** | Current bulletin, history, movement tracker, stamping wait map |
| **Dashboards** | My Immifin personalization, Pro gates, journey surfaces; shared My Immifin menu across tiers |
| **Calculators** | Green Card wait, citizenship, H-1B tools |
| **Notifications** | Resend email platform — **production validated** (Sprint 6) |
| **Stripe platform** | Checkout API, customer mapping, webhooks, billing-state sync, subscription change APIs |
| **Billing experience** | Pricing (monthly/annual) + Billing Center (`/account/billing`) for upgrade/downgrade/cancel |
| **Capability enforcement** | Capability map + `assertCapability` / `requireCapability` on selected APIs; premium UI gates |
| **Design system / UX** | CTA/menu sweeps (top-level label stays visible), nav grouping, premium nav preview, guest login modal, contact form + attachments, landing ribbon water |

For Sprint 7 detail, see [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md).

---

## Production Readiness Checklist

### Completed (in application / prior production)

- Checkout Session API and Pricing Checkout wiring
- Webhook route, event ledger migration, billing-state synchronization
- Subscription change APIs (upgrade / downgrade / interval / cancel-to-free paths)
- Billing Center plan management UI
- Capability enforcement helpers (selected APIs + premium UI gating)
- Notification Platform (production validated)
- Core immigration product surfaces (stable on production)

### Pending (before commercial Live production)

- Stripe Sandbox webhook registration and signed end-to-end payment proof
- Live Stripe products, prices, webhook, and secrets
- Production Supabase migration apply for webhook foundation (if not already applied in target env)
- Development Subscription Mode hard-off for Live
- Customer Portal sessions for payment method / invoices (not built; placeholders only)
- Production deployment runbook, v0.5.0 release notes, and production signoff
- Broader documentation refresh (roadmap, Stripe design Status, ops IDs)

---

## Known Deferred Work

Intentionally deferred (not Sprint 7 incomplete core):

- Stripe Customer Portal for payment methods and invoices
- Landing / marketing redesign beyond Sprint 7 ribbon polish
- Future AI assistant capabilities
- Future HR / employer capabilities
- Finance and Insurance platform expansions (roadmap items shifted later)
- Full documentation suite updates identified in S7-DOC-001 (beyond this file and the Sprint 7 handoff)

---

## Current Risks

| Risk | Notes |
|------|--------|
| **Live Stripe not validated** | Do not enable Live billing until Sandbox/Live proof and secrets are complete |
| **Production still on pre-v0.5.0 commercial baseline** | Shipping incomplete Live config would break or silently fail payments |
| **Doc drift** | Some secondary docs may still describe mid-Sprint-7 “UI not started” — trust this file + Sprint 7 handoff |
| **Engineering blockers** | **None** |

---

## Next Sprint

**Sprint 8** focus (high level only):

- Public / marketing experience and landing redesign
- Commercial polish and remaining billing conveniences (e.g. Portal for payment methods)
- Production commercial activation follow-through after v0.5.0 gates

No Sprint 8 implementation plan is defined here.

---

## Mandatory Reading Order

For a new engineer or AI agent:

1. **[CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md)** — this file (start here)
2. **[SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md)** — as-built Sprint 7 record
3. **[BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md)** — IMMIFIN vs Stripe ownership
4. **[STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md)** — commercial rules
5. **[STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md)** — operational Stripe setup
6. **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** — system overview *(may lag Sprint 7; prefer handoff for billing)*
7. **[ROADMAP_v2.md](./ROADMAP_v2.md)** — forward roadmap *(Sprint 7 table may lag; prefer handoff)*
8. **[PROJECT_GUIDE.md](./PROJECT_GUIDE.md)** — day-to-day engineering guide
9. Feature design docs as needed (Visa Bulletin DS 2.0, notifications, engineering notes)

---

## Quick References

| Item | Value |
|------|--------|
| **Repository branch** | `main` |
| **Production URL** | `https://immifin.com` |
| **Dev tunnel (typical)** | `https://dev.immifin.com` |
| **Billing Center** | `/account/billing` |
| **Pricing** | `/pricing` |
| **Stripe webhook** | `POST /api/webhooks/stripe` |
| **Verify suite** | `scripts/verify-s7-*.mjs` |

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| Prior | 2026-07-14 | DOC-EOD / mid-Sprint 7 | Operational snapshot at ~88% backend narrative |
| **Current** | **2026-07-20** | **S7-DOC-003** | Concise operational snapshot aligned with Sprint 7 as-built handoff |
