# Immifin — Project Status

**Last updated:** 2026-06-27  
**Version:** v0.2.0 — Infrastructure Stabilization Release (2026-06-27)  
**Latest production commit:** `123bbdb` — *Add Cloudflare OpenNext deployment configuration*

---

## Overall status

| Area | Status |
|------|--------|
| **Infrastructure** | ✅ COMPLETE |
| **Authentication** | ✅ COMPLETE |
| **Deployment** | ✅ COMPLETE |
| **Visa Bulletin Dashboard** | 🔄 IN PROGRESS |
| **Future work** | Continue feature development only |

---

## Current phase

**Phase 1 — Authentication & User Management** — foundation complete; portal pages next.

---

## Current sprint

**Sprint 2 — Portal Authorization & Header UX**

---

## Completed (2026-06-27)

### Infrastructure & deployment

- Migrated to **OpenNext + Cloudflare Workers** deployment
- Added `open-next.config.ts`, `wrangler.jsonc`
- Project builds successfully with OpenNext (`npm run deploy`)
- Cloudflare production build command: `npm run deploy`
- Cloudflare production deploy command: `echo done` (deploy runs inside build script)
- GitHub → Cloudflare automatic deployment pipeline restored
- Production verified at **https://immifin.com**

### Authentication & header (production verified)

- Clerk login ✅
- Clerk signup ✅
- User avatar (UserButton) ✅
- Personalized greeting ✅
- Header auth UI (signed-in / signed-out states) ✅

### Sprint 1 (prior)

- Clerk / Supabase synchronization
- Webhook verification (`user.created`, `user.updated`, `user.deleted`, restore flow)
- Supabase profile migrations and RPC lifecycle

---

## Known issues

| Issue | Detail |
|-------|--------|
| **Visa Bulletin Dashboard** | Page displays **Final Action Dates only**. Movement Tracker already supports **Final Action Dates** and **Dates for Filing**. Dashboard must be enhanced to match. |

---

## Next sprint — Priority 1

### Visa Bulletin Dashboard

Implement Final Action Dates / Dates for Filing toggle **exactly matching Movement Tracker**.

**Architecture guidance (from lessons learned):**

- Do **not** convert `VisaBulletinDashboard.tsx` into a Client Component
- Use a **small Client Component** for the toggle (see Movement Tracker pattern)
- Do **not** import `lib/visaBulletinData.ts` from client components
- **Do not** modify deployment or authentication for this work

**Reference implementation:** `components/VisaBulletinMovementTracker.tsx` + `/api/visa-bulletin-movement`

---

## Next — Sprint 2 (continued)

- `/account` page
- `/admin` page
- `requireUser` / `requireAdmin` verification
- Bootstrap first admin

---

## Lessons learned (2026-06-27)

1. **Do not convert large Server Components into Client Components** — caused dev-server instability (webpack / RSC manifest errors on Windows) when the whole dashboard was marked `"use client"`.
2. **Do not mix server data-fetching and client UI in the same module** — `lib/visaBulletinData.ts` contains both `getVisaBulletinData()` (server fetch) and formatters; client imports pull server-only code into the client bundle.
3. **Prefer small Client Components** for interactivity, or follow **existing proven architecture** — Movement Tracker uses a client shell + SWR + API route; the dashboard page should follow a similar split.
4. **Clear `.next` and restart dev** after Server ↔ Client boundary changes on Windows.

---

## Stack (reference)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 App Router |
| Auth | Clerk |
| Database | Supabase (Postgres) |
| Hosting | Cloudflare Workers (OpenNext) |
| Local dev tunnel | Cloudflare Tunnel → `dev.immifin.com` |

---

## Deployment workflow

1. Develop locally (`npm run dev`)
2. Test localhost
3. Test `dev.immifin.com` (optional)
4. `git add` → `git commit` → `git push`
5. Cloudflare automatically deploys from `main`
6. Verify production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for build commands and secrets.

---

## Related docs

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
- [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [Sprint backlog](./SPRINT_BACKLOG.md)
- [Phase 1 auth foundation](./auth/PHASE1.md)
