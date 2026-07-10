# Release Task Example

**Template:** [../TASK_TEMPLATES/RELEASE_TASK_TEMPLATE.md](../TASK_TEMPLATES/RELEASE_TASK_TEMPLATE.md)

Illustrative filled prompt (not an active task).

```text
Read and follow:
docs/ENGINEERING_FRAMEWORK/TASK_TEMPLATES/RELEASE_TASK_TEMPLATE.md
docs/ENGINEERING_FRAMEWORK/AI_AGENT_GUIDELINES.md
docs/deployment/CLOUDFLARE_DEPLOYMENT.md

Task ID:
S6-REL-002

Task Name:
Commit, push, and deploy Engineering Framework docs

Objective:
Ship documentation-only Engineering Framework to main and production.

Allowed actions:
[x] Commit
[x] Push
[x] Deploy
[x] Production smoke
[x] Brief PROJECT_STATUS note (optional)

Requirements:
1. Do not commit .env.local or secrets
2. Exclude unrelated WIP unless approved
3. npm run deploy after push
4. Smoke https://immifin.com/

Out of Scope:
Application feature changes, force-push

Acceptance Criteria:
- Commit on main
- Remote updated
- Deploy succeeds
- Homepage HTTP 200

Localhost / build:
Confirm docs-only change; run build if mixed with code. For docs-only, build optional unless deploy path requires it.
```
