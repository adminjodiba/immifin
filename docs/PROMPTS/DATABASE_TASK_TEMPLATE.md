# Database Task Template

| Field | Value |
|-------|-------|
| **Version** | v1.0 |
| **Use for** | Supabase schema, migrations, RLS, data model changes |
| **Status** | Framework v1 |

**Governed by:** [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md) · [../SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md)

---

## Project Context

IMMIFIN uses **Supabase (PostgreSQL)** for profiles and app data. Google Sheets remain source of truth for Visa Bulletin / stamping CSVs (ADR-002) — do not move bulletin source-of-truth into Supabase without an explicit ADR change. Schema changes require care for RLS, Clerk linkage, and data retention.

---

## Prompt structure (fill placeholders)

### Task ID
`{{TASK_ID}}`

### Objective
`{{OBJECTIVE}}`

### Mandatory Reading
1. [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md)  
2. [../SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md)  
3. [../auth/PHASE1.md](../auth/PHASE1.md) (if roles/profiles)  
4. Existing migrations / `lib/supabase/*`  
5. `{{ADDITIONAL_READING}}`

### Development Workflow
Stop server → review schema + docs → implement migration/types carefully → restart → localhost verify affected flows → document migration steps → **no commit unless asked**. Never apply destructive production migrations without explicit approval.

### Requirements
`{{REQUIREMENTS}}`

### Out of Scope
`{{OUT_OF_SCOPE}}`

### Acceptance Criteria
`{{ACCEPTANCE_CRITERIA}}`

### Localhost Test Plan
`{{LOCALHOST_TEST_PLAN}}`

### Completion Report
Files/migrations modified · Schema decisions · Testing · Localhost · Docs · Rollback notes · Git · Commit status

---

## Copy-paste prompt shell

```text
################################################################################
IMMIFIN DATABASE TASK
################################################################################
Task ID: {{TASK_ID}}
Task Name: {{TASK_NAME}}
Follow: docs/PROMPTS/DATABASE_TASK_TEMPLATE.md + docs/PROMPTS/AI_AGENT_GUIDELINES.md

OBJECTIVE
{{OBJECTIVE}}

FILES / MIGRATIONS
{{FILES}}

REQUIREMENTS
{{REQUIREMENTS}}

OUT OF SCOPE
{{OUT_OF_SCOPE}}

ACCEPTANCE CRITERIA
{{ACCEPTANCE_CRITERIA}}

LOCALHOST TEST PLAN
{{LOCALHOST_TEST_PLAN}}

Do not commit, push, or run production migrations unless instructed.
################################################################################
```

---

## Revision history

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-10 | Initial Database Task Template |
