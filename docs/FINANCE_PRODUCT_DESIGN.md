# IMMIFIN Finance Product & Calculator Design Specification

| Field | Value |
|-------|-------|
| **Document** | Canonical Finance Product & Calculator Design Specification |
| **Project** | IMMIFIN |
| **Pillar** | Finance |
| **Phase** | Product & UX Design |
| **Task ID** | FIN-DESIGN-001 |
| **Task Name** | Create Canonical Finance Product & Calculator Design Specification |
| **Task Type** | Documentation only |
| **Version** | v0.1 |
| **Status** | **Approved product/UX definition — implementation NOT STARTED** |
| **Created** | 2026-09-18 |
| **Last Updated** | 2026-09-18 |
| **Owner** | Product / Design |
| **Authority** | Canonical product/design source of truth for the IMMIFIN Finance pillar until superseded by an explicitly approved later document |

> **Purpose:** Preserve the approved Finance product definition **before** architecture or implementation begins.
>
> **This document does not authorize implementation.** Architecture, database design, API design, calculation-engine architecture, entitlements implementation, and billing changes are **not approved**.

**Related documentation (not modified by this task):** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [PRODUCT_VISION.md](./PRODUCT_VISION.md) · [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) · [PUBLIC_VISITOR_ACCESS_ARCHITECTURE.md](./PUBLIC_VISITOR_ACCESS_ARCHITECTURE.md) · [CALCULATORS.md](./CALCULATORS.md) · [ROADMAP_v2.md](./ROADMAP_v2.md) · [design-system/README.md](./design-system/README.md)

`docs/ROADMAP.md` is **not present**. Forward sprint sequencing lives in [ROADMAP_v2.md](./ROADMAP_v2.md). Long-term product phases live in [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md).

---

## Table of Contents

1. [Document Metadata / Status](#1-document-metadata--status)
2. [Finance Product Vision](#2-finance-product-vision)
3. [Product Principles](#3-product-principles)
4. [Finance Information Architecture](#4-finance-information-architecture)
5. [Finance Overview](#5-finance-overview)
6. [Finance Tier Philosophy](#6-finance-tier-philosophy)
7. [Common Calculator Design Standard](#7-common-calculator-design-standard)
8. [Locked Capability / Upgrade UX Standard](#8-locked-capability--upgrade-ux-standard)
9. [Public Calculator UX Standard](#9-public-calculator-ux-standard)
10. [Free Calculator UX Standard](#10-free-calculator-ux-standard)
11. [Pro Calculator UX Standard](#11-pro-calculator-ux-standard)
12. [Power Calculator UX Standard](#12-power-calculator-ux-standard)
13. [Save Details & Scenario Standard](#13-save-details--scenario-standard)
14. [AI / Deterministic Calculation Boundary](#14-ai--deterministic-calculation-boundary)
15. [Finance Calculator Catalog](#15-finance-calculator-catalog)
16. [Calculator #1 — Take-Home Pay & Savings](#16-calculator-1--take-home-pay--savings)
17. [Calculator #2 — State & Local Tax](#17-calculator-2--state--local-tax)
18. [Calculator #3 — Salary & Location Comparison](#18-calculator-3--salary--location-comparison)
19. [Calculator #4 — Home Affordability](#19-calculator-4--home-affordability)
20. [Calculator #5 — Mortgage Calculator](#20-calculator-5--mortgage-calculator)
21. [Calculator #6 — Rent vs. Buy](#21-calculator-6--rent-vs-buy)
22. [Calculator #7 — Cost of Living Comparison](#22-calculator-7--cost-of-living-comparison)
23. [Calculator #8 — Savings Goal Calculator](#23-calculator-8--savings-goal-calculator)
24. [Calculator #9 — Net Worth Tracker](#24-calculator-9--net-worth-tracker)
25. [Cross-Calculator Journey Principle](#25-cross-calculator-journey-principle)
26. [Approved Visual References](#26-approved-visual-references)
27. [Explicitly Deferred / Not Yet Decided](#27-explicitly-deferred--not-yet-decided)
28. [Implementation Status](#28-implementation-status)
29. [Relationship to Existing Documentation](#29-relationship-to-existing-documentation)

---

## 1. Document Metadata / Status

| Field | Value |
|-------|-------|
| **Current goal** | Document approved product behavior and visual direction before technical architecture begins |
| **Architecture** | **NOT approved** |
| **Database design** | **NOT approved** |
| **API design** | **NOT approved** |
| **Calculation-engine architecture** | **NOT approved** |
| **Implementation** | **NOT STARTED** |
| **Broader project-state docs** | **Not updated by this task.** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) will be updated separately after the Finance design phase reaches the appropriate milestone |

### What this document governs

- Approved Finance product behavior
- Finance information architecture
- Finance Overview locked design decisions
- Public / Free / Pro / Power UX progression
- Locked-capability marketing strategy
- Save Details & Scenarios rules
- Deterministic calculation vs AI boundary
- The nine approved Finance V1 calculators and their entitlement matrices

### What this document does not govern

- Technical architecture, schemas, APIs, providers, or calculation methodology
- Application code, routes, UI components, entitlements implementation, or billing
- Existing Immigration calculators documented in [CALCULATORS.md](./CALCULATORS.md)
- Generated screenshot dollar values, dates, decorative copy, or incidental UI text

### Source-of-truth clarification

Where older IMMIFIN documentation conflicts with this Finance document regarding the Finance V1 calculator catalog, tier behavior, or Finance UX, `FINANCE_PRODUCT_DESIGN.md` represents the currently approved Finance product design. Broader platform conflicts identified in [§29](#29-relationship-to-existing-documentation) remain unresolved until separately approved.

---

## 2. Finance Product Vision

IMMIFIN’s long-term product framing for this Finance design phase is:

```text
Immigration → Finance → Life
```

The Finance pillar should help users **understand their financial position** and **make practical household financial decisions** using **transparent deterministic calculations**.

Finance should feel like **one connected IMMIFIN product**, not a collection of unrelated calculators.

### Mission for Finance

Give households a clear, trustworthy answer to everyday money questions — take-home pay, taxes, housing, cost of living, savings goals, and net worth — with the same IMMIFIN workspace language already established for My IMMIFIN.

### Out of scope for this V1 catalog

The approved V1 Finance catalog does **not** include investment planning, retirement portfolio optimization, stock selection, asset allocation, investment recommendations, or debt-payoff strategy as standalone products. Individual calculator boundaries in §§16–24 further restrict those topics where relevant.

Longer-term vision language elsewhere in the repository is **not** silently replaced by this document. See [§29](#29-relationship-to-existing-documentation).

---

## 3. Product Principles

| Principle | Meaning |
|-----------|---------|
| **One connected product** | Finance tools share one workspace, one visual language, and one entitlement progression |
| **Useful Public answers** | SEO Public calculators provide genuinely useful standalone results. Public results must **not** be intentionally crippled or blurred merely to force registration |
| **Transparent math** | Users see deterministic estimates they can inspect. Assumptions that materially change outcomes must be visible where the calculator is assumption-sensitive |
| **Same math, more depth** | Power does **not** receive “better math.” Pro and Power use the **same** deterministic calculation engines |
| **AI explains; engines calculate** | AI must not replace the deterministic financial calculation engine |
| **Locked previews sell value** | Higher-tier capabilities stay visible as locked previews. Locked capabilities are selling points, not obstacles |
| **Do not hide the current tier** | Locked previews must never interfere with functionality promised by the current tier |
| **Calculators are not dead ends** | Future design should consider contextual next actions into another relevant Finance tool. Workflow design and implementation are **not** part of this task |
| **Do not invent undecided items** | Ambiguous items are **TBD / NOT YET DECIDED**. This document does not infer product requirements |

---

## 4. Finance Information Architecture

Finance uses the same / similar workspace interaction pattern as **My IMMIFIN**.

When Finance is selected from global navigation:

1. Open the Finance workspace
2. Maintain a **persistent Finance left sidebar**
3. Change the main / right workspace based on the selected Finance tool

**Default selection:** Finance → **Overview**

### Approved sidebar structure

```text
FINANCE
Your financial tools and insights

Overview

Income & Taxes
   Take-Home Pay & Savings
   State & Local Tax
   Salary & Location Comparison

Home
   Home Affordability
   Mortgage
   Rent vs. Buy

Living
   Cost of Living Comparison

Goals & Wealth
   Savings Goal
   Net Worth Tracker

Help & Support
```

### Established conventions to reuse

Reuse established My IMMIFIN conventions where appropriate:

- Sidebar dimensions
- Typography
- Selected state
- Submenu behavior
- Spacing
- Responsive / mobile behavior
- Content width
- Header treatment
- Breadcrumbs where appropriate

Exact measurements, tokens, and responsive breakpoints are **NOT YET DECIDED** for Finance implementation. They should follow the existing My IMMIFIN / Design System 2.0 workspace patterns rather than invent a new shell.

Routes, URL slugs, and deep-link schemes for Finance tools are **NOT YET DECIDED**.

---

## 5. Finance Overview

**Status:** Locked design decisions below are approved. Additional illustrated content is **not** automatically locked.

**Approved visual reference:** [`public/images/FINANCE_OVERVIEW_APPROVED_REFERENCE.png`](../public/images/FINANCE_OVERVIEW_APPROVED_REFERENCE.png)

### Locked hero

The Finance Overview includes a Finance-specific hero using a **bull / bear financial-market visual direction**.

Approved conceptual messaging:

| Element | Approved copy |
|---------|----------------|
| **Eyebrow** | FINANCE |
| **Heading** | Make Smarter Financial Decisions |
| **Subheading** | Real numbers. Clear insights. A stronger future. |

### Explicitly rejected

The Finance Overview must **NOT** repeat the four Finance navigation categories as large cards.

The previously considered **“Start with a financial question”** section containing:

- Improve My Finances
- Buy or Rent a Home?
- Compare Locations
- Plan for the Future

was **explicitly REJECTED** because it duplicates the persistent Finance sidebar.

After the hero, **useful / actionable content** should appear rather than duplicate navigation.

### Approved post-hero concepts

The approved visual reference currently demonstrates:

- **Popular Tools**
- **Recent Calculations**

These two concepts are approved as Overview content direction.

### Not automatically locked

Any additional sections visible in the simulation that have **not** been explicitly approved are **not** locked requirements.

In particular, do **not** treat the following as canonical unless a later approved specification says so:

- Generated decorative ticker / market-quote chrome
- Generated CTA labels and body copy inside the hero
- “Your Financial Journey” or any numbered journey strip
- Generated tool descriptions, dates, dollar amounts, or location examples
- Generated-image spelling, layout artifacts, or incidental chrome copy

---

## 6. Finance Tier Philosophy

| Layer | Role |
|-------|------|
| **SEO Public** | Useful standalone answer and acquisition / search experience |
| **Free** | Personalized / basic financial calculation |
| **Pro** | Detailed household modeling, richer inputs, saved details, saved scenarios, and scenario comparisons |
| **Power** | Everything in Pro plus AI explanation, reasoning, and what-if analysis |

### SEO Public is not a subscription plan

SEO Public is the public acquisition / search layer.

- Public calculators must provide **genuinely useful results**
- Public results must **NOT** be intentionally crippled or blurred merely to force registration
- Higher-tier experiences may be shown as **blurred / desaturated visual previews** to demonstrate additional value

SEO Public is **not** a fourth paid plan and is **not** added to the Free / Pro / Power subscription catalog by this document. Final billing / entitlement implementation remains **NOT YET DECIDED**. See [§27](#27-explicitly-deferred--not-yet-decided).

### Critical Power rule

**Power does NOT receive “better math.”**

Pro and Power use the **same deterministic calculation engines**. Power adds AI reasoning, explanation, orchestration, and what-if interaction **on top of** deterministic results.

---

## 7. Common Calculator Design Standard

All Finance calculators should share a recognizable page architecture and visual language.

- The **calculator** itself changes
- The **IMMIFIN Finance experience** should remain consistent
- The Finance sidebar remains **persistent**
- The page is **entitlement-aware**

### Typical structure

```text
Calculator title + short explanation
  → Inputs
  → Primary Result
  → Detailed Breakdown
  → Relevant Actions / Next Step
```

Exact component composition, field grouping, and responsive layout are **NOT YET DECIDED** beyond the visual-direction references in [§26](#26-approved-visual-references) and the entitlement matrices in §§16–24.

---

## 8. Locked Capability / Upgrade UX Standard

Higher-tier functionality should **NOT** simply disappear.

Strategically selected higher-tier capabilities should be visible in a **LOCKED PREVIEW** state.

Locked capability previews are part of IMMIFIN’s **in-product marketing strategy**.

### Rule

**Locked capabilities are SELLING POINTS, not obstacles.**

### Locked previews must

- Demonstrate tangible customer value
- Explain what becomes possible
- Clearly identify the applicable higher tier
- Never interfere with the functionality promised by the current tier
- Avoid excessive individual padlocks and visual clutter

### Additional rules

- Prefer locking logical capability **GROUPS** rather than displaying dozens of individually locked fields
- Do not overwhelm Public users with every Pro and Power capability simultaneously
- Show the **next meaningful value progression**

Final upgrade CTA mechanics and final billing / entitlement implementation are **NOT YET DECIDED**.

---

## 9. Public Calculator UX Standard

Public calculator experience should be visually simpler and more restrained than authenticated experiences.

Use:

- Neutral / black-and-white presentation
- Restrained IMMIFIN blue where appropriate
- Functional calculator inputs
- Sharp, readable public result

### Critical rule

**The user’s Public calculation / result itself must NEVER be blurred.**

After the useful Public result, IMMIFIN may show:

- Blurred / desaturated **Free** experience preview
- Clear explanation of what creating a Free account unlocks
- Free account CTA
- Smaller **Pro** preview where appropriate

The approved Public Take-Home visual demonstrates this approach. See [§26](#26-approved-visual-references).

---

## 10. Free Calculator UX Standard

Free receives:

- Personalized / basic calculation
- Complete Free result
- Additional inputs appropriate to Free
- Strategically visible locked **Pro** capabilities

The Pro preview should explain **VALUE** rather than merely say “Upgrade.”

---

## 11. Pro Calculator UX Standard

Pro receives:

- Full deterministic calculator modeling
- Detailed household / location inputs where relevant
- Detailed financial inputs
- User-adjustable assumptions where relevant
- **Save Details**
- **Save Scenario**
- **Compare Scenarios** where applicable
- Strategically visible **Power AI** preview

---

## 12. Power Calculator UX Standard

Power inherits the **complete Pro calculator**.

Power adds **active IMMIFIN AI interaction**.

Examples:

- Explain results
- Answer questions about deterministic results
- Reason across saved scenarios
- Run what-if questions
- Explain trade-offs

AI must be grounded in the deterministic results produced by IMMIFIN.

AI technical architecture for Finance is **NOT YET DECIDED**.

---

## 13. Save Details & Scenario Standard

This is a **platform-wide Finance save rule**.

| Tier | Save behavior |
|------|----------------|
| **Free** | Personalized / basic calculations and basic tracking where appropriate |
| **Pro** | Save Details & Scenarios across Finance calculators |
| **Power** | Same saving capability as Pro, plus AI can reason across saved scenarios / data |

### Customer-facing concepts

| Tier | Concept |
|------|---------|
| **Pro** | “Save, revisit and compare your financial scenarios.” |
| **Power** | “Ask IMMIFIN AI to reason across your saved financial scenarios.” |

Persistence schema and scenario storage schema are **NOT YET DECIDED**.

Calculator-specific save behavior that is already approved appears in the entitlement matrices in §§16–24 (for example, Free may save and track a savings goal or a net-worth snapshot). Where a calculator matrix is more specific than this section, **the calculator matrix controls**.

---

## 14. AI / Deterministic Calculation Boundary

| Rule | Meaning |
|------|---------|
| **Deterministic engines calculate** | Financial results come from IMMIFIN calculation engines |
| **AI explains and reasons** | Power AI explains results, answers questions, compares saved scenarios, and runs what-if interaction |
| **No better math for Power** | Pro and Power share the same engines |
| **AI does not replace the engine** | AI must be grounded in deterministic results produced by IMMIFIN |
| **AI is Power-only in V1** | AI explanation and AI what-if / analysis capabilities are **No** for SEO Public, Free, and Pro in every approved calculator matrix |

Exact tax, cost-of-living, and default-assumption methodologies are **NOT YET DECIDED**. Those gaps do **not** authorize AI to invent or substitute calculation results.

---

## 15. Finance Calculator Catalog

The approved Finance V1 calculator catalog contains **exactly nine** tools:

| # | Tool | Sidebar group |
|---|------|----------------|
| 1 | Take-Home Pay & Savings Calculator | Income & Taxes |
| 2 | State & Local Tax Calculator | Income & Taxes |
| 3 | Salary & Location Comparison | Income & Taxes |
| 4 | Home Affordability Calculator | Home |
| 5 | Mortgage Calculator | Home |
| 6 | Rent vs. Buy Calculator | Home |
| 7 | Cost of Living Comparison | Living |
| 8 | Savings Goal Calculator | Goals & Wealth |
| 9 | Net Worth Tracker | Goals & Wealth |

No additional Finance V1 calculator is approved by this document.

### Product distinctions (approved)

| Calculator | Question it answers |
|------------|---------------------|
| **#1 Money left** | What do I take home / save? |
| **#2 Tax** | What taxes apply where I live? |
| **#3 Move / job decision** | Does this salary in this location improve my financial position? |
| **#4 Affordability** | How much house can I afford? |
| **#5 Mortgage mechanics** | What will this particular mortgage / home cost me? |
| **#6 Rent-vs-buy decision** | For this location and stay length, am I better off renting or buying? |
| **#7 Cost** | What does it cost to maintain my household / lifestyle in this location? |
| **#8 Goal** | How much do I need to save each month to reach this goal by this date? |
| **#9 Net worth** | What is my household worth today, and is the position improving? |

---

## 16. Calculator #1 — Take-Home Pay & Savings

### Core question

> Out of what I earn, how much do I actually take home—and how much could my household realistically save?

### Boundary

```text
Income → Taxes → Expenses → Savings
```

Do **NOT** turn this calculator into:

- Investment planning
- Retirement planning
- Debt payoff
- Net-worth tracking

### Approved entitlement matrix

| Capability | SEO Public | Free | Pro | Power |
|---|---|---|---|---|
| Annual gross income | Yes | Yes | Yes | Yes |
| State | Yes | Yes | Yes | Yes |
| Filing status | Yes | Yes | Yes | Yes |
| Federal income tax estimate | Yes | Yes | Yes | Yes |
| State income tax estimate | Yes | Yes | Yes | Yes |
| Payroll taxes | Yes | Yes | Yes | Yes |
| Annual/monthly net income | Yes | Yes | Yes | Yes |
| Housing cost | No | Yes | Yes | Yes |
| Basic living-cost estimate | No | Yes | Yes | Yes |
| Estimated annual/monthly savings | No | Yes | Yes | Yes |
| Savings rate | No | Yes | Yes | Yes |
| Adults / children | No | No | Yes | Yes |
| Rent vs. own | No | No | Yes | Yes |
| Location-specific household costs | No | No | Yes | Yes |
| Detailed housing costs | No | No | Yes | Yes |
| Detailed household expenses | No | No | Yes | Yes |
| User overrides for expense assumptions | No | No | Yes | Yes |
| Multiple scenarios | No | No | Yes | Yes |
| Side-by-side scenario comparison | No | No | Yes | Yes |
| AI explanation | No | No | No | Yes |
| AI what-if analysis | No | No | No | Yes |

### Approved visual references

| Tier | Path |
|------|------|
| **Public** | [`public/images/finance-take-home-pay-savings-public-approved-reference.png`](../public/images/finance-take-home-pay-savings-public-approved-reference.png) |
| **Free** | [`public/images/finance-take-home-pay-savings-free-approved-reference.png`](../public/images/finance-take-home-pay-savings-free-approved-reference.png) |
| **Pro** | [`public/images/finance-take-home-pay-savings-pro-approved-reference.png`](../public/images/finance-take-home-pay-savings-pro-approved-reference.png) |
| **Power** | [`public/images/finance-take-home-pay-savings-power-approved-reference.png`](../public/images/finance-take-home-pay-savings-power-approved-reference.png) |

These screenshots establish **visual direction and tier progression**. Generated example dollar values, generated decorative text, generated dates, and incidental UI copy inside screenshots are **NOT** authoritative business logic. **This entitlement matrix controls product behavior.**

Exact field labels, default values, tax methodology, and expense-assumption defaults are **NOT YET DECIDED**.

---

## 17. Calculator #2 — State & Local Tax

### Core question

> What taxes apply in this location, and what do those tax rates mean in real dollars?

### Important product decisions

- Do **NOT** ask the user to enter gross income
- Use standardized IMMIFIN reference benchmarks:

| Benchmark | Approved value | Terminology |
|-----------|----------------|-------------|
| Income-tax benchmark | $100,000 gross annual income | Standardized IMMIFIN reference income |
| Property-tax benchmark | $500,000 assessed / taxable home value | **IMMIFIN $500K Reference Home** |

Do **NOT** describe the $500,000 benchmark as “median home value.”

The property-tax benchmark represents **assessed / taxable value**, not purchase price.

Sales tax initially shows **percentage / rate**. No fixed spending benchmark has yet been approved.

### Two-location tax comparison (Pro / Power)

Calculator #2 supports a **TAX-ONLY** comparison between **exactly two** locations using the **same** standardized IMMIFIN benchmarks for both locations.

| Layer | Two-location tax comparison |
|-------|-----------------------------|
| **SEO Public** | No location comparison |
| **Free** | No location comparison |
| **Pro** | May compare **exactly two** locations at the tax level |
| **Power** | Same deterministic two-location tax comparison as Pro, plus IMMIFIN AI may explain and reason about the tax differences |

**Maximum comparison locations: TWO.** A third location must not be implemented.

The comparison must use the same approved benchmarks for both locations:

- $100,000 Reference Income
- IMMIFIN $500K Reference Home

This is strictly a **tax** comparison. It must **NOT** become a personalized salary / location financial comparison.

#### Tax comparison content

The two-location comparison may include:

- Federal income tax
- Payroll taxes
- State income tax
- Applicable county / local income tax
- Total estimated income + payroll taxes
- Estimated after-tax income

Sales tax:

- State sales-tax rate
- Applicable local sales-tax components
- Combined sales-tax rate

Property tax:

- Applicable property-tax rate / jurisdiction detail
- Estimated annual property tax on the IMMIFIN $500K Reference Home
- Estimated monthly property tax

Federal and payroll components should remain visible for completeness and benchmark consistency even where they are unchanged between the two locations.

#### Power AI

Power uses the **same deterministic tax comparison** as Pro.

Power AI may answer questions such as:

- Why are taxes different between these two locations?
- Which tax components create the largest difference?
- Why is property tax higher in one location?
- How do state and local taxes contribute to the difference?
- Explain the tax structure of each location.

AI does **NOT** independently calculate authoritative tax values. It reasons over the deterministic IMMIFIN tax results.

#### Visual-reference artifact

If an approved Pro visual reference visually shows more than two locations, that is an **image-generation artifact**.

- The **product requirement** controls implementation
- Calculator #2 supports a **maximum of TWO** comparison locations
- Any third location appearing in a generated reference image is **non-authoritative** and must not be implemented

Do not modify the PNG.

### Important tax-engine note

For progressive income-tax systems, do **NOT** assume:

```text
tax rate × $100,000 = actual tax
```

Rate / range and standardized benchmark tax estimate must be **conceptually separate**.

Exact tax calculation methodology is **NOT YET DECIDED**.

### Approved entitlement matrix

| Capability | SEO Public | Free | Pro | Power |
|---|---|---|---|---|
| Select state | Yes | Yes | Yes | Yes |
| State income-tax structure | Yes | Yes | Yes | Yes |
| State income-tax rate / range | Yes | Yes | Yes | Yes |
| Estimated state income tax on $100K reference income | Yes | Yes | Yes | Yes |
| State sales-tax rate | Yes | Yes | Yes | Yes |
| Basic state tax summary | Yes | Yes | Yes | Yes |
| County selection | No | Yes | Yes | Yes |
| County/local income-tax rate where applicable | No | Yes | Yes | Yes |
| Estimated county/local income tax on $100K reference income | No | Yes | Yes | Yes |
| County/local sales-tax component | No | Yes | Yes | Yes |
| County property-tax rate | No | Yes | Yes | Yes |
| Estimated property tax on $500K reference home | No | Yes | Yes | Yes |
| Monthly equivalent of reference property tax | No | Yes | Yes | Yes |
| City / ZIP-level location | No | No | Yes | Yes |
| Combined state + local sales-tax rate | No | No | Yes | Yes |
| Detailed property-tax jurisdiction/rate | No | No | Yes | Yes |
| Property-tax exemptions / special rules | No | No | Yes | Yes |
| More precise local tax information | No | No | Yes | Yes |
| Historical tax-rate information | No | No | Yes | Yes |
| Save locations / tax lookup | No | No | Yes | Yes |
| Two-location tax comparison | No | No | Yes | Yes |
| Compare $100K Reference Income tax burden | No | No | Yes | Yes |
| Compare $500K Reference Home property tax | No | No | Yes | Yes |
| AI explanation of tax structure | No | No | No | Yes |
| AI tax questions | No | No | No | Yes |
| AI explanation of tax differences | No | No | No | Yes |

### Boundary

```text
#2 = "Compare taxes between exactly two locations using standardized IMMIFIN benchmarks."
#3 = "Compare two personalized salary/location financial scenarios."
```

Calculator #2 comparison is **TAX-ONLY**.

It must **NOT** compare:

- Different user salaries
- Personalized take-home scenarios
- Housing expenses
- Food costs
- Transportation costs
- Utilities
- Childcare
- Overall cost of living
- Household savings
- Savings rates
- General financial position

Those belong to Calculator #3 and/or Calculator #7.

Do not include in Calculator #2 (single-location or comparison):

- Actual personalized salary
- Personalized take-home
- Living expenses
- Savings

---

## 18. Calculator #3 — Salary & Location Comparison

### Core question

> If I earn Salary A in Location A versus Salary B in Location B, which scenario leaves my household with more money?

This is a **personalized relocation / job-decision tool**.

### Conceptual flow

```text
Salary + Location
  → tax engine
  → take-home
  → location-cost engine
  → household costs
  → savings engine
  → disposable income / savings
```

This flow is a **product concept**. Reuse of Calculator #7 as a Location Cost Engine is an architectural possibility, **not** an approved implementation decision.

### Approved entitlement matrix

| Capability | SEO Public | Free | Pro | Power |
|---|---|---|---|---|
| Salary A | Yes | Yes | Yes | Yes |
| Location A — State | Yes | Yes | Yes | Yes |
| Salary B | Yes | Yes | Yes | Yes |
| Location B — State | Yes | Yes | Yes | Yes |
| Gross salary difference | Yes | Yes | Yes | Yes |
| Salary % increase/decrease | Yes | Yes | Yes | Yes |
| Basic state cost-of-living adjustment | Yes | Yes | Yes | Yes |
| Cost-of-living-adjusted salary comparison | Yes | Yes | Yes | Yes |
| Basic equivalent salary | Yes | Yes | Yes | Yes |
| Filing status | No | Yes | Yes | Yes |
| Federal income tax | No | Yes | Yes | Yes |
| State income tax | No | Yes | Yes | Yes |
| Payroll taxes | No | Yes | Yes | Yes |
| Estimated take-home in both locations | No | Yes | Yes | Yes |
| After-tax income difference | No | Yes | Yes | Yes |
| Basic estimated living costs | No | Yes | Yes | Yes |
| Estimated disposable income | No | Yes | Yes | Yes |
| Adults / children | No | No | Yes | Yes |
| County / city / ZIP location | No | No | Yes | Yes |
| County/local income taxes | No | No | Yes | Yes |
| Rent vs. own | No | No | Yes | Yes |
| Actual rent / mortgage | No | No | Yes | Yes |
| Actual/estimated home value | No | No | Yes | Yes |
| Property-tax estimate | No | No | Yes | Yes |
| Detailed housing costs | No | No | Yes | Yes |
| Location-specific food costs | No | No | Yes | Yes |
| Location-specific transportation costs | No | No | Yes | Yes |
| Location-specific utilities | No | No | Yes | Yes |
| Childcare where applicable | No | No | Yes | Yes |
| User overrides for assumptions | No | No | Yes | Yes |
| Estimated annual/monthly savings | No | No | Yes | Yes |
| Savings-rate comparison | No | No | Yes | Yes |
| Side-by-side detailed comparison | No | No | Yes | Yes |
| AI explanation | No | No | No | Yes |
| AI break-even salary | No | No | No | Yes |
| AI what-if analysis | No | No | No | Yes |

### Product distinctions

| Calculator | Role |
|------------|------|
| **#1 Money left** | What do I take home / save? |
| **#2 Tax** | What taxes apply where I live? |
| **#3 Move / job decision** | Does this salary in this location improve my financial position? |
| **#7 Cost** | What does it cost to maintain my household / lifestyle in this location? |

---

## 19. Calculator #4 — Home Affordability

### Core question

> Based on my income, debts, down payment, and location, how much home can I realistically afford?

### Approved entitlement matrix

| Capability | SEO Public | Free | Pro | Power |
|---|---|---|---|---|
| Annual household income | Yes | Yes | Yes | Yes |
| Down payment | Yes | Yes | Yes | Yes |
| Mortgage interest rate | Yes | Yes | Yes | Yes |
| Loan term | Yes | Yes | Yes | Yes |
| Basic estimated affordable home price | Yes | Yes | Yes | Yes |
| Estimated loan amount | Yes | Yes | Yes | Yes |
| Estimated monthly principal & interest | Yes | Yes | Yes | Yes |
| Monthly debt payments | No | Yes | Yes | Yes |
| DTI calculation | No | Yes | Yes | Yes |
| Basic property-tax estimate | No | Yes | Yes | Yes |
| Basic homeowners-insurance estimate | No | Yes | Yes | Yes |
| PMI when applicable | No | Yes | Yes | Yes |
| Estimated total monthly housing payment | No | Yes | Yes | Yes |
| State / location | No | No | Yes | Yes |
| County / ZIP | No | No | Yes | Yes |
| Location-specific property tax | No | No | Yes | Yes |
| Location-specific insurance assumptions | No | No | Yes | Yes |
| HOA | No | No | Yes | Yes |
| Detailed recurring debts | No | No | Yes | Yes |
| User overrides for assumptions | No | No | Yes | Yes |
| Multiple down-payment scenarios | No | No | Yes | Yes |
| Multiple interest-rate scenarios | No | No | Yes | Yes |
| Side-by-side affordability scenarios | No | No | Yes | Yes |
| Cash needed at purchase estimate | No | No | Yes | Yes |
| Closing-cost estimate | No | No | Yes | Yes |
| AI affordability explanation | No | No | No | Yes |
| AI what-if analysis | No | No | No | Yes |
| AI target-home analysis | No | No | No | Yes |

### Boundary

| Calculator | Role |
|------------|------|
| **#4** | How much house can I afford? |
| **#5** | What will this particular mortgage / home cost me? |

Default DTI thresholds, insurance assumptions, PMI rules, and closing-cost methodology are **NOT YET DECIDED**.

---

## 20. Calculator #5 — Mortgage Calculator

### Core question

> If I buy this home with this mortgage, what will I pay monthly, over time, and under different payoff scenarios?

### Approved entitlement matrix

| Capability | SEO Public | Free | Pro | Power |
|---|---|---|---|---|
| Home price | Yes | Yes | Yes | Yes |
| Down payment — $ or % | Yes | Yes | Yes | Yes |
| Loan amount | Yes | Yes | Yes | Yes |
| Interest rate | Yes | Yes | Yes | Yes |
| Loan term | Yes | Yes | Yes | Yes |
| Monthly principal & interest | Yes | Yes | Yes | Yes |
| Total interest over loan term | Yes | Yes | Yes | Yes |
| Total principal + interest | Yes | Yes | Yes | Yes |
| Property-tax estimate | No | Yes | Yes | Yes |
| Homeowners-insurance estimate | No | Yes | Yes | Yes |
| PMI when applicable | No | Yes | Yes | Yes |
| HOA | No | Yes | Yes | Yes |
| Estimated total monthly housing payment | No | Yes | Yes | Yes |
| Amortization schedule | No | Yes | Yes | Yes |
| Principal vs. interest breakdown | No | Yes | Yes | Yes |
| State / county / ZIP | No | No | Yes | Yes |
| Location-specific property tax | No | No | Yes | Yes |
| Location-specific insurance assumptions | No | No | Yes | Yes |
| User overrides for taxes/insurance | No | No | Yes | Yes |
| Extra monthly principal payment | No | No | Yes | Yes |
| One-time additional principal payment | No | No | Yes | Yes |
| New payoff date | No | No | Yes | Yes |
| Interest saved from extra payments | No | No | Yes | Yes |
| Compare interest rates | No | No | Yes | Yes |
| Compare loan terms | No | No | Yes | Yes |
| Compare down payments | No | No | Yes | Yes |
| Side-by-side mortgage scenarios | No | No | Yes | Yes |
| AI mortgage explanation | No | No | No | Yes |
| AI what-if analysis | No | No | No | Yes |
| AI payoff strategy analysis | No | No | No | Yes |

### Boundary

| Calculator | Role |
|------------|------|
| **#4** | Affordability |
| **#5** | Mortgage mechanics |
| **#6** | Rent-vs-buy decision |

---

## 21. Calculator #6 — Rent vs. Buy

### Core question

> For this location and the number of years I expect to stay, am I financially better off renting or buying?

### Approved entitlement matrix

| Capability | SEO Public | Free | Pro | Power |
|---|---|---|---|---|
| Monthly rent | Yes | Yes | Yes | Yes |
| Home purchase price | Yes | Yes | Yes | Yes |
| Down payment | Yes | Yes | Yes | Yes |
| Mortgage interest rate | Yes | Yes | Yes | Yes |
| Loan term | Yes | Yes | Yes | Yes |
| Expected years in home | Yes | Yes | Yes | Yes |
| Basic rent vs. mortgage comparison | Yes | Yes | Yes | Yes |
| Rent paid over selected period | Yes | Yes | Yes | Yes |
| Mortgage payments over selected period | Yes | Yes | Yes | Yes |
| Estimated home equity | No | Yes | Yes | Yes |
| Property tax | No | Yes | Yes | Yes |
| Homeowners insurance | No | Yes | Yes | Yes |
| PMI where applicable | No | Yes | Yes | Yes |
| HOA | No | Yes | Yes | Yes |
| Maintenance estimate | No | Yes | Yes | Yes |
| Renters insurance | No | Yes | Yes | Yes |
| Annual rent increase assumption | No | Yes | Yes | Yes |
| Home appreciation assumption | No | Yes | Yes | Yes |
| Buying closing costs | No | No | Yes | Yes |
| Selling costs | No | No | Yes | Yes |
| State / county / ZIP | No | No | Yes | Yes |
| Location-specific property tax | No | No | Yes | Yes |
| Location-specific insurance assumptions | No | No | Yes | Yes |
| User overrides for assumptions | No | No | Yes | Yes |
| Opportunity cost of down payment | No | No | Yes | Yes |
| Opportunity cost of monthly cash-flow difference | No | No | Yes | Yes |
| Mortgage principal/interest over holding period | No | No | Yes | Yes |
| Net proceeds from sale | No | No | Yes | Yes |
| Net financial position — Rent | No | No | Yes | Yes |
| Net financial position — Buy | No | No | Yes | Yes |
| Break-even year | No | No | Yes | Yes |
| Multiple scenarios | No | No | Yes | Yes |
| Side-by-side scenario comparison | No | No | Yes | Yes |
| AI explanation | No | No | No | Yes |
| AI what-if analysis | No | No | No | Yes |
| AI break-even analysis | No | No | No | Yes |

**Assumption transparency is important** because Rent vs. Buy is highly assumption-sensitive.

Exact default assumptions (rent increase, appreciation, maintenance, opportunity-cost rate, selling costs) are **NOT YET DECIDED**.

---

## 22. Calculator #7 — Cost of Living Comparison

### Core question

> How much would it cost my household to maintain a similar lifestyle in Location A versus Location B?

**Salary is deliberately excluded.**

### Approved entitlement matrix

| Capability | SEO Public | Free | Pro | Power |
|---|---|---|---|---|
| Location A — state/city | Yes | Yes | Yes | Yes |
| Location B — state/city | Yes | Yes | Yes | Yes |
| Overall cost-of-living difference | Yes | Yes | Yes | Yes |
| Housing cost difference | Yes | Yes | Yes | Yes |
| Food/grocery difference | Yes | Yes | Yes | Yes |
| Transportation difference | Yes | Yes | Yes | Yes |
| Utilities difference | Yes | Yes | Yes | Yes |
| Basic monthly cost estimate | Yes | Yes | Yes | Yes |
| Basic annual cost estimate | Yes | Yes | Yes | Yes |
| Adults | No | Yes | Yes | Yes |
| Children | No | Yes | Yes | Yes |
| Rent vs. own | No | Yes | Yes | Yes |
| Basic childcare estimate | No | Yes | Yes | Yes |
| Household-size-adjusted costs | No | Yes | Yes | Yes |
| County / ZIP-level location | No | No | Yes | Yes |
| Actual rent / mortgage override | No | No | Yes | Yes |
| Detailed housing costs | No | No | Yes | Yes |
| Detailed food costs | No | No | Yes | Yes |
| Detailed transportation costs | No | No | Yes | Yes |
| Detailed utility costs | No | No | Yes | Yes |
| Detailed childcare costs | No | No | Yes | Yes |
| Healthcare cost assumptions | No | No | Yes | Yes |
| Other recurring household costs | No | No | Yes | Yes |
| User overrides by expense category | No | No | Yes | Yes |
| Multiple location scenarios | No | No | Yes | Yes |
| Side-by-side detailed comparison | No | No | Yes | Yes |
| AI explanation | No | No | No | Yes |
| AI what-if analysis | No | No | No | Yes |

### Architectural note (not an implementation decision)

Calculator #7 may later serve as a reusable **Location Cost Engine** for Calculator #3.

That is an **architectural possibility**, **NOT** an approved implementation decision.

Exact cost-of-living methodology and data providers are **NOT YET DECIDED**.

---

## 23. Calculator #8 — Savings Goal Calculator

### Core question

> How much do I need to save each month to reach my financial goal by my target date?

Example goal types may include:

- Emergency fund
- House down payment
- Car
- Education
- Vacation
- Immigration / legal expenses
- Custom goal

This is an **example list**, not a locked taxonomy. Final goal-type catalog is **NOT YET DECIDED**.

### Approved entitlement matrix

| Capability | SEO Public | Free | Pro | Power |
|---|---|---|---|---|
| Savings goal amount | Yes | Yes | Yes | Yes |
| Current savings toward goal | Yes | Yes | Yes | Yes |
| Target date / timeframe | Yes | Yes | Yes | Yes |
| Required monthly savings | Yes | Yes | Yes | Yes |
| Required annual savings | Yes | Yes | Yes | Yes |
| Progress toward goal | Yes | Yes | Yes | Yes |
| Expected goal completion date | Yes | Yes | Yes | Yes |
| Enter current monthly contribution | No | Yes | Yes | Yes |
| Projected balance at target date | No | Yes | Yes | Yes |
| Savings shortfall / surplus | No | Yes | Yes | Yes |
| Save and track goal | No | Yes | Yes | Yes |
| Multiple savings goals | No | No | Yes | Yes |
| Prioritize goals | No | No | Yes | Yes |
| Expected interest / return assumption | No | No | Yes | Yes |
| Recurring contribution changes | No | No | Yes | Yes |
| One-time contributions | No | No | Yes | Yes |
| Inflation-adjusted future goal | No | No | Yes | Yes |
| Goal scenario comparison | No | No | Yes | Yes |
| Combined monthly funding requirement | No | No | Yes | Yes |
| AI explanation | No | No | No | Yes |
| AI what-if analysis | No | No | No | Yes |
| AI goal-allocation analysis | No | No | No | Yes |

### Boundary

```text
Goal → Current Amount → Time → Contributions → Progress
```

Do **NOT** turn this into:

- Retirement portfolio optimization
- Stock selection
- Asset allocation
- Investment recommendations
- Debt-payoff strategy

---

## 24. Calculator #9 — Net Worth Tracker

### Core question

> What is my household worth today, and is my financial position improving over time?

### Base asset categories

- Cash / checking / savings
- Home / real-estate value
- Investments
- Retirement
- Other assets

### Base liability categories

- Mortgage
- Auto loans
- Student loans
- Credit cards
- Other liabilities

Whether these category labels are exhaustive, editable, or further subdivided is **NOT YET DECIDED**.

### Core outputs

- Total assets
- Total liabilities
- Net worth

### Approved entitlement / save behavior

| Capability | SEO Public | Free | Pro | Power |
|---|---|---|---|---|
| Calculate current net worth | Yes | Yes | Yes | Yes |
| Save net-worth snapshot | No | Yes | Yes | Yes |
| Update snapshot over time | No | Yes | Yes | Yes |
| Basic net-worth history | No | Yes | Yes | Yes |
| Save detailed asset figures | No | No | Yes | Yes |
| Save detailed liability figures | No | No | Yes | Yes |
| Reuse previously saved figures | No | No | Yes | Yes |
| Edit individual saved balances | No | No | Yes | Yes |
| Multiple properties | No | No | Yes | Yes |
| Multiple investment/retirement accounts | No | No | Yes | Yes |
| Home equity tracking | No | No | Yes | Yes |
| Debt reduction tracking | No | No | Yes | Yes |
| Detailed historical trends | No | No | Yes | Yes |
| AI analysis of saved financial history | No | No | No | Yes |

### V1 direction

**Manual entry.**

Connected bank / brokerage / financial-account integrations are **NOT** part of the currently approved V1 definition.

---

## 25. Cross-Calculator Journey Principle

Finance calculators should not become dead ends.

Example connected user journey:

```text
Salary & Location
  → Cost of Living
  → Home Affordability
  → Mortgage
  → Savings Goal
```

Future design should consider **contextual next actions** that allow users to continue naturally into another relevant Finance tool.

**This task documents the principle only.** Do **not** treat the example journey as a locked workflow. Calculator-to-calculator orchestration is **NOT YET DECIDED**. Design and implementation of that workflow are **out of scope** for FIN-DESIGN-001.

---

## 26. Approved Visual References

These PNG files are **approved visual references**. Do not redesign, reinterpret, modify, or replace them. They are visual sources of truth for future implementation.

Generated example dollar values, generated decorative text, generated dates, and incidental UI copy inside the screenshots are **NOT** authoritative business logic. Where screenshot chrome conflicts with this specification, **this specification controls**.

### Canonical repository paths

The files exist under `public/images/` (plural). FIN-DESIGN-001’s reading list used `public/image/` (singular) and a different overview filename. The inspected, on-disk approved references are:

| # | Role | Exact path |
|---|------|------------|
| 1 | Finance Overview | `public/images/FINANCE_OVERVIEW_APPROVED_REFERENCE.png` |
| 2 | Take-Home Pay & Savings — Public | `public/images/finance-take-home-pay-savings-public-approved-reference.png` |
| 3 | Take-Home Pay & Savings — Free | `public/images/finance-take-home-pay-savings-free-approved-reference.png` |
| 4 | Take-Home Pay & Savings — Pro | `public/images/finance-take-home-pay-savings-pro-approved-reference.png` |
| 5 | Take-Home Pay & Savings — Power | `public/images/finance-take-home-pay-savings-power-approved-reference.png` |

### What the Take-Home references establish

| Reference | Visual direction established |
|-----------|------------------------------|
| **Public** | Restrained public calculator; sharp unblurred Public result; blurred / desaturated Free preview after the result; smaller Pro preview |
| **Free** | Personalized / basic inputs and complete Free result; grouped locked Pro capabilities; smaller Power preview |
| **Pro** | Full household / location modeling; Save Details / Save Scenario / Compare Scenarios; locked Power AI preview |
| **Power** | Complete Pro calculator plus active IMMIFIN AI interaction grounded in the same deterministic results |

No approved visual references yet exist for Calculators #2–#9. Those tools follow the common calculator design standard and the Public / Free / Pro / Power UX standards in this document until later visuals are explicitly approved.

---

## 27. Explicitly Deferred / Not Yet Decided

The following are **NOT approved yet**. This document does **not** invent answers for them.

| Area | Status |
|------|--------|
| Finance technical architecture | NOT YET DECIDED |
| Database schema | NOT YET DECIDED |
| Calculation-engine architecture | NOT YET DECIDED |
| Tax-data providers | NOT YET DECIDED |
| Cost-of-living data providers | NOT YET DECIDED |
| Property-tax data providers | NOT YET DECIDED |
| Mortgage-rate data providers | NOT YET DECIDED |
| Insurance data providers | NOT YET DECIDED |
| External financial account connections | NOT part of approved V1; otherwise NOT YET DECIDED |
| AI technical architecture for Finance | NOT YET DECIDED |
| Persistence schema | NOT YET DECIDED |
| Scenario storage schema | NOT YET DECIDED |
| Detailed responsive implementation | NOT YET DECIDED |
| Final upgrade CTA mechanics | NOT YET DECIDED |
| Final billing / entitlement implementation | NOT YET DECIDED |
| Exact tax calculation methodology | NOT YET DECIDED |
| Exact cost-of-living methodology | NOT YET DECIDED |
| Exact default assumptions | NOT YET DECIDED |
| Final calculator-to-calculator orchestration | NOT YET DECIDED |
| Finance routes / URL slugs | NOT YET DECIDED |
| Any generated screenshot text / value not explicitly approved in this specification | NOT AUTHORITATIVE |

---

## 28. Implementation Status

| Item | Status |
|------|--------|
| Product / UX definition (this document) | **Created — awaiting Product Owner approval** |
| Architecture | NOT STARTED / NOT APPROVED |
| Database / API / engines | NOT STARTED / NOT APPROVED |
| Application code | **Unchanged by FIN-DESIGN-001** |
| Existing documentation other than this file | **Unchanged by FIN-DESIGN-001** |
| Commit / push / deploy | **Not performed** |

Finance remains in **PRODUCT / UX DEFINITION**. Do not begin Finance architecture or implementation from this document until a later task explicitly authorizes it.

---

## 29. Relationship to Existing Documentation

This file is the canonical **Finance product/design** source of truth for approved V1 Finance behavior. It does **not** silently overwrite other canonical documents. Differences discovered during FIN-DESIGN-001 are recorded here for Product Owner review.

### Compatible / complementary

| Existing document | Relationship |
|-------------------|--------------|
| [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) | Records Finance Dashboard as **not created** and Finance platform build-out as deferred. Compatible with “implementation NOT STARTED.” This task does not update that file. |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Platform tiers remain Free / Pro / Power. SEO Public is documented here as an acquisition layer, not a new subscription plan. |
| [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) / [PRODUCT_VISION.md](./PRODUCT_VISION.md) | “Paid tiers charge for time saved… never for reduced accuracy of free tools” aligns with useful Public results and “Power does not receive better math.” |
| [PUBLIC_VISITOR_ACCESS_ARCHITECTURE.md](./PUBLIC_VISITOR_ACCESS_ARCHITECTURE.md) | Distinguishes discovery vs use; notes calculators remain anonymously usable as an SEO constraint; Visa Bulletin already has useful public search pages plus a login-required dashboard. Finance SEO Public useful results follow that acquisition pattern for Finance calculators. |
| [CALCULATORS.md](./CALCULATORS.md) | Remains the catalog of **live Immigration** calculators. |

### Differences that were not overwritten

These are **not** resolved by this task. They are reported, not silently reconciled.

| Topic | Existing documentation | This Finance specification |
|-------|------------------------|----------------------------|
| **Long-term pillar naming** | [PRODUCT_VISION.md](./PRODUCT_VISION.md) names pillars **Immigration, Finance, and Insurance**, with “Life Operating System” as the overall metaphor | FIN-DESIGN-001 frames long-term pillars as **Immigration → Finance → Life** |
| **Finance scope** | [PRODUCT_VISION.md](./PRODUCT_VISION.md) and [VISION.md](./VISION.md) mention investments, retirement, insurance, tax residency, banking, and credit building as Finance / future-platform themes | Approved Finance **V1** catalog is exactly the nine tools in §15, with explicit exclusions on several calculators |
| **Unbuilt calculator placeholders** | [CALCULATORS.md](./CALCULATORS.md) lists Tax Residency, Mortgage Affordability, Credit Score Builder, 401(k), FICA Exemption, Health Insurance Premium, and Renters Insurance as catalog entries not yet built | Those names are **not** the approved Finance V1 catalog. This document does not edit `CALCULATORS.md` |
| **Premium Feature Discovery** | [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) §15 describes full-page blurred Pro preview and “no reduced Free version” after dismiss; future rollout list includes Finance | Finance calculators use a **tiered in-page** model: a useful current-tier result plus grouped locked previews of the **next** tier. That is the approved Finance calculator upgrade UX in §§8–12. Platform PFD for full-page Immigration premium surfaces is not rewritten here |
| **Visitor-access slogan** | [PUBLIC_VISITOR_ACCESS_ARCHITECTURE.md](./PUBLIC_VISITOR_ACCESS_ARCHITECTURE.md) target: “Browse publicly. Use tools with a Free account.” | Finance SEO Public must still provide a genuinely useful standalone calculator result. How that is implemented against the platform visitor-access architecture is **NOT YET DECIDED** |

No existing canonical document was modified to force alignment.

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v0.1 | 2026-09-18 | FIN-DESIGN-001 | Initial canonical Finance product/UX design specification. Documentation only. Implementation not started. |
| v0.1 | 2026-09-18 | FIN-DESIGN-001A | Added source-of-truth clarification: this document is authoritative for approved Finance V1 catalog, tier, and UX decisions; §29 broader platform conflicts remain unresolved. |
| v0.1 | 2026-09-18 | FIN-DESIGN-002A | Calculator #2: Pro/Power may compare taxes between exactly two locations using standardized IMMIFIN benchmarks. Public/Free have no location comparison. |
