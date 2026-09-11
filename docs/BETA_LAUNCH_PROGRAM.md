# IMMIFIN Beta Launch Program (BLP)

| Field | Value |
|-------|-------|
| **Program ID** | BLP-001 |
| **Title** | IMMIFIN Beta Launch Program |
| **Phase** | Phase 1 — Program Foundation |
| **Status** | Active — governance established |
| **Last Updated** | 2026-07-25 |
| **Owner** | Product Owner |
| **Related** | [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [ROADMAP_v2.md](./ROADMAP_v2.md) · [SPRINT_8_HANDOFF.md](./SPRINT_8_HANDOFF.md) · [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) |

> Master program document for invite-only beta through public-launch readiness. This is **not** a software sprint. It does **not** authorize public launch, production secret changes, or new Intelligence features by itself.

---

## 1. Executive Summary

IMMIFIN has completed Sprint 1–7 platform and commercial foundations and Sprint 8 Intelligence engineering (frozen after S8-IIP-011). The Product Owner has stopped further feature-sprint execution. The project now operates under the **IMMIFIN Beta Launch Program (BLP)** — an operational program that coordinates invite-only beta planning, billing validation, support, analytics, feedback, and controlled Intelligence enablement before any public launch decision.

**Current recommendation:** Controlled Beta (invite-only).  
**Public launch:** Not Approved.

---

## 2. Objectives

1. Establish clear governance for everything required before public launch.  
2. Coordinate invite-only beta rollout without treating it as another feature sprint.  
3. Validate billing, onboarding, support, and immigration data quality with real users.  
4. Activate Intelligence only under controlled-beta safeguards and Product Owner approval.  
5. Capture user feedback and convert it into prioritized refinement work.  
6. Define exit criteria for controlled beta and separate criteria for public launch.  
7. Resume sprint-based engineering only when new product work is explicitly approved.

---

## 3. Current Product Status

| Area | Status |
|------|--------|
| Core immigration product | Stable in production (v0.5.1 hotfix lineage; commercial Live Stripe not activated) |
| Auth / profiles / dashboards / calculators | Delivered |
| Notification Platform | Production validated |
| Stripe Subscription Platform | Application complete; Sandbox/Live validation and v0.5.0 signoff **pending** |
| Intelligence Platform | Engineered through S8-IIP-011; **not** publicly enabled |
| Sprint 8 feature development | **Frozen** |
| Invite-only IMMIFIN beta | Preparing |
| Public launch | **Not Approved** |

Authoritative snapshot: [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md).

---

## 4. Current Architecture Status

| Layer | Status |
|-------|--------|
| Next.js 15 + Cloudflare Workers (OpenNext) | Production hosting |
| Clerk authentication | Production |
| Supabase data + RLS patterns | Production |
| Capability model (Free / Pro / Power) | Production |
| Stripe Checkout / webhooks / Billing Center | Implemented; Live proof pending |
| Resend notifications | Production validated |
| Intelligence (`lib/intelligence`, `/intelligence`, Ask API) | Server-authorized; Power + allowlist + kill switch |
| Customer Portal (payment method / invoices) | Deferred |

Architecture reference: [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md).

---

## 5. Beta Goals

* Invite a small, intentional cohort of real users.  
* Validate core immigration journeys end-to-end.  
* Validate paid upgrade / downgrade / cancel paths in approved environments.  
* Confirm support and incident procedures work in practice.  
* Enable Intelligence only for invited Power users when pre-enable gates clear.  
* Collect actionable feedback without expanding product scope prematurely.  
* Prove operational readiness for a later public-launch decision.

---

## 6. Success Metrics

| Metric | Intent |
|--------|--------|
| Invite → activated account rate | Onboarding friction |
| Profile / immigration-profile completion | Personalization readiness |
| Billing success / failure rates (Sandbox then Live when authorized) | Commercial confidence |
| Support ticket volume and time-to-resolution | Support readiness |
| Critical defect escape rate | Quality gate |
| Intelligence ask success / safe-failure rate (invited cohort only) | Controlled AI readiness |
| Qualitative NPS / feedback themes | Product refinement input |
| Data correctness incidents (Visa Bulletin / stamping) | Immigration data trust |

Exact numeric targets are set by the Product Owner during Epic 5 / Epic 6 execution — not invented here.

---

## 7. Scope

* Program governance and epic tracking  
* Invite-only beta planning and cohort management  
* Stripe / billing validation and commercial signoff preparation  
* Operational readiness (monitoring, kill switches, runbooks)  
* Customer support readiness  
* Analytics and feedback loops  
* Immigration data quality checks for beta  
* Intelligence controlled rollout (ops enablement, not new features)  
* Public-launch readiness checklist (decision gate only)

---

## 8. Out of Scope

* Starting Sprint 9 (Insurance) or later sprints automatically  
* New Intelligence product features (multi-turn, streaming, RAG, citations, quotas)  
* Public GA / unrestricted AI  
* Production secret changes without explicit authorization  
* Stripe Customer Portal implementation (still deferred unless approved later)  
* Commercial Management Platform catalog publishing  
* Finance / Insurance platform build-out  
* Deployment or enablement of beta users as part of BLP-001 foundation alone

---

## 9. Risks

| Risk | Mitigation direction |
|------|----------------------|
| Billing Live cutover defects | Sandbox E2E first; webhook-authoritative access; rollback runbooks |
| Intelligence privacy / prompt leakage | Kill switch, allowlist, no body logging, legal wording approval |
| Support overload | Small cohort, clear escalation, incident templates |
| Data quality trust erosion | Bulletin/stamping verification rituals before cohort expansion |
| Scope creep back into feature sprints | Freeze remains; BLP epics are operational unless PO approves engineering |
| Premature public launch pressure | Separate public-launch criteria; explicit PO decision required |

---

## 10. Assumptions

* Sprint 8 Intelligence implementation remains preserved and frozen for features.  
* Stripe application code remains the commercial path; validation is the gap.  
* Notification Platform remains production-ready for beta communications.  
* Product Owner owns cohort selection, enablement, and public-launch approval.  
* Localhost + Cloudflare tunnel validation remain mandatory for engineering changes when any later epic requires code.  
* BLP-001 itself is documentation/governance only.

---

## 11. Timeline

| Phase | Focus | Status |
|-------|--------|--------|
| **Phase 1** | Program foundation (this document / BLP-001) | Active |
| **Phase 2** | Epic execution (infrastructure → billing → ops → support → users → analytics → data → Intelligence → public readiness) | Not started |
| **Phase 3** | Invite-only controlled beta operation | Pending PO |
| **Phase 4** | Feedback-driven refinement (may reopen approved engineering work) | Pending |
| **Phase 5** | Public launch decision | Not Approved |

Dates and cohort size are Product Owner decisions — not fixed by this foundation story.

---

## 12. Roles

| Role | Accountability |
|------|----------------|
| Product Owner | Program authority, cohort, enablement, launch decisions |
| Engineering | Preserve freeze; execute only approved BLP engineering tasks |
| Operations / Platform Admin | Env config, kill switch, monitoring, incident response |
| Support | User assistance, escalation, feedback capture |
| Legal / Policy (as available) | AI wording and privacy acceptance |

---

## 13. Product Owner responsibilities

* Approve program priorities and epic sequencing.  
* Select and resize the invite cohort.  
* Authorize Stripe Live cutover and Intelligence enablement.  
* Accept or waive authenticated smoke / legal pre-enable items with recorded rationale.  
* Decide Controlled Beta exit and Public Launch readiness.  
* Prevent unauthorized feature-sprint restart.

---

## 14. Engineering responsibilities

* Preserve Sprint 1–8 delivered work; no silent rollbacks.  
* Honor feature development freeze unless a BLP epic explicitly authorizes scoped code.  
* Keep Intelligence server-authorized (Power + allowlist + kill switch).  
* Maintain verification scripts and documentation accuracy.  
* Localhost-first validation; tunnel when auth/webhooks require it.  
* Do not deploy, commit, or push unless explicitly requested.

---

## 15. Operations responsibilities

* Maintain Stripe, Clerk, Cloudflare, and provider configuration hygiene.  
* Operate Intelligence kill switch and beta allowlist.  
* Confirm monitoring does not capture Ask bodies.  
* Own incident response and rollback procedures.  
* Keep [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md) and [INTELLIGENCE_BETA_OPERATIONS.md](./INTELLIGENCE_BETA_OPERATIONS.md) current.

---

## 16. Support responsibilities

* Publish beta support channels and response expectations.  
* Triage billing, auth, data, and Intelligence issues.  
* Never request raw prompts unless privacy policy and PO authorize.  
* Feed structured feedback into the program backlog.  
* Escalate kill-switch / privacy incidents immediately.

---

## 17. Intelligence rollout strategy

Follow [SPRINT_8_HANDOFF.md](./SPRINT_8_HANDOFF.md) resume criteria and the roadmap **Pre-Beta Enablement Gate**:

1. Preserve engineering freeze for new Intelligence features.  
2. Complete operational pre-enable actions.  
3. Invite only Power users on the server allowlist.  
4. Authorize one controlled live provider smoke test before cohort use.  
5. Expand cohort only after PO review of metrics and incidents.  
6. Keep public / GA Intelligence **Not Approved** until a separate launch decision.

Epic 8 owns this track operationally.

---

## 18. Stripe readiness

| Item | Status |
|------|--------|
| Application Checkout / webhooks / Billing Center | Implemented |
| Billing Center + Pricing entitlement/billing alignment | **BLP-BILL-FIX-001 / REV1** complete (Dev override vs Stripe state) |
| Dev Subscription Mode dedicated local test user | **BLP-BILL-DEV-001** + **BLP-BILL-DEV-FIX-002** (simulated entitlement overrides historical canceled Stripe) |
| Sandbox E2E validation | Pending |
| Live cutover / v0.5.0 commercial signoff | Pending |
| Customer Portal (cards / invoices) | Deferred |

Epic 2 owns validation. See [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md) · [SPRINT_7_HANDOFF.md](./SPRINT_7_HANDOFF.md).

---

## 19. Notification readiness

Notification Platform v1.0 is production validated (Resend). Beta communications should reuse approved templates and admin controls. Do not invent new notification product scope inside BLP-001. See [NOTIFICATION_PLATFORM_SIGNOFF.md](./NOTIFICATION_PLATFORM_SIGNOFF.md).

---

## 20. Beta user onboarding

* Invite-only; no open signup marketing for beta.  
* Guide users through Clerk auth, contact preferences, and immigration profile.  
* Clarify Free / Pro / Power capabilities and that Intelligence may require Power + invite.  
* Capture consent-relevant expectations via approved privacy/terms wording.  
* Epic 5 owns cohort process and onboarding checklist detail.

---

## 21. User feedback process

1. Collect feedback via support, structured forms, and (when approved) analytics.  
2. Classify: defect · UX friction · billing · data quality · Intelligence · feature ask.  
3. Product Owner prioritizes into BLP refinement or future sprint backlog.  
4. Do not auto-start Sprint 9 from feedback volume alone.  
5. Intelligence enhancements wait for real invited-user evidence after enablement.

---

## 22. Exit criteria (Controlled Beta)

Controlled Beta may be considered successful when the Product Owner records that:

* Invite cohort completed core journeys without unresolved P0 defects.  
* Billing validation goals for the approved environment are met.  
* Support can operate within agreed response targets.  
* Immigration data quality incidents are acceptable.  
* Intelligence (if enabled) operated safely under kill switch + allowlist.  
* Feedback backlog is triaged.  
* A go / no-go recommendation for next phase is recorded.

Exit from Controlled Beta is **not** automatic public launch approval.

---

## 23. Public launch criteria

Public launch requires a separate Product Owner decision after Controlled Beta. Minimum themes:

* Commercial Live Stripe confidence and signoff  
* Support and incident readiness at expected scale  
* Legal / privacy acceptance for shipped surfaces (including AI if offered)  
* Data quality and monitoring confidence  
* Explicit removal or redesign of invite-only constraints where appropriate  
* Marketing / onboarding readiness  
* Recorded **Public Launch: Approved** decision

Until then: **Public Launch — Not Approved**.

---

## Program Epics

| Epic | Name | Intent |
|------|------|--------|
| **Epic 1** | Beta Infrastructure | Environments, checklists, tooling, and program rituals for invite-only beta |
| **Epic 2** | Billing Validation | Sandbox/Live Stripe proof, Billing Center flows, commercial signoff prep |
| **Epic 3** | Operational Readiness | Monitoring, runbooks, kill switches, incident response |
| **Epic 4** | Customer Support | Channels, playbooks, escalation, feedback intake |
| **Epic 5** | Beta User Management | Cohort selection, invites, revocation, onboarding |
| **Epic 6** | Analytics | Measurement plan for beta success metrics (privacy-safe) |
| **Epic 7** | Immigration Data Quality | Bulletin / stamping / calculator trust checks for beta |
| **Epic 8** | Intelligence Controlled Rollout | Pre-enable gate, allowlist ops, authorized smoke, limited enablement |
| **Epic 9** | Public Launch Readiness | Final launch checklist and decision package |

Epic execution begins only when the Product Owner starts a specific epic story. **BLP-001 does not start Epic 1 automatically.**

---

## Program Status Terminology

| Term | Meaning |
|------|---------|
| **Current Phase** | IMMIFIN Beta Launch Program |
| **Engineering Status** | Feature Development Frozen |
| **Operational Status** | Preparing Invite-only Beta |
| **Current Recommendation** | Controlled Beta |
| **Public Launch** | Not Approved |

Aligned Intelligence freeze language remains in [SPRINT_8_HANDOFF.md](./SPRINT_8_HANDOFF.md) (**FROZEN** / **PRE-BETA ENABLEMENT PENDING** / **CONDITIONAL GO FOR INVITE-ONLY CONTROLLED BETA**).

---

## Revision History

| Version | Date | Task | Description |
|---------|------|------|-------------|
| v1.0 | 2026-07-25 | BLP-001 | Program foundation — master document and epics established |
