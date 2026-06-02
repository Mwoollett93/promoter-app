import { NextResponse } from "next/server";

import { betaApiUnavailableResponse, isBetaMode } from "@/lib/beta/config";
import { buildBetaSurveyEmail } from "@/lib/beta/email-templates";
import { betaFeedbackInbox } from "@/lib/beta/inbox";
import {
  ensureResendEnvLoaded,
  getResendFeedbackFromAddress,
} from "@/lib/email/resend-env";
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
      rating?: number;
      workedWell?: string;
      blockers?: string;
      wouldUseWeekly?: string;
      extraNotes?: string;
      userId?: string;
      workspaceId?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const rating = Number(body.rating);
    const workedWell = body.workedWell?.trim() ?? "";
    const blockers = body.blockers?.trim() ?? "";
    const wouldUseWeekly = body.wouldUseWeekly?.trim() || "Not sure";
    const extraNotes = body.extraNotes?.trim();

    if (!name || !email) {
      return jsonError("Name and email are required.", 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError("Enter a valid email address.", 400);
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return jsonError("Rating must be between 1 and 5.", 400);
    }

    if (!workedWell || !blockers) {
      return jsonError("Please answer all required survey questions.", 400);
    }

    const { subject, html } = buildBetaSurveyEmail({
      name,
      email,
      rating,
      workedWell,
      blockers,
      wouldUseWeekly,
      extraNotes,
      userId: body.userId?.trim(),
      workspaceId: body.workspaceId?.trim(),
    });

    const sent = await sendTransactionalEmail({
      to: betaFeedbackInbox(),
      from: getResendFeedbackFromAddress(),
      subject,
      html,
    });
    if (!sent.ok) {
      return jsonError(sent.error, 503);
    }

    return NextResponse.json({ ok: true, stub: sent.stub });
  } catch (err) {
    logRouteError("api/beta/survey", err);
    return jsonError("Unable to send survey.", 500);
  }
}
