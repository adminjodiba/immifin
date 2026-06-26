import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";

type ClerkAuthShellProps = {
  breadcrumb: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function ClerkAuthShell({
  breadcrumb,
  title,
  description,
  children,
}: ClerkAuthShellProps) {
  return (
    <>
      <PageHeader breadcrumb={breadcrumb} title={title} description={description} />

      <section className="section-padding">
        <div className="container-main flex justify-center py-4 sm:py-8">{children}</div>
      </section>
    </>
  );
}
