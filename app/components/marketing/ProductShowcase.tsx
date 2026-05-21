import { LayoutDashboard } from "lucide-react";

/** Stylized product UI mock — matches in-app brutalist dark aesthetic */
export default function ProductShowcase({ variant = "hero" }: { variant?: "hero" | "compact" }) {
  const height = variant === "hero" ? "min-h-[340px] sm:min-h-[420px]" : "min-h-[280px]";

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border border-[#232330] bg-[#0B0B10] shadow-[0px_30px_80px_rgba(0,0,0,0.55)] ring-1 ring-[#8B5CF6]/20",
        height,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -left-20 -top-20 size-64 rounded-full bg-[#7C3AED]/25 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-16 -right-10 size-72 rounded-full bg-[#4C1D95]/30 blur-[90px]" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-[#232330] bg-[#11111A] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#3F3F46]" />
            <span className="size-2.5 rounded-full bg-[#3F3F46]" />
            <span className="size-2.5 rounded-full bg-[#3F3F46]" />
          </div>
          <span className="ml-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#71717A]">
            promosync.app / dashboard
          </span>
        </div>

        <div className="grid flex-1 gap-3 p-4 lg:grid-cols-[200px_1fr]">
          <div className="hidden rounded-xl border border-[#232330] bg-[#11111A] p-3 lg:block">
            <div className="flex items-center gap-2">
              <img src="/Promosync_icon.svg" alt="" className="size-6 brightness-0 invert" />
              <span className="text-[12px] font-bold text-[#F5F5F7]">PromoSync</span>
            </div>
            <ul className="mt-4 space-y-2 text-[11px] text-[#A1A1AA]">
              <li className="rounded-md bg-[#2D2640] px-2 py-1.5 text-[#F5F5F7]">Dashboard</li>
              <li className="px-2 py-1.5">Events</li>
              <li className="px-2 py-1.5">Venues</li>
              <li className="px-2 py-1.5">Artists</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#71717A]">Welcome back</p>
                <p className="text-[18px] font-bold text-[#F5F5F7]">Underground Series</p>
              </div>
              <span className="rounded-lg border border-[#8B5CF6]/40 bg-[#7C3AED]/20 px-3 py-1.5 text-[11px] font-medium text-[#C4B5FD]">
                + Create Event
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Upcoming", value: "6" },
                { label: "Confirmed", value: "4" },
                { label: "Profit", value: "£12.4k" },
                { label: "Revenue", value: "£48k" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-[#232330] bg-[#11111A] px-3 py-2.5"
                >
                  <p className="text-[10px] uppercase tracking-wide text-[#71717A]">{stat.label}</p>
                  <p className="mt-1 text-[15px] font-bold text-[#F5F5F7]">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-[#232330] bg-[#11111A] p-3">
                <p className="text-[10px] uppercase tracking-wide text-[#71717A]">Upcoming</p>
                <div className="mt-2 space-y-2">
                  {["Warehouse 030", "Sub Club", "Forum Hall"].map((ev) => (
                    <div key={ev} className="flex items-center justify-between text-[11px]">
                      <span className="text-[#E4E4E7]">{ev}</span>
                      <span className="text-[#86EFAC]">Active</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-[#232330] bg-[#11111A] p-3">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="size-4 text-[#8B5CF6]" />
                  <p className="text-[10px] uppercase tracking-wide text-[#71717A]">Financial</p>
                </div>
                <div className="mt-3 flex h-20 items-end gap-1">
                  {[40, 65, 55, 80, 70, 90, 60].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-[#7C3AED] to-[#8B5CF6]/40"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
