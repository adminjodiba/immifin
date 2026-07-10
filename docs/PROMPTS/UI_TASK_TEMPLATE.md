# UI Task Template

| Field | Value |
|-------|-------|
| **Version** | v1.0 |
| **Use for** | Pages, components, Design System 2.0, UX polish |
| **Status** | Framework v1 |

**Governed by:** [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md) · Design System 2.0 docs under `docs/design-system/`

---

## Project Context

IMMIFIN UI must feel like a polished commercial SaaS product. Prefer `WorkspacePageShell` / existing DS 2.0 patterns. Preserve Free/Pro/Power capability UX (gates, Premium Feature Discovery). Do not invent a parallel design language.

---

## Prompt structure (fill placeholders)

### Task ID
`{{TASK_ID}}`

### Objective
`{{OBJECTIVE}}`

### Mandatory Reading
1. [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md)  
2. [../CURRENT_PROJECT_STATE.md](../CURRENT_PROJECT_STATE.md)  
3. Relevant `docs/design-system/*` page record  
4. Existing components/pages in scope  
5. `{{ADDITIONAL_READING}}`

### Development Workflow
Stop server → review UI + DS docs → implement scope → restart → verify desktop/mobile localhost → lint → no commit unless asked.

### Requirements
`{{REQUIREMENTS}}`

### Out of Scope
`{{OUT_OF_SCOPE}}`

### Acceptance Criteria
`{{ACCEPTANCE_CRITERIA}}`

### Localhost Test Plan
`{{LOCALHOST_TEST_PLAN}}`  
Include: target route(s), desktop + mobile smoke, auth/gated states if relevant.

### Completion Report
Files modified/created · UX/architecture notes · Testing · Localhost · Docs · Limitations · Git · Commit status

---

## Copy-paste prompt shell

```text
################################################################################
IMMIFIN UI TASK
################################################################################
Task ID: {{TASK_ID}}
Task Name: {{TASK_NAME}}
Follow: docs/PROMPTS/UI_TASK_TEMPLATE.md + docs/PROMPTS/AI_AGENT_GUIDELINES.md

OBJECTIVE
{{OBJECTIVE}}

FILES
{{FILES}}

REQUIREMENTS
{{REQUIREMENTS}}

OUT OF SCOPE
{{OUT_OF_SCOPE}}

ACCEPTANCE CRITERIA
{{ACCEPTANCE_CRITERIA}}

LOCALHOST TEST PLAN
{{LOCALHOST_TEST_PLAN}}

Do not commit or push unless instructed.
################################################################################
```

---

## Revision history

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-10 | Initial UI Task Template |
