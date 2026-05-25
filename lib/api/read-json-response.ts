/** Parse a fetch Response body as JSON; surface HTML/plain errors clearly. */
export async function readJsonResponse<T extends Record<string, unknown>>(
  response: Response,
): Promise<T> {
  const text = await response.text();
  if (!text.trim()) {
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}).`);
    }
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.startsWith("<")
      ? `Server returned an error page (${response.status}). Redeploy the app or check Vercel function logs.`
      : text.slice(0, 280);
    throw new Error(
      preview.includes("JSON.parse")
        ? `Extraction API returned a non-JSON response (${response.status}). Redeploy latest code or try again.`
        : preview,
    );
  }
}
