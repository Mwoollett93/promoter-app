import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`relative px-5 py-20 lg:px-8 lg:py-28 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? (
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8B5CF6]">{eyebrow}</p>
      ) : null}
      <h2 className="mt-3 text-[32px] font-bold leading-[1.1] tracking-tight text-[#F5F5F7] sm:text-[40px]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-[16px] leading-7 text-[#A1A1AA]">{description}</p>
      ) : null}
    </div>
  );
}

export function PrimaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-lg border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] px-7 text-[15px] font-medium text-white transition-all hover:border-[#A855F7] hover:shadow-[0_0_28px_rgba(139,92,246,0.4)]"
    >
      {children}
    </Link>
  );
}

export function SecondaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center rounded-lg border border-[#3F3F46] bg-[#11111A] px-7 text-[15px] font-medium text-[#E4E4E7] transition-colors hover:border-[#52525B] hover:text-[#F5F5F7]"
    >
      {children}
    </Link>
  );
}

export function GlowCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-[#232330] bg-[#11111A]/90 p-6 shadow-[0px_20px_60px_rgba(0,0,0,0.45)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
}) {
  const inner = (
    <GlowCard className="h-full transition-colors hover:border-[#8B5CF6]/40">
      <div className="flex size-11 items-center justify-center rounded-xl bg-[#1A1630] text-[#C4B5FD] ring-1 ring-[#8B5CF6]/25">
        <Icon className="size-5" strokeWidth={2} />
      </div>
      <h3 className="mt-5 text-[18px] font-semibold text-[#F5F5F7]">{title}</h3>
      <p className="mt-2 text-[14px] leading-6 text-[#A1A1AA]">{description}</p>
    </GlowCard>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {inner}
      </Link>
    );
  }

  return inner;
}
