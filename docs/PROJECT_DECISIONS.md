# Immifin — Project Decisions

**Purpose:** Permanent engineering decision log. Records **why** important decisions were made.

This document is **not** a changelog, backlog, or status report. For those, see [CHANGELOG.md](./CHANGELOG.md), [SPRINT_BACKLOG.md](./SPRINT_BACKLOG.md), and [PROJECT_STATUS.md](./PROJECT_STATUS.md).

**Last updated:** 2026-09-21

---

## Decision 001 — Cloudflare Workers + OpenNext

| Field | Value |
|-------|-------|
| **Decision** | Immifin uses **Cloudflare Workers** with **OpenNext** (`@opennextjs/cloudflare`). |
| **Date** | 2026-06-27 |
| **Status** | Accepted |

**Reason:**

- Global edge deployment
- Low operating cost
- Native Next.js support
- Good scalability
- Fast deployment

---

## Decision 002 — GitHub Auto Deployment

| Field | Value |
|-------|-------|
| **Decision** | Production deployments happen **automatically from GitHub** (push to `main`). |
| **Date** | 2026-06-27 |
| **Status** | Accepted |

**Reason:**

- Version history
- Easy rollback
- CI/CD
- Team friendly
- Repeatable deployment

---

## Decision 003 — Secrets Management

| Field | Value |
|-------|-------|
| **Decision** | Secrets are stored using **Wrangler Version Secrets**. Never hardcode production secrets. |
| **Date** | 2026-06-27 |
| **Status** | Accepted |

**Reason:**

- Security
- Portability
- Git safety

**Reference:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Decision 004 — Reference Architecture

| Field | Value |
|-------|-------|
| **Decision** | Future interactive pages should follow the architecture already proven by **Visa Bulletin Movement Tracker**. |
| **Date** | 2026-06-27 |
| **Status** | Accepted |

**Reason:**

- Reuse working patterns
- Reduce bugs
- Maintain consistency

**Pattern:** Small Client Component for interactivity; Server Component parent; SWR + API route for data.

---

## Decision 005 — Server vs Client Components

| Field | Value |
|-------|-------|
| **Decision** | Prefer **Server Components**. Introduce **Client Components** only where interactivity requires them. |
| **Date** | 2026-06-27 |
| **Status** | Accepted |

**Reason:**

- Performance
- Simplicity
- Maintainability

---

## Decision 006 — Deployment Strategy

| Field | Value |
|-------|-------|
| **Decision** | Infrastructure changes and feature development should be done in **separate iterations** whenever possible. |
| **Date** | 2026-06-27 |
| **Status** | Accepted |

**Reason:**

- Easier debugging
- Smaller deployments
- Lower production risk

---

## Decision 007 — Development Workflow v2.0

| Field | Value |
|-------|-------|
| **Decision** | All feature work follows **Development Workflow v2.0**: feature branches, inspect-before-code, architecture explanation before implementation, localhost testing, user approval, `npm run build` gate, separate infra/feature work, clean repo at session end, and doc updates when workflow or architecture changes. |
| **Date** | 2026-06-30 |
| **Status** | Accepted |

**Reason:**

- `main` auto-deploys to production; direct feature work on `main` increases risk.
- Inspect-first and architecture-before-code reduce rework and scope creep.
- Localhost verification and explicit user approval catch UX issues before production.
- `npm run build` catches type and compile errors before merge.
- Separating infrastructure from features simplifies debugging and rollback.
- Documented workflow keeps Cursor, ChatGPT, and Founder aligned.

**Rules (summary):**

1. Feature branches for new work
2. No feature development directly on `main`
3. Inspect before coding
4. Explain architecture before implementation
5. Test localhost before commit
6. User approval after localhost verification
7. `npm run build` must pass before merge/push
8. Never combine infrastructure and feature work
9. Keep repository clean before ending a session
10. Update docs when architecture/workflow changes

**Reference:** [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) §8

---

## Decision 008 — GEO-RESOLUTION-DECISION-001: HUD ZIP → OFLC geographic resolution

| Field | Value |
|-------|-------|
| **Decision ID** | **GEO-RESOLUTION-DECISION-001** |
| **Decision** | IMMIFIN uses **Scenario A — all official HUD ZIP-to-county rows** when resolving a worksite ZIP to published OFLC wage geography. Ratios are metadata only. Multi-area ZIPs require the work-location county. |
| **Date** | 2026-09-21 |
| **Status** | **Accepted** |
| **Sprint** | Sprint 7A — H-1B Wage / Prevailing Wage Platform |
| **Implementation** | Resolver + Dev activation + public API implemented locally. County-choice UX frozen in [GEO-RESOLUTION-UX-011](./H1B_GEOGRAPHIC_RESOLUTION_CONTRACT.md#27-county-choice-ux-contract-geo-resolution-ux-011). **UI not implemented.** |

**Approved product principle:**

> IMMIFIN must not manufacture geographic certainty by silently discarding an official HUD county relationship.

Automatic resolution is appropriate only when the official geographic evidence leads to **one** distinct OFLC area. When the official evidence supports multiple distinct OFLC areas, IMMIFIN must obtain the missing geographic fact from the user rather than infer it from `BUS_RATIO`, `RES_RATIO`, or `TOT_RATIO`.

### Policy status

| Scenario | Status |
|----------|--------|
| **A — all official HUD rows** | **APPROVED** |
| **B — BUS_RATIO > 0 rows only** | **NOT SELECTED** |
| **C — BUS>0 when any exist, else all official rows** | **NOT SELECTED** |
| **D — highest BUS_RATIO county or tied counties** | **NOT SELECTED** |

B, C, and D are alternative policies that were evaluated against official Dev HUD and OFLC geography. They are **not** inherently invalid algorithms. They are **not** approved for IMMIFIN runtime behavior.

### Approved runtime-resolution rule (Scenario A)

When a future runtime looks up published OFLC wage geography from a worksite ZIP:

1. Start with **all** official HUD ZIP → county rows for the entered ZIP.
2. Do **not** discard an official HUD county relationship because of `BUS_RATIO`, `RES_RATIO`, or `TOT_RATIO`.
3. Those ratios may remain available as source / data-quality metadata.
4. Those ratios **must not** be used as runtime authority to silently select one county or one OFLC area over another.
5. Map each official HUD county FIPS to its corresponding OFLC area using the approved OFLC geography mapping (HUD county FIPS → official `oflc_area_localities.county_fips` → `area_code`).
6. If every successfully mapped official county resolves to **one** distinct OFLC area: **AUTO-RESOLVE**.
7. This includes multi-county ZIPs where every official county maps to the same OFLC area. **Multi-county does not automatically mean user choice.**
8. If the official HUD counties resolve to **more than one** distinct OFLC area: **do not guess**. Do not use `BUS_RATIO`, `RES_RATIO`, or `TOT_RATIO` to select one. The future runtime UX must ask the user for the applicable **work-location county**.
9. Once the user identifies the work-location county, IMMIFIN may deterministically resolve that county FIPS to the corresponding OFLC area.
10. If no supported OFLC area can safely be resolved: return a safe **unavailable / manual-resolution** state.
11. IMMIFIN must never invent an OFLC-area mapping for unsupported geography. No nearest-area rule. No state-only inference. No silent substitute geography.
12. **GeoLvl must not participate** in ZIP / county / OFLC geographic resolution.
13. GeoLvl remains metadata on the published OFLC wage record and must be preserved when displaying that wage record.

This decision does **not** implement the county-choice UI or final unavailable-state wording. Runtime, API, and UX-interaction rules live in [H1B_GEOGRAPHIC_RESOLUTION_CONTRACT.md](./H1B_GEOGRAPHIC_RESOLUTION_CONTRACT.md).

### Dataset invariant (analyzed official Dev geography)

In the completed official Dev analysis, **no county FIPS mapped to more than one OFLC area**. Once the applicable work-location county is known, the current official OFLC geography dataset provides a deterministic county → OFLC-area mapping.

### Why Scenario A is approved

Read-only national analysis of **39,484** unique official HUD ZIPs against official OFLC 2026–27 All Industries geography (imported, not active):

| Classification | ZIP count | Share |
|----------------|----------:|------:|
| AUTO — exactly one distinct OFLC area | 34,247 | 86.74% |
| CHOICE — two or more distinct OFLC areas | 5,208 | 13.19% |
| UNMAPPED — no resolvable OFLC area | 29 | 0.07% |

Distinct-area distribution under Scenario A:

| Distinct OFLC areas | ZIP count |
|--------------------:|----------:|
| 1 | 34,247 |
| 2 | 4,781 |
| 3+ | 427 |
| Maximum | 5 |

**6,171** ZIPs are multi-county / single-OFLC-area. Those ZIPs **must not** require user interaction merely because they contain multiple counties. Only ZIPs whose official counties resolve to multiple distinct OFLC areas require county selection.

### Why Scenario B is not selected

Scenario B keeps only HUD rows where `BUS_RATIO > 0`.

| Classification | ZIP count | Share |
|----------------|----------:|------:|
| AUTO | 33,195 | 84.07% |
| CHOICE | 2,974 | 7.53% |
| UNMAPPED | 3,315 | 8.40% |

Removing `BUS_RATIO = 0` rows makes **3,315** ZIPs unavailable. **3,236** ZIPs that Scenario A can automatically resolve become UNMAPPED. **3,296** ZIPs have every official county `BUS_RATIO = 0`. Therefore `BUS_RATIO > 0` cannot safely serve as the geographic inclusion rule.

### Why Scenario C is not selected

Scenario C uses `BUS_RATIO > 0` rows when any exist; otherwise it falls back to all official HUD rows.

| Classification | ZIP count | Share |
|----------------|----------:|------:|
| AUTO | 36,431 | 92.27% |
| CHOICE | 3,024 | 7.66% |
| UNMAPPED | 29 | 0.07% |

Scenario C increases automatic resolution, but it silently removes official HUD county relationships whenever another county has `BUS_RATIO > 0`. IMMIFIN must not manufacture geographic certainty that way. See ZIP **76945** below.

### Why Scenario D is not selected

Scenario D keeps only the county row(s) tied for the highest `BUS_RATIO`.

| Classification | ZIP count | Share |
|----------------|----------:|------:|
| AUTO | 39,355 | 99.67% |
| CHOICE | 100 | 0.25% |
| UNMAPPED | 29 | 0.07% |

The 99.67% automatic-resolution rate is **not** approved as geographic certainty. Scenario D silently drops another official county in **11,169** ZIPs. Of those, **5,111** dropped counties map to a **different** OFLC area.

### Approved examples

**ZIP 77433 — AUTO**

- One official HUD county (Harris `48201`), one positive `BUS_RATIO` row.
- Resolves to OFLC area `26420` Houston-Pasadena-The Woodlands, TX.
- No county question should be shown.

**ZIP 77031 — AUTO (multi-county / single-area)**

- Official HUD counties: Fort Bend (`48157`) and Harris (`48201`). Both `BUS_RATIO > 0`.
- Both map to OFLC area `26420` Houston-Pasadena-The Woodlands, TX.
- Automatically resolve the area. Do not ask for county merely because two counties exist.

**ZIP 76945 — CHOICE**

| County | FIPS | BUS_RATIO | OFLC area |
|--------|------|----------:|-----------|
| Coke County, TX | 48081 | 1 | `4800004` Hill Country Region of Texas nonmetropolitan area |
| Tom Green County, TX | 48451 | 0 | `41660` San Angelo, TX |

The official `BUS_RATIO = 0` Tom Green relationship remains part of the geographic evidence. IMMIFIN must not silently discard it. Future UX asks which county is the work location, then maps that county FIPS to the OFLC area deterministically.

**ZIP 00501 — AUTO**

- One official HUD county (`36103`).
- `BUS_RATIO = 1`, `RES_RATIO = 0`, `TOT_RATIO = 1`.
- Resolves to OFLC area `35620` New York-Newark-Jersey City, NY-NJ.
- A ZIP with no residential share does not make the official HUD geography invalid for this lookup.

### Unmapped geography (29 ZIPs, 0.07%)

Under approved Scenario A:

| Reason | ZIP count |
|--------|----------:|
| Official placeholder GEOID | 9 |
| Territory outside current OFLC FIPS join | 20 |
| Missing U.S. county mapping | 0 |
| No selected HUD rows | 0 |

Known examples include USVI ZIPs (`008xx`) where HUD provides `78xxx` county-style FIPS values while current official OFLC GU/VI locality geography does not expose corresponding `county_fips` values. Official placeholder GEOIDs (`00048`, `00060`, `00064`, `00068`, `00070`) also remain unmapped.

Approved behavior: do not manufacture a mapping. Future runtime must provide a safe unavailable / manual-resolution state. Exact UX wording is not designed here.

### Future UX invariant (not implemented)

| Case | Conceptual behavior |
|------|---------------------|
| AUTO | User enters ZIP → one distinct OFLC area → continue without asking for county. |
| CHOICE | User enters ZIP → multiple distinct OFLC areas → ask **which county is the work location**. The user is not expected to select an OFLC statistical area without geographic context. Example: Coke County, Texas → Hill Country Region of Texas nonmetropolitan area; Tom Green County, Texas → San Angelo, TX. |
| UNMAPPED | Safe unavailable / manual-resolution state. |

IMMIFIN performs `county FIPS → OFLC area` deterministically after the work-location county is known.

### GeoLvl boundary

GeoLvl **must remain completely separate** from geographic resolution. It is **not** ZIP ambiguity, county ambiguity, OFLC-area ambiguity, or a geographic tie-breaker.

Observed official OFLC wage-record counts on the analyzed Dev dataset:

| GeoLvl | Wage records |
|--------|-------------:|
| 1 | 192,397 |
| 2 | 151,042 |
| 3 | 53,772 |
| 4 | 52,229 |

All **530** OFLC areas contain wage records at more than one GeoLvl. After the appropriate area and wage record are resolved, preserve the GeoLvl associated with the displayed published wage record.

### Legal / product boundary

IMMIFIN performs geographic lookup and presentation of **published OFLC wage data**.

IMMIFIN must **not** claim that it:

- issued a Prevailing Wage Determination
- determined the legally applicable prevailing wage
- determined an employer's legal wage obligation
- replaced an official Department of Labor determination
- provided legal advice

This feature determines which published OFLC geography corresponds to user-provided geographic facts under the approved lookup policy.

### Evidence

Read-only analysis (zero database mutations) of official imported, non-active Dev HUD 2026 Q2 ZIP–County and official OFLC 2026–27 All Industries geography. Analysis code remains local and is not a runtime implementation: `scripts/hud-zip-import/geoResolution.ts`, `scripts/hud-zip-import/analyzeGeoResolution.ts`.

---

## Future Decisions

*(No entries yet. Add new decisions here as they are accepted.)*

| ID | Title | Status |
|----|-------|--------|
| — | — | — |

---

## Related documentation

| Document | Contents |
|----------|----------|
| [TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md) | Application architecture and coding conventions |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Infrastructure and environments |
| [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) | Workflow and engineering rules |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Build, deploy, and secrets |
| [CALCULATORS.md](./CALCULATORS.md) | Existing educational H-1B Wage Level Estimator (distinct from official OFLC lookup) |
