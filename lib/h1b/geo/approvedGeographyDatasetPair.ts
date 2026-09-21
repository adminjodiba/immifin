/**
 * Central approved HUD + OFLC pairing for geographic resolution.
 * Replace this policy when Product Owner approves a later vintage pair.
 * Not a database table.
 */

export const APPROVED_GEOGRAPHY_DATASET_PAIR = {
  id: "HUD_2026_Q2__OFLC_2026_27_ALL_INDUSTRIES",
  hud: {
    year: 2026,
    quarter: 2,
  },
  oflc: {
    wageYear: "2026-27",
    dataSource: "All Industries",
  },
} as const;

export type ApprovedGeographyDatasetPair = typeof APPROVED_GEOGRAPHY_DATASET_PAIR;

export const GEOGRAPHY_DATASET_REASON = {
  INACTIVE: "UNAVAILABLE_DATASET_INACTIVE",
  INCOMPATIBLE: "UNAVAILABLE_DATASET_INCOMPATIBLE",
} as const;

export type GeographyDatasetReasonCode =
  (typeof GEOGRAPHY_DATASET_REASON)[keyof typeof GEOGRAPHY_DATASET_REASON];
