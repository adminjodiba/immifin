import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

type Ds2AuthPageShellProps = {
  children: ReactNode;
  description?: string;
  promise?: string;
};

/**
 * Canonical Design System 2.0 authentication page frame.
 * Lightweight brand + centered Clerk region. No session, redirect, or entitlement logic.
 */
export function Ds2AuthPageShell({ children, description, promise }: Ds2AuthPageShellProps) {
  return (
    <div className="ds2-auth-page">
      <div className="ds2-auth-page-inner">
        <header className="ds2-auth-brand">
          <Logo href="/" size="sm" iconTone="navy" />
        </header>
        {description ? <p className="ds2-auth-description">{description}</p> : null}
        {promise ? <p className="ds2-auth-promise">{promise}</p> : null}
        <div className="ds2-auth-form">{children}</div>
        <p className="ds2-auth-legal">
          <Link href="/privacy">Privacy</Link>
          <span aria-hidden="true"> · </span>
          <Link href="/terms">Terms</Link>
        </p>
      </div>
    </div>
  );
}
