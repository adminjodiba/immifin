# IMMIFIN Calculators

| Field | Value |
|-------|-------|
| **Last updated** | 2026-09-22 |
| **Sprint** | Sprint 7A — H-1B Official Wage Platform |
| **Catalog source** | `lib/data/calculators.ts` |
| **Navigation rule** | `.cursor/rules/calculator-navigation.mdc` |

---

## Overview

IMMIFIN calculators are **manual tools** on the **Free** tier unless noted. Pro users may receive **auto-population** from their saved immigration profile on selected calculators.

All live calculator pages use Design System 2.0 workspace layout and a **header close (X) button** that returns to `/calculators`. Do **not** add “Back to Immigration Tools” text links on calculator pages.

---

## Live calculators

| Calculator | Route | Component | Tier | Pro auto-fill |
|------------|-------|-----------|------|---------------|
| **Citizenship Eligibility** | `/calculators/citizenship-eligibility` | `CitizenshipEligibilityCalculator.tsx` | Free | ✅ Pro/Power |
| **Green Card (priority date)** | `/calculators/green-card-wait-time` | `GreenCardWaitTimeCalculator.tsx` | Free | ✅ Pro/Power |
| **H-1B Wage Level Estimator** | `/immigration/h1b-wage-level-estimator` | `H1bWageLevelEstimator.tsx` | Free (public) | — |
| **H-1B Lottery Odds** | `/immigration/h1b-lottery-odds-calculator` | `H1bLotteryOddsCalculator.tsx` | Free (public) | — |
| **Global Visa Stamping Wait Map** | `/immigration/visa-stamping-wait-map` | `VisaStampingWaitMap.tsx` | Free (public) | — |

Public routes (no sign-in required): H-1B tools and the visa stamping wait map are listed in `lib/auth/publicRoutes.ts`.

---

## Global Visa Stamping Wait Map (Sprint 5)

| Item | Detail |
|------|--------|
| **Route** | `/immigration/visa-stamping-wait-map` |
| **Task ID** | S5-CALC-004 |
| **DS 2.0 doc** | [design-system/VISA_STAMPING_WAIT_MAP_2.0.md](./design-system/VISA_STAMPING_WAIT_MAP_2.0.md) |
| **Logic** | `lib/visa/visaStampingWaitTimes.ts`, `lib/visa/visaStampingSheetService.ts` |
| **UI** | `components/VisaStampingWaitMap.tsx`, `components/visa/VisaStampingLeafletMap.tsx` |
| **Data** | Live Google Sheets (`stamping_wait_time_current`, `stamping_wait_time_history`, `Stamping_City_Metadata`) via `/api/visa-stamping-wait-times`; demo fallback when sheets unavailable |
| **Map** | Leaflet + OpenStreetMap / Carto tiles |
| **History** | History Trend tab charts available monthly points (does not invent missing months) |

---

## H-1B calculator pair

The live H-1B Wage page is the **FUNCTIONALLY APPROVED official-wage baseline**. It is **not** the final Immigration visual design. Further page-specific visual redesign is deferred until the Immigration-wide navigation/shell redesign after the current SCO/SEO workstream.

IMMIFIN displays published OFLC wage information for informational purposes. It does **not** issue a Prevailing Wage Determination, choose the wage level that legally applies to a user's position, or determine an employer's legal wage obligation.

Official geography still follows **GEO-RESOLUTION-DECISION-001** ([PROJECT_DECISIONS.md](./PROJECT_DECISIONS.md) Decision 008): keep all official HUD ZIP-to-county rows; do not use `BUS_RATIO` / `RES_RATIO` / `TOT_RATIO` to pick an area; ask for work-location county only when official counties resolve to more than one OFLC area.

### H-1B Wage Level Estimator — official OFLC baseline (H1BWAGE-CHECKPOINT-019)

| Item | Detail |
|------|--------|
| **Route** | `/immigration/h1b-wage-level-estimator` |
| **Status** | Functionally approved official-wage baseline. **Not** deployed to Production. **Not** the final Immigration visual design. |
| **Pipeline** | Official occupation search → authoritative worksite geography → official OFLC wage lookup |
| **Occupation API** | `GET /api/h1b/official-occupations?q=` — ACTIVE official All Industries occupations (848). Public fields: `soc_code`, `title`. Case-insensitive title match, useful SOC prefix match, bounded results, deterministic ranking. |
| **Geography API** | `POST /api/h1b/worksite-geography` — browser authority is `zip` + optional `county_fips`. Frontend never submits `area_code`. Server is authoritative for ZIP → HUD county → OFLC Area. AUTO / CHOICE_REQUIRED / UNAVAILABLE. Never guess. |
| **Wage API** | `POST /api/h1b/official-wage` — browser authority is `soc_code`, `zip`, optional `county_fips`. Server re-runs geography, selects ACTIVE All Industries, validates official SOC, exact wage record. No closest-area or closest-SOC fallback. |
| **UI** | `components/H1bWageLevelEstimator.tsx` + `components/h1b/WorksiteGeographyLookup.tsx` |
| **Occupation source** | Official `oflc_occupations` from the ACTIVE Dev dataset. The old 722-title seed remains on disk (`lib/h1b/data/socOccupationsSeed.ts`) and is **not** used by this page. |
| **Legacy demo engine** | `lib/h1b/wageLevelEstimator.ts` remains on disk and is **disconnected**. Do not reconnect. |
| **Ordinary / blank label** | Official values are hourly. UI shows official hourly + IMMIFIN annual equivalent (`hourly × 2,080`). 2,080 = 40 hours × 52 weeks. Presentation-only; not stored; not an OFLC-published annual wage. |
| **Annual Wage** | Official values are already annual. Do **not** multiply by 2,080. |
| **High Wage** | Level I–IV may be null. Average may exist. Do not fabricate levels or invent a unit. |
| **No Leveled Wage** | Level I–IV unavailable. Do not fabricate $0. Safe explanatory copy. |
| **Disclaimer** | “Annual equivalent is calculated by IMMIFIN using 2,080 working hours per year (40 hours × 52 weeks). The annual equivalent is provided for reference only and is not an OFLC-published annual wage.” |
| **Current Dev dataset** | OFLC All Industries 2026–27 (2026-07-01–2027-06-30), BLS May 2025 OEWS, 2018 SOC; 848 occupations; 530 areas; 449,440 wage records. Runtime selects ACTIVE; dataset UUID is not hardcoded. |
| **Design reference PNG** | `public/images/h1b-wage-level-estimator-approved-design.png` is a **future** design reference, not a mandatory pixel-perfect implementation. |
| **Cross-tool** | Lottery Odds remains a separate educational estimator. |

### H-1B Lottery Odds Calculator

| Item | Detail |
|------|--------|
| **Route** | `/immigration/h1b-lottery-odds-calculator` |
| **Logic** | `lib/h1b/h1bLotteryOdds.ts` |
| **Inputs** | Wage level (I–IV or “I don't know”), U.S. master's cap eligibility |
| **Output** | Demo odds estimate, wage-weighted comparison vs traditional lottery |
| **Cross-tool** | “Estimate my wage level” CTA when wage level is unknown |

### Data scripts (maintenance)

| Script | Purpose |
|--------|---------|
| `scripts/generate-soc-occupations-seed.ts` | Regenerate SOC occupation seed |
| `scripts/import-onet-soc.ts` | Import O*NET/SOC reference data |

---

## Pro auto-population (existing calculators)

Implemented via `useImmigrationProfileDefaults()` and `canAccessAutoCalculatorPopulation(tier)`.

| Field | Citizenship | Green Card |
|-------|-------------|------------|
| Green card issue date | ✅ | — |
| Married to U.S. citizen | ✅ | — |
| Priority date | — | ✅ |
| Category / country | — | ✅ |

Free users always get manual entry. Pro/Power see profile prefill hints when data exists.

---

## Catalog entries (not yet built)

Listed on `/calculators` for roadmap visibility — no `href`, not navigable:

- Tax Residency Calculator
- Mortgage Affordability Calculator
- Credit Score Builder Planner
- 401(k) Contribution Calculator
- FICA Exemption Calculator
- Health Insurance Premium Estimator
- Renters Insurance Calculator

---

## Related documentation

| Document | Role |
|----------|------|
| [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) | Free manual tools vs Pro automation |
| [SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md) | Sprint 5 calculator deliverables |
| [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) | Production status |
| [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md) | Dataset freshness tracked for H-1B / bulletin data |
| [PROJECT_DECISIONS.md](./PROJECT_DECISIONS.md) Decision 008 | Approved official HUD ZIP → OFLC geographic-resolution policy |
| [PROJECT_DECISIONS.md](./PROJECT_DECISIONS.md) Decision 009 | Official OFLC All Industries wage page: occupation/wage APIs, ×2080 presentation, PWD boundary |
| [H1B_GEOGRAPHIC_RESOLUTION_CONTRACT.md](./H1B_GEOGRAPHIC_RESOLUTION_CONTRACT.md) | GEO-RESOLUTION-DESIGN-002 runtime contract + GEO-RESOLUTION-UX-011 county-choice UX |
