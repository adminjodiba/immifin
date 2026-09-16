import Link from "next/link";
import {
  getScheduledChangePresentation,
  isEntitlementWithoutStripeBilling,
  type BillingCenterAction,
  type BillingSummary,
} from "@/lib/billing/billing-center";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

const CONTACT_SUPPORT_HREF = "/contact#contact-form-heading";

const PREVIEW_HISTORY_ROWS = [
  { date: "Sample", description: "Sample plan", amount: "$—.——", status: "Paid" },
  { date: "Sample", description: "Sample plan", amount: "$—.——", status: "Paid" },
  { date: "Sample", description: "Sample plan", amount: "$—.——", status: "Paid" },
  { date: "Sample", description: "Sample plan", amount: "$—.——", status: "Paid" },
] as const;

const PREVIEW_ACTIONS = [
  {
    kind: "upgrade" as const,
    title: "Change Plan",
    text: "Upgrade to Power or switch plans",
  },
  {
    kind: "interval_change" as const,
    title: "Change Billing Interval",
    text: "Switch between monthly or annual billing",
  },
  {
    kind: "cancel" as const,
    title: "Cancel Subscription",
    text: "End your subscription",
  },
] as const;

function ActionIcon({ kind }: { kind: BillingCenterAction["kind"] }) {
  if (kind === "interval_change") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="4.5" y="5.5" width="15" height="14" rx="2" />
        <path d="M8 4v3M16 4v3M4.5 10h15" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "cancel") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="12" r="7.5" />
        <path d="M8.6 12h6.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 19V6.5M7.5 11 12 6.5 16.5 11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SubscriptionActionButton({
  action,
  disabled,
  onSelect,
}: {
  action: BillingCenterAction;
  disabled: boolean;
  onSelect: (action: BillingCenterAction) => void;
}) {
  return (
    <button
      type="button"
      className={`ds2-billing-mgmt-action ds2-billing-mgmt-action-${action.kind}`}
      disabled={disabled}
      onClick={() => onSelect(action)}
    >
      <span className="ds2-billing-mgmt-action-icon" aria-hidden="true">
        <ActionIcon kind={action.kind} />
      </span>
      <span className="ds2-billing-mgmt-action-copy">
        <span className="ds2-billing-mgmt-action-title">{action.label}</span>
        <span className="ds2-billing-mgmt-action-text">{action.description}</span>
      </span>
      <span className="ds2-billing-mgmt-action-chevron" aria-hidden="true">
        ›
      </span>
    </button>
  );
}

function HistoryDocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M7 3.75h7.2L18.5 8v12.25H7V3.75Z" strokeLinejoin="round" />
      <path d="M14.1 3.75V8h4.4" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="4.5" y="5.5" width="15" height="14" rx="2" />
      <path d="M8 4v3M16 4v3M4.5 10h15" strokeLinecap="round" />
    </svg>
  );
}

function ManagementHeader() {
  return (
    <header className="ds2-billing-management-header">
      <div className="ds2-billing-management-header-copy">
        <h2 id="billing-management-heading" className="ds2-billing-section-title">
          Billing Management
        </h2>
        <p className="ds2-billing-section-copy">
          View your billing history and manage your subscription.
        </p>
      </div>
      <p className="ds2-billing-management-help">
        Need help?{" "}
        <Link href={CONTACT_SUPPORT_HREF} className="ds2-billing-management-help-link">
          Contact Support <span aria-hidden="true">→</span>
        </Link>
      </p>
    </header>
  );
}

function FreeBillingManagementPreview() {
  return (
    <div className="ds2-billing-mgmt-preview" aria-hidden="true">
      <p className="ds2-billing-mgmt-preview-banner">PRO AND POWER USER ONLY</p>
      <div className="ds2-billing-management-grid">
        <section className="ds2-billing-management-panel ds2-billing-history-panel">
          <div className="ds2-billing-history-panel-head">
            <h3 className="ds2-billing-management-panel-title">Recent Billing History</h3>
            <span className="ds2-billing-history-view-all">View all →</span>
          </div>
          <table className="ds2-billing-history-preview-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {PREVIEW_HISTORY_ROWS.map((row, index) => (
                <tr key={`${row.description}-${index}`}>
                  <td>{row.date}</td>
                  <td>{row.description}</td>
                  <td>{row.amount}</td>
                  <td>
                    <span className="ds2-billing-history-preview-status">{row.status}</span>
                  </td>
                  <td>View</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="ds2-billing-management-actions-column">
          <section className="ds2-billing-management-panel ds2-billing-actions-panel">
            <h3 className="ds2-billing-management-panel-title">Subscription Actions</h3>
            <div className="ds2-billing-mgmt-action-list">
              {PREVIEW_ACTIONS.map((action) => (
                <div
                  key={action.title}
                  className={`ds2-billing-mgmt-action ds2-billing-mgmt-action-${action.kind}`}
                >
                  <span className="ds2-billing-mgmt-action-icon">
                    <ActionIcon kind={action.kind} />
                  </span>
                  <span className="ds2-billing-mgmt-action-copy">
                    <span className="ds2-billing-mgmt-action-title">{action.title}</span>
                    <span className="ds2-billing-mgmt-action-text">{action.text}</span>
                  </span>
                  <span className="ds2-billing-mgmt-action-chevron">›</span>
                </div>
              ))}
            </div>
          </section>

          <aside className="ds2-billing-scheduled-card ds2-billing-scheduled-card-preview">
            <h3 className="ds2-billing-scheduled-title">
              <span className="ds2-billing-scheduled-led" />
              Scheduled Changes
            </h3>
            <p className="ds2-billing-scheduled-destination">Example plan change</p>
            <p className="ds2-billing-scheduled-effective">Effective date</p>
            <p className="ds2-billing-scheduled-copy">Current plan access continues until then.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function BillingManagement({
  tier,
  billing,
  actions,
  actionBusy,
  isSubmitting,
  onSelectAction,
  onKeepSubscription,
}: {
  tier: SubscriptionTier;
  billing: BillingSummary;
  actions: BillingCenterAction[];
  actionBusy: boolean;
  isSubmitting: boolean;
  onSelectAction: (action: BillingCenterAction) => void;
  onKeepSubscription: () => void;
}) {
  if (tier === "free") {
    return (
      <section className="ds2-billing-management" aria-labelledby="billing-management-heading">
        <p className="sr-only">
          Billing Management tools are available on the Pro and Power plans.
        </p>
        <ManagementHeader />
        <FreeBillingManagementPreview />
      </section>
    );
  }

  const simulatedPaid = isEntitlementWithoutStripeBilling(tier, billing);

  if (simulatedPaid) {
    return (
      <section className="ds2-billing-management" aria-labelledby="billing-management-heading">
        <ManagementHeader />
        <div className="ds2-billing-management-grid">
          <section
            className="ds2-billing-management-panel ds2-billing-history-panel"
            aria-labelledby="billing-history-heading"
          >
            <div className="ds2-billing-history-panel-head">
              <h3 id="billing-history-heading" className="ds2-billing-management-panel-title">
                Recent Billing History
              </h3>
              <span className="ds2-billing-history-view-all">View all →</span>
            </div>
            <div className="ds2-billing-history-dev-empty">
              <span className="ds2-billing-history-dev-empty-icon">
                <HistoryDocumentIcon />
              </span>
              <p className="ds2-billing-history-dev-empty-title">
                No History because special user on dev mode
              </p>
              <p className="ds2-billing-history-dev-empty-copy">
                You are currently using a development override account.
              </p>
              <p className="ds2-billing-history-dev-empty-copy">
                Billing history is not available for special users on dev mode.
              </p>
            </div>
          </section>

          <div className="ds2-billing-management-actions-column">
            <section
              className="ds2-billing-management-panel ds2-billing-actions-panel"
              aria-labelledby="subscription-actions-heading"
            >
              <h3 id="subscription-actions-heading" className="ds2-billing-management-panel-title">
                Subscription Actions
              </h3>
              <div className="ds2-billing-mgmt-action-list">
                {PREVIEW_ACTIONS.map((action) => (
                  <button
                    key={action.title}
                    type="button"
                    className={`ds2-billing-mgmt-action ds2-billing-mgmt-action-${action.kind} ds2-billing-mgmt-action-static`}
                    disabled
                  >
                    <span className="ds2-billing-mgmt-action-icon" aria-hidden="true">
                      <ActionIcon kind={action.kind} />
                    </span>
                    <span className="ds2-billing-mgmt-action-copy">
                      <span className="ds2-billing-mgmt-action-title">{action.title}</span>
                      <span className="ds2-billing-mgmt-action-text">{action.text}</span>
                    </span>
                    <span className="ds2-billing-mgmt-action-chevron" aria-hidden="true">
                      ›
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <aside
              className="ds2-billing-scheduled-card ds2-billing-scheduled-card-neutral"
              aria-labelledby="scheduled-change-heading"
            >
              <h3 id="scheduled-change-heading" className="ds2-billing-scheduled-title">
                <span className="ds2-billing-scheduled-neutral-icon" aria-hidden="true">
                  <CalendarIcon />
                </span>
                Scheduled Changes
              </h3>
              <p className="ds2-billing-scheduled-destination">No scheduled changes</p>
              <p className="ds2-billing-scheduled-copy">
                You don&apos;t have any scheduled plan changes at this time.
              </p>
            </aside>
          </div>
        </div>
      </section>
    );
  }

  const scheduled = getScheduledChangePresentation(billing, tier);
  const planChanges = actions.filter(
    (action) => action.kind === "upgrade" || action.kind === "downgrade" || action.kind === "checkout",
  );
  const intervalChanges = actions.filter((action) => action.kind === "interval_change");
  const cancelActions = actions.filter((action) => action.kind === "cancel");
  const hasActions = actions.length > 0;

  return (
    <section className="ds2-billing-management" aria-labelledby="billing-management-heading">
      <ManagementHeader />

      <div className="ds2-billing-management-grid">
        <section
          className="ds2-billing-management-panel ds2-billing-history-panel"
          aria-labelledby="billing-history-heading"
        >
          <h3 id="billing-history-heading" className="ds2-billing-management-panel-title">
            Recent Billing History
          </h3>
          <p className="ds2-billing-history-empty">
            Invoice history is not available in Billing Center yet. Contact Support if you need a
            receipt.
          </p>
        </section>

        <div className="ds2-billing-management-actions-column">
          <section
            className="ds2-billing-management-panel ds2-billing-actions-panel"
            aria-labelledby="subscription-actions-heading"
          >
            <h3 id="subscription-actions-heading" className="ds2-billing-management-panel-title">
              Subscription Actions
            </h3>
            {hasActions ? (
              <div className="ds2-billing-mgmt-action-list">
                {planChanges.map((action) => (
                  <SubscriptionActionButton
                    key={action.id}
                    action={action}
                    disabled={actionBusy}
                    onSelect={onSelectAction}
                  />
                ))}
                {intervalChanges.map((action) => (
                  <SubscriptionActionButton
                    key={action.id}
                    action={action}
                    disabled={actionBusy}
                    onSelect={onSelectAction}
                  />
                ))}
                {cancelActions.map((action) => (
                  <SubscriptionActionButton
                    key={action.id}
                    action={action}
                    disabled={actionBusy}
                    onSelect={onSelectAction}
                  />
                ))}
              </div>
            ) : (
              <p className="ds2-billing-history-empty">
                No subscription changes are available right now.
              </p>
            )}
          </section>

          {scheduled ? (
            <aside className="ds2-billing-scheduled-card" aria-labelledby="scheduled-change-heading">
              <h3 id="scheduled-change-heading" className="ds2-billing-scheduled-title">
                <span className="ds2-billing-scheduled-led" aria-hidden="true" />
                Scheduled Change
              </h3>
              <p className="ds2-billing-scheduled-destination">{scheduled.destinationLabel}</p>
              {scheduled.effectiveLabel ? (
                <p className="ds2-billing-scheduled-effective">Effective {scheduled.effectiveLabel}</p>
              ) : (
                <p className="ds2-billing-scheduled-effective">Effective at period end</p>
              )}
              <p className="ds2-billing-scheduled-copy">{scheduled.continuesCopy}</p>
              {scheduled.canKeepSubscription ? (
                <button
                  type="button"
                  className="ds2-billing-scheduled-keep"
                  disabled={actionBusy}
                  onClick={onKeepSubscription}
                >
                  {isSubmitting ? "Working…" : "Keep My Subscription"}
                </button>
              ) : null}
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  );
}
