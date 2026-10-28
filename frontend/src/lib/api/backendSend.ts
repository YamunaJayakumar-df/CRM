// Sends a change (create, update, delete) to our Express backend.
//
// The partner of backendFetch.ts (which only READS). Same rules:
//   - server-only: called from Server Actions, never from the browser, so the
//     backend address never reaches the browser
//   - same base URL (BACKEND_URL) and the same 10 second time limit
//   - error messages name only the method and the path (no query text and
//     no response body), so user data never ends up in logs
//
// Two kinds of failure, handled differently:
//   1. EXPECTED answers (400 bad input, 404 not found, 409 conflict) are
//      RETURNED as { ok: false, ... } so the form can show them to the user.
//   2. UNEXPECTED problems (backend offline, timeout, 5xx, a broken success
//      body) are THROWN. Next.js then shows app/error.tsx ("Try again").
import "server-only";
import { resolveBackendBaseUrl } from "./backendBaseUrl";
import { BackendRequestError } from "./backendRequestError";
import { parseBackendError } from "./parseBackendError";

// Same limit as backendFetch.ts.
const REQUEST_TIMEOUT_MS = 10_000;

/** Statuses a form knows how to show; every other non-2xx status is thrown. */
const EXPECTED_ERROR_STATUSES = [400, 404, 409];

/**
 * Optional settings for one request. Normal forms need none of them.
 * - timeoutMs: a longer limit for slow work (the AI assistant can take ~20 s)
 * - extraExpectedStatuses: more statuses to RETURN instead of throw, e.g. 502
 *   and 503 for the AI assistant, so the page can say "try again" calmly
 */
export type SendOptions = {
  timeoutMs?: number;
  extraExpectedStatuses?: number[];
};

/** The HTTP methods that change data. */
export type SendMethod = "POST" | "PATCH" | "DELETE";

/**
 * The result of backendSend:
 * - ok: the backend accepted it; `data` is the JSON it sent back (null for
 *   "204 No Content", e.g. after a delete)
 * - not ok: an expected error, with the backend's message and details list
 */
export type BackendSendResult<T> =
  | { ok: true; data: T | null }
  | { ok: false; status: number; error: string; details: string[] };

/**
 * Send JSON to a backend path with POST, PATCH or DELETE.
 * @param path Must start with "/", e.g. "/customers/12".
 * @param body Any JSON-able value; leave out for requests without a body.
 * @param options Optional longer time limit or extra expected statuses.
 * @throws Error when the backend cannot be reached, times out, answers with
 *   an unexpected status (BackendRequestError), or sends broken success JSON.
 */
export async function backendSend<T>(
  method: SendMethod,
  path: string,
  body?: unknown,
  options: SendOptions = {},
): Promise<BackendSendResult<T>> {
  if (!path.startsWith("/")) {
    throw new Error(`Backend path must start with "/", got "${path}"`);
  }

  const baseUrl = resolveBackendBaseUrl(process.env.BACKEND_URL);
  const pathname = path.split("?")[0];
  const hasBody = body !== undefined;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: hasBody
        ? { Accept: "application/json", "Content-Type": "application/json" }
        : { Accept: "application/json" },
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(options.timeoutMs ?? REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Error(`Could not reach the backend for ${method} ${pathname}`, {
      cause: error,
    });
  }

  if (response.ok) {
    return { ok: true, data: await readSuccessBody<T>(response, method, pathname) };
  }

  const expected = [...EXPECTED_ERROR_STATUSES, ...(options.extraExpectedStatuses ?? [])];
  if (expected.includes(response.status)) {
    // A broken error body is not worth an error page: parseBackendError
    // turns "not JSON" (null) into a calm fallback message.
    const errorBody = await response.json().catch(() => null);
    return { ok: false, status: response.status, ...parseBackendError(errorBody) };
  }

  throw new BackendRequestError(pathname, response.status, method);
}

/** The JSON of a 2xx answer, or null when there is no body (e.g. 204). */
async function readSuccessBody<T>(
  response: Response,
  method: SendMethod,
  pathname: string,
): Promise<T | null> {
  const text = await response.text();
  if (text === "") {
    return null;
  }
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`Backend sent invalid JSON for ${method} ${pathname}`, {
      cause: error,
    });
  }
}
