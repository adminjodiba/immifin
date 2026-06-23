import Link from "next/link";

type LogoProps = {
  showText?: boolean;
  size?: "sm" | "md";
};

export function Logo({ showText = true, size = "md" }: LogoProps) {
  const iconSize = size === "sm" ? "h-8 w-8 text-base" : "h-9 w-9 text-lg";
  const textSize = size === "sm" ? "text-lg" : "text-xl";

  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span
        className={`flex ${iconSize} items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 font-bold text-white shadow-md shadow-brand-700/25 transition-transform group-hover:scale-105`}
      >
        i
      </span>
      {showText && (
        <span className={`${textSize} font-bold tracking-tight text-slate-900`}>Immifin</span>
      )}
    </Link>
  );
}
