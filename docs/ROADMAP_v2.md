# IMMIFIN Roadmap v2

| Field | Value |
|-------|-------|
| **Title** | IMMIFIN Roadmap v2 |
| **Version** | v2.0 |
| **Task ID** | S4-005.16 |
| **Last Updated** | 2026-07-05 |
| **Owner** | Product Strategy / Technical Architecture |
| **Status** | Official — Sprint 5 in progress; first DS 2.0 page approved |
| **Supersedes** | Informal sprint sequencing prior to v0.4.1 Foundation Release |

**Related documentation:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md) · [V0_4_1_FOUNDATION_SIGNOFF.md](./V0_4_1_FOUNDATION_SIGNOFF.md) · [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) · [PRODUCT_VISION.md](./PRODUCT_VISION.md)

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
| Sprint 5 | Previously planned feature sprint | **Design System 2.0 & Product Experience** | **In Progress** |
| Sprint 6 | Previously planned Sprint 5 | AI & Personalization | Planned |
| Sprint 7 | Previously planned Sprint 6 | Finance Platform | Planned |
| Sprint 8 | Previously planned Sprint 7 | Insurance Platform | Planned |
| Sprint 9 | Previously planned Sprint 8 | Notifications & Automation | Planned |
| Sprint 10 | Previously planned Sprint 9 | Commercial Launch Readiness | Planned |

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
| Phase 4 — Stripe Subscription | Sprint 10 (Planned) |
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

**Next Sprint:** **Stripe Subscription Platform**.

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

## Sprint 7–10 (Planned Summary)

| Sprint | Theme | Primary focus |
|--------|-------|---------------|
| **Sprint 7** | Finance Platform | Finance guides, calculators, dashboard widgets |
| **Sprint 8** | Insurance Platform | Insurance education, planning tools, dashboard integration |
| **Sprint 9** | Notifications & Automation | Notification delivery engine, email/SMS alerts, automated tracking |
| **Sprint 10** | Commercial Launch Readiness | Stripe billing, subscription enforcement, launch polish |

Detailed AI task breakdowns for Sprint 6 will be created at Sprint 6 kickoff. See [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md).

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
| v2.6 | 2026-07-10 | Sprint 6 handoff | Planned vs completed; **next sprint = Stripe** (AI/Admin deferred) |
