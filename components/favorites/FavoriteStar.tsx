"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { FavoritesLimitDialog, FavoritesProGateDialog } from "@/components/favorites/FavoritesDialog";
import { useFavoriteHref, useFavorites } from "@/lib/hooks/useFavorites";

type FavoriteStarProps = {
  pageLabel: string;
  pageHref?: string;
  /** Use on dark hero backgrounds. */
  variant?: "default" | "onDark";
  className?: string;
};

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "h-6 w-6"}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.75}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

export function FavoriteStar({
  pageLabel,
  pageHref,
  variant = "default",
  className,
}: FavoriteStarProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const href = useFavoriteHref(pageHref);
  const { canManageFavorites, accessLocked, isFavorite, toggleFavorite, isLoading } = useFavorites();
  const [showProGate, setShowProGate] = useState(false);
  const [showLimit, setShowLimit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const favorited = isLoaded && isSignedIn && isFavorite(href);
  const canUseFavorites = isLoaded && isSignedIn && canManageFavorites && !accessLocked;

  const colorClass =
    variant === "onDark"
      ? favorited
        ? "text-amber-300 hover:text-amber-200"
        : "text-white/80 hover:text-white"
      : favorited
        ? "text-amber-500 hover:text-amber-600"
        : "text-slate-400 hover:text-amber-500";

  async function handleClick() {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !canUseFavorites) {
      setShowProGate(true);
      return;
    }

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await toggleFavorite({ href, label: pageLabel });
      if (!result.ok && result.reason === "limit") {
        setShowLimit(true);
      } else if (!result.ok && result.reason === "locked") {
        setShowProGate(true);
      }
    } finally {
      setIsSaving(false);
    }
  }

  const label = favorited ? `Remove ${pageLabel} from favorites` : `Add ${pageLabel} to favorites`;

  return (
    <>
      <button
        type="button"
        className={`inline-flex shrink-0 items-center justify-center rounded-lg p-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60 ${colorClass} ${className ?? ""}`}
        aria-label={label}
        aria-pressed={favorited}
        disabled={isLoading && canUseFavorites}
        onClick={() => void handleClick()}
      >
        <StarIcon filled={favorited} className="h-6 w-6 sm:h-7 sm:w-7" />
      </button>

      <FavoritesProGateDialog isOpen={showProGate} onClose={() => setShowProGate(false)} />
      <FavoritesLimitDialog isOpen={showLimit} onClose={() => setShowLimit(false)} />
    </>
  );
}
