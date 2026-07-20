# IMMIFIN v0.5.0 Release Notes

| Field | Value |
|-------|-------|
| **Version** | v0.5.0 |
| **Theme** | Commercial Platform Release |
| **Sprint** | Sprint 7 — Stripe Subscription Platform |
| **Document date** | 2026-07-20 |
| **Status** | **Release notes prepared** — application complete; Live commercial cutover **pending validation** |
| **Owner** | Product Strategy / Technical Architecture |

> These notes describe the **v0.5.0 commercial platform** delivered in application code. They do **not** claim that Live Stripe billing is already enabled on `https://immifin.com`. Production today remains the pre–Live-Stripe baseline until operational validation and signoff complete.

**Related documentation:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) · [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) · [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md)

---

## Executive Summary

**v0.5.0** is IMMIFIN’s first **commercial platform release**: a complete path from Pricing to paid Free / Pro / Power access, with IMMIFIN owning subscription policy and capabilities, and Stripe owning payment processing.

This release introduces the Stripe commercial platform, an in-product **Billing Center**, stronger capability-based authorization, subscription synchronization from verified billing events, and a substantial documentation refresh so engineers and operators can support the commercial path safely.

v0.5.0 is **application-ready for Sandbox validation**. Live payments, Live webhooks, and final commercial signoff remain **pending**.

---

## Release Highlights

- ✓ Commercial Subscription Platform (Free / Pro / Power)
- ✓ Stripe Checkout for new paid subscriptions
- ✓ Billing Center for plan changes and cancellation
- ✓ Subscription synchronization from verified Stripe events
- ✓ Capability-based authorization strengthened across product surfaces
- ✓ Pricing experience with monthly and annual plans
- ✓ Design system and navigation polish for commercial readiness
- ✓ Documentation maturity for architecture, billing, operations, and onboarding

---

## Major Features

### Commercial Platform

Customers can move from exploration on Free to paid Pro or Power through a clear commercial path. IMMIFIN keeps Free / Pro / Power as the product model; paid access continues to unlock personalization, automation, and (for Power) intelligence features defined in the business model.

### Billing Center

Subscribers manage their plan inside IMMIFIN at **Billing Center** (`/account/billing`): upgrade, downgrade, interval changes, and cancel-to-Free—according to published billing policy. This is the primary subscription management experience.

### Stripe Integration

New paid subscriptions use Stripe Checkout. IMMIFIN resolves approved prices on the server, maps one Stripe customer per profile (with Test/Live isolation), and relies on signed Stripe events to update subscription state. Browser return pages confirm progress; they do not grant access by themselves.

### Subscription Platform

Subscription state stays synchronized with Stripe over the subscription lifecycle—creation, updates, renewals, and cancellation—so the product can reflect the customer’s current plan predictably.

### Capability Platform

Premium access remains capability-based. Billing updates the customer’s plan; the product grants features through capabilities. That keeps packaging flexible and prevents payment-provider status checks from spreading through the UI.

### Notifications

The Notification Platform delivered in Sprint 6 remains the production-validated email path for Pro/Power journey updates. v0.5.0 does not redesign notifications; paid tiers continue to use the same entitlement model.

### Dashboard

My Immifin dashboards continue as the primary personalized value surface for Pro and Power. Commercial work strengthens the path into paid access and plan management without replacing the journey experience.

### User Experience

Navigation, premium discovery, Pricing, Billing Center, contact, and visual polish improve the commercial journey so upgrade and plan management feel intentional rather than bolted on.

---

## Architecture Improvements

- **Capability-first authorization** — features unlock through capabilities, not ad-hoc plan-name or Stripe-status checks
- **Webhook-authoritative billing** — verified billing events are the authority for paid access changes
- **Billing Center ownership** — IMMIFIN owns plan-change policy and UX; Stripe owns payments and invoices
- **Customer mapping** — one Stripe customer per IMMIFIN profile, isolated by environment
- **Clear money vs access boundary** — Stripe manages money; IMMIFIN manages entitlements and business rules
- **Documentation alignment** — architecture, design, operations, business model, and project guide updated for the commercial platform

---

## UI / UX Improvements

- Structured navigation for Immigration, Calculators, About, and My Immifin
- Premium navigation preview for locked Pro items (guided upgrade path instead of dead ends)
- Pricing page with monthly / annual selection and Checkout handoff
- Billing Center plan-change and confirmation experience
- Contact page and form improvements, including attachment support
- Design-system polish on CTAs and menus
- Landing ribbon motion polish
- Consistent Visa Bulletin date-type tab styling and workspace close patterns

---

## Operational Improvements

- As-built Sprint 7 handoff and current project state for operational truth
- System architecture updated for the commercial platform
- Stripe platform design and operations guides for Sandbox/Live cutover
- Business model refreshed for commercial strategy and Billing Center
- Project guide reading order for engineers and AI agents
- Engineering notes for the Stripe payment lifecycle
- Verification coverage for major commercial and UX surfaces

---

## Breaking Changes

No breaking changes for existing users on the current production baseline.

Unpaid users remain Free. Existing Pro/Power product capabilities and Premium Feature Discovery patterns are preserved. Live billing activation is a controlled cutover, not an automatic behavior change for customers until validation and signoff complete.

---

## Known Limitations

- Stripe Live validation and Live payments are **pending**
- Sandbox / signed end-to-end payment proof is **pending**
- Stripe Customer Portal for payment methods and invoices is **deferred** (placeholders in Billing Center)
- Full public landing / marketing redesign is planned for later work (Sprint 8 focus)
- Commercial launch signoff (v0.5.0 Live cutover) is **pending**
- Development Subscription Mode remains available for engineering/QA until explicitly disabled for Live

---

## Upgrade Notes

For engineers and operators preparing the commercial cutover:

1. Start with [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) and [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md).
2. Read [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) for as-built scope.
3. Follow [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md) and [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) for ownership boundaries.
4. Use [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md) for environment isolation, validation, monitoring, and recovery.
5. Keep [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) as the source of truth for Free / Pro / Power capabilities.
6. Do not grant premium access from browser success URLs; trust verified billing sync into capabilities.

---

## Production Readiness

### Completed (in application)

- ✓ Stripe Checkout and Pricing Checkout wiring
- ✓ Customer mapping
- ✓ Webhooks and subscription / billing-state synchronization
- ✓ Billing Center plan management
- ✓ Capability enforcement helpers and premium UI gating
- ✓ Commercial UX polish listed above
- ✓ Supporting documentation for architecture, billing, and operations

### Pending validation

- Live Stripe products, prices, webhook, and secrets
- Sandbox / Live signed payment and webhook proof
- Production entitlement cutover (Development Subscription Mode hard-off)
- Final commercial / v0.5.0 production signoff

**v0.5.0 must not be described as Live-released until pending validation and signoff are complete.**

---

## Looking Ahead

**Sprint 8** focuses on the public experience: landing redesign, marketing polish, remaining commercial conveniences (such as payment-method / invoice self-service), and broader UX refinements—including mobile responsiveness—after the commercial platform foundation is in place.

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-20 | S7-DOC-010 | Initial v0.5.0 release notes — commercial platform (Live validation pending) |
