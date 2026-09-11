import { Ds2PublicPageShell } from "@/components/ds2/Ds2PublicPageShell";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Terms of Service",
  description: "Immifin terms of service — the rules and guidelines for using our website and tools.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <Ds2PublicPageShell
      eyebrow="Legal"
      title="Terms of Service"
      description="Last updated: June 22, 2025"
      layout="reading"
    >
      <article className="ds2-public-prose">
        <h2>Acceptance of Terms</h2>
        <p>
          By accessing and using Immifin, you agree to be bound by these Terms of Service. If you
          do not agree, please do not use our website.
        </p>

        <h2>Educational Purpose</h2>
        <p>
          Immifin provides general information about immigration and finance topics. Our content and
          calculators are for educational purposes only and do not constitute legal, tax, or
          financial advice. Always consult qualified professionals for your specific situation.
        </p>

        <h2>Accuracy of Information</h2>
        <p>
          While we strive to keep our content accurate and up to date, immigration laws and
          financial regulations change frequently. We make no warranties about the completeness or
          accuracy of any information on this site.
        </p>

        <h2>IMMIFIN Intelligence</h2>
        <p>
          IMMIFIN Intelligence provides informational explanations only. It does not provide legal
          advice, determine immigration eligibility, predict outcomes, create an attorney-client
          relationship, or guarantee any immigration result. Outputs may be incomplete or incorrect.
          Verify important decisions with official sources or a qualified professional. Access may
          be limited to an invite-only controlled beta.
        </p>
        <p className="ds2-public-prose-note">
          Status: proposed wording for controlled beta — pending Product Owner / legal approval
          before broader enablement.
        </p>

        <h2>Intellectual Property</h2>
        <p>
          All content on Immifin, including text, graphics, and logos, is owned by Immifin and
          protected by applicable intellectual property laws. You may not reproduce or distribute
          our content without permission.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          Immifin shall not be liable for any damages arising from your use of this website or
          reliance on its content. Use of our calculators and guides is at your own risk.
        </p>

        <h2>Changes to Terms</h2>
        <p>
          We may update these terms at any time. Continued use of the website after changes
          constitutes acceptance of the updated terms.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms? Reach us at{" "}
          <a href="mailto:info@immifin.com">info@immifin.com</a>.
        </p>
      </article>
    </Ds2PublicPageShell>
  );
}
