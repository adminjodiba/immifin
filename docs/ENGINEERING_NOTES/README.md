# IMMIFIN Engineering Notes

| Field | Value |
|-------|-------|
| **Audience** | Engineers, AI coding agents, maintainers, Product Owner |
| **Visibility** | Internal — not public product documentation |
| **Purpose** | Explain *why* IMMIFIN is built the way it is |

---

## What Engineering Notes Are

Engineering Notes are an internal knowledge base. They sit alongside — but are intentionally different from — implementation documents such as task handoffs, ADRs, and operational runbooks.

| Engineering Notes explain… | Implementation documents explain… |
|----------------------------|-----------------------------------|
| Architecture and philosophy | Approved contracts and procedures |
| Design decisions and trade-offs | Step-by-step setup and configuration |
| End-to-end system journeys | What was built in a specific task |
| Lessons learned | Acceptance criteria and file lists |

Use Engineering Notes when you need to understand **intent** before changing code. Use implementation documents when you need to **execute** or **verify** work.

---

## What Belongs Here

Engineering Notes should:

- Explain architecture at a subsystem level
- Document design decisions and the reasoning behind them
- Capture engineering philosophy that spans multiple tasks
- Help future contributors avoid repeating past mistakes
- Remain readable by both humans and AI agents

Engineering Notes should **not**:

- Replace authoritative policy or architecture ADRs
- Duplicate line-by-line implementation detail
- Contain secrets, credentials, or environment values
- Mark features complete unless code and verification support that claim

---

## Numbering Convention

Each note uses the prefix `EN-###` and a descriptive slug:

```text
EN-001_Stripe_Payment_Lifecycle.md
EN-002_Stripe_Webhooks.md
```

The number reflects introduction order, not dependency order.

---

## Planned Engineering Notes

Every major subsystem should eventually receive an Engineering Note. Planned topics include:

| ID | Topic |
|----|-------|
| **EN-001** | [Stripe Payment Lifecycle](./EN-001_Stripe_Payment_Lifecycle.md) |
| **EN-002** | Stripe Webhooks |
| **EN-003** | Customer Mapping |
| **EN-004** | Event Idempotency |
| **EN-005** | Billing vs Capability Engine |
| **EN-006** | Notification Architecture |
| **EN-007** | Authentication Flow |
| **EN-008** | Dashboard Architecture |
| **EN-009** | AI Architecture |
| **EN-010** | Release Workflow |
| **EN-011** | [Contact Onboarding Guard — Session Cache](./EN-011_Contact_Onboarding_Session_Cache.md) |

---

## Related Documentation

| Document | Role |
|----------|------|
| [BILLING_ARCHITECTURE.md](../BILLING_ARCHITECTURE.md) | Approved billing ADR — ownership boundaries |
| [STRIPE_BILLING_POLICY.md](../STRIPE_BILLING_POLICY.md) | Commercial policy rules |
| [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](../STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) | Sprint 7 platform design (source of truth) |
| [STRIPE_OPERATIONS.md](../STRIPE_OPERATIONS.md) | Operational runbook |
| [ENGINEERING_FRAMEWORK/README.md](../ENGINEERING_FRAMEWORK/README.md) | Task templates and agent guidelines |

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-12 | DOC-EN-001 | Initial Engineering Notes index |
