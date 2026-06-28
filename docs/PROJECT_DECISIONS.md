# Immifin — Project Decisions

**Purpose:** Permanent engineering decision log. Records **why** important decisions were made.

This document is **not** a changelog, backlog, or status report. For those, see [CHANGELOG.md](./CHANGELOG.md), [SPRINT_BACKLOG.md](./SPRINT_BACKLOG.md), and [PROJECT_STATUS.md](./PROJECT_STATUS.md).

**Last updated:** 2026-06-27

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
