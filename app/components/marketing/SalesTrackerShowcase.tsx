import AppBrowserFrame from "@/app/components/marketing/AppBrowserFrame";
import { EVENT_WORKSPACE_TABS, salesKpis } from "@/lib/marketing/app-screens";

/** Sales Tracker tab preview — matches event workspace sales cockpit. */
export default function SalesTrackerShowcase() {
  return (
    <AppBrowserFrame path="/events/…/workspace?tab=sales" minHeight="min-h-[360px]">
      <div className="flex flex-col gap-2.5 p-4">
        <div>
          <p className="text-[10px] text-[#8B5CF6]">4am Kru Live @ Red Square</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {EVENT_WORKSPACE_TABS.map((tab) => (
              <span
                key={tab}
                className={[
                  "rounded-md px-2 py-1 text-[9px] font-medium",
                  tab === "Sales Tracker"
                    ? "bg-[#2D2640] text-[#C4B5FD]"
                    : "text-[#71717A]",
                ].join(" ")}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>

        <p className="text-[9px] font-semibold uppercase tracking-wide text-[#8B5CF6]">
          Ticket sales monitoring
        </p>

        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {salesKpis.map((kpi) => (
            <div key={kpi.label} className="rounded-lg border border-[#232330] bg-[#11111A] px-2 py-1.5">
              <p className="text-[7px] uppercase tracking-wide text-[#71717A]">{kpi.label}</p>
              <p className="mt-0.5 text-[11px] font-bold tabular-nums text-[#F5F5F7]">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="grid flex-1 gap-2 sm:grid-cols-3">
          {["Break-even progress", "Tickets sold over time", "Revenue / velocity"].map((title) => (
            <div
              key={title}
              className="flex min-h-[72px] flex-col rounded-xl border border-[#232330] bg-[#11111A] p-2"
            >
              <p className="text-[9px] font-semibold text-[#F5F5F7]">{title}</p>
              <div className="mt-auto h-10 overflow-hidden rounded-md bg-[#0B0B10] ring-1 ring-[#232330]">
                <svg viewBox="0 0 120 40" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
                  <path
                    d="M 0,36 C 20,30 40,8 60,18 C 80,28 100,12 120,8 L 120,40 L 0,40 Z"
                    fill="rgba(139,92,246,0.2)"
                  />
                  <path
                    d="M 0,36 C 20,30 40,8 60,18 C 80,28 100,12 120,8"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-[#232330] bg-[#11111A] p-2">
            <p className="text-[9px] font-semibold text-[#F5F5F7]">Recent checkpoints</p>
            <p className="mt-1 text-[8px] text-[#A1A1AA]">190 sold · RA · Net $1,700</p>
          </div>
          <div className="rounded-xl border border-[#232330] bg-[#11111A] p-2">
            <p className="text-[9px] font-semibold text-[#F5F5F7]">Ticket tiers</p>
            <p className="mt-1 text-[8px] text-[#71717A]">Import CSV with tier rows</p>
          </div>
        </div>
      </div>
    </AppBrowserFrame>
  );
}
