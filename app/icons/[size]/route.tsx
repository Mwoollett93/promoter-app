import { ImageResponse } from "next/og";

import { PwaIconMark } from "@/lib/pwa/icon-mark";

export const runtime = "edge";

const ALLOWED = new Set(["192", "512"]);

export async function GET(
  request: Request,
  context: { params: Promise<{ size: string }> },
) {
  const { size: sizeParam } = await context.params;
  if (!ALLOWED.has(sizeParam)) {
    return new Response("Not found", { status: 404 });
  }

  const px = Number(sizeParam);
  const { searchParams } = new URL(request.url);
  const maskable = searchParams.get("maskable") === "1";

  return new ImageResponse(<PwaIconMark size={px} maskable={maskable} />, {
    width: px,
    height: px,
  });
}
