"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  ChevronDown,
  GripVertical,
  Lightbulb,
  MoreVertical,
  Plus,
  Search,
  ArrowUpDown,
} from "lucide-react";

import { LineupPermissionBanner } from "@/app/components/collaboration/PermissionBanner";
import Button from "@/app/components/ui/Button";
import ScheduleSummaryStrip from "@/app/components/ui/ScheduleSummaryStrip";
import Stepper from "@/app/components/ui/Stepper";
import type { Artist, EnrichedSlot, ScheduleSlot } from "@/lib/types/event-schedule";
import {
  getArtists,
  getEventStartForWizard,
  getInitialScheduleSlots,
  getWizardEventStartOrFallback,
  loadWizardScheduleSlots,
  saveWizardScheduleSlots,
} from "@/lib/data";
import {
  appendSingleFromArtist,
  buildScheduleSummary,
  calculateScheduleTimes,
  computeScheduleDropHover,
  duplicateSlotAt,
  formatClock,
  formatDurationMinutes,
  mergeDraggedIntoTarget,
  moveSlot,
  moveSlotInsertBefore,
  removeSlotAt,
  setSlotDurationAt,
  setSlotFeeAt,
  ungroupB2BAt,
  type ScheduleDropHover,
} from "@/lib/schedule";
import {
  getStoredSession,
  getSupabaseConfig,
  listArtists,
} from "@/lib/supabase/browser";
import ArtistAvatar from "@/app/components/artists/ArtistAvatar";
import { sanitizeArtistImageUrl } from "@/lib/ai/artist-image";
import { useWorkspace } from "@/lib/collaboration/WorkspaceContext";
import type { ArtistProfile } from "@/lib/types/artist";

const DURATION_OPTIONS = [30, 45, 60, 90, 120, 180];

function artistMap(artists: Artist[]): Map<string, Artist> {
  return new Map(artists.map((a) => [a.id, a]));
}

function artistProfileToScheduleArtist(profile: ArtistProfile): Artist {
  return {
    id: profile.id,
    name: profile.name,
    avatarUrl: sanitizeArtistImageUrl(profile.promoImageUrl),
    genres: profile.genres,
    tags: profile.tags,
    defaultFeeCents: profile.typicalFeeCents,
  };
}

function slotArtistIds(slot: ScheduleSlot): string[] {
  return slot.kind === "single" ? [slot.artistId] : slot.artistIds;
}

function filterSlotsForLibrary(slots: ScheduleSlot[], artists: Artist[]) {
  const ids = new Set(artists.map((artist) => artist.id));
  return slots.filter((slot) => slotArtistIds(slot).every((artistId) => ids.has(artistId)));
}

function hydrateSlotFeesFromLibrary(slots: ScheduleSlot[], artists: Artist[]) {
  const feesByArtistId = new Map(artists.map((artist) => [artist.id, artist.defaultFeeCents]));

  return slots.map((slot) => {
    if (slot.feeCents > 0) return slot;

    if (slot.kind === "single") {
      return {
        ...slot,
        feeCents: feesByArtistId.get(slot.artistId) ?? slot.feeCents,
      };
    }

    const derivedFee = slot.artistIds.reduce((sum, artistId) => sum + (feesByArtistId.get(artistId) ?? 0), 0);
    return {
      ...slot,
      feeCents: derivedFee > 0 ? derivedFee : slot.feeCents,
    };
  });
}

async function getSupabaseScheduleArtists(workspaceId: string): Promise<Artist[]> {
  const session = getStoredSession();
  if (!session || !getSupabaseConfig()) return [];

  try {
    return (await listArtists(session, workspaceId))
      .filter((artist) => artist.status !== "archived")
      .map(artistProfileToScheduleArtist);
  } catch {
    return [];
  }
}

function splitTimeAndCalendarDate(date: Date) {
  return {
    time: formatClock(date),
    dateLine: date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
}

function durationParts(minutes: number): { h?: string; m?: string } {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return { h: `${h}h`, m: `${m}m` };
  if (h > 0) return { h: `${h}h` };
  return { m: `${m}m` };
}

export default function LineupSchedulePage() {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id;
  const [query, setQuery] = React.useState("");
  const [library, setLibrary] = React.useState<Artist[]>([]);
  const [scheduleSlots, setScheduleSlots] = React.useState<ScheduleSlot[]>([]);
  /* SSR/hydration: default matches server; client applies Event Basics draft in layout effect */
  const [eventStart, setEventStart] = React.useState<Date>(() => getEventStartForWizard());
  const [ready, setReady] = React.useState(false);
  const [openMenuIndex, setOpenMenuIndex] = React.useState<number | null>(null);
  const [scheduleDrag, setScheduleDrag] = React.useState<null | {
    fromIndex: number;
    x: number;
    y: number;
  }>(null);
  const [dropHover, setDropHover] = React.useState<ScheduleDropHover | null>(null);
  const rowElsRef = React.useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollListRef = React.useRef<HTMLDivElement>(null);
  const draggingFromRef = React.useRef<number | null>(null);
  const lastDragPointerRef = React.useRef({ x: 0, y: 0 });
  const autoScrollRafRef = React.useRef<number | null>(null);
  const updateDropHoverRef = React.useRef<
    (clientX: number, clientY: number, fromIndex: number) => void
  >(() => {});

  const registerRowEl = React.useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) rowElsRef.current.set(index, el);
    else rowElsRef.current.delete(index);
  }, []);

  React.useLayoutEffect(() => {
    setEventStart(getWizardEventStartOrFallback());
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [artists, fixtureSlots] = await Promise.all([
          getArtists(),
          getInitialScheduleSlots(),
        ]);
        const supabaseArtists = workspaceId ? await getSupabaseScheduleArtists(workspaceId) : [];
        const artistLibrary = supabaseArtists.length > 0 ? supabaseArtists : artists;
        if (cancelled) return;
        const persistedSlots = loadWizardScheduleSlots();
        const fallbackSlots = supabaseArtists.length > 0 ? [] : fixtureSlots;
        const slots = persistedSlots !== null ? persistedSlots : fallbackSlots;
        const normalizedSlots = hydrateSlotFeesFromLibrary(filterSlotsForLibrary(slots, artistLibrary), artistLibrary);
        setLibrary(artistLibrary);
        setScheduleSlots(normalizedSlots);
        setEventStart(getWizardEventStartOrFallback());
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  /** Keep lineup edits when jumping to Event Basics and back (session-only). */
  React.useEffect(() => {
    if (!ready) return;
    saveWizardScheduleSlots(scheduleSlots);
  }, [scheduleSlots, ready]);

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

  const onUngroup = React.useCallback((index: number) => {
    setScheduleSlots((prev) => ungroupB2BAt(prev, index));
    setOpenMenuIndex(null);
  }, []);

  const updateDropHover = React.useCallback(
    (clientX: number, clientY: number, fromIndex: number) => {
      const slot = scheduleSlots[fromIndex];
      if (!slot) {
        setDropHover(null);
        return;
      }
      const draggedIsSingle = slot.kind === "single";
      const h = computeScheduleDropHover(
        clientX,
        clientY,
        scrollListRef.current,
        enriched.length,
        fromIndex,
        draggedIsSingle,
        (i) => rowElsRef.current.get(i)
      );
      setDropHover(h);
    },
    [scheduleSlots, enriched.length]
  );

  React.useLayoutEffect(() => {
    updateDropHoverRef.current = updateDropHover;
  }, [updateDropHover]);

  const stopDragAutoScroll = React.useCallback(() => {
    if (autoScrollRafRef.current != null) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  /** Scroll schedule list when pointer is near top/bottom edge while dragging */
  const runDragAutoScroll = React.useCallback(() => {
    autoScrollRafRef.current = null;
    const el = scrollListRef.current;
    const from = draggingFromRef.current;
    if (!el || from == null) return;

    const { x, y } = lastDragPointerRef.current;
    const r = el.getBoundingClientRect();
    const EDGE = 52;
    const STEP = 14;
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);

    const inTopEdge = y < r.top + EDGE;
    const inBottomEdge = y > r.bottom - EDGE;

    if (inTopEdge && el.scrollTop > 0) {
      el.scrollTop = Math.max(0, el.scrollTop - STEP);
    } else if (inBottomEdge && el.scrollTop < maxScroll) {
      el.scrollTop = Math.min(maxScroll, el.scrollTop + STEP);
    }

    updateDropHoverRef.current(x, y, from);

    const canScrollUp = inTopEdge && el.scrollTop > 0;
    const canScrollDown = inBottomEdge && el.scrollTop < maxScroll;
    if (draggingFromRef.current != null && (canScrollUp || canScrollDown)) {
      autoScrollRafRef.current = requestAnimationFrame(runDragAutoScroll);
    }
  }, []);

  React.useEffect(() => () => stopDragAutoScroll(), [stopDragAutoScroll]);

  const handleGripPointerDown = React.useCallback(
    (e: React.PointerEvent, index: number) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      draggingFromRef.current = index;
      setOpenMenuIndex(null);
      lastDragPointerRef.current = { x: e.clientX, y: e.clientY };
      setScheduleDrag({ fromIndex: index, x: e.clientX, y: e.clientY });
      updateDropHover(e.clientX, e.clientY, index);
    },
    [updateDropHover]
  );

  const handleGripPointerMove = React.useCallback(
    (e: React.PointerEvent, index: number) => {
      if (draggingFromRef.current !== index) return;
      lastDragPointerRef.current = { x: e.clientX, y: e.clientY };
      setScheduleDrag({ fromIndex: index, x: e.clientX, y: e.clientY });
      updateDropHover(e.clientX, e.clientY, index);

      const scrollEl = scrollListRef.current;
      if (scrollEl) {
        const r = scrollEl.getBoundingClientRect();
        const EDGE = 52;
        const inEdge = e.clientY < r.top + EDGE || e.clientY > r.bottom - EDGE;
        if (inEdge && autoScrollRafRef.current == null) {
          autoScrollRafRef.current = requestAnimationFrame(runDragAutoScroll);
        }
        if (!inEdge) stopDragAutoScroll();
      }
    },
    [updateDropHover, runDragAutoScroll, stopDragAutoScroll]
  );

  const handleGripPointerUp = React.useCallback((e: React.PointerEvent, index: number) => {
    if (draggingFromRef.current !== index) return;
    stopDragAutoScroll();
    draggingFromRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    const fromIndex = index;
    setScheduleSlots((prev) => {
      const slot = prev[fromIndex];
      if (!slot) return prev;
      const draggedIsSingle = slot.kind === "single";
      const h = computeScheduleDropHover(
        e.clientX,
        e.clientY,
        scrollListRef.current,
        prev.length,
        fromIndex,
        draggedIsSingle,
        (i) => rowElsRef.current.get(i)
      );
      if (!h) return prev;
      if (h.kind === "insert") return moveSlotInsertBefore(prev, fromIndex, h.before);
      return mergeDraggedIntoTarget(prev, fromIndex, h.target);
    });
    setScheduleDrag(null);
    setDropHover(null);
  }, [stopDragAutoScroll]);

  const handleGripPointerCancel = React.useCallback(
    (e: React.PointerEvent, index: number) => {
      if (draggingFromRef.current !== index) return;
      stopDragAutoScroll();
      draggingFromRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* */
      }
      setScheduleDrag(null);
      setDropHover(null);
    },
    [stopDragAutoScroll]
  );

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const eventStartParts = splitTimeAndCalendarDate(summary.eventStart);
  const eventEndParts = splitTimeAndCalendarDate(summary.eventEnd);

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
      <LineupPermissionBanner />

      <div className="flex w-full min-w-0 items-start">
        {/* Figma node `117:2835` â€” Lineup & Schedule card (full width of main column) */}
        <section
          className="flex w-full min-w-0 flex-col gap-3 rounded-[16px] border border-[#181824] bg-gradient-to-b from-[#11111A] to-[#0D0D14] p-5 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.4)]"
          data-node-id="117:2835"
        >
          <div className="flex w-full flex-col gap-3 overflow-hidden">
            <h2 className="text-[18px] font-bold leading-6 text-white">
              Lineup &amp; Schedule
            </h2>
            <p className="text-center text-[12px] leading-4 text-[#A1A1AA] lg:text-left">
              Add artists, set durations and build your schedule. Create B2B sets by grouping artists in
              the same time slot.
            </p>
          </div>

          {/* Two columns â€” `117:2835` / Available Artists & Schedule */}
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start">
            {/* AVAILABLE ARTISTS */}
            <div className="flex w-full shrink-0 flex-col gap-2.5 rounded-md border border-[#232330] bg-gradient-to-b from-[#11111A] to-[#0D0D14] p-2.5 lg:w-[228px]">
              <p className="text-[14px] leading-5 text-[#F5F5F7]">AVAILABLE ARTISTS</p>

              <div className="relative h-9 w-full max-w-[201px]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-5 -translate-y-1/2 text-[#71717A]" />
                <input
                  id="library-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search artists..."
                  className="h-full w-full rounded-md border border-[#71717A] bg-[#11111A] py-1.5 pl-10 pr-2.5 text-[14px] font-medium tracking-[0.07px] text-[#F5F5F7] outline-none placeholder:text-[#71717A] transition-colors hover:border-[#71717A] focus:border-[#8B5CF6]"
                />
              </div>

              <div className="flex max-h-[280px] flex-col gap-1.5 overflow-y-auto p-2.5">
                {filtered.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="flex h-9 items-center gap-1.5 border-b border-[#3F3F46] py-1.5 pr-1 text-left transition-colors hover:bg-[#181824]"
                    onClick={() => addArtistToSchedule(a)}
                    aria-label={`Add ${a.name} to schedule`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <ArtistAvatar name={a.name} imageUrl={a.avatarUrl} size={30} className="rounded-[3px]" />
                      <span className="truncate text-[12px] leading-4 text-[#F5F5F7]">{a.name}</span>
                    </div>
                    <span className="relative flex size-[25px] shrink-0 items-center justify-center rounded-md border border-[#3F3F46] text-[#A1A1AA]">
                      <Plus className="size-4" strokeWidth={2} />
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="flex h-9 w-full max-w-[201px] items-center justify-center gap-1.5 rounded-md border border-dashed border-[#8B5CF6] bg-[#11111A] px-2.5 py-1.5 text-[14px] font-medium tracking-[0.07px] text-[#8B5CF6]"
                onClick={() => document.getElementById("library-search")?.focus()}
              >
                <Plus className="size-3" strokeWidth={2} />
                Add Artists
              </button>

              {/* Compact tip â€” Figma overlay card */}
              <div className="flex min-h-[112px] w-full max-w-[204px] gap-1.5 rounded-md border border-[#232330] bg-[#0F0F17] px-3 py-6">
                <div className="flex shrink-0 items-start">
                  <div className="flex items-center justify-center rounded-full bg-[#8B5CF6] px-[7px] py-2">
                    <Lightbulb className="size-6 text-white" strokeWidth={2} />
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-1.5">
                  <p className="text-[16px] font-semibold leading-5 text-[#F5F5F7]">Tip</p>
                  <p className="text-[10px] leading-[14px] text-[#F5F5F7]">
                    Drag artists up or down to reorder your lineup.
                  </p>
                </div>
              </div>
            </div>

            {/* Scheduler */}
            <div className="flex min-w-0 flex-1 flex-col gap-2.5 rounded-md border border-[#232330] bg-gradient-to-b from-[#11111A] to-[#0D0D14] p-2.5">
              <div className="flex w-full flex-wrap items-center gap-1.5">
                <p className="min-w-0 flex-1 text-[14px] font-normal leading-5 text-[#F5F5F7]">
                  YOUR EVENT SCHEDULE ({totalArtistAppearances} ARTISTS)
                </p>
                <div className="flex shrink-0 items-center gap-1.5">
                  <ArrowUpDown className="size-5 text-[#F5F5F7]" strokeWidth={2} aria-hidden />
                  <span className="text-[10px] leading-[14px] text-[#F5F5F7]">
                    Drag rows to reorder
                  </span>
                </div>
              </div>

              {/* Column headings */}
              <div className="rounded-xl border border-[#181824] bg-[#11111A] px-4 py-3">
                <div className="overflow-x-auto">
                  <div className="grid min-w-[760px] grid-cols-[56px_minmax(220px,1fr)_96px_104px_104px_96px_40px] items-center gap-4 text-[12px] font-normal uppercase tracking-wide text-white">
                    <span>ORDER</span>
                    <span>ARTIST(S)</span>
                    <span className="text-center">DURATION</span>
                    <span className="text-center">START TIME</span>
                    <span className="text-center">END TIME</span>
                    <span className="text-center">FEE</span>
                    <span aria-hidden />
                  </div>
                </div>
              </div>

              {/* ~3 rows visible (py-6 + row content); then scroll â€” keeps footer actions on screen */}
              <div
                ref={scrollListRef}
                className="flex min-h-0 max-h-[min(20rem,45vh)] flex-col overflow-y-auto overflow-x-hidden overscroll-contain rounded-xl border border-[#181824] bg-[#11111A] [scrollbar-gutter:stable]"
                aria-label="Event schedule rows"
              >
                {enriched.length === 0 ? (
                  <div className="px-4 py-12 text-center text-[12px] text-[#71717A]">
                    No sets yet â€” add artists from the library.
                  </div>
                ) : (
                  enriched.map((row, index) => (
                    <ScheduleArtistCard
                      key={row.slotId}
                      row={row}
                      index={index}
                      lastIndex={enriched.length - 1}
                      onDurationChange={onDurationChange}
                      onFeeBlur={onFeeDollarsBlur}
                      onMoveUp={onMoveUp}
                      onMoveDown={onMoveDown}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                      onUngroup={onUngroup}
                      isMenuOpen={openMenuIndex === index}
                      onMenuButtonClick={() =>
                        setOpenMenuIndex((prev) => (prev === index ? null : index))
                      }
                      onMenuClose={() => setOpenMenuIndex(null)}
                      registerRowEl={registerRowEl}
                      isDragPlaceholder={scheduleDrag?.fromIndex === index}
                      showInsertLineBefore={
                        dropHover?.kind === "insert" && dropHover.before === index
                      }
                      isMergeTarget={
                        dropHover?.kind === "merge" && dropHover.target === index
                      }
                      onGripPointerDown={handleGripPointerDown}
                      onGripPointerMove={handleGripPointerMove}
                      onGripPointerUp={handleGripPointerUp}
                      onGripPointerCancel={handleGripPointerCancel}
                    />
                  ))
                )}
                {enriched.length > 0 &&
                dropHover?.kind === "insert" &&
                dropHover.before === enriched.length ? (
                  <div
                    className="pointer-events-none mx-2 mb-1 mt-0.5 h-0.5 shrink-0 rounded-full bg-[#8B5CF6] shadow-[0_0_12px_rgba(139,92,246,0.8)]"
                    aria-hidden
                  />
                ) : null}
              </div>

              <button
                type="button"
                className="flex min-h-[67px] w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-[#8B5CF6] bg-[#11111A] px-3 py-3 transition-colors hover:bg-[#181824]"
                onClick={() => router.push("/artists/new")}
              >
                <span className="flex items-center gap-1.5 text-[14px] font-medium tracking-[0.07px] text-[#8B5CF6]">
                  <Plus className="size-3" strokeWidth={2} />
                  Add New Artists
                </span>
                <span className="text-[10px] leading-[14px] text-[#F5F5F7]">
                  Artist not showing? Press here to create artist profile
                </span>
              </button>

              <ScheduleSummaryStrip
                eventStartTime={eventStartParts.time}
                eventStartDate={eventStartParts.dateLine}
                eventEndTime={eventEndParts.time}
                eventEndDate={eventEndParts.dateLine}
                totalRuntimeLabel={formatDurationMinutes(summary.totalRuntimeMinutes)}
                b2bCount={summary.b2bSetCount}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-[#181824] pt-4">
            <Button
              variant="ghost"
              size="md"
              type="button"
              onClick={() => router.push("/event-wizard/event-basics")}
            >
              Back
            </Button>
            <div className="ml-auto">
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={() => {
                  saveWizardScheduleSlots(scheduleSlots);
                  router.push("/event-wizard/finance-&-forecast");
                }}
              >
                <span className="inline-flex items-center gap-2">
                  Continue
                  <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                </span>
              </Button>
            </div>
          </div>
        </section>
      </div>

      {scheduleDrag && enriched[scheduleDrag.fromIndex] ? (
        <ScheduleDragPreview row={enriched[scheduleDrag.fromIndex]} x={scheduleDrag.x} y={scheduleDrag.y} />
      ) : null}
    </div>
  );
}

function ScheduleDragPreview({ row, x, y }: { row: EnrichedSlot; x: number; y: number }) {
  const label =
    row.kind === "single"
      ? row.artist.name
      : row.artists.map((a) => a.name).join(", ");
  /* ASCII separators only â€” avoids mojibake if encoding strips UTF-8 punctuation */
  const sub = `${formatClock(row.start)} - ${formatClock(row.end)} | ${formatDurationMinutes(row.durationMinutes)}`;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed z-[300] w-[min(92vw,520px)] max-w-[520px] rounded-lg border border-[#232330] bg-[#0B0B10] px-4 py-3 shadow-[0px_12px_40px_rgba(0,0,0,0.55)]"
      style={{
        left: x + 12,
        top: y + 8,
        transform: "translate(0, 0)",
      }}
      aria-hidden
    >
      <p className="text-[12px] font-bold tracking-[0.12px] text-[#F5F5F7]">{label}</p>
      <p className="mt-1 text-[11px] text-[#A1A1AA]">{sub}</p>
      {row.kind === "b2b" ? (
        <span className="mt-2 inline-flex rounded border border-[#8B5CF6] px-1.5 py-0.5 text-[10px] font-bold text-[#8B5CF6]">
          B2B
        </span>
      ) : null}
    </div>,
    document.body
  );
}

function ScheduleRowMenuPortal({
  open,
  anchorRef,
  onClose,
  children,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  React.useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const menuWidth = 160;
    setPos({
      top: r.bottom + 6,
      left: Math.max(8, r.right - menuWidth),
    });
  }, [open, anchorRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[250] cursor-default"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed z-[251] min-w-[160px] rounded-lg border border-[#232330] bg-[#11111A] py-1 text-left text-[13px] shadow-xl"
        style={{ top: pos.top, left: pos.left }}
        role="menu"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body
  );
}

function ScheduleArtistCard({
  row,
  index,
  lastIndex,
  onDurationChange,
  onFeeBlur,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onUngroup,
  isMenuOpen,
  onMenuButtonClick,
  onMenuClose,
  registerRowEl,
  isDragPlaceholder,
  showInsertLineBefore,
  isMergeTarget,
  onGripPointerDown,
  onGripPointerMove,
  onGripPointerUp,
  onGripPointerCancel,
}: {
  row: EnrichedSlot;
  index: number;
  lastIndex: number;
  onDurationChange: (i: number, m: number) => void;
  onFeeBlur: (i: number, v: string) => void;
  onMoveUp: (i: number) => void;
  onMoveDown: (i: number) => void;
  onDuplicate: (i: number) => void;
  onDelete: (i: number) => void;
  onUngroup: (i: number) => void;
  isMenuOpen: boolean;
  onMenuButtonClick: () => void;
  onMenuClose: () => void;
  registerRowEl: (i: number, el: HTMLDivElement | null) => void;
  isDragPlaceholder: boolean;
  showInsertLineBefore: boolean;
  isMergeTarget: boolean;
  onGripPointerDown: (e: React.PointerEvent, i: number) => void;
  onGripPointerMove: (e: React.PointerEvent, i: number) => void;
  onGripPointerUp: (e: React.PointerEvent, i: number) => void;
  onGripPointerCancel: (e: React.PointerEvent, i: number) => void;
}) {
  const parts = durationParts(row.durationMinutes);
  const fee = (row.feeCents / 100).toFixed(2);
  const menuBtnRef = React.useRef<HTMLButtonElement>(null);
  return (
    <div
      ref={(el) => registerRowEl(index, el)}
      data-node-id="117:2104"
      data-artist-card-state={row.kind === "b2b" ? "Artist Card - B2B" : "Artist Card - Single"}
      className={`relative border-b border-[#3F3F46] bg-[#0B0B10] px-1.5 py-6 last:border-b-0 ${
        isDragPlaceholder ? "opacity-[0.38] saturate-0" : ""
      } ${
        isMergeTarget ? "ring-2 ring-[#8B5CF6]/70 ring-inset" : ""
      }`}
    >
      {showInsertLineBefore ? (
        <div
          className="pointer-events-none absolute -top-px left-2 right-2 z-10 h-0.5 rounded-full bg-[#8B5CF6] shadow-[0_0_12px_rgba(139,92,246,0.8)]"
          aria-hidden
        />
      ) : null}
      <div className="overflow-x-auto px-1.5">
        <div className="grid min-h-[52px] min-w-[760px] grid-cols-[56px_minmax(220px,1fr)_96px_104px_104px_96px_40px] items-center gap-4">
          <div className="flex items-center gap-3">
            <div
              onPointerDown={(e) => onGripPointerDown(e, index)}
              onPointerMove={(e) => onGripPointerMove(e, index)}
              onPointerUp={(e) => onGripPointerUp(e, index)}
              onPointerCancel={(e) => onGripPointerCancel(e, index)}
              className="inline-flex cursor-grab touch-none text-[#71717A] active:cursor-grabbing"
              aria-label="Drag to reorder or merge into another slot"
            >
              <GripVertical className="size-5" strokeWidth={2} aria-hidden />
            </div>
            <span className="text-[12px] font-bold leading-4 tracking-[0.12px] text-[#F5F5F7]">{row.order}</span>
          </div>

          <div
            className={`flex min-w-0 flex-col justify-center ${
              row.kind === "b2b" ? "items-start" : ""
            }`}
          >
            {row.kind === "single" ? (
              <div className="flex min-w-0 items-center gap-6">
                <ArtistAvatar
                  name={row.artist.name}
                  imageUrl={row.artist.avatarUrl}
                  size={30}
                  className="rounded-[3px]"
                />
                <span className="truncate text-[12px] font-bold leading-4 tracking-[0.12px] text-[#F5F5F7]">
                  {row.artist.name}
                </span>
              </div>
            ) : (
              <div className="flex min-w-0 flex-col gap-[17px]">
                <div className="flex min-w-0 items-center gap-6">
                  <ArtistAvatar
                    name={row.artists[0]?.name ?? "Artist"}
                    imageUrl={row.artists[0]?.avatarUrl}
                    size={30}
                    className="rounded-[3px]"
                  />
                  <span className="truncate text-[12px] font-bold leading-4 tracking-[0.12px] text-[#F5F5F7]">
                    {row.artists[0]?.name}
                  </span>
                </div>
                <div className="inline-flex w-fit items-center justify-center rounded-[3px] border border-[#8B5CF6] px-1.5 py-0.5">
                  <span className="text-[12px] font-bold leading-4 tracking-[0.12px] text-[#8B5CF6]">B2B</span>
                </div>
                {row.artists.slice(1).map((ar) => (
                  <div key={ar.artistId} className="flex min-w-0 items-center gap-6">
                    <ArtistAvatar
                      name={ar.name}
                      imageUrl={ar.avatarUrl}
                      size={30}
                      className="rounded-[3px]"
                    />
                    <span className="truncate text-[12px] font-bold leading-4 tracking-[0.12px] text-[#F5F5F7]">
                      {ar.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <label className="relative inline-flex h-[31px] w-[88px] cursor-pointer items-center justify-center gap-[3px] rounded-[6px] border border-[#71717A] bg-gradient-to-b from-[#11111A] to-[#0D0D14] px-1.5">
              {parts.h ? <span className="text-[12px] text-white">{parts.h}</span> : null}
              {parts.m ? <span className="text-[12px] text-white">{parts.m}</span> : null}
              <ChevronDown className="size-5 text-white/80" strokeWidth={2} aria-hidden />
              <select
                className="absolute inset-0 cursor-pointer opacity-0"
                value={row.durationMinutes}
                onChange={(e) => onDurationChange(index, Number(e.target.value))}
                aria-label="Duration"
              >
                {!DURATION_OPTIONS.includes(row.durationMinutes) && (
                  <option value={row.durationMinutes}>{formatDurationMinutes(row.durationMinutes)}</option>
                )}
                {DURATION_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {formatDurationMinutes(m)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <span className="text-center whitespace-nowrap text-[12px] font-bold leading-4 tracking-[0.12px] text-[#F5F5F7]">
            {formatClock(row.start)}
          </span>
          <span className="text-center whitespace-nowrap text-[12px] font-bold leading-4 tracking-[0.12px] text-[#F5F5F7]">
            {formatClock(row.end)}
          </span>

          <div className="flex justify-center">
            <label className="relative flex h-[31px] w-[88px] items-center justify-center rounded-[6px] border border-[#71717A] bg-gradient-to-b from-[#11111A] to-[#0D0D14] px-1.5">
              <span className="text-[12px] font-bold tracking-[0.12px] text-[#F5F5F7]">${fee}</span>
              <input
                type="number"
                step={0.01}
                min={0}
                defaultValue={fee}
                key={`${row.slotId}-${row.feeCents}`}
                className="absolute inset-0 cursor-pointer opacity-0"
                onBlur={(e) => onFeeBlur(index, e.target.value)}
                aria-label="Fee in dollars"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              ref={menuBtnRef}
              type="button"
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#71717A] hover:bg-[#181824] hover:text-[#F5F5F7]"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              onClick={(e) => {
                e.stopPropagation();
                onMenuButtonClick();
              }}
            >
              <MoreVertical className="size-5" strokeWidth={2} />
              <span className="sr-only">Row actions</span>
            </button>
          </div>
        </div>
      </div>

      <ScheduleRowMenuPortal open={isMenuOpen} anchorRef={menuBtnRef} onClose={onMenuClose}>
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-[#F5F5F7] hover:bg-[#181824]"
          role="menuitem"
          onClick={() => {
            onDuplicate(index);
            onMenuClose();
          }}
        >
          Duplicate
        </button>
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-[#F5F5F7] hover:bg-[#181824] disabled:opacity-40"
          role="menuitem"
          disabled={index === 0}
          onClick={() => {
            onMoveUp(index);
            onMenuClose();
          }}
        >
          Move up
        </button>
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-[#F5F5F7] hover:bg-[#181824] disabled:opacity-40"
          role="menuitem"
          disabled={index >= lastIndex}
          onClick={() => {
            onMoveDown(index);
            onMenuClose();
          }}
        >
          Move down
        </button>
        {row.kind === "b2b" ? (
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[#F5F5F7] hover:bg-[#181824]"
            role="menuitem"
            onClick={() => onUngroup(index)}
          >
            Ungroup
          </button>
        ) : null}
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-red-400 hover:bg-[#181824]"
          role="menuitem"
          onClick={() => {
            onDelete(index);
            onMenuClose();
          }}
        >
          Delete
        </button>
      </ScheduleRowMenuPortal>
    </div>
  );
}
