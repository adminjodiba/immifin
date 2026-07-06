export const FAVORITES_PREFERENCES_KEY = "favorites";
export const MAX_FAVORITES = 10;
export const FAVORITES_PRO_LOCK_MESSAGE = "Favorites are a Pro feature. Upgrade to Pro to save pages.";

export type FavoritePage = {
  href: string;
  label: string;
  addedAt: string;
};

export class FavoritesLimitError extends Error {
  constructor() {
    super("Maximum 10 favorites are allowed.");
    this.name = "FavoritesLimitError";
  }
}

export function normalizeFavoriteHref(href: string): string {
  const trimmed = href.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }

  const hashIndex = trimmed.indexOf("#");
  const pathPart = hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed;
  const hashPart = hashIndex >= 0 ? trimmed.slice(hashIndex + 1) : "";

  const normalizedPath = pathPart.replace(/\/+$/, "") || "/";
  return hashPart ? `${normalizedPath}#${hashPart}` : normalizedPath;
}

function isFavoritePage(value: unknown): value is FavoritePage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.href === "string" &&
    typeof record.label === "string" &&
    typeof record.addedAt === "string"
  );
}

function sortByAddedAt(favorites: FavoritePage[]): FavoritePage[] {
  return [...favorites].sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt));
}

export function readFavorites(preferences: Record<string, unknown> | undefined): FavoritePage[] {
  const stored = preferences?.[FAVORITES_PREFERENCES_KEY];
  if (!Array.isArray(stored)) {
    return [];
  }

  const favorites = stored
    .filter(isFavoritePage)
    .map((item) => ({
      href: normalizeFavoriteHref(item.href),
      label: item.label.trim(),
      addedAt: item.addedAt,
    }))
    .filter((item) => item.label.length > 0);

  return sortByAddedAt(favorites);
}

export function validateFavoriteInput(value: unknown): { href: string; label: string } {
  if (!value || typeof value !== "object") {
    throw new Error("Favorite payload must be an object.");
  }

  const record = value as Record<string, unknown>;

  if (typeof record.href !== "string" || record.href.trim().length === 0) {
    throw new Error("Favorite href is required.");
  }

  if (typeof record.label !== "string" || record.label.trim().length === 0) {
    throw new Error("Favorite label is required.");
  }

  return {
    href: normalizeFavoriteHref(record.href),
    label: record.label.trim(),
  };
}

export function addFavoritePage(
  favorites: FavoritePage[],
  input: { href: string; label: string },
): FavoritePage[] {
  const href = normalizeFavoriteHref(input.href);
  const now = new Date().toISOString();
  const withoutDuplicate = favorites.filter((item) => item.href !== href);

  if (withoutDuplicate.length >= MAX_FAVORITES) {
    throw new FavoritesLimitError();
  }

  return sortByAddedAt([{ href, label: input.label.trim(), addedAt: now }, ...withoutDuplicate]);
}

export function removeFavoritePage(favorites: FavoritePage[], href: string): FavoritePage[] {
  const normalizedHref = normalizeFavoriteHref(href);
  return favorites.filter((item) => item.href !== normalizedHref);
}
