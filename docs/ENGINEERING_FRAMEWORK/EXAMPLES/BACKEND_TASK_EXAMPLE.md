# Backend Task Example

**Template:** [../TASK_TEMPLATES/BACKEND_TASK_TEMPLATE.md](../TASK_TEMPLATES/BACKEND_TASK_TEMPLATE.md)

Illustrative filled prompt (not an active task).

```text
Read and follow:
docs/ENGINEERING_FRAMEWORK/TASK_TEMPLATES/BACKEND_TASK_TEMPLATE.md
docs/ENGINEERING_FRAMEWORK/AI_AGENT_GUIDELINES.md

Task ID:
S6-ADM-001B

Task Name:
Harden admin refresh-visa-bulletin error responses

Objective:
Normalize JSON error responses on the admin bulletin refresh route without changing refresh semantics.

Approved Files:
app/api/admin/refresh-visa-bulletin/route.ts

Requirements:
1. Keep requireAdmin()
2. Return consistent { success, message } / error shape
3. Do not trigger archive
4. Workers-safe (no new Node-only deps)

Out of Scope:
Admin UI redesign, notification sends, schema changes, deploy

Acceptance Criteria:
- Non-admin denied
- Failure path returns clear JSON
- Localhost admin refresh still works

Localhost Test Plan:
1. Restart server
2. Exercise refresh as admin
3. Confirm unauthorized behavior for non-admin

Do not commit unless instructed.
```
