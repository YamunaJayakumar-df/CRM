// HTTP route for the dashboard: GET /dashboard returns all of its numbers
// (customers, follow-ups, interactions) in ONE response.
//
// Why one endpoint: the dashboard page would otherwise need many requests
// and would have to download whole lists just to count them. Here the
// database counts, and for the 14-day charts we load only one date column.
// This file only LOADS data; the rules for turning it into numbers live in
// dashboardSummary.ts. All days are calendar days in Asia/Kolkata.
//
// NOTE: no login/permission checks yet; they are added in the later Auth step.
import { Router } from "express";
import { prisma } from "../db.js";
import {
  dateToPlainDate,
  plainDateOfMoment,
  plainDateToDate,
  startOfDayInKolkata,
  todayInKolkata,
} from "../shared/plainDate.js";
import {
  buildDashboardSummary,
  getDashboardWindows,
  type DashboardInput,
} from "./dashboardSummary.js";

export const dashboardRouter = Router();

/**
 * Load everything the dashboard needs for `today` ("YYYY-MM-DD" in Asia/Kolkata).
 * Timestamps (createdAt, occurredAt) are turned into the Kolkata calendar day
 * they happened on, so something at 23:00 in India counts on that day.
 * dueDate is already a plain day (@db.Date), so it is read with dateToPlainDate.
 */
async function loadDashboardInput(today: string): Promise<DashboardInput> {
  const windows = getDashboardWindows(today);

  // From 00:00 in India on the first chart day up to (not including)
  // 00:00 in India tomorrow. Future-dated interactions are left out.
  const chartMoments = {
    gte: startOfDayInKolkata(windows.firstPastDay),
    lt: startOfDayInKolkata(windows.dayAfterToday),
  };

  // These queries do not depend on each other, so Promise.all sends them
  // at the same time: the page waits for the slowest one instead of the
  // sum of all of them. If any query fails, the whole request fails (500).
  const [
    customerTotal,
    activeCustomerTotal,
    recentCustomers,
    openFollowUpTotal,
    doneFollowUpTotal,
    overdueFollowUpTotal,
    openFollowUpsInWindow,
    recentInteractions,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { status: "ACTIVE" } }),
    prisma.customer.findMany({
      where: { createdAt: chartMoments },
      select: { createdAt: true },
    }),
    prisma.followUp.count({ where: { status: "OPEN" } }),
    prisma.followUp.count({ where: { status: "DONE" } }),
    prisma.followUp.count({
      where: { status: "OPEN", dueDate: { lt: plainDateToDate(today) } },
    }),
    prisma.followUp.findMany({
      where: {
        status: "OPEN",
        dueDate: {
          gte: plainDateToDate(windows.firstOverdueDay),
          lte: plainDateToDate(windows.lastUpcomingDay),
        },
      },
      select: { dueDate: true },
    }),
    prisma.interaction.findMany({
      where: { occurredAt: chartMoments },
      select: { occurredAt: true },
    }),
  ]);

  return {
    customerTotal,
    activeCustomerTotal,
    customerCreatedDays: recentCustomers.map((customer) =>
      plainDateOfMoment(customer.createdAt),
    ),
    openFollowUpTotal,
    doneFollowUpTotal,
    overdueFollowUpTotal,
    openFollowUpDueDays: openFollowUpsInWindow.map((followUp) =>
      dateToPlainDate(followUp.dueDate),
    ),
    interactionDays: recentInteractions.map((interaction) =>
      plainDateOfMoment(interaction.occurredAt),
    ),
  };
}

// GET /dashboard -> { today, customers, followUps, interactions } (see DashboardSummary).
dashboardRouter.get("/", async (_req, res) => {
  // Worked out once, so every number uses the same "today" even if the
  // request runs across midnight in India.
  const today = todayInKolkata();
  const input = await loadDashboardInput(today);
  res.status(200).json(buildDashboardSummary(today, input));
});
