# Notification Task Example

**Template:** [../TASK_TEMPLATES/NOTIFICATION_TASK_TEMPLATE.md](../TASK_TEMPLATES/NOTIFICATION_TASK_TEMPLATE.md)

Illustrative filled prompt (not an active task).

```text
Read and follow:
docs/ENGINEERING_FRAMEWORK/TASK_TEMPLATES/NOTIFICATION_TASK_TEMPLATE.md
docs/ENGINEERING_FRAMEWORK/AI_AGENT_GUIDELINES.md
docs/NOTIFICATION_DESIGN.md

Task ID:
S6-EMAIL-001A.3

Task Name:
Create Notification Provider Type Definitions

Objective:
Implement strongly typed provider send contracts for the Notification Platform.

Approved Files:
lib/notifications/types/provider-types.ts

Requirements:
1. Define EmailProviderSendInput / EmailProviderSendResult types
2. No Resend imports
3. Channel-ready shapes without implementing SMS/WhatsApp

Out of Scope:
Providers, Notification Service, templates, API routes, env wiring, production sends

Acceptance Criteria:
- Types compile
- No other files modified
- Localhost still loads after restart

Localhost Test Plan:
1. Stop/restart dev server
2. http://localhost:3000 → 200

Do not commit unless instructed.
```
