// The Priority and Status choices of the follow-up form, as pill options.
//
// Each chosen pill uses the SAME colours as the PriorityBadge / StatusBadge
// pills in the lists (low / medium / high and open / done tokens), so the
// form and the tables look like one family. Class names are written out in
// full so Tailwind can find them in this file.
import type { PillRadioOption } from "@/components/forms/PillRadioGroup";
import type { FollowUpPriority, FollowUpStatus } from "@/lib/api/types";
import { FOLLOW_UP_PRIORITIES, FOLLOW_UP_STATUSES } from "@/lib/followUps/followUpForm";
import { followUpPriorityLabel, followUpStatusLabel } from "@/lib/format/labels";

const PRIORITY_CHECKED_CLASSES: Record<FollowUpPriority, string> = {
  LOW: "has-checked:border-low-ink has-checked:bg-low-bg has-checked:text-low-ink",
  MEDIUM: "has-checked:border-medium-ink has-checked:bg-medium-bg has-checked:text-medium-ink",
  HIGH: "has-checked:border-high-ink has-checked:bg-high-bg has-checked:text-high-ink",
};

const STATUS_CHECKED_CLASSES: Record<FollowUpStatus, string> = {
  OPEN: "has-checked:border-open-ink has-checked:bg-open-bg has-checked:text-open-ink",
  DONE: "has-checked:border-done-ink has-checked:bg-done-bg has-checked:text-done-ink",
};

/** Low / Medium / High. */
export const PRIORITY_PILL_OPTIONS: PillRadioOption[] = FOLLOW_UP_PRIORITIES.map((priority) => ({
  value: priority,
  label: followUpPriorityLabel(priority),
  checkedClasses: PRIORITY_CHECKED_CLASSES[priority],
}));

/** Open / Done. */
export const STATUS_PILL_OPTIONS: PillRadioOption[] = FOLLOW_UP_STATUSES.map((status) => ({
  value: status,
  label: followUpStatusLabel(status),
  checkedClasses: STATUS_CHECKED_CLASSES[status],
}));
