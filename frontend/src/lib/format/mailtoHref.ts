// Turns a stored email address into a "mailto:" link for the Email button.
//
// Why encodeURIComponent: characters like "?" or "&" in the field would
// otherwise add a subject, extra recipients, etc. to the link. Encoding
// makes the whole text one address.

/**
 * "mailto:" link for an email address, or null if it is blank.
 * Example: " ana@acme.com " -> "mailto:ana%40acme.com"
 */
export function mailtoHref(email: string | null): string | null {
  const trimmed = (email ?? "").trim();
  if (trimmed === "") {
    return null;
  }
  return `mailto:${encodeURIComponent(trimmed)}`;
}
