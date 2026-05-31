"use client";

import * as React from "react";
import { Upload } from "lucide-react";

import Button from "@/app/components/ui/Button";
import {
  autoDetectFieldMapping,
  CSV_FIELD_ALIASES,
  mapCsvRows,
  parseCsvText,
} from "@/lib/ticket-sales/csv-parser";
import type { CsvFieldKey, CsvImportInput, SalesProvider } from "@/lib/ticket-sales/types";
import { SALES_PROVIDER_LABELS } from "@/lib/ticket-sales/types";
import {
  FIELD_LABEL,
  SECTION_CARD,
  SECTION_CARD_PADDING,
  SECTION_TITLE,
  SELECT_SURFACE,
} from "@/lib/ui/page-surfaces";

const FIELD_LABELS: Record<CsvFieldKey, string> = {
  tierName: "Tier name",
  ticketsSold: "Tickets sold",
  price: "Price",
  grossRevenue: "Gross revenue",
  netRevenue: "Net revenue",
  fees: "Fees",
  capacity: "Capacity",
};

type CsvImportPanelProps = {
  onImport: (input: CsvImportInput) => void;
  onCancel?: () => void;
};

export default function CsvImportPanel({ onImport, onCancel }: CsvImportPanelProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [provider, setProvider] = React.useState<SalesProvider>("ra");
  const [filename, setFilename] = React.useState("");
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = React.useState<Record<CsvFieldKey, string | null>>(
    autoDetectFieldMapping([]),
  );
  const [error, setError] = React.useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    const text = await file.text();
    const parsed = parseCsvText(text);
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      setError("No data rows found. Include a header row and at least one ticket row.");
      setHeaders([]);
      setRows([]);
      return;
    }
    setFilename(file.name);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setMapping(autoDetectFieldMapping(parsed.headers));
  }

  const preview = rows.length > 0 ? mapCsvRows(rows.slice(0, 5), mapping) : [];
  const canImport = rows.length > 0 && mapping.ticketsSold;

  function handleImport() {
    if (!canImport) return;
    onImport({
      provider,
      filename: filename || "import.csv",
      rawRows: rows,
      mappedFields: mapping,
    });
  }

  return (
    <section className={[SECTION_CARD, SECTION_CARD_PADDING, "space-y-3"].join(" ")}>
      <h3 className={SECTION_TITLE}>Import CSV report</h3>
      <p className="text-[12px] text-[#A1A1AA]">
        Upload exports from RA, Eventbrite, Humanitix, or any platform. Map columns when headers
        differ.
      </p>

      <label className="block">
        <span className={FIELD_LABEL}>Platform</span>
        <select
          className={`${SELECT_SURFACE} mt-1 w-full`}
          value={provider}
          onChange={(e) => setProvider(e.target.value as SalesProvider)}
        >
          {(Object.keys(SALES_PROVIDER_LABELS) as SalesProvider[]).map((key) => (
            <option key={key} value={key}>
              {SALES_PROVIDER_LABELS[key]}
            </option>
          ))}
        </select>
      </label>

      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#3F3F46] bg-[#0B0B10] px-4 py-6 text-center transition-colors hover:border-[#8B5CF6]/50"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <Upload className="size-5 text-[#8B5CF6]" aria-hidden />
        <p className="mt-2 text-[13px] font-medium text-[#E4E4E7]">
          {filename || "Drop or click to upload CSV"}
        </p>
        <p className="mt-1 text-[11px] text-[#71717A]">{rows.length} rows detected</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>

      {error ? <p className="text-[12px] text-[#FCA5A5]">{error}</p> : null}

      {headers.length > 0 ? (
        <div className="space-y-2">
          <p className={FIELD_LABEL}>Column mapping</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(Object.keys(FIELD_LABELS) as CsvFieldKey[]).map((key) => (
              <label key={key} className="block">
                <span className="text-[11px] text-[#71717A]">{FIELD_LABELS[key]}</span>
                <select
                  className={`${SELECT_SURFACE} mt-1 w-full text-[12px]`}
                  value={mapping[key] ?? ""}
                  onChange={(e) =>
                    setMapping((prev) => ({
                      ...prev,
                      [key]: e.target.value || null,
                    }))
                  }
                >
                  <option value="">— Not mapped —</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
                <span className="mt-0.5 block text-[10px] text-[#52525B]">
                  Aliases: {CSV_FIELD_ALIASES[key].slice(0, 3).join(", ")}…
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {preview.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-[#232330]">
          <table className="w-full min-w-[480px] text-left text-[11px]">
            <thead className="bg-[#0B0B10] text-[#71717A]">
              <tr>
                <th className="px-2 py-1.5">Tier</th>
                <th className="px-2 py-1.5">Sold</th>
                <th className="px-2 py-1.5">Gross</th>
                <th className="px-2 py-1.5">Net</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row, index) => (
                <tr key={index} className="border-t border-[#232330]">
                  <td className="px-2 py-1.5 text-[#E4E4E7]">{row.tierName}</td>
                  <td className="px-2 py-1.5 tabular-nums text-[#A1A1AA]">{row.ticketsSold}</td>
                  <td className="px-2 py-1.5 tabular-nums text-[#A1A1AA]">{row.grossRevenue}</td>
                  <td className="px-2 py-1.5 tabular-nums text-[#A1A1AA]">{row.netRevenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="button" variant="primary" size="sm" disabled={!canImport} onClick={handleImport}>
          Import &amp; create checkpoint
        </Button>
      </div>
    </section>
  );
}
