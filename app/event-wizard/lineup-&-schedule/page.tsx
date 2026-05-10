"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Clock,
  Lightbulb,
  MoreVertical,
  Plus,
  Search,
  Wand2,
} from "lucide-react";

import Stepper from "@/app/components/ui/Stepper";
import Button from "@/app/components/ui/Button";
import type { Artist, EnrichedSlot, ScheduleSlot } from "@/lib/types/event-schedule";
import { getArtists, getEventStartForWizard, getInitialScheduleSlots } from "@/lib/data";
import {
  appendSingleFromArtist,
  buildScheduleSummary,
  calculateScheduleTimes,
  duplicateSlotAt,
  formatClock,
  formatDateTimeLine,
  formatDurationMinutes,
  moveSlot,
  removeSlotAt,
  setSlotDurationAt,
  setSlotFeeAt,
} from "@/lib/schedule";

const DURATION_OPTIONS = [30, 45, 60, 90, 120, 180];

function artistMap(artists: Artist[]): Map<string, Artist> {
  return new Map(artists.map((a) => [a.id, a]));
}

export default function LineupSchedulePage() {
  const [query, setQuery] = React.useState("");
  const [library, setLibrary] = React.useState<Artist[]>([]);
  const [scheduleSlots, setScheduleSlots] = React.useState<ScheduleSlot[]>([]);
  const [eventStart, setEventStart] = React.useState<Date>(() => getEventStartForWizard());
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [artists, slots] = await Promise.all([
          getArtists(),
          getInitialScheduleSlots(),
        ]);
        if (cancelled) return;
        setLibrary(artists);
        setScheduleSlots(slots);
        setEventStart(getEventStartForWizard());
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const artistsById = React.useMemo(() => artistMap(library), [library]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return library;
    return library.filter((a) => {
      const hay = [a.name, ...a.genres, ...a.tags].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [library, query]);

  const enriched = React.useMemo(
    () => calculateScheduleTimes(eventStart, scheduleSlots, artistsById),
    [eventStart, scheduleSlots, artistsById]
  );

  const summary = React.useMemo(
    () => buildScheduleSummary(eventStart, enriched),
    [eventStart, enriched]
  );

  const totalArtistAppearances = React.useMemo(
    () =>
      enriched.reduce((n, s) => {
        if (s.kind === "single") return n + 1;
        return n + s.artists.length;
      }, 0),
    [enriched]
  );

  const addArtistToSchedule = React.useCallback((artist: Artist) => {
    setScheduleSlots((prev) => appendSingleFromArtist(prev, artist));
  }, []);

  const onDurationChange = React.useCallback((index: number, minutes: number) => {
    setScheduleSlots((prev) => setSlotDurationAt(prev, index, minutes));
  }, []);

  const onFeeDollarsBlur = React.useCallback((index: number, raw: string) => {
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setScheduleSlots((prev) => setSlotFeeAt(prev, index, Math.round(parsed * 100)));
  }, []);

  const onMoveUp = React.useCallback((index: number) => {
    if (index === 0) return;
    setScheduleSlots((prev) => moveSlot(prev, index, index - 1));
  }, []);

  const onMoveDown = React.useCallback((index: number) => {
    setScheduleSlots((prev) => {
      if (index >= prev.length - 1) return prev;
      return moveSlot(prev, index, index + 1);
    });
  }, []);

  const onDuplicate = React.useCallback((index: number) => {
    setScheduleSlots((prev) => duplicateSlotAt(prev, index));
  }, []);

  const onDelete = React.useCallback((index: number) => {
    setScheduleSlots((prev) => removeSlotAt(prev, index));
  }, []);

  const b2bCount = summary.b2bSetCount;

  if (!ready) {
    return (
      <div className="flex w-full justify-center py-12 text-sm text-[#A1A1AA]">
        Loading lineupâ€¦
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex w-full justify-center">
        <Stepper state="Lineup & Schedule" />
      </div>

      <div className="flex w-full items-start justify-end gap-3">
        <section className="min-w-0 flex-1 rounded-[16px] border border-[#181824] bg-gradient-to-b from-[#11111A] to-[#0D0D14] p-5 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-[24px] font-bold leading-[28px] text-[#F5F5F7]">
                Lineup &amp; Schedule
              </h2>
              <p className="mt-1 max-w-[720px] text-[12px] leading-4 text-[#A1A1AA]">
                Add artists, set durations and build your schedule. Create B2B sets by grouping
                artists in the same time slot.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              <Button variant="ghost" size="md" type="button" className="gap-2" disabled title="Coming soon">
                <Wand2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                Auto Schedule
              </Button>
              <Button
                variant="primary"
                size="md"
                type="button"
                className="gap-2"
                onClick={() => {
                  const first = filtered[0] ?? library[0];
                  if (first) addArtistToSchedule(first);
                }}
                disabled={library.length === 0}
              >
                <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
                Add Artist
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
            <div className="flex min-h-0 flex-col gap-3">
              <div className="rounded-[12px] border border-[#181824] bg-[#0B0B10] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#71717A]">
                  Available artists
                </p>

                <div className="mt-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717A]" />
                    <input
                      id="library-search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search artists..."
                      className="h-10 w-full rounded-lg border border-[#3F3F46] bg-[#11111A] pl-9 pr-3 text-sm text-[#F5F5F7] outline-none placeholder:text-[#71717A] transition-colors hover:border-[#71717A] focus-visible:border-[#8B5CF6] focus-visible:hover:border-[#8B5CF6]"
                    />
                  </div>
                </div>

                <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {filtered.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#232330] bg-[#11111A] px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-[#2A2A38]" />
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-medium leading-5 text-[#F5F5F7]">
                            {a.name}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#3F3F46] text-[#A1A1AA] transition-colors hover:border-[#71717A] hover:bg-[#181824] hover:text-[#F5F5F7]"
                        aria-label={`Add ${a.name}`}
                        onClick={() => addArtistToSchedule(a)}
                      >
                        <Plus className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#3F3F46] bg-transparent px-3 py-2 text-[14px] font-medium text-[#A1A1AA] transition-colors hover:border-[#71717A] hover:text-[#F5F5F7]"
                  onClick={() => document.getElementById("library-search")?.focus()}
                >
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  Add New Artist
                </button>
              </div>

              <div className="rounded-[16px] border border-[#181824] bg-gradient-to-b from-[#11111A] to-[#0D0D14] p-4 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7C3AED33] text-[#A78BFA]">
                    <Lightbulb className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[14px] font-medium leading-5 text-[#F5F5F7]">Tip</p>
                    <p className="text-[14px] leading-5 text-[#A1A1AA]">
                      Drag artists up or down to reorder your lineup.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <div className="rounded-[12px] border border-[#181824] bg-[#0B0B10]">
                <div className="flex items-center justify-between border-b border-[#181824] px-4 py-3">
                  <p className="text-[14px] font-semibold leading-5 text-[#F5F5F7]">
                    Your event schedule{" "}
                    <span className="font-normal text-[#71717A]">
                      ({totalArtistAppearances} artist{totalArtistAppearances === 1 ? "" : "s"})
                    </span>
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] border-collapse">
                    <thead>
                      <tr className="text-left text-[12px] font-medium uppercase tracking-wide text-[#71717A]">
                        <th className="w-10 px-4 py-3" />
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3">Artist(s)</th>
                        <th className="px-4 py-3">Duration</th>
                        <th className="px-4 py-3">Start time</th>
                        <th className="px-4 py-3">End time</th>
                        <th className="px-4 py-3">Fee</th>
                        <th className="w-12 px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {enriched.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-10 text-center text-sm text-[#71717A]">
                            No sets yet â€” add artists from the library.
                          </td>
                        </tr>
                      ) : (
                        enriched.map((row: EnrichedSlot, index: number) => (
                          <tr key={row.slotId} className="border-t border-[#181824]">
                            <td className="px-4 py-3 align-middle">
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#71717A] hover:bg-[#181824] hover:text-[#F5F5F7] disabled:opacity-30"
                                  aria-label="Move up"
                                  disabled={index === 0}
                                  onClick={() => onMoveUp(index)}
                                >
                                  <ArrowUp className="h-4 w-4" strokeWidth={2} />
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#71717A] hover:bg-[#181824] hover:text-[#F5F5F7] disabled:opacity-30"
                                  disabled={index >= enriched.length - 1}
                                  onClick={() => onMoveDown(index)}
                                  aria-label="Move down"
                                >
                                  <ArrowDown className="h-4 w-4" strokeWidth={2} />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 align-middle text-[14px] text-[#F5F5F7]">
                              {row.order}
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <div className="flex flex-col gap-2">
                                {row.kind === "b2b" ? (
                                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#7C3AED55] bg-[#7C3AED22] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#C4B5FD]">
                                    B2B
                                  </div>
                                ) : null}
                                <div className="space-y-1">
                                  {row.kind === "single" ? (
                                    <div className="text-[14px] font-medium text-[#F5F5F7]">
                                      {row.artist.name}
                                    </div>
                                  ) : (
                                    row.artists.map((ar) => (
                                      <div key={ar.artistId} className="text-[14px] font-medium text-[#F5F5F7]">
                                        {ar.name}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <select
                                className="h-10 w-[120px] rounded-lg border border-[#3F3F46] bg-[#11111A] px-3 text-[14px] text-[#F5F5F7] outline-none transition-colors hover:border-[#71717A] focus:border-[#8B5CF6]"
                                value={row.durationMinutes}
                                onChange={(e) => onDurationChange(index, Number(e.target.value))}
                              >
                                {!DURATION_OPTIONS.includes(row.durationMinutes) && (
                                  <option value={row.durationMinutes}>
                                    {formatDurationMinutes(row.durationMinutes)}
                                  </option>
                                )}
                                {DURATION_OPTIONS.map((m) => (
                                  <option key={m} value={m}>
                                    {formatDurationMinutes(m)}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 align-middle text-[14px] text-[#A1A1AA]">
                              {formatClock(row.start)}
                            </td>
                            <td className="px-4 py-3 align-middle text-[14px] text-[#A1A1AA]">
                              {formatClock(row.end)}
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                defaultValue={(row.feeCents / 100).toFixed(2)}
                                key={`${row.slotId}-${row.feeCents}`}
                                className="h-10 w-[108px] rounded-lg border border-[#3F3F46] bg-[#11111A] px-2 text-[14px] text-[#F5F5F7] outline-none"
                                onBlur={(e) => onFeeDollarsBlur(index, e.target.value)}
                              />
                            </td>
                            <td className="px-2 py-3 align-middle">
                              <details className="relative">
                                <summary className="inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md text-[#71717A] hover:bg-[#181824] hover:text-[#F5F5F7] [&::-webkit-details-marker]:hidden">
                                  <MoreVertical className="h-5 w-5" strokeWidth={2} />
                                  <span className="sr-only">Row actions</span>
                                </summary>
                                <div className="absolute right-0 z-10 mt-1 min-w-[140px] rounded-lg border border-[#232330] bg-[#11111A] py-1 text-left text-[13px] shadow-lg">
                                  <button
                                    type="button"
                                    className="block w-full px-3 py-2 text-left text-[#F5F5F7] hover:bg-[#181824]"
                                    onClick={() => onDuplicate(index)}
                                  >
                                    Duplicate
                                  </button>
                                  <button
                                    type="button"
                                    className="block w-full px-3 py-2 text-left text-[#F5F5F7] hover:bg-[#181824]"
                                    onClick={() => onMoveUp(index)}
                                    disabled={index === 0}
                                  >
                                    Move up
                                  </button>
                                  <button
                                    type="button"
                                    className="block w-full px-3 py-2 text-left text-[#F5F5F7] hover:bg-[#181824]"
                                    onClick={() => onMoveDown(index)}
                                    disabled={index >= enriched.length - 1}
                                  >
                                    Move down
                                  </button>
                                  <button
                                    type="button"
                                    className="block w-full px-3 py-2 text-left text-red-400 hover:bg-[#181824]"
                                    onClick={() => onDelete(index)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </details>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-[#181824] p-4">
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#3F3F46] bg-transparent px-3 py-3 text-[14px] font-medium text-[#A1A1AA] transition-colors hover:border-[#71717A] hover:text-[#F5F5F7]"
                    onClick={() => {
                      const first = filtered[0] ?? library[0];
                      if (first) addArtistToSchedule(first);
                    }}
                    disabled={library.length === 0}
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                    Add Artist
                  </button>
                  <p className="mt-2 text-center text-[12px] leading-4 text-[#71717A]">
                    Add another artist to the end of the lineup.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Event start"
                  value={formatDateTimeLine(summary.eventStart)}
                  icon={<Clock className="h-4 w-4 text-[#A1A1AA]" />}
                />
                <StatCard
                  title="Event end (auto)"
                  value={formatDateTimeLine(summary.eventEnd)}
                  icon={<Clock className="h-4 w-4 text-[#A1A1AA]" />}
                />
                <StatCard
                  title="Total run time"
                  value={formatDurationMinutes(summary.totalRuntimeMinutes)}
                  icon={<Clock className="h-4 w-4 text-[#A1A1AA]" />}
                />
                <StatCard
                  title="B2B sets"
                  value={String(b2bCount)}
                  icon={<span className="text-[11px] font-bold text-[#C4B5FD]">B2B</span>}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-[#181824] pt-4">
            <Button variant="ghost" size="md" type="button" className="gap-2">
              <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
              Back
            </Button>
            <div className="ml-auto">
              <Button variant="primary" size="md" type="button" className="gap-2">
                Continue
                <ArrowRight className="h-5 w-5" strokeWidth={2} aria-hidden />
              </Button>
            </div>
          </div>
        </section>

        <aside className="hidden w-[411px] shrink-0 xl:block" aria-hidden />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[12px] border border-[#181824] bg-[#11111A] p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="min-w-0">
          <p className="text-[12px] leading-4 text-[#71717A]">{title}</p>
          <p className="mt-1 text-[14px] font-medium leading-5 text-[#F5F5F7]">{value}</p>
        </div>
      </div>
    </div>
  );
}
