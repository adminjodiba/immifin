"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ADMIN_DASHBOARD_NAV_LABEL,
  getAdminDashboardSection,
} from "@/lib/admin/admin-dashboard-nav";
import type {
  AdminFeedbackBulkResult,
  AdminFeedbackListItem,
  AdminFeedbackSort,
  AdminFeedbackStatusCounts,
  AdminFeedbackView,
  AdminFeedbackYearCount,
} from "@/lib/feedback/adminFeedbackReviewTypes";
import { AdminFeedbackConfirmModal } from "@/components/admin/AdminFeedbackConfirmModal";

const PAGE_SIZES = [25, 50, 100] as const;

const STATUS_CARDS: Array<{
  view: AdminFeedbackView;
  label: string;
  hint: string;
  icon: "clock" | "check" | "lock";
}> = [
  { view: "public", label: "Public Review", hint: "May be published", icon: "clock" },
  { view: "private", label: "Private Review", hint: "Not for public use", icon: "lock" },
  { view: "pool", label: "Feedback Pool", hint: "Live testimonials", icon: "check" },
];

function getDestructiveCopy(action: "reject" | "acknowledge" | "delete", count: number): {
  title: string;
  confirmLabel: string;
} {
  if (action === "reject") {
    if (count === 1) {
      return { title: "Reject and delete this feedback?", confirmLabel: "Reject & Delete" };
    }
    return {
      title: `Reject and delete ${count} selected feedback submissions?`,
      confirmLabel: `Reject ${count} & Delete`,
    };
  }

  if (action === "acknowledge") {
    if (count === 1) {
      return { title: "Acknowledge and delete this private feedback?", confirmLabel: "Acknowledge & Delete" };
    }
    return {
      title: `Acknowledge and delete ${count} selected private feedback submissions?`,
      confirmLabel: `Acknowledge ${count} & Delete`,
    };
  }

  if (count === 1) {
    return { title: "Permanently delete this published feedback from the site?", confirmLabel: "Delete" };
  }

  return {
    title: `Permanently delete ${count} selected testimonials from the Feedback Pool?`,
    confirmLabel: `Delete ${count}`,
  };
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatSubmitted(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="ds2-afrq-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < rating ? "is-on" : undefined} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

function StatusIcon({ icon }: { icon: (typeof STATUS_CARDS)[number]["icon"] }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8" };
  if (icon === "check") {
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12.2 2.3 2.3 4.7-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === "lock") {
    return (
      <svg {...common} aria-hidden="true">
        <rect x="6" y="11" width="12" height="9" rx="1.5" />
        <path d="M8.5 11V8.5a3.5 3.5 0 0 1 7 0V11" />
      </svg>
    );
  }
  return (
    <svg {...common} aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v5l3 1.8" strokeLinecap="round" />
    </svg>
  );
}

export function AdminFeedbackReviewQueue() {
  const section = getAdminDashboardSection("feedback");
  const [view, setView] = useState<AdminFeedbackView>("public");
  const [year, setYear] = useState<number | "all">("all");
  const [sort, setSort] = useState<AdminFeedbackSort>("newest");
  const [rating, setRating] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(25);
  const [counts, setCounts] = useState<AdminFeedbackStatusCounts | null>(null);
  const [years, setYears] = useState<AdminFeedbackYearCount[]>([]);
  const [items, setItems] = useState<AdminFeedbackListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"approve" | "reject" | "acknowledge" | "delete" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingDestructive, setPendingDestructive] = useState<{
    action: "reject" | "acknowledge" | "delete";
    ids: string[];
  } | null>(null);
  const [recordsRequested, setRecordsRequested] = useState(false);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(total, page * pageSize);

  const loadSummary = useCallback(async (): Promise<AdminFeedbackStatusCounts | null> => {
    const response = await fetch("/api/admin/feedback/summary");
    const payload = (await response.json()) as { success?: boolean; counts?: AdminFeedbackStatusCounts };
    if (response.ok && payload.counts) {
      setCounts(payload.counts);
      return payload.counts;
    }
    return null;
  }, []);

  const loadYears = useCallback(async (nextView: AdminFeedbackView) => {
    const response = await fetch(`/api/admin/feedback/years?view=${nextView}`);
    const payload = (await response.json()) as { success?: boolean; years?: AdminFeedbackYearCount[] };
    if (response.ok && payload.years) {
      setYears(payload.years);
    }
  }, []);

  const loadList = useCallback(
    async (options: {
      view: AdminFeedbackView;
      year: number | "all";
      page: number;
      pageSize: number;
      sort: AdminFeedbackSort;
      search: string;
      rating: string;
    }) => {
      setLoadingList(true);
      setActionError(null);
      const params = new URLSearchParams({
        view: options.view,
        year: String(options.year),
        page: String(options.page),
        pageSize: String(options.pageSize),
        sort: options.sort,
      });
      if (options.search) {
        params.set("search", options.search);
      }
      if (options.rating) {
        params.set("rating", options.rating);
      }

      const response = await fetch(`/api/admin/feedback?${params.toString()}`);
      const payload = (await response.json()) as {
        success?: boolean;
        items?: AdminFeedbackListItem[];
        total?: number;
      };

      setSelectedIds([]);

      if (!response.ok) {
        setItems([]);
        setTotal(0);
        setLoadingList(false);
        setActionError("Unable to load this feedback page.");
        return;
      }

      const nextItems = payload.items ?? [];
      setItems(nextItems);
      setTotal(payload.total ?? 0);
      setLoadingList(false);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const nextCounts = await loadSummary();
      if (cancelled) {
        return;
      }

      if (!nextCounts || nextCounts.public > 0) {
        setRecordsRequested(true);
        void loadYears("public");
        return;
      }

      setItems([]);
      setTotal(0);
      setYears([{ year: "all", count: 0 }]);
      setLoadingList(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [loadSummary, loadYears]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    if (!recordsRequested) {
      return;
    }
    void loadList({ view, year, page, pageSize, sort, search, rating });
  }, [recordsRequested, view, year, page, pageSize, sort, search, rating, loadList]);

  async function selectView(nextView: AdminFeedbackView) {
    if (nextView !== view) {
      setItems([]);
      setTotal(0);
      setSelectedIds([]);
      setYears([]);
    }
    setView(nextView);
    setYear("all");
    setPage(1);
    setRecordsRequested(true);
    await loadYears(nextView);
  }

  async function refreshAfterAction() {
    await Promise.all([
      loadSummary(),
      loadYears(view),
      loadList({ view, year, page, pageSize, sort, search, rating }),
    ]);
  }

  function requestDestructive(action: "reject" | "acknowledge" | "delete", ids: string[]) {
    if (ids.length === 0) {
      return;
    }
    setActionError(null);
    setPendingDestructive({ action, ids });
  }

  async function runAction(item: AdminFeedbackListItem, action: "approve" | "reject" | "acknowledge" | "delete") {
    if (action === "approve" && !item.canApprovePublicly) {
      setActionError("Only pending public feedback can be approved.");
      return;
    }
    if (action === "reject" && !item.canApprovePublicly) {
      setActionError("Only pending public feedback can be rejected.");
      return;
    }
    if (action === "acknowledge" && !item.canAcknowledge) {
      setActionError("Only pending private feedback can be acknowledged.");
      return;
    }
    if (action === "delete" && !item.canDelete) {
      setActionError("Only published pool feedback can be deleted.");
      return;
    }

    if (action === "approve") {
      await submitModeration([item.id], "approve");
      return;
    }

    requestDestructive(action, [item.id]);
  }

  async function submitModeration(ids: string[], action: "approve" | "reject" | "acknowledge" | "delete") {
    if (ids.length === 0) {
      return;
    }

    setBusyAction(action);
    setBusyId(ids.length === 1 ? ids[0] : null);
    setActionError(null);
    const response = await fetch("/api/admin/feedback/bulk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ids }),
    });
    const payload = (await response.json()) as AdminFeedbackBulkResult & { success?: boolean; error?: string };
    setBusyAction(null);
    setBusyId(null);
    setPendingDestructive(null);

    if (!response.ok || payload.success === false) {
      setActionError(payload.error || "Unable to update the selected feedback.");
      return;
    }

    const skipped = payload.skipped ?? 0;
    await refreshAfterAction();
    if (skipped > 0) {
      const verb = action === "approve" ? "updated" : "deleted";
      setActionError(
        `${formatCount(payload.successful ?? 0)} ${verb}, ${formatCount(skipped)} skipped because they were no longer eligible.`,
      );
    }
  }

  const showingLabel = useMemo(() => {
    const label = STATUS_CARDS.find((card) => card.view === view)?.label.toLowerCase() ?? "feedback";
    return `Showing ${formatCount(total)} ${label} · Sorted by ${sort === "newest" ? "newest first" : "oldest first"}`;
  }, [sort, total, view]);

  const selectedCount = selectedIds.length;
  const allPageSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));
  const somePageSelected = items.some((item) => selectedIds.includes(item.id));

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [allPageSelected, somePageSelected]);

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id];
      }
      return current.filter((value) => value !== id);
    });
  }

  function toggleCurrentPage(checked: boolean) {
    setSelectedIds(checked ? items.map((item) => item.id) : []);
  }

  return (
    <div className="ds2-admin-overview ds2-afrq">
      <nav className="ds2-admin-overview-breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li>My Immifin</li>
          <li>
            <span aria-hidden="true">/</span>
            {ADMIN_DASHBOARD_NAV_LABEL}
          </li>
          <li>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{section.label}</span>
          </li>
        </ol>
      </nav>

      <header className="ds2-admin-overview-header">
        <div>
          <h1 className="ds2-admin-overview-title">User Feedback – Review Queue</h1>
          <p className="ds2-admin-overview-description">
            Review public and private feedback, then keep only approved testimonials in the live pool.
          </p>
        </div>
        <button type="button" className="ds2-afrq-help-btn" onClick={() => setHelpOpen((open) => !open)}>
          How this works?
        </button>
      </header>

      {helpOpen ? (
        <aside className="ds2-afrq-help" role="note">
          <p>Public Review is feedback the user allowed us to publish. Approve sends it to the Feedback Pool. Reject permanently deletes it.</p>
          <p>Private Review is feedback the user asked to keep private. Acknowledge permanently deletes it. It never goes public.</p>
          <p>Feedback Pool is approved testimonials. Delete permanently removes a record from the pool. Public display will use a later rule-based selection, not a Publish checkbox.</p>
          <p>Select All applies only to the records on the current page, never the full database result.</p>
        </aside>
      ) : null}

      <section className="ds2-afrq-cards" aria-label="Feedback status">
        {STATUS_CARDS.map((card) => {
          const count = counts?.[card.view] ?? 0;
          return (
            <button
              key={card.view}
              type="button"
              className={`ds2-afrq-card ds2-afrq-card-${card.view}${view === card.view ? " is-active" : ""}`}
              onClick={() => void selectView(card.view)}
              aria-pressed={view === card.view}
            >
              <span className="ds2-afrq-card-icon">
                <StatusIcon icon={card.icon} />
              </span>
              <span className="ds2-afrq-card-copy">
                <span className="ds2-afrq-card-label">{card.label}</span>
                <strong>{formatCount(count)}</strong>
                <span className="ds2-afrq-card-hint">{card.hint}</span>
              </span>
            </button>
          );
        })}
      </section>

      <div className="ds2-afrq-yearbar" role="tablist" aria-label="Filter by year">
        <span>Filter by Year:</span>
        {years.map((entry) => {
          const value = entry.year;
          const selected = year === value;
          return (
            <button
              key={String(value)}
              type="button"
              role="tab"
              aria-selected={selected}
              className={selected ? "is-active" : undefined}
              onClick={() => {
                setYear(value);
                setPage(1);
              }}
            >
              {value === "all" ? "All Years" : value} ({formatCount(entry.count)})
            </button>
          );
        })}
      </div>

      <div className="ds2-afrq-workspace">
        <section className="ds2-afrq-table-card">
          <div className="ds2-afrq-toolbar">
            <label className="ds2-afrq-search">
              <span className="sr-only">Search</span>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name, email, or keywords..."
              />
            </label>
            <select
              value={rating}
              aria-label="Rating filter"
              onChange={(event) => {
                setRating(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} stars
                </option>
              ))}
            </select>
            <select
              value={sort}
              aria-label="Sort order"
              onChange={(event) => {
                setSort(event.target.value as AdminFeedbackSort);
                setPage(1);
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {selectedCount > 0 ? (
            <div className="ds2-afrq-bulkbar" aria-live="polite">
              <span>
                {formatCount(selectedCount)} selected
              </span>
              {view === "public" ? (
                <div className="ds2-afrq-row-actions">
                  <button
                    type="button"
                    className="ds2-afrq-reject"
                    onClick={() => requestDestructive("reject", selectedIds)}
                    disabled={busyAction !== null}
                  >
                    Reject Selected
                  </button>
                  <button
                    type="button"
                    className="ds2-afrq-approve"
                    onClick={() => void submitModeration(selectedIds, "approve")}
                    disabled={busyAction !== null}
                  >
                    {busyAction === "approve" ? "Approving…" : "Approve Selected"}
                  </button>
                </div>
              ) : null}
              {view === "private" ? (
                <div className="ds2-afrq-row-actions">
                  <button
                    type="button"
                    className="ds2-afrq-approve"
                    onClick={() => requestDestructive("acknowledge", selectedIds)}
                    disabled={busyAction !== null}
                  >
                    Acknowledge Selected
                  </button>
                </div>
              ) : null}
              {view === "pool" ? (
                <div className="ds2-afrq-row-actions">
                  <button
                    type="button"
                    className="ds2-afrq-reject"
                    onClick={() => requestDestructive("delete", selectedIds)}
                    disabled={busyAction !== null}
                  >
                    Delete Selected
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <p className="ds2-afrq-showing">{showingLabel}</p>
          {actionError ? <p className="ds2-afrq-error">{actionError}</p> : null}

          <div className="ds2-afrq-table-wrap">
            <table className="ds2-afrq-table">
              <thead>
                <tr>
                  <th className="ds2-afrq-select">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allPageSelected}
                      disabled={items.length === 0 || loadingList}
                      onChange={(event) => toggleCurrentPage(event.target.checked)}
                      aria-label="Select all feedback on this page"
                    />
                  </th>
                  <th>User</th>
                  <th>Feedback</th>
                  <th>Rating</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingList ? (
                  <tr>
                    <td colSpan={6}>Loading feedback…</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6}>{actionError ?? "No feedback in this queue."}</td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className={selectedIds.includes(item.id) ? "is-selected" : undefined}>
                      <td className="ds2-afrq-select">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={(event) => toggleRow(item.id, event.target.checked)}
                          aria-label={`Select feedback from ${item.displayName}`}
                        />
                      </td>
                      <td>
                        <strong>
                          {item.displayName}
                          {item.planTier ? <span className="ds2-afrq-plan-tier"> ({item.planTier})</span> : null}
                        </strong>
                        <span>{item.maskedEmail}</span>
                      </td>
                      <td className="ds2-afrq-feedback">{item.feedbackText}</td>
                      <td>
                        <Stars rating={item.rating} />
                      </td>
                      <td>{formatSubmitted(item.submittedAt)}</td>
                      <td>
                        <div className="ds2-afrq-row-actions">
                          {view === "public" ? (
                            <>
                              <button
                                type="button"
                                className="ds2-afrq-reject"
                                onClick={() => void runAction(item, "reject")}
                                disabled={!item.canApprovePublicly || busyId === item.id}
                              >
                                {busyId === item.id && busyAction === "reject" ? "Deleting…" : "Reject"}
                              </button>
                              <button
                                type="button"
                                className="ds2-afrq-approve"
                                onClick={() => void runAction(item, "approve")}
                                disabled={!item.canApprovePublicly || busyId === item.id}
                              >
                                {busyId === item.id && busyAction === "approve" ? "Approving…" : "Approve"}
                              </button>
                            </>
                          ) : null}
                          {view === "private" ? (
                            <button
                              type="button"
                              className="ds2-afrq-approve"
                              onClick={() => void runAction(item, "acknowledge")}
                              disabled={!item.canAcknowledge || busyId === item.id}
                            >
                              {busyId === item.id && busyAction === "acknowledge" ? "Deleting…" : "Acknowledge"}
                            </button>
                          ) : null}
                          {view === "pool" ? (
                            <button
                              type="button"
                              className="ds2-afrq-reject"
                              onClick={() => void runAction(item, "delete")}
                              disabled={!item.canDelete || busyId === item.id}
                            >
                              {busyId === item.id && busyAction === "delete" ? "Deleting…" : "Delete"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="ds2-afrq-pager">
            <label>
              Show
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value) as (typeof PAGE_SIZES)[number]);
                  setPage(1);
                }}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              per page
            </label>
            <p>
              {rangeStart}–{rangeEnd} of {formatCount(total)} feedback
            </p>
            <div>
              <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                ‹
              </button>
              <span>{page}</span>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              >
                ›
              </button>
            </div>
          </footer>
        </section>
      </div>

      <AdminFeedbackConfirmModal
        isOpen={pendingDestructive !== null}
        title={
          pendingDestructive
            ? getDestructiveCopy(pendingDestructive.action, pendingDestructive.ids.length).title
            : ""
        }
        confirmLabel={
          pendingDestructive
            ? getDestructiveCopy(pendingDestructive.action, pendingDestructive.ids.length).confirmLabel
            : "Delete"
        }
        isSubmitting={
          pendingDestructive !== null &&
          (busyAction === pendingDestructive.action || busyAction === "delete")
        }
        onCancel={() => {
          if (busyAction === null) {
            setPendingDestructive(null);
          }
        }}
        onConfirm={() => {
          if (!pendingDestructive) {
            return;
          }
          void submitModeration(pendingDestructive.ids, pendingDestructive.action);
        }}
      />
    </div>
  );
}
