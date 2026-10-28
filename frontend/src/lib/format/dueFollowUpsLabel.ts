// The words screen readers hear for the bell and the sidebar count,
// e.g. "3 follow-ups due today or overdue".
//
// Why: the count is shown as a small number or a red dot, which means
// nothing without words. One helper keeps the wording (and the
// "1 follow-up" vs "2 follow-ups" rule) the same everywhere.

/** 1 -> "1 follow-up due today or overdue", 3 -> "3 follow-ups due today or overdue" */
export function dueFollowUpsLabel(count: number): string {
  const noun = count === 1 ? "follow-up" : "follow-ups";
  return `${count} ${noun} due today or overdue`;
}
