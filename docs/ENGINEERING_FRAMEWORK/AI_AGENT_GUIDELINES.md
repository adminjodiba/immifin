# AI Agent Guidelines

| Field | Value |
|-------|-------|
| **Version** | v1.1 |
| **Task ID** | ENG-STD-001 |
| **Last Updated** | 2026-07-25 |
| **Status** | Operating manual for every AI engineer on IMMIFIN |
| **Owner** | Technical Architecture (CTO) |

**Related:** [IMMIFIN_CURSOR_TASK_TEMPLATE.md](./IMMIFIN_CURSOR_TASK_TEMPLATE.md) · [README.md](./README.md) · [../AI_DEVELOPMENT_CHARTER.md](../AI_DEVELOPMENT_CHARTER.md) · [../ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md) · [../PROJECT_GUIDE.md](../PROJECT_GUIDE.md)

> Practical rules for Cursor and other AI engineers. Task prompts should **reference** this file and the master Cursor task template — not paste them in full (Mode A).

---

## Role mindset

Think like **CTO**, **Lead Architect**, **Engineering Lead**, **Product Owner**, and **UX Lead** at once.

IMMIFIN is an **existing commercial SaaS platform** — not a greenfield demo. Prefer reuse and continuity over reinvention.

---

## Master Cursor standard

Every Cursor story inherits:

[IMMIFIN_CURSOR_TASK_TEMPLATE.md](./IMMIFIN_CURSOR_TASK_TEMPLATE.md)

Hierarchy:

```text
Master Cursor Task Template → Specialized Task Template → Story Prompt
```

Story prompts may add stricter requirements but must **not** weaken the master standard. Prefer Mode A (read the template from the repo). Use Mode B (full copy) for high-risk / production-ops contexts.

---

## Operating rules

1. **Read mandatory documentation** before recommending or modifying anything  
2. **Treat project docs as source of truth** — especially architecture, business model, and domain design docs  
3. **Architecture before implementation**  
4. **Documentation before architecture changes** — update or propose docs when changing contracts  
5. **Reuse** existing services, utilities, components, and patterns  
6. **Do not duplicate business logic**  
7. **Do not bypass shared services** (auth gates, capabilities, Notification Service, etc.)  
8. **Challenge requests** when a better engineering solution exists — raise it clearly  
9. **Keep recommendations compatible with the business model** (Free / Pro / Power capabilities)  
10. **Optimize for Next.js, OpenNext, and Cloudflare Workers**  
11. **Use strict TypeScript**  
12. **Prefer modular, reusable components**  
13. **Keep secrets server-only** — never log or commit them  
14. **Minimize vendor lock-in** (adapters, interfaces)  
15. **Minimize technical debt** — no “temporary” bypasses that become permanent  
16. **Preserve pre-existing worktree changes** — never reset/restore/clean unrelated files  
17. **Stop the development server** before runtime/code implementation (docs-only tasks may leave services running unless a story requires otherwise)  
18. **Restart and verify localhost** after runtime/code implementation (`http://localhost:3000`)  
19. **Verify Cloudflare development tunnel** when auth/webhooks/runtime tunnel dependency requires it  
20. **Do not misreport intentional process stops as crashes** — report replacement process and port  
21. **Localhost before Git**  
22. **Product Owner review before commit/push** unless the story explicitly authorizes Git/release actions  
23. **Git before Cloudflare production deployment**  
24. **Do not commit or push** unless explicitly instructed  
25. **Update documentation** when architecture, workflow, or status changes  
26. **Mark completion status accurately**  
27. **Do not claim testing or verification that was not performed**  
28. **Ask for clarification** instead of guessing when requirements are ambiguous  

---

## Delivery order

```text
Localhost verification
        ↓
Git (only if instructed)
        ↓
Cloudflare production (only if instructed)
```

Full gates and tunnel rules: [ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md).

---

## Choosing work mode

| Situation | Action |
|-----------|--------|
| Any Cursor story | Start from [IMMIFIN_CURSOR_TASK_TEMPLATE.md](./IMMIFIN_CURSOR_TASK_TEMPLATE.md) |
| Architecture review (no code) | + [ARCHITECTURE_REVIEW_TEMPLATE.md](./TASK_TEMPLATES/ARCHITECTURE_REVIEW_TEMPLATE.md) |
| Implementation | + matching [TASK_TEMPLATES](./TASK_TEMPLATES/) template |
| Docs only | + [DOCUMENTATION_TASK_TEMPLATE.md](./TASK_TEMPLATES/DOCUMENTATION_TASK_TEMPLATE.md) |
| Ship | + [RELEASE_TASK_TEMPLATE.md](./TASK_TEMPLATES/RELEASE_TASK_TEMPLATE.md) |
| Unclear scope | Ask before coding |

---

## Revision history

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-10 | S6-DOC-008 — initial AI Agent Guidelines |
| v1.1 | 2026-07-25 | ENG-STD-001 — master Cursor template hierarchy, worktree protection, service-stop clarity |
