# IMMIFIN Project Guide

| Field | Value |
|-------|-------|
| **Title** | IMMIFIN Project Guide |
| **Version** | v1.1 |
| **Task ID** | S4-005.18 |
| **Last Updated** | 2026-07-07 |
| **Owner** | Technical Architecture (CTO) |
| **Status** | Official — **master entry point for all contributors** |

> **Read this document first.** Every developer, AI assistant, and contributor must read this guide before making recommendations, writing code, or modifying architecture.

This document replaces the need to manually explain project context in every new conversation.

---

## 1. Project Overview

**IMMIFIN** is a commercial SaaS platform focused on **Immigration**, **Finance**, and **Insurance** — a Life Operating System for Immigrants.

### Mission

Help immigrants make better financial and immigration decisions through intelligent tools, automation, dashboards, and AI.

### Current Production Version

**v0.4.1 Foundation Release** (tag `v0.4.1`, production at `https://immifin.com`)

### Current Sprint

**Sprint 5 — Design System 2.0 & Product Experience**

Sprint 5 is **not a feature sprint**. It is a product experience sprint to make IMMIFIN look and feel like a polished commercial SaaS product while preserving the v0.4.1 platform architecture.

---

## Current Stable Baseline

**Current Stable Release:**

**v0.4.1 Foundation Release**

**Git Tag:**

**v0.4.1**

**Purpose:**

This release represents the official architectural baseline of IMMIFIN.

All future development should build upon this foundation.

Design System 2.0 begins immediately after this release.

Any architectural change that affects the platform foundation should first be documented and approved before implementation.

See [V0_4_1_FOUNDATION_SIGNOFF.md](./V0_4_1_FOUNDATION_SIGNOFF.md).

---

## 2. Current Project Status

| Area | Status |
|------|--------|
| **Platform foundation** | ✅ Complete (v0.4.1) |
| **Architecture** | ✅ Stabilized — capability-based, documented |
| **Documentation** | ✅ Complete for v0.4.1; Sprint 5 handoff ready |
| **Premium subscription model** | ✅ Free / Pro / Power established |
| **Billing / Stripe** | ⏳ Not connected — pricing page shows Coming Soon |
| **Design System 2.0** | 🟡 Next — Sprint 5 current priority |

**Summary:** Platform foundation is complete. Architecture is stabilized. Documentation is current. Premium subscription model is established. The project is **ready for Design System 2.0**.

See [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) and [V0_4_1_FOUNDATION_SIGNOFF.md](./V0_4_1_FOUNDATION_SIGNOFF.md).

---

## Project Governance

IMMIFIN follows a **documentation-first development model**.

| Document | Governs |
|----------|---------|
| [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) | Subscription behavior and feature gating |
| [PRODUCT_VISION.md](./PRODUCT_VISION.md) | Product direction and long-term vision |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Technical design and infrastructure |
| [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) | Implementation workflow and release gates |
| [ROADMAP_v2.md](./ROADMAP_v2.md) | Sprint sequencing *(may evolve through documented revisions)* |

**Principles:**

- Major architectural decisions must be **documented before implementation**.
- **Documentation is the source of truth.** Implementation follows documentation.
- **Completed sprint history should never be rewritten.**
- Roadmap revisions must explain:
  - What changed
  - Why it changed
  - Which future work shifted

See [ENGINEERING_PLAYBOOK.md §19](./ENGINEERING_PLAYBOOK.md#19-roadmap-revision-procedure).

---

## 3. Current Product Architecture

Major completed modules and patterns:

| Module / Pattern | Route / Location | Status |
|------------------|------------------|--------|
| **Home** | `/` | Public landing; Login Required UX for protected links |
| **Immigration** | `/immigration/*` | Visa Bulletin tools, history, movement |
| **Finance** | `/finance` | Placeholder / early content |
| **Insurance** | `/insurance` | Placeholder / early content |
| **Current Visa Bulletin** | `/immigration/visa-bulletin` | Free — live bulletin dashboard |
| **Visa Bulletin History** | `/immigration/visa-bulletin-history` | Pro — Premium Feature Discovery |
| **Movement Tracker** | `/immigration/visa-bulletin-movement` | Pro — Premium Feature Discovery |
| **Calculators** | `/calculators/*`, `/immigration/h1b-*` | Free manual input; Pro auto-population — see [CALCULATORS.md](./CALCULATORS.md) |
| **Admin Dashboard** | `/admin` | Admin role only — Data Refresh Center — [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md) |
| **My Immifin** | Top nav dropdown | Personal workspace — Dashboard, Manage Profile |
| **Dashboard** | `/dashboard` | Pro/Power — journey layout, EB/GC timelines |
| **Pricing** | `/pricing` | Free / Pro / Power plan cards |
| **Profile** | `/user-profile` | Manage Profile hub — tier-gated sections |
| **Subscription** | `lib/subscription/` | Tiers, capabilities, dev tier testing |
| **Premium Feature Discovery** | UX pattern | Real page + blur overlay + upgrade CTA |
| **PremiumFeaturePreview** | `components/common/PremiumFeaturePreview.tsx` | Reusable premium gating component |
| **Authentication** | Clerk | App-wide gate; `/` public |
| **Database** | Supabase | Profiles, immigration fields, contact, notifications |

**Tech stack:** Next.js 15 · React 19 · Tailwind CSS · Clerk · Supabase · Cloudflare Workers (OpenNext)

See [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) for infrastructure detail.

---

## 4. Business Model

Three subscription tiers. One platform account.

| Tier | Focus | Examples |
|------|-------|----------|
| **Free** | Manual tools | Current Visa Bulletin, manual calculators, contact profile |
| **Pro** | Personalization & automation | Dashboard, saved profile, history, movement, notifications, auto-populated calculators |
| **Power** | AI & advanced intelligence | Everything in Pro + AI assistant, multiple profiles *(planned)* |

**Core principle:**

| Layer | Tier |
|-------|------|
| Manual Tools | Free |
| Personalization & Automation | Pro |
| AI & Advanced Intelligence | Power |

> **[BUSINESS_MODEL.md](./BUSINESS_MODEL.md) is the source of truth** for all subscription tiers, capability mappings, feature gating, and upgrade philosophy. Read it before implementing any tier-gated feature.

Engineering must use **capability-based authorization** (`hasCapability`, `canAccess*`) — not scattered `tier === "pro"` checks.

---

## 5. Project Documentation Map

| Document | Purpose |
|----------|---------|
| [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) | **Master entry point** — read first |
| [SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md) | Sprint 5 context, goals, constraints, first task |
| [CALCULATORS.md](./CALCULATORS.md) | Live calculators, H-1B pair, navigation rules |
| [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md) | Admin MVP, role access, subscription testing |
| [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) | Sprint 6 — admin force sync, AI & Personalization |
| [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) | Sprint 6 context — admin force sync (manual archive), AI & Personalization |
| [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) | Authoritative project state, capabilities, ADRs |
| [ROADMAP_v2.md](./ROADMAP_v2.md) | Revised sprint roadmap — Design System 2.0 as Sprint 5 |
| [PRODUCT_VISION.md](./PRODUCT_VISION.md) | Long-term product vision — Life OS for Immigrants |
| [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) | **Source of truth** — tiers, capabilities, premium UX |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Infrastructure, deployment, environments, gating components |
| [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) | Workflow v2.0, release gates, engineering rules |
| [AI_DEVELOPMENT_CHARTER.md](./AI_DEVELOPMENT_CHARTER.md) | AI governance — roles, standards, task classification |
| [PROMPT_TEMPLATE.md](./PROMPT_TEMPLATE.md) | Standard Cursor prompt format for all tasks |
| [RELEASE_NOTES_v0.4.1.md](./RELEASE_NOTES_v0.4.1.md) | v0.4.1 Foundation Release summary |
| [V0_4_1_FOUNDATION_SIGNOFF.md](./V0_4_1_FOUNDATION_SIGNOFF.md) | Formal sign-off — frozen architecture decisions |

**Supporting docs:** [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) · [DEPLOYMENT.md](./DEPLOYMENT.md) · [SPRINT_RELEASE_CHECKLIST.md](./SPRINT_RELEASE_CHECKLIST.md) · [TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md) · [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md)

---

## 6. Mandatory Reading Order

Every new AI assistant or engineer **must read these documents in order** before making recommendations or code changes:

1. [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) *(this document)*
2. [SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md)
3. [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md)
4. [ROADMAP_v2.md](./ROADMAP_v2.md)
5. [PRODUCT_VISION.md](./PRODUCT_VISION.md)
6. [BUSINESS_MODEL.md](./BUSINESS_MODEL.md)
7. [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
8. [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md)
9. [AI_DEVELOPMENT_CHARTER.md](./AI_DEVELOPMENT_CHARTER.md)
10. [PROMPT_TEMPLATE.md](./PROMPT_TEMPLATE.md)
11. [RELEASE_NOTES_v0.4.1.md](./RELEASE_NOTES_v0.4.1.md)
12. [V0_4_1_FOUNDATION_SIGNOFF.md](./V0_4_1_FOUNDATION_SIGNOFF.md)

---

## 7. Product Principles

Key principles governing all IMMIFIN work:

| Principle | Meaning |
|-----------|---------|
| **Documentation First** | Architecture and business decisions are documented before or alongside implementation |
| **Architecture Before Features** | Inspect and explain architecture before writing code |
| **Capability-Based Authorization** | Use `hasCapability` / `canAccess*` — never scattered plan-name checks |
| **Premium Feature Discovery** | Show real premium pages with blur overlay — never screenshots or duplicate layouts |
| **Localhost First** | Verify on `http://localhost:3000` before commit or deploy |
| **Cloudflare After Git Verification** | Push to GitHub; verify Cloudflare deploy completes; then production smoke test |
| **Business Model Before Implementation** | Read [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) before any tier-gated feature |

**v0.4.1 product principles:**

1. Public information should educate. Premium features should personalize.
2. Premium features should demonstrate value before asking users to upgrade.
3. Never create duplicate versions of premium pages.
4. Render the real feature whenever possible.
5. Every premium page should answer: *"What will I gain by upgrading?"*

See [PRODUCT_VISION.md §21](./PRODUCT_VISION.md#21-product-principles-v041) and [BUSINESS_MODEL.md §17](./BUSINESS_MODEL.md#17-product-principles-v041).

---

## 8. Standard Development Workflow

Every implementation task follows this sequence:

| Step | Action |
|------|--------|
| 1 | **Read documentation** — mandatory reading order above |
| 2 | **Understand architecture** — inspect relevant code and docs before changing anything |
| 3 | **Implement** — stay within approved task scope; use [PROMPT_TEMPLATE.md](./PROMPT_TEMPLATE.md) |
| 4 | **Verify localhost** — test on `http://localhost:3000`; restart dev server after changes |
| 5 | **Run TypeScript** — `npx tsc --noEmit` |
| 6 | **Run ESLint** — `npm run lint` |
| 7 | **Commit** — only when user explicitly requests; small logical commits |
| 8 | **Push GitHub** — `git push origin main` triggers Cloudflare deploy |
| 9 | **Verify Cloudflare** — confirm deploy completes at `immifin.com` |
| 10 | **Update documentation** — applicable docs reflect the change |

**Auth/webhook work:** Also start Cloudflare dev tunnel (`npm run dev:local`) and verify Clerk webhooks return **200**.

See [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) and [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md).

---

## 9. Current Roadmap

Official roadmap: **[ROADMAP_v2.md](./ROADMAP_v2.md)**

| Sprint | Theme | Status |
|--------|-------|--------|
| Sprint 1 | Foundation | Complete |
| Sprint 2 | Data / Visa Bulletin Foundation | Complete |
| Sprint 3 | Authentication / Personalization | Complete |
| Sprint 4 | Platform Foundation (v0.4.1) | Complete |
| **Sprint 5** | **Design System 2.0 & Product Experience** | **Current** |
| Sprint 6 | AI & Personalization | Planned |
| Sprint 7 | Finance Platform | Planned |
| Sprint 8 | Insurance Platform | Planned |
| Sprint 9 | Notifications & Automation | Planned |
| Sprint 10 | Commercial Launch Readiness | Planned |

> The roadmap is a living product strategy, not a fixed contract.

**Sprint 5 is Design System 2.0** — unified visual language, component library, and platform-wide UI consistency. Document Design System 2.0 before major page redesigns.

First recommended task: **S5-000 — Create IMMIFIN Design System 2.0 Document**

---

## 10. What Must Not Change Casually

The following v0.4.1 decisions require **explicit product approval** before modification:

| Decision | Why protected |
|----------|---------------|
| **Free / Pro / Power architecture** | Business model source of truth established |
| **Capability helpers** | Central map in `lib/subscription/capabilities.ts` |
| **Premium Feature Discovery** | Standard UX for all premium features |
| **My Immifin workspace** | Personal hub distinct from product modules |
| **Business model** | [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) governs all gating |
| **Dashboard architecture** | Stable layout — main content + right sidebar; content dynamic |
| **Production tier default = Free** | Unenrolled users are Free, not Pro |
| **Middleware = Clerk auth only** | No Supabase lookups (Cloudflare 1102 incident) |
| **No duplicate premium layouts** | Real page renders underneath `PremiumFeaturePreview` |

See [V0_4_1_FOUNDATION_SIGNOFF.md §11](./V0_4_1_FOUNDATION_SIGNOFF.md#11-what-must-not-be-reopened-without-approval).

Design System 2.0 may change **visual language and components** — not these architectural decisions.

---

## 11. Next Major Initiative

**Sprint 5 — Design System 2.0 & Product Experience** is the current initiative. See [§9 Current Roadmap](#9-current-roadmap), [SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md), and [Project North Star](#project-north-star).

Design System 2.0 is **not yet implemented** — documentation and approval precede major page redesigns.

---

## 12. For Future AI Assistants

Before making recommendations:

1. **Read the documentation** — start with this guide, then the mandatory reading order.
2. **Do not assume** — verify current state in docs and code; project context changes between sprints.
3. **Treat documentation as the source of truth** — especially [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) for gating and [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) for project state.
4. **Preserve architectural consistency** — build on v0.4.1 foundation; do not casually redesign subscription architecture or premium UX patterns.
5. **Recommend improvements that align with the business model and product vision** — every feature should reduce uncertainty, save time, or help immigrants make better decisions.
6. **Use the standard prompt format** — [PROMPT_TEMPLATE.md](./PROMPT_TEMPLATE.md) and [AI_DEVELOPMENT_CHARTER.md](./AI_DEVELOPMENT_CHARTER.md).
7. **Do not commit, push, or deploy** unless the user explicitly requests it.
8. **Stop and restart localhost** when the user needs to test changes.

> v0.4.1 is the stable platform foundation. Future work should build on this architecture unless a documented product decision explicitly supersedes it.

---

## 13. Version Evolution

| Version | Theme | Status |
|---------|-------|--------|
| v0.1 | MVP Foundation | Complete |
| v0.2 | Automation | Complete |
| v0.3 | Authentication & Personalization | Complete |
| v0.4.1 | Platform Foundation | **Current Stable Baseline** |
| v0.5 | Design System 2.0 & Product Experience | Next Initiative |
| v0.6 | AI & Personalization | Planned |
| v0.7 | Finance Platform | Planned |
| v0.8 | Insurance Platform | Planned |
| v0.9 | Notifications & Automation | Planned |
| v1.0 | Commercial Launch | Vision |

Production tag: `v0.4.1` · Next target: `v0.5.0` after Design System 2.0 ships.

Version themes align with [ROADMAP_v2.md](./ROADMAP_v2.md) (Sprints 5–10). See [RELEASE_NOTES_v0.4.1.md](./RELEASE_NOTES_v0.4.1.md).

---

## Project North Star

### Mission

Build the most trusted AI-powered SaaS platform helping immigrants make better immigration, finance, and insurance decisions.

### Success Metric

A first-time visitor should believe IMMIFIN is a **polished commercial SaaS product** within 10 seconds of arriving.

### Every future feature should improve one or more of:

- **User Trust**
- **Product Quality**
- **Personalization**
- **Automation**
- **Intelligence**
- **Commercial Readiness**

See [PRODUCT_VISION.md](./PRODUCT_VISION.md) and [PRODUCT_VISION.md §22](./PRODUCT_VISION.md#22-design-system-20-initiative) for Design System 2.0 scope.

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-04 | S4-005.17 | Master project guide — official entry point for all contributors |
| v1.1 | 2026-07-04 | S4-005.18 | Stable baseline, project governance, version evolution, north star |
