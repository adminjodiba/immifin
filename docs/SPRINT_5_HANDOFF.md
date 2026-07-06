# IMMIFIN Sprint 5 Handoff — Design System 2.0

| Field | Value |
|-------|-------|
| **Sprint** | Sprint 5 |
| **Theme** | Design System 2.0 & Product Experience |
| **Version range** | v0.4.1 → v0.5.0 |
| **Handoff Date** | 2026-07-04 |
| **Task ID** | S4-005.16 |
| **Previous release** | v0.4.1 Foundation Release (`704bc7c`, tag `v0.4.1`) |
| **Status** | Sprint 5 in progress — first DS 2.0 page approved |

> **This document is the first thing a new AI assistant or engineer must read.**

---

## 1. Read This First

IMMIFIN v0.4.1 Foundation Release is **complete and signed off**. Sprint 5 is **not a feature sprint** — it is the **Design System 2.0 & Product Experience** sprint.

Your job is to make IMMIFIN look and feel like a **polished commercial SaaS product** while preserving the architecture established in v0.4.1.

Do **not** start random page redesigns before documenting Design System 2.0.

---

## 2. Project Context

IMMIFIN is an intelligent immigration planning platform — a **Life Operating System for Immigrants** combining Immigration, Finance, and Insurance into one platform with Free / Pro / Power subscription tiers.

Sprint 4 delivered the **platform foundation**: My Immifin workspace, capability-based authorization, dashboard framework, profile management, Premium Feature Discovery, and Cloudflare deployment workflow.

Sprint 5 improves **visual quality and UX consistency** on top of that stable foundation.

---

## 3. Current Stable Version

| Field | Value |
|-------|-------|
| **Version** | v0.4.1 Foundation Release |
| **Tag** | `v0.4.1` |
| **Branch** | `main` |
| **Production** | `https://immifin.com` |
| **Sign-off** | [V0_4_1_FOUNDATION_SIGNOFF.md](./V0_4_1_FOUNDATION_SIGNOFF.md) |

---

## 4. Why Sprint 5 Changed

Roadmap v1 planned Sprint 5 as a feature sprint. After v0.4.1, the roadmap was **intentionally revised**:

- Platform architecture is stable but UI is not yet commercial-grade.
- Adding more features on inconsistent UI would create design debt.
- Design System 2.0 establishes reusable components before AI, Finance, Insurance, and Automation sprints.

See [ROADMAP_v2.md](./ROADMAP_v2.md).

> **The roadmap is a living product strategy, not a fixed contract.**

Previously planned Sprint 5+ work shifts forward — **nothing is removed**, only resequenced.

---

## 5. Sprint 5 Objective

**Sprint 5 is not a feature sprint.**

**Sprint 5 is the Design System 2.0 & Product Experience sprint.**

### Goal

> A first-time visitor should believe IMMIFIN is a **polished commercial SaaS product** within 10 seconds of landing on the site.

---

## 6. Mandatory Reading Order

Before making recommendations or code changes, read:

1. [docs/SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md) *(this document)*
2. [docs/CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md)
3. [docs/ROADMAP_v2.md](./ROADMAP_v2.md)
4. [docs/PRODUCT_VISION.md](./PRODUCT_VISION.md)
5. [docs/BUSINESS_MODEL.md](./BUSINESS_MODEL.md)
6. [docs/SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
7. [docs/ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md)
8. [docs/AI_DEVELOPMENT_CHARTER.md](./AI_DEVELOPMENT_CHARTER.md)
9. [docs/PROMPT_TEMPLATE.md](./PROMPT_TEMPLATE.md)
10. [docs/RELEASE_NOTES_v0.4.1.md](./RELEASE_NOTES_v0.4.1.md)
11. [docs/V0_4_1_FOUNDATION_SIGNOFF.md](./V0_4_1_FOUNDATION_SIGNOFF.md)

---

## 7. Architecture That Must Be Preserved

| Architecture | Location / pattern |
|--------------|-------------------|
| Subscription tiers | `lib/subscription/tiers.ts` |
| Capability authorization | `lib/subscription/capabilities.ts` |
| My Immifin workspace | Top nav dropdown; `/dashboard`, `/user-profile` |
| Dashboard layout | Stable layout — main content + right sidebar |
| Premium Feature Discovery | `components/common/PremiumFeaturePreview.tsx` |
| Profile gates | `ProFeatureGate`, `ProFeatureLockedState` |
| Dev tier testing | DevTierSwitcher — development only |
| Middleware | Clerk auth only — no Supabase lookups |
| Deployment | OpenNext `npm run deploy`; Cloudflare Workers |

Design System 2.0 changes **visual language and components** — not this architecture.

---

## 8. Business Model That Must Be Preserved

[BUSINESS_MODEL.md](./BUSINESS_MODEL.md) is the **source of truth** for feature gating.

| Layer | Tier |
|-------|------|
| Manual Tools | Free |
| Personalization & Automation | Pro |
| AI & Advanced Intelligence | Power |

Do **not** reopen the Free / Pro / Power model without explicit user approval.

Do **not** replace capability-based access with scattered `tier === "pro"` checks.

---

## 9. Design System 2.0 Goals

| Goal | Detail |
|------|--------|
| **Commercial SaaS quality** | Polished, consistent, trustworthy first impression |
| **Unified visual language** | Typography, color, spacing, elevation, motion |
| **Component library** | Reusable primitives — buttons, cards, forms, tables, charts, timelines |
| **Platform-wide consistency** | Homepage, Pricing, Dashboard, Immigration, Calculators, Profile share one design language |
| **Preserve architecture** | My Immifin, capabilities, Premium Feature Discovery, dashboard layout rules |
| **Document before redesign** | Design System 2.0 spec approved before major page changes |

Design System 2.0 documentation is complete and **application has begun**. The first approved page redesign is **Visa Bulletin History**.

See [design-system/VISA_BULLETIN_HISTORY_2.0.md](./design-system/VISA_BULLETIN_HISTORY_2.0.md).

See [PRODUCT_VISION.md §22](./PRODUCT_VISION.md#22-design-system-20-initiative).

---

## 10. Suggested Sprint 5 Deliverables

Design System 2.0 should be **documented and approved** before major page redesign.

| # | Deliverable | Type |
|---|-------------|------|
| 1 | `docs/DESIGN_SYSTEM_2.0.md` | Documentation — visual language, tokens, patterns |
| 2 | `docs/COMPONENT_LIBRARY.md` | Documentation — component catalog and usage rules |
| 3 | `docs/PRODUCT_PRINCIPLES.md` | Documentation — design + product principles |
| 4 | Reusable UI component foundation | Code — shared primitives in `components/ui/` or equivalent |
| 5 | Homepage redesign | Code — public landing experience |
| 6 | Pricing redesign | Code — plan comparison polish |
| 7 | Dashboard redesign | Code — **v0.4.2 polish shipped** — compact employment timeline, Immigration Details sidebar, Action Center table, blurred preview for Free |
| 8 | Visa Bulletin pages redesign | Code — **History approved** (`/immigration/visa-bulletin/tracker-2`); **Movement Tracker promoted** (`/immigration/visa-bulletin-movement`); **Dashboard promoted** (`/immigration/visa-bulletin`) |
| 9 | Calculator redesign | Code — **Pro auto-population shipped**; DS 2.0 workspace layout on calculator pages |
| 10 | Manage Profile redesign | Code — profile hub polish |
| 11 | Workspace page shell | Code — ✅ **`WorkspacePageShell`** migrated across Immigration, Finance, Calculators, About, Pricing, Account, Dashboard, auth |
| 12 | Favorites (Pro/Power) | Code — ✅ star on pages, nav dropdown, `/api/account/favorites`, max 10 |

Deliverables 1–3 should precede deliverables 4–12.

---

## 11. What Not To Do

Do **NOT**:

- Reopen the Free / Pro / Power model without explicit user approval.
- Remove My Immifin.
- Remove Premium Feature Discovery.
- Replace capability-based access with scattered plan checks.
- Start random page redesigns before documenting Design System 2.0.
- Modify billing/Stripe unless specifically requested.
- Change database schema without approval.
- Deploy before localhost verification.
- Convert large Server Components to Client Components for small UI changes.
- Add Supabase lookups to middleware.

---

## 12. First Recommended Task

### S5-000 — Create IMMIFIN Design System 2.0 Document

**Purpose:** Define the visual foundation before any page redesign.

**Scope:**

- Visual language (brand, color palette, typography)
- Spacing and layout grid
- Component patterns (buttons, cards, forms, tables, charts, timelines)
- Locked states and premium overlay styling
- Dashboard, mobile, and accessibility behavior
- Relationship to existing Tailwind classes in `app/globals.css`

**Output:** `docs/DESIGN_SYSTEM_2.0.md`

**Workflow:** Inspect existing UI → document current patterns → propose unified system → user approval → then implement.

---

## 13. Standard Cursor Prompt Requirement

All Sprint 5 implementation tasks must use the standard prompt format from [PROMPT_TEMPLATE.md](./PROMPT_TEMPLATE.md) and follow [AI_DEVELOPMENT_CHARTER.md](./AI_DEVELOPMENT_CHARTER.md).

Every task must include:

- Task ID (S5-xxx)
- Mandatory reading list reference
- Explicit "architecture preserved" constraints
- Localhost test plan
- Do not commit until user approval (unless explicitly requested)

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-04 | S4-005.16 | Sprint 5 handoff — Design System 2.0 & Product Experience |
| v1.1 | 2026-07-05 | S5-004 | Visa Bulletin History DS 2.0 approved — first Sprint 5 page complete |
| v1.2 | 2026-07-06 | S5-008 | Visa Bulletin Dashboard and Movement Tracker promoted; DS 2.0 progress updated |
| v1.3 | 2026-07-06 | S5-009 | v0.4.2 — My Immifin dashboard polish, Favorites, workspace shell, Pro calculator auto-fill |
