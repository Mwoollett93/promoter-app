export const site = {
  name: "PromoSync",
  tagline: "The operating system for underground events.",
  description:
    "PromoSync centralizes your dashboard, event wizard, Run overview, Sales Tracker, artist & venue CRM, kanban tasks, and team workspaces — built for promoters who need one mission control before doors open.",
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
