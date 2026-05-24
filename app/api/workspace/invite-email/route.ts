import { NextResponse } from "next/server";

import { getResendEnvDiagnostics } from "@/lib/email/resend-env";
import { buildWorkspaceInviteEmail } from "@/lib/email/workspace-invite-template";
import { sendTransactionalEmail } from "@/lib/email/send-transactional";

export const runtime = "nodejs";
import { supabaseRest } from "@/lib/supabase/client-rest";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";
import type { SupabaseSession } from "@/lib/types/artist";
import type { WorkspaceRole } from "@/lib/types/collaboration";

function appOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(getResendEnvDiagnostics());
}

export async function POST(request: Request) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromAccessToken(accessToken);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      to?: string;
      workspaceId?: string;
      workspaceName?: string;
      role?: WorkspaceRole;
      inviterName?: string;
    };

    const to = body.to?.trim().toLowerCase();
    const workspaceId = body.workspaceId?.trim();
    const workspaceName = body.workspaceName?.trim() || "your team";
    const role = body.role ?? "promoter";
    const inviterName = body.inviterName?.trim() || user.email?.split("@")[0] || "A teammate";

    if (!to || !workspaceId) {
      return NextResponse.json({ error: "to and workspaceId are required" }, { status: 400 });
    }

    const session: SupabaseSession = {
      accessToken,
      user: { id: user.id, email: user.email },
    };

    const pending = await supabaseRest<{ id: string }[]>(
      `workspace_members?workspace_id=eq.${workspaceId}&invited_email=eq.${encodeURIComponent(to)}&status=eq.invited&select=id&limit=1`,
      session,
    );

    if (!pending.length) {
      return NextResponse.json({ error: "No pending invite found for that email." }, { status: 404 });
    }

    const origin = appOrigin(request);
    const loginUrl = `${origin}/login?email=${encodeURIComponent(to)}`;
    const signupUrl = `${origin}/login?mode=signup&email=${encodeURIComponent(to)}`;
    const { subject, html } = buildWorkspaceInviteEmail({
      workspaceName,
      inviterName,
      role,
      loginUrl,
      signupUrl,
    });

    const sent = await sendTransactionalEmail({ to, subject, html });
    if (!sent.ok) {
      return NextResponse.json({ error: sent.error }, { status: 503 });
    }

    return NextResponse.json({ ok: true, stub: sent.stub });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invite email failed" },
      { status: 500 },
    );
  }
}
