import type { CSSProperties } from "react";
import { landingV2ContainerClass } from "@/components/landing-v2/landingV2Layout";

function CheckIcon() {
  return (
    <svg className="h-3 w-3 shrink-0 text-emerald-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L9 10.94 7.28 9.22a.75.75 0 10-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.25-4.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const COAST_TO_COAST_HERO = "/images/immifin-coast-to-coast-hero.png";
const COAST_TO_COAST_WIDTH = 2158;
const COAST_TO_COAST_HEIGHT = 729;
const POSTER_ASPECT = COAST_TO_COAST_WIDTH / COAST_TO_COAST_HEIGHT;

/** Locked landmark fractions — never scaleX these. */
const LEFT_LOCK = 0.3;
const RIGHT_LOCK = 0.28;

/** Open sky + water only (the marked red column), used as fill. */
const FILL_LEFT = 0.3;
const FILL_RIGHT = 0.7;
const SKY_LEFT = 0.3;
const SKY_RIGHT = 0.46;

const HERO_H = "min(19vh, 160px)";
const posterW = `calc(var(--hero-h) * ${POSTER_ASPECT})`;
const overlap = "10rem";

const LEFT_FADE =
  "linear-gradient(90deg, #000 0%, #000 58%, rgba(0,0,0,0.78) 72%, rgba(0,0,0,0.32) 88%, transparent 100%)";
const RIGHT_FADE =
  "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.32) 12%, rgba(0,0,0,0.78) 28%, #000 42%, #000 100%)";
const SKY_BAND_FADE =
  "linear-gradient(180deg, #000 0%, #000 46%, rgba(0,0,0,0.45) 72%, transparent 100%)";

const CLOUD_PATCH_MASK =
  "radial-gradient(ellipse 70% 62% at 50% 32%, #000 0%, rgba(0,0,0,0.62) 40%, rgba(0,0,0,0.18) 68%, transparent 100%)";

const cloudPatchMaskStyle: CSSProperties = {
  WebkitMaskImage: CLOUD_PATCH_MASK,
  maskImage: CLOUD_PATCH_MASK,
  filter: "blur(6px)",
};

function sourceSliceStyle(left: number, right: number): CSSProperties {
  const span = right - left;
  return {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: `${(-left / span) * 100}%`,
    width: `${100 / span}%`,
    backgroundImage: `url(${COAST_TO_COAST_HERO})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 100%",
  };
}

function lockedCoastStyle(lockFrac: number, backgroundPosition: string, mask: string): CSSProperties {
  return {
    width: `calc(${posterW} * ${lockFrac} + ${overlap})`,
    height: "100%",
    backgroundImage: `url(${COAST_TO_COAST_HERO})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${posterW} 100%`,
    backgroundPosition,
    WebkitMaskImage: mask,
    maskImage: mask,
  };
}

function cloudPatchStyle({
  left,
  top,
  width,
  height,
  image,
  position,
  size,
  opacity,
}: {
  left: string;
  top: string;
  width: string;
  height: string;
  image: string;
  position: string;
  size: string;
  opacity: number;
}): CSSProperties {
  return {
    left,
    top,
    width,
    height,
    backgroundImage: `url(${image})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: position,
    backgroundSize: size,
    opacity,
    ...cloudPatchMaskStyle,
  };
}

/**
 * LOCKED /landing-v2 — approved commercial landing hero (former V7).
 * Do not modify. Design System experiments belong on /landing-v3.
 */
export function LandingV2Hero() {
  return (
    <section className="relative w-full max-w-none shrink-0 overflow-hidden">
      <div
        className="relative h-[min(28vh,180px)] w-full max-w-none overflow-hidden sm:h-[min(24vh,172px)] lg:h-[min(19vh,160px)] [--hero-h:min(28vh,180px)] sm:[--hero-h:min(24vh,172px)] lg:[--hero-h:min(19vh,160px)]"
      >
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div style={sourceSliceStyle(FILL_LEFT, FILL_RIGHT)} />
        </div>

        <div
          className="absolute inset-x-0 top-0 h-[72%] overflow-hidden"
          style={{ WebkitMaskImage: SKY_BAND_FADE, maskImage: SKY_BAND_FADE }}
          aria-hidden="true"
        >
          <div
            style={{
              ...sourceSliceStyle(SKY_LEFT, SKY_RIGHT),
              backgroundSize: "100% 210%",
              backgroundPosition: "center top",
            }}
          />
        </div>

        <div
          className="pointer-events-none absolute z-[1]"
          style={cloudPatchStyle({
            left: "26%",
            top: "-6%",
            width: "26%",
            height: "70%",
            image: "/images/landing-v3-sky.png",
            position: "left top",
            size: "160% 180%",
            opacity: 0.7,
          })}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute z-[1]"
          style={cloudPatchStyle({
            left: "40%",
            top: "-2%",
            width: "22%",
            height: "58%",
            image: "/images/landing-v6-hero-cloud.png",
            position: "center top",
            size: "130% 160%",
            opacity: 0.58,
          })}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute z-[1]"
          style={cloudPatchStyle({
            left: "54%",
            top: "-8%",
            width: "23%",
            height: "66%",
            image: "/images/landing-v3-sky.png",
            position: "20% top",
            size: "170% 200%",
            opacity: 0.64,
          })}
          aria-hidden="true"
        />

        <div
          className="absolute inset-y-0 left-0 z-[2]"
          style={lockedCoastStyle(LEFT_LOCK, "left center", LEFT_FADE)}
          aria-hidden="true"
        />
        <div
          className="absolute inset-y-0 right-0 z-[2]"
          style={lockedCoastStyle(RIGHT_LOCK, "right center", RIGHT_FADE)}
          aria-hidden="true"
        />

        <div className={`${landingV2ContainerClass} pointer-events-none absolute inset-0 z-10 flex items-center justify-center`}>
          <div className="pointer-events-auto flex min-w-0 w-full flex-col items-center py-2 text-center">
            <div className="landing-v3-hero-title-lane hero-ribbon-title-rail w-full">
              <div
                className="hero-ribbon-title-shuttle landing-v3-hero-title-shuttle"
                style={
                  {
                    ["--v3-glide-x-torch"]:
                      `max(0px, calc(50vw - ${HERO_H} * 1.08 - 1.5rem - 50% - var(--v3-optical-center)))`,
                  } as CSSProperties
                }
              >
                <h1 className="hero-ribbon-title-float whitespace-nowrap text-[clamp(1.4rem,2.9vw,2.25rem)] font-extrabold leading-[1.08] tracking-tight text-[#0B1B3A] drop-shadow-[0_1px_0_rgba(255,255,255,0.55)]">
                  Immigration, Finance &amp; Life in America
                </h1>
              </div>
            </div>

            <p className="landing-v3-hero-subtitle mt-2 w-full max-w-xl text-sm leading-snug text-slate-800 sm:text-[0.95rem] lg:w-max lg:max-w-none">
              Helping immigrants navigate life in America with clarity, confidence, and trusted tools.
            </p>

            <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-[11px] font-bold leading-snug text-white drop-shadow-[0_1px_2px_rgba(11,27,58,0.55)] sm:gap-x-3">
              <li className="inline-flex items-center gap-1">
                <CheckIcon />
                Free to get started
              </li>
              <li className="inline-flex items-center gap-1">
                <CheckIcon />
                No credit card required
              </li>
              <li className="inline-flex items-center gap-1">
                <CheckIcon />
                Cancel anytime
              </li>
            </ul>
          </div>
        </div>
      </div>

      <span className="sr-only">
        Coast-to-coast America: Golden Gate Bridge on the left and New York City with the Statue of Liberty on the
        right
      </span>
    </section>
  );
}
