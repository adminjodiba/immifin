"use client";

import Link from "next/link";

const DASHBOARD_CLOSE_HREF = "/";

export function DashboardCloseAction() {
  return (
    <Link href={DASHBOARD_CLOSE_HREF} className="btn-secondary shrink-0">
      Close
    </Link>
  );
}
