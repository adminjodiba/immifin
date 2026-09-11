import Link from "next/link";
import { formatPublicArticleDate, type PublicArticle } from "@/lib/data/public-articles";

export function LandingV3ArticleCard({ article }: { article: PublicArticle }) {
  return (
    <article className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200/80 hover:shadow-md hover:shadow-slate-200/60 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge bg-blue-50 text-blue-700 ring-1 ring-blue-100">IMMIFIN</span>
        <time dateTime={article.date} className="text-xs font-medium text-slate-500">
          {formatPublicArticleDate(article.date)}
        </time>
      </div>
      <h3 className="mt-2.5 text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-brand-700 sm:text-[0.9375rem]">
        <Link href={article.href}>{article.title}</Link>
      </h3>
      <p className="mt-1.5 flex-1 text-xs leading-snug text-slate-600">{article.excerpt}</p>
      <Link href={article.href} className="link-arrow mt-2.5 text-xs sm:text-sm">
        Read article
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
      </Link>
    </article>
  );
}
