import { describe, it, expect } from "vitest";
import {
  mergeDraggedIntoTarget,
  moveSlotInsertBefore,
} from "./groupB2BArtists";

describe("moveSlotInsertBefore", () => {
  it("moves first item to end", () => {
    const slots = [
      { kind: "single" as const, slotId: "a", artistId: "1", durationMinutes: 60, feeCents: 100 },
      { kind: "single" as const, slotId: "b", artistId: "2", durationMinutes: 60, feeCents: 100 },
      { kind: "single" as const, slotId: "c", artistId: "3", durationMinutes: 60, feeCents: 100 },
    ];
    const next = moveSlotInsertBefore(slots, 0, 3);
    expect(next.map((s) => s.slotId)).toEqual(["b", "c", "a"]);
  });

  it("no-op when already at insert position", () => {
    const slots = [
      { kind: "single" as const, slotId: "a", artistId: "1", durationMinutes: 60, feeCents: 100 },
    ];
    const next = moveSlotInsertBefore(slots, 0, 0);
    expect(next).toEqual(slots);
  });
});

describe("mergeDraggedIntoTarget", () => {
  it("merges single onto single as B2B", () => {
    const slots = [
      { kind: "single" as const, slotId: "a", artistId: "x", durationMinutes: 60, feeCents: 100 },
      { kind: "single" as const, slotId: "b", artistId: "y", durationMinutes: 90, feeCents: 200 },
    ];
    const next = mergeDraggedIntoTarget(slots, 1, 0);
    expect(next).toHaveLength(1);
    expect(next[0]?.kind).toBe("b2b");
    if (next[0]?.kind === "b2b") {
      expect(next[0].artistIds).toEqual(["x", "y"]);
    }
  });

  it("appends single onto existing B2B", () => {
    const slots = [
      {
        kind: "b2b" as const,
        slotId: "a",
        artistIds: ["x", "y"],
        durationMinutes: 60,
        feeCents: 100,
      },
      { kind: "single" as const, slotId: "b", artistId: "z", durationMinutes: 60, feeCents: 50 },
    ];
    const next = mergeDraggedIntoTarget(slots, 1, 0);
    expect(next).toHaveLength(1);
    if (next[0]?.kind === "b2b") {
      expect(next[0].artistIds).toEqual(["x", "y", "z"]);
    }
  });
});
