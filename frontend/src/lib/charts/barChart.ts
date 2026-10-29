// The maths behind the dashboard's Activity bar chart (ActivityChart.tsx).
//
// Why a separate, pure file: positions, the y-axis top and the day labels
// are easy to get wrong and easy to test without drawing anything.
// Mark rules (from our chart guidelines): bars at most 24px thick so the
// rest of each slot is air, a 4px rounded top and a square bottom on one
// baseline, and a hairline grid with few lines.

/** The thickest a bar may be, in SVG units (the rest of its slot is air). */
export const MAX_BAR_WIDTH = 24;

/** Radius of a bar's rounded top. */
export const BAR_RADIUS = 4;

export type BarBox = { x: number; y: number; width: number; height: number };

/**
 * The y-axis top: the smallest "nice" number at least as big as `max`
 * (2, 4, 5, 10, 20, 25, 50, 100, ...), and never below 4 so a quiet
 * fortnight does not look dramatic.
 */
export function niceMax(max: number): number {
  const target = Math.max(4, Math.ceil(max));
  for (let scale = 1; ; scale *= 10) {
    for (const step of [1, 2, 2.5, 4, 5]) {
      const candidate = step * scale;
      if (candidate >= target && Number.isInteger(candidate)) {
        return candidate;
      }
    }
  }
}

/**
 * The y-axis grid values: 0, the middle and the top. The middle line is left
 * out when it is not a whole number (counts are whole: no "2.5 interactions").
 */
export function gridValues(top: number): number[] {
  const middle = top / 2;
  return Number.isInteger(middle) ? [0, middle, top] : [0, top];
}

/**
 * One box per value: equal slots across `width`, each bar centred in its slot,
 * growing up from the bottom of `height`. A zero gets height 0 (nothing drawn).
 */
export function barBoxes(values: number[], width: number, height: number, top: number): BarBox[] {
  if (values.length === 0) {
    return [];
  }
  const slot = width / values.length;
  const barWidth = Math.min(MAX_BAR_WIDTH, slot * 0.6);
  return values.map((value, index) => {
    const barHeight = top > 0 ? (Math.max(0, value) / top) * height : 0;
    return {
      x: index * slot + (slot - barWidth) / 2,
      y: height - barHeight,
      width: barWidth,
      height: barHeight,
    };
  });
}

/**
 * An SVG path for a bar with a rounded top and a square bottom.
 * Short bars get a smaller radius so the shape never turns inside out.
 */
export function roundedTopBarPath({ x, y, width, height }: BarBox): string {
  if (height <= 0) {
    return "";
  }
  const r = Math.min(BAR_RADIUS, width / 2, height);
  const bottom = y + height;
  return [
    `M${x},${bottom}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + width - r}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `V${bottom}`,
    "Z",
  ].join(" ");
}

/** The `count` calendar days ending with `today` ("YYYY-MM-DD"), oldest first. */
export function daysEndingOn(today: string, count: number): string[] {
  const end = new Date(`${today}T00:00:00Z`);
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(end);
    day.setUTCDate(end.getUTCDate() - (count - 1 - index));
    return day.toISOString().slice(0, 10);
  });
}

// UTC on purpose: a plain date has no time, so its UTC midnight is that day.
const shortDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

/** "2026-10-28" -> "Oct 28" (x-axis labels). */
export function shortDayLabel(day: string): string {
  return shortDay.format(new Date(`${day}T00:00:00Z`));
}

/** "2026-10-28" -> "Wed, Oct 28" (tooltip and table). */
export function longDayLabel(day: string): string {
  return longDay.format(new Date(`${day}T00:00:00Z`));
}
