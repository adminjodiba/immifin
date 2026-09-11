import Link from "next/link";
import { Ds2Card } from "@/components/ds2/Ds2Card";
import { Ds2PublicPageShell } from "@/components/ds2/Ds2PublicPageShell";
import { Ds2SectionHeader } from "@/components/ds2/Ds2SectionHeader";
import { articles } from "@/lib/data/articles";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "About",
  description:
    "Learn about Immifin — our mission to help immigrants navigate visas, taxes, investing, credit, and citizenship in America.",
  path: "/about",
});

const values = [
  {
    title: "Clarity",
    description: "We translate complex immigration and finance topics into clear, actionable guidance.",
    icon: "✦",
  },
  {
    title: "Accuracy",
    description: "Our content is researched and updated to reflect current policies and best practices.",
    icon: "◎",
  },
  {
    title: "Accessibility",
    description: "Everyone deserves access to quality information, regardless of their background.",
    icon: "❋",
  },
];

export default function AboutPage() {
  return (
    <Ds2PublicPageShell
      eyebrow="IMMIFIN"
      title="About Immifin"
      description="We help immigrants navigate the complexities of life in America — from visa applications to building wealth."
    >
      <section>
        <Ds2SectionHeader title="Our Mission" titleAs="h2" />
        <Ds2Card>
          <div className="ds2-public-prose">
            <p>
              Moving to a new country is one of life&apos;s biggest transitions. Immifin was created to
              make that journey easier by providing trustworthy immigration guides, financial tools, and
              practical calculators — all in one place.
            </p>
            <p>
              Whether you&apos;re on an H-1B visa, pursuing a green card, or building your first credit
              history, we&apos;re here to help you make informed decisions every step of the way.
            </p>
          </div>
        </Ds2Card>
      </section>

      <section>
        <Ds2SectionHeader
          title="Our Values"
          titleAs="h2"
          description="The principles that guide everything we publish."
        />
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {values.map((value) => (
            <Ds2Card key={value.title}>
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold"
                style={{
                  backgroundColor: "var(--immifin-ds2-blue-soft)",
                  color: "var(--immifin-ds2-blue)",
                }}
                aria-hidden="true"
              >
                {value.icon}
              </span>
              <h3 className="mt-4 text-base font-bold tracking-tight text-[color:var(--immifin-ds2-text-primary)]">
                {value.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--immifin-ds2-text-muted)]">
                {value.description}
              </p>
            </Ds2Card>
          ))}
        </div>
      </section>

      <section id="articles" className="scroll-mt-24">
        <Ds2SectionHeader
          title="Latest Articles"
          titleAs="h2"
          description="Stay up to date with immigration policy changes and financial tips for newcomers."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {articles.map((article) => (
            <Ds2Card key={article.slug} as="article">
              <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--immifin-ds2-text-muted)]">
                {article.category}
              </p>
              <h3 className="mt-2 text-sm font-bold leading-snug text-[color:var(--immifin-ds2-text-primary)]">
                <Link
                  href="/about#articles"
                  className="transition-colors hover:text-[color:var(--immifin-ds2-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--immifin-ds2-navy)]"
                >
                  {article.title}
                </Link>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--immifin-ds2-text-muted)]">
                {article.excerpt}
              </p>
            </Ds2Card>
          ))}
        </div>
      </section>

      <section>
        <Ds2Card className="ds2-public-cta">
          <Ds2SectionHeader
            title="Get in Touch"
            titleAs="h2"
            description="Have a question or suggestion? We'd love to hear from you."
          />
          <Link href="/contact" className="ds2-public-cta-link">
            Contact Us
          </Link>
        </Ds2Card>
      </section>
    </Ds2PublicPageShell>
  );
}
