import { NextResponse } from "next/server";

const KNOWN_AUTH_ERRORS = new Set([
  "Invalid login credentials",
  "Email not confirmed",
  "User already registered",
  "Unable to sign in.",
  "Unable to create account.",
  "Unable to send reset link.",
]);

/** Maps Supabase / validation errors to safe client-facing messages. */
export function safeAuthError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;

  const message = error.message.trim();
  if (!message) return fallback;

  if (KNOWN_AUTH_ERRORS.has(message)) return message;

  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Invalid login credentials.";
  if (lower.includes("email not confirmed")) return "Email not confirmed.";
  if (lower.includes("user already registered")) return "User already registered.";
  if (lower.includes("rate limit")) return "Too many attempts. Please try again later.";
  if (lower.includes("network") || lower.includes("could not reach")) {
    return "Could not reach the authentication service. Please try again.";
  }

  return fallback;
}

export function jsonError(message: string, status: number, extra?: Record<string, string>) {
  const headers = new Headers(extra);
  return NextResponse.json({ error: message }, { status, headers });
}

export function logRouteError(route: string, error: unknown) {
  console.error(`[${route}]`, error);
}

export async function randomFailedSignInDelay() {
  const ms = 200 + Math.floor(Math.random() * 600);
  await new Promise((resolve) => setTimeout(resolve, ms));
}
