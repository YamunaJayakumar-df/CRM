// StatusDonut: a ring chart of follow-ups split into Open, Overdue and
// Completed, with the open count in the middle and a legend beside it.
//
// Why plain SVG (no chart library): a donut is just a few circle outlines
// drawn in pieces ("dashes"). The maths lives in lib/charts/donutSegments.ts.
// The ring itself is hidden from screen readers; the legend says the same
// thing in words and numbers, so meaning never depends on colour alone.
import { donutSegments } from "@/lib/charts/donutSegments";

type StatusDonutProps = {
  /** Open and NOT overdue. */
  openOnTime: number;
  overdue: number;
  completed: number;
};

// Ring size in SVG units. Circumference = 2 * pi * radius.
const SIZE = 120;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function StatusDonut({ openOnTime, overdue, completed }: StatusDonutProps) {
  // Full class names written out so Tailwind finds them.
  // "Open (on time)" not just "Open": the middle number counts ALL open
  // follow-ups (including overdue), so the legend must not reuse that word alone.
  const parts = [
    { label: "Open (on time)", count: openOnTime, stroke: "stroke-chart-primary", dot: "bg-chart-primary" },
    { label: "Overdue", count: overdue, stroke: "stroke-chart-red", dot: "bg-chart-red" },
    { label: "Completed", count: completed, stroke: "stroke-chart-green", dot: "bg-chart-green" },
  ];
  const segments = donutSegments(
    parts.map((part) => part.count),
    CIRCUMFERENCE,
  );
  // "Open" in the middle includes overdue ones (they are still open).
  const openTotal = openOnTime + overdue;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-32 w-32 shrink-0">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          // Turn the drawing so the first piece starts at 12 o'clock.
          className="h-full w-full -rotate-90"
          aria-hidden="true"
          focusable="false"
        >
          {/* Grey track: the whole ring when there is no data, the background otherwise. */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-line"
          />
          {parts.map((part, index) => {
            const { length, start } = segments[index];
            if (length === 0) {
              return null;
            }
            return (
              <circle
                key={part.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                strokeWidth={STROKE}
                className={part.stroke}
                // Draw `length`, then a gap for the rest of the ring...
                strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                // ...starting `start` along the ring.
                strokeDashoffset={-start}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-title font-medium text-ink">{openTotal}</span>
          <span className="text-xs text-muted">Open</span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-3 text-sm">
        {parts.map((part) => (
          <li key={part.label} className="flex items-center gap-3">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${part.dot}`} aria-hidden="true" />
            <span className="text-ink">{part.label}</span>
            <span className="ml-auto font-medium text-ink">{part.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
