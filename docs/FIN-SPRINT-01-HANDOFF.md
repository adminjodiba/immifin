# IMMIFIN Finance Sprint 01 Handoff — Documentation Baseline

| Field | Value |
|---|---|
| **Sprint** | FIN-SPRINT-01 |
| **Baseline task** | FIN-01-002 — Finance Sprint Documentation Baseline & Workspace Preparation |
| **Status** | **DOCUMENTATION BASELINE CREATED — ARCHITECTURE AND IMPLEMENTATION NOT AUTHORIZED** |
| **Created** | 2026-10-19 |
| **Product authority** | [`FINANCE_PRODUCT_DESIGN.md`](./FINANCE_PRODUCT_DESIGN.md) |
| **Git baseline** | `e48ee1afb08a6b3c672f1e7fc52331a1fa6a80b9` — `docs(notifications): close delivery tracking recovery` |
| **Finance design baseline** | `e3f1b72eec5be96d1a27f2a6b720667c5e2916da` — `docs(finance): add approved Finance product design baseline` |
| **Working branch** | `finance/sprint-01-docs` |
| **Scope** | Documentation only. No calculator code, route, schema, API, entitlement, billing, PNG, or deployment change is authorized by this handoff. |

> **Purpose:** This handoff preserves the FIN-SPRINT-01 implementation-readiness baseline recovered in FIN-01-001 and records later Product Owner approval of the State & Local Tax visual references. It is a sprint governance document. It does not duplicate, supersede, or modify the canonical Finance product design.

---

## 1. Source of Truth and Authority Boundaries

### 1.1 Canonical Finance product authority

[`FINANCE_PRODUCT_DESIGN.md`](./FINANCE_PRODUCT_DESIGN.md) is the authority for approved Finance V1 product behavior, calculator catalog, Finance UX, Public / Free / Pro / Power progression, scenario principles, calculator entitlement matrices, and the deterministic-calculation versus AI boundary.

Finance V1 implementation must not rename, redesign, or add to the approved calculator catalog without explicit Product Owner approval.

### 1.2 This handoff does not authorize

- Finance technical architecture, calculation methodology, routes, APIs, database schema, or migrations.
- Finance capability implementation, billing changes, subscription pricing, or plan changes.
- External financial, tax, property-tax, cost-of-living, mortgage, or insurance provider selection.
- Finance calculator components, pages, tests, or production behavior.
- AI execution, new AI context, or public Intelligence enablement.
- PNG copying, moving, editing, tracking, committing, regeneration, or visual redesign.

### 1.3 Related platform authorities

| Authority | Role for future Finance work |
|---|---|
| [`SYSTEM_ARCHITECTURE.md`](./SYSTEM_ARCHITECTURE.md) | Technical architecture, environments, platform boundaries, and deployment architecture. |
| [`BILLING_ARCHITECTURE.md`](./BILLING_ARCHITECTURE.md) | IMMIFIN owns business policy/entitlements; Stripe owns payment processing. |
| [`STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md`](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) | As-built subscription platform behavior. |
| [`PUBLIC_VISITOR_ACCESS_ARCHITECTURE.md`](./PUBLIC_VISITOR_ACCESS_ARCHITECTURE.md) | Public discovery versus authenticated tool-access principles. |
| [`ROADMAP_v2.md`](./ROADMAP_v2.md) | Existing broad sprint sequencing; Finance work requires explicit approval. |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Deployment/release process. No deployment is part of FIN-SPRINT-01 baseline work. |
| [`EMMIFIN-HERO-DESIGN.MD`](../EMMIFIN-HERO-DESIGN.MD) | Governs split-scene heroes only if a later approved Finance page requires one; it does not override approved calculator visual references. |

`docs/ROADMAP.md` is absent. The canonical Finance design identifies [`ROADMAP_v2.md`](./ROADMAP_v2.md) as the replacement forward-sequencing reference.

---

## 2. Workspace and Git Baseline

### 2.1 FIN-01-001 original-workspace finding

The original workspace at `C:\Projects\immifin` was deliberately preserved. During FIN-01-001 / FIN-01-002 verification it remained:

- On local `main` at `833ef59d30155072c2154c737a9b206f47cf995f`.
- Reported `ahead 10, behind 16` relative to remote `origin/main`.
- Dirty with pre-existing modified and untracked work, including unrelated hero/UI, Supabase, migration, prototype, generated, diagnostic, and PNG files.

Do not reset, clean, stash, rebase, merge, or use that workspace for Finance implementation.

### 2.2 Isolated Finance documentation workspace

| Item | Value |
|---|---|
| **Worktree path** | `C:\Temp\immifin-finance-sprint-01` |
| **Branch** | `finance/sprint-01-docs` |
| **Base** | Exact independently verified remote `main`: `e48ee1afb08a6b3c672f1e7fc52331a1fa6a80b9` |
| **Creation rule** | Created as a dedicated worktree without modifying original worktree files. |
| **Commit/push** | Not authorized by FIN-01-002. |

### 2.3 Baseline safeguard

This worktree was based on the exact remote-main commit verified through a non-mutating remote query. If remote main changes before a future Finance task begins, that task must independently verify the intended base and must not assume this baseline remains current.

---

## 3. Sprint Identity, Scope, and Current Status

### 3.1 Sprint objective

Recover and preserve the approved Finance V1 design baseline, establish documentation and approval gates, prepare a safe isolated workspace, and define a controlled future implementation sequence.

### 3.2 Current status

| Area | Status |
|---|---|
| Finance product / UX design | **Approved authority** — see `FINANCE_PRODUCT_DESIGN.md`. |
| Finance sprint documentation baseline | **Created locally by FIN-01-002; uncommitted pending Product Owner instruction.** |
| Technical architecture | **NOT YET DECIDED / NOT AUTHORIZED** |
| Calculation engines and tax data | **NOT STARTED / NOT AUTHORIZED** |
| Finance routes, APIs, schema, scenarios, and tests | **NOT STARTED / NOT AUTHORIZED** |
| Finance entitlement implementation | **NOT STARTED / NOT AUTHORIZED** |
| Finance AI implementation | **NOT STARTED / NOT AUTHORIZED** |
| Notification Platform work | **Closed; out of scope.** |

### 3.3 Scope restrictions

- Do not continue Notification Platform work under Finance tasks.
- Do not redefine Free, Pro, or Power plans or pricing.
- Do not treat SEO Public as a new paid or authenticated subscription plan.
- Do not use AI as a financial calculation engine.
- Do not infer unapproved tax rates, financial rules, defaults, data providers, routes, schemas, or visual designs.

---

## 4. Approved Finance V1 Calculator Portfolio

**Canonical reference:** `FINANCE_PRODUCT_DESIGN.md` §15 and §§16–24. No additional Finance V1 calculator is approved by that document.

| # | Approved calculator | Domain | Core approved question | Canonical section | Current code status |
|---:|---|---|---|---|---|
| 1 | **Take-Home Pay & Savings Calculator** | Income & Taxes | Out of what I earn, how much do I take home and could my household save? | §16 | Not implemented. |
| 2 | **State & Local Tax Calculator** | Income & Taxes | What taxes apply where I live? | §17 | Not implemented. |
| 3 | **Salary & Location Comparison** | Income & Taxes | Does this salary in this location improve my financial position? | §18 | Not implemented. |
| 4 | **Home Affordability Calculator** | Home | How much house can I afford? | §19 | Not implemented. |
| 5 | **Mortgage Calculator** | Home | What will this particular mortgage / home cost? | §20 | Not implemented. |
| 6 | **Rent vs. Buy Calculator** | Home | For this location and stay length, am I better off renting or buying? | §21 | Not implemented. |
| 7 | **Cost of Living Comparison** | Living | What does it cost to maintain my household/lifestyle in this location? | §22 | Not implemented. |
| 8 | **Savings Goal Calculator** | Goals & Wealth | How much do I need to save each month to reach this goal by this date? | §23 | Not implemented. |
| 9 | **Net Worth Tracker** | Goals & Wealth | What is my household worth today, and is the position improving? | §24 | Not implemented. |

### 4.1 Approved boundaries that must remain distinct

| Calculator | Locked boundary |
|---|---|
| #1 Take-Home Pay & Savings | Income → taxes → expenses → savings. Not investment, retirement, debt-payoff, or net-worth planning. |
| #2 State & Local Tax | Tax information only. Not salary, relocation, cost-of-living, lifestyle, or general-financial recommendations. |
| #3 Salary & Location | Personal relocation/job-decision tool; it is distinct from #2 tax-only and #7 cost-only tools. |
| #4 Home Affordability | Affordability, not detailed mortgage mechanics. |
| #5 Mortgage | Mortgage mechanics, not affordability or rent-vs-buy decisioning. |
| #6 Rent vs. Buy | Housing decision; depends on separately approved financial assumptions. |
| #7 Cost of Living | Salary deliberately excluded. |
| #8 Savings Goal | Not portfolio optimization, stock selection, asset allocation, investment recommendations, or debt payoff. |
| #9 Net Worth | Household assets, liabilities, and improvement over time; technical persistence details remain open. |

---

## 5. Approved Experience and Entitlement Reference

### 5.1 Tier definitions

| Experience | Meaning |
|---|---|
| **SEO Public** | A discoverable, genuinely useful standalone calculator result where the canonical matrix permits it. It is not equivalent to authenticated Free and is not a subscription plan. |
| **Free** | Authenticated base experience with calculator-specific additional inputs/results where approved. |
| **Pro** | Calculator-specific advanced detail, precision, scenarios, comparison, or controls where approved. |
| **Power** | Calculator-specific approved AI explanation/interpretation and what-if capabilities, grounded in the same deterministic outputs. Power does not receive different underlying math. |

### 5.2 Matrix authority rule

The complete row-by-row source of truth is the calculator-specific matrix in `FINANCE_PRODUCT_DESIGN.md` §§16–24. This handoff records implementation-relevant highlights only and must not be used to redefine those matrices.

| Calculator | SEO Public / Free reference | Pro reference | Power reference |
|---|---|---|---|
| #1 Take-Home Pay & Savings | Public: income/state/filing/tax/payroll/net-income basics. Free adds housing, living costs, savings, and savings rate. | Adds household/location detail, overrides, multiple scenarios, and side-by-side comparison. | AI explanation and what-if analysis. |
| #2 State & Local Tax | Public/Free have no two-location comparison. | Exactly two-location tax comparison; adds detailed city/ZIP, sales-tax, and property-tax information as listed in §17. | Same exact two-location tax scope plus approved AI explanation. |
| #3 Salary & Location | Public salary/state/COL comparison; Free adds filing, tax, take-home, basic household cost, and disposable-income detail. | Adds household, local tax, housing, detailed costs, overrides, savings, and side-by-side detail. | AI explanation, break-even salary, and what-if analysis. |
| #4 Home Affordability | Public income/down payment/rate/term/basic affordability; Free adds debts, DTI, basic housing costs. | Adds detailed location/debt/HOA/overrides/scenarios/cash-to-close detail. | AI affordability, what-if, and target-home analysis. |
| #5 Mortgage | Public loan/payment/interest basics; Free adds housing-cost inputs, amortization, and breakdown. | Adds location detail, overrides, extra payments, payoff, savings, and comparisons. | AI mortgage, what-if, and payoff-strategy analysis. |
| #6 Rent vs. Buy | Refer to §21 only; do not infer assumptions or permissions from other housing calculators. | Refer to §21 only. | Refer to §21 only. |
| #7 Cost of Living | Public comparison and basic category/monthly/annual estimates; Free adds household inputs. | Adds local detail, overrides, detailed categories, multiple scenarios, side-by-side detail. | AI explanation and what-if analysis. |
| #8 Savings Goal | Public goal/current savings/timeframe/required savings/progress; Free adds contributions, projection, shortfall, and save/track. | Adds multiple goals, prioritization, return/contribution changes, inflation, comparison, and combined requirement. | AI explanation, what-if, and goal-allocation analysis. |
| #9 Net Worth Tracker | Refer to §24 only; no persistence design is authorized. | Refer to §24 only. | Refer to §24 only. |

### 5.3 Existing platform enforcement to reuse later

Future Finance implementation must extend—not replace—the shared platform architecture:

| Concern | Existing source | Constraint |
|---|---|---|
| Tier identifiers | `lib/subscription/tiers.ts` | Existing tiers are `free`, `pro`, `power`. |
| Capability authority | `lib/subscription/capabilities.ts` | Use capability helpers, not scattered plan-name checks. Finance capabilities are not yet defined. |
| Server enforcement | `lib/subscription/requireCapability.ts` | Premium Finance APIs/actions must be authorized server-side. |
| Entitlement resolution | `lib/subscription/resolveSubscriptionEntitlement.ts` | Existing subscription state remains authority for future tier resolution. |
| Billing policy | `docs/BILLING_ARCHITECTURE.md` | IMMIFIN owns policy; Stripe manages money. No Finance billing change is authorized. |
| AI gate | `lib/intelligence/README.md` | Existing Intelligence is Power-gated and controlled-beta/frozen; Finance AI is not approved for implementation. |

---

## 6. Approved PNG Inventory and Visual-Authority Register

### 6.1 Original-workspace asset inventory

FIN-01-001 / FIN-01-002 read-only inspection reconfirmed that the following files exist in the original workspace `C:\Projects\immifin`, are readable PNGs, and are currently **untracked** there. They were not copied, moved, altered, or added to this Finance worktree.

| Role | Exact original-workspace path | Git tracking in original workspace | Approval status |
|---|---|---|---|
| Finance Overview | `public/images/FINANCE_OVERVIEW_APPROVED_REFERENCE.png` | Untracked | Filename indicates approved reference; tracking/provenance transfer remains pending. |
| #1 Public | `public/images/finance-take-home-pay-savings-public-approved-reference.png` | Untracked | Approved visual reference recorded in canonical §16/§26; tracking transfer remains pending. |
| #1 Free | `public/images/finance-take-home-pay-savings-free-approved-reference.png` | Untracked | Approved visual reference recorded in canonical §16/§26; tracking transfer remains pending. |
| #1 Pro | `public/images/finance-take-home-pay-savings-pro-approved-reference.png` | Untracked | Approved visual reference recorded in canonical §16/§26; tracking transfer remains pending. |
| #1 Power | `public/images/finance-take-home-pay-savings-power-approved-reference.png` | Untracked | Approved visual reference recorded in canonical §16/§26; tracking transfer remains pending. |
| #2 Public | `public/images/finance-state-local-tax-public-approved-reference.png` | Untracked | **FINAL — Product Owner approved in FIN-01-002.** |
| #2 Free | `public/images/finance-state-local-tax-free-approved-reference.png` | Untracked | **FINAL — Product Owner approved in FIN-01-002.** |
| #2 Pro | `public/images/finance-state-local-tax-pro-approved-reference.png` | Untracked | **FINAL — Product Owner approved in FIN-01-002.** |
| #2 Power | `public/images/finance-state-local-tax-power-approved-reference.png` | Untracked | **FINAL — Product Owner approved in FIN-01-002.** |

All nine listed files were previously reported as 1536 × 1024 PNGs. Their visual approval status and their Git tracking status are separate facts.

### 6.2 State & Local Tax later approval record

The Product Owner explicitly approved the four Calculator #2 State & Local Tax references listed above as **FINAL** during FIN-01-002 authorization.

This later Product Owner approval supersedes the older historical statement in `FINANCE_PRODUCT_DESIGN.md` §26 that Calculator #2 lacked approved visual references. The canonical document remains unmodified so historical approval context is preserved.

**Locked visual/product behavior for #2:**

- SEO Public: no two-location comparison.
- Free: no two-location comparison.
- Pro: exactly two-location **tax-only** comparison.
- Power: exactly two-location **tax-only** comparison plus approved AI explanation.
- Never expand the comparison to salary, relocation scoring, cost of living, lifestyle recommendations, or general financial recommendations.

### 6.3 Missing or not-yet-verified visual references

| Calculator | Visual-reference status | Required handling |
|---|---|---|
| #3 Salary & Location Comparison | Missing / not yet verified | Do not create replacement design without Product Owner approval. |
| #4 Home Affordability | Missing / not yet verified | Do not create replacement design without Product Owner approval. |
| #5 Mortgage | Missing / not yet verified | Do not create replacement design without Product Owner approval. |
| #6 Rent vs. Buy | Missing / not yet verified | Do not create replacement design without Product Owner approval. |
| #7 Cost of Living Comparison | Missing / not yet verified | Do not create replacement design without Product Owner approval. |
| #8 Savings Goal Calculator | Missing / not yet verified | Do not create replacement design without Product Owner approval. |
| #9 Net Worth Tracker | Missing / not yet verified | Do not create replacement design without Product Owner approval. |

### 6.4 Asset transfer guardrail

The approved PNGs remain only in the original dirty workspace at this baseline. A separate explicitly authorized task is required to safely transfer, verify, add, and commit approved PNGs. Do not copy or commit them under FIN-01-002.

---

## 7. Existing Reusable Architecture

| Area | Existing reusable source(s) | Current limitation for Finance |
|---|---|---|
| Authenticated user/profile authority | `lib/auth/requireUser.ts`, `lib/supabase/profiles.ts` | Finance data entities are absent. |
| Subscription/entitlements | `lib/subscription/*` | No Finance capability identifiers or Finance matrix mapping exists. |
| Billing policy | `docs/BILLING_ARCHITECTURE.md`, `lib/stripe/*` | No plan/pricing/billing change is authorized. |
| Calculator layout/forms | `components/ds2/Ds2CalculatorPageShell.tsx`, existing Immigration calculator components | May be reused only where it preserves approved Finance design and architecture. |
| Premium discovery UX | `components/common/PremiumFeaturePreview.tsx` | Finance has its own tiered in-page upgrade UX; do not blindly apply Immigration full-page behavior. |
| Charts | `recharts`, `components/visa/VisaStampingHistoryTrendChart.tsx` | Finance chart requirements remain calculator-specific. |
| AI platform | `lib/intelligence/*`, `app/api/intelligence/ask/route.ts` | Frozen controlled-beta platform; no Finance context or Finance approval. |
| Design system | `docs/design-system/*`, DS2 components/styles | Must defer to approved Finance calculator visuals where available. |
| Hero pattern | `components/ds2/Ds2SplitSceneHero.tsx`, `EMMIFIN-HERO-DESIGN.MD` | Applies only to later approved Finance hero use; not calculator layout authority. |

---

## 8. Technical and Product Decision Register

**Status convention:** `OPEN — NOT AUTHORIZED` means the topic must be decided in a future approved architecture/product task. This register records dependencies; it does not resolve them.

| ID | Decision | Current status | Approved constraint / source | Implementation dependency | Product Owner approval required |
|---|---|---|---|---|---|
| FIN-DEC-001 | Finance URL and route conventions | OPEN — NOT AUTHORIZED | `FINANCE_PRODUCT_DESIGN.md` §27: routes/URL slugs not yet decided. | Any calculator page/API/navigation work. | Yes |
| FIN-DEC-002 | Finance capability identifiers | OPEN — NOT AUTHORIZED | Reuse shared capability architecture; do not add plans. `lib/subscription/capabilities.ts`. | Tier-specific UX and server access control. | Yes |
| FIN-DEC-003 | Server-side entitlement enforcement | OPEN — NOT AUTHORIZED | Existing `requireCapability()` is server pattern; browser checks are insufficient. | Finance APIs, saved scenarios, AI, premium calculations. | Yes |
| FIN-DEC-004 | Deterministic calculation architecture | OPEN — NOT AUTHORIZED | Finance §14: deterministic, auditable, testable; AI does not calculate. | Every calculator engine. | Yes |
| FIN-DEC-005 | Financial rule versioning and provenance | OPEN — NOT AUTHORIZED | Finance §14 and §27 require versioning where appropriate; methodology is not decided. | Audits, reproducibility, scenario history, support. | Yes |
| FIN-DEC-006 | Tax-year handling | OPEN — NOT AUTHORIZED | Relevant taxes must use applicable treatment; exact methodology is undecided. | #1, #2, #3 and tax-influenced housing results. | Yes |
| FIN-DEC-007 | Filing-status taxonomy | OPEN — NOT AUTHORIZED | Filing status is approved input in relevant matrices; exact taxonomy is not specified. | #1, #2, #3 tax calculations. | Yes |
| FIN-DEC-008 | Federal, state, local, and payroll tax treatment | OPEN — NOT AUTHORIZED | Federal treatment applies where relevant; #2 comparison remains tax-only. | #1, #2, #3 calculation engines. | Yes |
| FIN-DEC-009 | Standard versus itemized deduction treatment | OPEN — NOT AUTHORIZED | Not specified as implementation methodology. | Tax calculation accuracy and user explanation. | Yes |
| FIN-DEC-010 | Authoritative tax-data sources | OPEN — NOT AUTHORIZED | Finance §27: tax-data providers not yet decided. Prefer official sources for future validation. | Tax engines/rule data refresh/versioning. | Yes |
| FIN-DEC-011 | Property-tax sources and jurisdiction resolution | OPEN — NOT AUTHORIZED | Property-tax provider/methodology not decided; Pro matrices require detailed location behavior. | #2, #3, #4, #5, #6. | Yes |
| FIN-DEC-012 | Cost-of-living methodology/providers | OPEN — NOT AUTHORIZED | Finance §22/§27 explicitly leave provider/methodology undecided; #7 excludes salary. | #3 and #7. | Yes |
| FIN-DEC-013 | Mortgage assumptions and external-rate handling | OPEN — NOT AUTHORIZED | Default assumptions and rate providers not decided. | #4, #5, #6. | Yes |
| FIN-DEC-014 | Currency precision and rounding | OPEN — NOT AUTHORIZED | Deterministic/auditable results required; precision policy not specified. | Every calculator and stored scenario. | Yes |
| FIN-DEC-015 | Scenario-saving architecture | OPEN — NOT AUTHORIZED | Scenario principles are approved; persistence/schema are not. | Pro scenario features; #8/#9 tracking. | Yes |
| FIN-DEC-016 | Scenario-comparison semantics | OPEN — NOT AUTHORIZED | Comparison is calculator-specific; #2 is exactly two tax-only locations. | #1, #2, #3, #4, #5, #6, #7, #8. | Yes |
| FIN-DEC-017 | Supabase table ownership and RLS | OPEN — NOT AUTHORIZED | Database/schema are not approved; preserve existing Clerk/Supabase architecture. | Any Finance persistence/API. | Yes |
| FIN-DEC-018 | Data retention and deletion | OPEN — NOT AUTHORIZED | Persistence and retention are not approved. | Saved scenarios, net-worth history, privacy/deletion. | Yes |
| FIN-DEC-019 | Net-worth asset/liability modeling | OPEN — NOT AUTHORIZED | #9 product purpose approved; technical model not specified. | Net Worth Tracker data model and history. | Yes |
| FIN-DEC-020 | Finance AI context and access restrictions | OPEN — NOT AUTHORIZED | AI explanation only where matrix permits; existing Intelligence is Power-gated/frozen. | Any Finance Power AI surface. | Yes |

### 8.1 Decision-gate sequence

No Finance implementation task may resolve these decisions implicitly. At minimum, Finance technical architecture, entitlements, deterministic calculation/rule versioning, and scenario/persistence decisions must be approved before work that depends on them.

---

## 9. Proposed Implementation Roadmap

> **PROPOSED — NOT YET FULLY AUTHORIZED.** This is sequencing guidance from FIN-01-001, not authorization to code.

| Sequence | Proposed work | Status / dependency |
|---:|---|---|
| 1 | Finance documentation baseline | **FIN-01-002 complete locally; commit requires separate approval.** |
| 2 | Finance technical architecture | Requires Product Owner authorization; resolves FIN-DEC-001, 004–014 as applicable. |
| 3 | Finance entitlement/capability architecture | Requires Product Owner authorization; resolves FIN-DEC-002–003. |
| 4 | Scenario and persistence architecture | Requires Product Owner authorization; resolves FIN-DEC-015–019. |
| 5 | Shared deterministic calculation foundation | After architecture decisions; no tax rates or data may be invented. |
| 6 | Take-Home Pay & Savings Calculator | First candidate after tax engine/data decisions; approved #1 visual references exist. |
| 7 | State & Local Tax Calculator | Reuse tax foundation; exactly-two-location tax-only Pro/Power comparison. |
| 8 | Savings Goal Calculator | Candidate after scenario/persistence foundation. |
| 9 | Mortgage Calculator | Establish approved mortgage/amortization primitives. |
| 10 | Home Affordability Calculator | Reuse mortgage/housing-cost foundations. |
| 11 | Rent vs. Buy Calculator | Depends on #4/#5 and approved horizon/ownership assumptions. |
| 12 | Cost of Living Comparison | Blocked on provider/methodology approval. |
| 13 | Salary & Location Comparison | Depends on stable tax and location-cost engines. |
| 14 | Net Worth Tracker | Depends on mature persistence, retention, and model decisions. |
| 15 | Finance AI explanations | Last; requires deterministic result provenance and approved Intelligence/Finance AI gates. |

### 9.1 Proposed immediate next task

**FIN-01-003 — Finance Technical Architecture Decision Record** is recommended next, subject to Product Owner approval. It should decide only the bounded architecture needed to unblock shared deterministic calculation and entitlement/persistence planning; it must not implement calculator UI, tax rates, schemas, or Finance features unless separately authorized.

---

## 10. Task Status Tracker

| Task | Status | Notes |
|---|---|---|
| FIN-01-001 — Finance Design Recovery and Implementation Readiness Audit | **COMPLETE** | Read-only audit; no repository/runtime changes. |
| FIN-01-002 — Finance Sprint Documentation Baseline & Workspace Preparation | **COMPLETE LOCALLY — UNCOMMITTED** | This handoff is the only authorized content change. |
| FIN-01-003 — Finance Technical Architecture Decision Record | **PROPOSED** | Not authorized by this handoff. |
| Finance asset transfer/tracking task | **PROPOSED** | Required before approved original-workspace PNGs can be copied/tracked/committed. |
| Finance implementation tasks | **NOT AUTHORIZED** | Await Product Owner approval after architecture decisions. |

---

## 11. Testing, Release, and Approval Gates

### 11.1 Documentation task validation

FIN-01-002 validation is limited to:

- Correct handoff path and readable Markdown structure.
- Correct nine-calculator names and canonical references.
- Tier behavior referenced to canonical calculator-specific matrices, without invented permissions.
- Accurate original-workspace PNG paths and separate approval/tracking status.
- Product Owner final approval record for #2 State & Local Tax visuals.
- Explicit missing visual and technical-decision registers.
- Confirmation that no unrelated files changed.

No localhost, build, test, migration, deployment, or runtime validation is required or authorized for this documentation-only task.

### 11.2 Future implementation checkpoints

| Checkpoint | Required before proceeding |
|---|---|
| Architecture approval | Product Owner approval of relevant FIN-DEC decisions. |
| Workspace safety | Clean approved feature worktree based on independently verified remote main. |
| Data-source approval | Authoritative source, license/usage, versioning, freshness, and fallback decisions documented. |
| Calculation validation | Deterministic unit/fixture/boundary tests and rule-version evidence. |
| Security validation | Server-side auth/capability checks plus RLS/privacy validation for persistence. |
| UX validation | Approved PNG/reference fidelity where available; explicit PO direction where visuals are missing. |
| User acceptance | Localhost verification and Product Owner approval under the engineering playbook. |
| Release approval | Build/release gates, commit/push/deployment approval, and production verification. |

---

## 12. Final Safety Restrictions

Until a subsequent Product Owner-authorized task says otherwise:

- Do not modify `FINANCE_PRODUCT_DESIGN.md`.
- Do not modify project-state, architecture, roadmap, deployment, billing, subscription, Notification Platform, source-code, migration, or configuration files under Finance scope.
- Do not create Finance routes/components, calculations, APIs, database tables, or migrations.
- Do not add capability identifiers or change pricing/billing.
- Do not copy, move, rename, edit, or commit the untracked approved Finance PNGs.
- Do not commit, push, or deploy this documentation baseline without further Product Owner approval.

---

## 13. Revision History

| Date | Task | Description |
|---|---|---|
| 2026-10-19 | FIN-01-002 | Created Finance sprint documentation baseline in isolated worktree at verified remote-main commit `e48ee1…`; recorded Product Owner final approval of State & Local Tax Public/Free/Pro/Power PNG references; recorded unresolved architecture and asset-tracking decisions. |
