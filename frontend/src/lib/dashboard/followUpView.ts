// Reads and writes the dashboard's follow-up filter in the URL.
//
// The "Upcoming Follow-ups" card has filter chips (All / Open / Overdue /
// Completed) and a search box. Their state lives in the URL, e.g.
//   /?fu=overdue&fq=acme
// Why the URL (and not React state): the page stays a Server Component,
// the chips are plain links that work without JavaScript, and a filtered
// view can be bookmarked or shared. "fu"/"fq" (not "q") are used so they
// never clash with the top bar's global search, which uses "q".
import type { FollowUpFilters } from "@/lib/api/queries";
import { buildQueryString } from "@/lib/api/buildQueryString";

/** The four filter chips. */
export type FollowUpChip = "all" | "open" | "overdue" | "done";

/** Chips in the order they are shown. */
export const FOLLOW_UP_CHIPS: readonly FollowUpChip[] = ["all", "open", "overdue", "done"];

/** Text on each chip (the count is added next to it). */
export const FOLLOW_UP_CHIP_LABELS: Record<FollowUpChip, string> = {
  all: "All",
  open: "Open",
  overdue: "Overdue",
  done: "Completed",
};

/** How many rows the dashboard card shows. */
export const DASHBOARD_FOLLOW_UP_ROWS = 5;

/** Longest search text we pass on to the backend. */
const MAX_SEARCH_LENGTH = 100;

/** One value from Next.js `searchParams`: missing, once, or repeated (?a=1&a=2). */
export type SearchParamValue = string | string[] | undefined;

/** The dashboard page's URL search params, as Next.js gives them. */
export type DashboardSearchParams = Record<string, SearchParamValue>;

/** The first value of a search param, or undefined. */
export function firstValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The chip chosen in the URL (?fu=...). Anything unknown or missing -> "all",
 * so a hand-edited URL never breaks the page.
 */
export function readFollowUpChip(value: SearchParamValue): FollowUpChip {
  const text = firstValue(value);
  return FOLLOW_UP_CHIPS.find((chip) => chip === text) ?? "all";
}

/**
 * The search text in the URL (?fq=...), trimmed and at most 100 characters.
 * Missing or blank -> "".
 */
export function readFollowUpSearch(value: SearchParamValue): string {
  return (firstValue(value) ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
}

/** The backend filters for a chip + search text (always at most 5 rows). */
export function followUpFiltersFor(chip: FollowUpChip, search: string): FollowUpFilters {
  const q = search === "" ? undefined : search;
  const limit = DASHBOARD_FOLLOW_UP_ROWS;

  switch (chip) {
    case "open":
      return { status: "OPEN", q, limit };
    case "overdue":
      return { due: "overdue", q, limit };
    case "done":
      return { status: "DONE", q, limit };
    default:
      // "all": no status filter; the backend sorts soonest due first.
      return { q, limit };
  }
}

/**
 * The dashboard link for a chip + search text.
 * "all" and blank search are left out, so the plain view is just "/".
 * Example: followUpViewHref("open", "R&D") -> "/?fu=open&fq=R%26D"
 */
export function followUpViewHref(chip: FollowUpChip, search: string): string {
  return `/${buildQueryString({
    fu: chip === "all" ? undefined : chip,
    fq: search,
  })}`;
}

/** The follow-up numbers from the dashboard summary that the chips need. */
type FollowUpCounts = { open: number; overdue: number; done: number };

/**
 * The count shown on each chip. Note: "open" INCLUDES overdue follow-ups
 * (overdue ones are still open), which matches what the Open chip lists.
 */
export function chipCounts(counts: FollowUpCounts): Record<FollowUpChip, number> {
  return {
    all: counts.open + counts.done,
    open: counts.open,
    overdue: counts.overdue,
    done: counts.done,
  };
}
