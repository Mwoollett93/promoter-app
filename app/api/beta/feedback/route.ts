import { NextResponse } from "next/server";

import { betaApiUnavailableResponse, isBetaMode } from "@/lib/beta/config";
import { buildBetaFeedbackEmail } from "@/lib/beta/email-templates";
import { betaFeedbackInbox } from "@/lib/beta/inbox";
import { ensureResendEnvLoaded } from "@/lib/email/resend-env";
import { sendTransactionalEmail } from "@/lib/email/send-transactional";
import { jsonError, logRouteError } from "@/lib/security/api-response";
import { assertSameOrigin } from "@/lib/security/origin-check";
import { checkContactLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

ensureResendEnvLoaded();

export async function POST(request: Request) {
  if (!isBetaMode()) return betaApiUnavailableResponse();

  const originBlock = assertSameOrigin(request);
  if (originBlock) return originBlock;

  const contactLimit = await checkContactLimit(request);
  if (!contactLimit.ok) return rateLimitResponse(contactLimit);

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      category?: string;
      page?: string;
      message?: string;
      screenshotNote?: string;
      userId?: string;
      workspaceId?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const category = body.category?.trim() || "other";
    const page = body.page?.trim() ?? "";
    const message = body.message?.trim() ?? "";
    const screenshotNote = body.screenshotNote?.trim();

    if (!name || !email) {
      return jsonError("Name and email are required.", 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError("Enter a valid email address.", 400);
    }

    if (!message) {
      return jsonError("Message is required.", 400);
    }

    const { subject, html } = buildBetaFeedbackEmail({
      name,
      email,
      category,
      page,
      message,
      screenshotNote,
      userId: body.userId?.trim(),
      workspaceId: body.workspaceId?.trim(),
    });

    const sent = await sendTransactionalEmail({ to: betaFeedbackInbox(), subject, html });
    if (!sent.ok) {
      return jsonError(sent.error, 503);
    }

    return NextResponse.json({ ok: true, stub: sent.stub });
  } catch (err) {
    logRouteError("api/beta/feedback", err);
    return jsonError("Unable to send feedback.", 500);
  }
}
