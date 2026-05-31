"use client";

import * as React from "react";
import { ClipboardList, Upload, Wifi, Mail } from "lucide-react";

import Button from "@/app/components/ui/Button";
import { SECTION_CARD, SECTION_CARD_PADDING } from "@/lib/ui/page-surfaces";

type SalesEmptyStateProps = {
  onAddCheckpoint: () => void;
  onImportCsv: () => void;
};

export default function SalesEmptyState({ onAddCheckpoint, onImportCsv }: SalesEmptyStateProps) {
  return (
    <section className={[SECTION_CARD, SECTION_CARD_PADDING, "text-center"].join(" ")}>
      <p className="text-[15px] font-semibold text-[#F5F5F7]">No sales data yet</p>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-5 text-[#A1A1AA]">
        Track ticket sales with manual checkpoints or CSV imports from RA, Eventbrite, Humanitix,
        and other platforms. We never scrape ticketing sites — only data you provide.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button type="button" variant="primary" size="sm" onClick={onAddCheckpoint}>
          Add manual checkpoint
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onImportCsv}>
          Import CSV report
        </Button>
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Hint icon={ClipboardList} label="Manual checkpoint" text="Enter sold, revenue, and fees at a point in time." />
        <Hint icon={Upload} label="CSV import" text="Upload platform exports with flexible column mapping." />
        <Hint icon={Wifi} label="Connect source later" text="Official API integrations — coming soon." />
        <Hint icon={Mail} label="Email reports" text="Forward ticket reports — planned for a future release." />
      </div>
    </section>
  );
}

function Hint({
  icon: Icon,
  label,
  text,
}: {
  icon: typeof ClipboardList;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2.5 text-left">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-[#8B5CF6]" aria-hidden />
        <p className="text-[12px] font-medium text-[#E4E4E7]">{label}</p>
      </div>
      <p className="mt-1 text-[11px] leading-4 text-[#71717A]">{text}</p>
    </div>
  );
}
