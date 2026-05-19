"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUpDown } from "lucide-react";

import { useSettings } from "@/lib/settings/SettingsProvider";

export function ManagementTableCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#232330] bg-[#11111A] p-5 shadow-[0px_10px_40px_0px_rgba(0,0,0,0.35)]">
      {children}
    </section>
  );
}

export function ManagementTableViewport({
  children,
  minWidth = 880,
}: {
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#232330] bg-[#0B0B10]">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse" style={{ minWidth: `${minWidth}px` }}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function ManagementTableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-[#232330] bg-[#0F0F17] text-left text-xs font-medium text-[#A1A1AA]">
        {children}
      </tr>
    </thead>
  );
}

export function ManagementTableHeaderCell({
  children,
  className = "",
  align = "left",
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <th className={`px-4 py-4 ${align === "right" ? "text-right" : "text-left"} ${className}`}>
      {children}
    </th>
  );
}

export function managementTableRowClass(selected: boolean) {
  return [
    "cursor-pointer border-b border-[#232330]/80 text-sm transition-colors last:border-0 hover:bg-[#181824]",
    selected ? "bg-[#1A1430] shadow-[inset_0_0_0_1px_rgba(139,92,246,0.65)]" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function ManagementTableCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { settings } = useSettings();
  const density = settings.preferences.compactTables ? "py-2" : "py-3";

  return <td className={`px-4 ${density} ${className}`}>{children}</td>;
}

export function ManagementTableEmptyState({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center text-sm text-[#A1A1AA]">
        {children}
      </td>
    </tr>
  );
}

export function SortableManagementHeader<T extends string>({
  label,
  sortKey,
  current,
  direction,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: T;
  current: T;
  direction: "asc" | "desc";
  onSort: (key: T) => void;
  align?: "left" | "right";
}) {
  const active = current === sortKey;

  return (
    <ManagementTableHeaderCell align={align}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1.5 hover:text-[#F5F5F7]"
      >
        {label}
        {active && direction === "desc" ? (
          <ArrowDown className="size-3.5" aria-hidden />
        ) : (
          <ArrowUpDown className="size-3.5" aria-hidden />
        )}
      </button>
    </ManagementTableHeaderCell>
  );
}

export function ManagementTablePagination({
  page,
  totalPages,
  pageSize,
  totalCount,
  entityLabel,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  entityLabel: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <footer className="mt-3 flex flex-col gap-3 text-sm text-[#A1A1AA] sm:flex-row sm:items-center sm:justify-between">
      <span>
        Showing {start} to {end} of {totalCount} {entityLabel}
      </span>
      <div className="flex items-center justify-end gap-2">
        <ManagementTablePaginationButton disabled={page <= 1} onClick={onPrevious}>
          Previous
        </ManagementTablePaginationButton>
        <span className="rounded-md bg-[#7C3AED] px-3 py-1.5 text-white">
          {page}
        </span>
        <ManagementTablePaginationButton disabled={page >= totalPages} onClick={onNext}>
          Next
        </ManagementTablePaginationButton>
      </div>
    </footer>
  );
}

export function ManagementTablePaginationButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-[#232330] px-3 py-1.5 text-[#E4E4E7] hover:border-[#8B5CF6]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}
