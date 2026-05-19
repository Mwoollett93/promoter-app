import type { Artist, B2BSlot, ScheduleSlot, SingleSlot } from "../types/event-schedule";

/** Stable ids for drag-and-drop + React keys. */
export function newSlotId(): string {
  return crypto.randomUUID();
}

const defaultDurationMinutes = 60;

/** Append a new single at end using defaults from library artist. */
export function appendSingleFromArtist(
  slots: ScheduleSlot[],
  artist: Artist,
  overrides?: Partial<Pick<SingleSlot, "durationMinutes" | "feeCents">>
): ScheduleSlot[] {
  const single: SingleSlot = {
    kind: "single",
    slotId: newSlotId(),
    artistId: artist.id,
    durationMinutes: overrides?.durationMinutes ?? defaultDurationMinutes,
    feeCents: overrides?.feeCents ?? artist.defaultFeeCents,
  };
  return [...slots, single];
}

/** Insert duplicate directly below `index` (same durations/fees/artists). */
export function duplicateSlotAt(
  slots: ScheduleSlot[],
  index: number
): ScheduleSlot[] {
  const slot = slots[index];
  if (!slot) return slots;

  let copy: ScheduleSlot;
  if (slot.kind === "single") {
    copy = {
      kind: "single",
      slotId: newSlotId(),
      artistId: slot.artistId,
      durationMinutes: slot.durationMinutes,
      feeCents: slot.feeCents,
    };
  } else {
    copy = {
      kind: "b2b",
      slotId: newSlotId(),
      artistIds: [...slot.artistIds],
      durationMinutes: slot.durationMinutes,
      feeCents: slot.feeCents,
    };
  }

  return [...slots.slice(0, index + 1), copy, ...slots.slice(index + 1)];
}

export function removeSlotAt(
  slots: ScheduleSlot[],
  index: number
): ScheduleSlot[] {
  if (index < 0 || index >= slots.length) return slots;
  return [...slots.slice(0, index), ...slots.slice(index + 1)];
}

export function moveSlot(
  slots: ScheduleSlot[],
  fromIndex: number,
  toIndex: number
): ScheduleSlot[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    fromIndex >= slots.length ||
    toIndex < 0 ||
    toIndex >= slots.length
  ) {
    return slots;
  }
  const next = [...slots];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

/**
 * Move `fromIndex` so it ends up immediately before `insertBeforeIndex` in the final list.
 * `insertBeforeIndex` may be `slots.length` to append at the end.
 */
export function moveSlotInsertBefore(
  slots: ScheduleSlot[],
  fromIndex: number,
  insertBeforeIndex: number
): ScheduleSlot[] {
  const n = slots.length;
  if (insertBeforeIndex < 0 || insertBeforeIndex > n) return slots;
  if (fromIndex < 0 || fromIndex >= n) return slots;
  const to =
    fromIndex < insertBeforeIndex ? insertBeforeIndex - 1 : insertBeforeIndex;
  if (fromIndex === to) return slots;
  return moveSlot(slots, fromIndex, to);
}

/**
 * Drop a row onto another: single → merges into target (single becomes B2B, or artist appended to B2B).
 * Non-single dragged rows are not merged (caller should reorder only).
 */
export function mergeDraggedIntoTarget(
  slots: ScheduleSlot[],
  draggedIndex: number,
  targetIndex: number
): ScheduleSlot[] {
  if (draggedIndex === targetIndex) return slots;
  const dragged = slots[draggedIndex];
  const target = slots[targetIndex];
  if (!dragged || !target) return slots;
  if (dragged.kind !== "single") return slots;

  if (target.kind === "single") {
    if (target.artistId === dragged.artistId) return slots;
    const without = removeSlotAt(slots, draggedIndex);
    const newTarget =
      draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    return pairSingleWithArtist(without, newTarget, dragged.artistId, dragged.feeCents);
  }

  if (target.kind === "b2b") {
    if (target.artistIds.includes(dragged.artistId)) return slots;
    const without = removeSlotAt(slots, draggedIndex);
    const newTarget =
      draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    return addArtistToB2BSlot(without, newTarget, dragged.artistId, dragged.feeCents);
  }

  return slots;
}

/**
 * Replace a single row with a B2B containing the same artist plus `secondArtistId`.
 * Duration/fee start from the original single.
 */
export function pairSingleWithArtist(
  slots: ScheduleSlot[],
  singleIndex: number,
  secondArtistId: string,
  secondFeeCents = 0
): ScheduleSlot[] {
  const slot = slots[singleIndex];
  if (!slot || slot.kind !== "single") return slots;

  const b2b: B2BSlot = {
    kind: "b2b",
    slotId: newSlotId(),
    artistIds: [slot.artistId, secondArtistId],
    durationMinutes: slot.durationMinutes,
    feeCents: slot.feeCents + Math.max(0, secondFeeCents),
  };

  return [...slots.slice(0, singleIndex), b2b, ...slots.slice(singleIndex + 1)];
}

/** Append an artist id to an existing B2B row (same shared window). */
export function addArtistToB2BSlot(
  slots: ScheduleSlot[],
  b2bIndex: number,
  artistId: string,
  artistFeeCents = 0
): ScheduleSlot[] {
  const slot = slots[b2bIndex];
  if (!slot || slot.kind !== "b2b") return slots;
  if (slot.artistIds.includes(artistId)) return slots;

  const updated: B2BSlot = {
    ...slot,
    artistIds: [...slot.artistIds, artistId],
    feeCents: slot.feeCents + Math.max(0, artistFeeCents),
  };

  return slots.map((s, i) => (i === b2bIndex ? updated : s));
}

/**
 * Merge two adjacent singles at `firstIndex` and `firstIndex + 1` into one B2B.
 * Duration/fee taken from the **first** slot.
 */
export function mergeAdjacentSinglesIntoB2B(
  slots: ScheduleSlot[],
  firstIndex: number
): ScheduleSlot[] {
  const a = slots[firstIndex];
  const b = slots[firstIndex + 1];
  if (!a || !b) return slots;
  if (a.kind !== "single" || b.kind !== "single") return slots;

  const merged: B2BSlot = {
    kind: "b2b",
    slotId: newSlotId(),
    artistIds: [a.artistId, b.artistId],
    durationMinutes: a.durationMinutes,
    feeCents: a.feeCents + b.feeCents,
  };

  return [
    ...slots.slice(0, firstIndex),
    merged,
    ...slots.slice(firstIndex + 2),
  ];
}

/**
 * Ungroup policy: `k` artists each get their own single row with duration `D`
 * (same as the group's duration). Fee is split evenly in cents (remainder to last row).
 */
export function ungroupB2BAt(
  slots: ScheduleSlot[],
  index: number
): ScheduleSlot[] {
  const slot = slots[index];
  if (!slot || slot.kind !== "b2b") return slots;

  const D = slot.durationMinutes;
  const k = slot.artistIds.length;
  if (k === 0) return removeSlotAt(slots, index);

  const baseFee = Math.floor(slot.feeCents / k);
  const leftoverCents = slot.feeCents - baseFee * k;

  const singles: SingleSlot[] = slot.artistIds.map((artistId, i) => ({
    kind: "single",
    slotId: newSlotId(),
    artistId,
    durationMinutes: D,
    feeCents: baseFee + (i === k - 1 ? leftoverCents : 0),
  }));

  return [...slots.slice(0, index), ...singles, ...slots.slice(index + 1)];
}

/** Update duration for one slot by index (caller recalculates times). */
export function setSlotDurationAt(
  slots: ScheduleSlot[],
  index: number,
  durationMinutes: number
): ScheduleSlot[] {
  if (durationMinutes <= 0) return slots;
  return slots.map((s, i) =>
    i === index ? { ...s, durationMinutes } : s
  ) as ScheduleSlot[];
}

/** Update fee for one slot (event-only override). */
export function setSlotFeeAt(
  slots: ScheduleSlot[],
  index: number,
  feeCents: number
): ScheduleSlot[] {
  if (feeCents < 0) return slots;
  return slots.map((s, i) =>
    i === index ? { ...s, feeCents } : s
  ) as ScheduleSlot[];
}
