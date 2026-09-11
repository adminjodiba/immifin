# IMMIFIN Intelligence — Controlled Beta Operations Runbook

| Field | Value |
|-------|-------|
| **Story** | S8-IIP-011 (ops) / S8-IIP-012 (freeze alignment) |
| **Audience** | Product Owner / designated platform administrator |
| **Scope** | Invite-only controlled beta for `/intelligence` and `POST /api/intelligence/ask` |
| **Not in scope** | Full public launch |
| **Sprint 8 engineering** | **FROZEN** — no new Intelligence features until resume criteria |
| **Operational status** | **PRE-BETA ENABLEMENT PENDING** |
| **Recommendation** | **CONDITIONAL GO FOR INVITE-ONLY CONTROLLED BETA** |
| **Public launch** | **NOT APPROVED** |
| **Handoff** | [SPRINT_8_HANDOFF.md](./SPRINT_8_HANDOFF.md) |

---

## 1. Ownership

| Responsibility | Owner role |
|----------------|------------|
| Enable / disable Intelligence | IMMIFIN Product Owner or designated platform administrator |
| Invite / revoke beta users | Same |
| Incident response | Same + engineering on call as needed |
| Legal wording approval | Product Owner (with legal counsel when available) |

Do not assign ownership to an undocumented personal name in this runbook.

---

## 2. Configuration checklist (pre-enable)

| Variable | Required | Notes |
|----------|----------|-------|
| `OPENAI_API_KEY` | Yes for live answers | Server-only; never `NEXT_PUBLIC_` |
| `OPENAI_MODEL` | Yes for live answers | Approved low-cost model id |
| `IMMIFIN_INTELLIGENCE_ENABLED` | Ops | Set `false` to kill; unset/other = enabled |
| `IMMIFIN_INTELLIGENCE_BETA_USER_IDS` | Yes for invites | Comma-separated **Clerk user IDs**; fail closed if unset/empty |

Validate configuration without printing secret values. Missing OpenAI config must not break public routes.

---

## 3. Kill switch — `IMMIFIN_INTELLIGENCE_ENABLED`

### Disable

1. Set `IMMIFIN_INTELLIGENCE_ENABLED=false` in the target environment.
2. Restart or redeploy the runtime so process env is picked up (per environment procedure).
3. Verify: invited Power Ask returns safe unavailable (HTTP 503 / UI unavailable).
4. Verify: provider is not called.

### Enable

1. Confirm allowlist, OpenAI config, and Product Owner approval.
2. Remove the `false` value (or leave unset).
3. Verify one invited Power Ask path with synthetic data only when authorized.

### Expected behavior when disabled

| Surface | Behavior |
|---------|----------|
| UI | Safe unavailable / mapped error — no provider metadata |
| API | `INTELLIGENCE_EXECUTION_DISABLED` (503) |
| Provider | **No execution** |

### Incident triggers for disable

- Provider outage or unsafe content reports
- Privacy concern (possible body capture)
- Unexpected volume
- Legal complaint requiring pause
- Suspected secret exposure

---

## 4. Invite allowlist — `IMMIFIN_INTELLIGENCE_BETA_USER_IDS`

Temporary env allowlist (no migration). Prefer Clerk user IDs over email.

### Invite

1. Obtain the user’s Clerk user ID through an approved admin path.
2. Append the ID to the comma-separated list (exact match).
3. Do not log the allowlist contents in application logs.
4. Confirm the user has Power (`accessAI`).

### Revoke

1. Remove the Clerk user ID from the list.
2. Reload environment.
3. Confirm `/intelligence` shows limited-beta state and API returns `INTELLIGENCE_BETA_NOT_ELIGIBLE`.

### Expected population

Keep the cohort **small** (single-digit to low tens). This temporary acceptance of allow-all abuse control is valid only while the invite list remains small and actively curated. Implement durable rate limiting before expanding beyond controlled beta.

---

## 5. Access model

```text
Authenticated → Power (accessAI) → Beta allowlist → Kill switch off → Ask execution
```

| State | Page | API |
|-------|------|-----|
| Signed out | Protected convention | 401 |
| Free / Pro | Power locked | 403 capability |
| Power, not invited | Limited beta | 403 beta not eligible |
| Power, invited, kill on | Unavailable | 503 disabled |
| Power, invited, kill off | Workspace | Execution when configured |

---

## 6. Support procedures

### General rules

- Ask for **Support reference** (application request ID) on operational failures.
- Do **not** request the full user prompt or answer by default.
- Do not collect priority dates, green card dates, or full profile dumps into tickets unless a separate privacy-safe process is approved.

### Scenarios

| # | Report | First checks | Action |
|---|--------|--------------|--------|
| 1 | Feature unavailable | Kill switch, OpenAI config, provider status | Enable config or keep disabled; communicate calmly |
| 2 | Session / plan issue | Clerk session; effective plan Power? | Billing/capability path — not Intelligence invite |
| 3 | Profile required | Blocking reasons (user-facing labels only) | Guide to `/user-profile` |
| 4 | Provider unavailable | Kill switch off? Provider status? | Disable if needed; escalate |
| 5 | Provider timeout | Transient? | Retry guidance; disable if sustained |
| 6 | Configuration unavailable | `OPENAI_*` present? | Fix env without logging secrets |
| 7 | Kill switch enabled | Intentional? | Confirm with Product Owner |
| 8 | Unexpected volume | Invite list size; provider dashboard | Kill switch; shrink allowlist |
| 9 | Privacy concern | Confirm no body capture in monitors | Kill switch; escalate; preserve request IDs only |
| 10 | Harmful / incorrect answer | Do not store full answer | Kill switch if severe; product review |
| 11 | Legal-advice complaint | Cite Terms / disclaimers | Escalate to Product Owner |
| 12 | Rollback | See §7 | |
| 13 | Access revocation | Remove Clerk ID from allowlist | |
| 14 | Support reference lookup | Correlate by request ID in ops tooling **without** body logs | |
| 15 | Escalation | Product Owner → engineering | |
| 16 | Evidence | Status, request ID, timestamp, plan tier, beta eligible Y/N — **not** Q/A content | |

---

## 7. Rollback procedure

1. Set `IMMIFIN_INTELLIGENCE_ENABLED=false`.
2. Optionally clear `IMMIFIN_INTELLIGENCE_BETA_USER_IDS` (fails closed).
3. Verify signed-out and invited Ask paths no longer execute providers.
4. Record incident notes without question/answer content.
5. Do not deploy unrelated changes as part of emergency rollback unless required.

---

## 8. Abuse-control acceptance (invite-only)

Allow-all typed abuse gate remains **not** public-launch ready.

Temporary acceptance requires:

- Power capability
- Explicit invite allowlist (fail closed)
- Small curated population
- Kill switch ownership
- Request validation / size limits
- Operational monitoring without body capture

**Trigger for durable limiter:** cohort growth, unexplained volume, or any public expansion plan.

---

## 9. Monitoring privacy

IMMIFIN currently has no Sentry/PostHog/session-replay SDK in-repo for Intelligence.

If any future APM or edge logging is enabled:

- Scrub Ask request/response bodies
- Scrub Prompt Payload / Immigration Context
- Mask composer inputs in session replay
- Do not log questions, answers, or allowlist contents

**Pre-enable check:** confirm Cloudflare / platform logs do not store Ask bodies for `/api/intelligence/ask`.

---

## 10. Live provider test

One live non-production OpenAI call requires a **separate, explicit** Product Owner authorization instruction. Until then: mocks / static verification only.

---

## 11. Environment expectations

| Environment | Expectation |
|-------------|-------------|
| Local development | Kill switch + allowlist as needed; no real customer data |
| Preview / tunnel | Same; synthetic profiles only |
| Production beta | Invite-only; kill switch owned; no broad enablement |
