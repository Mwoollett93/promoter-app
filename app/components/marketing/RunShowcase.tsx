import AppBrowserFrame from "@/app/components/marketing/AppBrowserFrame";
import { runShowsPreview, runSummary } from "@/lib/marketing/app-screens";

/** Run overview preview — matches `/run` KPI strip and monthly timeline. */
export default function RunShowcase() {
  return (
    <AppBrowserFrame path="/run" minHeight="min-h-[380px]">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-[18px] font-bold text-[#F5F5F7]">Run</h3>
            <p className="text-[10px] text-[#A1A1AA]">This year · 1 Jan – 31 Dec 2026</p>
          </div>
          <span className="rounded-lg border border-[#3F3F46] bg-[#11111A] px-2 py-1 text-[10px] text-[#E4E4E7]">
            This year ▾
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
          {runSummary.map((item) => (
            <div key={item.label} className="rounded-lg border border-[#232330] bg-[#11111A] px-2 py-2">
              <p className="text-[8px] uppercase tracking-wide text-[#71717A]">{item.label}</p>
              <p
                className={[
                  "mt-0.5 text-[12px] font-bold tabular-nums",
                  item.accent === "positive" ? "text-emerald-400" : "text-[#F5F5F7]",
                ].join(" ")}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[1fr_120px]">
          <div className="rounded-xl border border-[#232330] bg-[#11111A] p-2.5">
            <p className="text-[10px] font-semibold text-[#F5F5F7]">Upcoming shows</p>
            <ul className="mt-2 space-y-2">
              {runShowsPreview.map((show) => (
                <li key={show.title}>
                  <p className="text-[8px] font-semibold uppercase text-[#8B5CF6]">{show.month}</p>
                  <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-[#232330] bg-[#0B0B10] p-2">
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-medium text-[#F5F5F7]">{show.title}</p>
                      <p className="text-[8px] text-[#71717A]">{show.venue}</p>
                    </div>
                    <span className="shrink-0 text-[9px] tabular-nums text-emerald-400">{show.pl}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <div className="rounded-xl border border-[#232330] bg-[#11111A] p-2">
              <p className="text-[9px] font-semibold text-[#A1A1AA]">Monthly P/L</p>
              <ul className="mt-1.5 space-y-1 text-[8px]">
                {["May $12.4k", "Jun −$3.9k", "Sep $48.2k"].map((row) => (
                  <li key={row} className="flex justify-between text-[#E4E4E7]">
                    <span>{row.split(" ")[0]}</span>
                    <span className="tabular-nums text-emerald-400">{row.split(" ")[1]}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-[#232330] bg-[#11111A] p-2">
              <p className="text-[9px] font-semibold text-[#F5F5F7]">Operational risks</p>
              <p className="mt-1 text-[8px] leading-3 text-[#71717A]">Artist deposit due · margin below break-even</p>
            </div>
          </div>
        </div>
      </div>
    </AppBrowserFrame>
  );
}
