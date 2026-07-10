# Architecture Review Template

| Field | Value |
|-------|-------|
| **Category** | Architecture review (no implementation by default) |
| **Version** | v1.0 |
| **Status** | Reusable |
| **Task ID** | S6-DOC-009 |

**Follow:** [../AI_AGENT_GUIDELINES.md](../AI_AGENT_GUIDELINES.md) · [../../SYSTEM_ARCHITECTURE.md](../../SYSTEM_ARCHITECTURE.md) · [../../ENGINEERING_PLAYBOOK.md](../../ENGINEERING_PLAYBOOK.md)

> Use this template when the goal is to **review, validate, and improve architecture** — not to implement code. Implementation requires a separate approved task.

---

################################################################################
PROJECT CONTEXT
################################################################################

IMMIFIN is an existing commercial SaaS platform (Next.js / OpenNext / Cloudflare Workers, Clerk, Supabase, Google Sheets for bulletin data). Architecture reviews must respect approved design docs, the Engineering Playbook, and the business model. Prefer reuse and continuity over redesign.

This review does **not** authorize application code changes unless the task explicitly expands into an implementation template afterward.

################################################################################
TASK ID
################################################################################

`{{TASK_ID}}`

################################################################################
TASK NAME
################################################################################

`{{TASK_NAME}}`

################################################################################
REVIEW OBJECTIVE
################################################################################

`{{REVIEW_OBJECTIVE}}`

Typical objectives: feature architecture validation, technical debt, scalability, Cloudflare compatibility, security, performance, database design, Notification Platform, AI features, Design System alignment.

################################################################################
MANDATORY READING
################################################################################

1. [AI_AGENT_GUIDELINES.md](../AI_AGENT_GUIDELINES.md)
2. [SYSTEM_ARCHITECTURE.md](../../SYSTEM_ARCHITECTURE.md)
3. [ENGINEERING_PLAYBOOK.md](../../ENGINEERING_PLAYBOOK.md)
4. [CURRENT_PROJECT_STATE.md](../../CURRENT_PROJECT_STATE.md)
5. Domain design docs relevant to the review (e.g. [NOTIFICATION_DESIGN.md](../../NOTIFICATION_DESIGN.md), [BUSINESS_MODEL.md](../../BUSINESS_MODEL.md))
6. Code and docs listed under **Files to Review**

################################################################################
FILES TO REVIEW
################################################################################

`{{FILES_TO_REVIEW}}`

Include docs, services, routes, schema, and configs in scope. Do not expand into unrelated modules without stating why.

################################################################################
REVIEW SCOPE
################################################################################

`{{REVIEW_SCOPE}}`

################################################################################
OUT OF SCOPE
################################################################################

`{{OUT_OF_SCOPE}}`

**Defaults unless explicitly overridden:**

- No application code changes
- No dependency installs
- No commits, pushes, or deploys
- No rewriting approved architecture without documenting the conflict and recommendation

################################################################################
REVIEW PHILOSOPHY
################################################################################

Reviewers must:

- **Challenge** poor architectural decisions — do not rubber-stamp
- **Recommend better alternatives** with clear trade-offs
- **Protect production stability** (localhost → Git → Cloudflare discipline)
- **Minimize technical debt** and avoid “temporary” bypasses
- **Prefer reusable architecture** and shared services over one-offs
- **Respect existing IMMIFIN standards** (Charter, Playbook, Design System, domain docs)
- **Avoid unnecessary redesigns** — improve what exists when it is sound
- **Classify findings** as:
  - **Must fix** — blocks safe implementation or production risk
  - **Should improve** — meaningful quality/debt reduction before or during build
  - **Future enhancement** — valuable later; do not block current sprint work

################################################################################
REVIEW CHECKLIST
################################################################################

Complete or mark N/A with reason:

- [ ] Aligns with [SYSTEM_ARCHITECTURE.md](../../SYSTEM_ARCHITECTURE.md) and related ADRs/domain docs
- [ ] Reuses existing services, utilities, components, and patterns (no duplicate business logic)
- [ ] Does not bypass shared gates (auth, capabilities, Notification Service, etc.)
- [ ] Secrets remain server-only; no client exposure of private data
- [ ] Compatible with Next.js App Router + OpenNext + Cloudflare Workers constraints
- [ ] Data ownership clear (Supabase vs Sheets vs third-party); Sheets not used for transactional app data
- [ ] Authorization and RLS considered where data is involved
- [ ] Caching, batching, and Worker CPU/time limits considered
- [ ] Failure modes, retries, and observability considered
- [ ] Vendor lock-in minimized via adapters/interfaces where appropriate
- [ ] Business model / tier gating considered
- [ ] Design System / UX hierarchy considered for user-facing surfaces
- [ ] Documentation gaps identified (docs before architecture changes)

`{{ADDITIONAL_CHECKLIST_ITEMS}}`

################################################################################
RISKS IDENTIFIED
################################################################################

| Severity | Risk | Impact | Mitigation |
|----------|------|--------|------------|
| Must fix / Should improve / Future | `{{RISK}}` | `{{IMPACT}}` | `{{MITIGATION}}` |

################################################################################
TECHNICAL DEBT ASSESSMENT
################################################################################

`{{TECHNICAL_DEBT_ASSESSMENT}}`

Call out duplication, bypasses, missing abstractions, and “temporary” paths that would become permanent.

################################################################################
SCALABILITY ASSESSMENT
################################################################################

`{{SCALABILITY_ASSESSMENT}}`

Consider traffic growth, batch jobs, notification volume, sheet/API rate limits, and Worker limits.

################################################################################
SECURITY CONSIDERATIONS
################################################################################

`{{SECURITY_CONSIDERATIONS}}`

AuthZ, PII/immigration data sensitivity, secrets, injection, webhook verification, admin surfaces.

################################################################################
PERFORMANCE CONSIDERATIONS
################################################################################

`{{PERFORMANCE_CONSIDERATIONS}}`

Cold start, CPU time, payload size, N+1 queries, cache strategy, client bundle impact.

################################################################################
CLOUDFLARE COMPATIBILITY
################################################################################

`{{CLOUDFLARE_COMPATIBILITY}}`

Node-only APIs, long CPU, large responses, Durable Objects/Queues needs, env var Build vs Runtime, Error 1102-class risks.

################################################################################
BUSINESS ALIGNMENT
################################################################################

`{{BUSINESS_ALIGNMENT}}`

Free / Pro / Power capabilities, monetization, admin ops cost, support burden.

################################################################################
DESIGN SYSTEM ALIGNMENT
################################################################################

`{{DESIGN_SYSTEM_ALIGNMENT}}`

Mark N/A for pure backend/infra reviews. Otherwise: hierarchy, reuse of shared components, a11y, auth vs unauth states.

################################################################################
ENGINEERING RECOMMENDATIONS
################################################################################

`{{ENGINEERING_RECOMMENDATIONS}}`

Prefer concrete, ordered recommendations over vague advice. Link to existing modules to reuse.

################################################################################
SUGGESTED IMPLEMENTATION ORDER
################################################################################

Only if implementation is warranted after this review:

1. `{{STEP_1}}`
2. `{{STEP_2}}`
3. `{{STEP_N}}`

Map steps to future task IDs / templates (Notification, Backend, UI, Database, Documentation, Release) when possible.

################################################################################
FINAL RECOMMENDATION
################################################################################

Choose one and justify:

- [ ] **Approve** — architecture is sound; proceed to implementation tasks
- [ ] **Approve with conditions** — proceed only after Must-fix items (list them)
- [ ] **Revise design** — do not implement until design docs/architecture are updated
- [ ] **Defer / park** — not ready or out of sprint priority

`{{FINAL_RECOMMENDATION_RATIONALE}}`

################################################################################
REVIEW REPORT
################################################################################

After completing the review, report:

1. Review objective and scope
2. Files/docs reviewed
3. Checklist outcomes (pass / fail / N/A)
4. Risks (Must fix / Should improve / Future)
5. Technical debt, scalability, security, performance, Cloudflare notes
6. Business and Design System alignment
7. Engineering recommendations and suggested implementation order
8. Final recommendation (Approve / Approve with conditions / Revise / Defer)
9. Confirmation that **no application code was changed** (unless explicitly authorized)
10. Git status

################################################################################
GIT AND DEPLOYMENT RULES
################################################################################

- Do **not** modify application code under this template by default
- Do **not** commit or push unless explicitly instructed
- Do **not** deploy as part of an architecture review
- If docs must be updated to record decisions, use [DOCUMENTATION_TASK_TEMPLATE.md](./DOCUMENTATION_TASK_TEMPLATE.md) or an explicitly approved docs path list
- Implementation work requires a separate task using the appropriate implementation template
