# Visa Bulletin Dashboard — Design System 2.0 Promotion

| Field | Value |
|-------|-------|
| **Title** | Visa Bulletin Dashboard Design System 2.0 |
| **Version** | v1.0 |
| **Sprint** | Sprint 5 |
| **Task ID** | S5-008 |
| **Last Updated** | 2026-07-06 |
| **Owner** | Technical Architecture (CTO) |
| **Status** | **Approved — ready for promotion to official implementation** |

**Related documentation:** [DESIGN_SYSTEM_2.0.md](./DESIGN_SYSTEM_2.0.md) · [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) · [VISA_BULLETIN_HISTORY_2.0.md](./VISA_BULLETIN_HISTORY_2.0.md) · [VISA_BULLETIN_MOVEMENT_2.0.md](./VISA_BULLETIN_MOVEMENT_2.0.md) · [../CURRENT_PROJECT_STATE.md](../CURRENT_PROJECT_STATE.md) · [../ROADMAP_v2.md](../ROADMAP_v2.md)

---

## Summary

The **Visa Bulletin Dashboard** page is the **third completed Sprint 5 Design System 2.0 redesign** (after Visa Bulletin History and Movement Tracker). The mockup developed and reviewed on the preview route has been **approved** and is designated as the **new official implementation target** for this free-tier feature.

This document records what was delivered, what changed from the v0.4.1 production page, what architecture was preserved, and the UX decisions made during mockup review.

| Field | Value |
|-------|-------|
| **Production route (current)** | `/immigration/visa-bulletin` |
| **Design System 2.0 mockup route** | `/immigration/visa-bulletin-dashboard-2` |
| **Promotion status** | Approved — mockup becomes official target |
| **Subscription tier** | Free (no `PremiumFeaturePreview` gating) |
| **Architecture preserved** | API/data layer, SWR client pattern, Final Action + Dates for Filing data types |

---

## Design System 2.0 Deliverables

The redesign applies the Sprint 5 commercial SaaS visual language to the Visa Bulletin Dashboard while preserving v0.4.1 data architecture (`/api/visa-bulletin` + small Client Component + SWR).

### Visual and layout

| Deliverable | Description |
|-------------|-------------|
| **Design System 2.0 styling** | Premium SaaS look — refined cards, spacing, typography, and elevation aligned with Movement Tracker 2.0 |
| **Compact page header** | Icon, title, MOCK badge only — no breadcrumb, no hero section, no subtitle line |
| **Dual-panel desktop layout** | Final Action Dates and Dates for Filing shown **side by side** on `xl`+ screens |
| **Mobile / tablet fallback** | Below `xl`: tab switcher between Final Action Dates and Dates for Filing (single table) |
| **Related Tools footer** | Three linked cards with icons and chevrons (matches History / Movement pattern) |
| **Legal disclaimer** | Compact informational footer below Related Tools |

### Section header and filters

| Deliverable | Description |
|-------------|-------------|
| **Dynamic bulletin title** | `{Mon-YY} Visa Bulletin` — month from Visa Bulletin History sheet via `getLatestVisaBulletinMonth()` |
| **Data source subline** | `(Data source : U.S. Department of State Visa Bulletin)` directly under section title |
| **Shared filters** | EB category dropdown, country dropdown, Reset Filters — apply to **both** panels |
| **Filter placement** | Section title left, filters right (above tables) — not in page header |

### Dual bulletin panels

| Deliverable | Description |
|-------------|-------------|
| **Final Action Dates panel** | Soft blue panel header (`text-brand-800`, `bg-blue-50/90`) |
| **Dates for Filing panel** | Soft emerald panel header (`text-emerald-800`, `bg-emerald-50/90`) |
| **Parallel data fetch** | Both `/api/visa-bulletin?type=final-action` and `?type=filing` loaded via SWR |
| **Full-height tables** | No internal panel scroll cap — all rows visible without scrolling inside panels |
| **Compact vertical density** | Tighter row padding and section spacing so full dataset fits in one view on desktop |

### Bulletin table (per panel)

| Deliverable | Description |
|-------------|-------------|
| **Three-column layout** | Country · Final Action Date / Date for Filing · Status |
| **No movement columns** | Movement and Change columns intentionally excluded — current-month cutoff data only |
| **Grouped by EB category** | EB-1 through EB-5 + Other group headers with color-coded badges |
| **Compact dates** | Short format (`Dec 15, 2013`); `Current` / `Unavailable` instead of `(C)` / `(U)` |
| **Status badges** | Current (green), Waiting Queue (amber), Unavailable (red) — no emoji icons |
| **Fixed proportional columns** | `table-fixed` — Country 34% · Date 38% · Status 28% |
| **Long country truncation** | Ellipsis with full name in `title` tooltip |

---

## Page Structure

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Header: icon + Visa Bulletin Dashboard 2 + MOCK badge                    │
├──────────────────────────────────────────────────────────────────────────┤
│ Jul-26 Visa Bulletin                          [EB ▼] [Country ▼] [Reset] │
│ (Data source : U.S. Department of State Visa Bulletin)                   │
├───────────────────────────────┬──────────────────────────────────────────┤
│ Final Action Dates            │ Dates for Filing                         │
│ Country | Date | Status       │ Country | Date | Status                  │
│ EB-1 …                        │ EB-1 …                                   │
│ EB-2 …                        │ EB-2 …                                   │
│ …                             │ …                                        │
├───────────────────────────────┴──────────────────────────────────────────┤
│ Related Tools (3 cards)                                                    │
│ Disclaimer                                                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

**Below `xl` breakpoint:** single table with Final Action Dates / Dates for Filing tabs above the table.

---

## Changes from v0.4.1 Production

| Area | Production (v0.4.1) | Design System 2.0 mockup |
|------|---------------------|--------------------------|
| **Visual language** | Hero section + breadcrumb + card layout | DS 2.0 compact shell aligned with Movement Tracker |
| **Date type switching** | Tabs only — one table at a time | **Dual panels** on desktop — both visible side by side |
| **Data source / last updated** | Separate info cards above table | Single data source line under section title |
| **Table columns** | Category placeholder, Country, Date, Status (emoji status) | Country, Date, Status — category in group header only |
| **EB categories** | EB-1, EB-2, EB-3, Other | EB-1 through EB-5 + Other |
| **Table scroll** | Full page scroll | Full table height in panels — no internal scroll cap |
| **Related resources** | Button row (`btn-primary` / `btn-secondary`) | Card grid with icons and chevrons |
| **Bulletin month label** | Calendar month (`getCurrentMonthLabel`) | History sheet max month (`Jul-26` format) |

---

## Architecture Preserved

The following v0.4.1 decisions were **not** changed by this redesign:

| Area | Preserved |
|------|-----------|
| **Subscription model** | Dashboard remains **free** — no tier gating |
| **API and data fetching** | `/api/visa-bulletin` unchanged |
| **Client data pattern** | SWR + `jsonFetcher` + `visaBulletinSwrOptions` |
| **Tab types** | Final Action Dates and Dates for Filing both supported |
| **Authentication** | App-wide Clerk gate unchanged |
| **Production component** | `VisaBulletinDashboardClient.tsx` untouched during mockup phase |

---

## UX Decisions (Review Log)

| Decision | Outcome |
|----------|---------|
| Movement / Change columns | **Rejected** — dashboard shows current-month cutoffs only; movement belongs on Movement Tracker |
| Filters in page header | **Rejected** — moved back above tables; header experiment did not improve density |
| Bulletin title in page header | **Rejected** — kept with filters above tables for cleaner scan path |
| Panel internal scroll (`max-h: 70vh`) | **Removed** — all rows visible at once on desktop; compact padding applied instead |
| Colored panel headers | **Approved** — blue (Final Action) and emerald (Dates for Filing) |
| Dual side-by-side panels | **Approved** — uses wide-screen space; compare both date types without tab switching |

---

## Sprint 5 UX Build Sequence (Reference)

The Dashboard 2 mockup was built incrementally through reviewed Sprint 5 UX iterations:

| Phase | Focus |
|-------|-------|
| S5-008 initial | Mock route + DS 2.0 shell; single table with movement columns |
| UX iteration | Remove movement/change columns; current-month data only via `/api/visa-bulletin` |
| UX iteration | Data source line under section title; remove top info cards |
| UX iteration | Dual side-by-side panels (Final Action \| Dates for Filing) on desktop |
| UX iteration | Colored bold panel headers; remove page subtitle |
| UX iteration | Remove panel scroll cap; compact padding for full-table visibility |
| Final review | **Approved** — ready for promotion |

### Implementation files (mockup route)

| File | Role |
|------|------|
| `app/immigration/visa-bulletin-dashboard-2/page.tsx` | Server page — metadata, bulletin month prop from history sheet |
| `components/VisaBulletinDashboard2.tsx` | Full DS 2.0 client UI |

**Not modified during mockup:** `components/VisaBulletinDashboardClient.tsx`, `components/VisaBulletinDashboard.tsx`, `app/immigration/visa-bulletin/page.tsx`

---

## Promotion Decision

| Decision | Detail |
|----------|--------|
| **Approved** | Visa Bulletin Dashboard Design System 2.0 mockup |
| **Becomes** | Official Visa Bulletin Dashboard implementation target |
| **Production title** | Visa Bulletin Dashboard (no "2", no MOCK badge) |
| **Next engineering step** | Promote mockup to production route `/immigration/visa-bulletin` *(future task)* |
| **Production page during Sprint 5** | v0.4.1 implementation remains at `/immigration/visa-bulletin` until promotion executes |
| **Mock route after promotion** | Remove or redirect `/immigration/visa-bulletin-dashboard-2` per release checklist |

S5-008 documents the **design approval**. Production promotion is a separate engineering task.

---

## Sprint 5 Progress Impact

| Milestone | Status |
|-----------|--------|
| Design System 2.0 documentation framework | ✅ Complete (S5-DOC-002) |
| First DS 2.0 page — Visa Bulletin History | ✅ Complete (S5-004) |
| Second DS 2.0 page — Movement Tracker | ✅ Complete (S5-007, promoted) |
| **Third DS 2.0 page — Visa Bulletin Dashboard** | ✅ **Complete (approved mockup)** |
| Homepage redesign | ⏳ Planned |
| Pricing redesign | ⏳ Planned |
| Manage Profile redesign | ⏳ Planned |
| Calculator redesign | ⏳ Planned |

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-06 | S5-008 | Document Visa Bulletin Dashboard DS 2.0 approval and deliverables |
