"use client";

import type { ReactNode } from "react";
import { Sparkles, X } from "lucide-react";

type ArtistAiLookupModalProps = {
  open: boolean;
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string;
  zIndexClass?: string;
  onClose: () => void;
};

export function ArtistAiLookupEyebrow() {
  return (
    <div className="flex items-center gap-2 text-[#8B5CF6]">
      <Sparkles className="size-4 shrink-0" aria-hidden />
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">AI Artist Lookup</span>
    </div>
  );
}

export default function ArtistAiLookupModal({
  open,
  title,
  subtitle,
  children,
  footer,
  maxWidthClass = "max-w-3xl",
  zIndexClass = "z-50",
  onClose,
}: ArtistAiLookupModalProps) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]`}
      onClick={onClose}
    >
      <section
        className={[
          "flex max-h-[min(90vh,880px)] w-full flex-col overflow-hidden rounded-2xl border border-[#232330] bg-[#11111A]",
          "shadow-[0_0_48px_rgba(139,92,246,0.1)]",
          maxWidthClass,
        ].join(" ")}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 border-b border-[#232330] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <ArtistAiLookupEyebrow />
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#F5F5F7]">{title}</h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[#A1A1AA]">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1 text-[#71717A] transition-colors hover:bg-[#232330] hover:text-white"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <footer className="shrink-0 border-t border-[#232330] bg-[#0D0D12] px-6 py-4">{footer}</footer>
        ) : null}
      </section>
    </div>
  );
}
