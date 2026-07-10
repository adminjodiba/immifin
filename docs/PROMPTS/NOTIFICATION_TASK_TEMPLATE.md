# Notification Task Template

| Field | Value |
|-------|-------|
| **Title** | IMMIFIN Notification Platform Task Template |
| **Version** | v1.0 |
| **Sprint** | Sprint 6+ |
| **Task ID** | S6-DOC-008 |
| **Last Updated** | 2026-07-10 |
| **Owner** | Technical Architecture (CTO) |
| **Status** | Canonical — use for every Notification Platform implementation task |

**Related:** [README.md](./README.md) · [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md) · [NOTIFICATION_DESIGN.md](../NOTIFICATION_DESIGN.md) · [PROMPT_TEMPLATE.md](../PROMPT_TEMPLATE.md) · [AI_DEVELOPMENT_CHARTER.md](../AI_DEVELOPMENT_CHARTER.md) · [ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md) · [CURSOR_ENGINEERING_STANDARD.md](../CURSOR_ENGINEERING_STANDARD.md)

> **How to use:** Part of the [AI Engineering Prompt Framework](./README.md). Copy the [Prompt Template](#prompt-template) section into a new Cursor task. Fill every placeholder. Do **not** restate [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md) in every prompt — reference it instead.

---

## Project Context

IMMIFIN is a commercial SaaS **Life Operating System for Immigrants**. The Notification Platform is **core infrastructure**, not a one-off email feature.

| Principle | Expectation |
|-----------|-------------|
| **Documentation is the source of truth** | Follow [NOTIFICATION_DESIGN.md](../NOTIFICATION_DESIGN.md) (architecture, Email Design, Email Design System, Provider Capability Matrix) |
| **Architecture before implementation** | Design and contracts first; no ad-hoc Resend calls from features |
| **Reuse existing architecture** | Extend `lib/notifications/` and existing admin/auth/capability patterns |
| **Minimize technical debt** | No temporary provider shortcuts that bypass the Notification Service |
| **Optimize for Cloudflare Workers** | OpenNext-compatible; no long-running sync fan-out; server-only secrets |
| **Think like a CTO / Lead Architect** | Provider independence, strong typing, clear scope boundaries, production safety |

This template remains valid beyond Sprint 6 (SMS, WhatsApp, Push, In-App, Admin Notification Center, campaigns).

---

## Mandatory Reading Order

Before implementing any Notification task:

1. [docs/NOTIFICATION_DESIGN.md](../NOTIFICATION_DESIGN.md)
2. [docs/CURRENT_PROJECT_STATE.md](../CURRENT_PROJECT_STATE.md)
3. [docs/PROJECT_STATUS.md](../PROJECT_STATUS.md)
4. [docs/SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md)
5. [docs/ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md)
6. [docs/AI_DEVELOPMENT_CHARTER.md](../AI_DEVELOPMENT_CHARTER.md)
7. [docs/CURSOR_ENGINEERING_STANDARD.md](../CURSOR_ENGINEERING_STANDARD.md)
8. **Review existing notification source code** under `lib/notifications/` (and related admin/API code) before modifying it

Task-specific docs (e.g. Email Design System subsections) may be added to the reading list in the filled prompt.

---

## Standard Development Workflow

Every Notification implementation must:

1. **Stop** the development server
2. **Review** documentation (mandatory reading order)
3. **Review** existing implementation under `lib/notifications/` and related modules
4. **Implement** only the approved scope
5. **Restart** the development server
6. **Verify** `http://localhost:3000`
7. **Verify** Cloudflare development tunnel when auth/webhooks/notification webhooks are in scope (`dev.immifin.com`)
8. **Run lint** (`npm run lint`)
9. **Run TypeScript validation** (project’s usual typecheck / `next build` type phase as applicable)
10. **Run production build** when appropriate (`npm run build`) — required before production deploy; optional for pure docs
11. **Summarize** changes (see Completion Report Standard)
12. **Do not commit or push** unless the user explicitly instructs

---

## Engineering Principles

| Principle | Rule |
|-----------|------|
| **Notification Service owns orchestration** | Eligibility, prefs, template selection, history hooks, provider dispatch |
| **Business code never calls providers directly** | No Resend/Twilio imports in features, calculators, bulletin pages, or UI |
| **Providers are replaceable** | Depend on interfaces; adapters only talk to vendor APIs |
| **Configuration is centralized** | Env/secrets via notification config — never scattered `process.env` in features |
| **Shared components only** | Email templates inherit Email Design System layout/CTA/footer |
| **Strong typing everywhere** | Use `NotificationType`, `NotificationChannel`, and typed send contracts |
| **Server-only secrets** | Never `NEXT_PUBLIC_*` for API keys; never log secret values |
| **Cloudflare compatible** | Prefer `fetch`; avoid Node-only APIs and unbounded Worker CPU |
| **No duplicated logic** | One send path, one identity/subject/CTA ownership model |
| **Composition over duplication** | Shared layout and provider adapters |
| **Future channels need minimal changes** | New channel = adapter + registry metadata — not a rewrite |

See also: Provider Capability Matrix and Email Design CTO recommendations inside [NOTIFICATION_DESIGN.md](../NOTIFICATION_DESIGN.md).

---

## Prompt Template

Copy from here. Replace all `{{PLACEHOLDER}}` values. Keep the reference to this template.

```text
################################################################################
IMMIFIN NOTIFICATION PLATFORM TASK
################################################################################

Project         : IMMIFIN
Version         : {{VERSION}}
Sprint          : {{SPRINT}}
Task ID         : {{TASK_ID}}
Task Name       : {{TASK_NAME}}
Feature Area    : Notification Platform
Task Type       : {{TASK_TYPE}}
Priority        : {{PRIORITY}}
Risk            : {{RISK}}
Status          : Ready for Implementation

################################################################################
GOVERNANCE
################################################################################

Follow docs/PROMPTS/NOTIFICATION_TASK_TEMPLATE.md for workflow and engineering
principles. Do not restate those sections unless this task overrides them.

Source of truth for product/architecture:
docs/NOTIFICATION_DESIGN.md

################################################################################
OBJECTIVE
################################################################################

{{OBJECTIVE}}

################################################################################
MANDATORY READING
################################################################################

1. docs/NOTIFICATION_DESIGN.md
2. docs/CURRENT_PROJECT_STATE.md
3. docs/PROJECT_STATUS.md
4. docs/SYSTEM_ARCHITECTURE.md
5. docs/ENGINEERING_PLAYBOOK.md
6. docs/AI_DEVELOPMENT_CHARTER.md
7. docs/CURSOR_ENGINEERING_STANDARD.md
8. Review existing code under lib/notifications/ (and related files listed below)
9. {{ADDITIONAL_READING}}

################################################################################
FILES TO MODIFY / CREATE
################################################################################

{{FILES_TO_MODIFY}}

################################################################################
REQUIREMENTS
################################################################################

{{REQUIREMENTS}}

################################################################################
OUT OF SCOPE
################################################################################

{{OUT_OF_SCOPE}}

Default out of scope unless explicitly listed in Requirements:
- Calling Resend/Twilio from business modules
- Unrelated Sprint 6 AI / Broadcast Platform work
- Stripe billing emails
- Auto-send on Visa Bulletin Force Sync
- Auto-archive of bulletin history
- Production deploy unless user requests it

################################################################################
ACCEPTANCE CRITERIA
################################################################################

{{ACCEPTANCE_CRITERIA}}

################################################################################
LOCALHOST TEST PLAN
################################################################################

{{LOCALHOST_TEST_PLAN}}

Minimum:
1. Stop → implement → restart dev server
2. http://localhost:3000 loads without errors
3. Exercise any new/changed notification paths listed above
4. Confirm no secrets logged
5. Tunnel check if webhooks/auth involved

################################################################################
COMPLETION REPORT
################################################################################

Use the Completion Report Standard in
docs/PROMPTS/NOTIFICATION_TASK_TEMPLATE.md

Do not commit or push unless explicitly instructed.

################################################################################
END TASK
################################################################################
```

### Placeholder guide

| Placeholder | Fill with |
|-------------|-----------|
| `{{VERSION}}` | e.g. `v0.5.x` |
| `{{SPRINT}}` | e.g. `Sprint 6` |
| `{{TASK_ID}}` | e.g. `S6-EMAIL-002` |
| `{{TASK_NAME}}` | Short human title |
| `{{TASK_TYPE}}` | Architecture / Feature / Bugfix / Docs / etc. |
| `{{PRIORITY}}` | High / Medium / Low |
| `{{RISK}}` | High / Medium / Low / None |
| `{{OBJECTIVE}}` | One clear outcome |
| `{{ADDITIONAL_READING}}` | Extra docs or `None` |
| `{{FILES_TO_MODIFY}}` | Explicit paths; prefer narrow lists |
| `{{REQUIREMENTS}}` | Numbered, testable requirements |
| `{{OUT_OF_SCOPE}}` | Explicit exclusions for this task |
| `{{ACCEPTANCE_CRITERIA}}` | Checklist of done |
| `{{LOCALHOST_TEST_PLAN}}` | Concrete verification steps |

---

## Completion Report Standard

Every Notification implementation should report:

| Item | Content |
|------|---------|
| **Files modified** | Paths changed |
| **Files created** | Paths added |
| **Architecture decisions** | Brief why (provider isolation, typing, Worker safety, etc.) |
| **Testing completed** | Lint / typecheck / self-check / build as applicable |
| **Localhost verification** | URL + result |
| **Documentation updated** | Which docs, if any |
| **Known limitations** | Honest gaps / follow-ups |
| **Git status** | Clean / unstaged summary |
| **Commit status** | Committed or not (default: not committed) |

---

## Future Notification Roadmap

The **source of truth** for phases, templates, channels, and milestones is:

**[docs/NOTIFICATION_DESIGN.md](../NOTIFICATION_DESIGN.md)**

Do **not** duplicate roadmap tables in this template. When a task advances a phase, update status boxes in `NOTIFICATION_DESIGN.md` as part of that task (if documentation is in scope).

Example task areas this template covers:

- Email infrastructure (Resend adapter, config, webhooks)
- React Email / Email Design System components
- Welcome and lifecycle emails
- Monthly Immigration Report
- Notification history
- Campaign management / Admin Notification Center
- Notification preferences enforcement
- SMS / WhatsApp / Push / In-App (future channels)

---

## Revision history

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-10 | Initial Notification Task Template for Sprint 6+ reusable Cursor prompts |
