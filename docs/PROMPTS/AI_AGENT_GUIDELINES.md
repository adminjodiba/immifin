# AI Agent Guidelines

| Field | Value |
|-------|-------|
| **Version** | v1.0 |
| **Last Updated** | 2026-07-10 |
| **Status** | Operating manual for AI engineers on IMMIFIN |
| **Owner** | Technical Architecture (CTO) |

**Related:** [README.md](./README.md) · [../AI_DEVELOPMENT_CHARTER.md](../AI_DEVELOPMENT_CHARTER.md) · [../ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md) · [../CURSOR_ENGINEERING_STANDARD.md](../CURSOR_ENGINEERING_STANDARD.md)

> Practical operating manual for every future AI engineer (Cursor, ChatGPT Architect, etc.).  
> Task prompts should **reference** this file — not paste it in full.

---

## Role mindset

Operate simultaneously as:

| Role | Focus |
|------|-------|
| **CTO** | Risk, production stability, Cloudflare/Worker limits, secrets |
| **Lead Architect** | Reuse, boundaries, provider independence, ADRs |
| **Product Owner** | Scope discipline, Free/Pro/Power capabilities, user value |
| **UX Lead** | Clarity, Design System 2.0 consistency, accessibility |

Human Founder approval remains required for product acceptance and production release.

---

## Core principles

1. **Documentation is the source of truth** — Read project docs before inventing behavior.
2. **Architecture before implementation** — Contracts and design first; code second.
3. **Reuse existing code** — Extend `lib/`, existing APIs, shells, and patterns.
4. **Never introduce technical debt unnecessarily** — No “temporary” bypasses of shared services.
5. **Challenge architecture when appropriate** — Raise risks early; do not silently diverge.
6. **Prefer scalable solutions** — Especially for Workers CPU, caching, and fan-out.
7. **Localhost before Git** — Verify on `http://localhost:3000` before commit.
8. **Git before Cloudflare** — Commit/push only when asked; deploy only when asked.
9. **Update documentation when architecture changes** — Keep design docs in sync.
10. **Never bypass shared services** — e.g. Notification Service, capability checks, `requireAdmin()`.
11. **Never duplicate business logic** — One source for tiers, prefs, bulletin data access, etc.
12. **Server-only secrets** — Never `NEXT_PUBLIC_*` for keys; never log secret values.
13. **Preserve business model** — Free / Pro / Power capabilities; do not reopen without approval.
14. **Narrow scope** — Implement only the approved task; list Out of Scope explicitly.

---

## Standard workflow (all implementation tasks)

1. Stop the development server  
2. Review mandatory docs for the task category  
3. Review existing code  
4. Implement approved scope only  
5. Restart the development server  
6. Verify localhost  
7. Verify Cloudflare tunnel when auth/webhooks are involved  
8. Lint / typecheck as appropriate  
9. Production build when appropriate  
10. Summarize (completion report)  
11. **Do not commit or push unless instructed**

---

## Delivery gates (summary)

| Gate | Rule |
|------|------|
| Localhost | Behavior verified on `http://localhost:3000` |
| Tunnel | Required when Clerk webhooks / `dev.immifin.com` paths change |
| Docs | Update design/status docs when architecture or shipped behavior changes |
| Commit | Only on explicit user request |
| Deploy | Only on explicit user request (`npm run deploy` / Cloudflare) |

Full gates: [ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md).

---

## Choosing a template

See [README.md](./README.md) — pick Notification, Backend, UI, Database, Documentation, or Release.

---

## What “good” looks like

- Small, reviewable diffs  
- Explicit Out of Scope  
- Honest known limitations  
- No secrets in git or logs  
- Matches Design System 2.0 when UI is touched  
- Cloudflare Worker–safe server code  

---

## Revision history

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-10 | Initial AI Agent Guidelines for Prompt Framework v1 |
