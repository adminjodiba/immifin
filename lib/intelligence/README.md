# IMMIFIN Intelligence Platform — Foundation

| Field | Value |
|-------|-------|
| **Tasks** | S8-IIP-001 … S8-IIP-012 |
| **Module** | `lib/intelligence/` + `app/api/intelligence/ask` + `app/intelligence` |
| **Engineering status** | **FROZEN** |
| **Operational status** | **PRE-BETA ENABLEMENT PENDING** |
| **Launch recommendation** | **CONDITIONAL GO FOR INVITE-ONLY CONTROLLED BETA** |
| **Public launch** | **NOT APPROVED** |

## Current architecture

```text
/intelligence (client accessAI → server beta allowlist)
  → POST /api/intelligence/ask
  → requireUser() + assertCapability(accessAI)
  → resolveIntelligenceBetaEligibility(clerk_user_id)
  → kill switch (IMMIFIN_INTELLIGENCE_ENABLED)
  → validate { question, providerId }
  → abuse-control boundary (allow-all typed default)
  → executeIntelligenceRequest(...)
  → safe JSON response (private, no-store)
```

| Layer | Location |
|-------|----------|
| Context / Request / Prompt | `context/`, `request/`, `prompt/` |
| Providers / OpenAI / Bootstrap | `providers/`, `providers/openai/`, `bootstrap/` |
| Intelligence Service | `service/` |
| Authenticated API | `api/` + `app/api/intelligence/ask` |
| Controlled beta eligibility | `beta/` |
| Client ask helpers | `client/` |
| Workspace UI | `app/intelligence/`, `components/intelligence/` |

## Feature scope (implemented)

* Single-turn Ask only
* Power capability + controlled-beta allowlist
* Plain-text answers; no streaming; no chat history; no app persistence
* No RAG / citations / tool calling / model selector (deferred)

## Gating model

1. Authentication  
2. `accessAI` (Power)  
3. Beta allowlist (`IMMIFIN_INTELLIGENCE_BETA_USER_IDS`)  
4. Kill switch (`IMMIFIN_INTELLIGENCE_ENABLED`)  
5. Provider configuration  

## Controlled-beta state

S8-IIP-011 implemented allowlist + limited-beta UI + API denial + ops runbook. Status: **COMPLETE WITH OPEN PRE-ENABLE ACTIONS**. Cohort not enabled for real users.

## Kill switch

`IMMIFIN_INTELLIGENCE_ENABLED=false` → safe unavailable; no provider execution.

## Provider limitation

OpenAI adapter only; temporary client `providerId: "openai"` for API compatibility — no UI selector.

## Non-persistence

IMMIFIN does not save chat history for this workspace. Do not over-claim provider retention.

## Operational limitations

* Authenticated browser matrix not performed  
* Live OpenAI test NOT PERFORMED  
* Legal AI wording drafted, pending approval  
* Abuse control allow-all — invite-only only  

## Resume criteria

See [docs/SPRINT_8_HANDOFF.md](../../docs/SPRINT_8_HANDOFF.md). Future Intelligence development restarts from the Sprint 8 handoff + readiness docs after PO enablement criteria are met. Real-user feedback drives subsequent stories.

## Handoff / readiness

* [docs/SPRINT_8_HANDOFF.md](../../docs/SPRINT_8_HANDOFF.md)  
* [docs/SPRINT_8_INTELLIGENCE_PRODUCTION_READINESS.md](../../docs/SPRINT_8_INTELLIGENCE_PRODUCTION_READINESS.md)  
* [docs/INTELLIGENCE_BETA_OPERATIONS.md](../../docs/INTELLIGENCE_BETA_OPERATIONS.md)  

## Verification

```bash
npx tsx scripts/verify-s8-iip-001-intelligence-context.mjs
# … through …
npx tsx scripts/verify-s8-iip-011-controlled-beta-readiness.mjs
npx tsx scripts/verify-s8-iip-012-sprint-freeze.mjs
```
