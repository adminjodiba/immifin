/**
 * Second-step county FIPS token normalization.
 * This is not the ZIP identifier rule. 1–4 digit tokens may be left-padded.
 */

export type NormalizedCountyFips =
  | { ok: true; omitted: true }
  | { ok: true; omitted: false; countyFips: string }
  | { ok: false; reasonCode: "INVALID_COUNTY_FIPS" };

const FIVE_DIGIT = /^[0-9]{5}$/;
const ONE_TO_FOUR_DIGITS = /^[0-9]{1,4}$/;

export function normalizeCountyFips(raw: unknown): NormalizedCountyFips {
  if (raw === undefined || raw === null) {
    return { ok: true, omitted: true };
  }
  if (typeof raw !== "string") {
    return { ok: false, reasonCode: "INVALID_COUNTY_FIPS" };
  }

  const trimmed = raw.replace(/^[\t\n\r\f\v ]+|[\t\n\r\f\v ]+$/g, "");
  if (trimmed.length === 0) {
    return { ok: true, omitted: true };
  }
  if (FIVE_DIGIT.test(trimmed)) {
    return { ok: true, omitted: false, countyFips: trimmed };
  }
  if (ONE_TO_FOUR_DIGITS.test(trimmed)) {
    return { ok: true, omitted: false, countyFips: trimmed.padStart(5, "0") };
  }
  return { ok: false, reasonCode: "INVALID_COUNTY_FIPS" };
}
