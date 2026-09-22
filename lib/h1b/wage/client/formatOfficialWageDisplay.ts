export type OfficialWageDisplayRecord = {
  label: string | null;
  level1: number | null;
  level2: number | null;
  level3: number | null;
  level4: number | null;
  average: number | null;
};

export type OfficialWageDisplayUnit = "hour" | "year" | "unspecified";

/** Presentation-only hours used for IMMIFIN annual equivalent. Not an OFLC-published value. */
export const ANNUAL_EQUIVALENT_HOURS = 2080;

export const ANNUAL_EQUIVALENT_DISCLAIMER =
  "Annual equivalent is calculated by IMMIFIN using 2,080 working hours per year (40 hours × 52 weeks). The annual equivalent is provided for reference only and is not an OFLC-published annual wage.";

export const NO_LEVELED_WAGE_COPY =
  "The official source did not publish leveled wage values for this record.";

export function officialWageDisplayUnit(label: string | null): OfficialWageDisplayUnit {
  if (label === "Annual Wage") return "year";
  if (label === "High Wage" || label === "No Leveled Wage") return "unspecified";
  return "hour";
}

export function formatOfficialWageAmount(
  value: number | null,
  unit: OfficialWageDisplayUnit,
): string | null {
  if (value === null) return null;
  if (unit === "hour") {
    return `$${value.toFixed(2)}/hour`;
  }
  if (unit === "year") {
    return `$${Math.round(value).toLocaleString("en-US")}/year`;
  }
  return `$${value}`;
}

export function annualEquivalentFromHourly(hourly: number): number {
  return Math.round(hourly * ANNUAL_EQUIVALENT_HOURS);
}

export function formatAnnualEquivalent(hourly: number | null): string | null {
  if (hourly === null) return null;
  return `$${annualEquivalentFromHourly(hourly).toLocaleString("en-US")}/year`;
}

export type OfficialWageDisplayRow = {
  key: string;
  label: string;
  official: string;
  annualEquivalent: string | null;
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function officialWageDisplayRows(wage: OfficialWageDisplayRecord): OfficialWageDisplayRow[] {
  const unit = officialWageDisplayUnit(wage.label);
  const showAnnualEquivalent = unit === "hour";
  const candidates: Array<{ key: string; label: string; value: number | null }> = [
    { key: "level1", label: "Level I", value: wage.level1 },
    { key: "level2", label: "Level II", value: wage.level2 },
    { key: "level3", label: "Level III", value: wage.level3 },
    { key: "level4", label: "Level IV", value: wage.level4 },
    { key: "average", label: "Average", value: wage.average },
  ];

  return candidates.flatMap((row) => {
    const official = formatOfficialWageAmount(row.value, unit);
    if (!official) return [];
    return [
      {
        key: row.key,
        label: row.label,
        official,
        annualEquivalent: showAnnualEquivalent ? formatAnnualEquivalent(row.value) : null,
      },
    ];
  });
}

export function shouldShowAnnualEquivalent(wage: OfficialWageDisplayRecord): boolean {
  if (officialWageDisplayUnit(wage.label) !== "hour") return false;
  return [wage.level1, wage.level2, wage.level3, wage.level4, wage.average].some((value) => value !== null);
}

export function shouldShowNoLeveledCopy(wage: OfficialWageDisplayRecord): boolean {
  return (
    wage.label === "No Leveled Wage" &&
    wage.level1 === null &&
    wage.level2 === null &&
    wage.level3 === null &&
    wage.level4 === null &&
    wage.average === null
  );
}

export function officialWageInputsChanged(
  previous: { socCode: string | null; zip: string; countyFips: string | null },
  next: { socCode: string | null; zip: string; countyFips: string | null },
): boolean {
  return (
    previous.socCode !== next.socCode ||
    previous.zip !== next.zip ||
    previous.countyFips !== next.countyFips
  );
}
