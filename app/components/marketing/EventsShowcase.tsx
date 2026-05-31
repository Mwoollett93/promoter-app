import AppBrowserFrame from "@/app/components/marketing/AppBrowserFrame";
import { eventStatusCounts } from "@/lib/marketing/app-screens";

/** Events management preview — matches `/events` status cards and table. */
export default function EventsShowcase() {
  const toneClass = {
    active: "text-[#C4B5FD] bg-[#8B5CF6]/12 border-[#8B5CF6]/25",
    draft: "text-[#D4D4D8] bg-[#27272F]/70 border-[#3F3F46]",
    canceled: "text-[#FCA5A5] bg-red-500/10 border-red-500/20",
    completed: "text-[#86EFAC] bg-emerald-500/10 border-emerald-500/20",
  };

  return (
    <AppBrowserFrame path="/events" minHeight="min-h-[340px]">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-[18px] font-bold text-[#F5F5F7]">Events</h3>
            <p className="text-[10px] text-[#A1A1AA]">
              Track every draft, active, canceled, and completed event from one place.
            </p>
          </div>
          <span className="rounded-lg border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] px-3 py-1.5 text-[10px] font-medium text-white">
            Create New Event
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {eventStatusCounts.map((card) => (
            <div
              key={card.label}
              className={["rounded-xl border p-3", toneClass[card.tone]].join(" ")}
            >
              <p className="text-[9px] uppercase tracking-wide">{card.label}</p>
              <p className="mt-1 text-[22px] font-bold tabular-nums text-[#F5F5F7]">{card.count}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#232330]">
          <table className="w-full min-w-[480px] text-left text-[10px]">
            <thead className="bg-[#11111A] text-[#71717A]">
              <tr>
                <th className="px-3 py-2 font-medium">Event</th>
                <th className="px-3 py-2 font-medium">Venue</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">P/L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232330] bg-[#0B0B10]">
              {[
                ["Mall Grab", "Club 121", "Active", "$12,400"],
                ["4am Kru Live @ Red Square", "Red Square", "Active", "−$3,865"],
                ["Lamb of God @ Wellington Stadium", "Wellington Stadium", "Active", "$48,200"],
              ].map(([name, venue, status, pl]) => (
                <tr key={name}>
                  <td className="px-3 py-2 font-medium text-[#F5F5F7]">{name}</td>
                  <td className="px-3 py-2 text-[#A1A1AA]">{venue}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-[#2D2640] px-2 py-0.5 text-[9px] text-[#C4B5FD]">
                      {status}
                    </span>
                  </td>
                  <td className="px-3 py-2 tabular-nums text-emerald-400">{pl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppBrowserFrame>
  );
}
