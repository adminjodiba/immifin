# ADR-007 — Development Subscription Mode

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-07-05 |
| **Sprint** | Sprint 5 |
| **Tasks** | S5-ENG-004, S5-ENG-005, S5-ENG-006 |

---

## Context

IMMIFIN requires Free / Pro / Power subscription testing before Stripe billing is integrated. The capability-based authorization model (`lib/subscription/capabilities.ts`) and business tiers are defined in [BUSINESS_MODEL.md](../BUSINESS_MODEL.md), but real payment infrastructure is not yet available.

Engineers and beta testers need to:

- Activate and switch subscription tiers without payment
- Persist plan selection across sessions
- Verify Pro and Power feature gating in production-like conditions

---

## Decision

Implement **Development Subscription Mode** — a temporary subscription activation flow gated by `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE=true`.

### Architecture

```
User
  ↓
Pricing Page / Account Panel (UI)
  ↓
PATCH /api/account/subscription (dev mode guard)
  ↓
updateSubscriptionPlan() → profiles.plan + subscriptions.plan (Supabase)
  ↓
SubscriptionTierProvider / useEffectiveSubscriptionTier
  ↓
hasCapability() / canAccess*()
  ↓
Application Features (gates)
```

### Key components

| Layer | File |
|-------|------|
| Feature flag | `lib/subscription/devSubscriptionMode.ts` |
| Plan mapping | `lib/subscription/plan.ts` |
| Service | `lib/subscription/service.ts` |
| Persistence | `lib/supabase/profiles.ts` → `updateSubscriptionPlan()` |
| API | `app/api/account/subscription/route.ts` |
| Client state | `lib/hooks/SubscriptionTierProvider.tsx` |
| Effective tier | `lib/hooks/useEffectiveSubscriptionTier.ts` |
| Pricing UI | `components/pricing/PricingPlans.tsx` |
| Account UI | `components/subscription/DevelopmentSubscriptionPanel.tsx` |

### Persistence

- **Field:** `plan` on `profiles` and `subscriptions` tables (`AppPlan`: `free`, `pro`, `power`)
- **Not used:** localStorage for plan state (legacy `devTier` localStorage override disabled when dev subscription mode is on)
- **Stripe compatibility:** Future Stripe webhooks update the same `plan` field

---

## Why Stripe is postponed

| Reason | Detail |
|--------|--------|
| Foundation first | Capability model and UI gates must work before billing |
| Beta testing | Need tier switching without payment friction |
| Scope control | Stripe adds webhooks, checkout, portal, and compliance surface |
| Roadmap | Stripe targeted for Sprint 10 (Commercial Launch Readiness) |

---

## Why Development Mode exists

- Test full Free → Pro → Power user journeys
- Validate feature gates (Visa Bulletin History, Movement Tracker, Dashboard, Profile)
- Beta testers can self-serve tier changes via `/pricing` and `/account`
- No fake payment UI — explicit "no payment collected" messaging

---

## How to enable

**Local:** `.env.local`

```
NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE=true
```

**Production:** Cloudflare **Build Variable** (required for client/prerender UI):

```
NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE=true
```

See [DEPLOYMENT_TROUBLESHOOTING.md](../deployment/DEPLOYMENT_TROUBLESHOOTING.md) — runtime-only vars are insufficient.

---

## How to disable later

1. Remove or set `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE=false` in Build Variables
2. Rebuild and deploy production
3. Pricing page reverts to Coming Soon CTAs until Stripe connects
4. `PATCH /api/account/subscription` returns 403 when flag is off
5. Remove dev UI panels when no longer needed (optional cleanup)

---

## Migration path to Stripe

1. Stripe Checkout creates/updates subscription
2. Stripe webhook handler calls `updateSubscriptionPlan()` (same function as dev mode)
3. `profiles.plan` and `subscriptions.plan` updated with Stripe-derived tier
4. Capability authorization unchanged — still `hasCapability(tier, key)`
5. Disable Development Subscription Mode flag
6. Replace dev activation UI with Stripe checkout on `/pricing`

---

## Benefits

- Full tier testing without payment infrastructure
- Same persistence path as future Stripe integration
- Capability authorization preserved — no parallel gating system
- Clear UX labeling ("Development Subscription Mode", not "fake subscription")

---

## Risks

| Risk | Mitigation |
|------|------------|
| Dev mode left on in production | Intentional for beta until Stripe; disable flag when billing ships |
| Build vs runtime env confusion | Documented in deployment guides; Build Variable required |
| Users expect real billing | Clear copy: "No payment is collected" |
| `power` enum migration | `supabase/migrations/20260705120000_016_app_plan_power.sql` adds `power` to `app_plan` |

---

## Related documentation

- [BUSINESS_MODEL.md](../BUSINESS_MODEL.md) — tier definitions and capability matrix
- [SYSTEM_ARCHITECTURE.md §17](../SYSTEM_ARCHITECTURE.md#17-subscription-architecture) — subscription architecture
- [CLOUDFLARE_DEPLOYMENT.md](../deployment/CLOUDFLARE_DEPLOYMENT.md) — build variables
- [RELEASE_NOTES_v0.4.1.md](../RELEASE_NOTES_v0.4.1.md) — Subscription Foundation section
