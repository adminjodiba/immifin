# AGENTS.md

## Cursor Cloud specific instructions

Immifin is a single Next.js 15 (App Router) + TypeScript web app. There are no separate backend services — API routes live under `app/api/`. See `README.md` and `docs/SYSTEM_ARCHITECTURE.md` for details. Dependencies are installed automatically by the startup update script (`npm install`).

### Running the app
- Dev server: `npm run dev` → http://localhost:3000. This is the only service to run for local development.
- Do NOT use `npm run dev:local` — it is a Windows/PowerShell-only launcher (`scripts/dev-start.ps1`) that also needs `cloudflared`; it does not work on Linux.
- `npm run preview` / `npm run deploy` are OpenNext + Cloudflare Workers commands for production only; not needed for local dev.

### Auth / credentials (important, non-obvious)
- Clerk `clerkMiddleware` wraps the whole app (`middleware.ts`), but when no Clerk env vars are set the app runs in Clerk **keyless mode** and boots fine — all public routes work with no credentials needed.
- Public, no-credential surfaces (good for verifying the environment without secrets): `/`, `/pricing`, `/calculators/*`, `/immigration/h1b-lottery-odds-calculator`, `/immigration/h1b-wage-level-estimator`, `/immigration/visa-stamping-wait-map`, and the public APIs `/api/visa-stamping-wait-times` (requires a `visaType` query param) and `/api/check-priority-date`.
- Visa bulletin / stamping data is pulled live from a hardcoded published Google Sheets CSV (`lib/visaBulletinConfig.ts`, `lib/visaStampingConfig.ts`) — needs outbound network but no credentials.
- Auth-gated flows require real secrets: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` (Clerk) and `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (Supabase). Routes under `/api/account/*`, `/api/visa-bulletin*`, and the visa-bulletin dashboard pages are Clerk-protected (return a Clerk protect-rewrite / 404 when signed out) and the account APIs also throw without Supabase creds. `GOOGLE_*` vars are only needed for the admin archive/refresh routes. Copy `.env.example` → `.env.local` to override defaults.

### Lint / test / build
- Lint: `npm run lint` (currently passes with only warnings).
- There is no automated test framework in this repo; verification is manual via the browser or curl against the public routes above.
- Build: `npm run build` (Next.js production build). Note: `next dev` and `next build` share the `.next/` directory — do not run them simultaneously.
