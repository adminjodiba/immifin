import { Ds2PublicPageShell } from "@/components/ds2/Ds2PublicPageShell";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Privacy Policy",
  description: "Immifin privacy policy — how we collect, use, and protect your personal information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <Ds2PublicPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      description="Last updated: June 22, 2025"
      layout="reading"
    >
      <article className="ds2-public-prose">
        <h2>Information We Collect</h2>
        <p>
          We may collect information you provide directly, such as your name and email address when
          you contact us. We also collect standard usage data through analytics tools, including
          pages visited, browser type, and device information.
        </p>

        <h2>How We Use Your Information</h2>
        <p>
          We use collected information to operate and improve our website, respond to inquiries, and
          understand how visitors use our content. We do not sell your personal information to third
          parties.
        </p>

        <h2>Cookies</h2>
        <p>
          Our website may use cookies and similar technologies to enhance your browsing experience
          and analyze site traffic. You can control cookie preferences through your browser
          settings.
        </p>

        <h2>Third-Party Services</h2>
        <p>
          We may use third-party services for analytics and hosting. These providers have their own
          privacy policies governing how they handle data.
        </p>

        <h2>IMMIFIN Intelligence (controlled beta)</h2>
        <p>
          When you use IMMIFIN Intelligence, we may use your saved immigration profile and related
          account context to prepare an informational response to your question. IMMIFIN does not
          save chat history for this workspace in the application. Responses may be generated with
          the assistance of an external AI service configured by IMMIFIN. We do not claim zero
          retention by that provider beyond what is contractually and operationally configured. Do
          not submit information you are not comfortable sharing for processing.
        </p>
        <p className="ds2-public-prose-note">
          Status: proposed wording for controlled beta — pending Product Owner / legal approval
          before broader enablement.
        </p>

        <h2>Your Rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, or delete your
          personal data. Contact us at info@immifin.com to exercise these rights.
        </p>

        <h2>Contact</h2>
        <p>
          If you have questions about this privacy policy, please contact us at{" "}
          <a href="mailto:info@immifin.com">info@immifin.com</a>.
        </p>
      </article>
    </Ds2PublicPageShell>
  );
}
