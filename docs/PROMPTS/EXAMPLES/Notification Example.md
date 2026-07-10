# Example — Notification Task

**Template:** [NOTIFICATION_TASK_TEMPLATE.md](../NOTIFICATION_TASK_TEMPLATE.md)

Illustrative filled prompt (not an active task).

```text
################################################################################
IMMIFIN NOTIFICATION PLATFORM TASK
################################################################################
Project         : IMMIFIN
Version         : v0.5.x
Sprint          : Sprint 6
Task ID         : S6-EMAIL-001B
Task Name       : Resend provider adapter (fetch)
Feature Area    : Notification Platform
Task Type       : Architecture / Infrastructure
Priority        : High
Risk            : Medium

GOVERNANCE
Follow docs/PROMPTS/NOTIFICATION_TASK_TEMPLATE.md and
docs/PROMPTS/AI_AGENT_GUIDELINES.md.
Source of truth: docs/NOTIFICATION_DESIGN.md

OBJECTIVE
Implement ResendEmailProvider behind EmailProvider interface using fetch.
No templates, campaigns, history, or API routes.

FILES TO MODIFY / CREATE
- lib/notifications/providers/email-provider.ts
- lib/notifications/providers/resend-provider.ts
- lib/notifications/core/notification-config.ts (env read only)

REQUIREMENTS
1. Only resend-provider may call Resend HTTP API
2. Strong typed send input/result
3. Cloudflare Workers compatible (fetch)
4. Never log API keys

OUT OF SCOPE
React Email, welcome emails, webhooks, admin UI, bulk send, production email

ACCEPTANCE CRITERIA
- Adapter compiles
- Fake-provider or dry path validates service wiring
- Localhost loads
- No secrets in logs

LOCALHOST TEST PLAN
1. Stop/restart dev server
2. http://localhost:3000 → 200
3. Confirm no Resend network call unless explicitly testing with allowlisted address

Do not commit unless instructed.
################################################################################
```

**Why this is good:** Narrow files list, explicit out of scope, provider isolation called out, no deploy.
