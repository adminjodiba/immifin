# UI Task Example

**Template:** [../TASK_TEMPLATES/UI_TASK_TEMPLATE.md](../TASK_TEMPLATES/UI_TASK_TEMPLATE.md)

Illustrative filled prompt (not an active task).

```text
Read and follow:
docs/ENGINEERING_FRAMEWORK/TASK_TEMPLATES/UI_TASK_TEMPLATE.md
docs/ENGINEERING_FRAMEWORK/AI_AGENT_GUIDELINES.md

Task ID:
S6-UI-002

Task Name:
Improve Admin Close control accessibility

Objective:
Ensure the /admin Close control has an accessible name and keyboard focus styles consistent with DS 2.0.

Approved Files:
app/admin/page.tsx

Requirements:
1. Reuse existing admin chrome patterns
2. Do not change Data Refresh behavior
3. Desktop + mobile smoke

Out of Scope:
New admin features, notification center UI, homepage work

Acceptance Criteria:
- Close remains top-right
- Accessible name present
- /admin loads for admin; non-admin redirected

Localhost Test Plan:
1. Restart server
2. Open http://localhost:3000/admin
3. Keyboard focus Close; verify label
4. Narrow viewport smoke

Do not commit unless instructed.
```
