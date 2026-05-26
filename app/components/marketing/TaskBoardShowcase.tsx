/** Stylized Kanban mock — matches in-app task board aesthetic */
export default function TaskBoardShowcase() {
  const columns = [
    { label: "To Do", tone: "border-[#8B5CF6]/30 bg-[#1A1630]/50", count: 3 },
    { label: "In Progress", tone: "border-[#3B82F6]/25 bg-[#172554]/30", count: 2 },
    { label: "Complete", tone: "border-[#22C55E]/20 bg-[#14532D]/30", count: 5 },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#232330] bg-[#0B0B10] shadow-[0px_30px_80px_rgba(0,0,0,0.55)] ring-1 ring-[#8B5CF6]/15">
      <div className="pointer-events-none absolute -right-10 top-0 size-48 rounded-full bg-[#7C3AED]/20 blur-[70px]" />
      <div className="border-b border-[#232330] bg-[#11111A] px-4 py-2.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#71717A]">
          promosync.app / tasks
        </p>
      </div>
      <div className="grid gap-2 p-3 sm:grid-cols-3">
        {columns.map((col) => (
          <div
            key={col.label}
            className={["rounded-lg border", col.tone].join(" ")}
          >
            <div className="flex items-center justify-between border-b border-[#232330]/60 px-2 py-1.5">
              <span className="text-[10px] font-semibold uppercase text-[#E4E4E7]">{col.label}</span>
              <span className="rounded-full border border-[#3F3F46] px-1.5 text-[9px] text-[#A1A1AA]">
                {col.count}
              </span>
            </div>
            <ul className="space-y-1.5 p-1.5">
              {(col.label === "To Do"
                ? [
                    { event: "Resurrection Sound", title: "Upload venue specs" },
                    { event: "Warehouse 030", title: "Artist deposit due" },
                  ]
                : col.label === "In Progress"
                  ? [{ event: "Sub Club", title: "Confirm headliner travel" }]
                  : [{ event: "Forum Hall", title: "Marketing assets live" }]
              ).map((card) => (
                <li
                  key={card.title}
                  className="rounded-md border border-[#2A2A35] bg-[#11111A] p-2 shadow-sm"
                >
                  <span className="block truncate text-[8px] font-semibold uppercase text-[#C4B5FD]">
                    {card.event}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-medium text-[#F5F5F7]">{card.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[#232330]/80 px-3 py-2">
        <p className="text-[10px] text-[#71717A]">
          <span className="text-[#FCA5A5]">2 overdue</span>
          <span className="mx-2 text-[#3F3F46]">·</span>
          <span className="text-[#FCD34D]">1 waiting</span>
          <span className="mx-2 text-[#3F3F46]">·</span>
          <span className="text-[#86EFAC]">68% complete</span>
        </p>
      </div>
    </div>
  );
}
