import { NextResponse } from "next/server";

import { buildContactFormEmail } from "@/lib/email/contact-form-template";
import { ensureResendEnvLoaded } from "@/lib/email/resend-env";
import { sendTransactionalEmail } from "@/lib/email/send-transactional";

export const runtime = "nodejs";

ensureResendEnvLoaded();

function contactInbox() {
  return (
    process.env.CONTACT_INBOX?.trim() ||
    process.env.RESEND_CONTACT_TO?.trim() ||
    "hello@promosync.app"
  );
}

export async function POST(request: Request) {
  ensureResendEnvLoaded();

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      intent?: string;
      message?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const intent = body.intent?.trim() || "other";
    const message = body.message?.trim() ?? "";

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const { subject, html } = buildContactFormEmail({ name, email, intent, message });
    const sent = await sendTransactionalEmail({ to: contactInbox(), subject, html });

    if (!sent.ok) {
      return NextResponse.json({ error: sent.error }, { status: 503 });
    }

    return NextResponse.json({ ok: true, stub: sent.stub });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unable to send message.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
