import { NextResponse } from "next/server";

import { sendTransactionalEmail } from "@/lib/email/send-transactional";

/**
 * Transactional email hook — uses Resend when RESEND_API_KEY is set.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      to?: string;
      subject?: string;
      html?: string;
    };

    if (!body.to || !body.subject) {
      return NextResponse.json({ error: "to and subject are required" }, { status: 400 });
    }

    const sent = await sendTransactionalEmail({
      to: body.to,
      subject: body.subject,
      html: body.html ?? `<p>${body.subject}</p>`,
    });

    if (!sent.ok) {
      return NextResponse.json({ error: sent.error }, { status: 503 });
    }

    return NextResponse.json({ ok: true, stub: sent.stub });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Email request failed" },
      { status: 500 },
    );
  }
}
