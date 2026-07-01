# IMMIFIN Sprint Release Acceptance Checklist

Mandatory checklist before every production deployment.

See also: [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) · [ENGINEERING_PLAYBOOK.md](./ENGINEERING_PLAYBOOK.md)

---

## Release metadata

| Field | Value |
|-------|-------|
| **Release Version** | |
| **Sprint** | |
| **Date** | |
| **Developer** | |
| **Architect** | |

---

## Section 1 — Infrastructure

- [ ] `git status` is clean
- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Cloudflare Dev Tunnel is running (if webhook/auth/profile changes)
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
- [ ] No 530
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

- [ ] Commit history reviewed
- [ ] Repository clean
- [ ] Documentation updated
- [ ] Migration committed
- [ ] Build successful
- [ ] Push to GitHub
- [ ] Cloudflare deployment successful
- [ ] Production smoke test completed

---

## GO / NO GO

| Decision | |
|----------|---|
| **GO** | ☐ |
| **NO GO** | ☐ |

### Known Issues

<!-- List any known issues accepted for this release -->

### Deferred Items

<!-- List items intentionally deferred to a future sprint -->

### Lessons Learned

<!-- Document infrastructure or process findings from this release -->

### Approvals

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Architect Approval** | | | |
| **Developer Approval** | | | |
