# H-1B Geographic Resolution Runtime Contract

| Field | Value |
|-------|-------|
| **Document ID** | **GEO-RESOLUTION-DESIGN-002** |
| **Role** | Authoritative **technical contract** for future ZIP → county → OFLC-area runtime |
| **Product decision (input)** | [GEO-RESOLUTION-DECISION-001](./PROJECT_DECISIONS.md#decision-008--geo-resolution-decision-001-hud-zip--oflc-geographic-resolution) — Decision 008 |
| **Status** | Approved design — **runtime not implemented** |
| **Date** | 2026-09-21 |
| **Sprint** | Sprint 7A — H-1B Wage / Prevailing Wage Platform |
| **Owner** | Technical Architecture (CTO) |

This document defines the future resolver contract. It does not implement an API, UI, schema, or loader.

GEO-RESOLUTION-DECISION-001 remains the authoritative **product** decision. If this contract and Decision 001 ever conflict on policy, Decision 001 wins and this contract must be revised.

---

## 1. Scope and actors

The resolver answers only:

> Given user-supplied geographic facts, which published OFLC area corresponds to the official HUD ZIP–county evidence under Scenario A?

It does **not** select a wage level, SOC, or legal obligation.

| Actor | Authority |
|-------|-----------|
| **Backend resolver** | Sole authority for ZIP normalization, HUD row selection, FIPS mapping, classification, county validation, reason codes, and provenance |
| **Frontend** | Collects ZIP (text) and, when required, a work-location `county_fips`; renders the resolver result; never chooses an OFLC area on its own |
| **Client-supplied `area_code`** | Not an input. Ignored if present |

Logical operation (not an implemented route):

```text
resolveGeography({ zip, county_fips? }) → GeographyResolution
```

---

## 2. Runtime input ZIP contract

### 2.1 Required first-step input

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `zip` | Yes | string | Worksite ZIP as text. Must not be parsed as a number. |
| `county_fips` | No | string | Work-location county. Allowed on first call; required to complete `CHOICE_REQUIRED`. |

Reject the request before dataset lookup when `zip` is missing, not a string, or empty after trim.

### 2.2 Forbidden inputs (non-authoritative)

The resolver must **not** use any of the following as geographic authority:

- client `area_code` / area name
- `BUS_RATIO`, `RES_RATIO`, `TOT_RATIO`
- GeoLvl
- Census ZCTA
- city name, state-only, or “nearest area”
- `county_fips_names` (table is empty and is not required)

If a client sends `area_code`, ignore it. Classification is recomputed from official HUD rows for the normalized ZIP (and, on step two, the validated `county_fips`).

---

## 3. ZIP normalization rule

Backend normalization is authoritative. Frontend may pre-check format for UX but must send the original typed value or an equivalent text ZIP.

### 3.1 Algorithm

1. Trim ASCII whitespace.
2. If empty → `INVALID_ZIP`.
3. Accept exactly one of these first-step formats. ZIP is an identifier. Do **not** left-pad 1–4 digit input or infer missing leading digits.
   - **5-digit ZIP:** `#####` / `^[0-9]{5}$` → use as-is (leading zeros preserved as text).
   - **ZIP+4 hyphenated:** `#####-####` / `^[0-9]{5}-[0-9]{4}$` → keep the first five digits; discard `+4`.
   - **ZIP+4 compact:** `#########` / `^[0-9]{9}$` → keep the first five digits; discard `+4`.
4. Any other value → `INVALID_ZIP`, including 1–4 digit strings.

Accepted examples:

| Input | `zip_normalized` |
|-------|------------------|
| `00501` | `00501` |
| `00501-1234` | `00501` |
| `005011234` | `00501` |

Rejected examples (`INVALID_ZIP`): `501`, `0501`, `123`, `ABCDE`, `123456`.

ZIP+4 is **not** a finer HUD geography. Official HUD evidence is 5-digit ZIP → county. The `+4` is accepted only so a worksite ZIP+4 can be reduced to the official 5-digit ZIP.

### 3.2 Identity rules

- ZIP remains a **text** identifier. Never parse it as a number.
- Machine ZIP identity is the normalized 5-digit **text** value.
- `00501` must never become `501`.
- `501` is not `00501`. Do not infer the missing zeros.
- Comparison against `zip_county_crosswalk.zip` is exact text equality on the normalized value.

---

## 4. Dataset-version boundary

Runtime lookup is allowed only when **all** of the following are true:

| Gate | Rule | Failure code |
|------|------|----------------|
| HUD active | Exactly one `zip_crosswalk_versions` row with `status = 'active'` | `UNAVAILABLE_DATASET_INACTIVE` if 0; `UNAVAILABLE_DATASET_INCOMPATIBLE` if >1 |
| OFLC active | Exactly one `wage_datasets` row with `status = 'active'` | same |
| Pairing | That HUD version and OFLC dataset are an approved compatible pair | `UNAVAILABLE_DATASET_INCOMPATIBLE` |
| Official rows | HUD version is the official ZIP–County load; OFLC dataset is official All Industries geography | `UNAVAILABLE_DATASET_INCOMPATIBLE` |

Current Dev state (imported, **not active**) does **not** satisfy the active gate. A future runtime must fail closed until Product Owner activation. This contract does not authorize activation.

**Approved pairing for the analyzed datasets:** official HUD USPS ZIP–County 2026 Q2 with official OFLC 2026–27 All Industries. A later vintage requires a new pairing approval.

The resolver reads:

- all `zip_county_crosswalk` rows for `(active_hud_version, normalized_zip)`
- `oflc_area_localities.county_fips` → `oflc_areas.area_code` on the active OFLC dataset

No Census ZCTA. No invented FIPS. `county_fips_names` is not a runtime dependency.

---

## 5. Classification algorithm (Scenario A)

After a valid normalized ZIP and active compatible datasets:

1. Load **all** official HUD rows for that ZIP. Do not filter on ratios.
2. For each row, look up `county_fips` on the active OFLC locality index.
3. A county is **mapped** when the index returns one or more localities. The analyzed official dataset has **no** county FIPS with more than one `area_code`. If that invariant ever breaks, fail closed with `UNAVAILABLE_DATASET_INCOMPATIBLE` rather than guessing.
4. A county is **unmapped** when the FIPS is absent from the OFLC index (placeholder GEOID, unjoined territory, or other).
5. Let `A` = the set of distinct `area_code` values from **mapped** counties.
6. Classify:

| Condition | Outcome |
|-----------|---------|
| ZIP has no official HUD rows | `UNAVAILABLE` / `UNAVAILABLE_NO_HUD_ZIP` |
| Every official county is unmapped (`A` empty) | `UNAVAILABLE` / see §17 |
| At least one official county is unmapped **and** `A` is non-empty | **Partial mapping** — see §18 |
| `A` has exactly one `area_code` and every official county is mapped | `AUTO` / `AUTO_SINGLE_AREA` |
| `A` has two or more `area_code` values and every official county is mapped | `CHOICE_REQUIRED` / `CHOICE_MULTIPLE_AREAS` |

Distinctness is by **`area_code`**, not by county count. Multiple official counties that share one `area_code` are `AUTO`.

Option lists, when present, are sorted by `county_fips` ascending. Never by ratio.

---

## 6. Shared result envelope

Every successful resolver response (including `UNAVAILABLE` as a **domain result**, not a transport error) includes:

```text
GeographyResolution {
  outcome: "AUTO" | "CHOICE_REQUIRED" | "UNAVAILABLE"
  reason_code: ReasonCode
  zip_raw: string
  zip_normalized: string
  selected_county_fips: string | null
  official_county_count: number
  mapped_county_count: number
  unmapped_county_count: number
  distinct_area_count: number
  mapped_counties: CountyOption[]
  unmapped_official_counties: UnmappedCounty[]
  resolved_area: ResolvedArea | null
  choice_options: CountyOption[]
  provenance: ResolutionProvenance
}
```

Transport/validation failures (`INVALID_ZIP`, malformed `county_fips` type) may be request errors. Domain `UNAVAILABLE` is a result, not an invented area.

`CountyOption`:

| Field | Role |
|-------|------|
| `county_fips` | Machine identity. 5-digit text. |
| `county_display_name` | Planned human label from official OFLC `county_town_name`, subject to implementation-time validation (§14) |
| `state_ab` | Official OFLC `state_ab` |
| `state_display_name` | Official OFLC `state_name` (e.g. `Texas`) |
| `area_code` | Official OFLC area (context only; not selectable as input) |
| `area_name` | Official OFLC area name (context only) |

`UnmappedCounty`:

| Field | Role |
|-------|------|
| `county_fips` | Official HUD FIPS (text) |
| `hud_pref_state` | HUD `pref_state` for operator context only |
| `unmapped_class` | `placeholder_geoid` \| `territory_unjoined` \| `missing_oflc_fips` |

`ResolvedArea`: `{ area_code, area_name }` only. No GeoLvl.

Ratios are **absent** from `CountyOption`. They must not appear on the user-facing choice contract.

---

## 7. AUTO result contract

`outcome = AUTO` when exactly one distinct official OFLC `area_code` is authorized.

| Field | Contract |
|-------|----------|
| `reason_code` | `AUTO_SINGLE_AREA` |
| `resolved_area` | Required. That single `area_code` / `area_name` |
| `choice_options` | Empty |
| `selected_county_fips` | Null unless the caller supplied a county that passed §10–§11 |
| `mapped_counties` | All official mapped counties (provenance). May be 1 or many |
| Frontend | Continue. Do **not** ask for county |

`77031` is AUTO even though two official counties exist, because both map to `26420`.

---

## 8. CHOICE_REQUIRED result contract

`outcome = CHOICE_REQUIRED` when two or more distinct official `area_code` values exist and every official HUD county for the ZIP is mapped.

| Field | Contract |
|-------|----------|
| `reason_code` | `CHOICE_MULTIPLE_AREAS` |
| `resolved_area` | Null |
| `choice_options` | One row per official mapped **county** (not per area) |
| Frontend | Ask for **work-location county**. Show county + state. Area name may be shown as context. User submits `county_fips` only |

The user must not be required to pick an OFLC statistical area as the primary control.

---

## 9. UNAVAILABLE result contract

`outcome = UNAVAILABLE` when no supported OFLC area may be returned.

| Field | Contract |
|-------|----------|
| `resolved_area` | Null — never invent an area |
| `choice_options` | Empty |
| `reason_code` | One code from §13 |
| Frontend | Safe unavailable / manual-resolution presentation. Exact copy is out of scope |

Do not use nearest-area, state-only, or placeholder-to-state inference.

---

## 10. County-choice second-step contract

To complete `CHOICE_REQUIRED`, the client calls the same resolver with:

| Field | Rule |
|-------|------|
| `zip` | Same worksite ZIP as step one (raw or already normalized). Backend re-normalizes. |
| `county_fips` | 5-digit text FIPS after county-FIPS normalization (step 2). This is **not** the ZIP identifier rule. ZIP is never left-padded. |

Second-step algorithm:

1. Normalize ZIP. Recompute official HUD counties for that ZIP (do not trust a cached client option list).
2. Normalize `county_fips` as 5-digit text (`^[0-9]{5}$`; 1–4 digits left-padded).
3. Apply §11 validation.
4. If the selected county is official for that ZIP and mapped, return `AUTO` with `resolved_area` from that county and `selected_county_fips` set.
5. Do not accept a client `area_code` even if it matches an option shown earlier.

---

## 11. Validation of submitted county FIPS against the submitted ZIP

A submitted `county_fips` is valid only when **all** are true:

1. Format is a 5-digit text FIPS after normalization.
2. The normalized ZIP has official HUD rows.
3. That exact `(zip, county_fips)` exists on the **active** HUD version.
4. That `county_fips` is mapped on the **active** OFLC index.

Otherwise:

| Failure | `reason_code` | `outcome` |
|---------|---------------|-----------|
| Not a 5-digit FIPS | `INVALID_COUNTY_FIPS` | request error or `UNAVAILABLE` |
| ZIP invalid | `INVALID_ZIP` | request error |
| ZIP has no HUD rows | `UNAVAILABLE_NO_HUD_ZIP` | `UNAVAILABLE` |
| FIPS not an official county of this ZIP | `INVALID_COUNTY_FOR_ZIP` | request error or `UNAVAILABLE` — **do not** resolve another county |
| Official for ZIP but unmapped to OFLC | `COUNTY_UNMAPPED` | `UNAVAILABLE` |

If the ZIP is already `AUTO` and the client also sends a county:

- Accept only if that county is official for the ZIP and maps to the same single `area_code`.
- Otherwise `INVALID_COUNTY_FOR_ZIP`. Do not change the AUTO area to a guessed county.

---

## 12. Invalid, stale, and tampered county selection

| Situation | Behavior |
|-----------|----------|
| Client sends `area_code` | Ignore. Recompute from ZIP (+ county if present) |
| County from a previous ZIP reused on a new ZIP | `INVALID_COUNTY_FOR_ZIP` |
| Option list stale after dataset activation/swap | Recompute from current active versions; stale FIPS fails §11 |
| Client changes `area_name` or forges `area_code` | Ignored; area comes only from official mapping |
| Client omits county on `CHOICE_REQUIRED` | Remain `CHOICE_REQUIRED` |
| Client sends a mapped county from a **different** ZIP | `INVALID_COUNTY_FOR_ZIP` |
| Partial/incomplete FIPS (`48`, `4820`) | Pad if 1–4 digits, then §11; `4820` → `04820`, which will fail ZIP membership for `76945` |

Never silently substitute Harris County, a state default, or the highest-BUS county.

---

## 13. Distinct-OFLC-area deduplication

| Rule | Detail |
|------|--------|
| Identity | `oflc_areas.area_code` |
| Deduplicate | `Set(area_code)` over mapped official counties |
| AUTO | `Set` size = 1 |
| CHOICE_REQUIRED | `Set` size ≥ 2 |
| Choice rows | One per official **county**, not one per area |
| County identity | `county_fips` text |
| Sort | `county_fips` ascending |

`77031` → `{26420}` → AUTO.  
`76945` → `{4800004, 41660}` → CHOICE_REQUIRED with two county options.

---

## 14. County display name and machine identity

| Kind | Field | Source |
|------|-------|--------|
| Machine | `county_fips` | Official HUD `county_fips` (TEXT, 5 digits) |
| Display | `county_display_name` | Planned source: official OFLC `county_town_name` for that FIPS on the active dataset |
| Forbidden | — | Do not require `county_fips_names`. Do not introduce another county-name dataset in this contract. Do not invent “County” suffixes. Do not use BUS-primary naming |

Using OFLC `county_town_name` as the future county display-name source is **subject to implementation-time data validation** across supported county-choice records. If that validation fails, stop and return to Product Owner; do not invent names and do not add `county_fips_names` under this contract.

If an official HUD county is unmapped, it has no OFLC display name. Expose it only as `UnmappedCounty.county_fips` (+ HUD `pref_state` for operators). Do not fabricate a legal county name.

---

## 15. State display context

CHOICE and AUTO provenance rows include:

- `state_ab` and `state_display_name` from official OFLC locality
- Display form: `{county_display_name}, {state_display_name}`  
  Example: `Coke County, Texas`

Do not ask the user to select a state. Do not resolve geography from state alone. HUD `pref_state` is not mapping authority.

---

## 16. Reason-code taxonomy

Stable machine-readable codes. Do not reuse for wage-level or SOC errors.

| `reason_code` | When |
|---------------|------|
| `AUTO_SINGLE_AREA` | One distinct mapped `area_code`; all official HUD counties mapped |
| `CHOICE_MULTIPLE_AREAS` | Two or more distinct mapped `area_code` values; all official HUD counties mapped |
| `INVALID_ZIP` | Normalization failed |
| `INVALID_COUNTY_FIPS` | County token is not a 5-digit FIPS after normalize |
| `INVALID_COUNTY_FOR_ZIP` | County is not an official HUD county of the submitted ZIP |
| `UNAVAILABLE_NO_HUD_ZIP` | Normalized ZIP has no official HUD rows |
| `UNAVAILABLE_NO_MAPPED_COUNTY` | Official HUD rows exist; none map to OFLC (generic) |
| `UNAVAILABLE_PLACEHOLDER_GEOID` | Every official FIPS is an official placeholder GEOID (`00048`, `00060`, `00064`, `00068`, `00070`, or `000xx`) |
| `UNAVAILABLE_TERRITORY_UNJOINED` | Official FIPS exist but OFLC GU/VI (or equivalent) localities expose no joinable `county_fips` |
| `COUNTY_UNMAPPED` | Submitted official-for-ZIP county does not map to OFLC |
| `PARTIAL_OFFICIAL_COUNTY_UNMAPPED` | Some official HUD counties map and others do not — see §18 |
| `UNAVAILABLE_DATASET_INACTIVE` | HUD and/or OFLC is not exactly one active version |
| `UNAVAILABLE_DATASET_INCOMPATIBLE` | Active versions are not an approved pair, or the one-FIPS-one-area invariant is broken |

---

## 17. The existing 29 unmapped ZIPs

Analyzed Scenario A remainder: **29** ZIPs, **0.07%**.

| Class | Count | Contract |
|-------|------:|----------|
| Official placeholder GEOID | 9 | `UNAVAILABLE` / `UNAVAILABLE_PLACEHOLDER_GEOID` |
| Territory outside current OFLC FIPS join | 20 | `UNAVAILABLE` / `UNAVAILABLE_TERRITORY_UNJOINED` |
| Missing U.S. county mapping | 0 | Not expected on the analyzed pair |

Representative territory ZIP: `00801` (HUD FIPS `78030`). OFLC GU/VI localities keep `county_fips` null, so the join cannot be manufactured.

Behavior: `resolved_area = null`. No nearest-area. No state inference.

---

## 18. Partial-mapping behavior

**Status: APPROVED — fail-closed.** This is no longer an open Product Owner ambiguity.

**Partial mapping** means the ZIP has multiple official HUD county relationships, the mapped subset is non-empty, and **any** official county cannot be mapped through the approved OFLC geography dataset.

Approved behavior:

- `outcome = UNAVAILABLE`
- `reason_code = PARTIAL_OFFICIAL_COUNTY_UNMAPPED`
- `resolved_area = null`
- Keep the unmapped official county in `unmapped_official_counties`
- Keep mapped counties in `mapped_counties` as provenance only
- Do **not** discard the unmapped official county
- Do **not** AUTO-resolve from the remaining mapped subset
- Do **not** offer `CHOICE_REQUIRED` that hides unmapped official counties

```
ZIP
 ├─ County A → OFLC Area X     mapped
 └─ County B → cannot map      official HUD row retained
→ UNAVAILABLE / PARTIAL_OFFICIAL_COUNTY_UNMAPPED
```

The analyzed official pair has **0** missing U.S. county mappings. This rule still applies to later vintages and synthetic cases.

---

## 19. Runtime provenance

`ResolutionProvenance` is required on every domain result:

| Field | Source |
|-------|--------|
| `contract_id` | `GEO-RESOLUTION-DESIGN-002` |
| `product_decision_id` | `GEO-RESOLUTION-DECISION-001` |
| `resolution_policy` | `SCENARIO_A_ALL_OFFICIAL_HUD_ROWS` |
| `hud_crosswalk_version_id` | Active HUD version UUID |
| `hud_year` | `2026` for the analyzed pair |
| `hud_quarter` | `2` for the analyzed pair |
| `hud_package_sha256` | Official HUD package digest |
| `oflc_dataset_id` | Active OFLC dataset UUID |
| `oflc_wage_year` | Official wage year (e.g. `2026-27`) |
| `oflc_package_sha256` | Official OFLC package digest |
| `zip_normalized` | 5-digit text |

Do not put user IDs, emails, or full HUD row dumps in provenance.

---

## 20. BUS_RATIO / RES_RATIO / TOT_RATIO boundary

| Allowed | Forbidden |
|---------|-----------|
| Stored on HUD rows as official source metadata | Filtering HUD rows |
| Admin / data-quality inspection outside this resolver | Sorting `choice_options` |
| | Breaking ties |
| | AUTO vs CHOICE classification |
| | Silent county or area selection |

The resolver contract **omits** ratios from user-facing options.

---

## 21. GeoLvl boundary

GeoLvl is **not** a field on `GeographyResolution`.

It is published OFLC **wage-record** metadata. After this resolver returns an `area_code` and a later wage lookup selects the SOC wage row, that row’s GeoLvl may be displayed with the wage. GeoLvl must not feed ZIP, county, or area resolution.

---

## 22. Frontend responsibilities

- Collect worksite ZIP as **text** (do not coerce to number).
- Call the backend resolver. Do not classify locally from cached HUD dumps.
- `AUTO`: proceed; no county control.
- `CHOICE_REQUIRED`: ask “Which county is the work location?”; submit `zip` + `county_fips` only.
- Show county + state; area name is secondary context.
- `UNAVAILABLE`: safe unavailable / manual-resolution UI (copy later).
- Never send `area_code` as authority.
- Never apply Scenario B/C/D.
- Never claim a Prevailing Wage Determination.
- Do not start localhost or implement UI under this document.

---

## 23. Backend / resolver responsibilities

- Normalize ZIP and county FIPS.
- Enforce active + compatible dataset gates.
- Load **all** official HUD rows for the ZIP.
- Map FIPS via official OFLC localities only.
- Deduplicate areas by `area_code`.
- Emit `outcome`, `reason_code`, options, unmapped list, and provenance.
- Re-validate county membership on every second-step call.
- Ignore client `area_code`.
- Fail closed on inactive data, incompatible pair, broken one-FIPS-one-area invariant, and approved partial-mapping (`PARTIAL_OFFICIAL_COUNTY_UNMAPPED`).
- Do not populate `county_fips_names`, activate datasets, or write geography tables.

---

## 24. Legal / product boundary

This contract is geographic lookup of **published OFLC wage geography**.

Responses and future UI must not claim that IMMIFIN:

- issued a Prevailing Wage Determination
- determined the legally applicable prevailing wage
- determined an employer’s legal wage obligation
- replaced an official Department of Labor determination
- provided legal advice

---

## 25. Concrete examples

Logical payloads. Not an implemented API. UUIDs omitted.

### 25.1 ZIP `77433` — AUTO

One official HUD county `48201` → `26420` Houston-Pasadena-The Woodlands, TX.

```text
outcome: AUTO
reason_code: AUTO_SINGLE_AREA
zip_normalized: "77433"
distinct_area_count: 1
resolved_area: { 26420, Houston-Pasadena-The Woodlands, TX }
choice_options: []
```

No county question.

### 25.2 ZIP `77031` — AUTO (multi-county / single-area)

Official counties `48157` (Fort Bend) and `48201` (Harris). Both `26420`.

```text
outcome: AUTO
reason_code: AUTO_SINGLE_AREA
official_county_count: 2
mapped_county_count: 2
distinct_area_count: 1
resolved_area: { 26420, Houston-Pasadena-The Woodlands, TX }
choice_options: []
```

Do not ask for county.

### 25.3 ZIP `76945` — CHOICE_REQUIRED

| county_fips | Display | Area |
|-------------|---------|------|
| 48081 | Coke County, Texas | 4800004 Hill Country Region of Texas nonmetropolitan area |
| 48451 | Tom Green County, Texas | 41660 San Angelo, TX |

```text
outcome: CHOICE_REQUIRED
reason_code: CHOICE_MULTIPLE_AREAS
resolved_area: null
choice_options: [48081, 48451]  // both official; BUS=0 Tom Green retained
```

Second step `{ zip: "76945", county_fips: "48451" }` → `AUTO` / `41660` / `selected_county_fips: "48451"`.

### 25.4 ZIP `00501` — AUTO (leading zero, RES=0)

```text
zip raw "00501" or "00501-1234" or "005011234" → zip_normalized: "00501"
"501" / "0501" → INVALID_ZIP
outcome: AUTO
reason_code: AUTO_SINGLE_AREA
resolved_area: { 35620, New York-Newark-Jersey City, NY-NJ }
```

`RES_RATIO = 0` does not invalidate official HUD geography.

### 25.5 Unmapped ZIP `00801`

```text
outcome: UNAVAILABLE
reason_code: UNAVAILABLE_TERRITORY_UNJOINED
zip_normalized: "00801"
resolved_area: null
unmapped_official_counties: [{ county_fips: "78030", unmapped_class: "territory_unjoined" }]
```

### 25.6 Synthetic invalid county selection

Request: `{ zip: "76945", county_fips: "48201" }` (Harris is not official for 76945).

```text
reason_code: INVALID_COUNTY_FOR_ZIP
resolved_area: null
```

Do not return Houston. Do not fall back to Coke County.

### 25.7 Synthetic partial-mapping case

ZIP `99999` is illustrative only (not an official analyzed ZIP). Official HUD rows: `48201` (maps to `26420`) and `00048` (placeholder, unmapped).

```text
outcome: UNAVAILABLE
reason_code: PARTIAL_OFFICIAL_COUNTY_UNMAPPED
resolved_area: null
mapped_counties: [48201 → 26420]
unmapped_official_counties: [{ 00048, placeholder_geoid }]
choice_options: []
```

Fail closed. Do not AUTO to Houston by dropping `00048`.

---

## 26. Implementation status

Not implemented. No route, UI, migration, or activation is authorized by this document.

---

## Related documentation

| Document | Role |
|----------|------|
| [PROJECT_DECISIONS.md](./PROJECT_DECISIONS.md) Decision 008 | Authoritative product decision (GEO-RESOLUTION-DECISION-001) |
| [TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md) | Pointer to this contract |
| [CALCULATORS.md](./CALCULATORS.md) | Existing educational H-1B estimator — not this resolver |
