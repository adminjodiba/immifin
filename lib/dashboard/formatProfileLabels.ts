import {
  bulletinTypeOptions,
  categoryOptions,
  countryOptions,
} from "@/lib/account/immigrationProfileOptions";

function findLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  return options.find((option) => option.value === value)?.label ?? value;
}

export function formatCategoryLabel(value: string | null | undefined): string | null {
  return findLabel(categoryOptions, value);
}

export function formatCountryLabel(value: string | null | undefined): string | null {
  return findLabel(countryOptions, value);
}

export function formatBulletinTypeLabel(value: string | null | undefined): string | null {
  return findLabel(bulletinTypeOptions, value);
}

export function formatDisplayDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
