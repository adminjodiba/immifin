# IMMIFIN Roadmap v2

| Field | Value |
|-------|-------|
| **Title** | IMMIFIN Roadmap v2 |
| **Version** | v2.39 |
| **Task ID** | BLP-001 |
| **Last Updated** | 2026-08-25 |
| **Owner** | Product Strategy / Technical Architecture |
| **Status** | Official — **IMMIFIN Beta Launch Program** active (Phase 1); Sprint 8 FROZEN; Sprint 9+ not started |
| **Supersedes** | Informal sprint sequencing prior to v0.4.1 Foundation Release |

**Related documentation:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [BETA_LAUNCH_PROGRAM.md](./BETA_LAUNCH_PROGRAM.md) · [SPRINT_8_HANDOFF.md](./SPRINT_8_HANDOFF.md) · [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) · [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) · [SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md) · [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) · [PRODUCT_VISION.md](./PRODUCT_VISION.md)

---

## Why Roadmap v2 Exists

Roadmap v1 was created before the IMMIFIN **platform foundation** matured. Sprint 4 delivered far more than originally scoped — subscription architecture, My Immifin workspace, dashboard framework, profile management, Premium Feature Discovery, and capability-based authorization — culminating in **v0.4.1 Foundation Release**.

After completing v0.4.1, the project **intentionally revised the roadmap**:

- **Design System 2.0** is now inserted as **Sprint 5**.
- Previously planned Sprint 5+ feature work **shifts forward** by one sprint.
- **No planned functionality is removed** — only sequencing changed.
- The goal is to improve commercial product quality before adding more feature surface area.

> **The roadmap is a living product strategy, not a fixed contract.**

When strategic sequencing changes, create a new roadmap version, explain why, preserve completed sprint history, and shift planned work transparently. See [ENGINEERING_PLAYBOOK.md §19](./ENGINEERING_PLAYBOOK.md#19-roadmap-revision-procedure).

---

## Roadmap Revision Table

| Sprint | Roadmap v1 Plan | Roadmap v2 Plan | Status |
|--------|-----------------|-----------------|--------|
| Sprint 1 | Foundation | Foundation | Complete |
| Sprint 2 | Data / Visa Bulletin Foundation | Data / Visa Bulletin Foundation | Complete |
| Sprint 3 | Authentication / Personalization | Authentication / Personalization | Complete |
| Sprint 4 | Platform Foundation | Platform Foundation (v0.4.1) | Complete |
| Sprint 5 | Previously planned feature sprint | **Design System 2.0 & Product Experience** | Complete (v0.4.2) |
| Sprint 6 | Previously planned Sprint 5 | AI & Personalization *(Notifications delivered; AI deferred)* | Partial — Notifications complete |
| Sprint 7 | Previously planned Sprint 6 | **Commercial Platform (Stripe)** *(Finance shifted later)* | **Implemented** — LIVE Free→Pro PASS; Pro→Power technical PASS; billing UX backlog |
| Sprint 8 | Previously planned Sprint 7 | **IMMIFIN Intelligence Platform** | **FROZEN** — Engineering Complete through S8-IIP-011; PRE-BETA ENABLEMENT PENDING |
| **BLP** | — | **IMMIFIN Beta Launch Program** | **Active — Phase 1 (BLP-001)** — see [BETA_LAUNCH_PROGRAM.md](./BETA_LAUNCH_PROGRAM.md) |
| Sprint 9 | Previously planned Sprint 8 | Insurance Platform | Planned — **not started**; resumes only when engineering work is approved |
| Sprint 10 | Previously planned Sprint 9 | Commercial Launch Readiness / residual polish | Planned |

### Sprint 4.5–4.6 carry-forward

Sprint 4 milestones that were deferred from v0.4.1 shift into later sprints:

| Original milestone | Roadmap v2 destination |
|--------------------|------------------------|
| Sprint 4.5 — AI Assistant architecture spike | Sprint 6 — AI & Personalization |
| Sprint 4.6 — Stripe subscription integration | Sprint 10 — Commercial Launch Readiness |

Original Sprint details for Sprints 6–10 should be reconciled from [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) (Phases 4–7) and [CURRENT_PROJECT_STATE.md §10](./CURRENT_PROJECT_STATE.md#10-sprint-4-milestones) as those sprints are planned in detail.

---

## Mapping to Product Phases

[PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) describes long-term **product phases** (Authentication → Profiles → Calculations → Stripe → AI → Finance → Mobile). Roadmap v2 describes **sprint sequencing**. The two documents are complementary:

| Product Phase | Roadmap v2 Sprint(s) |
|---------------|----------------------|
| Phase 1 — Auth & Admin | Sprints 1–3 (Complete) |
| Phase 2 — Immigration Profiles | Sprint 4 (Complete — integrated into v0.4.1) |
| Phase 3 — Saved Calculations | Sprint 6+ (Planned) |
| Phase 4 — Stripe Subscription | **Sprint 7** (LIVE Free→Pro Monthly PASS; matrix pending) → residual launch polish later |
| Phase 5 — AI Assistant | Sprint 6 (Planned) |
| Phase 6 — Finance Tools | Sprint 7 (Planned) |
| Phase 7 — Mobile App | Post Sprint 10 (Future) |

---

## Sprint 5 — Design System 2.0 & Product Experience

**Sprint 5 is not a feature sprint.** It is a **product experience sprint**.

### Goal

A first-time visitor should believe IMMIFIN is a **polished commercial SaaS product** within 10 seconds of landing on the site.

### Scope

- Unified visual language (typography, color, spacing, elevation)
- Reusable component library
- Homepage, Pricing, Dashboard, Visa Bulletin, Calculator, and Manage Profile redesigns
- Preserve v0.4.1 architecture — visual refresh only

### Must preserve (not redesign)

- My Immifin workspace
- Free / Pro / Power subscription model
- Capability-based authorization
- Premium Feature Discovery / `PremiumFeaturePreview`
- Dashboard layout architecture (layout stable, content dynamic)
- Business model in [BUSINESS_MODEL.md](./BUSINESS_MODEL.md)

See [SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md) for mandatory reading, deliverables, and first recommended task.

### Sprint 5 progress (2026-07-06)

| Milestone | Status |
|-----------|--------|
| Design System 2.0 documentation framework | ✅ Complete |
| **Visa Bulletin History — first DS 2.0 page** | ✅ **Approved** |
| **Visa Bulletin Movement Tracker** | ✅ **Promoted** (2026-07-05) |
| **Visa Bulletin Dashboard** | ✅ **Promoted** (2026-07-06) |
| **Workspace page shell (`WorkspacePageShell`)** | ✅ **Complete** — site-wide DS 2.0 layout |
| **My Immifin dashboard polish (v0.4.2)** | ✅ **Complete** — compact timelines, Immigration Details, Action Center |
| **Favorites (Pro/Power)** | ✅ **Complete** |
| **Pro calculator auto-population** | ✅ **Complete** |
| Homepage, Pricing, Manage Profile full redesigns | ⏳ Planned |

Production release: **v0.4.2** (`71d5add`) — see [RELEASE_NOTES_v0.4.2.md](./RELEASE_NOTES_v0.4.2.md).

The Visa Bulletin History mockup (`/immigration/visa-bulletin/tracker-2`) has been **approved and promoted** as the official Design System 2.0 implementation for that page. See [design-system/VISA_BULLETIN_HISTORY_2.0.md](./design-system/VISA_BULLETIN_HISTORY_2.0.md).

**Approved deliverables for Visa Bulletin History:**

- Design System 2.0 premium SaaS styling
- New KPI cards and cleaner analysis workspace
- Responsive charts with scrollable timeline and quarter markers
- Historical table redesign with vertical scroll
- 6 Month default date range
- Chart retrogression highlighting
- Removed duplicate sections; improved information density

---

## Sprint 6 — AI & Personalization + Admin Operations + Notifications

**Status:** Notification Platform track **Completed (Production Validated)**. Remaining AI / full Admin ops **deferred**.

**Follow-on:** Sprint 7 as-built in [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md). Sprint 8 Intelligence is **FROZEN** after S8-IIP-011 ([SPRINT_8_HANDOFF.md](./SPRINT_8_HANDOFF.md)). Near-term: Stripe validation + IMMIFIN invite-only beta readiness; resume Intelligence **enablement** only via Pre-Beta Enablement Gate.

See **[SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md)** for planned vs completed detail.

| Deliverable | Task ID | Priority | Status | Notes |
|-------------|---------|----------|--------|-------|
| **Workers Paid** | Ops | High | ✅ Completed | 2026-07-09 |
| **Notification Platform** | S6-EMAIL-001 → 005.1 / S6-RELEASE-001 | High | ✅ **Completed** | Production Validated — [NOTIFICATION_PLATFORM_SIGNOFF.md](./NOTIFICATION_PLATFORM_SIGNOFF.md) |
| **Admin Operations page** | S6-ADM-001 | High | ⏳ Deferred | Force sync / archive UI polish beyond Sprint 5 MVP |
| **Manual history archive UI** | S6-ADM-001 | High | ⏳ Deferred | Manual only when resumed |
| **AI Assistant architecture** | S6-AI-xxx | Was primary theme | ⏳ Deferred | Power-tier grounded Q&A |
| **Advanced personalization** | S6-AI-xxx | Was primary theme | ⏳ Deferred | Beyond Pro |

### Completed — Notification Platform (Sprint 6)

| Item | Detail |
|------|--------|
| Provider abstraction | Notification Service + Resend adapter |
| Dashboard-driven email | Assembler + mapper; no duplicate immigration math |
| Journey-aware Monthly Updates | `employment_gc_waiting` + `green_card_holder` |
| Admin Control Center | Audience summary, preview, in-app confirm, bulk campaign |
| Production validation | Real Pro / GC holder / inbox delivery (July 2026) |

### Admin visa bulletin workflow (Sprint 6)

When USCIS publishes a new bulletin:

1. Admin updates Google Sheet (external, manual)
2. Admin → **Force Sync** in `/admin` — users get fresh data immediately
3. Admin → **Archive month** when ready — **manual only**; never automatic on sync

---

## Sprint 7 — Commercial Platform (Stripe Subscription Platform)

**Status:** **Implementation complete** — LIVE Free→Pro **PASS**; LIVE Pro→Power **technical PASS** (2026-08-24). Customer upgrade UX **enhancement required** (S7-BILLING-UX-001). Remaining matrix incomplete.

**Theme:** Commercial Platform — real Stripe billing for Free / Pro / Power.

**Authoritative as-built record:** [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md)  
**LIVE Free→Pro Monthly signoff:** [S7_OPS_STRIPE_032_LIVE_FREE_PRO_MONTHLY_E2E_SIGNOFF.md](./S7_OPS_STRIPE_032_LIVE_FREE_PRO_MONTHLY_E2E_SIGNOFF.md)  
**LIVE Pro→Power Monthly signoff:** [S7_OPS_STRIPE_033_LIVE_PRO_POWER_MONTHLY_E2E_SIGNOFF.md](./S7_OPS_STRIPE_033_LIVE_PRO_POWER_MONTHLY_E2E_SIGNOFF.md)  
**Operational snapshot:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md)

### Completed

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Stripe architecture, policy, ADR | ✅ Completed | Design + [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md) |
| Stripe SDK, Checkout API, customer mapping | ✅ Completed | Server-authoritative Checkout |
| Webhook ledger + billing-state sync | ✅ Completed | `POST /api/webhooks/stripe` |
| Subscription change (upgrade / downgrade / interval / cancel) | ✅ Completed | Policy + API |
| Pricing page (monthly / annual) + Checkout CTAs | ✅ Completed | Wired to Checkout |
| Billing Center (`/account/billing`) | ✅ Completed | IMMIFIN-owned plan management |
| Capability enforcement helpers | ✅ Completed | `assertCapability` / `requireCapability` + premium UI gates |
| Commercial UX polish (nav, contact, design-system sweeps, ribbon) | ✅ Completed | See Sprint 7 handoff |
| Cloudflare Fetch HTTP transport | ✅ Completed | `Stripe.createFetchHttpClient()` — required on Workers |
| LIVE Free → Pro Monthly E2E | ✅ **PASS** | Payment + webhook sync + Pro entitlement (S7-OPS-STRIPE-032) |
| LIVE Pro → Power Monthly E2E | ✅ **Technical PASS** | UX enhancement required (S7-OPS-STRIPE-033/034) |

### Production validation status

| Item | Status |
|------|--------|
| LIVE Free → Pro Monthly Checkout + payment + webhook sync | ✅ **PASS** (2026-08-24) |
| LIVE webhook endpoint + signing secret alignment | ✅ Corrected / validated for Free→Pro path |
| LIVE Pro Monthly → Power Monthly (technical) | ✅ **PASS** (2026-08-24) |
| Transparent upgrade/downgrade confirmation UX | ✅ **Production-deployed** 2026-08-25 ([REL-002](./S7_BILLING_REL_002_PRODUCTION_DEPLOYMENT.md)); TEST E2E PASS (008E); ⏳ **LIVE UX lifecycle not yet validated** |
| Stripe Sandbox / other Test Mode E2E proofs | ⏳ Follow project ops needs |
| Development Subscription Mode hard-off for Live | ⏳ Confirm for broader cutover |
| Pro Monthly → Pro Annual | ⏳ Pending controlled validation |
| Downgrade to Free / end-of-period | ✅ **TEST** Power-now / Free-at-period-end PASS (008E); ⏳ **LIVE** pending |
| Other supported monthly/yearly transitions | ⏳ Pending controlled validation |
| Broader v0.5.0 commercial matrix signoff | ⏳ Pending — technical paths ≠ final confirmation UX |

**Do not treat the full Live billing-transition matrix as complete.** Free → Pro Monthly LIVE E2E is signed off; remaining transitions require separate controlled stories.

### Deferred from Sprint 7

| Item | Status |
|------|--------|
| Customer Portal (payment method / invoices) | ⏳ Narrow PM-update portal during upgrade (**UX-005** code); full invoices / standalone panel deferred |
| Full entitlement cutover narrative as a separate Live gate | ⏳ Partially advanced by Free→Pro LIVE; residual transitions remain |
| Broader doc suite refresh beyond handoff + CURRENT | ⏳ Follow-up documentation tasks |

**Approved Beta pricing:** Free $0 · Pro $9.99/mo or $99.99/yr · Power $19.99/mo or $199.99/yr — no coupons, promotions, or trials.

---

## Sprint 8 — IMMIFIN Intelligence Platform

| Field | Value |
|-------|-------|
| **Status** | **FROZEN** — ENGINEERING COMPLETE, PRE-BETA ENABLEMENT PENDING |
| **Engineering status** | **FROZEN** (complete through S8-IIP-011; S8-IIP-012 handoff) |
| **Operational status** | **PRE-BETA ENABLEMENT PENDING** |
| **Launch recommendation** | **CONDITIONAL GO FOR INVITE-ONLY CONTROLLED BETA** |
| **Public launch status** | **NOT APPROVED** |
| **Handoff** | [SPRINT_8_HANDOFF.md](./SPRINT_8_HANDOFF.md) |

**Theme:** Intelligence Platform foundation (also retained public/commercial polish intent from earlier Sprint 8 framing).

### Intelligence stories (engineering complete)

| Deliverable | Task ID | Status | Notes |
|-------------|---------|--------|-------|
| Intelligence Context Foundation | S8-IIP-001 | ✅ Complete | Server-only Version 1 context |
| Intelligence Request Envelope | S8-IIP-002 | ✅ Complete | In-memory request contract |
| Deterministic Prompt Payload | S8-IIP-003 | ✅ Complete | Provider-neutral payload |
| AI Provider Interface | S8-IIP-004 | ✅ Complete | Contracts only |
| Provider Registry / Resolver | S8-IIP-005 | ✅ Complete | Explicit in-memory registry |
| OpenAI Provider Adapter | S8-IIP-006 | ✅ Complete | Responses API adapter |
| Intelligence Service / Bootstrap | S8-IIP-007 | ✅ Complete | Internal orchestration |
| Authenticated Intelligence API | S8-IIP-008 | ✅ Complete | Power `accessAI` |
| Power-Plan Intelligence Workspace | S8-IIP-009 | ✅ Complete | Single-turn `/intelligence` |
| Workspace Refinement / Readiness Audit | S8-IIP-010 | ✅ Complete | CONDITIONAL GO baseline + kill switch |
| Controlled-Beta Pre-Launch Remediation | S8-IIP-011 | ✅ **COMPLETE WITH OPEN PRE-ENABLE ACTIONS** | Allowlist + ops + drafted legal — preserve |
| Sprint 8 Engineering Freeze / Handoff | S8-IIP-012 | ✅ Complete | Documentation governance only |

**Freeze decision:** Stop new Intelligence **product features**. Preserve S8-IIP-001 … 011. Remaining Intelligence work is operational enablement only (Pre-Beta Enablement Gate). Readiness: [SPRINT_8_INTELLIGENCE_PRODUCTION_READINESS.md](./SPRINT_8_INTELLIGENCE_PRODUCTION_READINESS.md).

---

## Pre-Beta Enablement Gate

Not new product-development stories. Complete before inviting real Intelligence beta users.

| Item | Status |
|------|--------|
| Approved non-production OpenAI configuration | Pending |
| Authenticated Free / Pro / Power(-invited) smoke tests | Pending (not performed) |
| Controlled-beta invite-list confirmation | Pending (mechanism implemented; cohort not selected) |
| Monitoring and logging privacy confirmation | Pending (static code PASS; edge/platform confirm pending) |
| Authorized live provider smoke test | Pending — NOT PERFORMED |
| Kill-switch ownership confirmation | Pending (runbook present) |
| Legal AI wording approval | Pending (drafted on `/privacy` `/terms`) |
| Support and incident-readiness confirmation | Pending (runbook present) |
| Final Product Owner enablement decision | Pending |

### Near-term IMMIFIN priority (outside new Intelligence features)

Governed by the **IMMIFIN Beta Launch Program** ([BETA_LAUNCH_PROGRAM.md](./BETA_LAUNCH_PROGRAM.md)):

1. If S7-BILLING-UX-008E is accepted: **controlled commit/packaging** of billing UX 002–008D (exclude unrelated Intelligence WIP). Do **not** deploy Production until authorized.
2. Continue remaining Stripe LIVE matrix (interval changes, Downgrade to Free).  
3. Collect real user feedback.  
4. Resume Intelligence **enablement** only when [SPRINT_8_HANDOFF.md](./SPRINT_8_HANDOFF.md) resume criteria are met.

---

## IMMIFIN Beta Launch Program

| Field | Value |
|-------|-------|
| **Program ID** | BLP-001 (foundation) |
| **Status** | **Active — Phase 1** |
| **Master document** | [BETA_LAUNCH_PROGRAM.md](./BETA_LAUNCH_PROGRAM.md) |
| **Engineering status** | Feature Development Frozen |
| **Operational status** | Preparing Invite-only Beta |
| **Recommendation** | Controlled Beta |
| **Public launch** | Not Approved |

Transition from sprint-based feature development into controlled product validation with real users. Sprint-based development (Sprint 9+) resumes only when new engineering work is explicitly approved by the Product Owner.

### Program epics

| Epic | Name |
|------|------|
| Epic 1 | Beta Infrastructure |
| Epic 2 | Billing Validation |
| Epic 3 | Operational Readiness |
| Epic 4 | Customer Support |
| Epic 5 | Beta User Management |
| Epic 6 | Analytics |
| Epic 7 | Immigration Data Quality |
| Epic 8 | Intelligence Controlled Rollout |
| Epic 9 | Public Launch Readiness |

Do **not** begin Epic 1 automatically from this roadmap update. Do **not** begin Sprint 9.

---

## Sprint 8+ (Planned Summary)

| Sprint / Program | Theme | Primary focus |
|------------------|-------|---------------|
| **Sprint 8** | IMMIFIN Intelligence Platform | **FROZEN** — Engineering Complete; PRE-BETA ENABLEMENT PENDING |
| **BLP** | IMMIFIN Beta Launch Program | Invite-only beta → feedback → public-launch readiness |
| **Sprint 9** | Insurance Platform | Planned only — **not started** |
| **Sprint 10** | AI & Personalization / Automation | Deferred Sprint 6 AI + notification automation |
| **Sprint 11** | Commercial Launch Readiness | Residual Live launch polish after Stripe validation |

**Finance Platform** (guides, calculators, dashboard widgets) remains planned after approved post-beta sequencing; exact slot may be refined without changing the themes above.

*(Stripe was pulled forward to Sprint 7; active focus is now BLP, not Sprint 9.)*

### Commercial Management Platform *(deferred)*

| Field | Value |
|-------|-------|
| **Initiative** | Commercial Management Platform |
| **Vision** | [COMMERCIAL_PLATFORM_VISION.md](./COMMERCIAL_PLATFORM_VISION.md) |
| **Status** | **Vision Approved — Implementation Deferred Until After Beta** |

Covers product/price catalog, versioned publishing to Stripe, grandfathering, and customer migration campaigns. Does **not** change Sprint 7 Beta pricing or current Checkout behavior. Do not start implementation in Sprint 8 or Sprint 9.

---

## Future Vision — IMMIFIN Immigration Broadcast Platform *(parked)*

> **Future Vision — IMMIFIN Immigration Broadcast Platform:** Documented in [IMMIGRATION_BROADCAST_PLATFORM_VISION.md](./IMMIGRATION_BROADCAST_PLATFORM_VISION.md). Parked until after the July 16, 2026 MVP release. This is not part of the active Sprint 6 implementation scope.

Do **not** add Broadcast Platform engineering to Sprint 6 deliverables. Revisit after MVP launch with discovery, cost modeling, and a single general-broadcast proof of concept before any personalized video work.

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v2.0 | 2026-07-04 | S4-005.16 | Roadmap v2 — Design System 2.0 inserted as Sprint 5; prior sprints shifted forward |
| v2.1 | 2026-07-05 | S5-004 | Sprint 5 in progress — Visa Bulletin History DS 2.0 approved as first page |
| v2.2 | 2026-07-06 | S5-009 | v0.4.2 — dashboard polish, Favorites, workspace shell, Pro calculator auto-fill |
| v2.3 | 2026-07-06 | S6-ADM-001 | Sprint 6 handoff — admin force sync + manual archive parked from Sprint 5 |
| v2.4 | 2026-07-10 | S6-DOC-002 | Parked Immigration Broadcast Platform vision (post–July 16, 2026 MVP) |
| v2.5 | 2026-07-10 | S6-RELEASE-001 | Notification Platform moved to Completed (Production Validated) |
| v2.6 | 2026-07-10 | Sprint 6 handoff | Planned vs completed; next sprint = Stripe |
| v2.7 | 2026-07-11 | Sprint 7 kickoff | Sprint 7 = Stripe Subscription Platform; Finance shifted later |
| v2.8 | 2026-07-11 | S7-DOC-001 | Commercial Platform design complete; Sprint 7 Status = Planning |
| v2.9 | 2026-07-12 | DOC-EOD-S7-001 | Sprint 7 ~88% — Stripe backend complete; Sandbox validation next |
| v2.10 | 2026-07-13 | DOC-COMM-001 | Commercial Management Platform vision approved; implementation deferred until after Beta |
| v2.11 | 2026-07-20 | S7-DOC-004 | Sprint 7 as-built completion; Sprint 8 = public experience & commercial polish (active focus) |
| v2.12 | 2026-07-25 | S8-IIP-001 | Record Intelligence Context Foundation under Sprint 8 (foundation only — not full AI platform) |
| v2.13 | 2026-07-25 | S8-IIP-002 | Record Intelligence Request Envelope Foundation (in-memory request contract; no LLM/API/UI) |
| v2.14 | 2026-07-25 | S8-IIP-003 | Record Deterministic Prompt Payload Foundation (provider-neutral; no model call) |
| v2.15 | 2026-07-25 | S8-IIP-004 | Record AI Provider Interface (contracts only; no adapters/SDKs) |
| v2.16 | 2026-07-25 | S8-IIP-005 | Record Provider Registry and Resolver Foundation (in-memory; no adapters/execution) |
| v2.17 | 2026-07-25 | S8-IIP-006 | Record OpenAI Provider Adapter Foundation (Responses API; no Service/API/UI) |
| v2.18 | 2026-07-25 | S8-IIP-007 | Record Intelligence Service and Controlled Provider Bootstrap (internal only) |
| v2.19 | 2026-07-25 | S8-IIP-008 | Record Authenticated Intelligence API Foundation (Power accessAI; no chat UI) |
| v2.20 | 2026-07-25 | S8-IIP-009 | Record Power-Plan Intelligence Workspace UI Foundation (single-turn) |
| v2.21 | 2026-07-25 | S8-IIP-010 | Intelligence readiness audit — CONDITIONAL GO for controlled beta |
| v2.22 | 2026-07-25 | S8-IIP-011 | Earlier note — superseded by Product Owner freeze |
| v2.23 | 2026-07-25 | PO-S8-FREEZE | Interim freeze note — incorrectly framed S8-IIP-011 as deferred-only |
| v2.24 | 2026-07-25 | S8-IIP-012 | Sprint 8 FROZEN; S8-IIP-011 COMPLETE WITH OPEN PRE-ENABLE ACTIONS; Pre-Beta Enablement Gate |
| v2.25 | 2026-07-25 | BLP-001 | IMMIFIN Beta Launch Program established; epics listed; Sprint 9 not started |
| v2.26 | 2026-08-24 | S7-OPS-STRIPE-032 | LIVE Free → Pro Monthly E2E PASS; remaining billing transitions pending |
| v2.27 | 2026-08-24 | S7-OPS-STRIPE-034 | Pro→Power technical PASS; S7-BILLING-UX-001 backlog |
| v2.28 | 2026-08-24 | S7-BILLING-UX-002 | Read-only subscription upgrade preview foundation |
| v2.29 | 2026-08-24 | S7-BILLING-UX-003 | Charge-now immediate upgrade execution + preview auth |
| v2.30 | 2026-08-24 | S7-BILLING-UX-004 | Masked payment method on upgrade preview |
| v2.31 | 2026-08-24 | S7-BILLING-UX-005 | Stripe-hosted change/add payment method during upgrade confirmation |
| v2.32 | 2026-08-24 | S7-BILLING-UX-006 | Transparent immediate-upgrade confirmation experience |
| v2.33 | 2026-08-24 | S7-BILLING-UX-007 | Scheduled downgrade transparency |
| v2.39 | 2026-08-25 | S7-BILLING-UX-008E | Full Stripe TEST lifecycle reconciliation PASS (Power now / Free Sep 25, 2026); not Production-deployed |
| v2.38 | 2026-08-25 | S7-BILLING-UX-008D | Replacement confirmation dialog visual redesign (presentation only; TEST schedule not mutated) |
| v2.37 | 2026-08-25 | S7-BILLING-UX-008C | Replace scheduled paid destination with Free after confirmation (TEST schedule not mutated; no Production deploy) |
| v2.36 | 2026-08-25 | S7-BILLING-UX-008B | Scheduled plan visibility + duplicate CTA suppression (TEST schedule not mutated; no Production deploy) |
| v2.35 | 2026-08-25 | S7-BILLING-UX-008A | Post-Checkout entitlement refresh reliability PASS (auth-gated poll; no Production deploy) |
| v2.34 | 2026-08-25 | S7-BILLING-UX-008 | Stripe TEST E2E PARTIAL / BLOCKED (auth session required) |
