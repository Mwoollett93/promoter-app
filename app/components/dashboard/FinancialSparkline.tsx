"use client";

type Point = { x: number; y: number };

/** Catmull-Rom → cubic-bezier segments for a smooth financial trend line. */
function buildSmoothLinePath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return path;
}

type FinancialSparklineProps = {
  values: number[];
};

export default function FinancialSparkline({ values }: FinancialSparklineProps) {
  const width = 400;
  const height = 100;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points: Point[] = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 12) - 6;
    return { x, y };
  });

  const linePath = buildSmoothLinePath(points);
  const areaPath = linePath
    ? `${linePath} L ${width},${height} L 0,${height} Z`
    : "";

  return (
    <div className="relative h-[100px] w-full min-w-0 overflow-hidden rounded-lg bg-[#0B0B10] ring-1 ring-[#232330]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="dash-fin-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dash-fin-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        {areaPath ? <path d={areaPath} fill="url(#dash-fin-fill)" /> : null}
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="url(#dash-fin-line)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </svg>
    </div>
  );
}
