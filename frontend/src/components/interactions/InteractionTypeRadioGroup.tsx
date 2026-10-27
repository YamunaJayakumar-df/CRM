// InteractionTypeRadioGroup: the "Type" choice (Call / Email / Meeting /
// Note) as four pill-shaped buttons.
//
// Under the look these are REAL radio inputs (hidden with sr-only, not
// removed), wrapped in their labels. So the browser gives us everything for
// free: Tab moves into the group, arrow keys change the choice, screen
// readers say "Meeting, radio button, 3 of 4, selected", and the value is
// sent with the form.
// The chosen pill takes its type's colour (same tints as the Kanban columns)
// AND shows a check mark, so the choice never depends on colour alone.
// `has-checked:` styles the label when the radio inside it is checked;
// `has-focus-visible:` draws the focus ring around the pill.
import { Check } from "lucide-react";
import type { InteractionType } from "@/lib/api/types";
import { errorId } from "@/lib/forms/describedBy";
import { interactionTypeLabel } from "@/lib/format/labels";
import { INTERACTION_TYPES } from "@/lib/interactions/interactionForm";

type InteractionTypeRadioGroupProps = {
  /** Used for the error text's id and the error summary link ("#<idPrefix>-CALL"). */
  idPrefix: string;
  name: string;
  legend: string;
  /** The type chosen when the form appears ("" = none yet). */
  defaultValue: string;
  error?: string;
};

// Written out in full so Tailwind can find the class names in this file.
const CHECKED_CLASSES: Record<InteractionType, string> = {
  CALL: "has-checked:border-avatar-blue-ink has-checked:bg-avatar-blue has-checked:text-avatar-blue-ink",
  EMAIL:
    "has-checked:border-avatar-violet-ink has-checked:bg-avatar-violet has-checked:text-avatar-violet-ink",
  MEETING:
    "has-checked:border-avatar-teal-ink has-checked:bg-avatar-teal has-checked:text-avatar-teal-ink",
  NOTE: "has-checked:border-medium-ink has-checked:bg-medium-bg has-checked:text-medium-ink",
};

/** The id of one radio input, e.g. "interaction-type-CALL". */
export function typeRadioId(idPrefix: string, type: InteractionType): string {
  return `${idPrefix}-${type}`;
}

export default function InteractionTypeRadioGroup({
  idPrefix,
  name,
  legend,
  defaultValue,
  error,
}: InteractionTypeRadioGroupProps) {
  const hasError = error !== undefined;

  return (
    <fieldset
      aria-describedby={hasError ? errorId(idPrefix) : undefined}
      aria-invalid={hasError ? true : undefined}
    >
      <legend className="mb-2 block text-sm font-medium text-ink">
        {legend}
        <span className="ml-1 text-danger" aria-hidden="true">
          *
        </span>
        <span className="sr-only"> (required)</span>
      </legend>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {INTERACTION_TYPES.map((type) => (
          <label
            key={type}
            className={`group flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
              hasError ? "border-danger" : "border-line"
            } text-muted not-has-checked:hover:bg-hover ${CHECKED_CLASSES[type]}`}
          >
            <input
              type="radio"
              id={typeRadioId(idPrefix, type)}
              name={name}
              value={type}
              defaultChecked={defaultValue === type}
              required
              className="sr-only"
            />
            <Check
              size={16}
              strokeWidth={2}
              aria-hidden="true"
              className="hidden group-has-checked:block"
            />
            {interactionTypeLabel(type)}
          </label>
        ))}
      </div>

      {hasError && (
        <p id={errorId(idPrefix)} className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
