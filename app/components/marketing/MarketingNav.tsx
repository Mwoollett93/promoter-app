"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { navLinks, site } from "@/lib/marketing/content";

export default function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#232330]/80 bg-[#0B0B10]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/Promosync_icon.svg"
            alt=""
            width={32}
            height={32}
            className="size-8 brightness-0 invert"
          />
          <span className="text-[17px] font-bold tracking-tight text-[#F5F5F7]">{site.name}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "text-[14px] font-medium transition-colors",
                pathname === link.href ? "text-[#C4B5FD]" : "text-[#A1A1AA] hover:text-[#F5F5F7]",
              ].join(" ")}
            >
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

        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-lg border border-[#3F3F46] text-[#E4E4E7] md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#232330] bg-[#0B0B10] px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
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
        </div>
      ) : null}
    </header>
  );
}
