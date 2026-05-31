/** Shared main-content spacing — 20px gutters, 12px gaps between cards/sections */

export const SHELL_PADDING_X = "px-4 md:px-[20px]";

export const SHELL_PADDING_Y = "py-3 md:py-[20px]";

export const PAGE_STACK_GAP = "gap-[12px]";

export const GRID_CARD_GAP = "gap-[12px]";



/** Max rows per page on management tables */

export const MANAGEMENT_TABLE_PAGE_SIZE_EVENTS = 9;
export const MANAGEMENT_TABLE_PAGE_SIZE_VENUES = 9;
export const MANAGEMENT_TABLE_PAGE_SIZE_ARTISTS = 10;



export function pageContentClass(extra?: string, options?: { fill?: boolean }) {
  const parts = ["flex w-full min-w-0 flex-col", PAGE_STACK_GAP, extra];
  if (options?.fill) {
    parts.push("h-full min-h-0 pb-0");
  } else {
    parts.push("pb-4 md:pb-10");
  }
  return parts.filter(Boolean).join(" ");
}

