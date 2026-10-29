// PriorityBadge: a small coloured pill showing how urgent a follow-up is
// (High / Medium / Low). The word is always shown, so the meaning never
// depends on colour alone. Same pill shape as StatusBadge, with a small
// signal-bars icon (1, 2 or 3 bars) as a second hint.
import { SignalHigh, SignalLow, SignalMedium } from "lucide-react";
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

const priorityIcons: Record<FollowUpPriority, typeof SignalHigh> = {
  HIGH: SignalHigh,
  MEDIUM: SignalMedium,
  LOW: SignalLow,
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const Icon = priorityIcons[priority];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityClasses[priority]}`}
    >
      <Icon size={13} strokeWidth={2.25} aria-hidden="true" />
      {followUpPriorityLabel(priority)}
    </span>
  );
}
