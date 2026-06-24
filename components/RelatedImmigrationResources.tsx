import Link from "next/link";

export type RelatedResource = {
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
};

type RelatedImmigrationResourcesProps = {
  resources: RelatedResource[];
};

export function RelatedImmigrationResources({ resources }: RelatedImmigrationResourcesProps) {
  return (
    <section className="mt-8" aria-labelledby="related-immigration-resources">
      <h2 id="related-immigration-resources" className="heading-3 mb-4">
        Related Immigration Resources
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {resources.map((resource) => (
          <article
            key={resource.href}
            className="card-static group flex h-full flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand-200/50"
          >
            <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-brand-700">
              {resource.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
              {resource.description}
            </p>
            <Link
              href={resource.href}
              className="btn-primary mt-5 w-full sm:w-auto"
            >
              {resource.buttonLabel}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
