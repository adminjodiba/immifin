import { ContactOfficeCard, ContactUsForm } from "@/components/contact/ContactUsForm";
import { Ds2PublicPageShell } from "@/components/ds2/Ds2PublicPageShell";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Contact Us",
  description:
    "Contact the IMMIFIN team for support, feature requests, bug reports and partnership opportunities.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <Ds2PublicPageShell
      eyebrow="IMMIFIN"
      title="Contact Us"
      description="We're here to help. Choose the reason for contacting us and provide the details below. The IMMIFIN team will route your message to the appropriate team."
    >
      <section className="mx-auto w-full max-w-3xl" aria-labelledby="contact-form-heading">
        <h2 id="contact-form-heading" className="sr-only">
          Contact form
        </h2>
        <div className="grid gap-4">
          <ContactUsForm />
          <ContactOfficeCard />
        </div>
      </section>
    </Ds2PublicPageShell>
  );
}
