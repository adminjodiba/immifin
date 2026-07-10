# IMMIFIN Engineering Framework

| Field | Value |
|-------|-------|
| **Version** | v1.1 |
| **Task ID** | S6-DOC-009 (Architecture Review template) |
| **Last Updated** | 2026-07-10 |
| **Status** | Permanent foundation — evolve in future sprints |
| **Owner** | Technical Architecture (CTO) |

**Related:** [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md) · [../ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md) · [../AI_DEVELOPMENT_CHARTER.md](../AI_DEVELOPMENT_CHARTER.md) · [../PROMPT_TEMPLATE.md](../PROMPT_TEMPLATE.md) · [../PROJECT_GUIDE.md](../PROJECT_GUIDE.md)

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

### AI agents and human engineers

1. Read [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md)
2. Select the correct **task template** (table below)
3. Write a short task prompt that **references** the template path
4. Fill only task-specific fields (ID, objective, approved files, requirements, out of scope, tests)
5. Execute the template’s development workflow
6. Return a Task Completion Report

### Usage example

```text
Read and follow:

docs/ENGINEERING_FRAMEWORK/TASK_TEMPLATES/NOTIFICATION_TASK_TEMPLATE.md

Also follow:

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

## When to select each template

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
