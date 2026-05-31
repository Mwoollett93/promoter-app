"use client";

import * as React from "react";
import { Plus, Upload } from "lucide-react";

import BreakEvenPanel from "@/app/components/ticket-sales/BreakEvenPanel";
import CheckpointHistoryList from "@/app/components/ticket-sales/CheckpointHistoryList";
import ConnectSourcePlaceholder from "@/app/components/ticket-sales/ConnectSourcePlaceholder";
import CsvImportPanel from "@/app/components/ticket-sales/CsvImportPanel";
import ManualCheckpointForm from "@/app/components/ticket-sales/ManualCheckpointForm";
import SalesChartsPanel from "@/app/components/ticket-sales/SalesChartsPanel";
import SalesEmptyState from "@/app/components/ticket-sales/SalesEmptyState";
import SalesSourceBadges from "@/app/components/ticket-sales/SalesSourceBadges";
import SalesSummaryCards from "@/app/components/ticket-sales/SalesSummaryCards";
import Button from "@/app/components/ui/Button";
import { GRID_CARD_GAP, PAGE_STACK_GAP } from "@/lib/layout/page-layout";
import {
  buildChartSeries,
  computeBreakEvenMetrics,
  computeSalesMetrics,
  getEventCapacity,
  hasSalesData,
} from "@/lib/ticket-sales/analytics";
import { ticketSalesRepository } from "@/lib/ticket-sales/repository";
import type { CsvImportInput, ManualCheckpointInput } from "@/lib/ticket-sales/types";
import type { WorkspaceEvent } from "@/lib/types/collaboration";
import { PAGE_DESCRIPTION } from "@/lib/ui/page-surfaces";

type SalesTrackerTabProps = {
  eventId: string;
  event: WorkspaceEvent;
};

type PanelMode = "none" | "checkpoint" | "csv";

export default function SalesTrackerTab({ eventId, event }: SalesTrackerTabProps) {
  const [snapshot, setSnapshot] = React.useState(() => ticketSalesRepository.load(eventId));
  const [panel, setPanel] = React.useState<PanelMode>("none");

  const refresh = React.useCallback(() => {
    setSnapshot(ticketSalesRepository.load(eventId));
  }, [eventId]);

  const metrics = computeSalesMetrics(snapshot, event);
  const breakEven = computeBreakEvenMetrics(metrics, event);
  const charts = buildChartSeries(snapshot);
  const showData = hasSalesData(snapshot);
  const defaultCapacity = getEventCapacity(event, metrics.capacity);

  function handleCheckpoint(input: ManualCheckpointInput) {
    ticketSalesRepository.addManualCheckpoint(eventId, input);
    refresh();
    setPanel("none");
  }

  function handleCsvImport(input: CsvImportInput) {
    ticketSalesRepository.importTicketSalesCsv(eventId, input);
    refresh();
    setPanel("none");
  }

  return (
    <div className={`flex flex-col ${PAGE_STACK_GAP}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8B5CF6]">
            Ticket sales monitoring
          </p>
          <p className={PAGE_DESCRIPTION}>
            Compliant tracking via manual checkpoints and CSV imports — no scraping.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={() => setPanel(panel === "csv" ? "none" : "csv")}
          >
            <Upload className="size-4" aria-hidden />
            Import CSV
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={() => setPanel(panel === "checkpoint" ? "none" : "checkpoint")}
          >
            <Plus className="size-4" aria-hidden />
            Add checkpoint
          </Button>
        </div>
      </div>

      <SalesSourceBadges snapshot={snapshot} />

      {!showData && panel === "none" ? (
        <SalesEmptyState
          onAddCheckpoint={() => setPanel("checkpoint")}
          onImportCsv={() => setPanel("csv")}
        />
      ) : (
        <>
          <SalesSummaryCards metrics={metrics} />

          <div className={`grid grid-cols-1 lg:grid-cols-3 ${GRID_CARD_GAP}`}>
            <div className="lg:col-span-1">
              <BreakEvenPanel metrics={breakEven} />
            </div>
            <div className="lg:col-span-2">
              <SalesChartsPanel series={charts} chartId={eventId.slice(0, 8)} />
            </div>
          </div>
        </>
      )}

      {panel === "checkpoint" ? (
        <ManualCheckpointForm
          defaultCapacity={defaultCapacity}
          onSubmit={handleCheckpoint}
          onCancel={() => setPanel("none")}
        />
      ) : null}

      {panel === "csv" ? (
        <CsvImportPanel onImport={handleCsvImport} onCancel={() => setPanel("none")} />
      ) : null}

      {showData ? <CheckpointHistoryList checkpoints={snapshot.checkpoints} /> : null}

      <ConnectSourcePlaceholder />
    </div>
  );
}
