/** Extract plain text from a PDF in the browser (avoids serverless PDF parsing on Vercel). */
export async function extractPdfTextInBrowser(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const version = pdfjs.version;

  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

  const parts: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
      .join(" ");
    parts.push(pageText);
  }

  await doc.destroy();

  const text = parts.join("\n").trim();
  if (!text) {
    throw new Error(
      "No readable text in this PDF. Use a text-based spec sheet or upload a .txt copy.",
    );
  }

  return text;
}
