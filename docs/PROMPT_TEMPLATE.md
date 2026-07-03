# IMMIFIN Standard Cursor Prompt Template

| Field | Value |
|-------|-------|
| **Title** | IMMIFIN Standard Cursor Prompt Template |
| **Version** | v1.0 |
| **Sprint** | Sprint 4 |
| **Task ID** | S4-000.2 |
| **Last Updated** | 2026-07-01 |
| **Owner** | Technical Architecture (CTO) |
| **Status** | Canonical prompt template |

**Governed by:** [AI_DEVELOPMENT_CHARTER.md](./AI_DEVELOPMENT_CHARTER.md)

---

## 1. Purpose

This document defines the **standard Cursor prompt format** for all IMMIFIN development work.

Every implementation prompt — whether for features, bug fixes, refactors, or documentation — **must** be generated from this template. The Technical Architect (ChatGPT) populates placeholders; the Senior Full Stack Engineer (Cursor) executes the resulting prompt.

**Do not recreate prompts manually.** Copy this template, replace placeholders, and deliver the completed prompt to Cursor.

---

## 2. Metadata Header Template

Copy the block below and replace all `{{PLACEHOLDER}}` values.

```
################################################################################
IMMIFIN DEVELOPMENT TASK
################################################################################

Project         : {{PROJECT}}
Version         : {{VERSION}}
Sprint          : {{SPRINT}}
Task ID         : {{TASK_ID}}
Task Name       : {{TASK_NAME}}
Feature Area    : {{FEATURE_AREA}}
Task Type       : {{TASK_TYPE}}
Priority        : {{PRIORITY}}
Estimated Time  : {{ESTIMATED_TIME}}
Risk Level      : {{RISK_LEVEL}}
Current Status  : {{CURRENT_STATUS}}

Business Impact
---------------
{{BUSINESS_IMPACT}}

Assigned AI Role
----------------
{{ASSIGNED_AI_ROLES}}

Related Documents
-----------------
{{RELATED_DOCUMENTS}}
```

### Placeholder guidance

| Placeholder | Example |
|-------------|---------|
| `{{PROJECT}}` | IMMIFIN |
| `{{VERSION}}` | v0.4.0 |
| `{{SPRINT}}` | Sprint 4 |
| `{{TASK_ID}}` | S4-001 |
| `{{TASK_NAME}}` | Dashboard Architecture Review |
| `{{FEATURE_AREA}}` | Dashboard |
| `{{TASK_TYPE}}` | FEATURE \| ENHANCEMENT \| BUG FIX \| REFACTOR \| PERFORMANCE \| SECURITY \| SEO \| TESTING \| DEVOPS \| DOCUMENTATION |
| `{{PRIORITY}}` | P0 - Critical \| P1 - High \| P2 - Medium \| P3 - Low |
| `{{ESTIMATED_TIME}}` | 2 Hours |
| `{{RISK_LEVEL}}` | LOW \| MEDIUM \| HIGH |
| `{{CURRENT_STATUS}}` | READY FOR IMPLEMENTATION \| IN PROGRESS \| BLOCKED \| COMPLETE |
| `{{BUSINESS_IMPACT}}` | ★★★★★ User Experience (one line per dimension) |
| `{{ASSIGNED_AI_ROLES}}` | Bullet list of roles |
| `{{RELATED_DOCUMENTS}}` | Bullet list of doc paths |

---

## 3. Documentation Review Section

Include this section verbatim in every prompt (adjust only `Related Documents` if task-specific docs apply).

```
################################################################################
STEP 0 - READ PROJECT DOCUMENTATION (MANDATORY)
################################################################################

Before making ANY changes, read:

1. docs/CURRENT_PROJECT_STATE.md
2. docs/SYSTEM_ARCHITECTURE.md
3. docs/ENGINEERING_PLAYBOOK.md
4. docs/AI_DEVELOPMENT_CHARTER.md

{{ADDITIONAL_DOCS_IF_APPLICABLE}}

Treat these documents as the authoritative source of truth.
```

### Optional additional docs

| Task area | Also read |
|-----------|-----------|
| Auth, webhooks, profile sync | `docs/DEVELOPER_SETUP.md` |
| Production release | `docs/SPRINT_RELEASE_CHECKLIST.md` |
| New architecture | `docs/TECHNICAL_DECISIONS.md` |

Use placeholder: `{{ADDITIONAL_DOCS_IF_APPLICABLE}}`

---

## 4. Development Workflow Template

```
################################################################################
STEP 1 - DEVELOPMENT WORKFLOW
################################################################################

1. Stop the running development server.
2. Review existing implementation and architecture.
3. {{IMPLEMENTATION_SCOPE}}
4. Verify TypeScript (no errors).
5. Verify ESLint (no errors).
6. Restart the development server.
7. Verify localhost at http://localhost:3000
8. Wait for user approval before commit.
9. {{GIT_AND_DEPLOY_STEPS}}
10. Update documentation per task requirements.
11. Report:
    • Files modified
    • Summary of changes
    • Localhost URL
```

### Standard workflow diagram

```
Read Documentation
        ↓
Stop Development Server
        ↓
Review Existing Implementation
        ↓
Implement Changes
        ↓
Verify TypeScript
        ↓
Verify ESLint
        ↓
Restart Development Server
        ↓
Verify Localhost
        ↓
Wait for User Approval
        ↓
Git Commit
        ↓
GitHub Push
        ↓
Cloudflare Deployment
        ↓
Production Verification
        ↓
Documentation Update
```

### Auth / webhook tasks — add to workflow

```
• Start Cloudflare Dev Tunnel (npm run dev:local)
• Verify tunnel is healthy before webhook testing
• Verify Clerk webhook deliveries return 200
```

Use placeholders: `{{IMPLEMENTATION_SCOPE}}` · `{{GIT_AND_DEPLOY_STEPS}}`

---

## 5. Prompt Sections

Copy and complete each section below in every implementation prompt.

---

### Objective

```
################################################################################
OBJECTIVE
################################################################################

{{OBJECTIVE}}
```

---

### Requirements

```
################################################################################
REQUIREMENTS
################################################################################

{{REQUIREMENTS}}
```

---

### Implementation

```
################################################################################
IMPLEMENTATION
################################################################################

{{IMPLEMENTATION}}

Files to inspect:
{{FILES_TO_INSPECT}}

Files to modify:
{{FILES_TO_MODIFY}}

Files to create:
{{FILES_TO_CREATE}}

Out of scope:
{{OUT_OF_SCOPE}}
```

---

### Architecture Constraints

```
################################################################################
ARCHITECTURE CONSTRAINTS
################################################################################

{{ARCHITECTURE_CONSTRAINTS}}
```

---

### Acceptance Criteria

```
################################################################################
ACCEPTANCE CRITERIA
################################################################################

{{ACCEPTANCE_CRITERIA}}
```

---

### Localhost Test Plan

```
################################################################################
LOCALHOST TEST PLAN
################################################################################

{{LOCALHOST_TEST_PLAN}}
```

---

### Git Guidance

```
################################################################################
GIT GUIDANCE
################################################################################

{{GIT_GUIDANCE}}
```

---

### Documentation Updates

```
################################################################################
DOCUMENTATION UPDATES
################################################################################

{{DOCUMENTATION_UPDATES}}
```

---

### Self Review Checklist

```
################################################################################
SELF REVIEW CHECKLIST
################################################################################

{{SELF_REVIEW_CHECKLIST}}
```

---

### After Implementation

```
################################################################################
AFTER IMPLEMENTATION
################################################################################

{{AFTER_IMPLEMENTATION_INSTRUCTIONS}}
```

---

## 6. Localhost Testing Template

```
################################################################################
LOCALHOST TEST PLAN
################################################################################

Pages to test
-------------
{{PAGES_TO_TEST}}

Expected behavior
-----------------
{{EXPECTED_BEHAVIOR}}

Regression tests
----------------
{{REGRESSION_TESTS}}

Edge cases
----------
{{EDGE_CASES}}

Console verification
--------------------
{{CONSOLE_VERIFICATION}}

Network verification
--------------------
{{NETWORK_VERIFICATION}}
```

### Example placeholders

| Placeholder | Example content |
|-------------|-----------------|
| `{{PAGES_TO_TEST}}` | `/`, `/user-profile`, `/onboarding/contact-preferences` |
| `{{EXPECTED_BEHAVIOR}}` | User without phone redirects to onboarding |
| `{{REGRESSION_TESTS}}` | Login, signup, profile save, visa bulletin load |
| `{{EDGE_CASES}}` | Deleted user, API failure, logged-out visitor |
| `{{CONSOLE_VERIFICATION}}` | No errors in browser console |
| `{{NETWORK_VERIFICATION}}` | `/api/account/contact-status` returns 200 JSON |

---

## 7. Git Guidance Template

```
################################################################################
GIT GUIDANCE
################################################################################

Suggested branch
----------------
{{SUGGESTED_BRANCH}}

Suggested commit message
------------------------
{{SUGGESTED_COMMIT_MESSAGE}}

Files to stage
--------------
{{FILES_TO_STAGE}}

Push
----
{{PUSH_INSTRUCTIONS}}

Deploy
------
{{DEPLOY_INSTRUCTIONS}}

Wait for user approval
----------------------
{{APPROVAL_INSTRUCTIONS}}
```

### Standard defaults

| Placeholder | Default when unspecified |
|-------------|--------------------------|
| `{{SUGGESTED_BRANCH}}` | `feature/{{TASK_ID}}-{{SHORT_NAME}}` or `main` for hotfix |
| `{{PUSH_INSTRUCTIONS}}` | `git push origin main` after user approval — triggers Cloudflare auto-deploy |
| `{{DEPLOY_INSTRUCTIONS}}` | **Push to GitHub and let Cloudflare auto-deploy.** Do not run `npm run deploy` manually unless auto-deploy fails. Wait for deployment completion, then report `https://immifin.com` |
| `{{APPROVAL_INSTRUCTIONS}}` | DO NOT commit until localhost verified and user approves |

---

## 8. Documentation Update Template

```
################################################################################
DOCUMENTATION UPDATES
################################################################################

Update the following when applicable:

□ docs/CURRENT_PROJECT_STATE.md
□ docs/CHANGELOG.md
□ docs/SPRINT_BACKLOG.md
□ docs/TECHNICAL_DECISIONS.md (if architecture changed)
□ docs/SYSTEM_ARCHITECTURE.md (if infrastructure changed)
□ docs/ENGINEERING_PLAYBOOK.md (if workflow changed)
□ docs/DEVELOPER_SETUP.md (if local dev changed)

Task-specific updates:
{{TASK_SPECIFIC_DOC_UPDATES}}
```

---

## 9. Self Review Checklist

Include this checklist in every prompt. Cursor must verify before handoff.

```
################################################################################
SELF REVIEW CHECKLIST
################################################################################

□ Documentation reviewed
□ Stayed within scope
□ No unrelated files modified
□ No TypeScript errors
□ No ESLint errors
□ Build successful (npm run build)
□ Development server restarted
□ Localhost ready
□ Ready for user testing
```

For auth/webhook tasks, also include:

```
□ Cloudflare tunnel healthy (if applicable)
□ Clerk webhooks return 200 (if applicable)
```

---

## 10. Placeholder Naming Standard

All placeholders use **double curly braces** in `SCREAMING_SNAKE_CASE`.

### Convention rules

| Rule | Example |
|------|---------|
| Uppercase words separated by `_` | `{{TASK_ID}}` |
| Wrap with `{{` and `}}` | `{{OBJECTIVE}}` |
| No spaces inside braces | `{{TASK_NAME}}` not `{{ TASK_NAME }}` |
| Descriptive names | `{{FILES_TO_MODIFY}}` not `{{FILES}}` |
| Task-specific placeholders match section | `{{LOCALHOST_TEST_PLAN}}` in test section |

### Official placeholder registry

| Category | Placeholders |
|----------|--------------|
| **Metadata** | `{{PROJECT}}`, `{{VERSION}}`, `{{SPRINT}}`, `{{TASK_ID}}`, `{{TASK_NAME}}`, `{{FEATURE_AREA}}`, `{{TASK_TYPE}}`, `{{PRIORITY}}`, `{{ESTIMATED_TIME}}`, `{{RISK_LEVEL}}`, `{{CURRENT_STATUS}}`, `{{BUSINESS_IMPACT}}`, `{{ASSIGNED_AI_ROLES}}`, `{{RELATED_DOCUMENTS}}` |
| **Workflow** | `{{IMPLEMENTATION_SCOPE}}`, `{{GIT_AND_DEPLOY_STEPS}}`, `{{ADDITIONAL_DOCS_IF_APPLICABLE}}` |
| **Task body** | `{{OBJECTIVE}}`, `{{REQUIREMENTS}}`, `{{IMPLEMENTATION}}`, `{{ARCHITECTURE_CONSTRAINTS}}`, `{{ACCEPTANCE_CRITERIA}}` |
| **Files** | `{{FILES_TO_INSPECT}}`, `{{FILES_TO_MODIFY}}`, `{{FILES_TO_CREATE}}`, `{{OUT_OF_SCOPE}}`, `{{FILES_TO_STAGE}}` |
| **Testing** | `{{LOCALHOST_TEST_PLAN}}`, `{{PAGES_TO_TEST}}`, `{{EXPECTED_BEHAVIOR}}`, `{{REGRESSION_TESTS}}`, `{{EDGE_CASES}}`, `{{CONSOLE_VERIFICATION}}`, `{{NETWORK_VERIFICATION}}` |
| **Git** | `{{SUGGESTED_BRANCH}}`, `{{SUGGESTED_COMMIT_MESSAGE}}`, `{{PUSH_INSTRUCTIONS}}`, `{{DEPLOY_INSTRUCTIONS}}`, `{{APPROVAL_INSTRUCTIONS}}` |
| **Docs** | `{{DOCUMENTATION_UPDATES}}`, `{{TASK_SPECIFIC_DOC_UPDATES}}` |
| **Closing** | `{{AFTER_IMPLEMENTATION_INSTRUCTIONS}}`, `{{SELF_REVIEW_CHECKLIST}}` |

---

## 11. Usage Instructions

### For Technical Architect (ChatGPT)

Every new task prompt must follow this workflow:

1. **Read** [AI_DEVELOPMENT_CHARTER.md](./AI_DEVELOPMENT_CHARTER.md)
2. **Read** this document ([PROMPT_TEMPLATE.md](./PROMPT_TEMPLATE.md))
3. **Populate** all required placeholders for the specific task
4. **Produce** the final Cursor prompt as a single copy-paste block
5. **Never deviate** from this template unless the Engineering Charter is formally updated

### For Senior Full Stack Engineer (Cursor)

1. Execute **Step 0** (read mandatory docs) before any changes
2. Follow **Step 1** (development workflow) exactly
3. Complete all sections in the prompt
4. Verify **Self Review Checklist** before handoff
5. Wait for user approval before commit unless explicitly instructed otherwise

### Complete prompt assembly order

1. Metadata Header (§2)
2. Documentation Review (§3)
3. Development Workflow (§4)
4. Objective (§5)
5. Requirements (§5)
6. Architecture Constraints (§5)
7. Implementation (§5)
8. Acceptance Criteria (§5)
9. Localhost Test Plan (§6)
10. Git Guidance (§7)
11. Documentation Updates (§8)
12. Self Review Checklist (§9)
13. After Implementation (§5)

---

## 12. Task Closeout Report Template

Standard report after push and Cloudflare auto-deploy (see [AI_DEVELOPMENT_CHARTER.md §19](./AI_DEVELOPMENT_CHARTER.md#19-feature-task-closeout-procedure)):

```
Task ID:           {{TASK_ID}}
Status:            Completed
Commit hash:       <hash after push>
GitHub push:       PASS / FAIL
Cloudflare:        <deployment status if visible>
Production URL:    https://immifin.com
Deployment errors: <none or describe>
```

**Deployment rule:** Push to GitHub and let Cloudflare auto-deploy. Do not manually deploy unless auto-deploy fails.

---

## Full Template (Copy-Paste Starter)

```
################################################################################
IMMIFIN DEVELOPMENT TASK
################################################################################

Project         : {{PROJECT}}
Version         : {{VERSION}}
Sprint          : {{SPRINT}}
Task ID         : {{TASK_ID}}
Task Name       : {{TASK_NAME}}
Feature Area    : {{FEATURE_AREA}}
Task Type       : {{TASK_TYPE}}
Priority        : {{PRIORITY}}
Estimated Time  : {{ESTIMATED_TIME}}
Risk Level      : {{RISK_LEVEL}}
Current Status  : {{CURRENT_STATUS}}

Business Impact
---------------
{{BUSINESS_IMPACT}}

Assigned AI Role
----------------
{{ASSIGNED_AI_ROLES}}

Related Documents
-----------------
{{RELATED_DOCUMENTS}}

################################################################################
STEP 0 - READ PROJECT DOCUMENTATION (MANDATORY)
################################################################################

Before making ANY changes, read:

1. docs/CURRENT_PROJECT_STATE.md
2. docs/SYSTEM_ARCHITECTURE.md
3. docs/ENGINEERING_PLAYBOOK.md
4. docs/AI_DEVELOPMENT_CHARTER.md

{{ADDITIONAL_DOCS_IF_APPLICABLE}}

Treat these documents as the authoritative source of truth.

################################################################################
STEP 1 - DEVELOPMENT WORKFLOW
################################################################################

1. Stop the running development server.
2. Review existing implementation and architecture.
3. {{IMPLEMENTATION_SCOPE}}
4. Verify TypeScript (no errors).
5. Verify ESLint (no errors).
6. Restart the development server.
7. Verify localhost at http://localhost:3000
8. Wait for user approval before commit.
9. {{GIT_AND_DEPLOY_STEPS}}
10. Update documentation per task requirements.

################################################################################
OBJECTIVE
################################################################################

{{OBJECTIVE}}

################################################################################
REQUIREMENTS
################################################################################

{{REQUIREMENTS}}

################################################################################
ARCHITECTURE CONSTRAINTS
################################################################################

{{ARCHITECTURE_CONSTRAINTS}}

################################################################################
IMPLEMENTATION
################################################################################

{{IMPLEMENTATION}}

################################################################################
ACCEPTANCE CRITERIA
################################################################################

{{ACCEPTANCE_CRITERIA}}

################################################################################
LOCALHOST TEST PLAN
################################################################################

Pages to test: {{PAGES_TO_TEST}}
Expected behavior: {{EXPECTED_BEHAVIOR}}
Regression tests: {{REGRESSION_TESTS}}
Edge cases: {{EDGE_CASES}}
Console verification: {{CONSOLE_VERIFICATION}}
Network verification: {{NETWORK_VERIFICATION}}

################################################################################
GIT GUIDANCE
################################################################################

Branch: {{SUGGESTED_BRANCH}}
Commit message: {{SUGGESTED_COMMIT_MESSAGE}}
Push: {{PUSH_INSTRUCTIONS}}
Deploy: {{DEPLOY_INSTRUCTIONS}}
Approval: {{APPROVAL_INSTRUCTIONS}}

################################################################################
DOCUMENTATION UPDATES
################################################################################

{{DOCUMENTATION_UPDATES}}

################################################################################
AFTER IMPLEMENTATION
################################################################################

{{AFTER_IMPLEMENTATION_INSTRUCTIONS}}

Default for feature tasks after user approval:

1. Update documentation per task requirements.
2. Create Git commit with approved commit message.
3. Push to GitHub (`git push origin main`).
4. Let Cloudflare auto-deploy from the connected GitHub branch.
5. Do NOT manually deploy unless Cloudflare auto-deploy fails.
6. Wait for deployment completion.
7. Report task closeout (see §12).

################################################################################
TASK CLOSEOUT REPORT
################################################################################

Task ID:           {{TASK_ID}}
Status:            Completed
Commit hash:       <hash after push>
GitHub push:       PASS / FAIL
Cloudflare:        <deployment status if visible>
Production URL:    https://immifin.com
Deployment errors: <none or describe>

Next Step:         Production smoke test at production URL.

################################################################################
SELF REVIEW CHECKLIST
################################################################################

□ Documentation reviewed
□ Stayed within scope
□ No unrelated files modified
□ No TypeScript errors
□ No ESLint errors
□ Build successful
□ Development server restarted
□ Localhost ready
□ Ready for user testing

################################################################################
END OF TASK
################################################################################
```

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-01 | S4-000.2 | Initial standard Cursor prompt template; task closeout report |
