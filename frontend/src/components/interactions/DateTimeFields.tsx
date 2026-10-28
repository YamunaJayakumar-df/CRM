// DateTimeFields: "Date" and "Time" side by side, for when an interaction
// happened (India time).
//
// One <fieldset> groups the pair under the legend "Date and time", so
// screen readers hear "Date and time, group" before "Date" and "Time".
// The hint and the error sit under BOTH inputs and both inputs point to
// them with aria-describedby.
// The browser's own date and time pickers are used (<input type="date">
// sends "2026-10-26", <input type="time"> sends "16:00"); the Server Action
// joins them into the backend's ISO text with "+05:30".
import { describedBy, errorId, hintId } from "@/lib/forms/describedBy";
import { inputClasses } from "@/components/forms/fieldClasses";

type DateTimeFieldsProps = {
  /** Base id; the inputs get "<idPrefix>-date" and "<idPrefix>-time". */
  idPrefix: string;
  legend: string;
  defaultDate: string;
  defaultTime: string;
  hint: string;
  error?: string;
};

export default function DateTimeFields({
  idPrefix,
  legend,
  defaultDate,
  defaultTime,
  hint,
  error,
}: DateTimeFieldsProps) {
  const hasError = error !== undefined;
  const describedByIds = describedBy(idPrefix, { hasHint: true, hasError });
  const dateId = `${idPrefix}-date`;
  const timeId = `${idPrefix}-time`;

  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium text-ink">{legend}</legend>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={dateId} className="mb-1 block text-sm text-muted">
            Date
          </label>
          <input
            id={dateId}
            name="date"
            type="date"
            defaultValue={defaultDate}
            aria-invalid={hasError ? true : undefined}
            aria-describedby={describedByIds}
            className={inputClasses(hasError)}
          />
        </div>
        <div>
          <label htmlFor={timeId} className="mb-1 block text-sm text-muted">
            Time
          </label>
          <input
            id={timeId}
            name="time"
            type="time"
            defaultValue={defaultTime}
            aria-invalid={hasError ? true : undefined}
            aria-describedby={describedByIds}
            className={inputClasses(hasError)}
          />
        </div>
      </div>
      <p id={hintId(idPrefix)} className="mt-2 text-sm text-muted">
        {hint}
      </p>
      {hasError && (
        <p id={errorId(idPrefix)} className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
