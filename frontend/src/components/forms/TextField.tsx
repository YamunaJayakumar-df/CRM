// TextField: a labelled one-line text box (text, email, phone, ...).
//
// Uncontrolled: the browser keeps what is typed; `defaultValue` is only the
// starting text. That is all a Server Action form needs, and it works even
// before JavaScript has loaded.
// With `error`, the box is marked aria-invalid and linked to the message.
import { describedBy } from "@/lib/forms/describedBy";
import FieldFrame from "./FieldFrame";
import { inputClasses } from "./fieldClasses";

type TextFieldProps = {
  id: string;
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: "text" | "email" | "tel" | "url";
  maxLength?: number;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  className?: string;
};

export default function TextField({
  id,
  label,
  name,
  defaultValue = "",
  required = false,
  type = "text",
  maxLength,
  autoComplete,
  placeholder,
  error,
  hint,
  className,
}: TextFieldProps) {
  const hasError = error !== undefined;

  return (
    <FieldFrame id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={hasError ? true : undefined}
        aria-describedby={describedBy(id, { hasHint: hint !== undefined, hasError })}
        className={inputClasses(hasError)}
      />
    </FieldFrame>
  );
}
