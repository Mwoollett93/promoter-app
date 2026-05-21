"use client";

import { useState } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#8B5CF6]/30 bg-[#1A1630]/40 p-8 text-center">
        <p className="text-[18px] font-semibold text-[#F5F5F7]">Thanks — we&apos;ll be in touch.</p>
        <p className="mt-2 text-[14px] text-[#A1A1AA]">
          Demo requests and waitlist signups are reviewed manually while we&apos;re in early access.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-[12px] font-medium uppercase tracking-wide text-[#71717A]">
            Name
          </span>
          <input
            required
            name="name"
            className="mt-2 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-4 py-3 text-[15px] text-[#F5F5F7] outline-none ring-[#8B5CF6]/0 transition focus:border-[#8B5CF6]/50 focus:ring-2 focus:ring-[#8B5CF6]/25"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-medium uppercase tracking-wide text-[#71717A]">
            Email
          </span>
          <input
            required
            type="email"
            name="email"
            className="mt-2 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-4 py-3 text-[15px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]/50 focus:ring-2 focus:ring-[#8B5CF6]/25"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-[12px] font-medium uppercase tracking-wide text-[#71717A]">
          I&apos;m interested in
        </span>
        <select
          name="intent"
          className="mt-2 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-4 py-3 text-[15px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]/50"
          defaultValue="demo"
        >
          <option value="demo">Booking a demo</option>
          <option value="waitlist">Joining the waitlist</option>
          <option value="collective">Collective / venue plan</option>
          <option value="other">Something else</option>
        </select>
      </label>
      <label className="block">
        <span className="text-[12px] font-medium uppercase tracking-wide text-[#71717A]">
          Message
        </span>
        <textarea
          name="message"
          rows={4}
          className="mt-2 w-full resize-y rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-4 py-3 text-[15px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]/50 focus:ring-2 focus:ring-[#8B5CF6]/25"
          placeholder="Tell us about your nights, city, and team size…"
        />
      </label>
      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] px-7 text-[15px] font-medium text-white transition-all hover:border-[#A855F7] hover:shadow-[0_0_28px_rgba(139,92,246,0.4)] sm:w-auto"
      >
        Send message
      </button>
    </form>
  );
}
