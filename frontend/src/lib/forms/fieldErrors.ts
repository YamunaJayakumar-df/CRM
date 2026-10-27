// Turns the backend's validation messages into per-field errors for a form.
//
// Why: the backend answers a bad save with a list like
//   ["email must be a valid email address", "Unknown field: id"]
// Each message starts with the field's code name. A form wants each message
// next to its own input, so this function sorts them:
//   - messages that start with a known field name -> fieldErrors[field]
//   - everything else                             -> formErrors (shown at the top)
// The code name is swapped for a friendly label, e.g.
//   "companyName is required" -> "Company name is required".

/** Field errors (one message per field) plus messages that belong to no field. */
export type SplitFieldErrors<Field extends string> = {
  fieldErrors: Partial<Record<Field, string>>;
  formErrors: string[];
};

/**
 * Sort backend messages into field errors and form errors.
 * @param details The backend's `details` list.
 * @param fieldLabels Every field the form has, with its friendly label,
 *   e.g. { companyName: "Company name", email: "Email" }.
 * If one field has several messages, the first one is kept (fix one thing at a time).
 */
export function splitFieldErrors<Field extends string>(
  details: string[],
  fieldLabels: Record<Field, string>,
): SplitFieldErrors<Field> {
  const fieldNames = Object.keys(fieldLabels) as Field[];
  const fieldErrors: Partial<Record<Field, string>> = {};
  const formErrors: string[] = [];

  for (const detail of details) {
    // The field name must be the WHOLE first word: "email must..." matches
    // "email", but "emailAddress must..." does not.
    const field = fieldNames.find((name) => detail.startsWith(`${name} `));

    if (field === undefined) {
      formErrors.push(detail);
      continue;
    }
    if (fieldErrors[field] === undefined) {
      fieldErrors[field] = `${fieldLabels[field]}${detail.slice(field.length)}`;
    }
  }

  return { fieldErrors, formErrors };
}
