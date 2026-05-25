import { PDFParse } from "pdf-parse";

const TEXT_EXTENSIONS = [".txt", ".csv", ".json"];

export function isPdfDocument(filePath: string, contentType?: string): boolean {
  const lower = filePath.toLowerCase();
  return (
    lower.endsWith(".pdf") ||
    (contentType?.includes("pdf") ?? false) ||
    contentType === "application/pdf"
  );
}

export function isTextDocument(filePath: string, contentType?: string): boolean {
  const lower = filePath.toLowerCase();
  if (TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext))) return true;
  if (!contentType) return false;
  return contentType.includes("text") || contentType.includes("json");
}

export async function extractDocumentText(
  data: Buffer | ArrayBuffer,
  filePath: string,
  contentType?: string,
): Promise<string> {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

  if (isPdfDocument(filePath, contentType)) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      const text = result.text?.trim() ?? "";
      if (!text) {
        throw new Error(
          "No readable text found in this PDF. Try a text-based PDF or upload a .txt copy of the spec.",
        );
      }
      return text;
    } finally {
      await parser.destroy();
    }
  }

  if (isTextDocument(filePath, contentType)) {
    return buffer.toString("utf8");
  }

  throw new Error(
    "Unsupported document type. Use .pdf, .txt, .csv, or .json for AI extraction.",
  );
}
