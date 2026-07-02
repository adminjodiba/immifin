# IMMIFIN Current Project State

**Last Updated:** 2026-07-01

| Field | Value |
|-------|-------|
| **Current Sprint** | Sprint 4 |
| **Production Version** | v0.4.0 *(committed; pending Cloudflare deploy)* |
| **Repository** | `main` |
| **Production Status** | 🟢 Stable |
| **Cloudflare** | 🟢 Healthy |
| **Database** | 🟢 Stable |
| **Authentication** | 🟢 Stable |
| **Build Status** | 🟢 Passing |
| **Current Priority** | Sprint 4 Dashboard |

**Document purpose:** Permanent project status reference for IMMIFIN. A new engineer—or a fresh ChatGPT session—should be able to read this document and immediately understand the project, its architecture, current production state, engineering practices, and exactly where development should begin.

**Production branch:** `main`  
**Latest commit:** S4-001 — app-wide authentication gate (`feat(auth): enforce authentication for all application features`)  
**Owner:** Technical Architecture (CTO)

---

## Related documentation

| Document | Role |
|----------|------|
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Infrastructure, domains, deployment |
| [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) | Workflow, gates, rules |
| [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) | Local dev, tunnel, webhooks |
| [SPRINT_RELEASE_CHECKLIST.md](./SPRINT_RELEASE_CHECKLIST.md) | Pre-deploy acceptance |
| [TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md) | Architecture conventions |
| [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) | Long-term product phases |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | Legacy sprint log *(superseded by this document)* |

---

## 1. Executive Summary

IMMIFIN has successfully completed **Sprint 3** and is actively in **Sprint 4**.

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
| **Sprint 4** | 🟢 In progress — Dashboard architecture |

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

| Tab | Capability |
|-----|------------|
| **Account** | Clerk-managed account details |
| **Security** | Password, email, security settings |
| **Immigration** | Category, country, priority date, bulletin type |
| **Green Card** | Issue date, married-to-US-citizen |
| **Contact** | Country code, phone number, validation |
| **Notifications** | SMS, email, visa bulletin, priority date, citizenship reminder, marketing toggles |

Legacy `/account` redirects users to Manage Profile via migration banner.

### Onboarding

- ✓ Complete Profile flow at `/onboarding/contact-preferences`
- ✓ Enforced at **application layer** (not middleware) via `ContactOnboardingGuard`
- ✓ Post-login/signup redirect when `phone_number` is missing
- ✓ After save → homepage (`/`)

### Immigration

- ✓ Visa Bulletin Dashboard
- ✓ Movement Tracker
- ✓ Historical Trends
- ✓ Green Card Calculator (auto-prefill from profile)
- ✓ Citizenship Calculator (auto-prefill from profile)

### Infrastructure

- ✓ Clerk ↔ Supabase sync (webhooks)
- ✓ Soft delete (`profiles.status = 'deleted'`)
- ✓ Cloudflare deployment (auto from `main`)
- ✓ Cloudflare dev tunnel (`npm run dev:local`, tunnel `immifin-dev`)

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
| **Dashboard** | Sprint 4 primary goal — `/dashboard` route does not exist yet |
| **AI Assistant** | Roadmap Phase 5 — not started |
| **Subscription management** | `profiles.plan` exists; Stripe billing not integrated |
| **Analytics** | No product analytics pipeline |
| **Visa Bulletin Dashboard toggle** | Final Action / Dates for Filing toggle — match Movement Tracker pattern |
| **Onboarding on all routes** | Guard on `/`, `/user-profile`, `/account`; all other routes now require auth via middleware (S4-001) |
| **Admin UI** | `/admin` API routes exist; admin page surface minimal |
| **CI/CD** | No automated PR build checks yet |
| **Preview deployments** | Per-branch previews not configured |

---

## Current Priorities

1. **Dashboard** (Primary Focus)
2. **Notification Engine**
3. **AI Assistant**
4. **Subscription Platform**
5. **Analytics & Insights**

---

## 9. Sprint 4 Objectives

### Primary goal

**Design and build the Dashboard.**

The Dashboard should become the **central command center** for IMMIFIN — aggregating immigration status, priority dates, visa bulletin movement, notification summary, and quick actions.

### Constraints

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

| Area | Status | Detail |
|------|--------|--------|
| **Repository** | ✅ Stable | S4-001 committed; pending deploy |
| **Production** | ✅ Stable | `immifin.com` on v0.3.0 until v0.4.0 deploy |
| **Build** | ✅ Passing | `npm run build` — middleware 90 kB |
| **Engineering process** | ✅ Mature | Workflow v2.0, playbook v2.1, release checklist, dev tunnel docs |
| **Documentation** | ✅ Current | S4-001 closeout documented |
| **Sprint 4** | 🟢 Active | S4-001 complete; Dashboard architecture next |

### Sprint 4 key commits (reference)

| Commit | Description |
|--------|-------------|
| S4-001 | App-wide authentication gate; Login Required UX; return URL sign-in |

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
| Dev tunnel script | `scripts/dev-start.ps1` |

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

### Sprint 4 first action

1. Read documents 1–5 above
2. Schedule **Sprint 4.1 — Dashboard Architecture** review
3. Propose dashboard ADR and wireframe before any `/dashboard` code

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
