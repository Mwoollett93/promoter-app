import type { ReactNode } from "react";

export default function ActionComingSoonTile({
  icon,
  label,
  title = "Coming soon",
}: {
  icon: ReactNode;
  label: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled
      title={title}
      aria-disabled="true"
      className="flex min-h-[62px] cursor-not-allowed flex-col items-center justify-center gap-1.5 rounded-lg border border-[#232330] bg-[#0F0F17] px-2 py-2 text-[#71717A] opacity-60"
    >
      {icon}
      {label}
    </button>
  );
}
