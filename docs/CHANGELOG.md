# Changelog

All notable changes to the Immifin platform are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates use ISO 8601.

---

## [Unreleased]

### Added

- **Development Workflow v2.0** documented in `ENGINEERING_PLAYBOOK.md`, `PROJECT_DECISIONS.md`, `PROJECT_STATUS.md`, and `CHANGELOG.md`
  - Feature branches required for new work; no feature development directly on `main`
  - Inspect before coding; explain architecture before implementation
  - Localhost test + user approval before merge
  - `npm run build` gate before merge/push
  - Separate infrastructure and feature work; keep repo clean at session end

### Planned

- Visa Bulletin Dashboard — Dates for Filing (see v0.2.0 known issue)
- `/account` and `/admin` portal pages

---

## Version 0.2.0 — Infrastructure Stabilization Release

**Date:** 2026-06-27  
**Milestone:** Infrastructure Stabilization Release  
**Production commit:** `123bbdb`

### Summary

First stable production baseline on Cloudflare Workers with OpenNext, completed authentication header UX, and full engineering documentation.

### Added

- OpenNext migration (`open-next.config.ts`, `wrangler.jsonc`)
- Cloudflare deployment stabilized (`npm run deploy` / `echo done`)
- GitHub deployment pipeline completed
- Authentication completed (Clerk login, signup, webhook sync)
- Header personalization completed (avatar, time-based greeting)
- Engineering documentation completed (`DEPLOYMENT.md`, `CHANGELOG.md`, playbook updates)

### Known Issue

**Visa Bulletin Dashboard** still supports only **Final Action Dates**. Movement Tracker already supports both Final Action Dates and Dates for Filing.

### Next Sprint

Implement **Dates for Filing** on the Visa Bulletin Dashboard using the same architecture as **Visa Bulletin Movement Tracker** (small Client Component + API route + SWR).

---

## 2026-06-27 (detailed)

### Added

- **Cloudflare OpenNext deployment configuration** (`123bbdb`)
  - `open-next.config.ts`
  - `wrangler.jsonc`
  - `npm run deploy` and `npm run preview` scripts
  - `@opennextjs/cloudflare` and `wrangler` dev dependencies
  - `.open-next/` and `.wrangler/` gitignore entries
- **Header authentication UI (Sprint 2)**
  - Signed-out Login / Sign Up links
  - Signed-in Clerk UserButton with rounded-square avatar
  - Time-based personalized greeting (`Good Morning/Afternoon/Evening` + first name)
- **Engineering documentation**
  - `docs/SYSTEM_ARCHITECTURE.md`, `docs/ENGINEERING_PLAYBOOK.md`, `docs/VISION.md`, `docs/CTO_LOG.md`

### Changed

- Production hosting migrated from ad-hoc Cloudflare Pages builds to **OpenNext + Cloudflare Workers**
- Cloudflare production build command set to `npm run deploy` (deploy command: `echo done`)

### Fixed

- Production deployment pipeline restored after OpenNext configuration
- Header auth on production verified (Clerk login, signup, avatar, greeting)

### Known issues

- **Visa Bulletin Dashboard** displays Final Action Dates only. Movement Tracker already supports both Final Action Dates and Dates for Filing; dashboard must be enhanced to match.

### Lessons learned

- Do not convert large Server Components into Client Components for small UI interactions.
- Avoid mixing server data-fetching and client UI in the same module (e.g. `lib/visaBulletinData.ts`).
- Prefer small Client Components or patterns already proven in the app (Movement Tracker architecture).

---

## 2026-06-25 — Sprint 1

### Added

- Clerk authentication foundation (signup, login, middleware)
- Supabase profile sync via Clerk webhooks (`user.created`, `user.updated`, `user.deleted`)
- Supabase migrations: profiles, immigration_profiles, subscriptions, admin_audit_log
- Cloudflare Tunnel dev access at `dev.immifin.com`

---

## Earlier

- Visa Bulletin Dashboard, Movement Tracker, History charts
- Green Card Wait Time and Citizenship Eligibility calculators
- Next.js 15 App Router site structure
