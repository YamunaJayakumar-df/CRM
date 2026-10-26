// Tests for the backend error type.
import { describe, expect, it } from "vitest";
import { BackendRequestError } from "./backendRequestError";

describe("BackendRequestError", () => {
  it("keeps the status and gives a clear message", () => {
    const error = new BackendRequestError("/customers/12", 404);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BackendRequestError);
    expect(error.name).toBe("BackendRequestError");
    expect(error.status).toBe(404);
    expect(error.message).toBe("Backend request GET /customers/12 failed with status 404");
  });
});
