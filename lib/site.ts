export const siteConfig = {
  name: "Immifin",
  title: "Immifin — Immigration, Finance & Life in America",
  description:
    "Helping immigrants navigate visas, taxes, investing, credit, and citizenship. Expert guides and calculators for life in America.",
  url: "https://immifin.com",
  ogImage: "/og-image.png",
  links: {
    email: "info@immifin.com",
  },
};

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/immigration", label: "Immigration", hasDropdown: true },
  { href: "/calculators", label: "Calculators", hasDropdown: true },
  { href: "/finance", label: "Finance" },
  { href: "/insurance", label: "Insurance" },
  { href: "/dashboard", label: "My Immifin", hasDropdown: true, isMyImmifin: true },
  { href: "/about", label: "About", hasDropdown: true },
] as const;

export const footerLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
] as const;
