import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import { join } from "node:path";

// Load .env.local when Next starts so API routes always see RESEND_* (dev + next start).
const appRoot = __dirname;
loadEnvConfig(appRoot);

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
