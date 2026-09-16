import type { CSSProperties } from "react";
import { Ds2SplitSceneHero } from "@/components/ds2/Ds2SplitSceneHero";
import { landingV3ContentGridClass } from "@/components/landing-v3/landingV3Layout";

/** Locked PO PNG. Natural 2172×724. Yellowstone left, Grand Canyon right. */
const WUS_HERO_IMAGE = "/images/immifin-what-users-say-hero-yellowstone-grand-canyon.png";
const HERO_H = "min(19vh, 160px)";

function CheckIcon() {
  return (
    <svg className="h-3 w-3 shrink-0 text-emerald-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L9 10.94 7.28 9.22a.75.75 0 10-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.25-4.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function WhatUsersSayHero() {
  return (
    <Ds2SplitSceneHero
      className="ds2-wus-split-hero"
      labelledBy="what-users-say-heading"
      imageSrc={WUS_HERO_IMAGE}
      imageWidth={2172}
      imageHeight={724}
      leftLock={0.32}
      rightLock={0.4}
      fillLeft={0.32}
      fillRight={0.6}
      skyLeft={0.34}
      skyRight={0.5}
    >
      <div className={`${landingV3ContentGridClass} ds2-wus-split-hero-inner`}>
        <div className="ds2-wus-split-hero-copy">
          <div className="landing-v3-hero-title-lane hero-ribbon-title-rail ds2-wus-split-hero-title-lane">
            <div
              className="hero-ribbon-title-shuttle landing-v3-hero-title-shuttle"
              style={
                {
                  ["--v3-glide-x-torch"]:
                    `max(0px, calc(50vw - ${HERO_H} * 1.08 - 1.5rem - 50% - var(--v3-optical-center)))`,
                } as CSSProperties
              }
            >
              <h1 id="what-users-say-heading" className="ds2-share-hero-title hero-ribbon-title-float">
                Real People. Real Journeys. Real Impact.
              </h1>
            </div>
          </div>
          <p className="ds2-share-hero-description">
            Stories from people using IMMIFIN to navigate life in America.
          </p>
          <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-[11px] font-bold leading-snug text-white drop-shadow-[0_1px_2px_rgba(11,27,58,0.55)] sm:gap-x-3">
            <li className="inline-flex items-center gap-1">
              <CheckIcon />
              Verified Users
            </li>
            <li className="inline-flex items-center gap-1">
              <CheckIcon />
              Unbiased Feedback
            </li>
            <li className="inline-flex items-center gap-1">
              <CheckIcon />
              No Incentives. No Edits.
            </li>
          </ul>
        </div>
        <p className="ds2-billing-page-quote ds2-wus-split-hero-quote">
          Same goals. Brighter journeys.
          <span className="ds2-billing-page-quote-mark" aria-hidden="true" />
        </p>
      </div>
    </Ds2SplitSceneHero>
  );
}
