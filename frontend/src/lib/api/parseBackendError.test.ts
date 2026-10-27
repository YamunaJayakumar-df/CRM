// Tests for reading the backend's error bodies.
import { describe, expect, it } from "vitest";
import { FALLBACK_ERROR_MESSAGE, parseBackendError } from "./parseBackendError";

describe("parseBackendError", () => {
  it("keeps the error and the details from a normal 400 body", () => {
    expect(
      parseBackendError({
        error: "Invalid request",
        details: ["companyName is required", "email must be a valid email address"],
      }),
    ).toEqual({
      error: "Invalid request",
      details: ["companyName is required", "email must be a valid email address"],
    });
  });

  it("gives empty details for a 404 body", () => {
    expect(parseBackendError({ error: "Customer not found" })).toEqual({
      error: "Customer not found",
      details: [],
    });
  });

  it("uses the fallback message for bodies that are not objects", () => {
    for (const body of [null, undefined, "oops", 42, ["a"]]) {
      expect(parseBackendError(body)).toEqual({ error: FALLBACK_ERROR_MESSAGE, details: [] });
    }
  });

  it("uses the fallback when error is missing, blank or not text", () => {
    expect(parseBackendError({}).error).toBe(FALLBACK_ERROR_MESSAGE);
    expect(parseBackendError({ error: "  " }).error).toBe(FALLBACK_ERROR_MESSAGE);
    expect(parseBackendError({ error: { nested: true } }).error).toBe(FALLBACK_ERROR_MESSAGE);
  });

  it("keeps only non-blank text details and ignores other fields", () => {
    const result = parseBackendError({
      error: "Invalid request",
      details: ["phone must be at most 50 characters", 7, null, "  ", { x: 1 }],
      stack: "secret stack trace",
    });
    expect(result).toEqual({
      error: "Invalid request",
      details: ["phone must be at most 50 characters"],
    });
  });

  it("ignores details that are not a list", () => {
    expect(parseBackendError({ error: "Invalid request", details: "email bad" }).details).toEqual([]);
  });

  it("limits how many details and how long each one can be", () => {
    const many = Array.from({ length: 80 }, (_, index) => `field${index} is wrong`);
    expect(parseBackendError({ error: "x", details: many }).details).toHaveLength(50);

    const long = "a".repeat(2000);
    const shortened = parseBackendError({ error: long }).error;
    expect(shortened.length).toBe(501);
    expect(shortened.endsWith("…")).toBe(true);
  });
});
