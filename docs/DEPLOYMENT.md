# Immifin — Deployment Guide

**Last updated:** 2026-07-05  
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
| **Build command** | `npm run deploy` |
| **Deploy command** | `echo done` |
| **Node version** | 22.x |
| **Branch** | `main` |

The deploy command is `echo done` because `npm run deploy` already runs `opennextjs-cloudflare deploy` inside the build script.

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
| **Build Variables** | During `opennextjs-cloudflare build` | `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| **Runtime Secrets** | Each Worker request | `CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

See [deployment/CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md) for the full variable list and [deployment/DEPLOYMENT_TROUBLESHOOTING.md](./deployment/DEPLOYMENT_TROUBLESHOOTING.md) for the pricing page incident.

---

## Repository configuration

| File | Purpose |
|------|---------|
| `open-next.config.ts` | OpenNext Cloudflare adapter |
| `wrangler.jsonc` | Worker bindings, public `vars` |
| `package.json` | `deploy` and `preview` scripts |

---

## Official deployment workflow

1. Develop locally — `npm run dev`
2. Test localhost — verify pages, auth, APIs
3. Test dev.immifin.com — when auth/webhooks changed
4. `git commit` — descriptive message
5. `git push origin main`
6. Cloudflare automatically runs `npm run deploy`
7. Verify production — https://immifin.com

---

## Rollback

Cloudflare Dashboard → Workers & Pages → immifin → Deployments → select last known good deployment.

Prefer dashboard rollback over force-push to `main`.

---

## Related documentation

| Document | Contents |
|----------|----------|
| [deployment/CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md) | Full deployment guide |
| [deployment/DEPLOYMENT_TROUBLESHOOTING.md](./deployment/DEPLOYMENT_TROUBLESHOOTING.md) | Build variable incident |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Infrastructure overview |
| [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) | Deployment best practices |
| [architecture/ADR-007-Development-Subscription-Mode.md](./architecture/ADR-007-Development-Subscription-Mode.md) | Dev subscription mode |
