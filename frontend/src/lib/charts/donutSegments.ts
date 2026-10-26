// Works out where each coloured part of a donut chart starts and how long it is.
//
// Why a separate pure function: a donut in SVG is a circle outline drawn in
// pieces using "dash" lengths. Turning counts into those lengths is simple
// maths, but easy to get wrong, so it lives here with its own tests.

/** One coloured piece of the ring, measured along the circle's outline. */
export type DonutSegment = {
  /** How long this piece is. 0 for a count of 0. */
  length: number;
  /** How far along the outline this piece starts (pieces follow each other). */
  start: number;
};

/**
 * Split a circle outline of length `circumference` between the counts.
 * Example: donutSegments([1, 3], 100) -> [{ length: 25, start: 0 }, { length: 75, start: 25 }]
 * If every count is 0 (or there are none), every piece has length 0:
 * the caller shows a plain grey ring instead.
 * Negative or non-finite counts are treated as 0.
 */
export function donutSegments(
  counts: readonly number[],
  circumference: number,
): DonutSegment[] {
  const safeCounts = counts.map((count) =>
    Number.isFinite(count) && count > 0 ? count : 0,
  );
  const total = safeCounts.reduce((sum, count) => sum + count, 0);

  let start = 0;
  return safeCounts.map((count) => {
    const length = total === 0 ? 0 : (count / total) * circumference;
    const segment = { length, start };
    start += length;
    return segment;
  });
}
