"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PersonalizationWorkspaceLayout } from "@/components/personalization/PersonalizationWorkspaceLayout";
import type {
  StartPageDestination,
  StartPageDestinationId,
  StartPageDestinationIcon,
} from "@/lib/account/startPage";
import { canCustomizeStartPage } from "@/lib/account/startPage";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";

type StartPageResponse = {
  canCustomize: boolean;
  startPage: StartPageDestinationId;
  destinations: StartPageDestination[];
};

function DestinationIcon({ name }: { name: StartPageDestinationIcon }) {
  const common = "h-6 w-6";
  if (name === "home") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M4.5 11.2 12 4.8l7.5 6.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 10.5V19h11V10.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "immigration-dashboard") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="1.2" />
        <rect x="13" y="4" width="7" height="7" rx="1.2" />
        <rect x="4" y="13" width="7" height="7" rx="1.2" />
        <rect x="13" y="13" width="7" height="7" rx="1.2" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 3.5 14.1 8l4.9.7-3.5 3.4.8 4.9L12 14.8 7.7 17l.8-4.9L5 9.7 9.9 9 12 3.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function PersonalizationLockedState() {
  return (
    <section className="ds2-personalization-lock" aria-labelledby="personalization-lock-heading">
      <p className="ds2-workspace-kicker">Pro &amp; Power</p>
      <h2 id="personalization-lock-heading" className="ds2-workspace-heading mt-2">
        Make IMMIFIN work your way
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[var(--immifin-ds2-text-muted)] sm:text-base">
        Choose your preferred start page with Pro or Power.
      </p>
      <div className="ds2-card-static mt-5 p-4 sm:p-5">
        <p className="text-sm font-semibold text-[var(--immifin-ds2-text-primary)]">
          Personalization is available with Pro and Power.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--immifin-ds2-text-muted)]">
          After you upgrade, you can choose whether IMMIFIN opens Home, Immigration Dashboard, or
          another page you are authorized to use.
        </p>
      </div>
      <div className="mt-5">
        <Link href="/pricing#plans" className="btn-primary">
          View Plans →
        </Link>
      </div>
    </section>
  );
}

const CLOSE_CLASS_NAME =
  "landing-v6-btn-secondary ds2-profile-action-close inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#0B1B3A] bg-white px-5 py-2 text-sm font-semibold text-[#0B1B3A] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1B3A]";
const SAVE_CLASS_NAME =
  "landing-v6-btn-primary ds2-profile-action-save inline-flex items-center justify-center gap-2 rounded-full bg-[#E3B636] px-5 py-2.5 text-sm font-semibold text-[#0F172A] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1B3A]";

export function PersonalizationPage() {
  const router = useRouter();
  const { tier } = useEffectiveSubscriptionTier();
  const [destinations, setDestinations] = useState<StartPageDestination[]>([]);
  const [selected, setSelected] = useState<StartPageDestinationId>("home");
  const [canCustomize, setCanCustomize] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showSaveButton = canCustomizeStartPage(tier);
  const showControls = canCustomize && showSaveButton;

  const loadPreference = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/account/start-page", { cache: "no-store" });
      const data = (await response.json()) as StartPageResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to load personalization.");
      }
      setCanCustomize(data.canCustomize);
      setDestinations(data.destinations);
      setSelected(data.startPage);
      setLoadState("ready");
    } catch (error: unknown) {
      setLoadState("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to load personalization.");
    }
  }, []);

  useEffect(() => {
    void loadPreference();
  }, [loadPreference]);

  async function handleSave() {
    if (!showControls) {
      return;
    }
    setSaveState("saving");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/account/start-page", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startPage: selected }),
      });
      const data = (await response.json()) as StartPageResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to save preference.");
      }
      setSelected(data.startPage);
      setDestinations(data.destinations);
      setCanCustomize(data.canCustomize);
      setSaveState("saved");
    } catch (error: unknown) {
      setSaveState("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to save preference.");
    }
  }

  return (
    <PersonalizationWorkspaceLayout>
      <div className="ds2-profile-action-bar">
        <div className="ds2-profile-action-bar-copy">
          <span className="ds2-profile-action-bar-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="8" cy="8" r="2" />
              <path d="M4 8h2M10 8h10" strokeLinecap="round" />
              <circle cx="16" cy="16" r="2" />
              <path d="M4 16h10M18 16h2" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <h1 className="ds2-profile-action-bar-title">Personalization</h1>
            <p className="ds2-profile-action-bar-subtitle">
              Choose what you want to see when you sign in to IMMIFIN.
            </p>
          </div>
        </div>

        <div className="ds2-profile-action-bar-actions">
          <button type="button" className={CLOSE_CLASS_NAME} onClick={() => router.push("/")}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M6 6 18 18M18 6 6 18" strokeLinecap="round" />
            </svg>
            Close
          </button>
          {showSaveButton ? (
            <button
              type="button"
              className={SAVE_CLASS_NAME}
              onClick={() => void handleSave()}
              disabled={saveState === "saving" || !showControls}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M5 5h11.5L19 8.5V19H5V5Z" strokeLinejoin="round" />
                <path d="M8 5v4h7V5M8 19v-6h8v6" strokeLinecap="round" />
              </svg>
              {saveState === "saving" ? "Saving..." : "Save Preference"}
            </button>
          ) : (
            <span className="ds2-personalization-header-badge-note">PRO &amp; POWER</span>
          )}
          <p className="ds2-profile-action-security">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M12 3.6 5.6 6.2v5.2c0 4.1 2.8 7 6.4 8.4 3.6-1.4 6.4-4.3 6.4-8.4V6.2L12 3.6Z" />
              <path d="m9.3 12 1.8 1.8 3.7-3.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>
              Your information is secure
              <br />
              and always private.
            </span>
          </p>
        </div>

        {saveState === "saved" ? (
          <p className="ds2-profile-action-status ds2-profile-action-status-success" role="status">
            Preference saved.
          </p>
        ) : null}
        {saveState === "error" && errorMessage ? (
          <p className="ds2-profile-action-status ds2-profile-action-status-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>

      {loadState === "loading" ? (
        <div className="ds2-card-static">
          <p className="text-sm text-[var(--immifin-ds2-text-muted)]">Loading personalization…</p>
        </div>
      ) : null}

      {loadState === "error" ? (
        <div className="ds2-card-static">
          <p className="text-sm text-[var(--immifin-ds2-text-muted)]">{errorMessage}</p>
          <button type="button" className="btn-secondary mt-4" onClick={() => void loadPreference()}>
            Try again
          </button>
        </div>
      ) : null}

      {loadState === "ready" && !showControls ? <PersonalizationLockedState /> : null}

      {loadState === "ready" && showControls ? (
        <section className="ds2-personalization-section" aria-labelledby="start-page-heading">
          <h2 id="start-page-heading" className="ds2-personalization-section-title">
            Default page after sign in
          </h2>
          <p className="ds2-personalization-section-copy">
            Select the page you want to see immediately after you log in to IMMIFIN.
          </p>

          <div
            className="ds2-personalization-options"
            data-count={destinations.length}
            role="radiogroup"
            aria-labelledby="start-page-heading"
          >
            {destinations.map((destination) => {
              const checked = selected === destination.id;
              return (
                <button
                  key={destination.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  className={
                    checked
                      ? "ds2-personalization-option ds2-personalization-option-selected"
                      : "ds2-personalization-option"
                  }
                  onClick={() => {
                    setSelected(destination.id);
                    setSaveState("idle");
                  }}
                >
                  <span className="ds2-personalization-option-icon" aria-hidden="true">
                    <DestinationIcon name={destination.icon} />
                  </span>
                  <span className="ds2-personalization-option-label">{destination.label}</span>
                  <span className="ds2-personalization-option-copy">{destination.description}</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </PersonalizationWorkspaceLayout>
  );
}
