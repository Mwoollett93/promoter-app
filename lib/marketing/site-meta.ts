export const site = {
  name: "PromoSync",
  tagline: "The operating system for underground events.",
  description:
    "PromoSync centralizes event creation, lineup scheduling, artist CRM, venue ops, finance forecasting, and operational task boards — built for promoters, collectives, and venues who run the night.",
  audience: "Promoters, collectives & venues",
};

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export type NavLink = (typeof navLinks)[number];
