/**
 * About top-nav configuration (S7-UI-012).
 */

export type AboutMenuLink = {
  href: string;
  label: string;
  description: string;
};

export type AboutMenuSection = {
  id: string;
  label: string;
  items: readonly AboutMenuLink[];
};

export const aboutMenuSections: readonly AboutMenuSection[] = [
  {
    id: "about",
    label: "",
    items: [
      {
        href: "/about",
        label: "About IMMIFIN",
        description: "Our mission, values, and the story behind Immifin",
      },
      {
        href: "/contact",
        label: "Contact Us",
        description: "Support, partnerships, bug reports, and feedback",
      },
    ],
  },
] as const;

export const aboutMenuLinks: AboutMenuLink[] = aboutMenuSections.flatMap((section) => [
  ...section.items,
]);
