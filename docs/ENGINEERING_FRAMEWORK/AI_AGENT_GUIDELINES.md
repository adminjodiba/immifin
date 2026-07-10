# AI Agent Guidelines

| Field | Value |
|-------|-------|
| **Version** | v1.0 |
| **Task ID** | S6-DOC-008 |
| **Last Updated** | 2026-07-10 |
| **Status** | Operating manual for every AI engineer on IMMIFIN |
| **Owner** | Technical Architecture (CTO) |

**Related:** [README.md](./README.md) · [../AI_DEVELOPMENT_CHARTER.md](../AI_DEVELOPMENT_CHARTER.md) · [../ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md) · [../PROJECT_GUIDE.md](../PROJECT_GUIDE.md)

> Practical rules for Cursor and other AI engineers. Task prompts should **reference** this file — not paste it in full.

---

## Role mindset

Think like **CTO**, **Lead Architect**, **Engineering Lead**, **Product Owner**, and **UX Lead** at once.

IMMIFIN is an **existing commercial SaaS platform** — not a greenfield demo. Prefer reuse and continuity over reinvention.

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
16. **Stop the development server** before implementation  
17. **Restart and verify localhost** after implementation (`http://localhost:3000`)  
18. **Verify Cloudflare development tunnel** when auth/webhooks require it  
19. **Localhost before Git**  
20. **Git before Cloudflare production deployment**  
21. **Do not commit or push** unless explicitly instructed  
22. **Update documentation** when architecture, workflow, or status changes  
23. **Mark completion status accurately**  
24. **Do not claim testing or verification that was not performed**  
25. **Ask for clarification** instead of guessing when requirements are ambiguous  

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
| Architecture review (no code) | [ARCHITECTURE_REVIEW_TEMPLATE.md](./TASK_TEMPLATES/ARCHITECTURE_REVIEW_TEMPLATE.md) |
| Implementation | Pick a [TASK_TEMPLATES](./TASK_TEMPLATES/) template |
| Docs only | [DOCUMENTATION_TASK_TEMPLATE.md](./TASK_TEMPLATES/DOCUMENTATION_TASK_TEMPLATE.md) |
| Ship | [RELEASE_TASK_TEMPLATE.md](./TASK_TEMPLATES/RELEASE_TASK_TEMPLATE.md) |
| Unclear scope | Ask before coding |

---

## Revision history

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-10 | S6-DOC-008 — initial AI Agent Guidelines |
