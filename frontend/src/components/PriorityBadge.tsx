// PriorityBadge: a small coloured pill showing how urgent a follow-up is
// (High / Medium / Low). The word is always shown, so the meaning never
// depends on colour alone. Same pill shape as StatusBadge.
import type { FollowUpPriority } from "@/lib/api/types";
import { followUpPriorityLabel } from "@/lib/format/labels";

type PriorityBadgeProps = {
  priority: FollowUpPriority;
};

// Full class names are written out so Tailwind can find them.
const priorityClasses: Record<FollowUpPriority, string> = {
  HIGH: "bg-high-bg text-high-ink",
  MEDIUM: "bg-medium-bg text-medium-ink",
  LOW: "bg-low-bg text-low-ink",
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityClasses[priority]}`}
    >
      {followUpPriorityLabel(priority)}
    </span>
  );
}
