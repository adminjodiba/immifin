# IMMIFIN Engineering Framework

| Field | Value |
|-------|-------|
| **Version** | v1.2 |
| **Task ID** | ENG-STD-001 |
| **Last Updated** | 2026-07-25 |
| **Status** | Permanent foundation — evolve in future sprints |
| **Owner** | Technical Architecture (CTO) |

**Related:** [IMMIFIN_CURSOR_TASK_TEMPLATE.md](./IMMIFIN_CURSOR_TASK_TEMPLATE.md) · [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md) · [../ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md) · [../AI_DEVELOPMENT_CHARTER.md](../AI_DEVELOPMENT_CHARTER.md) · [../PROMPT_TEMPLATE.md](../PROMPT_TEMPLATE.md) · [../PROJECT_GUIDE.md](../PROJECT_GUIDE.md)

---

## Purpose

This is IMMIFIN’s permanent **AI-assisted Engineering Framework**.

It standardizes how AI agents and human engineers **review, design, implement, test, document, and report** work — without repeating hundreds of lines of process in every Cursor prompt.

| Goal | Outcome |
|------|---------|
| Consistent process | Same workflow and gates every task |
| Shorter prompts | Task prompts reference a template + fill scope |
| Safer delivery | Localhost → Git → Cloudflare discipline |
| Less drift | Docs remain source of truth; framework does not invent architecture |

**This is not a temporary prompt folder.** It is a permanent operating framework (Version 1 foundation).

---

## What this framework does *not* do

- It does **not** override approved architecture, ADRs, or sprint scope
- It does **not** replace domain design docs (e.g. [NOTIFICATION_DESIGN.md](../NOTIFICATION_DESIGN.md))
- It does **not** replace [ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md) or [AI_DEVELOPMENT_CHARTER.md](../AI_DEVELOPMENT_CHARTER.md)
- If conflict arises: **Charter / Playbook / domain design docs win** until this framework is updated

---

## How to use

### Template hierarchy *(mandatory)*

```text
IMMIFIN Master Cursor Task Template
        ↓
Applicable Specialized Task Template
        ↓
Story-Specific Cursor Prompt
```

| Layer | Document |
|-------|----------|
| **Master (universal)** | [IMMIFIN_CURSOR_TASK_TEMPLATE.md](./IMMIFIN_CURSOR_TASK_TEMPLATE.md) |
| **Specialized** | [TASK_TEMPLATES/](./TASK_TEMPLATES/) |
| **Story prompt** | Story-specific objective, discovery, scope, tests, deliverables, stop conditions |

Future Cursor prompts **must not weaken** the master standard. They may only add stricter story-specific requirements.

### Usage modes

| Mode | When | How |
|------|------|-----|
| **A — Repository-aware** *(preferred)* | Normal IMMIFIN repo work | Instruct Cursor to read the master template + specialized template; story prompt contains only story-specific sections |
| **B — Fully self-contained** | Production ops / high-risk / Cursor may not read repo docs | Copy the Master Template Body into the prompt and fill placeholders |

### AI agents and human engineers

1. Read [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md)
2. Read [IMMIFIN_CURSOR_TASK_TEMPLATE.md](./IMMIFIN_CURSOR_TASK_TEMPLATE.md)
3. Select the correct **specialized task template** (table below)
4. Write a short task prompt (Mode A) that references the master + specialized template
5. Fill only story-specific fields
6. Execute the workflow (preserve pre-existing work; localhost before commit; Product Owner review before commit/push unless explicitly authorized)
7. Return a Task Completion Report

### Usage example (Mode A)

```text
This story inherits all requirements from:

docs/ENGINEERING_FRAMEWORK/IMMIFIN_CURSOR_TASK_TEMPLATE.md

Also follow:

docs/ENGINEERING_FRAMEWORK/TASK_TEMPLATES/NOTIFICATION_TASK_TEMPLATE.md
docs/ENGINEERING_FRAMEWORK/AI_AGENT_GUIDELINES.md

Task ID:
S6-EMAIL-001A.3

Task Name:
Implement provider type definitions

Objective:
Implement provider type definitions for the Notification Platform.

Approved Files:
lib/notifications/types/provider-types.ts

Out of Scope:
Providers, services, Resend calls, templates, API routes
```

---

## When to select each specialized template

| Template | Select when |
|----------|-------------|
| [ARCHITECTURE_REVIEW_TEMPLATE.md](./TASK_TEMPLATES/ARCHITECTURE_REVIEW_TEMPLATE.md) | Architecture-first reviews — validate design, debt, security, Workers fit; **no implementation by default** |
| [NOTIFICATION_TASK_TEMPLATE.md](./TASK_TEMPLATES/NOTIFICATION_TASK_TEMPLATE.md) | Email, SMS, WhatsApp, Push, In-App, campaigns, history, prefs, Admin Notification Center |
| [BACKEND_TASK_TEMPLATE.md](./TASK_TEMPLATES/BACKEND_TASK_TEMPLATE.md) | API routes, server services, integrations (not notification-primary) |
| [UI_TASK_TEMPLATE.md](./TASK_TEMPLATES/UI_TASK_TEMPLATE.md) | Pages, components, Design System 2.0, UX |
| [DATABASE_TASK_TEMPLATE.md](./TASK_TEMPLATES/DATABASE_TASK_TEMPLATE.md) | Supabase schema, migrations, RLS, retention |
| [DOCUMENTATION_TASK_TEMPLATE.md](./TASK_TEMPLATES/DOCUMENTATION_TASK_TEMPLATE.md) | Docs-only (no application code) |
| [RELEASE_TASK_TEMPLATE.md](./TASK_TEMPLATES/RELEASE_TASK_TEMPLATE.md) | Commit, push, deploy, production smoke, release notes |

Examples: [EXAMPLES/](./EXAMPLES/).

Future specialized gaps (e.g. Infrastructure / Production Operations) may be added later — do not invent them ad hoc inside story prompts.

---

## Evolving templates

- Prefer **extending** a template over inventing a new category
- Do **not** duplicate Playbook/Charter text into every template — link instead
- Domain rules stay in domain docs (Notification Design, Business Model, etc.)
- Bump framework version when structure changes materially

---

## Folder structure

```text
docs/ENGINEERING_FRAMEWORK/
├── README.md
├── AI_AGENT_GUIDELINES.md
├── IMMIFIN_CURSOR_TASK_TEMPLATE.md   ← master Cursor execution standard
├── TASK_TEMPLATES/
│   ├── ARCHITECTURE_REVIEW_TEMPLATE.md
│   ├── NOTIFICATION_TASK_TEMPLATE.md
│   ├── BACKEND_TASK_TEMPLATE.md
│   ├── UI_TASK_TEMPLATE.md
│   ├── DATABASE_TASK_TEMPLATE.md
│   ├── DOCUMENTATION_TASK_TEMPLATE.md
│   └── RELEASE_TASK_TEMPLATE.md
└── EXAMPLES/
    ├── NOTIFICATION_TASK_EXAMPLE.md
    ├── BACKEND_TASK_EXAMPLE.md
    ├── UI_TASK_EXAMPLE.md
    └── RELEASE_TASK_EXAMPLE.md
```

---

## Revision history

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-10 | S6-DOC-008 | Initial permanent Engineering Framework foundation |
| v1.1 | 2026-07-10 | S6-DOC-009 | Add Architecture Review task template |
| v1.2 | 2026-07-25 | ENG-STD-001 | Add Master Cursor Task Template + hierarchy / Mode A–B usage |
