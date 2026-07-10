# Release Task Template

| Field | Value |
|-------|-------|
| **Version** | v1.0 |
| **Use for** | Commit, push, deploy, production smoke, release notes |
| **Status** | Framework v1 |

**Governed by:** [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md) · [../ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md) · [../deployment/CLOUDFLARE_DEPLOYMENT.md](../deployment/CLOUDFLARE_DEPLOYMENT.md)

---

## Project Context

IMMIFIN production is **Cloudflare Workers via OpenNext** (`npm run deploy`). Release work is **explicitly user-gated**: do not commit, push, or deploy unless instructed. Prefer Localhost → Git → Cloudflare order.

---

## Prompt structure (fill placeholders)

### Task ID
`{{TASK_ID}}`

### Objective
`{{OBJECTIVE}}`  
(e.g. commit only / push only / deploy / full release)

### Mandatory Reading
1. [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md)  
2. [../ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md)  
3. [../deployment/CLOUDFLARE_DEPLOYMENT.md](../deployment/CLOUDFLARE_DEPLOYMENT.md)  
4. `git status` / recent commits  
5. `{{ADDITIONAL_READING}}`

### Development Workflow
1. Confirm user explicitly requested commit and/or push and/or deploy  
2. Review `git status` / diff / log  
3. Exclude secrets (`.env.local`, credentials)  
4. Commit with HEREDOC-style message when committing  
5. Push only if asked  
6. Deploy only if asked (`npm run deploy`)  
7. Production smoke on `https://immifin.com` for affected routes  
8. Update release/status docs if in scope  

### Requirements
`{{REQUIREMENTS}}`

### Out of Scope
`{{OUT_OF_SCOPE}}`  
Default: no unrelated refactors; no force-push to main; no amend unless policy allows.

### Acceptance Criteria
`{{ACCEPTANCE_CRITERIA}}`

### Localhost Test Plan
Confirm prior localhost verification already done for the change set, or re-verify critical paths before deploy.

### Completion Report
Commit hash · Push result · Deploy version/URL · Smoke results · Docs · Git status

---

## Copy-paste prompt shell

```text
################################################################################
IMMIFIN RELEASE TASK
################################################################################
Task ID: {{TASK_ID}}
Task Name: {{TASK_NAME}}
Follow: docs/PROMPTS/RELEASE_TASK_TEMPLATE.md + docs/PROMPTS/AI_AGENT_GUIDELINES.md

OBJECTIVE
{{OBJECTIVE}}

ACTIONS ALLOWED (explicit)
[ ] Commit
[ ] Push
[ ] Deploy
[ ] Production smoke
[ ] Docs / release notes

REQUIREMENTS
{{REQUIREMENTS}}

OUT OF SCOPE
{{OUT_OF_SCOPE}}

ACCEPTANCE CRITERIA
{{ACCEPTANCE_CRITERIA}}
################################################################################
```

---

## Revision history

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-10 | Initial Release Task Template |
