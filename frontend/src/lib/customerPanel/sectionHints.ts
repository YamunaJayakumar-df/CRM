// The short grey text under each section link on the customer card, e.g.
//   Interactions   Last contact Oct 26, 2026
//   Follow-ups     3 open
//   Notes          Managed IT support for 3 branches.
//
// Why a separate file: these are small rules ("20 or more shows 20+") that
// are easy to get wrong, so they live here, apart from the display, and are tested.
import { firstLine } from "@/lib/format/firstLine";
import { formatShortDate } from "@/lib/format/dates";

/**
 * Hint for Interactions: the day of the latest one, or "None yet".
 * `lastOccurredAt` is the newest interaction's ISO date-time, or null.
 */
export function interactionsHint(lastOccurredAt: string | null): string {
  if (lastOccurredAt === null) {
    return "None yet";
  }
  return `Last contact ${formatShortDate(lastOccurredAt)}`;
}

/**
 * Hint for Follow-ups: how many are open.
 * At most `countLimit` are loaded, so reaching it shows e.g. "20+ open".
 */
export function followUpsHint(openCount: number, countLimit: number): string {
  if (openCount === 0) {
    return "None open";
  }
  const count = openCount >= countLimit ? `${countLimit}+` : String(openCount);
  return `${count} open`;
}

/** Hint for Notes: the first line of the notes, or "No notes yet". */
export function notesHint(notes: string | null): string {
  const line = firstLine(notes);
  return line === "" ? "No notes yet" : line;
}
