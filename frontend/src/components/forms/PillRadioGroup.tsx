// PillRadioGroup: a small fixed choice (e.g. Priority: Low / Medium / High)
// shown as a row of pill-shaped buttons.
//
// Same idea as InteractionTypeRadioGroup: under the look these are REAL
// radio inputs (hidden with sr-only, not removed), wrapped in their labels.
// So the browser gives us everything for free: Tab moves into the group,
// arrow keys change the choice, screen readers say "High, radio button,
// 3 of 3, selected", and the value is sent with the form.
// The chosen pill takes its option's colour AND shows a check mark, so the
// choice never depends on colour alone.
// `has-checked:` styles the label when the radio inside it is checked;
// `has-focus-visible:` draws the focus ring around the pill.
import { Check } from "lucide-react";
import { errorId } from "@/lib/forms/describedBy";

export type PillRadioOption = {
  value: string;
  label: string;
  /**
   * Classes for the chosen pill, written out in full so Tailwind can find
   * them, e.g. "has-checked:border-high-ink has-checked:bg-high-bg has-checked:text-high-ink".
   */
  checkedClasses: string;
};

type PillRadioGroupProps = {
  /** Used for the error text's id and each radio's id ("<idPrefix>-HIGH"). */
  idPrefix: string;
  name: string;
  legend: string;
  options: PillRadioOption[];
  /** The option chosen when the form appears ("" = none yet). */
  defaultValue: string;
  required?: boolean;
  error?: string;
  /** The grid columns, e.g. "grid-cols-3". */
  columnsClassName: string;
};

/** The id of one radio input, e.g. "follow-up-priority-HIGH". */
export function pillRadioId(idPrefix: string, value: string): string {
  return `${idPrefix}-${value}`;
}

export default function PillRadioGroup({
  idPrefix,
  name,
  legend,
  options,
  defaultValue,
  required = false,
  error,
  columnsClassName,
}: PillRadioGroupProps) {
  const hasError = error !== undefined;

  return (
    <fieldset
      aria-describedby={hasError ? errorId(idPrefix) : undefined}
      aria-invalid={hasError ? true : undefined}
    >
      <legend className="mb-2 block text-sm font-medium text-ink">
        {legend}
        {required && (
          <>
            <span className="ml-1 text-danger" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </legend>

      <div className={`grid gap-2 ${columnsClassName}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`group flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
              hasError ? "border-danger" : "border-line"
            } text-muted not-has-checked:hover:bg-hover ${option.checkedClasses}`}
          >
            <input
              type="radio"
              id={pillRadioId(idPrefix, option.value)}
              name={name}
              value={option.value}
              defaultChecked={defaultValue === option.value}
              required={required}
              className="sr-only"
            />
            <Check
              size={16}
              strokeWidth={2}
              aria-hidden="true"
              className="hidden group-has-checked:block"
            />
            {option.label}
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
