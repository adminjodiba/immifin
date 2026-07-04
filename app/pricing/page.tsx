import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Pricing",
  description:
    "Choose your Immifin plan — start free, upgrade to Pro for automation, or Power for intelligence.",
  path: "/pricing",
});

const plans = [
  {
    id: "free",
    name: "Free",
    description: "Check bulletins and use calculators manually.",
    features: [
      "Current Visa Bulletin Dashboard",
      "Manual calculators",
      "Manage profile data",
      "No automation",
      "No notifications",
      "No AI",
    ],
    cta: "Get Started",
    ctaHref: "/signup",
    ctaStyle: "btn-secondary" as const,
    comingSoon: false,
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Automation for your immigration journey.",
    features: [
      "Personalized Dashboard",
      "Auto-populated calculators",
      "Visa Bulletin history",
      "Movement tracker",
      "Email alerts",
      "Notifications",
    ],
    cta: "Upgrade to Pro",
    ctaHref: "#",
    ctaStyle: "btn-primary" as const,
    comingSoon: true,
    highlighted: true,
  },
  {
    id: "power",
    name: "Power",
    description: "Full intelligence for life in America.",
    features: [
      "Everything in Pro",
      "AI Assistant",
      "Multiple profiles",
      "Advanced insights",
      "Priority support",
    ],
    cta: "Upgrade to Power",
    ctaHref: "#",
    ctaStyle: "btn-secondary" as const,
    comingSoon: true,
    highlighted: false,
  },
] as const;

export default function PricingPage() {
  return (
    <>
      <PageHeader
        breadcrumb="Pricing"
        title="Choose Your Immifin Plan"
        description="Start free. Upgrade when you are ready for automation and intelligence."
      />

      <section id="plans" className="section-padding !pt-10 sm:!pt-16">
        <div className="container-main">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`card-static flex flex-col ${
                  plan.highlighted ? "border-brand-300 ring-2 ring-brand-100" : ""
                }`}
              >
                {plan.highlighted ? (
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Most popular
                  </p>
                ) : null}
                <h2 className="heading-3 mt-1 text-slate-900">{plan.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{plan.description}</p>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm text-slate-700">
                      <span className="mt-0.5 text-brand-600" aria-hidden="true">
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {plan.comingSoon ? (
                    <button
                      type="button"
                      className={`${plan.ctaStyle} w-full cursor-not-allowed opacity-80`}
                      disabled
                    >
                      Coming Soon
                    </button>
                  ) : (
                    <Link href={plan.ctaHref} className={`${plan.ctaStyle} w-full`}>
                      {plan.cta}
                    </Link>
                  )}
                  {plan.comingSoon ? (
                    <p className="mt-2 text-center text-xs text-slate-500">
                      Billing is not enabled yet. Join the waitlist when payments launch.
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-500">
            Free users can enter profile data anytime. Pro unlocks automation — dashboard, alerts,
            and tracking. Power adds AI and advanced intelligence. Stripe checkout will connect
            here later.
          </p>
        </div>
      </section>
    </>
  );
}
