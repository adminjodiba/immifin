# IMMIFIN Notification Platform v1.0

| Field | Value |
|-------|-------|
| **Document** | Notification Platform Signoff |
| **Task** | S6-DOC-010 / S6-RELEASE-001 |
| **Version** | v1.0 |
| **Sprint** | Sprint 6 |
| **Status** | **Production Validated** |
| **Release target** | July 16, 2026 MVP |
| **Signoff date** | 2026-07-10 |
| **Production validation** | 2026-07-10 (S6-RELEASE-001) |
| **Living design blueprint** | [NOTIFICATION_DESIGN.md](./NOTIFICATION_DESIGN.md) |
| **This document** | Historical source of truth for Notification Platform v1.0 completion |

> **Authority:** This signoff records architecture, design locks, implementation status, production readiness, and deferred work for Notification Platform **v1.0**. Ongoing design detail remains in [NOTIFICATION_DESIGN.md](./NOTIFICATION_DESIGN.md). Do not treat deferred items as complete.

---

## Mission

The IMMIFIN Notification Platform delivers **trusted, personalized immigration communication** to subscribers — starting with email via Resend, designed for future SMS, WhatsApp, Push, In-App, and Apple Messages for Business through provider adapters.

It exists so IMMIFIN can:

- Turn Visa Bulletin and dashboard intelligence into **actionable inbox updates**
- Reinforce **Pro and Power subscription value** with personalized monthly reports
- Keep **business code free of provider SDKs** (orchestration behind Notification Service)
- Scale from controlled admin sends to multi-channel automation without redesigning the core

It fits IMMIFIN as core infrastructure beside the Personalized Dashboard: the dashboard is the product surface of truth; the Notification Platform is the **delivery and presentation layer** that carries that truth to the user’s inbox.

---

## Business Objectives

| Objective | How v1.0 supports it |
|-----------|----------------------|
| **Personalized communication** | Monthly Update assembled from each user’s immigration profile and dashboard engine |
| **Monthly Immigration Updates** | Flagship Pro/Power email — not a generic bulletin blast |
| **Subscription value** | Welcome Pro / Welcome Power templates; email alerts gated by `accessEmailAlerts` |
| **User engagement** | Concise inbox snapshot + single CTA back to the Immigration Dashboard |
| **Automation foundation** | Notification Service, factory, registry, config, errors, Resend adapter |
| **Future multi-channel notifications** | Channel-agnostic types and provider interface; SMS/WhatsApp deferred |

---

## Architecture Overview

```text
Google Sheets
  ↓
Server Services (visa bulletin sheets / history)
  ↓
Dashboard Engine (eligibility, FA/DFF, movement, focus)
  ↓
Dashboard Email Mapper (presentation mapping only)
  ↓
Monthly Immigration Update template (HTML + plain text)
  ↓
Notification Service
  ↓
Provider Registry
  ↓
Resend Provider
  ↓
Inbox
```

| Layer | Responsibility |
|-------|----------------|
| **Google Sheets** | Source of Visa Bulletin current/previous/history data (ADR-002) |
| **Server Services** | Fetch/normalize sheet data (`lib/visaBulletinSheets.ts`, `lib/visaBulletinHistory.ts`) |
| **Dashboard Engine** | Immigration calculations and journey meaning (`lib/dashboard/**`, including `buildEmploymentJourneyData` + `buildGreenCardJourneyData`, `lib/visaBulletinData.ts`, `lib/visaBulletinMovement.ts`, `lib/citizenship-eligibility.ts`) |
| **Dashboard Email Mapper** | Convert dashboard-shaped data → template props; **no recalculation** |
| **Monthly Immigration Update** | Read-only React Email presentation + plain-text fallback |
| **Notification Service** | Orchestration entry — `sendEmail`, normalized results |
| **Provider Registry** | Maps logical providers (e.g. Resend) to adapters |
| **Resend Provider** | Sole place that talks to Resend; secrets stay server-only |
| **Inbox** | Recipient mailbox (HTML + multipart plain text) |

**Rule:** Business features never import Resend directly. Admin and lifecycle flows call `createNotificationService()`.

---

## Dashboard-Driven Email Principle

**Architectural rule — locked for v1.0.**

1. The **Personalized Dashboard is the source of truth** for a user’s immigration snapshot.
2. The **Monthly Immigration Update is a read-only presentation layer** of that same data.
3. Email templates and mappers must **never reimplement** eligibility, Visa Bulletin movement, status, or journey interpretation.
4. Final Action / Dates for Filing status, MoM movement, eligibility, and journey meaning must come from the **same dashboard engine** the UI uses.
5. For the same user and bulletin month, **email and dashboard must display consistent values**.
6. Future dashboard calculation changes should flow into email through the shared assembler/mapper — not forked formulas.

**Key code:**

- Assembler: `lib/notifications/build-monthly-immigration-report-dashboard-source.ts`
- Mapper: `lib/notifications/mappers/map-monthly-immigration-report-email.ts`
- Template: `emails/templates/monthly-immigration-report-email.tsx`

---

## Notification Platform Components

| Component | Path / location | Responsibility |
|-----------|-----------------|----------------|
| **Notification Service** | `lib/notifications/core/notification-service.ts` | Orchestrates email sends; returns normalized provider results |
| **Notification Factory** | `lib/notifications/core/notification-factory.ts` | `createNotificationService()` — composition root (config + Resend) |
| **Notification Registry** | `lib/notifications/core/notification-registry.ts` | Provider registration surface for DI |
| **Notification Configuration** | `lib/notifications/core/notification-config.ts` | Centralized sender identity / env (no secrets in client) |
| **Notification Errors** | `lib/notifications/core/notification-errors.ts` | Typed `NotificationError` + error codes |
| **Provider Interface** | `lib/notifications/providers/email-provider.ts` | Adapter contract for email providers |
| **Resend Provider** | `lib/notifications/providers/resend-provider.ts` | Resend implementation behind the interface |
| **Email Templates** | `emails/templates/**`, `emails/components/email-layout.tsx` | React Email HTML + plain-text builders |
| **Admin Control Center** | `components/admin/AdminMonthlyUpdateControlCenter.tsx` + admin APIs | Audience summary, preview sample, confirmed Pro/Power bulk send |

**Public import boundary:** `@/lib/notifications` (`lib/notifications/index.ts`).

---

## Email Templates

| Template | ID | Status |
|----------|----|--------|
| **Welcome Pro** | `welcome-pro` | ✅ Completed |
| **Welcome Power** | `welcome-power` | ✅ Completed |
| **Monthly Immigration Update** | `monthly-immigration-report` | ✅ Completed (MVP) |

**Shared layout:** All templates reuse `emails/components/email-layout.tsx` (`EmailLayout`) — branding, hero title, single primary CTA, legal disclaimer, support footer.

**Plain-text fallbacks:** Every production send path includes a text alternative (multipart). Monthly Update plain text includes profile summary, status text, CTA wording, and dashboard URL — without decorative symbols that hurt readability.

**Design system:** Subjects use `IMMIFIN | …`; exactly **one** primary CTA per email; secondary actions as footer links only.

---

## Monthly Immigration Update

### Approved MVP design (locked)

| Element | Specification |
|---------|----------------|
| **Subject** | `IMMIFIN \| Your {Month Year} Immigration Update` |
| **Hero** | Personalized intro + profile line (employment: `Category • Country • Priority Date …`; Green Card holder: `Green Card Holder • Issue Date …`) |
| **Monthly Highlight Banner** | One-line takeaway for the update month |
| **Card 1** | Journey-aware: **Your Immigration Journey Today** (employment) or **Your Citizenship Journey** (Green Card holder) |
| **Card 2** | Journey-aware: **This Month's Visa Bulletin Movement** (employment) or **Your Citizenship Timeline** (Green Card holder) |
| **Card 3** | **What This Means for You** — advisor / next-step summary from dashboard metrics |
| **Primary CTA** | **View My Immigration Dashboard** (single button; dashboard deep link) |

### 60-Second Rule

The Monthly Immigration Update must be **scannable in about one minute**. Hero copy sets that expectation (“everything you need to know in less than one minute”). The three-card layout, one highlight, and one CTA exist to enforce that rule — no charts, progress bars, or extra CTAs in the July 16 MVP.

### Audience (MVP send)

- Active **Pro** and **Power** subscribers (`accessEmailAlerts`)
- Valid email; notification prefs (`emailAlerts`, `visaBulletinUpdates`)
- Required dashboard data can be generated (**employment_gc_waiting** or **green_card_holder** journey path)
- Free / inactive / incomplete / unsupported profiles are **skipped** (counted, not emailed)

### Green Card Holder Monthly Update

| Field | Value |
|-------|-------|
| **Task** | S6-EMAIL-005.1 |
| **Status** | **Completed** |
| **Supported journeys** | `employment_gc_waiting`, `green_card_holder` |
| **Template** | Same `monthly-immigration-report` (journey-aware card contents) |
| **Dashboard reuse** | `buildGreenCardJourneyData` / citizenship eligibility — no duplicate math |

---

## Admin Control Center

**Section title on `/admin`:** Monthly Immigration Updates  
**UI:** `components/admin/AdminMonthlyUpdateControlCenter.tsx`

| Capability | Behavior |
|------------|----------|
| **Audience Summary** | Bulletin month, Pro count, Power count, total recipients, last sent, refresh timestamp, status |
| **Preview Sample** | Reuses single-user preview API — one existing user; **no mass send** |
| **Single User Send** | Separate control: `AdminSendMonthlyImmigrationUpdateForm` → one real user |
| **Monthly Update Campaign** | Confirmed bulk send to all eligible Pro/Power recipients |
| **Confirmation Dialog** | In-app modal (`AdminMonthlyUpdateConfirmModal`) — month + Pro/Power/total counts; Cancel sends nothing |
| **Campaign Summary** | Success / failure / skipped counts, provider, completed timestamp |
| **Duplicate-send protection** | `notification_campaigns` — one completed (or completed-with-failures) send per bulletin month; in-progress send blocked |

**APIs:**

- `GET /api/admin/notifications/monthly-immigration-updates/summary`
- `POST /api/admin/notifications/monthly-immigration-updates/send` (`confirm: true`)
- `POST /api/admin/notifications/send-monthly-immigration-update` (`preview` \| `send` — single user)

**Audit actions:** `SEND_SINGLE_MONTHLY_IMMIGRATION_UPDATE`, `SEND_MONTHLY_IMMIGRATION_UPDATES`

**Batching (Workers safety):** Controlled batches (size 5, delay 250ms); synchronous send refused above 75 recipients — Cloudflare Queues required before larger production scale.

---

## Production Readiness

Notification Platform **v1.0** is **Production Ready** for the July 16 MVP scope.

| Capability | Status |
|------------|--------|
| Provider abstraction (EmailProvider + Resend adapter) | ✓ |
| Notification Service + factory + config + errors | ✓ |
| Dashboard-driven mapping / assembler | ✓ |
| Shared EmailLayout + Welcome Pro/Power + Monthly Update | ✓ |
| Plain-text fallbacks | ✓ |
| Admin email preview (sample + real-user preview) | ✓ |
| Single-user real delivery | ✓ |
| Admin Control Center (audience + confirmed bulk send) | ✓ |
| Duplicate-send protection + campaign record | ✓ |
| Admin audit logging | ✓ |
| Cloudflare / OpenNext compatible (no Node-only Resend bypass; batched sends) | ✓ |
| Inbox verification path (admin-controlled real send) | ✓ |

**Operational note:** Apply Supabase migration `017_notification_campaigns.sql` before relying on campaign persistence / duplicate protection in each environment. Resend domain/sender identity must be configured per [NOTIFICATION_DESIGN.md](./NOTIFICATION_DESIGN.md) Email Identity Strategy.

---

## Production Validation

| Field | Value |
|-------|-------|
| **Validation Date** | July 2026 |
| **Overall Result** | **Production Validated** |
| **Task** | S6-RELEASE-001 |

### Validation Method

- Real Dashboard Data
- Real Pro Subscribers
- Real Green Card Holder
- Real Inbox Delivery
- Resend Provider

### Validation Results

| Result | Status |
|--------|--------|
| Employment Journey validated | ✓ |
| Green Card Journey validated | ✓ |
| Dashboard Mapper validated | ✓ |
| Notification Service validated | ✓ |
| Admin Control Center validated | ✓ |
| Monthly Campaign validated | ✓ |
| Inbox Delivery validated | ✓ |

**Overall Result:** Production Validated

---

## Deferred Enhancements

**Not complete. Not in July 16 MVP scope.** Tracked for post-MVP / later Sprint 6+ work.

| Area | Deferred items |
|------|----------------|
| **Channels** | SMS, WhatsApp, Apple Messages for Business, Push, In-App |
| **Infrastructure** | Cloudflare Queues, retry queues, scheduling, automatic Visa Bulletin detection / auto-send |
| **Delivery intelligence** | Resend webhooks, open tracking, click tracking, campaign analytics |
| **Product** | AI recommendations in email, journey progress bar, marketing broadcasts, advanced campaign editor |
| **Lifecycle** | Full Stripe-triggered welcome/downgrade/deletion automation (templates exist; triggers deferred where blocked on Stripe) |
| **History UI** | Full notification history browse / failure console (campaign table is MVP-minimal only) |
| **Ops alerts** | 24-hour “bulletin updated but not sent” admin reminders |

---

## Lessons Learned

| Principle | Decision |
|-----------|----------|
| **Documentation-first** | [NOTIFICATION_DESIGN.md](./NOTIFICATION_DESIGN.md) before send code; Engineering Framework task templates for consistency |
| **Single source of truth** | Dashboard engine owns immigration math; email only presents |
| **Provider abstraction** | Resend (and future Twilio, etc.) stay behind adapters; business code uses Notification Service |
| **Dashboard-first architecture** | Mapper/assembler reuse `buildEmploymentJourneyData`, `buildGreenCardJourneyData`, movement tracker, citizenship eligibility |
| **Cloudflare-first** | Avoid unbounded fan-out; batch + hard sync ceiling; Queues before large audiences |
| **Reusable templates** | One `EmailLayout`; one primary CTA; subject and branding standards |
| **Admin confirmation** | No auto-blast on Force Sync; explicit confirm for real sends |
| **Transactional state in Supabase** | Campaign/send records — not Google Sheets |

---

## Notification Platform Version History

| Version | Sprint | Status | Release target | Notes |
|---------|--------|--------|----------------|-------|
| **1.0** | Sprint 6 | **Production Validated** | July 16, 2026 MVP | Core platform + Monthly Update + Admin Control Center + production validation |

### Implementation milestones (Sprint 6)

| Task | Outcome |
|------|---------|
| S6-DOC-001+ | Notification design + email design system |
| S6-EMAIL-001A | Notification Service + Resend adapter |
| S6-EMAIL-002.x | EmailLayout, Welcome Pro/Power |
| S6-EMAIL-003.x | Monthly Update template, personalization, dashboard mapper |
| S6-EMAIL-004.1 | Single-user real send |
| S6-EMAIL-004.2 | Admin Control Center + Pro/Power bulk send |
| S6-EMAIL-004.4 | In-app Monthly Update confirmation modal |
| **S6-EMAIL-005.1** | **Green Card Holder Monthly Update** (journey-aware mapper) |
| **S6-DOC-010** | This signoff |
| **S6-RELEASE-001** | Production validation + release closeout |

---

## CTO Signoff

| Field | Value |
|-------|-------|
| **Notification Platform** | IMMIFIN Notification Platform |
| **Version** | v1.0 |
| **Status** | **Production Validated** |
| **Architecture** | Approved |
| **Design** | Approved |
| **Dashboard-Driven Email Principle** | **Locked** |
| **Email Design** | **Locked** |
| **Provider Architecture** | **Locked** |
| **Ready for July 16 MVP** | **YES** |
| **Production Validated** | **YES** (S6-RELEASE-001) |

**Signed off as of:** 2026-07-10 (S6-DOC-010)  
**Production validated as of:** 2026-07-10 (S6-RELEASE-001)

Deferred enhancements listed above remain **out of scope** for v1.0 and must not be treated as shipped.

---

## Related documents

| Document | Role |
|----------|------|
| [NOTIFICATION_DESIGN.md](./NOTIFICATION_DESIGN.md) | Living design blueprint and detailed roadmap |
| [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) | Sprint 6 handoff (email alerts direction) |
| [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) | Authoritative project state |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | High-level status board |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | System ADRs (Sheets as bulletin source) |
| [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) | Engineering workflow |
| [ENGINEERING_FRAMEWORK/](./ENGINEERING_FRAMEWORK/) | AI agent guidelines + task templates |
