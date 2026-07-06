# IMMIFIN Release Notes — v0.4.2

| Field | Value |
|-------|-------|
| **Version** | v0.4.2 |
| **Sprint** | Sprint 5 — Design System 2.0 & Dashboard Polish |
| **Release Date** | 2026-07-06 |
| **Status** | Production promotion |
| **Owner** | Technical Architecture (CTO) |

**Related documentation:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [PRODUCT_VISION.md](./PRODUCT_VISION.md) · [BUSINESS_MODEL.md](./BUSINESS_MODEL.md)

---

## Summary

v0.4.2 polishes the **My Immifin dashboard**, completes **Design System 2.0 workspace layout** across public pages, adds **Favorites** (Pro/Power), improves **Pro/Power calculator auto-population**, and documents **subscription data retention** (tier changes never delete saved profile data).

---

## Personal dashboard

### Journey timeline cards

| Change | Detail |
|--------|--------|
| Compact layout | Shorter timeline, single-line marker labels, smaller status summary |
| Label placement | Priority Date and Today above bar; Current Filing / Final Action cutoff below bar |
| Connectors | Vertical dotted lines linking labels to progress bar markers |
| Days Since Priority Date | Moved to card header (Dates for Filing card only) |
| Removed clutter | Duplicate bottom KPI row, info icon, redundant explanation banner |
| Current Visa Bulletin | Loaded from Google Sheet history (`getLatestVisaBulletinMonth`) instead of hardcoded sample data |

### Sidebar (Immigration Details)

| Change | Detail |
|--------|--------|
| Renamed | **Your Journey** → **Immigration Details** |
| Category + Country | One row, two columns |
| Removed | Preferred Bulletin Type, Last Updated (misleading / unused on dashboard) |
| Order | Today's Focus above How It Works |
| How It Works | Trimmed to Priority Date + green/red meaning only |

### Action Center

| Change | Detail |
|--------|--------|
| Layout | Horizontal table (Action · Description · Status) |
| Placement | Main column, directly under Final Action Date card |
| Links | Action names styled as hyperlinks |

### Header copy

- Dashboard welcome subtitle: **Your personalized Dashboard**
- Removed Immigration Journey section subtitle

---

## Favorites (Pro / Power)

- Nav item between My Immifin and About
- Star on page titles via `FavoriteStar` + `PageHeader`
- Max 10 favorites; stored in `immigration_profiles.preferences.favorites`
- API: `/api/account/favorites`
- Free users see Pro gate; saved favorites preserved on downgrade

---

## Calculators — Pro / Power auto-population

- `useImmigrationProfileDefaults` waits for subscription tier before loading profile
- **Green Card Wait Time** and **Citizenship Eligibility** prefilled from saved profile
- Auto-calculates on load when profile fields are complete
- Users can override fields and click Calculate
- `CalculatorProfilePrefillHint` for Pro/Power users; upgrade hint for Free

---

## Subscription & access

| Area | Detail |
|------|--------|
| Dashboard gate | Free / downgraded users see blurred real dashboard (`PremiumFeaturePreview`) |
| Data retention | `lib/subscription/dataRetention.ts` — tier change gates access only; never wipes favorites, immigration profile, notifications, or contact data |
| Favorites API | Downgraded users receive stored favorites with `accessLocked: true` |
| Tier refresh | `useEffectiveSubscriptionTier` listens to subscription tier events |

---

## Design System 2.0 — workspace layout

Shared components: `WorkspacePageShell`, `WorkspacePageHeader`, `WorkspaceSection`

Migrated pages include Immigration, Finance, Calculators, Insurance, About, Contact, Privacy, Terms, Pricing, Account, Dashboard, homepage sections below hero, calculator pages, and auth shells.

---

## Files of note

| Area | Path |
|------|------|
| Timeline card | `components/dashboard/VisaBulletinJourneyCard.tsx` |
| Dashboard layout | `components/dashboard/EmploymentBasedJourneyDashboard.tsx`, `JourneyDashboardLayout.tsx` |
| Immigration Details | `components/dashboard/YourJourneySidebarCard.tsx` |
| Action Center | `components/dashboard/DashboardActionCenterCard.tsx` |
| Bulletin month | `lib/dashboard/employmentJourney.ts`, `lib/visaBulletinHistory.ts` |
| Favorites | `lib/account/favorites.ts`, `app/api/account/favorites/` |
| Calculator defaults | `lib/hooks/useImmigrationProfileDefaults.ts` |
| Data retention | `lib/subscription/dataRetention.ts` |

---

## Deployment

Push to `main` triggers Cloudflare production build (Git auto-deploy).

Verify after deploy:

- [ ] `/dashboard` — compact timeline cards, Immigration Details sidebar, Action Center table
- [ ] Pro user — calculator auto-fill on `/calculators/green-card-wait-time`
- [ ] Favorites — star, save, nav list (Pro/Power)
- [ ] Free user — blurred dashboard preview, upgrade paths intact
