"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BETA_FEEDBACK_SUCCESS } from "@/lib/beta/config";
import { loadSettings } from "@/lib/settings/settings";
import { useAsyncAction } from "@/lib/ui/use-async-action";

const categories = [
  { value: "bug", label: "Bug" },
  { value: "ux", label: "UX / confusion" },
  { value: "feature", label: "Feature idea" },
  { value: "other", label: "Other" },
] as const;

type BetaFeedbackFormProps = {
  workspaceId?: string;
  userId?: string;
};

export default function BetaFeedbackForm({ workspaceId, userId }: BetaFeedbackFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<string>("bug");
  const [page, setPage] = useState("");
  const [message, setMessage] = useState("");
  const [screenshotNote, setScreenshotNote] = useState("");
  const { loading, error, run, clearError } = useAsyncAction();

  useEffect(() => {
    const profile = loadSettings().profile;
    if (profile.fullName) setName(profile.fullName);
    if (profile.email) setEmail(profile.email);
    if (typeof document !== "undefined" && document.referrer) {
      try {
        const ref = new URL(document.referrer);
        if (ref.origin === window.location.origin) {
          setPage(ref.pathname);
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    clearError();

    const result = await run(async () => {
      const response = await fetch("/api/beta/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name,
          email,
          category,
          page,
          message,
          screenshotNote,
          userId,
          workspaceId,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to send feedback.");
      return true;
    });

    if (result) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#8B5CF6]/30 bg-[#1A1630]/40 p-8 text-center">
        <p className="text-[18px] font-semibold text-[#F5F5F7]">Feedback received</p>
        <p className="mt-2 text-[14px] text-[#A1A1AA]">{BETA_FEEDBACK_SUCCESS}</p>
        <Link
          href="/tester-survey"
          className="mt-5 inline-flex text-[14px] font-medium text-[#8B5CF6] hover:text-[#C4B5FD]"
        >
          Complete the full tester survey →
        </Link>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-[13px] font-medium text-[#D4D4D8]">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 text-[14px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[13px] font-medium text-[#D4D4D8]">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 text-[14px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]"
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-[13px] font-medium text-[#D4D4D8]">Category</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 text-[14px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]"
        >
          {categories.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-[13px] font-medium text-[#D4D4D8]">Page or screen</span>
        <input
          value={page}
          onChange={(e) => setPage(e.target.value)}
          placeholder="/events"
          className="h-11 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 text-[14px] text-[#F5F5F7] outline-none placeholder:text-[#71717A] focus:border-[#8B5CF6]"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[13px] font-medium text-[#D4D4D8]">What happened?</span>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2.5 text-[14px] text-[#F5F5F7] outline-none placeholder:text-[#71717A] focus:border-[#8B5CF6]"
          placeholder="Steps to reproduce, what you expected, and what you saw instead."
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[13px] font-medium text-[#D4D4D8]">Screenshot note (optional)</span>
        <input
          value={screenshotNote}
          onChange={(e) => setScreenshotNote(e.target.value)}
          placeholder="e.g. attached in follow-up email"
          className="h-11 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 text-[14px] text-[#F5F5F7] outline-none placeholder:text-[#71717A] focus:border-[#8B5CF6]"
        />
      </label>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-6 text-[14px] font-semibold text-white hover:bg-[#8B5CF6] disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send feedback"}
        </button>
        <Link href="/tester-survey" className="text-[13px] text-[#8B5CF6] hover:text-[#C4B5FD]">
          Full tester survey →
        </Link>
      </div>
    </form>
  );
}
