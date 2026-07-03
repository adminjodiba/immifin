# IMMIFIN Business Model

| Field | Value |
|-------|-------|
| **Title** | IMMIFIN Business Model |
| **Version** | v1.7 |
| **Sprint** | Sprint 4 |
| **Task ID** | S4-005.5 |
| **Last Updated** | 2026-07-03 |
| **Owner** | Product Strategy / Technical Architecture |
| **Status** | Official — single source of truth for subscription tiers and monetization |

Engineering decisions **must reference this document** before implementing subscription-based functionality.

**Related documentation:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) · [TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md)

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
|---------|:----:|:---:|:-----:|
| Current Visa Bulletin Dashboard | ✅ | ✅ | ✅ |
| GC Wait Calculator | ✅ Manual cutoff date entry | ✅ Automatic current bulletin | ✅ Automatic current bulletin |
| Citizenship Calculator | ✅ | ✅ | ✅ |
| Save Immigration Profile | ❌ | ✅ | ✅ |
| Priority Date Tracking | ❌ | ✅ | ✅ |
| Visa Bulletin History | ❌ | ✅ | ✅ |
| Movement Tracker | ❌ | ✅ | ✅ |
| Email Alerts | ❌ | ✅ | ✅ |
| AI Features | ❌ | ❌ | ✅ |
| Multiple Profiles | ❌ | ❌ | Unlimited |
| Support | ❌ | Standard (5 Business Days) | Priority (1–2 Business Days) |
| Personal Dashboard Summary | ❌ | Visa Bulletin based on saved profile | Full Dashboard |
| Automatic Calculator Population | ❌ | ✅ | ✅ |

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

In development, Free tier also shows a locked dashboard preview when visiting `/dashboard` directly. Production without billing defaults to Pro access until real subscription storage is connected.

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
| `accessAI` | AI assistant and intelligence features |
| `accessMultipleProfiles` | Multiple saved immigration profiles |
| `accessEmailAlerts` | Email alert notifications |
| `accessNotifications` | Notification preferences and automated alerts (Pro automation) |
| `accessVisaHistory` | Visa Bulletin history tools |
| `accessMovementTracker` | Bulletin movement tracker |
| `accessAutoCalculatorPopulation` | Prefill calculators from saved profile |

### Capability matrix

| Capability | Free | Pro | Power |
|------------|------|-----|-------|
| `accessPersonalDashboard` | ❌ | ✅ | ✅ |
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
| **Production default** | Until billing storage exists, effective tier defaults to **Pro** so signed-in users are not blocked |

Helpers: `getCapabilitiesForTier`, `hasCapability`, `canAccessPersonalDashboard`, `canAccessAI`, `canAccessNotifications`.

---

## 13. Profile Access Philosophy

> **Data entry is Free. Automation is Pro. Intelligence is Power.**

Users should **not** be charged to tell IMMIFIN about themselves. Free users may enter and update profile data. Paid value comes from **automation**, **tracking**, **alerts**, **AI**, and **personalized insight**.

| Layer | Tier | Examples |
|-------|------|----------|
| **Data entry** | Free | Profile, Security, Immigration Profile, Green Card date, Priority Date, category/country; future Finance/Insurance profile fields |
| **Automation** | Pro | Personalized Dashboard, Notifications, email alerts, Visa Bulletin tracking, Movement Tracker, auto-populated calculators |
| **Intelligence** | Power | AI recommendations and assistant |

### Free users can access

- Profile (account identity)
- Security
- Immigration Profile
- Green Card date entry
- Priority Date entry
- Category / Country entry
- Future Finance Profile data entry
- Future Insurance Profile data entry

### Free users cannot access

- Personalized Dashboard
- Auto-populated calculators
- Notifications (visible but locked with PRO badge)
- Email alerts
- Visa Bulletin tracking
- Movement tracker
- AI recommendations

**Notifications** are Pro because they are **automation**, not data entry. In Manage Profile, Free users see Notifications as locked (`Notifications 🔒 PRO`) with an upgrade message; Pro and Power can edit notification preferences.

---

## 14. Upgrade Path Strategy

Locked premium features should guide users to the upgrade path.

| Rule | Behavior |
|------|----------|
| **Data entry Free** | Free users can enter profile data |
| **Automation/intelligence paid** | Free users cannot use automation or intelligence features |
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
