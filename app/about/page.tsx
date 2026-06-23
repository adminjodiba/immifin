import { PageHeader } from "@/components/PageHeader";
import { ArticleCard } from "@/components/ArticleCard";
import { articles } from "@/lib/data/articles";
import { createMetadata } from "@/lib/metadata";
import Link from "next/link";

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
  },
  {
    title: "Accuracy",
    description: "Our content is researched and updated to reflect current policies and best practices.",
  },
  {
    title: "Accessibility",
    description: "Everyone deserves access to quality information, regardless of their background.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        breadcrumb="About"
        title="About Immifin"
        description="We help immigrants navigate the complexities of life in America — from visa applications to building wealth."
      />

      <section className="section-padding">
        <div className="container-main">
          <div className="mx-auto max-w-3xl">
            <h2 className="heading-2">Our Mission</h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Moving to a new country is one of life&apos;s biggest transitions. Immifin was
              created to make that journey easier by providing trustworthy immigration guides,
              financial tools, and practical calculators — all in one place.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Whether you&apos;re on an H-1B visa, pursuing a green card, or building your first
              credit history, we&apos;re here to help you make informed decisions every step of the way.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-main">
          <h2 className="heading-2 text-center">Our Values</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {values.map((value) => (
              <div key={value.title} className="card text-center">
                <h3 className="heading-3">{value.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="articles" className="section-padding scroll-mt-24">
        <div className="container-main">
          <h2 className="heading-2">Latest Articles</h2>
          <p className="mt-3 max-w-2xl text-lead">
            Stay up to date with immigration policy changes and financial tips for newcomers.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-brand-50">
        <div className="container-main text-center">
          <h2 className="heading-2 text-brand-900">Get in Touch</h2>
          <p className="mx-auto mt-4 max-w-xl text-lead">
            Have a question or suggestion? We&apos;d love to hear from you.
          </p>
          <Link href="/contact" className="btn-primary mt-8">
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}
