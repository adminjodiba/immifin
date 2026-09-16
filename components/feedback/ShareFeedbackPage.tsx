import Link from "next/link";
import { Ds2SplitSceneHero } from "@/components/ds2/Ds2SplitSceneHero";
import { landingV3ContentGridClass } from "@/components/landing-v3/landingV3Layout";
import { ShareFeedbackForm } from "@/components/feedback/ShareFeedbackForm";

/** Locked PO-approved split-scene hero. Do not retune without a new PO request. See EMMIFIN-HERO-DESIGN.MD. */
const SHARE_HERO_IMAGE = "/images/mountrushmore-yosometti.png";

function PanelIcon({
  name,
}: {
  name: "user" | "people" | "shield" | "send" | "review" | "check" | "sprout" | "question";
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {name === "user" ? (
        <path
          d="M12 11.4a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6ZM6.2 18.6c.6-2.6 2.8-4.2 5.8-4.2s5.2 1.6 5.8 4.2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      ) : null}
      {name === "people" ? (
        <path
          d="M9.2 10.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Zm6.8-.4a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8ZM4.6 18.2c.4-2.4 2.4-4 4.6-4s4.2 1.6 4.6 4M14.2 14.6c1.8.2 3.4 1.4 3.8 3.6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      ) : null}
      {name === "shield" ? (
        <path
          d="M12 3.8 18.2 6.2v5c0 3.8-2.7 7-6.2 8.3C8.5 18.2 5.8 15 5.8 11.2v-5L12 3.8Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      ) : null}
      {name === "send" ? (
        <path
          d="m4.6 12 14.2-6.4L14.2 19.6l-2.4-6.2L4.6 12Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      ) : null}
      {name === "review" ? (
        <>
          <rect x="6" y="4.2" width="12" height="15.6" rx="1.6" stroke="currentColor" strokeWidth="1.7" />
          <path d="M9 9h6M9 12.4h6M9 15.8h3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </>
      ) : null}
      {name === "check" ? (
        <path
          d="M6.6 12.2 10.2 16l7.2-8.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {name === "sprout" ? (
        <path
          d="M12 20.2V11.4M12 11.4C12 8.2 9.6 5.8 6.6 5.8 6.8 9 9.2 11.4 12 11.4Zm0 0c0-3.2 2.4-5.6 5.4-5.6-.2 3.2-2.6 5.6-5.4 5.6Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {name === "question" ? (
        <path
          d="M9.4 9.1a2.6 2.6 0 1 1 3.8 2.3c-.8.5-1.2 1-1.2 1.9M12 16.7h.01"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}

function MountainDeco({
  script,
  kicker,
  align = "start",
}: {
  script: string;
  kicker?: string;
  align?: "start" | "end";
}) {
  return (
    <div className={`ds2-share-deco ds2-share-deco-${align}`} aria-hidden="true">
      <svg className="ds2-share-deco-mountains" viewBox="0 0 320 78" fill="none">
        <path
          d="M0 78 58 36l28 18 42-40 36 28 38-22 46 26 32-18 40 22V78H0Z"
          fill="currentColor"
          opacity="0.16"
        />
        <path
          d="M0 78 46 48l26 14 38-30 30 20 34-16 40 20 28-14 36 16 42-18V78H0Z"
          fill="currentColor"
          opacity="0.1"
        />
      </svg>
      <p className="ds2-share-deco-script">{script}</p>
      {kicker ? <p className="ds2-share-deco-kicker">{kicker}</p> : null}
    </div>
  );
}

export function ShareFeedbackPage() {
  return (
    <div className="ds2-share-page">
      <Ds2SplitSceneHero
        className="ds2-share-hero"
        labelledBy="share-feedback-heading"
        imageSrc={SHARE_HERO_IMAGE}
        imageWidth={2172}
        imageHeight={724}
        leftLock={0.33}
        rightLock={0.38}
        fillLeft={0.33}
        fillRight={0.69}
        skyLeft={0.35}
        skyRight={0.54}
      >
        <div className={`${landingV3ContentGridClass} ds2-share-hero-inner`}>
          <div className="ds2-share-hero-copy">
            <p className="ds2-share-eyebrow">Share your feedback</p>
            <span className="ds2-section-header-accent" aria-hidden="true" />
            <div className="landing-v3-hero-title-lane hero-ribbon-title-rail ds2-share-hero-title-lane">
              <div className="hero-ribbon-title-shuttle landing-v3-hero-title-shuttle">
                <h1 id="share-feedback-heading" className="ds2-share-hero-title hero-ribbon-title-float">
                  Your voice matters.
                </h1>
              </div>
            </div>
            <p className="ds2-share-hero-description">
              Your experience helps us improve the tools we build for immigrants navigating life in
              America.
            </p>
          </div>
        </div>
      </Ds2SplitSceneHero>

      <div className={`${landingV3ContentGridClass} ds2-share-body`}>
        <aside className="ds2-share-panel ds2-share-panel-why" aria-labelledby="share-why-heading">
          <h2 id="share-why-heading">Why your feedback matters</h2>
          <div className="ds2-share-side-item">
            <span className="ds2-share-side-icon">
              <PanelIcon name="user" />
            </span>
            <div>
              <h3>Help a larger community</h3>
              <p>
                Your feedback helps us improve useful tools, make information clearer, and
                prioritize what matters to users.
              </p>
            </div>
          </div>
          <div className="ds2-share-side-item">
            <span className="ds2-share-side-icon">
              <PanelIcon name="people" />
            </span>
            <div>
              <h3>Real experiences make a difference</h3>
              <p>Your insights guide new features, content, and improvements.</p>
            </div>
          </div>
          <div className="ds2-share-side-item">
            <span className="ds2-share-side-icon">
              <PanelIcon name="shield" />
            </span>
            <div>
              <h3>A safe and respectful space</h3>
              <p>All feedback is reviewed. Nothing is published automatically.</p>
            </div>
          </div>
          <MountainDeco script="Stronger together" kicker="IMMIFIN COMMUNITY" />
        </aside>

        <ShareFeedbackForm />

        <aside className="ds2-share-panel ds2-share-panel-next" aria-labelledby="share-next-heading">
          <h2 id="share-next-heading">What happens next?</h2>
          <ol className="ds2-share-steps">
            <li>
              <span className="ds2-share-side-icon">
                <PanelIcon name="send" />
              </span>
              <div>
                <p className="ds2-share-step-title">1. You share your experience</p>
                <p>Submit your feedback using the form.</p>
              </div>
            </li>
            <li>
              <span className="ds2-share-side-icon">
                <PanelIcon name="review" />
              </span>
              <div>
                <p className="ds2-share-step-title">2. IMMIFIN reviews your feedback</p>
                <p>Our team reads every submission before any public use.</p>
              </div>
            </li>
            <li>
              <span className="ds2-share-side-icon ds2-share-side-icon-success">
                <PanelIcon name="check" />
              </span>
              <div>
                <p className="ds2-share-step-title">3. Approved public feedback may appear</p>
                <p>If you give permission, approved feedback may appear on What Users Say.</p>
              </div>
            </li>
          </ol>
          <div className="ds2-share-questions">
            <span className="ds2-share-side-icon">
              <PanelIcon name="question" />
            </span>
            <div>
              <p className="ds2-share-step-title">Questions?</p>
              <p>If you have a question or need support, please visit our Contact Us page.</p>
              <Link href="/contact#contact-form-heading" className="ds2-share-contact-link">
                Go to Contact
                <span aria-hidden="true"> →</span>
              </Link>
            </div>
          </div>
          <MountainDeco script="Your perspective helps us grow" align="end" />
        </aside>
      </div>

      <section className="ds2-share-closing" aria-labelledby="share-closing-heading">
        <div className={`${landingV3ContentGridClass} ds2-share-closing-grid`}>
          <div className="ds2-share-closing-inner">
            <span className="ds2-share-side-icon ds2-share-side-icon-success">
              <PanelIcon name="sprout" />
            </span>
            <div>
              <h2 id="share-closing-heading">Thank you for being part of the IMMIFIN community!</h2>
              <p>
                Your feedback helps us create better tools, content, and guidance for immigrants
                navigating life in America.
              </p>
            </div>
          </div>
          <p className="ds2-share-deco-script ds2-share-closing-script" aria-hidden="true">
            A brighter future together
          </p>
        </div>
      </section>
    </div>
  );
}
