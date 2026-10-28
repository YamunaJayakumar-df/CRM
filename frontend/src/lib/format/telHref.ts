// Turns a stored phone number into a "tel:" link for the Call button.
//
// Why: phone numbers are typed by people in many styles ("+91 98450-12345",
// "(080) 4123 4567"). A tel: link should hold only the digits (and a leading
// "+" for international numbers). Keeping only those characters also means
// odd text in the field can never turn into some other kind of link.

/**
 * "tel:" link for a phone number, or null if it has no digits.
 * Keeps a "+" only when it is the first character (after spaces).
 * Example: " +91 98450-12345 " -> "tel:+919845012345"
 *          "(080) 4123 4567"   -> "tel:08041234567"
 *          null, "", "n/a"     -> null
 */
export function telHref(phone: string | null): string | null {
  const trimmed = (phone ?? "").trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits === "") {
    return null;
  }
  const plus = trimmed.startsWith("+") ? "+" : "";
  return `tel:${plus}${digits}`;
}
