import { NextResponse } from "next/server";

import { extractDocumentText } from "@/lib/ai/document-text";
import { extractVenueFieldsFromText } from "@/lib/ai/venue-extract";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";
import { getSupabaseServiceConfig } from "@/lib/supabase/service";

export const runtime = "nodejs";

async function downloadStorageDocument(filePath: string): Promise<{ buffer: Buffer; contentType: string }> {
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
  const arrayBuffer = await fileRes.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType };
}

export async function POST(request: Request) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromAccessToken(accessToken);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as {
      filePath?: string;
      text?: string;
      fileBase64?: string;
      fileName?: string;
    };
    const filePath = body.filePath?.trim();
    const inlineText = body.text?.trim();
    const fileBase64 = body.fileBase64?.trim();
    const fileName = body.fileName?.trim() ?? filePath ?? "document";

    let documentText = inlineText ?? "";

    if (!documentText && fileBase64) {
      const buffer = Buffer.from(fileBase64, "base64");
      documentText = await extractDocumentText(buffer, fileName);
    }

    if (!documentText && filePath) {
      const { buffer, contentType } = await downloadStorageDocument(filePath);
      documentText = await extractDocumentText(buffer, filePath, contentType);
    }

    if (!documentText) {
      return NextResponse.json(
        { error: "Provide filePath (uploaded document), fileBase64, or text to extract." },
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
