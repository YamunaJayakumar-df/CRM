// Tests for website link safety and display.
import { describe, expect, it } from "vitest";
import { displayWebsite, toSafeWebsiteUrl } from "./safeWebsiteUrl";

describe("toSafeWebsiteUrl", () => {
  it("adds https:// when there is no scheme", () => {
    expect(toSafeWebsiteUrl("acme.com")).toBe("https://acme.com/");
    expect(toSafeWebsiteUrl("www.acme.com/about")).toBe("https://www.acme.com/about");
    expect(toSafeWebsiteUrl("acme.com:8080")).toBe("https://acme.com:8080/");
  });

  it("keeps http and https links", () => {
    expect(toSafeWebsiteUrl("http://acme.com")).toBe("http://acme.com/");
    expect(toSafeWebsiteUrl("HTTPS://Acme.com/Path")).toBe("https://acme.com/Path");
  });

  it("trims spaces", () => {
    expect(toSafeWebsiteUrl("  acme.com  ")).toBe("https://acme.com/");
  });

  it("returns null for null, empty and blank values", () => {
    expect(toSafeWebsiteUrl(null)).toBeNull();
    expect(toSafeWebsiteUrl("")).toBeNull();
    expect(toSafeWebsiteUrl("   ")).toBeNull();
  });

  it("rejects dangerous or non-web schemes", () => {
    expect(toSafeWebsiteUrl("javascript:alert(1)")).toBeNull();
    expect(toSafeWebsiteUrl("JavaScript://%0aalert(1)")).toBeNull();
    expect(toSafeWebsiteUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(toSafeWebsiteUrl("ftp://files.acme.com")).toBeNull();
    expect(toSafeWebsiteUrl("mailto:sales@acme.com")).toBeNull();
  });

  it("rejects links with a user name or password inside", () => {
    expect(toSafeWebsiteUrl("https://bank.com@evil.com")).toBeNull();
    expect(toSafeWebsiteUrl("user:pass@acme.com")).toBeNull();
  });

  it("returns null for text that is not a URL", () => {
    expect(toSafeWebsiteUrl("not a website")).toBeNull();
    expect(toSafeWebsiteUrl("https://")).toBeNull();
  });
});

describe("displayWebsite", () => {
  it("strips scheme, www. and trailing slash", () => {
    expect(displayWebsite("https://www.acme.com/")).toBe("acme.com");
    expect(displayWebsite("http://acme.com")).toBe("acme.com");
    expect(displayWebsite("www.acme.com")).toBe("acme.com");
    expect(displayWebsite("HTTPS://WWW.Acme.com//")).toBe("Acme.com");
  });

  it("keeps paths", () => {
    expect(displayWebsite("https://acme.com/india/")).toBe("acme.com/india");
  });

  it("leaves plain domains alone and trims spaces", () => {
    expect(displayWebsite("  acme.com ")).toBe("acme.com");
  });

  it("returns an empty string for null or blank", () => {
    expect(displayWebsite(null)).toBe("");
    expect(displayWebsite("   ")).toBe("");
  });
});
