import { getResendApiKey, getResendFromAddress } from "@/lib/email/resend-env";

export type SendTransactionalEmailResult =
  | { ok: true; stub: false }
  | { ok: true; stub: true }
  | { ok: false; error: string };

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendTransactionalEmailResult> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[email stub]", input.to, input.subject);
      return { ok: true, stub: true };
    }
    return {
      ok: false,
      error:
        "RESEND_API_KEY is not loaded. Add it to promoter-app/.env.local and restart npm run dev (from the promoter-app folder).",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getResendFromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, error: text || "Email provider rejected the message." };
  }

  return { ok: true, stub: false };
}
