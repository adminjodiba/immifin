# IMMIFIN Admin Dashboard

| Field | Value |
|-------|-------|
| **Last updated** | 2026-07-09 |
| **Route** | `/admin` |
| **Sprint** | Sprint 5 (MVP) — Visa Bulletin force sync parked for Sprint 6 |
| **Task** | S5-ADM-001 (MVP), S6-ADM-001 (operations) |

---

## Purpose

Internal admin workspace for the solo founder / `profiles.role = admin` users. MVP focuses on **dataset freshness visibility** and refresh instructions — not one-click imports yet.

---

## Access control

| Layer | Behavior |
|-------|----------|
| **Role** | Supabase `profiles.role = 'admin'` (not a subscription tier) |
| **Bootstrap** | Manual SQL — `set_profile_role()` after first Clerk signup ([auth/PHASE1.md](./auth/PHASE1.md)) |
| **Middleware** | Clerk sign-in required (`/admin` removed from public routes) |
| **Page** | `requireAdmin()` in `app/admin/page.tsx` — non-admin → redirect `/` |
| **Navigation** | **My Immifin → Admin** — visible only when `/api/account/me` returns `role: admin` (`useIsAdminRole`) |
| **API routes** | Existing `/api/admin/*` routes use `requireAdmin()` |

---

## MVP features (shipped)

### Data Refresh Center

| File | Role |
|------|------|
| `app/admin/page.tsx` | Admin dashboard UI |
| `lib/data/dataFreshness.ts` | Dataset catalog, status logic, refresh hints |

Tracked datasets:

1. Occupation (SOC/O*NET)
2. DOL prevailing wage
3. H-1B lottery odds assumptions
4. Visa stamping wait times — monthly State Department refresh steps + **Data Refresh** button (`/api/admin/refresh-visa-stamping`)
5. Visa Bulletin — monthly sheet update steps + **Data Refresh** button (`/api/admin/refresh-visa-bulletin`)

Each card shows version, last updated, next recommended refresh, urgency, **How to refresh** summary, and collapsible step list.

**Visa stamping wait times** and **Visa Bulletin** include an on-card **Data Refresh** button that force-refreshes the Google Sheets cache after the sheet tabs are updated. Archive month remains a separate admin action and is **not** triggered by Data Refresh.

Status bands: **Current**, **Due soon** (≤30 days), **Overdue**.

### Future Maintenance (placeholder list)

Planned on-page — not implemented in MVP:

- Email reminder notifications
- DOL wage import button
- Lottery assumptions editor
- Cloudflare cron refresh
- Visa Bulletin refresh logs

---

## Admin subscription testing

Admins can switch **Free / Pro / Power** without Stripe even when `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE` is unset:

| File | Role |
|------|------|
| `lib/subscription/devSubscriptionAccess.ts` | `canUseDevSubscriptionTools(role)` |
| `lib/hooks/useCanUseDevSubscriptionTools.ts` | Client UI gate |
| `app/api/account/subscription/route.ts` | PATCH allowed for admin or dev mode |

**UI:** Manage Profile → Subscription, `/pricing`, `/account` Development Subscription panel.

Admins use **persisted Supabase plan** (not the floating DevTierSwitcher localStorage override).

---

## Parked for Sprint 6 (S6-ADM-001)

See [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md):

- **Force Sync** visa bulletin — **partially shipped** as Admin **Data Refresh** (`POST /api/admin/refresh-visa-bulletin`); richer status panel / archive UI still pending
- **Manual archive month** UI for history sheet
- `admin_audit_log` entries for sync/archive actions

---

## Related documentation

| Document | Role |
|----------|------|
| [SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md) | Sprint 5 admin MVP deliverable |
| [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) | Force sync + archive specification |
| [auth/PHASE1.md](./auth/PHASE1.md) | Admin role bootstrap |
| [CALCULATORS.md](./CALCULATORS.md) | Calculator datasets monitored in refresh center |
