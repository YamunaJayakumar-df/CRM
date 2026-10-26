// Pure calculations behind GET /dashboard: turn counts and lists of calendar
// days (loaded by dashboardRoutes.ts) into the numbers the dashboard shows.
//
// Why a separate file: nothing here touches the database or HTTP, so every
// rule ("what counts as the last 7 days?") can be unit-tested with plain
// strings. All days are "YYYY-MM-DD" calendar days in Asia/Kolkata.
import { addDays } from "../shared/plainDate.js";

// How many days each dashboard chart covers.
export const CHART_DAYS = 14;

// "Last 7 days" style totals cover one week.
const WEEK_DAYS = 7;

/** What dashboardRoutes.ts loads from the database for one dashboard. */
export type DashboardInput = {
  customerTotal: number;
  activeCustomerTotal: number;
  // Kolkata day on which each customer created in the chart window was created.
  customerCreatedDays: string[];
  openFollowUpTotal: number;
  doneFollowUpTotal: number;
  // ALL open follow-ups due before today, not only those in the chart window.
  overdueFollowUpTotal: number;
  // Due day of each OPEN follow-up due from today-14 to today+13.
  openFollowUpDueDays: string[];
  // Kolkata day on which each interaction in the chart window happened.
  interactionDays: string[];
};

/** The JSON body of GET /dashboard. */
export type DashboardSummary = {
  today: string;
  customers: {
    total: number;
    active: number;
    addedLast7Days: number;
    dailyNew: number[];
  };
  followUps: {
    open: number;
    overdue: number;
    dueToday: number;
    dueNext7Days: number;
    done: number;
    dueByDayNext14: number[];
    overdueByDayLast14: number[];
  };
  interactions: {
    last7Days: number;
    previous7Days: number;
    dailyCount: number[];
  };
};

/**
 * The days the database queries must cover so every number above is complete.
 * Kept next to buildDashboardSummary so the windows and the buckets never disagree.
 */
export function getDashboardWindows(today: string): {
  firstPastDay: string; // today-13: first day of the "last 14 days" charts
  dayAfterToday: string; // today+1: timestamps must be before this day starts
  firstOverdueDay: string; // today-14: first day of overdueByDayLast14
  lastUpcomingDay: string; // today+13: last day of dueByDayNext14
} {
  return {
    firstPastDay: addDays(today, -(CHART_DAYS - 1)),
    dayAfterToday: addDays(today, 1),
    firstOverdueDay: addDays(today, -CHART_DAYS),
    lastUpcomingDay: addDays(today, CHART_DAYS - 1),
  };
}

/**
 * The `n` days that END with `lastDay`, oldest first.
 * lastNDays("2026-10-26", 3) -> ["2026-10-24", "2026-10-25", "2026-10-26"].
 * n = 0 gives [].
 */
export function lastNDays(lastDay: string, n: number): string[] {
  return Array.from({ length: n }, (_, index) =>
    addDays(lastDay, index - (n - 1)),
  );
}

/**
 * The `n` days that START with `firstDay`, oldest first.
 * nextNDays("2026-10-26", 3) -> ["2026-10-26", "2026-10-27", "2026-10-28"].
 * n = 0 gives [].
 */
export function nextNDays(firstDay: string, n: number): string[] {
  return Array.from({ length: n }, (_, index) => addDays(firstDay, index));
}

/**
 * For each day in `days`, how many entries of `values` are that day.
 * Values that are not in `days` are ignored.
 * countByDay(["2026-10-25", "2026-10-26"], ["2026-10-26", "2026-10-26", "2026-01-01"]) -> [0, 2].
 */
export function countByDay(days: string[], values: string[]): number[] {
  const counts = days.map(() => 0);
  for (const value of values) {
    const index = days.indexOf(value);
    if (index !== -1) {
      counts[index] += 1;
    }
  }
  return counts;
}

/** How many entries of `values` fall on any of `days`. */
function countInDays(days: string[], values: string[]): number {
  return countByDay(days, values).reduce((total, count) => total + count, 0);
}

/** Build the whole dashboard response for `today` from the loaded data. */
export function buildDashboardSummary(
  today: string,
  input: DashboardInput,
): DashboardSummary {
  const yesterday = addDays(today, -1);
  const sameDayLastWeek = addDays(today, -WEEK_DAYS);

  return {
    today,
    customers: {
      total: input.customerTotal,
      active: input.activeCustomerTotal,
      addedLast7Days: countInDays(
        lastNDays(today, WEEK_DAYS),
        input.customerCreatedDays,
      ),
      dailyNew: countByDay(
        lastNDays(today, CHART_DAYS),
        input.customerCreatedDays,
      ),
    },
    followUps: {
      open: input.openFollowUpTotal,
      overdue: input.overdueFollowUpTotal,
      dueToday: countInDays([today], input.openFollowUpDueDays),
      dueNext7Days: countInDays(
        nextNDays(today, WEEK_DAYS),
        input.openFollowUpDueDays,
      ),
      done: input.doneFollowUpTotal,
      dueByDayNext14: countByDay(
        nextNDays(today, CHART_DAYS),
        input.openFollowUpDueDays,
      ),
      // The 14 days BEFORE today (today itself is "due today", not overdue).
      overdueByDayLast14: countByDay(
        lastNDays(yesterday, CHART_DAYS),
        input.openFollowUpDueDays,
      ),
    },
    interactions: {
      last7Days: countInDays(lastNDays(today, WEEK_DAYS), input.interactionDays),
      previous7Days: countInDays(
        lastNDays(sameDayLastWeek, WEEK_DAYS),
        input.interactionDays,
      ),
      dailyCount: countByDay(
        lastNDays(today, CHART_DAYS),
        input.interactionDays,
      ),
    },
  };
}
