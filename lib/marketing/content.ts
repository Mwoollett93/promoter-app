import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  DollarSign,
  Mic2,
  Sparkles,
  Ticket,
  Users,
  Zap,
} from "lucide-react";

export { navLinks, site } from "@/lib/marketing/site-meta";

export const coreFeatures = [
  {
    icon: CalendarDays,
    title: "Event Creation",
    description: "Four-step wizard: basics, lineup, finance, and review — with Active/Draft/Canceled/Completed states.",
    href: "/features#events",
  },
  {
    icon: CalendarRange,
    title: "Run Overview",
    description: "Season-wide shows, projected P/L, monthly profit bars, and operational risks on one viewport.",
    href: "/features#run",
  },
  {
    icon: Ticket,
    title: "Sales Tracker",
    description: "Per-event ticket checkpoints, CSV import, break-even progress, and forecast attendance.",
    href: "/features#sales",
  },
  {
    icon: DollarSign,
    title: "Finance Forecasting",
    description: "Ticket tiers, costs, break-even, and projected profit — on the dashboard and in the wizard.",
    href: "/features#finance",
  },
  {
    icon: ClipboardList,
    title: "Operational Tasks",
    description: "Backlog → Complete kanban with event pills, assignees, and overdue metrics.",
    href: "/features#tasks",
  },
  {
    icon: Mic2,
    title: "Artist CRM",
    description: "AI-assisted roster building — portraits, bios, contacts, and CSV import.",
    href: "/features#artists",
  },
  {
    icon: Building2,
    title: "Venue Management",
    description: "Capacities, hire fees, contracts, and AI extraction from venue PDFs.",
    href: "/features#venues",
  },
  {
    icon: Users,
    title: "Team Workspaces",
    description: "Shared events, roles, comments, and workspace-scoped artists & venues.",
    href: "/features#team",
  },
] as const;

export const howItWorks = [
  {
    step: "01",
    title: "Build the event",
    description: "Use the wizard for basics, lineup slots, and finance tiers — then publish from review.",
  },
  {
    step: "02",
    title: "Run the season",
    description: "Dashboard, Run overview, tasks, and team workspaces keep everyone aligned.",
  },
  {
    step: "03",
    title: "Track ticket sales",
    description: "Add checkpoints or import CSVs in the Sales Tracker tab as doors approach.",
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
      "The dashboard, Run page, and Sales Tracker finally feel like one product — not five spreadsheets.",
    author: "Early access promoter",
    role: "Melbourne independent events",
  },
  {
    quote:
      "Break-even and projected profit show up in the wizard and on the dashboard before we announce lineups.",
    author: "Collective operator",
    role: "Multi-venue programming",
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
    subtitle: "Status cards, search, filters, and a detail panel — the same Events page you use in-app.",
    bullets: [
      "Active, Draft, Canceled, and Completed counts at a glance",
      "Search events, venues, and notes; filter by status",
      "Projected P/L column and quick jump to event workspace",
    ],
  },
  {
    id: "run",
    icon: CalendarRange,
    title: "Run Overview",
    subtitle: "Your promoter calendar for the selected timeframe — shows, P/L, and risks without scrolling the whole app.",
    bullets: [
      "Summary strip: total shows, projected P/L, attendance, revenue, avg break-even",
      "Upcoming shows grouped by month with venue and margin per card",
      "Monthly P/L bars and operational risk list in the right rail",
    ],
  },
  {
    id: "sales",
    icon: Ticket,
    title: "Sales Tracker",
    subtitle: "Ticket sales monitoring inside each event workspace — a fixed cockpit, not a long form.",
    bullets: [
      "Manual checkpoints: tickets sold, capacity, revenue, fees, and notes",
      "CSV import with platform selector and column mapping",
      "KPIs, smooth charts, break-even progress, and recent checkpoint history",
    ],
  },
  {
    id: "lineup",
    icon: Zap,
    title: "Lineup & Scheduling",
    subtitle: "Your run-of-show in the wizard — slot order, B2B sets, and fees tied to finance.",
    bullets: [
      "Drag-order slots with set lengths and B2B markers",
      "Per-slot artist fees rolled into finance automatically",
      "Runtime and artist count at a glance before review",
    ],
  },
  {
    id: "finance",
    icon: DollarSign,
    title: "Finance & Forecasting",
    subtitle: "Know your margin before you announce the headliner.",
    bullets: [
      "Ticket tiers with expected sell-through in the wizard",
      "Dashboard Financial Overview with smooth portfolio sparkline",
      "Projected profit, break-even, and cost rollups per event",
    ],
  },
  {
    id: "artists",
    icon: Mic2,
    title: "Artist CRM",
    subtitle: "Roster intelligence for booking and rebooking — shared across your workspace.",
    bullets: [
      "AI lookup: bio, portrait candidates, and contact hints",
      "Typical fees, deposits, and booking notes per artist",
      "CSV import and workspace-scoped artist library",
    ],
  },
  {
    id: "venues",
    icon: Building2,
    title: "Venue Management",
    subtitle: "Specs and commercial terms where they belong — visible to the whole team.",
    bullets: [
      "Capacity, hire fees, and minimum spend",
      "AI document extraction from venue spec PDFs",
      "Top venues on the dashboard from your real portfolio",
    ],
  },
  {
    id: "tasks",
    icon: ClipboardList,
    title: "Operational Tasks",
    subtitle: "Kanban that understands your events — Backlog through Complete.",
    bullets: [
      "Columns: Backlog, To Do, In Progress, Waiting, Complete",
      "Event pills, due dates, assignees, and priority on every card",
      "Overdue and completion metrics on the board toolbar",
    ],
  },
  {
    id: "team",
    icon: Users,
    title: "Team Collaboration",
    subtitle: "Workspaces, roles, and shared data — live in production.",
    bullets: [
      "Event workspaces with Overview, Sales Tracker, Activity, Tasks, Comments",
      "Workspace-scoped artists and venues with creator attribution",
      "Invites, MFA, and operational alerts on the dashboard",
    ],
  },
  {
    id: "ai",
    icon: Sparkles,
    title: "AI-Assisted Ops",
    subtitle: "Less admin, more time on the floor.",
    bullets: [
      "Artist profile preview before you commit to a roster entry",
      "Portrait evidence scoring — real photos, not random album art",
      "Venue spec extraction from uploaded PDFs",
    ],
  },
  {
    id: "reporting",
    icon: BarChart3,
    title: "Dashboard & Insights",
    subtitle: "Portfolio pulse on login — no digging through folders.",
    bullets: [
      "Ops stats: upcoming, confirmed, open tasks, approvals, overdue",
      "Financial overview, top venues, top artists, operational alerts",
      "Upcoming events list with the same cards you see in-app",
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
  "Event workspace tabs: Overview, Sales Tracker, Activity, Tasks, Comments",
  "Dashboard operational alerts with scroll and fade",
  "Workspace invites with role-based access (Admin, Promoter, Finance, …)",
] as const;
