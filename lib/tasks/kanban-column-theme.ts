import type { LucideIcon } from "lucide-react";
import {
  Archive,
  CheckCircle2,
  CircleDot,
  Loader2,
  PauseCircle,
} from "lucide-react";

import type { TaskColumn } from "@/lib/types/collaboration";

export type KanbanColumnTheme = {
  label: string;
  Icon: LucideIcon;
  headerClass: string;
  columnClass: string;
  dropGlow: string;
  badgeClass: string;
  accentBar: string;
};

export const KANBAN_COLUMN_THEME: Record<TaskColumn, KanbanColumnTheme> = {
  backlog: {
    label: "Backlog",
    Icon: Archive,
    headerClass: "border-[#3F3F46]/80 bg-gradient-to-r from-[#18181F] to-[#11111A]",
    columnClass: "border-[#2A2A35]/90 bg-[#0A0A0F]/80",
    dropGlow: "shadow-[inset_0_0_24px_rgba(113,113,122,0.08)]",
    badgeClass: "border-[#3F3F46] bg-[#18181F] text-[#A1A1AA]",
    accentBar: "bg-[#52525B]",
  },
  todo: {
    label: "To Do",
    Icon: CircleDot,
    headerClass: "border-[#8B5CF6]/25 bg-gradient-to-r from-[#1A1630]/90 to-[#11111A]",
    columnClass: "border-[#8B5CF6]/15 bg-[#0D0B14]/90",
    dropGlow: "shadow-[inset_0_0_28px_rgba(139,92,246,0.12)]",
    badgeClass: "border-[#8B5CF6]/35 bg-[#1A1630]/70 text-[#C4B5FD]",
    accentBar: "bg-[#8B5CF6]",
  },
  in_progress: {
    label: "In Progress",
    Icon: Loader2,
    headerClass: "border-[#3B82F6]/25 bg-gradient-to-r from-[#0F172A]/80 to-[#11111A]",
    columnClass: "border-[#3B82F6]/15 bg-[#0A0E14]/90",
    dropGlow: "shadow-[inset_0_0_28px_rgba(59,130,246,0.12)]",
    badgeClass: "border-[#3B82F6]/35 bg-[#172554]/50 text-[#93C5FD]",
    accentBar: "bg-[#3B82F6]",
  },
  waiting: {
    label: "Waiting",
    Icon: PauseCircle,
    headerClass: "border-[#F59E0B]/25 bg-gradient-to-r from-[#1C1408]/80 to-[#11111A]",
    columnClass: "border-[#F59E0B]/15 bg-[#100E0A]/90",
    dropGlow: "shadow-[inset_0_0_28px_rgba(245,158,11,0.1)]",
    badgeClass: "border-[#F59E0B]/35 bg-[#422006]/40 text-[#FCD34D]",
    accentBar: "bg-[#F59E0B]",
  },
  complete: {
    label: "Complete",
    Icon: CheckCircle2,
    headerClass: "border-[#22C55E]/20 bg-gradient-to-r from-[#0F2417]/80 to-[#11111A]",
    columnClass: "border-[#22C55E]/15 bg-[#0A100D]/90",
    dropGlow: "shadow-[inset_0_0_28px_rgba(34,197,94,0.08)]",
    badgeClass: "border-[#22C55E]/30 bg-[#14532D]/40 text-[#86EFAC]",
    accentBar: "bg-[#22C55E]",
  },
};
