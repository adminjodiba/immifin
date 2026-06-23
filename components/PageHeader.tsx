import Link from "next/link";

type PageHeaderProps = {
  title: string;
  description: string;
  breadcrumb?: string;
};

export function PageHeader({ title, description, breadcrumb }: PageHeaderProps) {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="container-main py-12 sm:py-16">
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-sm text-slate-500">
              <li>
                <Link href="/" className="hover:text-brand-700">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-brand-700">{breadcrumb}</li>
            </ol>
          </nav>
        )}
        <h1 className="heading-1 text-brand-900">{title}</h1>
        <p className="mt-4 max-w-3xl text-lead">{description}</p>
      </div>
    </section>
  );
}
