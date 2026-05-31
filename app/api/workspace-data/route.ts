import { NextResponse } from "next/server";

import { loadWorkspaceDataForSession } from "@/lib/server/workspace-data";
import {
  parseIncludeParam,
  type WorkspaceDataInclude,
} from "@/lib/collaboration/workspace-data-types";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";
import type { SupabaseSession } from "@/lib/types/artist";

export async function GET(request: Request) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await getUserFromAccessToken(accessToken);
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const include = parseIncludeParam(searchParams.get("include"));

  const session: SupabaseSession = {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata as SupabaseSession["user"]["metadata"],
    },
  };

  try {
    const data = await loadWorkspaceDataForSession(session, include);
    if (!data) {
      return NextResponse.json({ needsBootstrap: true }, { status: 404 });
    }

    return NextResponse.json(data satisfies Record<string, unknown>);
  } catch (error) {
    console.error("[api/workspace-data]", error);
    return NextResponse.json(
      { error: "Unable to load workspace data." },
      { status: 503 },
    );
  }
}

export type { WorkspaceDataInclude };
