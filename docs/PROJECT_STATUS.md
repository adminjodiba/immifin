# Immifin — Project Status

**Last updated:** 2026-07-10  
**Version:** v0.4.2 + Notification Platform v1.0 (`main`)  
**Latest production commit:** `6f1df7e` — Notification Platform v1.0  
**Development workflow:** v2.1 (see [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md))

> **Authoritative status:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) supersedes this document for current production state.  
> **Sprint 5 sign-off:** [SPRINT_5_SIGNOFF.md](./SPRINT_5_SIGNOFF.md)  
> **Sprint 6 handoff:** [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) — planned vs completed  
> **Notification Platform v1.0:** [NOTIFICATION_PLATFORM_SIGNOFF.md](./NOTIFICATION_PLATFORM_SIGNOFF.md) — **Production Validated**  
> **Next Sprint:** Stripe Subscription Platform

---

## Overall status

**Production Stable** — Sprint 6 Notification track closed; **Stripe is next sprint**

| Area | Status |
|------|--------|
| **Infrastructure** | ✅ Complete — Cloudflare OpenNext (`npm run deploy`) |
| **Authentication** | ✅ Complete |
| **Deployment** | ✅ Complete — Build vs Runtime variables documented |
| **Subscription Foundation** | ✅ Complete — Development Subscription Mode + admin testing access |
| **Design System 2.0** | ✅ Sprint 5 scope complete — Visa Bulletin + Visa Stamping Wait Map promoted |
| **Admin Dashboard** | ✅ MVP — Data Refresh Center + force-refresh for stamping & bulletin |
| **Notification Platform** | ✅ **Completed — Production Validated** — [NOTIFICATION_PLATFORM_SIGNOFF.md](./NOTIFICATION_PLATFORM_SIGNOFF.md) |
| **Stripe billing** | ⏳ **Next Sprint** |
| **Cloudflare Workers plan** | ✅ Paid (upgraded Sprint 6) |

---

## Completed (Sprint 5)

| Deliverable | Status / Reference |
|-------------|-------------------|
| Development Subscription Mode | `ef412e0` |
| Pricing UX polish | `b64317c` |
| Visa Bulletin DS 2.0 (History, Movement, Dashboard) | S5-004, S5-007, S5-008 |
| Workspace page shell | `WorkspacePageShell` — site-wide |
| My Immifin dashboard polish | v0.4.2 — [MY_IMMIFIN_DASHBOARD_2.0.md](./design-system/MY_IMMIFIN_DASHBOARD_2.0.md) |
| Favorites (Pro/Power) | `/api/account/favorites` |
| Pro calculator auto-population | Green Card Wait Time + Citizenship |
| **H-1B Wage Level Estimator** | [CALCULATORS.md](./CALCULATORS.md) |
| **H-1B Lottery Odds Calculator** | [CALCULATORS.md](./CALCULATORS.md) |
| **Global Visa Stamping Wait Map** | [VISA_STAMPING_WAIT_MAP_2.0.md](./design-system/VISA_STAMPING_WAIT_MAP_2.0.md) |
| **Admin Dashboard MVP + Data Refresh** | [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md) |
| **My Immifin → Admin (role-gated)** | `profiles.role = admin` |
| **Admin subscription tier testing** | Free/Pro/Power without global dev flag |
| **Unified Manage Profile hub** | `/user-profile` |
| Subscription data retention policy | `lib/subscription/dataRetention.ts` |
| Site-wide scroll-to-top + Calculator menu fix | `ScrollToTop`, `lib/calculator-menu.ts` |
| **Sprint 5 sign-off** | [SPRINT_5_SIGNOFF.md](./SPRINT_5_SIGNOFF.md) |

---

## Sprint 6 closeout / next sprint

| Item | Notes |
|------|-------|
| ✅ Cloudflare Workers Paid | Completed Sprint 6 |
| ✅ Notification Design (S6-DOC-001) | [NOTIFICATION_DESIGN.md](./NOTIFICATION_DESIGN.md) |
| ✅ Notification Platform (v1.0) | **Production Validated** — [NOTIFICATION_PLATFORM_SIGNOFF.md](./NOTIFICATION_PLATFORM_SIGNOFF.md) |
| ⏳ Admin archive UI / richer ops panel | Deferred from Sprint 6 (S6-ADM-001) |
| ⏳ AI & Personalization | Deferred from Sprint 6 (S6-AI-xxx) |
| 🔜 **Stripe (next sprint)** | Checkout, webhooks, billing portal |
| ⏳ Remaining DS 2.0 page redesigns | Homepage, full Manage Profile polish |

### Parked (post–July 16, 2026 MVP)

| Item | Notes |
|------|-------|
| 📦 Immigration Broadcast Platform | [IMMIGRATION_BROADCAST_PLATFORM_VISION.md](./IMMIGRATION_BROADCAST_PLATFORM_VISION.md) — vision only; revisit after MVP |

> **Future Vision — IMMIFIN Immigration Broadcast Platform:** Documented in `docs/IMMIGRATION_BROADCAST_PLATFORM_VISION.md`. Parked until after the July 16, 2026 MVP release.

---

## Related documentation

| Document | Role |
|----------|------|
| [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) | Authoritative project state |
| [SPRINT_5_SIGNOFF.md](./SPRINT_5_SIGNOFF.md) | Sprint 5 formal sign-off |
| [SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md) | Sprint 5 deliverables and constraints |
| [SPRINT_6_HANDOFF.md](./SPRINT_6_HANDOFF.md) | Sprint 6 — **planned vs completed**; Stripe = next sprint |
| [NOTIFICATION_PLATFORM_SIGNOFF.md](./NOTIFICATION_PLATFORM_SIGNOFF.md) | **Notification Platform v1.0** — Production Validated |
| [NOTIFICATION_DESIGN.md](./NOTIFICATION_DESIGN.md) | **Notification Platform blueprint** — architecture, roadmap, milestones |
| [IMMIGRATION_BROADCAST_PLATFORM_VISION.md](./IMMIGRATION_BROADCAST_PLATFORM_VISION.md) | **Parked future vision** — Broadcast Platform (post-MVP) |
| [CALCULATORS.md](./CALCULATORS.md) | Live + planned calculators |
| [design-system/VISA_STAMPING_WAIT_MAP_2.0.md](./design-system/VISA_STAMPING_WAIT_MAP_2.0.md) | Visa Stamping Wait Map DS 2.0 page record |
| [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md) | Admin MVP + access model |
| [RELEASE_NOTES_v0.4.2.md](./RELEASE_NOTES_v0.4.2.md) | v0.4.2 release notes |
| [deployment/CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md) | Deployment guide |
