"use client";

import { Mail, Plug } from "lucide-react";

import { SECTION_CARD, SECTION_CARD_PADDING, SECTION_TITLE } from "@/lib/ui/page-surfaces";

export default function ConnectSourcePlaceholder() {
  return (
    <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2">
      <article className={[SECTION_CARD, SECTION_CARD_PADDING, "opacity-80"].join(" ")}>
        <div className="flex items-center gap-2">
          <Plug className="size-4 text-[#71717A]" aria-hidden />
          <h4 className={SECTION_TITLE}>Live API integration</h4>
        </div>
        <p className="mt-2 text-[12px] leading-5 text-[#A1A1AA]">
          Reserved for official ticketing APIs when available. RA does not offer a public sales
          API — use manual checkpoints or CSV imports for now.
        </p>
        <span className="mt-3 inline-flex rounded-full border border-[#3F3F46] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#71717A]">
          Coming soon
        </span>
      </article>

      <article className={[SECTION_CARD, SECTION_CARD_PADDING, "opacity-80"].join(" ")}>
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-[#71717A]" aria-hidden />
          <h4 className={SECTION_TITLE}>Email report import</h4>
        </div>
        <p className="mt-2 text-[12px] leading-5 text-[#A1A1AA]">
          Forward scheduled sales reports from your inbox. Attachments will map into checkpoints
          automatically once this integration ships.
        </p>
        <span className="mt-3 inline-flex rounded-full border border-[#3F3F46] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#71717A]">
          Coming soon
        </span>
      </article>
    </div>
  );
}
