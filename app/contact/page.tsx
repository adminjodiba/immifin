import { PageHeader } from "@/components/PageHeader";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Contact",
  description: "Get in touch with the Immifin team. We'd love to hear your questions and feedback.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHeader
        breadcrumb="Contact"
        title="Contact Us"
        description="Have a question, suggestion, or partnership inquiry? We'd love to hear from you."
      />

      <section className="section-padding">
        <div className="container-main">
          <div className="mx-auto grid max-w-4xl gap-12 lg:grid-cols-2">
            <div>
              <h2 className="heading-2">Get in Touch</h2>
              <p className="mt-4 text-lead">
                Whether you have feedback on our guides, a question about immigration or finance,
                or a media inquiry — our team is here to help.
              </p>

              <dl className="mt-8 space-y-6">
                <div>
                  <dt className="text-sm font-semibold text-slate-900">Email</dt>
                  <dd className="mt-1">
                    <a
                      href="mailto:hello@immifin.com"
                      className="text-brand-700 hover:text-brand-800"
                    >
                      hello@immifin.com
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-slate-900">Response Time</dt>
                  <dd className="mt-1 text-slate-600">We typically respond within 1–2 business days.</dd>
                </div>
              </dl>
            </div>

            <form className="card space-y-6" action="#" method="post">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-900">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="mt-2 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-900">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="mt-2 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-900">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  className="mt-2 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option>General Inquiry</option>
                  <option>Content Feedback</option>
                  <option>Partnership</option>
                  <option>Media</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-900">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="mt-2 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="How can we help?"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
