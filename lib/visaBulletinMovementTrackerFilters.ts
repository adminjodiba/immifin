import type { VisaBulletinMovementRow } from "@/lib/visaBulletinMovement";

export type TableMovementFilter = "all" | "forward" | "retrogression" | "no-change" | "current";
export type RecordTypeFilter = "updates-only" | "show-all";

export type VisaBulletinMovementTableFilters = {
  movementFilter: TableMovementFilter;
  categoryFilter: string;
  countryFilter: string;
  recordTypeFilter: RecordTypeFilter;
};

export const DEFAULT_VISA_BULLETIN_MOVEMENT_TABLE_FILTERS: VisaBulletinMovementTableFilters = {
  movementFilter: "all",
  categoryFilter: "all",
  countryFilter: "all",
  recordTypeFilter: "updates-only",
};

export function normalizeVisaBulletinMovementCategory(category: string): string {
  const match = category.match(/eb\s*(\d)/i);
  return match ? `EB${match[1]}` : "OTHER";
}

export function getVisaBulletinMovementFilterSelection(
  nextMovementFilter: TableMovementFilter,
  recordTypeFilter: RecordTypeFilter,
): Pick<
  VisaBulletinMovementTableFilters,
  "movementFilter" | "recordTypeFilter"
> {
  return {
    movementFilter: nextMovementFilter,
    recordTypeFilter: nextMovementFilter === "no-change" ? "show-all" : recordTypeFilter,
  };
}

export function filterVisaBulletinMovementTableRows(
  rows: VisaBulletinMovementRow[],
  movementFilter: TableMovementFilter,
  categoryFilter: string,
  countryFilter: string,
  recordTypeFilter: RecordTypeFilter,
): VisaBulletinMovementRow[] {
  return rows.filter((row) => {
    if (recordTypeFilter === "updates-only" && row.movementType === "no-change") return false;
    if (movementFilter !== "all" && row.movementType !== movementFilter) return false;
    if (
      categoryFilter !== "all" &&
      normalizeVisaBulletinMovementCategory(row.category) !== categoryFilter
    ) {
      return false;
    }
    if (countryFilter !== "all" && row.country !== countryFilter) return false;
    return true;
  });
}