import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const env = loadEnvLocal();
const apiKey = env.RESEND_API_KEY;
const from = env.RESEND_FROM ?? "PromoSync <invites@promosync.app>";

if (!apiKey?.startsWith("re_")) {
  console.error("FAIL: RESEND_API_KEY is missing or invalid in .env.local (save the file first).");
  process.exit(1);
}

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from,
    to: ["delivered@resend.dev"],
    subject: "PromoSync Resend setup test",
    html: "<p>Your Resend API key and sending domain are configured correctly.</p>",
  }),
});

const text = await response.text();
if (!response.ok) {
  console.error("FAIL:", response.status, text);
  process.exit(1);
}

const payload = JSON.parse(text);
console.log("OK: Resend accepted the message. id:", payload.id);
console.log("Check https://resend.com/emails — it should show as delivered.");
