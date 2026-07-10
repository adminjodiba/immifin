# Backend Task Template

| Field | Value |
|-------|-------|
| **Category** | Backend / API / Services |
| **Version** | v1.0 |
| **Status** | Reusable |

**Follow:** [../AI_AGENT_GUIDELINES.md](../AI_AGENT_GUIDELINES.md)

> Notification-primary work → use [NOTIFICATION_TASK_TEMPLATE.md](./NOTIFICATION_TASK_TEMPLATE.md).

---

################################################################################
PROJECT CONTEXT
################################################################################

IMMIFIN backend: Next.js App Router APIs + `lib/` services on OpenNext Cloudflare Workers. Reuse auth (`requireUser` / `requireAdmin`), capabilities, and existing service patterns.

################################################################################
TASK ID
################################################################################

`{{TASK_ID}}`

################################################################################
TASK NAME
################################################################################

`{{TASK_NAME}}`

################################################################################
OBJECTIVE
################################################################################

`{{OBJECTIVE}}`

################################################################################
MANDATORY READING ORDER
################################################################################

1. [AI_AGENT_GUIDELINES.md](../AI_AGENT_GUIDELINES.md)
2. [SYSTEM_ARCHITECTURE.md](../../SYSTEM_ARCHITECTURE.md)
3. [ENGINEERING_PLAYBOOK.md](../../ENGINEERING_PLAYBOOK.md)
4. [CURRENT_PROJECT_STATE.md](../../CURRENT_PROJECT_STATE.md)
5. Existing `app/api/**` and `lib/**` in scope

################################################################################
FILES TO READ
################################################################################

`{{FILES_TO_READ}}`

################################################################################
APPROVED FILES TO MODIFY
################################################################################

`{{APPROVED_FILES}}`

################################################################################
REQUIREMENTS
################################################################################

`{{REQUIREMENTS}}`

################################################################################
OUT OF SCOPE
################################################################################

`{{OUT_OF_SCOPE}}`

################################################################################
ARCHITECTURE RULES
################################################################################

- Reuse existing service and API architecture
- Avoid duplicate routes and services
- Validate server-side authorization
- Prefer server-side caching where appropriate
- Use normalized errors and responses
- Protect secrets and private data
- Review Cloudflare Worker compatibility (no Node-only APIs, no unbounded CPU)

################################################################################
DEVELOPMENT WORKFLOW
################################################################################

1. Stop development server  
2. Review docs + existing APIs/services  
3. Implement approved scope  
4. Restart server  
5. Verify localhost  
6. Tunnel if auth/webhooks touched  
7. Lint / typecheck / build as appropriate  
8. Docs if contracts changed  
9. Report — no commit unless instructed  

################################################################################
ACCEPTANCE CRITERIA
################################################################################

`{{ACCEPTANCE_CRITERIA}}`

################################################################################
LOCALHOST TEST PLAN
################################################################################

`{{LOCALHOST_TEST_PLAN}}`

################################################################################
BUILD VALIDATION
################################################################################

`{{BUILD_VALIDATION}}`

################################################################################
DOCUMENTATION UPDATES
################################################################################

`{{DOCUMENTATION_UPDATES}}`

################################################################################
TASK COMPLETION REPORT
################################################################################

Files modified/created · Architecture decisions · Testing · Localhost · Docs · Limitations · Git · Commit status

################################################################################
GIT AND DEPLOYMENT RULES
################################################################################

Commit / push / deploy only when explicitly instructed. Never commit secrets.

---

## Revision history

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-10 | S6-DOC-008 — Backend task template |
