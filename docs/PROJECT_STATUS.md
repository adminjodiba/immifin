# Immifin — Project Status

**Last updated:** 2026-07-05  
**Version:** v0.4.1 Foundation Release + Sprint 5 Subscription Foundation  
**Latest production commit:** `5f40203` — *chore: rebuild after enabling NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE*  
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
| **Design System 2.0** | 🔄 In Progress — Visa Bulletin History promoted |
| **Stripe billing** | ⏳ Pending |

---

## Completed (Sprint 5 — Subscription Foundation)

| Deliverable | Commit / reference |
|-------------|-------------------|
| Development Subscription Mode | `ef412e0` |
| Pricing UX polish | `b64317c` |
| User plan persistence | `profiles.plan` + `subscriptions.plan` |
| Subscription API | `/api/account/subscription` |
| Cloudflare deployment docs | `docs/deployment/` |
| Build variable incident resolved | 2026-07-05 |

---

## Pending

| Item | Notes |
|------|-------|
| ⏳ Stripe | Checkout, webhooks, billing portal |
| ⏳ Payment Webhooks | Not integrated |
| ⏳ Billing Portal | Not built |
| ⏳ Subscription Management | Real billing UI deferred |
| ⏳ Remaining DS 2.0 page redesigns | Sprint 5 continued |

---

## Related documentation

| Document | Role |
|----------|------|
| [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) | Authoritative project state |
| [RELEASE_NOTES_v0.4.1.md](./RELEASE_NOTES_v0.4.1.md) | Subscription Foundation section |
| [deployment/CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md) | Deployment guide |
| [deployment/DEPLOYMENT_TROUBLESHOOTING.md](./deployment/DEPLOYMENT_TROUBLESHOOTING.md) | Build variable incident |
