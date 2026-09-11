import type { ReactNode } from "react";

type LandingV2SectionHeaderProps = {
  title: string;
  description?: string;
  titleId?: string;
  /** Keep the title on one line (used by the Explore heading). */
  nowrapTitle?: boolean;
  action?: ReactNode;
};

export function LandingV2SectionHeader({
  title,
  description,
  titleId,
  nowrapTitle = false,
  action,
}: LandingV2SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2
          id={titleId}
          className={`${
            nowrapTitle ? "whitespace-nowrap " : ""
          }text-[clamp(1.05rem,3.6vw,1.875rem)] font-bold tracking-tight text-slate-900`}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-sm leading-snug text-slate-600 sm:text-base">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
