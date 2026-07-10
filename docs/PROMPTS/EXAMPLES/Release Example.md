# Example — Release Task

**Template:** [RELEASE_TASK_TEMPLATE.md](../RELEASE_TASK_TEMPLATE.md)

Illustrative filled prompt (not an active task).

```text
################################################################################
IMMIFIN RELEASE TASK
################################################################################
Task ID: S6-REL-001
Task Name: Commit and deploy Notification docs + infra stubs
Follow: docs/PROMPTS/RELEASE_TASK_TEMPLATE.md + docs/PROMPTS/AI_AGENT_GUIDELINES.md

OBJECTIVE
Commit approved Notification documentation and placeholder module, push main,
deploy production, smoke homepage + /admin.

ACTIONS ALLOWED (explicit)
[x] Commit
[x] Push
[x] Deploy
[x] Production smoke
[ ] Docs / release notes (optional short PROJECT_STATUS note)

REQUIREMENTS
1. Do not commit .env.local or secrets
2. Conventional commit message focused on why
3. npm run deploy after push
4. Smoke https://immifin.com and https://immifin.com/admin

OUT OF SCOPE
Feature work, force-push, amend of others' commits

ACCEPTANCE CRITERIA
- Commit on main
- Remote updated
- Deploy succeeds
- Smoke HTTP 200 on critical routes
################################################################################
```

**Why this is good:** Explicit allow-list for commit/push/deploy, secret exclusion, production smoke.
