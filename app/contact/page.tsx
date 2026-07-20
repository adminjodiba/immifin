import { PageHeader } from "@/components/PageHeader";
import { ContactOfficeCard, ContactUsForm } from "@/components/contact/ContactUsForm";
import { WorkspaceSection } from "@/components/layout/WorkspaceSection";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Contact Us",
  description:
    "Contact the IMMIFIN team for support, feature requests, bug reports and partnership opportunities.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <PageHeader
      title="Contact Us"
      description="We're here to help. Choose the reason for contacting us and provide the details below. The IMMIFIN team will route your message to the appropriate team."
    >
      <WorkspaceSection aria-labelledby="contact-form-heading">
        <div className="mx-auto grid max-w-3xl gap-4">
          <h2 id="contact-form-heading" className="sr-only">
            Contact form
          </h2>
          <ContactUsForm />
          <ContactOfficeCard />
        </div>
      </WorkspaceSection>
    </PageHeader>
  );
}
