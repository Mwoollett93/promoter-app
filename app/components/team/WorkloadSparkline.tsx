"use client";

type WorkloadSparklineProps = {
  level: "low" | "medium" | "overloaded";
};

const CURVES: Record<WorkloadSparklineProps["level"], number[]> = {
  low: [8, 10, 9, 11, 10, 12, 11],
  medium: [6, 14, 10, 16, 12, 18, 14],
  overloaded: [4, 18, 12, 20, 16, 22, 18],
};

const STROKE: Record<WorkloadSparklineProps["level"], string> = {
  low: "#22C55E",
  medium: "#F59E0B",
  overloaded: "#EF4444",
};

export default function WorkloadSparkline({ level }: WorkloadSparklineProps) {
  const values = CURVES[level];
  const width = 120;
  const height = 32;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);

  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-8 w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke={STROKE[level]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
