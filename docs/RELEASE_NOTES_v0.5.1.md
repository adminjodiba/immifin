# IMMIFIN Release Notes

## Version 0.5.1

| Field | Value |
|-------|-------|
| **Version** | v0.5.1 |
| **Release Type** | Production Hotfix |
| **Release Date** | July 2026 |
| **Status** | Production Verified |
| **Task** | P1-HOTFIX-001 |
| **Owner** | Technical Architecture |

**Related documentation:** [CURRENT_PROJECT_STATE.md](./CURRENT_PROJECT_STATE.md) · [RELEASE_NOTES_v0.5.0.md](./RELEASE_NOTES_v0.5.0.md)

---

## Summary

v0.5.1 resolves a production display defect discovered during IMMIFIN’s first live **August 2026 Visa Bulletin** update.

Some Visa Bulletin cutoff dates displayed **one day earlier** in certain timezones. Google Sheets source data remained correct. No customer data was lost or changed. No database migration was required. No second Admin Force Sync was required after the hotfix.

---

## Root Cause

Visa Bulletin civil dates were parsed with a JavaScript `Date` and then converted to UTC via `toISOString()`. Local-midnight calendar values shifted backward in positive UTC offsets (for example, India).

Example:

| Source (Google Sheets) | Incorrect production display |
|------------------------|------------------------------|
| `01 Jul 2023` | Jun 30, 2023 |

---

## Resolution

A shared civil-date utility now owns freeform immigration date parsing:

| Item | Detail |
|------|--------|
| **Module** | `lib/dates/civilDate.ts` |
| **Helpers** | `toCivilIsoDate` / `parseCivilDateToUtcNoon` |
| **Consumers** | Visa Bulletin and Visa Stamping |
| **Canonical form** | `YYYY-MM-DD` |
| **Rule** | Civil immigration dates are date-only values, not timestamps |

Existing handling for `C`, `U`, `CURRENT`, `UNAVAILABLE`, and already-ISO values is unchanged.

---

## Files Changed

**Added**

- `lib/dates/civilDate.ts`
- `scripts/verify-p1-hotfix-bulletin-dates.mjs`

**Modified**

- `lib/visaBulletinData.ts`
- `lib/visa/visaStampingSheetService.ts`

---

## Production Validation

Signed-in production verification confirmed these August 2026 bulletin values matched Google Sheets:

| Category / Country | Production display |
|--------------------|--------------------|
| EB-1 China | Jul 1, 2023 |
| EB-1 India | Oct 15, 2022 |
| EB-2 China | Sep 1, 2021 |
| EB-2 India | Unavailable |
| EB-3 China | Jan 1, 2022 |
| EB-3 India | Jan 1, 2014 |
| EB-3 Mexico | Sep 1, 2024 |
| EB-3 Philippines | Aug 1, 2023 |
| EB-3 Rest of the World | Sep 1, 2024 |

---

## Product Surfaces Protected

These surfaces share or benefit from the corrected civil-date parsing path:

- Current Visa Bulletin
- Movement Tracker
- Historical Trends
- Priority-date comparison
- Personalized Dashboard
- Notification formatting
- Visa Stamping date parsing

---

## Operational Validation

This release closed IMMIFIN’s first live monthly Visa Bulletin operational validation:

Department of State bulletin release  
→ Google Sheets update  
→ Admin Force Sync  
→ Production refresh  
→ Defect detection  
→ Read-only investigation  
→ Hotfix deployment  
→ Signed-in production verification  

Admin Force Sync imported approximately 60 records for the August bulletin. After the hotfix, no data repair and no second Force Sync were required.

---

## Git and Deployment

| Item | Value |
|------|--------|
| **Commit** | `9b4b8ad4842e511a24d75bbcc6b46b7ee39c6a60` |
| **Commit message** | `fix(visa-bulletin): eliminate timezone drift in bulletin cutoff date parsing` |
| **Worker version** | `873721d1-0803-4761-9a5e-449d5db44297` |

---

## Release Status

**Production Verified**

**Completed**
