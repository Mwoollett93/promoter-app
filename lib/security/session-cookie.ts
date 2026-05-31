import { NextResponse } from "next/server";

export const SESSION_INDICATOR_COOKIE = "ps-auth";

const ONE_HOUR_SEC = 3600;

function cookieFlags(secure: boolean) {
  const parts = [
    `${SESSION_INDICATOR_COOKIE}=1`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${ONE_HOUR_SEC}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function attachSessionIndicator(response: NextResponse, request?: Request) {
  const secure =
    process.env.NODE_ENV === "production" ||
    request?.url.startsWith("https://") === true;
  response.headers.append("Set-Cookie", cookieFlags(secure));
  return response;
}

export function clearSessionIndicator(response: NextResponse) {
  response.headers.append(
    "Set-Cookie",
    `${SESSION_INDICATOR_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
  return response;
}
