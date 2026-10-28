// Small CONTROLLED form fields for the AI review cards.
//
// Why not TextField / Select from components/forms: those are uncontrolled
// (the browser keeps the text), which suits Server Action forms. The review
// starts with the AI's values and React must know every edit to build the
// save, so these take `value` + `onChange`. They reuse the same FieldFrame
// and classes, so they look exactly like the other forms.
"use client";

import FieldFrame from "@/components/forms/FieldFrame";
import { inputClasses, textAreaClasses } from "@/components/forms/fieldClasses";

type BaseProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  className?: string;
};

type ReviewInputProps = BaseProps & {
  type?: "text" | "email" | "tel" | "date";
  maxLength?: number;
};

export function ReviewInput({ id, label, value, onChange, required, hint, className, type = "text", maxLength }: ReviewInputProps) {
  return (
    <FieldFrame id={id} label={label} required={required} hint={hint} className={className}>
      <input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className={inputClasses(false)}
      />
    </FieldFrame>
  );
}

export function ReviewTextArea({ id, label, value, onChange, required, hint, className, rows = 2 }: BaseProps & { rows?: number }) {
  return (
    <FieldFrame id={id} label={label} required={required} hint={hint} className={className}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className={textAreaClasses(false)}
      />
    </FieldFrame>
  );
}

type ReviewSelectProps<Value extends string> = Omit<BaseProps, "value" | "onChange"> & {
  value: Value;
  onChange: (value: Value) => void;
  options: { value: Value; label: string }[];
};

export function ReviewSelect<Value extends string>({ id, label, value, onChange, options, hint, className }: ReviewSelectProps<Value>) {
  return (
    <FieldFrame id={id} label={label} hint={hint} className={className}>
      <select
        id={id}
        value={value}
        // The options come from our own list, so the value is always one of them.
        onChange={(event) => onChange(event.target.value as Value)}
        className={inputClasses(false)}
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
