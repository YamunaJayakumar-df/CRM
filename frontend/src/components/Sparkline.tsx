// Sparkline: a tiny trend line with a soft fade underneath, drawn in SVG.
//
// Why plain SVG (no chart library): it is only a line and a filled shape,
// a few lines of code, and adds nothing to download. The maths lives in
// lib/charts/sparklinePath.ts (tested); this file only draws.
// It is decoration (aria-hidden): the number and text on the card already
// say what matters, so screen readers skip it.
// useId works in Server Components, so no "use client" is needed.
import { useId } from "react";
import { sparklinePaths } from "@/lib/charts/sparklinePath";

/** Which chart colour token to draw with. */
export type SparklineColor = "blue" | "red";

type SparklineProps = {
  /** Daily values, oldest first. */
  values: readonly number[];
  color: SparklineColor;
};

// Full class names are written out so Tailwind can find them.
// The SVG uses `currentColor`, so this text colour becomes the line colour.
const colorClasses: Record<SparklineColor, string> = {
  blue: "text-chart-blue",
  red: "text-chart-red",
};

// Size of the drawing box (SVG units). The SVG stretches to fit its parent.
const BOX = { width: 100, height: 40, padding: 4 };

export default function Sparkline({ values, color }: SparklineProps) {
  // Each sparkline needs its own gradient id; four on one page must not clash.
  const gradientId = useId();
  const { line, area } = sparklinePaths(values, BOX);

  return (
    <svg
      viewBox={`0 0 ${BOX.width} ${BOX.height}`}
      // "none" lets the drawing stretch to the box size of the parent.
      preserveAspectRatio="none"
      className={`h-full w-full overflow-visible ${colorClasses[color]}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        // Keeps the line 2px thick even though the SVG is stretched.
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
