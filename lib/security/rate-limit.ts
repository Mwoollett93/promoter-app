import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { NextResponse } from "next/server";

type LimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number; message: string };

let redis: Redis | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  if (!redis) redis = new Redis({ url, token });
  return redis;
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function createLimiter(tokens: number, window: `${number} ${"s" | "m" | "h" | "d"}`) {
  const client = getRedis();
  if (!client) return null;
  return new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: "promosync",
  });
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

async function checkLimit(
  limiter: Ratelimit | null,
  key: string,
  fallback: LimitResult,
): Promise<LimitResult> {
  if (!limiter) {
    if (isProduction()) return fallback;
    return { ok: true };
  }

  const result = await limiter.limit(key);
  if (result.success) return { ok: true };

  const retryAfterSec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return {
    ok: false,
    retryAfterSec,
    message: "Too many attempts. Please try again later.",
  };
}

export function rateLimitResponse(result: Extract<LimitResult, { ok: false }>) {
  return NextResponse.json(
    { error: result.message },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSec) },
    },
  );
}

export async function checkSignInIpLimit(request: Request): Promise<LimitResult> {
  const ip = getClientIp(request);
  const limiter = createLimiter(20, "15 m");
  return checkLimit(limiter, `signin-ip:${ip}`, {
    ok: false,
    retryAfterSec: 900,
    message: "Sign-in is temporarily unavailable. Please try again later.",
  });
}

export async function checkSignInFailureLimit(
  request: Request,
  email: string,
): Promise<LimitResult> {
  const ip = getClientIp(request);
  const limiter = createLimiter(5, "15 m");
  return checkLimit(limiter, `signin-fail:${ip}:${email.toLowerCase()}`, {
    ok: false,
    retryAfterSec: 900,
    message: "Too many failed sign-in attempts. Please try again later.",
  });
}

export async function recordSignInFailure(request: Request, email: string) {
  const ip = getClientIp(request);
  const limiter = createLimiter(5, "15 m");
  if (limiter) await limiter.limit(`signin-fail:${ip}:${email.toLowerCase()}`);
}

export async function checkRecoverLimit(request: Request, email: string): Promise<LimitResult> {
  const ip = getClientIp(request);
  const limiter = createLimiter(3, "1 h");
  return checkLimit(limiter, `recover:${ip}:${email.toLowerCase()}`, {
    ok: false,
    retryAfterSec: 3600,
    message: "Too many reset requests. Please try again later.",
  });
}

export async function checkSignupIpLimit(request: Request): Promise<LimitResult> {
  const ip = getClientIp(request);
  const limiter = createLimiter(10, "1 h");
  return checkLimit(limiter, `signup-ip:${ip}`, {
    ok: false,
    retryAfterSec: 3600,
    message: "Too many sign-up attempts. Please try again later.",
  });
}

export async function checkContactLimit(request: Request): Promise<LimitResult> {
  const ip = getClientIp(request);
  const limiter = createLimiter(5, "1 h");
  return checkLimit(limiter, `contact:${ip}`, {
    ok: false,
    retryAfterSec: 3600,
    message: "Too many messages sent. Please try again later.",
  });
}
