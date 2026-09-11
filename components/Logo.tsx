import Link from "next/link";

type LogoProps = {
  showText?: boolean;
  size?: "sm" | "md";
  /** Destination for the brand link. Defaults to production home `/`. */
  href?: string;
  /**
   * `navy` — Landing V5/V6 deep navy icon tile (`--landing-v5-navy`).
   * Default keeps the production brand blue gradient everywhere else.
   */
  iconTone?: "default" | "navy";
};

export function Logo({
  showText = true,
  size = "md",
  href = "/",
  iconTone = "default",
}: LogoProps) {
  const iconSize = size === "sm" ? "h-8 w-8 text-base" : "h-9 w-9 text-lg";
  const textSize = size === "sm" ? "text-lg" : "text-xl";
  const iconBackgroundClass =
    iconTone === "navy"
      ? "bg-[var(--landing-v5-navy)] shadow-md shadow-[color-mix(in_srgb,var(--landing-v5-navy)_25%,transparent)]"
      : "bg-gradient-to-br from-brand-600 to-brand-700 shadow-md shadow-brand-700/25";

  return (
    <Link href={href} className="group flex items-center gap-2.5">
      <span
        className={`flex ${iconSize} items-center justify-center rounded-xl ${iconBackgroundClass} font-bold text-white transition-transform group-hover:scale-105`}
      >
        i
      </span>
      {showText && (
        <span className={`${textSize} font-bold tracking-tight text-slate-900`}>Immifin</span>
      )}
    </Link>
  );
}
