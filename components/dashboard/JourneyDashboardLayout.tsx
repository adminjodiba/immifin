import type { ReactNode } from "react";

type JourneyDashboardLayoutProps = {
  header: ReactNode;
  main: ReactNode;
  sidebar: ReactNode;
};

export function JourneyDashboardLayout({ header, main, sidebar }: JourneyDashboardLayoutProps) {
  return (
    <div className="space-y-8">
      {header}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-8">
        <div className="min-w-0 space-y-6">{main}</div>
        <aside className="min-w-0 space-y-6">{sidebar}</aside>
      </div>
    </div>
  );
}
