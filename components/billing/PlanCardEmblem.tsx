import type { SubscriptionTier } from "@/lib/subscription/tiers";

function getPlanCardMotto(tier: SubscriptionTier): string[] {
  if (tier === "power") {
    return ["Maximum insights.", "Maximum control."];
  }

  if (tier === "pro") {
    return ["Go further", "with IMMIFIN."];
  }

  return ["A Smarter", "Immigration", "Journey"];
}

export function PlanCardEmblem({ tier }: { tier: SubscriptionTier }) {
  const motto = getPlanCardMotto(tier);

  return (
    <div className="ds2-billing-plan-card-emblem" aria-hidden="true">
      {tier === "pro" ? (
        <svg className="ds2-billing-plan-card-emblem-svg" viewBox="0 0 120 120" fill="none">
          <path
            d="M60 18 64.8 42.2 88 48 64.8 53.8 60 78 55.2 53.8 32 48 55.2 42.2 60 18Z"
            fill="currentColor"
            opacity="0.88"
          />
          <path
            d="M92 58 94.6 70.4 106 73.2 94.6 76 92 88.4 89.4 76 78 73.2 89.4 70.4 92 58Z"
            fill="currentColor"
            opacity="0.7"
          />
          <path
            d="M28 64 30.2 74.2 40 76.4 30.2 78.6 28 88.8 25.8 78.6 16 76.4 25.8 74.2 28 64Z"
            fill="currentColor"
            opacity="0.55"
          />
        </svg>
      ) : null}
      {tier === "power" ? (
        <svg className="ds2-billing-plan-card-emblem-svg" viewBox="0 0 120 120" fill="none">
          <path
            d="M68 14 34 68h26l-10 38 42-58H66l2-34Z"
            fill="currentColor"
            opacity="0.9"
          />
        </svg>
      ) : null}
      {tier === "free" ? (
        <svg className="ds2-billing-plan-card-emblem-svg" viewBox="0 0 140 140" fill="none">
          <path
            d="M78 22c-8 18-4 32 8 46 8-18 22-28 36-30-16-12-32-14-44-16Z"
            fill="currentColor"
            opacity="0.55"
          />
          <path
            d="M54 38c-10 22-4 40 12 58 6-22 24-36 42-40-20-16-38-18-54-18Z"
            fill="currentColor"
            opacity="0.82"
          />
          <path
            d="M70 48c1 18-6 32-18 46"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.45"
          />
        </svg>
      ) : null}
      <p className="ds2-billing-plan-card-motto">
        {motto.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
    </div>
  );
}
