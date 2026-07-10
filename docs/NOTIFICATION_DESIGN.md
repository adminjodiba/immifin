# Notification Design

| Field | Value |
|-------|-------|
| **Project** | IMMIFIN |
| **Version** | v0.5.x |
| **Sprint** | Sprint 6 |
| **Task ID** | S6-DOC-001 · S6-DOC-003 · S6-DOC-004 · S6-DOC-005 · S6-DOC-006 · S6-DOC-007 |
| **Task Name** | Notification Design Document |
| **Feature Area** | Documentation |
| **Status** | Approved design — implementation not started |
| **Last updated** | 2026-07-10 |
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

## Provider Capability Matrix

| Field | Value |
|-------|-------|
| **Task ID** | S6-DOC-007 |
| **Status** | 🟡 In Progress |
| **Last updated** | 2026-07-10 |

> Long-term provider strategy for the IMMIFIN Notification Platform.  
> Complements [Architecture Overview](#architecture-overview) and [Email Design §6 Email Provider](#6-email-provider).

### Purpose

IMMIFIN is intentionally designed with a **provider-independent** notification architecture.

Business logic must **never** depend directly on any third-party notification provider.

```
Business Event
      ↓
Notification Service
      ↓
Provider Adapter
      ↓
Provider
```

Each provider should be evaluated against a consistent capability matrix.

This enables:

- Future provider replacement
- Multi-provider support
- Easier architectural decisions
- Reduced vendor lock-in
- Better long-term maintainability

---

### Current provider strategy

| Channel | Preferred Provider | Status |
|---------|-------------------|--------|
| Email | Resend | Phase 1 |
| SMS | Twilio | Future |
| WhatsApp | Twilio | Future |
| Push Notification | TBD | Future |
| Apple Messages for Business | TBD | Future |
| In-App Notifications | IMMIFIN Native | Future |

Additional providers may be introduced **without changing business logic** — only new adapters + configuration. See also [Email Design §15 Future Channels](#15-future-channels).

**Note:** Apple Messages for Business is **not** a bulk iMessage blast API; treat as a future evaluation channel only.

---

### Capability comparison

This matrix is intended to **evolve** as providers are evaluated and onboarded.

| Capability | Resend | Twilio | Future Providers |
|------------|--------|--------|------------------|
| Email | ✅ | ❌ | TBD |
| SMS | ❌ | ✅ | TBD |
| WhatsApp | ❌ | ✅ | TBD |
| Apple Messages for Business | ❌ | Planned | TBD |
| Push Notifications | ❌ | ❌ | TBD |
| React Email Templates | ✅ | ❌ | TBD |
| Delivery Tracking | ✅ | ✅ | TBD |
| Webhooks | ✅ | ✅ | TBD |
| Retry Support | Provider Supported | Provider Supported | TBD |
| Batch Sending | Limited by Provider | Limited by Provider | TBD |
| Analytics | Basic | Basic | TBD |

“React Email Templates” means IMMIFIN can render HTML/text server-side and pass the result to Resend; Twilio is not an email template host for Phase 1.

---

### Provider evaluation criteria

Future providers should be evaluated using consistent criteria:

| Criterion | Why it matters |
|-----------|----------------|
| Cloudflare Worker compatibility | Production runtime is OpenNext on Workers |
| Next.js compatibility | App Router / server modules |
| API quality | Clear send + status APIs |
| Webhook support | Delivery, bounce, complaint, opt-out |
| Reliability | Uptime and delivery reputation |
| Global availability | Immigrant audience is worldwide |
| Scalability | Growth beyond early Pro/Power volume |
| Rate limits | Safe batching from Workers |
| Cost | Unit economics per send |
| Security | Secrets, signing, compliance |
| Documentation quality | Faster, safer integration |
| SDK maturity | Prefer thin HTTP adapters if SDK is Worker-hostile |
| Vendor lock-in | Ease of adapter swap |
| Long-term roadmap | Channel expansion (SMS, WhatsApp, etc.) |

---

### Engineering principles

| Rule | Detail |
|------|--------|
| Business code never talks to providers | No Resend/Twilio imports in feature routes or UI |
| Common provider interface | All adapters implement the same `send` / result contract |
| Providers are interchangeable | Swap or add providers via adapter + config |
| Notification Service owns orchestration | Eligibility, prefs, templates, history, retries, routing |
| Providers are delivery-only | No business rules inside SDKs |
| SDKs isolated in adapters | Provider-specific code stays under `lib/notifications/providers/*` (or equivalent) |

---

### Future considerations

| Enhancement | Description | Status |
|-------------|-------------|--------|
| Multiple email providers | e.g. Resend + SES | ⬜ Future |
| Automatic provider failover | Secondary email provider on primary failure | ⬜ Future |
| Channel fallback | Email → SMS if email bounces (preference-gated) | ⬜ Future |
| Cost-based routing | Choose provider by unit cost / volume | ⬜ Future |
| Regional provider routing | Latency or compliance by region | ⬜ Future |
| Provider health monitoring | Error-rate alerts to admins | ⬜ Future |
| Delivery analytics dashboard | Admin Notification Center stats | ⬜ Future |
| A/B provider testing | Compare deliverability across providers | ⬜ Future |

---

### Implementation status

| Field | Value |
|-------|-------|
| **Status** | 🟡 In Progress |
| **Reason** | Resend has been selected as the Phase 1 email provider (account/domain/config may still be completing). Additional providers (Twilio SMS/WhatsApp, push, in-app) will be added in future notification phases. |

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
| **Implementation Status** | ✅ Completed (S6-EMAIL-002.1 — barebone template) |

| Field | Detail |
|-------|--------|
| **Purpose** | Confirm Power activation; introduce AI / advanced intelligence surfaces as they ship. |
| **Trigger** | Plan becomes `power`. |
| **Audience** | User set to Power. |
| **Template** | `welcome-power` |
| **Future improvements** | AI assistant onboarding checklist. |
| **Implementation Status** | ✅ Completed (S6-EMAIL-002.2 — barebone template) |

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

**Implementation Status:** ✅ MVP template complete (S6-EMAIL-003.1–003.6) — `emails/templates/monthly-immigration-report-email.tsx`. Charts, AI narrative, and admin send flow remain out of scope.

### MVP personalization (S6-EMAIL-003.6)

| Item | Status |
|------|--------|
| Personalized profile line (`Category • Country • Priority Date …`) | ✅ Completed |
| Status indicator standard (colored ● / movement glyphs; text remains accessible) | ✅ Completed |
| Final MVP CTA wording: **View My Immigration Dashboard** | ✅ Completed |

### Dashboard-Driven Email Principle

**Status:** ✅ Documented + mapper foundation (S6-EMAIL-003.7)

The **Personalized Dashboard is the source of truth** for a user’s immigration snapshot.

The **Monthly Immigration Update is a read-only presentation layer** of that same dashboard data — a concise inbox snapshot, not an independent calculation engine.

| Rule | Requirement |
|------|-------------|
| Source of truth | Personalized Dashboard data/calculation layer (`lib/dashboard/**`, `lib/visaBulletinData.ts`, `lib/visaBulletinMovement.ts`) |
| Email role | Read-only snapshot / presentation mapping only |
| No duplicate math | Email code must **never** reimplement eligibility, Visa Bulletin movement, status, or journey interpretation |
| Shared engine | Final Action / Dates for Filing status, MoM movement, eligibility, and journey meaning must come from the **same** dashboard engine the UI uses |
| Consistency | Email and dashboard must display consistent values for the same user and bulletin month |
| Change propagation | Future dashboard calculation changes should flow into email automatically through the shared mapper/service |

**Approved data flow:**

```text
Google Sheets
  → Existing server service (visa bulletin sheets / history)
  → Existing dashboard calculation/data layer
  → Email data mapper (presentation only)
  → Monthly Immigration Update template
```

**Mapper:** `lib/notifications/mappers/map-monthly-immigration-report-email.ts`  
(`mapMonthlyImmigrationReportEmailProps` — journey-aware dashboard-shaped source → `MonthlyImmigrationReportEmailProps`)

Do **not** bypass Sheets → server service → dashboard data layer → presentation.

### Journey-Aware Monthly Updates (S6-EMAIL-005.1)

**Status:** ✅ Completed

The Monthly Immigration Update remains **one template** and **one Notification Service path**. Only the mapped dashboard source and card contents branch by journey.

| Supported journey | Dashboard engine reused | Email card focus |
|-------------------|-------------------------|------------------|
| `employment_gc_waiting` | `buildEmploymentJourneyData` + Visa Bulletin movement | Immigration Journey Today + Visa Bulletin Movement |
| `green_card_holder` | `buildGreenCardJourneyData` + citizenship eligibility | Citizenship Journey + Citizenship Timeline |

**Green Card holder cards (same three-card layout):**

1. **Your Citizenship Journey** — Green Card issue date, earliest N-400 filing date, estimated progress % (from dashboard), days remaining, journey status (`On Track` / `Eligible Soon` / `Eligible Now`)
2. **Your Citizenship Timeline** — Today, earliest filing date, remaining days, next milestone
3. **What This Means for You** — concise advisory summary from dashboard citizenship metrics

Green Card holders are **eligible recipients** (not Unsupported Profile) when Pro/Power prefs and assembly succeed.

### Channel

Email via Resend (HTML + plain-text fallback). Deep links into authenticated IMMIFIN pages.

### Future improvements

- Per-user chart images
- AI narrative (Power)
- Stamping wait-time section for users with travel intent
- SMS teaser with email deep link
- Estimated Green Card / journey progress bar (post-MVP only — deferred after July 16)

### Implementation Status

✅ Journey-aware Monthly Update (employment + Green Card holder) complete for July 16; auto-trigger / schedule / webhooks not built

### Single-user controlled send (S6-EMAIL-004.1)

| Item | Status |
|------|--------|
| Single-user real-data preview (admin) | ✅ Completed |
| Single-user controlled send (admin → one existing user) | ✅ Completed |
| Dashboard-driven email delivery validation | ✅ Completed |
| Bulk / audience / campaign send | ✅ Completed (S6-EMAIL-004.2) |
| Scheduling / automatic sends | ⬜ Not Started |

**Admin control:** `components/admin/AdminSendMonthlyImmigrationUpdateForm.tsx`  
**Endpoint:** `POST /api/admin/notifications/send-monthly-immigration-update` (`action: "preview" | "send"`)  
**Assembler:** `lib/notifications/build-monthly-immigration-report-dashboard-source.ts`  
**Audit action:** `SEND_SINGLE_MONTHLY_IMMIGRATION_UPDATE`

Only one existing IMMIFIN user email is accepted. Missing immigration profile data fails safely without sending.

### Admin Monthly Update Control Center (S6-EMAIL-004.2)

| Item | Status |
|------|--------|
| Admin Monthly Update Control Center UI | ✅ Completed |
| Eligible Pro/Power audience summary | ✅ Completed |
| Explicit send confirmation | ✅ Completed |
| Controlled bulk-send orchestration (batched) | ✅ Completed |
| Duplicate-send protection (per bulletin month) | ✅ Completed |
| Basic campaign/send summary | ✅ Completed |
| Automatic triggering after bulletin refresh | ⬜ Not Started |
| Scheduling | ⬜ Not Started |
| Operational reminder alerts | ⬜ Not Started |
| Webhook delivery tracking | ⬜ Not Started |
| Advanced campaign management | ⬜ Not Started |
| SMS / WhatsApp | ⬜ Not Started |

**UI:** `components/admin/AdminMonthlyUpdateControlCenter.tsx`  
**Summary:** `GET /api/admin/notifications/monthly-immigration-updates/summary`  
**Bulk send:** `POST /api/admin/notifications/monthly-immigration-updates/send` (`confirm: true`)  
**Persistence:** `notification_campaigns` (`supabase/migrations/20260710140000_017_notification_campaigns.sql`)  
**Audit action:** `SEND_MONTHLY_IMMIGRATION_UPDATES`

**Eligibility:** active Pro/Power (incl. legacy `basic`→Pro), valid email, `emailAlerts` + `visaBulletinUpdates` prefs, dashboard assembler success for `employment_gc_waiting` **or** `green_card_holder`. Free/incomplete/unsupported profiles are skipped (counted, not emailed).

**Batch strategy (Cloudflare Workers safety):** send in batches of 5 with 250ms delay; refuse synchronous send above 75 recipients (Queues required before larger production audiences). No unbounded `Promise.all()`.

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

**Design authority for visual/UX presentation:** [IMMIFIN Email Design System](#immifin-email-design-system). Template IDs and product intent remain in this section; layout, branding, and CTA rules live in the Email Design System.

| Template ID | Category | Description | Implementation Status |
|-------------|----------|-------------|------------------------|
| `welcome-pro` | Lifecycle | Welcome to Pro | ✅ Completed (S6-EMAIL-002.1) |
| `welcome-power` | Lifecycle | Welcome to Power | ✅ Completed (S6-EMAIL-002.2) |
| `upgrade-pro-to-power` | Lifecycle | Upgrade confirmation | ⬜ Not Started |
| `downgrade-to-free` | Lifecycle | Downgrade + data retention note | ⬜ Not Started |
| `account-deleted` | Lifecycle | Deletion confirmation | ⬜ Not Started |
| `monthly-immigration-report` | Report | Personalized monthly report | ✅ Completed (S6-EMAIL-003.1 — MVP template) |
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

## Email Design

> **Implementation blueprint for all IMMIFIN email development (S6-DOC-003).**  
> This section extends the platform architecture above. It does **not** replace [Architecture Overview](#architecture-overview), [§9 Technical Architecture](#9-technical-architecture), or category definitions in §§1–8.  
> Email is **Phase 1 of channels only**. SMS / WhatsApp / Push / In-App remain future adapters.  
> **Visual, UX, and template standards:** see [IMMIFIN Email Design System](#immifin-email-design-system) (S6-DOC-006) — single source of truth for every email template.

### 1. Purpose

Email is **one notification channel** inside the Notification Platform — not a standalone Resend integration bolted onto features.

IMMIFIN business logic must **never** communicate directly with Resend.

```
Business Event
      ↓
Notification Service
      ↓
Email Provider Adapter
      ↓
Resend
```

Future email providers may include:

- Twilio (SendGrid / email APIs)
- Amazon SES
- SendGrid
- Postmark

No application feature (Visa Bulletin pages, calculators, Clerk webhooks, admin Data Refresh) should be tightly coupled to any provider. Features emit events or call `notificationService.send(...)` / `dispatch(...)`; only the Email Provider Adapter talks to Resend.

See also: [Architecture Overview](#architecture-overview) · [Why application code must never call Resend directly](#why-application-code-must-never-call-resend-directly).

---

### 2. Resend Integration

Overall integration process (ops + engineering) before any production user send:

| Step | Action |
|------|--------|
| 1 | Create Resend account (IMMIFIN org) |
| 2 | Generate API key with send permissions |
| 3 | Store key as a **server-only** Cloudflare / `.env.local` secret — never in git or `NEXT_PUBLIC_*` |
| 4 | Add and verify the IMMIFIN sending domain in Resend (DNS: SPF, DKIM, DMARC as required) |
| 5 | Configure webhook endpoint + signing secret (delivery / bounce / complaint events) |
| 6 | Admin-only test send in development, then production smoke |

| Setting | Recommendation |
|---------|----------------|
| **Sender domain** | `notifications.immifin.com` |
| **From** | `IMMIFIN <updates@notifications.immifin.com>` |
| **Reply-To** | `support@immifin.com` |

#### Why a dedicated notification subdomain

- Separates transactional/product mail reputation from the primary website / support domain
- Limits blast radius if a campaign is misconfigured or marked as spam
- Clearer DNS and DMARC policy for automated mail
- Allows rotating or pausing notification sending without affecting `immifin.com` web identity
- Matches common SaaS practice (`updates@`, `noreply@` on a notifications subdomain)

---

### Email Identity Strategy

> Long-term naming and sender-identity convention for IMMIFIN outbound email (S6-DOC-004).  
> Complements [§2 Resend Integration](#2-resend-integration); does not change Phase 2 implementation scope until addresses are provisioned.

#### Document purpose

Email addresses are part of IMMIFIN’s **product identity** and **operational architecture**, not just SMTP configuration.

A clear naming convention improves:

- Professional branding
- User trust
- Deliverability
- Future scalability
- Operational organization

The strategy distinguishes **categories** of outgoing email while maintaining a consistent IMMIFIN identity.

#### Recommended sending domain

| Recommendation | Value |
|----------------|-------|
| **Dedicated subdomain** | `notifications.immifin.com` |

**Reasons:**

- Separate email reputation from the primary website domain (`immifin.com`)
- Protect the reputation of `immifin.com` (web + support)
- Allow notification infrastructure to evolve independently (DNS, DMARC, provider, pause/resume)

#### Recommended email addresses

Not every address needs to be implemented immediately. These represent the **long-term communication strategy**.

| Purpose | Email Address | Status |
|---------|---------------|--------|
| Monthly Reports | `updates@notifications.immifin.com` | Phase 1 |
| System Notifications | `system@notifications.immifin.com` | Future |
| Welcome / Lifecycle Emails | `welcome@notifications.immifin.com` | Future |
| Customer Support (Reply-To) | `support@immifin.com` | Existing |
| Security Notifications | `security@notifications.immifin.com` | Future |
| Billing Notifications | `billing@notifications.immifin.com` | Future |
| Marketing Campaigns | `newsletter@notifications.immifin.com` | Future |

#### Sender identity (Phase 1 default)

| Field | Value |
|-------|-------|
| **Display name** | `IMMIFIN` |
| **From** | `updates@notifications.immifin.com` |
| **Reply-To** | `support@immifin.com` |

This default sender should initially be used for:

- Welcome emails
- Monthly Immigration Reports
- Administrative notifications
- Product notifications

Specialized sender identities (`welcome@`, `security@`, `billing@`, `newsletter@`, etc.) may be introduced later without changing product feature code.

#### Future evolution

As IMMIFIN grows, different email categories may use different sender identities while preserving a consistent brand:

| Category | Example From / display direction |
|----------|----------------------------------|
| Monthly Immigration Reports | `updates@` · “IMMIFIN Updates” |
| Security | `security@` |
| Billing | `billing@` |
| Marketing | `newsletter@` |
| System | `system@` |
| Welcome / lifecycle | `welcome@` (optional split from Phase 1 default) |

This must **not** require changes to business logic: **sender identity is selected by the Notification Service** based on notification type / template (see engineering recommendation below).

#### Engineering recommendation

**Business code must never hardcode sender email addresses.**

Instead:

1. Feature / event code calls `notificationService.send(...)` / `dispatch(...)`
2. Notification Service maps **notification type → sender identity** (from address, display name, reply-to)
3. Email Provider Adapter receives the resolved identity and passes it to Resend

This allows sender identities to evolve (new addresses, subdomain changes, A/B from-names) without modifying Visa Bulletin, subscription, calculator, or admin feature code.

Env vars such as `RESEND_FROM_EMAIL` / `RESEND_FROM_NAME` remain the **Phase 1 default**; later a small identity registry (config or DB) can override per notification type.

#### Implementation status

| Field | Value |
|-------|-------|
| **Status** | ⬜ Planned |
| **Phase** | Email Infrastructure (Roadmap Phase 2+) |

---

### Email Subject Standard

> Consistent subject-line convention for all IMMIFIN outbound email (S6-DOC-005).

#### Purpose

All outgoing IMMIFIN emails should follow a consistent subject naming convention.

A consistent subject format improves:

- Brand recognition
- User trust
- Inbox visibility
- Searchability
- Professional appearance

#### Recommended format

```text
IMMIFIN | <Subject>
```

#### Examples

| Example subject |
|-----------------|
| `IMMIFIN \| Welcome to Pro` |
| `IMMIFIN \| Welcome to Power` |
| `IMMIFIN \| Your Monthly Immigration Report` |
| `IMMIFIN \| Visa Bulletin Updated` |
| `IMMIFIN \| Your Subscription Changed` |
| `IMMIFIN \| Account Successfully Deleted` |
| `IMMIFIN \| Security Notification` |
| `IMMIFIN \| Billing Confirmation` |
| `IMMIFIN \| System Maintenance` |

#### Guidelines

- Keep subjects short and meaningful
- Avoid excessive capitalization
- Avoid promotional language for transactional emails
- **Notification Service** should generate the subject (from template metadata + typed context)
- **Business code must never hardcode subject lines**

#### Implementation status

| Field | Value |
|-------|-------|
| **Status** | ⬜ Planned |
| **Phase** | Email Infrastructure / Templates (Roadmap Phase 2–3) |

---

### Email Branding Standard

> Standard visual structure for every IMMIFIN email (S6-DOC-005).

#### Purpose

Every email should immediately look recognizable as an IMMIFIN communication.

Maintain a consistent visual identity across all templates so branding updates happen in **one shared layout**, not per template.

#### Recommended layout

```text
--------------------------------------------------
IMMIFIN Logo
--------------------------------------------------
Email Title
--------------------------------------------------
Personalized Greeting
--------------------------------------------------
Main Content
--------------------------------------------------
Primary Call-To-Action Button
--------------------------------------------------
Additional Helpful Links
  · Dashboard
  · Support
  · Documentation
--------------------------------------------------
Legal Disclaimer
  "This email is provided for informational purposes only
   and does not constitute legal advice."
--------------------------------------------------
Copyright
  © IMMIFIN
--------------------------------------------------
```

#### Branding guidelines

| Guideline | Detail |
|-----------|--------|
| **Logo** | Use the IMMIFIN logo consistently in the header |
| **Typography** | Maintain the same typography across templates (email-safe stack aligned with Design System 2.0) |
| **Spacing** | Use consistent spacing / padding in the shared layout |
| **Accent color** | Use a single primary accent color matching IMMIFIN branding |
| **Footer** | Maintain a consistent footer (links, disclaimer, copyright) |
| **Mobile** | Ensure templates are mobile responsive |
| **Plain text** | Always include a plain-text version |

#### Future enhancements

| Enhancement | Status |
|-------------|--------|
| Dark mode support | ⬜ Future |
| Accessibility improvements | ⬜ Future |
| Multilingual branding | ⬜ Future |
| Dynamic theme support | ⬜ Future |

#### Implementation status

| Field | Value |
|-------|-------|
| **Status** | ⬜ Planned |
| **Phase** | Email Infrastructure / Templates (Roadmap Phase 2–3) |

---

### Subject, branding & identity — engineering recommendation

The **Notification Service** (with shared template layout components) owns:

| Concern | Owner |
|---------|-------|
| **Subject selection** | Notification Service / template metadata (`IMMIFIN \| …`) |
| **Sender identity** | Notification Service — see [Email Identity Strategy](#email-identity-strategy) |
| **Branding** | Shared layout (logo, typography, accent, spacing) |
| **Footer** | Shared layout |
| **Legal disclaimer** | Shared layout (standard informational disclaimer) |

**Individual templates should only define their unique content** (title, greeting variables, body sections, primary CTA target).

Shared layout components should be reused by every template. This minimizes duplication and ensures future branding or subject-prefix updates require changes in **only one place**.

---

### Call-To-Action (CTA) Standard

> Standard for primary and secondary actions in all IMMIFIN emails.  
> Formalized in the [IMMIFIN Email Design System](#immifin-email-design-system) (S6-DOC-006).

#### Purpose

Every IMMIFIN email should guide the user toward **one clear next action**.

The email should never overwhelm the recipient with multiple competing primary buttons.

This creates:

- Better user experience
- Higher click-through rates
- Cleaner design
- Consistent branding
- Better accessibility

#### Primary CTA rule

Every email should contain **exactly ONE** Primary Call-To-Action button.

The CTA should represent the single most important action the recipient should perform after reading the email.

| Email Type | Primary CTA |
|------------|-------------|
| Welcome Email | Complete My Immigration Profile |
| Welcome (Profile Already Complete) | View My Dashboard |
| Monthly Immigration Report | View My Immigration Dashboard |
| Visa Bulletin Update | See What's Changed |
| Subscription Upgrade | Explore My New Features |
| Subscription Downgrade | Upgrade Again |
| Account Deletion Confirmation | Contact Support |
| Security Notification | Review Security Activity |
| Billing Notification | View Billing Details |
| System Maintenance | View Status Page |

#### Secondary actions

Secondary actions should **not** be displayed as additional primary buttons.

Instead they should appear as simple **footer links**.

Examples:

- Dashboard
- Support
- Documentation
- Privacy Policy
- Terms of Service
- Contact Us

#### Button design

Future design guidelines for the primary CTA:

| Guideline | Detail |
|-----------|--------|
| **Count** | One prominent primary button per email |
| **Branding** | Consistent IMMIFIN branding |
| **Color** | Consistent primary accent (same as Email Branding Standard) |
| **Spacing** | Consistent spacing above/below the button |
| **Size** | Consistent button size across templates |
| **Mobile** | Mobile friendly (full-width or comfortably tappable on small screens) |
| **Accessibility** | Accessible contrast, clear label text, meaningful link destination |

#### Engineering recommendation

The **Notification Service** selects:

| Concern | Owner |
|---------|-------|
| **Primary CTA** | Notification Service (based on notification type + user context) |
| **CTA URL** | Notification Service (deep link into IMMIFIN) |
| **CTA label** | Notification Service / template metadata |

Templates simply **render** the provided CTA via a shared button component.

- Business code should **never** hardcode CTA buttons
- Shared CTA components should be reused by every template
- Welcome flows may choose between “Complete My Immigration Profile” and “View My Dashboard” based on profile completeness — that decision belongs in the Notification Service, not in feature UI code

Aligns with [Email Branding Standard](#email-branding-standard) (layout slot for Primary CTA) and [Email Subject Standard](#email-subject-standard) / [Email Identity Strategy](#email-identity-strategy) (platform-owned presentation).

#### Future enhancements

| Capability | Status |
|------------|--------|
| Dynamic CTA based on user journey | ⬜ Future |
| Multiple CTA variants for A/B testing | ⬜ Future |
| Context-aware CTA personalization | ⬜ Future |
| Analytics-driven CTA optimization | ⬜ Future |

#### Implementation status

| Field | Value |
|-------|-------|
| **Status** | ⬜ Planned |
| **Phase** | Email Template Framework (Roadmap Phase 3) |

---

### 3. Environment Variables

| Variable | Purpose | Client-visible? |
|----------|---------|-----------------|
| `RESEND_API_KEY` | Resend API secret | **No** — server only |
| `RESEND_FROM_EMAIL` | Verified from address (e.g. `updates@notifications.immifin.com`) | **No** |
| `RESEND_FROM_NAME` | Display name (e.g. `IMMIFIN`) | **No** |
| `RESEND_WEBHOOK_SECRET` | Validate Resend webhook signatures | **No** |

Optional (already noted in [§9](#9-technical-architecture)):

| Variable | Purpose |
|----------|---------|
| `NOTIFICATION_ADMIN_EMAILS` | Admin operational alert recipients |

**Rules:**

- Document placeholders in `.env.example` only — never real secrets
- Set production values in Cloudflare Worker secrets / dashboard
- Never prefix with `NEXT_PUBLIC_`
- Never return these values from any API route (including debug routes)

---

### 4. Email Architecture

Complete email delivery path:

```
Business Event
      ↓
Notification Service
      ↓
Eligibility
      ↓
Preferences
      ↓
Template Renderer
      ↓
Notification History          ← create row (queued / sending)
      ↓
Provider Adapter
      ↓
Resend
      ↓
Recipient
      ↓
Webhook
      ↓
Supabase Status Update        ← delivered / bounced / failed / …
```

| Layer | Responsibility |
|-------|----------------|
| **Business Event** | Domain signal only (`admin.monthly_report.approved`, `subscription.plan_changed`, …). No Resend SDK. |
| **Notification Service** | Orchestration entry — see [§5](#5-notification-service). |
| **Eligibility** | Plan capabilities (`accessEmailAlerts`, `accessNotifications`); valid email; admin campaign audience rules. |
| **Preferences** | Enforce `notificationPreferences` (and opt-in keys); skip + log when denied. |
| **Template Renderer** | Template ID + typed context → subject, HTML, plain text. |
| **Notification History** | Persist attempt before/during/after provider call; update from webhooks. |
| **Provider Adapter** | Map internal message → Resend API; return provider message id / errors. |
| **Resend** | Accept, queue, and attempt delivery to mailbox providers. |
| **Recipient** | User inbox (or spam / bounce — not guaranteed). |
| **Webhook** | Async delivery events from Resend. |
| **Supabase Status Update** | Update history row + feed admin statistics. **Never** store notification history in Google Sheets. |

---

### 5. Notification Service

Business code should call:

```ts
notificationService.send(...)
// or notificationService.dispatch(event)
```

instead of importing Resend or calling `fetch("https://api.resend.com/...")`.

**Responsibilities:**

| Responsibility | Detail |
|----------------|--------|
| Determine eligibility | Capabilities + audience rules |
| Choose template | Map event / campaign → template ID |
| Apply personalization | Profile, bulletin, dashboard context |
| Call provider | Via Email Provider Adapter only |
| Log history | Insert/update Supabase notification rows |
| Handle retries | Bounded retries for transient provider errors; campaign retry UI later |
| Update status | `queued` → `sending` → `sent` / `failed`; webhooks refine further |

Public product routes and Force Sync must **not** invoke bulk `send` synchronously for all subscribers.

---

### 6. Email Provider

Provider abstraction: a single interface (e.g. `NotificationProvider` / `EmailProvider`) with `send(message) → result`.

| Implementation | Status |
|----------------|--------|
| **Resend Provider** | Initial and only implementation for Sprint 6 Phase 2 |
| Amazon SES | Future |
| SendGrid | Future |
| Postmark | Future |

Changing providers must **not** require changes to Visa Bulletin, subscription, or admin campaign business code — only adapter + env configuration.

---

### 7. Email Template Framework

> Template shells and typed inputs. **All templates must conform to the [IMMIFIN Email Design System](#immifin-email-design-system)** (shared layout, branding, CTA, accessibility).

#### Shared components

| Component | Role |
|-----------|------|
| **Layout** | Max-width shell, background, consistent padding |
| **Header** | IMMIFIN wordmark / product name |
| **Footer** | Links (dashboard, preferences, support), copyright |
| **Buttons** | Primary CTA deep links into IMMIFIN |
| **Branding** | Colors/typography aligned with Design System 2.0 (email-safe subset) |
| **Legal disclaimer** | Informational only — not legal advice |
| **Plain text version** | Required fallback for deliverability and accessibility |

#### Templates

| Template | Maps to platform template ID | Notes |
|----------|------------------------------|-------|
| Welcome Pro | `welcome-pro` | See [§1.1](#11-welcome-to-pro) |
| Welcome Power | `welcome-power` | See [§1.2](#12-welcome-to-power) |
| Downgrade | `downgrade-to-free` | Include data-retention messaging |
| Account Deleted | `account-deleted` | |
| Monthly Immigration Report | `monthly-immigration-report` | Flagship — [§11](#11-monthly-immigration-report-email-design) |
| Admin Reminder | `admin-bulletin-unsent-reminder` / `admin-dos-publication-reminder` | |
| Future Marketing | `marketing-campaign` / `campaign-generic` | Opt-in `marketing` only |

#### Typed template inputs

Each template should declare a TypeScript input type (implementation-time), for example:

| Template | Example typed fields |
|----------|----------------------|
| `welcome-pro` | `firstName`, `dashboardUrl`, `pricingUrl` |
| `monthly-immigration-report` | `firstName`, `category`, `country`, `priorityDate`, `bulletinMonth`, `finalActionSummary`, `movementSummary`, `dashboardUrl`, `historyUrl`, `movementUrl`, `disclaimer` |
| `downgrade-to-free` | `firstName`, `dataRetentionNote`, `upgradeUrl` |

Renderer rejects incomplete context rather than sending broken mail.

---

### 8. Notification Database

Delivery history belongs in **Supabase** (not Google Sheets; Sheets remain bulletin/stamping source of truth per ADR-002).

Recommended table (name TBD at migration time, e.g. `notification_deliveries`):

| Field | Description |
|-------|-------------|
| **Notification ID** | Primary key (UUID) |
| **Campaign ID** | Nullable FK for bulk/report campaigns |
| **Recipient** | User id + email (normalized) |
| **Provider** | `resend` (later `twilio_sms`, etc.) |
| **Provider Message ID** | Resend email id for webhook correlation |
| **Template** | Template ID + version |
| **Notification Type** | Lifecycle / report / admin / campaign |
| **Status** | See lifecycle below |
| **Attempt Count** | Send attempts |
| **Sent Time** | When provider accepted the message |
| **Delivered Time** | From webhook when available |
| **Failure Reason** | Provider or skip reason |
| **Created** | Row created at |
| **Updated** | Last status change |

#### Lifecycle statuses

| Status | Meaning |
|--------|---------|
| **Queued** | Accepted by Notification Service; not yet handed to provider |
| **Sending** | Provider call in flight |
| **Sent** | Provider accepted (API success) — **not** proof of inbox delivery |
| **Delivered** | Provider webhook confirms delivery (when available) |
| **Delayed** | Temporary deferral / retry scheduled |
| **Failed** | Permanent or exhausted failure |
| **Bounced** | Hard/soft bounce from webhook |
| **Suppressed** | Skipped: prefs, capability, invalid address, or prior bounce suppression |

Aligns with [§6 Notification History](#6-notification-history); this section is the email-channel schema detail for implementers.

---

### 9. Webhook Processing

```
Resend
  ↓
Webhook Endpoint          e.g. POST /api/webhooks/resend
  ↓
Validate Signature        RESEND_WEBHOOK_SECRET
  ↓
Find Notification         by Provider Message ID
  ↓
Update Delivery Status
  ↓
Log Event
  ↓
Dashboard Statistics      Admin Notification Center
```

**Important:** Provider API success (`Sent`) does **not** guarantee the message reached the inbox. Webhooks refine status to `Delivered`, `Bounced`, `Failed`, etc.

Webhook handler rules:

- `require` signature validation before any DB write
- Idempotent updates (Resend may retry)
- No Resend secret in client bundles
- Do not block unrelated product traffic on webhook processing failures — log and alert admins

---

### 10. Email Workflows

Detailed category definitions remain in [§1 User Lifecycle](#1-user-lifecycle-notifications) and [§2 Monthly Immigration Report](#2-monthly-immigration-report). This section is the **email-channel workflow blueprint**.

#### A. Welcome to Pro

| Field | Detail |
|-------|--------|
| **Purpose** | Confirm Pro activation; orient to Pro capabilities |
| **Trigger** | Plan becomes `pro` |
| **Audience** | That user (if email present) |
| **Personalization** | Name, deep links to dashboard / profile / bulletin history |
| **Expected email contents** | Welcome headline; what Pro unlocks; CTA to My Immifin; preference link; disclaimer |
| **Future improvements** | Checklist of first Pro actions |
| **Implementation Status** | ⬜ Not Started |

#### B. Welcome to Power

| Field | Detail |
|-------|--------|
| **Purpose** | Confirm Power; introduce advanced / AI surfaces as they ship |
| **Trigger** | Plan becomes `power` |
| **Audience** | That user |
| **Personalization** | Name; Power capability highlights |
| **Expected email contents** | Welcome; Power vs Pro delta; CTA; disclaimer |
| **Future improvements** | AI assistant onboarding |
| **Implementation Status** | ⬜ Not Started |

#### C. Upgrade Pro → Power

| Field | Detail |
|-------|--------|
| **Purpose** | Acknowledge upgrade |
| **Trigger** | `pro` → `power` |
| **Audience** | Upgrading user |
| **Personalization** | Capability diff from `lib/subscription/capabilities.ts` |
| **Expected email contents** | Upgrade confirmation; new unlocks; CTA |
| **Future improvements** | In-app tour link |
| **Implementation Status** | ⬜ Not Started |

#### D. Downgrade

| Field | Detail |
|-------|--------|
| **Purpose** | Confirm downgrade; clarify **data retained**, access gated |
| **Trigger** | Plan becomes `free` |
| **Audience** | Downgraded user |
| **Personalization** | Retention note (`dataRetention` policy) |
| **Expected email contents** | Confirmation; what is locked; upgrade CTA; disclaimer |
| **Future improvements** | Win-back timing |
| **Implementation Status** | ⬜ Not Started |

#### E. Account Deleted

| Field | Detail |
|-------|--------|
| **Purpose** | Confirm deletion for trust / compliance |
| **Trigger** | Account deletion workflow (when implemented) |
| **Audience** | Deleted user’s email |
| **Personalization** | Minimal PII |
| **Expected email contents** | Confirmation; support contact if error |
| **Future improvements** | Export-before-delete reminder |
| **Implementation Status** | ⬜ Not Started |

#### F. Monthly Immigration Report

| Field | Detail |
|-------|--------|
| **Purpose** | Flagship personalized monthly email — see [§11](#11-monthly-immigration-report-email-design) |
| **Trigger** | Admin Generate → Preview → Approve → Send (not Force Sync) |
| **Audience** | Pro/Power with email prefs |
| **Personalization** | Full immigration profile + bulletin context |
| **Expected email contents** | See §11 |
| **Future improvements** | AI recommendations; chart images; stamping section |
| **Implementation Status** | ✅ Admin Control Center + single-user + batched Pro/Power bulk send (S6-EMAIL-004.1–004.2); auto-trigger / advanced campaigns ⬜ Not Started |

---

### 11. Monthly Immigration Report (Email Design)

**Flagship notification.** This is **not** a generic “Visa Bulletin updated” blast. It is a personalized monthly immigration report email assembled from the user’s profile and current bulletin data. Product intent is defined in [§2 Monthly Immigration Report](#2-monthly-immigration-report); this subsection specifies **email contents**.

**Presentation must follow the [IMMIFIN Email Design System](#immifin-email-design-system)** (shared layout, one Primary CTA — typically “View My Dashboard”, footer secondary links, disclaimer).

| Section | Email content |
|---------|----------------|
| **Immigration Journey** | Category, country of chargeability, path summary |
| **Priority Date** | User priority date + current / not current framing |
| **Visa Bulletin Summary** | Relevant Final Action / Dates for Filing for that user |
| **Movement** | Month-over-month movement for the user’s track |
| **Dashboard Snapshot** | Compact My Immifin-style status highlights |
| **Charts** | Lightweight images and/or deep links to History & Movement |
| **Recommendations (future AI)** | Power-tier narrative — later |
| **Links back to IMMIFIN** | Dashboard, Visa Bulletin, History, Movement, Preferences |
| **Legal disclaimer** | Informational only; not legal advice |

Channel: HTML + plain text via Resend. Prefer deep links over large attachments.

---

### 12. Campaign Management

Future admin campaign workflow for bulk email (especially Monthly Immigration Report):

```
Visa Bulletin Updated
      ↓
Generate Campaign
      ↓
Preview
      ↓
Approve
      ↓
Confirmation
      ↓
Send
      ↓
Completion Statistics
```

**Recommended confirmation message:**

> You are about to send this Monthly Immigration Report to all eligible users.

| Campaign state | Meaning |
|----------------|---------|
| **Draft** | Campaign record created |
| **Generated** | Per-recipient payloads / counts computed |
| **Previewed** | Admin reviewed sample render |
| **Approved** | Explicit admin approval recorded |
| **Sending** | Fan-out in progress |
| **Completed** | All attempts finished successfully or skipped |
| **Completed with Failures** | Finished with one or more `failed` / `bounced` rows |

Force Sync and archive remain **separate** from campaign send ([SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md)). See also [§7 Administration](#7-administration) and [§5 Campaign Management](#5-campaign-management).

---

### 13. Sending Strategy

| Recommendation | Reason |
|----------------|--------|
| Do **not** send directly from UI | UI calls admin API → Notification Service |
| Use Notification Service | Single place for rules, history, provider |
| Safe batch processing initially | Small batches with delays; avoid one giant Worker request |
| Future: Cloudflare Queues | Decouple accept-from-admin from provider fan-out |
| Future: Retry Queue | Transient Resend / network errors |
| Future: Rate limiting | Respect Resend limits; protect reputation |
| Future: Background processing | Long campaigns off the request path |

**Avoid long-running Worker requests** for full-subscriber fan-out. Admin “Send” should enqueue work and return progress; Workers Paid CPU helps cold start but does not justify unbounded synchronous loops.

---

### 14. Testing Strategy

| Mode | Behavior |
|------|----------|
| **Development Mode** | Localhost / preview Worker; may use Resend test mode or allowlist recipients; never blast production users |
| **Preview Mode** | Render subject/HTML/text for one user or sample context **without** calling Resend send (or with dry-run flag) |
| **Production Mode** | Real sends only after admin confirmation; history + webhooks enabled |

**Only production admins** (`requireAdmin()`) may trigger actual campaign or production test sends.  
Preview must be available before Approve/Send.  
Lifecycle emails in early phases may use admin-triggered fixtures until Stripe webhooks exist.

---

### 15. Future Channels

This email architecture is intentionally channel-agnostic at the Notification Service boundary.

| Channel | Phase |
|---------|-------|
| **Email (Resend)** | **Phase 1 — current focus** |
| SMS | Future (e.g. Twilio) |
| WhatsApp | Future (e.g. Twilio + Meta templates) |
| Push Notifications | Future |
| In-App Notifications | Future |
| Apple Messages for Business | Future exploration only — **not** a bulk iMessage blast API |

Adding a channel = new provider adapter + preference/capability rules + history `provider` value. Business events and most templates’ *content intent* stay stable; rendering may differ per channel.

See [§10 Future Enhancements](#10-future-enhancements) and [IMMIGRATION_BROADCAST_PLATFORM_VISION.md](./IMMIGRATION_BROADCAST_PLATFORM_VISION.md) for post-MVP media distribution (parked).

---

### 16. CTO Recommendations

| Decision | Guidance |
|----------|----------|
| Business code never talks to Resend | Events / `notificationService.send` only |
| Notification Service owns orchestration | Eligibility, prefs, templates, history, retries |
| Sender identity selected by Notification Service | Never hardcode From addresses in features — see [Email Identity Strategy](#email-identity-strategy) |
| Subject + branding owned by Notification Service / shared layout | Never hardcode subjects in features; templates supply content only — see [Email Subject Standard](#email-subject-standard) · [Email Branding Standard](#email-branding-standard) |
| Exactly one Primary CTA per email | Notification Service selects label + URL; footer links for secondary actions — see [Call-To-Action (CTA) Standard](#call-to-action-cta-standard) |
| Providers remain replaceable | Resend first; SES/SendGrid/Postmark later without rewriting features |
| Notification history belongs in Supabase | Durable, queryable, admin-visible |
| Google Sheets must never store notification history | Sheets = bulletin/stamping data only (ADR-002) |
| Use server-side templates | Typed inputs; HTML + plain text; shared layout |
| Always preview before sending | Especially Monthly Immigration Report |
| Require explicit admin confirmation for campaigns | Confirmation copy in [§12](#12-campaign-management) |
| Optimize for Cloudflare Workers | Batch/queue; no SSR-blocking sends; no huge synchronous fan-out |
| Avoid technical debt | No one-off `resend` calls in feature routes “just for now” |
| Conform to Email Design System | Every template inherits shared components — see [IMMIFIN Email Design System](#immifin-email-design-system) |

---

## IMMIFIN Email Design System

| Field | Value |
|-------|-------|
| **Task ID** | S6-DOC-006 |
| **Status** | Documentation complete — implementation started (S6-EMAIL-002.1) |
| **Last updated** | 2026-07-10 |

> The Email Design System defines the visual, functional, and technical standards for every email sent by IMMIFIN.  
>  
> All email templates should conform to this design system unless an approved architectural decision explicitly overrides it.

This system is the **single source of truth** for email branding, layout, UX, content presentation, accessibility, and technical implementation guidelines. It complements (and does not replace) the [Email Design](#email-design) architecture (Resend, Notification Service, history, campaigns).

**Status key:** ⬜ Not Started · 🟡 In Progress · ✅ Completed

---

### 1. Design System Progress Tracker

Update throughout Sprint 6 as documentation and implementation land.

#### Foundation

| Item | Status |
|------|--------|
| Email Branding Standard | ✅ Completed (documented) |
| Email Subject Standard | ✅ Completed (documented) |
| Email Identity Strategy | ✅ Completed (documented) |
| CTA Standard | ✅ Completed (documented) |
| Shared Layout | ✅ Completed (S6-EMAIL-002.1 — barebone EmailLayout) |
| Shared Components | 🟡 In Progress (layout shell only; full component library later) |
| Footer Standard | 🟡 In Progress (included in EmailLayout) |
| Legal Disclaimer | ✅ Completed (S6-EMAIL-002.1 — standard copy in EmailLayout) |
| Plain Text Renderer | ✅ Completed (S6-EMAIL-002.1 — Welcome Pro plain-text fallback) |

#### Visual Components

| Item | Status |
|------|--------|
| Logo | ⬜ Not Started |
| Header | ⬜ Not Started |
| Hero Section | ⬜ Not Started |
| Statistics Cards | ⬜ Not Started |
| Dashboard Summary Cards | ⬜ Not Started |
| Tables | ⬜ Not Started |
| Timeline Components | ⬜ Not Started |
| Call-To-Action Button | ⬜ Not Started |
| Footer Links | ⬜ Not Started |
| Copyright Block | ⬜ Not Started |

#### Email Templates

| Item | Status |
|------|--------|
| Welcome Pro | ✅ Completed (S6-EMAIL-002.1 — barebone template) |
| Welcome Power | ✅ Completed (S6-EMAIL-002.2 — barebone template) |
| Upgrade Pro → Power | ⬜ Not Started |
| Downgrade | ⬜ Not Started |
| Account Deleted | ⬜ Not Started |
| Monthly Immigration Report | ✅ Completed (S6-EMAIL-003.1 — MVP template) |
| Admin Reminder | ⬜ Not Started |
| System Notification | ⬜ Not Started |
| Billing Notification | ⬜ Not Started |
| Security Notification | ⬜ Not Started |

#### UX Standards

| Item | Status |
|------|--------|
| Greeting Style | ⬜ Not Started |
| Personalization Rules | ⬜ Not Started |
| One Primary CTA Rule | ✅ Completed (documented) |
| Secondary Links | ✅ Completed (documented) |
| Mobile Responsiveness | ⬜ Not Started |
| Accessibility | ⬜ Not Started |
| Dark Mode Compatibility | ⬜ Not Started |

#### Engineering Standards

| Item | Status |
|------|--------|
| Shared React Components | ⬜ Not Started |
| Template Rendering | ⬜ Not Started |
| Notification Service Integration | 🟡 In Progress (core service + Resend adapter — S6-EMAIL-001A) |
| Provider Independence | 🟡 In Progress (EmailProvider interface + Resend adapter isolation) |
| Plain Text Version | ✅ Completed (S6-EMAIL-002.1 — Welcome Pro text fallback) |
| Testing Strategy | ✅ Completed (documented) |
| Preview Mode | ✅ Completed (documented) |
| Production Validation | ⬜ Not Started |

---

### 2. Email Component Library

Planned reusable email components. Prefer **React Email** (or equivalent server-rendered components) shared across all templates.

| Component | Purpose | Status |
|-----------|---------|--------|
| **EmailLayout** | Outer shell, max-width, background, padding | ✅ Completed (S6-EMAIL-002.1) |
| **Header** | Logo + product identity | ⬜ Not Started |
| **Footer** | Secondary links, disclaimer, copyright | ⬜ Not Started |
| **Hero** | Optional title / highlight band | ⬜ Not Started |
| **Greeting** | Personalized salutation | ⬜ Not Started |
| **SectionTitle** | Consistent H2-style section headings | ⬜ Not Started |
| **InformationCard** | Generic content card | ⬜ Not Started |
| **StatisticsCard** | KPI / metric display (report emails) | ⬜ Not Started |
| **JourneyCard** | Immigration journey snapshot | ⬜ Not Started |
| **Timeline** | Movement / history timeline block | ⬜ Not Started |
| **CTAButton** | Single primary CTA | ⬜ Not Started |
| **Divider** | Horizontal rule / spacing separator | ⬜ Not Started |
| **Disclaimer** | Legal informational disclaimer | ✅ Completed (S6-EMAIL-002.1) |
| **Signature** | Optional closing / team sign-off | ⬜ Not Started |
| **FooterLinks** | Dashboard, Support, Documentation, Privacy, Terms | ⬜ Not Started |

Detailed CTA behavior: [Call-To-Action (CTA) Standard](#call-to-action-cta-standard).  
Layout skeleton: [Email Branding Standard](#email-branding-standard).

---

### 3. Branding Standards

| Item | Purpose | Implementation notes | Status |
|------|---------|----------------------|--------|
| **Logo** | Instant brand recognition | Shared Header component; consistent asset URL / CID; alt text “IMMIFIN” | ⬜ Not Started |
| **Typography** | Readable, professional hierarchy | Email-safe stack aligned with Design System 2.0; consistent title / body / caption sizes | ⬜ Not Started |
| **Spacing** | Visual rhythm, less clutter | Shared spacing scale in EmailLayout; avoid one-off margins per template | ⬜ Not Started |
| **Accent Color** | Brand cue for CTA and highlights | Single primary accent; sufficient contrast on white/light backgrounds | ⬜ Not Started |
| **Button Style** | One clear action | Shared CTAButton; see CTA Standard | ⬜ Not Started |
| **Card Style** | Structure report / dashboard content | Shared InformationCard / StatisticsCard / JourneyCard | ⬜ Not Started |
| **Icons** | Optional visual cues | Sparse use; accessible alternatives; avoid relying on icon-only meaning | ⬜ Not Started |
| **White Space** | Reduce cognitive load | Prefer breathing room over dense blocks; especially on mobile | ⬜ Not Started |
| **Footer** | Trust, navigation, legal | Shared Footer + FooterLinks + Disclaimer + copyright | ⬜ Not Started |

Also see: [Email Identity Strategy](#email-identity-strategy) · [Email Subject Standard](#email-subject-standard) (`IMMIFIN \| …`).

---

### 4. User Experience Standards

| Standard | Guidance | Status |
|----------|----------|--------|
| **Friendly greeting** | Warm, professional salutation using first name when available | ⬜ Not Started |
| **Professional tone** | Clear, calm, trustworthy — Life OS for Immigrants, not hype | ⬜ Not Started |
| **Personalization** | Profile- and bulletin-aware content where eligible; never invent facts | ⬜ Not Started |
| **One Primary CTA** | Exactly one primary button; see CTA Standard | ✅ Completed (documented) |
| **Minimal scrolling** | Lead with what matters; link deeper into IMMIFIN for detail | ⬜ Not Started |
| **Responsive layout** | Single-column friendly; tappable CTA; readable on small screens | ⬜ Not Started |
| **Accessibility** | Semantic structure, alt text, contrast, meaningful link text | ⬜ Not Started |
| **Readable typography** | Comfortable body size; clear hierarchy | ⬜ Not Started |
| **Consistent spacing** | Shared layout rhythm | ⬜ Not Started |
| **Legal clarity** | Standard disclaimer on every email; not legal advice | ⬜ Not Started |

**Standard disclaimer copy:**

> This email is provided for informational purposes only and does not constitute legal advice.

---

### 5. Technical Standards

| Standard | Guidance | Status |
|----------|----------|--------|
| **React Email Components** | Prefer composable React Email (or equivalent) over duplicated HTML strings | ⬜ Not Started |
| **Shared Layout** | All templates wrap `EmailLayout` | ✅ Completed (S6-EMAIL-002.1) |
| **Template Inheritance** | Templates supply content slots only; inherit header/footer/CTA/disclaimer | ⬜ Not Started |
| **Reusable Footer** | One Footer component | ⬜ Not Started |
| **Reusable Header** | One Header component | ⬜ Not Started |
| **Reusable CTA** | One CTAButton; props from Notification Service | ⬜ Not Started |
| **Reusable Statistics Cards** | Shared for Monthly Immigration Report and future digests | ⬜ Not Started |
| **Reusable Dashboard Components** | Journey / summary cards aligned with My Immifin concepts | ⬜ Not Started |
| **Plain Text Support** | Every send includes text/plain alternative | 🟡 In Progress (Welcome Pro only — S6-EMAIL-002.1) |
| **Cloudflare Compatibility** | Render on server/Worker; no client-only email generation; avoid heavy sync work in request path | ⬜ Not Started |
| **Resend Compatibility** | HTML + text payloads; attachments only when necessary; respect provider limits | ⬜ Not Started |

Provider calls remain behind the Email Provider Adapter — see [Email Design](#email-design).

---

### 6. Future Enhancements

| Enhancement | Notes | Status |
|-------------|-------|--------|
| **Dark Mode** | `prefers-color-scheme` / dual-background patterns where client support allows | ⬜ Not Started |
| **Localization** | Locale-aware copy selection | ⬜ Not Started |
| **Multilingual Emails** | Full translated templates | ⬜ Not Started |
| **Dynamic Theme** | Limited theme tokens without breaking email clients | ⬜ Not Started |
| **A/B Testing** | Subject / CTA variants via Notification Service | ⬜ Not Started |
| **Dynamic CTA** | Journey-aware CTA selection | ⬜ Not Started |
| **AI Personalization** | Power-tier narrative sections — human-reviewed | ⬜ Not Started |
| **Accessibility Improvements** | Ongoing audits beyond baseline | ⬜ Not Started |
| **AMP Email** | Future evaluation only — not required for MVP | ⬜ Not Started |

---

### 7. CTO Recommendations

The Email Design System should evolve **exactly like** the IMMIFIN UI Design System (Design System 2.0): shared primitives first, pages/templates second.

| Principle | Guidance |
|-----------|----------|
| **No independent templates** | No template should be designed as a one-off HTML page |
| **Inherit shared components** | All templates inherit EmailLayout, Header, Footer, CTA, Disclaimer |
| **One place for branding** | Logo, accent, typography, footer changes happen in shared components only |
| **Separate business logic from presentation** | Notification Service owns eligibility, data, CTA URL/label, subject, sender; templates render |
| **Provider independence** | Design system does not import Resend; adapter sits below |
| **Maintainability** | Prefer small composable components over copy-paste |
| **Cloudflare Workers** | Keep rendering efficient; batch sends; no SSR-blocking fan-out |
| **Minimize duplicated HTML** | If the same block appears twice, extract a component |

---

### Implementation Tracker

Overall progress for the Email Design System (update throughout Sprint 6):

| Area | Status |
|------|--------|
| **Foundation** | 🟡 In Progress (EmailLayout + disclaimer landed — S6-EMAIL-002.1; full component library later) |
| **Visual Components** | 🟡 In Progress (CTA + footer/disclaimer in layout; logo/cards later) |
| **Templates** | 🟡 In Progress (Welcome Pro/Power + Monthly Report MVP — S6-EMAIL-002.x / 003.1) |
| **UX** | 🟡 In Progress (CTA / secondary links documented; greeting in layout) |
| **Engineering** | 🟡 In Progress (Notification Service + Resend + React Email layout/template — S6-EMAIL-001A / 002.1) |
| **Testing** | ⬜ Not Started |
| **Production Ready** | ⬜ Not Started |

---

## Implementation Roadmap

Update status boxes as each milestone completes during Sprint 6 and beyond.

### Phase 1 — Notification Architecture

Platform design document (S6-DOC-001), Email Design blueprint (S6-DOC-003), and **IMMIFIN Email Design System** (S6-DOC-006). No production send path yet.

**Status:** ✅ Complete (S6-DOC-001 · S6-DOC-003 · S6-DOC-004/005 identity-subject-branding-CTA · S6-DOC-006 Email Design System — 2026-07-10)

### Phase 2 — Resend Infrastructure

Implement using **[Email Design](#email-design)** as the infrastructure guide and **[IMMIFIN Email Design System](#immifin-email-design-system)** for presentation standards: account/domain, env secrets, Resend provider adapter, admin-only test send, webhook stub/endpoint design. **No user blasts.**

**Status:** 🟡 In Progress (S6-EMAIL-001A — core service + Resend adapter landed; domain verify / test send / webhooks still open)

**Code (S6-EMAIL-001A):** `lib/notifications/` — Notification Service, provider interface, fetch-based Resend adapter, config/registry. No templates, campaigns, history, or API routes yet.

### Phase 3 — Notification Templates

Template IDs, renderer, Welcome / Admin / Report shells — **must use Email Design System shared components** (per Email Design §7 + Design System §2).

**Status:** 🟡 In Progress (S6-EMAIL-002.1 — EmailLayout + Welcome Pro barebone; framework not fully complete)

Plan change and account lifecycle dispatches through the engine (Email Design §10 A–E).

**Status:** ⬜ Not Started

### Phase 5 — Monthly Immigration Report

Personalized report generation + admin approve/send (Email Design §§11–12).

**Status:** 🟡 In Progress (S6-EMAIL-003.1 — MVP email template; generate/approve/send not built)

### Phase 6 — Admin Notification Center

Generate / Preview / Approve / Send / Retry UI on `/admin`.

**Status:** ⬜ Not Started

### Phase 7 — Notification History

Persistent history table + admin browse / failure views (Email Design §8) + webhook status updates (§9).

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
- Do **not** store notification delivery history in Google Sheets.
- Do **not** implement Stripe billing emails until billing ships.
- Do **not** skip history logging for “quick” test sends in production.
- Do **not** expose `RESEND_*` secrets to the client.

---

## Suggested Sprint 6 task mapping

| Phase | Suggested Task ID | Notes |
|-------|-------------------|-------|
| 1 | **S6-DOC-001** · **S6-DOC-003** · **S6-DOC-006** | Platform design + Email Design + Email Design System |
| 2 | S6-EMAIL-001 | Resend infrastructure — follow [Email Design](#email-design) |
| 3–5 | S6-EMAIL-002+ | Templates per [IMMIFIN Email Design System](#immifin-email-design-system) |
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
| [IMMIGRATION_BROADCAST_PLATFORM_VISION.md](./IMMIGRATION_BROADCAST_PLATFORM_VISION.md) | Post-MVP broadcast distribution (parked) |

---

## Revision history

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-09 | S6-DOC-001 | Initial Notification Platform design — architecture, categories, roadmap phases 1–10 |
| v1.1 | 2026-07-10 | S6-DOC-003 | Expand Email Design — Resend integration, architecture, templates, DB, webhooks, campaigns, CTO recommendations |
| v1.2 | 2026-07-10 | S6-DOC-004 | Email Identity Strategy — subdomain, address catalog, Phase 1 default sender, Notification Service ownership |
| v1.3 | 2026-07-10 | S6-DOC-005 | Email Subject Standard + Email Branding Standard — shared layout and `IMMIFIN \|` subject convention |
| v1.4 | 2026-07-10 | — | Call-To-Action (CTA) Standard — one primary button, footer secondary links |
| v1.5 | 2026-07-10 | S6-DOC-006 | IMMIFIN Email Design System — progress tracker, component library, branding/UX/technical standards |
| v1.6 | 2026-07-10 | S6-DOC-007 | Provider Capability Matrix — Resend/Twilio strategy, evaluation criteria, adapter principles |
| v1.7 | 2026-07-10 | S6-EMAIL-001A | Notification core + Resend provider adapter (`lib/notifications/`); Phase 2 in progress |
| v1.8 | 2026-07-10 | S6-EMAIL-002.1 | Barebone EmailLayout + Welcome Pro template (HTML + plain text); React Email deps |
| v1.9 | 2026-07-10 | S6-EMAIL-002.2 | Welcome Power template (HTML + plain text) reusing EmailLayout |
| v1.10 | 2026-07-10 | S6-EMAIL-003.1 | Monthly Immigration Report MVP template (HTML + plain text) |
| v1.11 | 2026-07-10 | S6-EMAIL-003.6 | Monthly Update personalization — profile line, status indicators, CTA wording |
| v1.12 | 2026-07-10 | S6-EMAIL-003.7 | Dashboard-Driven Email Principle + Monthly Update email data mapper foundation |
| v1.13 | 2026-07-10 | S6-EMAIL-004.1 | Single-user Monthly Immigration Update preview + controlled Resend send |
| v1.14 | 2026-07-10 | S6-EMAIL-004.2 | Admin Monthly Update Control Center — Pro/Power audience summary + batched bulk send |
| v1.15 | 2026-07-10 | S6-EMAIL-005.1 | Journey-aware Monthly Update — Green Card holder / citizenship journey support |
