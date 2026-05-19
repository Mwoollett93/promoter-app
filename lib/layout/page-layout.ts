/** Shared main-content spacing — 20px gutters, 12px gaps between cards/sections */

export const SHELL_PADDING_X = "px-[20px]";

export const SHELL_PADDING_Y = "py-[20px]";

export const PAGE_STACK_GAP = "gap-[12px]";

export const GRID_CARD_GAP = "gap-[12px]";



/** Max rows per page on management tables */

export const MANAGEMENT_TABLE_PAGE_SIZE_EVENTS = 9;
export const MANAGEMENT_TABLE_PAGE_SIZE_VENUES = 9;
export const MANAGEMENT_TABLE_PAGE_SIZE_ARTISTS = 10;



export function pageContentClass(extra?: string) {

  return ["flex w-full min-w-0 flex-col pb-10", PAGE_STACK_GAP, extra].filter(Boolean).join(" ");

}

