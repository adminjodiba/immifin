# Sprint 7A — Google Search Foundation

| Field | Value |
|-------|-------|
| **Sprint** | Sprint 7A — Marketing, Go-To-Market & User Acquisition |
| **Story** | S7A-SEO-000 (runbook) · S7A-SEO-001 (Search Console) · S7A-SEO-002 (crawlability audit) · S7A-SEO-003 (sitemap integrity) · S7A-SEO-003A-DOC (dev tunnel recovery runbook) |
| **Document** | Google Search Foundation — Strategy & Execution Runbook |
| **Date** | 2026-08-26 |
| **Owner** | Product / Marketing documentation |
| **Status** | **PHASE A IN PROGRESS — S7A-SEO-003 LOCALHOST COMPLETE; SITEMAP NOT SUBMITTED TO SEARCH CONSOLE** |
| **Next executable step** | **S7A-SEO-004 — Product Owner review of sitemap integrity; do not submit to Search Console until approved** |

This document is the runbook for IMMIFIN’s first formal Google Search indexing and SEO-foundation work. It records locked strategy and the approved execution sequence **before any Search Console, crawl, or ranking work begins**.

Sprint 7A is a marketing / acquisition workstream. It is **separate from Sprint 8** (IMMIFIN Intelligence Platform / AI). Do not treat this document as Intelligence implementation or as a Production deploy authorization.

---

## A. Purpose

IMMIFIN is live in Production at `https://immifin.com`. The product has been built and deployed. Formal Google Search Console **domain ownership is verified**. Indexing baseline, sitemap submission, and ranking work are **not** complete.

As of 2026-08-26, Google Search Console **domain ownership is verified**. The following remain incomplete:

- sitemap submission
- URL Inspection / indexing requests
- a recorded Search Console coverage / performance baseline (reports still processing)
- ranking or keyword programs

Application source includes Next.js metadata routes `app/robots.ts` and `app/sitemap.ts`. Production robots/sitemap were audited in S7A-SEO-002: they exist, but the sitemap is **not safe to submit as-is**.

This runbook exists so later work proceeds baby-step by baby-step, with Product Owner validation after each step.

---

## B. Strategic Context

### Corporate identity

> **Immigration, Finance & Life in America**

The current Production release is primarily the **Immigration** vertical. Finance and Life capabilities described in long-term vision are **not** currently available product surfaces and must not be marketed as live.

Long-term product vision remains in [PRODUCT_VISION.md](./PRODUCT_VISION.md). Commercial tiers remain in [BUSINESS_MODEL.md](./BUSINESS_MODEL.md).

### Current acquisition wedge

**India EB-2 / EB-3 employment-based Green Card waiters.**

### Primary recurring pain

Users repeatedly have to monitor and interpret immigration changes themselves — especially Visa Bulletin information and how it relates to their journey.

### Initial acquisition hook

**Current Visa Bulletin Dashboard** (Free).

Month-to-month comparison, history, Movement Tracker, Priority Date tracking, and personalized experiences remain **premium** according to the existing subscription model.

### Locked promise

> **Know where you stand. Stay informed when things change.**

This wording is **LOCKED**. Do not rewrite it.

### Internal Free → Pro → Power model

Internal conceptual model only — **not** automatically approved public website copy:

| Tier | Internal model |
|------|----------------|
| **Free** | The user checks |
| **Pro** | IMMIFIN tracks |
| **Power** | IMMIFIN adds intelligence |

### Free-user philosophy

Free users are not unsuccessful users. A serious Free user who returns every month to inspect the latest immigration information is an active and valuable IMMIFIN user. Optimize for meaningful recurring engagement, not merely immediate paid conversion.

### Acquisition philosophy

IMMIFIN does not optimize for the largest possible user base. It optimizes for the **right user base**: people who actually care about Visa Bulletin, EB-2 / EB-3, Priority Dates, Final Action Dates, Dates for Filing, immigration progress, and journey tracking.

### Marketing principles

> **TRUST > TRAFFIC**

> **QUALITY OF AUDIENCE > QUANTITY OF TRAFFIC**

> **PRODUCT QUALITY IS OUR PRIMARY MARKETING**

Premium quality here means accuracy, professionalism, and restraint — not luxury pricing. No clickbait, cheap marketing tricks, fear-based immigration messaging, fake urgency, misleading predictions, or mass low-quality acquisition.

### Acquisition-channel direction

| Order | Channel | This sprint |
|-------|---------|-------------|
| 1 | **Google Search / SEO** | Immediate Sprint 7A focus |
| 2 | IMMIFIN YouTube | Later dedicated workstream |
| 3 | Trusted community distribution (including relevant Facebook / WhatsApp communities) | Later; not this runbook |

No paid advertising at this stage.

> **If we do not understand the territory, we do not spend money there.**

Learn first. Measure. Validate. Then consider controlled experiments.

---

## C. Google Search Objective

Google Search should initially help **serious immigration users** discover IMMIFIN when they search for genuinely relevant information.

Example intent families (planning examples **only** — not keyword research, not volume claims, not current ranking claims):

- Visa Bulletin
- EB2 India
- EB3 India
- Priority Date
- Final Action Date
- Dates for Filing
- Green Card wait
- citizenship eligibility

IMMIFIN does **not** currently claim ranking for any of these. No search volumes are recorded here.

---

## D. Phase A — Google Search Foundation Execution Sequence

**Phase A** = discovery / indexing foundation: make IMMIFIN correctly discoverable and understandable by Google.

**Phase B** (ranking / SEO) must **not** start until Phase A is established and baselined.

### Step 1 — Google Search Console

Story ID when executed: **S7A-SEO-001**.

- Create or access Google Search Console.
- Add `immifin.com`.
- Prefer domain-level ownership verification if appropriate.
- Complete ownership verification.

**Complete (S7A-SEO-001)** — Product Owner, 2026-08-26. See [S7A-SEO-001 result](#s7a-seo-001--google-search-console-result).

### Step 2 — Establish Current Indexing Baseline

Before changing anything, determine:

- whether Google currently knows about `immifin.com`
- which public URLs, if any, are indexed
- whether there are indexing / crawling issues
- whether Search Console reports coverage / indexing problems

**Not complete.** Search Console Performance and Page Indexing reports are still **processing**. No indexed-page / impression / click baseline is recorded yet. Do not invent one.

### Step 3 — Crawlability Audit

Review Production behavior for:

- public vs authenticated routes
- Googlebot accessibility
- HTTP response behavior
- accidental `noindex`
- redirects
- canonical handling
- authentication boundaries

**Complete (S7A-SEO-002)** — see [S7A-SEO-002 audit](#s7a-seo-002--production-crawlability-robots--sitemap-audit). Audit only; no application changes.

### Step 4 — robots.txt Audit

Production URL to inspect later: `https://immifin.com/robots.txt`

Determine:

- whether `robots.txt` exists in Production
- current directives
- whether intended public routes are crawlable
- whether private / authenticated / application areas should remain excluded

**Complete (S7A-SEO-002).** Production `https://immifin.com/robots.txt` exists (HTTP 200). Source: `app/robots.ts`. Not edited.

### Step 5 — sitemap.xml Audit

Production URL to inspect later: `https://immifin.com/sitemap.xml`

Determine:

- whether a sitemap exists in Production
- which URLs it contains
- whether only appropriate canonical / public URLs are present
- whether authenticated / private / product-only routes are incorrectly represented

**Complete (S7A-SEO-002).** Production `https://immifin.com/sitemap.xml` exists (HTTP 200). Source: `app/sitemap.ts`. **Not safe to submit as-is.** Not edited.

### Step 6 — Metadata / Canonical Audit

Review key public pages for:

- title
- meta description
- canonical URL
- robots directives
- Open Graph / basic metadata where relevant

**Complete (S7A-SEO-002)** — see audit section. Audit only; metadata not changed.

### Step 7 — Submit Sitemap

Only after the sitemap is verified / correct:

- submit it through Google Search Console
- document submission status
- record any errors / warnings

**Not started.** S7A-SEO-002 recommendation: **do not submit** until sitemap lists only crawlable public URLs.

### Step 8 — URL Inspection

Use Google Search Console URL Inspection for a **small** set of important public URLs. Later consider at minimum:

- homepage (`https://immifin.com/`)
- primary public immigration discovery page(s)
- important public Visa Bulletin surface(s)

Do not request indexing indiscriminately for every route.

### Step 9 — Establish Baseline Metrics

When Search Console data becomes available, record IMMIFIN’s own baseline:

- indexed pages
- impressions
- clicks
- queries
- average position
- crawl / indexing problems

Do **not** invent benchmark targets.

### Step 10 — Phase A Sign-Off

Google Search Foundation is complete only after all of the following are true:

- domain ownership is verified
- intended public pages are crawlable
- robots behavior is understood
- sitemap behavior is understood / correct
- sitemap is submitted when appropriate
- important URLs can be inspected
- initial indexing baseline is recorded
- unresolved technical blockers are documented

Until then, Phase A remains in progress. S7A-SEO-002 concluded the sitemap is not safe to submit as-is.

---

## E. Phase B — SEO / Ranking — FUTURE

**Status: NOT YET STARTED.**

Do not execute Phase B until Phase A is signed off.

Potential future areas (documentation only):

- high-intent keyword research
- search-intent mapping
- public immigration content architecture
- EB-2 India / EB-3 India search surfaces
- Visa Bulletin content strategy
- structured data evaluation
- internal linking
- technical SEO
- content quality
- authority / backlinks
- Search Console query analysis
- landing-page conversion

None of these are started in this story.

---

## F. Authentication / Product Boundary Principle

IMMIFIN must **not** weaken Free / Pro / Power simply for SEO.

Google needs valuable **public discovery surfaces**. The product may remain authenticated according to existing architecture.

Do **not** expose premium capabilities merely to make them crawlable.

Premium capabilities that remain gated (as applicable):

- saved immigration profile
- Priority Date tracking
- Visa Bulletin history
- Movement Tracker
- email alerts
- personalized dashboards
- automatic calculator population
- AI / Intelligence
- multiple profiles

Current commercial boundaries (do not change in Sprint 7A Search work):

| Tier | Includes |
|------|----------|
| **Free** | Current Visa Bulletin Dashboard; GC Wait Calculator — manual cutoff-date entry; Citizenship Calculator |
| **Pro** | Free plus save immigration profile, Priority Date tracking, Visa Bulletin history, Movement Tracker, email alerts, personalized Visa Bulletin dashboard, automatic calculator population, Standard Support |
| **Power** | Pro plus AI / Intelligence when Production-ready, multiple profiles, full personalized dashboard, Priority Support |

SEO supports the business model. It does not dismantle it.

---

## G. Content Quality Principle

IMMIFIN must **not** pursue:

- hundreds of thin AI-generated SEO pages
- keyword-stuffed pages
- duplicate city / category pages without real value
- clickbait
- sensational immigration predictions
- fear-driven content
- misleading legal claims
- low-quality mass content

Every future indexed IMMIFIN page should provide genuine user value.

---

## H. Execution Method

Every future step in this runbook uses the Product Owner baby-step workflow:

1. Explain the next step.
2. Explain why it is necessary.
3. Perform **only** that step.
4. Product Owner validates / result is captured.
5. Document the result.
6. **Stop.**
7. Only then proceed to the next step.

Do **not** execute several Search Console or SEO changes simultaneously.

---

## I. Decision Log

| Decision | Status |
| -------- | ------ |
| Google Search / SEO is the first formal organic acquisition workstream | **LOCKED** |
| Initial acquisition audience = India EB-2 / EB-3 | **LOCKED** |
| Primary promise = “Know where you stand. Stay informed when things change.” | **LOCKED** |
| Trust > Traffic | **LOCKED** |
| Quality of Audience > Quantity of Traffic | **LOCKED** |
| Product Quality Is Our Primary Marketing | **LOCKED** |
| No material paid advertising yet | **LOCKED** |
| Unknown marketing territory should be learned before spending | **LOCKED** |
| Google Search Foundation must be documented before execution | **LOCKED** |
| Search execution must proceed baby-step-by-baby-step | **LOCKED** |
| Sprint 7A remains separate from Sprint 8 Intelligence | **LOCKED** |
| Phase B ranking work must wait for Phase A sign-off | **LOCKED** |
| SEO must not dismantle Free / Pro / Power boundaries | **LOCKED** |
| Do not submit sitemap until it lists only crawlable public URLs | **LOCKED** (S7A-SEO-002) |

---

## S7A-SEO-001 — Google Search Console result

Product Owner completed this step manually. No Cursor Search Console, DNS, or Cloudflare changes.

| Field | Result |
|-------|--------|
| **Date** | 2026-08-26 |
| **Property** | Domain property `immifin.com` |
| **Ownership** | Verified |
| **Verification method** | Domain name provider / automatic verification |
| **Performance report** | Processing |
| **Page Indexing report** | Processing |
| **Sitemap submitted** | **No** |
| **Indexing requested** | **No** |
| **Production SEO / code changes** | **None** |

---

## S7A-SEO-002 — Production crawlability, robots & sitemap audit

| Field | Value |
|-------|-------|
| **Date** | 2026-08-26 |
| **Mode** | Read-only code inspection + unsigned Production GET |
| **Googlebot UA sample** | Same Clerk 404 behavior as a normal unsigned client on gated routes |
| **Application / robots / sitemap / metadata changes** | **None** |
| **Sitemap submitted** | **No** |
| **Indexing requested** | **No** |

### Verdict

| Question | Result |
|----------|--------|
| Can Google crawl IMMIFIN today? | **PARTIALLY** |
| `robots.txt` | **NEEDS REVIEW** |
| `sitemap.xml` | **NEEDS REVIEW** |
| Public metadata | **NEEDS REVIEW** |
| Canonical / redirect behavior | **NEEDS REVIEW** |
| Private / premium search exposure | **PASS** (content not served unsigned; see notes) |
| Site-wide Google indexing blocker | **NO** |
| Sitemap recommendation | **NO — REVIEW/FIX BEFORE SUBMISSION** |

Public marketing and calculator pages return **200** with `index, follow`. The locked acquisition hook — **Current Visa Bulletin Dashboard** (`/immigration/visa-bulletin`) — returns Clerk **404** `protect-rewrite` when unsigned, including with a Googlebot user-agent. Five sitemap URLs are therefore undiscoverable to Googlebot today.

### How Googlebot is treated

`middleware.ts` uses Clerk `auth.protect()` for every path not in `PUBLIC_ROUTE_PATTERNS` (`lib/auth/publicRoutes.ts`). There is no Googlebot exception. Unsigned crawlers receive the same **404** as unsigned humans on gated routes (not a login HTML 200).

### Production `robots.txt`

```
User-Agent: *
Allow: /

Sitemap: https://immifin.com/sitemap.xml
```

Matches `app/robots.ts`. Intended public routes are allowed. **No `Disallow`** for `/admin`, `/dashboard`, `/account`, `/api`, `/intelligence`, or auth routes. Those paths still 404 unsigned, so this is not a confirmed content leak, but it invites crawl waste and is weaker than a private-path disallow list.

### Production `sitemap.xml`

16 URLs, all `https://immifin.com…`. `lastmod` is generated with `new Date()` at request time (observed `2026-08-26T21:36:29.667Z`), so it is **not** a true content-change date.

| Sitemap URL | Unsigned Production | Notes |
|-------------|---------------------|-------|
| `/` | 200 | Crawlable |
| `/calculators` | 200 | Crawlable |
| `/calculators/citizenship-eligibility` | 200 | Crawlable Free calculator |
| `/calculators/green-card-wait-time` | 200 | Crawlable Free calculator |
| `/immigration/h1b-wage-level-estimator` | 200 | Crawlable |
| `/immigration/h1b-lottery-odds-calculator` | 200 | Crawlable |
| `/immigration/visa-stamping-wait-map` | 200 | Crawlable |
| `/about` `/privacy` `/terms` `/contact` | 200 | Crawlable |
| `/immigration` | **404** Clerk protect-rewrite | In sitemap; not public |
| `/immigration/visa-bulletin` | **404** Clerk protect-rewrite | In sitemap; **primary Free hook, not crawlable** |
| `/immigration/visa-bulletin-movement` | **404** Clerk protect-rewrite | In sitemap; Pro capability |
| `/finance` | **404** Clerk protect-rewrite | In sitemap; future vertical, not public |
| `/insurance` | **404** Clerk protect-rewrite | In sitemap; future vertical, not public |

**Missing from sitemap but crawlable (200):** `/pricing` (commercial page). `/login` and `/signup` are public 200 and correctly **omitted** from the sitemap.

Authenticated / admin / billing / Intelligence / most APIs are **not** in the sitemap (good).

### Public vs authenticated (unsigned)

**HTTP 200 (crawlable):** `/`, `/pricing`, `/about`, `/contact`, `/privacy`, `/terms`, `/calculators` and Free calculator routes, H-1B tools, visa-stamping wait map, `/login`, `/signup`, `/robots.txt`, `/sitemap.xml`.

**HTTP 404 Clerk protect-rewrite (not crawlable as content):** `/immigration`, `/immigration/visa-bulletin`, `/immigration/visa-bulletin-movement`, `/immigration/visa-bulletin-history`, `/finance`, `/insurance`, `/dashboard`, `/admin`, `/account/billing`, `/intelligence`, `/api/visa-bulletin`.

Public APIs used by calculators (`/api/check-priority-date`, `/api/visa-stamping-wait-times`) are reachable unsigned (bare GET returned 400/405) and are **not** in the sitemap.

### Metadata (sample public pages)

| Page | Title observed | Canonical | robots meta |
|------|----------------|-----------|-------------|
| `/` | Immifin - Immigration, Finance & Life in America | `https://immifin.com` | `index, follow` |
| `/pricing` | Pricing \| Immifin \| Immifin | `https://immifin.com/pricing` | `index, follow` |
| `/calculators/green-card-wait-time` | Green Card Calculator \| Immifin \| Immifin | matching path | `index, follow` |
| `/immigration/visa-bulletin` | *(no HTML — 404)* | n/a | n/a |

`lib/metadata.ts` `createMetadata()` already suffixes ` | Immifin`; root `app/layout.tsx` also uses `template: '%s | Immifin'`, which produces **duplicated brand** in titles. Root layout sets `robots.index: true` globally. `createMetadata()` also sets `index: true` for **admin / dashboard / billing / Intelligence** pages in source; those pages 404 unsigned, so Google does not receive that HTML today.

Open Graph title/description/url are present on the homepage. **`og:image` is not emitted** (`siteConfig.ogImage` is unused in metadata). No `X-Robots-Tag` header observed. No accidental `noindex` on public 200 pages.

### Canonical / redirects

| Check | Result |
|-------|--------|
| Public page canonicals | Absolute `https://immifin.com…` |
| `https://immifin.com/` | 200 |
| `http://immifin.com/` | **200** (full HTML; **no HTTPS redirect**; no HSTS header) |
| `https://www.immifin.com/` | **522** |
| `http://www.immifin.com/` | **522** |

Apex HTTPS is the intended host. HTTP-without-redirect and www 522 are later review items; they are not a robots/sitemap submission prerequisite by themselves.

### Private / premium exposure

Unsigned Googlebot does **not** receive Admin, dashboard, billing, Intelligence, or premium Visa Bulletin HTML (Clerk 404). Those URLs are also absent from the sitemap except Movement Tracker (premium) and the current Visa Bulletin dashboard (commercially Free but auth-gated).

Residual risks (not confirmed leaks): `robots.txt` `Allow: /`; admin/dashboard metadata `index: true` in source if a future auth change served HTML to crawlers.

### Findings

| ID | Severity | Finding |
|----|----------|---------|
| F1 | **High** | `/immigration/visa-bulletin` is the locked Free acquisition hook but is **auth-gated** (404 to Googlebot) and is listed in the sitemap. |
| F2 | **High** | Sitemap includes five URLs that 404 for crawlers (`/immigration`, visa bulletin, movement, `/finance`, `/insurance`). Submitting it would ask Google to fetch non-indexable URLs. |
| F3 | **Medium** | `/pricing` is publicly crawlable (200) but **absent** from the sitemap. |
| F4 | **Medium** | `robots.txt` allows the entire site; private/admin/API paths are not disallowed. |
| F5 | **Medium** | `http://immifin.com/` serves 200 without redirect to HTTPS; no HSTS. |
| F6 | **Medium** | `www.immifin.com` returns Cloudflare **522**. |
| F7 | **Low** | Public titles duplicate “Immifin” (`createMetadata` + layout title template). |
| F8 | **Low** | Sitemap `lastmod` is request time (`new Date()`), not real modification time. |
| F9 | **Low** | Homepage Open Graph has no `og:image`. |
| F10 | **Informational** | Finance/Insurance sitemap entries describe future verticals that are not public today. |
| F11 | **Informational** | Search Console Performance / Page Indexing still processing — no coverage baseline yet. |
| F12 | **Informational** | `/login` and `/signup` are indexable (`index, follow`) but not in the sitemap. |

### What this audit does *not* change

Do not treat F1 as an instruction to un-gate Visa Bulletin in this story. Making the dashboard public is a **product / auth-boundary** decision (Sprint 7A principle: SEO must not dismantle Free/Pro/Power). Record it; do not implement it here.

---

## Related documents

| Document | Role |
|----------|------|
| [PRODUCT_VISION.md](./PRODUCT_VISION.md) | Long-term product vision |
| [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) | Free / Pro / Power commercial source of truth |
| [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) | Operational project state |
| [ROADMAP_v2.md](./ROADMAP_v2.md) | Sprint sequencing (Sprint 8 FROZEN; Sprint 7A is a separate marketing workstream) |
| [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md) | Engineering workflow |

No dedicated Google Search Console, analytics, or SEO-foundation document existed in the repository before this runbook.

---

## Current status

> **PHASE A IN PROGRESS — S7A-SEO-003 LOCALHOST COMPLETE; SITEMAP NOT SUBMITTED TO SEARCH CONSOLE**

## Next executable step

> **S7A-SEO-004 — Product Owner review of sitemap integrity; do not submit to Search Console until approved**

Do not submit `https://immifin.com/sitemap.xml` until Production includes this correction and the Product Owner authorizes Search Console submission.

---

## S7A-SEO-003 — Sitemap Integrity Correction

| Field | Value |
|-------|-------|
| **Date** | 2026-08-29 |
| **Mode** | `app/sitemap.ts` only + this runbook |
| **Search Console submission** | **None** |
| **Indexing requested** | **None** |
| **Auth / Visa Bulletin gating** | **Unchanged** |
| **robots / metadata / Cloudflare / cache** | **Unchanged** |

### URLs removed (S7A-SEO-002 404 / non-crawlable)

| URL | Reason |
|-----|--------|
| `https://immifin.com/immigration` | Unsigned Clerk protect-rewrite 404; not a public discovery page |
| `https://immifin.com/immigration/visa-bulletin` | Auth-gated Current Visa Bulletin Dashboard; Googlebot does not receive public HTML |
| `https://immifin.com/immigration/visa-bulletin-movement` | Auth-gated Pro tool |
| `https://immifin.com/finance` | Auth-gated; not a public vertical today |
| `https://immifin.com/insurance` | Auth-gated; not a public vertical today |

Those routes remain in the product. They were removed from the sitemap only. Authentication was not changed.

### URLs added

| URL | Reason |
|-----|--------|
| `https://immifin.com/pricing` | Public, crawlable (HTTP 200, `index, follow`); missing from the previous sitemap (SEO-002 F3) |

`/login` and `/signup` remain omitted (public 200, correctly excluded in SEO-002).

### Resulting sitemap membership

`https://immifin.com`, `/pricing`, `/calculators`, `/calculators/citizenship-eligibility`, `/calculators/green-card-wait-time`, `/immigration/h1b-wage-level-estimator`, `/immigration/h1b-lottery-odds-calculator`, `/immigration/visa-stamping-wait-map`, `/about`, `/privacy`, `/terms`, `/contact`.

Origin: `siteConfig.url` (`https://immifin.com`).

### `lastModified` decision

**Previous:** `lastModified: new Date()` on every sitemap request (SEO-002 F8) — implied every URL changed at fetch time.

**Final:** `lastModified` is **omitted**. Next.js does not emit `lastmod`. No CMS/timestamp system was added.

### Localhost validation

`http://localhost:3000/sitemap.xml` — HTTP 200, `content-type: application/xml`, 12 `<loc>` entries, no `lastmod`, `/pricing` present, five 404/auth-gated URLs absent. Listed public routes returned HTTP 200. `/immigration/visa-bulletin`, `/dashboard`, `/admin` still 307 to login (unsigned HTML). Production not deployed.

`https://dev.immifin.com` / `https://dev.immifin.com/sitemap.xml` returned **530** during S7A-SEO-003 because the named tunnel `immifin-dev` had **zero active connectors** — not a sitemap, Clerk, or Production defect. After the documented recovery (S7A-SEO-003A-DOC), both URLs returned **HTTP 200** (`sitemap.xml` with `Content-Type: application/xml`). Operating procedure: [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) **Development tunnel recovery**. Do not re-diagnose unless that workaround stops working.

### S7A-SEO-003A-DOC — development tunnel recovery

The **530** on `dev.immifin.com` was a named-tunnel connector failure. The known-good Windows workaround (stop **Cloudflared** service, start `cloudflared` with explicit `1.1.1.1` / `1.0.0.1` DNS and HTTP/2, token **local only**) is recorded in [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md). Cursor must use that procedure when a story requires the development tunnel and must **never** request the real token in chat. The Windows service persistence issue remains **unresolved infrastructure cleanup**.

### Remaining known sitemap concerns

- Production still serves the **pre-correction** sitemap until this change is committed and deployed.
- Public Visa Bulletin discovery remains a later story; the dashboard stays auth-gated and off the sitemap.
- `/login` / `/signup` stay out of the sitemap.
- robots.txt, metadata, HTTP→HTTPS, and www 522 are unchanged (SEO-002 F4–F7, F9).

### Confirmations

- No Search Console sitemap submission.
- No Google indexing request.
- Authenticated-tool boundary unchanged.
- No Cloudflare DNS, Production, or tunnel-token rotation in this documentation story.
