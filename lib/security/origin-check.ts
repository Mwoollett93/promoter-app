import { NextResponse } from "next/server";

function configuredOrigins(): Set<string> {
  const origins = new Set<string>([
    "https://www.promosync.app",
    "https://promosync.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    try {
      origins.add(new URL(appUrl).origin);
    } catch {
      /* ignore invalid URL */
    }
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    origins.add(`https://${vercelUrl.replace(/^https?:\/\//, "")}`);
  }

  return origins;
}

function originFromHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** Reject cross-site POST requests missing a trusted Origin/Referer. */
export function assertSameOrigin(request: Request): NextResponse | null {
  const allowed = configuredOrigins();
  const origin = originFromHeader(request.headers.get("origin"));
  const referer = originFromHeader(request.headers.get("referer"));

  if (origin && allowed.has(origin)) return null;
  if (referer && allowed.has(referer)) return null;

  if (!origin && !referer) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json({ error: "Forbidden." }, { status: 403 });
}
