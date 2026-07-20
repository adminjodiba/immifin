# IMMIFIN Business Model

| Field | Value |
|-------|-------|
| **Title** | IMMIFIN Business Model |
| **Version** | v2.2 |
| **Sprint** | Sprint 7 (commercial platform as-built) |
| **Task ID** | S7-DOC-009 |
| **Last Updated** | 2026-07-20 |
| **Owner** | Product Strategy / Technical Architecture |
| **Status** | Official — single source of truth for subscription tiers, capabilities, and monetization philosophy |

Engineering decisions **must reference this document** before implementing subscription-based functionality.

**Related documentation:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) · [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md) · [PRODUCT_VISION.md](./PRODUCT_VISION.md) · [ROADMAP_v2.md](./ROADMAP_v2.md)

---

## 1. Business Overview

IMMIFIN helps immigrants make clearer immigration and life decisions through trusted tools, personalization, and automation. The product is **not** selling raw Visa Bulletin data or calculators alone — it sells reduced uncertainty, saved time, and journey-aware guidance.

| Field | Detail |
|-------|--------|
| **Mission** | Reduce manual immigration monitoring and decision friction for immigrants |
| **Target users** | Employment-based and related immigration journeys (individual consumers first) |
| **Current commercial maturity** | Subscription platform implemented in application code; Live Stripe / commercial cutover pending validation |
| **Vision** | A trusted Life Operating System for immigrants — immigration first; finance and insurance later |

Production today remains the pre–Live-Stripe baseline (v0.4.2 + Notification Platform v1.0). See [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md).

---

## 2. Subscription Model

Three tiers. One account. Clear commercial ladder:

| Tier | Commercial role | Value proposition |
|------|-----------------|-------------------|
| **Free** | Exploration | Public tools and manual calculators — learn without commitment |
| **Pro** | Core paid product | Personalization and automation — manage *your* immigration journey |
| **Power** | Premium paid product | Intelligence on top of Pro — AI and advanced management (roadmap-gated features) |

**Positioning:**

| Tier | Customer outcome |
|------|------------------|
| **Free** | “I can check today’s Visa Bulletin.” |
| **Pro** | “I don’t have to monitor my immigration case every month.” |
| **Power** | “IMMIFIN becomes my personal immigration assistant.” |

**Core commercial layering:**

| Layer | Tier |
|-------|------|
| **Manual tools** | Free |
| **Personalization & automation** | Pro |
| **AI & advanced intelligence** | Power |

- Free is for exploration.
- Pro is for managing your own immigration journey.
- Power is for intelligent immigration planning.

> **This document is the source of truth** for feature gating decisions. When adding a premium feature, define its capability in [§12](#12-subscription-capability-architecture) and Free-user UX in [§15](#15-premium-feature-discovery) before implementation.

Detailed feature access: [§3 Feature Matrix](#3-feature-matrix).

---

## 3. Feature Matrix

| Feature | Free | Pro | Power |
|---------|------|------|------|
| Current Visa Bulletin Dashboard | ✅ | ✅ | ✅ |
| GC Wait Calculator | Manual cutoff date entry | Automatic from current bulletin | Automatic from current bulletin |
| Citizenship Calculator | Manual | Manual + profile aware | Manual + profile aware |
| Save Immigration Profile | ❌ | ✅ | ✅ |
| Priority Date Tracking | ❌ | ✅ | ✅ |
| Visa Bulletin History | ❌ | ✅ | ✅ |
| Movement Tracker | ❌ | ✅ | ✅ |
| Email Alerts | ❌ | ✅ | ✅ |
| Personalized Dashboard | ❌ | Visa Bulletin Dashboard based on profile | Full Personalized Dashboard |
| Automatic Calculator Population | ❌ | ✅ | ✅ |
| AI Features | ❌ | ❌ | ✅ |
| Multiple Profiles | ❌ | ❌ | ✅ |
| Support | None | Standard (5 business days) | Priority (within 2 business days) |

---

## 4. Upgrade Philosophy

**Do not hide premium features.**

Premium features should remain **visible**. Display them with a lock icon and a short explanation.

### Examples

**🔒 Available in Pro**

> Upgrade to unlock Visa Bulletin History.

**🔒 Available in Power**

> Unlock AI Immigration Assistant.

### Purpose

Allow free users to understand the additional value available through upgrading **without** making the free experience feel broken.

---

## 5. Customer Journey

High-level commercial journey:

```text
Visitor
  ↓
Free (explore public tools)
  ↓
Profile / account (identity + contact)
  ↓
Value discovery (dashboard previews, Premium Feature Discovery)
  ↓
Upgrade (Pricing → Checkout)
  ↓
Billing Center (manage plan over time)
  ↓
Long-term retention (automation, notifications, journey continuity)
```

Paid access is activated through verified billing sync into the capability model — not by landing on a success page alone. Plan changes after purchase are managed in the **Billing Center**, not by treating Stripe Customer Portal as the primary subscription UX.

---

## 6. Capability-Based Business Model

IMMIFIN monetizes **capabilities**, not ad-hoc feature flags or raw payment-provider status.

```text
Subscription (billing state)
  ↓
Capabilities (what the customer is entitled to)
  ↓
Authorization (product enforces capabilities)
  ↓
Features (customer experiences value)
```

**Why capabilities are the commercial source of truth**

- Pricing and packaging can evolve without rewriting every screen.
- Stripe owns payment objects; IMMIFIN owns what those payments unlock.
- Upgrades, downgrades, and cancellations change entitlements through a single model.
- Free users can see premium value without breaking the free experience.

Engineering must not scatter plan-name or Stripe-status checks across the product. See [§12](#12-subscription-capability-architecture) for the capability map.

---

## 7. Revenue Strategy

### Current approved model

| Element | Strategy |
|---------|----------|
| **Revenue type** | Recurring subscriptions (SaaS) |
| **Paid tiers** | Pro and Power |
| **Intervals** | Monthly and annual (USD for Beta) |
| **Checkout** | Stripe Checkout for new paid subscriptions |
| **Plan management** | IMMIFIN Billing Center (upgrade / downgrade / interval / cancel-to-free) |
| **Beta constraints** | No coupons, promotions, or free trials |

### Approved Beta pricing

| Tier | Monthly | Annual |
|------|---------|--------|
| **Free** | $0 | — |
| **Pro** | $9.99 / month | $99.99 / year |
| **Power** | $19.99 / month | $199.99 / year |

Annual plans exist for lower effective monthly cost, cash-flow predictability, and customer choice. Commercial design detail: [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md). Billing behavior: [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md).

### Approved future expansion directions

Documented roadmap / vision directions only (not committed Beta scope):

- Finance and Insurance platform modules ([ROADMAP_v2.md](./ROADMAP_v2.md))
- AI expansion within Power
- Post-beta commercial management (catalog versioning / grandfathering) — [COMMERCIAL_PLATFORM_VISION.md](./COMMERCIAL_PLATFORM_VISION.md)
- Future Business / Enterprise / HR-oriented offerings (reserved; not Beta)

---

## 8. Commercial Principles

- **Value before monetization** — demonstrate premium value before asking for payment.
- **Transparent pricing** — published Free / Pro / Power amounts; no hidden fees.
- **Capability-based access** — entitlements, not opaque paywalls or degraded free accuracy.
- **Customer-first upgrades** — upgrades should feel immediate and fair; downgrades should not punish prepaid time.
- **Predictable billing** — clear monthly/annual intervals; cancel at period end.
- **Free users are future customers** — exploration must remain useful and trustworthy.
- **Paid users pay for automation, intelligence, and convenience** — not for “correctness” withheld from Free.

---

## 8A. Current Commercial Status

| Bucket | Items |
|--------|-------|
| **Implemented** | Subscription platform (Checkout, webhooks, billing-state sync); Pricing (monthly/annual); Billing Center; capability enforcement; Premium Feature Discovery |
| **Pending** | Live Stripe launch; Sandbox/Live commercial validation; Development Subscription Mode hard-off for Live; v0.5.0 commercial signoff |
| **Future / deferred** | Customer Portal for payment method / invoices; landing/marketing redesign; HR / Business / Enterprise tiers; Finance & Insurance expansion; broader AI expansion |

Do not treat Live commercial billing as production-ready until pending validation is complete. See [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) and [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md).

---

## 8B. Business Metrics

Track meaningful commercial health after Live validation — **do not invent targets here**.

| Metric class | Examples (operational) |
|--------------|------------------------|
| **Acquisition** | Free signups; Pricing → Checkout starts |
| **Conversion** | Checkout completions; Free → Pro / Power |
| **Revenue** | MRR / ARR once Live billing is active |
| **Retention** | Renewals, cancellations at period end, downgrades |
| **Product value** | Engagement with Pro surfaces (dashboard, notifications, history) |

Exact KPIs and targets are set by Product Owner during commercial launch — not in this document until approved.

---

## 9. Personal Dashboard

The **Personal Dashboard** is a primary **Pro and Power value surface** — the authenticated home where subscription depth becomes tangible.

After sign-in, users land on a profile-driven dashboard rather than navigating tools individually. Tier differences should be **visible and understandable** on this screen:

| Tier | Dashboard experience |
|------|---------------------|
| **Free** | Information at a glance — current bulletin context, manual profile entry elsewhere; locked cards show what Pro/Power unlock |
| **Pro** | Automation — saved profile summary, bulletin status tied to category/country/priority date, alerts and history surfaced |
| **Power** | Intelligence — full dashboard, AI assistant entry points, multiple profiles, advanced management widgets |

### Dashboard Access Rule

| Rule | Behavior |
|------|----------|
| **Post-login destination** | After login, users land on `/dashboard` |
| **Free** | Limited dashboard preview / locked Pro feature view — not the full personalized journey |
| **Pro** | Full personalized dashboard |
| **Power** | Full personalized dashboard plus future AI/intelligence features |
| **Value surface** | The dashboard is a key Pro/Power upgrade surface |

Access is enforced through `canAccessPersonalDashboard` (capability-style), not scattered plan-name checks.

### Dashboard Exit Rule

| Rule | Behavior |
|------|----------|
| **Close** | Dashboard includes a clear **Close** action |
| **Session preserved** | Exit does **not** sign the user out |
| **No permanent dismissal** | Exit does not hide the dashboard permanently or store dismissal state |
| **Safe navigation** | Close returns to the site home (`/`) |

### Upgrade alignment

- Locked premium cards on the dashboard follow the [Upgrade Philosophy](#4-upgrade-philosophy): visible, explained, never degrading free tool accuracy.
- Pro sells **"I don't have to monitor my case every month"** through dashboard automation.
- Power sells **"IMMIFIN is my personal immigration assistant"** through intelligence widgets and AI.

The dashboard is the natural place to demonstrate **Free = Information**, **Pro = Automation**, **Power = Intelligence** without requiring users to discover features buried in menus.

See [PRODUCT_VISION.md §17](./PRODUCT_VISION.md#17-personal-dashboard-vision) for Phase 1 Immigration scope and long-term Finance/Insurance expansion.

---

## 10. Profile Section Reset Rule

Manage Profile supports **section-level** Clear / Reset actions for editable data sections.

| Rule | Behavior |
|------|----------|
| **Section-scoped** | Reset clears only that section's fields — never the entire account |
| **Confirmation required** | Destructive reset actions require explicit confirmation |
| **No silent resets** | Users must confirm before data is cleared or reset |
| **Security excluded** | Security sections must **not** have reset buttons |
| **Identity excluded** | Core Profile / identity sections (name, email, login) must **not** be cleared casually |
| **Safe sections** | Immigration, Green Card, and Notification Preferences may offer Clear / Reset to Default |

Contact phone reset is deferred while phone remains a required contact field for alerts and onboarding.

---

## 11. My Immifin Access

**My Immifin** is the authenticated personal workspace (Dashboard, Manage Profile, and future personalized surfaces). It is distinct from Immigration, Finance, and Insurance product modules.

**UI label:** `My Immifin` (Title Case). **Brand/legal/docs:** `IMMIFIN`.

Access is capability-based (`canAccessPersonalDashboard`, `canAccessAI`) — not scattered plan-name checks.

| State | Dashboard | Manage Profile |
|-------|-----------|----------------|
| **Signed out** | Requires login | Requires login |
| **Free** | Greyed / locked with **Pro** badge; click shows "Dashboard is available in Pro." | Available |
| **Pro** | Enabled → `/dashboard` | Available |
| **Power** | Enabled → `/dashboard` (+ future AI) | Available |

Dashboard is a **Pro/Power** feature. Top-level **My Immifin** never shows a PRO badge; only the Dashboard item is locked for Free.

In development and production, users without an enrolled tier default to **Free**. Free users see a locked dashboard preview when visiting `/dashboard` directly. Dev-only tier override works only when `NODE_ENV === "development"`.

### Dev-only tier testing

Development Subscription Mode / dev tier overrides may be used for engineering and QA **until Live commercial cutover**. They are **not** real billing authorization and **must be hard-off** in Live production.

Typical local tools (development only):

- Query param: `?devTier=free` / `?devTier=pro` / `?devTier=power`
- localStorage key: `immifin:devTier`
- On-page **DEV ONLY - TIER** switcher / Development Subscription panel where enabled

My Immifin includes **Dashboard**, **Manage Profile**, and **Billing** (Billing Center) for plan management. AI Assistant and additional workspace items remain roadmap-gated.

See [PRODUCT_VISION.md §18](./PRODUCT_VISION.md#18-my-immifin-vision) for the full My Immifin vision and roadmap.

---

## 12. Subscription Capability Architecture

Internal product access model. After Sprint 7, verified Stripe billing sync updates subscription / plan state; **capabilities remain the product authorization layer**. Design: [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md).

### Tiers

| Tier | Status |
|------|--------|
| **Free** | Current |
| **Pro** | Current |
| **Power** | Current |
| **Business** | Future |
| **Enterprise** | Future |

### Capabilities

| Capability key | Meaning |
|----------------|---------|
| `accessPersonalDashboard` | Full personalized My Immifin dashboard |
| `accessSaveImmigrationProfile` | Save immigration / green card profile data |
| `accessPriorityDateTracking` | Priority date tracking on personalized dashboard |
| `accessAI` | AI assistant and intelligence features |
| `accessMultipleProfiles` | Multiple saved immigration profiles |
| `accessEmailAlerts` | Email alert notifications |
| `accessNotifications` | Notification preferences and automated alerts |
| `accessVisaHistory` | Visa Bulletin history tools |
| `accessMovementTracker` | Bulletin movement tracker |
| `accessAutoCalculatorPopulation` | Prefill calculators from saved profile |

### Capability matrix

| Capability | Free | Pro | Power |
|------------|------|-----|-------|
| `accessPersonalDashboard` | ❌ | ✅ | ✅ |
| `accessSaveImmigrationProfile` | ❌ | ✅ | ✅ |
| `accessPriorityDateTracking` | ❌ | ✅ | ✅ |
| `accessAI` | ❌ | ❌ | ✅ |
| `accessMultipleProfiles` | ❌ | ❌ | ✅ |
| `accessEmailAlerts` | ❌ | ✅ | ✅ |
| `accessNotifications` | ❌ | ✅ | ✅ |
| `accessVisaHistory` | ❌ | ✅ | ✅ |
| `accessMovementTracker` | ❌ | ✅ | ✅ |
| `accessAutoCalculatorPopulation` | ❌ | ✅ | ✅ |

### Implementation rules

| Rule | Behavior |
|------|----------|
| **Billing syncs tier** | Verified Stripe webhooks update billing state / plan; browser redirects never grant paid access |
| **Product consumes capabilities** | UI and features authorize via capabilities — not raw Stripe status |
| **Central map only** | Tier→capability mapping lives in one capability map |
| **Dev override** | Non-Live engineering/QA only — not real customer billing |
| **Production unpaid default** | Users without a paid enrollment remain **Free** |

Helpers include capability lookups and server enforcement helpers used by selected account APIs. See [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) §14 (Capability Architecture).

---

## 13. Profile Access Philosophy

> **Data Entry = Pro. Automation = Pro. Intelligence = Power.**

Free is for **exploration** with public tools and manual calculator input. Saving an immigration profile and all personalized management begin with **Pro**.

| Layer | Tier | Examples |
|-------|------|----------|
| **Exploration** | Free | Account/Security/Contact, current Visa Bulletin, manual calculators |
| **Data entry & automation** | Pro | Save immigration profile, personalized dashboard, notifications, history, movement tracker, auto-populated calculators |
| **Intelligence** | Power | AI recommendations and assistant |

### Free users can access

- Account identity (Profile) and Security
- Contact phone (account contact)
- Current Visa Bulletin Dashboard
- Citizenship Calculator (manual)
- Green Card Wait Calculator (manual)
- Pricing, About, public landings

### Free users cannot access

- Save Immigration Profile / Green Card profile data
- Personalized Dashboard / Priority Date Tracking
- Auto-populated calculators
- Notifications and email alerts
- Visa Bulletin History
- Movement Tracker
- AI recommendations

In Manage Profile, Free users see Immigration, Green Card, and Notifications as locked (`🔒 PRO`) with an upgrade path to `/pricing`.

---

## 14. Upgrade Path Strategy

Locked premium features should guide users to the upgrade path.

| Rule | Behavior |
|------|----------|
| **Exploration Free** | Free users can use public tools and manual calculators |
| **Data entry / automation / intelligence paid** | Free users cannot save immigration profiles or use Pro/Power features |
| **Clear upgrade path** | Locked Pro/Power features provide a clear upgrade CTA |
| **Primary location** | **My Immifin** is the primary upgrade location |
| **Destination** | New-paid upgrade CTAs point to **`/pricing`** (Checkout) |
| **Plan management** | Existing subscribers manage plans in **Billing Center** (`/account/billing`) |
| **Billing platform** | Stripe Subscription Platform — [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) |
| **Live cutover** | Development Subscription Mode may appear in non-Live environments until Live gate |

### Approved launch pricing (Beta)

Canonical amounts are listed in [§7 Revenue Strategy](#7-revenue-strategy). Commercial design: [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md).

### Beta launch — not included

During Beta, IMMIFIN does **not** offer coupons, promotions / discount codes, or free trials.

Any future coupon, promotion, or trial requires Product Owner approval and updates to the Stripe design document and [§7](#7-revenue-strategy).

### My Immifin menu by tier

| Tier | Menu items |
|------|------------|
| **Free** | Dashboard (locked PRO), Manage Profile, **Upgrade to Pro** → `/pricing` |
| **Pro** | Dashboard, Manage Profile, **Billing** → `/account/billing` |
| **Power** | Dashboard, Manage Profile, **Billing** → `/account/billing` |

Top-level **My Immifin** never shows a PRO badge. Dashboard lock appears only on the Dashboard item for Free users. Customer Portal for payment methods / invoices remains deferred.

---

## 15. Premium Feature Discovery

**Name:** Premium Feature Discovery

**Purpose:** Rather than presenting a traditional paywall, premium features should feel like a **product demonstration** — not an access restriction.

### Standard Free-user flow

```
Real Pro page (rendered underneath)
        ↓
Blurred preview (blur, brightness reduction, desaturation; interactions disabled)
        ↓
Premium overlay (value explanation, feature-specific benefits, upgrade CTA)
        ↓ (optional: user clicks X)
Educational information state (no Pro access; links to free tools)
```

### Rules

| Rule | Behavior |
|------|----------|
| **Real page underneath** | Always render the actual premium page — never screenshots or duplicate layouts |
| **Feature-specific benefits** | Each premium page advertises capabilities belonging only to that feature |
| **Dismissible overlay** | Users may close the overlay; dismissed state is page/session only (no permanent storage) |
| **No reduced Free version** | After dismiss, show educational info only — not a stripped-down Pro feature |
| **Upgrade destination** | All upgrade CTAs point to `/pricing` |
| **Standard pattern** | This becomes the standard UX for **all future premium features** |

### Initial implementation

| Page | Feature group | Info state |
|------|---------------|------------|
| Visa Bulletin History | Historical Intelligence | Feature-specific Pro benefits + free tool links |
| Visa Bulletin Movement | Movement Intelligence | Feature-specific Pro benefits + free tool links |

Future rollout: Dashboard, AI, Priority Tracking, Documents, Finance, Insurance, Multiple Profiles.

See [PRODUCT_VISION.md §20](./PRODUCT_VISION.md#20-premium-feature-discovery) and `components/common/PremiumFeaturePreview.tsx`.

---

## 16. Premium Feature Preview Framework

Reusable platform component: **`PremiumFeaturePreview`** (`components/common/PremiumFeaturePreview.tsx`).

### Architecture principles

| Principle | Meaning |
|-----------|---------|
| **Live page preview** | Children are the real premium page — future redesigns appear automatically in the preview |
| **No screenshots** | Never maintain preview images |
| **No duplicated pages** | Never build separate preview layouts |
| **Blur overlay** | Backdrop blur, brightness reduction, desaturation; pointer events disabled |
| **Feature-specific groups** | Callers pass `featureGroupTitle` and `featureList[]` per page |
| **Upgrade CTA** | Primary button → `/pricing` |
| **Compare Plans CTA** | Secondary button → `/pricing#plans` |
| **Close-to-info** | Optional X dismisses overlay → `infoState` educational panel |
| **Tier gating** | `requiredTier` + `useEffectiveSubscriptionTier`; Pro/Power render normally |

### Component props (summary)

`title`, `description`, `featureGroupTitle`, `featureList[]`, `upgradeButtonText`, `comparePlansButtonText`, `requiredTier`, `icon`, `showCloseButton`, `infoState`, `onClose`, `children`

### Related gating components

| Component | Use case |
|-----------|----------|
| `PremiumFeaturePreview` | Full-page premium features (History, Movement, future Dashboard) |
| `ProFeatureGate` | Embedded sections (Manage Profile tabs) |
| `ProFeatureLockedState` | Compact locked messaging without live preview |
| `DashboardAccessGate` | Dashboard-specific access control |

See [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) §14 (Capability Architecture).

---

## 17. Product Principles (v0.4.1)

1. **Public information should educate. Premium features should personalize.**
2. **Premium features should demonstrate value before asking users to upgrade.**
3. **Never create duplicate versions of premium pages.**
4. **Render the real feature whenever possible.**
5. **Every premium page should answer:** *"What will I gain by upgrading?"*

These principles apply to all subscription-gated surfaces. See also [PRODUCT_VISION.md §21](./PRODUCT_VISION.md#21-product-principles-v041).

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-02 | S4-002 | Initial business model — subscription tiers, feature matrix, engineering guidance |
| v1.1 | 2026-07-02 | S4-003A | Personal Dashboard as key Pro/Power value surface |
| v1.2 | 2026-07-03 | S4-004.16 | Dashboard access, exit, and profile section reset UX rules |
| v1.3 | 2026-07-03 | S4-005 | My IMMIFIN personal workspace access rules |
| v1.4 | 2026-07-03 | S4-005.2 | My Immifin naming, Pro-locked Dashboard, and dev-only tier testing |
| v1.5 | 2026-07-03 | S4-005.3 | Subscription capability architecture and central tier foundation |
| v1.6 | 2026-07-03 | S4-005.4 | Profile access philosophy — data entry Free, notifications Pro |
| v1.7 | 2026-07-03 | S4-005.5 | Upgrade path strategy and /pricing foundation |
| v1.8 | 2026-07-04 | S4-005.7 | Production default tier Free; restore Calculator navigation |
| v1.9 | 2026-07-04 | S4-005.12 | Official subscription matrix; enforce Free tier feature gates |
| v2.0 | 2026-07-04 | S4-005.15 | v0.4.1 foundation — Premium Feature Discovery, preview framework, product principles |
| v2.1 | 2026-07-11 | S7-DOC-001 | Approved Beta launch pricing (Pro/Power monthly + annual); no coupons/trials; link Stripe design |
| v2.2 | 2026-07-20 | S7-DOC-009 | Post–Sprint 7 commercial strategy — journey, revenue, capabilities, commercial status; Billing Center |
