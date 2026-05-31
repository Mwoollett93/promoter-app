import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

import { SECURITY_HEADERS } from "./lib/security/headers";

// Load .env.local when Next starts so API routes always see RESEND_* (dev + next start).
const appRoot = __dirname;
loadEnvConfig(appRoot);

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "@dnd-kit/core", "@dnd-kit/sortable"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
