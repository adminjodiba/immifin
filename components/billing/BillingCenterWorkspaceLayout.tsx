"use client";

import type { ReactNode } from "react";
import { Ds2MyImmifinWorkspaceNav } from "@/components/ds2/Ds2MyImmifinWorkspaceNav";
import { landingV3ContentGridClass } from "@/components/landing-v3/landingV3Layout";

type BillingCenterWorkspaceLayoutProps = {
  children: ReactNode;
};

export function BillingCenterWorkspaceLayout({ children }: BillingCenterWorkspaceLayoutProps) {
  return (
    <div className="ds2-workspace-page">
      <div className={`${landingV3ContentGridClass} ds2-workspace-page-inner ds2-billing-page-inner`}>
        <div className="ds2-billing-workspace">
          <Ds2MyImmifinWorkspaceNav active="billing" />
          <div className="ds2-billing-workspace-main">
            <nav className="ds2-billing-breadcrumb" aria-label="Breadcrumb">
              <ol>
                <li>My Immifin</li>
                <li>
                  <span aria-hidden="true">&gt;</span>
                  Plan &amp; Billing
                </li>
                <li>
                  <span aria-hidden="true">&gt;</span>
                  <span aria-current="page">Billing Center</span>
                </li>
              </ol>
            </nav>
            <header className="ds2-billing-page-header">
              <div className="ds2-billing-page-header-copy">
                <h1 className="ds2-billing-page-title">Billing &amp; Plan</h1>
                <p className="ds2-billing-page-description">
                  Manage your IMMIFIN plan, billing details, and subscription settings.
                </p>
              </div>
              <p className="ds2-billing-page-quote">
                Greater clarity today. A brighter tomorrow.
                <span className="ds2-billing-page-quote-mark" aria-hidden="true" />
              </p>
            </header>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
