"use client";

import { useState } from "react";

import { useAsyncAction } from "@/lib/ui/use-async-action";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const { loading, error, run, clearError } = useAsyncAction();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();

    const form = event.currentTarget;
    const data = new FormData(form);

    const result = await run(async () => {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          intent: String(data.get("intent") ?? "other"),
          message: String(data.get("message") ?? ""),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to send your message.");
      }
      return true;
    });

    if (result) {
      setSubmitted(true);
      form.reset();
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#8B5CF6]/30 bg-[#1A1630]/40 p-8 text-center">
        <p className="text-[18px] font-semibold text-[#F5F5F7]">Thanks — we&apos;ll be in touch.</p>
        <p className="mt-2 text-[14px] text-[#A1A1AA]">
          Your message was sent successfully. We review demo requests and waitlist signups during
          early access.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] text-red-200">
          {error}
        </div>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-[12px] font-medium uppercase tracking-wide text-[#71717A]">Name</span>
          <input
            required
            name="name"
            disabled={loading}
            className="mt-2 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-4 py-3 text-[15px] text-[#F5F5F7] outline-none ring-[#8B5CF6]/0 transition focus:border-[#8B5CF6]/50 focus:ring-2 focus:ring-[#8B5CF6]/25 disabled:opacity-60"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-medium uppercase tracking-wide text-[#71717A]">Email</span>
          <input
            required
            type="email"
            name="email"
            disabled={loading}
            className="mt-2 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-4 py-3 text-[15px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]/50 focus:ring-2 focus:ring-[#8B5CF6]/25 disabled:opacity-60"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-[12px] font-medium uppercase tracking-wide text-[#71717A]">
          I&apos;m interested in
        </span>
        <select
          name="intent"
          disabled={loading}
          className="mt-2 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-4 py-3 text-[15px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]/50 disabled:opacity-60"
          defaultValue="demo"
        >
          <option value="demo">Booking a demo</option>
          <option value="waitlist">Joining the waitlist</option>
          <option value="collective">Collective / venue plan</option>
          <option value="other">Something else</option>
        </select>
      </label>
      <label className="block">
        <span className="text-[12px] font-medium uppercase tracking-wide text-[#71717A]">Message</span>
        <textarea
          name="message"
          rows={4}
          disabled={loading}
          className="mt-2 w-full resize-y rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-4 py-3 text-[15px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]/50 focus:ring-2 focus:ring-[#8B5CF6]/25 disabled:opacity-60"
          placeholder="Tell us about your nights, city, and team size…"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] px-7 text-[15px] font-medium text-white transition-all hover:border-[#A855F7] hover:shadow-[0_0_28px_rgba(139,92,246,0.4)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
