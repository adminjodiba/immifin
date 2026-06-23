import Link from "next/link";
import { Hero } from "@/components/Hero";
import { SectionHeader } from "@/components/SectionHeader";
import { CalculatorCard } from "@/components/CalculatorCard";
import { GuideCard } from "@/components/GuideCard";
import { ArticleCard } from "@/components/ArticleCard";
import { getFeaturedCalculators } from "@/lib/data/calculators";
import { immigrationGuides, financeGuides } from "@/lib/data/guides";
import { articles } from "@/lib/data/articles";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata();

export default function HomePage() {
  const featuredCalculators = getFeaturedCalculators();

  return (
    <>
      <Hero
        title="Immigration, Finance & Life in America"
        subtitle="Helping immigrants navigate visas, taxes, investing, credit, and citizenship."
        primaryCta={{ href: "/calculators", label: "Explore Calculators" }}
        secondaryCta={{ href: "/immigration", label: "Immigration Guides" }}
      />

      <section className="section-padding" aria-labelledby="featured-calculators">
        <div className="container-main">
          <SectionHeader
            title="Featured Calculators"
            description="Practical tools to plan your immigration timeline, taxes, and financial future."
            href="/calculators"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCalculators.map((calculator) => (
              <CalculatorCard key={calculator.slug} calculator={calculator} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white" aria-labelledby="immigration-guides">
        <div className="container-main">
          <SectionHeader
            title="Immigration Guides"
            description="Clear, up-to-date guides on visas, green cards, and the path to citizenship."
            href="/immigration"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {immigrationGuides.map((guide) => (
              <GuideCard key={guide.slug} guide={guide} basePath="/immigration" />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding" aria-labelledby="finance-guides">
        <div className="container-main">
          <SectionHeader
            title="Finance Guides"
            description="Build credit, file taxes, invest wisely, and secure your financial foundation."
            href="/finance"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {financeGuides.map((guide) => (
              <GuideCard key={guide.slug} guide={guide} basePath="/finance" />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white" aria-labelledby="latest-articles">
        <div className="container-main">
          <SectionHeader
            title="Latest Articles"
            description="News, policy updates, and expert insights for immigrants in America."
            href="/about#articles"
            linkLabel="About Immifin"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-brand-600">
        <div className="container-main text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to take the next step?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
            Whether you&apos;re planning your visa strategy or building wealth in America,
            Immifin has the guides and tools you need.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/calculators"
              className="inline-flex w-full items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-800 shadow-sm transition-colors hover:bg-blue-50 sm:w-auto"
            >
              Browse Calculators
            </Link>
            <Link
              href="/about"
              className="inline-flex w-full items-center justify-center rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20 sm:w-auto"
            >
              Learn About Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
