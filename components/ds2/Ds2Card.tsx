import type { ElementType, ReactNode } from "react";

type Ds2CardProps = {
  children: ReactNode;
  /** Hover lift. Default is the static premium card. */
  hover?: boolean;
  as?: "div" | "article" | "section" | "aside";
  className?: string;
};

/**
 * Opt-in Design System 2.0 dense / premium card.
 * Does not replace global `.card` or `.card-static`.
 */
export function Ds2Card({
  children,
  hover = false,
  as: Root = "div",
  className,
}: Ds2CardProps) {
  const Tag = Root as ElementType;

  return (
    <Tag className={[hover ? "ds2-card" : "ds2-card-static", className].filter(Boolean).join(" ")}>
      {children}
    </Tag>
  );
}
