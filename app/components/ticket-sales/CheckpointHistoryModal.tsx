"use client";

import CheckpointHistoryList from "@/app/components/ticket-sales/CheckpointHistoryList";
import SalesTrackerModal from "@/app/components/ticket-sales/SalesTrackerModal";
import type { SalesCheckpoint } from "@/lib/ticket-sales/types";

type CheckpointHistoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkpoints: SalesCheckpoint[];
};

/** Full checkpoint list — opened from “View all” without expanding the main page. */
export default function CheckpointHistoryModal({
  open,
  onOpenChange,
  checkpoints,
}: CheckpointHistoryModalProps) {
  return (
    <SalesTrackerModal
      open={open}
      onOpenChange={onOpenChange}
      title="All sales checkpoints"
      description="Complete history for this event."
      size="lg"
    >
      <CheckpointHistoryList checkpoints={checkpoints} limit={checkpoints.length} />
    </SalesTrackerModal>
  );
}
