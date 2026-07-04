# IMMIFIN Business Model

| Field | Value |
|-------|-------|
| **Title** | IMMIFIN Business Model |
| **Version** | v2.0 |
| **Sprint** | Sprint 4 |
| **Task ID** | S4-005.15 |
| **Last Updated** | 2026-07-04 |
| **Owner** | Product Strategy / Technical Architecture |
| **Status** | Official — single source of truth for subscription tiers and monetization |

Engineering decisions **must reference this document** before implementing subscription-based functionality.

**Related documentation:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [PRODUCT_VISION.md](./PRODUCT_VISION.md) · [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) · [RELEASE_NOTES_v0.4.1.md](./RELEASE_NOTES_v0.4.1.md) · [TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md)

---

## 1. Product Vision

IMMIFIN is **not selling calculators**.

IMMIFIN provides **peace of mind** for employment-based immigrants by reducing manual work, uncertainty, and repetitive monthly tracking.

Every paid feature must remove friction, save time, or provide valuable immigration intelligence.

---

## 2. Subscription Philosophy

Three subscription tiers:

| Tier | Name |
|------|------|
| **Free** | Free |
| **Pro** | Pro |
| **Power** | Power |

### IMMIFIN Subscription Philosophy

Free users have access to public immigration tools using **manual inputs only**.

Personalized immigration management, historical tracking, saved profiles, automation, notifications, and intelligent recommendations begin with **Pro**.

Power builds upon Pro by adding AI, multiple profiles, advanced planning, and premium support.

**Core Principle:**

| Layer | Tier |
|-------|------|
| **Manual Tools** | **Free** |
| **Personalization & Automation** | **Pro** |
| **AI & Advanced Intelligence** | **Power** |

Equivalent framing for engineering and product discussions:

| Layer | Tier |
|-------|------|
| **Data Entry** (saved immigration profile) | **Pro** |
| **Automation** | **Pro** |
| **Intelligence** | **Power** |

- **Free** is intended for exploration.
- **Pro** is intended for managing your own immigration journey.
- **Power** is intended for intelligent immigration planning.

> **This document is the source of truth** for all future feature gating decisions. When adding a new premium feature, define its capability in [§12](#12-subscription-capability-architecture) and its Free-user UX in [§15](#15-premium-feature-discovery) before implementation.

### Purpose of each tier

#### Free

Current information with manual interaction.

#### Pro

Automation, tracking, personalization, and convenience.

#### Power

Complete immigration intelligence platform with AI assistance and advanced management capabilities.

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

## 5. Product Positioning

| Tier | Positioning statement |
|------|----------------------|
| **Free** | "I can check today's Visa Bulletin." |
| **Pro** | "I don't have to monitor my immigration case every month." |
| **Power** | "IMMIFIN becomes my personal immigration assistant." |

---

## 6. Engineering Principles

Subscription logic should **never** be implemented by checking plan names throughout the application.

Instead, the application should be designed around **permissions / capabilities**.

**Good:** `hasCapability(tier, "accessPersonalDashboard")` or `canAccessPersonalDashboard(tier)`

**Avoid:** scattered `tier === "pro"` checks in UI components.

Future subscription changes should only modify **capability mappings** in the central map — not application logic.

See [§12 Subscription Capability Architecture](#12-subscription-capability-architecture).

---

## 7. Future Roadmap

*Reserved for future additions.*

Possible future features:

- Team accounts
- Family plans
- Immigration attorney workspace
- Recruiter dashboard
- HR dashboard
- API access
- Enterprise plan

---

## 8. Business Principles

- **Free users are future customers.**
- **Paid users pay for automation, intelligence, and convenience.**
- **Never artificially reduce the accuracy of free tools.**
- **Paid features should save time rather than restrict correctness.**
- **Every premium feature should clearly communicate its value.**

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

Until billing ships, developers may override the effective tier **only in development** via:

- Query param: `?devTier=free` / `?devTier=pro` / `?devTier=power`
- localStorage key: `immifin:devTier`
- On-page **DEV ONLY - TIER** switcher

This override is **not** billing, **not** real authorization, and **must not** run in production.

Phase 1 menu items: **Dashboard**, **Manage Profile**. Later phases (Notifications, Subscription, Saved Profiles, AI Assistant) are prepared in the menu architecture but not visible until shipped.

See [PRODUCT_VISION.md §18](./PRODUCT_VISION.md#18-my-immifin-vision) for the full My Immifin vision and roadmap.

---

## 12. Subscription Capability Architecture

Internal product access model. **Billing is not implemented** — this foundation is what future billing will assign tiers into.

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
| **Billing assigns tier** | Future billing sets the user's tier |
| **Product consumes capabilities** | UI and features call `hasCapability(tier, key)` / `canAccess*(tier)` |
| **Central map only** | Tier→capability mapping lives in `lib/subscription/capabilities.ts` |
| **Dev override** | Local development only — not real authorization or billing |
| **Production default** | Until billing storage exists, effective tier defaults to **Free** (no Pro/Power without enrollment) |

Helpers: `getCapabilitiesForTier`, `hasCapability`, `canAccessPersonalDashboard`, `canAccessAI`, `canAccessNotifications`.

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
| **Destination** | All upgrade CTAs point to **`/pricing`** |
| **Billing later** | Stripe/billing will be implemented later |
| **Until billing** | Pricing CTAs show **Coming Soon** / waitlist behavior — no checkout |

### My Immifin menu by tier

| Tier | Menu items |
|------|------------|
| **Free** | Dashboard (locked PRO), Manage Profile, **Upgrade to Pro** → `/pricing` |
| **Pro** | Dashboard, Manage Profile, **Subscription** → `/pricing` |
| **Power** | Dashboard, Manage Profile, **Subscription** → `/pricing` |

Top-level **My Immifin** never shows a PRO badge. Dashboard lock appears only on the Dashboard item for Free users.

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

See [SYSTEM_ARCHITECTURE.md §14](./SYSTEM_ARCHITECTURE.md#14-application-access-layer-subscription-capabilities).

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
