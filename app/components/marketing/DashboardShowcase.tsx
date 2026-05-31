import AppBrowserFrame from "@/app/components/marketing/AppBrowserFrame";
import {
  APP_NAV,
  dashboardStats,
  financialOverviewPreview,
  upcomingEventsPreview,
} from "@/lib/marketing/app-screens";

type DashboardShowcaseProps = {
  variant?: "hero" | "compact";
};

/** Dashboard preview — matches `/dashboard` layout and copy. */
export default function DashboardShowcase({ variant = "hero" }: DashboardShowcaseProps) {
  const minH = variant === "hero" ? "min-h-[380px] sm:min-h-[440px]" : "min-h-[300px]";

  return (
    <AppBrowserFrame path="/dashboard" minHeight={minH}>
      <div className="grid flex-1 gap-3 p-3 lg:grid-cols-[168px_1fr]">
        <aside className="hidden rounded-xl border border-[#232330] bg-[#11111A] p-2.5 lg:block">
          <div className="flex items-center gap-2 px-1">
            <img src="/Promosync_icon.svg" alt="" className="size-6 brightness-0 invert" />
            <span className="text-[11px] font-bold text-[#F5F5F7]">PromoSync</span>
          </div>
          <ul className="mt-3 space-y-0.5 text-[10px] text-[#A1A1AA]">
            {APP_NAV.map((item) => (
              <li
                key={item}
                className={[
                  "rounded-md px-2 py-1.5",
                  item === "Dashboard" ? "bg-[#2D2640] font-medium text-[#F5F5F7]" : "",
                ].join(" ")}
              >
                {item}
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] text-[#A1A1AA]">Welcome back, Matt</p>
              <p className="text-[15px] font-bold text-[#F5F5F7]">Here&apos;s what&apos;s happening</p>
            </div>
            <span className="rounded-lg border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] px-3 py-1.5 text-[10px] font-medium text-white">
              + Create Event
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
            {dashboardStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-[#232330] bg-[#11111A] px-2 py-2"
              >
                <p className="text-[8px] font-medium uppercase tracking-wide text-[#71717A]">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-[13px] font-bold tabular-nums text-[#F5F5F7]">
                  {stat.value}
                </p>
                <p
                  className={[
                    "mt-0.5 text-[8px]",
                    stat.hintTone === "positive"
                      ? "text-emerald-400"
                      : stat.hintTone === "warn"
                        ? "text-amber-300"
                        : "text-[#71717A]",
                  ].join(" ")}
                >
                  {stat.hint}
                </p>
              </div>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[#232330] bg-[#11111A] p-2.5">
              <p className="text-[10px] font-semibold text-[#F5F5F7]">Upcoming Events</p>
              <ul className="mt-2 space-y-2">
                {upcomingEventsPreview.map((ev) => (
                  <li
                    key={ev.title}
                    className="flex items-center gap-2 rounded-lg border border-[#232330] bg-[#0B0B10] p-2"
                  >
                    <div className="h-9 w-9 shrink-0 rounded-md border border-[#3F3F46] bg-gradient-to-br from-[#2D2640] to-[#11111A]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-medium text-[#F5F5F7]">{ev.title}</p>
                      <p className="truncate text-[8px] text-[#71717A]">
                        {ev.venue} · {ev.time}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#2D2640] px-1.5 py-0.5 text-[7px] font-semibold text-[#C4B5FD]">
                      {ev.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[#232330] bg-[#11111A] p-2.5">
              <p className="text-[10px] font-semibold text-[#F5F5F7]">Financial Overview</p>
              <ul className="mt-2 space-y-1.5 text-[9px]">
                {financialOverviewPreview.rows.map((row) => (
                  <li key={row.label} className="flex justify-between gap-2 border-b border-[#232330] pb-1 last:border-0">
                    <span className="text-[#A1A1AA]">{row.label}</span>
                    <span
                      className={[
                        "font-semibold tabular-nums",
                        row.highlight ? "text-emerald-400" : "text-[#F5F5F7]",
                      ].join(" ")}
                    >
                      {row.value}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 h-14 overflow-hidden rounded-lg bg-[#0B0B10] ring-1 ring-[#232330]">
                <svg viewBox="0 0 200 56" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
                  <defs>
                    <linearGradient id="mkt-dash-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,48 C 30,42 50,20 80,28 C 110,36 130,8 160,18 C 180,24 190,16 200,12 L 200,56 L 0,56 Z"
                    fill="url(#mkt-dash-fill)"
                  />
                  <path
                    d="M 0,48 C 30,42 50,20 80,28 C 110,36 130,8 160,18 C 180,24 190,16 200,12"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppBrowserFrame>
  );
}
