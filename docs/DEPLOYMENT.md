# Immifin — Deployment Guide

**Last updated:** 2026-06-27  
**Production commit:** `123bbdb` — *Add Cloudflare OpenNext deployment configuration*

---

## Overview

Immifin deploys to **Cloudflare Workers** using the **OpenNext Cloudflare adapter** (`@opennextjs/cloudflare`). Production is served at **https://immifin.com**.

Pushing to the `main` branch triggers an automatic build and deploy via the GitHub → Cloudflare pipeline.

---

## Known Stable Configuration (Verified: 2026-06-27)

This configuration is the **current production baseline** and should be treated as the **reference configuration** for future development.

### Hosting

- **Cloudflare Workers**
- **OpenNext** (`@opennextjs/cloudflare`)
- **GitHub Auto Deployment** (push to `main`)

### Cloudflare Build Settings

| Setting | Value |
|---------|-------|
| **Build command** | `npm run deploy` |
| **Deploy command** | `echo done` |

### Node Version

**22.x**

### Production Status

| Check | Status |
|-------|--------|
| immifin.com | ✅ |
| Login | ✅ |
| Signup | ✅ |
| Clerk Authentication | ✅ |
| Header Avatar | ✅ |
| Personalized Greeting | ✅ |
| GitHub Auto Deployment | ✅ |
| Cloudflare Deployment | ✅ |
| Localhost | ✅ |
| Development Environment | ✅ |

**Production commit:** `123bbdb` — *Add Cloudflare OpenNext deployment configuration*

---

## Why OpenNext (not plain `next build`)?

| Command | What it does |
|---------|----------------|
| `npm run build` | Runs **Next.js only** (`next build`). Produces the standard `.next` output for Node.js hosting. |
| `opennextjs-cloudflare build` | Runs Next.js **and** bundles the app for the **Cloudflare Workers** runtime (output in `.open-next/`). |
| `npm run deploy` | Runs `opennextjs-cloudflare build` **then** `opennextjs-cloudflare deploy`. |

A plain `npm run build` is **not sufficient** for Cloudflare Workers deployment. The OpenNext step transforms the Next.js build into a Worker-compatible bundle (`worker.js` + static assets).

---

## Cloudflare Dashboard — Build Settings

Configure under **Cloudflare Dashboard → Workers & Pages → immifin → Settings → Builds & deployments**:

| Setting | Value | Reason |
|---------|-------|--------|
| **Production build command** | `npm run deploy` | Runs the full OpenNext build **and** deploys the Worker in one step. |
| **Production deploy command** | `echo done` | Deploy is already handled inside `npm run deploy`. This satisfies Cloudflare’s two-step build/deploy UI without running deploy twice. |

### Local equivalents

```bash
# Next.js only (local type-check / standard build)
npm run build

# OpenNext bundle + local Workers preview
npm run preview

# OpenNext bundle + deploy to Cloudflare (CI / manual)
npm run deploy
```

---

## Repository Configuration Files

| File | Purpose |
|------|---------|
| `open-next.config.ts` | OpenNext Cloudflare adapter configuration |
| `wrangler.jsonc` | Worker name, compatibility flags, asset bindings, public vars |
| `package.json` | `deploy` and `preview` scripts |

Generated output (gitignored):

- `.open-next/` — OpenNext build output
- `.wrangler/` — Wrangler local state

---

## Environment Variables

### Required (Production)

Set in **Cloudflare Dashboard** or via **Wrangler Version Secrets** (see below). Never commit values to Git.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client-side key |
| `CLERK_SECRET_KEY` | Clerk server-side key |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signature verification |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server only) |
| `GOOGLE_SHEET_ID` | Google Spreadsheet ID (admin archive) |
| `GOOGLE_CLIENT_EMAIL` | Google service account email |
| `GOOGLE_PRIVATE_KEY` | Google service account private key |

### Optional

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Clerk sign-in path | `/login` (also in `wrangler.jsonc` vars) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Clerk sign-up path | `/signup` (also in `wrangler.jsonc` vars) |
| `VISA_BULLETIN_PUBLISH_BASE` | Published CSV base URL | Committed default in `lib/visaBulletinConfig.ts` |
| `VISA_BULLETIN_GID_*` | Sheet tab GID overrides | Committed defaults |
| `VISA_BULLETIN_HISTORY_SHEET` | Archive tab name | `VisaBulletinHistory` |

See `.env.example` for the full local development template.

### Local development

- **`.env.local`** — Next.js dev server (`npm run dev`); gitignored.
- **`.dev.vars`** — Wrangler / OpenNext preview; gitignored.

---

## Managing Secrets with Wrangler

**Do not hardcode secrets** in `wrangler.jsonc`, source code, or Git.

Use **Wrangler Version Secrets** for production:

```bash
npx wrangler versions secret put VARIABLE_NAME
```

You will be prompted to enter the value securely. Repeat for each required secret.

Secrets can also be configured in the **Cloudflare Dashboard → Workers & Pages → immifin → Settings → Variables and Secrets → Production**.

Public non-secret defaults (e.g. Clerk sign-in URLs) may live in `wrangler.jsonc` under `vars`.

---

## Official Deployment Workflow

1. **Develop locally** — `npm run dev` on `http://localhost:3000`
2. **Test localhost** — verify pages, auth, and APIs
3. **Test dev.immifin.com** — Cloudflare Tunnel to local dev
4. **`git add`** — stage approved changes only
5. **`git commit`** — descriptive message
6. **`git push`** — push to `main`
7. **Cloudflare automatically deploys** — build runs `npm run deploy`
8. **Verify production** — https://immifin.com immediately after deploy

---

## Rollback

1. **Cloudflare Dashboard** → Workers & Pages → immifin → Deployments
2. Select the last known good deployment
3. Roll back or promote to production

Prefer dashboard rollback over force-push to `main`.

---

## Current Production Status (2026-06-27)

| Area | Status |
|------|--------|
| immifin.com | ✅ Working |
| Login / Signup | ✅ Working |
| Clerk auth + header (avatar, greeting) | ✅ Working |
| OpenNext deployment | ✅ Working |
| GitHub → Cloudflare pipeline | ✅ Working |
| localhost dev | ✅ Working |
| Visa Bulletin Dashboard (Dates for Filing toggle) | ⚠️ In progress — see [PROJECT_STATUS.md](./PROJECT_STATUS.md) |

---

## Related documentation

- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) — infrastructure overview
- [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) — release gates and workflow
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) — sprint status
