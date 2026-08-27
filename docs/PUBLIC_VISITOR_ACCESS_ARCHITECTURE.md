# IMMIFIN Public Visitor Access Architecture

| Field | Value |
|-------|-------|
| **Document** | Public Discovery and Authenticated Tool Access |
| **Story** | S7-PUBLIC-002 |
| **Date** | 2026-08-26 |
| **Status** | **APPROVED PRODUCT DECISION — NOT IMPLEMENTED** |
| **Production** | `https://immifin.com` (LIVE) |
| **Prior audit** | S7-PUBLIC-001 (read-only) |
| **Related** | [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) · [SPRINT_7A_GOOGLE_SEARCH_FOUNDATION.md](./SPRINT_7A_GOOGLE_SEARCH_FOUNDATION.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) |

This document is the **canonical visitor-access architecture** for IMMIFIN. It does **not** change application behavior. Implementation follows the baby-step sequence in §14.

Entitlement capabilities (what Free / Pro / Power *include*) remain in [BUSINESS_MODEL.md](./BUSINESS_MODEL.md). This document defines **who may browse vs who may use**, and how Search Console / existing URLs are protected.

---

## 1. Purpose

Record Product Owner–approved rules for:

- Public visitors vs Free / Pro / Power members
- Discovery vs Use
- Account Gate vs Subscription Gate
- Visa Bulletin and calculator access
- SEO non-regression
- Production-safe implementation order

S7-PUBLIC-001 found Production inconsistencies among the business model, Clerk middleware, `ProtectedLink` navigation, Pricing chrome, public calculators, authenticated Visa Bulletin routes, and the sitemap. This file records the **target** architecture those later stories must implement.

---

## 2. Executive Decision

**Approved principles:**

> **Explore IMMIFIN freely. Create a free account to use our immigration tools. Upgrade when you need advanced tracking and intelligence.**

Architectural form:

> **Browse publicly. Use tools with a Free account. Upgrade for Pro and Power capabilities.**

**Free** is **$0**, requires an IMMIFIN account, requires authentication, and requires **no credit card**.

**Free does not mean anonymous access.**

These principles apply to future navigation, Pricing, authentication, SEO, tool landing pages, subscription gating, mobile, and Intelligence experiences.

**Not implemented.** Current Production still mixes anonymous calculator use, nav login intercepts, Clerk 404s on Visa Bulletin, and weak Pricing discoverability.

---

## 3. Visitor Types

| Type | Account | Payment | May do |
|------|---------|---------|--------|
| **Public visitor** | No | No | Discover IMMIFIN, read public/indexable content, understand tools and tiers, view Pricing, decide whether to register |
| **Free member** | Yes | $0, no credit card | Use approved Free-plan **tools** (authenticated) |
| **Pro member** | Yes | Active Pro or higher | Free tools plus approved Pro capabilities |
| **Power member** | Yes | Active Power | Pro plus approved Power capabilities, including Intelligence as implemented |

Public visitors must **not** need an account merely to **understand** the product.

Pro/Power capability lists are **not** redefined here. See [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) §3.

---

## 4. Discovery vs Use

IMMIFIN must not conflate SEO accessibility with application authorization.

### Discovery (public, indexable)

- What a tool does and why it is useful
- Educational immigration information and terminology
- Example outputs where appropriate
- Feature benefits and which tier is required
- CTA to use the tool

### Use (authenticated for Free tools)

- Running an immigration calculator
- Viewing the actual IMMIFIN Visa Bulletin **application**
- Personalized functionality, saved profiles, authenticated workflows

Google should understand IMMIFIN’s value **without** executing private application functionality.

---

## 5. Free Account Definition

| Rule | Value |
|------|--------|
| Price | **$0** |
| Account | **Required** |
| Authentication | **Required** |
| Credit card | **Not required** |
| Meaning | Registered, authenticated IMMIFIN member whose effective subscription tier is Free |

A Free member receives the approved core IMMIFIN tools. Anonymous visitors receive **discovery**, not tool **use** (after migration; see §8 for calculator SEO constraints).

---

## 6. Account Gate vs Subscription Gate

These are **separate**. They must never be mixed conceptually or in UX.

### Account Gate (signed out)

**When:** The visitor is signed out and attempts to **use** a tool.

**Purpose:** Create an IMMIFIN account or sign in.

**Actions:**

- **Create Free Account** (primary)
- **Sign In** (secondary)
- **Compare Free, Pro, and Power** (Pricing)

**Header auth CTAs (explicit, not Account Gate):** Join IMMIFIN → `/signup`. Sign In → `/login`. These must continue directly into the canonical authentication flow and must never terminate in restricted-access gating (`showLoginRequired` / Login Required modal). That modal remains for signed-out clicks on restricted application features only.

**Clerk development testing:** When IMMIFIN uses the production/custom Clerk Frontend API (`clerk.immifin.com`), direct `http://localhost:3000` authentication may fail with Clerk `origin_invalid`. Clerk authentication integration should be validated through the approved development origin `https://dev.immifin.com` unless a separately approved localhost Clerk configuration exists. Do not treat localhost blank Clerk forms as an IMMIFIN React/navigation defect.

**Supporting:** No credit card required for Free.

**Return path:** After successful authentication, return to the **intended tool**. Do **not** bounce the visitor to Home merely because authentication is required.

**Current Production (as-is, not approved target):** `LoginRequiredProvider` title **Login Required**; Clerk `<SignIn />` first; `showLoginRequired` often `router.push("/")`. Uncommitted Login Modal WIP polishes appearance/copy but does **not** implement this Account Gate. **Do not modify that WIP in this story.**

### Subscription Gate (signed in, insufficient plan)

**When:** The user is authenticated but the requested capability is not on their plan (Free → Pro, Pro → Power).

**Purpose:** Explain the premium feature and the appropriate upgrade.

**Current Production:** Premium Feature Discovery / `PremiumNavPreviewDialog` / capability locks. Keep that pattern for **subscription** upgrades; do not reuse it as the signed-out Account Gate.

---

## 7. Visa Bulletin Decision

| Surface | Access |
|---------|--------|
| **Current Visa Bulletin application** | **FREE AUTHENTICATED TOOL** — account required, no payment |
| **Public Visa Bulletin discovery** | Public and indexable |

Public discovery must help Google and first-time visitors understand:

- What the Visa Bulletin is
- Final Action Date and Date for Filing
- Why movement matters
- What IMMIFIN provides
- What a Free account unlocks
- What Pro adds (History / Movement Tracker, as applicable)

CTA from discovery: **Create Free Account** or **Sign In**, then the application.

**Current Production conflict:** `/immigration/visa-bulletin` is Clerk-protected (unsigned **404** `protect-rewrite`) and is listed in `sitemap.xml`. Target: public **discovery** at a crawlable 200 URL; **use** remains authenticated. Do not leave Google fetching Clerk 404s.

---

## 8. Calculator Decision

**Long-term rule:** IMMIFIN calculators are **FREE AUTHENTICATED TOOLS** (account required, no payment).

**Production constraint:** Several calculator URLs are already publicly accessible, crawlable, and potentially indexed, including:

- `/calculators`
- `/calculators/green-card-wait-time`
- `/calculators/citizenship-eligibility`
- `/immigration/h1b-wage-level-estimator`
- `/immigration/h1b-lottery-odds-calculator`
- `/immigration/visa-stamping-wait-map`

**Do not** simply add Clerk `auth.protect()` to those existing URLs. That can turn indexed URLs into 404s, harm Search Console, rankings, external links, and Google’s user experience.

Migration from anonymous **use** to authenticated **use** must preserve **public discovery** and SEO equity on those URLs (see §11–12).

---

## 9. Pricing Model Communication

`/pricing` must remain:

- Public
- Crawlable
- Accessible without authentication
- **Easily discoverable in site chrome** (header/footer for first-time visitors)

| Plan | Must communicate |
|------|------------------|
| **Free** | **$0**; **Free account required**; **No credit card required**; core approved immigration tools; CTA **Create Free Account** |
| **Pro** | Existing approved monthly / annual amounts; advanced tracking, history, notifications, personalization per Business Model |
| **Power** | Existing approved monthly / annual amounts; Pro plus approved Intelligence / advanced capabilities |

This story does **not** change list prices.

**Current Production:** `/pricing` is middleware-public (HTTP 200) but **absent** from primary navigation and footer (S7-PUBLIC-001).

---

## 10. SEO Architecture

**Production rule:**

> **Never sacrifice public search discoverability merely to enforce application authentication.**

Pattern:

**Public discovery surface** → **Authenticated application surface**

Google must understand IMMIFIN without executing private application functionality.

Additional production rules (with S7A-SEO-002):

- No sitemap URL should intentionally return Clerk 404
- Do not submit the current sitemap as-is (`S7A-SEO-003` after public/auth URLs are stable)
- `/pricing` should be in the sitemap once chrome/discovery work is aligned
- Public navigation must match actual middleware accessibility

Crawlability facts: [SPRINT_7A_GOOGLE_SEARCH_FOUNDATION.md](./SPRINT_7A_GOOGLE_SEARCH_FOUNDATION.md).

---

## 11. Route Architecture Options

Exact URL migration is an **implementation-design** decision. Not implemented here. Examples are illustrative only.

### Option A — Public route + authenticated `/app` route

Example: public `/calculators/citizenship` · authenticated `/app/calculators/citizenship`

| | |
|--|--|
| **Advantages** | Clean Clerk/middleware split; hard to leak tool UI; obvious “app” boundary |
| **Disadvantages** | Dual URL space; existing calculator URLs must keep 200 discovery or 301 forever; `/app` is a new namespace to maintain; easy to ship incomplete redirects |

### Option B — Same SEO URL; public discovery + authenticated interactive boundary

The canonical URL stays public (HTTP 200). Educational / discovery content is server-rendered for everyone. Interactive **use** requires authenticated state (client island and/or server action), not `auth.protect()` on the whole page.

| | |
|--|--|
| **Advantages** | **Preserves existing calculator URLs**; Google keeps 200 + indexable HTML; Clerk middleware can remain public for those paths; Visa Bulletin’s current URL can become a 200 discovery page instead of 404; fits Next.js RSC |
| **Disadvantages** | Page must not ship the full interactive app in public HTML; middleware vs in-page auth must stay consistent; easier to accidentally expose interactive controls if undisciplined |

### Option C — Public landing + nested authenticated tool route

Example: `/calculators/citizenship` public discovery · `/calculators/citizenship/tool` authenticated use

| | |
|--|--|
| **Advantages** | Parent URL stays 200; child route can use Clerk protect; clearer “Use this tool” navigation |
| **Disadvantages** | Extra routes per tool; nested `/tool` may still need sitemap/canonical care; visitors and Google must not be sent to a 404 child; more files than Option B |

---

## 12. Recommended Route Strategy

**Preferred: Option B** for existing public calculator URLs and for Current Visa Bulletin’s existing path, unless a later implementation story proves it cannot keep public HTML crawlable without leaking Use.

**Why (priority order):**

1. **Production safety** — No mass Clerk-protect of already-public calculator URLs (Rule 3).
2. **Existing URL preservation** — Calculators keep their current paths.
3. **Google crawlability** — Those URLs stay 200 with discovery content; Visa Bulletin can stop returning Clerk 404 at a sitemap URL.
4. **Authentication correctness** — Middleware stays **public** on discovery URLs; **Use** is gated in-page / by authenticated APIs, not by turning the document into 404.
5. **Maintainability** — One URL per tool; no parallel `/app` tree unless Option B fails.
6. **UX** — Same link from Google → learn → Create Free Account → use on the same canonical URL.

**Option C** is the approved **fallback** if Option B cannot isolate interactive Use without putting the whole route behind `auth.protect()`.

**Option A is not the default.** Use only if Product Owner later approves an explicit `/app` (or equivalent) migration with redirects and Search Console handling.

**Implementation stories must not treat this recommendation as a license to change routes in S7-PUBLIC-003–006.** Route work belongs in **S7-PUBLIC-007** (Visa Bulletin first, then calculators).

---

## 13. Production Safety Rules

IMMIFIN is **LIVE**. All S7-PUBLIC implementation stories must follow:

| Rule | Requirement |
|------|----------------|
| **1** | No production authentication change without localhost verification |
| **2** | No middleware route change without explicit route-by-route regression testing |
| **3** | No currently-public URL may become authenticated/404 without explicit SEO migration approval |
| **4** | No sitemap URL should intentionally return Clerk 404 |
| **5** | Public navigation must match actual middleware accessibility |
| **6** | Every implementation story must be independently reversible |
| **7** | One story → one focused commit |
| **8** | Before code changes: stop the development server; preserve unrelated WIP; record Git status |
| **9** | After changes: restart the development server; verify localhost; verify Cloudflare development tunnel where applicable; run required lint / TypeScript / build validation; Product Owner validates |
| **10** | Do not push or deploy automatically. Product Owner approval is required before commit (if the story requests it), push, and production deployment |
| **11** | After production deployment: immediate smoke validation and retain rollback capability |

---

## 14. Implementation Sequence

Do **not** start these from this documentation story.

| Story | Name | Goal |
|-------|------|------|
| **S7-PUBLIC-003** | Public Pricing Discoverability | Make Pricing obvious to first-time visitors. Low-risk chrome only |
| **S7-PUBLIC-004** | Free Plan Messaging | $0, account required, no credit card, Create Free Account CTA. No routing changes |
| **S7-PUBLIC-005** | Public Navigation Alignment | Align middleware-public routes, `ProtectedLink`, and direct URLs. Must not reduce current crawlability |
| **S7-PUBLIC-006** | Account Gate Conversion Experience | Build on Login Modal WIP: Create Free Account, Sign In, no credit card, Pricing compare, return-to-tool, remove home bounce |
| **S7-PUBLIC-007** | Public Discovery Architecture | Public discovery for authenticated tools. **Visa Bulletin first**, then calculators using §12 |
| **S7A-SEO-003** | Sitemap and Search Console Alignment | **After** public/auth URLs are stable: crawlable canonical URLs only; drop known 404/private routes; add Pricing; verify robots/canonical; submit sitemap when appropriate |

---

## 15. Non-Goals

Do not mix into S7-PUBLIC-003–007:

- Sprint 8 Intelligence Platform implementation / enablement
- IIE, Ask IMMIFIN
- Broader marketing landing-page redesign
- Finance / Insurance product build-out
- Unrelated full navigation redesign
- Stripe Live banking / remaining LIVE billing matrix work
- Unrelated Clerk infrastructure migration

Intelligence remains Power-gated per the Business Model. This architecture only requires that **Account Gate** and **Subscription Gate** stay distinct if signed-out users hit Intelligence later.

---

## 16. Risks

| Risk | Mitigation |
|------|------------|
| Clerk-protecting current calculator URLs | Forbidden without SEO migration approval (Rule 3); use Option B |
| Sitemap continuing to list 404 Visa Bulletin | S7-PUBLIC-007 then S7A-SEO-003 |
| Mixing Account Gate with Pro upgrade modal | Separate components and copy (§6) |
| Login Modal WIP overwritten | S7-PUBLIC-006 extends it; other stories must not restyle it |
| Nav still blocking public calculator URLs | S7-PUBLIC-005; Rule 5 |
| Unrelated Sprint 8 / BLP / billing WIP absorbed | Do not edit mixed working-tree docs in those stories without isolation |
| Option B leaking interactive Use in public HTML | Implementation review + signed-out localhost/Googlebot-style GET |

---

## 17. Revision History

| Version | Date | Story | Description |
|---------|------|-------|-------------|
| v1.2 | 2026-08-27 | S7A-PUBLIC-AUTH-CLOSE-001 | Document Clerk `origin_invalid` on localhost; validate auth through `https://dev.immifin.com` |
| v1.1 | 2026-08-27 | S7A-PUBLIC-AUTH-REG-001 | Explicit Join IMMIFIN / Sign In CTAs must use canonical `/signup` and `/login`, never Login Required gating |
| v1.0 | 2026-08-26 | S7-PUBLIC-002 | Initial approved public discovery vs authenticated Use architecture |
