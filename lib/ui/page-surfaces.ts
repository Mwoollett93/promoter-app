/** Shared layout + surface tokens — keep management pages visually aligned. */

export const SECTION_CARD =
  "rounded-xl border border-[#232330] bg-[#11111A] shadow-[0px_10px_40px_0px_rgba(0,0,0,0.35)]";

export const SECTION_CARD_PADDING = "p-5";

export const SECTION_CARD_INNER =
  "rounded-lg border border-[#232330] bg-[#0F0F17]";

export const PAGE_EYEBROW =
  "text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8B5CF6]";

/** Hidden on mobile when wrapped in `MobilePageTitleHidden` (shell shows title). */
export const PAGE_TITLE =
  "page-hero text-[28px] font-bold leading-8 tracking-tight text-[#F5F5F7] sm:text-[32px] sm:leading-9";

export const PAGE_DESCRIPTION = "page-hero-desc mt-1 text-[14px] leading-5 text-[#A1A1AA]";

export const SECTION_TITLE = "text-[16px] font-semibold text-[#F5F5F7]";

export const SECTION_DESCRIPTION = "mt-1 text-[13px] leading-5 text-[#A1A1AA]";

export const FIELD_LABEL =
  "text-[11px] font-medium uppercase tracking-wide text-[#71717A]";

/** 44px touch height — consistent across mobile and desktop. */
export const INPUT_SURFACE =
  "h-11 min-h-[44px] w-full min-w-0 rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 text-[13px] text-[#F5F5F7] outline-none transition-colors placeholder:text-[#71717A] focus:border-[#8B5CF6] focus-visible:border-[#8B5CF6]";

export const SELECT_SURFACE =
  "h-11 min-h-[44px] min-w-0 rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 text-[13px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]";

export const MANAGEMENT_SEARCH_BAR =
  "flex h-11 min-h-[44px] w-full min-w-0 items-center gap-2 rounded-[12px] border border-[#3F3F46] bg-[#0B0B10] px-3 text-[13px] text-[#A1A1AA]";

export const LINK_ACCENT =
  "inline-flex items-center gap-1 text-[13px] font-medium text-[#8B5CF6] transition-colors hover:text-[#A855F7]";
