// Helpers for showing and linking a customer's website.
//
// Why: the website field is free text typed by people ("acme.com",
// "https://www.acme.com/", or even "javascript:alert(1)"). Putting such text
// straight into <a href> could run code in the browser. toSafeWebsiteUrl only
// ever returns real http/https links; anything else gives null (show no link).

/**
 * Turn stored website text into a safe link address, or null.
 * - trims spaces; blank or null -> null
 * - no scheme ("acme.com") -> "https://" is added
 * - only http: and https: links are returned; anything else -> null
 * - links with a user name or password inside ("https://a@b.com") -> null
 * Example: "acme.com" -> "https://acme.com/"
 */
export function toSafeWebsiteUrl(website: string | null): string | null {
  const trimmed = (website ?? "").trim();
  if (trimmed === "") {
    return null;
  }

  // "Has a scheme" = starts with a name followed by "://", e.g. "http://".
  // Text like "javascript:alert(1)" has no "://", gets "https://" added and
  // then fails to parse, so it still ends up as null.
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  const withScheme = hasScheme ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }
  // Reject "https://user:pass@site" - links like "https://bank.com@evil.com"
  // look like one site but open another.
  if (url.username !== "" || url.password !== "") {
    return null;
  }
  return url.href;
}

/**
 * Short, readable form of a website for display (not for links).
 * Removes "https://", "http://", "www." and trailing "/".
 * null or blank -> "" (the caller decides what to show instead).
 * Example: "https://www.acme.com/" -> "acme.com"
 */
export function displayWebsite(website: string | null): string {
  return (website ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}
