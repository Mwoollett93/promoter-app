import type { Metadata } from "next";
import Link from "next/link";
import { AtSign, Mail, MessageCircle } from "lucide-react";

import ContactForm from "@/app/components/marketing/ContactForm";
import { PrimaryCta, Section } from "@/app/components/marketing/marketing-ui";
import { siteLinks } from "@/lib/marketing/site-links";

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
              We&apos;re in early access with promoters in Melbourne and beyond. Tell us how you run
              nights — we&apos;ll show you how PromoSync fits.
            </p>

            <div className="mt-10 space-y-6">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#71717A]">
                  Community
                </p>
                <ul className="mt-3 space-y-2">
                  {siteLinks.discord ? (
                    <li>
                      <a
                        href={siteLinks.discord}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[15px] text-[#C4B5FD] hover:text-[#E9D5FF]"
                      >
                        <MessageCircle className="size-4" />
                        Discord
                      </a>
                    </li>
                  ) : (
                    <li className="inline-flex items-center gap-2 text-[15px] text-[#71717A]">
                      <MessageCircle className="size-4" />
                      Discord — coming soon
                    </li>
                  )}
                  {siteLinks.instagram ? (
                    <li>
                      <a
                        href={siteLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[15px] text-[#C4B5FD] hover:text-[#E9D5FF]"
                      >
                        <AtSign className="size-4" />
                        @promosync
                      </a>
                    </li>
                  ) : (
                    <li>
                      <a
                        href={`mailto:${siteLinks.contactEmail}`}
                        className="inline-flex items-center gap-2 text-[15px] text-[#C4B5FD] hover:text-[#E9D5FF]"
                      >
                        <Mail className="size-4" />
                        {siteLinks.contactEmail}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#71717A]">
                  Already have an account?
                </p>
                <Link
                  href="/login"
                  className="mt-2 inline-block text-[15px] text-[#E4E4E7] hover:text-[#F5F5F7]"
                >
                  Log in →
                </Link>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </Section>

      <Section className="border-t border-[#232330] py-16">
        <div className="text-center">
          <h2 className="text-[24px] font-bold text-[#F5F5F7]">Ready to run your next night?</h2>
          <p className="mt-3 text-[15px] text-[#A1A1AA]">Create an account and start your first event.</p>
          <div className="mt-8 flex justify-center">
            <PrimaryCta href="/login?view=signup">Get started</PrimaryCta>
          </div>
        </div>
      </Section>
    </>
  );
}
