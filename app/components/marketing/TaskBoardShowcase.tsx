import { taskBoardPreview } from "@/lib/marketing/app-screens";

/** Kanban preview — matches `/tasks` columns and card chrome. */
export default function TaskBoardShowcase() {
  const columnTone: Record<string, string> = {
    todo: "border-[#8B5CF6]/30 bg-[#1A1630]/50",
    in_progress: "border-[#3B82F6]/25 bg-[#172554]/30",
    waiting: "border-amber-500/20 bg-amber-950/20",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#232330] bg-[#0B0B10] shadow-[0px_30px_80px_rgba(0,0,0,0.55)] ring-1 ring-[#8B5CF6]/15">
      <div className="pointer-events-none absolute -right-10 top-0 size-48 rounded-full bg-[#7C3AED]/20 blur-[70px]" />
      <div className="border-b border-[#232330] bg-[#11111A] px-4 py-2.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#71717A]">
          promosync.app / tasks
        </p>
      </div>
      <div className="grid gap-2 p-3 sm:grid-cols-3">
        {taskBoardPreview.columns.map((col) => (
          <div key={col.id} className={["rounded-lg border", columnTone[col.id] ?? ""].join(" ")}>
            <div className="flex items-center justify-between border-b border-[#232330]/60 px-2 py-1.5">
              <span className="text-[10px] font-semibold uppercase text-[#E4E4E7]">{col.label}</span>
              <span className="rounded-full border border-[#3F3F46] px-1.5 text-[9px] text-[#A1A1AA]">
                {col.count}
              </span>
            </div>
            <ul className="space-y-1.5 p-1.5">
              {col.cards.map((title) => (
                <li
                  key={title}
                  className="rounded-md border border-[#2A2A35] bg-[#11111A] p-2 shadow-sm"
                >
                  <span className="block truncate text-[8px] font-semibold uppercase text-[#C4B5FD]">
                    4am Kru Live
                  </span>
                  <span className="mt-0.5 block text-[10px] font-medium text-[#F5F5F7]">{title}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[#232330]/80 px-3 py-2">
        <p className="text-[10px] text-[#71717A]">
          <span className="text-[#FCA5A5]">{taskBoardPreview.footer.overdue} overdue</span>
          <span className="mx-2 text-[#3F3F46]">·</span>
          <span className="text-[#FCD34D]">{taskBoardPreview.footer.waiting} waiting</span>
          <span className="mx-2 text-[#3F3F46]">·</span>
          <span className="text-[#86EFAC]">{taskBoardPreview.footer.completePct}% complete</span>
        </p>
      </div>
    </div>
  );
}
