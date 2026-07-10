# IMMIFIN Current Project State

**Last Updated:** 2026-07-09 (**Sprint 6 kicked off**)

| Field | Value |
|-------|-------|
| **Current Sprint** | Sprint 6 — AI & Personalization + Admin Operations + Resend *(In Progress)* |
| **Production Version** | v0.4.2 (Sprint 5 closeout) |
| **Repository** | `main` |
| **Production Status** | 🟢 Stable — Sprint 5 signed off; Sprint 6 started |
| **Cloudflare** | 🟢 Deployed — ⚠️ Workers **Free** plan may 1102 on cold start; Paid recommended |
| **Database** | 🟢 Stable |
| **Authentication** | 🟢 Stable |
| **Build Status** | 🟢 Passing |
| **Current Priority** | Sprint 6 — Workers Paid → Resend emails → Admin ops → AI |

## Current Version

**IMMIFIN v0.4.2** — Dashboard polish, Favorites, DS 2.0 workspace layout, Pro calculator auto-population

See [RELEASE_NOTES_v0.4.2.md](./RELEASE_NOTES_v0.4.2.md).

**Previous:** v0.4.1 Foundation Release (tag `v0.4.1`, commit `704bc7c`)

## Current Phase

**Sprint 6 — AI & Personalization + Admin Operations** *(In Progress — kicked off 2026-07-09)*

Sprint 5 is complete. See [SPRINT_5_SIGNOFF.md](./SPRINT_5_SIGNOFF.md) and [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md).

### Sprint 5 progress — Visa Bulletin DS 2.0 pages *(complete)*

Three **Visa Bulletin** pages have been redesigned under Design System 2.0. Two are **live on production**; History is approved and pending promotion.

| Page | Production route | DS 2.0 doc | Status |
|------|------------------|------------|--------|
| **Visa Bulletin History** | `/immigration/visa-bulletin-history` | [VISA_BULLETIN_HISTORY_2.0.md](./design-system/VISA_BULLETIN_HISTORY_2.0.md) | ✅ Approved — mockup `/immigration/visa-bulletin/tracker-2` |
| **Movement Tracker** | `/immigration/visa-bulletin-movement` | [VISA_BULLETIN_MOVEMENT_2.0.md](./design-system/VISA_BULLETIN_MOVEMENT_2.0.md) | ✅ **Promoted** (2026-07-05) |
| **Visa Bulletin Dashboard** | `/immigration/visa-bulletin` | [VISA_BULLETIN_DASHBOARD_2.0.md](./design-system/VISA_BULLETIN_DASHBOARD_2.0.md) | ✅ **Promoted** (2026-07-06) |

| Deliverable | Status |
|-------------|--------|
| Design System 2.0 documentation framework | ✅ Complete |
| **Visa Bulletin History DS 2.0** | ✅ Approved — promotion pending |
| **Visa Bulletin Movement Tracker DS 2.0** | ✅ **Promoted to production** |
| **Visa Bulletin Dashboard DS 2.0** | ✅ **Promoted to production** |
| **Workspace page shell (DS 2.0)** | ✅ **Complete** — `WorkspacePageShell`, `WorkspacePageHeader`, `WorkspaceSection` |
| **My Immifin dashboard polish (v0.4.2)** | ✅ **Complete** — compact timeline cards, Immigration Details, Action Center |
| **Favorites (Pro/Power)** | ✅ **Complete** — nav, star, API, max 10 |
| **Pro calculator auto-population** | ✅ **Complete** — Green Card Wait Time + Citizenship |
| **H-1B Wage Level Estimator** | ✅ **Complete** — `/immigration/h1b-wage-level-estimator` — [CALCULATORS.md](./CALCULATORS.md) |
| **H-1B Lottery Odds Calculator** | ✅ **Complete** — `/immigration/h1b-lottery-odds-calculator` — [CALCULATORS.md](./CALCULATORS.md) |
| **Global Visa Stamping Wait Map** | ✅ **Promoted** (2026-07-09) — `/immigration/visa-stamping-wait-map` — [VISA_STAMPING_WAIT_MAP_2.0.md](./design-system/VISA_STAMPING_WAIT_MAP_2.0.md) |
| **Admin Dashboard MVP + Data Refresh** | ✅ **Complete** — `/admin` — [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md) |
| **My Immifin → Admin nav** | ✅ **Complete** — `profiles.role = admin` only |
| **Admin subscription testing** | ✅ **Complete** — admins switch Free/Pro/Power without global dev flag |
| **Unified Manage Profile hub** | ✅ **Complete** — `/user-profile` (Immigration, Green Card, Contact, Notifications) |
| **Subscription data retention policy** | ✅ **Documented** — tier changes never delete profile data |
| **Site scroll / Calculator menu fix** | ✅ **Complete** — `ScrollToTop`; menu opens at page top |
| **Sprint 5 sign-off** | ✅ **Complete** — [SPRINT_5_SIGNOFF.md](./SPRINT_5_SIGNOFF.md) |
| Remaining Sprint 5 page redesigns | ➡️ Deferred past Sprint 5 (homepage / full profile polish) |
| **Subscription Foundation (S5-ENG-004)** | ✅ **Complete** — Development Subscription Mode |
| **Pricing UX polish (S5-ENG-005/006)** | ✅ **Complete** — Current Plan / Upgrade / Switch buttons |

**Global Visa Stamping Wait Map highlights:**

- Approved simulation dashboard layout (KPI row + Map / Consulates / Details)
- Live Google Sheets data (`stamping_wait_time_current`, history, city metadata)
- Leaflet + OpenStreetMap interactive map (client-only dynamic import)
- History Trend tab loads **lazy** (`includeHistory=true&city=`) — default API omits `historyPoints`
- Public free route; demo fallback when sheets unavailable
- Admin **Data Refresh** force-syncs sheet cache

**Visa Bulletin History DS 2.0 highlights:**

- Design System 2.0 premium SaaS styling
- New KPI summary cards
- Responsive dual-chart analysis workspace
- Scrollable history timeline with quarter markers
- Historical table redesign (inline vertical scroll, newest first)
- Cleaner workspace — removed duplicate sections
- Improved information density
- **6 Month** default date range
- Chart retrogression highlighting (red/blue segments)

### Sprint 5 — Subscription Foundation (completed)

| Deliverable | Status |
|-------------|--------|
| Development Subscription Mode | ✅ Complete (`ef412e0`) |
| Pricing page redesign (`PricingPlans`) | ✅ Complete |
| Current Plan / Upgrade / Switch UX | ✅ Complete (`b64317c`, S5-ENG-005/006) |
| User plan persistence (Supabase) | ✅ Complete — `profiles.plan` + `subscriptions.plan` |
| Subscription API | ✅ Complete — `/api/account/subscription` |
| SubscriptionTierProvider | ✅ Complete |
| Profile / Account integration | ✅ Complete — `/account`, `/user-profile#/subscription` |
| Pro feature gating | ✅ Operational — capability model unchanged |
| Power tier architecture | ✅ Prepared — `power` added to `app_plan` enum |
| Stripe billing | ⏳ Intentionally deferred |

## Next Sprint

**Sprint 6 — AI & Personalization + Admin Operations** *(**In Progress** — kicked off 2026-07-09)*

See [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) and [SPRINT_5_SIGNOFF.md](./SPRINT_5_SIGNOFF.md).

### Sprint 6 priorities (agreed order)

| Deliverable | Task ID | Notes |
|-------------|---------|-------|
| **Cloudflare Workers Paid** | Ops | Recommended first — stops intermittent Error 1102 cold starts |
| **Notification Design** | S6-DOC-001 | ✅ [NOTIFICATION_DESIGN.md](./NOTIFICATION_DESIGN.md) — architecture + roadmap (source of truth before any send code) |
| **Resend / Notification Platform** | S6-EMAIL-001 | Must follow [NOTIFICATION_DESIGN.md](./NOTIFICATION_DESIGN.md); Monthly Immigration Report is flagship (not a generic bulletin blast) |
| **Admin Operations page** | S6-ADM-001 | Force sync + manual archive UI — **MVP dashboard shipped**; richer ops pending |
| **Manual history archive** | S6-ADM-001 | Admin UI for existing archive API — **manual only**; no automation |
| **AI & Personalization** | S6-AI-xxx | Primary Sprint 6 theme — detailed tasks at kickoff |

### Sprint 6 documentation references

| Document | Role |
|----------|------|
| [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) | Sprint 6 handoff — AI, Admin ops, Resend |
| [NOTIFICATION_DESIGN.md](./NOTIFICATION_DESIGN.md) | **Notification Platform** architecture, categories, and implementation roadmap |
| [SPRINT_5_SIGNOFF.md](./SPRINT_5_SIGNOFF.md) | Sprint 5 closeout; deferred notification delivery |

## Roadmap Revision

Following v0.4.1, Sprint 5 was **intentionally changed** to Design System 2.0 before adding more product features.

**Reason:**

- Improve commercial product quality
- Avoid UI/design debt
- Establish reusable component library
- Make future AI, Finance, Insurance, and Automation features consistent

See [ROADMAP_v2.md](./ROADMAP_v2.md) and [SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md).

> The roadmap is a living product strategy, not a fixed contract. Previously planned Sprint 5+ work shifts forward — nothing is removed.

**Document purpose:** Permanent project status reference for IMMIFIN. A new engineer—or a fresh ChatGPT session—should be able to read this document and immediately understand the project, its architecture, current production state, engineering practices, and exactly where development should begin.

**Production branch:** `main`  
**Latest commit:** `8500446` — docs: sign off Sprint 5 and sync project status for closeout.  
**Sprint 5 sign-off:** [SPRINT_5_SIGNOFF.md](./SPRINT_5_SIGNOFF.md)  
**Subscription Foundation:** `ef412e0` — Development Subscription Mode · `b64317c` — Pricing UX polish  
**Latest tag:** `v0.4.1`  
**Owner:** Technical Architecture (CTO)

---

## Related documentation

| Document | Role |
|----------|------|
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Infrastructure, domains, deployment |
| [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) | Workflow, gates, rules |
| [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) | Subscription tiers, capabilities — **source of truth for feature gating** |
| [NOTIFICATION_DESIGN.md](./NOTIFICATION_DESIGN.md) | Notification Platform design — Sprint 6+ email / alerts blueprint |
| [PRODUCT_VISION.md](./PRODUCT_VISION.md) | Long-term product vision |
| [RELEASE_NOTES_v0.4.1.md](./RELEASE_NOTES_v0.4.1.md) | v0.4.1 foundation milestone summary |
| [ROADMAP_v2.md](./ROADMAP_v2.md) | Revised sprint roadmap — Design System 2.0 as Sprint 5 |
| [SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md) | **Start here for Sprint 5** — mandatory reading order |
| [CALCULATORS.md](./CALCULATORS.md) | Live immigration calculators + H-1B pair |
| [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md) | Admin MVP, role bootstrap, subscription testing |
| [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) | Sprint 6 — force sync, AI & Personalization |
| [design-system/VISA_BULLETIN_HISTORY_2.0.md](./design-system/VISA_BULLETIN_HISTORY_2.0.md) | First approved DS 2.0 page — Visa Bulletin History promotion |
| [deployment/CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md) | Cloudflare build/deploy guide — Build vs Runtime variables |
| [deployment/DEPLOYMENT_TROUBLESHOOTING.md](./deployment/DEPLOYMENT_TROUBLESHOOTING.md) | Production pricing / build variable incident |
| [architecture/ADR-007-Development-Subscription-Mode.md](./architecture/ADR-007-Development-Subscription-Mode.md) | Development Subscription Mode ADR |
| [V0_4_1_FOUNDATION_SIGNOFF.md](./V0_4_1_FOUNDATION_SIGNOFF.md) | Formal v0.4.1 sign-off and frozen decisions |
| [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) | Local dev, tunnel, webhooks |
| [SPRINT_RELEASE_CHECKLIST.md](./SPRINT_RELEASE_CHECKLIST.md) | Pre-deploy acceptance |
| [TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md) | Architecture conventions |
| [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) | Long-term product phases |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | Legacy sprint log *(superseded by this document)* |

---

## 1. Executive Summary

IMMIFIN has completed the **v0.4.1 platform foundation** at the end of Sprint 4. This milestone establishes the architecture, subscription model, personal workspace, dashboard framework, profile management, and premium feature discovery UX — all documented and stable before **Design System 2.0**.

### v0.4.1 foundation milestone (S4-005)

| Area | Status |
|------|--------|
| **My Immifin workspace** | ✅ Navigation dropdown; Dashboard + Manage Profile |
| **Free / Pro / Power subscription** | ✅ Tiers, capability map, dev tier testing |
| **Capability-based authorization** | ✅ `lib/subscription/capabilities.ts` — no scattered plan checks |
| **Pricing foundation** | ✅ `/pricing` — Development Subscription Mode when flag enabled; Coming Soon fallback when off |
| **Dashboard framework** | ✅ Journey layout, EB timeline, Today's Focus, Action Center |
| **Profile management** | ✅ Tier gates, dirty state, in-app clear modals |
| **Premium feature gating** | ✅ `PremiumFeaturePreview`, close-to-info UX |
| **Cloudflare deployment** | ✅ OpenNext `npm run deploy`; build + deploy workflow documented |
| **Documentation-first workflow** | ✅ BUSINESS_MODEL, PRODUCT_VISION, release notes updated |

See [RELEASE_NOTES_v0.4.1.md](./RELEASE_NOTES_v0.4.1.md) for the full milestone summary.

### Sprint 4 completed (S4-001)

- **Application-wide authentication gate** — Only `/` is public; all tools, calculators, immigration, finance, and account routes require Clerk sign-in
- **Middleware** — Public-route allowlist with Clerk `auth.protect()` (no Supabase lookups)
- **Login Required UX** — `ProtectedLink` + toast on landing-page feature clicks; redirect to sign-in with `redirect_url` return path (~600ms delay)
- **Sign-in return URL** — `/login?redirect_url=` honored via Clerk `fallbackRedirectUrl`

### Sprint 3 focus areas (completed)

- **Authentication** — Clerk sign-up, sign-in, email verification, OTP, sessions, password reset
- **User Profile** — Manage Profile hub (`/user-profile`) with Clerk Account and Security tabs
- **Contact Management** — Phone number capture, country code, validation, persistence in Supabase
- **Notification Preferences** — Six toggle preferences stored on profile
- **Onboarding** — Complete Profile flow for users missing `profiles.phone_number`
- **Infrastructure Hardening** — Cloudflare Worker 1102 hotfix, lightweight middleware, dev tunnel workflow
- **Documentation** — Developer setup, engineering playbook v2.1, sprint release checklist
- **Engineering Process** — Development Workflow v2.0, feature branches, release gates, lessons learned

### Current status

| Area | Status |
|------|--------|
| **Production** | ✅ Stable (`https://immifin.com`) |
| **Authentication** | ✅ Working — app-wide gate (S4-001); landing page public |
| **Profile & onboarding** | ✅ Working (application-layer enforcement) |
| **Clerk ↔ Supabase sync** | ✅ Working (webhooks) |
| **Build & deploy** | ✅ Passing (`npm run build`, Cloudflare auto-deploy from `main`) |
| **Sprint 4** | ✅ Complete — v0.4.1 released and tagged |
| **Sprint 5** | 🟡 In Progress — Visa Bulletin History DS 2.0 promoted; Subscription Foundation complete |

---

## Cloudflare Deployment Resolution

**Incident (2026-07-05):** Production `/pricing` showed "Coming Soon" while localhost showed Development Subscription Mode.

### Deployment pipeline (verified)

```
Cursor → Commit → GitHub main → Cloudflare Git Build → OpenNext Build → Wrangler Deploy → Production
```

| Component | Detail |
|-----------|--------|
| **Git integration** | Push to `main` triggers automatic Cloudflare build |
| **Build command** | `npm run deploy` (`opennextjs-cloudflare build && deploy`) |
| **Deploy command** | `echo done` (deploy runs inside build script) |
| **OpenNext** | Bundles Next.js for Cloudflare Workers runtime |
| **Wrangler** | Deploys Worker + static assets from `.open-next/` |

### Build Variables vs Runtime Variables

| Type | When evaluated | Used for |
|------|----------------|----------|
| **Build Variables** | During `opennextjs-cloudflare build` | `NEXT_PUBLIC_*` — inlined into client JS and prerendered HTML |
| **Runtime Variables / Secrets** | Each Worker request | Server secrets (`CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) |

### Root cause — "Coming Soon" on production

`NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE` was set as a **runtime** Cloudflare variable but **not** as a **Build Variable**. Next.js evaluates `NEXT_PUBLIC_*` at build time. `/pricing` is prerendered (`x-nextjs-prerender: 1`), so the Coming Soon branch was baked into production HTML.

### Resolution

1. Add `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE=true` as a **Cloudflare Build Variable**
2. Trigger full rebuild (push to `main`)
3. Verify `/pricing` shows Development Subscription Mode after deploy

See [deployment/DEPLOYMENT_TROUBLESHOOTING.md](./deployment/DEPLOYMENT_TROUBLESHOOTING.md) and [deployment/CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md).

---

## Product Vision

IMMIFIN is building an intelligent immigration planning platform that combines:

- Immigration intelligence
- Financial planning
- Personalized dashboards
- AI assistance
- Smart notifications

The objective is to provide immigrants with a single trusted platform for planning, tracking, and managing their U.S. immigration journey.

---

## 2. Technology Stack

### Frontend

| Technology | Usage |
|------------|-------|
| **Next.js App Router** | Pages, layouts, API routes, Server/Client Components |
| **React 19** | UI components |
| **Tailwind CSS** | Styling, responsive layout |
| **SWR** | Client data fetching (Visa Bulletin Movement Tracker pattern) |

### Authentication

| Technology | Usage |
|------------|-------|
| **Clerk** | Identity provider — sign-up, login, sessions, OTP, profile image, password management |
| **Clerk Webhooks** | `user.created`, `user.updated`, `user.deleted` → Supabase sync |

### Database

| Technology | Usage |
|------------|-------|
| **Supabase (PostgreSQL)** | `profiles`, immigration fields, contact, notification preferences |
| **Supabase RPCs** | `upsert_profile_from_clerk`, `soft_delete_profile_by_clerk_id` |

### Hosting

| Technology | Usage |
|------------|-------|
| **Cloudflare Workers** | Production runtime (OpenNext) |
| **OpenNext** | Next.js → Cloudflare adapter (`npm run deploy`) |
| **Cloudflare Tunnel** | Local dev HTTPS at `https://dev.immifin.com` for Clerk webhooks |

### External Data

| Source | Usage |
|--------|-------|
| **Google Sheets** | Visa Bulletin data ingestion |
| **Visa Bulletin APIs** | Dashboard, Movement Tracker, Historical Trends |

### Version Control

| Technology | Usage |
|------------|-------|
| **GitHub** | `adminjodiba/immifin` — `main` triggers production deploy |

### Key environment URLs

| Environment | URL |
|-------------|-----|
| Local | `http://localhost:3000` |
| Dev (tunnel) | `https://dev.immifin.com` |
| Production | `https://immifin.com` |
| Clerk webhook (dev) | `https://dev.immifin.com/api/webhooks/clerk` |
| Clerk webhook (prod) | `https://immifin.com/api/webhooks/clerk` |

---

## 3. Current Production Capabilities

### Authentication

- ✓ Signup
- ✓ Email Verification
- ✓ Email OTP
- ✓ Password Login
- ✓ Logout
- ✓ Password Reset
- ✓ Profile Image
- ✓ App-wide route protection (S4-001) — landing `/` public; all features require sign-in
- ✓ Login Required message on protected link clicks (signed-out visitors)
- ✓ Post-login return URL to intended destination

### Profile Hub (`/user-profile`)

Tier-gated via capabilities. Free users edit Contact; Immigration, Green Card, and Notifications locked with upgrade CTAs.

| Tab | Capability | Free | Pro | Power |
|-----|------------|------|-----|-------|
| **Account** | — | ✅ | ✅ | ✅ |
| **Security** | — | ✅ | ✅ | ✅ |
| **Immigration** | `accessSaveImmigrationProfile` | 🔒 | ✅ | ✅ |
| **Green Card** | `accessSaveImmigrationProfile` | 🔒 | ✅ | ✅ |
| **Contact** | — | ✅ | ✅ | ✅ |
| **Notifications** | `accessNotifications` | 🔒 | ✅ | ✅ |

- ✓ In-app Clear Section confirmation modals
- ✓ Page-level dirty state with unsaved-changes prompt on exit

### My Immifin workspace

- ✓ Top nav **My Immifin** dropdown (Dashboard, Manage Profile)
- ✓ `/dashboard` — journey dashboard with stable layout
- ✓ Free users: locked dashboard preview; Pro/Power: full dashboard
- ✓ Dev tier switcher (development only)

### Premium features (Pro-gated)

- ✓ Visa Bulletin History — `PremiumFeaturePreview` with Historical Intelligence benefits
- ✓ Movement Tracker — `PremiumFeaturePreview` with Movement Intelligence benefits
- ✓ Close (X) → educational Free-state info panel (no Pro access)

### Calculators

- ✓ Free: manual input only
- ✓ Pro/Power: auto-population from saved profile (`accessAutoCalculatorPopulation`)

### Pricing

- ✓ `/pricing` — Free / Pro / Power plan cards
- ✓ Development Subscription Mode — tier activation via `/pricing` and `/account` (when `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE=true`)
- ✓ Current Plan / Upgrade / Switch button UX (signed-in users)
- ✓ Coming Soon fallback when dev mode flag is off (pre-Stripe production default)
- ⏳ Stripe checkout — intentionally deferred

### Immigration (Free tools)

- ✓ Current Visa Bulletin Dashboard (`/immigration/visa-bulletin`)
- ✓ Green Card Wait Calculator (manual input for Free)
- ✓ Citizenship Calculator (manual input for Free)

### Onboarding

- ✓ Complete Profile flow at `/onboarding/contact-preferences`
- ✓ Enforced at **application layer** (not middleware) via `ContactOnboardingGuard`
- ✓ Post-login/signup redirect when `phone_number` is missing
- ✓ After save → homepage (`/`)

Legacy `/account` redirects users to Manage Profile via migration banner.

### Infrastructure

- ✓ Clerk ↔ Supabase sync (webhooks)
- ✓ Soft delete (`profiles.status = 'deleted'`)
- ✓ Cloudflare deployment (auto from `main`)
- ✓ Cloudflare dev tunnel (`npm run dev:local`, tunnel `immifin-dev`)
- ✓ OpenNext build: `npm run deploy`; Cloudflare deploy command: `echo done`

---

## 4. Major Architecture Decisions

### ADR-001 — Clerk is the Identity Provider

**Decision:** Clerk is the identity provider. Supabase stores IMMIFIN business data only.

| Concern | Owner |
|---------|-------|
| Passwords, sessions, OTP | Clerk |
| `profiles`, immigration, contact, notifications | Supabase |
| Link field | `profiles.clerk_user_id` |

**Key files:** `app/api/webhooks/clerk/route.ts`, `lib/clerk/profileSync.ts`, `lib/supabase/profiles.ts`

---

### ADR-002 — Visa Bulletin data comes from Google Sheets

**Decision:** Visa Bulletin data is sourced from Google Sheets and served through API routes.

**Pattern:** Server-side data fetch for dashboards; client components only for interactivity (toggle, charts via SWR + API).

**Reference implementation:** Movement Tracker (`/immigration/visa-bulletin-movement`)

---

### ADR-003 — Profile completeness enforced at the Application Layer

**Decision:** Profile completeness (contact onboarding) is enforced at the **application layer**. Middleware performs **authentication only**.

**Reason:** Supabase lookups in `middleware.ts` caused **Cloudflare Worker Error 1102** (resource limit exceeded) in production.

**Implementation:**

| Layer | Responsibility |
|-------|----------------|
| `middleware.ts` | Clerk `auth.protect()` on protected routes only |
| `ContactOnboardingGuard` | Client guard — calls `/api/account/contact-status`, redirects if no phone |
| Guard locations | `app/page.tsx` (`publicLanding`), `/user-profile`, `/account` |
| Onboarding page | Skips if phone already present |

**Do not reintroduce Supabase/profile lookups into middleware.**

---

### ADR-005 — Landing page public; all application features require authentication (S4-001)

**Decision:** Only `/` is publicly accessible. All IMMIFIN tools, calculators, immigration pages, finance pages, and account surfaces require Clerk authentication enforced in middleware.

**Client UX:** Signed-out visitors on `/` who click protected links see a Login Required toast, then redirect to `/login?redirect_url=<destination>`.

**Public routes (middleware):** `/`, `/login`, `/signup`, `/api/webhooks/*`, `/sitemap.xml`, `/robots.txt`

**Key files:** `middleware.ts`, `lib/auth/publicRoutes.ts`, `components/auth/ProtectedLink.tsx`, `components/auth/LoginRequiredProvider.tsx`

---

### ADR-004 — Supabase profile lifecycle

**Decision:** Soft delete only. Never immediately hard-delete from application logic.

```
Active
  ↓  (Clerk user.deleted webhook)
Deleted  (profiles.status = 'deleted')
  ↓  (re-signup / user.created restore path)
Active
```

**RPC:** `soft_delete_profile_by_clerk_id()` — sets `status = 'deleted'`, preserves row for reactivation.

---

## 5. User Lifecycle

### Signup → Active user

```
Signup (/signup)
        ↓
Email Verification (Clerk)
        ↓
Clerk User Created
        ↓
Webhook → POST /api/webhooks/clerk (user.created)
        ↓
Supabase Profile (upsert_profile_from_clerk RPC)
        ↓
Complete Profile (/onboarding/contact-preferences)
   — if phone_number missing
        ↓
Homepage (/)
```

### Sign-in (existing user)

```
Login (/login)
        ↓
Clerk Session
        ↓
Redirect to / (fallbackRedirectUrl)
        ↓
ContactOnboardingGuard on homepage
   — if phone_number missing → /onboarding/contact-preferences
   — if phone_number present → homepage renders
```

### Delete

```
User deleted in Clerk Dashboard
        ↓
Webhook → user.deleted
        ↓
Supabase: soft_delete_profile_by_clerk_id
        ↓
profiles.status = 'deleted'
```

**Critical:** Clerk webhooks require the **Cloudflare dev tunnel** to be healthy during local testing. Tunnel offline → HTTP 530 / Error 1033 — not an application bug.

---

## 6. Engineering Workflow

Every development session (especially auth, webhooks, profile sync):

| Step | Action |
|------|--------|
| 1 | Start Next.js — `npm run dev` |
| 2 | Start Cloudflare Dev Tunnel — `npm run dev:local` or `cloudflared tunnel run immifin-dev` |
| 3 | Verify tunnel healthy — `cloudflared tunnel info immifin-dev`, `https://dev.immifin.com` loads |
| 4 | Run localhost — `http://localhost:3000` |
| 5 | Implement — feature branch, inspect-first, stay in scope |
| 6 | Regression test — auth, profile, onboarding, calculators, visa bulletin |
| 7 | Build — `npm run build` must pass |
| 8 | Commit — small logical commits |
| 9 | Push — `git push origin main` (or merge feature branch) |
| 10 | Verify Cloudflare deployment — check deploy completes |
| 11 | Production smoke test — login, profile, key pages at `immifin.com` |

**After code changes for localhost testing:** stop and restart the dev server.

See [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) and [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) for full detail.

---

## 7. Lessons Learned

### Cloudflare Tunnel

Must always be running **before** testing Clerk webhooks.

- Symptom: HTTP **530**, Cloudflare Error **1033**
- Fix: `npm run dev:local` or `cloudflared tunnel run immifin-dev`
- Verify: Clerk Dashboard → Webhooks → Message Attempts → **200**

### Cloudflare Worker (middleware)

Middleware must remain **lightweight**. **No Supabase lookups** in `middleware.ts`.

- Incident: Production Error **1102** after middleware performed `getProfilePhoneStatus()` on protected routes
- Hotfix: `d75c903` — removed onboarding logic from middleware
- Replacement: `ContactOnboardingGuard` at page level (`65d1215`)

### Infrastructure vs application bugs

Always verify infrastructure before debugging application code.

- Example: Clerk `user.deleted` appeared broken; root cause was tunnel offline, not webhook handler code

### Commit strategy

Small logical commits. Examples from Sprint 3 close:

```
65d1215 Enforce contact onboarding after authentication
acdd08a Add local dev tunnel startup script
d75c903 Hotfix remove heavy onboarding middleware
```

### Production

Always verify deployment completes before concluding a release failed.

- Empty deploy trigger commit (`804f828`) used when Cloudflare needed a fresh build

### Server vs Client Components

- Do not convert large Server Components into Client Components
- Use small Client Components for toggles and interactivity
- Movement Tracker is the reference pattern for Visa Bulletin features

---

## 8. Outstanding Technical Debt

Intentional deferred items — not bugs:

| Item | Notes |
|------|-------|
| **Notification engine** | Preferences UI exists; delivery engine (scheduled alerts) not built |
| **SMS integration** | Toggle exists; Twilio/provider not integrated |
| **AI Assistant** | Power-tier capability defined; not implemented |
| **Stripe billing** | Pricing page exists; checkout not connected |
| **Premium preview rollout** | Apply `PremiumFeaturePreview` to Dashboard, AI, Finance, Insurance, Documents |
| **Design System 2.0** | 🟡 In Progress — Visa Bulletin History approved; remaining pages planned |
| **Analytics** | No product analytics pipeline |
| **Visa Bulletin Dashboard toggle** | Final Action / Dates for Filing toggle — match Movement Tracker pattern |
| **Onboarding on all routes** | Guard on `/`, `/user-profile`, `/account`; all other routes now require auth via middleware (S4-001) |
| **Admin UI** | `/admin` API routes exist; admin page surface minimal |
| **CI/CD** | No automated PR build checks yet |
| **Preview deployments** | Per-branch previews not configured |

---

## Current Priorities

1. **Sprint 5 — Design System 2.0** — Visa Bulletin History approved; continue remaining page redesigns
2. **Promote Visa Bulletin History mockup to production route** — future engineering task after user approval
3. **Stripe billing** — Sprint 10 (Commercial Launch Readiness)
4. **AI Assistant** — Sprint 6 (Power tier)
5. **Premium preview rollout** — Dashboard, AI, Finance, Insurance, Documents

---

## 9. Sprint 4 Objectives

### Primary goal (achieved in v0.4.1 foundation)

**Build the platform foundation** — My Immifin workspace, subscription capabilities, dashboard framework, profile management, and Premium Feature Discovery UX.

### Next initiative

**Design System 2.0** — visual and component refresh on the stable v0.4.1 architecture. See [PRODUCT_VISION.md §22](./PRODUCT_VISION.md#22-design-system-20-preparation).

### Constraints (ongoing)

- **No coding should begin until architecture is finalized**
- Follow Development Workflow v2.0: inspect → architecture review → approval → feature branch → implement
- Do not mix infrastructure changes with Dashboard feature work
- Middleware stays Clerk-auth-only
- Reuse existing patterns (SWR + API routes, Server/Client boundary discipline)

### Suggested architecture questions (pre-implementation)

1. Route: `/dashboard` — protected, replaces `/` as post-login landing for users with complete profile?
2. Data sources: profile, immigration fields, visa bulletin APIs, notification prefs — which widgets v1?
3. Layout: server shell + client widgets, or full client dashboard shell?
4. Relationship to onboarding: redirect incomplete profiles before dashboard renders?
5. Plan tiers: does dashboard content vary by `profiles.plan`?

---

## 10. Sprint 4 Milestones

| Milestone | Scope |
|-----------|-------|
| **Sprint 4.1 — Dashboard Architecture** | ADRs, wireframes, data model, API plan, route structure — **no code until approved** |
| **Sprint 4.2 — Dashboard UI** | Shell layout, navigation, responsive grid, empty states |
| **Sprint 4.3 — Dashboard Widgets** | Priority date summary, bulletin movement snapshot, calculator shortcuts, profile completeness |
| **Sprint 4.4 — Notification Center** | In-app notification list; connect to preference engine design |
| **Sprint 4.5 — AI Assistant** | Architecture spike; grounded Q&A entry point (roadmap Phase 5) |
| **Sprint 4.6 — Subscription Integration** | Stripe plan enforcement; dashboard gated features by `plan` |

Milestones 4.5 and 4.6 may span into Sprint 5 depending on scope approval.

---

## 11. Current Repository Health

**Overall Status: Production Stable**

### Completed

| Area | Status |
|------|--------|
| ✅ Authentication | Clerk sign-in, sign-up, sessions, app-wide gate |
| ✅ User Profiles | Manage Profile hub, contact onboarding, tier gates |
| ✅ Subscription Foundation | Development Subscription Mode, persistence, API |
| ✅ Pricing UX | Current Plan, Upgrade, Switch workflow |
| ✅ Feature Gates | Capability-based authorization operational |
| ✅ Cloudflare Auto Deploy | GitHub `main` → OpenNext → Wrangler |
| ✅ Deployment Documentation | Build vs Runtime variables documented |

### Pending

| Area | Status |
|------|--------|
| ⏳ Stripe | Checkout, webhooks, billing portal |
| ⏳ Payment Webhooks | Not integrated |
| ⏳ Billing Portal | Not built |
| ⏳ Subscription Management | Real billing UI deferred |

| Area | Status | Detail |
|------|--------|--------|
| **Repository** | ✅ Stable | Subscription Foundation on `main` |
| **Production** | ✅ Stable | `immifin.com` — auto-deploy verified |
| **Build** | ✅ Passing | `npm run build`, `npm run deploy` |
| **Engineering process** | ✅ Mature | Workflow v2.1, deployment troubleshooting documented |
| **Documentation** | ✅ Current | Subscription Foundation + Cloudflare deployment |
| **Sprint 5** | 🟡 In Progress | DS 2.0 + Subscription Foundation complete |

### Sprint 4 key commits (reference)

| Commit | Description |
|--------|-------------|
| `1affb01` | S4-001 — App-wide authentication gate; Login Required UX; return URL sign-in |

### Sprint 3 key commits (reference)

| Commit | Description |
|--------|-------------|
| `d841396` | Contact and notification profile sections |
| `e435d68` | Phone number column migration |
| `0ed0e62`–`ab049eb` | Contact onboarding flow |
| `0c7de04` | Profile exit and legacy account UX |
| `d75c903` | Hotfix: remove heavy middleware (1102) |
| `65d1215` | Enforce contact onboarding after authentication |
| `acdd08a` | Local dev tunnel startup script |
| `9c657c7` | Developer setup and sprint release checklist docs |

### Key application files

| Area | Path |
|------|------|
| Middleware | `middleware.ts` |
| Public route config | `lib/auth/publicRoutes.ts` |
| Protected navigation | `components/auth/ProtectedLink.tsx` |
| Login Required toast | `components/auth/LoginRequiredProvider.tsx` |
| Sign-in redirect URL | `lib/auth/signInRedirect.ts` |
| Onboarding guard | `components/onboarding/ContactOnboardingGuard.tsx` |
| Onboarding page | `app/onboarding/contact-preferences/page.tsx` |
| Profile hub | `components/profile/UserProfileHub.tsx` |
| Contact API | `app/api/account/profile/route.ts` |
| Contact status API | `app/api/account/contact-status/route.ts` |
| Phone lookup | `lib/account/hasProfilePhone.ts` |
| Clerk webhooks | `app/api/webhooks/clerk/route.ts` |
| Subscription tiers | `lib/subscription/tiers.ts` |
| Subscription capabilities | `lib/subscription/capabilities.ts` |
| Premium preview | `components/common/PremiumFeaturePreview.tsx` |
| Dashboard access gate | `components/dashboard/DashboardAccessGate.tsx` |
| Dev tier switcher | `components/dev/DevTierSwitcher.tsx` |
| Pricing page | `app/pricing/page.tsx` |
| Pricing plans UI | `components/pricing/PricingPlans.tsx` |
| Dev subscription mode | `lib/subscription/devSubscriptionMode.ts` |
| Subscription service | `lib/subscription/service.ts` |
| Subscription API | `app/api/account/subscription/route.ts` |
| Subscription provider | `lib/hooks/SubscriptionTierProvider.tsx` |
| Dev subscription panel | `components/subscription/DevelopmentSubscriptionPanel.tsx` |

---

## 12. Read This First

Every engineer working on IMMIFIN **must read** the following **before making code changes**:

| # | Document | Why |
|---|----------|-----|
| 1 | **This document** ([CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md)) | Authoritative project state and Sprint 4 starting point |
| 2 | [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Domains, Cloudflare, Clerk, Supabase, tunnel |
| 3 | [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) | Workflow v2.0, gates, mandatory tunnel rule |
| 4 | [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) | Local dev, webhooks, troubleshooting |
| 5 | [SPRINT_RELEASE_CHECKLIST.md](./SPRINT_RELEASE_CHECKLIST.md) | Pre-deploy acceptance |

### Sprint 5 starting point

1. Read [SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md) first
2. Read documents 1–5 in the handoff mandatory reading order
3. Begin **S5-000 — Create IMMIFIN Design System 2.0 Document**

---

## Quick Start

Before making **ANY** code changes, read:

1. [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md)
2. [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
3. [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md)
4. [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md)
5. [SPRINT_RELEASE_CHECKLIST.md](./SPRINT_RELEASE_CHECKLIST.md)

Then:

1. Start Next.js
2. Start Cloudflare Dev Tunnel
3. Verify tunnel is healthy
4. Run localhost
5. Begin development

```powershell
git clone https://github.com/adminjodiba/immifin.git
cd immifin
npm install
copy .env.example .env.local
# Fill in Clerk and Supabase keys

npm run dev:local
# Verify https://dev.immifin.com and http://localhost:3000
```

---

## Revision history

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-01 | Created as Sprint 4 handoff (`SPRINT_4_HANDOFF.md`) |
| v2.0 | 2026-07-01 | Promoted to permanent project state (`CURRENT_PROJECT_STATE.md`) |
| v2.1 | 2026-07-01 | S4-001 — app-wide authentication gate documented |
| v2.2 | 2026-07-01 | S4-001 deployed; closeout workflow updated |
| v3.0 | 2026-07-04 | S4-005.15 — v0.4.1 foundation milestone documented |
| v3.1 | 2026-07-04 | S4-005.16 — Roadmap v2, Sprint 5 handoff, v0.4.1 sign-off |
| v3.2 | 2026-07-05 | S5-004 — Visa Bulletin History DS 2.0 approved; Sprint 5 in progress |
| v3.3 | 2026-07-05 | S5-ENG-004/005/006 — Subscription Foundation; Cloudflare deployment resolution documented |
| v3.4 | 2026-07-06 | S5-009 — v0.4.2: My Immifin dashboard polish, Favorites, workspace shell, Pro calculator auto-fill |
