import Link from "next/link";
import { Ds2Card } from "@/components/ds2/Ds2Card";
import { Ds2PublicPageShell } from "@/components/ds2/Ds2PublicPageShell";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Life in America",
  description:
    "IMMIFIN is starting with U.S. immigration tools and will expand over time to help immigrant families navigate more of everyday life in America.",
  path: "/life",
});

export default function LifePage() {
  return (
    <Ds2PublicPageShell
      eyebrow="LIFE IN AMERICA"
      title="Life in America"
      description="IMMIFIN is starting with U.S. immigration tools today and will expand over time to help immigrant families navigate more of everyday life in America."
    >
      <Ds2Card className="ds2-public-cta max-w-2xl">
        <p className="m-0 text-base leading-relaxed text-[color:var(--immifin-ds2-text-muted)]">
          For now, explore IMMIFIN&apos;s available immigration tools and stay informed as the
          platform grows.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/immigration" className="ds2-public-cta-link">
            Explore Immigration
          </Link>
          <Link href="/calculators" className="btn-secondary">
            View Immigration Tools
          </Link>
        </div>
      </Ds2Card>
    </Ds2PublicPageShell>
  );
}
