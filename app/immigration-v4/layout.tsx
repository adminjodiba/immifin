import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Ds2SplitSceneHero } from "@/components/ds2/Ds2SplitSceneHero";
import { ImmigrationV4Sidebar } from "@/components/immigration-v4/ImmigrationV4Sidebar";
import { createMetadata } from "@/lib/metadata";

/**
 * Immigration V4 workspace frame — persistent hero + sidebar.
 * Only {children} (the body slot) changes per route. Do not edit V2 or V3.
 */
const IMMIGRATION_V2_HERO_IMAGE = "/images/immigration-journey-hero.png";

const previewMetadata = createMetadata({
  title: "Immigration V4 Preview",
  description:
    "Temporary Product Owner preview of Immigration V4. Not a public page.",
  path: "/immigration-v4",
});

export const metadata: Metadata = {
  ...previewMetadata,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function ImmigrationV4Layout({ children }: { children: ReactNode }) {
  return (
    <div className="ds2-imm-v4-page">
      <div className="ds2-imm-v4-shell">
        <div className="ds2-imm-v4-hero-slot">
          <Ds2SplitSceneHero
            className="ds2-imm-v2-hero"
            labelledBy="immigration-v4-heading"
            imageSrc={IMMIGRATION_V2_HERO_IMAGE}
            imageWidth={1983}
            imageHeight={793}
            leftLock={0.36}
            rightLock={0.38}
            fillLeft={0.34}
            fillRight={0.64}
            skyLeft={0.36}
            skyRight={0.56}
          >
            <div className="ds2-imm-v2-hero-inner">
              <div className="ds2-imm-v2-hero-copy">
                <p className="ds2-share-eyebrow">IMMIGRATION</p>
                <span className="ds2-section-header-accent" aria-hidden="true" />
                <div className="landing-v3-hero-title-lane hero-ribbon-title-rail ds2-share-hero-title-lane">
                  <div className="hero-ribbon-title-shuttle landing-v3-hero-title-shuttle">
                    <h1 id="immigration-v4-heading" className="ds2-share-hero-title hero-ribbon-title-float">
                      Your U.S. Immigration Journey, Simplified
                    </h1>
                  </div>
                </div>
                <p className="ds2-share-hero-description">
                  Trusted tools, data and insights for visas, Green Cards and citizenship
                  — so you can understand where you stand and what changes.
                </p>
              </div>
            </div>
          </Ds2SplitSceneHero>
        </div>
        <ImmigrationV4Sidebar />
        {children}
      </div>
    </div>
  );
}
