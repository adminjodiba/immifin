# IMMIFIN AI Engineering Prompt Framework

| Field | Value |
|-------|-------|
| **Version** | v1.0 |
| **Last Updated** | 2026-07-10 |
| **Status** | Foundation — evolve in future sprints |
| **Owner** | Technical Architecture (CTO) |

**Related:** [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md) · [../AI_DEVELOPMENT_CHARTER.md](../AI_DEVELOPMENT_CHARTER.md) · [../ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md) · [../PROMPT_TEMPLATE.md](../PROMPT_TEMPLATE.md)

---

## Purpose

This folder is the **AI Engineering Prompt Framework** for IMMIFIN.

It standardizes how AI agents and engineers receive implementation tasks so we do **not** repeat hundreds of lines of workflow and governance in every Cursor prompt.

| Goal | Outcome |
|------|---------|
| Less prompt duplication | Task prompts stay short and scoped |
| Consistent engineering process | Same workflow, gates, and principles every time |
| Safer delivery | Localhost → Git → Cloudflare discipline |
| Faster onboarding | New agents read guidelines + pick a template |

**Version 1** establishes the framework. Templates will deepen over future sprints.

---

## How to use (AI agents & engineers)

1. Read [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md)
2. Pick the **correct template** for the task category (table below)
3. Copy that template’s prompt block / structure into the Cursor task
4. Fill placeholders (Task ID, Objective, Files, Requirements, Out of Scope, etc.)
5. Reference this framework — **do not** paste the full guidelines into every prompt
6. Execute per [ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md) and the template workflow

Global product/architecture truth remains in project docs (`CURRENT_PROJECT_STATE`, `NOTIFICATION_DESIGN`, etc.) — not in these templates.

---

## When to use each template

| Template | Use when |
|----------|----------|
| [NOTIFICATION_TASK_TEMPLATE.md](./NOTIFICATION_TASK_TEMPLATE.md) | Email, SMS, WhatsApp, Push, In-App, campaigns, notification history, prefs, Admin Notification Center |
| [BACKEND_TASK_TEMPLATE.md](./BACKEND_TASK_TEMPLATE.md) | API routes, services, Workers-safe server logic, integrations (non-notification-primary) |
| [UI_TASK_TEMPLATE.md](./UI_TASK_TEMPLATE.md) | Pages, components, Design System 2.0, UX polish |
| [DATABASE_TASK_TEMPLATE.md](./DATABASE_TASK_TEMPLATE.md) | Supabase schema, migrations, RLS, data model changes |
| [DOCUMENTATION_TASK_TEMPLATE.md](./DOCUMENTATION_TASK_TEMPLATE.md) | Docs-only tasks (design, handoffs, audits, prompt framework) |
| [RELEASE_TASK_TEMPLATE.md](./RELEASE_TASK_TEMPLATE.md) | Commit, push, deploy, production smoke, release notes |

Examples: [EXAMPLES/](./EXAMPLES/).

---

## How to create a new template

1. Copy an existing template closest to the new category
2. Keep the standard sections: Project Context, Task ID, Objective, Mandatory Reading, Development Workflow, Requirements, Out of Scope, Acceptance Criteria, Localhost Test Plan, Completion Report
3. Add category-specific principles only (do not duplicate AI Agent Guidelines)
4. Add one short example under `EXAMPLES/`
5. Link the new template from this README
6. Bump framework version note in revision history when the set of templates changes materially

---

## Relationship to other docs

| Document | Role |
|----------|------|
| [AI_DEVELOPMENT_CHARTER.md](../AI_DEVELOPMENT_CHARTER.md) | Constitution / governance |
| [PROMPT_TEMPLATE.md](../PROMPT_TEMPLATE.md) | Original general Cursor prompt format |
| **This framework** | Category-specific reusable task shells for day-to-day work |
| Domain design docs | Product/architecture source of truth (e.g. Notification Design) |

If this framework conflicts with the Charter or Playbook, **Charter / Playbook win** until this framework is updated.

---

## Folder structure

```text
docs/PROMPTS/
├── README.md
├── AI_AGENT_GUIDELINES.md
├── NOTIFICATION_TASK_TEMPLATE.md
├── BACKEND_TASK_TEMPLATE.md
├── UI_TASK_TEMPLATE.md
├── DATABASE_TASK_TEMPLATE.md
├── DOCUMENTATION_TASK_TEMPLATE.md
├── RELEASE_TASK_TEMPLATE.md
└── EXAMPLES/
    ├── Notification Example.md
    ├── Backend Example.md
    ├── UI Example.md
    └── Release Example.md
```

---

## Revision history

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-10 | Initial AI Engineering Prompt Framework foundation |
