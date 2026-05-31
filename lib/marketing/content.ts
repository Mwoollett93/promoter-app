import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  DollarSign,
  Mic2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

export { navLinks, site } from "@/lib/marketing/site-meta";

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
    description: "AI-assisted roster building — portraits, bios, contacts, and CSV import in minutes.",
    href: "/features#artists",
  },
  {
    icon: ClipboardList,
    title: "Operational Tasks",
    description: "Kanban boards with event context, overdue metrics, and intelligence from your shows.",
    href: "/features#tasks",
  },
  {
    icon: Building2,
    title: "Venue Management",
    description: "Capacities, hire fees, contracts, and AI extraction from venue PDFs.",
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
    features: [
      "3 active events",
      "1 team member",
      "Event wizard + dashboard",
      "Artist & venue CRM",
      "Kanban task board",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    audience: "Growing teams",
    price: "$49",
    period: "/ month",
    description: "For promoters running regular nights who need forecasting and team scale.",
    features: [
      "Unlimited events",
      "Up to 5 team members",
      "Finance forecasting",
      "AI artist lookup & venue extraction",
      "Stripe billing — upgrade in-app",
    ],
    cta: "Start free",
    highlighted: true,
  },
  {
    name: "Collective",
    audience: "Multi-user orgs",
    price: "Custom",
    period: "",
    description: "For collectives and venue groups with complex permissions and onboarding.",
    features: [
      "Unlimited team members",
      "Shared workspaces",
      "Role-based access",
      "Dedicated onboarding",
      "Custom integrations",
    ],
    cta: "Book demo",
    highlighted: false,
  },
] as const;

export const pricingComparisonRows = [
  ["Active events", "3", "Unlimited", "Unlimited"],
  ["Team members", "1", "5", "Unlimited"],
  ["Finance forecasting", "—", "✓", "✓"],
  ["Kanban task board", "✓", "✓", "✓"],
  ["Team workspace & comments", "✓", "✓", "✓"],
  ["AI artist & venue assist", "—", "✓", "✓"],
  ["Dedicated onboarding", "—", "—", "✓"],
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
      "AI lookup: bio, portrait candidates, and contact hints in seconds",
      "Typical fees, deposits, and booking notes per artist",
      "CSV import for migrating an existing roster",
    ],
  },
  {
    id: "venues",
    icon: Building2,
    title: "Venue Management",
    subtitle: "Specs and commercial terms where they belong.",
    bullets: [
      "Capacity, hire fees, and minimum spend",
      "AI document extraction from venue spec PDFs",
      "Deposit terms and internal ops notes",
    ],
  },
  {
    id: "tasks",
    icon: ClipboardList,
    title: "Operational Tasks",
    subtitle: "A task board that understands your season — not a generic todo app.",
    bullets: [
      "Kanban workflow: backlog → to do → in progress → waiting → complete",
      "Event pills, due dates, assignees, and priority on every card",
      "Operational intelligence: suggested tasks from lineup, venue, and margin gaps",
    ],
  },
  {
    id: "team",
    icon: Users,
    title: "Team Collaboration",
    subtitle: "Your crew on one workspace — live today.",
    bullets: [
      "Shared event workspaces with role-based permissions",
      "Task assignments, due dates, checklists, and comment threads",
      "Invites, MFA security, and in-app notifications for show week",
    ],
  },
  {
    id: "ai",
    icon: Sparkles,
    title: "AI-Assisted Ops",
    subtitle: "Less admin, more time on the floor.",
    bullets: [
      "Fast artist profile preview before you commit to a roster entry",
      "Portrait evidence scoring — real photos, not random album art",
      "Venue spec extraction from uploaded documents",
    ],
  },
  {
    id: "reporting",
    icon: BarChart3,
    title: "Reporting & Insights",
    subtitle: "Portfolio-level learning across your seasons.",
    bullets: [
      "Event status distribution and trends on the dashboard",
      "Revenue and cost rollups across shows",
      "Exportable summaries for stakeholders (expanding)",
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

/** Live collaboration capabilities for marketing sections */
export const collaborationHighlights = [
  "Kanban boards with event filters and overdue metrics",
  "Comments and @mentions on tasks",
  "Workspace invites with role-based access",
] as const;
