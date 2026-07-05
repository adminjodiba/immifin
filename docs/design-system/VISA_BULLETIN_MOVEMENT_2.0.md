# Visa Bulletin Movement Tracker — Design System 2.0 Promotion

| Field | Value |
|-------|-------|
| **Title** | Visa Bulletin Movement Tracker Design System 2.0 |
| **Version** | v1.0 |
| **Sprint** | Sprint 5 |
| **Task ID** | S5-007 |
| **Last Updated** | 2026-07-05 |
| **Owner** | Technical Architecture (CTO) |
| **Status** | **Approved — ready for promotion to official implementation** |

**Related documentation:** [DESIGN_SYSTEM_2.0.md](./DESIGN_SYSTEM_2.0.md) · [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) · [VISA_BULLETIN_HISTORY_2.0.md](./VISA_BULLETIN_HISTORY_2.0.md) · [../CURRENT_PROJECT_STATE.md](../CURRENT_PROJECT_STATE.md) · [../ROADMAP_v2.md](../ROADMAP_v2.md)

---

## Summary

The **Visa Bulletin Movement Tracker** page is the **second completed Sprint 5 Design System 2.0 redesign** (after Visa Bulletin History). The mockup developed and reviewed on the preview route has been **approved** and is designated as the **new official implementation target** for this Pro feature.

This document records what was delivered, what changed from the v0.4.1 production page, what shared business-logic updates were introduced, and what architecture was preserved.

| Field | Value |
|-------|-------|
| **Production route (current)** | `/immigration/visa-bulletin-movement` |
| **Design System 2.0 mockup route** | `/immigration/visa-bulletin-movement-2` |
| **Promotion status** | Approved — mockup becomes official target |
| **Subscription tier** | Pro / Power (`PremiumFeaturePreview`, `requiredTier="pro"`) |
| **Architecture preserved** | Capabilities, Premium Feature Discovery, API/data layer, SWR client pattern |

---

## Design System 2.0 Deliverables

The redesign applies the Sprint 5 commercial SaaS visual language to the Movement Tracker while preserving v0.4.1 platform architecture and the proven Movement Tracker data pattern (small Client Component + SWR + API route).

### Visual and layout

| Deliverable | Description |
|-------------|-------------|
| **Design System 2.0 styling** | Premium SaaS look — refined cards, spacing, typography, and elevation aligned with Visa Bulletin History 2.0 |
| **Three-section vertical workspace** | KPI summary → What Changed glance → All Changes table; single scrollable analysis flow |
| **Simplified page header** | Icon, title, MOCK badge, subtitle left; Final Action / Dates for Filing tabs right only |
| **Removed header chrome** | Breadcrumb, Export, Share, Compare, and Refresh removed from mockup scope |
| **Related Tools footer** | Three linked cards with icons and chevrons (matches History 2.0 related-tools pattern) |
| **Legal disclaimer** | Compact informational footer retained |

### KPI and filtering

| Deliverable | Description |
|-------------|-------------|
| **Interactive KPI filter row** | Four compact filter buttons: Advanced, Retrogressed, No Change, Current — each shows count + icon |
| **KPI-as-filter pattern** | Clicking a KPI toggles the table movement filter; click again resets to Show All |
| **Unified filter state** | KPI row, filter chips, and table share one `movementFilter` state |
| **Secondary filters** | EB category dropdown, country dropdown, Reset Filters button |
| **Filter chips** | Show All, Advanced, Retrogressed, No Change, Current — with counts and directional icons |

### What Changed section

| Deliverable | Description |
|-------------|-------------|
| **Dynamic section title** | `What changed in {Mon-YY} Visa Bulletin ?` — month from Visa Bulletin History sheet (not calendar month) |
| **Three-column glance layout** | Advanced (green), Retrogressed (red), Became Current (blue) |
| **Fixed-height scroll columns** | Top ~5 rows visible per column; scroll for remainder; sorted by movement magnitude |
| **Two-line entry format** | Line 1: `{EB-X} {Country} {±N} days ≈ M months` · Line 2: `From {previous} to {current}` |
| **Merged Top Movers** | Former separate Top Movers panel removed; highlights live only in What Changed columns |

### All Changes table

| Deliverable | Description |
|-------------|-------------|
| **Grouped by EB category** | EB-1 through EB-5 + Other group headers with color-coded badges |
| **Five-column fixed layout** | Country · Previous · Current · Movement · Change — `table-fixed` with proportional widths |
| **Compact table dates** | Short month format (`Dec 15, 2013`); `Current` instead of `Current (C)` in table only |
| **Removed redundant EB column** | Category shown in group header only (no per-row `—` placeholder column) |
| **Column alignment** | Country/Previous/Current left · Movement center · Change right |
| **Single-line change values** | `+396 days ≈ 13 months` on one line (not stacked) |
| **No Change behavior** | Movement badge shows No Change; Change column shows `—` (not `0` or duplicate label) |
| **Long country truncation** | Ellipsis with full name in `title` tooltip |

---

## Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header: icon + title + MOCK badge + subtitle                │
│         Final Action Dates | Dates for Filing (tabs)        │
├─────────────────────────────────────────────────────────────┤
│ KPI row: [Advanced] [Retrogressed] [No Change] [Current]    │
├─────────────────────────────────────────────────────────────┤
│ What changed in Jul-26 Visa Bulletin ?                      │
│ ┌─────────────┬─────────────┬─────────────┐                 │
│ │  Advanced   │ Retrogressed│Became Current│                │
│ │  (scroll)   │  (scroll)   │  (scroll)   │                 │
│ └─────────────┴─────────────┴─────────────┘                 │
├─────────────────────────────────────────────────────────────┤
│ All Changes This Month                                      │
│ [chips] + [category ▼] [country ▼] [Reset]                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Grouped table (EB-1 … EB-5)                             │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Related Tools (3 cards)                                       │
│ Disclaimer                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Changes from v0.4.1 Production

| Area | Production (v0.4.1) | Design System 2.0 mockup |
|------|---------------------|--------------------------|
| **Visual language** | Functional layout, emoji movement icons | DS 2.0 cards, SVG icons, semantic color system |
| **Summary** | No KPI row | Interactive KPI filter row with counts |
| **Highlights** | No What Changed section | Three-column monthly glance with scroll |
| **Table columns** | Category, Country, Previous, Current, Movement (5 cols) | Country, Previous, Current, Movement, Change (5 cols; category in group header) |
| **Change display** | Movement badge only | Separate Movement badge + Change (Days) column |
| **EB categories in table** | EB-1, EB-2, EB-3, Other | EB-1 through EB-5 + Other |
| **Related resources** | `RelatedImmigrationResources` component | Inline Related Tools cards (History 2.0 style) |
| **Tab explanations** | Inline explanatory text under tabs | Removed from mockup (tabs only) |
| **Bulletin month label** | Not shown in section title | Derived from history sheet max month |

---

## Shared Business Logic Updates

Two small shared-library changes support correct mockup behavior and will apply when promoted to production:

### `lib/visaBulletinMovement.ts` — `compareBulletinMovement`

| Condition | Previous behavior | New behavior |
|-----------|-------------------|--------------|
| Previous = `Current (C)` **and** Current = `Current (C)` | Classified as **Current** (Became Current) | Classified as **No Change** |

Rows that were already current in both months should not appear as newly current.

### `lib/visaBulletinHistory.ts` — bulletin month helpers

| Function | Purpose |
|----------|---------|
| `getLatestVisaBulletinMonth()` | Returns max `YYYY-MM` from Visa Bulletin History sheet |
| `formatVisaBulletinMonthShort(month)` | Formats as `Jul-26` for section titles |

The What Changed title uses the **latest uploaded bulletin month** from history data, not the calendar month or the movement API sample month.

---

## Architecture Preserved

The following v0.4.1 decisions were **not** changed by this redesign:

| Area | Preserved |
|------|-----------|
| **Subscription model** | Free / Pro / Power tiers unchanged |
| **Premium Feature Discovery** | `PremiumFeaturePreview` with Movement Intelligence benefits |
| **API and data fetching** | `/api/visa-bulletin-movement` unchanged |
| **Client data pattern** | SWR + `jsonFetcher` + `visaBulletinSwrOptions` |
| **Tab types** | Final Action Dates and Dates for Filing both supported |
| **Authentication** | App-wide Clerk gate unchanged |
| **Production component** | `VisaBulletinMovementTracker.tsx` untouched during mockup phase |

---

## Color and Movement Semantics

| Movement type | KPI / panel color | Badge | Change column |
|---------------|-------------------|-------|---------------|
| **Advanced** | Emerald | Advanced | `+N days ≈ M months` (green) |
| **Retrogressed** | Red | Retrogressed | `-N days ≈ M months` (red) |
| **No Change** | Slate | No Change | `—` |
| **Current** | Blue | Current | `Current` |
| **Unavailable / Invalid** | Slate | Unavailable / Invalid | `—` |

EB category group colors: EB-1 blue · EB-2 emerald · EB-3 amber · EB-4 violet · EB-5 orange · Other slate.

---

## Sprint 5 UX Build Sequence (Reference)

The Movement Tracker 2 mockup was built incrementally through reviewed Sprint 5 UX iterations:

| Phase | Focus |
|-------|-------|
| S5-007 initial | Clone route + DS 2.0 shell; KPI row; What Changed + table scaffold |
| UX iteration | Merge What Changed and Top Movers; remove duplicate sections |
| UX iteration | KPI row as clickable filters; compact single-line buttons |
| UX iteration | Dynamic bulletin month title from history sheet |
| UX iteration | What Changed two-line headline format (`EB-3 India +396 days ≈ 13 months`) |
| UX iteration | Table compact dates; remove redundant EB column; single-line Change column |
| UX iteration | `table-fixed` column widths and alignment; No Change → empty Change cell |
| Final review | Approved for lock / promotion |

### Implementation files (mockup route)

| File | Role |
|------|------|
| `app/immigration/visa-bulletin-movement-2/page.tsx` | Server page — metadata, `PremiumFeaturePreview`, bulletin month prop |
| `components/VisaBulletinMovementTracker2.tsx` | Full DS 2.0 client UI |
| `lib/visaBulletinHistory.ts` | `getLatestVisaBulletinMonth`, `formatVisaBulletinMonthShort` |
| `lib/visaBulletinMovement.ts` | Both-Current → No Change classification |

**Not modified during mockup:** `components/VisaBulletinMovementTracker.tsx`, `app/immigration/visa-bulletin-movement/page.tsx`

---

## Promotion Decision

| Decision | Detail |
|----------|--------|
| **Approved** | Visa Bulletin Movement Tracker Design System 2.0 mockup |
| **Becomes** | Official Visa Bulletin Movement Tracker implementation target |
| **Next engineering step** | Promote mockup components to production route `/immigration/visa-bulletin-movement` *(future task — not part of S5-007 documentation)* |
| **Production page during Sprint 5** | v0.4.1 implementation remains at `/immigration/visa-bulletin-movement` until promotion task executes |
| **Mock route after promotion** | Remove or redirect `/immigration/visa-bulletin-movement-2` per release checklist |

S5-007 documents the **approval and promotion decision**. Application code for the mockup is implemented; production promotion is a separate engineering task.

---

## Sprint 5 Progress Impact

| Milestone | Status |
|-----------|--------|
| Design System 2.0 documentation framework | ✅ Complete (S5-DOC-002) |
| First DS 2.0 page — Visa Bulletin History | ✅ Complete (S5-004) |
| **Second DS 2.0 page — Movement Tracker** | ✅ **Complete (approved mockup)** |
| Homepage redesign | ⏳ Planned |
| Pricing redesign | ⏳ Planned |
| Dashboard redesign | ⏳ Planned |
| Calculator redesign | ⏳ Planned |
| Manage Profile redesign | ⏳ Planned |

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-05 | S5-007 | Document Visa Bulletin Movement Tracker DS 2.0 approval and deliverables |
