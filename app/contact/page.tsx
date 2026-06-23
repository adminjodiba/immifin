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
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="card-static">
              <h2 className="heading-2">Get in Touch</h2>
              <p className="mt-4 text-lead">
                Whether you have feedback on our guides, a question about immigration or finance,
                or a media inquiry — our team is here to help.
              </p>

              <dl className="mt-8 space-y-6">
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</dt>
                  <dd className="mt-1">
                    <a
                      href="mailto:hello@immifin.com"
                      className="text-base font-medium text-brand-700 hover:text-brand-800"
                    >
                      hello@immifin.com
                    </a>
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Response Time
                  </dt>
                  <dd className="mt-1 text-sm text-slate-600">
                    We typically respond within 1–2 business days.
                  </dd>
                </div>
              </dl>
            </div>

            <form className="card-static space-y-5" action="#" method="post">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-900">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="input-field"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-slate-900">
                  Subject
                </label>
                <select id="subject" name="subject" className="input-field">
                  <option>General Inquiry</option>
                  <option>Content Feedback</option>
                  <option>Partnership</option>
                  <option>Media</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-slate-900">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="input-field resize-none"
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
