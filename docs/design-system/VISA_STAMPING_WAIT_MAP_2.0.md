# Global Visa Stamping Wait Map — Design System 2.0

| Field | Value |
|-------|-------|
| **Title** | Global Visa Stamping Wait Map Design System 2.0 |
| **Version** | v1.0 |
| **Sprint** | Sprint 5 |
| **Task ID** | S5-CALC-004 |
| **Last Updated** | 2026-07-09 |
| **Owner** | Technical Architecture (CTO) |
| **Status** | **Approved — promoted to official implementation** |

**Related documentation:** [../CALCULATORS.md](../CALCULATORS.md) · [../CURRENT_PROJECT_STATE.md](../CURRENT_PROJECT_STATE.md) · [../SPRINT_5_HANDOFF.md](../SPRINT_5_HANDOFF.md) · [README.md](./README.md)

---

## Summary

The **Global Visa Stamping Wait Map** is a Sprint 5 free-tier Immigration calculator that compares approximate U.S. visa appointment wait times across consulates worldwide. Live data is loaded from the Immifin Google Sheets workbook (published CSV), with a demo fallback when sheets are unavailable.

This document records the approved dashboard layout, data architecture, UX decisions, and production promotion executed on 2026-07-09.

| Field | Value |
|-------|-------|
| **Production route (official)** | `/immigration/visa-stamping-wait-map` |
| **API route** | `/api/visa-stamping-wait-times` |
| **Subscription tier** | Free (public — no sign-in required) |
| **Promotion status** | ✅ **Promoted — live on production route** |
| **Architecture preserved** | Google Sheets published CSV pattern (same as Visa Bulletin), SWR client fetch, Leaflet map, demo fallback |

---

## Design System 2.0 Deliverables

### Page chrome

| Deliverable | Description |
|-------------|-------------|
| **Workspace shell** | `WorkspacePageShell` with light slate/blue-gray workspace background |
| **Compact header** | Globe icon + title + FavoriteStar; subtitle under title |
| **Header filters** | Country / Visa Type / Appointment Type + Reset Filters aligned top-right next to close (X) |
| **Close control** | Returns to `/calculators` |
| **No source/refresh chrome** | Source badge, last-updated badge, and Refresh Data button intentionally removed from header for density |
| **No amber dropbox banner** | Dropbox note not shown on the page surface |

### Top metrics row

| Deliverable | Description |
|-------------|-------------|
| **Aligned 3-column grid** | Same desktop columns as the main dashboard: KPIs span Map + Consulates; Historical Movement aligns with Selected Consulate Details |
| **Compact KPI cards** | Total Consulates, Average Wait Time, Shortest Wait Time, Longest Wait Time — icon + label + value + optional subtext; no fixed tall card bodies |
| **Historical Movement card** | Improving / Stable / Increasing counts + Biggest Improvement / Biggest Increase |

### Main dashboard row (desktop)

| Column | Content | Height |
|--------|---------|--------|
| **Left** | Map View (Leaflet + OpenStreetMap) | ~620px |
| **Middle** | Consulates (Ranked by Wait Time) table | ~620px, internal scroll |
| **Right** | Selected Consulate Details panel | ~620px, internal scroll |

Desktop grid:

```
minmax(0, 1fr)  minmax(0, 1.1fr)  minmax(380px, 0.95fr)
```

### Map View

| Deliverable | Description |
|-------------|-------------|
| **Title** | Map View only (List View toggle removed) |
| **Tiles** | Carto Voyager / OSM via Leaflet |
| **Pins** | Color-coded by wait band; permanent compact city labels |
| **Legend** | Bottom-left: 0–30 Low, 31–90 Moderate, 91–180 High, 181+ Very High |
| **Interaction** | Click pin → select consulate; click ranked row → focus map |

### Consulates ranked table

| Deliverable | Description |
|-------------|-------------|
| **Title** | Consulates (Ranked by Wait Time) |
| **Search** | Top-right — “Search city or consulate…” |
| **Columns** | Rank · Consulates · Current Wait · Change vs Last Update · Trend |
| **Change column** | Signed day change only (no %) |
| **Headers** | Current Wait / Change vs Last Update stay on one line (`whitespace-nowrap`) |
| **Row content** | City name only in the Consulates column (full post name kept in details panel) |
| **Selected row** | Sky background + blue left border |

### Selected Consulate Details

| Deliverable | Description |
|-------------|-------------|
| **Header** | City, Rank badge, post name, optional close |
| **Quick stats** | Current Wait Time · Status · Last Updated |
| **Tabs** | Overview · History Trend · Source Notes (default: Overview) |
| **Overview** | History Comparison (vs Last Update), range bar when history exists |
| **History Trend** | Recharts line chart for available history points (2+ months draws a short line; does not invent missing months), stats row, monthly table |
| **Source Notes** | Sheet names, visa-type column mapping, DOS estimate disclaimer |

### Bottom cards

| Card | Purpose |
|------|---------|
| **Important Note** | Wait times change quickly |
| **Disclaimer** | Educational tool; estimates only |
| **Coming Soon** | Alerts, country comparison, dropbox/waiver analytics |

---

## Data architecture

| Layer | Location |
|-------|----------|
| **Config / GIDs** | `lib/visaStampingConfig.ts` |
| **CSV loaders** | `lib/visaStampingSheets.ts` |
| **Normalize + history analysis** | `lib/visa/visaStampingSheetService.ts` |
| **Types / demo / helpers** | `lib/visa/visaStampingWaitTimes.ts` |
| **Wait string → days** | `lib/visa/parseWaitTimeToDays.ts` |
| **API** | `app/api/visa-stamping-wait-times/route.ts` |
| **UI** | `components/VisaStampingWaitMap.tsx` |
| **Map** | `components/visa/VisaStampingLeafletMap.tsx` |
| **History chart** | `components/visa/VisaStampingHistoryTrendChart.tsx` |

### Google Sheets tabs

| Worksheet | Role |
|-----------|------|
| `stamping_wait_time_current` | Current wait times by city |
| `stamping_wait_time_history` | Prior monthly snapshots for trend comparison |
| `Stamping_City_Metadata` | City, country, lat/lon, region, active |

### History analysis fields

Existing comparison fields are preserved. Each record may also include:

```ts
historyAnalysis.historyPoints: Array<{
  updateDate: string;
  waitDays: number;
  changeDays?: number;
  changePercent?: number;
  trend: "Improving" | "Stable" | "Increasing";
  isCurrent?: boolean;
}>
```

Current wait is included as the newest point with `isCurrent: true`.

### Caching

- Next `unstable_cache` + fetch `revalidate: 86400` (24h)
- Cold starts (especially local `npm run dev`) may take 15–30s while three published CSVs load
- Warm cache responses are fast

### Demo fallback

If sheet load fails or returns zero joinable records, the API returns demo posts with `metadata.source = "Demo fallback"`.

---

## UX decisions (approved simulation alignment)

| Decision | Rationale |
|----------|-----------|
| Use **Consulates** terminology site-wide on this page | Matches product language; “Post” reserved for data model only |
| Filters in header | Saves a full filter-row of vertical space |
| Align KPI row to main 3-column grid | Visual continuity with Map / Consulates / Details |
| Compact KPI heights | Reduce empty card body; keep dashboard above the fold |
| Sparse history still charts | 2 available months → 2-point line; never invent 12 months |
| Change column without % | Cleaner ranked table; % still available in details/history where useful |
| Public free route | Same access model as H-1B calculators |

---

## Responsive behavior

| Breakpoint | Layout |
|------------|--------|
| **Desktop ≥ xl** | Exact 3-column main dashboard + aligned KPI row |
| **Tablet** | Map full width; Consulates / Details two columns |
| **Mobile** | Stack: header filters → KPIs → Historical Movement → map → consulates → details → bottom cards |

---

## Testing checklist

- [ ] Open `/immigration/visa-stamping-wait-map`
- [ ] Default India / H-1B / Interview loads from Google Sheets when configured
- [ ] KPI row left edge aligns with Map View; Historical Movement aligns with Selected Consulate Details
- [ ] Map pins and ranked rows stay in sync on selection
- [ ] History Trend shows chart for available months (including 2-month series)
- [ ] Consulates column shows city only; details panel still shows full post name
- [ ] Change vs Last Update shows day deltas without percentages
- [ ] Demo fallback still works if sheets are unavailable

---

## Files delivered

| Path | Role |
|------|------|
| `app/immigration/visa-stamping-wait-map/page.tsx` | Route + metadata |
| `app/api/visa-stamping-wait-times/route.ts` | JSON API |
| `components/VisaStampingWaitMap.tsx` | Dashboard UI |
| `components/visa/VisaStampingLeafletMap.tsx` | Leaflet map |
| `components/visa/VisaStampingHistoryTrendChart.tsx` | History Recharts line |
| `lib/visaStampingConfig.ts` | Sheet GID / URL config |
| `lib/visaStampingSheets.ts` | CSV fetch/parse |
| `lib/visa/visaStampingSheetService.ts` | Normalize + historyPoints |
| `lib/visa/visaStampingWaitTimes.ts` | Types, demo, helpers |
| `lib/visa/parseWaitTimeToDays.ts` | DOS wait string parser |

---

## Sprint 5 progress impact

| Item | Status |
|------|--------|
| Global Visa Stamping Wait Map | ✅ Approved and promoted |
| Google Sheets live data + history comparison | ✅ Complete |
| Leaflet interactive map | ✅ Complete |
| History Trend tab + chart | ✅ Complete |
| Admin Data Refresh Center entry | ✅ Dataset listed in `dataFreshness.ts` |

---

## Revision History

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-09 | Initial DS 2.0 page record — approved simulation layout, Sheets integration, History Trend, production promotion |
