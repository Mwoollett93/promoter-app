import { cn } from "@/lib/utils";

type BetaBadgeProps = {
  className?: string;
  label?: string;
};

export default function BetaBadge({ className, label = "Beta" }: BetaBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-[#8B5CF6]/45 bg-[#7C3AED]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#C4B5FD]",
        className,
      )}
    >
      {label}
    </span>
  );
}
