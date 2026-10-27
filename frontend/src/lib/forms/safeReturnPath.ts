// Checks a "?returnTo=..." value before we send anyone there.
//
// Why: returnTo comes from the URL, so anyone can put anything in it. If we
// redirected to it blindly, a link like
//   /customers/5/edit?returnTo=https://evil.example
// would send our user to another website after saving (an "open redirect").
// We only accept paths INSIDE this app, like "/?customer=5" or "/customers".

// Used only to test where a path would lead; never contacted.
const TEST_ORIGIN = "http://crm.invalid";

// Longer than any real page link of ours; protects against silly input.
const MAX_LENGTH = 2000;

/**
 * Return the path if it is a safe link inside this app, otherwise null.
 * Safe means:
 * - a string that starts with "/" (not "//", which browsers read as another site)
 * - no backslashes ("/\evil.com" also means another site in browsers)
 * - no invisible control characters such as tabs or line breaks (browsers
 *   remove them, so "/\t/evil.com" would turn into "//evil.com")
 * - and, double-checked, it stays on the same site when resolved
 * Example: safeReturnPath("/customers?q=acme") -> "/customers?q=acme"
 *          safeReturnPath("//evil.com") -> null
 */
export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  if (value === "" || value.length > MAX_LENGTH) {
    return null;
  }
  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  if (value.includes("\\")) {
    return null;
  }
  if (/[\u0000-\u001f\u007f]/.test(value)) {
    return null;
  }

  try {
    if (new URL(value, TEST_ORIGIN).origin !== TEST_ORIGIN) {
      return null;
    }
  } catch {
    return null;
  }
  return value;
}
