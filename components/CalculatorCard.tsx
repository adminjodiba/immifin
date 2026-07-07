import Link from "next/link";
import type { Calculator } from "@/lib/data/calculators";

export function CalculatorCard({ calculator }: { calculator: Calculator }) {
  return (
    <Link
      href={calculator.href ?? `/calculators#${calculator.slug}`}
      className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200/80 hover:shadow-md hover:shadow-slate-200/60 active:translate-y-0 active:scale-[0.99] active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 sm:p-4"
      aria-label={`Open ${calculator.title}`}
    >
      <h3 className="text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-brand-700 sm:text-[0.9375rem]">
        {calculator.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-slate-600">{calculator.description}</p>
    </Link>
  );
}
