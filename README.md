# Immifin

A production-ready Next.js 15 website helping immigrants navigate visas, taxes, investing, credit, and citizenship in America.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Clerk** — authentication
- **Supabase** — application database
- **Cloudflare Workers** — production hosting via **OpenNext** (`@opennextjs/cloudflare`)
- **SEO optimized** (metadata, sitemap, robots.txt, Open Graph)

## Production Status (2026-06-27)

| Area | Status |
|------|--------|
| immifin.com | ✅ Live |
| Clerk auth (login, signup, header) | ✅ Verified |
| OpenNext deployment | ✅ Restored |
| Visa Bulletin Dashboard (Dates for Filing) | 🔄 In progress |

Latest production commit: `123bbdb` — *Add Cloudflare OpenNext deployment configuration*

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ recommended
- npm
- Cloudflare account (production deploys)

## Installation

```bash
cd C:\Projects\immifin
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development server |
| `npm run build` | Next.js build only (local verification) |
| `npm run preview` | OpenNext build + local Workers preview |
| `npm run deploy` | OpenNext build + deploy to Cloudflare |

**Note:** `npm run build` alone is **not** sufficient for Cloudflare Workers. Production uses OpenNext (`opennextjs-cloudflare build`).

## Deployment

Production deploys automatically when `main` is pushed to GitHub.

**Known stable configuration (verified 2026-06-27):** Cloudflare Workers + OpenNext, Node 22.x, build `npm run deploy`, deploy `echo done`.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full baseline, secrets, and workflow.

## Documentation

| Document | Contents |
|----------|----------|
| [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) | Current sprint and status |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Cloudflare / OpenNext deployment |
| [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) | Infrastructure architecture |
| [docs/ENGINEERING_PLAYBOOK.md](docs/ENGINEERING_PLAYBOOK.md) | Engineering workflow |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Release history |

## Project Structure

```
immifin/
├── app/                    # Next.js App Router pages and API routes
├── components/             # React components
├── lib/                    # Shared logic, auth, Supabase, visa bulletin
├── supabase/migrations/    # Database migrations
├── open-next.config.ts     # OpenNext Cloudflare config
├── wrangler.jsonc          # Cloudflare Worker config
└── docs/                   # Project documentation
```

## License

Private — All rights reserved.
