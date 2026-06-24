import Link from "next/link";
import {
  formatBulletinDate,
  getVisaBulletinData,
  parseBulletinCutoffDate,
  type VisaBulletinRow,
} from "@/lib/visaBulletinData";

type BulletinStatus = {
  label: string;
  badgeClass: string;
};

function getStatus(finalActionDate: string): BulletinStatus {
  const normalized = finalActionDate.trim().toUpperCase();

  if (normalized === "C") {
    return {
      label: "🟢 Current",
      badgeClass: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    };
  }

  if (normalized === "U") {
    return {
      label: "🔴 Unavailable",
      badgeClass: "bg-red-50 text-red-800 ring-red-200",
    };
  }

  return {
    label: "🟡 Waiting Queue",
    badgeClass: "bg-amber-50 text-amber-900 ring-amber-200",
  };
}

function formatFinalActionDate(value: string): string {
  const parsed = parseBulletinCutoffDate(value);

  if (parsed === "C") {
    return "Current (C)";
  }

  if (parsed === "U") {
    return "Unavailable (U)";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
    return formatBulletinDate(parsed);
  }

  return value;
}

function getCurrentMonthLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/** Loads the same data served by GET /api/visa-bulletin (direct lib call avoids dev-server self-fetch deadlocks). */
async function loadVisaBulletinRows(): Promise<VisaBulletinRow[]> {
  return getVisaBulletinData();
}

export async function VisaBulletinDashboard() {
  let rows: VisaBulletinRow[] = [];
  let error: string | null = null;

  try {
    rows = await loadVisaBulletinRows();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load visa bulletin data.";
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-50/80 via-white to-white" />
        <div className="container-main relative py-10 sm:py-14 lg:py-16">
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
              <li>
                <Link href="/immigration" className="transition-colors hover:text-brand-700">
                  Immigration
                </Link>
              </li>
              <li aria-hidden="true" className="text-slate-300">
                /
              </li>
              <li className="font-medium text-brand-700">Visa Bulletin Dashboard</li>
            </ol>
          </nav>
          <h1 className="heading-1 text-brand-900">Visa Bulletin Dashboard</h1>
          <p className="mt-4 max-w-3xl text-lead">
            Live employment-based visa bulletin data updated from the U.S. Department of State.
          </p>
        </div>
      </section>

      <section className="section-padding !pt-10 sm:!pt-14">
        <div className="container-main space-y-8">
          <div className="card-static grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Data source
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                U.S. Department of State Visa Bulletin
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Last updated
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">{getCurrentMonthLabel()}</p>
            </div>
          </div>

          {error ? (
            <div
              className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/80">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900 sm:px-6"
                      >
                        Category
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900 sm:px-6"
                      >
                        Country
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900 sm:px-6"
                      >
                        Final Action Date
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900 sm:px-6"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map((row) => {
                      const status = getStatus(row.finalActionDate);

                      return (
                        <tr
                          key={`${row.category}-${row.country}`}
                          className="hover:bg-slate-50/80"
                        >
                          <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-900 sm:px-6">
                            {row.category}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-700 sm:px-6">
                            {row.country}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-700 sm:px-6">
                            {formatFinalActionDate(row.finalActionDate)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.badgeClass}`}
                            >
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <section aria-labelledby="related-tools">
            <h2 id="related-tools" className="heading-3 mb-4">
              Related Tools
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/calculators/green-card-wait-time" className="btn-primary">
                Green Card Wait Time Calculator
              </Link>
              <Link href="/calculators/citizenship-eligibility" className="btn-secondary">
                Citizenship Eligibility Calculator
              </Link>
            </div>
          </section>

          <p className="text-sm leading-relaxed text-slate-500">
            This dashboard is for informational purposes only and does not constitute legal advice.
            Final action dates can change each month when a new visa bulletin is published.
          </p>
        </div>
      </section>
    </>
  );
}
