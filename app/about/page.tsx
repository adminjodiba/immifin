import { PageHeader } from "@/components/PageHeader";
import { WorkspaceSection } from "@/components/layout/WorkspaceSection";
import { ArticleCard } from "@/components/ArticleCard";
import { CtaBanner } from "@/components/CtaBanner";
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
    <PageHeader
      breadcrumb="About"
      title="About Immifin"
      description="We help immigrants navigate the complexities of life in America — from visa applications to building wealth."
    >
      <WorkspaceSection>
        <div className="card-static mx-auto max-w-3xl">
          <h2 className="heading-2">Our Mission</h2>
          <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base">
            Moving to a new country is one of life&apos;s biggest transitions. Immifin was
            created to make that journey easier by providing trustworthy immigration guides,
            financial tools, and practical calculators — all in one place.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            Whether you&apos;re on an H-1B visa, pursuing a green card, or building your first
            credit history, we&apos;re here to help you make informed decisions every step of the way.
          </p>
        </div>
      </WorkspaceSection>

      <WorkspaceSection alt>
        <h2 className="heading-2 text-center">Our Values</h2>
        <p className="mx-auto max-w-xl text-center text-sm text-slate-600 sm:text-base">
          The principles that guide everything we publish.
        </p>
        <div className="grid gap-5 sm:grid-cols-3 sm:gap-6">
          {values.map((value) => (
            <div key={value.title} className="card-static text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-lg font-bold text-brand-700 ring-1 ring-brand-100">
                {value.icon}
              </span>
              <h3 className="heading-3 mt-5">{value.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{value.description}</p>
            </div>
          ))}
        </div>
      </WorkspaceSection>

      <WorkspaceSection id="articles" className="scroll-mt-24">
        <h2 className="heading-2">Latest Articles</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Stay up to date with immigration policy changes and financial tips for newcomers.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </WorkspaceSection>

      <CtaBanner
        title="Get in Touch"
        description="Have a question or suggestion? We'd love to hear from you."
        primaryCta={{ href: "/contact", label: "Contact Us" }}
      />
    </PageHeader>
  );
}
