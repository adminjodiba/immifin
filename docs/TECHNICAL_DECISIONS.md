# Immifin — Technical Decisions

Architecture and implementation conventions for the Immifin codebase. Update this document when making significant technical choices.

---

## Identity and data

### Clerk is the source of truth for identity

- Sign-up, login, sessions, and credentials live in Clerk.
- Immifin never stores passwords.
- Clerk user IDs (`clerk_user_id`) are the stable link between auth and application data.

### Supabase stores synchronized application profile data

- `profiles` holds app-owned fields: `role`, `plan`, `status`, names, avatar URL, activity timestamps.
- Webhooks and server-side helpers keep Supabase in sync with Clerk.
- Supabase is not a second auth system.

### Do not store passwords in Supabase

- Passwords and auth factors remain in Clerk only.
- Server code uses the Supabase service role for profile data, not end-user password handling.

---

## Profile lifecycle

### Use soft delete for deleted Clerk users

- `user.deleted` webhooks call `soft_delete_profile_by_clerk_id()`.
- Profiles are marked `status = 'deleted'`, not hard-deleted.
- Re-signup with the same email restores the existing row (preserves `id`, subscriptions, immigration data).

### Use RPC functions for profile sync

- `upsert_profile_from_clerk()` handles create, update, restore, and relink cases.
- Application code calls RPCs via `lib/supabase/profiles.ts`; avoid ad-hoc profile writes from webhooks.
- Business rules (email uniqueness, lifecycle branches) live in SQL, not scattered in TypeScript.

### Normalize before sync

- `normalizeClerkUser()` in `lib/clerk/normalizeUser.ts` validates and normalizes Clerk webhook payloads.
- `profileSync.ts` maps normalized data to RPC parameters only.

---

## Security and access

- **Middleware** protects `/admin`, `/api/admin`, `/account`, `/api/account`.
- **`requireUser()`** / **`requireAdmin()`** gate server routes; webhooks never promote `role` to `admin`.
- **RLS** enabled on Supabase tables; client policies deferred until account UI needs direct access.
- **Admin bootstrap** via SQL (`set_profile_role`) after first signup — not via webhooks.

---

## Development workflow

### Use Cursor for implementation

- Day-to-day coding, migrations, and refactors happen in the repo with Cursor.
- Follow existing patterns in `lib/`, `components/`, and `supabase/migrations/`.

### Use ChatGPT for architecture and review

- High-level design, milestone planning, and cross-cutting reviews.
- Decisions that affect multiple phases should be captured here or in `docs/PROJECT_STATUS.md`.

### Keep project state in `docs/PROJECT_STATUS.md`

- Current phase, sprint, completed work, and next steps live in that file.
- Update it when closing milestones or changing focus.
- This file (`TECHNICAL_DECISIONS.md`) records *why*; `PROJECT_STATUS.md` records *where we are*.

---

## Stack (locked for Phase 1)

| Concern | Choice |
|---------|--------|
| Framework | Next.js App Router |
| Auth | Clerk (`@clerk/nextjs`) |
| Database | Supabase Postgres |
| Deploy | Cloudflare Pages |
| Public data fetching | SWR (24h cache for visa bulletin APIs) |

---

## Related docs

- [Project status](./PROJECT_STATUS.md)
- [Product roadmap](./PRODUCT_ROADMAP.md)
- [Phase 1 auth foundation](./auth/PHASE1.md)
