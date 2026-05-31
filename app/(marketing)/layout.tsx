import type { Metadata } from "next";

import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import MarketingNav from "@/app/components/marketing/MarketingNav";
import LenisProvider from "@/app/components/marketing/landing/LenisProvider";
import { site } from "@/lib/marketing/site-meta";

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    type: "website",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0B10] text-[#F5F5F7]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-0 size-[480px] rounded-full bg-[#7C3AED]/12 blur-[120px]" />
        <div className="absolute -right-24 top-1/3 size-[400px] rounded-full bg-[#4C1D95]/15 blur-[100px]" />
      </div>
      <MarketingNav />
      <LenisProvider>
        <main>{children}</main>
      </LenisProvider>
      <MarketingFooter />
    </div>
  );
}
