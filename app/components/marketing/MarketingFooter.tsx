import Link from "next/link";

import { navLinks, site } from "@/lib/marketing/content";
import { siteLinks } from "@/lib/marketing/site-links";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-[#232330] bg-[#08080C]">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/Promosync_icon.svg"
                alt=""
                width={28}
                height={28}
                className="size-7 brightness-0 invert"
              />
              <span className="text-[16px] font-bold text-[#F5F5F7]">{site.name}</span>
            </div>
            <p className="mt-4 max-w-sm text-[14px] leading-6 text-[#A1A1AA]">{site.description}</p>
            <p className="mt-6 text-[12px] uppercase tracking-[0.12em] text-[#8B5CF6]">
              Mission control for events
            </p>
          </div>

          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#71717A]">Product</p>
            <ul className="mt-4 space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-[#A1A1AA] transition-colors hover:text-[#F5F5F7]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#71717A]">Get started</p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/login?view=signup" className="text-[14px] text-[#C4B5FD] hover:text-[#E9D5FF]">
                  Create account
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[14px] text-[#A1A1AA] hover:text-[#F5F5F7]">
                  Book a demo
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-[14px] text-[#A1A1AA] hover:text-[#F5F5F7]">
                  Log in
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[#232330] pt-8 text-[13px] text-[#71717A] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. Built by promoters, for promoters.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href={siteLinks.terms} className="text-[#A1A1AA] transition-colors hover:text-[#F5F5F7]">
              Terms of Service
            </Link>
            <Link href={siteLinks.privacy} className="text-[#A1A1AA] transition-colors hover:text-[#F5F5F7]">
              Privacy Policy
            </Link>
            <span className="hidden text-[#3F3F46] sm:inline">·</span>
            <span>Melbourne · Underground · Independent</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
