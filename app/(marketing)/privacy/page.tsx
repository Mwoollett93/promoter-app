import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/app/components/marketing/marketing-ui";
import { site } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${site.name}.`,
};

export default function PrivacyPage() {
  return (
    <Section className="pt-16 lg:pt-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8B5CF6]">Legal</p>
        <h1 className="mt-4 text-[36px] font-bold tracking-tight text-[#F5F5F7]">Privacy Policy</h1>
        <p className="mt-4 text-[15px] leading-7 text-[#A1A1AA]">
          How {site.name} handles your data. You can export a privacy report from Settings → Account.
        </p>
        <div className="mt-10 space-y-6 text-[15px] leading-7 text-[#D4D4D8]">
          <section>
            <h2 className="text-[18px] font-semibold text-[#F5F5F7]">What we collect</h2>
            <p className="mt-2">
              Account email, profile details you provide, and operational data you create (events,
              venues, artists, tasks, and team activity).
            </p>
          </section>
          <section>
            <h2 className="text-[18px] font-semibold text-[#F5F5F7]">How we use it</h2>
            <p className="mt-2">
              To run the product, sync your workspace, send transactional emails (invites,
              notifications), and improve PromoSync.
            </p>
          </section>
          <section>
            <h2 className="text-[18px] font-semibold text-[#F5F5F7]">Your choices</h2>
            <p className="mt-2">
              Export or delete account data from Settings. For other requests,{" "}
              <Link href="/contact" className="text-[#C4B5FD] hover:text-[#E9D5FF]">
                contact us
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </Section>
  );
}
