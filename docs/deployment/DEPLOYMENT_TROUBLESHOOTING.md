# Deployment Troubleshooting

**Last updated:** 2026-07-05  
**Incident:** Production Pricing page showed "Coming Soon" while localhost showed Development Subscription Mode

---

## Problem

Production showed the old Pricing page UI ("Coming Soon" on Pro and Power cards) while localhost correctly rendered Development Subscription Mode with Upgrade / Switch / Current Plan buttons.

---

## Symptoms

| Environment | Behavior |
|-------------|----------|
| **Localhost** | Development Subscription Mode banner visible; tier-aware pricing buttons |
| **Production** | Pro/Power cards showed disabled **Coming Soon** buttons |
| **Deploy status** | Cloudflare builds succeeded; latest commits deployed |
| **Runtime env** | `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE=true` present in Cloudflare Dashboard |

---

## Investigation steps performed

1. **Compared localhost vs production HTML**
   - Production: `x-nextjs-prerender: 1`, Coming Soon in initial HTML
   - Localhost: dev-mode banner in HTML, no prerender header

2. **Compared JS bundles**
   - Production bundle contained both `Development Subscription Mode` and `Coming Soon` strings
   - Bundle included: `"true"===n.env.NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE`
   - Confirmed new `PricingPlans` component was deployed (not legacy inline page)

3. **Verified GitHub commits**
   - `ef412e0` — Development Subscription Mode implementation
   - `b64317c` — Pricing UX polish
   - Commits pushed to `origin/main`

4. **Verified Cloudflare builds**
   - Deployments triggered after pushes (e.g. 2026-07-05 18:31 UTC, 19:01 UTC)
   - Build command: `npm run deploy`

5. **Verified component logic**
   - `components/pricing/PricingPlans.tsx` branches on `isDevSubscriptionModeEnabled()`
   - `lib/subscription/devSubscriptionMode.ts` reads `process.env.NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE === "true"`

6. **Verified production bundle evaluation**
   - Flag read at build/prerender time, not from runtime Worker env
   - HTML frozen with Coming Soon branch when flag was absent during build

---

## Root cause

**`NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE` was missing from Cloudflare Build Variables during the production build.**

`NEXT_PUBLIC_*` environment variables in Next.js are:

- Inlined into client JavaScript bundles at **build time**
- Evaluated during **static prerender** of pages like `/pricing`

Setting the variable as a **runtime-only** Worker variable does not update prerendered HTML or client bundles after deploy. The build ran with the flag unset (`false`), so production rendered the fallback branch:

```tsx
// devMode === false → Coming Soon for Pro/Power
```

---

## Resolution

1. Added `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE=true` as a **Cloudflare Build Variable** (not runtime-only)
2. Triggered a full rebuild (empty commits + push to `main`):
   - `63be74b` — deployment check
   - `383ba12` — rebuild with dev subscription mode enabled
   - `5f40203` — rebuild after enabling build variable
3. Verified production `/pricing` after deploy completes

---

## Lessons learned

| Lesson | Detail |
|--------|--------|
| **`NEXT_PUBLIC_*` = build-time** | Must be present when `opennextjs-cloudflare build` runs |
| **Runtime vars ≠ client UI** | Worker runtime secrets/vars cannot change prerendered HTML or client bundles |
| **Verify Build Variables separately** | Dashboard has distinct Build vs Runtime variable sections |
| **Always rebuild after Build Variable changes** | Push commit or retry deployment — runtime-only changes are insufficient |
| **Compare HTML + JS + headers** | `x-nextjs-prerender: 1` indicates build-time frozen content |
| **Localhost is not production** | `npm run dev` reads `.env.local` per-request; production uses build-time env |

---

## Prevention checklist

Before concluding a feature flag "doesn't work" in production:

- [ ] Is it a `NEXT_PUBLIC_*` variable? → Must be a **Build Variable**
- [ ] Was a full rebuild triggered after adding/changing the variable?
- [ ] Does production HTML (view source) match expected UI?
- [ ] Does the client JS bundle contain the expected inlined value?
- [ ] Are you comparing signed-in vs signed-out behavior correctly?

---

## Related files

| File | Role |
|------|------|
| `lib/subscription/devSubscriptionMode.ts` | Feature flag read |
| `components/pricing/PricingPlans.tsx` | UI branch (dev mode vs Coming Soon) |
| `app/pricing/page.tsx` | Renders `PricingPlans` |
| `wrangler.jsonc` | Worker config (does not include dev subscription flag) |
| `.env.example` | Documents `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE` |

See [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) for the full deployment guide.
