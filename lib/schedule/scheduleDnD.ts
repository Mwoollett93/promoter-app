/** Pointer hit zones for schedule row drag (reorder vs B2B merge). */

export type ScheduleDropHover =
  | { kind: "insert"; before: number }
  | { kind: "merge"; target: number };

export function computeScheduleDropHover(
  clientX: number,
  clientY: number,
  scrollEl: HTMLElement | null,
  length: number,
  fromIndex: number,
  draggedIsSingle: boolean,
  getRowEl: (i: number) => HTMLElement | undefined,
  edgePx = 16
): ScheduleDropHover | null {
  for (let i = 0; i < length; i++) {
    const el = getRowEl(i);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (
      clientX < r.left ||
      clientX > r.right ||
      clientY < r.top ||
      clientY > r.bottom
    ) {
      continue;
    }
    const ry = clientY - r.top;
    if (ry < edgePx) return { kind: "insert", before: i };
    if (ry > r.height - edgePx) return { kind: "insert", before: i + 1 };
    if (i === fromIndex) return null;
    if (draggedIsSingle) return { kind: "merge", target: i };
    return { kind: "insert", before: i };
  }

  if (scrollEl && length > 0) {
    const sr = scrollEl.getBoundingClientRect();
    if (
      clientX >= sr.left &&
      clientX <= sr.right &&
      clientY >= sr.top &&
      clientY <= sr.bottom
    ) {
      const last = getRowEl(length - 1);
      if (last && clientY > last.getBoundingClientRect().bottom) {
        return { kind: "insert", before: length };
      }
    }
  }

  return null;
}
