# IMMIFIN Admin Dashboard

| Field | Value |
|-------|-------|
| **Last updated** | 2026-09-17 |
| **Working route** | `/admin` (legacy; still available) |
| **DS2 Data Refresh Center** | `/admin/data-refresh` — same shared `AdminDataRefreshCenter` as `/admin` |
| **User Feedback Review** | `/admin/feedback` — live moderation (Public Review, Private Review, Feedback Pool) |
| **DS2 Notifications** | `/admin/notifications` — DS2 Notification Control Center |
| **DS2 mock route** | `/admin/overview` (S7A-DS2-ADMIN-DASHBOARD-MOCK-001) |
| **Sprint** | Sprint 5 (MVP) through Sprint 7A (feedback + notifications console migration) |
| **Task** | S5-ADM-001 (MVP), S6-ADM-001 (operations), S7A-DS2-ADMIN-DASHBOARD-MOCK-001 (overview shell), S7A-DS2-ADMIN-FEEDBACK (review queue), S7A-ADMIN-NOTIFICATIONS-MIGRATE-025, S7A-ADMIN-NOTIFICATIONS-UX-REFINE-026, S7A-ADMIN-NEW-BULLETIN-FLOW-027, S7A-ADMIN-OCTOBER-SIMULATION-028 |

---

## Purpose

Internal admin workspace for the solo founder / `profiles.role = admin` users. MVP focuses on **dataset freshness visibility**, refresh instructions, and **Data Refresh** force-sync for Visa Stamping + Visa Bulletin sheets.

Page chrome: top-right **Close** (returns home) — no “Back to Home” link.

---

## Access control

| Layer | Behavior |
|-------|----------|
| **Role** | Supabase `profiles.role = 'admin'` (not a subscription tier) |
| **Bootstrap** | Manual SQL — `set_profile_role()` after first Clerk signup ([auth/PHASE1.md](./auth/PHASE1.md)) |
| **Middleware** | Clerk sign-in required (`/admin` removed from public routes) |
| **Page** | `requireAdmin()` in `app/admin/page.tsx` — non-admin → redirect `/` |
| **Navigation** | **My Immifin → Admin Dashboard** (expandable) — visible only when `/api/account/me` returns `role: admin` (`useIsAdminRole`) |
| **API routes** | Existing `/api/admin/*` routes use `requireAdmin()` |

---

## MVP features (shipped)

### Data Refresh Center

| File | Role |
|------|------|
| `app/admin/page.tsx` | Legacy admin dashboard UI |
| `app/admin/[section]/page.tsx` | DS2 Admin Dashboard submenu router (`/admin/data-refresh`) |
| `components/admin/AdminDataRefreshCenter.tsx` | Shared Data Refresh Center presentation |
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

### Notifications (DS2 Admin Console)

`/admin/notifications` is the operational monthly notification workspace. Campaign state is data-driven from the current Visa Bulletin and the existing summary API — no month is hardcoded. Campaign details stay visible. For an unsent bulletin the administrator works on this page: **Review Audience → Generate Update → Preview → Confirm & Send**. Generate/preview reuse `POST /api/admin/notifications/send-monthly-immigration-update` (`action: preview`). Step 3 shows **Preview Summary** plus **Actual Email Preview** — the production Monthly Immigration Update mapper and template, rendered read-only (sandboxed iframe). Preview does not send email, write campaigns, or write audit logs. Confirm & Send reuses `AdminMonthlyUpdateConfirmModal` and `POST /api/admin/notifications/monthly-immigration-updates/send`. After a successful send, or when the current bulletin is already sent, the UI shows the completed state and does not offer a duplicate bulk send. There is no second Control Center and no navigation to legacy `/admin` for this workflow. Production deployed and verified. Release commit `2e229f215c25c86104578768662d5f4f3788e58d`.

| File | Role |
|------|------|
| `app/admin/[section]/page.tsx` | DS2 Admin Dashboard submenu router (`/admin/notifications`) |
| `components/admin/AdminDashboardNotificationsPane.tsx` | Approved DS2 page chrome |
| `components/admin/AdminNotifyUserGroup.tsx` | DS2 bulk workflow using existing summary/preview/send APIs |
| `components/admin/AdminNotifyIndividualUser.tsx` | DS2 individual lookup/preview/send using existing single-user API |
| `components/admin/AdminMonthlyUpdateControlCenter.tsx` | Legacy `/admin` Control Center (unchanged) |
| `components/admin/AdminSendMonthlyImmigrationUpdateForm.tsx` | Legacy `/admin` single-user form (unchanged) |

Development-only `AdminNotificationTestForm` and `AdminMonthlyImmigrationReportPreview` are **not** exposed on this route. Legacy `/admin` remains temporarily available.

**Production follow-up (not in this task):** `/admin/notifications` “Bulletin Refreshed” still uses the latest `admin_audit_log` row with `action = force_sync_visa_bulletin` when present. That is a global last-manual-refresh timestamp, not a publication/refresh time associated with the current bulletin month. Do not change Data Refresh architecture or scheduled-sync behavior until a separate task after the Notifications workflow is validated.

### Future Maintenance (placeholder list)

Planned on-page — not implemented in MVP:

- Email reminder notifications
- DOL wage import button
- Lottery assumptions editor
- Visa Bulletin refresh logs

**Daily scheduled Google Sheet refresh** is implemented on `release/s7a-go-live` (custom Worker, 12:01 AM America/Chicago, DST-safe 05:01/06:01 UTC crons, secret-protected `/api/internal/daily-sheet-sync`). It is **not Production-live** until the next deploy. See [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md).

---

## Admin subscription testing

Admins can switch **Free / Pro / Power** without Stripe even when `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE` is unset:

| File | Role |
|------|------|
| `lib/subscription/devSubscriptionAccess.ts` | `canUseDevSubscriptionTools(userId)` — dedicated local test user only |
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
| [SPRINT_5_SIGNOFF.md](./SPRINT_5_SIGNOFF.md) | Sprint 5 complete |
| [SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md) | Sprint 5 admin MVP deliverable |
| [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) | Force sync + archive + Resend email specification |
| [auth/PHASE1.md](./auth/PHASE1.md) | Admin role bootstrap |
| [CALCULATORS.md](./CALCULATORS.md) | Calculator datasets monitored in refresh center |
