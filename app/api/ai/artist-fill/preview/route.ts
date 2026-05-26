import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchArtistPreview } from "@/lib/ai/artist-lookup-preview";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";

export const runtime = "nodejs";
export const maxDuration = 30;

const requestSchema = z.object({
  artistName: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromAccessToken(accessToken);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = requestSchema.parse(await request.json());
    const result = await fetchArtistPreview(body.artistName);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "artistName is required." }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Artist preview failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
