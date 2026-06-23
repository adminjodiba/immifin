import Link from "next/link";
import { formatArticleDate, type Article } from "@/lib/data/articles";

const categoryColors: Record<Article["category"], string> = {
  immigration: "bg-blue-100 text-blue-800",
  finance: "bg-emerald-100 text-emerald-800",
};

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="card group flex h-full flex-col">
      <div className="flex items-center gap-3">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${categoryColors[article.category]}`}
        >
          {article.category}
        </span>
        <time dateTime={article.date} className="text-xs text-slate-500">
          {formatArticleDate(article.date)}
        </time>
      </div>
      <h3 className="heading-3 mt-4 group-hover:text-brand-700">
        <Link href={`/about#articles`}>{article.title}</Link>
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{article.excerpt}</p>
      <Link
        href={`/about#articles`}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        Read article
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </article>
  );
}
