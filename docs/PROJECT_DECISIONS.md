# Immifin — Project Decisions

**Purpose:** Permanent engineering decision log. Records **why** important decisions were made.

This document is **not** a changelog, backlog, or status report. For those, see [CHANGELOG.md](./CHANGELOG.md), [SPRINT_BACKLOG.md](./SPRINT_BACKLOG.md), and [PROJECT_STATUS.md](./PROJECT_STATUS.md).

**Last updated:** 2026-06-30

---

## Decision 001 — Cloudflare Workers + OpenNext

| Field | Value |
|-------|-------|
| **Decision** | Immifin uses **Cloudflare Workers** with **OpenNext** (`@opennextjs/cloudflare`). |
| **Date** | 2026-06-27 |
| **Status** | Accepted |

**Reason:**

- Global edge deployment
- Low operating cost
- Native Next.js support
- Good scalability
- Fast deployment

---

## Decision 002 — GitHub Auto Deployment

| Field | Value |
|-------|-------|
| **Decision** | Production deployments happen **automatically from GitHub** (push to `main`). |
| **Date** | 2026-06-27 |
| **Status** | Accepted |

**Reason:**

- Version history
- Easy rollback
- CI/CD
- Team friendly
- Repeatable deployment

---

## Decision 003 — Secrets Management

| Field | Value |
|-------|-------|
| **Decision** | Secrets are stored using **Wrangler Version Secrets**. Never hardcode production secrets. |
| **Date** | 2026-06-27 |
| **Status** | Accepted |

**Reason:**

- Security
- Portability
- Git safety

**Reference:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Decision 004 — Reference Architecture

| Field | Value |
|-------|-------|
| **Decision** | Future interactive pages should follow the architecture already proven by **Visa Bulletin Movement Tracker**. |
| **Date** | 2026-06-27 |
| **Status** | Accepted |

**Reason:**

- Reuse working patterns
- Reduce bugs
- Maintain consistency

**Pattern:** Small Client Component for interactivity; Server Component parent; SWR + API route for data.

---

## Decision 005 — Server vs Client Components

| Field | Value |
|-------|-------|
| **Decision** | Prefer **Server Components**. Introduce **Client Components** only where interactivity requires them. |
| **Date** | 2026-06-27 |
| **Status** | Accepted |

**Reason:**

- Performance
- Simplicity
- Maintainability

---

## Decision 006 — Deployment Strategy

| Field | Value |
|-------|-------|
| **Decision** | Infrastructure changes and feature development should be done in **separate iterations** whenever possible. |
| **Date** | 2026-06-27 |
| **Status** | Accepted |

**Reason:**

- Easier debugging
- Smaller deployments
- Lower production risk

---

## Decision 007 — Development Workflow v2.0

| Field | Value |
|-------|-------|
| **Decision** | All feature work follows **Development Workflow v2.0**: feature branches, inspect-before-code, architecture explanation before implementation, localhost testing, user approval, `npm run build` gate, separate infra/feature work, clean repo at session end, and doc updates when workflow or architecture changes. |
| **Date** | 2026-06-30 |
| **Status** | Accepted |

**Reason:**

- `main` auto-deploys to production; direct feature work on `main` increases risk.
- Inspect-first and architecture-before-code reduce rework and scope creep.
- Localhost verification and explicit user approval catch UX issues before production.
- `npm run build` catches type and compile errors before merge.
- Separating infrastructure from features simplifies debugging and rollback.
- Documented workflow keeps Cursor, ChatGPT, and Founder aligned.

**Rules (summary):**

1. Feature branches for new work
2. No feature development directly on `main`
3. Inspect before coding
4. Explain architecture before implementation
5. Test localhost before commit
6. User approval after localhost verification
7. `npm run build` must pass before merge/push
8. Never combine infrastructure and feature work
9. Keep repository clean before ending a session
10. Update docs when architecture/workflow changes

**Reference:** [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) §8

---

## Future Decisions

*(No entries yet. Add new decisions here as they are accepted.)*

| ID | Title | Status |
|----|-------|--------|
| — | — | — |

---

## Related documentation

| Document | Contents |
|----------|----------|
| [TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md) | Application architecture and coding conventions |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Infrastructure and environments |
| [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) | Workflow and engineering rules |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Build, deploy, and secrets |
