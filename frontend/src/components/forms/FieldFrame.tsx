// FieldFrame: the label, hint and error text around one form control.
//
// TextField, TextArea and Select all use it, so every field looks and
// behaves the same:
// - <label htmlFor> is tied to the control's id (clicking the label
//   focuses the control; screen readers read the label).
// - Required fields show a "*" for sighted users and "(required)" for
//   screen readers.
// - The hint and the error get the ids from lib/forms/describedBy, which the
//   control points to with aria-describedby.
import { errorId, hintId } from "@/lib/forms/describedBy";

type FieldFrameProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  /** Extra classes for the wrapper, e.g. "md:col-span-2" for a full-width field. */
  className?: string;
  children: React.ReactNode;
};

export default function FieldFrame({
  id,
  label,
  required = false,
  hint,
  error,
  className = "",
  children,
}: FieldFrameProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
        {label}
        {required && (
          <>
            <span className="ml-1 text-danger" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      {children}
      {hint && (
        <p id={hintId(id)} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId(id)} className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
