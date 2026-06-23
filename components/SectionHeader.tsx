import Link from "next/link";

type SectionHeaderProps = {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
};

export function SectionHeader({
  title,
  description,
  href,
  linkLabel = "View all",
}: SectionHeaderProps) {
  return (
    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="heading-2">{title}</h2>
        {description && <p className="mt-3 max-w-2xl text-lead">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          {linkLabel}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      )}
    </div>
  );
}
