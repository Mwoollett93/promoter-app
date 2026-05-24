import {
  ensureResendEnvLoaded,
  getResendApiKey,
  getResendFromAddress,
} from "@/lib/email/resend-env";

export type SendTransactionalEmailResult =
  | { ok: true; stub: false }
  | { ok: true; stub: true }
  | { ok: false; error: string };

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendTransactionalEmailResult> {
  ensureResendEnvLoaded();
  const apiKey = getResendApiKey();

  if (!apiKey) {
    const isDev = process.env.NODE_ENV !== "production";
    if (isDev) {
      console.info("[email stub]", input.to, input.subject);
      return { ok: true, stub: true };
    }
    return {
      ok: false,
      error:
        "RESEND_API_KEY is missing on the server. For local: add it to promoter-app/.env.local and run npm run dev from promoter-app. For production: add RESEND_API_KEY in your host (e.g. Vercel → Environment Variables).",
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
