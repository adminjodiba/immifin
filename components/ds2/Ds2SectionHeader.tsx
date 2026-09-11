import type { ElementType, ReactNode } from "react";

type Ds2SectionHeaderProps = {
  /** Uppercase category / capability label. */
  eyebrow?: string;
  /** Strong title. Omit for capability-only headings (eyebrow + accent + description). */
  title?: string;
  description?: string;
  icon?: ReactNode;
  /** Short blue accent bar. Defaults on. */
  accent?: boolean;
  as?: "div" | "header";
  titleAs?: "h1" | "h2" | "h3" | "p";
  /** Optional id for the title element (section aria-labelledby). */
  titleId?: string;
  className?: string;
};

/**
 * Opt-in Design System 2.0 section / capability heading.
 * Matches the approved Landing V3 capability treatment. Not applied globally.
 */
export function Ds2SectionHeader({
  eyebrow,
  title,
  description,
  icon,
  accent = true,
  as: Root = "div",
  titleAs: TitleTag = "h2",
  titleId,
  className,
}: Ds2SectionHeaderProps) {
  const Heading = TitleTag as ElementType;

  return (
    <Root className={["ds2-section-header", className].filter(Boolean).join(" ")}>
      {eyebrow || icon ? (
        <div className="ds2-section-header-label-row">
          {icon ? (
            <span className="ds2-section-header-icon" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          {eyebrow ? <p className="ds2-section-header-eyebrow">{eyebrow}</p> : null}
        </div>
      ) : null}
      {accent ? <span className="ds2-section-header-accent" aria-hidden="true" /> : null}
      {title ? (
        <Heading id={titleId} className="ds2-section-header-title">
          {title}
        </Heading>
      ) : null}
      {description ? <p className="ds2-section-header-description">{description}</p> : null}
    </Root>
  );
}
