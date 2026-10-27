// InteractionTypeBadge: a small grey pill with an interaction's type
// ("Call", "Email", "Meeting", "Note"). Grey on purpose: the coloured
// icon next to it already carries the colour, the pill gives the word.
import type { InteractionType } from "@/lib/api/types";
import { interactionTypeLabel } from "@/lib/format/labels";

type InteractionTypeBadgeProps = {
  type: InteractionType;
};

export default function InteractionTypeBadge({ type }: InteractionTypeBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-hover px-2.5 py-0.5 text-xs font-medium text-muted">
      {interactionTypeLabel(type)}
    </span>
  );
}
