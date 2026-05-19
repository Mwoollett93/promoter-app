"use client";

import {
  formatCurrencyParts,
  type CurrencyFormatOptions,
} from "@/lib/data/format";
import { useSettings } from "@/lib/settings/SettingsProvider";

export default function CurrencyText({
  value,
  className,
  showRegion = true,
  ...options
}: {
  value: number;
  className?: string;
  showRegion?: boolean;
} & CurrencyFormatOptions) {
  const { settings } = useSettings();
  const parts = formatCurrencyParts(value, settings.preferences, options);

  return (
    <span className={className}>
      <span>{parts.symbol}</span>
      <span>{parts.amount}</span>
      {showRegion ? (
        <span
          className="ml-0.5 align-super text-[0.58em] font-semibold tracking-wide text-[#71717A]"
          aria-hidden
        >
          {parts.region}
        </span>
      ) : null}
    </span>
  );
}
