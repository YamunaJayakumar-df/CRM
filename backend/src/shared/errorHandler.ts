// Last-resort error handlers, added at the END of app.ts.
//
// Why: when something throws inside a route (Express 5 catches async errors
// for us), Express jumps to these functions. Without them, Express would send
// an HTML error page that can include the stack trace, which leaks internal
// details to whoever called the API.
import type { NextFunction, Request, Response } from "express";

/** True when express.json() failed because the request body was not valid JSON. */
function isJsonParseError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    err.type === "entity.parse.failed"
  );
}

/** 400 for a malformed JSON body; passes every other error on to the next handler. */
export function handleInvalidJson(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isJsonParseError(err)) {
    next(err);
    return;
  }
  res.status(400).json({ error: "Request body is not valid JSON" });
}

/**
 * 500 for any unexpected error. The full error is logged on the server only;
 * the client gets a generic message so no internals are leaked.
 */
export function handleUnexpectedError(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  console.error("Unexpected error:", err);

  // If part of the response was already sent we cannot send JSON any more;
  // Express's built-in handler then closes the connection safely.
  if (res.headersSent) {
    next(err);
    return;
  }
  res.status(500).json({ error: "Something went wrong" });
}
