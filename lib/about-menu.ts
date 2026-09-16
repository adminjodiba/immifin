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
        href: "/about/what-users-say",
        label: "What Users Say",
        description: "Hear from people using IMMIFIN",
      },
      {
        href: "/about/share-feedback",
        label: "Share Your Feedback",
        description: "Tell us how IMMIFIN is working for you",
      },
      {
        href: "/pricing",
        label: "Pricing",
        description: "Compare Free, Pro, and Power plans",
      },
      {
        href: "/contact",
        label: "Contact Us",
        description: "Support, partnerships, and bug reports",
      },
    ],
  },
] as const;

export const aboutMenuLinks: AboutMenuLink[] = aboutMenuSections.flatMap((section) => [
  ...section.items,
]);
