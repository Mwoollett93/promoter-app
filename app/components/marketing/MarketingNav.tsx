import Link from "next/link";

import MarketingNavInteractive from "@/app/components/marketing/MarketingNavInteractive";
import { navLinks, site } from "@/lib/marketing/site-meta";

export default function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#232330]/80 bg-[#0B0B10]/85 backdrop-blur-xl">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
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

        <MarketingNavInteractive links={navLinks} />
      </div>
    </header>
  );
}
