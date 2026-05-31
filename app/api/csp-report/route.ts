import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      "csp-report"?: Record<string, unknown>;
    };

    if (body["csp-report"]) {
      console.warn("[csp-report]", JSON.stringify(body["csp-report"]));
    }
  } catch {
    /* ignore malformed reports */
  }

  return new NextResponse(null, { status: 204 });
}
