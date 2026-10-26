// CustomerStatusBadge: a small pill showing whether we currently work with
// a customer ("Active" in green, "Inactive" in grey). The word is always
// shown, so the meaning never depends on colour alone. Same pill shape as
// StatusBadge and PriorityBadge.
import type { CustomerStatus } from "@/lib/api/types";
import { customerStatusLabel } from "@/lib/format/labels";

type CustomerStatusBadgeProps = {
  status: CustomerStatus;
};

// Full class names are written out so Tailwind can find them.
const statusClasses: Record<CustomerStatus, string> = {
  ACTIVE: "bg-done-bg text-done-ink",
  INACTIVE: "bg-hover text-muted",
};

export default function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[status] ?? statusClasses.INACTIVE}`}
    >
      {customerStatusLabel(status)}
    </span>
  );
}
