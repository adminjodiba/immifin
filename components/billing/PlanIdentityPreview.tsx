import Link from "next/link";
import { getPlanDisplay } from "@/lib/pricing/plan-display";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

type PlanIdentityPreviewProps = {
  plan: SubscriptionTier;
  isCurrent: boolean;
  variant: "floating" | "inline";
  previewId: string;
};

function PreviewHeaderMark({ plan }: { plan: SubscriptionTier }) {
  if (plan === "power") {
    return (
      <svg className="ds2-billing-plan-preview-mark" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.2 2.4 5.8 13.2h5.1L9.4 21.6l8.8-12.3h-5.2L13.2 2.4Z" />
      </svg>
    );
  }

  if (plan === "pro") {
    return (
      <svg className="ds2-billing-plan-preview-mark" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.4 13.4 8l5.6 1.4-4.2 4 1.2 5.6L12 16.4 7.8 19l1.2-5.6-4.2-4L10.6 8 12 2.4Z" />
      </svg>
    );
  }

  return (
    <svg className="ds2-billing-plan-preview-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13.2 4.2c-1.2 2.8-.6 5 1.3 7.2 1.2-2.8 3.4-4.3 5.5-4.6-2.4-1.8-4.8-2.1-6.8-2.6Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M8.8 6.6c-1.5 3.3-.6 6 1.8 8.7.9-3.3 3.6-5.4 6.3-6-3-2.4-5.6-2.7-8.1-2.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PlanIdentityPreview({
  plan,
  isCurrent,
  variant,
  previewId,
}: PlanIdentityPreviewProps) {
  const display = getPlanDisplay(plan);
  const className = [
    "ds2-billing-plan-preview",
    `ds2-billing-plan-preview-${plan}`,
    variant === "floating" ? "ds2-billing-plan-preview-float" : "ds2-billing-plan-preview-inline",
  ].join(" ");

  return (
    <div
      id={previewId}
      className={className}
      role="region"
      aria-label={`${display.name} plan details`}
    >
      <header className="ds2-billing-plan-preview-header">
        <div className="ds2-billing-plan-preview-heading">
          <p className="ds2-billing-plan-preview-name">{display.name}</p>
          <p className="ds2-billing-plan-preview-tagline">{display.description}</p>
        </div>
        <div className="ds2-billing-plan-preview-header-meta">
          {isCurrent ? <span className="ds2-billing-plan-preview-current">Current Plan</span> : null}
          <PreviewHeaderMark plan={plan} />
        </div>
      </header>
      <div className="ds2-billing-plan-preview-body">
        <ul className="ds2-billing-plan-preview-features">
          {display.features.map((feature) => (
            <li key={feature}>
              <span className="ds2-billing-plan-preview-check" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M4.8 8.1 7 10.2 11.2 5.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Link href="/pricing" className="ds2-billing-plan-preview-cta">
          View full plan <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
