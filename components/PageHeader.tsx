import Link from "next/link";

type PageHeaderProps = {
  title: string;
  description: string;
  breadcrumb?: string;
};

export function PageHeader({ title, description, breadcrumb }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-50/80 via-white to-white" />
      <div className="container-main relative py-10 sm:py-14 lg:py-16">
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <li>
                <Link href="/" className="transition-colors hover:text-brand-700">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-slate-300">
                /
              </li>
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
