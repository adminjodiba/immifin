# My Immifin Dashboard — Sprint 5 Polish (v0.4.2)

| Field | Value |
|-------|-------|
| **Sprint** | Sprint 5 |
| **Task ID** | S5-009 |
| **Release** | v0.4.2 (`71d5add`) |
| **Release Date** | 2026-07-06 |
| **Status** | ✅ Shipped to production |

**Related:** [RELEASE_NOTES_v0.4.2.md](../RELEASE_NOTES_v0.4.2.md) · [SPRINT_5_HANDOFF.md](../SPRINT_5_HANDOFF.md)

---

## Summary

Visual and UX polish for the authenticated **My Immifin** employment journey dashboard (`/dashboard`). Layout architecture from v0.4.1 is preserved; this release compacts the timeline, clarifies sidebar content, and improves Action Center usability.

---

## Deliverables

### Employment journey timeline cards

| Item | Detail |
|------|--------|
| Compact timeline | Single-line marker labels, shorter connectors, smaller status summary |
| Label placement | Priority Date + Today above bar; Filing / Final Action cutoff below bar |
| Days Since Priority Date | Header center on Dates for Filing card only |
| Current Visa Bulletin month | From Google Sheet via `getLatestVisaBulletinMonth()` |
| Removed | Duplicate bottom KPI row, info icon, redundant explanation banner |

### Immigration Details sidebar

| Item | Detail |
|------|--------|
| Renamed | Your Journey → **Immigration Details** |
| Category + Country | One row, two columns |
| Removed | Preferred Bulletin Type, Last Updated |
| Order | Today's Focus above How It Works |
| How It Works | Priority Date + green/red meaning only |

### Action Center

| Item | Detail |
|------|--------|
| Layout | Horizontal table — Action · Description · Status |
| Placement | Main column under Final Action Date card |
| Links | Action column styled as hyperlinks |

### Access & calculators

| Item | Detail |
|------|--------|
| Free dashboard | Blurred real dashboard via `PremiumFeaturePreview` |
| Pro calculators | Auto-populate + auto-calculate from immigration profile |
| Data retention | `lib/subscription/dataRetention.ts` — no profile wipe on downgrade |

### Favorites (Pro/Power)

- Star on page titles, nav dropdown, `/api/account/favorites`, max 10 items
- Saved favorites preserved when tier downgrades (access gated)

---

## Architecture preserved

- My Immifin workspace and journey layout (main + sidebar)
- Free / Pro / Power capability model
- Employment + Green Card journey stage routing
- Premium Feature Discovery pattern

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-06 | S5-009 | Document v0.4.2 My Immifin dashboard polish |
