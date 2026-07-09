# Cloudflare Deployment Guide

**Last updated:** 2026-07-09  
**Production domain:** https://immifin.com  
**Worker name:** `immifin`

This document is the authoritative guide for IMMIFIN production deployment on Cloudflare Workers via OpenNext.

**Related:** [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md) · [SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md) · [DEPLOYMENT.md](../DEPLOYMENT.md) · [SPRINT_5_SIGNOFF.md](../SPRINT_5_SIGNOFF.md)

---

## Workers plan note (Error 1102)

IMMIFIN currently runs on the **Workers Free** plan. Free Workers are limited to ~**10 ms CPU** per request. OpenNext cold starts often need **~25–33 ms**, which can return **Cloudflare Error 1102** (`Worker exceeded resource limits`) intermittently.

| Action | Effect |
|--------|--------|
| **Upgrade to Workers Paid** | Allows raising `limits.cpu_ms` in `wrangler.jsonc` — **recommended** |
| Code optimizations (Sprint 5) | Slim Visa Stamping API; lazy history — reduces CPU but cannot beat Free hard cap on cold boot |
| Manual deploy | `npm run deploy` when Git auto-deploy lags |

Do **not** commit `limits.cpu_ms` while on Free — Cloudflare rejects the deploy.

---

## Deployment flow

```
Cursor (local development)
        ↓
Commit
        ↓
GitHub main
        ↓
Cloudflare Git Build (automatic on push to main)
        ↓
OpenNext Build (opennextjs-cloudflare build)
        ↓
Wrangler Deploy (opennextjs-cloudflare deploy)
        ↓
Production (https://immifin.com)
```

---

## Current build configuration

| Setting | Value |
|---------|-------|
| **Build command** | `npm run deploy` |
| **Deploy command** | `echo done` |
| **Node version** | 22.x |
| **Branch** | `main` (production) |
| **Git integration** | GitHub → Cloudflare automatic deployment |

The deploy command is `echo done` because `npm run deploy` already runs `opennextjs-cloudflare deploy` inside the build script. This satisfies Cloudflare's two-step build/deploy UI without deploying twice.

### Package.json scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run build` | `next build` | Next.js only — **not sufficient** for Cloudflare Workers |
| `npm run preview` | `opennextjs-cloudflare build && opennextjs-cloudflare preview` | Local Workers preview |
| `npm run deploy` | `opennextjs-cloudflare build && opennextjs-cloudflare deploy` | **Production build + deploy** |

### Version / deployment inspection

```bash
# List recent Worker deployments
npx wrangler deployments list --name immifin

# Put a runtime secret (server-only)
npx wrangler versions secret put VARIABLE_NAME
```

---

## Repository configuration files

| File | Purpose |
|------|---------|
| `open-next.config.ts` | OpenNext Cloudflare adapter configuration |
| `wrangler.jsonc` | Worker name, compatibility flags, asset bindings, public `vars` |
| `package.json` | `deploy` and `preview` scripts |

Generated output (gitignored): `.open-next/`, `.wrangler/`

---

## Branch strategy

| Branch | Environment | Deploy trigger |
|--------|-------------|----------------|
| `main` | Production | Automatic on push |
| Feature branches | Local / tunnel only | No automatic production deploy |

Preview deployments are planned but not yet the primary workflow.

---

## Environment variables

### Build Variables vs Runtime Variables

This distinction is **critical** for IMMIFIN.

| Type | When evaluated | Cloudflare location | Use for |
|------|----------------|---------------------|---------|
| **Build Variables** | During `opennextjs-cloudflare build` / `next build` | Dashboard → Builds → Build variables | `NEXT_PUBLIC_*` variables |
| **Runtime Variables / Secrets** | On each Worker request | Dashboard → Variables and Secrets (Production) | Server-only secrets, API keys |

**Rule:** All `NEXT_PUBLIC_*` variables must exist as **Build Variables** if they affect client bundles or prerendered HTML. Runtime-only variables cannot change prerendered UI after deploy.

Example: `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE=true` must be a **Build Variable** — see [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md).

### Required (Production)

Set in Cloudflare Dashboard or Wrangler Version Secrets. Never commit values to Git.

| Variable | Purpose | Build or Runtime |
|----------|---------|------------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client key | **Build** |
| `CLERK_SECRET_KEY` | Clerk server key | Runtime (secret) |
| `CLERK_WEBHOOK_SECRET` | Webhook verification | Runtime (secret) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | **Build** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role | Runtime (secret) |
| `GOOGLE_SHEET_ID` | Google Spreadsheet ID | Runtime |
| `GOOGLE_CLIENT_EMAIL` | Service account email | Runtime (secret) |
| `GOOGLE_PRIVATE_KEY` | Service account key | Runtime (secret) |

### Optional

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Clerk sign-in path | `/login` (also in `wrangler.jsonc`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Clerk sign-up path | `/signup` (also in `wrangler.jsonc`) |
| `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE` | Development Subscription Mode | `false` (unset) — **Build Variable when enabled** |
| `VISA_BULLETIN_*` | Bulletin CSV overrides | Committed defaults in `lib/visaBulletinConfig.ts` |

### Local development

| File | Purpose |
|------|---------|
| `.env.local` | Next.js dev server (`npm run dev`) |
| `.dev.vars` | Wrangler / OpenNext preview |

See [.env.example](../../.env.example) for the full template.

---

## Production deployment process

1. Develop and test on `http://localhost:3000`
2. Verify tunnel (`https://dev.immifin.com`) when auth/webhooks changed
3. Run `npm run build` locally (type-check gate)
4. Commit with descriptive message
5. Push to `main`
6. Cloudflare automatically runs `npm run deploy`
7. Verify deployment in Cloudflare Dashboard → Deployments
8. Smoke test `https://immifin.com`

---

## How to rebuild production

After changing **Build Variables** (especially `NEXT_PUBLIC_*`):

1. Confirm the variable is set under **Build variables** (not only runtime)
2. Trigger a new build:
   - Push a commit to `main`, or
   - Use Cloudflare Dashboard → Retry deployment, or
   - Empty commit: `git commit --allow-empty -m "chore: rebuild production"`

Runtime variable changes alone do **not** rebuild client bundles or prerendered pages.

---

## How to verify deployment

| Check | How |
|-------|-----|
| Deploy completed | Cloudflare Dashboard → Workers → immifin → Deployments |
| Site loads | `https://immifin.com` returns 200 |
| Auth works | Sign in / sign up |
| Build ID / chunk changed | Inspect `/_next/static/chunks/` hashes after deploy |
| Feature flags | Verify UI matches expected env (e.g. `/pricing` dev mode banner) |
| API routes | Test protected endpoints (e.g. `/api/account/subscription` when signed in) |

Response headers on prerendered pages may include `x-nextjs-prerender: 1` and `x-opennext: 1`.

---

## How to rollback

1. Cloudflare Dashboard → Workers & Pages → immifin → Deployments
2. Select the last known good deployment
3. Roll back or promote to production

Prefer dashboard rollback over force-push to `main`.

---

## Common deployment problems

### `NEXT_PUBLIC_*` variable not taking effect

**Symptom:** Localhost shows new UI; production shows old UI (e.g. Coming Soon on `/pricing`).

**Cause:** Variable set as runtime-only, or build ran before variable was added.

**Fix:** Add as **Build Variable**; trigger full rebuild. See [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md).

### OpenNext build failures

- Verify Node 22.x in Cloudflare build settings
- Run `npm run deploy` locally to reproduce
- Check for TypeScript errors: `npx tsc --noEmit`
- Clear `.open-next/` locally if preview is stale

### Wrangler deployment failures

- Verify `wrangler.jsonc` worker name matches dashboard
- Confirm secrets are set via `npx wrangler versions secret put`
- Check Cloudflare build logs for auth or quota errors

### Worker runtime secrets missing

**Symptom:** API routes return 500; Clerk or Supabase calls fail in production only.

**Fix:** Set secrets in Cloudflare Dashboard → Variables and Secrets → Production, or via Wrangler.

### Prerendered HTML stale after deploy

**Symptom:** Client JS updated but initial HTML shows old content.

**Cause:** `NEXT_PUBLIC_*` was false/missing at build time; HTML baked with old branch.

**Fix:** Rebuild with correct Build Variables.

---

## Related documentation

| Document | Contents |
|----------|----------|
| [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md) | Production pricing / build variable incident |
| [SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md) | Full infrastructure reference |
| [ENGINEERING_PLAYBOOK.md](../ENGINEERING_PLAYBOOK.md) | Deployment best practices |
| [ADR-007](../architecture/ADR-007-Development-Subscription-Mode.md) | Development Subscription Mode decision |
