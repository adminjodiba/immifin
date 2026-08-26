# S7-PROD-NOTIFY-FIX-001 — Monthly Update Month Alignment Signoff

| Field | Value |
|-------|-------|
| **Story** | S7-PROD-NOTIFY-FIX-001 |
| **Date** | 2026-08-26 |
| **HEAD at implementation** | `8f01cd67cda7ba9eac2ee701943ab2fba892936b` |
| **Mode** | Implement locally — **no send, no push, no Production deploy** |
| **Result** | **PASS** (local) |

> Diagnostic authority: S7-PROD-NOTIFY-DIAG-002. Production September 2026 bulletin refresh succeeded; Admin Summary showed September; Green Card holder Preview showed August. **No Production emails were sent.** This story fixes the month source in application code only.

---

## Product rule

All Monthly Immigration Update emails in one campaign use the **same** `updateMonthLabel`: the **latest Visa Bulletin month**, not the server calendar month.

Personalized body content stays journey-specific (GC issue date / N-400 vs employment bulletin movement).

---

## Root cause

`assembleGreenCardSource()` used `resolveCalendarUpdateMonthLabel()` → `new Date()` → August 2026 on 2026-08-26.

Admin Summary and employment journeys used `getLatestVisaBulletinMonth()` → `2026-09` → September 2026.

Preview and bulk share `prepareMonthlyImmigrationUpdateForUser()`, so bulk would have sent August to Green Card holders.

---

## Fallback

If latest Visa Bulletin month cannot be resolved, assembly throws `MONTHLY_UPDATE_BULLETIN_MONTH_UNAVAILABLE`. No invented month. Preview/send fail closed. Audience treats it as `assembly_failed`.

---

## Production status

**Implementation story:** not deployed in FIX-001 itself.

**Production follow-up (2026-08-26):** deployed and Product Owner validated. Live Production at signoff is `bd4da029ce8f4de651b41514cea8af9e6b33c343` / Worker `2ec0e5fe-7104-40f8-96ce-e4ebfcc38324`. Received subject: `IMMIFIN | Your September 2026 Immigration Update`. Record: [S7_PROD_NOTIFY_SEPTEMBER_2026_PRODUCTION_SIGNOFF.md](./S7_PROD_NOTIFY_SEPTEMBER_2026_PRODUCTION_SIGNOFF.md).

---

## Email / campaign audit (this story)

| Action | Result |
|--------|--------|
| Preview send (`action: "send"`) | **Not executed** |
| Bulk send | **Not executed** |
| Resend | **Not called** |
| `notification_campaigns` mutation | **NONE** |
| Visa Bulletin refresh | **Not executed** |

---

## Verifier

`npx tsx scripts/verify-s7-prod-notify-fix-001-month-alignment.mjs` — **PASS**

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `next lint` (changed files) | PASS |
| `http://localhost:3000/` | 200 |
| `https://dev.immifin.com/` | 200 |
| Authenticated Preview Sample | Not exercised (no admin session; would be `action: "preview"` only) |
