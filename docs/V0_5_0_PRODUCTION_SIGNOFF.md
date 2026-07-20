# IMMIFIN v0.5.0 Production Signoff

| Field | Value |
|-------|-------|
| **Document** | v0.5.0 Production Signoff |
| **Version** | v0.5.0 |
| **Sprint** | Sprint 7 — Commercial Platform (Stripe Subscription Platform) |
| **Task ID** | S7-DOC-012 |
| **Created** | 2026-07-20 |
| **Status** | **Draft — awaiting validation and approvals** |
| **Decision** | **Pending** (neither GO nor NO-GO until §8–§9 completed) |

> **Authority:** This document is the formal **Go / No-Go** approval record for releasing IMMIFIN v0.5.0 commercial billing to production. It is not a deployment procedure and not release notes. Execution of cutover steps lives in [PRODUCTION_DEPLOYMENT_RUNBOOK.md](./PRODUCTION_DEPLOYMENT_RUNBOOK.md).

**Related:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [RELEASE_NOTES_v0.5.0.md](./RELEASE_NOTES_v0.5.0.md) · [PRODUCTION_DEPLOYMENT_RUNBOOK.md](./PRODUCTION_DEPLOYMENT_RUNBOOK.md) · [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md) · [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)

**Rule:** Leave checklist items unchecked until the corresponding release-day evidence exists. Do not pre-mark completion.

---

## 1. Purpose

| Question | Answer |
|----------|--------|
| **Why this document exists** | To require explicit Product Owner and Engineering approval before Live commercial production for v0.5.0 |
| **When it should be completed** | After Sandbox validation, deployment readiness, and operational readiness are evidenced — immediately before declaring Live commercial release |
| **Who must approve** | Engineering Lead, Product Owner, and Deployment Engineer (see §9) |

Without completed checklists and signed GO in §8–§9, v0.5.0 commercial production is **not approved**.

---

## 2. Release Summary

| Field | Summary |
|-------|---------|
| **Version** | v0.5.0 |
| **Sprint** | Sprint 7 |
| **Commercial milestone** | First commercial Stripe subscription platform (Checkout, webhooks, Billing Center, capability-linked entitlements) |
| **Scope** | Application commercial path for Free / Pro / Power; IMMIFIN-owned plan management; Stripe-owned payments; documentation and runbook for cutover |
| **Out of scope for this signoff** | Customer Portal payment-method/invoice sessions; Sprint 8 landing/marketing redesign; Finance/Insurance platform expansion |

See [RELEASE_NOTES_v0.5.0.md](./RELEASE_NOTES_v0.5.0.md) and [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md).

---

## 3. Implementation Checklist

Complete only when evidenced for the release candidate.

- [ ] Billing Center completed
- [ ] Stripe Checkout completed
- [ ] Webhook synchronization completed
- [ ] Subscription / billing-state synchronization completed
- [ ] Capability synchronization completed
- [ ] Pricing (monthly / annual) completed
- [ ] Dashboard / premium gating updates completed (as in Sprint 7 scope)
- [ ] Commercial UX polish completed (as in Sprint 7 scope)
- [ ] Documentation complete (architecture, design, ops, business model, project guide, handoff, current state)
- [ ] Release Notes complete ([RELEASE_NOTES_v0.5.0.md](./RELEASE_NOTES_v0.5.0.md))
- [ ] Production Deployment Runbook complete ([PRODUCTION_DEPLOYMENT_RUNBOOK.md](./PRODUCTION_DEPLOYMENT_RUNBOOK.md))

---

## 4. Validation Checklist

- [ ] Sandbox Checkout passed
- [ ] Sandbox Webhooks passed (signed delivery)
- [ ] Billing synchronization verified (Supabase reflects Stripe)
- [ ] Capability synchronization verified (paid access matches plan)
- [ ] Billing Center plan-change path verified in Sandbox
- [ ] Dashboard validation passed
- [ ] Notifications unaffected
- [ ] Smoke tests passed (per runbook)
- [ ] No critical defects open

---

## 5. Deployment Readiness

- [ ] Git clean for release scope
- [ ] Main branch approved (release commit identified)
- [ ] Cloudflare configured for Production
- [ ] Live Stripe configured
- [ ] Live products verified
- [ ] Live prices verified
- [ ] Live webhook configured
- [ ] Production secrets verified (no Test/Live mix)
- [ ] Development Subscription Mode disabled in Production
- [ ] Database migrations applied (webhook foundation on production Supabase)

---

## 6. Operational Readiness

- [ ] Monitoring active (Stripe webhooks, Cloudflare logs, billing sync signals)
- [ ] Incident process ready
- [ ] Rollback procedure reviewed ([PRODUCTION_DEPLOYMENT_RUNBOOK.md](./PRODUCTION_DEPLOYMENT_RUNBOOK.md) §8)
- [ ] Deployment window approved
- [ ] Support plan ready (who responds to checkout/webhook failures)

---

## 7. Outstanding Risks

Known approved risks only (from current project state / handoff / ops). Status is for release-day update.

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| Stripe Live activation / Live payment validation pending | Customers cannot (or must not) be charged until Live gates pass | Complete Sandbox E2E; follow runbook Phases 2→4→7; no Live keys before Sandbox pass | Open until Live validated |
| Customer Portal deferred (payment method / invoices) | Subscribers manage cards/invoices only via future Portal or support | Billing Center owns plan changes; Portal placeholders; Sprint 8+ follow-up | Accepted / deferred |
| Sprint 8 landing / marketing redesign still ahead | Public marketing experience not the v0.5.0 commercial core | Ship commercial platform first; landing work tracked on roadmap | Accepted / deferred |
| Development Subscription Mode must be hard-off for Live | Accidental non-Stripe entitlements in Production | Explicit Production env check in runbook and §5 | Open until verified off |
| Production commercial cutover incomplete until signoff | Premature “Live” claims confuse ops and customers | This document + runbook gates; do not announce Live until GO | Open until §8–§9 |

---

## 8. Go / No-Go Decision

**Production approval requires every checklist in §3–§6 to be complete**, outstanding risks in §7 accepted or closed as applicable, and §9 signatures recorded.

| Decision | Meaning |
|----------|---------|
| **GO** | v0.5.0 commercial production is approved; Live cutover may proceed / is confirmed per runbook record |
| **NO-GO** | Commercial production is **not** approved; Live billing must remain disabled or be rolled back |

### Decision (release day)

| Field | Value |
|-------|-------|
| **Decision** | ☐ GO  ☐ NO-GO |
| **Decided by** | |
| **Date / time** | |
| **Rationale** | |

If any critical checklist item is incomplete, the decision must be **NO-GO**.

---

## 9. Final Approvals

Leave blank until signed on release day.

| Role | Name | Date | Status (Approved / Rejected) | Signature / ack |
|------|------|------|------------------------------|-----------------|
| **Engineering Lead** | | | | |
| **Product Owner** | | | | |
| **Deployment Engineer** | | | | |

All three roles must **Approved** for a valid **GO**.

---

## 10. Production Record

Blank until filled during / after cutover.

| Field | Value |
|-------|-------|
| **Version** | v0.5.0 |
| **Deployment Date** | |
| **Git Commit** | |
| **Cloudflare Deployment ID** | |
| **Stripe Mode** | |
| **Rollback Required** | Yes / No |
| **Incident** | None / describe |
| **Notes** | |

---

## 11. Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-20 | S7-DOC-012 | Initial v0.5.0 production signoff template — Draft, awaiting validation and approvals |
