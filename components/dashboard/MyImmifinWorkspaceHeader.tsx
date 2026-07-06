import { DashboardCloseAction } from "@/components/dashboard/DashboardCloseAction";
import { FavoriteStar } from "@/components/favorites/FavoriteStar";

type MyImmifinWorkspaceHeaderProps = {
  welcomeName: string;
};

function formatWelcomeBack(welcomeName: string): string {
  if (!welcomeName.trim() || welcomeName.trim() === "Welcome") {
    return "Welcome back";
  }

  return `Welcome back, ${welcomeName.trim()}`;
}

export function MyImmifinWorkspaceHeader({ welcomeName }: MyImmifinWorkspaceHeaderProps) {
  return (
    <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path
                d="M4 19V5M9 19V9M14 19V3M20 19v-7"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <h1 className="text-xl font-bold tracking-tight text-brand-900 sm:text-2xl">
                {formatWelcomeBack(welcomeName)}
              </h1>
              <FavoriteStar pageLabel="My Immifin Dashboard" pageHref="/dashboard" />
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
              Your personalized Dashboard
            </p>
          </div>
        </div>
      </div>
      <DashboardCloseAction />
    </header>
  );
}
