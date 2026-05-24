import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function readFromEnvLocal(name: string): string | undefined {
  if (typeof window !== "undefined") return undefined;

  try {
    const path = resolve(process.cwd(), ".env.local");
    if (!existsSync(path)) return undefined;

    const text = readFileSync(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      if (trimmed.slice(0, eq).trim() !== name) continue;
      const value = trimmed.slice(eq + 1).trim();
      return value || undefined;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

/** Resend API key — process.env first, then .env.local (local prod / missed restart). */
export function getResendApiKey(): string | undefined {
  const fromProcess = process.env.RESEND_API_KEY?.trim();
  if (fromProcess) return fromProcess;
  return readFromEnvLocal("RESEND_API_KEY");
}

export function getResendFromAddress(): string {
  return (
    process.env.RESEND_FROM?.trim() ||
    readFromEnvLocal("RESEND_FROM") ||
    "PromoSync <onboarding@resend.dev>"
  );
}
