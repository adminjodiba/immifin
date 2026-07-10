# Notification Design

| Field | Value |
|-------|-------|
| **Project** | IMMIFIN |
| **Version** | v0.5.x |
| **Sprint** | Sprint 6 |
| **Task ID** | S6-DOC-001 · S6-DOC-003 · S6-DOC-004 · S6-DOC-005 · S6-DOC-006 |
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

## Email Design

> **Implementation blueprint for all IMMIFIN email development (S6-DOC-003).**  
> This section extends the platform architecture above. It does **not** replace [Architecture Overview](#architecture-overview), [§9 Technical Architecture](#9-technical-architecture), or category definitions in §§1–8.  
> Email is **Phase 1 of channels only**. SMS / WhatsApp / Push / In-App remain future adapters.

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

> Standard for primary and secondary actions in all IMMIFIN emails (S6-DOC-006).

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
| Monthly Immigration Report | View My Dashboard |
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
| **Implementation Status** | ⬜ Not Started |

---

### 11. Monthly Immigration Report (Email Design)

**Flagship notification.** This is **not** a generic “Visa Bulletin updated” blast. It is a personalized monthly immigration report email assembled from the user’s profile and current bulletin data. Product intent is defined in [§2 Monthly Immigration Report](#2-monthly-immigration-report); this subsection specifies **email contents**.

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

---

## Implementation Roadmap

Update status boxes as each milestone completes during Sprint 6 and beyond.

### Phase 1 — Notification Architecture

Platform design document (S6-DOC-001) plus Email Design blueprint (S6-DOC-003). No production send path yet.

**Status:** ✅ Complete (S6-DOC-001 — 2026-07-09 · S6-DOC-003 Email Design — 2026-07-10)

### Phase 2 — Resend Infrastructure

Implement using **[Email Design](#email-design)** as the implementation guide: account/domain, env secrets, Resend provider adapter, admin-only test send, webhook stub/endpoint design. **No user blasts.**

**Status:** ⬜ Not Started

### Phase 3 — Notification Templates

Template IDs, renderer, Welcome / Admin / Report shells (per Email Design §7).

**Status:** ⬜ Not Started

### Phase 4 — User Lifecycle Emails

Plan change and account lifecycle dispatches through the engine (Email Design §10 A–E).

**Status:** ⬜ Not Started

### Phase 5 — Monthly Immigration Report

Personalized report generation + admin approve/send (Email Design §§11–12).

**Status:** ⬜ Not Started

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
| 1 | **S6-DOC-001** · **S6-DOC-003** | Platform design + Email Design blueprint |
| 2 | S6-EMAIL-001 | Resend infrastructure — follow [Email Design](#email-design) |
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
| [IMMIGRATION_BROADCAST_PLATFORM_VISION.md](./IMMIGRATION_BROADCAST_PLATFORM_VISION.md) | Post-MVP broadcast distribution (parked) |

---

## Revision history

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-09 | S6-DOC-001 | Initial Notification Platform design — architecture, categories, roadmap phases 1–10 |
| v1.1 | 2026-07-10 | S6-DOC-003 | Expand Email Design — Resend integration, architecture, templates, DB, webhooks, campaigns, CTO recommendations |
| v1.2 | 2026-07-10 | S6-DOC-004 | Email Identity Strategy — subdomain, address catalog, Phase 1 default sender, Notification Service ownership |
| v1.3 | 2026-07-10 | S6-DOC-005 | Email Subject Standard + Email Branding Standard — shared layout and `IMMIFIN \|` subject convention |
| v1.4 | 2026-07-10 | S6-DOC-006 | Call-To-Action (CTA) Standard — one primary button, footer secondary links |
