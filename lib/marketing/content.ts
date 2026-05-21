import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  Mic2,
  Users,
  Zap,
} from "lucide-react";

export const site = {
  name: "PromoSync",
  tagline: "The operating system for underground events.",
  description:
    "PromoSync centralizes event creation, lineup scheduling, artist CRM, venue ops, and finance forecasting — built for promoters, collectives, and venues who run the night.",
  audience: "Promoters, collectives & venues",
};

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const coreFeatures = [
  {
    icon: CalendarDays,
    title: "Event Creation",
    description: "Wizard-driven event setup from basics through review — no scattered docs.",
    href: "/features#events",
  },
  {
    icon: Zap,
    title: "Lineup Scheduling",
    description: "Slot-based run-of-show with B2B sets, durations, and artist fees in one timeline.",
    href: "/features#lineup",
  },
  {
    icon: DollarSign,
    title: "Finance Forecasting",
    description: "Ticket tiers, costs, break-even, and projected profit before doors open.",
    href: "/features#finance",
  },
  {
    icon: Mic2,
    title: "Artist CRM",
    description: "Profiles, fees, contacts, deposits, and booking notes — your roster in one place.",
    href: "/features#artists",
  },
  {
    icon: ClipboardList,
    title: "Task Boards",
    description: "Team workflows and operational checklists (coming soon).",
    href: "/features#team",
  },
  {
    icon: Building2,
    title: "Venue Management",
    description: "Capacities, hire fees, contracts, and venue specs when you need them.",
    href: "/features#venues",
  },
] as const;

export const howItWorks = [
  {
    step: "01",
    title: "Build the event",
    description: "Name the night, lock the venue, and sketch the lineup in minutes.",
  },
  {
    step: "02",
    title: "Manage logistics",
    description: "Artists, schedules, costs, and team tasks stay in one mission-control view.",
  },
  {
    step: "03",
    title: "Track performance",
    description: "Forecast revenue, watch margins, and learn what worked after last call.",
  },
] as const;

export const painPoints = [
  "Spreadsheets that break on show day",
  "Artist comms scattered across DMs and email",
  "Budgets rebuilt from scratch every event",
  "No single source of truth for the team",
] as const;

export const pricingPlans = [
  {
    name: "Free",
    audience: "Small promoters",
    price: "$0",
    period: "forever",
    description: "Get your first events organized without the spreadsheet chaos.",
    features: ["3 active events", "1 team member", "Core wizard + dashboard", "Artist & venue basics"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    audience: "Growing teams",
    price: "$49",
    period: "/ month",
    description: "For promoters running regular nights and needing full forecasting.",
    features: [
      "Unlimited events",
      "Up to 5 team members",
      "Finance forecasting",
      "Priority support",
      "Export & reporting (soon)",
    ],
    cta: "Start free",
    highlighted: true,
  },
  {
    name: "Collective",
    audience: "Multi-user orgs",
    price: "Custom",
    period: "",
    description: "For collectives and venue groups with complex permissions.",
    features: [
      "Unlimited team members",
      "Shared workspaces",
      "Advanced permissions",
      "Dedicated onboarding",
      "Custom integrations",
    ],
    cta: "Book demo",
    highlighted: false,
  },
] as const;

export const testimonials = [
  {
    quote:
      "Finally something that feels built for how we actually run nights — not another corporate CRM.",
    author: "Local promoter",
    role: "Melbourne underground",
  },
  {
    quote: "The finance view alone saved us from guessing break-even on a 400-cap room.",
    author: "Collective lead",
    role: "Independent events",
  },
] as const;

export type FeatureSection = {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  bullets: string[];
};

export const featureSections: FeatureSection[] = [
  {
    id: "events",
    icon: CalendarDays,
    title: "Event Creation",
    subtitle: "From concept to confirmed — guided, fast, and repeatable.",
    bullets: [
      "Event basics: venue, date, capacity, and internal notes",
      "Draft, active, and completed states across your portfolio",
      "Review & create step before anything goes live",
    ],
  },
  {
    id: "lineup",
    icon: Zap,
    title: "Lineup & Scheduling",
    subtitle: "Your run-of-show, not a messy group chat thread.",
    bullets: [
      "Drag-order slots with set lengths and B2B markers",
      "Per-slot artist fees rolled into finance automatically",
      "Runtime and artist count at a glance",
    ],
  },
  {
    id: "finance",
    icon: DollarSign,
    title: "Finance & Forecasting",
    subtitle: "Know your margin before you announce the headliner.",
    bullets: [
      "Ticket tiers with expected sell-through",
      "Venue fees, artist costs, and additional line items",
      "Projected profit, break-even, and risk indicators",
    ],
  },
  {
    id: "artists",
    icon: Mic2,
    title: "Artist CRM",
    subtitle: "Roster intelligence for booking and rebooking.",
    bullets: [
      "Profiles with genres, reach, and reliability",
      "Typical fees, deposits, and booking notes",
      "Contact and agency details in one record",
    ],
  },
  {
    id: "venues",
    icon: Building2,
    title: "Venue Management",
    subtitle: "Specs and commercial terms where they belong.",
    bullets: [
      "Capacity, hire fees, and minimum spend",
      "Deposit terms and payment schedules",
      "Documents and internal ops notes",
    ],
  },
  {
    id: "team",
    icon: Users,
    title: "Team Collaboration",
    subtitle: "Everyone on the same page — coming soon.",
    bullets: [
      "Shared event workspaces",
      "Task assignments and due dates",
      "Notifications tuned for show week",
    ],
  },
  {
    id: "reporting",
    icon: BarChart3,
    title: "Reporting & Insights",
    subtitle: "Portfolio-level learning across your seasons.",
    bullets: [
      "Event status distribution and trends",
      "Revenue and cost rollups across shows",
      "Exportable summaries for stakeholders",
    ],
  },
];

export const sceneTags = [
  "Techno",
  "House",
  "DnB",
  "Live",
  "Warehouse",
  "Club",
  "Festival",
  "Pop-up",
] as const;
