// FormActions: the buttons at the bottom of a form: Cancel and Save.
//
// Cancel is a plain link (it just leaves the page, nothing is saved).
// On phones the buttons stack full width with Save on top; from the "sm"
// size up they sit on the right, Cancel first, Save last.
import Link from "next/link";
import SubmitButton from "./SubmitButton";

type FormActionsProps = {
  submitLabel: string;
  cancelHref: string;
};

export default function FormActions({ submitLabel, cancelHref }: FormActionsProps) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Link
        href={cancelHref}
        className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-base font-medium text-ink transition-colors duration-150 hover:bg-hover"
      >
        Cancel
      </Link>
      <SubmitButton label={submitLabel} />
    </div>
  );
}
