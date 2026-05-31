import { NextResponse } from "next/server";

import { buildContactFormEmail } from "@/lib/email/contact-form-template";
import { ensureResendEnvLoaded } from "@/lib/email/resend-env";
import { sendTransactionalEmail } from "@/lib/email/send-transactional";
import { jsonError, logRouteError } from "@/lib/security/api-response";
import { assertSameOrigin } from "@/lib/security/origin-check";
import { checkContactLimit, rateLimitResponse } from "@/lib/security/rate-limit";

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

  const originBlock = assertSameOrigin(request);
  if (originBlock) return originBlock;

  const contactLimit = await checkContactLimit(request);
  if (!contactLimit.ok) return rateLimitResponse(contactLimit);

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
      return jsonError("Name and email are required.", 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError("Enter a valid email address.", 400);
    }

    const { subject, html } = buildContactFormEmail({ name, email, intent, message });
    const sent = await sendTransactionalEmail({ to: contactInbox(), subject, html });

    if (!sent.ok) {
      return jsonError(sent.error, 503);
    }

    return NextResponse.json({ ok: true, stub: sent.stub });
  } catch (err) {
    logRouteError("api/contact", err);
    return jsonError("Unable to send message.", 500);
  }
}
