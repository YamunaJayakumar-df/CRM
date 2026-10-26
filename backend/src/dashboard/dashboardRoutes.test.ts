// Tests for GET /dashboard, driven through the real Express app with supertest.
//
// The database is NOT used: vi.mock replaces db.ts with a fake `prisma` whose
// methods are vi.fn() "spies". The clock is frozen so "today" is always the
// same, which lets us check the exact numbers and the exact date windows the
// route asks the database for.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";

vi.mock("../db.js", () => ({
  prisma: {
    customer: { count: vi.fn(), findMany: vi.fn() },
    followUp: { count: vi.fn(), findMany: vi.fn() },
    interaction: { findMany: vi.fn() },
  },
}));

// Short names for the fake Prisma methods, so tests read more easily.
const countCustomers = vi.mocked(prisma.customer.count);
const findCustomers = vi.mocked(prisma.customer.findMany);
const countFollowUps = vi.mocked(prisma.followUp.count);
const findFollowUps = vi.mocked(prisma.followUp.findMany);
const findInteractions = vi.mocked(prisma.interaction.findMany);

// The frozen clock: 20:00 UTC on 26 October is already 01:30 on 27 October in
// India, so "today" is 2026-10-27. With today = 2026-10-27:
//   chart days        2026-10-14 .. 2026-10-27 (index 0 .. 13)
//   last 7 days       2026-10-21 .. 2026-10-27
//   previous 7 days   2026-10-14 .. 2026-10-20
//   overdue chart     2026-10-13 .. 2026-10-26
//   upcoming chart    2026-10-27 .. 2026-11-09
const NOW = new Date("2026-10-26T20:00:00Z");

// 00:00 in India on the first chart day (2026-10-14) and on tomorrow (2026-10-28).
const chartMoments = {
  gte: new Date("2026-10-13T18:30:00.000Z"),
  lt: new Date("2026-10-27T18:30:00.000Z"),
};

/** Make the fake database return a small, hand-checked set of data. */
function mockDashboardData() {
  // Each count answers according to its "where", so the test does not
  // depend on the order in which the route asks.
  countCustomers.mockImplementation(((args?: { where?: unknown }) =>
    Promise.resolve(args?.where === undefined ? 10 : 8)) as never);
  countFollowUps.mockImplementation(((args: {
    where: { status: string; dueDate?: unknown };
  }) => {
    if (args.where.dueDate !== undefined) return Promise.resolve(2); // overdue
    return Promise.resolve(args.where.status === "OPEN" ? 6 : 4);
  }) as never);

  findCustomers.mockResolvedValue([
    { createdAt: new Date("2026-10-27T10:00:00Z") }, // 27 Oct in India
    { createdAt: new Date("2026-10-26T19:00:00Z") }, // 00:30 on 27 Oct in India
    { createdAt: new Date("2026-10-26T17:00:00Z") }, // 22:30 on 26 Oct in India
  ] as never);
  findFollowUps.mockResolvedValue([
    { dueDate: new Date("2026-10-27T00:00:00Z") }, // due today
    { dueDate: new Date("2026-10-20T00:00:00Z") }, // overdue
    { dueDate: new Date("2026-10-30T00:00:00Z") }, // due in 3 days
  ] as never);
  findInteractions.mockResolvedValue([
    { occurredAt: new Date("2026-10-26T18:45:00Z") }, // 00:15 on 27 Oct in India
    { occurredAt: new Date("2026-10-18T06:00:00Z") }, // 18 Oct: previous week
  ] as never);
}

beforeEach(() => {
  // Forget calls and return values from the previous test.
  vi.resetAllMocks();
  // Only Date is faked, so supertest's real timers keep working.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  // Undo any vi.spyOn (e.g. the silenced console.error).
  vi.restoreAllMocks();
});

describe("GET /dashboard", () => {
  // Protects the whole response: shape and every number for a known "today".
  it("returns 200 with the dashboard numbers for today in India", async () => {
    mockDashboardData();

    const res = await request(createApp()).get("/dashboard");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      today: "2026-10-27",
      customers: {
        total: 10,
        active: 8,
        addedLast7Days: 3,
        dailyNew: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2],
      },
      followUps: {
        open: 6,
        overdue: 2,
        dueToday: 1,
        dueNext7Days: 2,
        done: 4,
        dueByDayNext14: [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        overdueByDayLast14: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
      },
      interactions: {
        last7Days: 1,
        previous7Days: 1,
        dailyCount: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      },
    });
  });

  // Protects that the counts ask the right questions (all, ACTIVE, OPEN, DONE, overdue).
  it("counts customers and follow-ups with the right filters", async () => {
    mockDashboardData();

    await request(createApp()).get("/dashboard");

    expect(countCustomers).toHaveBeenCalledWith();
    expect(countCustomers).toHaveBeenCalledWith({ where: { status: "ACTIVE" } });
    expect(countFollowUps).toHaveBeenCalledWith({ where: { status: "OPEN" } });
    expect(countFollowUps).toHaveBeenCalledWith({ where: { status: "DONE" } });
    // Overdue = OPEN and due before today (midnight UTC of 2026-10-27).
    expect(countFollowUps).toHaveBeenCalledWith({
      where: { status: "OPEN", dueDate: { lt: new Date("2026-10-27T00:00:00.000Z") } },
    });
  });

  // Protects the chart windows: from 00:00 in India on the first chart day
  // up to (not including) 00:00 in India tomorrow, loading only one column.
  it("loads only the chart window for customers and interactions", async () => {
    mockDashboardData();

    await request(createApp()).get("/dashboard");

    expect(findCustomers).toHaveBeenCalledWith({
      where: { createdAt: chartMoments },
      select: { createdAt: true },
    });
    expect(findInteractions).toHaveBeenCalledWith({
      where: { occurredAt: chartMoments },
      select: { occurredAt: true },
    });
  });

  // Protects the follow-up window: OPEN follow-ups due from today-14 to today+13.
  it("loads open follow-ups due in the chart window", async () => {
    mockDashboardData();

    await request(createApp()).get("/dashboard");

    expect(findFollowUps).toHaveBeenCalledWith({
      where: {
        status: "OPEN",
        dueDate: {
          gte: new Date("2026-10-13T00:00:00.000Z"),
          lte: new Date("2026-11-09T00:00:00.000Z"),
        },
      },
      select: { dueDate: true },
    });
  });

  // Protects that a database failure gives a generic 500 without leaking details.
  it("returns a generic 500 when the database fails", async () => {
    // The error handler logs to console.error; silence it so test output stays clean.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockDashboardData();
    countCustomers.mockRejectedValue(new Error("connection to secret-db-host failed"));

    const res = await request(createApp()).get("/dashboard");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Something went wrong" });
    expect(res.text).not.toContain("secret-db-host");
    expect(consoleError).toHaveBeenCalled();
  });
});
