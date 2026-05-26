import { NextResponse } from "next/server";
import { z } from "zod";

import { enrichArtistMatches } from "@/lib/ai/artist-fill";
import { artistMatchSchema } from "@/lib/ai/artistSchema";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  matches: z.array(artistMatchSchema).min(1).max(3),
});

export async function POST(request: Request) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromAccessToken(accessToken);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = requestSchema.parse(await request.json());
    const result = await enrichArtistMatches(body.matches);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid enrich payload." }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Artist enrichment failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
