import { NextResponse } from "next/server";

import { extractVenueFieldsFromText } from "@/lib/ai/venue-extract";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";
import { getSupabaseServiceConfig } from "@/lib/supabase/service";

export const runtime = "nodejs";

async function downloadStorageText(filePath: string): Promise<string> {
  const config = getSupabaseServiceConfig();
  if (!config) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for document extraction.");

  const signedRes = await fetch(
    `${config.url}/storage/v1/object/sign/venue-documents/${encodeURIComponent(filePath)}`,
    {
      method: "POST",
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 120 }),
    },
  );

  if (!signedRes.ok) {
    throw new Error("Unable to access the uploaded document.");
  }

  const signed = (await signedRes.json()) as { signedURL?: string };
  if (!signed.signedURL) throw new Error("Missing signed URL for document.");

  const fileUrl = signed.signedURL.startsWith("http")
    ? signed.signedURL
    : `${config.url}/storage/v1${signed.signedURL}`;

  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) throw new Error("Unable to download document for extraction.");

  const contentType = fileRes.headers.get("content-type") ?? "";
  if (contentType.includes("text") || filePath.endsWith(".txt") || filePath.endsWith(".csv")) {
    return fileRes.text();
  }

  if (contentType.includes("json") || filePath.endsWith(".json")) {
    return fileRes.text();
  }

  throw new Error(
    "Only text-based documents (.txt, .csv, .json) are supported for AI extraction in this release. PDF support is coming soon.",
  );
}

export async function POST(request: Request) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromAccessToken(accessToken);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as { filePath?: string; text?: string };
    const filePath = body.filePath?.trim();
    const inlineText = body.text?.trim();

    let documentText = inlineText ?? "";
    if (!documentText && filePath) {
      documentText = await downloadStorageText(filePath);
    }

    if (!documentText) {
      return NextResponse.json(
        { error: "Provide filePath (uploaded document) or text to extract." },
        { status: 400 },
      );
    }

    const fields = await extractVenueFieldsFromText(documentText);
    return NextResponse.json({ ok: true, fields });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
