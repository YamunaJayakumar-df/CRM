// Builds the ids that link a form input to its hint and error text.
//
// Why: screen readers only read a hint or an error aloud together with the
// input when the input says `aria-describedby="<hint id> <error id>"`.
// Every form field (TextField, TextArea, Select) uses these same ids, so the
// rule lives in one place.

/** Id of the hint text under an input, e.g. "customer-website-hint". */
export function hintId(inputId: string): string {
  return `${inputId}-hint`;
}

/** Id of the error text under an input, e.g. "customer-email-error". */
export function errorId(inputId: string): string {
  return `${inputId}-error`;
}

/**
 * The aria-describedby value for an input: its hint id and/or error id,
 * separated by a space. undefined when there is neither (attribute left out).
 * Example: describedBy("customer-email", { hasHint: false, hasError: true })
 *   -> "customer-email-error"
 */
export function describedBy(
  inputId: string,
  { hasHint, hasError }: { hasHint: boolean; hasError: boolean },
): string | undefined {
  const ids: string[] = [];
  if (hasHint) {
    ids.push(hintId(inputId));
  }
  if (hasError) {
    ids.push(errorId(inputId));
  }
  return ids.length === 0 ? undefined : ids.join(" ");
}
