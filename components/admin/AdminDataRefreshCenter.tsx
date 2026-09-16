import { AdminDatasetRefreshButton } from "@/components/admin/AdminDatasetRefreshButton";
import {
  DATA_FRESHNESS_STATUS_LABELS,
  formatDisplayDate,
  getDataFreshnessStatus,
  getDataRefreshCenterAlert,
  getImmifinDatasets,
  type DataFreshnessStatus,
  type ImmifinDataset,
} from "@/lib/data/dataFreshness";

export function DataRefreshTitleStatus({
  message,
  status,
}: {
  message: string;
  status: DataFreshnessStatus;
}) {
  if (status === "current") {
    return null;
  }

  return (
    <span
      className={`ds2-drc-title-status ds2-drc-title-status-${status}`}
      role="status"
      aria-live="assertive"
    >
      ({message.replace(/\.$/, "")})
    </span>
  );
}

function DatasetIcon({ id }: { id: string }) {
  const common = "h-[18px] w-[18px]";
  if (id === "occupation") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="8" r="3" />
        <path d="M5.5 19c.6-3.1 3.1-5 6.5-5s5.9 1.9 6.5 5" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "dol-prevailing-wage") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M8 7V5.8A2.8 2.8 0 0 1 10.8 3h2.4A2.8 2.8 0 0 1 16 5.8V7" />
        <rect x="5" y="7" width="14" height="13" rx="2" />
      </svg>
    );
  }
  if (id === "h1b-lottery-odds") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M4 19V10M10 19V5M16 19v-8M20 19v-5" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "visa-stamping-wait-times") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M4 10c2.2-3 5-4.5 8-4.5S17.8 7 20 10" strokeLinecap="round" />
        <path d="M4 14h16M8 10v8M16 10v8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M7 4h7l3 3v13H7V4Z" />
      <path d="M14 4v4h4M9 13h6M9 16h4" strokeLinecap="round" />
    </svg>
  );
}

function MetaIcon({ name }: { name: "version" | "updated" | "next" | "frequency" }) {
  const common = "h-3.5 w-3.5 shrink-0";
  if (name === "version") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "updated") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "next") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M5 12h14M12 5v14" strokeLinecap="round" />
    </svg>
  );
}


function DatasetCard({ dataset, status }: { dataset: ImmifinDataset; status: DataFreshnessStatus }) {
  return (
    <article className={`ds2-drc-card ds2-drc-card-${dataset.id}`}>
      <header className="ds2-drc-card-head">
        <div className="ds2-drc-card-identity">
          <span className="ds2-drc-card-icon">
            <DatasetIcon id={dataset.id} />
          </span>
          <div>
            <h3 className="ds2-drc-card-title">{dataset.name}</h3>
            <p className="ds2-drc-card-subtitle">{dataset.version}</p>
          </div>
        </div>
        <div className="ds2-drc-card-badges">
          <span className={`ds2-drc-badge ds2-drc-badge-status-${status}`}>
            {DATA_FRESHNESS_STATUS_LABELS[status]}
          </span>
          <span className={`ds2-drc-badge ds2-drc-badge-urgency-${dataset.urgency.toLowerCase()}`}>
            Urgency: {dataset.urgency}
          </span>
        </div>
      </header>

      <dl className="ds2-drc-meta">
        <div>
          <dt>
            <MetaIcon name="version" />
            Version
          </dt>
          <dd>{dataset.version}</dd>
        </div>
        <div>
          <dt>
            <MetaIcon name="updated" />
            Last updated
          </dt>
          <dd>{formatDisplayDate(dataset.lastUpdated)}</dd>
        </div>
        <div>
          <dt>
            <MetaIcon name="next" />
            Next recommended refresh
          </dt>
          <dd>{formatDisplayDate(dataset.nextRecommendedRefresh)}</dd>
        </div>
        <div>
          <dt>
            <MetaIcon name="frequency" />
            Refresh frequency
          </dt>
          <dd>{dataset.refreshFrequency}</dd>
        </div>
      </dl>

      <div className="ds2-drc-howto">
        <h4>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M7 4h7l3 3v13H7V4Z" />
            <path d="M14 4v4h4" />
          </svg>
          How to refresh
        </h4>
        <p>{dataset.refreshHint}</p>
        {dataset.refreshSteps.length > 0 && (
          <details className="ds2-drc-steps group">
            <summary>
              <span aria-hidden="true">▸</span>
              Show refresh steps
            </summary>
            <ol>
              {dataset.refreshSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </details>
        )}
        {dataset.refreshAction ? (
          <AdminDatasetRefreshButton
            label={dataset.refreshAction.label}
            endpoint={dataset.refreshAction.endpoint}
          />
        ) : null}
      </div>
    </article>
  );
}

type AdminDataRefreshCenterProps = {
  showHeading?: boolean;
};

const STATUS_PRIORITY: Record<DataFreshnessStatus, number> = {
  overdue: 2,
  "due-soon": 1,
  current: 0,
};

function compareDatasetsByPriority(
  left: ImmifinDataset,
  right: ImmifinDataset,
  today: Date,
): number {
  const leftStatus = getDataFreshnessStatus(left, today);
  const rightStatus = getDataFreshnessStatus(right, today);
  const statusRank = STATUS_PRIORITY[rightStatus] - STATUS_PRIORITY[leftStatus];
  if (statusRank !== 0) {
    return statusRank;
  }

  const leftUrgency = left.urgency === "High" ? 1 : 0;
  const rightUrgency = right.urgency === "High" ? 1 : 0;
  return rightUrgency - leftUrgency;
}

/**
 * Authoritative Data Refresh Center presentation.
 * Uses existing `lib/data/dataFreshness` + `AdminDatasetRefreshButton`.
 */
export function AdminDataRefreshCenter({
  showHeading = true,
}: AdminDataRefreshCenterProps) {
  const today = new Date();
  const datasets = getImmifinDatasets(today);
  const centerAlert = getDataRefreshCenterAlert(datasets, today);
  const visaBulletin = datasets.find((dataset) => dataset.id === "visa-bulletin");
  const remainingDatasets = datasets
    .filter((dataset) => dataset.id !== "visa-bulletin")
    .slice()
    .sort((left, right) => compareDatasetsByPriority(left, right, today));
  const orderedDatasets = visaBulletin ? [visaBulletin, ...remainingDatasets] : remainingDatasets;

  return (
    <section className="ds2-drc">
      {showHeading ? (
        <div className="ds2-drc-legacy-heading">
          <h2>
            Data Refresh Center{" "}
            <DataRefreshTitleStatus message={centerAlert.message} status={centerAlert.status} />
          </h2>
          <p className="ds2-drc-lede">
            Refresh datasets from official sources to ensure accurate and reliable information for all users.
          </p>
        </div>
      ) : null}

      <div className="ds2-drc-grid">
        {orderedDatasets.map((dataset) => (
          <DatasetCard
            key={dataset.id}
            dataset={dataset}
            status={getDataFreshnessStatus(dataset, today)}
          />
        ))}
        <aside className="ds2-drc-future">
          <h3>Future versions</h3>
          <p>Future versions may add one-click import, upload validation, and email reminders.</p>
        </aside>
      </div>
    </section>
  );
}
