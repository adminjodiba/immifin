"use client";

import Link from "next/link";
import { useState } from "react";
import { landingV3ContainerClass } from "@/components/landing-v3/landingV3Layout";

/** /landing-v3 announcement bar — starts identical to locked V2. */
export function LandingV3AnnouncementBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  return (
    <div className="relative bg-[var(--immifin-ds2-navy)] text-white">
      {/*
        Desktop: mission line centered in the bar; Learn More + dismiss on the right.
        Mobile: stack so the centered line does not collide with actions.
      */}
      <div
        className={`${landingV3ContainerClass} relative flex flex-col items-center gap-1.5 py-1.5 sm:flex-row sm:items-center sm:gap-0 sm:py-2`}
      >
        <p className="landing-v6-announcement-led mx-auto flex max-w-full items-center justify-center gap-2 overflow-x-auto px-2 text-center text-[11px] leading-none text-slate-100 whitespace-nowrap sm:px-28 sm:text-[13px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" aria-hidden="true" />
          <span className="whitespace-nowrap">
            IMMIFIN is starting with U.S. immigration. Our mission is broader — Immigration, Finance
            &amp; Life in America.
          </span>
        </p>
        <div className="flex shrink-0 items-center justify-center gap-3 sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 sm:justify-end">
          <Link
            href="/articles/why-we-built-immifin"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-white hover:text-blue-100"
          >
            Learn More
            <span aria-hidden="true">→</span>
          </Link>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="rounded p-0.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Dismiss announcement"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
