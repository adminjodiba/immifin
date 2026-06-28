# Immifin — Sprint Backlog

**Last updated:** 2026-06-27

---

## High Priority

### Visa Bulletin Dashboard

- [ ] Final Action Dates / Dates for Filing toggle
- [ ] Match Movement Tracker UI
- [ ] Support both APIs (`final-action` and `filing`)
- [ ] Production verification

**Architecture:** Use Movement Tracker as reference — small Client Component for toggle; Server Component parent; SWR + API route for data. Do not convert `VisaBulletinDashboard.tsx` to a Client Component.

---

## Medium Priority

- [ ] User Profile Page
- [ ] Account Settings
- [ ] Saved Priority Dates
- [ ] User Dashboard

*(Includes Sprint 2 portal work: `/account`, `/admin`, `requireUser` / `requireAdmin`, bootstrap first admin.)*

---

## Low Priority

- [ ] Immigration calculators
- [ ] Finance calculators
- [ ] UI improvements
- [ ] Performance improvements

---

## Completed Sprints

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

- [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [CHANGELOG.md](./CHANGELOG.md)
