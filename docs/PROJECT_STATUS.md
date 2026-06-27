# Immifin — Project Status

**Last updated:** 2026-06-27  
**Version target:** v0.2.0-alpha.1

---

## Current phase

**Phase 1 — Authentication & User Management**

Building the identity and profile foundation: Clerk for auth, Supabase for application data, webhook sync, and admin-ready profile lifecycle.

---

## Current sprint

**Sprint 2 — Portal Authorization**

---

## Completed

- Clerk sign-up fields configured (first name, last name, email, password required; profile image optional)
- Supabase profile migration (`first_name`, `last_name` columns on `profiles`)
- `normalizeClerkUser` validation / normalization layer (`lib/clerk/normalizeUser.ts`)
- TypeScript wiring from webhook → `profileSync` → `upsertProfileFromClerk` RPC parameters
- `upsert_profile_from_clerk` SQL function update (structured names + four-case lifecycle)
- **Clerk / Supabase synchronization — completed**
- **Webhook verification:**
  - `user.created`
  - `user.updated`
  - `user.deleted`
  - Restore flow (deleted profile re-signup with same email)

---

## Next — Sprint 2 — Portal Authorization

- `/account` page
- `/admin` page
- `requireUser` / `requireAdmin` verification
- Bootstrap first admin

---

## Stack (reference)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 App Router |
| Auth | Clerk |
| Database | Supabase (Postgres) |
| Hosting | Cloudflare Pages |

---

## Related docs

- [Sprint backlog](./SPRINT_BACKLOG.md)
- [Phase 1 auth foundation](./auth/PHASE1.md)
- [Milestone 1 Step 1 — Clerk sign-up](./auth/MILESTONE1_STEP1.md)
- [Product roadmap](./PRODUCT_ROADMAP.md)
- [Technical decisions](./TECHNICAL_DECISIONS.md)
