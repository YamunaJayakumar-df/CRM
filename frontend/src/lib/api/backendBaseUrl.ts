// Works out the backend's base address from the BACKEND_URL setting.
//
// Why a separate, pure function: the rules (default value, trimming, only
// http/https, no trailing "/") are easy to get wrong and easy to test when
// they don't read process.env themselves. backendFetch.ts passes the value in.

/** Used when BACKEND_URL is not set: the Express app on this machine. */
export const DEFAULT_BACKEND_URL = "http://127.0.0.1:4000";

/**
 * Turn the raw BACKEND_URL value into a clean base URL like "http://127.0.0.1:4000".
 * - not set or blank -> DEFAULT_BACKEND_URL
 * - trailing "/" removed, so "base + /customers" never gives "//customers"
 * Throws an Error if the value is not a valid http:// or https:// URL
 * (the value itself is not put in the message, in case it holds a password).
 */
export function resolveBackendBaseUrl(rawValue: string | undefined): string {
  const trimmed = (rawValue ?? "").trim();
  if (trimmed === "") {
    return DEFAULT_BACKEND_URL;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("BACKEND_URL is not a valid URL (example: http://127.0.0.1:4000)");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("BACKEND_URL must start with http:// or https://");
  }

  return trimmed.replace(/\/+$/, "");
}
