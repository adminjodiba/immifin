/** Shared restrained tier label for premium navigation discovery. */
export function ProBadge({
  label = "Pro",
  className,
}: {
  label?: "Pro" | "Power";
  className?: string;
}) {
  return (
    <span
      className={`immifin-pro-badge ml-1.5 inline-flex items-center rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700${
        className ? ` ${className}` : ""
      }`}
    >
      {label}
    </span>
  );
}
