import Link from "next/link";
import { formatArticleDate, type Article } from "@/lib/data/articles";

const categoryColors: Record<Article["category"], string> = {
  immigration: "bg-blue-50 text-blue-700 ring-blue-100",
  finance: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="card group flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`badge ring-1 ${categoryColors[article.category]} capitalize`}>
          {article.category}
        </span>
        <time dateTime={article.date} className="text-xs font-medium text-slate-500">
          {formatArticleDate(article.date)}
        </time>
      </div>
      <h3 className="heading-3 mt-4 transition-colors group-hover:text-brand-700">
        <Link href="/about#articles">{article.title}</Link>
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{article.excerpt}</p>
      <Link href="/about#articles" className="link-arrow mt-5">
        Read article
        <svg
          className="h-4 w-4 transition-transform group-hover:translate-x-1"
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
