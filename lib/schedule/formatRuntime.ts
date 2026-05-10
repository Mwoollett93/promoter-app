/** `"7h 30m"` / `"45m"` for summary UI. */
export function formatDurationMinutes(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) {
    return "0m";
  }
  const rounded = Math.round(totalMinutes);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** e.g. `"10:00 PM"` — uses runtime locale. */
export function formatClock(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** e.g. `"10:00 PM, 24 May 2026"` — uses runtime locale. */
export function formatDateTimeLine(date: Date): string {
  const time = formatClock(date);
  const datePart = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${time}, ${datePart}`;
}
