"use client";

import * as React from "react";
import { Plus, Upload } from "lucide-react";

import BreakEvenPanel from "@/app/components/ticket-sales/BreakEvenPanel";
import CheckpointHistoryList from "@/app/components/ticket-sales/CheckpointHistoryList";
import CheckpointHistoryModal from "@/app/components/ticket-sales/CheckpointHistoryModal";
import CsvImportPanel, {
  type CsvImportPanelState,
} from "@/app/components/ticket-sales/CsvImportPanel";
import IntegrationsMenu from "@/app/components/ticket-sales/IntegrationsMenu";
import ManualCheckpointForm from "@/app/components/ticket-sales/ManualCheckpointForm";
import SalesCompactChart from "@/app/components/ticket-sales/SalesCompactChart";
import SalesRevenueVelocityPanel from "@/app/components/ticket-sales/SalesRevenueVelocityPanel";
import SalesSourceBadges from "@/app/components/ticket-sales/SalesSourceBadges";
import SalesSummaryCards from "@/app/components/ticket-sales/SalesSummaryCards";
import SalesTierBreakdown from "@/app/components/ticket-sales/SalesTierBreakdown";
import SalesTrackerModal from "@/app/components/ticket-sales/SalesTrackerModal";
import Button from "@/app/components/ui/Button";
import { GRID_CARD_GAP } from "@/lib/layout/page-layout";
import {
  buildChartSeries,
  computeBreakEvenMetrics,
  computeSalesMetrics,
  getEventCapacity,
} from "@/lib/ticket-sales/analytics";
import { ticketSalesRepository } from "@/lib/ticket-sales/repository";
import type { CsvImportInput, ManualCheckpointInput } from "@/lib/ticket-sales/types";
import type { WorkspaceEvent } from "@/lib/types/collaboration";
import { PAGE_EYEBROW } from "@/lib/ui/page-surfaces";

const CHECKPOINT_FORM_ID = "sales-checkpoint-form";

type SalesTrackerTabProps = {
  eventId: string;
  event: WorkspaceEvent;
};

export default function SalesTrackerTab({ eventId, event }: SalesTrackerTabProps) {
  const [snapshot, setSnapshot] = React.useState(() => ticketSalesRepository.load(eventId));
  const [checkpointOpen, setCheckpointOpen] = React.useState(false);
  const [csvOpen, setCsvOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [modalResetKey, setModalResetKey] = React.useState(0);
  const [csvState, setCsvState] = React.useState<CsvImportPanelState>({
    canImport: false,
    triggerImport: () => {},
  });

  const refresh = React.useCallback(() => {
    setSnapshot(ticketSalesRepository.load(eventId));
  }, [eventId]);

  const metrics = computeSalesMetrics(snapshot, event);
  const breakEven = computeBreakEvenMetrics(metrics, event);
  const charts = buildChartSeries(snapshot);
  const defaultCapacity = getEventCapacity(event, metrics.capacity);
  const chartId = eventId.slice(0, 8);

  function openCheckpointModal() {
    setCsvOpen(false);
    setHistoryOpen(false);
    setModalResetKey((k) => k + 1);
    setCheckpointOpen(true);
  }

  function openCsvModal() {
    setCheckpointOpen(false);
    setHistoryOpen(false);
    setModalResetKey((k) => k + 1);
    setCsvOpen(true);
  }

  const handleCheckpointOpenChange = React.useCallback((next: boolean) => {
    setCheckpointOpen(next);
  }, []);

  const handleCsvOpenChange = React.useCallback((next: boolean) => {
    setCsvOpen(next);
    if (!next) {
      setCsvState({ canImport: false, triggerImport: () => {} });
    }
  }, []);

  const handleHistoryOpenChange = React.useCallback((next: boolean) => {
    setHistoryOpen(next);
  }, []);

  React.useEffect(() => {
    return () => {
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("padding-right");
      document.body.style.removeProperty("pointer-events");
      document.body.removeAttribute("data-scroll-locked");
    };
  }, []);

  const handleCheckpoint = React.useCallback(
    (input: ManualCheckpointInput) => {
      ticketSalesRepository.addManualCheckpoint(eventId, input);
      refresh();
      setCheckpointOpen(false);
    },
    [eventId, refresh],
  );

  const handleCsvImport = React.useCallback(
    (input: CsvImportInput) => {
      ticketSalesRepository.importTicketSalesCsv(eventId, input);
      refresh();
      setCsvOpen(false);
    },
    [eventId, refresh],
  );

  const handleCsvStateChange = React.useCallback((state: CsvImportPanelState) => {
    setCsvState(state);
  }, []);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden lg:max-h-[calc(100vh-220px)]">
        {/* Header row */}
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className={PAGE_EYEBROW}>Ticket sales monitoring</p>
            <SalesSourceBadges snapshot={snapshot} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <IntegrationsMenu />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={openCsvModal}
            >
              <Upload className="size-4" aria-hidden />
              Import CSV
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={openCheckpointModal}
            >
              <Plus className="size-4" aria-hidden />
              Add checkpoint
            </Button>
          </div>
        </div>

        {/* KPI row */}
        <div className="shrink-0">
          <SalesSummaryCards metrics={metrics} breakEvenPct={breakEven.percentToBreakEven} />
        </div>

        {/* Main cockpit grid */}
        <div className={`grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-3 ${GRID_CARD_GAP}`}>
          <BreakEvenPanel metrics={breakEven} className="min-h-[180px] lg:min-h-0" />
          <SalesCompactChart
            title="Tickets sold over time"
            values={charts.ticketsOverTime.map((p) => p.value)}
            gradientId={`${chartId}-tickets`}
            emptyLabel="Add a checkpoint to start tracking."
            className="min-h-[180px] lg:min-h-0"
            height={88}
          />
          <SalesRevenueVelocityPanel
            revenueValues={charts.revenueOverTime.map((p) => p.net)}
            velocityValues={charts.dailyVelocity.map((p) => p.tickets)}
            chartId={chartId}
            className="min-h-[180px] lg:min-h-0"
          />
        </div>

        {/* Bottom row — only internal scroll in checkpoint list */}
        <div className={`grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-2 ${GRID_CARD_GAP} lg:h-[148px]`}>
          <CheckpointHistoryList
            checkpoints={snapshot.checkpoints}
            limit={5}
            onViewAll={() => setHistoryOpen(true)}
            className="min-h-[120px] lg:min-h-0"
          />
          <SalesTierBreakdown tiers={charts.tierBreakdown} className="min-h-[120px] lg:min-h-0" />
        </div>
      </div>

      {/* Modals — forms never expand the main layout */}
      <SalesTrackerModal
        open={checkpointOpen}
        onOpenChange={handleCheckpointOpenChange}
        title="Add sales checkpoint"
        description="Record a snapshot from your ticketing dashboard — no scraping required."
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setCheckpointOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form={CHECKPOINT_FORM_ID} variant="primary" size="sm">
              Save checkpoint
            </Button>
          </>
        }
      >
        {checkpointOpen ? (
          <ManualCheckpointForm
            formId={CHECKPOINT_FORM_ID}
            defaultCapacity={defaultCapacity}
            onSubmit={handleCheckpoint}
            resetKey={modalResetKey}
          />
        ) : null}
      </SalesTrackerModal>

      <SalesTrackerModal
        open={csvOpen}
        onOpenChange={handleCsvOpenChange}
        title="Import ticket sales report"
        description="Upload a CSV export from your ticketing platform. Map columns if headers differ."
        size="lg"
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => handleCsvOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!csvState.canImport}
              onClick={() => csvState.triggerImport()}
            >
              Import &amp; create checkpoint
            </Button>
          </>
        }
      >
        {csvOpen ? (
          <CsvImportPanel
            resetKey={modalResetKey}
            onImport={handleCsvImport}
            onStateChange={handleCsvStateChange}
          />
        ) : null}
      </SalesTrackerModal>

      <CheckpointHistoryModal
        open={historyOpen}
        onOpenChange={handleHistoryOpenChange}
        checkpoints={snapshot.checkpoints}
      />
    </>
  );
}
