// InteractionTypePill: a small pill in the type's colour, e.g. a blue
// "Call" in the table or a blue "Calls" heading on the Kanban board.
// The word is always shown, so the meaning never depends on colour alone.
import { interactionTypeTint } from "@/components/interactionTypeTints";
import type { InteractionType } from "@/lib/api/types";
import { interactionTypeLabel } from "@/lib/format/labels";

type InteractionTypePillProps = {
  type: InteractionType;
  /** Text to show instead of the type's name, e.g. the plural "Calls". */
  label?: string;
};

export default function InteractionTypePill({ type, label }: InteractionTypePillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${interactionTypeTint(type)}`}
    >
      {label ?? interactionTypeLabel(type)}
    </span>
  );
}
