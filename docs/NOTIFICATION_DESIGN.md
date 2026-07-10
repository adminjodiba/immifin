# Notification Design

| Field | Value |
|-------|-------|
| **Project** | IMMIFIN |
| **Version** | v0.5.x |
| **Sprint** | Sprint 6 |
| **Task ID** | S6-DOC-001 |
| **Task Name** | Notification Design Document |
| **Feature Area** | Documentation |
| **Status** | Approved design — implementation not started |
| **Last updated** | 2026-07-09 |
| **Owner** | Technical Architecture (CTO) |

**Related:** [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) · [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) · [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md) · [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)

> **This document is the single source of truth for all notification-related development.**  
> Notification implementation for Sprint 6 and later releases **must** follow the architecture and roadmap documented here.  
> Do **not** call Resend (or any provider) directly from feature routes or UI handlers.

---

## Purpose

IMMIFIN needs a **centralized Notification Platform**, not a collection of one-off email scripts.

Without a platform:

- Every feature invents its own send path, template, and audience rules
- Capability checks (`accessEmailAlerts`, `accessNotifications`) drift
- Preference UI (already in Manage Profile) never connects to delivery
- Admin cannot preview, approve, retry, or audit sends
- Switching providers (Resend → SMS / Push / In-App) requires rewriting product code

A Notification Platform turns **business events** into **durable, preference-aware, auditable deliveries** through a single engine and provider adapters.

Sprint 5 shipped **preference storage and UI only** — no delivery engine. Sprint 6 begins the platform; this document defines it before any production notification code lands.

---

## Goals

### Long-term vision

IMMIFIN notifications should feel like a **Life Operating System for Immigrants**: timely, personalized, trustworthy, and tier-aware.

| Horizon | Capability |
|---------|------------|
| **Near term (Sprint 6)** | Resend email provider; lifecycle emails; flagship **Monthly Immigration Report**; admin-triggered send; history logging |
| **Mid term** | Admin Notification Center; user preference enforcement; operational alerts; campaign management |
| **Long term** | SMS, Push, In-App channels; AI-generated report sections; forecast / priority-date alerts; open/click analytics |

### Concrete goals

| Goal | Description |
|------|-------------|
| **Welcome & lifecycle** | Welcome to Pro / Power; upgrade / downgrade; account deletion confirmation |
| **Monthly immigration reports** | Personalized monthly report grounded in the user’s immigration profile — **not** a generic Visa Bulletin blast |
| **Subscription lifecycle** | Plan changes and (future) billing events |
| **Admin operational alerts** | Bulletin updated but unsent; DOS publication reminders; system failures |
| **Future SMS** | Preference-gated text alerts (schema already anticipates `smsAlerts`) |
| **Future Push** | Mobile / browser push for time-sensitive immigration events |
| **Future In-App** | Notification Center in My Immifin (Sprint 4.4 concept) |

### Business model alignment

| Capability | Free | Pro | Power |
|------------|------|-----|-------|
| `accessEmailAlerts` | ❌ | ✅ | ✅ |
| `accessNotifications` | ❌ | ✅ | ✅ |

Source of truth: [BUSINESS_MODEL.md](./BUSINESS_MODEL.md). Preference fields already exist in `lib/account/notificationPreferences.ts` (UI only today).

---

## Architecture Overview

```
Business Event
      ↓
Notification Engine
      ↓
Notification Provider Adapter
      ↓
Email (Resend)          ← Sprint 6 primary channel
      ↓
Future Providers
  - SMS
  - Push
  - In-App
```

### Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Business Event** | Domain signal only — e.g. `plan.upgraded`, `bulletin.refreshed`, `admin.report.approved`. No provider SDKs. |
| **Notification Engine** | Resolve audience, enforce capabilities + preferences, select template, render payload, create history row, dispatch to adapter(s). |
| **Provider Adapter** | Thin transport — Resend today; SMS/Push/In-App later. Same interface: `send(message) → result`. |
| **Email (Resend)** | Agreed Sprint 6 provider ([SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) §7). |
| **Future Providers** | Pluggable adapters; engine unchanged. |

### Why application code must never call Resend directly

1. **Capability & preference enforcement** lives in one place — not duplicated per feature.
2. **History / audit** is automatic — every send is logged.
3. **Provider portability** — Resend can be replaced without touching product routes.
4. **Admin control** — preview / approve / retry require an engine, not ad-hoc `fetch` to Resend.
5. **Worker safety** — bulk sends must be queued/batched; direct calls from request handlers risk Cloudflare CPU/timeouts.

**Rule:** Feature code emits a **business event** (or calls `notificationService.dispatch(...)`). Only the Notification Engine talks to Resend.

---

## 1. User Lifecycle Notifications

Subscription and account lifecycle messages. Audience is the affected user (and optionally admin for failures).

### 1.1 Welcome to Pro

| Field | Detail |
|-------|--------|
| **Purpose** | Confirm Pro activation; orient user to Pro capabilities (dashboard, history, alerts, auto-fill calculators). |
| **Trigger** | Plan becomes `pro` (dev subscription switch today; Stripe webhook later). |
| **Audience** | User who upgraded / was set to Pro. |
| **Template** | `welcome-pro` |
| **Future improvements** | Deep links to Manage Profile, Favorites, Visa Bulletin History. |
| **Implementation Status** | ⬜ Not Started |

### 1.2 Welcome to Power

| Field | Detail |
|-------|--------|
| **Purpose** | Confirm Power activation; introduce AI / advanced intelligence surfaces as they ship. |
| **Trigger** | Plan becomes `power`. |
| **Audience** | User set to Power. |
| **Template** | `welcome-power` |
| **Future improvements** | AI assistant onboarding checklist. |
| **Implementation Status** | ⬜ Not Started |

### 1.3 Upgrade Pro → Power

| Field | Detail |
|-------|--------|
| **Purpose** | Acknowledge upgrade; highlight net-new Power capabilities. |
| **Trigger** | Plan transition `pro` → `power`. |
| **Audience** | Upgrading user. |
| **Template** | `upgrade-pro-to-power` |
| **Future improvements** | Diff of unlocked capabilities from `lib/subscription/capabilities.ts`. |
| **Implementation Status** | ⬜ Not Started |

### 1.4 Downgrade to Free

| Field | Detail |
|-------|--------|
| **Purpose** | Confirm downgrade; clarify that **profile data is retained** (access gated only — see `lib/subscription/dataRetention.ts`). |
| **Trigger** | Plan becomes `free`. |
| **Audience** | Downgraded user. |
| **Template** | `downgrade-to-free` |
| **Future improvements** | Re-upgrade CTA; list of features now locked. |
| **Implementation Status** | ⬜ Not Started |

### 1.5 Account Deletion Confirmation

| Field | Detail |
|-------|--------|
| **Purpose** | Confirm account deletion request / completion for trust and compliance. |
| **Trigger** | Account deletion workflow (Clerk + Supabase cleanup — when implemented). |
| **Audience** | Deleted / deleting user email. |
| **Template** | `account-deleted` |
| **Future improvements** | Retention window, export link before delete. |
| **Implementation Status** | ⬜ Not Started |

### 1.6 Future — Password Reset

| Field | Detail |
|-------|--------|
| **Purpose** | Secure password reset (likely Clerk-owned; IMMIFIN may only mirror / brand). |
| **Trigger** | Password reset request. |
| **Audience** | Requesting user. |
| **Template** | `password-reset` (or Clerk template) |
| **Future improvements** | Brand-aligned Clerk emails. |
| **Implementation Status** | ⬜ Not Started (deferred — prefer Clerk native) |

### 1.7 Future — Email Verification

| Field | Detail |
|-------|--------|
| **Purpose** | Verify email ownership. |
| **Trigger** | Signup / email change. |
| **Audience** | Unverified address. |
| **Template** | `email-verification` (or Clerk) |
| **Implementation Status** | ⬜ Not Started (deferred — prefer Clerk native) |

### 1.8 Future — Billing Notifications

| Field | Detail |
|-------|--------|
| **Purpose** | Payment succeeded / failed / trial ending / invoice. |
| **Trigger** | Stripe webhooks (Sprint 10+). |
| **Audience** | Billing contact. |
| **Template** | `billing-*` family |
| **Implementation Status** | ⬜ Not Started (blocked on Stripe) |

---

## 2. Monthly Immigration Report

**Flagship notification feature for Sprint 6+.**

This is **not** a generic “Visa Bulletin updated” email. It is a **personalized monthly immigration report** assembled from the user’s immigration profile, current bulletin data, and (later) AI recommendations.

### Purpose

Give Pro/Power users a monthly, trustworthy snapshot of **their** immigration journey — priority date context, category/country bulletin status, movement, and actionable next steps.

### Trigger (recommended)

| Mode | Behavior |
|------|----------|
| **Primary (Sprint 6)** | Admin-confirmed: after bulletin sheet refresh + archive readiness, admin **Generate → Preview → Approve → Send** |
| **Later** | Scheduled monthly job (only after Admin Center + history + preferences are solid) |

Do **not** auto-blast on Force Sync. Aligns with manual archive discipline in [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md).

### Audience

- Users with Pro or Power (`accessEmailAlerts`)
- `notificationPreferences.emailAlerts === true`
- Prefer `visaBulletinUpdates === true` for bulletin-derived sections
- Valid email on profile / Clerk

### Expected report sections

| Section | Content |
|---------|---------|
| **Immigration Journey** | Current stage summary from profile (category, country of chargeability, filing path) |
| **Priority Date** | User priority date + whether current / not current vs bulletin |
| **Current Visa Bulletin** | Relevant Final Action / Dates for Filing for user’s category & country |
| **Movement Summary** | Month-over-month movement for user’s track (reuse Movement Tracker concepts) |
| **Dashboard Snapshot** | Compact My Immifin-style status (employment / GC path highlights when available) |
| **Charts** | Lightweight embedded or linked chart images / deep links to History & Movement pages |
| **Important Changes** | Callouts when bulletin moved, retrogressed, or became current for the user |
| **Recommendations (future AI)** | Power-tier grounded suggestions — Sprint 6+ AI theme |

### Template

`monthly-immigration-report`

### Channel

Email via Resend (HTML + plain-text fallback). Deep links into authenticated IMMIFIN pages.

### Future improvements

- Per-user chart images
- AI narrative (Power)
- Stamping wait-time section for users with travel intent
- SMS teaser with email deep link

### Implementation Status

⬜ Not Started

---

## 3. Admin Notifications

Operational messages for `profiles.role === 'admin'` (and optionally founder email list).

### 3.1 Visa Bulletin updated but notification not sent within 24 hours

| Field | Detail |
|-------|--------|
| **Purpose** | Prevent stale ops — sheet refreshed but Monthly Report / campaign not approved. |
| **Trigger** | Scheduler or admin dashboard check: bulletin `lastUpdated` newer than last successful report send by >24h. |
| **Audience** | Admins. |
| **Template** | `admin-bulletin-unsent-reminder` |
| **Implementation Status** | ⬜ Not Started |

### 3.2 Daily DOS publication reminder

| Field | Detail |
|-------|--------|
| **Purpose** | Remind admin of State Department / USCIS publication cadence for stamping waits and bulletin months. |
| **Trigger** | Cron / scheduled reminder (optional; can start as Admin Dashboard card only). |
| **Audience** | Admins. |
| **Template** | `admin-dos-publication-reminder` |
| **Implementation Status** | ⬜ Not Started |

### 3.3 System failures

| Field | Detail |
|-------|--------|
| **Purpose** | Alert on sheet fetch failures, Resend API errors, Worker 5xx spikes, archive failures. |
| **Trigger** | Error thresholds / failed notification history rows. |
| **Audience** | Admins. |
| **Template** | `admin-system-alert` |
| **Implementation Status** | ⬜ Not Started |

### 3.4 Future operational alerts

| Examples | Status |
|----------|--------|
| Stamping sheet overdue vs Data Freshness catalog | ⬜ Not Started |
| Lottery assumptions / wage data stale | ⬜ Not Started |
| High Resend bounce / complaint rate | ⬜ Not Started |

---

## 4. Notification Templates

All outbound content is template-driven. Templates are versioned identifiers; rendering may start as React Email / HTML strings and later move to a CMS.

| Template ID | Category | Description | Implementation Status |
|-------------|----------|-------------|------------------------|
| `welcome-pro` | Lifecycle | Welcome to Pro | ⬜ Not Started |
| `welcome-power` | Lifecycle | Welcome to Power | ⬜ Not Started |
| `upgrade-pro-to-power` | Lifecycle | Upgrade confirmation | ⬜ Not Started |
| `downgrade-to-free` | Lifecycle | Downgrade + data retention note | ⬜ Not Started |
| `account-deleted` | Lifecycle | Deletion confirmation | ⬜ Not Started |
| `monthly-immigration-report` | Report | Personalized monthly report | ⬜ Not Started |
| `admin-bulletin-unsent-reminder` | Admin | Unsent after bulletin update | ⬜ Not Started |
| `admin-dos-publication-reminder` | Admin | DOS / bulletin cadence reminder | ⬜ Not Started |
| `admin-system-alert` | Admin | System / provider failure | ⬜ Not Started |
| `campaign-generic` | Campaign | Maintenance / feature / holiday / legal | ⬜ Not Started |
| `password-reset` | Future | Prefer Clerk | ⬜ Not Started |
| `email-verification` | Future | Prefer Clerk | ⬜ Not Started |
| `billing-*` | Future | Stripe lifecycle | ⬜ Not Started |
| `marketing-campaign` | Future | Opt-in marketing | ⬜ Not Started |

### Template rules

- Always include unsubscribe / preference management link for marketing and optional alerts
- Never include secrets or full SSN / A-Number in email body
- Prefer deep links over large attachments
- Support plain-text fallback for deliverability

---

## 5. Campaign Management

Campaigns are **admin-defined broadcasts** distinct from per-user lifecycle events and the personalized Monthly Immigration Report.

| Campaign type | Example | Audience | Implementation Status |
|---------------|---------|----------|------------------------|
| Monthly Visa Bulletin notice | Short “bulletin is live — open your report” | Pro/Power with prefs | ⬜ Not Started |
| Maintenance notice | Planned downtime | All users or admins | ⬜ Not Started |
| Feature announcement | New calculator / map | Opt-in marketing or Pro+ | ⬜ Not Started |
| Holiday message | Seasonal greeting | Marketing opt-in | ⬜ Not Started |
| Legal update | Terms / privacy change | All users | ⬜ Not Started |

### Campaign engine (future)

- Draft → Preview → Schedule / Send Now → History
- Segment by plan, preference flags, country, category
- Rate limiting and batching for Worker safety

**Implementation Status:** ⬜ Not Started

---

## 6. Notification History

Every dispatch attempt must be logged (success or failure).

### Tracked fields

| Field | Description |
|-------|-------------|
| **Recipient** | User id + email (and later phone / device id) |
| **Notification Type** | Lifecycle / report / admin / campaign |
| **Template** | Template ID + version |
| **Provider** | `resend` / `sms` / `push` / `in_app` |
| **Status** | `queued` / `sent` / `failed` / `bounced` / `skipped` (prefs / capability) |
| **Sent Time** | ISO timestamp |
| **Failure Reason** | Provider error or skip reason |
| **Future Open Tracking** | Provider webhook |
| **Future Click Tracking** | Provider webhook / tagged links |

### Storage recommendation

- Supabase table e.g. `notification_history` (migration when Phase 7 starts)
- Admin-readable; user-readable subset later for In-App center
- Retain enough for support + compliance; redact PII in logs outside this table

### Implementation Status

⬜ Not Started

---

## 7. Administration

### Future Admin Notification Center

Extend `/admin` ([ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md)) with a **Notifications** section.

| Feature | Description | Implementation Status |
|---------|-------------|------------------------|
| **Generate Monthly Report** | Build personalized payloads for eligible users (dry-run counts) | ⬜ Not Started |
| **Preview** | Sample HTML for one user / segment | ⬜ Not Started |
| **Approve** | Explicit admin gate before send | ⬜ Not Started |
| **Send** | Dispatch via Notification Engine | ⬜ Not Started |
| **History** | Browse `notification_history` | ⬜ Not Started |
| **Failures** | Filter failed / bounced | ⬜ Not Started |
| **Retry Failed** | Re-queue selected rows | ⬜ Not Started |
| **Statistics** | Sent / failed / skipped / open rates (later) | ⬜ Not Started |

### Access

- `requireAdmin()` on all admin notification APIs
- Audit log entries in `admin_audit_log` for generate / approve / send / retry

### Implementation Status

⬜ Not Started

---

## 8. Notification Preferences

### Current state (shipped UI / storage)

`lib/account/notificationPreferences.ts` + Manage Profile Notifications tab:

| Preference | Default | Notes |
|------------|---------|-------|
| `emailAlerts` | `true` | Master email toggle |
| `smsAlerts` | `false` | Future SMS |
| `visaBulletinUpdates` | `true` | Bulletin-derived content |
| `priorityDateCurrent` | `true` | Priority-date current alerts |
| `citizenshipReminders` | `true` | Citizenship cadence |
| `marketing` | `false` | Campaigns / product news |

Also: `automatedAlertsOptIn` key for overall automated alerts opt-in.

### Future preference UX

| Preference (product language) | Maps to | Implementation Status |
|------------------------------|---------|------------------------|
| Enable Monthly Reports | `emailAlerts` + report-specific flag (add if needed) | ⬜ Not Started (enforcement) |
| Enable Visa Bulletin Alerts | `visaBulletinUpdates` | ⬜ Not Started (enforcement) |
| Enable Admin Messages | New flag or treat as transactional | ⬜ Not Started |
| Future Marketing Emails | `marketing` | ⬜ Not Started (enforcement) |

**Rule:** Engine must **skip** (and history-log `skipped`) when capability or preference denies delivery — never send and apologize later.

### Implementation Status

⬜ Preferences UI exists · ⬜ Engine enforcement Not Started

---

## 9. Technical Architecture

### Recommended modules (target layout)

| Module | Role |
|--------|------|
| **Notification Service** | `dispatch(event)` / `dispatchCampaign(...)` — orchestration entry |
| **Provider Adapter** | `ResendEmailProvider` implements `NotificationProvider` |
| **Template Renderer** | Maps template ID + context → subject + HTML + text |
| **Campaign Engine** | Segments, batching, approve/send workflow |
| **Notification History** | Persist attempts; query for admin |
| **Future Queue** | Cloudflare Queue / Durable Object / external queue for bulk |
| **Future Scheduler** | Cron triggers for reminders (not for auto-archive) |
| **Future AI Personalization** | Power-tier report narrative generator |

### Suggested event → template mapping (initial)

| Business Event | Template(s) |
|----------------|-------------|
| `subscription.plan_changed` | `welcome-pro` / `welcome-power` / `upgrade-pro-to-power` / `downgrade-to-free` |
| `account.deleted` | `account-deleted` |
| `admin.monthly_report.approved` | `monthly-immigration-report` (fan-out) |
| `admin.campaign.approved` | `campaign-generic` |
| `ops.bulletin_unsent` | `admin-bulletin-unsent-reminder` |
| `ops.system_failure` | `admin-system-alert` |

### Environment / secrets (when Phase 2 starts)

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API secret (Cloudflare runtime secret) |
| `RESEND_FROM_EMAIL` | Verified sender |
| `NOTIFICATION_ADMIN_EMAILS` | Optional admin alert recipients |

Do **not** commit secrets. Document in `.env.example` only as placeholders.

### Cloudflare / Worker notes

- Prefer **admin-triggered** or **queued** bulk sends over synchronous request fan-out
- Workers Paid CPU limit already raised (`limits.cpu_ms`) — still batch responsibly
- Never block public page SSR on email send

### Existing assets to reuse

| Asset | Use |
|-------|-----|
| `accessEmailAlerts` / `accessNotifications` | Gate |
| `notificationPreferences` | Preference enforcement |
| `requireAdmin()` / `admin_audit_log` | Admin Center |
| Visa bulletin + profile APIs | Monthly report data |
| `/admin` Data Refresh Center | Ops adjacency |

---

## 10. Future Enhancements

| Enhancement | Description | Status |
|-------------|-------------|--------|
| **SMS** | Twilio (or similar) adapter; `smsAlerts` preference | ⬜ Not Started |
| **Push Notifications** | Web Push / mobile | ⬜ Not Started |
| **In-App Notifications** | My Immifin Notification Center | ⬜ Not Started |
| **AI Generated Reports** | Power-tier narrative + recommendations | ⬜ Not Started |
| **Forecast Alerts** | Predicted bulletin movement | ⬜ Not Started |
| **Priority Date Prediction** | Alert when user likely becomes current | ⬜ Not Started |

---

## Implementation Roadmap

Update status boxes as each milestone completes during Sprint 6 and beyond.

### Phase 1 — Notification Architecture

Design and document the platform (this document). No production send path yet.

**Status:** ✅ Complete (S6-DOC-001 — 2026-07-09)

### Phase 2 — Resend Integration

Provider adapter, secrets, health/test send (admin-only), no user blasts.

**Status:** ⬜ Not Started

### Phase 3 — Notification Templates

Template IDs, renderer, Welcome / Admin / Report shells.

**Status:** ⬜ Not Started

### Phase 4 — User Lifecycle Emails

Plan change and account lifecycle dispatches through the engine.

**Status:** ⬜ Not Started

### Phase 5 — Monthly Immigration Report

Personalized report generation + admin approve/send.

**Status:** ⬜ Not Started

### Phase 6 — Admin Notification Center

Generate / Preview / Approve / Send / Retry UI on `/admin`.

**Status:** ⬜ Not Started

### Phase 7 — Notification History

Persistent history table + admin browse / failure views.

**Status:** ⬜ Not Started

### Phase 8 — Notification Preferences

Engine enforcement of existing preference schema + any new flags.

**Status:** ⬜ Not Started

### Phase 9 — Operational Alerts

Unsent bulletin reminder, DOS reminder, system failure alerts.

**Status:** ⬜ Not Started

### Phase 10 — Production Validation

End-to-end localhost + production smoke: lifecycle, report, history, prefs, admin audit.

**Status:** ⬜ Not Started

---

## What Not To Do

- Do **not** call Resend from calculators, bulletin pages, or Clerk webhooks directly.
- Do **not** auto-send Monthly Reports on Force Sync or archive.
- Do **not** auto-archive Visa Bulletin history as part of notification send.
- Do **not** email Free-tier users for Pro-gated alert content.
- Do **not** store bulletin source-of-truth in Supabase (ADR-002) — reports **read** Sheets-backed APIs / caches.
- Do **not** implement Stripe billing emails until billing ships.
- Do **not** skip history logging for “quick” test sends in production.

---

## Suggested Sprint 6 task mapping

| Phase | Suggested Task ID | Notes |
|-------|-------------------|-------|
| 1 | **S6-DOC-001** | This document |
| 2 | S6-EMAIL-001 | Resend adapter (narrowed from “blast emails” to platform Phase 2) |
| 3–5 | S6-EMAIL-002+ | Templates + lifecycle + monthly report |
| 6–7 | S6-ADM-002 / S6-EMAIL-00x | Admin Notification Center + history |
| 8–10 | Follow-on | Prefs enforcement, ops alerts, validation |

Primary theme AI work (S6-AI-xxx) may feed **Phase 5 recommendations** later without bypassing this architecture.

---

## Cross references

| Document | Relationship |
|----------|--------------|
| [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) | Sprint scope; Resend decision; manual admin workflow |
| [SPRINT_5_SIGNOFF.md](./SPRINT_5_SIGNOFF.md) | Deferred notification delivery → Sprint 6 |
| [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) | `accessEmailAlerts` / `accessNotifications` |
| [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md) | Admin UI home for Notification Center |
| [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) | Authoritative project state |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | Sprint status board |

---

## Revision history

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-09 | S6-DOC-001 | Initial Notification Platform design — architecture, categories, roadmap phases 1–10 |
