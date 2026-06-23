import Link from "next/link";
import type { Calculator } from "@/lib/data/calculators";

const categoryColors: Record<Calculator["category"], string> = {
  immigration: "bg-blue-100 text-blue-800",
  finance: "bg-emerald-100 text-emerald-800",
  tax: "bg-amber-100 text-amber-800",
};

export function CalculatorCard({ calculator }: { calculator: Calculator }) {
  return (
    <Link href={calculator.href ?? `/calculators#${calculator.slug}`} className="card group block h-full">
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${categoryColors[calculator.category]}`}
      >
        {calculator.category}
      </span>
      <h3 className="heading-3 mt-4 group-hover:text-brand-700">{calculator.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{calculator.description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
        Open calculator
        <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </span>
    </Link>
  );
}
