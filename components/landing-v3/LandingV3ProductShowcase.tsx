import type { ReactNode } from "react";
import Image from "next/image";
import { landingV3ContainerClass } from "@/components/landing-v3/landingV3Layout";

const LIFE_JOURNEY_IMAGE = "/images/landing/parents-visiting-america.png";
const LIFE_JOURNEY_WIDTH = 1222;
const LIFE_JOURNEY_HEIGHT = 1287;

const IMMIGRATION_IMAGE = "/images/immifin-immigration-approved-v3-headerless.png";
const FINANCE_IMAGE = "/images/immifin-finance-approved-v3-headerless.png";
const APPROVED_PANEL_WIDTH = 658;
const APPROVED_PANEL_HEIGHT = 736;

function WindowChrome({
  title,
  children,
  bodyClassName = "flex min-h-0 flex-1 flex-col p-4 sm:p-5",
}: {
  title: string;
  children: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_44px_-28px_rgba(11,27,58,0.45)]">
      <div className="landing-v3-window-chrome flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3.5 py-2">
        <div className="relative z-[1] flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
        </div>
        <div className="landing-v3-window-title relative z-[1] ml-1 flex min-w-0 flex-1 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 py-0.5">
          <span className="truncate text-[10px] font-medium tracking-wide text-slate-500">{title}</span>
        </div>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

function ImmigrationWindow() {
  return (
    <WindowChrome title="Your Immigration Journey" bodyClassName="min-h-0 flex-1 bg-white p-2 sm:p-2.5">
      <Image
        src={IMMIGRATION_IMAGE}
        alt="IMMIFIN Your Immigration Journey visualization showing an illustrative EB-2 India priority-date path from Priority Date through Date for Filing, Final Action Date, and Green Card."
        width={APPROVED_PANEL_WIDTH}
        height={APPROVED_PANEL_HEIGHT}
        className="h-auto w-full object-contain"
        sizes="(min-width: 1024px) 42vw, 92vw"
        unoptimized
      />
    </WindowChrome>
  );
}

function FinanceWindow() {
  return (
    <WindowChrome title="Your Financial Life" bodyClassName="min-h-0 flex-1 bg-white p-2 sm:p-2.5">
      <Image
        src={FINANCE_IMAGE}
        alt="IMMIFIN Your Financial Life illustrative estimate for a Houston family of four, showing monthly income, taxes, rent, living expenses, and estimated savings."
        width={APPROVED_PANEL_WIDTH}
        height={APPROVED_PANEL_HEIGHT}
        className="h-auto w-full object-contain"
        sizes="(min-width: 1024px) 42vw, 92vw"
        unoptimized
      />
    </WindowChrome>
  );
}

function LifeWindow() {
  return (
    <WindowChrome title="Life In America" bodyClassName="min-h-0 flex-1 bg-white p-2 sm:p-2.5">
      <Image
        src={LIFE_JOURNEY_IMAGE}
        alt="IMMIFIN Parents Visiting America journey showing seven steps from planning the visit and visitor visa through travel, insurance, arrival, stay and return home."
        width={LIFE_JOURNEY_WIDTH}
        height={LIFE_JOURNEY_HEIGHT}
        className="h-auto w-full object-contain"
        sizes="(min-width: 1024px) 42vw, 92vw"
        unoptimized
      />
    </WindowChrome>
  );
}

/**
 * /landing-v3 Design System working copy — starts identical to locked V2.
 * Illustrative landing storytelling; not production Finance or Life products.
 */
export function LandingV3ProductShowcase() {
  return (
    <section aria-label="Immigration, Finance, and Life" className="landing-v3-product-windows border-b border-slate-200/80">
      <div className={`${landingV3ContainerClass} pt-3 pb-10 sm:pt-3 sm:pb-12 lg:pt-4 lg:pb-14`}>
        <div className="landing-v3-windows">
          <article className="landing-v3-window" tabIndex={0} aria-label="Immigration">
            <ImmigrationWindow />
          </article>
          <article className="landing-v3-window" tabIndex={0} aria-label="Finance">
            <FinanceWindow />
          </article>
          <article className="landing-v3-window" tabIndex={0} aria-label="Life">
            <LifeWindow />
          </article>
        </div>
      </div>
    </section>
  );
}
