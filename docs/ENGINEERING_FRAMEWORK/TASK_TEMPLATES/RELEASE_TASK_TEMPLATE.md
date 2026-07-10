# Release Task Template

| Field | Value |
|-------|-------|
| **Category** | Release / Deploy |
| **Version** | v1.0 |
| **Status** | Reusable |

**Follow:** [../AI_AGENT_GUIDELINES.md](../AI_AGENT_GUIDELINES.md) · [../../ENGINEERING_PLAYBOOK.md](../../ENGINEERING_PLAYBOOK.md) · [../../deployment/CLOUDFLARE_DEPLOYMENT.md](../../deployment/CLOUDFLARE_DEPLOYMENT.md)

---

################################################################################
PROJECT CONTEXT
################################################################################

Production: Cloudflare Workers via OpenNext (`npm run deploy`). Release actions are user-gated. Order: Localhost → Git → Cloudflare.

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
2. [ENGINEERING_PLAYBOOK.md](../../ENGINEERING_PLAYBOOK.md)
3. [deployment/CLOUDFLARE_DEPLOYMENT.md](../../deployment/CLOUDFLARE_DEPLOYMENT.md)
4. Current `git status` / diff / log

################################################################################
FILES TO READ
################################################################################

`{{FILES_TO_READ}}`

################################################################################
APPROVED FILES TO MODIFY
################################################################################

Usually none for pure release — or docs/status files listed here:  
`{{APPROVED_FILES}}`

################################################################################
REQUIREMENTS
################################################################################

`{{REQUIREMENTS}}`

Explicitly list allowed actions: commit / push / deploy / smoke / release notes.

################################################################################
OUT OF SCOPE
################################################################################

`{{OUT_OF_SCOPE}}`

################################################################################
ARCHITECTURE RULES
################################################################################

- Successful localhost verification before release
- Successful production build before deploy
- Cloudflare development tunnel verification when auth/webhooks changed
- Git status review (exclude secrets)
- Separate feature and infrastructure commits where appropriate
- Push only after explicit approval
- Verify Cloudflare auto-deploy or manual `npm run deploy` as instructed
- Verify production behavior
- Document release notes and known limitations when in scope

################################################################################
DEVELOPMENT WORKFLOW
################################################################################

1. Confirm explicit user approval for commit and/or push and/or deploy  
2. Review git status/diff/log  
3. Ensure localhost (and build) already passed for the change set  
4. Commit if allowed  
5. Push if allowed  
6. Deploy if allowed  
7. Production smoke  
8. Update status/release docs if in scope  
9. Completion report  

################################################################################
ACCEPTANCE CRITERIA
################################################################################

`{{ACCEPTANCE_CRITERIA}}`

################################################################################
LOCALHOST TEST PLAN
################################################################################

Confirm prior localhost verification or re-run critical paths:  
`{{LOCALHOST_TEST_PLAN}}`

################################################################################
BUILD VALIDATION
################################################################################

`npm run build` (and/or OpenNext deploy build) as required by the release objective.

################################################################################
DOCUMENTATION UPDATES
################################################################################

`{{DOCUMENTATION_UPDATES}}`

################################################################################
TASK COMPLETION REPORT
################################################################################

Commit hash · Push · Deploy version/URL · Smoke results · Notes/limitations · Git status

################################################################################
GIT AND DEPLOYMENT RULES
################################################################################

- No force-push to main  
- No commit of `.env.local` / secrets  
- No deploy without explicit instruction  

---

## Revision history

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-10 | S6-DOC-008 — Release task template |
