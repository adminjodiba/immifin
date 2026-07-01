# IMMIFIN Local Development Setup

Standard local development, webhook, and release workflow for IMMIFIN. Follow this document at the start of every development session and before any Clerk webhook or auth testing.

See also: [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Required Software

| Tool | Purpose |
|------|---------|
| **Node.js LTS** | Next.js runtime (`npm run dev`, `npm run build`) |
| **Git** | Version control |
| **Cursor** | Primary IDE / AI-assisted development |
| **Cloudflared** | Dev HTTPS tunnel for `dev.immifin.com` and Clerk webhooks |
| **Supabase CLI** | Migrations and remote database operations (`supabase login`, `supabase db push`) |
| **npm** | Package manager (included with Node.js) |

Install cloudflared (Windows):

```powershell
winget install Cloudflare.cloudflared
```

Open a **new terminal** after install so `cloudflared` is on `PATH`.

---

## First-time machine setup

### 1. Clone repository

```powershell
git clone https://github.com/adminjodiba/immifin.git
cd immifin
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Copy environment file

```powershell
copy .env.example .env.local
```

Fill in all required values in `.env.local`. Never commit this file.

### 4. Verify Clerk keys

In `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
```

- Keys must match the **same Clerk development instance** used in the Clerk Dashboard.
- Webhook signing secret comes from **Clerk Dashboard → Webhooks → your endpoint → Signing secret**.
- Clerk SDK v7 reads **`CLERK_WEBHOOK_SIGNING_SECRET`** (not `CLERK_WEBHOOK_SECRET` alone).

### 5. Verify Supabase keys

In `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Confirm the project matches the environment where migrations were applied.

### 6. Log in to Supabase CLI

```powershell
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

Apply migrations when needed:

```powershell
npx supabase db push
```

### 7. Log in and configure Cloudflared

One-time tunnel authentication:

```powershell
cloudflared tunnel login
cloudflared tunnel list
```

Expected dev tunnel:

| Setting | Value |
|---------|-------|
| **Tunnel name** | `immifin-dev` |
| **Public URL** | `https://dev.immifin.com` |
| **Local origin** | `http://localhost:3000` |

Clerk Dev webhook endpoint:

```text
https://dev.immifin.com/api/webhooks/clerk
```

---

## Daily development workflow

Every development session that touches **auth, webhooks, profile sync, or onboarding** must include a healthy Cloudflare tunnel.

### Option A — One command (recommended)

```powershell
npm run dev:local
```

Starts **Next.js** and the **Cloudflare tunnel** together. Press **Ctrl+C** to stop both.

### Option B — Manual (two steps)

**Step 1 — Start Next.js**

```powershell
npm run dev
```

Verify: `http://localhost:3000` loads.

**Step 2 — Start Cloudflare tunnel**

```powershell
cloudflared tunnel run immifin-dev
```

Or set a custom tunnel name:

```powershell
$env:IMMIFIN_DEV_TUNNEL_NAME = "immifin-dev"
npm run dev:local
```

### Verify tunnel health

Before webhook or auth callback testing:

```powershell
cloudflared tunnel info immifin-dev
```

Confirm:

- Tunnel status is **Healthy** (or connections are active)
- `https://dev.immifin.com` resolves and reaches your local app

Quick check in browser: open `https://dev.immifin.com` — it should show the same app as localhost.

### Critical note — tunnel must be running

If the Cloudflare tunnel is **DOWN**, the following **will fail**:

- Clerk webhooks (`user.created`, `user.updated`, `user.deleted`)
- Email OTP / auth callbacks that depend on public HTTPS
- Any webhook-based Supabase profile synchronization

**Typical symptom:**

- Cloudflare HTTP **530**
- Cloudflare Error **1033**

**Never begin webhook testing until the tunnel is healthy.**

---

## Local verification checklist

Before testing any feature (especially auth, profile, or webhooks):

- [ ] `npm run build` passes
- [ ] `http://localhost:3000` loads
- [ ] Cloudflare tunnel is running (`npm run dev:local` or manual tunnel)
- [ ] `https://dev.immifin.com` loads
- [ ] Clerk Dev webhook endpoint is reachable (`https://dev.immifin.com/api/webhooks/clerk`)
- [ ] Supabase connected (profile APIs return data, not config errors)

---

## Webhook troubleshooting

If a Clerk webhook fails:

### 1. Check Clerk Dashboard

**Clerk Dashboard → Webhooks → Message Attempts**

Inspect the failed delivery: event type, timestamp, HTTP status, response body.

### 2. Confirm endpoint URL

Dev endpoint must be:

```text
https://dev.immifin.com/api/webhooks/clerk
```

Production endpoint (separate):

```text
https://immifin.com/api/webhooks/clerk
```

### 3. Interpret response codes

| Code | Meaning |
|------|---------|
| **200** | Success — webhook verified and handled |
| **530 / 1033** | Tunnel offline — start `cloudflared tunnel run immifin-dev` |
| **400** | Webhook verification failed — check signing secret or payload |
| **401** | Auth / middleware blocked request (should not happen on webhook route) |
| **500** | Application or Supabase error — check server logs |

### 4. Confirm signing secret

In `.env.local`:

```env
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
```

Must match **Clerk Dashboard → Webhooks → Signing secret** for that endpoint exactly.

Restart the dev server after changing `.env.local`.

---

## Release checklist

Before **every push** to `main`:

1. **`git status`** — working tree must be clean (or only intentional staged work).

2. **`npm run build`** — must pass with no errors.

3. **Verify Cloudflare tunnel** — required if webhook, auth, profile, or onboarding code changed:
   - Tunnel healthy
   - `https://dev.immifin.com` reachable
   - Clerk webhook test or replay returns **200**

4. **Smoke test** (as applicable to the change):

   - [ ] Login
   - [ ] Signup
   - [ ] Email OTP (if enabled in Clerk Dashboard)
   - [ ] User Profile (`/user-profile`)
   - [ ] Contact tab
   - [ ] Notifications tab
   - [ ] Green Card calculator
   - [ ] Citizenship calculator
   - [ ] Visa Bulletin

5. **`git push origin main`**

6. **Verify Cloudflare production deployment** at `https://immifin.com`

---

## Engineering rules

### Mandatory tunnel workflow

Whenever implementation work involves any of the following:

- Clerk
- Authentication
- Webhooks
- User lifecycle (`user.created`, `user.updated`, `user.deleted`)
- Profile synchronization
- Email OTP
- Contact onboarding

The developer **must**:

1. **Start the Cloudflare development tunnel** (`npm run dev:local` or `cloudflared tunnel run immifin-dev`).
2. **Verify the tunnel is healthy** before testing (`cloudflared tunnel info immifin-dev`, `https://dev.immifin.com` loads).
3. **Verify Clerk webhook delivery** in the Dashboard (Message Attempts shows **200**) before concluding there is an application code bug.

This is a **mandatory** IMMIFIN development workflow. See [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) §10.

---

## Lessons learned

### Incident: Clerk user deletion appeared to fail (2026-07)

**Reported problem:** Deleting a user in Clerk did not soft-delete the corresponding Supabase profile (`profiles.status` stayed `active`).

**Investigation assumption:** Application webhook handler or `soft_delete_profile_by_clerk_id` RPC was broken.

**Actual root cause:** The **Cloudflare development tunnel was offline**. Clerk could not deliver `user.deleted` to:

```text
https://dev.immifin.com/api/webhooks/clerk
```

**Observed symptom:**

- Cloudflare HTTP **530**
- Cloudflare Error **1033**

**Conclusion:** The application code path (`user.deleted` → `softDeleteProfileByClerkId`) was correct. The webhook never reached the app.

**Lesson:** **Always verify infrastructure (tunnel health, webhook delivery, signing secret) before debugging application logic.**

---

## Optional environment overrides

| Variable | Default | Purpose |
|----------|---------|---------|
| `IMMIFIN_DEV_TUNNEL_NAME` | `immifin-dev` | Cloudflare tunnel name |
| `IMMIFIN_DEV_PORT` | `3000` | Local Next.js port (wait/check only) |
| `IMMIFIN_DEV_PUBLIC_URL` | `https://dev.immifin.com` | Printed public dev URL |
| `CLOUDFLARED_PATH` | auto-detect | Full path to `cloudflared.exe` |

---

## Related commands

```powershell
npm run dev              # Next.js only (localhost)
npm run dev:local        # Next.js + Cloudflare tunnel
npm run build            # Production build gate
cloudflared tunnel list
cloudflared tunnel info immifin-dev
cloudflared tunnel run immifin-dev
```
