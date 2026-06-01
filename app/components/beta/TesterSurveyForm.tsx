"use client";

import { useEffect, useState } from "react";

import { BETA_SURVEY_SUCCESS, betaSurveyEmbedUrl } from "@/lib/beta/config";
import { loadSettings } from "@/lib/settings/settings";
import { useAsyncAction } from "@/lib/ui/use-async-action";

const weeklyOptions = ["Yes", "Probably", "Not sure", "No"] as const;

type TesterSurveyFormProps = {
  workspaceId?: string;
  userId?: string;
};

export default function TesterSurveyForm({ workspaceId, userId }: TesterSurveyFormProps) {
  const googleFormUrl = betaSurveyEmbedUrl();
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(4);
  const [workedWell, setWorkedWell] = useState("");
  const [blockers, setBlockers] = useState("");
  const [wouldUseWeekly, setWouldUseWeekly] = useState<string>("Probably");
  const [extraNotes, setExtraNotes] = useState("");
  const { loading, error, run, clearError } = useAsyncAction();

  useEffect(() => {
    const profile = loadSettings().profile;
    if (profile.fullName) setName(profile.fullName);
    if (profile.email) setEmail(profile.email);
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    clearError();

    const result = await run(async () => {
      const response = await fetch("/api/beta/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name,
          email,
          rating,
          workedWell,
          blockers,
          wouldUseWeekly,
          extraNotes,
          userId,
          workspaceId,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to send survey.");
      return true;
    });

    if (result) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#8B5CF6]/30 bg-[#1A1630]/40 p-8 text-center">
        <p className="text-[18px] font-semibold text-[#F5F5F7]">Survey submitted</p>
        <p className="mt-2 text-[14px] text-[#A1A1AA]">{BETA_SURVEY_SUCCESS}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {googleFormUrl ? (
        <div className="rounded-2xl border border-[#232330] bg-[#11111A] p-5">
          <p className="text-[14px] font-medium text-[#F5F5F7]">Prefer Google Forms?</p>
          <p className="mt-1 text-[13px] text-[#A1A1AA]">
            You can use our hosted form below or open the survey in Google Forms.
          </p>
          <a
            href={googleFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex text-[13px] font-medium text-[#8B5CF6] hover:text-[#C4B5FD]"
          >
            Open Google Form →
          </a>
          <iframe
            title="Beta tester survey (Google Form)"
            src={googleFormUrl.replace("/viewform", "/viewform?embedded=true")}
            className="mt-4 h-[min(480px,60vh)] w-full rounded-lg border border-[#232330] bg-[#0B0B10]"
          />
        </div>
      ) : null}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        <p className="text-[15px] font-medium text-[#F5F5F7]">Quick in-app survey</p>

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

        <label className="block space-y-2">
          <span className="text-[13px] font-medium text-[#D4D4D8]">
            Overall experience (1 = poor, 5 = excellent)
          </span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full accent-[#8B5CF6]"
          />
          <p className="text-[13px] text-[#A1A1AA]">Selected: {rating} / 5</p>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[13px] font-medium text-[#D4D4D8]">What worked well?</span>
          <textarea
            required
            rows={3}
            value={workedWell}
            onChange={(e) => setWorkedWell(e.target.value)}
            className="w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2.5 text-[14px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-[13px] font-medium text-[#D4D4D8]">What blocked or confused you?</span>
          <textarea
            required
            rows={3}
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            className="w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2.5 text-[14px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-[13px] font-medium text-[#D4D4D8]">Would you use this weekly?</span>
          <select
            value={wouldUseWeekly}
            onChange={(e) => setWouldUseWeekly(e.target.value)}
            className="h-11 w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 text-[14px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]"
          >
            {weeklyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[13px] font-medium text-[#D4D4D8]">Anything else? (optional)</span>
          <textarea
            rows={3}
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            className="w-full rounded-lg border border-[#3F3F46] bg-[#0B0B10] px-3 py-2.5 text-[14px] text-[#F5F5F7] outline-none focus:border-[#8B5CF6]"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-[#8B5CF6]/60 bg-[#7C3AED] px-6 text-[14px] font-semibold text-white hover:bg-[#8B5CF6] disabled:opacity-60"
        >
          {loading ? "Sending…" : "Submit survey"}
        </button>
      </form>
    </div>
  );
}
