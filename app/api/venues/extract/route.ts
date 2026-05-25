import { NextResponse } from "next/server";

import { extractDocumentText } from "@/lib/ai/document-text";
import { extractVenueFieldsFromText } from "@/lib/ai/venue-extract";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";
import { getSupabaseServiceConfig } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 60;

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

async function documentTextFromUpload(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return extractDocumentText(buffer, file.name, file.type);
}

export async function POST(request: Request) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromAccessToken(accessToken);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentType = request.headers.get("content-type") ?? "";
    let documentText = "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ error: "Upload a document file to extract." }, { status: 400 });
      }
      documentText = await documentTextFromUpload(file);
    } else {
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

      documentText = inlineText ?? "";

      if (!documentText && fileBase64) {
        const buffer = Buffer.from(fileBase64, "base64");
        documentText = await extractDocumentText(buffer, fileName);
      }

      if (!documentText && filePath) {
        const downloaded = await downloadStorageDocument(filePath);
        documentText = await extractDocumentText(downloaded.buffer, filePath, downloaded.contentType);
      }
    }

    if (!documentText.trim()) {
      return NextResponse.json(
        { error: "No text found in the document. Use a text-based PDF or a .txt copy." },
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
