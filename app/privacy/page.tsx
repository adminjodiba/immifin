import { PageHeader } from "@/components/PageHeader";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Privacy Policy",
  description: "Immifin privacy policy — how we collect, use, and protect your personal information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        breadcrumb="Privacy Policy"
        title="Privacy Policy"
        description="Last updated: June 22, 2025"
      />

      <section className="section-padding">
        <div className="container-main">
          <div className="card-static mx-auto max-w-3xl space-y-8">
            <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Information We Collect</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              We may collect information you provide directly, such as your name and email address
              when you contact us. We also collect standard usage data through analytics tools,
              including pages visited, browser type, and device information.
            </p>
            </div>

            <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">How We Use Your Information</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              We use collected information to operate and improve our website, respond to
              inquiries, and understand how visitors use our content. We do not sell your personal
              information to third parties.
            </p>
            </div>

            <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Cookies</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Our website may use cookies and similar technologies to enhance your browsing
              experience and analyze site traffic. You can control cookie preferences through your
              browser settings.
            </p>
            </div>

            <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Third-Party Services</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              We may use third-party services for analytics and hosting. These providers have their
              own privacy policies governing how they handle data.
            </p>
            </div>

            <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Your Rights</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Depending on your location, you may have rights to access, correct, or delete your
              personal data. Contact us at hello@immifin.com to exercise these rights.
            </p>
            </div>

            <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Contact</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              If you have questions about this privacy policy, please contact us at{" "}
              <a href="mailto:hello@immifin.com" className="text-brand-700 hover:text-brand-800">
                hello@immifin.com
              </a>
              .
            </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
