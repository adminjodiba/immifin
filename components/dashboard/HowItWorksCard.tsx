type HowItWorksVariant = "employment" | "green_card";

type HowItWorksCardProps = {
  variant?: HowItWorksVariant;
};

const employmentItems = [
  "Your Priority Date is your fixed milestone — it does not change.",
  "Visa Bulletin dates move monthly and determine when your case may advance.",
  "Dates for Filing relates to Form I-485 filing eligibility.",
  "Final Action Date relates to Green Card approval eligibility.",
  {
    text: "Green means the Visa Bulletin cutoff has reached or passed your Priority Date.",
    emphasis: "Green",
    emphasisClass: "text-emerald-700",
  },
  {
    text: "Red means the Visa Bulletin cutoff has not reached your Priority Date yet.",
    emphasis: "Red",
    emphasisClass: "text-red-700",
  },
] as const;

const greenCardItems = [
  "The left side of the progress bar is your Green Card date.",
  "The Today marker shows how far you have progressed toward citizenship eligibility.",
  "The right side is your earliest N-400 filing date.",
  "N-400 can generally be filed up to 90 days before the 5-year Green Card anniversary, subject to eligibility.",
] as const;

function HowItWorksListItem({
  children,
  emphasis,
  emphasisClass,
}: {
  children: string;
  emphasis?: string;
  emphasisClass?: string;
}) {
  if (!emphasis || !emphasisClass) {
    return <li>{children}</li>;
  }

  const parts = children.split(emphasis);
  return (
    <li>
      <span className={`font-semibold ${emphasisClass}`}>{emphasis}</span>
      {parts[1]}
    </li>
  );
}

export function HowItWorksCard({ variant = "employment" }: HowItWorksCardProps) {
  const items = variant === "green_card" ? greenCardItems : employmentItems;

  return (
    <section className="card-static">
      <h2 className="heading-3 text-slate-900">How It Works</h2>
      <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
        {items.map((item) =>
          typeof item === "string" ? (
            <HowItWorksListItem key={item}>{item}</HowItWorksListItem>
          ) : (
            <HowItWorksListItem
              key={item.text}
              emphasis={item.emphasis}
              emphasisClass={item.emphasisClass}
            >
              {item.text}
            </HowItWorksListItem>
          ),
        )}
      </ul>
    </section>
  );
}
