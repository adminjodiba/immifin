# IMMIFIN Project Guide

| Field | Value |
|-------|-------|
| **Title** | IMMIFIN Project Guide |
| **Version** | v1.4 |
| **Task ID** | S7-DOC-008 |
| **Last Updated** | 2026-07-20 |
| **Owner** | Technical Architecture (CTO) |
| **Status** | Official — **master entry point for all contributors** |

> **Read this document first.** Every developer, AI assistant, and contributor should read this guide before making recommendations, writing code, or modifying architecture.

This document orients contributors quickly. It does **not** replace architecture, design, or operations documents — it tells you where to go next.

---

## 1. Project Overview

**IMMIFIN** is a commercial SaaS platform focused on immigration tools first, with finance and insurance as longer-term modules. It helps immigrants make clearer immigration and life decisions through dashboards, calculators, automation, and paid personalization.

| Field | Value |
|-------|-------|
| **Current production version** | **v0.4.2** + Notification Platform **v1.0** (`https://immifin.com`) |
| **Platform maturity** | Core product stable; commercial Stripe path implemented in application code |
| **Commercial readiness** | Application-ready for Sandbox validation; **not** Live-production-ready |
| **Target next release** | **v0.5.0** commercial Stripe platform (signoff pending) |
| **Tech stack** | Next.js 15 · React 19 · Tailwind · Clerk · Supabase · Stripe · Resend · Cloudflare Workers (OpenNext) |

Authoritative status: [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md).

---

## 2. Current Platform

| Area | Summary |
|------|---------|
| **Authentication** | Clerk sign-in/up, protected routes, session handling |
| **User profiles** | Account profile, immigration profile, contact preferences / onboarding |
| **Visa Bulletin** | Current bulletin, history, movement tracker, stamping wait map |
| **Dashboards** | My Immifin personalization, journey surfaces, Pro gates |
| **Calculators** | Green Card wait, citizenship, H-1B tools |
| **Notifications** | Resend email platform — **production validated** (Sprint 6) |
| **Stripe platform** | Checkout, customer mapping, webhooks, billing-state sync, subscription change APIs |
| **Billing Center** | `/account/billing` — IMMIFIN-owned upgrade / downgrade / interval / cancel |
| **Capability enforcement** | Capability map + server helpers + premium UI gates |
| **Design system / UX** | DS 2.0 surfaces, nav polish, commercial CTA/menu patterns, landing ribbon polish |

**Business model (brief):** Free / Pro / Power. Access is **capability-based**, not plan-name checks in UI. Source of truth: [BUSINESS_MODEL.md](./BUSINESS_MODEL.md).

**Billing ownership (brief):** Stripe owns money; IMMIFIN owns policy, capabilities, and Billing Center plan changes. Customer Portal (payment method / invoices) is deferred.

---

## 3. Project Documentation Map

### Recommended reading order

| Order | Document | Purpose |
|-------|----------|---------|
| 1 | [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) | Master onboarding entry point (this file) |
| 2 | [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) | Where the project is today — start for status |
| 3 | [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) | As-built Sprint 7 commercial platform record |
| 4 | [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | System / infrastructure / platform architecture |
| 5 | [ROADMAP_v2.md](./ROADMAP_v2.md) | Forward sprint sequencing (Sprint 8 active focus) |
| 6 | Feature design docs | Deep dives for the surface you are changing |
| 7 | Operations docs | How to run, validate, and support production systems |

### Feature / commercial design docs (as needed)

| Document | Purpose |
|----------|---------|
| [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md) | IMMIFIN vs Stripe ownership ADR |
| [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) | As-built Stripe platform design |
| [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md) | Upgrade / downgrade / cancel commercial rules |
| [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) | Tiers, capabilities, Premium Feature Discovery |
| [NOTIFICATION_DESIGN.md](./NOTIFICATION_DESIGN.md) | Notification Platform design |
| [NOTIFICATION_PLATFORM_SIGNOFF.md](./NOTIFICATION_PLATFORM_SIGNOFF.md) | Notification Platform production validation |
| [CALCULATORS.md](./CALCULATORS.md) | Calculator inventory and rules |
| [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md) | Admin Data Refresh Center |

### Operations & engineering process

| Document | Purpose |
|----------|---------|
| [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md) | Stripe ops — envs, workflows, monitoring, recovery, validation |
| [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) | Implementation workflow and release gates |
| [ENGINEERING_FRAMEWORK/README.md](./ENGINEERING_FRAMEWORK/README.md) | AI task templates and agent guidelines |
| [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) | Localhost + tunnel setup |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Cloudflare deployment summary |
| [AI_DEVELOPMENT_CHARTER.md](./AI_DEVELOPMENT_CHARTER.md) | AI governance and task classification |
| [PROMPT_TEMPLATE.md](./PROMPT_TEMPLATE.md) | Standard Cursor prompt format |

### Historical / release references

| Document | Purpose |
|----------|---------|
| [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) | Sprint 6 planned vs completed |
| [SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md) | Sprint 5 historical context |
| [RELEASE_NOTES_v0.4.2.md](./RELEASE_NOTES_v0.4.2.md) | v0.4.2 release notes |
| [RELEASE_NOTES_v0.4.1.md](./RELEASE_NOTES_v0.4.1.md) | v0.4.1 foundation release notes |
| [V0_4_1_FOUNDATION_SIGNOFF.md](./V0_4_1_FOUNDATION_SIGNOFF.md) | Frozen foundation architectural decisions |
| [PRODUCT_VISION.md](./PRODUCT_VISION.md) | Long-term product vision |
| [COMMERCIAL_PLATFORM_VISION.md](./COMMERCIAL_PLATFORM_VISION.md) | Post-beta commercial management vision (deferred) |

---

## 4. Engineering Principles

| Principle | Meaning |
|-----------|---------|
| **Architecture first** | Inspect architecture and docs before writing code |
| **Documentation first** | Document major decisions before or with implementation |
| **Code follows design** | Prefer approved design/ADR/policy over inventing behavior |
| **Capability-first authorization** | Use the capability map and helpers — not scattered plan or Stripe-status checks |
| **Webhook-authoritative billing** | Browser success redirects never grant paid access |
| **Localhost before production** | Verify on `http://localhost:3000` (and tunnel when webhooks matter) before ship |
| **Small iterative changes** | Stay in task scope; avoid drive-by refactors |
| **No undocumented architectural changes** | Platform boundary changes require docs + approval |

Governance docs: [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) · [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md).

---

## 5. Development Workflow

| Step | Action |
|------|--------|
| 1 | **Understand** — read this guide, current state, and relevant design/ops docs |
| 2 | **Design** — confirm architecture/policy before coding when behavior changes |
| 3 | **Implement** — stay within approved task scope; reuse existing patterns |
| 4 | **Localhost** — verify on `localhost:3000`; use tunnel for webhook/auth work |
| 5 | **Review** — TypeScript / lint / focused verification as required by the task |
| 6 | **Documentation** — update the owning docs when behavior or ops change |
| 7 | **Git** — commit / push only when the user explicitly requests |
| 8 | **Production** — Cloudflare deploys from `main`; smoke-test only after explicit deploy intent |

Details: [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) · [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md).

---

## 6. Current Sprint Status

| Item | Status |
|------|--------|
| **Sprint 7 — Commercial Platform** | **Completed in application code** |
| **Live Stripe / Sandbox E2E / v0.5.0 signoff** | **Production validation pending** |
| **Customer Portal (payment method / invoices)** | Deferred |
| **Active roadmap focus** | **Sprint 8** — public experience, landing redesign, commercial polish |

Do not duplicate the full roadmap here. See [ROADMAP_v2.md](./ROADMAP_v2.md) and [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md).

---

## 7. Contribution Guidelines

- Read architecture and current state before proposing changes.
- Keep documents synchronized with behavior changes you ship.
- Do not bypass capabilities for “temporary” premium access.
- Do not authorize features from raw Stripe status in UI or APIs.
- Do not duplicate immigration math, billing policy, or entitlement logic.
- Document architectural or billing-boundary changes in the owning docs.
- Preserve completed sprint history — update as-built/status docs; do not rewrite old handoffs casually.
- Do not commit, push, or deploy unless the user explicitly asks.

### What must not change casually

These require explicit product approval before modification:

| Decision | Why protected |
|----------|---------------|
| Free / Pro / Power + capability model | Business model source of truth |
| Premium Feature Discovery pattern | Standard premium UX |
| My Immifin workspace model | Personal hub distinct from product modules |
| Webhook-authoritative billing | Commercial integrity |
| Billing Center as plan-management UX | Portal is not the primary plan orchestrator |
| Middleware = Clerk auth only | Cloudflare reliability constraint |
| Production unpaid default = Free | Entitlement safety |

See [V0_4_1_FOUNDATION_SIGNOFF.md](./V0_4_1_FOUNDATION_SIGNOFF.md) and [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md).

---

## 8. Quick Links

| Topic | Document |
|-------|----------|
| **Current state** | [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) |
| **Sprint 7 handoff** | [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) |
| **Architecture** | [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) |
| **Roadmap** | [ROADMAP_v2.md](./ROADMAP_v2.md) |
| **Billing design** | [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) |
| **Billing ADR** | [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md) |
| **Stripe operations** | [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md) |
| **Business model** | [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) |
| **Release notes** | [RELEASE_NOTES_v0.4.2.md](./RELEASE_NOTES_v0.4.2.md) · [RELEASE_NOTES_v0.4.1.md](./RELEASE_NOTES_v0.4.1.md) |
| **Production runbook** | Planned — not yet published (see pending commercial validation in current state) |
| **Engineering framework** | [ENGINEERING_FRAMEWORK/README.md](./ENGINEERING_FRAMEWORK/README.md) |

---

## For AI Assistants

Before recommending or coding:

1. Start with this guide, then [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md).
2. Prefer as-built handoff + code over outdated mid-sprint planning language.
3. Treat [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) as gating truth and billing docs as commercial truth.
4. Preserve architectural consistency; do not casually redesign subscription or premium UX patterns.
5. Use [PROMPT_TEMPLATE.md](./PROMPT_TEMPLATE.md) / [ENGINEERING_FRAMEWORK](./ENGINEERING_FRAMEWORK/README.md) task templates when provided.
6. Do not commit, push, or deploy unless explicitly requested.

---

## Project North Star

Help immigrants make better immigration and life decisions with trustworthy tools, personalization, and automation.

A first-time visitor should believe IMMIFIN is a polished commercial product quickly. Every feature should improve trust, quality, personalization, automation, intelligence, or commercial readiness.

See [PRODUCT_VISION.md](./PRODUCT_VISION.md).

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-04 | S4-005.17 | Master project guide — official entry point |
| v1.1 | 2026-07-04 | S4-005.18 | Stable baseline, governance, version evolution, north star |
| v1.2 | 2026-07-11 | S7-DOC-001 | Stripe design added to documentation index; Sprint 7 Planning |
| v1.3 | 2026-07-11 | S7-DOC-002 | Stripe Operations added to documentation index |
| v1.4 | 2026-07-20 | S7-DOC-008 | Post–Sprint 7 onboarding — reading order, platform status, Sprint 8 focus |
