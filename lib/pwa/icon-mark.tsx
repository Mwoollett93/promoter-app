/** PromoSync mark for ImageResponse icons (OG / PWA). */

type PwaIconMarkProps = {
  size: number;
  /** Maskable icons need extra inset for Android safe zone. */
  maskable?: boolean;
};

export function PwaIconMark({ size, maskable = false }: PwaIconMarkProps) {
  const inset = maskable ? size * 0.18 : size * 0.12;
  const markSize = size - inset * 2;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0B0B10",
      }}
    >
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 216 216"
        aria-hidden
      >
        <polygon
          fill="#F5F5F7"
          points="36 36 36 144 72 144 72 72 144 72 144 144 72 144 72 180 180 180 180 36 36 36"
        />
        <rect fill="#F5F5F7" x="18" y="162" width="36" height="36" />
      </svg>
    </div>
  );
}
