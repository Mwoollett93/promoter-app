const PROBE_BYTES = 48_000;

/** Best-effort width/height from URL hints or partial image download. */
export async function probeImageDimensions(
  imageUrl: string,
): Promise<{ width?: number; height?: number }> {
  const fromUrl = dimensionsFromUrl(imageUrl);
  if (fromUrl.width && fromUrl.height) return fromUrl;

  try {
    const response = await fetch(imageUrl, {
      headers: { Range: `bytes=0-${PROBE_BYTES - 1}` },
      redirect: "follow",
      cache: "no-store",
    });
    if (!response.ok) return fromUrl;

    const buffer = Buffer.from(await response.arrayBuffer());
    const parsed = parseImageDimensions(buffer);
    return {
      width: parsed.width ?? fromUrl.width,
      height: parsed.height ?? fromUrl.height,
    };
  } catch {
    return fromUrl;
  }
}

function dimensionsFromUrl(url: string): { width?: number; height?: number } {
  const wMatch = url.match(/(?:[?&]|\/)(\d{2,4})w(?:[x/&]|$)/i) ?? url.match(/width=(\d{2,4})/i);
  const hMatch = url.match(/(?:[?&]|\/)(\d{2,4})h(?:[x/&]|$)/i) ?? url.match(/height=(\d{2,4})/i);
  const wxh = url.match(/(\d{2,4})x(\d{2,4})/i);
  if (wxh) return { width: Number(wxh[1]), height: Number(wxh[2]) };
  if (wMatch) return { width: Number(wMatch[1]), height: hMatch ? Number(hMatch[1]) : undefined };
  return {};
}

function parseImageDimensions(buffer: Buffer): { width?: number; height?: number } {
  if (buffer.length < 24) return {};

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return parseJpegDimensions(buffer);
  }

  if (buffer.toString("ascii", 0, 8) === "\x89PNG\r\n\x1a\n" && buffer.length >= 24) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return parseWebpDimensions(buffer);
  }

  return {};
}

function parseJpegDimensions(buffer: Buffer): { width?: number; height?: number } {
  let offset = 2;
  while (offset < buffer.length - 8) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker === 0xc0 || marker === 0xc2) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return {};
}

function parseWebpDimensions(buffer: Buffer): { width?: number; height?: number } {
  if (buffer.length < 30) return {};
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X" && buffer.length >= 30) {
    const w = buffer.readUIntLE(24, 3);
    const h = buffer.readUIntLE(27, 3);
    return { width: w + 1, height: h + 1 };
  }
  return {};
}
