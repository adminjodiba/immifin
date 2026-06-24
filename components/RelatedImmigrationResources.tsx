import Link from "next/link";

export type RelatedResource = {
  title: string;
  description?: string;
  buttonLabel?: string;
  href: string;
  primary?: boolean;
};

type RelatedImmigrationResourcesProps = {
  resources: RelatedResource[];
};

export function RelatedImmigrationResources({ resources }: RelatedImmigrationResourcesProps) {
  return (
    <section aria-labelledby="related-tools">
      <h2 id="related-tools" className="heading-3 mb-4">
        Related Tools
      </h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {resources.map((resource, index) => (
          <Link
            key={resource.href}
            href={resource.href}
            className={
              (resource.primary ?? index === 0) ? "btn-primary" : "btn-secondary"
            }
          >
            {resource.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
