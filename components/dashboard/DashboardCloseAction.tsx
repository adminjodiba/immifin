"use client";

import Link from "next/link";

type DashboardCloseActionProps = {
  href?: string;
};

export function DashboardCloseAction({ href = "/" }: DashboardCloseActionProps) {
  return (
    <Link href={href} className="btn-secondary shrink-0">
      Close
    </Link>
  );
}
