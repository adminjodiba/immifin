import type { ReactNode } from "react";

function AiSparkleIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.2l1.15 5.1L18.2 8.4 13.15 10.5 12 15.8l-1.15-5.3L5.8 8.4l5.05-1.1L12 2.2Z" />
      <path d="M18.4 13.2l.55 2.35 2.35.55-2.35.55-.55 2.35-.55-2.35-2.35-.55 2.35-.55.55-2.35Z" />
    </svg>
  );
}

/** V3-only Power mark for AI Advisor. Gold sparkle + LED throb. */
export function LandingV3AiBuddyLed({ children }: { children: ReactNode }) {
  return (
    <span className="landing-v3-ai-buddy-led inline-flex items-center gap-1.5 whitespace-nowrap font-bold">
      <span className="landing-v3-ai-buddy-led-mark inline-flex items-center gap-1" aria-hidden="true">
        <span className="landing-v3-ai-buddy-led-dot" />
        <AiSparkleIcon />
      </span>
      {children}
    </span>
  );
}
