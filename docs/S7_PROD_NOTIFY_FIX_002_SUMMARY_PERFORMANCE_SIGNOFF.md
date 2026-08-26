# S7-PROD-NOTIFY-FIX-002 — Fast Audience Summary Signoff

| Field | Value |
|-------|-------|
| **Story** | S7-PROD-NOTIFY-FIX-002 |
| **Date** | 2026-08-26 |
| **HEAD at implementation** | `698d0106d17d35fb86380a1a4bdfe1d4bff23081` |
| **Mode** | Implement locally — **no send, no push, no Production deploy** |
| **Result** | **PASS** (local) |

> Diagnostic authority: S7-PROD-NOTIFY-DIAG-003. Production Refresh Summary could wait ~60 seconds then return HTTP 404 because audience counting ran full Monthly Update assembly (Google Sheets / movement) per active user. **No emails were sent in this story.**

---

## Root cause

`resolveMonthlyUpdateAudience()` called `prepareMonthlyImmigrationUpdateForUser()` for every active user. That is the **send/preview assembler**, including Visa Bulletin history and (for employment) four movement-related Google Sheets plus journey bulletin reads.

With 5 Production users, Summary could approach the Worker **60s** budget. The route does not return 404; the platform abort after that wait presented as HTTP 404.

---

## Old architecture

```
Refresh Summary
  → resolveMonthlyUpdateAudience()
    → for each active user:
         prepareMonthlyImmigrationUpdateForUser()  // full email + Sheets
```

Preview and bulk send also used that assembler (correct for those paths).

---

## New summary architecture

```
Refresh Summary
  → getLatestVisaBulletinMonth() once (FIX-001 campaign month)
  → resolveMonthlyUpdateAudience()
    → evaluateMonthlyUpdateSummaryEligibility()  // local only
```

Cheap eligibility uses stored plan, notification prefs, email validity, and local journey completeness (`hasCompleteImmigrationProfile` / Green Card date math). It does **not** call `prepareMonthlyImmigrationUpdateForUser` or `getVisaBulletinMovement`.

---

## Summary vs Send

| Path | Assembly |
|------|----------|
| **Summary** | Cheap preflight estimate |
| **Preview (one user)** | Full `prepareMonthlyImmigrationUpdateForUser()` |
| **Bulk send** | Full `prepareMonthlyImmigrationUpdateForUser()` per candidate **before** Resend. Assembly errors skip that user (no invalid email). |

Do not treat Summary counts as a substitute for send-time validation.

---

## Performance safety

For a 5-user dataset, Summary no longer performs N full assemblies or per-user Sheets movement reads. `wrangler.jsonc` `cpu_ms` was **not** raised.

---

## Production status

**NOT DEPLOYED.** Worker `immifin` / `6c29597e-…` still runs the N-assembly Summary until a later controlled bugfix package is deployed.

---

## Email / campaign audit (this story)

| Action | Result |
|--------|--------|
| Preview send | **Not executed** |
| Bulk send | **Not executed** |
| Resend | **Not called** |
| `notification_campaigns` mutation | **NONE** |
| Visa Bulletin refresh | **Not executed** |

---

## Verifier

`npx tsx scripts/verify-s7-prod-notify-fix-002-summary-performance.mjs`

Also: `scripts/verify-s7-prod-notify-fix-001-month-alignment.mjs` must remain PASS.
