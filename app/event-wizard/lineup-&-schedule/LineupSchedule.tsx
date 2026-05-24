"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Artist, EnrichedSlot, ScheduleSlot } from "@/lib/types/event-schedule";
import { getArtists, getEventStartForWizard, getInitialScheduleSlots } from "@/lib/data";
import {
  addArtistToB2BSlot,
  appendSingleFromArtist,
  buildScheduleSummary,
  calculateScheduleTimes,
  duplicateSlotAt,
  formatClock,
  formatDateTimeLine,
  formatDurationMinutes,
  mergeAdjacentSinglesIntoB2B,
  moveSlot,
  pairSingleWithArtist,
  removeSlotAt,
  setSlotDurationAt,
  setSlotFeeAt,
  ungroupB2BAt,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";

type LineupScheduleProps = {
  /** Override wizard event start; defaults to `getEventStartForWizard()`. */
  eventStart?: Date;
  className?: string;
};

const DURATION_OPTIONS = [30, 45, 60, 90, 120, 180];

function buildArtistMap(artists: Artist[]): Map<string, Artist> {
  return new Map(artists.map((a) => [a.id, a]));
}

export function LineupSchedule({ eventStart: eventStartProp, className }: LineupScheduleProps) {
  const [mounted, setMounted] = useState(false);
  const [artistLibrary, setArtistLibrary] = useState<Artist[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventStart, setEventStart] = useState<Date>(() => eventStartProp ?? getEventStartForWizard());

  useEffect(() => {
    setMounted(true);
    if (eventStartProp) {
      setEventStart(eventStartProp);
    }
  }, [eventStartProp]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [artists, slots] = await Promise.all([
          getArtists(),
          getInitialScheduleSlots(),
        ]);
        if (cancelled) return;
        setArtistLibrary(artists);
        setScheduleSlots(slots);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const artistsById = useMemo(() => buildArtistMap(artistLibrary), [artistLibrary]);

  const filteredLibrary = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return artistLibrary;
    return artistLibrary.filter((a) => {
      const hay = [
        a.name,
        ...a.genres,
        ...a.tags,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [artistLibrary, searchQuery]);

  const enrichedSlots = useMemo(
    () => calculateScheduleTimes(eventStart, scheduleSlots, artistsById),
    [eventStart, scheduleSlots, artistsById]
  );

  const summary = useMemo(
    () => buildScheduleSummary(eventStart, enrichedSlots),
    [eventStart, enrichedSlots]
  );

  const addArtistFromLibrary = useCallback(
    (artist: Artist) => {
      setScheduleSlots((prev) => appendSingleFromArtist(prev, artist));
    },
    []
  );

  const onDurationChange = useCallback((index: number, minutes: number) => {
    setScheduleSlots((prev) => setSlotDurationAt(prev, index, minutes));
  }, []);

  const onFeeDollarsChange = useCallback((index: number, dollars: string) => {
    const parsed = Number.parseFloat(dollars);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    const cents = Math.round(parsed * 100);
    setScheduleSlots((prev) => setSlotFeeAt(prev, index, cents));
  }, []);

  const onDuplicate = useCallback((index: number) => {
    setScheduleSlots((prev) => duplicateSlotAt(prev, index));
  }, []);

  const onDelete = useCallback((index: number) => {
    setScheduleSlots((prev) => removeSlotAt(prev, index));
  }, []);

  const onMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setScheduleSlots((prev) => moveSlot(prev, index, index - 1));
  }, []);

  const onMoveDown = useCallback((index: number) => {
    setScheduleSlots((prev) => {
      if (index >= prev.length - 1) return prev;
      return moveSlot(prev, index, index + 1);
    });
  }, []);

  const onMergeWithNext = useCallback((index: number) => {
    setScheduleSlots((prev) => mergeAdjacentSinglesIntoB2B(prev, index));
  }, []);

  const onUngroup = useCallback((index: number) => {
    setScheduleSlots((prev) => ungroupB2BAt(prev, index));
  }, []);

  const onPairWithArtist = useCallback((slotIndex: number, secondArtistId: string) => {
    setScheduleSlots((prev) => pairSingleWithArtist(prev, slotIndex, secondArtistId));
  }, []);

  const onAddToB2B = useCallback((b2bIndex: number, artistId: string) => {
    setScheduleSlots((prev) => addArtistToB2BSlot(prev, b2bIndex, artistId));
  }, []);

  if (!mounted) {
    return (
      <div className={cn("rounded-lg border border-border p-6 text-sm text-muted-foreground", className)}>
        Loading lineupâ€¦
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6 lg:flex-row", className)}>
      <aside className="lg:w-80 shrink-0 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Available artists
          </label>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artistsâ€¦"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-md border border-border p-2">
          {filteredLibrary.map((artist) => (
            <div
              key={artist.id}
              className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-2 text-sm"
            >
              <span className="truncate font-medium">{artist.name}</span>
              <button
                type="button"
                className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                onClick={() => addArtistFromLibrary(artist)}
              >
                Add
              </button>
            </div>
          ))}
          {filteredLibrary.length === 0 && (
            <p className="px-1 py-4 text-center text-sm text-muted-foreground">No matches.</p>
          )}
        </div>
        <p className="rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          Tip: reorder sets in the schedule to recalc times. Durations push following acts.
        </p>
      </aside>

      <section className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            Your event schedule ({enrichedSlots.length} sets)
          </h2>
          <button
            type="button"
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            disabled
            title="Coming soon"
          >
            Auto schedule
          </button>
        </div>

        {enrichedSlots.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            No sets yet â€” add artists from the library.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Artist(s)</th>
                  <th className="px-3 py-2">Duration</th>
                  <th className="px-3 py-2">Start</th>
                  <th className="px-3 py-2">End</th>
                  <th className="px-3 py-2">Fee</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrichedSlots.map((slot: EnrichedSlot, index) => (
                  <ScheduleTableRow
                    key={slot.slotId}
                    slot={slot}
                    index={index}
                    artistLibrary={artistLibrary}
                    onDurationChange={onDurationChange}
                    onFeeDollarsChange={onFeeDollarsChange}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    onMergeWithNext={onMergeWithNext}
                    onUngroup={onUngroup}
                    onPairWithArtist={onPairWithArtist}
                    onAddToB2B={onAddToB2B}
                    lastIndex={enrichedSlots.length - 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="flex flex-wrap gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Event start</div>
            <div className="font-medium">{formatDateTimeLine(summary.eventStart)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Event end</div>
            <div className="font-medium">{formatDateTimeLine(summary.eventEnd)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total runtime</div>
            <div className="font-medium">{formatDurationMinutes(summary.totalRuntimeMinutes)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">B2B sets</div>
            <div className="font-medium">
              {summary.b2bSetCount === 0 ? "None" : summary.b2bSetCount}
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}

type RowProps = {
  slot: EnrichedSlot;
  index: number;
  lastIndex: number;
  artistLibrary: Artist[];
  onDurationChange: (index: number, minutes: number) => void;
  onFeeDollarsChange: (index: number, dollars: string) => void;
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onMergeWithNext: (index: number) => void;
  onUngroup: (index: number) => void;
  onPairWithArtist: (index: number, secondArtistId: string) => void;
  onAddToB2B: (index: number, artistId: string) => void;
};

function ScheduleTableRow(props: RowProps) {
  const {
    slot,
    index,
    lastIndex,
    artistLibrary,
    onDurationChange,
    onFeeDollarsChange,
    onDuplicate,
    onDelete,
    onMoveUp,
    onMoveDown,
    onMergeWithNext,
    onUngroup,
    onPairWithArtist,
    onAddToB2B,
  } = props;

  const feeDollars = (slot.feeCents / 100).toFixed(2);

  const names =
    slot.kind === "single"
      ? slot.artist.name
      : slot.artists.map((a) => a.name).join(" \u00b7 ");

  const b2bPairOptions = artistLibrary.filter((a) =>
    slot.kind === "single"
      ? a.id !== slot.artistId
      : !slot.artistIds.includes(a.id)
  );

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2 align-top font-medium">{slot.order}</td>
      <td className="px-3 py-2 align-top">
        <div className="flex flex-col gap-1">
          <span>{names}</span>
          {slot.kind === "b2b" && (
            <span className="w-fit rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
              B2B
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2 align-top">
        <select
          className="rounded-md border border-input bg-background px-2 py-1 text-xs"
          value={slot.durationMinutes}
          onChange={(e) => onDurationChange(index, Number(e.target.value))}
        >
          {!DURATION_OPTIONS.includes(slot.durationMinutes) && (
            <option value={slot.durationMinutes}>
              {formatDurationMinutes(slot.durationMinutes)}
            </option>
          )}
          {DURATION_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {formatDurationMinutes(m)}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2 align-top tabular-nums">{formatClock(slot.start)}</td>
      <td className="px-3 py-2 align-top tabular-nums">{formatClock(slot.end)}</td>
      <td className="px-3 py-2 align-top">
        <input
          type="number"
          step="0.01"
          min={0}
          defaultValue={feeDollars}
          key={`${slot.slotId}-${feeDollars}`}
          className="w-24 rounded-md border border-input bg-background px-2 py-1 text-xs"
          onBlur={(e) => onFeeDollarsChange(index, e.target.value)}
        />
      </td>
      <td className="px-3 py-2 align-top text-right">
        <div className="flex flex-wrap justify-end gap-1">
          <button
            type="button"
            className="rounded border border-border px-1.5 py-0.5 text-[11px] hover:bg-muted"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
          >
            Up
          </button>
          <button
            type="button"
            className="rounded border border-border px-1.5 py-0.5 text-[11px] hover:bg-muted"
            onClick={() => onMoveDown(index)}
            disabled={index >= lastIndex}
          >
            Down
          </button>
          <button
            type="button"
            className="rounded border border-border px-1.5 py-0.5 text-[11px] hover:bg-muted"
            onClick={() => onDuplicate(index)}
          >
            Dup
          </button>
          <button
            type="button"
            className="rounded border border-destructive/40 px-1.5 py-0.5 text-[11px] text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(index)}
          >
            Del
          </button>
        </div>
        <div className="mt-2 space-y-1 text-left">
          {slot.kind === "single" && (
            <>
              <label className="block text-[10px] text-muted-foreground">Pair as B2B</label>
              <select
                className="w-full rounded-md border border-input bg-background px-2 py-1 text-[11px]"
                defaultValue=""
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) onPairWithArtist(index, v);
                  e.target.selectedIndex = 0;
                }}
              >
                <option value="">Pick artistâ€¦</option>
                {b2bPairOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </>
          )}
          {slot.kind === "single" && index < lastIndex && (
            <button
              type="button"
              className="mt-1 w-full rounded border border-primary/30 px-2 py-1 text-[11px] text-primary hover:bg-primary/10"
              onClick={() => onMergeWithNext(index)}
            >
              Merge with next â†’ B2B
            </button>
          )}
          {slot.kind === "b2b" && (
            <>
              <button
                type="button"
                className="mt-1 w-full rounded border border-border px-2 py-1 text-[11px] hover:bg-muted"
                onClick={() => onUngroup(index)}
              >
                Ungroup B2B
              </button>
              <label className="mt-1 block text-[10px] text-muted-foreground">Add to B2B</label>
              <select
                className="w-full rounded-md border border-input bg-background px-2 py-1 text-[11px]"
                defaultValue=""
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) onAddToB2B(index, v);
                  e.target.selectedIndex = 0;
                }}
              >
                <option value="">Pick artistâ€¦</option>
                {b2bPairOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
