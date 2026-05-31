/** Marketing UI snapshots — mirrors real PromoSync screens (labels, nav, sample data). */

export const APP_NAV = [
  "Dashboard",
  "Events",
  "Run",
  "Tasks",
  "Team",
  "Venues",
  "Artists",
] as const;

export const WIZARD_STEPS = [
  "Event Basics",
  "Lineup & Schedule",
  "Finance & Forecast",
  "Review & Create",
] as const;

export const EVENT_WORKSPACE_TABS = [
  "Overview",
  "Sales Tracker",
  "Activity",
  "Tasks",
  "Comments",
] as const;

export const dashboardStats = [
  { label: "Upcoming Events", value: "4", hint: "+4 vs last month", hintTone: "positive" as const },
  { label: "Confirmed Events", value: "4", hint: "+4 vs last month", hintTone: "positive" as const },
  { label: "Open Tasks", value: "22", hint: "Team workload", hintTone: "neutral" as const },
  { label: "Pending Approvals", value: "3", hint: "Waiting on response", hintTone: "warn" as const },
  { label: "Overdue Tasks", value: "0", hint: "Great work", hintTone: "positive" as const },
];

export const upcomingEventsPreview = [
  {
    title: "Mall Grab",
    venue: "Club 121",
    time: "22:00 – 04:00",
    status: "ACTIVE" as const,
    date: "Sat 31 May",
  },
  {
    title: "4am Kru Live @ Red Square",
    venue: "Red Square",
    time: "22:00 – 04:00",
    status: "ACTIVE" as const,
    date: "Sat 31 May",
  },
  {
    title: "Lamb of God @ Wellington Stadium",
    venue: "Wellington Stadium",
    time: "18:00 – 23:00",
    status: "ACTIVE" as const,
    date: "Sat 13 Sep",
  },
];

export const financialOverviewPreview = {
  rows: [
    { label: "Total Revenue", value: "$543,690" },
    { label: "Total Costs", value: "$169,920" },
    { label: "Projected Profit", value: "$373,770", highlight: true },
    { label: "Break-even Point", value: "$169,920" },
  ],
};

export const eventStatusCounts = [
  { label: "Active", count: 4, tone: "active" as const },
  { label: "Draft", count: 0, tone: "draft" as const },
  { label: "Canceled", count: 0, tone: "canceled" as const },
  { label: "Completed", count: 1, tone: "completed" as const },
];

export const runSummary = [
  { label: "Total shows", value: "4" },
  { label: "Projected P/L", value: "$374,495", accent: "positive" as const },
  { label: "Forecast attendance", value: "7,650" },
  { label: "Total revenue", value: "$526,515" },
  { label: "Avg break-even", value: "$38,005" },
];

export const runShowsPreview = [
  { month: "May", title: "Mall Grab", venue: "Club 121", status: "Active", pl: "$12,400" },
  { month: "Jun", title: "4am Kru Live @ Red Square", venue: "Red Square", status: "Active", pl: "−$3,865" },
  { month: "Sep", title: "Lamb of God @ Wellington Stadium", venue: "Wellington Stadium", status: "Active", pl: "$48,200" },
];

export const salesKpis = [
  { label: "Tickets sold", value: "190" },
  { label: "Capacity", value: "76%" },
  { label: "Net revenue", value: "$1,700" },
  { label: "Break-even", value: "0%" },
  { label: "Sales velocity", value: "—" },
  { label: "Forecast", value: "—" },
];

export const taskBoardPreview = {
  columns: [
    { id: "todo", label: "To Do", count: 8, cards: ["Artist deposit due", "Confirm venue specs"] },
    { id: "in_progress", label: "In Progress", count: 5, cards: ["Upload marketing assets"] },
    { id: "waiting", label: "Waiting", count: 3, cards: ["Promoter approval"] },
  ] as const,
  footer: { overdue: 2, waiting: 1, completePct: 68 },
};

export const financeWizardPreview = {
  venue: "Red Square · Melbourne",
  date: "Sat 31 May · 22:00",
  tiers: "GA + VIP tiers",
  projectedProfit: "$4,280",
  breakEven: "186 tickets to break even",
};
