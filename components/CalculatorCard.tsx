import { ProtectedLink } from "@/components/auth/ProtectedLink";
import type { Calculator } from "@/lib/data/calculators";

const categoryColors: Record<Calculator["category"], string> = {
  immigration: "bg-blue-50 text-blue-700 ring-blue-100",
  finance: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  tax: "bg-amber-50 text-amber-700 ring-amber-100",
  insurance: "bg-violet-50 text-violet-700 ring-violet-100",
};

export function CalculatorCard({ calculator }: { calculator: Calculator }) {
  return (
    <ProtectedLink
      href={calculator.href ?? `/calculators#${calculator.slug}`}
      className="card group flex h-full flex-col"
    >
      <span
        className={`badge ring-1 ${categoryColors[calculator.category]} capitalize`}
      >
        {calculator.category}
      </span>
      <h3 className="heading-3 mt-4 transition-colors group-hover:text-brand-700">
        {calculator.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
        {calculator.description}
      </p>
      <span className="link-arrow mt-5">
        Open calculator
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
      </span>
    </ProtectedLink>
  );
}
