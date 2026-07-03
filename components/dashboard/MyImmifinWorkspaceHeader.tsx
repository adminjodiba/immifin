import { DashboardCloseAction } from "@/components/dashboard/DashboardCloseAction";

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
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <header className="min-w-0">
        <h1 className="heading-2 text-slate-900">{formatWelcomeBack(welcomeName)}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Here is your personalized IMMIFIN workspace.
        </p>
      </header>
      <DashboardCloseAction />
    </div>
  );
}
