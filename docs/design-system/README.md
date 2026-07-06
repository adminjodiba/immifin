# IMMIFIN Design System Documentation

| Field | Value |
|-------|-------|
| **Title** | Design System Documentation Hub |
| **Version** | v1.0 |
| **Sprint** | Sprint 5 |
| **Task ID** | S5-DOC-002 |
| **Last Updated** | 2026-07-06 |
| **Owner** | Technical Architecture (CTO) |
| **Status** | Official — **entry point for all Design System 2.0 documentation** |

**Related documentation:** [../PROJECT_GUIDE.md](../PROJECT_GUIDE.md) · [../SPRINT_5_HANDOFF.md](../SPRINT_5_HANDOFF.md) · [../CURSOR_ENGINEERING_STANDARD.md](../CURSOR_ENGINEERING_STANDARD.md)

> **This folder contains the official Design System 2.0 documentation** for IMMIFIN. Read this page first when working on any Sprint 5 UI redesign.

---

## 1. Purpose

The `docs/design-system/` folder is the **authoritative home** for Design System 2.0 documentation at IMMIFIN.

It governs:

- **Visual language** — how IMMIFIN should look and feel
- **Design principles** — philosophy behind every UI decision
- **Implementation process** — how approved designs become production code
- **Component and token standards** — reusable building blocks and named values
- **Page redesign templates** — per-page documentation structure

This framework ensures every future UI redesign is **designed, specified, implemented, reviewed, and approved** through a consistent, documentation-first process.

No page redesign begins without approved documentation in this framework.

---

## 2. Reading Order

Read documents in this order:

| # | Document | Why |
|---|----------|-----|
| 1 | [DESIGN_SYSTEM_2.0.md](./DESIGN_SYSTEM_2.0.md) | Vision, philosophy, and visual language |
| 2 | [UI_IMPLEMENTATION_STANDARD.md](./UI_IMPLEMENTATION_STANDARD.md) | Design-to-code process and fidelity rules |
| 3 | [DESIGN_TOKENS.md](./DESIGN_TOKENS.md) | Token categories and semantic naming |
| 4 | [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) | Reusable component catalog and hierarchy |
| 5 | [PAGE_TEMPLATE.md](./PAGE_TEMPLATE.md) | Per-page redesign package structure |
| 6 | [VISA_BULLETIN_HISTORY_2.0.md](./VISA_BULLETIN_HISTORY_2.0.md) | First approved DS 2.0 page — promotion record |
| 7 | [VISA_BULLETIN_MOVEMENT_2.0.md](./VISA_BULLETIN_MOVEMENT_2.0.md) | Second approved DS 2.0 page — Movement Tracker promotion |
| 8 | [VISA_BULLETIN_DASHBOARD_2.0.md](./VISA_BULLETIN_DASHBOARD_2.0.md) | Third approved DS 2.0 page — Dashboard promotion |

Before implementing any specific page, also read that page's files in `docs/design-pages/{page-slug}/`.

For engineering governance, read [../CURSOR_ENGINEERING_STANDARD.md](../CURSOR_ENGINEERING_STANDARD.md) and [../ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md).

---

## 3. Relationship to Existing Documentation

Design System documentation **does not replace** existing governance docs. It extends them for UI work.

| Document | Governs |
|----------|---------|
| [PRODUCT_VISION.md](../PRODUCT_VISION.md) | Product direction and long-term vision |
| [BUSINESS_MODEL.md](../BUSINESS_MODEL.md) | Subscription behavior, tiers, and feature gating |
| [SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md) | Technical architecture and infrastructure |
| [ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md) | Engineering workflow and release gates |
| [CURSOR_ENGINEERING_STANDARD.md](../CURSOR_ENGINEERING_STANDARD.md) | Cursor task format and mandatory workflow |
| **`docs/design-system/`** | **UI, visual language, and page implementation fidelity** |

### How they work together

```
BUSINESS_MODEL.md          → What features exist and who can access them
PRODUCT_VISION.md          → Why IMMIFIN exists and what quality we target
SYSTEM_ARCHITECTURE.md     → How the platform is built and deployed
ENGINEERING_PLAYBOOK.md    → How code is released
CURSOR_ENGINEERING_STANDARD.md → How Cursor tasks are structured
docs/design-system/        → How UI is designed and implemented faithfully
```

When UI work conflicts with business model or architecture docs, **higher-level governance wins**. See [UI_IMPLEMENTATION_STANDARD.md §2](./UI_IMPLEMENTATION_STANDARD.md#2-design-authority).

---

## 4. Sprint 5 Purpose

**Sprint 5 is the Design System 2.0 & Product Experience sprint.**

Sprint 5 is **not a feature sprint**. It is focused on:

- Establishing Design System 2.0 documentation (this folder)
- Creating a unified visual language across the platform
- Building a reusable component foundation
- Redesigning key pages to commercial SaaS quality

**Goal:** A first-time visitor should believe IMMIFIN is a polished commercial SaaS product within 10 seconds of landing on the site.

Sprint 5 preserves the **v0.4.1 platform architecture** — subscription tiers, capabilities, Premium Feature Discovery, My Immifin workspace, and top navigation. Design System 2.0 changes **visual language and components only**.

See [../SPRINT_5_HANDOFF.md](../SPRINT_5_HANDOFF.md) and [../PRODUCT_VISION.md §22](../PRODUCT_VISION.md#22-design-system-20-initiative).

---

## Document Map

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | This landing page |
| [DESIGN_SYSTEM_2.0.md](./DESIGN_SYSTEM_2.0.md) | Design philosophy and visual language |
| [UI_IMPLEMENTATION_STANDARD.md](./UI_IMPLEMENTATION_STANDARD.md) | Implementation process and fidelity rules |
| [DESIGN_TOKENS.md](./DESIGN_TOKENS.md) | Token categories (values defined during Sprint 5) |
| [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) | Reusable component catalog |
| [PAGE_TEMPLATE.md](./PAGE_TEMPLATE.md) | Per-page redesign documentation template |
| [VISA_BULLETIN_HISTORY_2.0.md](./VISA_BULLETIN_HISTORY_2.0.md) | First approved DS 2.0 page — Visa Bulletin History promotion |
| [VISA_BULLETIN_MOVEMENT_2.0.md](./VISA_BULLETIN_MOVEMENT_2.0.md) | Second approved DS 2.0 page — Movement Tracker promotion |
| [VISA_BULLETIN_DASHBOARD_2.0.md](./VISA_BULLETIN_DASHBOARD_2.0.md) | Third approved DS 2.0 page — Visa Bulletin Dashboard promotion |

Per-page packages live in `docs/design-pages/{page-slug}/`.

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-04 | S5-DOC-002 | Official Design System 2.0 documentation framework |
| v1.1 | 2026-07-05 | S5-004 | Visa Bulletin History DS 2.0 promotion documented |
| v1.2 | 2026-07-05 | S5-007 | Visa Bulletin Movement Tracker DS 2.0 promotion documented |
| v1.3 | 2026-07-05 | S5-007 | Movement Tracker DS 2.0 promoted to production route |
| v1.4 | 2026-07-06 | S5-008 | Visa Bulletin Dashboard DS 2.0 promotion documented |
| v1.5 | 2026-07-06 | S5-008 | Dashboard DS 2.0 promoted to production route |
