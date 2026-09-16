import Link from "next/link";
import { ContactUsForm } from "@/components/contact/ContactUsForm";
import { contactConfig, formatOfficeLocation } from "@/lib/contact";
import { landingV3ContentGridClass } from "@/components/landing-v3/landingV3Layout";

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 6.8A2.8 2.8 0 0 1 7.8 4h8.4A2.8 2.8 0 0 1 19 6.8v6.2a2.8 2.8 0 0 1-2.8 2.8H11l-4.2 3.1V15.8H7.8A2.8 2.8 0 0 1 5 13Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.6 19 6.2v5.2c0 4.1-2.8 7.5-7 8.8-4.2-1.3-7-4.7-7-8.8V6.2L12 3.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9.2 11.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Zm6.4-.4a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4ZM4.6 18.4c.5-2.6 2.6-4.2 4.6-4.2s4.1 1.6 4.6 4.2M14.4 14.6c1.8.2 3.4 1.5 3.8 3.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ContactUsBody() {
  return (
    <div className={`${landingV3ContentGridClass} ds2-contact-body`}>
      <div className="ds2-contact-body-grid">
        <section className="ds2-contact-form-col" aria-labelledby="contact-form-heading">
          <span className="ds2-section-header-accent" aria-hidden="true" />
          <h2 id="contact-form-heading" className="ds2-contact-form-title">
            How can we help?
          </h2>
          <p className="ds2-contact-form-lede">
            Send us a message and we&apos;ll get back to you as soon as possible.
          </p>
          <ContactUsForm />
        </section>

        <aside className="ds2-contact-support" aria-labelledby="contact-support-heading">
          <p className="ds2-contact-support-eyebrow">We&apos;re here for you</p>
          <p className="ds2-contact-support-script" aria-hidden="true">
            Real people.
            <br />
            Real support.
            <span className="ds2-billing-page-quote-mark" />
          </p>
          <h2 id="contact-support-heading" className="ds2-contact-support-title">
            Supporting your
            <br />
            immigration journey
          </h2>
          <p className="ds2-contact-support-copy">
            Have a question about your profile, subscription, a tool, or just need guidance? Our
            team is here to help.
          </p>

          <ul className="ds2-contact-support-points">
            <li>
              <span className="ds2-contact-support-icon is-chat">
                <ChatIcon />
              </span>
              <div>
                <h3>Fast Response</h3>
                <p>We typically respond within 1–2 business days.</p>
              </div>
            </li>
            <li>
              <span className="ds2-contact-support-icon is-secure">
                <ShieldIcon />
              </span>
              <div>
                <h3>Your Information Is Secure</h3>
                <p>
                  We take your privacy seriously. Information submitted through this form is handled
                  in accordance with our{" "}
                  <Link href="/privacy">Privacy Policy</Link>.
                </p>
              </div>
            </li>
            <li>
              <span className="ds2-contact-support-icon is-team">
                <PeopleIcon />
              </span>
              <div>
                <h3>Right Team, Faster Help</h3>
                <p>Your message will be routed to the appropriate IMMIFIN team automatically.</p>
              </div>
            </li>
          </ul>

          <p className="ds2-contact-support-footer-script" aria-hidden="true">
            Same journey.
            <br />
            Brighter possibilities.
          </p>
          <p className="ds2-contact-support-office">
            {formatOfficeLocation()}
            <span> · {contactConfig.officeCountry}</span>
          </p>
        </aside>
      </div>
    </div>
  );
}
