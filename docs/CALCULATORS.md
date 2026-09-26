# IMMIFIN Calculators

| Field | Value |
|-------|-------|
| **Last updated** | 2026-09-24 |
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
| **On-page SEO** | Server-rendered explanation below the interactive map (`VisaStampingWaitMapSeoContent.tsx`): DOS source meaning, H-1B petition-based (H, L, O, P, Q) category, India posts, comparison/history guidance, FAQ. No current wait-day values hardcoded. No FAQPage schema. |

---

## H-1B calculator pair

The live H-1B Wage Level Estimator is the **Product Owner-approved final functional calculator** (H1BWAGE-CLOSE-023) and is **Production LIVE** (SEC-IP-PROD-011) with official HUD geography, official OFLC wages, and server-side estimate. Temporary `/immigration/h1b-wage-level-estimator-v2` was an internal comparison route and has been removed. The approved experience lives only on the original canonical route. It is **not** the final Immigration visual design. Broader Immigration visual redesign remains deferred until after SCO/SEO.

IMMIFIN displays published OFLC wage information and an IMMIFIN wage-level estimate for informational purposes. It does **not** issue a Prevailing Wage Determination, choose the wage level that legally applies to a user's position, or determine an employer's legal wage obligation.

Official geography still follows **GEO-RESOLUTION-DECISION-001** ([PROJECT_DECISIONS.md](./PROJECT_DECISIONS.md) Decision 008): keep all official HUD ZIP-to-county rows; do not use `BUS_RATIO` / `RES_RATIO` / `TOT_RATIO` to pick an area; ask for work-location county only when official counties resolve to more than one OFLC area.

### H-1B Wage Level Estimator — Product Owner approved final (H1BWAGE-CLOSE-023)

| Item | Detail |
|------|--------|
| **Route** | `/immigration/h1b-wage-level-estimator` (only remaining user-facing H-1B Wage route) |
| **Status** | **Production LIVE.** Official HUD 2026 Q2 geography, official OFLC 2026-27 wages, and server-side estimate are live. **Not** the final Immigration visual design. |
| **Product model** | Production-style estimator experience + official data foundation. Worksite ZIP replaced City/State. Official occupations and official OFLC wages replaced the 722 seed lookup and demo wage amounts. |
| **Pipeline** | Official occupation search → occupation details / Common Job Titles / technical details → authoritative worksite ZIP geography → salary / experience / education → Estimate Wage Level → official OFLC wages + IMMIFIN estimate, salary-position comparison, and reasoning |
| **Occupation API** | `GET /api/h1b/official-occupations?q=` — ACTIVE official All Industries occupations (848). Public fields: `soc_code`, `title`. Official selection remains authoritative. |
| **Occupation enrichment** | Seed metadata may supplement official SOC records (category/group, Common Job Titles / look-alike titles, Typical H-1B). The 722 seed is **not** the search source. |
| **Geography API** | `POST /api/h1b/worksite-geography` — browser authority is `zip` + optional `county_fips`. Frontend never submits `area_code`. Server is authoritative for ZIP → HUD county → OFLC Area. AUTO / CHOICE_REQUIRED / UNAVAILABLE. Never guess. City/State location logic is not used. |
| **Wage API** | `POST /api/h1b/official-wage` — browser authority is `soc_code`, `zip`, optional `county_fips`. Server re-runs geography, selects ACTIVE All Industries, validates official SOC, exact wage record. No closest-area or closest-SOC fallback. Demo wage amounts are not used. |
| **Estimator** | `lib/h1b/wage/v2/estimateOfficialWageLevel.ts` — recovered Production estimation (salary, experience, education, confidence/reasoning, salary-position bands) applied to official OFLC wages. Do not retune during promotion work. |
| **UI** | `components/H1bWageLevelEstimator.tsx` + `components/h1b/WorksiteGeographyLookup.tsx` |
| **Ordinary / blank label** | Official values are hourly. The result table shows four columns: Wage Level, Official Wage (Hourly Rate), Annual Equivalent (2,080 Hours), Your Salary Position. Annual equivalent is `hourly × 2,080` (40 hours × 52 weeks). Presentation-only; not stored; not an OFLC-published annual wage. |
| **Annual Wage** | Official values are already annual. Do **not** multiply by 2,080. |
| **High Wage** | Level I–IV may be null. Average may exist. Do not fabricate levels or invent a unit. |
| **No Leveled Wage** | Level I–IV unavailable. Do not fabricate $0. Safe explanatory copy. |
| **Disclaimer** | “Annual equivalent is calculated by IMMIFIN using 2,080 working hours per year (40 hours × 52 weeks). The annual equivalent is provided for reference only and is not an OFLC-published annual wage.” |
| **Production dataset** | HUD-USPS 2026 Q2 ACTIVE + OFLC All Industries 2026–27 ACTIVE (2026-07-01–2027-06-30), BLS May 2025 OEWS, 2018 SOC; 848 occupations; 530 areas; 449,440 wage records. Runtime selects ACTIVE; dataset UUID is not hardcoded. |
| **Design reference PNG** | `public/images/h1b-wage-level-estimator-approved-design.png` is a **future** design reference, not a mandatory pixel-perfect implementation. |
| **Removed** | Temporary `/immigration/h1b-wage-level-estimator-v2` and `H1bWageLevelEstimatorV2.tsx`. Never sitemap/canonical/public-nav. No permanent public redirect. |
| **Cross-tool** | Locked journey: “Use this wage level in H-1B Lottery Odds Calculator” (`?wageLevel={I\|II\|III\|IV}`) and “Calculate lottery odds manually”. |

### H-1B Lottery Odds Calculator

| Item | Detail |
|------|--------|
| **Route** | `/immigration/h1b-lottery-odds-calculator` |
| **Logic** | `lib/h1b/h1bLotteryOdds.ts` |
| **Inputs** | Wage level (I–IV or “I don't know”), U.S. master's degree or higher (Yes / No) |
| **Output** | DHS modeled wage-level selection estimate vs DHS modeled random-selection baseline. Master's Yes communicates advanced-degree exemption eligibility only; it does not change the modeled percentage. |
| **Cross-tool** | Accepts `?wageLevel={I\|II\|III\|IV}` from the Wage Estimator. “Estimate my wage level” CTA when wage level is unknown. |
| **On-page SEO** | Server-rendered explanation below the calculator (`H1bLotteryOddsSeoContent.tsx`): FY2027 wage-weighted 1×–4× method, static DHS estimate table, master’s exemption (no invented percentage), Wage Estimator link, FAQ. No FAQPage schema. |

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
| [PROJECT_DECISIONS.md](./PROJECT_DECISIONS.md) Decision 010 | Approved V2 estimator promoted to the canonical H-1B Wage route; temporary V2 removed |
| [PROJECT_DECISIONS.md](./PROJECT_DECISIONS.md) Decision 011 | H-1B Wage Level Estimator functionally closed on localhost; four-column hourly table; later Production LIVE |
| [PROJECT_DECISIONS.md](./PROJECT_DECISIONS.md) Decision 013 | H-1B Official Wage Platform Production LIVE; AbuseGate v2; post-v2 rollback |
| [H1B_GEOGRAPHIC_RESOLUTION_CONTRACT.md](./H1B_GEOGRAPHIC_RESOLUTION_CONTRACT.md) | GEO-RESOLUTION-DESIGN-002 runtime contract + GEO-RESOLUTION-UX-011 county-choice UX |
