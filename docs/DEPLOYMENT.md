# Immifin — Deployment Guide

**Last updated:** 2026-09-20 (S7A-SUPABASE-PROD-CUTOVER-CLOSE-001 — `immifin.com` uses Production Supabase `pmkx...ysdv`)  
**Production domain:** https://immifin.com

> **Authoritative deployment reference:** [deployment/CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md)  
> **Troubleshooting:** [deployment/DEPLOYMENT_TROUBLESHOOTING.md](./deployment/DEPLOYMENT_TROUBLESHOOTING.md)

---

## Overview

Immifin deploys to **Cloudflare Workers** using the **OpenNext Cloudflare adapter** (`@opennextjs/cloudflare`). Production is served at **https://immifin.com**.

Pushing to the `main` branch triggers an automatic build and deploy via the GitHub → Cloudflare pipeline.

### Deployment flow

```
Cursor → Commit → GitHub main → Cloudflare Git Build → OpenNext Build → Wrangler Deploy → Production
```

---

## Build configuration

| Setting | Value |
|---------|-------|
| **Build command** | `npx @opennextjs/cloudflare build` |
| **Deploy command** | `npx wrangler deploy` |
| **Node version** | 22.x |
| **Branch** | `main` |

Wrangler 4.105.0 uses the OpenNext deploy path (including cache population). The stale pair `npm run deploy` + `echo done` is **not** the live Cloudflare Builds pipeline. See [deployment/CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md).

### Why OpenNext (not plain `next build`)?

| Command | What it does |
|---------|----------------|
| `npm run build` | Next.js only — **not sufficient** for Cloudflare Workers |
| `opennextjs-cloudflare build` | Next.js + Worker bundle (`.open-next/`) |
| `npm run deploy` | OpenNext build **and** deploy |

---

## Build Variables vs Runtime Variables

**Critical:** `NEXT_PUBLIC_*` variables must be set as **Cloudflare Build Variables**, not runtime-only.

| Type | When evaluated | Example |
|------|----------------|---------|
| **Build Variables** | During `opennextjs-cloudflare build` | `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` |
| **Runtime Secrets** | Each Worker request | `CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `IMMIFIN_WRITE_FREEZE` |

`NEXT_PUBLIC_SUPABASE_URL` is also a Production runtime secret. Live `immifin.com` uses Production Supabase `pmkx...ysdv`. Localhost stays on Dev `vnhn...toxs`. Details: [deployment/CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md) and [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md).

See [deployment/CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md) for the full variable list and [deployment/DEPLOYMENT_TROUBLESHOOTING.md](./deployment/DEPLOYMENT_TROUBLESHOOTING.md) for the pricing page incident.

---

## Repository configuration

| File | Purpose |
|------|---------|
| `open-next.config.ts` | OpenNext Cloudflare adapter (R2 incremental cache, D1 tag cache, Durable Object queue) |
| `wrangler.jsonc` | Worker bindings, public `vars`, custom `main`, DST-safe Chicago crons |
| `cloudflare/custom-worker.ts` | Scheduled daily sheet sync; `fetch` delegated to OpenNext; re-exports `DOQueueHandler` |
| `package.json` | `deploy` and `preview` scripts |

Runtime secret **name** required for scheduled sync: `DAILY_SHEET_SYNC_SECRET` (Cloudflare Worker secret or local `.dev.vars`). Do not commit or print the value. Cron does not run until Production is deployed with that secret set.

---

## Official deployment workflow

1. Develop locally — `npm run dev`
2. Test localhost — verify pages, auth, APIs
3. Test dev.immifin.com — when auth/webhooks changed
4. `git commit` — descriptive message
5. `git push origin main`
6. Cloudflare automatically runs `npx @opennextjs/cloudflare build` then `npx wrangler deploy`
7. Verify production — https://immifin.com

---

## Rollback

Prefer dashboard recovery over force-push to `main`. Use only a **post–migration v1** Worker (must retain `DOQueueHandler` and migration **v1**). **Do not promote a pre-v1 Worker.** Recovery should normally be a **forward deployment** that keeps migration v1, `DOQueueHandler`, and the R2/D1/DO bindings.

Authoritative rollback: [deployment/CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md).

---

## Related documentation

| Document | Contents |
|----------|----------|
| [deployment/CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md) | Full deployment guide |
| [deployment/DEPLOYMENT_TROUBLESHOOTING.md](./deployment/DEPLOYMENT_TROUBLESHOOTING.md) | Build variable incident |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Infrastructure overview |
| [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) | Deployment best practices |
| [architecture/ADR-007-Development-Subscription-Mode.md](./architecture/ADR-007-Development-Subscription-Mode.md) | Dev subscription mode |
