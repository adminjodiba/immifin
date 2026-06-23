import Link from "next/link";
import type { Guide } from "@/lib/data/guides";

type GuideCardProps = {
  guide: Guide;
  basePath: string;
};

export function GuideCard({ guide, basePath }: GuideCardProps) {
  return (
    <article className="card group flex h-full flex-col">
      <span className="text-xs font-medium uppercase tracking-wider text-brand-600">
        {guide.readTime}
      </span>
      <h3 className="heading-3 mt-3 group-hover:text-brand-700">
        <Link href={`${basePath}#${guide.slug}`}>{guide.title}</Link>
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{guide.description}</p>
      <Link
        href={`${basePath}#${guide.slug}`}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        Read guide
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </article>
  );
}
