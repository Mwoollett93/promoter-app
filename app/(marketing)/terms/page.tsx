import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/app/components/marketing/marketing-ui";
import { site } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${site.name}.`,
};

export default function TermsPage() {
  return (
    <Section className="pt-16 lg:pt-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8B5CF6]">Legal</p>
        <h1 className="mt-4 text-[36px] font-bold tracking-tight text-[#F5F5F7]">Terms of Service</h1>
        <p className="mt-4 text-[15px] leading-7 text-[#A1A1AA]">
          These terms govern your use of {site.name}. We&apos;re in early access — this page will be
          updated as we move toward general availability.
        </p>
        <div className="prose-invert mt-10 space-y-6 text-[15px] leading-7 text-[#D4D4D8]">
          <section>
            <h2 className="text-[18px] font-semibold text-[#F5F5F7]">Use of the product</h2>
            <p className="mt-2">
              You agree to use PromoSync for lawful event promotion and operations. You are
              responsible for the accuracy of data you enter about venues, artists, and events.
            </p>
          </section>
          <section>
            <h2 className="text-[18px] font-semibold text-[#F5F5F7]">Accounts</h2>
            <p className="mt-2">
              Keep your login credentials secure. Team members you invite can access workspace data
              according to their role.
            </p>
          </section>
          <section>
            <h2 className="text-[18px] font-semibold text-[#F5F5F7]">Contact</h2>
            <p className="mt-2">
              Questions about these terms?{" "}
              <Link href="/contact" className="text-[#C4B5FD] hover:text-[#E9D5FF]">
                Contact us
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </Section>
  );
}
