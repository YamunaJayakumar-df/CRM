// ActivityChart: interactions per day as bars (one series, one colour).
//
// - Bars follow our chart rules: at most 24px thick, 4px rounded top,
//   square bottom on one baseline, a hairline grid with three lines.
// - Hover (or keyboard focus) on a day shows a tooltip with the date and
//   the count; the hit area is the whole day slot, bigger than the bar.
// - Screen readers get a hidden table with the same numbers.
// "use client" because it measures its own width (so bars and labels stay
// crisp at every screen size) and keeps the hovered day in state.
// The maths lives in lib/charts/barChart.ts (tested).
"use client";

import { useEffect, useRef, useState } from "react";
import { barBoxes, gridValues, longDayLabel, niceMax, roundedTopBarPath, shortDayLabel } from "@/lib/charts/barChart";

type ActivityChartProps = {
  /** Days "YYYY-MM-DD", oldest first; the last one is today. */
  days: string[];
  /** Interactions on each day (same order as `days`). */
  counts: number[];
};

const HEIGHT = 200; // whole SVG
const LEFT = 28; // room for the y-axis numbers
const BOTTOM = 26; // room for the day labels
const TOP = 8; // room above the highest grid line
const PLOT_HEIGHT = HEIGHT - BOTTOM - TOP;

/** "1 interaction" / "3 interactions". */
function interactionsText(count: number): string {
  return `${count} interaction${count === 1 ? "" : "s"}`;
}

export default function ActivityChart({ days, counts }: ActivityChartProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640); // first guess until measured
  const [hovered, setHovered] = useState<number | null>(null);

  // Follow the card's width (window resize, sidebar, phone rotation).
  useEffect(() => {
    const box = boxRef.current;
    if (box === null) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(240, Math.round(entry.contentRect.width)));
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const plotWidth = width - LEFT;
  const top = niceMax(Math.max(0, ...counts));
  const bars = barBoxes(counts, plotWidth, PLOT_HEIGHT, top);
  const slot = plotWidth / Math.max(1, counts.length);
  const grid = gridValues(top);
  // Label every 2nd day (every 4th on narrow screens), always including today.
  const labelEvery = width < 480 ? 4 : 2;
  const last = days.length - 1;

  const hoveredBar = hovered === null ? null : bars[hovered];

  return (
    <div ref={boxRef} className="relative">
      <svg width={width} height={HEIGHT} aria-hidden="true" className="block overflow-visible">
        {/* Hairline grid and the y-axis numbers. */}
        {grid.map((value) => {
          const y = TOP + PLOT_HEIGHT - (value / top) * PLOT_HEIGHT;
          return (
            <g key={value}>
              <line x1={LEFT} x2={width} y1={y} y2={y} className="stroke-line" strokeWidth={1} />
              <text x={LEFT - 8} y={y} dy="0.32em" textAnchor="end" className="fill-muted text-[11px]">
                {value}
              </text>
            </g>
          );
        })}

        {/* The bars (today and the hovered day in the stronger violet). */}
        <g transform={`translate(${LEFT},${TOP})`}>
          {bars.map((bar, index) => (
            <path
              key={days[index]}
              d={roundedTopBarPath(bar)}
              className={`transition-colors duration-150 ${hovered === index ? "fill-primary" : "fill-chart-primary"}`}
            />
          ))}
        </g>

        {/* Day labels. */}
        {days.map((day, index) =>
          (last - index) % labelEvery === 0 ? (
            <text
              key={day}
              x={LEFT + index * slot + slot / 2}
              y={HEIGHT - 6}
              textAnchor="middle"
              className={`text-[11px] ${index === last ? "fill-ink font-semibold" : "fill-muted"}`}
            >
              {index === last ? "Today" : shortDayLabel(day)}
            </text>
          ) : null,
        )}
      </svg>

      {/* Hit areas: one per day, full height, focusable for keyboard users. */}
      <div className="absolute inset-y-0 flex" style={{ left: LEFT, width: plotWidth }}>
        {days.map((day, index) => (
          <button
            key={day}
            type="button"
            className="h-full flex-1 cursor-default rounded-md focus-visible:outline-offset-0"
            aria-label={`${longDayLabel(day)}: ${interactionsText(counts[index] ?? 0)}`}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(index)}
            onBlur={() => setHovered(null)}
          />
        ))}
      </div>

      {/* Tooltip above the hovered bar. */}
      {hovered !== null && hoveredBar && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-ink px-3 py-2 text-xs whitespace-nowrap text-card shadow-soft"
          style={{ left: LEFT + hoveredBar.x + hoveredBar.width / 2, top: TOP + hoveredBar.y - 8 }}
        >
          <span className="block text-card/70">{longDayLabel(days[hovered] ?? "")}</span>
          <span className="font-semibold">{interactionsText(counts[hovered] ?? 0)}</span>
        </div>
      )}

      {/* The same numbers as a table, for screen readers. */}
      <table className="sr-only">
        <caption>Interactions per day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Interactions</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day, index) => (
            <tr key={day}>
              <td>{longDayLabel(day)}</td>
              <td>{counts[index] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
