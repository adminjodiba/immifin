import { PageHeader } from "@/components/PageHeader";
import { WorkspaceSection } from "@/components/layout/WorkspaceSection";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Terms of Service",
  description: "Immifin terms of service — the rules and guidelines for using our website and tools.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <PageHeader
      title="Terms of Service"
      description="Last updated: June 22, 2025"
    >
      <WorkspaceSection>
        <div className="card-static space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Acceptance of Terms</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              By accessing and using Immifin, you agree to be bound by these Terms of Service. If
              you do not agree, please do not use our website.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Educational Purpose</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Immifin provides general information about immigration and finance topics. Our content
              and calculators are for educational purposes only and do not constitute legal, tax,
              or financial advice. Always consult qualified professionals for your specific
              situation.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Accuracy of Information</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              While we strive to keep our content accurate and up to date, immigration laws and
              financial regulations change frequently. We make no warranties about the completeness
              or accuracy of any information on this site.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Intellectual Property</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              All content on Immifin, including text, graphics, and logos, is owned by Immifin and
              protected by applicable intellectual property laws. You may not reproduce or distribute
              our content without permission.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Limitation of Liability</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Immifin shall not be liable for any damages arising from your use of this website or
              reliance on its content. Use of our calculators and guides is at your own risk.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Changes to Terms</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              We may update these terms at any time. Continued use of the website after changes
              constitutes acceptance of the updated terms.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Contact</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Questions about these terms? Reach us at{" "}
              <a href="mailto:hello@immifin.com" className="text-brand-700 hover:text-brand-800">
                hello@immifin.com
              </a>
              .
            </p>
          </div>
        </div>
      </WorkspaceSection>
    </PageHeader>
  );
}
