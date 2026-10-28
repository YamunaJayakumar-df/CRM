// The error thrown when the backend answers a request with a non-2xx status.
//
// Why a named error class: callers can check `error.status` to react to one
// specific case (e.g. 404 -> show the "not found" page) instead of parsing
// the message text. The message only says which URL path failed and the
// status; the response body is NOT included, so backend details never leak
// into logs or error pages.

export class BackendRequestError extends Error {
  /** HTTP status the backend sent, e.g. 404 or 500. */
  readonly status: number;

  /**
   * @param pathname URL path without the query string, e.g. "/customers/12".
   *   (The query string is left out because it may contain search text.)
   * @param status HTTP status code from the backend.
   * @param method HTTP method of the request; GET unless a form saved something.
   */
  constructor(pathname: string, status: number, method = "GET") {
    super(`Backend request ${method} ${pathname} failed with status ${status}`);
    this.name = "BackendRequestError";
    this.status = status;
  }
}
