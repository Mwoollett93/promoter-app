"use client";

import * as React from "react";
import { Download, Upload, X } from "lucide-react";

import Button from "@/app/components/ui/Button";
import { parseArtistImportCsv, type ArtistImportRow } from "@/lib/csv/artist-import";
import { createArtist } from "@/lib/supabase/browser";
import type { SupabaseSession } from "@/lib/types/artist";

const SAMPLE_CSV = `name,artist_type,genres,status,city,country,reach,email,typical_fee,deposit_required,booking_notes
Maya Thompson,DJ,House|Techno,active,Melbourne,Australia,local,maya@example.com,1500,yes,Advance 50%`;

type ArtistImportDialogProps = {
  open: boolean;
  onClose: () => void;
  session: SupabaseSession;
  onImported: () => void;
};

export default function ArtistImportDialog({
  open,
  onClose,
  session,
  onImported,
}: ArtistImportDialogProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [rows, setRows] = React.useState<ArtistImportRow[]>([]);
  const [importing, setImporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{ ok: number; failed: number } | null>(null);

  React.useEffect(() => {
    if (!open) {
      setRows([]);
      setError(null);
      setResult(null);
      setImporting(false);
    }
  }, [open]);

  if (!open) return null;

  const validRows = rows.filter((r) => r.errors.length === 0);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    const text = await file.text();
    const parsed = parseArtistImportCsv(text);
    if (parsed.length === 0) {
      setError("No data rows found. Include a header row and at least one artist.");
      setRows([]);
      return;
    }
    setRows(parsed);
  }

  async function runImport() {
    if (validRows.length === 0) return;
    setImporting(true);
    setError(null);
    let ok = 0;
    let failed = 0;

    for (const row of validRows) {
      try {
        await createArtist({ ...row.draft, documents: [] }, session);
        ok++;
      } catch {
        failed++;
      }
    }

    setResult({ ok, failed });
    setImporting(false);
    if (ok > 0) onImported();
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "promosync-artists-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <section
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#232330] bg-[#11111A] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[#232330] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#F5F5F7]">Import artists (CSV)</h2>
            <p className="mt-1 text-[13px] text-[#A1A1AA]">
              Upload a spreadsheet with a header row. Required column: <strong>name</strong>.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[#A1A1AA] hover:text-white" aria-label="Close">
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error ? (
            <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-200">
              {error}
            </p>
          ) : null}
          {result ? (
            <p className="mb-3 rounded-lg border border-[#14532D] bg-[#0F2417] px-3 py-2 text-[13px] text-[#86EFAC]">
              Imported {result.ok} artist{result.ok === 1 ? "" : "s"}
              {result.failed > 0 ? ` · ${result.failed} failed` : ""}.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
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
            <Button variant="secondary" size="sm" type="button" onClick={() => inputRef.current?.click()}>
              <Upload className="size-4" />
              Choose CSV
            </Button>
            <Button variant="ghost" size="sm" type="button" onClick={downloadSample}>
              <Download className="size-4" />
              Sample CSV
            </Button>
          </div>

          {rows.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-lg border border-[#232330]">
              <table className="min-w-full text-left text-[12px]">
                <thead className="bg-[#0B0B10] text-[#71717A]">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">City</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 20).map((row) => (
                    <tr key={row.rowNumber} className="border-t border-[#232330] text-[#E4E4E7]">
                      <td className="px-3 py-2">{row.rowNumber}</td>
                      <td className="px-3 py-2">{row.draft.name || "—"}</td>
                      <td className="px-3 py-2">{row.draft.artistType}</td>
                      <td className="px-3 py-2">{row.draft.city || "—"}</td>
                      <td className="px-3 py-2">
                        {row.errors.length > 0 ? (
                          <span className="text-red-300">{row.errors.join(" ")}</span>
                        ) : (
                          row.draft.status
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 20 ? (
                <p className="px-3 py-2 text-[11px] text-[#71717A]">+ {rows.length - 20} more rows</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className="flex justify-end gap-2 border-t border-[#232330] px-5 py-4">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled={importing || validRows.length === 0}
            onClick={() => void runImport()}
          >
            {importing ? "Importing…" : `Import ${validRows.length} artist${validRows.length === 1 ? "" : "s"}`}
          </Button>
        </footer>
      </section>
    </div>
  );
}
