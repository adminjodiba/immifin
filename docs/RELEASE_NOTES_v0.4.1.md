# IMMIFIN Release Notes — v0.4.1

| Field | Value |
|-------|-------|
| **Version** | v0.4.1 |
| **Sprint** | Sprint 4 |
| **Release Date** | 2026-07-04 |
| **Status** | Foundation milestone — stable platform before Design System 2.0 |
| **Owner** | Technical Architecture (CTO) |

**Related documentation:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) · [PRODUCT_VISION.md](./PRODUCT_VISION.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md)

---

## Summary

v0.4.1 completes the **IMMIFIN platform foundation**. This release establishes the subscription model, capability-based authorization, personal workspace, dashboard framework, profile management, premium feature gating, and the **Premium Feature Discovery** UX pattern — all documented and ready for **Design System 2.0**, the next major initiative.

No billing integration ships in this release. Stripe and real subscription storage remain future work.

---

## Major Features

### My Immifin workspace

- **My Immifin** top-level navigation dropdown — personal workspace distinct from Immigration, Finance, and Insurance modules
- Phase 1 menu: **Dashboard**, **Manage Profile**
- Pure navigation trigger (no direct navigation on click)
- Avatar menu limited to account-level actions (Sign Out) — no duplicate workspace links

### Personal dashboard

- `/dashboard` — authenticated home with stable journey layout (main content + right sidebar)
- Employment-Based comparative timeline (Priority Date, Visa Bulletin cutoff, Today)
- Green Card citizenship journey timeline
- Today's Focus and Action Center guidance model
- Free users see locked dashboard preview with upgrade path

### Profile management

- Manage Profile hub with Account, Security, Immigration, Green Card, Contact, Notifications
- Free / Pro / Power profile access rules enforced by capabilities
- In-app confirmation modals for Clear Section (replaces browser `confirm`)
- Page-level dirty state — unsaved changes prompt before closing profile
- Free users can edit Contact; Immigration, Green Card, and Notifications locked with upgrade CTAs

### Premium Feature Discovery

- **PremiumFeaturePreview** component — renders the real premium page underneath a blurred overlay
- No screenshots, no duplicate layouts, no manually maintained preview images
- Feature-specific benefit groups per premium page
- Close (X) dismisses overlay → educational Free-state info panel (Visa Bulletin History and Movement Tracker)
- Upgrade CTA → `/pricing`; Compare Plans → `/pricing#plans`

### Pricing foundation

- `/pricing` page with Free / Pro / Power plan cards
- Coming Soon CTAs until Stripe billing connects

### Calculators

- Free users: manual input only
- Pro/Power: auto-population from saved profile (when capability granted)
- Calculator navigation restored in top nav

---

## Architecture

| Area | Implementation |
|------|----------------|
| **Subscription tiers** | `lib/subscription/tiers.ts` — `free`, `pro`, `power` |
| **Capabilities** | `lib/subscription/capabilities.ts` — central tier→capability map |
| **Access checks** | `hasCapability(tier, key)` / `canAccess*(tier)` — not scattered plan-name checks |
| **Dev tier testing** | `?devTier=`, localStorage, DevTierSwitcher — development only |
| **Production default** | Users without enrolled tier default to **Free** |
| **Premium gating** | `PremiumFeaturePreview`, `ProFeatureGate`, `ProFeatureLockedState`, `DashboardAccessGate` |

See [BUSINESS_MODEL.md §12](./BUSINESS_MODEL.md#12-subscription-capability-architecture) and [SYSTEM_ARCHITECTURE.md §14](./SYSTEM_ARCHITECTURE.md#14-application-access-layer-subscription-capabilities).

---

## Subscription

### Philosophy

| Layer | Tier |
|-------|------|
| **Manual Tools** | Free |
| **Personalization & Automation** | Pro |
| **AI & Advanced Intelligence** | Power |

**Source of truth:** [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) — all future feature gating decisions must reference this document.

### Capability matrix (summary)

| Capability | Free | Pro | Power |
|------------|------|-----|-------|
| Personal Dashboard | ❌ | ✅ | ✅ |
| Save Immigration Profile | ❌ | ✅ | ✅ |
| Visa Bulletin History | ❌ | ✅ | ✅ |
| Movement Tracker | ❌ | ✅ | ✅ |
| Auto Calculator Population | ❌ | ✅ | ✅ |
| Notifications | ❌ | ✅ | ✅ |
| AI | ❌ | ❌ | ✅ |
| Multiple Profiles | ❌ | ❌ | ✅ |

Full matrix: [BUSINESS_MODEL.md §3 and §12](./BUSINESS_MODEL.md#3-feature-matrix).

---

## UX

### Premium Feature Discovery (standard pattern)

All future premium features should follow this flow for Free users:

```
Real Pro page
    ↓
Blurred preview
    ↓
Premium overlay (value + feature-specific benefits + upgrade CTA)
    ↓ (optional: user clicks X)
Educational information state (no Pro access)
```

**Design intent:** Users should think *"I want those insights"* — not *"I hit another paywall."*

See [PRODUCT_VISION.md §20](./PRODUCT_VISION.md#20-premium-feature-discovery) and [BUSINESS_MODEL.md §15](./BUSINESS_MODEL.md#15-premium-feature-discovery).

### Profile UX

- In-app Clear Section confirmation modals
- Unsaved changes protection on Manage Profile exit
- Locked profile sections with consistent Pro upgrade messaging

### Dashboard UX

- Stable layout architecture — layout stable, content dynamic
- EB comparative timeline vs GC progress timeline rules documented
- Today's Focus + Action Center guidance model

---

## Deployment

- **Production hosting:** Cloudflare Workers via OpenNext
- **Build command:** `npm run deploy`
- **Deploy command:** `echo done` (OpenNext build includes deploy step)
- **Auto-deploy:** GitHub `main` → Cloudflare

See [SYSTEM_ARCHITECTURE.md §8](./SYSTEM_ARCHITECTURE.md#8-production-deployment) and [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## Known Future Work

| Item | Notes |
|------|-------|
| **Design System 2.0** | Next major initiative — unified visual language, component library, platform-wide UI consistency |
| **Stripe billing** | Pricing page exists; checkout not connected |
| **Notification delivery engine** | Preferences UI exists; scheduled alerts not built |
| **SMS integration** | Toggle exists; provider not integrated |
| **AI Assistant** | Power-tier capability defined; not implemented |
| **Premium preview rollout** | Apply `PremiumFeaturePreview` to Dashboard, AI, Finance, Insurance, Documents |
| **Preview deployments** | Per-branch Cloudflare previews planned |
| **CI/CD** | Automated PR build checks planned |

---

## Design System 2.0 (next initiative)

Begins after v0.4.1 foundation is approved. Scope:

- Unified visual language
- Component library
- Dashboard redesign
- Homepage redesign
- Profile redesign
- Timeline redesign
- Pricing redesign
- Platform-wide UI consistency

See [PRODUCT_VISION.md §22](./PRODUCT_VISION.md#22-design-system-20-preparation).

---

## Sprint 4 tasks included in v0.4.1 foundation

| Task | Scope |
|------|-------|
| S4-004.8–S4-004.16 | Journey dashboard layout, EB timeline, dashboard access rules |
| S4-005 | My Immifin workspace |
| S4-005.1–S4-005.5 | Navigation, dev tier, capabilities, profile access, pricing |
| S4-005.7–S4-005.8 | Production tier defaults, calculator gating |
| S4-005.9–S4-005.10 | Profile modals, unsaved changes protection |
| S4-005.11–S4-005.12 | My Immifin menu, subscription matrix enforcement |
| S4-005.13–S4-005.14 | PremiumFeaturePreview framework, close-to-info UX |
| S4-005.15 | v0.4.1 foundation documentation |

---

## Revision History

| Version | Date | Description |
|---------|------|-------------|
| v0.4.1 | 2026-07-04 | Foundation milestone release notes (S4-005.15) |
