# Example — UI Task

**Template:** [UI_TASK_TEMPLATE.md](../UI_TASK_TEMPLATE.md)

Illustrative filled prompt (not an active task).

```text
################################################################################
IMMIFIN UI TASK
################################################################################
Task ID: S6-UI-001
Task Name: Admin Data Refresh card empty-state polish
Follow: docs/PROMPTS/UI_TASK_TEMPLATE.md + docs/PROMPTS/AI_AGENT_GUIDELINES.md

OBJECTIVE
Improve empty/error copy on /admin Data Refresh cards without changing APIs.

FILES
- app/admin/page.tsx
- related presentational components only if already used by admin page

REQUIREMENTS
1. Match Design System 2.0 / Workspace patterns already on /admin
2. Keep Close button behavior
3. Do not add new dependencies
4. Preserve requireAdmin gate

OUT OF SCOPE
New admin features, notification center UI, homepage redesign, deploy

ACCEPTANCE CRITERIA
- /admin loads for admin
- Empty/error states readable on desktop and mobile width
- No API contract changes

LOCALHOST TEST PLAN
1. Restart server
2. Open http://localhost:3000/admin as admin
3. Smoke desktop + narrow viewport
4. Confirm non-admin still redirected

Do not commit unless instructed.
################################################################################
```

**Why this is good:** UI-only, DS reuse, auth preserved, clear localhost checks.
