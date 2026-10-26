// Small helpers that send error responses in ONE consistent JSON shape.
//
// Why: if every route wrote its own error JSON, the frontend would have to
// handle many different shapes. With these helpers every error looks like
// { error: "message" } (plus "details" for validation problems).
import type { Response } from "express";

/** 400: the request itself is wrong. `details` lists every problem found. */
export function sendBadRequest(res: Response, details: string[]): void {
  res.status(400).json({ error: "Invalid request", details });
}

/** 404: the thing asked for does not exist, e.g. sendNotFound(res, "Customer"). */
export function sendNotFound(res: Response, what: string): void {
  res.status(404).json({ error: `${what} not found` });
}

/**
 * 409: the request is valid, but the current data does not allow it,
 * e.g. deleting a customer that still has interactions.
 */
export function sendConflict(res: Response, message: string): void {
  res.status(409).json({ error: message });
}
