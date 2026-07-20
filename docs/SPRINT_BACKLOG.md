# Immifin — Sprint Backlog

**Last updated:** 2026-07-01

---

## High Priority

### Dashboard (Sprint 4 primary)

- [ ] Dashboard architecture review (Sprint 4.1)
- [ ] Dashboard UI shell (Sprint 4.2)
- [ ] Dashboard widgets (Sprint 4.3)

### Visa Bulletin Dashboard

- [ ] Final Action Dates / Dates for Filing toggle
- [ ] Match Movement Tracker UI
- [ ] Support both APIs (`final-action` and `filing`)
- [ ] Production verification

**Architecture:** Use Movement Tracker as reference — small Client Component for toggle; Server Component parent; SWR + API route for data. Do not convert `VisaBulletinDashboard.tsx` to a Client Component.

---

## Medium Priority

- [ ] Saved Priority Dates
- [ ] Notification engine (delivery)
- [ ] User Dashboard integration

---

## Low Priority

- [ ] Finance calculators expansion
- [ ] UI improvements
- [ ] Performance improvements

---

## Sprint 4 — Completed Tasks

### S4-001 — Authentication Gate for Entire Application

**Status:** ✅ Completed (2026-07-01)

- [x] Middleware public-route allowlist — only `/` landing public (+ Clerk auth, webhooks, sitemap/robots)
- [x] Clerk `auth.protect()` on all application routes and APIs (except webhooks)
- [x] `ProtectedLink` — Login Required UX for signed-out feature clicks (evolved in Sprint 7 to Home-background login modal; see [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md))
- [x] Sign-in return path preserved after authentication (modal `forceRedirectUrl` / legacy `/login?redirect_url=`)
- [x] Preserved contact onboarding (`ContactOnboardingGuard`) and admin API authorization
- [x] Localhost verified; build passing

---

## Completed Sprints

### Sprint 3 — Profile, Onboarding & Infrastructure

**Status:** ✅ Completed (2026-07-01)

- [x] Contact and notification profile sections
- [x] Phone number onboarding flow
- [x] Application-layer contact onboarding guard
- [x] Cloudflare Worker 1102 middleware hotfix
- [x] Developer setup and engineering documentation

### Sprint 1 — Clerk / Supabase User Sync

**Status:** ✅ Completed (2026-06-27)

- [x] Clerk sign-up fields (first name, last name required)
- [x] Supabase `first_name` / `last_name` migration
- [x] `normalizeClerkUser` layer
- [x] TypeScript wiring to RPC
- [x] `upsert_profile_from_clerk` SQL update
- [x] `user.created` / `user.updated` / `user.deleted`
- [x] Restore flow

### Infrastructure Stabilization — v0.2.0 (2026-06-27)

**Status:** ✅ Completed

- [x] OpenNext + Cloudflare Workers migration
- [x] GitHub auto deployment pipeline
- [x] Header auth UI (login, signup, avatar, greeting)
- [x] Production verification at immifin.com
- [x] Engineering documentation

---

## Related docs

- [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [CHANGELOG.md](./CHANGELOG.md)
