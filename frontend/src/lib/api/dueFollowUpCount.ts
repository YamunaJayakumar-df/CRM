// How many follow-ups need attention now (due today + overdue), for the
// sidebar count and the bell dot.
//
// Why this is "safe" (never throws for backend problems): the sidebar and
// top bar live in the ROOT layout, around every page. app/error.tsx cannot
// catch errors from the root layout, so a backend hiccup here would break
// every page. Instead we log the problem once on the server and return null,
// which means "show no badge". The page itself still loads (or shows its
// own error screen).
//
// getDueFollowUpCounts gives the two numbers separately (the bell uses them
// to pick the Overdue or Due today view); getDueFollowUpCount adds them up.
//
// Why cache(): three places ask for this number in one request (sidebar,
// phone nav, bell). cache() runs it once per request, so the backend is
// asked once and an error is logged once. It reuses the dashboard summary
// through getDashboardSummaryOnce, so on the dashboard the layout and the
// page share ONE /dashboard request.
//
// Why `await io()` first: with cacheComponents, Next.js prebuilds pages at
// build time. io() stops that prebuild here (the badge is filled in per
// request), so the backend is never called, and nothing is logged, during
// `npm run build`.
import "server-only";
import { cache } from "react";
import { io } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { getDashboardSummaryOnce } from "./requestMemo";

/** The two numbers that need attention now. */
export type DueFollowUpCounts = { dueToday: number; overdue: number };

/** Due today and overdue, separately, or null if the backend could not be asked. */
export const getDueFollowUpCounts = cache(async (): Promise<DueFollowUpCounts | null> => {
  await io();

  try {
    const { followUps } = await getDashboardSummaryOnce();
    return { dueToday: followUps.dueToday, overdue: followUps.overdue };
  } catch (error) {
    // Lets Next.js's own internal signals pass through untouched.
    unstable_rethrow(error);
    console.error("Could not load the due follow-up count for the navigation.", error);
    return null;
  }
});

/** Due today + overdue, or null if the backend could not be asked. */
export const getDueFollowUpCount = cache(async (): Promise<number | null> => {
  const counts = await getDueFollowUpCounts();
  return counts === null ? null : counts.dueToday + counts.overdue;
});
