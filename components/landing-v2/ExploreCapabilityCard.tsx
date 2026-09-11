import { ProtectedLink } from "@/components/auth/ProtectedLink";
import type { LandingV2Capability, LandingV2CapabilityIcon } from "@/lib/data/landing-v2";

export function ExploreCapabilityCard({ capability }: { capability: LandingV2Capability }) {
  return (
    <ProtectedLink
      href={capability.href}
      className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200/80 hover:shadow-md hover:shadow-slate-200/60 active:translate-y-0 active:scale-[0.99] active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 sm:p-4"
      aria-label={`${capability.ctaLabel}: ${capability.title}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${capability.iconClassName}`}
          aria-hidden="true"
        >
          <CapabilityIcon name={capability.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-brand-700 sm:text-[0.9375rem]">
            {capability.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-slate-600">{capability.description}</p>
          <span className="link-arrow mt-2.5 text-xs sm:text-sm">
            {capability.ctaLabel}
            <svg
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </div>
    </ProtectedLink>
  );
}

function CapabilityIcon({ name }: { name: LandingV2CapabilityIcon }) {
  const common = "h-4 w-4";
  switch (name) {
    case "bulletin":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
        </svg>
      );
    case "greencard":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="8.5" cy="12" r="2" />
          <path d="M13 10h5M13 14h4" strokeLinecap="round" />
        </svg>
      );
    case "citizenship":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 20V6l7-3 7 3v14" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "h1b":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" strokeLinecap="round" />
          <rect x="4" y="7" width="16" height="13" rx="2" />
          <path d="M4 12h16" strokeLinecap="round" />
        </svg>
      );
    case "stamping":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M8 4h8l2 3v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7l2-3Z" strokeLinejoin="round" />
          <path d="M9 12h6M9 16h4" strokeLinecap="round" />
        </svg>
      );
    case "lottery":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
