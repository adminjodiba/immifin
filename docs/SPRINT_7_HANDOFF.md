# IMMIFIN Sprint 7 Handoff — Stripe Subscription Platform

| Field | Value |
|-------|-------|
| **Sprint** | Sprint 7 |
| **Theme** | Stripe Subscription Platform |
| **Kickoff Date** | 2026-07-11 |
| **Status** | **In progress** — kicked off |
| **Previous sprint** | Sprint 6 — Notification Platform **Production Validated** |
| **Previous handoff** | [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) |
| **Production baseline** | Notification Platform v1.0 (`6f1df7e`) on https://immifin.com |

**Related:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [ROADMAP_v2.md](./ROADMAP_v2.md) · [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) · [architecture/ADR-007-Development-Subscription-Mode.md](./architecture/ADR-007-Development-Subscription-Mode.md) · [NOTIFICATION_PLATFORM_SIGNOFF.md](./NOTIFICATION_PLATFORM_SIGNOFF.md)

> **This document is the first thing a new AI assistant or engineer must read for Sprint 7.**

---

## 1. Read This First

Sprint 6 closed the **Notification Platform**. Sprint 7 replaces **Development Subscription Mode** with real **Stripe billing**.

IMMIFIN already has:

- Free / Pro / Power **capability model** (`lib/subscription/capabilities.ts`)
- Persisted `profiles.plan` + `subscriptions.plan`
- Pricing UI + Dev Subscription Mode (ADR-007)
- Pro/Power feature gates throughout the product

Sprint 7 wires **payment → same plan field → same capabilities**. Do **not** redesign the tier/capability model.

---

## 2. Why Sprint 7 is Stripe (roadmap revision)

Roadmap v2 originally placed Stripe in **Sprint 10** (Commercial Launch Readiness) and Finance in Sprint 7.

After Sprint 6 Notification closeout, product priority is:

> **Monetize the platform that already delivers Pro/Power value** (dashboard + Monthly Immigration Updates).

| Previous (Roadmap v2) | Revised (2026-07-11) |
|-----------------------|----------------------|
| Sprint 7 — Finance Platform | **Sprint 7 — Stripe Subscription Platform** |
| Sprint 10 — Stripe / Commercial Launch | Shifted later (post-Stripe polish / launch readiness) |
| Finance / Insurance / AI | Remain planned; deferred after Stripe foundation |

See [ROADMAP_v2.md](./ROADMAP_v2.md).

---

## 3. Sprint goal

**Ship Stripe-backed Free → Pro / Power subscriptions** so real customers can pay, and Development Subscription Mode can be retired (or admin-only) in production.

High-level outcomes:

| Outcome | Description |
|---------|-------------|
| Checkout | Stripe Checkout (or equivalent) for Pro and Power |
| Webhooks | Reliable plan updates from Stripe → Supabase |
| Customer portal | Manage / cancel / update payment method |
| Plan enforcement | Paid plan drives `profiles.plan` / capabilities |
| Dev mode sunset path | Clear rule for when `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE` is off in production |

---

## 4. Mandatory reading (before implementation)

1. This handoff  
2. [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) — what just shipped  
3. [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) — Free / Pro / Power capabilities & pricing intent  
4. [architecture/ADR-007-Development-Subscription-Mode.md](./architecture/ADR-007-Development-Subscription-Mode.md) — current plan persistence  
5. [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md)  
6. Existing code: `lib/subscription/**`, `app/api/account/subscription/route.ts`, `components/pricing/PricingPlans.tsx`

**Documentation-first:** Write / approve a Stripe design note (S7-DOC-001) before Checkout/webhook code.

---

## 5. Suggested Sprint 7 order

| Order | Task | Intent |
|-------|------|--------|
| 1 | **S7-DOC-001** | Stripe architecture design — Checkout, webhooks, portal, plan mapping, secrets, Cloudflare constraints |
| 2 | **S7-DB-001** | Schema for Stripe customer / subscription IDs (minimal; keep `plan` as source of product access) |
| 3 | **S7-API-001** | Checkout session + webhook handlers (server-only secrets) |
| 4 | **S7-UI-001** | Pricing CTAs → Checkout; success/cancel return URLs |
| 5 | **S7-UI-002** | Billing portal entry (Account / Manage Profile) |
| 6 | **S7-SEC-001** | Webhook signature verification, idempotency, audit |
| 7 | **S7-OPS-001** | Env vars (local + Cloudflare), test mode → live checklist |
| 8 | **S7-REL-001** | Localhost + production smoke; disable or gate Dev Mode in production |

Exact task IDs may be refined in S7-DOC-001.

---

## 6. Architecture constraints (locked)

| Rule | Detail |
|------|--------|
| **Reuse capability model** | Stripe sets `plan`; `hasCapability` / `canAccess*` stay the gate |
| **No duplicate authorization** | Do not invent a second “paid” flag that bypasses capabilities |
| **Server-only secrets** | `STRIPE_SECRET_KEY`, webhook secret — never `NEXT_PUBLIC_` |
| **Cloudflare Workers** | Prefer Stripe APIs that work on Workers; avoid Node-only SDK patterns that break OpenNext |
| **Clerk remains auth** | Stripe does not replace Clerk; link by email / `clerk_user_id` / customer metadata |
| **Notification Platform untouched** | Do not redesign email/notification for Sprint 7 unless billing emails are explicitly scoped |
| **Data retention** | Tier changes must not delete immigration profile data ([dataRetention](../lib/subscription/dataRetention.ts)) |

### Target flow (draft — finalize in S7-DOC-001)

```text
User → Pricing → Stripe Checkout
  → Stripe webhook (checkout.session.completed / subscription.*)
  → updateSubscriptionPlan() → profiles.plan + subscriptions.plan
  → SubscriptionTierProvider → capabilities → product features
```

---

## 7. What not to do

- Do **not** start Checkout UI before S7-DOC-001 design is written  
- Do **not** remove Dev Subscription Mode until Stripe webhook path is verified  
- Do **not** store card numbers in Supabase  
- Do **not** call Stripe from client with secret keys  
- Do **not** expand into Finance / Insurance / AI feature work in this sprint  
- Do **not** rebuild Notification Platform  

---

## 8. Carry-forward from Sprint 6 (deferred — not Sprint 7)

| Item | Notes |
|------|-------|
| Admin Force Sync / archive UI polish | S6-ADM-001 |
| AI & Personalization | S6-AI-xxx |
| Notification Queues / auto-send / SMS | Post Notification v1.0 |
| Immigration Broadcast Platform | Parked |

---

## 9. Kickoff checklist

- [x] Sprint 6 Notification track closed and documented  
- [x] Sprint 7 theme = Stripe Subscription Platform  
- [x] Roadmap revised (Stripe pulled forward to Sprint 7)  
- [ ] S7-DOC-001 Stripe design written and approved  
- [ ] First implementation task started after design  

---

## Revision History

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-11 | Sprint 7 kicked off — Stripe Subscription Platform |
