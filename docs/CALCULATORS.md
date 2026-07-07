# IMMIFIN Calculators

| Field | Value |
|-------|-------|
| **Last updated** | 2026-07-07 |
| **Sprint** | Sprint 5 |
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

Public routes (no sign-in required): H-1B tools are listed in `lib/auth/publicRoutes.ts`.

---

## H-1B calculator pair (Sprint 5)

Educational estimators — **not legal advice** and not official USCIS/DOL output.

### H-1B Wage Level Estimator

| Item | Detail |
|------|--------|
| **Route** | `/immigration/h1b-wage-level-estimator` |
| **Logic** | `lib/h1b/wageLevelEstimator.ts` |
| **Occupation data** | `lib/services/occupationService.ts`, `lib/h1b/data/socOccupationsSeed.ts` |
| **Inputs** | SOC occupation search, work city/state, annual salary, experience band, education |
| **Output** | Estimated wage level (I–IV), prevailing wage comparison table, reasoning bullets |
| **Cross-tool** | Result CTAs can deep-link to Lottery Odds with `?wageLevel=` query param |

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

- Visa Wait Time Estimator
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
