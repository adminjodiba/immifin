import { getPlanComparisonRows } from "@/lib/pricing/plan-display";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

function ComparisonMark({
  included,
  plan,
}: {
  included: boolean;
  plan: SubscriptionTier;
}) {
  if (included) {
    return (
      <span className={`ds2-pricing-compare-check ds2-pricing-compare-check-${plan}`}>
        <span aria-hidden="true">✓</span>
        <span className="sr-only">Included</span>
      </span>
    );
  }

  return (
    <span className="ds2-pricing-compare-dash">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not included</span>
    </span>
  );
}

export function PricingPlanComparison() {
  const rows = getPlanComparisonRows();

  return (
    <section className="ds2-pricing-compare" aria-labelledby="pricing-plan-comparison-heading">
      <header className="ds2-pricing-compare-header">
        <div className="ds2-pricing-compare-heading-row">
          <span className="ds2-pricing-compare-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="4" y="5" width="16" height="3" rx="1" fill="currentColor" />
              <rect x="4" y="10.5" width="16" height="3" rx="1" fill="currentColor" />
              <rect x="4" y="16" width="16" height="3" rx="1" fill="currentColor" />
            </svg>
          </span>
          <div>
            <h2 id="pricing-plan-comparison-heading" className="ds2-pricing-compare-title">
              Plan Comparison
            </h2>
            <p className="ds2-pricing-compare-copy">
              A quick overview of what&apos;s included in each plan.
            </p>
          </div>
        </div>
      </header>

      <div className="ds2-pricing-compare-frame">
        <table className="ds2-pricing-compare-table">
          <caption className="sr-only">
            Feature comparison across Free, Pro, and Power plans
          </caption>
          <thead>
            <tr>
              <th scope="col">Feature</th>
              <th scope="col">
                <span className="ds2-pricing-compare-banner ds2-billing-plan-card-free">Free</span>
              </th>
              <th scope="col">
                <span className="ds2-pricing-compare-banner ds2-billing-plan-card-pro">Pro</span>
              </th>
              <th scope="col">
                <span className="ds2-pricing-compare-banner ds2-billing-plan-card-power">Power</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature}>
                <th scope="row">{row.feature}</th>
                <td data-plan="free">
                  <span className="ds2-pricing-compare-plan-label">Free</span>
                  <ComparisonMark included={row.included.free} plan="free" />
                </td>
                <td data-plan="pro">
                  <span className="ds2-pricing-compare-plan-label">Pro</span>
                  <ComparisonMark included={row.included.pro} plan="pro" />
                </td>
                <td data-plan="power">
                  <span className="ds2-pricing-compare-plan-label">Power</span>
                  <ComparisonMark included={row.included.power} plan="power" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
