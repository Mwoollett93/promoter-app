import type { Metadata } from "next";
import Link from "next/link";
import { AtSign, MessageCircle } from "lucide-react";

import ContactForm from "@/app/components/marketing/ContactForm";
import { PrimaryCta, Section } from "@/app/components/marketing/marketing-ui";

export const metadata: Metadata = {
  title: "Contact",
  description: "Book a demo, join the waitlist, or reach the PromoSync team.",
};

export default function ContactPage() {
  return (
    <>
      <Section className="pt-16 lg:pt-24">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8B5CF6]">
              Contact
            </p>
            <h1 className="mt-4 text-[40px] font-bold leading-tight tracking-tight text-[#F5F5F7] sm:text-[44px]">
              Book a demo or say hello
            </h1>
            <p className="mt-5 text-[17px] leading-7 text-[#A1A1AA]">
              We&apos;re in early access with promoters in Melbourne and beyond. Tell us how you
              run nights — we&apos;ll show you how PromoSync fits.
            </p>

            <div className="mt-10 space-y-6">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#71717A]">
                  Community
                </p>
                <ul className="mt-3 space-y-2">
                  <li>
                    <a
                      href="#"
                      className="inline-flex items-center gap-2 text-[15px] text-[#C4B5FD] hover:text-[#E9D5FF]"
                    >
                      <MessageCircle className="size-4" />
                      Discord (coming soon)
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="inline-flex items-center gap-2 text-[15px] text-[#C4B5FD] hover:text-[#E9D5FF]"
                    >
                      <AtSign className="size-4" />
                      @promosync
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#71717A]">
                  Already have an account?
                </p>
                <Link href="/login" className="mt-2 inline-block text-[15px] text-[#E4E4E7] hover:text-[#F5F5F7]">
                  Log in →
                </Link>
              </div>
              <PrimaryCta href="/login?view=signup">Create account</PrimaryCta>
            </div>
          </div>

          <div className="rounded-2xl border border-[#232330] bg-[#11111A] p-8">
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  );
}
