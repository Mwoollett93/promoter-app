import { NextResponse } from "next/server";

import { extractVenueFieldsFromText } from "@/lib/ai/venue-extract";
import { getBearerToken, getUserFromAccessToken } from "@/lib/supabase/server-user";
import { getSupabaseServiceConfig } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 60;

const TEXT_EXTENSIONS = [".txt", ".csv", ".json"];

function isTextFile(path: string): boolean {
  const lower = path.toLowerCase();
  return TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

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

  return fileRes.text();
}

export async function POST(request: Request) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromAccessToken(accessToken);
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          error:
            "PDF upload to the server is not supported. Extract text in the browser first (re-upload the PDF on Add Venue, then Extract with AI).",
        },
        { status: 400 },
      );
    }

    const body = (await request.json()) as {
      filePath?: string;
      text?: string;
      fileBase64?: string;
      fileName?: string;
    };

    let documentText = body.text?.trim() ?? "";

    if (!documentText && body.fileBase64) {
      return NextResponse.json(
        {
          error:
            "Send extracted document text instead of raw PDF data. Re-upload the PDF and use Extract with AI again.",
        },
        { status: 400 },
      );
    }

    const filePath = body.filePath?.trim();
    if (!documentText && filePath) {
      if (filePath.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json(
          {
            error:
              "For PDFs, upload the file on this page (pending uploads) and extract before saving. Stored PDFs cannot be parsed on the server.",
          },
          { status: 400 },
        );
      }
      if (!isTextFile(filePath)) {
        return NextResponse.json(
          { error: "Only .txt, .csv, and .json files can be read from storage on the server." },
          { status: 400 },
        );
      }
      documentText = (await downloadStorageText(filePath)).trim();
    }

    if (!documentText) {
      return NextResponse.json(
        { error: "Provide document text to extract (upload a PDF and click Extract with AI)." },
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
