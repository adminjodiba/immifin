# Immifin — Project Status

**Last updated:** 2026-06-30  
**Version:** v0.2.0 — Infrastructure Stabilization Release (2026-06-27)  
**Latest production commit:** `c86f187` — *Remove duplicate account menu item*  
**Development workflow:** v2.0 (see [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md))

---

## Overall status

| Area | Status |
|------|--------|
| **Infrastructure** | ✅ COMPLETE |
| **Authentication** | ✅ COMPLETE |
| **Deployment** | ✅ COMPLETE |
| **Visa Bulletin Dashboard** | 🔄 IN PROGRESS |
| **Future work** | Continue feature development on feature branches (Workflow v2.0) |

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

## Development Workflow v2.0 (2026-06-30)

Official process for all new feature work. Full detail: [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) §8. Decision log: [PROJECT_DECISIONS.md](./PROJECT_DECISIONS.md) Decision 007.

| Step | Requirement |
|------|-------------|
| Branch | Create `feature/<description>` from `main` — do not develop features on `main` |
| Before code | Inspect relevant files; explain architecture and get approval |
| Implement | Code on the feature branch only |
| Verify | Test on `http://localhost:3000` |
| Approve | User approval after localhost verification |
| Build | `npm run build` must pass before merge/push |
| Scope | Never combine infrastructure and feature work in one branch when avoidable |
| Session end | Keep repository clean (no unintended uncommitted state) |
| Docs | Update docs when architecture or workflow changes |
| Release | Merge to `main` after gates → auto-deploy → verify production |

---

## Deployment workflow

1. Create a **feature branch** from `main`
2. Inspect code/docs and agree on architecture
3. Develop locally (`npm run dev`)
4. Test localhost
5. Obtain **user approval** after localhost verification
6. Run **`npm run build`** (must pass)
7. Update applicable documentation
8. `git add` → `git commit` on feature branch
9. Merge to `main` → `git push`
10. Cloudflare automatically deploys from `main`
11. Verify production

Optional: test `dev.immifin.com` before merge when tunnel is available.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for build commands and secrets.

---

## Related docs

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
- [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [Sprint backlog](./SPRINT_BACKLOG.md)
- [Phase 1 auth foundation](./auth/PHASE1.md)
