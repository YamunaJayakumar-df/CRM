// How urgent a follow-up's due date is: overdue, due today, or neither.
//
// Why: the dashboard table and the customer panel both colour due dates
// red when they need attention now. Keeping the rule here means both
// places always agree.
import type { FollowUpStatus } from "@/lib/api/types";
import { isOverdue } from "./dates";

export type FollowUpDueState = "overdue" | "today" | "later";

/**
 * - DONE follow-ups are never urgent -> "later"
 * - OPEN and due before today -> "overdue"
 * - OPEN and due today -> "today"
 * - otherwise -> "later"
 * Both dates are "YYYY-MM-DD"; throws an Error for invalid dates.
 */
export function followUpDueState(
  status: FollowUpStatus,
  dueDate: string,
  today: string,
): FollowUpDueState {
  if (status !== "OPEN") {
    return "later";
  }
  if (isOverdue(dueDate, today)) {
    return "overdue";
  }
  if (dueDate === today) {
    return "today";
  }
  return "later";
}
