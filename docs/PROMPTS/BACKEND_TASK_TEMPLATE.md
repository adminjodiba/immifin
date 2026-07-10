# Backend Task Template

| Field | Value |
|-------|-------|
| **Version** | v1.0 |
| **Use for** | API routes, server services, integrations (non-notification-primary) |
| **Status** | Framework v1 |

**Governed by:** [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md) · [../ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md)

> For Notification Platform work, prefer [NOTIFICATION_TASK_TEMPLATE.md](./NOTIFICATION_TASK_TEMPLATE.md).

---

## Project Context

IMMIFIN backend runs on **Next.js 15 + OpenNext Cloudflare Workers**. Prefer existing `lib/` services, `requireUser` / `requireAdmin`, and capability checks. Avoid Node-only APIs and long-running Worker requests.

---

## Prompt structure (fill placeholders)

### Task ID
`{{TASK_ID}}`

### Objective
`{{OBJECTIVE}}`

### Mandatory Reading
1. [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md)  
2. [../SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md)  
3. [../CURRENT_PROJECT_STATE.md](../CURRENT_PROJECT_STATE.md)  
4. [../ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md)  
5. Relevant existing `app/api/**` and `lib/**` code  
6. `{{ADDITIONAL_READING}}`

### Development Workflow
Follow [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md) standard workflow (stop server → implement → restart → localhost → lint/typecheck → no commit unless asked).

### Requirements
`{{REQUIREMENTS}}`

### Out of Scope
`{{OUT_OF_SCOPE}}`

### Acceptance Criteria
`{{ACCEPTANCE_CRITERIA}}`

### Localhost Test Plan
`{{LOCALHOST_TEST_PLAN}}`

### Completion Report
Files modified/created · Architecture decisions · Testing · Localhost · Docs · Limitations · Git status · Commit status

---

## Copy-paste prompt shell

```text
################################################################################
IMMIFIN BACKEND TASK
################################################################################
Task ID: {{TASK_ID}}
Task Name: {{TASK_NAME}}
Follow: docs/PROMPTS/BACKEND_TASK_TEMPLATE.md + docs/PROMPTS/AI_AGENT_GUIDELINES.md

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
| v1.0 | 2026-07-10 | Initial Backend Task Template |
