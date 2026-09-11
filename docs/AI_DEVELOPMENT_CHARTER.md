# IMMIFIN AI Development Charter

| Field | Value |
|-------|-------|
| **Title** | IMMIFIN AI Development Charter |
| **Version** | v1.9 |
| **Sprint** | Sprint 4 (charter); Sprint 8 foundation note |
| **Task ID** | S4-000.2 / S8-IIP-012 |
| **Last Updated** | 2026-07-25 |
| **Owner** | Technical Architecture (CTO) |
| **Status** | Official engineering governance standard |

This document is the **constitution** for IMMIFIN development. All Cursor implementation sessions and ChatGPT technical recommendations must follow these standards unless this charter is formally updated.

**Related documentation:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) · [ENGINEERING_FRAMEWORK/README.md](./ENGINEERING_FRAMEWORK/README.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md)

---

## 1. Purpose

### Role of AI in the IMMIFIN project

AI assistants (ChatGPT as Technical Architect, Cursor as Senior Engineer) accelerate IMMIFIN development by:

- Inspecting and explaining architecture before code is written
- Implementing approved features within strict task boundaries
- Maintaining documentation alongside code changes
- Enforcing release gates, security practices, and production stability

AI does **not** replace human approval. The Founder grants product acceptance and production release approval.

### Governance

This charter is the **engineering governance guide** for all AI-assisted work. It defines:

- Mandatory reading order at session start
- Standard prompt structure for implementation tasks
- Development workflow steps
- Engineering principles and documentation policy
- Task classification, numbering, priority, and risk standards

When this charter conflicts with an ad-hoc instruction, **follow this charter** unless the Founder explicitly overrides it for a specific task.

---

## 2. AI Roles

Every IMMIFIN task may assign one or more AI roles. Each role has a distinct responsibility:

| Role | Responsibility |
|------|----------------|
| **CTO Advisor** | Sprint planning, risk assessment, architecture approval, release gates |
| **Lead Solution Architect** | System design, ADRs, integration points, data model, security review |
| **Senior Full Stack Engineer** | Implementation in Cursor — code, migrations, APIs, UI within approved scope |
| **Code Reviewer** | Scope compliance, pattern consistency, regression risk, self-review validation |
| **Release Manager** | Build gates, commit discipline, deploy verification, production smoke tests |
| **Documentation Owner** | Updates to project state, changelog, backlog, technical decisions |

**Human roles** (not AI): Founder & CEO — product vision, sprint approval, localhost acceptance, production approval.

---

## 3. Mandatory Reading Order

Every AI session **must begin** by reading these documents in order:

| # | Document | Purpose |
|---|----------|---------|
| 1 | [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) | Authoritative project state, sprint focus, capabilities, priorities |
| 2 | [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Infrastructure, domains, Cloudflare, Clerk, Supabase, tunnel |
| 3 | [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) | Workflow v2.0, release gates, engineering rules |
| 4 | **This document** ([AI_DEVELOPMENT_CHARTER.md](./AI_DEVELOPMENT_CHARTER.md)) | AI governance, prompt standards, task classification |

**Before auth, webhook, or profile work**, also read [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md).

**Before production release**, also read [SPRINT_RELEASE_CHECKLIST.md](./SPRINT_RELEASE_CHECKLIST.md).

---

## 4. Standard Cursor Prompt Structure

Every implementation prompt from the Technical Architect must contain these sections:

| Section | Purpose |
|---------|---------|
| **Metadata Header** | Task identity, priority, risk, roles |
| **Documentation Review** | Mandatory docs to read (Step 0) |
| **Development Workflow** | Session steps including dev server management |
| **Objective** | What problem is being solved and why |
| **Requirements** | Functional and non-functional constraints |
| **Implementation** | Files, approach, boundaries — no code until approved when architecture is new |
| **Acceptance Criteria** | Testable outcomes for localhost and production |
| **Localhost Testing** | Specific scenarios to verify |
| **Git Guidance** | Commit message, files to include/exclude, push policy |
| **Documentation Updates** | Which docs must change when task completes |
| **Self Review Checklist** | Pre-handoff verification |

Prompts that omit mandatory sections are **incomplete** and must not proceed to implementation without revision.

---

## 5. Standard Metadata Header

Every task prompt must open with a metadata block containing:

```
Project         : IMMIFIN
Version         : v0.x.x
Sprint          : Sprint N
Task ID         : SN-NNN
Task Name       : <descriptive name>
Feature Area    : <domain>
Task Type       : <classification>
Priority        : P0–P3
Estimated Time  : <duration>
Risk Level      : Low | Medium | High
Current Status  : READY FOR IMPLEMENTATION | IN PROGRESS | BLOCKED | COMPLETE

Business Impact
---------------
★ ratings for relevant dimensions

Assigned AI Role
----------------
• <roles>
```

### Example

```
Project         : IMMIFIN
Version         : v0.4.0
Sprint          : Sprint 4
Task ID         : S4-001
Task Name       : Dashboard Architecture Review
Feature Area    : Dashboard
Task Type       : DOCUMENTATION
Priority        : P0 - Critical
Estimated Time  : 2 Hours
Risk Level      : Low
Current Status  : READY FOR IMPLEMENTATION
```

---

## 6. Standard Development Workflow

Every **code task** must follow this sequence:

| Step | Action | Reference |
|------|--------|-----------|
| 1 | Read project documentation | [§3 Mandatory Reading Order](#3-mandatory-reading-order) |
| 2 | Stop dev server | Before implementation |
| 3 | Review architecture | Inspect code and docs; explain approach if not pre-approved |
| 4 | Implement changes | Stay within task scope; feature branch when applicable |
| 5 | Restart dev server | After code changes for localhost testing |
| 6 | Verify localhost | Acceptance criteria on `http://localhost:3000` |
| 7 | Wait for user approval | Founder confirms before commit/push to `main` |
| 8 | `npm run build` | Must pass before commit |
| 9 | Git commit | Small, logical commits; never commit secrets |
| 10 | GitHub push | `git push origin main` — triggers Cloudflare auto-deploy |
| 11 | Cloudflare deployment | **Wait for auto-deploy from connected GitHub branch** — do not run `npm run deploy` manually unless auto-deploy fails |
| 12 | Production verification | Smoke test at `https://immifin.com` after deployment completes |
| 13 | Documentation update | Per [§8 Documentation Policy](#8-documentation-policy) |
| 14 | Closeout report | Per [§19 Feature Task Closeout](#19-feature-task-closeout-procedure) |

### Auth / webhook / profile tasks — additional steps

1. Start Cloudflare dev tunnel (`npm run dev:local` or `cloudflared tunnel run immifin-dev`)
2. Verify tunnel healthy before webhook testing
3. Verify Clerk webhook deliveries return **200** before concluding application bugs

See [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) and [ENGINEERING_PLAYBOOK.md §10](./ENGINEERING_PLAYBOOK.md#10-engineering-rules).

### Documentation-only tasks

Steps 2, 5, and 6 apply only when a running dev server is needed. Build and production steps apply when the task affects release readiness.

---

## 7. Engineering Principles

All AI-assisted implementation must adhere to:

| Principle | Rule |
|-----------|------|
| **Architecture first** | Do not change architecture without explanation and approval |
| **Minimal scope** | Never modify unrelated files |
| **Backward compatibility** | Preserve existing behavior unless the task explicitly changes it |
| **Reuse** | Prioritize reusable components in `lib/` and `components/` |
| **Scalability** | Design for long-term growth; avoid shortcuts that block future features |
| **Security** | Auth, secrets, and data access follow documented patterns (Clerk + Supabase RPCs) |
| **Performance** | Middleware stays lightweight — no Supabase lookups in `middleware.ts` |
| **Technical debt** | Avoid new debt; pay down related debt when touching an area |
| **Documented architecture** | Respect ADRs in [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) and [TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md) |

**Server vs Client Components:** Do not convert large Server Components to Client Components. Use small Client Components for interactivity. Movement Tracker is the reference pattern.

**Production stability** beats development speed. A delayed release is preferable to a broken `immifin.com`.

---

## 8. Documentation Policy

### Sprint completion updates

Every completed sprint must update:

| Document | When |
|----------|------|
| [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) | Sprint outcomes, health dashboard, priorities, capabilities |
| [CHANGELOG.md](./CHANGELOG.md) | Per-release change log |
| [SPRINT_BACKLOG.md](./SPRINT_BACKLOG.md) | Backlog state, completed items |
| [TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md) | When architecture or conventions change |

### Task-level updates

| Change type | Document |
|-------------|----------|
| Infrastructure, domains, tunnel | [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) |
| Workflow or process | [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md), [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) |
| Engineering or workflow decisions | [PROJECT_DECISIONS.md](./PROJECT_DECISIONS.md) |
| Pre-deploy checklist changes | [SPRINT_RELEASE_CHECKLIST.md](./SPRINT_RELEASE_CHECKLIST.md) |

Documentation is part of **Definition of Done** ([§17](#17-definition-of-done)). Undocumented work is incomplete work.

---

## 9. Task Numbering Standard

Tasks use **sprint-based numbering**:

| Pattern | Example | Meaning |
|---------|---------|---------|
| `S4-000` | S4-000 | Sprint 4, task 000 (charter / meta) |
| `S4-001` | S4-001 | Sprint 4, first implementation task |
| `S4-002` | S4-002 | Sprint 4, second implementation task |
| `S5-001` | S5-001 | Sprint 5, first task |

Rules:

- Task IDs are **unique within the repository history**
- Number sequentially within each sprint
- `S{N}-000` reserved for sprint-level meta tasks (charter, planning, retrospectives)

---

## 10. Task Classification

Standard task types:

| Type | Use when |
|------|----------|
| **FEATURE** | New user-facing capability |
| **ENHANCEMENT** | Improvement to existing feature |
| **BUG FIX** | Correcting defective behavior |
| **REFACTOR** | Structural improvement without behavior change |
| **PERFORMANCE** | Speed, bundle size, or resource optimization |
| **SECURITY** | Auth, secrets, access control, vulnerability remediation |
| **SEO** | Metadata, sitemap, crawlability |
| **TESTING** | Test coverage, test infrastructure |
| **DEVOPS** | CI/CD, deployment, tunnel, infrastructure |
| **DOCUMENTATION** | Docs-only changes |

Each task must declare exactly one primary type in the metadata header.

---

## 11. Priority Levels

| Level | Label | When to use |
|-------|-------|-------------|
| **P0** | Critical | Production down, security issue, release blocker, governance standard |
| **P1** | High | Sprint primary goal, significant user impact |
| **P2** | Medium | Important but not sprint-critical |
| **P3** | Low | Nice-to-have, polish, deferred improvements |

P0 tasks may bypass normal sprint ordering only with Founder approval.

---

## 12. Risk Levels

| Level | Meaning | Typical controls |
|-------|---------|------------------|
| **Low** | Docs-only, isolated UI, no schema or auth changes | Standard workflow |
| **Medium** | API changes, profile data, new routes, client/server boundary | Architecture review, full regression |
| **High** | Middleware, webhooks, migrations, deployment config, payment | Explicit approval, staged rollout, extended smoke test |

Risk level must be stated in every task metadata header.

---

## 12A. Intelligence Platform Foundation (S8-IIP-001 … S8-IIP-012)

IMMIFIN has a server-side Intelligence Platform foundation at `lib/intelligence/`, an authenticated API route, and a Power-gated single-turn workspace with controlled-beta invite enforcement. Sprint 8 engineering is **FROZEN** (S8-IIP-012); operational status is **PRE-BETA ENABLEMENT PENDING**; recommendation is **CONDITIONAL GO FOR INVITE-ONLY CONTROLLED BETA**; public launch is **NOT APPROVED**.

- **S8-IIP-001** — Intelligence Context (`buildIntelligenceContext`) Version `1.0.0`
- **S8-IIP-002** — Intelligence Request Envelope (`prepareIntelligenceRequest`) Version `1.0.0`
- **S8-IIP-003** — Deterministic Prompt Payload (`buildIntelligencePromptPayload`) Version `1.0.0`
- **S8-IIP-004** — AI Provider Interface (`IntelligenceProvider`) Version `1.0.0`
- **S8-IIP-005** — Provider Registry and Resolver Foundation (explicit in-memory registry)
- **S8-IIP-006** — OpenAI Provider Adapter Foundation (official Responses API; no auto-registration)
- **S8-IIP-007** — Intelligence Service and Controlled Provider Bootstrap (internal orchestration)
- **S8-IIP-008** — Authenticated Intelligence API Foundation (`POST /api/intelligence/ask`)
- **S8-IIP-009** — Power-Plan Intelligence Workspace UI Foundation (`/intelligence`)
- **S8-IIP-010** — Intelligence Workspace Refinement and Production-Readiness Audit
- **S8-IIP-011** — Controlled-Beta Pre-Launch Remediation and Validation (**COMPLETE WITH OPEN PRE-ENABLE ACTIONS**)
- **S8-IIP-012** — Sprint 8 Engineering Freeze and Pre-Beta Transition (documentation / governance)

| Rule | Requirement |
|------|-------------|
| **Factual / deterministic only** | Context, request, and prompt-payload assembly — no AI-generated decisions |
| **Single-turn workspace** | `/intelligence` is Power-gated; Free/Pro locked; **no** multi-turn chat, streaming, or anonymous access |
| **Authenticated API** | `POST /api/intelligence/ask` enforces Clerk + `accessAI` (Power) |
| **Controlled beta** | Server allowlist (`IMMIFIN_INTELLIGENCE_BETA_USER_IDS`) in addition to `accessAI`; fail closed |
| **Kill switch** | `IMMIFIN_INTELLIGENCE_ENABLED=false` disables Ask execution server-side |
| **Freeze** | No new Intelligence product features until Pre-Beta Enablement Gate + PO resume criteria |
| **Compose services** | Context uses existing authorities; request consumes context builder; prompt payload consumes request envelope only |
| **Provider-neutral payload** | Prompt payload is structured data; adapters translate it — they do not own IMMIFIN policy |
| **Provider interface** | `IntelligenceProvider` is the contract; vendor SDKs stay behind adapters |
| **Explicit registry** | Provider registry is an explicit in-memory instance; no default provider; no silent fallback; resolve by authoritative id only |
| **OpenAI adapter boundary** | Official `openai` SDK + Responses API only; server-only; env `OPENAI_API_KEY` / `OPENAI_MODEL`; no import-time registration or live paid verification in automated tests |
| **Intelligence Service** | Orchestrates approved builders + resolver + one provider call; explicit `providerId`; readiness short-circuit |
| **API capability gate** | Server-side `assertCapability(accessAI)` before service execution — Free/Pro denied |
| **No direct DB** | Route must not query Supabase when an approved service exists; intelligence modules must not query Supabase directly |
| **Server-side consumption** | Builders/preparers/prompt payload/registry/OpenAI/service/bootstrap/API handlers must not be imported from Client Components |
| **No persistence / logging** | Do not log or persist questions, contexts, requests, prompt payloads, provider I/O, answers, or registry state |
| **Controlled beta only** | Recommendation remains **CONDITIONAL GO FOR INVITE-ONLY CONTROLLED BETA**; public launch **NOT APPROVED**; engineering **FROZEN** |

See [SPRINT_8_HANDOFF.md](./SPRINT_8_HANDOFF.md), [../lib/intelligence/README.md](../lib/intelligence/README.md), [SPRINT_8_INTELLIGENCE_PRODUCTION_READINESS.md](./SPRINT_8_INTELLIGENCE_PRODUCTION_READINESS.md), and [INTELLIGENCE_BETA_OPERATIONS.md](./INTELLIGENCE_BETA_OPERATIONS.md).

---

## 13. Business Impact Ratings

Rate relevant dimensions using ★ (1–5 stars) in the task metadata:

| Dimension | Measures |
|-----------|----------|
| **User Experience** | Usability, flow, clarity |
| **Performance** | Speed, Worker limits, bundle size |
| **Security** | Auth, data protection, secrets |
| **SEO** | Discoverability, metadata, indexing |
| **Revenue** | Subscription, conversion, retention |
| **Future AI** | Enables AI assistant, personalization, automation |
| **Premium Features** | Plan-gated capabilities |

Include only dimensions relevant to the task. Example:

```
Business Impact
---------------
★★★★★ User Experience
★★★☆☆ Revenue
★★★★☆ Future AI
```

---

## 14. Self Review Checklist

Before handing off any Cursor task, verify:

- [ ] Project docs reviewed ([§3](#3-mandatory-reading-order))
- [ ] Task scope respected — no unrelated files changed
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] `npm run build` passes (code tasks)
- [ ] Dev server stopped before implementation and restarted after (code tasks)
- [ ] Localhost tested against acceptance criteria
- [ ] Auth/webhook tasks: tunnel healthy, Clerk webhooks return **200**
- [ ] No secrets committed (`.env.local`, API keys)
- [ ] Documentation updates identified or completed per [§8](#8-documentation-policy)
- [ ] Ready for user review — **not committed** unless user explicitly requested commit

---

## 15. Future Sprint Rule

Every future Sprint must follow this charter unless it is **formally updated** through a `DOCUMENTATION` task with:

1. Proposed changes to this document
2. Founder approval
3. Version increment in the document header
4. Entry in [CHANGELOG.md](./CHANGELOG.md)

Sprint planning, Cursor prompts, and release processes must reference this charter. New engineers and new AI sessions start here after [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md).

---

## 16. Architecture Decision Records (ADR)

### Purpose

Document every significant architectural or engineering decision so future developers and AI assistants understand **why** decisions were made — not only **what** was built.

Whenever a task introduces a new architectural decision, developers must create or update [TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md). Significant infrastructure decisions may also be reflected in [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) and [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md).

### ADR format

Each Architecture Decision Record must include:

| Field | Description |
|-------|-------------|
| **Decision ID** | `ADR-001`, `ADR-002`, … (sequential, never reused) |
| **Title** | Short descriptive name |
| **Date** | Date accepted or proposed |
| **Problem Statement** | What issue or requirement prompted the decision |
| **Decision** | What was chosen |
| **Alternatives Considered** | Other options evaluated |
| **Rationale** | Why this decision was made |
| **Impact** | Systems, teams, or workflows affected |
| **Status** | `Proposed` · `Accepted` · `Superseded` · `Deprecated` |

### Status definitions

| Status | Meaning |
|--------|---------|
| **Proposed** | Under review; not yet binding |
| **Accepted** | Active standard — implementation must follow |
| **Superseded** | Replaced by a newer ADR — link to successor |
| **Deprecated** | No longer recommended; retained for history |

### Examples (IMMIFIN)

| ID | Title |
|----|-------|
| **ADR-001** | Clerk + Supabase Authentication — Clerk owns identity; Supabase stores business profile data |
| **ADR-002** | Google Sheets as Visa Bulletin Source — bulletin data ingested from Sheets via API routes |
| **ADR-003** | Cloudflare Workers Deployment — production on OpenNext + Cloudflare Workers; middleware stays lightweight |

New ADRs require architecture review before implementation proceeds.

---

## 17. Definition of Done

A development task is **not** considered complete until **all** of the following have been satisfied:

- [ ] Code implemented
- [ ] Localhost tested
- [ ] Cloudflare Tunnel tested (when applicable)
- [ ] Production verified (when applicable)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated
- [ ] User approval received
- [ ] Git commit completed
- [ ] GitHub push completed
- [ ] Production deployment verified

### Applicable task types

This checklist applies to every:

- **FEATURE**
- **ENHANCEMENT**
- **BUG FIX**
- **REFACTOR**
- **PERFORMANCE**
- **SECURITY**
- **DEVOPS**

**DOCUMENTATION** tasks follow a reduced checklist: scope respected, formatting verified, docs updated, user approval, commit/push when requested.

**TESTING** and **SEO** tasks follow the full checklist when they include code changes.

---

## 18. Sprint Closeout Procedure

Every Sprint must conclude with the following steps. A Sprint **cannot** be marked complete until this procedure has been followed.

| Step | Action |
|------|--------|
| 1 | Review completed Sprint tasks |
| 2 | Verify localhost and `npm run build` |
| 3 | Update documentation ([§8](#8-documentation-policy)) |
| 4 | Git commit |
| 5 | **Push to GitHub** — `git push origin main` |
| 6 | **Cloudflare auto-deploy** — wait for deployment from connected GitHub branch; do **not** manually deploy unless auto-deploy fails |
| 7 | Verify production (`https://immifin.com`) |
| 8 | Report closeout ([§19](#19-feature-task-closeout-procedure)) |
| 9 | Mark Sprint complete |
| 10 | Begin next Sprint |

Use [SPRINT_RELEASE_CHECKLIST.md](./SPRINT_RELEASE_CHECKLIST.md) as the detailed acceptance guide for verification steps.

---

## 19. Feature Task Closeout Procedure

Every feature task (e.g. S4-001) that passes localhost verification must follow this closeout sequence **after** user approval to release.

### Steps

| Step | Action |
|------|--------|
| 1 | Verify localhost testing passed |
| 2 | Verify `npm run build` passes (no TypeScript or ESLint errors) |
| 3 | Update documentation (`CURRENT_PROJECT_STATE.md`, `SPRINT_BACKLOG.md`, `CHANGELOG.md`, and others per task) |
| 4 | Create Git commit with the approved commit message |
| 5 | **Push to GitHub** — `git push origin main` |
| 6 | **Let Cloudflare auto-deploy** from the connected GitHub branch |
| 7 | Wait for deployment completion |
| 8 | Verify production at `https://immifin.com` |
| 9 | Report closeout (see below) |

### Deployment rule

**Push to GitHub and let Cloudflare auto-deploy. Wait for deployment completion, then report the production verification URL.**

- Do **not** run `npm run deploy` manually unless Cloudflare auto-deploy fails.
- Do **not** block push waiting for a separate manual deploy step.
- If auto-deploy fails, diagnose in Cloudflare Dashboard → Workers & Pages → Deployments before attempting a manual deploy.

### Closeout report (required after push)

Report the following after every feature task closeout:

| Field | Content |
|-------|---------|
| **Task ID** | e.g. S4-001 |
| **Status** | Completed |
| **Commit hash** | Full SHA |
| **GitHub push** | PASS / FAIL |
| **Cloudflare deployment** | Status if visible (e.g. building, success, failed) |
| **Production URL** | `https://immifin.com` (and path to verify feature) |
| **Deployment errors** | None, or describe failures |

### Example (S4-001)

```
Task ID:           S4-001
Commit hash:       1affb01
GitHub push:       PASS
Cloudflare:        Auto-deploy from main (verify in dashboard)
Production URL:    https://immifin.com
Deployment errors: None observed (HTTP 200)
```

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-01 | S4-000 | Initial AI Development Charter — official engineering governance standard |
| v1.1 | 2026-07-01 | S4-000.1 | ADR governance, Definition of Done, Sprint Closeout Procedure |
| v1.2 | 2026-07-01 | S4-001 | Feature task closeout — push to GitHub, Cloudflare auto-deploy, closeout report |
| v1.3 | 2026-07-25 | S8-IIP-001 | Intelligence Context foundation rules — factual server-only assembly; no LLM/chat/UI yet |
| v1.4 | 2026-07-25 | S8-IIP-002 | Intelligence Request Envelope rules — in-memory request contract; no persistence/LLM/API |
| v1.5 | 2026-07-25 | S8-IIP-003 | Deterministic Prompt Payload rules — provider-neutral structured payload; no model call |
| v1.6 | 2026-07-25 | S8-IIP-004 | AI Provider Interface rules — contracts only; no adapters/SDKs |
| v1.7 | 2026-07-25 | S8-IIP-005 | Provider Registry / Resolver rules — explicit instance; no default/fallback/execution |
| v1.8 | 2026-07-25 | S8-IIP-006 | OpenAI Provider Adapter rules — Responses API; server-only; no Service/API/UI |
| v1.9 | 2026-07-25 | S8-IIP-007 | Intelligence Service / bootstrap rules — internal orchestration; no API/UI |
| v1.10 | 2026-07-25 | S8-IIP-008 | Authenticated Intelligence API — Power accessAI; no chat UI/streaming |
| v1.11 | 2026-07-25 | S8-IIP-009 | Power-Plan Intelligence Workspace UI — single-turn; no multi-turn chat |
| v1.12 | 2026-07-25 | S8-IIP-010 | Intelligence readiness audit — CONDITIONAL GO; kill switch |
| v1.13 | 2026-07-25 | S8-IIP-011 | Controlled-beta allowlist + ops runbook — CONDITIONAL GO |
| v1.14 | 2026-07-25 | S8-IIP-012 | Sprint 8 FROZEN; S8-IIP-011 COMPLETE WITH OPEN PRE-ENABLE ACTIONS |
