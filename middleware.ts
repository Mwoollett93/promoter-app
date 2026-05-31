import { NextResponse } from "next/server";

import { SESSION_INDICATOR_COOKIE } from "@/lib/security/session-cookie";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/events",
  "/tasks",
  "/artists",
  "/venues",
  "/settings",
  "/team",
  "/season",
  "/run",
  "/event-wizard",
];

export function middleware(request: Request) {
  const { pathname } = new URL(request.url);

  const isProtected =
    PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

  if (!isProtected) {
    return NextResponse.next();
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const hasSession = cookieHeader
    .split(";")
    .some((part) => part.trim().startsWith(`${SESSION_INDICATOR_COOKIE}=1`));

  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnTo", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/events/:path*",
    "/tasks/:path*",
    "/artists/:path*",
    "/venues/:path*",
    "/settings/:path*",
    "/team/:path*",
    "/season/:path*",
    "/run/:path*",
    "/event-wizard/:path*",
  ],
};
