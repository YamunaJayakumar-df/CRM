// Reads the JSON body of an EXPECTED backend error (400, 404, 409).
//
// Why a separate, pure function: the body comes from another program, so we
// never trust its shape. We only take the two things the UI needs:
//   - `error`: a short message string, e.g. "Customer not found"
//   - `details`: a list of message strings, e.g. ["email must be a valid email address"]
// Anything else in the body is ignored. Odd bodies (not an object, wrong
// types, missing fields) give a calm fallback message instead of a crash.

/** What the UI may show from a backend error response. */
export type BackendErrorBody = {
  error: string;
  details: string[];
};

/** Shown when the backend sent no usable `error` text. */
export const FALLBACK_ERROR_MESSAGE = "The request could not be completed";

// Safety limits, so a broken backend can never flood the page with text.
const MAX_DETAILS = 50;
const MAX_MESSAGE_LENGTH = 500;

/** Keep a message short enough to show on screen. */
function shorten(message: string): string {
  return message.length > MAX_MESSAGE_LENGTH ? `${message.slice(0, MAX_MESSAGE_LENGTH)}…` : message;
}

/**
 * Pick `error` and `details` out of a parsed JSON body.
 * @param body Whatever JSON.parse gave us (or null if the body was not JSON).
 * Example: { error: "Invalid request", details: ["companyName is required"] }
 *   -> { error: "Invalid request", details: ["companyName is required"] }
 */
export function parseBackendError(body: unknown): BackendErrorBody {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { error: FALLBACK_ERROR_MESSAGE, details: [] };
  }

  const record = body as Record<string, unknown>;

  const error =
    typeof record.error === "string" && record.error.trim() !== ""
      ? shorten(record.error.trim())
      : FALLBACK_ERROR_MESSAGE;

  const details = Array.isArray(record.details)
    ? record.details
        .filter((detail): detail is string => typeof detail === "string" && detail.trim() !== "")
        .slice(0, MAX_DETAILS)
        .map((detail) => shorten(detail.trim()))
    : [];

  return { error, details };
}
