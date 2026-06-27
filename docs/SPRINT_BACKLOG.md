# Immifin — Sprint Backlog

---

## Sprint 1 — Clerk / Supabase User Sync

**Status:** Completed

### Scope

Verify end-to-end Clerk webhook → Supabase profile sync, including structured names and account lifecycle.

### Checklist

- [x] Clerk sign-up fields (first name, last name required)
- [x] Supabase `first_name` / `last_name` migration
- [x] `normalizeClerkUser` layer
- [x] TypeScript wiring to RPC
- [x] `upsert_profile_from_clerk` SQL update
- [x] `user.created`
- [x] `user.updated`
- [x] `user.deleted`
- [x] Restore flow

### Sprint Result

**Status:** PASSED

**Completed:** June 27, 2026

Ready for Sprint 2.

---

## Sprint 2 — Portal Authorization

**Status:** Planned

### Scope

Account and admin portal surfaces with server-side authorization.

### Checklist

- [ ] `/account` page
- [ ] `/admin` page
- [ ] `requireUser` verification
- [ ] `requireAdmin` verification
- [ ] Bootstrap first admin
