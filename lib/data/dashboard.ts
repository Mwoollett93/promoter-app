import type { UpcomingEventRowProps } from "@/app/components/dashboard/UpcomingEventRow";
import type { EventStatus } from "@/app/components/ui/EventStatusBadge";

export const dashboardStats = [
  {
    label: "Upcoming Events",
    value: "6",
    trend: "↑ 2 vs last month",
    trendUp: true,
  },
  {
    label: "Confirmed Events",
    value: "3",
    trend: "↑ 1 vs last month",
    trendUp: true,
  },
  {
    label: "Projected Profit",
    value: "$28,450",
    trend: "↑ 18% vs last month",
    trendUp: true,
  },
  {
    label: "Total Revenue",
    value: "$62,300",
    trend: "↑ 22% vs last month",
    trendUp: true,
  },
] as const;

export const upcomingEvents: UpcomingEventRowProps[] = [
  {
    href: "/event-wizard/event-basics",
    title: "ABYSSAL 007",
    venueLabel: "Sub Club, Melbourne",
    timeRangeLabel: "10:00 PM – 5:30 AM",
    status: "confirmed",
    dateLabel: "24 May 2026",
    relativeLabel: "in 5 days",
    imageSrc:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=200&q=80",
  },
  {
    href: "/event-wizard/event-basics",
    title: "Night Shift",
    venueLabel: "Revolver Upstairs, Melbourne",
    timeRangeLabel: "9:00 PM – 4:00 AM",
    status: "planning",
    dateLabel: "2 Jun 2026",
    relativeLabel: "in 2 weeks",
    imageSrc:
      "https://images.unsplash.com/photo-1571266028243-e473f69f7db5?auto=format&fit=crop&w=200&q=80",
  },
  {
    href: "/event-wizard/event-basics",
    title: "Warehouse Sessions",
    venueLabel: "Sub Club, Melbourne",
    timeRangeLabel: "8:00 PM – 2:00 AM",
    status: "draft",
    dateLabel: "TBD",
    relativeLabel: "Unscheduled",
    imageSrc:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=200&q=80",
  },
];

export type FinancialRow = { label: string; value: string; highlight?: boolean };

export const financialRows: FinancialRow[] = [
  { label: "Total Revenue", value: "$62,300" },
  { label: "Total Costs", value: "$33,850" },
  { label: "Projected Profit", value: "$28,450", highlight: true },
  { label: "Break-even Point", value: "$31,200" },
];

export type StatusSlice = { status: EventStatus; pct: number; count: number };

export const eventStatusDistribution: StatusSlice[] = [
  { status: "confirmed", pct: 42, count: 5 },
  { status: "planning", pct: 33, count: 4 },
  { status: "draft", pct: 17, count: 2 },
  { status: "cancelled", pct: 8, count: 1 },
];

export const topVenues = [
  {
    name: "Sub Club",
    events: 12,
    thumb:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=80&q=60",
  },
  {
    name: "Revolver Upstairs",
    events: 8,
    thumb:
      "https://images.unsplash.com/photo-1571266028243-e473f69f7db5?auto=format&fit=crop&w=80&q=60",
  },
  {
    name: "Brown Alley",
    events: 5,
    thumb:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=80&q=60",
  },
];

export const topArtists = [
  { name: "KETTAMA", events: 9, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&q=60" },
  { name: "Objekt", events: 7, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=60" },
  { name: "Adiel", events: 6, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&q=60" },
];

export type ActivityItem = {
  icon: "wave" | "user" | "dollar" | "calendar";
  text: string;
  time: string;
};

export const recentActivity: ActivityItem[] = [
  {
    icon: "wave",
    text: "Maya was added to ABYSSAL 007",
    time: "1 hour ago",
  },
  {
    icon: "user",
    text: "Objekt confirmed for Night Shift",
    time: "3 hours ago",
  },
  {
    icon: "dollar",
    text: "Deposit received — Warehouse Sessions",
    time: "Yesterday",
  },
  {
    icon: "calendar",
    text: "New draft event created",
    time: "Yesterday",
  },
];
