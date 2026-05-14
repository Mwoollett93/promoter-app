/** Saved artist library row (Supabase-ready: string ids). */
export type Artist = {
  id: string;
  name: string;
  avatarUrl?: string;
  genres: string[];
  tags: string[];
  /** integer cents to avoid float issues */
  defaultFeeCents: number;
};

/** One ordered lineup row — single-artist set. */
export type SingleSlot = {
  kind: "single";
  slotId: string;
  artistId: string;
  durationMinutes: number;
  feeCents: number;
};

/** One ordered lineup row — B2B set (shared window). */
export type B2BSlot = {
  kind: "b2b";
  slotId: string;
  artistIds: string[];
  durationMinutes: number;
  feeCents: number;
};

export type ScheduleSlot = SingleSlot | B2BSlot;

/** Resolved artist for table cells (not persisted). */
export type ScheduledArtist = {
  artistId: string;
  name: string;
  avatarUrl?: string;
};

/** Optional UI helper for B2B rows. */
export type B2BGroup = {
  slotId: string;
  artists: ScheduledArtist[];
  durationMinutes: number;
  feeCents: number;
  start: Date;
  end: Date;
  order: number;
};

/** Slot + computed schedule (output of calculateScheduleTimes). */
export type EnrichedSlot =
  | {
      kind: "single";
      slotId: string;
      artistId: string;
      durationMinutes: number;
      feeCents: number;
      artist: ScheduledArtist;
      start: Date;
      end: Date;
      order: number;
    }
  | {
      kind: "b2b";
      slotId: string;
      artistIds: string[];
      artists: ScheduledArtist[];
      durationMinutes: number;
      feeCents: number;
      start: Date;
      end: Date;
      order: number;
    };

/** Footer summary strip. */
export type ScheduleSummary = {
  eventStart: Date;
  eventEnd: Date;
  totalRuntimeMinutes: number;
  b2bSetCount: number;
};
