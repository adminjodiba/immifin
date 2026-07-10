# Documentation Task Template

| Field | Value |
|-------|-------|
| **Version** | v1.0 |
| **Use for** | Docs-only work (design, handoffs, audits, prompt framework) |
| **Status** | Framework v1 |

**Governed by:** [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md)

---

## Project Context

IMMIFIN treats documentation as the **source of truth**. Docs tasks must match existing style, cross-link related docs, and **not** change application code unless the task explicitly expands into implementation.

---

## Prompt structure (fill placeholders)

### Task ID
`{{TASK_ID}}`

### Objective
`{{OBJECTIVE}}`

### Mandatory Reading
1. [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md)  
2. [../CURRENT_PROJECT_STATE.md](../CURRENT_PROJECT_STATE.md)  
3. Docs being extended or replaced  
4. `{{ADDITIONAL_READING}}`

### Development Workflow
1. Review related docs  
2. Create/update markdown only  
3. Cross-reference as needed  
4. No app code, no dependency installs, no deploy  
5. Summarize; **do not commit unless instructed**  
6. Localhost/build usually **not required** for pure docs

### Requirements
`{{REQUIREMENTS}}`

### Out of Scope
`{{OUT_OF_SCOPE}}`  
Default: no application code, no env secrets, no deploy.

### Acceptance Criteria
`{{ACCEPTANCE_CRITERIA}}`

### Localhost Test Plan
Usually: **N/A (documentation only)**. Note if any doc links need manual spot-check.

### Completion Report
Files created/updated · Cross-refs · Confirmation no app code changed · Git status · Commit status

---

## Copy-paste prompt shell

```text
################################################################################
IMMIFIN DOCUMENTATION TASK
################################################################################
Task ID: {{TASK_ID}}
Task Name: {{TASK_NAME}}
Follow: docs/PROMPTS/DOCUMENTATION_TASK_TEMPLATE.md

OBJECTIVE
{{OBJECTIVE}}

FILES
{{FILES}}

REQUIREMENTS
{{REQUIREMENTS}}

OUT OF SCOPE
No application code. {{OUT_OF_SCOPE}}

ACCEPTANCE CRITERIA
{{ACCEPTANCE_CRITERIA}}

Do not commit unless instructed.
################################################################################
```

---

## Revision history

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-10 | Initial Documentation Task Template |
