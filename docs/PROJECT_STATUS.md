# Immifin — Project Status

**Last updated:** 2026-07-06  
**Version:** v0.4.2  
**Latest production commit:** `71d5add` — *Release v0.4.2: dashboard polish, favorites, DS 2.0 workspace, and Pro calculator auto-fill*  
**Development workflow:** v2.1 (see [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md))

> **Authoritative status:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) supersedes this document for current production state.

---

## Overall status

**Production Stable**

| Area | Status |
|------|--------|
| **Infrastructure** | ✅ Complete — Cloudflare OpenNext auto-deploy |
| **Authentication** | ✅ Complete |
| **Deployment** | ✅ Complete — Build vs Runtime variables documented |
| **Subscription Foundation** | ✅ Complete — Development Subscription Mode |
| **Design System 2.0** | 🔄 In Progress — Visa Bulletin pages promoted; workspace shell + dashboard polish shipped |
| **Stripe billing** | ⏳ Pending |

---

## Completed (Sprint 5)

| Deliverable | Reference |
|-------------|-----------|
| Development Subscription Mode | `ef412e0` |
| Pricing UX polish | `b64317c` |
| Visa Bulletin DS 2.0 (History, Movement, Dashboard) | S5-004, S5-007, S5-008 |
| Workspace page shell | `WorkspacePageShell` — site-wide |
| My Immifin dashboard polish | v0.4.2 — [MY_IMMIFIN_DASHBOARD_2.0.md](./design-system/MY_IMMIFIN_DASHBOARD_2.0.md) |
| Favorites (Pro/Power) | `/api/account/favorites` |
| Pro calculator auto-population | Green Card Wait Time + Citizenship |
| Subscription data retention policy | `lib/subscription/dataRetention.ts` |

---

## Pending

| Item | Notes |
|------|-------|
| ⏳ Stripe | Checkout, webhooks, billing portal |
| ⏳ Payment Webhooks | Not integrated |
| ⏳ Billing Portal | Not built |
| ⏳ Subscription Management | Real billing UI deferred |
| ⏳ Remaining DS 2.0 page redesigns | Homepage, Manage Profile full polish |

---

## Related documentation

| Document | Role |
|----------|------|
| [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) | Authoritative project state |
| [RELEASE_NOTES_v0.4.2.md](./RELEASE_NOTES_v0.4.2.md) | v0.4.2 release notes |
| [SPRINT_5_HANDOFF.md](./SPRINT_5_HANDOFF.md) | Sprint 5 deliverables and constraints |
| [deployment/CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md) | Deployment guide |
