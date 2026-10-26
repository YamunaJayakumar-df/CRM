// The ONE place where the Next.js server talks to our Express backend.
//
// Why server-only: the browser never calls the backend directly. Server
// Components and Server Actions call these functions on the Next.js server,
// so the backend address (and, later, credentials) never reach the browser.
// `import "server-only"` makes the build fail if a Client Component ever
// imports this file. Next.js handles that import itself (no npm package needed).
//
// Caching (Next 16 with cacheComponents): a plain fetch() is NOT cached unless
// it runs inside a "use cache" function, so every request gets fresh CRM data.
// Rules for callers:
//   - never add "use cache" to code that calls these functions
//   - render components that await this data inside <Suspense> (or a page
//     with loading.tsx), otherwise Next reports a "blocking route" error.
import "server-only";
import { resolveBackendBaseUrl } from "./backendBaseUrl";
import { BackendRequestError } from "./backendRequestError";

// Give up on a backend request after this long, so a hung backend shows an
// error page instead of a page that loads forever.
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * GET a backend path and return the parsed JSON.
 * @param path Must start with "/", may include a query string, e.g. "/customers?q=acme".
 * @returns The JSON body, typed as T (the caller picks T from ./types).
 * @throws BackendRequestError when the backend answers with a non-2xx status.
 * @throws Error when the backend cannot be reached, times out, or sends invalid JSON.
 */
export async function backendGet<T>(path: string): Promise<T> {
  if (!path.startsWith("/")) {
    throw new Error(`Backend path must start with "/", got "${path}"`);
  }

  // Read on every call (not once at import) so the server's current setting is used.
  const baseUrl = resolveBackendBaseUrl(process.env.BACKEND_URL);
  // The path without "?..." is used in error messages: search text stays out of logs.
  const pathname = path.split("?")[0];

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Error(`Could not reach the backend for GET ${pathname}`, {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new BackendRequestError(pathname, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new Error(`Backend sent invalid JSON for GET ${pathname}`, {
      cause: error,
    });
  }
}
