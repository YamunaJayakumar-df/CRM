// SubmitButton: the main "Save" button of a form.
//
// useFormStatus() tells the button whether ITS form is being sent right now.
// While it is, the button says "Saving…" and is disabled, so a double click
// cannot save twice. It must sit INSIDE the <form> for this to work, and it
// needs "use client" because the hook runs in the browser.
"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
};

export default function SubmitButton({ label, pendingLabel = "Saving…" }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-base font-medium text-on-primary transition-colors duration-150 hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70 disabled:hover:bg-primary"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
