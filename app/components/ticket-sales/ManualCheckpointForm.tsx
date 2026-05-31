"use client";

import * as React from "react";

import {
  FIELD_LABEL,
  INPUT_SURFACE,
  SELECT_SURFACE,
} from "@/lib/ui/page-surfaces";
import type { ManualCheckpointInput, SalesProvider } from "@/lib/ticket-sales/types";
import { SALES_PROVIDER_LABELS } from "@/lib/ticket-sales/types";

type ManualCheckpointFormProps = {
  formId: string;
  defaultCapacity: number;
  onSubmit: (input: ManualCheckpointInput) => void;
  /** Reset fields when modal reopens. */
  resetKey?: number;
};

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ManualCheckpointForm({
  formId,
  defaultCapacity,
  onSubmit,
  resetKey = 0,
}: ManualCheckpointFormProps) {
  const [provider, setProvider] = React.useState<SalesProvider>("ra");
  const [ticketsSold, setTicketsSold] = React.useState("");
  const [capacity, setCapacity] = React.useState(String(defaultCapacity || ""));
  const [grossRevenue, setGrossRevenue] = React.useState("");
  const [netRevenue, setNetRevenue] = React.useState("");
  const [fees, setFees] = React.useState("");
  const [checkedAt, setCheckedAt] = React.useState(toLocalInputValue(new Date()));
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    setProvider("ra");
    setTicketsSold("");
    setCapacity(String(defaultCapacity || ""));
    setGrossRevenue("");
    setNetRevenue("");
    setFees("");
    setCheckedAt(toLocalInputValue(new Date()));
    setNotes("");
  }, [resetKey, defaultCapacity]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit({
      provider,
      ticketsSold: Number(ticketsSold) || 0,
      capacity: Number(capacity) || 0,
      grossRevenue: Number(grossRevenue) || 0,
      netRevenue: Number(netRevenue) || 0,
      fees: Number(fees) || 0,
      checkedAt: new Date(checkedAt).toISOString(),
      notes: notes.trim() || undefined,
    });
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        <span className={FIELD_LABEL}>Data source</span>
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

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tickets sold" value={ticketsSold} onChange={setTicketsSold} />
        <Field label="Total capacity" value={capacity} onChange={setCapacity} />
        <Field label="Gross revenue" value={grossRevenue} onChange={setGrossRevenue} />
        <Field label="Net revenue" value={netRevenue} onChange={setNetRevenue} />
        <Field label="Fees" value={fees} onChange={setFees} />
        <label className="block">
          <span className={FIELD_LABEL}>Checked at</span>
          <input
            type="datetime-local"
            className={`${INPUT_SURFACE} mt-1`}
            value={checkedAt}
            onChange={(e) => setCheckedAt(e.target.value)}
            required
          />
        </label>
      </div>

      <label className="block">
        <span className={FIELD_LABEL}>Notes</span>
        <textarea
          className="mt-1 min-h-[64px] w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2 text-[13px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional context — e.g. after presale drop"
        />
      </label>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className={FIELD_LABEL}>{label}</span>
      <input
        type="number"
        min={0}
        step="any"
        className={`${INPUT_SURFACE} mt-1`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
