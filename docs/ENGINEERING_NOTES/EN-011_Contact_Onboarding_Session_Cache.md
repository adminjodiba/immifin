# Contact Onboarding Guard — Session Cache

| Field | Value |
|-------|-------|
| **Engineering Note** | EN-011 |
| **Version** | 1.0 |
| **Sprint** | Sprint 7 |
| **Status** | Living document |
| **Related ADR** | ADR-003 in `docs/CURRENT_PROJECT_STATE.md` |

---

## Purpose

Explain why `ContactOnboardingGuard` checks phone completeness only **once per signed-in session**, and how that relates to homepage UX.

---

## Problem

The homepage wraps content in `ContactOnboardingGuard` with `publicLanding`. For signed-in users the guard called `GET /api/account/contact-status` on **every** mount of `/`.

That produced a visible flash:

1. Navigate to `/` (e.g. page **Close** → home)
2. Brief “Loading profile…”
3. Home again

The check was correct for incomplete profiles, but repeating it on every navigation was poor UX for users who already completed contact onboarding.

---

## Decision

Cache the contact-status outcome in memory for the current browser session, keyed by Clerk `userId`.

| Cached value | Meaning |
|--------------|---------|
| `ok` | Phone present (or fail-open). Do not call the API again; render children. |
| `needs_phone` | Phone missing. Redirect to `/onboarding/contact-preferences` without refetching. |

Clear the cache on logout / when `userId` becomes null. Mark `ok` when the user saves phone on the onboarding page.

---

## Behavior by surface

| Surface | First check (no cache) | Later navigations (cache hit) |
|---------|------------------------|-------------------------------|
| Public `/` (`publicLanding`) | Keep landing visible; check in background; redirect only if needed | Instant render; no API call |
| Protected pages (`/user-profile`, `/dashboard`, `/account`, …) | May show “Loading profile…” once until the check finishes | Instant render when cache is `ok` |

---

## Why not middleware?

ADR-003 forbids profile/Supabase lookups in `middleware.ts` (Cloudflare Worker Error 1102). The client guard remains the enforcement point; the cache only reduces **repeat** client checks within one login session.

---

## Key files

| File | Role |
|------|------|
| `components/onboarding/ContactOnboardingGuard.tsx` | Guard + loading UX |
| `lib/onboarding/contactStatusCache.ts` | In-memory session cache |
| `components/onboarding/OnboardingContactPreferencesContent.tsx` | Marks cache `ok` after phone save |
| `app/api/account/contact-status/route.ts` | Source of truth for phone presence |

---

## Constraints for future changes

- Do not put this lookup back in middleware.
- If the cache is removed, restore an alternative that avoids flashing “Loading profile…” on every return to `/`.
- Full page reload still starts a new JS heap → cache empty → one check again (expected).
