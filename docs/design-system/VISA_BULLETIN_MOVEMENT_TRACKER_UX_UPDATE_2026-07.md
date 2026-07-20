# Visa Bulletin Movement Tracker — UX Update (Sandbox Promotion)

| Field | Value |
|-------|-------|
| **Title** | Movement Tracker UX Update — Sandbox Promotion |
| **Version** | v1.0 |
| **Sprint** | Sprint 7 |
| **Date** | 2026-07-14 |
| **Owner** | Product + Engineering |
| **Status** | **Approved — promoted to production (2026-07-14)** |

**Related:** [VISA_BULLETIN_MOVEMENT_2.0.md](./VISA_BULLETIN_MOVEMENT_2.0.md) · [CURRENT_PROJECT_STATE.md](../CURRENT_PROJECT_STATE.md)

---

## Summary

The Movement Tracker **design sandbox** at `/immigration/visa-bulletin-movement-2` was reviewed and locked as the final UX. This document records the approved changes, then production promotion replaces the live page at `/immigration/visa-bulletin-movement` with that UI.

| Field | Value |
|-------|-------|
| **Production route (unchanged)** | `/immigration/visa-bulletin-movement` |
| **Sandbox route (retired)** | `/immigration/visa-bulletin-movement-2` → redirect to production |
| **Sandbox component** | Removed after promotion (`VisaBulletinMovementTrackerSandbox.tsx`) |
| **Production component (after promotion)** | `components/VisaBulletinMovementTracker2.tsx` |
| **Capability / API** | Unchanged (`accessMovementTracker`, `/api/visa-bulletin-movement`) |

---

## Approved UX changes (vs prior production DS 2.0)

### Layout and information hierarchy

| Change | Detail |
|--------|--------|
| **Two-column workspace** | Left: filters + all-changes table. Right: Advanced / Retrogressed / Became Current glance panels. |
| **What Changed title** | Label only, placed **above KPI cards**, beside Final Action / Dates for Filing tabs. |
| **Removed “All Changes This Month” heading** | Table stands without that section tag. |
| **Tabs relocated** | Final Action Dates / Dates for Filing sit next to the What Changed label (not in the page header). |

### Filtering

| Change | Detail |
|--------|--------|
| **Removed table-level movement chips** | Show All / Advanced / Retrogressed / No Change / Current chips above the table removed. |
| **KPI cards remain interactive filters** | Advanced, Retrogressed, No Change, Current still filter the table. |
| **Record Type dropdown (new)** | Options: **Updates only** (default), **Show All**. Placed after All Countries, before Reset Filters. |
| **Updates only rule** | Hides rows where Movement = **No Change**. All other movement types remain. |
| **Filter bar layout** | Category, Country, Record Type, and Reset Filters span the table width. |

### Table columns

| Change | Detail |
|--------|--------|
| **Dynamic bulletin headers** | “Previous” → `{Mon-YY} Bulletin` (prior month). “Current” → `{Mon-YY} Bulletin` (latest month). Example: `Jun-26 Bulletin` / `Jul-26 Bulletin`. |
| **Month source** | Latest month from Visa Bulletin History sheet; previous = one calendar month earlier. |

### What Changed glance panels

| Change | Detail |
|--------|--------|
| **Stacked on the right** | Advanced, Retrogressed, Became Current stacked vertically beside the table. |
| **Dynamic height** | Panel grows with record count. |
| **Scroll after 10** | If a panel has more than **10** rows, list scrolls vertically; all records remain available. |
| **Removed old 5-row fixed-height constraint** | Prior “Top 5 shown” height/message removed. |

### Explicitly unchanged

- Production URL and My Immifin / Immigration nav targets  
- Pro / Power capability gate (`PremiumFeaturePreview`)  
- Movement API and movement calculation logic  
- Favorites, Related Tools, disclaimer  

---

## Promotion checklist

1. [x] Document approved sandbox UX (this file).
2. [x] Point production page at promoted UI (merge sandbox into `VisaBulletinMovementTracker2`).
3. [x] Restore production page title (no “-2” / sandbox copy).
4. [x] Pass dynamic previous/current bulletin column labels from the production page.
5. [x] Redirect `/immigration/visa-bulletin-movement-2` → `/immigration/visa-bulletin-movement`.
6. [x] Remove temporary sandbox component after production owns the UI.
7. [ ] Smoke-test Final Action / Filing, Record Type, headers, panels, Pro gate.

---

## Smoke-test plan (post-promotion)

- [ ] `/immigration/visa-bulletin-movement` shows new layout  
- [ ] `/immigration/visa-bulletin-movement-2` redirects to production  
- [ ] What Changed label + FA/Filing tabs above KPIs  
- [ ] Table headers show month bulletins, not Previous/Current  
- [ ] Record Type defaults to Updates only (No Change rows hidden)  
- [ ] Show All reveals No Change rows  
- [ ] What Changed panels grow; scroll after 10 items  
- [ ] Free users still see Pro preview gate  
