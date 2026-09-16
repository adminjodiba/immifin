import type { CSSProperties, ReactNode } from "react";

const OVERLAP = "10rem";

const LEFT_FADE =
  "linear-gradient(90deg, #000 0%, #000 58%, rgba(0,0,0,0.78) 72%, rgba(0,0,0,0.32) 88%, transparent 100%)";
const RIGHT_FADE =
  "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.32) 12%, rgba(0,0,0,0.78) 28%, #000 42%, #000 100%)";

export type Ds2SplitSceneHeroProps = {
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  /** Left landmark width as a fraction of the source image. Never stretched. */
  leftLock?: number;
  /** Right landmark width as a fraction of the source image. Never stretched. */
  rightLock?: number;
  /** Middle filler slice start (source fraction). Sky / trees / water only. */
  fillLeft?: number;
  /** Middle filler slice end (source fraction). */
  fillRight?: number;
  /** Optional extra sky band from the source. */
  skyLeft?: number;
  skyRight?: number;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
};

function sourceSliceStyle(
  imageSrc: string,
  left: number,
  right: number,
  extras?: CSSProperties,
): CSSProperties {
  const span = right - left;
  return {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: `${(-left / span) * 100}%`,
    width: `${100 / span}%`,
    backgroundImage: `url(${imageSrc})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 100%",
    ...extras,
  };
}

function lockedLandmarkStyle(
  imageSrc: string,
  posterW: string,
  lockFrac: number,
  backgroundPosition: string,
  mask: string,
  zoomVar: string,
): CSSProperties {
  return {
    width: `calc((${posterW}) * ${lockFrac} * ${zoomVar} + ${OVERLAP})`,
    height: "100%",
    overflow: "hidden",
    backgroundImage: `url(${imageSrc})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `calc((${posterW}) * ${zoomVar}) calc(var(--ds2-split-hero-h) * ${zoomVar})`,
    backgroundPosition,
    WebkitMaskImage: mask,
    maskImage: mask,
  };
}

export function Ds2SplitSceneHero({
  imageSrc,
  imageWidth,
  imageHeight,
  leftLock = 0.32,
  rightLock = 0.3,
  fillLeft = 0.32,
  fillRight = 0.7,
  skyLeft = 0.34,
  skyRight = 0.52,
  labelledBy,
  className,
  children,
}: Ds2SplitSceneHeroProps) {
  const posterW = `calc(var(--ds2-split-hero-h) * ${imageWidth} / ${imageHeight})`;

  return (
    <section
      className={`ds2-split-hero${className ? ` ${className}` : ""}`}
      aria-labelledby={labelledBy}
    >
      <div className="ds2-split-hero-scene" aria-hidden="true">
        <div className="ds2-split-hero-fill">
          <div className="ds2-split-hero-fill-far">
            <div style={sourceSliceStyle(imageSrc, fillLeft, fillRight)} />
          </div>
          <div className="ds2-split-hero-fill-mid">
            <div
              style={sourceSliceStyle(imageSrc, fillLeft, fillRight, {
                backgroundSize: "130% 190%",
                backgroundPosition: "center 78%",
              })}
            />
          </div>
          <div className="ds2-split-hero-fill-near">
            <div
              style={sourceSliceStyle(imageSrc, fillLeft, fillRight, {
                backgroundSize: "140% 210%",
                backgroundPosition: "center bottom",
              })}
            />
          </div>
        </div>
        <div className="ds2-split-hero-sky">
          <div
            style={sourceSliceStyle(imageSrc, skyLeft, skyRight, {
              backgroundSize: "100% 210%",
              backgroundPosition: "center top",
            })}
          />
        </div>
        <div className="ds2-split-hero-valley" />
        <div
          className="ds2-split-hero-lock ds2-split-hero-lock-left"
          style={lockedLandmarkStyle(
            imageSrc,
            posterW,
            leftLock,
            "left bottom",
            LEFT_FADE,
            "var(--ds2-lock-zoom-left)",
          )}
        />
        <div
          className="ds2-split-hero-lock ds2-split-hero-lock-right"
          style={lockedLandmarkStyle(
            imageSrc,
            posterW,
            rightLock,
            "right bottom",
            RIGHT_FADE,
            "var(--ds2-lock-zoom-right)",
          )}
        />
      </div>
      {children}
    </section>
  );
}
