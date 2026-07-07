# IMMIFIN Sprint 6 Handoff — AI & Personalization + Admin Operations

| Field | Value |
|-------|-------|
| **Sprint** | Sprint 6 |
| **Theme** | AI & Personalization |
| **Version range** | v0.5.0 → v0.6.0 (target) |
| **Handoff Date** | 2026-07-06 |
| **Status** | Planned — starts after Sprint 5 closeout |
| **Previous release** | v0.5.0 (Sprint 5 — Design System 2.0, target) |

> **This document is the first thing a new AI assistant or engineer must read when Sprint 6 begins.**

---

## 1. Read This First

Sprint 6 is primarily the **AI & Personalization** sprint (Power-tier intelligence, AI assistant architecture). It also includes one **operational deliverable parked from Sprint 5 planning**: an **Admin Operations page** for visa bulletin data management.

Do **not** automate visa bulletin history archiving. Archive remains a **manual admin action** triggered only when an admin decides the month is ready.

---

## 2. Parked from Sprint 5 — Admin Visa Bulletin Operations

**Task ID:** S6-ADM-001  
**Priority:** High — operational prerequisite for timely bulletin updates  
**Parked:** 2026-07-06 (agreed during Sprint 5 planning)

### Problem

**Update (2026-07-07):** Sprint 5 shipped an **Admin Dashboard MVP** at `/admin` (Data Refresh Center, dataset status, refresh instructions). **Force Sync** and **manual archive UI** remain Sprint 6 scope.

Visa bulletin data is read from **published Google Sheet CSV URLs** with a **24-hour Next.js cache**:

| Cache layer | Location | TTL |
|-------------|----------|-----|
| Fetch cache | `lib/visaBulletinSheets.ts` — `fetch(..., { next: { revalidate: 86400 } })` | 24 hours |
| History cache | `lib/visaBulletinHistory.ts` — `unstable_cache(..., { revalidate: 86400 })` | 24 hours |

When USCIS publishes a new visa bulletin and the Google Sheet is updated, users may see **stale data for up to 24 hours** unless an admin force-syncs.

### Deliverable — Admin Operations page

Build **`/admin`** (admin-only UI) with a **Visa Bulletin Operations** section.

| Feature | Description |
|---------|-------------|
| **Force Sync** | Re-fetch all bulletin sheets bypassing cache; invalidate history cache; show row counts, latest month, sync timestamp; write `admin_audit_log` |
| **Archive month (manual UI)** | Expose existing `GET /api/admin/archive-visa-bulletin?month=YYYY-MM` in the admin UI — **admin-triggered only** |
| **Status panel** | Last sync time, row counts per sheet, latest bulletin month |

### Explicit constraint — manual archive only

> **History archive must remain manual.** There is no cron, scheduled job, or automatic archive on sync. The admin workflow is:
>
> 1. Update Google Sheet with new USCIS bulletin data (manual, outside app)
> 2. **Force Sync** — pull fresh data into the app immediately
> 3. **Archive month** — when ready, admin manually archives `YYYY-MM` to `VisaBulletinHistory` via the admin UI
>
> Do **not** add automatic archiving as part of force sync or any background process.

### Existing backend (reuse — do not rewrite)

| Asset | Purpose |
|-------|---------|
| `requireAdmin()` | Clerk session + `profiles.role === 'admin'` |
| `GET /api/admin/archive-visa-bulletin?month=YYYY-MM` | Append current month to history sheet (Google Sheets API write) |
| `GET /api/admin/debug-history` | Debug stats on history data |
| `loadAllVisaBulletinSheets()` | Load all four current/previous tabs |
| `middleware.ts` | Already protects `/admin` and `/api/admin/*` |
| `admin_audit_log` | Audit trail for admin actions |

### Implementation sketch

| Piece | Approach |
|-------|----------|
| **Page** | `app/admin/page.tsx` — admin gate + DS 2.0 workspace shell |
| **API** | `POST /api/admin/sync-visa-bulletin` — no-store fetch + `revalidateTag('visa-bulletin')` |
| **Lib** | `forceLoadAllVisaBulletinSheets()` with `cache: 'no-store'`; add cache tags to history `unstable_cache` |
| **Nav** | “Admin” link in header/profile for `role === admin` only |
| **Audit** | `action: "force_sync_visa_bulletin"` and existing `archive_visa_bulletin` in `admin_audit_log` |

### Monthly admin workflow (reference)

```
USCIS publishes bulletin
        ↓
Admin updates Google Sheet (manual, external)
        ↓
Admin → Force Sync              ← users get fresh data ASAP
        ↓
Admin → Archive YYYY-MM         ← manual only, when admin confirms month is ready
```

### Acceptance criteria

- [ ] Only users with `profiles.role === 'admin'` can access `/admin` and admin sync API
- [ ] Force Sync bypasses 24-hour cache and returns fresh row counts + latest month
- [ ] Force Sync does **not** trigger archive automatically
- [ ] Archive month is a separate explicit admin action with confirmation
- [ ] All sync and archive actions logged to `admin_audit_log`
- [ ] Localhost verified before production deploy

---

## 3. Sprint 6 Primary Theme — AI & Personalization

See [ROADMAP_v2.md](./ROADMAP_v2.md) and [PRODUCT_VISION.md](./PRODUCT_VISION.md).

| Focus | Description |
|-------|-------------|
| **AI Assistant architecture** | Power-tier grounded Q&A; architecture spike from Sprint 4.5 |
| **Power-tier intelligence** | Advanced personalization beyond Pro |
| **Saved calculations** | Phase 3 — user-saved calculator results (Sprint 6+) |

Detailed AI task breakdown (S6-AI-xxx) to be created at Sprint 6 kickoff.

---

## 4. Mandatory Reading Order

Before Sprint 6 implementation:

1. [ROADMAP_v2.md](./ROADMAP_v2.md)
2. [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md)
3. [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) — Power tier capabilities
4. [auth/PHASE1.md](./auth/PHASE1.md) — admin role and audit logging
5. [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) — ADR-002 Google Sheets as bulletin source
6. `lib/visaBulletinSheets.ts`, `lib/visaBulletinHistory.ts`, `lib/visaBulletinArchive.ts`

---

## 5. What Not To Do

- Do **not** automate visa bulletin history archiving (no cron, no sync-triggered archive).
- Do **not** store bulletin data in Supabase — source of truth remains Google Sheets (ADR-002).
- Do **not** expose admin routes without `requireAdmin()` server-side authorization.
- Do **not** modify billing/Stripe unless explicitly requested (Sprint 10).

---

## 6. Suggested Sprint 6 Order

1. **S6-ADM-001** — Admin Operations page + force sync (parked from Sprint 5)
2. **S6-AI-xxx** — AI assistant architecture and Power-tier personalization (detailed at kickoff)

---

## Revision History

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2026-07-06 | Initial Sprint 6 handoff — admin force sync parked from Sprint 5; manual archive constraint documented |
