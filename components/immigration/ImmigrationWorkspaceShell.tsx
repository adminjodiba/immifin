import type { ReactNode } from "react";
import { Ds2SplitSceneHero } from "@/components/ds2/Ds2SplitSceneHero";
import { ImmigrationWorkspaceSidebar } from "@/components/immigration/ImmigrationWorkspaceSidebar";
import type { ImmigrationWorkspaceDestinations } from "@/components/immigration/ImmigrationWorkspaceDestinations";

const IMMIGRATION_V2_HERO_IMAGE = "/images/immigration-journey-hero.png";

type ImmigrationWorkspaceShellProps = {
  children: ReactNode;
  destinations: ImmigrationWorkspaceDestinations;
};

export function ImmigrationWorkspaceShell({ children, destinations }: ImmigrationWorkspaceShellProps) {
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
        <ImmigrationWorkspaceSidebar destinations={destinations} />
        {children}
      </div>
    </div>
  );
}