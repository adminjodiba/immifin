# Documentation Task Template

| Field | Value |
|-------|-------|
| **Category** | Documentation only |
| **Version** | v1.0 |
| **Status** | Reusable |

**Follow:** [../AI_AGENT_GUIDELINES.md](../AI_AGENT_GUIDELINES.md)

---

################################################################################
PROJECT CONTEXT
################################################################################

IMMIFIN documentation is the source of truth. Docs tasks must preserve terminology, avoid conflicting sources of truth, and must not change application code unless the task explicitly expands into implementation.

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
2. [CURRENT_PROJECT_STATE.md](../../CURRENT_PROJECT_STATE.md)
3. Documents being created or updated
4. Related cross-reference targets

################################################################################
FILES TO READ
################################################################################

`{{FILES_TO_READ}}`

################################################################################
APPROVED FILES TO MODIFY
################################################################################

`{{APPROVED_FILES}}`  
Documentation paths only unless otherwise approved.

################################################################################
REQUIREMENTS
################################################################################

`{{REQUIREMENTS}}`

################################################################################
OUT OF SCOPE
################################################################################

`{{OUT_OF_SCOPE}}`  
Default: no application code, no dependency installs, no deploy.

################################################################################
ARCHITECTURE RULES
################################################################################

- No application code changes
- Preserve existing terminology
- Avoid conflicting sources of truth
- Cross-reference related documents
- Add status trackers only where useful
- Do not mark implementation complete unless code and verification are complete

################################################################################
DEVELOPMENT WORKFLOW
################################################################################

1. Review related docs  
2. Create/update markdown only  
3. Add cross-references  
4. Completion report  
5. Do not commit unless instructed  

Localhost/build usually N/A for pure docs.

################################################################################
ACCEPTANCE CRITERIA
################################################################################

`{{ACCEPTANCE_CRITERIA}}`

################################################################################
LOCALHOST TEST PLAN
################################################################################

Usually: **N/A (documentation only)**.

################################################################################
BUILD VALIDATION
################################################################################

Usually: **N/A**.

################################################################################
DOCUMENTATION UPDATES
################################################################################

This task *is* the documentation update. List all created/updated paths.

################################################################################
TASK COMPLETION REPORT
################################################################################

Files created/updated · Cross-refs · Confirmation no app code · Git status · Commit status

################################################################################
GIT AND DEPLOYMENT RULES
################################################################################

Commit only when explicitly instructed. No deploy for docs-only unless asked.

---

## Revision history

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-10 | S6-DOC-008 — Documentation task template |
