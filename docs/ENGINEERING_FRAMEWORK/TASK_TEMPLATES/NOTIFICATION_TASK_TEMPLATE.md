# Notification Task Template

| Field | Value |
|-------|-------|
| **Category** | Notification Platform |
| **Version** | v1.0 |
| **Status** | Reusable |

**Follow:** [../AI_AGENT_GUIDELINES.md](../AI_AGENT_GUIDELINES.md) · Source of truth: [../../NOTIFICATION_DESIGN.md](../../NOTIFICATION_DESIGN.md)

---

################################################################################
PROJECT CONTEXT
################################################################################

IMMIFIN Notification Platform is core infrastructure. Business features must not call email/SMS providers directly. Design for Email now and future SMS, WhatsApp, Push, In-App, and Apple Messages for Business via adapters.

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

1. [NOTIFICATION_DESIGN.md](../../NOTIFICATION_DESIGN.md) — **read first**
2. [AI_AGENT_GUIDELINES.md](../AI_AGENT_GUIDELINES.md)
3. [ENGINEERING_PLAYBOOK.md](../../ENGINEERING_PLAYBOOK.md)
4. [SYSTEM_ARCHITECTURE.md](../../SYSTEM_ARCHITECTURE.md)
5. [CURRENT_PROJECT_STATE.md](../../CURRENT_PROJECT_STATE.md)
6. Existing `lib/notifications/**` and related code

################################################################################
FILES TO READ
################################################################################

`{{FILES_TO_READ}}`

################################################################################
APPROVED FILES TO MODIFY
################################################################################

`{{APPROVED_FILES}}`  
Do not modify files outside this list without explicit approval.

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

- Business code never calls providers directly
- Notification Service owns orchestration
- Providers remain behind adapters
- Sender identity and configuration are centralized
- Notification history belongs in **Supabase**, not Google Sheets
- Secrets remain server-only
- Design for future Email, SMS, WhatsApp, Push, In-App, and Apple business messaging channels
- Optimize provider calls and batch processing for Cloudflare Workers
- Follow Email Design / Email Design System rules when building templates

################################################################################
DEVELOPMENT WORKFLOW
################################################################################

1. Stop development server  
2. Review docs + existing notification code  
3. Implement only approved files/scope  
4. Restart development server  
5. Verify localhost  
6. Verify Cloudflare tunnel if webhooks/auth involved  
7. Lint / typecheck as appropriate  
8. Production build when appropriate  
9. Update docs if architecture/status changed  
10. Completion report — **do not commit unless instructed**

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
Default: `npm run lint`; typecheck/build when server contracts change.

################################################################################
DOCUMENTATION UPDATES
################################################################################

`{{DOCUMENTATION_UPDATES}}`  
Update [NOTIFICATION_DESIGN.md](../../NOTIFICATION_DESIGN.md) status trackers when phases advance.

################################################################################
TASK COMPLETION REPORT
################################################################################

Files modified · Files created · Architecture decisions · Testing · Localhost · Docs · Limitations · Git status · Commit status

################################################################################
GIT AND DEPLOYMENT RULES
################################################################################

- Do not commit or push unless explicitly instructed  
- Do not deploy unless explicitly instructed  
- Never commit `.env.local` or secrets  

---

## Revision history

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-10 | S6-DOC-008 — Notification task template |
