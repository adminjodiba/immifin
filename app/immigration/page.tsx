import Link from "next/link";
import { ProtectedLink } from "@/components/auth/ProtectedLink";
import { Ds2Card } from "@/components/ds2/Ds2Card";
import { Ds2PublicPageShell } from "@/components/ds2/Ds2PublicPageShell";
import { Ds2SectionHeader } from "@/components/ds2/Ds2SectionHeader";
import { immigrationGuides } from "@/lib/data/guides";
import { landingV3ImmigrationSections } from "@/lib/landing-v3-nav";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Immigration",
  description:
    "Expert immigration guides for visas, green cards, OPT, citizenship, and life in America.",
  path: "/immigration",
});

export default function ImmigrationPage() {
  return (
    <Ds2PublicPageShell
      eyebrow="IMMIGRATION"
      title="Immigration"
      description="Plan your U.S. immigration journey with Visa Bulletin tools, calculators, and visa services."
    >
      {landingV3ImmigrationSections.map((section) => (
        <section key={section.id} aria-labelledby={`immigration-${section.id}`}>
          <Ds2SectionHeader
            title={section.label}
            description={section.description}
            titleAs="h2"
            titleId={`immigration-${section.id}`}
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-3">
            {section.items.map((item) => (
              <Ds2Card key={item.href} hover>
                <Link
                  href={item.href}
                  className="ds2-hub-link"
                  aria-label={`Open ${item.label}`}
                >
                  <span className="ds2-hub-link-title-row">
                    <h3 className="ds2-hub-link-title">{item.label}</h3>
                    {item.tierLabel || item.premiumPreview ? (
                      <span className="ds2-hub-tier">{item.tierLabel ?? "Pro"}</span>
                    ) : null}
                  </span>
                  {item.description ? (
                    <p className="ds2-hub-link-description">{item.description}</p>
                  ) : null}
                </Link>
              </Ds2Card>
            ))}
          </div>
        </section>
      ))}

      <section aria-labelledby="all-guides">
        <Ds2SectionHeader title="Guides" titleAs="h2" titleId="all-guides" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-3.5">
          {immigrationGuides.map((guide) => (
            <article key={guide.slug} id={guide.slug} className="scroll-mt-24">
              <Ds2Card hover>
                <ProtectedLink
                  href={`/immigration#${guide.slug}`}
                  className="ds2-hub-link"
                  aria-label={`Read ${guide.title}`}
                >
                  <p className="ds2-hub-link-meta">{guide.readTime}</p>
                  <h3 className="ds2-hub-link-title">{guide.title}</h3>
                  <p className="ds2-hub-link-description">{guide.description}</p>
                </ProtectedLink>
              </Ds2Card>
            </article>
          ))}
        </div>
      </section>
    </Ds2PublicPageShell>
  );
}
