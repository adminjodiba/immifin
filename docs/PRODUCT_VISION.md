# IMMIFIN Product Vision

| Field | Value |
|-------|-------|
| **Title** | IMMIFIN Product Vision |
| **Version** | v1.16 |
| **Sprint** | Sprint 4 |
| **Task ID** | S4-005.15 |
| **Last Updated** | 2026-07-04 |
| **Owner** | Product Strategy / Founder |
| **Status** | Official — long-term strategic reference |

This document defines the **long-term direction of IMMIFIN** and is the strategic reference for every future product decision.

It answers: **"What company are we building over the next 5–10 years?"**

**Related documentation:** [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) · [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) · [RELEASE_NOTES_v0.4.1.md](./RELEASE_NOTES_v0.4.1.md) · [AI_DEVELOPMENT_CHARTER.md](./AI_DEVELOPMENT_CHARTER.md)

---

## 1. Mission

### Mission Statement

> **To simplify the immigrant journey by bringing Immigration, Finance and Insurance together into one intelligent platform.**

IMMIFIN removes uncertainty, saves time, and helps immigrants make better life decisions.

We exist to reduce the cognitive load of navigating a new country — where immigration status, financial stability, and personal protection are deeply interconnected but traditionally served by disconnected tools and advisors.

---

## 2. Vision

### Vision Statement

IMMIFIN is **not** an immigration website.

IMMIFIN is **not** a finance website.

IMMIFIN is **not** an insurance website.

**IMMIFIN is a Life Operating System for Immigrants.**

The platform supports users throughout their **immigration journey**, **financial growth**, and **long-term protection** — as one continuous life arc, not three separate problems.

Over 5–10 years, IMMIFIN becomes the place immigrants return to at every major milestone: visa status changes, career moves, home purchases, family planning, citizenship, and retirement.

---

## 3. Core Product Pillars

IMMIFIN is built on three integrated pillars. Each pillar serves a distinct life domain; together they form a unified platform experience.

### Immigration

**Purpose:** Guide immigrants through visas, Green Cards, citizenship, and status tracking.

- Visa Bulletin intelligence and priority date monitoring
- Green Card and citizenship planning tools
- Profile-driven immigration context saved across sessions
- Alerts when bulletin movement affects the user's case

### Finance

**Purpose:** Help immigrants build wealth, understand taxes, plan investments, and make better financial decisions.

- Tax and credit education tailored to immigrant life stages
- Calculators and guides for investing, retirement, and major purchases
- Financial milestones aligned with immigration timeline (e.g. home buying after GC)

### Insurance

**Purpose:** Help immigrants protect themselves, their families, and their assets through education and planning.

- Health, life, home, and auto insurance education
- Coverage planning tied to life events (new job, marriage, home purchase, children)
- Clear guidance without sales pressure — education first, partners later

---

## 4. Product Philosophy

Users should **never** think in terms of separate Immigration, Finance, or Insurance subscriptions.

| Principle | Meaning |
|-----------|---------|
| **One platform** | A single IMMIFIN experience across all life domains |
| **One account** | One Clerk identity, one login |
| **One profile** | Shared context (status, priority date, goals) powers every module |
| **One subscription** | Tier determines **depth of features**, not product category |

A Pro subscriber does not buy "Immigration Pro" and "Finance Pro" separately. They subscribe to **IMMIFIN Pro** and unlock automation, tracking, and personalization across pillars.

The subscription determines **how much intelligence and automation** the user receives — not which vertical they are allowed to enter.

---

## 5. Subscription Strategy

### Individual users

```
Free
  ↓
Pro
  ↓
Power
```

| Tier | Focus |
|------|-------|
| **Free** | Current information; manual interaction |
| **Pro** | Automation, tracking, personalization, convenience |
| **Power** | Full intelligence platform with AI and advanced management |

See [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) for the authoritative feature matrix.

### Organizations

```
Business
  ↓
Enterprise
```

| Tier | Focus |
|------|-------|
| **Business** | Team and small-organization immigration/finance workflows *(future roadmap)* |
| **Enterprise** | Organization-wide intelligence, compliance, and scale *(future roadmap)* |

**Business** and **Enterprise** are **future roadmap items**. Engineering should design for eventual multi-tenant and org-level capabilities without implementing them prematurely.

---

## 6. Platform Experience

The long-term IMMIFIN experience centers on a **unified dashboard** — a command center for the immigrant life journey.

### Immigration

- Visa Bulletin (current, history, movement)
- Priority Date status and projections
- Green Card progress tracking

### Finance

- Taxes
- Investments
- Retirement
- Home Buying

### Insurance

- Health
- Life
- Home
- Auto

### Alerts

- Immigration alerts (bulletin movement, priority date, citizenship milestones)
- Financial alerts (tax deadlines, savings goals)
- Insurance alerts (renewal, coverage gaps)

The dashboard adapts to the user's **saved profile**, **subscription tier**, and **life stage** — surfacing what matters now, not everything at once.

---

## 7. Value Delivered

| Tier | Value delivered |
|------|-----------------|
| **Free** | **Information** — access to current tools and bulletin data; manual effort required |
| **Pro** | **Automation** — tracking, alerts, saved profile, calculator prefill; less monthly monitoring |
| **Power** | **Intelligence** — AI assistant, multiple profiles, full dashboard, priority support |
| **Business** | **Management** — team visibility, shared cases, workflow for employers and advisors *(future)* |
| **Enterprise** | **Organization-wide Intelligence** — scale, compliance, integrations, custom reporting *(future)* |

Paid tiers charge for **time saved**, **uncertainty removed**, and **decisions improved** — never for reduced accuracy of free tools.

---

## 8. Competitive Positioning

IMMIFIN differentiates itself by combining three traditionally **separate industries** — immigration services, personal finance, and insurance — into a **single personalized experience**.

Where others offer:

- Point tools (a calculator here, a bulletin there)
- Generic financial content not grounded in immigration status
- Insurance sales without life-context

IMMIFIN offers:

- **One profile** that understands where the user is in their immigration journey
- **Cross-pillar intelligence** (e.g. home-buying guidance that respects GC timing)
- **Progressive depth** from free information to Power-tier AI assistance

We do not compete by being the best calculator or the best blog. We compete by being the **only platform that connects the full immigrant life story**.

---

## 9. Future Expansion

Potential future modules and capabilities:

- AI Assistant
- Real Estate
- Education
- Retirement Planning
- Estate Planning
- Family Financial Planning
- Marketplace
- Document Vault
- Appointment Scheduling
- Secure Messaging
- Partner Ecosystem

These modules extend the Life Operating System vision. Each should be evaluated against the [North Star](#11-north-star) before prioritization.

---

## 10. Engineering Principles

Engineering decisions should **support the long-term product vision**.

| Principle | Guidance |
|-----------|----------|
| **Avoid isolated verticals** | Do not create separate Immigration, Finance, and Insurance codebases with no shared platform layer |
| **Reusable platform services** | Profile, subscriptions, permissions, alerts, and dashboard widgets should be shared infrastructure |
| **Capability-based access** | Use permissions (e.g. `canAccessAI`) — not plan-name checks scattered in UI (see [BUSINESS_MODEL.md §6](./BUSINESS_MODEL.md#6-engineering-principles)) |
| **Design for Business / Enterprise** | Data models and auth should anticipate org-level accounts without over-building today |
| **One account, one profile** | Clerk identity + Supabase profile remain the foundation across all pillars |

New features should be buildable as **dashboard widgets** or **platform capabilities** before they become standalone silos.

---

## 11. North Star

### Long-term vision

IMMIFIN should become:

> **"The trusted digital companion that helps immigrants successfully build their lives in the United States."**

Every new feature, partnership, and subscription tier should support this mission.

If a proposed feature does not reduce uncertainty, save time, or help immigrants make a better life decision — it does not belong on the roadmap.

---

## 12. Founder Philosophy

IMMIFIN is a **product-first company**.

Our primary objective is **not** to maximize short-term revenue.

Our primary objective is to build a product that immigrants **trust**, **recommend**, and **rely upon** throughout their journey.

We believe:

> **A truly exceptional product creates loyal users.**
>
> **Loyal users naturally create sustainable revenue.**

Revenue is a **consequence** of delivering continuous value rather than the starting point for product decisions.

---

## 13. Decision-Making Principles

Every proposed feature should answer the following questions:

1. Does this solve a **real immigrant problem**?
2. Does it save **meaningful time**?
3. Does it **reduce uncertainty**?
4. Does it improve the overall **IMMIFIN experience**?
5. Does it support the long-term [Product Vision](#2-vision)?
6. Will users **genuinely appreciate** this feature?

If the answer to most questions is **No**, the feature should be reconsidered.

---

## 14. Product Principles

- **Product quality before monetization.**
- **User trust is more valuable than short-term revenue.**
- **Never intentionally reduce the accuracy of free tools.**
- **Premium features should add convenience, automation, or intelligence** rather than restrict correctness.
- **Every feature should have a clear purpose.**
- **Every screen should reduce complexity for immigrants.**
- **Simplicity is a competitive advantage.**

---

## 15. North Star Question

Every future feature proposal should begin by asking:

> **"Does this make IMMIFIN a better Life Operating System for Immigrants?"**

If the answer is **yes**, the feature aligns with the long-term vision.

---

## 16. Engineering Alignment

Engineering should **always support the product vision**.

Architecture exists to **enable a better product**.

Technology choices should improve **maintainability**, **performance**, **security**, and **user experience**.

Avoid building features solely because they are technically interesting.

**Technology should serve the product, not define it.**

---

## 17. Personal Dashboard Vision

The **Personal Dashboard** is the central authenticated home for IMMIFIN.

After login, users should land in a **meaningful, personalized dashboard** — not a generic landing page or a scattered list of tools. The dashboard is where Immigration, Finance, Insurance, Alerts, AI, and future premium features eventually connect into one coherent experience.

### Strategic role

| Principle | Meaning |
|-----------|---------|
| **Authenticated home** | The dashboard is the default destination after sign-in |
| **Reduce effort** | Surface what matters now; eliminate repetitive manual checks |
| **Reduce uncertainty** | Show status, cutoffs, and next steps at a glance |
| **Progressive depth** | Align with product philosophy: **Free = Information**, **Pro = Automation**, **Power = Intelligence** |
| **Natural upgrade path** | Locked Pro and Power capabilities appear as cards with clear value — never hidden, never degrading free accuracy |

### Phased expansion

| Phase | Focus |
|-------|-------|
| **Phase 1** | **Immigration** — profile-driven bulletin status, waiting/current state, quick actions |
| **Phase 2+** | **Finance** — taxes, investments, retirement, home buying widgets |
| **Phase 3+** | **Insurance** — health, life, home, auto planning tied to life stage |
| **Ongoing** | **Alerts**, **AI**, and future modules attach as dashboard widgets |

Phase 1 does not build Finance or Insurance in full — it establishes the **dashboard shell**, shared profile context, and widget architecture so later pillars plug in without redesign.

### Phase 1 — Immigration Dashboard

The first shipped dashboard should include:

| Element | Purpose |
|---------|---------|
| **Welcome message** | Personalized greeting; confirms the user is in their IMMIFIN home |
| **Saved immigration profile summary** | Category, country of chargeability, priority date — from the user's saved profile |
| **Current Visa Bulletin cutoff** | Relevant cutoff for the user's category/country |
| **Waiting / current status** | Clear at-a-glance answer: waiting, current, or action needed |
| **Quick actions** | Shortcuts to calculators, profile edit, bulletin tools |
| **Locked premium feature cards** | Visible Pro/Power capabilities (history, alerts, AI) with lock + upgrade explanation |
| **Future expansion placeholders** | Reserved areas for Finance, Insurance, and Alerts — signals the Life OS direction without over-building |

Every Phase 1 element should pass the [North Star Question](#15-north-star-question): *Does this make IMMIFIN a better Life Operating System for Immigrants?*

See [BUSINESS_MODEL.md §9](./BUSINESS_MODEL.md#9-personal-dashboard) for how Pro and Power tiers map to dashboard depth.

### Dashboard Access Rule

| Rule | Behavior |
|------|----------|
| **Post-login destination** | After login, users land on `/dashboard` |
| **Free** | Locked / upgrade preview — not the full personalized dashboard |
| **Pro** | Full personalized dashboard |
| **Power** | Full personalized dashboard plus future AI/intelligence features |
| **Capability-based** | Access uses `canAccessPersonalDashboard` — not scattered plan-name checks |

### Dashboard Exit Rule

Dashboard includes **Close** so users can return to the site home (`/`) without signing out or permanently dismissing the dashboard.

### Profile Reset Rule

Editable profile sections (Immigration, Green Card, Notifications) may offer **Clear Section** or **Reset to Default** with confirmation. Security and core identity/profile sections must not expose destructive reset.

See [BUSINESS_MODEL.md §9–10](./BUSINESS_MODEL.md#9-personal-dashboard) for full access and reset rules.

### Profile Access Philosophy

> **Data Entry = Pro. Automation = Pro. Intelligence = Power.**

Free is for exploration (public tools and manual calculators). Saving an immigration profile and personalized management begin with Pro. Notifications, history, movement tracking, and auto-populated calculators are Pro. AI is Power.

See [BUSINESS_MODEL.md §13](./BUSINESS_MODEL.md#13-profile-access-philosophy).

### Upgrade Path Strategy

Locked premium features guide Free users to **`/pricing`**. My Immifin is the primary upgrade location:

| Tier | My Immifin menu |
|------|-----------------|
| **Free** | Dashboard (locked), Manage Profile, Upgrade to Pro |
| **Pro / Power** | Dashboard, Manage Profile, Subscription |

Until Stripe exists, pricing CTAs show Coming Soon. See [BUSINESS_MODEL.md §14](./BUSINESS_MODEL.md#14-upgrade-path-strategy).

---

## 18. My IMMIFIN Vision

**My IMMIFIN** is the personal workspace of every authenticated user.

It is **not** another product module. Immigration, Finance, and Insurance remain the product pillars. My IMMIFIN is the user's personalized command center — the place where IMMIFIN remembers them.

### Philosophy

| Surface | Answers |
|---------|---------|
| **Modules** (Immigration, Finance, Insurance) | *"What can IMMIFIN do?"* |
| **My IMMIFIN** | *"What does IMMIFIN know about me?"* |

### Distinct from product modules

| Area | Role |
|------|------|
| **Immigration / Finance / Insurance** | Public and authenticated tools, guides, and calculators |
| **My IMMIFIN** | Authenticated personal workspace — profile, dashboard, and future personalized intelligence |

### Evolution roadmap

| Phase | Contents |
|-------|----------|
| **Phase 1** | Dashboard, Manage Profile |
| **Phase 2** | Notifications, Subscription |
| **Phase 3** | Immigration Summary, Finance Summary, Insurance Summary, Saved Profiles |
| **Phase 4** | AI Assistant, AI Recommendations, Documents, Reports, Settings |

Phase 1 ships as a navigation dropdown under **My IMMIFIN**. Later phases plug into the same workspace using capability-based visibility — not scattered plan-name checks.

### Navigation

Primary navigation:

**Home · Immigration · Finance · Insurance · My Immifin · About**

### Brand naming rule

| Context | Label |
|---------|--------|
| **Logo, legal, documentation, marketing** | **IMMIFIN** |
| **UI navigation** | **My Immifin** (Title Case for readability) |

### My Immifin menu

| Phase | Items |
|-------|--------|
| **Phase 1** | Dashboard, Manage Profile |
| **Future** | Notifications, Subscription, AI Assistant, Saved Profiles |

Dashboard (`/dashboard`) and Manage Profile (`/user-profile`) are entered from **My Immifin**. The dashboard route remains `/dashboard`.

See [BUSINESS_MODEL.md §11](./BUSINESS_MODEL.md#11-my-immifin-access) for tier access rules.

### My Immifin Navigation Rule

> **My Immifin is the workspace. Avatar is the account menu.**

| Rule | Behavior |
|------|----------|
| **Personal workspace** | My Immifin is the user's personal workspace |
| **Workspace entry points** | Dashboard and Manage Profile belong under My Immifin |
| **Avatar menu** | Avatar contains **account-level actions only** (e.g. Sign Out) |
| **No duplicates** | Avoid duplicate entry points that lead to the same page |
| **Unified workspace** | The dashboard evolves into a unified workspace for Immigration, Finance, Insurance, Alerts, and AI |

Do not put Dashboard or Manage Profile in the avatar menu when they are already available under My Immifin.

### Dashboard access (My Immifin)

| Tier | Dashboard | Manage Profile |
|------|-----------|----------------|
| **Free** | Locked / greyed with **Pro** badge — not navigable | Available to signed-in users |
| **Pro** | Enabled → `/dashboard` | Available |
| **Power** | Enabled → `/dashboard` | Available |

Dashboard is a **Pro/Power** feature. Access uses centralized capability helpers (`canAccessPersonalDashboard`) — not scattered plan-name checks.

### Dev-only tier testing

Until billing is implemented, Free / Pro / Power UI states may be tested with a **centralized dev-only tier override** (query param, localStorage, or dev control). This is **not** real billing or production authorization and must not run in production.

### Dashboard Identity Rule

| Rule | Behavior |
|------|----------|
| **Not immigration-only** | The dashboard should not be permanently branded as only an Immigration Dashboard |
| **Workspace identity** | The dashboard page is the user's **My IMMIFIN** workspace |
| **Section, not page brand** | Immigration Journey is **one section** inside the dashboard |
| **Future sections** | Finance Summary, Insurance Summary, Alerts, and AI Insights may appear as additional sections |

Page header should welcome the user to their workspace (e.g. "Welcome back"). Immigration Journey (or Citizenship Journey) appears as section content below — not as a second full-page hero.

---

## 19. Stable Journey Dashboard Layout Rule

> **Layout is stable. Content is dynamic.**

IMMIFIN should feel like **one platform**, not a collection of separate dashboards. The authenticated Personal Dashboard uses a **stable layout architecture** across every immigration journey stage. The structure stays the same; the content inside each area changes based on where the user is in their journey.

### Core principle

| Principle | Meaning |
|-----------|---------|
| **One platform** | Users always recognize they are in their IMMIFIN home |
| **Stable layout** | Main content area and right sidebar do not change structure between stages |
| **Dynamic content** | Cards, timelines, and actions adapt to Employment-Based waiting, Green Card holder, future U.S. citizen, and future Finance/Insurance modules |
| **Progressive depth** | Locked and future capabilities appear in consistent positions — never hidden behind a different page layout |

### Desktop layout

| Area | Role |
|------|------|
| **Main content (left)** | Header, journey-specific banner or explanation, primary progress/timeline card, status cards, summary cards, locked/future feature cards |
| **Sidebar (right)** | Four consistent card groups (see below) |

### Responsive layout

| Breakpoint | Behavior |
|------------|----------|
| **Desktop** | Main content on the left; sidebar on the right |
| **Tablet / mobile** | Single column — sidebar stacks **below** main content |
| **All sizes** | No horizontal overflow; no broken cards |

### Right sidebar — four card groups

Every journey stage uses the same sidebar structure:

1. **Your Journey** — evolves as the user progresses (profile summary at first; stage-specific milestones later)
2. **How It Works** — plain-language explanation of the current journey timeline
3. **Today's Focus** — one highlighted recommendation for what matters most right now
4. **Action Center** — remaining useful actions with short descriptions and availability badges

### Journey-stage content (Immigration)

| Stage | Your Journey | How It Works | Today's Focus | Action Center |
|-------|--------------|--------------|---------------|---------------|
| **Employment-Based Green Card waiting** | Stage, category, country, priority date, bulletin preferences | Priority Date, Visa Bulletin movement, Dates for Filing vs Final Action, green/red status | I-485 filing prep, monthly movement tracking, or profile completion | Visa Bulletin tools, calculators, Pro-locked alerts and history |
| **Green Card holder** | Stage, Green Card date, years as PR, earliest N-400 date, eligibility | GC date → Today → N-400 filing window | N-400 preparation or filing-window guidance | Citizenship calculator, profile, future travel / tax / insurance |
| **U.S. citizen (future)** | Stage, citizenship date, next planning area | Reusable structure when citizen journey ships | Stage-appropriate primary recommendation | Finance and Insurance entry points |
| **Finance / Insurance (future)** | Life-stage summary widgets | Pillar-specific education | Pillar-specific focus | Pillar calculators and planning tools |

### Applies across the Life OS

This layout rule applies to:

- Employment-Based Green Card waiting users
- Green Card holders on the citizenship journey
- Future U.S. citizen dashboard content
- Future Finance and Insurance dashboard modules

New pillars and journey stages **plug into the existing shell** — they do not introduce alternate dashboard layouts.

### Quick Actions Rule

> **Navigation is stable. Priorities are dynamic.**

The dashboard guides users through a **single primary recommendation** (Today's Focus) plus a broader **Action Center** — not duplicate action sections. Users always know where to look; priorities change by journey stage.

| Principle | Meaning |
|-----------|---------|
| **Single action surface** | No duplicate sections such as "Recommended Next Steps" alongside Action Center |
| **Evolving action model** | Quick Actions evolved into **Today's Focus** + **Action Center** for clearer guidance |
| **Sidebar placement** | Focus and actions live in the right sidebar, consistent across all journey stages |
| **Dynamic priorities** | Focus message and action list adapt to Employment-Based waiting, Green Card holder, future U.S. citizen, and future Finance/Insurance modules |
| **No duplication** | Today's Focus primary action must not repeat as the first Action Center item |

This rule applies across EB waiting users, Green Card holders, future U.S. citizens, and future Finance/Insurance dashboard modules.

### Today's Focus and Action Center Rule

> **One Focus. Many Actions.**

The dashboard should not only show data — it should **guide the user toward what matters most today**.

| Principle | Meaning |
|-----------|---------|
| **One focus** | Each journey-stage dashboard has exactly one **Today's Focus** card with the most important current message or action |
| **Many actions** | **Action Center** contains remaining useful actions with short descriptions and availability badges |
| **No duplication** | Do not repeat Today's Focus inside Action Center |
| **Compact guidance** | Today's Focus is visually distinct — title, badge, message, and optional CTA |
| **Action Center subtitle** | *"More ways IMMIFIN can help"* — signals secondary but valuable tools |

Today's Focus badges may include **Recommended**, **Current**, **Waiting**, or **Coming Soon** depending on journey state.

Action Center items show **Available**, **Coming Soon**, or **Pro** according to existing UI conventions.

This rule applies across EB waiting users, Green Card holders, future U.S. citizens, and future Finance/Insurance dashboard modules.

### Employment-Based Comparative Timeline Rule

> **EB timelines compare dates. GC timelines measure progress.**

Employment-Based Green Card waiting users do **not** have a fixed final destination date. Visa Bulletin dates move monthly and are controlled externally. EB dashboard timelines are therefore **comparative timelines**, not fixed personal progress bars like the Green Card Holder citizenship journey.

| Principle | Meaning |
|-----------|---------|
| **Comparative, not progressive** | EB timelines compare Priority Date, Visa Bulletin cutoff, and Today on a real calendar axis |
| **GC is different** | GC Holder timelines measure progress from Green Card Date → Earliest N-400 Filing Date with Today as a moving marker |
| **Three plotted dates** | Priority Date, Visa Bulletin cutoff, and Today appear proportionally by real calendar date |
| **Timeline range** | Visible range runs from the earliest relevant date (Priority Date or cutoff) to Today |
| **Independent charts** | Dates for Filing and Final Action Date each use this model independently |
| **Status color** | Green = cutoff reached or passed Priority Date; Red = cutoff still behind Priority Date; Gray = unavailable |

Status logic remains **separate from marker positioning** — color communicates eligibility; position communicates calendar relationship.

---

## 20. Premium Feature Discovery

> **Premium features should feel like a product demonstration — not a paywall.**

**Premium Feature Discovery** is the standard IMMIFIN UX pattern for Free users encountering Pro or Power features.

### Flow

1. Render the **real feature** underneath.
2. Display a **blurred preview** (charts, cards, tables remain recognizable).
3. Show a **premium overlay** explaining value with feature-specific benefit groups.
4. Allow users to **dismiss the overlay** (X button).
5. Display an **educational information state** — not a reduced Free version of the feature.
6. Encourage upgrading without blocking exploration.

### Design intent

Free users should think:

> *"I want those insights."*

Not:

> *"I hit another paywall."*

### Standard for all future premium features

This pattern applies to Dashboard, AI, Finance, Insurance, Documents, Priority Tracking, and all future premium surfaces. Implementation: `components/common/PremiumFeaturePreview.tsx`.

See [BUSINESS_MODEL.md §15–16](./BUSINESS_MODEL.md#15-premium-feature-discovery).

---

## 21. Product Principles (v0.4.1)

Foundation principles established at the v0.4.1 milestone:

1. **Public information should educate. Premium features should personalize.**
2. **Premium features should demonstrate value before asking users to upgrade.**
3. **Never create duplicate versions of premium pages.**
4. **Render the real feature whenever possible.**
5. **Every premium page should answer:** *"What will I gain by upgrading?"*

These extend [§14 Product Principles](#14-product-principles) with subscription UX specificity. See [BUSINESS_MODEL.md §17](./BUSINESS_MODEL.md#17-product-principles-v041).

---

## 22. Design System 2.0 Preparation

**v0.4.1 completes the IMMIFIN platform foundation.** Design System 2.0 is the **next major initiative** — beginning after v0.4.1 is approved.

### Scope

| Area | Goal |
|------|------|
| **Unified visual language** | Consistent typography, color, spacing, and elevation across the platform |
| **Component library** | Shared, documented UI primitives replacing one-off patterns |
| **Dashboard redesign** | Visual polish on the stable journey dashboard architecture |
| **Homepage redesign** | Public-facing brand and conversion experience |
| **Profile redesign** | Manage Profile visual consistency and usability |
| **Timeline redesign** | EB and GC timeline visual refinement |
| **Pricing redesign** | Plan comparison and upgrade flow polish |
| **Platform-wide UI consistency** | Immigration, Finance, Insurance, My Immifin share one design language |

### What v0.4.1 preserves for Design System 2.0

- Stable dashboard layout architecture (layout stable, content dynamic)
- Capability-based subscription model
- Premium Feature Discovery UX pattern
- My Immifin workspace information architecture
- Documentation-first development workflow

Design System 2.0 is a **visual and component refresh** — not a rewrite of platform architecture established in v0.4.1.

See [RELEASE_NOTES_v0.4.1.md](./RELEASE_NOTES_v0.4.1.md) and [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md).

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-02 | S4-002.2 | Initial Product Vision — Life Operating System for Immigrants |
| v1.1 | 2026-07-02 | S4-002.3 | Founder philosophy, decision principles, product principles, North Star question |
| v1.2 | 2026-07-02 | S4-003A | Personal Dashboard Vision — Phase 1 Immigration, future Finance/Insurance expansion |
| v1.3 | 2026-07-03 | S4-004.8 | Stable Journey Dashboard Layout Rule — layout stable, content dynamic |
| v1.4 | 2026-07-03 | S4-004.9 | Quick Actions Rule — navigation stable, priorities dynamic |
| v1.5 | 2026-07-03 | S4-004.11 | Today's Focus and Action Center — one focus, many actions |
| v1.6 | 2026-07-03 | S4-004.12 | EB Comparative Timeline Rule — EB compares dates, GC measures progress |
| v1.7 | 2026-07-03 | S4-004.16 | Dashboard access, exit, and profile section reset UX rules |
| v1.8 | 2026-07-03 | S4-005 | My IMMIFIN personal workspace vision and navigation |
| v1.9 | 2026-07-03 | S4-005.1 | My IMMIFIN navigation rule and dashboard identity rule |
| v1.10 | 2026-07-03 | S4-005.2 | My Immifin naming, dashboard Pro lock, and dev-only tier testing |
| v1.11 | 2026-07-03 | S4-005.3 | Subscription capability foundation and Free dashboard lock |
| v1.12 | 2026-07-03 | S4-005.4 | Profile access philosophy — data entry Free, notifications Pro |
| v1.13 | 2026-07-03 | S4-005.5 | Upgrade path strategy and /pricing foundation |
| v1.14 | 2026-07-04 | S4-005.13 | Premium Feature Preview framework reference |
| v1.15 | 2026-07-04 | S4-005.14 | Close-to-info dismissed state UX |
| v1.16 | 2026-07-04 | S4-005.15 | Premium Feature Discovery, product principles, Design System 2.0 preparation |
