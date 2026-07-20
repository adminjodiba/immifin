# IMMIFIN Commercial Platform Vision

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Status** | **Vision Approved** |
| **Owner** | Product / Founder |
| **Audience** | Product Owner, Engineering, Operations |
| **Scope** | Long-term commercial catalog, price versioning, Stripe publishing, grandfathering, and customer migration |
| **Task** | DOC-COMM-001 |
| **Last Updated** | 2026-07-13 |

> **Authority:** This document is the **source of truth** for IMMIFIN’s long-term Commercial Management Platform. It does **not** authorize implementation yet. Current Beta continues to use the approved four Stripe Prices and the existing Checkout / Billing Center architecture.

**Relationship to Billing Architecture:** [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md) defines ownership between IMMIFIN business policy and Stripe payment execution. This vision extends that boundary into **commerce**—how IMMIFIN owns products, public pricing presentation, versioned offers, and controlled publication into Stripe.

**Relationship to Stripe Subscription Platform:** [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) describes the Sprint 7 subscription lifecycle (Checkout, webhooks, Billing Center). This vision describes the **future catalog and publishing layer** that sits above those payment flows. Implementation is deferred until after Beta.

---

## Core Philosophy

### Stripe manages payments. IMMIFIN manages commerce.

This principle is permanent.

| Stripe owns | IMMIFIN owns |
|-------------|--------------|
| Payment processing | Product catalog |
| Recurring charges | Commercial plans |
| Invoices | Public price presentation |
| Payment methods | Price versions |
| Refund execution | Publishing workflow |
| Tax execution where adopted | Feature bundles |
| Subscription objects | Grandfathering policy |
| Immutable Stripe Prices | Customer migration policy |
| | Regional pricing strategy |
| | Promotions and campaigns |
| | Commercial audit trail |
| | Admin approvals |

Stripe is the payment and subscription ledger. IMMIFIN is the commercial operating system that decides **what** is sold, **at what presented price**, **to whom**, and **when** a new offer becomes active for new customers—without asking operators to perform routine catalog work in the Stripe Dashboard.

---

## 1. Purpose

IMMIFIN needs a Commercial Management Platform so commercial change is:

- **Governed** — draft → review → approve → publish  
- **Versioned** — historical offers remain intact  
- **Server-authoritative** — browsers never supply Stripe Price IDs or raw amounts  
- **Auditable** — every publish and migration is attributable  
- **Safe for existing customers** — new publication does not silently rewrite what people already bought  

Hardcoding display prices in UI, or editing live Stripe Prices by hand for every market decision, does not scale. Manual Stripe administration for routine price updates increases error risk and breaks auditability.

The Commercial Management Platform allows IMMIFIN to grow products, markets, and campaigns **without** requiring code changes or repeated Dashboard surgery for ordinary commercial work—while Stripe remains the payment system of record for money movement.

---

## 2. Guiding Principles

1. **Stripe manages payments; IMMIFIN manages commerce.**  
2. **Never edit an active price.**  
3. **Always create a new price version.**  
4. **Admin performs one publish action from IMMIFIN.**  
5. **Stripe Prices are immutable commercial records** once created.  
6. **New customers use the latest active price.**  
7. **Existing customers remain on their existing price until explicitly migrated.**  
8. **No browser-authoritative price or Product ID.**  
9. **Every commercial change is auditable.**  
10. **No destructive overwrite of historical pricing.**  
11. **Draft before publish.**  
12. **Publish only after validation.**  
13. **Rollback through version activation, not data rewriting.**

---

## 3. High-Level Architecture

```text
IMMIFIN Admin
      ↓
Commercial Catalog
      ↓
Product Catalog + Price Catalog + Feature Bundles
      ↓
Draft Revision
      ↓
Review and Approval
      ↓
Publish Service
      ↓
Stripe API
      ↓
New Stripe Price
      ↓
Catalog Activation
      ↓
New customers use current version
      ↓
Existing customers remain grandfathered
      ↓
Optional migration campaign
```

| Layer | Role |
|-------|------|
| **IMMIFIN Admin** | Authenticated operators create drafts, review diffs, approve, and publish. |
| **Commercial Catalog** | Application-owned model of what IMMIFIN sells and how it is offered. |
| **Product / Price / Feature Bundles** | Stable products, versioned monetary offers, entitlement packages. |
| **Draft Revision** | Proposed change that is not yet live for sales. |
| **Review and Approval** | Human gate before Stripe or activation is touched. |
| **Publish Service** | Server-side validation, Stripe Price creation, persistence, activation. |
| **Stripe API / New Price** | Creates an immutable Stripe Price; never mutates an old Price for “new list price.” |
| **Catalog Activation** | Marks the new version active for **new** sales; retires prior version for new sales only. |
| **New vs existing customers** | Future buyers get the active version; subscribers keep the Price already on their subscription. |
| **Migration campaign** | Optional, explicit program to invite affected customers to change. |

---

## 4. Product Catalog

A **Product** is the commercial thing IMMIFIN sells—the plan identity customers recognize.

**Initial products**

| Product | Role |
|---------|------|
| Free | Public / acquisition tier |
| Pro | Core paid automation tier |
| Power | Higher intelligence / multi-profile tier |

**Future products (illustrative)**

| Product | Role |
|---------|------|
| HR | Employer / HR packaging |
| Attorney | Professional / practice packaging |
| Student | Education-market packaging |
| Enterprise | Contracted commercial packaging |
| Partner | Channel / co-sell packaging |

Products are **conceptually stable**. Display names and descriptions may evolve carefully; **Prices** are what change over time as commercial versions.

**Conceptual fields (not a schema)**

| Concept | Intent |
|---------|--------|
| Product key | Stable machine identity (`pro`, `power`, …) |
| Display name | Customer-facing name |
| Description | Marketing / plan copy |
| Status | Draft, active, retired, hidden |
| Feature bundle | Link to entitlement package |
| Market visibility | Where the product appears |
| Sellable flag | Whether Checkout may sell it |
| Sort order | Presentation order |
| Effective dates | Optional commercial windows |
| Audit metadata | Created/updated/by whom |

Final database design is deferred to a later implementation task.

---

## 5. Feature Bundles

**Product** and **Feature Bundle** must remain separate.

| Concept | Answers |
|---------|---------|
| **Product** | What commercial plan is offered? |
| **Feature Bundle** | What capabilities does that plan unlock? |
| **Price** | How much and how often is that plan billed? |

**Example**

| Product | Feature Bundle (illustrative) |
|---------|-------------------------------|
| Power | Personal Dashboard, Visa History, Movement Tracker, Notifications, Favorites, AI, Multiple Profiles |

Separation allows commercial campaigns such as **temporarily including AI in Pro** without redesigning Stripe Products or inventing a new billing SKU for every entitlement experiment.

- Feature Bundles affect **entitlements** (capability map).  
- Prices affect **billing**.  

Sprint 7 capability enforcement ([capabilities architecture](./BUSINESS_MODEL.md)) remains the entitlement resolver; this vision does not redefine Free / Pro / Power capability tables.

---

## 6. Price Catalog

A **Price** is a **versioned commercial offer** tied to:

| Dimension | Examples |
|-----------|----------|
| Product | Pro, Power |
| Billing interval | Monthly, Annual |
| Currency | USD, CAD, GBP, INR |
| Region / market | US, CA, GB, IN (when introduced) |
| Amount | Approved list amount for that version |
| Tax behavior | Inclusive / exclusive (when adopted) |
| Effective date | When the version becomes eligible to activate |
| Stripe Price ID | Server-side identifier after publish |
| Status | Draft, active, retired, failed publish |

One Product may have many Prices, for example:

- Pro Monthly USD  
- Pro Annual USD  
- Pro Monthly CAD  
- Pro Annual GBP  
- Power Annual INR  

Stripe Price IDs remain **server-only**. Public pages may display human amounts sourced from IMMIFIN’s catalog; Checkout continues to resolve a trusted server-side Stripe Price ID.

---

## 7. Price Versioning

### Rule

**Never edit an active Price.**

### Workflow

```text
Current version
      ↓
Clone
      ↓
Edit draft
      ↓
Validate
      ↓
Approve
      ↓
Publish
      ↓
Activate new version
      ↓
Retire previous version for new sales
```

Versioning preserves auditability and protects existing subscriptions: Stripe subscriptions continue to reference the Price ID they were purchased on.

### Conceptual example

| Version | Offer | Commercial status |
|---------|-------|-------------------|
| Pro Monthly v1 | $9.99 | Retired for **new** sales |
| Pro Monthly v2 | $11.99 | Active for **new** sales |

Existing v1 customers remain on v1 until an approved migration campaign moves them.

*(Amounts above are illustrative of versioning mechanics. Beta list prices remain those approved in current commercial docs—see [§19](#19-current-beta-strategy).)*

---

## 8. Publishing Workflow

### One-action Admin experience

```text
Admin opens IMMIFIN
      ↓
Creates pricing revision
      ↓
Reviews changes
      ↓
Clicks Publish
      ↓
IMMIFIN server validates
      ↓
IMMIFIN creates a new Stripe Price
      ↓
Stripe returns the new Price ID
      ↓
IMMIFIN stores and verifies it
      ↓
IMMIFIN activates the new catalog version
      ↓
Previous version retires for future sales
```

For routine pricing publication, Admin should **not** need to open the Stripe Dashboard.

### Failure behavior

| Failure | Behavior |
|---------|----------|
| Validation fails | No Stripe call; revision remains draft |
| Stripe creation fails | IMMIFIN does **not** activate the revision |
| Persistence fails after Stripe creation | Enter a **recoverable operational state**; Operations reconciles Stripe vs IMMIFIN |
| Activation incomplete | Old active price remains in effect for new sales |
| Retry / duplicate publish | Must be **idempotent**—no partial double activation |

**No partial activation** of an incompletely published revision.

---

## 9. New Customer Behavior

New Checkout resolves the **active** IMMIFIN catalog entry for:

- Tier  
- Interval  
- Currency  
- Region (when multi-region exists)  

Then uses the stored **server-side** Stripe Price ID.

- No raw amount from the browser.  
- No Stripe Price ID from the browser.  
- Future customers always receive the latest published **active** Price for that offer key.  

This is consistent with current Sprint 7 Checkout design (server catalog resolution).

---

## 10. Existing Customer Grandfathering

### Default policy

**Existing subscribers remain on the Price they originally purchased.**

A price publication affects **future subscriptions only**.

### Benefits

| Benefit | Why it matters |
|---------|----------------|
| Trust | Customers keep the deal they bought |
| Predictability | No surprise mid-cycle list-price mutation via Stripe Price rewrite |
| Contract continuity | Historical offer remains identifiable |
| Fewer disputes | Clear commercial story for support |
| Safer rollout | New price can ship without forcing mass migration |

### Grandfathering modes (future policy choices)

| Mode | Meaning |
|------|---------|
| Permanent | Stay on purchase Price indefinitely |
| Time-limited | Soft sunset after a notice window |
| Campaign-based | Move only via migration campaign |
| Contract-specific | Enterprise / partner exceptions |

Grandfathering is **never automatic** without an approved migration policy.

---

## 11. Customer Migration Campaigns

When IMMIFIN chooses to move existing customers:

```text
Price change campaign
      ↓
Identify affected subscribers
      ↓
Generate audience
      ↓
Send notification
      ↓
User reviews options
      ↓
User authenticates in Billing Center
      ↓
User confirms choice
      ↓
IMMIFIN updates existing Stripe subscription
```

### Approved option patterns (conceptual)

- Accept new price  
- Switch to annual billing  
- Downgrade  
- Cancel at period end  
- Remain grandfathered where policy allows  

**Email links must not change billing directly.** Users authenticate and confirm inside IMMIFIN (Billing Center). This aligns with notification and billing security principles already used on the platform.

Migration execution uses the existing **paid subscription change** philosophy (update the existing Stripe subscription—never create a second subscription for the same commercial seat).

---

## 12. Admin Experience

### Future Admin areas

| Area | Purpose |
|------|---------|
| Product Catalog | Manage commercial products |
| Price Catalog | Browse versions and Stripe linkages |
| Feature Bundles | Map products to entitlements |
| Draft Revisions | Work-in-progress commercial changes |
| Publishing Queue | Pending approvals and publishes |
| Price History | Immutable historical views |
| Customer Migration Campaigns | Audience and acceptance tracking |
| Promotions | Future offer overlays |
| Regional Pricing | Market-specific versions |
| Audit Log | Who / what / when |
| Commercial Analytics | Adoption and conversion views |

### Expected Admin capabilities

Create draft · Clone version · Compare revisions · Validate · Approve · Publish · Retire · View affected subscribers · Start migration campaign · Track acceptance status  

**No active Price may be edited directly.**

---

## 13. Audit and Governance

Every commercial change must be able to record:

| Audit element | Example |
|---------------|---------|
| Who created | Operator identity |
| Who approved | Approver identity |
| What changed | Diff of amount, interval, market, visibility |
| Previous / new value | Before and after |
| Publish timestamp | When Stripe create was attempted / succeeded |
| Stripe result | Success, failure, Price ID |
| Activation timestamp | When version became active for new sales |
| Retirement timestamp | When prior version stopped selling |
| Customer impact | Counts / cohort description |
| Migration campaign linkage | Campaign ID if any |
| Rollback / recovery | Reconciliation actions |

Commercial operations are business-critical; the audit trail is permanent.

---

## 14. Regional and Multi-Currency Pricing

Future support includes currencies such as:

- USD  
- CAD  
- GBP  
- INR  
- Others as markets expand  

One Product may have different Prices by:

| Factor | Intentional commercial choice |
|--------|-------------------------------|
| Region | Market packaging |
| Currency | Settlement currency |
| Tax regime | Presentation and compliance hooks |
| Market strategy | Positioning |
| Purchasing power | Deliberate list pricing |
| Contract type | Self-serve vs enterprise |

**No automatic currency conversion.** Each regional Price is an intentional commercial record.

---

## 15. Promotions, Coupons, and Trials

Documented as **future** capabilities:

- Promotional Prices  
- Coupons and discount codes  
- Introductory offers  
- Time-limited campaigns  
- Partner discounts  
- Student pricing  
- Enterprise contracts  
- Trials **only if later approved**  

### Current policy (unchanged)

**No free trial.**

This vision does not change [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md) or [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) Beta commercial rules.

---

## 16. Tax and Compliance

Future considerations (not legal advice):

- Tax-inclusive vs tax-exclusive display  
- Regional sales tax  
- VAT / GST  
- Customer notices and consent  
- Effective dates for price migrations  
- Invoice language  
- Jurisdiction-specific obligations  

Legal and tax requirements must be reviewed **before** customer price migrations. This document does not provide legal conclusions.

---

## 17. Failure and Recovery Philosophy

| Principle | Meaning |
|-----------|---------|
| Old catalog remains authoritative | Until new publish fully completes |
| Idempotent publish | Safe retries |
| Reconcile Stripe ↔ IMMIFIN | No silent drift |
| Partial publishes visible | Operations can see failed / stuck revisions |
| No silent unapproved prices | Checkout never invents amounts |
| Recover or retire | Completing or retiring a failed revision safely |
| Checkout purity | Never use draft or failed catalog versions |

---

## 18. Security Boundaries

| Boundary | Rule |
|----------|------|
| Admin authorization | Commercial mutation requires Admin (or finer roles later) |
| Server-only Stripe | Secret keys and Price creates never leave the server |
| No browser Price IDs | Clients may not choose Stripe Prices |
| No browser amounts | Checkout never accepts client price math |
| No client catalog mutation | No browser → Stripe Product/Price writes |
| Draft secrecy | Draft pricing is not public marketing surface |
| No secrets in catalog | Catalog stores references and commercial metadata, not secrets |
| Separable permissions | Approve vs publish may differ |
| Environment isolation | Production and Sandbox catalogs remain separate |

---

## 19. Current Beta Strategy

### Approved approach for Beta

| Practice | Status |
|----------|--------|
| Keep the current four approved Prices stable | **Yes** |
| Display prices via a safe application-owned display catalog | **Yes** |
| Keep Stripe Price IDs server-only | **Yes** |
| Build full Commercial Management Platform before Beta | **No** |
| Change prices through Admin before the future implementation | **No** |
| Use this vision as the construction source later | **Yes** |

### Current four commercial entries

| Entry | Approved Beta amount |
|-------|----------------------|
| Pro Monthly | **$9.99 / month** |
| Pro Annual | **$99.99 / year** |
| Power Monthly | **$19.99 / month** |
| Power Annual | **$199.99 / year** |

Sources: [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md), [STRIPE_OPERATIONS.md](./STRIPE_OPERATIONS.md), [ROADMAP_v2.md](./ROADMAP_v2.md). Free remains **$0**. Beta policy continues: **no coupons, promotions, or trials**.

---

## 20. Future Implementation Roadmap

Conceptual phases only. Exact sprint numbers remain under [ROADMAP_v2.md](./ROADMAP_v2.md) control.

### Phase 1 — Catalog Foundation

- Product catalog  
- Versioned Price catalog  
- Audit fields  
- Active-version resolution for Checkout  

### Phase 2 — Admin Publishing

- Draft revision  
- Review and approval  
- Publish to Stripe  
- Activate new version  
- Retire old version for new sales  

### Phase 3 — Customer Migration

- Audience identification  
- Notification campaign  
- Billing Center confirmation  
- Subscription migration  
- Acceptance tracking  

### Phase 4 — Commercial Expansion

- Regions and currencies  
- Promotions and coupons  
- Enterprise contracts  
- Taxes  
- Analytics  

**Status for the initiative:** Vision Approved — **Implementation Deferred Until After Beta**.

---

## 21. Non-Goals

This vision does **not**:

- Replace Stripe payment processing  
- Make Stripe Prices mutable  
- Automatically migrate existing customers  
- Allow browser-controlled amounts  
- Implement the platform now  
- Change current Beta prices  
- Change the current no-trial policy  
- Define final database schema  
- Define legal notice requirements  

---

## 22. Architecture Decisions Summary

1. IMMIFIN owns commercial intent.  
2. Stripe owns payment execution.  
3. Products are stable; Prices are versioned.  
4. Active Prices are immutable.  
5. Admin publishes once from IMMIFIN.  
6. New customers receive the latest active Price.  
7. Existing customers remain grandfathered by default.  
8. Customer migration is an explicit campaign.  
9. No billing change occurs through email alone.  
10. Every commercial action is auditable.  

---

## 23. Related Documents

| Document | Relationship |
|----------|--------------|
| [PRODUCT_VISION.md](./PRODUCT_VISION.md) | Long-term product direction |
| [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) | Tiers, capabilities, launch pricing philosophy |
| [BILLING_ARCHITECTURE.md](./BILLING_ARCHITECTURE.md) | IMMIFIN vs Stripe ownership ADR |
| [STRIPE_BILLING_POLICY.md](./STRIPE_BILLING_POLICY.md) | Upgrade / downgrade / cancellation policy |
| [STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md](./STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md) | Sprint 7 subscription platform design |
| [ENGINEERING_NOTES/EN-001_Stripe_Payment_Lifecycle.md](./ENGINEERING_NOTES/EN-001_Stripe_Payment_Lifecycle.md) | Payment lifecycle engineering notes |
| [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) | Present project state |
| [ROADMAP_v2.md](./ROADMAP_v2.md) | Sprint sequencing |

---

## 24. Revision History

| Version | Date | Status | Summary |
|---------|------|--------|---------|
| 1.0 | 2026-07-13 | Vision Approved | Initial Commercial Platform vision approved by Product Owner (DOC-COMM-001) |
