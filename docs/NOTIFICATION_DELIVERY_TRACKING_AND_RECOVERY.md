# Notification Delivery Tracking & Recovery — Closure Record

| Field | Value |
|-------|-------|
| **Task** | NOTIF-DS2-CLOSE-039 |
| **Status** | **Implementation closed in Production; future real-campaign end-to-end operational validation remains open** |
| **Completed scope** | Recipient-level delivery evidence, Delivery Details, guarded manual failed-recipient recovery, and clickable latest-status filters |
| **Production baseline** | `4028d0a2f9e5c45a244e3b8abcc0010e19b9e996` |
| **Verified Production Worker** | `1e9782c6-695c-41a7-8afa-a28803470e1a` |
| **Closure date** | 2026-10-17 |

**Related:** [NOTIFICATION_DESIGN.md](./NOTIFICATION_DESIGN.md) · [NOTIFICATION_PLATFORM_SIGNOFF.md](./NOTIFICATION_PLATFORM_SIGNOFF.md) · [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md)

> **Evidence language:** `Provider Accepted` means the configured provider accepted the submission and returned a successful API result. It is **not** proof that a recipient received, opened, or read an email. IMMIFIN has not added authenticated provider delivery-event persistence in this scope, so this document does not describe any result as confirmed inbox delivery.

---

## 1. Closure scope and release record

This record closes the implemented Delivery Details work for Monthly Immigration Update campaigns:

- durable, recipient-level original-audience and delivery-attempt evidence;
- an Admin read-only Delivery Details view with recovery-run history;
- guarded, manual recovery of persisted explicit failures only;
- four clickable delivery-status filters whose filtering is performed on the server; and
- Production release of the rendering correction and clickable filters.

| Commit | Release content |
|--------|-----------------|
| `b6e1310` | Delivery Details rendering fix |
| `4028d0a` | Clickable delivery status filters |

The Git-integrated Cloudflare release of `4028d0a` completed successfully as build `c7a55526-1e3a-4a88-a256-6bab49645e5a`, producing Production Worker version `1e9782c6-695c-41a7-8afa-a28803470e1a`. No manual Wrangler deployment, Worker configuration change, Durable Object migration change, database migration, notification send, retry, replay, or notification-record edit was part of that release.

The deployed Worker still declares `NEXT_CACHE_DO_QUEUE` / `DOQueueHandler` migration v1 and `ABUSE_GATE` / `AbuseGate` migration v2; this feature did not alter either declaration.

---

## 2. Recipient tracking model and lifecycle

Tracking applies to future recipient-tracked Monthly Immigration Update campaigns. For each evaluated profile, the platform persists one stable campaign-recipient identity and its original audience decision. The recipient row holds a convenience projection, `latest_delivery_state`; immutable rows in the delivery-attempt ledger remain the authoritative operational evidence.

The original send and a recovery both follow the same high-level lifecycle:

1. Persist the original audience outcome for the campaign recipient: `eligible` or `excluded`.
2. Before an eligible profile is submitted to a provider, atomically claim an immutable delivery attempt and mark its projected state `attempt_in_progress`.
3. Reload current authoritative profile data; evaluate the normal eligibility, entitlement, preference, email, journey, and content-assembly conditions.
4. Render current personalized content and submit through the Notification Service/provider adapter using the persisted provider-submission idempotency key.
5. Finalize the immutable attempt with a terminal outcome and update `latest_delivery_state` to that outcome.

The system retains original audience evidence separately from send-time/recovery outcomes. An originally excluded profile is represented as `audience_excluded`; it is not a failed send and is not included in the `Skipped` recovery-outcome filter.

### Delivery-state vocabulary

| State | Meaning | Automatic recovery eligibility |
|-------|---------|--------------------------------|
| `audience_excluded` | The profile was excluded during original audience evaluation. No send attempt is made. | No |
| `eligible_pending` | Originally eligible recipient exists before an attempt is claimed. | No |
| `attempt_in_progress` | An attempt has been atomically claimed and is not terminal yet. | No |
| `provider_accepted` | The provider accepted the API submission; provider message ID is retained when supplied. This is not inbox-delivery proof. | No |
| `failed_before_provider` | Eligibility recheck, preparation, rendering, configuration, or equivalent pre-provider work failed. | Yes |
| `failed_provider` | The provider returned an explicit unsuccessful/rejected result. | Yes |
| `submission_unknown` | A timeout, exception, or uncertain provider submission means IMMIFIN cannot prove whether the provider accepted it. | No — manual investigation only |
| `skipped_ineligible` | A recovery candidate no longer meets current requirements, so no provider call is made. | No automatic retry |

`failed_before_provider` and `failed_provider` are the only states counted as retryable failures. A provider exception or an unsuccessful result marked submission-uncertain becomes `submission_unknown`, which is deliberately not retried automatically because a duplicate email cannot be ruled out.

---

## 3. Delivery Details and server-side status filters

Delivery Details is an Admin-only, read-only evidence surface for one Monthly Immigration Update campaign. The API requires ordinary Admin authorization before validating request parameters.

### Clickable cards

The four summary cards are interactive filters over recipient rows:

| Card | Query value | `latest_delivery_state` selection |
|------|-------------|------------------------------------|
| Provider Accepted | `provider_accepted` | `provider_accepted` |
| Failed | `failed` | `failed_before_provider`, `failed_provider` |
| Skipped | `skipped` | `skipped_ineligible` |
| Submission Unknown | `submission_unknown` | `submission_unknown` |

The selected card is visually active and exposed as a pressed control. Selecting that same active card again clears the filter. When any filter is active, **Show All** clears it. Changing or clearing a filter resets the view to page 1.

The UI sends `status` to the Delivery Details endpoint. The endpoint accepts only the four values above; an omitted or empty `status` is backward-compatible and returns all recipient outcomes. After Admin authorization, an unsupported value returns HTTP 400 with `NOTIFICATION_INVALID_INPUT`.

### Query and pagination behavior

Filtering is implemented by applying the state predicate to `notification_campaign_recipients.latest_delivery_state` **before** the exact count and pagination range query. Therefore:

- filter totals and page counts describe the selected latest-state subset, not just the current browser page;
- rows are ordered by latest state, then profile ID, then recipient ID;
- the default page size is 50, the API permits page sizes from 1 through 100, and the UI requests 50 rows per page;
- pagination is campaign-wide for the selected filter, so a matching set larger than 50 is traversed with ordinary next/previous paging; and
- the four dashboard card counts remain campaign-wide summary counts and are not recomputed from the current page.

Because the predicate reads `latest_delivery_state`, filtering is post-recovery aware. If a retry changes a recipient from an explicit failure to `provider_accepted`, that recipient no longer appears under `Failed` on the next Delivery Details load; the immutable original and recovery attempts remain available as evidence.

---

## 4. Guarded failed-recipient recovery

Recovery is a child operation of its original campaign, never a new monthly campaign and never a **Retry Entire Campaign** control. The Admin UI can offer **Retry N Failed Recipients** only when all of the following are true:

- recipient-level tracking exists for the campaign;
- the campaign is not legacy;
- the server reports at least one retryable explicit failure; and
- no recovery run is currently `requested` or `processing`.

The browser does not select recipient IDs. The recovery request requires Admin authorization, explicit confirmation, and an idempotency key. The server/database then:

1. locks/claims a recovery run for the campaign, with an idempotency key and a one-active-run concurrency backstop;
2. rejects a campaign without recipient evidence as legacy, rejects nonrecoverable campaign states, and stops if no explicit retryable failures remain;
3. selects only recipient rows whose current state is `failed_before_provider` or `failed_provider`;
4. atomically claims each individual recovery attempt, preventing duplicate work for a claimed, provider-accepted, in-progress, or no-longer-retryable recipient;
5. reloads the current profile and reapplies normal bulk eligibility and content-assembly checks before any provider call;
6. records a newly ineligible candidate as `skipped_ineligible` rather than sending it; otherwise regenerates current personalized content and submits through the Notification Service; and
7. finalizes the recovery run from immutable attempt evidence.

The recovery-run history lists the requested/completed timestamps and persisted targeted, Provider Accepted, failed, skipped-ineligible, and submission-unknown counts. The retry endpoint also writes an Admin audit entry with the actor and resulting counts. A repeated request with the same idempotency key is represented as the existing operation rather than starting another recovery run.

Administrators must not treat an individual send as a bulk recovery. The existing Admin **Notify Individual User** capability is a distinct deliberate operation and is not represented as failed-recipient recovery.

---

## 5. October 2026 legacy campaign limitation

The October 2026 Monthly Immigration Update campaign is explicitly a **legacy campaign** for this feature. Recipient-level tracking was introduced after that campaign's send evidence was created, and historical campaigns were intentionally not backfilled.

Campaign-level aggregate counters cannot safely identify which recipient failed, whether a provider submission was uncertain, or which recipient must not be sent again. For that reason, a campaign with no recipient tracking rows:

- displays the legacy notice rather than recipient-level outcomes;
- cannot use automated failed-recipient recovery; and
- cannot become retryable merely from aggregate counters.

This is a deliberate duplicate-prevention and auditability boundary, not a missing UI action. The October 2026 campaign must not be retried through this recovery workflow.

---

## 6. Administrator operating procedure

### Investigate a campaign

1. Sign in with an authorized Production Admin account and open **Admin → Notifications**.
2. Open the relevant Monthly Immigration Update campaign and expand **Delivery Details**.
3. Read the campaign-wide counts, then select a status card to inspect its filtered recipient rows. Select the active card again or choose **Show All** to clear the filter.
4. Review each row's current state, original eligibility, latest attempt type/number/time, and retryability. Review recovery-run history before initiating another operation.
5. For `provider_accepted`, report only that the provider accepted the submission. Do not promise confirmed inbox delivery.
6. For `submission_unknown`, do not retry from this control. Preserve the evidence and reconcile with available provider/support evidence before considering any separately authorized action.
7. For `failed_before_provider` or `failed_provider`, investigate the stored failure stage/reason and current profile conditions. The recovery flow will recheck eligibility and regenerate content; it does not reuse a historical rendered message.

### Initiate permitted recovery

1. Confirm the campaign is tracked, non-legacy, has an enabled **Retry N Failed Recipients** action, and no active recovery run.
2. Use the confirmation dialog only after reviewing the failure set. The displayed count is an eligibility indicator; the server determines the actual recipients when it runs.
3. Confirm the recovery. Do not use browser retries or a different ad hoc recipient list to bypass the server-owned selection.
4. Wait for the result, then use **Check Delivery Details** to reload the latest persisted state and recovery history.
5. If the result is ambiguous, do not start a new operation automatically. Recheck Delivery Details or safely repeat the same idempotent request only through the supported workflow.

No recovery should be initiated for a legacy campaign, `submission_unknown` recipient, Provider Accepted recipient, or audience exclusion. Normal operational authorization remains required for any live recovery.

---

## 7. Verification record and remaining follow-up

### Completed verification

- TypeScript check passed: `tsc --noEmit`.
- Production build passed: `npm run build`; 96 pages generated.
- Cloudflare Git-integrated deployment completed for `4028d0a`; Production home page returned HTTP 200.
- The excluded demo route, `https://immifin.com/admin/demo-notification-recovery`, returned HTTP 404 in Production.
- A localhost simulated recovery demonstration was visually reviewed successfully by the Product Owner. It was a local simulation only: it did not create a Production recipient record, perform a Production recovery, or confirm any inbox delivery.

### Explicitly pending operational follow-up

The implementation is closed. The following is intentionally recorded as a future operational validation on a **real newly tracked campaign**, not as a condition to reopen the completed implementation:

1. With an authenticated Production Admin session, verify the four cards, active-card toggle-to-clear, Show All, zero-result states, and a filter spanning more than 50 recipients.
2. Verify an authenticated invalid `status` request returns HTTP 400.
3. During normal operations only—not solely to test this feature—observe latest-state filtering after a genuine permitted recovery operation.

No fabricated recipient records, recovery outcomes, sends, or retries were used to close this documentation task.

---

## 8. Closure decision

**Notification Delivery Details implementation is closed.** The code, released Production behavior, documentation, and operating boundaries are recorded here. Future real-campaign end-to-end validation remains a follow-up under normal operations and does not authorize a new Notification Platform enhancement by itself.