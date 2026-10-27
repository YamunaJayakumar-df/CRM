// Select: a labelled drop-down with a fixed list of options.
// Same rules as TextField (uncontrolled, label, hint, error links).
//
// Note for callers: React does not update a drop-down's starting choice
// after it first appears. If `defaultValue` can change (e.g. after a failed
// save), give the Select a `key` that changes with it, so it starts again.
import { describedBy } from "@/lib/forms/describedBy";
import FieldFrame from "./FieldFrame";
import { inputClasses } from "./fieldClasses";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  id: string;
  label: string;
  name: string;
  options: SelectOption[];
  defaultValue?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
};

export default function Select({
  id,
  label,
  name,
  options,
  defaultValue,
  required = false,
  error,
  hint,
  className,
}: SelectProps) {
  const hasError = error !== undefined;

  return (
    <FieldFrame id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        required={required}
        aria-invalid={hasError ? true : undefined}
        aria-describedby={describedBy(id, { hasHint: hint !== undefined, hasError })}
        className={inputClasses(hasError)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}
