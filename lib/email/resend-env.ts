import { loadEnvConfig } from "@next/env";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

let envBootstrapAttempted = false;

function candidateProjectRoots(): string[] {
  const roots = new Set<string>();
  const cwd = process.cwd();
  roots.add(cwd);

  if (!cwd.replace(/\\/g, "/").endsWith("/promoter-app")) {
    roots.add(join(cwd, "promoter-app"));
  }

  try {
    const here = dirname(fileURLToPath(import.meta.url));
    roots.add(resolve(here, "../.."));
  } catch {
    /* CJS / bundled */
  }

  return [...roots];
}

function readFromEnvFile(root: string, name: string): string | undefined {
  for (const file of [".env.local", ".env"]) {
    const path = join(root, file);
    if (!existsSync(path)) continue;

    try {
      const text = readFileSync(path, "utf8");
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        if (trimmed.slice(0, eq).trim() !== name) continue;
        const value = trimmed.slice(eq + 1).trim();
        if (value) return value;
      }
    } catch {
      continue;
    }
  }

  return undefined;
}

/** Load .env.local into process.env (safe for server-only Resend routes). */
export function ensureResendEnvLoaded() {
  if (process.env.RESEND_API_KEY?.trim()) return;

  if (!envBootstrapAttempted) {
    envBootstrapAttempted = true;
    for (const root of candidateProjectRoots()) {
      if (!existsSync(join(root, ".env.local")) && !existsSync(join(root, ".env"))) {
        continue;
      }
      loadEnvConfig(root);
      if (process.env.RESEND_API_KEY?.trim()) return;
    }
  }

  if (process.env.RESEND_API_KEY?.trim()) return;

  for (const root of candidateProjectRoots()) {
    const key = readFromEnvFile(root, "RESEND_API_KEY");
    if (key) {
      process.env.RESEND_API_KEY = key;
      const from = readFromEnvFile(root, "RESEND_FROM");
      if (from) process.env.RESEND_FROM = from;
      return;
    }
  }
}

export function getResendApiKey(): string | undefined {
  ensureResendEnvLoaded();
  return process.env.RESEND_API_KEY?.trim();
}

export function getResendFromAddress(): string {
  ensureResendEnvLoaded();
  return (
    process.env.RESEND_FROM?.trim() ||
    "PromoSync <invites@promosync.app>"
  );
}

/** Dev-only: why Resend env might be missing (no secrets returned). */
export function getResendEnvDiagnostics() {
  ensureResendEnvLoaded();
  const roots = candidateProjectRoots();
  return {
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    hasKey: Boolean(getResendApiKey()),
    rootsChecked: roots.map((root) => ({
      root,
      envLocal: existsSync(join(root, ".env.local")),
      env: existsSync(join(root, ".env")),
    })),
  };
}
