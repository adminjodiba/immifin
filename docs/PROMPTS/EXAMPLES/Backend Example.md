# Example — Backend Task

**Template:** [BACKEND_TASK_TEMPLATE.md](../BACKEND_TASK_TEMPLATE.md)

Illustrative filled prompt (not an active task).

```text
################################################################################
IMMIFIN BACKEND TASK
################################################################################
Task ID: S6-ADM-001A
Task Name: Admin archive-month confirmation API hardening
Follow: docs/PROMPTS/BACKEND_TASK_TEMPLATE.md + docs/PROMPTS/AI_AGENT_GUIDELINES.md

OBJECTIVE
Ensure archive-visa-bulletin route remains requireAdmin-gated and returns clear
errors without changing archive semantics.

FILES
- app/api/admin/archive-visa-bulletin/route.ts
- lib/visaBulletinArchive.ts (read-only unless bugfix required)

REQUIREMENTS
1. Keep requireAdmin()
2. Validate month=YYYY-MM
3. Do not auto-archive on sync
4. Preserve Google Sheets as history store

OUT OF SCOPE
Admin UI redesign, notification emails, schema changes, deploy

ACCEPTANCE CRITERIA
- Invalid month → 400
- Non-admin → auth error
- Localhost admin happy path still works

LOCALHOST TEST PLAN
1. Restart server
2. Hit archive endpoint as admin with valid/invalid month
3. Confirm no Sheets write on invalid input

Do not commit or push unless instructed.
################################################################################
```

**Why this is good:** Reuses existing admin/auth patterns, preserves ADR-002 Sheets constraint, tight scope.
