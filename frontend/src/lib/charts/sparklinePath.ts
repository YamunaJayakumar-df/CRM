// Turns a list of daily counts into SVG path text for a small trend line.
//
// Why a separate pure function: the maths (scale numbers into a box, make the
// line gently curved) is easy to get wrong and easy to test without React.
// Sparkline.tsx only draws the two strings this returns.

/** The box the line is drawn in, in SVG units (the viewBox). */
export type SparklineBox = {
  width: number;
  height: number;
  /** Empty space kept at the top and bottom so the line never touches the edge. */
  padding: number;
};

/** Two SVG path strings: the line itself, and the area under it (for the fill). */
export type SparklinePaths = {
  line: string;
  area: string;
};

type Point = { x: number; y: number };

/** Rounds to 2 decimals so the path text stays short. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Scale the values into the box. The biggest value touches the top padding,
 * 0 sits on the bottom padding. All-zero (or empty) data gives a flat line
 * near the bottom. Negative or non-finite values are treated as 0.
 */
function toPoints(values: readonly number[], box: SparklineBox): Point[] {
  // Fewer than 2 values cannot make a line: draw a flat one instead.
  const safeValues =
    values.length >= 2
      ? values.map((value) => (Number.isFinite(value) && value > 0 ? value : 0))
      : [0, 0];

  const max = Math.max(...safeValues);
  const bottom = box.height - box.padding;
  const drawableHeight = box.height - 2 * box.padding;
  const step = box.width / (safeValues.length - 1);

  return safeValues.map((value, index) => ({
    x: round(index * step),
    y: round(max === 0 ? bottom : bottom - (value / max) * drawableHeight),
  }));
}

/**
 * Build the line and area paths for a sparkline.
 * The line is smoothed by curving through the midpoints between points
 * (quadratic curves), which never overshoots above or below the data.
 * Example: sparklinePaths([0, 2, 1], { width: 100, height: 40, padding: 4 })
 */
export function sparklinePaths(
  values: readonly number[],
  box: SparklineBox,
): SparklinePaths {
  const points = toPoints(values, box);
  const first = points[0];
  const last = points[points.length - 1];

  let line = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = round((current.x + next.x) / 2);
    const midY = round((current.y + next.y) / 2);
    // Curve towards the midpoint, using the real point as the "pull".
    line += ` Q ${current.x} ${current.y} ${midX} ${midY}`;
  }
  line += ` L ${last.x} ${last.y}`;

  // Close the shape along the bottom edge so it can be filled.
  const area = `${line} L ${last.x} ${box.height} L ${first.x} ${box.height} Z`;

  return { line, area };
}
