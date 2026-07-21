/**
 * Timezone-safe civil (calendar) date parsing for immigration sheet dates.
 *
 * Cutoffs and sheet dates are calendar days, not timestamps. Parsing must not
 * depend on browser/server timezone.
 *
 * Canonical internal form: YYYY-MM-DD
 * Instant used for Date math: UTC noon on that calendar day.
 */

const MONTH_INDEX: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function utcNoonFromParts(year: number, month: number, day: number): Date | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const parsed = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  // Reject overflow dates such as 2023-02-31 → March.
  if (parsed.toISOString().slice(0, 10) !== iso) {
    return null;
  }

  return parsed;
}

/**
 * Parse a civil date string into a Date at UTC noon, or null if unrecognized.
 *
 * Supported forms:
 * - YYYY-MM-DD
 * - M/D/YYYY or MM/DD/YYYY
 * - D Mon YYYY / DD Month YYYY (e.g. "01 Jul 2023", "15 October 2022")
 */
export function parseCivilDateToUtcNoon(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    return utcNoonFromParts(year!, month!, day!);
  }

  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const month = Number(slash[1]);
    const day = Number(slash[2]);
    const year = Number(slash[3]);
    return utcNoonFromParts(year, month, day);
  }

  const dmy = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const monthKey = dmy[2]!.toLowerCase();
    const year = Number(dmy[3]);
    const month = MONTH_INDEX[monthKey];
    if (!month) {
      return null;
    }
    return utcNoonFromParts(year, month, day);
  }

  return null;
}

/**
 * Normalize a civil date string to YYYY-MM-DD, or null if unrecognized.
 */
export function toCivilIsoDate(value: string): string | null {
  const parsed = parseCivilDateToUtcNoon(value);
  if (!parsed) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
}
