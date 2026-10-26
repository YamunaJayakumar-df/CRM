// Tests for reading the BACKEND_URL setting.
import { describe, expect, it } from "vitest";
import { DEFAULT_BACKEND_URL, resolveBackendBaseUrl } from "./backendBaseUrl";

describe("resolveBackendBaseUrl", () => {
  it("uses the default when the setting is missing or blank", () => {
    expect(resolveBackendBaseUrl(undefined)).toBe(DEFAULT_BACKEND_URL);
    expect(resolveBackendBaseUrl("")).toBe(DEFAULT_BACKEND_URL);
    expect(resolveBackendBaseUrl("   ")).toBe(DEFAULT_BACKEND_URL);
    expect(DEFAULT_BACKEND_URL).toBe("http://127.0.0.1:4000");
  });

  it("trims spaces and removes trailing slashes", () => {
    expect(resolveBackendBaseUrl(" http://localhost:4000/ ")).toBe("http://localhost:4000");
    expect(resolveBackendBaseUrl("https://api.example.com/crm//")).toBe(
      "https://api.example.com/crm",
    );
  });

  it("throws a clear error for values that are not URLs", () => {
    expect(() => resolveBackendBaseUrl("localhost 4000")).toThrow(
      "BACKEND_URL is not a valid URL",
    );
  });

  it("throws for schemes other than http and https", () => {
    expect(() => resolveBackendBaseUrl("ftp://127.0.0.1")).toThrow(
      "BACKEND_URL must start with http:// or https://",
    );
  });
});
