import {
  currentQuarter,
  dateKeyFromDate,
  parseDateKey,
  quarterBounds,
} from "@/lib/data/seasons";

export type TimeframeId = string;

export type TimeframeBounds = {
  startDateKey: string;
  endDateKey: string;
};

export type TimeframeOption = {
  id: TimeframeId;
  label: string;
  shortLabel: string;
  bounds: TimeframeBounds;
};

function fmtRange(startKey: string, endKey: string) {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  if (!start || !end) return `${startKey} – ${endKey}`;
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function quarterOption(year: number, quarter: 1 | 2 | 3 | 4): TimeframeOption {
  const bounds = quarterBounds(year, quarter);
  return {
    id: `q${quarter}-${year}`,
    label: `Q${quarter} ${year}`,
    shortLabel: `Q${quarter} ${year}`,
    bounds,
  };
}

/** Presets shown in the timeframe dropdown (newest quarters first within year groups). */
export function buildTimeframeOptions(now = new Date()): TimeframeOption[] {
  const year = now.getFullYear();
  const { quarter: currentQ } = currentQuarter();

  const nextQ = currentQ === 4 ? 1 : ((currentQ + 1) as 1 | 2 | 3 | 4);
  const nextYear = currentQ === 4 ? year + 1 : year;

  const thisQBounds = quarterBounds(year, currentQ);
  const nextQBounds = quarterBounds(nextYear, nextQ);

  const yearStart = dateKeyFromDate(new Date(year, 0, 1));
  const yearEnd = dateKeyFromDate(new Date(year, 11, 31));

  const options: TimeframeOption[] = [
    {
      id: "this-quarter",
      label: "This quarter",
      shortLabel: `Q${currentQ} ${year}`,
      bounds: thisQBounds,
    },
    {
      id: "next-quarter",
      label: "Next quarter",
      shortLabel: `Q${nextQ} ${nextYear}`,
      bounds: nextQBounds,
    },
    {
      id: "this-year",
      label: "This year",
      shortLabel: String(year),
      bounds: { startDateKey: yearStart, endDateKey: yearEnd },
    },
  ];

  for (const y of [year, year + 1]) {
    for (let q = 1 as 1 | 2 | 3 | 4; q <= 4; q++) {
      const opt = quarterOption(y, q);
      if (!options.some((o) => o.id === opt.id)) {
        options.push(opt);
      }
    }
  }

  return options;
}

export function defaultTimeframeId(options = buildTimeframeOptions()): TimeframeId {
  return options.find((o) => o.id === "this-quarter")?.id ?? options[0]?.id ?? "this-quarter";
}

export function findTimeframeOption(
  id: TimeframeId,
  options = buildTimeframeOptions(),
): TimeframeOption | null {
  return options.find((o) => o.id === id) ?? null;
}

export function formatTimeframeRange(bounds: TimeframeBounds) {
  return fmtRange(bounds.startDateKey, bounds.endDateKey);
}

export function eventInTimeframe(dateKey: string | undefined, bounds: TimeframeBounds) {
  if (!dateKey) return false;
  return dateKey >= bounds.startDateKey && dateKey <= bounds.endDateKey;
}
