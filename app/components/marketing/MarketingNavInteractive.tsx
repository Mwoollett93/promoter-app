"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useState } from "react";

import type { NavLink } from "@/lib/marketing/site-meta";
import { cn } from "@/lib/utils";

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg aria-hidden className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg aria-hidden className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function navLinkClass(active: boolean) {
  return [
    "text-[14px] font-medium transition-colors",
    active ? "text-[#C4B5FD]" : "text-[#A1A1AA] hover:text-[#F5F5F7]",
  ].join(" ");
}

export default function MarketingNavInteractive({ links }: { links: readonly NavLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={navLinkClass(pathname === link.href)}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="hidden items-center gap-3 md:flex">
        <Link
          href="/login"
          className="text-[14px] font-medium text-[#A1A1AA] transition-colors hover:text-[#F5F5F7]"
        >
          Log in
        </Link>
        <Link
          href="/login?view=signup"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] px-5 text-[14px] font-medium text-white transition-all hover:border-[#A855F7] hover:shadow-[0_0_24px_rgba(139,92,246,0.35)]"
        >
          Get started
        </Link>
      </div>

      {/* Radix Dialog — keyboard-trappable mobile nav with focus management */}
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Trigger asChild>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-lg border border-[#3F3F46] text-[#E4E4E7] md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <MenuIcon open={open} />
          </button>
        </DialogPrimitive.Trigger>

        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              "fixed inset-0 z-40 bg-[#0B0B10]/80 backdrop-blur-sm md:hidden",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "motion-reduce:animate-none",
            )}
          />
          <DialogPrimitive.Content
            className={cn(
              "fixed inset-x-0 top-16 z-50 border-t border-[#232330] bg-[#0B0B10] px-5 py-4 md:hidden",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2",
              "motion-reduce:animate-none",
            )}
          >
            <DialogPrimitive.Title className="sr-only">Navigation menu</DialogPrimitive.Title>
            <nav className="flex flex-col gap-3" aria-label="Mobile">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-[15px] font-medium text-[#E4E4E7]"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/login" onClick={() => setOpen(false)} className="text-[15px] text-[#A1A1AA]">
                Log in
              </Link>
              <Link
                href="/login?view=signup"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#7C3AED] px-5 text-[15px] font-medium text-white"
              >
                Get started
              </Link>
            </nav>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
