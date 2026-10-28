// Tests for the pure dashboard calculations (no HTTP, no database).
// We pass in hand-made lists of calendar days and check the exact numbers,
// so every rule ("what counts as the last 7 days?") is pinned down.
// All days are "YYYY-MM-DD" calendar days in Asia/Kolkata.
import { describe, it, expect } from "vitest";
import {
  buildDashboardSummary,
  countByDay,
  getDashboardWindows,
  lastNDays,
  nextNDays,
  type DashboardInput,
} from "./dashboardSummary.js";

describe("lastNDays", () => {
  // Protects the order (oldest first) and that the list ends on the given day.
  it("returns n days ending with the given day, oldest first", () => {
    expect(lastNDays("2026-10-26", 3)).toEqual(["2026-10-24", "2026-10-25", "2026-10-26"]);
  });

  // Protects crossing back over the start of a month.
  it("crosses a month end", () => {
    expect(lastNDays("2026-11-02", 4)).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });

  // Protects the length used by the charts, and the edge case 0.
  it("returns exactly n days (14 for the charts, none for 0)", () => {
    expect(lastNDays("2026-10-26", 14)).toHaveLength(14);
    expect(lastNDays("2026-10-26", 0)).toEqual([]);
  });
});

describe("nextNDays", () => {
  // Protects the order (oldest first) and that the list starts on the given day.
  it("returns n days starting with the given day, oldest first", () => {
    expect(nextNDays("2026-10-26", 3)).toEqual(["2026-10-26", "2026-10-27", "2026-10-28"]);
  });

  // Protects crossing over the end of a month.
  it("crosses a month end", () => {
    expect(nextNDays("2026-10-30", 4)).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });

  // Protects the length used by the charts, and the edge case 0.
  it("returns exactly n days (14 for the charts, none for 0)", () => {
    expect(nextNDays("2026-10-26", 14)).toHaveLength(14);
    expect(nextNDays("2026-10-26", 0)).toEqual([]);
  });
});

describe("countByDay", () => {
  // Protects counting several entries on the same day, in the order of `days`.
  it("counts how many values fall on each day", () => {
    const days = ["2026-10-24", "2026-10-25", "2026-10-26"];
    const values = ["2026-10-26", "2026-10-24", "2026-10-26"];

    expect(countByDay(days, values)).toEqual([1, 0, 2]);
  });

  // Protects that values outside the chart's days do not break or shift the counts.
  it("ignores values that are not one of the days", () => {
    const days = ["2026-10-25", "2026-10-26"];
    const values = ["2026-10-26", "2026-01-01", "2026-10-27"];

    expect(countByDay(days, values)).toEqual([0, 1]);
  });

  // Protects the "nothing happened" case: zeros, not an empty list.
  it("returns zeros when there are no values", () => {
    expect(countByDay(["2026-10-25", "2026-10-26"], [])).toEqual([0, 0]);
  });
});

describe("getDashboardWindows", () => {
  // Protects the exact day ranges the database queries must cover.
  it("returns the query windows around today", () => {
    expect(getDashboardWindows("2026-10-26")).toEqual({
      firstPastDay: "2026-10-13", // today-13
      dayAfterToday: "2026-10-27", // today+1
      firstOverdueDay: "2026-10-12", // today-14
      lastUpcomingDay: "2026-11-08", // today+13
    });
  });
});

describe("buildDashboardSummary", () => {
  // today = 2026-10-26. The day ranges used below:
  //   last 7 days        2026-10-20 .. 2026-10-26
  //   previous 7 days    2026-10-13 .. 2026-10-19
  //   last 14 days       2026-10-13 .. 2026-10-26 (chart index 0 .. 13)
  //   next 7 days        2026-10-26 .. 2026-11-01
  //   next 14 days       2026-10-26 .. 2026-11-08 (chart index 0 .. 13)
  //   14 days before     2026-10-12 .. 2026-10-25 (chart index 0 .. 13)
  const today = "2026-10-26";

  const input: DashboardInput = {
    customerTotal: 10,
    activeCustomerTotal: 8,
    customerCreatedDays: [
      "2026-10-26", // today
      "2026-10-20", // first day of "last 7 days"
      "2026-10-19", // just outside "last 7 days", still in the chart
      "2026-10-13", // first chart day
      "2026-10-12", // before the chart: ignored
    ],
    openFollowUpTotal: 6,
    doneFollowUpTotal: 4,
    overdueFollowUpTotal: 9,
    openFollowUpDueDays: [
      "2026-10-12", // first day of the overdue chart
      "2026-10-25", // yesterday: overdue, not due today
      "2026-10-26", // today
      "2026-10-26", // today
      "2026-11-01", // last day of "next 7 days"
      "2026-11-02", // just outside "next 7 days"
      "2026-11-08", // last day of the upcoming chart
    ],
    interactionDays: [
      "2026-10-26", // last 7 days
      "2026-10-20", // last 7 days
      "2026-10-19", // previous 7 days
      "2026-10-15", // previous 7 days
      "2026-10-13", // previous 7 days
      "2026-10-12", // before both weeks: ignored
      "2026-10-27", // in the future: ignored
    ],
  };

  // Protects every number on the dashboard for one hand-checked example.
  it("builds the exact summary from the loaded data", () => {
    expect(buildDashboardSummary(today, input)).toEqual({
      today: "2026-10-26",
      customers: {
        total: 10,
        active: 8,
        addedLast7Days: 2,
        dailyNew: [1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1],
      },
      followUps: {
        open: 6,
        overdue: 9,
        dueToday: 2,
        dueNext7Days: 3,
        done: 4,
        dueByDayNext14: [2, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1],
        overdueByDayLast14: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      },
      interactions: {
        last7Days: 2,
        previous7Days: 3,
        dailyCount: [1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1],
      },
    });
  });

  // Protects the "nothing yet" dashboard: all zeros, charts still 14 long.
  it("returns zeros and 14-day charts for empty data", () => {
    const empty: DashboardInput = {
      customerTotal: 0,
      activeCustomerTotal: 0,
      customerCreatedDays: [],
      openFollowUpTotal: 0,
      doneFollowUpTotal: 0,
      overdueFollowUpTotal: 0,
      openFollowUpDueDays: [],
      interactionDays: [],
    };
    const zeros = new Array(14).fill(0);

    expect(buildDashboardSummary(today, empty)).toEqual({
      today: "2026-10-26",
      customers: { total: 0, active: 0, addedLast7Days: 0, dailyNew: zeros },
      followUps: {
        open: 0,
        overdue: 0,
        dueToday: 0,
        dueNext7Days: 0,
        done: 0,
        dueByDayNext14: zeros,
        overdueByDayLast14: zeros,
      },
      interactions: { last7Days: 0, previous7Days: 0, dailyCount: zeros },
    });
  });
});
