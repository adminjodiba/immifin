# Database Task Template

| Field | Value |
|-------|-------|
| **Category** | Database / Supabase |
| **Version** | v1.0 |
| **Status** | Reusable |

**Follow:** [../AI_AGENT_GUIDELINES.md](../AI_AGENT_GUIDELINES.md) · [../../SYSTEM_ARCHITECTURE.md](../../SYSTEM_ARCHITECTURE.md)

---

################################################################################
PROJECT CONTEXT
################################################################################

IMMIFIN uses Supabase (PostgreSQL) for application data. Google Sheets remain source of truth for Visa Bulletin / stamping published data (ADR-002) — not for transactional app state or notification history.

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
3. Auth/profile docs if touching `profiles` / roles
4. Existing migrations and `lib/supabase/**`

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

- Review current Supabase schema and migrations
- Avoid duplicate tables or fields
- Define ownership, RLS, indexing, and retention
- Protect sensitive immigration information
- Provide rollback considerations
- Do not use Google Sheets for application transactional data
- Do not store notification delivery history in Sheets

################################################################################
DEVELOPMENT WORKFLOW
################################################################################

1. Stop development server  
2. Review schema + docs  
3. Implement approved migrations/types  
4. Restart and verify affected localhost flows  
5. Document migration/rollback notes  
6. Report — no commit / no production migration unless instructed  

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

Migrations/files · Schema decisions · RLS/retention · Testing · Localhost · Rollback · Git · Commit status

################################################################################
GIT AND DEPLOYMENT RULES
################################################################################

No production schema changes without explicit approval. Never commit secrets.

---

## Revision history

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-10 | S6-DOC-008 — Database task template |
