// Small number helpers for dashboard trends, e.g. "3 more than last week".
//
// Why: the dashboard compares this week with last week and sums daily
// counts. Keeping the maths here (not inside components) makes it testable.

/** Which way a number moved, and by how much (always 0 or more). */
export type WeekChange = {
  direction: "up" | "down" | "same";
  amount: number;
};

/**
 * Compare the last 7 days with the 7 days before.
 * Example: weekChange(12, 9) -> { direction: "up", amount: 3 }
 * Throws an Error if either count is not a finite number.
 */
export function weekChange(last7: number, previous7: number): WeekChange {
  if (!Number.isFinite(last7) || !Number.isFinite(previous7)) {
    throw new Error("weekChange needs two finite numbers");
  }

  const difference = last7 - previous7;
  if (difference > 0) return { direction: "up", amount: difference };
  if (difference < 0) return { direction: "down", amount: -difference };
  return { direction: "same", amount: 0 };
}

/**
 * Sum of the last `n` values (the newest ones, at the end of the array).
 * If there are fewer than `n` values, all of them are summed; n = 0 -> 0.
 * Example: sumLast([1, 2, 3, 4], 2) -> 7
 * Throws an Error if `n` is negative or not a whole number.
 */
export function sumLast(values: readonly number[], n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`sumLast needs a whole number n >= 0, got ${n}`);
  }
  if (n === 0) {
    return 0;
  }
  return values.slice(-n).reduce((total, value) => total + value, 0);
}
