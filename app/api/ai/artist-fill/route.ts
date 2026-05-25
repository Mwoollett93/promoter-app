import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchArtistMatches } from "@/lib/ai/artist-fill";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    const result = await fetchArtistMatches(body.artistName);

    if (result.matches.length === 0) {
      return NextResponse.json(
        { error: "No artist match found. Try a more specific name or fill in manually." },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "artistName is required." }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Artist lookup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
