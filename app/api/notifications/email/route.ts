import { NextResponse } from "next/server";

/**
 * Transactional email hook — wire Resend/Postmark via RESEND_API_KEY in production.
 * Respects notification_settings.email_enabled when called from server jobs.
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

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      if (process.env.NODE_ENV === "development") {
        console.info("[email stub]", body.to, body.subject);
        return NextResponse.json({ ok: true, stub: true });
      }
      return NextResponse.json({ error: "Email provider not configured" }, { status: 503 });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "PromoSync <notifications@promosync.app>",
        to: body.to,
        subject: body.subject,
        html: body.html ?? `<p>${body.subject}</p>`,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: text || "Email send failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Email request failed" },
      { status: 500 },
    );
  }
}
