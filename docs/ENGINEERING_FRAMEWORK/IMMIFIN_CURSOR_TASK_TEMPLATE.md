# IMMIFIN Master Cursor Task Template

| Field | Value |
|-------|-------|
| **Title** | IMMIFIN Master Cursor Task Template |
| **Version** | v1.0 |
| **Task ID** | ENG-STD-001 |
| **Last Updated** | 2026-07-25 |
| **Owner** | Technical Architecture (CTO) |
| **Status** | Official — mandatory base format for future IMMIFIN Cursor prompts |
| **Canonical path** | `docs/ENGINEERING_FRAMEWORK/IMMIFIN_CURSOR_TASK_TEMPLATE.md` |

**Related:** [README.md](./README.md) · [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md) · [../ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md) · [../AI_DEVELOPMENT_CHARTER.md](../AI_DEVELOPMENT_CHARTER.md) · [../PROJECT_GUIDE.md](../PROJECT_GUIDE.md)

---

## Purpose

This document is the **reusable parent standard** for all IMMIFIN Cursor implementation and documentation tasks.

| Rule | Meaning |
|------|---------|
| **Mandatory base** | Every implementation task starts from this template |
| **May tighten, never weaken** | Story prompts may add stricter requirements; they must not weaken this standard |
| **Repository is authoritative** | Governing docs + current code win over assumptions |
| **Inspect, do not assume** | Discover file names, types, schema, and services before coding |
| **Protect the worktree** | Preserve pre-existing unrelated changes |
| **Bounded scope** | Implement only the approved story; stop at the story boundary |
| **Docs are part of delivery** | Documentation updates are required when behavior or contracts change |
| **Evidence-based claims** | Do not claim tests, localhost, tunnel, or auth verification that were not performed |
| **No release by default** | Do not stage, commit, push, or deploy unless explicitly authorized |
| **Stop conditions bind** | Do not begin the next story unless the prompt authorizes it |

This template is **universal**. It must not be coupled to a single sprint, feature, Stripe flow, notification path, login modal, or Intelligence Platform story.

---

## Template hierarchy

```text
IMMIFIN Master Cursor Task Template  (this file)
        ↓
Applicable Specialized Task Template  (docs/ENGINEERING_FRAMEWORK/TASK_TEMPLATES/*)
        ↓
Story-Specific Cursor Prompt
```

Specialized templates remain valid and are **not** replaced by this file. Examples:

- Backend, UI, Database, Documentation, Notification, Architecture Review, Release

Future gaps (e.g. dedicated Infrastructure / Production Operations specialized templates) may be added later. Do **not** invent new specialized templates unless a separate approved task requests them.

### Relationship to older prompt docs

| Document | Role after ENG-STD-001 |
|----------|------------------------|
| **This file** | Mandatory universal Cursor execution standard |
| [TASK_TEMPLATES/](./TASK_TEMPLATES/) | Category-specific workflows |
| [../PROMPT_TEMPLATE.md](../PROMPT_TEMPLATE.md) | Historical metadata / prompt-format reference (Sprint 4); does **not** override this master |
| [../PROMPTS/](../PROMPTS/) | Older parallel copies; prefer `ENGINEERING_FRAMEWORK/TASK_TEMPLATES/` as authoritative |

`docs/CURSOR_ENGINEERING_STANDARD.md` was referenced in some story prompts but was **never created**. This file is the canonical replacement location under the Engineering Framework.

---

## Usage modes

### Mode A — Repository-aware Cursor task *(preferred)*

Use for normal IMMIFIN repository work when Cursor can read the repo.

1. Instruct Cursor to **read this master template first**
2. Instruct Cursor to also follow the applicable specialized template
3. Provide **only story-specific** placeholders / sections

Example short prompt header:

```text
This story inherits all requirements from:

docs/ENGINEERING_FRAMEWORK/IMMIFIN_CURSOR_TASK_TEMPLATE.md

Also follow:

docs/ENGINEERING_FRAMEWORK/TASK_TEMPLATES/{{SPECIALIZED_TEMPLATE}}.md
docs/ENGINEERING_FRAMEWORK/AI_AGENT_GUIDELINES.md

Then apply only the story-specific sections below.
```

### Mode B — Fully self-contained task

Use for production operations, high-risk changes, or contexts where Cursor may not reliably read repository documentation.

1. Copy the **Master Template Body** below into the Cursor prompt
2. Fill every placeholder
3. Still reference governing docs by path when available

---

## Conditional section rules

Some sections are **conditional**. The task author must either:

1. Populate the section with explicit requirements, **or**
2. Mark it: `NOT APPLICABLE — {{REASON}}`

Do **not** silently omit a conditional section when relevance could be ambiguous.

Conditional areas include:

- Development server stop/restart
- Cloudflare development tunnel stop/restart
- Localhost route validation
- Authenticated route validation
- UI / accessibility validation
- Database migration validation
- Stripe / payment validation
- Email delivery validation
- Production health validation
- Secret configuration
- Production deployment

---

## Placeholder convention

Use double curly braces. Every placeholder below includes a short instruction.

Examples: `{{STORY_ID}}`, `{{OBJECTIVE}}`, `{{IMPLEMENTATION_SCOPE}}`

---

################################################################################
# MASTER TEMPLATE BODY — copy from here for Mode B / fill for Mode A
################################################################################

################################################################################
IMMIFIN — CURSOR ENGINEERING STANDARD
################################################################################

Project:
{{PROJECT_NAME}}
<!-- Instruction: Usually IMMIFIN -->

Sprint:
{{SPRINT_NAME}}
<!-- Instruction: Sprint name or Engineering Governance -->

Story ID:
{{STORY_ID}}
<!-- Instruction: Unique story id, e.g. S9-FEAT-001 -->

Title:
{{STORY_TITLE}}
<!-- Instruction: Short human-readable title -->

Priority:
{{PRIORITY}}
<!-- Instruction: P0 | P1 | P2 | P3 -->

Type:
{{TASK_TYPE}}
<!-- Instruction: e.g. Architecture Foundation | Backend | UI | Documentation | Production Ops -->

################################################################################
OBJECTIVE
################################################################################

{{OBJECTIVE}}
<!-- Instruction: What problem is solved, why it matters, and the bounded outcome. -->

This story inherits all universal requirements from:

docs/ENGINEERING_FRAMEWORK/IMMIFIN_CURSOR_TASK_TEMPLATE.md

Task-specific prompts may add stricter requirements.
Task-specific prompts must **not** weaken this master standard.

################################################################################
SOURCE-OF-TRUTH RULE
################################################################################

The current IMMIFIN repository and its governing documentation are the source of truth.

Before implementation, read the applicable documents. At minimum consider:

* docs/PROJECT_GUIDE.md
* docs/CURRENT_PROJECT_STATE.md
* docs/SYSTEM_ARCHITECTURE.md
* docs/ENGINEERING_PLAYBOOK.md
* docs/AI_DEVELOPMENT_CHARTER.md
* docs/ENGINEERING_FRAMEWORK/README.md
* docs/ENGINEERING_FRAMEWORK/AI_AGENT_GUIDELINES.md
* the applicable specialized template under docs/ENGINEERING_FRAMEWORK/TASK_TEMPLATES/

Also read domain design docs required by the story.

{{TASK_SPECIFIC_SOURCE_OF_TRUTH}}
<!-- Instruction: List story-specific docs, modules, ADRs, and prior story artifacts to inspect. -->

Rules:

* Use repository implementation as source of truth when docs and code differ, unless a governing document explicitly defines otherwise
* Do not assume file names, functions, schema, types, table names, or architecture
* Report missing governing documents
* Do not invent replacement documents automatically
* Use the appropriate Engineering Framework specialized task template
* Do not create a competing engineering framework

################################################################################
PRE-CHANGE SAFETY CHECK
################################################################################

1. Run:

```text
git status --short --branch
git diff --stat
```

2. Record:

* Current branch
* Modified files
* Staged files
* Untracked files

3. Preserve all pre-existing work.

Do **not**:

* Reset
* Restore
* Clean
* Delete
* Rename
* Stage
* Overwrite

any unrelated file.

4. Development services — **conditional**:

{{DEV_SERVICE_HANDLING}}
<!-- Instruction: For runtime/code changes: identify Next.js + cloudflared, stop only IMMIFIN-related processes before edits, restart for validation. For documentation-only: NOT APPLICABLE — no runtime files changed (unless a governing standard explicitly requires otherwise). -->

Rules:

* Identify the current Next.js process and port
* Identify the current Cloudflare development tunnel process
* Stop only when required by the task type or governing standard
* Do not terminate unrelated Node.js, PowerShell, terminal, or Cloudflare processes
* After an intentional stop, restart for validation when required
* Do **not** misreport an intentionally stopped process as an application crash
* Report the replacement process and current port accurately

################################################################################
MANDATORY DISCOVERY
################################################################################

Inspect before creating or modifying files.

Universal rules:

* Discover authoritative services, types, and conventions first
* Prefer reuse over duplication
* Confirm client/server boundaries
* Confirm whether database, Stripe, notifications, or auth boundaries are in scope

{{MANDATORY_DISCOVERY}}
<!-- Instruction: Story-specific discovery checklist (files, services, types, conflicting authorities). -->

################################################################################
DISCOVERY DECISION
################################################################################

Proceed only when prerequisites are met and the approved source of truth is clear.

STOP implementation and report when:

* Required data or types exist only through unverified assumptions
* Two authorities conflict and the winner cannot be determined
* A schema/migration is required but not approved
* The task would duplicate important business logic
* Scope would expand beyond the approved story
* A public API/UI would be required only to test an out-of-scope design

{{DISCOVERY_DECISION_RULES}}
<!-- Instruction: Story-specific proceed/stop gates. -->

Do not guess.
Do not create speculative architecture.
Do not create a partial implementation based on unverified assumptions.

################################################################################
ARCHITECTURE RULES
################################################################################

Universal architecture rules:

* Reuse authoritative services
* Avoid duplicate business logic
* Preserve client/server boundaries (`server-only` where established)
* Avoid circular dependencies
* Avoid creating a second authority for an existing domain
* Keep abstractions proportional to current scope
* Prefer composition of existing layers over new parallel stacks

{{ARCHITECTURE_RULES}}
<!-- Instruction: Story-specific architecture constraints and allowed composition paths. -->

################################################################################
IMPLEMENTATION SCOPE
################################################################################

{{IMPLEMENTATION_SCOPE}}
<!-- Instruction: Exact files/modules to create or modify, naming, and minimal structure. -->

Implement only the approved story.
Do not begin the next story.
Do not add speculative architecture.
Do not perform opportunistic refactors.
Do not add dependencies without demonstrated need.

################################################################################
EXPLICIT OUT-OF-SCOPE
################################################################################

{{OUT_OF_SCOPE}}
<!-- Instruction: Explicit exclusions for this story. -->

################################################################################
SECURITY AND PRIVACY
################################################################################

Universal rules:

* Do not expose secrets
* Do not log private or sensitive data
* Do not print secret values
* Do not put secrets into source code, documentation, shell scripts, or Git
* Do not expose server-only modules to Client Components
* Do not weaken authentication or authorization
* Do not claim security verification without inspection

{{TASK_SPECIFIC_SECURITY}}
<!-- Instruction: Story-specific privacy/security constraints, or NOT APPLICABLE — {{REASON}}. -->

################################################################################
DATABASE SAFETY
################################################################################

Conditional.

Default when not in scope:

* Do not create migrations, tables, columns, functions, triggers, policies, or RPCs
* Do not query Supabase directly from layers that must compose existing services

{{DATABASE_SCOPE}}
<!-- Instruction: Explicit DB permissions for this story, or NOT APPLICABLE — {{REASON}}. -->

################################################################################
SUBSCRIPTION AND BILLING SAFETY
################################################################################

Conditional.

Default when not in scope:

* Do not modify Free / Pro / Power capabilities
* Do not modify Stripe, Checkout, webhooks, pricing, or Dev Subscription Mode
* Do not create a second subscription authority
* Do not grant capabilities from UI or ad-hoc checks

{{SUBSCRIPTION_BILLING_SCOPE}}
<!-- Instruction: Explicit billing/subscription permissions, or NOT APPLICABLE — {{REASON}}. -->

################################################################################
DOCUMENTATION-AS-CODE
################################################################################

Documentation is part of the story.

Universal rules:

* Update only the minimum relevant files
* Do not rewrite unrelated historical sections
* Do not mark a broader platform complete
* Document deferred functionality explicitly
* Keep implementation and documentation aligned
* Follow existing IMMIFIN documentation format

{{DOCUMENTATION_REQUIREMENTS}}
<!-- Instruction: Exact docs to create/update for this story. -->

################################################################################
TESTING
################################################################################

Universal rules:

* Use the existing repository testing / verification approach
* Do not install a new test framework without approval
* Test the story-specific happy path
* Test incomplete and failure states where relevant
* Preserve operational errors (do not reclassify infra failures as incomplete data)
* Do not fabricate test results
* Report exact commands and outcomes
* Separate pre-existing warnings from new failures

{{TEST_REQUIREMENTS}}
<!-- Instruction: Exact tests, verify scripts, or manual checks for this story. -->

################################################################################
STATIC VALIDATION
################################################################################

Run repository-approved commands where scripts exist:

* TypeScript validation (`npx tsc --noEmit` when applicable)
* Lint (`npm run lint` when applicable)
* Existing unit/integration/verify scripts when applicable
* Production build (`npm run build` when applicable)

Do not suppress errors.
Do not use flags that bypass validation.
Do not modify unrelated files solely to remove pre-existing warnings.

Documentation-only exemption is allowed only when:

* No source or runtime configuration file changed, **and**
* Project standards allow skipping build for docs-only work

If skipped, report exactly:

`NOT RUN — documentation-only task; no runtime files changed`

Do not claim a pass for commands that were not executed.

################################################################################
LOCALHOST VALIDATION
################################################################################

Conditional.

{{LOCALHOST_VALIDATION}}
<!-- Instruction: Routes/behaviors to verify, or NOT APPLICABLE — {{REASON}}. -->

Rules when applicable:

* Restart the IMMIFIN development server using the approved project command
* Confirm the expected localhost port (typically `http://localhost:3000`)
* Verify representative routes and that existing behavior remains intact
* Confirm no unauthorized UI/API surface was introduced
* For authenticated routes: use an existing safe session when available; otherwise report signed-out Clerk behavior honestly
* Do not claim authenticated verification when it was not performed
* Keep localhost results separate from tunnel results

################################################################################
CLOUDFLARE DEVELOPMENT TUNNEL VALIDATION
################################################################################

Conditional.

{{TUNNEL_VALIDATION}}
<!-- Instruction: Tunnel checks required, or NOT APPLICABLE — {{REASON}}. -->

Rules when applicable:

* Use the existing approved IMMIFIN Cloudflare development tunnel only
* Do not create a new tunnel, rename a tunnel, change DNS, or change production routing
* Confirm the tunnel points at the correct local port when started locally
* Verify representative public routes through the existing development URL when available
* If tunnel credentials are missing, report the exact limitation; do not expand into a tunnel-repair task unless that is the story
* Keep tunnel results separate from localhost results

################################################################################
PRODUCTION VALIDATION
################################################################################

Optional — enable only for explicitly approved production tasks.

{{PRODUCTION_VALIDATION}}
<!-- Instruction: Production checks, or NOT APPLICABLE — not an approved production task. -->

################################################################################
FINAL DIFF REVIEW
################################################################################

Before completion, run:

```text
git status --short
git diff --stat
git diff
```

Confirm:

* Only approved task files changed
* Pre-existing unrelated changes remain untouched
* No temporary or backup files remain
* No unauthorized dependencies, config, DB, Stripe, notification, or capability changes
* Documentation matches implementation
* No files are staged unless explicitly authorized

Report pre-existing and task-owned changes separately.

################################################################################
GIT AND RELEASE RESTRICTIONS
################################################################################

Default:

* Do not stage
* Do not commit
* Do not push
* Do not create a pull request
* Do not deploy
* Do not run a release workflow
* Do not change production or Cloudflare configuration
* Do not create secrets

{{AUTHORIZED_GIT_OR_RELEASE_ACTIONS}}
<!-- Instruction: Explicit authorizations (if any), otherwise: NONE — leave changes for Product Owner review. -->

################################################################################
DELIVERABLES
################################################################################

Return a structured completion report including at least:

1. Completion status — `COMPLETED` | `PARTIALLY COMPLETED` | `BLOCKED DURING DISCOVERY`
2. Current branch
3. Initial Git status
4. Pre-existing changes preserved
5. Governing documents reviewed
6. Missing governing documents
7. Engineering Framework template used
8. Development services stopped or not applicable
9. Discovery findings
10. Discovery decision
11. Architecture implemented
12. Files created
13. Files modified
14. Scope confirmation
15. Security review
16. Database review
17. Subscription and billing review
18. Documentation updates
19. Test results
20. TypeScript result
21. Lint result
22. Build result
23. Localhost result or not applicable
24. Cloudflare tunnel result or not applicable
25. Production validation result or not applicable
26. Final Git status
27. Final diff summary
28. Blockers or unresolved issues
29. Exact recommended next baby step
30. Product Owner review readiness — `READY FOR PRODUCT OWNER REVIEW` or `NOT READY`

{{TASK_SPECIFIC_DELIVERABLES}}
<!-- Instruction: Extra report items required by this story. -->

################################################################################
STOP CONDITIONS
################################################################################

{{STOP_CONDITIONS}}
<!-- Instruction: Exact stop boundary for this story. -->

Universal stop defaults:

* Stop after the approved story, documentation, validation, and final diff review are complete
* Do not begin the next story
* Do not stage/commit/push/deploy unless explicitly authorized

################################################################################
PRODUCT OWNER REVIEW DECISION
################################################################################

Choose exactly one:

READY FOR PRODUCT OWNER REVIEW

or

NOT READY

################################################################################
# END MASTER TEMPLATE BODY
################################################################################

---

## Small usage example (not story-binding)

The following shows Mode A shape only. It is **not** a Sprint-specific standard.

```text
This story inherits all requirements from:

docs/ENGINEERING_FRAMEWORK/IMMIFIN_CURSOR_TASK_TEMPLATE.md

Also follow:

docs/ENGINEERING_FRAMEWORK/TASK_TEMPLATES/BACKEND_TASK_TEMPLATE.md
docs/ENGINEERING_FRAMEWORK/AI_AGENT_GUIDELINES.md

Project: IMMIFIN
Sprint: {{SPRINT_NAME}}
Story ID: {{STORY_ID}}
Title: {{STORY_TITLE}}
Priority: P0
Type: Backend

OBJECTIVE:
{{OBJECTIVE}}

TASK_SPECIFIC_SOURCE_OF_TRUTH:
{{TASK_SPECIFIC_SOURCE_OF_TRUTH}}

MANDATORY_DISCOVERY:
{{MANDATORY_DISCOVERY}}

IMPLEMENTATION_SCOPE:
{{IMPLEMENTATION_SCOPE}}

OUT_OF_SCOPE:
{{OUT_OF_SCOPE}}

TEST_REQUIREMENTS:
{{TEST_REQUIREMENTS}}

LOCALHOST_VALIDATION:
{{LOCALHOST_VALIDATION}}

TUNNEL_VALIDATION:
NOT APPLICABLE — no auth/webhook/runtime tunnel dependency

AUTHORIZED_GIT_OR_RELEASE_ACTIONS:
NONE — leave changes for Product Owner review

STOP_CONDITIONS:
{{STOP_CONDITIONS}}
```

---

## Revision history

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-25 | ENG-STD-001 | Initial master Cursor task template — universal execution baseline |
