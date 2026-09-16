import Image from "next/image";
import Link from "next/link";
import { landingV3ContentGridClass } from "@/components/landing-v3/landingV3Layout";

const HERO_IMAGE = "/images/immifin-about-hero-photo-v6.png";
const COMMITMENT_IMAGE = "/images/immifin-about-commitment-ds2.png";

const VALUES = [
  {
    title: "Clarity",
    description:
      "We translate complex immigration and finance topics into clear, actionable guidance.",
  },
  {
    title: "Accuracy",
    description:
      "Our content is researched and updated to reflect current policies and best practices.",
  },
  {
    title: "Accessibility",
    description:
      "Everyone deserves access to quality information, regardless of their background.",
  },
] as const;

const JOURNEY = [
  { id: "arrive", title: "Arrive", description: "Understand your options" },
  { id: "apply", title: "Apply", description: "Navigate the process" },
  { id: "build", title: "Build", description: "Create financial stability" },
  { id: "grow", title: "Grow", description: "Plan for what's next" },
  { id: "belong", title: "Belong", description: "Build the life you envision" },
] as const;

const PILLARS = [
  {
    id: "immigration",
    href: "/immigration",
    name: "Immigration",
    background: "linear-gradient(145deg, #2f6fe0 0%, #1d4ed8 38%, #0b1b3a 100%)",
    description: (
      <>
        Trusted guidance for
        <br />
        your next step.
      </>
    ),
  },
  {
    id: "finance",
    href: "/finance",
    name: "Finance",
    background: "linear-gradient(145deg, #8b5cf6 0%, #6d28d9 42%, #3b0764 100%)",
    description: (
      <>
        Tools to help you
        <br />
        build financial confidence.
      </>
    ),
  },
  {
    id: "life",
    href: "/life",
    name: "Life",
    background: "linear-gradient(145deg, #f5c451 0%, #d97706 44%, #78350f 100%)",
    description: (
      <>
        Practical resources for
        <br />
        a brighter tomorrow.
      </>
    ),
  },
] as const;

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {name === "plane" ? (
        <path
          d="M3.4 16.2 20.8 10.8l-1.1-2-6.5 1.4L8.3 4.1 6.5 4.8l2.3 5.3-4.5 1.1-1.5-1.4-1.3.6 1.9 5.8Z"
          fill="currentColor"
        />
      ) : null}
      {name === "doc" ? (
        <>
          <rect x="6" y="3.4" width="12" height="17.2" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9 8.8h6M9 12.2h6M9 15.6h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : null}
      {name === "briefcase" ? (
        <path
          d="M8 8.1V6.4A2.3 2.3 0 0 1 10.3 4.1h3.4A2.3 2.3 0 0 1 16 6.4v1.7h2.3A1.7 1.7 0 0 1 20 9.8v8.3H4V9.8A1.7 1.7 0 0 1 5.7 8.1H8Zm2 0h4V6.5h-4v1.6Z"
          fill="currentColor"
        />
      ) : null}
      {name === "chart" ? (
        <path
          d="M4.2 18.2h15.6M7 16.2V11M11.4 16.2V8.2M15.8 16.2V10.2M19.4 16.2V6.6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      ) : null}
      {name === "home" ? (
        <path
          d="M4.7 11.3 12 5.2l7.3 6.1V19a1.2 1.2 0 0 1-1.2 1.2H5.9A1.2 1.2 0 0 1 4.7 19v-7.7Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      ) : null}
      {name === "passport" ? (
        <>
          <rect x="6.2" y="3.5" width="11.6" height="17" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="10.2" r="2.4" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8.4 16.4h7.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </>
      ) : null}
      {name === "sun" ? (
        <>
          <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M12 4.2v2M12 17.8v2M4.2 12h2M17.8 12h2M6.4 6.4l1.4 1.4M16.2 16.2l1.4 1.4M17.6 6.4l-1.4 1.4M7.8 16.2l-1.4 1.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {name === "star" ? (
        <path
          d="M12 3.6 13.7 8.8 19.3 9.2 15.1 12.7 16.5 18.1 12 15.4 7.5 18.1 8.9 12.7 4.7 9.2 10.3 8.8 12 3.6Z"
          fill="currentColor"
        />
      ) : null}
      {name === "shield" ? (
        <path
          d="M12 3.6 18.4 6v5.2c0 3.9-2.8 7.2-6.4 8.5-3.6-1.3-6.4-4.6-6.4-8.5V6L12 3.6Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      ) : null}
      {name === "person" ? (
        <path
          d="M12 8.1a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Zm-6.6 4.1h13.2M8.3 12.2 7 20.1M15.7 12.2 17 20.1M9.1 15.4h5.8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
}

const JOURNEY_ICONS = {
  arrive: "plane",
  apply: "doc",
  build: "briefcase",
  grow: "chart",
  belong: "home",
} as const;

const VALUE_ICONS = {
  Clarity: "star",
  Accuracy: "shield",
  Accessibility: "person",
} as const;

export function AboutImmifinPage() {
  return (
    <div className="ds2-about-page">
      <section className="ds2-about-hero" aria-labelledby="about-immifin-heading">
        <div className="ds2-about-hero-fill" aria-hidden="true" />
        <div className="ds2-about-hero-photo" aria-hidden="true">
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="ds2-about-hero-photo-image"
          />
        </div>
        <div className="ds2-about-hero-inner">
            <div className={`${landingV3ContentGridClass} ds2-about-hero-copy-slot`}>
              <div className="ds2-about-hero-copy">
                <p className="ds2-about-eyebrow">About IMMIFIN</p>
                <h1 id="about-immifin-heading" className="ds2-about-hero-title">
                  A clearer path for your life in America.
                </h1>
                <p className="ds2-about-hero-description">
                  <span className="ds2-about-hero-description-lead">
                    Making life in America easier for immigrants — with the right tools and
                    information
                  </span>
                  <span className="ds2-about-hero-description-rest">
                    to make confident decisions.
                  </span>
                </p>
              </div>
            </div>
            <p className="ds2-billing-page-quote ds2-about-hero-quote">
              Greater clarity today. A brighter tomorrow.
            </p>
        </div>
      </section>

      <div className={`${landingV3ContentGridClass} ds2-about-body`}>
        <section
          id="why-immifin-exists"
          className="ds2-about-section ds2-about-exists"
          aria-labelledby="why-immifin-exists-heading"
        >
          <div className="ds2-about-exists-copy">
            <h2 id="why-immifin-exists-heading" className="ds2-about-section-title">
              Why IMMIFIN Exists
            </h2>
            <p>
              Moving to a new country is one of life&apos;s biggest transitions. It&apos;s full of
              opportunities — and complex decisions. IMMIFIN was created to make that journey easier
              by bringing immigration, financial planning, and everyday life guidance together in
              one place.
            </p>
            <p>
              Whether you&apos;re on an H-1B visa, pursuing a green card, or building your first
              credit history, we&apos;re here to help you make informed decisions every step of the
              way.
            </p>
          </div>
          <aside className="ds2-about-brand-card" aria-label="IMMIFIN brand statement">
            <span className="ds2-about-brand-card-mark" aria-hidden="true">
              “
            </span>
            <p className="ds2-about-brand-card-quote">
              IMMIFIN gives you the clarity and confidence to plan your future in America.
            </p>
            <p className="ds2-about-brand-card-attribution">— IMMIFIN</p>
            <div className="ds2-about-brand-card-dots" aria-hidden="true">
              <span className="is-active" />
              <span />
              <span />
            </div>
          </aside>
        </section>

        <section className="ds2-about-section" aria-labelledby="journey-heading">
          <div className="ds2-about-journey-panel">
            <h2 id="journey-heading" className="ds2-about-section-title">
              Your Journey, Our Focus
            </h2>
            <p className="ds2-about-section-copy">
              From arrival to opportunity, IMMIFIN supports you at every stage.
            </p>
            <ol className="ds2-about-journey">
              {JOURNEY.map((stage, index) => (
                <li key={stage.id} className="ds2-about-journey-item">
                  <span className="ds2-about-journey-icon">
                    <Icon name={JOURNEY_ICONS[stage.id]} />
                  </span>
                  {index < JOURNEY.length - 1 ? (
                    <span className="ds2-about-journey-arrow" aria-hidden="true">
                      ›
                    </span>
                  ) : null}
                  <p className="ds2-about-journey-title">{stage.title}</p>
                  <p className="ds2-about-journey-description">{stage.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="ds2-about-section" aria-labelledby="pillars-heading">
          <h2 id="pillars-heading" className="ds2-about-section-title">
            Three Pillars. A Brighter Tomorrow.
          </h2>
          <p className="ds2-about-section-copy">
            IMMIFIN brings together the most important parts of your journey in America.
          </p>
          <div className="ds2-about-pillars">
            {PILLARS.map((pillar) => (
              <Link
                key={pillar.id}
                href={pillar.href}
                className={`ds2-about-pillar ds2-about-pillar-${pillar.id}`}
                style={{ backgroundImage: pillar.background, backgroundColor: "#0b1b3a" }}
              >
                <span className="ds2-about-pillar-emblem" aria-hidden="true">
                  <Icon
                    name={
                      pillar.id === "immigration" ? "plane" : pillar.id === "finance" ? "chart" : "home"
                    }
                  />
                </span>
                <span className="ds2-about-pillar-watermark" aria-hidden="true">
                  <Icon
                    name={
                      pillar.id === "immigration" ? "passport" : pillar.id === "finance" ? "chart" : "sun"
                    }
                  />
                </span>
                <h3 className="ds2-about-pillar-name">{pillar.name}</h3>
                <p className="ds2-about-pillar-copy">{pillar.description}</p>
                <span className="ds2-about-pillar-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="ds2-about-section" aria-labelledby="values-heading">
          <h2 id="values-heading" className="ds2-about-section-title">
            Our Values
          </h2>
          <p className="ds2-about-section-copy">The principles that guide everything we publish.</p>
          <ul className="ds2-about-values">
            {VALUES.map((value) => (
              <li key={value.title} className="ds2-about-value">
                <div className="ds2-about-value-heading">
                  <span className="ds2-about-value-icon">
                    <Icon name={VALUE_ICONS[value.title]} />
                  </span>
                  <h3 className="ds2-about-value-title">{value.title}</h3>
                </div>
                <p className="ds2-about-value-copy">{value.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="ds2-about-commitment" aria-labelledby="commitment-heading">
        <div className={landingV3ContentGridClass}>
          <div className="ds2-about-commitment-frame">
            <Image
              src={COMMITMENT_IMAGE}
              alt=""
              fill
              sizes="(min-width: 900px) 1100px, 100vw"
              className="ds2-about-commitment-photo"
            />
            <div className="ds2-about-commitment-inner">
          <div className="ds2-about-commitment-copy">
            <p className="ds2-about-eyebrow ds2-about-commitment-eyebrow">Our Commitment</p>
            <h2 id="commitment-heading" className="ds2-about-commitment-title">
              Know where you stand.
            </h2>
            <p>
              We&apos;re committed to empowering immigrants with trusted information, practical
              tools, and a clearer path to a brighter tomorrow.
            </p>
          </div>
          <div className="ds2-about-commitment-action">
            <Link href="/contact#contact-form-heading" className="ds2-about-commitment-cta">
              Get in Touch <span aria-hidden="true">→</span>
            </Link>
            <p>Have a question or suggestion? We&apos;d love to hear from you.</p>
          </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
