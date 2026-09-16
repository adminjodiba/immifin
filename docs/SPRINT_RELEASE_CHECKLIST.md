# IMMIFIN Sprint Release Acceptance Checklist

Mandatory checklist before every production deployment.

See also: [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) · [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md)

---

## Release metadata

| Field | Value |
|-------|-------|
| **Release Version** | Sprint 7A go-live (packaged; not yet a production version bump) |
| **Sprint** | Sprint 7A — Production / Marketing |
| **Date** | 2026-09-15 |
| **Developer** | Cursor (implementation) |
| **Architect** | Technical Architecture / Product Owner (pending push/deploy approval) |
| **Branch** | `release/s7a-go-live` |
| **HEAD at closeout start** | `23343740b1d7ef84903303fe6e3f290fe84c2e06` |

---

## Sprint 7A closeout evidence (S7A-RELEASE-CLOSEOUT-011)

Mark only what this closeout and MERGE-010 actually proved. Production items stay pending.

### Local / release-branch validation

- [x] TypeScript `npx tsc --noEmit --pretty false` PASS (MERGE-010; re-run this closeout)
- [x] ESLint `npx next lint` PASS — no errors; 2 known warnings remain (H-1B `aria-selected`; `useFavorites` exhaustive-deps)
- [x] `npm run build` PASS (MERGE-010; re-run this closeout)
- [x] Localhost public smoke PASS after merge (homepage, About, Contact, What Users Say, Share Feedback, sitemap)
- [x] Security deletions preserved (`/api/debug/clerk-env`, `/api/debug/supabase`, `/api/google-test`, `/api/visa-bulletin/sheets` absent)
- [x] Admin feedback APIs remain `requireAdmin()`
- [x] Daily sheet sync route remains Bearer-secret protected
- [x] Combined Cloudflare config present in branch (custom Worker, 05:01/06:01 UTC crons, R2, D1, DO, migration v1, OpenNext persistent cache)
- [x] Canonical documentation updated to the merged as-built state
- [x] Feedback migrations `019` / `020` are in this release commit history

### Not complete — do not treat as done

- [ ] Working tree clean of all untracked files (46 excluded local/generated files remain untracked by design)
- [ ] Push to GitHub
- [ ] Merge into `main`
- [ ] Cloudflare / Production deployment
- [ ] Production smoke test
- [ ] Production cron verification (12:01 AM America/Chicago)
- [ ] Production What Users Say 24-hour cache persistence verification
- [ ] `DAILY_SHEET_SYNC_SECRET` confirmed set on the Production Worker (name only; do not print value)

---

## Section 1 — Infrastructure

- [ ] `git status` is clean
- [x] `npm run build` passes (release branch; not a Production deploy)
- [x] No TypeScript errors
- [x] No ESLint errors (2 known warnings accepted for this release)
- [ ] Cloudflare Dev Tunnel is healthy when the release requires `https://dev.immifin.com` (auth/webhooks/profile **or** tunnel-based public/SEO checks). Confirm with `curl.exe -I https://dev.immifin.com` → **HTTP 200**. Windows **Cloudflared** service **Running** is **not** sufficient. If 530 / no connector: [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) **Development tunnel recovery** (stop service, known-good DNS + HTTP/2 command, token **local only**).
- [ ] Clerk Dev webhook endpoint reachable
- [ ] Supabase connected
- [ ] Google Sheets connection working
- [ ] Environment variables verified
- [ ] No console errors

---

## Section 2 — Authentication

### Signup

- [ ] New user signup
- [ ] Email verification code received
- [ ] Email verified
- [ ] Login successful
- [ ] Logout successful

### Login

- [ ] Password login
- [ ] Email OTP login
- [ ] Remember session
- [ ] Invalid password handled correctly
- [ ] Deleted user cannot login

### Profile

- [ ] Account tab
- [ ] Security tab
- [ ] Profile image upload
- [ ] Password change
- [ ] Email update
- [ ] Close button exits profile

---

## Section 3 — Profile Management

### Immigration

- [ ] Category
- [ ] Country
- [ ] Priority Date
- [ ] Bulletin Type

### Green Card

- [ ] Green Card Issue Date
- [ ] Married to US Citizen

### Contact

- [ ] Country Code
- [ ] Phone Number
- [ ] Mandatory validation
- [ ] Saved correctly

### Notifications

- [ ] SMS alerts
- [ ] Email alerts
- [ ] Visa Bulletin
- [ ] Priority Date
- [ ] Citizenship Reminder
- [ ] Marketing

### Persistence

- [ ] Refresh browser
- [ ] Values remain

---

## Section 4 — Onboarding

- [ ] New user redirected to onboarding
- [ ] Existing user skips onboarding
- [ ] Missing phone triggers onboarding
- [ ] Saving phone exits onboarding
- [ ] Complete Profile shown only once
- [ ] After first successful contact-status check, navigating to `/` (e.g. Close) does **not** flash “Loading profile…” again
- [ ] Logout then login as another user re-runs the contact-status check

---

## Section 5 — Immigration

### Visa Bulletin Dashboard

- [ ] Loads
- [ ] Current bulletin
- [ ] Previous bulletin
- [ ] Movement tracker
- [ ] Historical graph
- [ ] Filing dates
- [ ] Final Action dates

### Green Card Calculator

- [ ] Auto-prefill
- [ ] Auto calculation
- [ ] Manual calculation
- [ ] Existing GC behavior

### Citizenship Calculator

- [ ] Auto-prefill
- [ ] Manual calculation

---

## Section 6 — Synchronization

### Clerk

- [ ] `user.created`
- [ ] `user.updated`
- [ ] `user.deleted`

### Supabase

- [ ] Active profile
- [ ] Deleted profile
- [ ] Reactivation works

### Webhook

- [ ] 200 response
- [ ] No 530 (530 = tunnel has no active connector until proven otherwise — recover per [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md); do not treat as an application defect)
- [ ] No 400

---

## Section 7 — Navigation

- [ ] Homepage
- [ ] Immigration
- [ ] Finance
- [ ] Calculators
- [ ] Dashboard (future)
- [ ] Avatar
- [ ] Manage Profile
- [ ] Legacy `/account`

---

## Section 8 — Regression

Verify nothing previously working is broken.

- [ ] Login
- [ ] Signup
- [ ] OTP
- [ ] Profile
- [ ] Contact
- [ ] Notifications
- [ ] Green Card
- [ ] Citizenship
- [ ] Visa Bulletin
- [ ] Movement Tracker
- [ ] History
- [ ] APIs
- [ ] Middleware
- [ ] Webhooks

---

## Section 9 — Production Readiness

- [x] Commit history reviewed (MERGE-010 parents `8f001fc` + `bdd0075`)
- [ ] Repository clean
- [x] Documentation updated (S7A-RELEASE-CLOSEOUT-011)
- [x] Migration committed (`20260912120000_019_user_feedback.sql`, `20260913120000_020_user_feedback_history.sql`)
- [x] Build successful
- [ ] Push to GitHub
- [ ] Cloudflare deployment successful
- [ ] Production smoke test completed

---

## GO / NO GO

| Decision | |
|----------|---|
| **GO** | ☐ Ready to push after Product Owner approval — local validation complete |
| **NO GO** | ☐ |

Local closeout recommendation: **READY TO PUSH**. Production deploy, cron, and WUS cache verification remain post-push.

### Known Issues

- `H1bWageLevelEstimator` accessibility lint warning (`role="option"` without `aria-selected`) — accepted for this release
- `useFavorites` `react-hooks/exhaustive-deps` warning — accepted for this release
- What Users Say daily snapshot may show previously cached approved content for up to 24 hours if production cache persists; no `revalidateTag` on moderation
- Production persistence of that 24-hour cache is **unverified until after deploy**

### Deferred Items

- Admin Feedback year-count query fan-out optimization
- Contact form Clerk `ready` field-enable UX
- Unused `ContactOfficeCard` and unused `getPublishedUserFeedback()`
- Optional homepage `og:image`
- Optional WUS `revalidateTag('what-users-say-daily')` on approve/pool delete
- Full generic checklist sections 2–8 (signup/profile/immigration E2E) were not re-run in this closeout

### Lessons Learned

- `origin/main` persistent-cache bindings and Sprint 7A custom Worker/crons must both be preserved; merge resolved that combination without dropping either side
- Diagnostic/test routes (`/api/debug/clerk-env`, `/api/debug/supabase`, `/api/google-test`, `/api/visa-bulletin/sheets`) stay deleted

### Approvals

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Architect Approval** | | | Pending — required before push |
| **Developer Approval** | | | Documentation closeout complete; push not authorized by this task |
