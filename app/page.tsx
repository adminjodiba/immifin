import { Hero } from "@/components/Hero";
import { WorkspaceSection } from "@/components/layout/WorkspaceSection";
import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { SectionHeader } from "@/components/SectionHeader";
import { CalculatorCard } from "@/components/CalculatorCard";
import { GuideCard } from "@/components/GuideCard";
import { ArticleCard } from "@/components/ArticleCard";
import { CtaBanner } from "@/components/CtaBanner";
import { getFeaturedCalculators } from "@/lib/data/calculators";
import { immigrationGuides, financeGuides } from "@/lib/data/guides";
import { articles } from "@/lib/data/articles";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata();

export default function HomePage() {
  const featuredCalculators = getFeaturedCalculators();

  return (
    <ContactOnboardingGuard publicLanding>
      <>
        <Hero
          compact
          title="Immigration, Finance & Life in America"
          subtitle="Helping immigrants navigate visas, taxes, investing, credit, and citizenship."
        />

        <WorkspacePageShell>
          <WorkspaceSection aria-labelledby="featured-calculators">
            <SectionHeader
              title="Featured Calculators"
              description="Practical tools to plan your immigration timeline, taxes, and financial future."
              href="/calculators"
            />
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {featuredCalculators.map((calculator) => (
                <CalculatorCard key={calculator.slug} calculator={calculator} />
              ))}
            </div>
          </WorkspaceSection>

          <WorkspaceSection alt aria-labelledby="immigration-guides">
            <SectionHeader
              title="Immigration Guides"
              description="Clear, up-to-date guides on visas, green cards, and the path to citizenship."
              href="/immigration"
            />
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {immigrationGuides.map((guide) => (
                <GuideCard key={guide.slug} guide={guide} basePath="/immigration" />
              ))}
            </div>
          </WorkspaceSection>

          <WorkspaceSection aria-labelledby="finance-guides">
            <SectionHeader
              title="Finance Guides"
              description="Build credit, file taxes, invest wisely, and secure your financial foundation."
              href="/finance"
            />
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {financeGuides.map((guide) => (
                <GuideCard key={guide.slug} guide={guide} basePath="/finance" />
              ))}
            </div>
          </WorkspaceSection>

          <WorkspaceSection alt aria-labelledby="latest-articles">
            <SectionHeader
              title="Latest Articles"
              description="News, policy updates, and expert insights for immigrants in America."
              href="/about#articles"
              linkLabel="About Immifin"
            />
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {articles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </WorkspaceSection>

          <CtaBanner
            title="Ready to take the next step?"
            description="Whether you're planning your visa strategy or building wealth in America, Immifin has the guides and tools you need."
            primaryCta={{ href: "/calculators", label: "Browse Calculators" }}
            secondaryCta={{ href: "/about", label: "Learn About Us" }}
          />
        </WorkspacePageShell>
      </>
    </ContactOnboardingGuard>
  );
}
