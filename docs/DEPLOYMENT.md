# Immifin — Deployment Guide

**Last updated:** 2026-09-24 (SEC-IP-PROD-012 — Worker `25c7449e-a287-4c0a-ac41-d319d40499ba` · commit `6b7bf1dafa3ca20d19981c7af8030bed74a34e07`)

**Production domain:** https://immifin.com

**Production Worker version:** `25c7449e-a287-4c0a-ac41-d319d40499ba`

**Production deployment commit:** `6b7bf1dafa3ca20d19981c7af8030bed74a34e07`

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
| `wrangler.jsonc` | Worker bindings, public `vars`, custom `main`, DST-safe Chicago crons, Durable Object migrations **v1** + **v2** |
| `cloudflare/custom-worker.ts` | Scheduled daily sheet sync; `fetch` delegated to OpenNext; re-exports `DOQueueHandler` and `AbuseGate` |
| `package.json` | `deploy` and `preview` scripts |

Runtime secret **names** (values never documented): `DAILY_SHEET_SYNC_SECRET` (scheduled sync); `ABUSE_IDENTITY_SECRET` (AbuseGate HMAC; Production PRESENT). Feature flag `IMMIFIN_ABUSE_GATE_ENABLED` is UNSET in Production (enabled).

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

Prefer dashboard recovery over force-push to `main`. Safe rollback is **post-v2 only**. Any Worker promoted during rollback must retain:

- migration **v1** — `DOQueueHandler` / `NEXT_CACHE_DO_QUEUE`
- migration **v2** — `AbuseGate` / `ABUSE_GATE`
- existing R2 incremental cache binding, D1 tag cache binding, and `WORKER_SELF_REFERENCE`

**Do not promote a pre-v2 Worker**, including previous `origin/main` `29550ab20a58956649e001c5dbd248bb89e1d79a`. Production HUD/OFLC datasets stay ACTIVE during Worker rollback.

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
