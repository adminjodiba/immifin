"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FavoriteStar } from "@/components/favorites/FavoriteStar";

type WorkspacePageHeaderProps = {
  title: string;
  description?: string;
  breadcrumb?: string;
  pageHref?: string;
  showFavorite?: boolean;
  icon?: ReactNode;
  actions?: ReactNode;
  titleClassName?: string;
};

export function WorkspacePageHeader({
  title,
  description,
  breadcrumb,
  pageHref,
  showFavorite = true,
  icon,
  actions,
  titleClassName = "text-xl font-bold tracking-tight text-brand-900 sm:text-2xl",
}: WorkspacePageHeaderProps) {
  return (
    <header className={actions ? "flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between" : undefined}>
      <div className="min-w-0">
        {breadcrumb ? (
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <li>
                <Link href="/" className="transition-colors hover:text-brand-700">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-slate-300">
                /
              </li>
              <li className="font-medium text-brand-700">{breadcrumb}</li>
            </ol>
          </nav>
        ) : null}

        <div className={`flex items-start gap-3 ${icon ? "" : "gap-2"}`}>
          {icon ? (
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <h1 className={titleClassName}>{title}</h1>
              {showFavorite ? <FavoriteStar pageLabel={title} pageHref={pageHref} /> : null}
            </div>
            {description ? (
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">{description}</p>
            ) : null}
          </div>
        </div>
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-2 xl:justify-end">{actions}</div> : null}
    </header>
  );
}
