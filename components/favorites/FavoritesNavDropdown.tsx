"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ProtectedLink } from "@/components/auth/ProtectedLink";
import { FavoritesProGateDialog } from "@/components/favorites/FavoritesDialog";
import { FAVORITES_PRO_LOCK_MESSAGE } from "@/lib/account/favorites";
import { useFavorites } from "@/lib/hooks/useFavorites";

const navLinkClassName =
  "rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700";

function RemoveFavoriteButton({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
      aria-label={`Remove ${label} from favorites`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onRemove();
      }}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

export function FavoritesNavDropdown({ className }: { className?: string }) {
  const { favorites, canManageFavorites, accessLocked, removeFavorite, isLoading } = useFavorites();
  const [isOpen, setIsOpen] = useState(false);
  const [showProGate, setShowProGate] = useState(false);
  const [removingHref, setRemovingHref] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const canUseFavorites = canManageFavorites && !accessLocked;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleTriggerClick() {
    if (!canUseFavorites) {
      setShowProGate(true);
      return;
    }

    setIsOpen((open) => !open);
  }

  async function handleRemove(href: string) {
    setRemovingHref(href);
    try {
      await removeFavorite(href);
    } finally {
      setRemovingHref(null);
    }
  }

  return (
    <>
      <div className={`relative ${className ?? ""}`} ref={containerRef}>
        <button
          type="button"
          className={`${navLinkClassName} inline-flex items-center gap-1`}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={menuId}
          onClick={handleTriggerClick}
        >
          Favorites
          <svg
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {isOpen && canUseFavorites ? (
          <div id={menuId} role="menu" className="absolute left-1/2 top-full z-50 w-80 max-w-[calc(100vw-2rem)] -translate-x-1/2 pt-3 sm:w-96">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur-lg">
              {isLoading ? (
                <p className="px-4 py-3 text-sm text-slate-500">Loading favorites…</p>
              ) : favorites.length === 0 ? (
                <p className="px-4 py-3 text-sm leading-relaxed text-slate-500">
                  No favorites yet. Use the star next to a page title to save it here.
                </p>
              ) : (
                favorites.map((item) => (
                  <div
                    key={item.href}
                    className="flex items-start gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-brand-50"
                  >
                    <ProtectedLink
                      href={item.href}
                      role="menuitem"
                      className="min-w-0 flex-1 rounded-lg px-2 py-2 text-sm font-semibold leading-snug text-slate-900"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="block whitespace-normal break-words">{item.label}</span>
                    </ProtectedLink>
                    <RemoveFavoriteButton
                      label={item.label}
                      onRemove={() => void handleRemove(item.href)}
                    />
                    {removingHref === item.href ? (
                      <span className="sr-only">Removing…</span>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>

      <FavoritesProGateDialog isOpen={showProGate} onClose={() => setShowProGate(false)} />
    </>
  );
}

export function FavoritesMobileSection({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { favorites, canManageFavorites, accessLocked, removeFavorite } = useFavorites();
  const [showProGate, setShowProGate] = useState(false);
  const canUseFavorites = canManageFavorites && !accessLocked;

  if (!canUseFavorites) {
    return (
      <>
        <button
          type="button"
          className="w-full rounded-xl px-4 py-3 text-center text-base font-medium text-slate-700 transition-colors hover:bg-white hover:text-brand-700"
          onClick={() => setShowProGate(true)}
        >
          Favorites
        </button>
        <FavoritesProGateDialog isOpen={showProGate} onClose={() => setShowProGate(false)} />
      </>
    );
  }

  return (
    <div className="w-full">
      <div className="px-4 py-3 text-center text-base font-medium text-slate-700">Favorites</div>
      <div className="mt-1 space-y-0.5 border-t border-slate-200/80 pt-1">
        {favorites.length === 0 ? (
          <p className="px-4 py-2.5 text-center text-sm text-slate-500">
            No favorites yet. Tap the star on any page title.
          </p>
        ) : (
          favorites.map((item) => (
            <div
              key={item.href}
              className="flex items-start gap-1 rounded-lg px-2 py-1 hover:bg-white"
            >
              <ProtectedLink
                href={item.href}
                className="min-w-0 flex-1 px-2 py-2 text-center text-sm leading-snug text-slate-600 transition-colors hover:text-brand-700"
                onClick={onNavigate}
              >
                <span className="block whitespace-normal break-words">{item.label}</span>
              </ProtectedLink>
              <RemoveFavoriteButton
                label={item.label}
                onRemove={() => void removeFavorite(item.href)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export { FAVORITES_PRO_LOCK_MESSAGE };
