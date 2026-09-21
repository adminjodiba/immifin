/**
 * Authoritative worksite ZIP normalization. ZIP is a text identifier.
 * Do not left-pad. Do not infer missing leading digits. Do not parse as a number.
 */

export type NormalizedWorksiteZip =
  | { ok: true; zipNormalized: string }
  | { ok: false; reasonCode: "INVALID_ZIP" };

const FIVE_DIGIT = /^[0-9]{5}$/;
const ZIP_PLUS_4_HYPHEN = /^[0-9]{5}-[0-9]{4}$/;
const ZIP_PLUS_4_COMPACT = /^[0-9]{9}$/;

export function normalizeWorksiteZip(raw: unknown): NormalizedWorksiteZip {
  if (typeof raw !== "string") {
    return { ok: false, reasonCode: "INVALID_ZIP" };
  }

  const trimmed = raw.replace(/^[\t\n\r\f\v ]+|[\t\n\r\f\v ]+$/g, "");
  if (trimmed.length === 0) {
    return { ok: false, reasonCode: "INVALID_ZIP" };
  }
  if (FIVE_DIGIT.test(trimmed)) {
    return { ok: true, zipNormalized: trimmed };
  }
  if (ZIP_PLUS_4_HYPHEN.test(trimmed) || ZIP_PLUS_4_COMPACT.test(trimmed)) {
    return { ok: true, zipNormalized: trimmed.slice(0, 5) };
  }
  return { ok: false, reasonCode: "INVALID_ZIP" };
}
