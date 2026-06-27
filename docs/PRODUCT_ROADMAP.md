# Immifin — Product Roadmap

High-level delivery phases for the Immifin platform. Each phase builds on the previous; scope may be refined as we ship and learn.

---

## Phase 1 — Authentication, User Management, Admin Portal

**Status:** In progress

- Clerk authentication (sign-up, login, sessions)
- Supabase `profiles` sync via webhooks
- Structured identity fields (`first_name`, `last_name`, `display_name`)
- Account lifecycle (create, update, soft-delete, restore on re-signup)
- Role and plan on `profiles` (`user` / `admin`, `free` / `basic` / `pro`)
- `/account` and `/admin` surfaces
- Admin audit logging foundation

---

## Phase 2 — Immigration Profiles

- `immigration_profiles` extension (1:1 with `profiles`)
- User-facing immigration preferences and case context
- Ties into existing visa bulletin tools and calculators

---

## Phase 3 — Saved Calculations

- Persist calculator inputs and results per user
- History and resume across sessions
- Green card wait time, citizenship eligibility, and related tools

---

## Phase 4 — Stripe Subscription

- `subscriptions` table activation
- Plan enforcement (`free`, `basic`, `pro`)
- Billing portal and webhook sync

---

## Phase 5 — AI Immigration Assistant

- Guided Q&A over immigration and finance topics
- Grounded in Immifin content and user profile context
- Guardrails and disclaimers (not legal advice)

---

## Phase 6 — Finance Tools

- Expanded finance guides and calculators
- Credit, investing, and tax content for immigrants
- Integration with account and subscription tiers

---

## Phase 7 — Mobile App

- Native or cross-platform mobile experience
- Auth via Clerk
- Core calculators and visa bulletin access on mobile

---

## Principles

1. Ship vertical slices (auth → profiles → features) rather than big-bang releases.
2. Public visa bulletin and calculator pages stay useful without an account.
3. Paid and admin capabilities layer on top of a stable profile model.
