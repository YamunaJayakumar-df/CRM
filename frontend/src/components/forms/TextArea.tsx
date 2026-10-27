// TextArea: a labelled multi-line text box, e.g. for notes.
// Same rules as TextField (uncontrolled, label, hint, error links).
import { describedBy } from "@/lib/forms/describedBy";
import FieldFrame from "./FieldFrame";
import { textAreaClasses } from "./fieldClasses";

type TextAreaProps = {
  id: string;
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  error?: string;
  hint?: string;
  className?: string;
};

export default function TextArea({
  id,
  label,
  name,
  defaultValue = "",
  required = false,
  rows = 5,
  maxLength,
  placeholder,
  error,
  hint,
  className,
}: TextAreaProps) {
  const hasError = error !== undefined;

  return (
    <FieldFrame id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue}
        required={required}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={hasError ? true : undefined}
        aria-describedby={describedBy(id, { hasHint: hint !== undefined, hasError })}
        className={textAreaClasses(hasError)}
      />
    </FieldFrame>
  );
}
