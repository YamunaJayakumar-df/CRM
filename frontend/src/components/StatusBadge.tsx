// StatusBadge: a small coloured pill showing a follow-up's status.
// The word ("Open" / "Done") is always shown, so the meaning never
// depends on colour alone. Status values match the backend: OPEN | DONE.
import type { FollowUpStatus } from "@/lib/api/types";
import { followUpStatusLabel } from "@/lib/format/labels";

type StatusBadgeProps = {
  status: FollowUpStatus;
};

// Full class names are written out so Tailwind can find them.
const statusClasses: Record<FollowUpStatus, string> = {
  OPEN: "bg-open-bg text-open-ink",
  DONE: "bg-done-bg text-done-ink",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[status]}`}
    >
      {/* A small dot in the text colour, like a status light. */}
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {followUpStatusLabel(status)}
    </span>
  );
}
