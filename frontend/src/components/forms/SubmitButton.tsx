// SubmitButton: the main "Save" button of a form.
//
// useFormStatus() tells the button whether ITS form is being sent right now.
// While it is, the button shows `pendingLabel` and is disabled, so a double
// click cannot save twice. It must sit INSIDE the <form> for this to work,
// and it needs "use client" because the hook runs in the browser.
//
// variant "danger" is the red button for actions that cannot be undone
// (e.g. "Yes, delete"). The words say what happens, not only the colour.
"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "danger";
};

const variantClasses = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover disabled:hover:bg-primary",
  danger: "bg-danger text-page hover:bg-high-ink disabled:hover:bg-danger",
};

export default function SubmitButton({
  label,
  pendingLabel = "Saving…",
  variant = "primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-base font-medium transition-colors duration-150 disabled:cursor-wait disabled:opacity-70 ${variantClasses[variant]}`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
